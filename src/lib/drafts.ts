"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Lightweight draft persistence for long forms (log trade, edit trade, new
 * analysis). Unsaved input is auto-saved to localStorage while the user types
 * and restored when they come back, so an accidental "back" never loses work.
 *
 * Safety rules baked in here:
 *  - Drafts are only written once the form's initial data is `ready`, and only
 *    when `shouldPersist` considers the content meaningful (avoids saving an
 *    empty/pristine form).
 *  - On edit forms, `recordUpdatedAt` lets us discard a draft that is older than
 *    the saved record — so a stale draft never clobbers newer saved data.
 *  - `clear()` is called after a successful submit, so restored drafts can never
 *    resurrect and cause a duplicate entry.
 */

const PREFIX = "tradecore:draft:";

type Envelope<T> = { savedAt: number; data: T };

export function loadDraft<T>(key: string): Envelope<T> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const env = JSON.parse(raw) as Envelope<T>;
    if (!env || typeof env.savedAt !== "number") return null;
    return env;
  } catch {
    return null;
  }
}

export function writeDraft<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify({ savedAt: Date.now(), data }));
  } catch {
    /* storage full / unavailable — drafts are best-effort */
  }
}

export function clearDraft(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(PREFIX + key);
  } catch {
    /* ignore */
  }
}

export interface UseFormDraftOptions<T> {
  /** Stable storage key, e.g. "trade:new" or `trade:edit:${id}`. */
  key: string;
  /** Current form value (persisted on change). */
  value: T;
  /** Apply a restored draft back into the form. */
  apply: (data: T) => void;
  /** Start restoring/persisting only once initial data has loaded. */
  ready?: boolean;
  /** Only persist/restore drafts the predicate treats as meaningful. */
  shouldPersist?: (value: T) => boolean;
  /** Edit forms: drop drafts saved before the record was last updated. */
  recordUpdatedAt?: string | number | null;
  debounceMs?: number;
}

export interface UseFormDraftResult {
  /** True when a draft was restored this session (drive the banner from this). */
  restored: boolean;
  /** Clear the persisted draft and stop auto-saving (call after a save). */
  clear: () => void;
  /** Hide the "draft restored" banner without deleting the draft. */
  dismiss: () => void;
}

export function useFormDraft<T>({
  key,
  value,
  apply,
  ready = true,
  shouldPersist,
  recordUpdatedAt,
  debounceMs = 500,
}: UseFormDraftOptions<T>): UseFormDraftResult {
  const [restored, setRestored] = useState(false);
  const checkedRef = useRef(false);
  const clearedRef = useRef(false);

  // Keep the latest callbacks without re-triggering the restore effect.
  const applyRef = useRef(apply);
  applyRef.current = apply;
  const shouldPersistRef = useRef(shouldPersist);
  shouldPersistRef.current = shouldPersist;

  // ── Restore once, as soon as the form is ready ──
  useEffect(() => {
    if (!ready || checkedRef.current) return;
    checkedRef.current = true;

    const env = loadDraft<T>(key);
    if (!env) return;

    const stale =
      recordUpdatedAt != null && new Date(recordUpdatedAt).getTime() > env.savedAt;
    const meaningful = !shouldPersistRef.current || shouldPersistRef.current(env.data);

    if (stale || !meaningful) {
      clearDraft(key);
      return;
    }
    applyRef.current(env.data);
    setRestored(true);
  }, [ready, key, recordUpdatedAt]);

  // ── Auto-save while typing (debounced) ──
  useEffect(() => {
    if (!ready || !checkedRef.current || clearedRef.current) return;
    if (shouldPersistRef.current && !shouldPersistRef.current(value)) return;
    const id = setTimeout(() => {
      if (!clearedRef.current) writeDraft(key, value);
    }, debounceMs);
    return () => clearTimeout(id);
  }, [value, ready, key, debounceMs]);

  const clear = useCallback(() => {
    clearedRef.current = true;
    clearDraft(key);
    setRestored(false);
  }, [key]);

  const dismiss = useCallback(() => setRestored(false), []);

  return { restored, clear, dismiss };
}
