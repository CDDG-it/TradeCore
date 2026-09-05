"use client";

/**
 * Client-side helpers for the Global Markets page: a small polling fetch hook
 * over the standard DataEnvelope, plus number/label formatters shared by every
 * subtab. No data-fetching library — this mirrors the app's existing pattern of
 * fetch + setInterval, and each subtab only polls while it is mounted.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { DataEnvelope, DataFreshness } from "./types";

export function useGmi<T>(url: string | null, intervalMs = 60_000) {
  const [env, setEnv] = useState<DataEnvelope<T> | null>(null);
  const [loading, setLoading] = useState(true);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    if (!url) return;
    try {
      const res = await fetch(`${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}`, {
        cache: "no-store",
      });
      const json = (await res.json()) as DataEnvelope<T>;
      setEnv(json);
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
  }, [url]);

  useEffect(() => {
    if (!url) return;
    setLoading(true);
    void load();
    timer.current = setInterval(() => void load(), intervalMs);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [url, intervalMs, load]);

  return { env, loading, refresh: load };
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
