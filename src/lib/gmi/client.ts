"use client";

/**
 * Client-side helpers for the Global Markets page: a small polling fetch hook
 * over the standard DataEnvelope, plus number/label formatters shared by every
 * subtab. No data-fetching library — this mirrors the app's existing pattern of
 * fetch + setInterval.
 *
 * Three things keep the desk cheap to run:
 *   • A module-level cache keyed by URL, so switching sections — or two panes
 *     asking for the same feed — reuses the payload instead of re-fetching it.
 *   • In-flight dedupe, so a mount that races an existing request joins it.
 *   • Polling that stops while the tab is hidden, and catches up on return.
 *
 * The request itself carries no cache-buster: the API routes now say how long
 * their answer is good for, and a unique URL per call would throw that away.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { DataEnvelope, DataFreshness } from "./types";

type Entry = { env: DataEnvelope<unknown>; at: number };

const store = new Map<string, Entry>();
const inflight = new Map<string, Promise<DataEnvelope<unknown>>>();

/** A cached envelope, if one was stored within `maxAgeMs`. */
function fresh<T>(url: string, maxAgeMs: number): DataEnvelope<T> | null {
  const hit = store.get(url);
  if (!hit || Date.now() - hit.at >= maxAgeMs) return null;
  return hit.env as DataEnvelope<T>;
}

function request<T>(url: string): Promise<DataEnvelope<T>> {
  const existing = inflight.get(url);
  if (existing) return existing as Promise<DataEnvelope<T>>;

  const run = (async () => {
    const res = await fetch(url);
    const json = (await res.json()) as DataEnvelope<unknown>;
    // Only a usable answer is worth remembering; an outage should not pin the
    // desk to an error envelope for the rest of the polling window.
    if (json.status !== "unavailable") store.set(url, { env: json, at: Date.now() });
    return json;
  })();

  inflight.set(url, run);
  void run.catch(() => {}).finally(() => inflight.delete(url));
  return run as Promise<DataEnvelope<T>>;
}

export function useGmi<T>(url: string | null, intervalMs = 60_000) {
  // Seeded from the cache so a section you have already opened paints from
  // memory. Safe against hydration: the store is empty on the first render of
  // a freshly loaded module, and every later mount is client-only.
  const [env, setEnv] = useState<DataEnvelope<T> | null>(() => (url ? fresh<T>(url, intervalMs) : null));
  const [loading, setLoading] = useState(() => !(url && fresh<T>(url, intervalMs)));
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(
    async (force = false) => {
      if (!url) return;
      const cached = force ? null : fresh<T>(url, intervalMs);
      if (cached) {
        setEnv(cached);
        setLoading(false);
        return;
      }
      try {
        setEnv(await request<T>(url));
      } catch {
        setEnv((prev) =>
          prev
            ? { ...prev, status: "stale" }
            : {
                data: null,
                source: "—",
                freshness: "delayed",
                asOf: null,
                fetchedAt: new Date().toISOString(),
                status: "unavailable",
                error: "network",
              }
        );
      } finally {
        setLoading(false);
      }
    },
    [url, intervalMs]
  );

  useEffect(() => {
    if (!url) return;
    void load();

    // A hidden tab has no reader; polling it burns battery and quota for a
    // screen nobody is looking at. Coming back re-checks straight away.
    const tick = () => {
      if (!document.hidden) void load();
    };
    timer.current = setInterval(tick, intervalMs);
    document.addEventListener("visibilitychange", tick);

    return () => {
      if (timer.current) clearInterval(timer.current);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [url, intervalMs, load]);

  return { env, loading, refresh: () => load(true) };
}

/* ── Formatters ─────────────────────────────────────────────────────────── */

export function fmtPrice(v: number | null | undefined, unit = ""): string {
  if (v == null || !Number.isFinite(v)) return "—";
  if (unit === "%") return `${v.toFixed(2)}%`;
  const abs = Math.abs(v);
  const digits = abs >= 1000 ? 0 : abs >= 100 ? 1 : abs >= 1 ? 2 : 4;
  return v.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function fmtChange(v: number | null | undefined, unit = ""): string {
  if (v == null || !Number.isFinite(v)) return "—";
  const sign = v > 0 ? "+" : "";
  if (unit === "%") return `${sign}${v.toFixed(2)}pp`;
  const abs = Math.abs(v);
  const digits = abs >= 100 ? 1 : abs >= 1 ? 2 : 4;
  return `${sign}${v.toFixed(digits)}`;
}

export function fmtPct(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return "—";
  return `${v > 0 ? "+" : ""}${v.toFixed(2)}%`;
}

export function fmtBp(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return "—";
  return `${v > 0 ? "+" : ""}${Math.round(v)} bp`;
}

/** "3m ago", "2h ago", "just now" — for asOf / fetchedAt stamps. */
export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "—";
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (s < 45) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export const FRESHNESS_LABEL: Record<DataFreshness, string> = {
  realtime: "REALTIME",
  delayed: "DELAYED",
  daily: "DAILY",
  weekly: "WEEKLY",
  monthly: "MONTHLY",
};

/**
 * Directional colour token — conventional finance green/red, never a signal.
 * "No move" is deliberately not the muted token: at 3.6:1 on the desk's ground
 * it reads as disabled rather than neutral.
 */
export function toneFor(v: number | null | undefined): string {
  if (v == null || v === 0 || !Number.isFinite(v)) return "color-mix(in oklch, var(--foreground) 65%, transparent)";
  return v > 0 ? "var(--success)" : "var(--destructive)";
}
