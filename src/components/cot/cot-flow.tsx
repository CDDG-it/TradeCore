"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { ArrowUp, ArrowDown, Minus, RefreshCw, Loader2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CotInstrument, CotGroup, CotSnapshot } from "@/lib/cot/types";

const GROUP_LABEL: Record<CotGroup | "all", string> = {
  all: "All markets",
  index: "Indices",
  metal: "Metals",
  energy: "Energy",
};
const GROUPS: (CotGroup | "all")[] = ["all", "index", "metal", "energy"];

/** Compact contract count — 70328 → "70.3k". */
function compact(n: number): string {
  const a = Math.abs(n);
  const s = n < 0 ? "-" : "";
  if (a >= 1000) return `${s}${(a / 1000).toFixed(1)}k`;
  return `${s}${a}`;
}
function signed(n: number): string {
  return `${n > 0 ? "+" : n < 0 ? "−" : ""}${compact(Math.abs(n))}`;
}

/**
 * COT Flow — where the big money is positioned. Reads the CFTC weekly
 * Commitment of Traders report (live, via /api/cot) and shows, per futures
 * market, how large speculators are leaning, how that shifted this week, and
 * where positioning sits in its 1-year range.
 */
export function CotFlow() {
  const [snapshot, setSnapshot] = useState<CotSnapshot | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [stale, setStale] = useState(false);
  const [group, setGroup] = useState<CotGroup | "all">("all");
  const [refreshing, setRefreshing] = useState(false);

  async function load(manual = false) {
    if (manual) setRefreshing(true);
    try {
      const res = await fetch("/api/cot", { cache: "no-store" });
      const data = await res.json();
      if (data?.snapshot?.instruments?.length) {
        setSnapshot(data.snapshot);
        setStale(Boolean(data.stale));
        setStatus("ready");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const instruments = useMemo(() => {
    const list = snapshot?.instruments ?? [];
    return group === "all" ? list : list.filter((i) => i.group === group);
  }, [snapshot, group]);

  const longCount = instruments.filter((i) => i.bias === "long").length;
  const shortCount = instruments.filter((i) => i.bias === "short").length;

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading CFTC positioning…</p>
      </div>
    );
  }

  if (status === "error" || !snapshot) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
        <AlertTriangle className="w-6 h-6 text-warning" />
        <p className="text-sm text-muted-foreground max-w-sm">
          The CFTC feed is unreachable right now. COT data updates weekly — try again in a moment.
        </p>
        <button
          onClick={() => load(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted/40"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header — freshness + refresh */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2 w-2">
            <span className={cn("absolute inline-flex h-full w-full rounded-full opacity-60", stale ? "bg-warning" : "bg-success animate-ping")} />
            <span className={cn("relative inline-flex h-2 w-2 rounded-full", stale ? "bg-warning" : "bg-success")} />
          </span>
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">CFTC Commitment of Traders</span>
            {" · "}Report week of {format(new Date(snapshot.reportDate + "T12:00:00"), "MMM d, yyyy")}
            {stale && <span className="text-warning"> · cached</span>}
          </p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/40 disabled:opacity-60"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin")} /> Refresh
        </button>
      </div>

      {/* Controls + summary */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-lg border border-border/60 overflow-hidden">
          {GROUPS.map((g) => (
            <button
              key={g}
              onClick={() => setGroup(g)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium transition-colors",
                group === g ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {GROUP_LABEL[g]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1.5 font-semibold text-success">
            <ArrowUp className="w-3.5 h-3.5" /> {longCount} net long
          </span>
          <span className="inline-flex items-center gap-1.5 font-semibold text-destructive">
            <ArrowDown className="w-3.5 h-3.5" /> {shortCount} net short
          </span>
        </div>
      </div>

      {/* Cards */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {instruments.map((inst) => (
          <CotCard key={inst.symbol} inst={inst} />
        ))}
      </div>

      <p className="text-[11px] leading-relaxed text-muted-foreground/70">
        Large speculators = non-commercial traders (funds, CTAs) — the directional money. Net position is
        their longs minus shorts in contracts. The COT index shows where this week&apos;s net position sits
        within its own past-year range (100 = most net-long in a year, 0 = most net-short). Data:
        CFTC Legacy Futures-Only report, published weekly.
      </p>
    </div>
  );
}

/* ── One market card ──────────────────────────────────────────────────── */
function CotCard({ inst }: { inst: CotInstrument }) {
  const netColor =
    inst.bias === "long" ? "var(--color-success)" : inst.bias === "short" ? "var(--color-destructive)" : "var(--color-warning)";
  const chgUp = inst.netSpecChg > 0;
  const chgFlat = inst.netSpecChg === 0;
  const biasLabel = inst.bias === "long" ? "Net long" : inst.bias === "short" ? "Net short" : "Neutral";

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4 transition-colors hover:border-primary/30">
      {/* Head */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-base font-black font-mono tracking-tight leading-none">{inst.symbol}</p>
          <p className="text-[11px] text-muted-foreground mt-1">{inst.label}</p>
        </div>
        <span
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
          style={{ background: `color-mix(in oklch, ${netColor} 14%, transparent)`, color: netColor }}
        >
          {inst.bias === "long" ? <ArrowUp className="w-3 h-3" /> : inst.bias === "short" ? <ArrowDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
          {biasLabel}
        </span>
      </div>

      {/* Headline net-spec position + WoW change */}
      <div className="mt-3 flex items-end justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Large specs net</p>
          <p className="text-2xl font-black tabular-nums leading-none mt-1" style={{ color: netColor }}>
            {signed(inst.latest.netSpec)}
          </p>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-bold tabular-nums",
            chgFlat ? "bg-muted/50 text-muted-foreground" : chgUp ? "bg-success/12 text-success" : "bg-destructive/12 text-destructive"
          )}
          title="Week-over-week change in net position"
        >
          {chgFlat ? <Minus className="w-3 h-3" /> : chgUp ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
          {signed(inst.netSpecChg)}
        </span>
      </div>

      {/* Long / short split of large specs */}
      <div className="mt-3">
        <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted/40">
          <div className="h-full bg-success" style={{ width: `${inst.specLongShare * 100}%` }} />
          <div className="h-full bg-destructive" style={{ width: `${(1 - inst.specLongShare) * 100}%` }} />
        </div>
        <div className="mt-1 flex justify-between text-[10px] font-medium text-muted-foreground">
          <span className="text-success">{Math.round(inst.specLongShare * 100)}% long</span>
          <span className="text-destructive">{Math.round((1 - inst.specLongShare) * 100)}% short</span>
        </div>
      </div>

      {/* COT index (1-yr positioning) */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          <span>1-yr positioning</span>
          <span className="tabular-nums text-foreground/70">{inst.cotIndex}/100</span>
        </div>
        <div className="relative mt-1.5 h-2 w-full rounded-full" style={{ background: "linear-gradient(90deg, color-mix(in oklch, var(--color-destructive) 45%, transparent), var(--muted), color-mix(in oklch, var(--color-success) 45%, transparent))" }}>
          <div
            className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card"
            style={{ left: `${inst.cotIndex}%`, background: netColor, boxShadow: `0 0 6px ${netColor}` }}
          />
        </div>
      </div>

      {/* Sparkline + OI */}
      <div className="mt-3 flex items-center gap-3">
        <Sparkline history={inst.history} color={netColor} />
        <div className="text-right shrink-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Open int.</p>
          <p className="text-xs font-bold tabular-nums">{compact(inst.latest.openInterest)}</p>
        </div>
      </div>
    </div>
  );
}

/* ── Net-position sparkline (1-year) with a zero baseline ──────────────── */
function Sparkline({ history, color }: { history: { date: string; netSpec: number }[]; color: string }) {
  const W = 132, H = 34;
  if (history.length < 2) return <div className="flex-1 h-[34px]" />;
  const vals = history.map((h) => h.netSpec);
  const min = Math.min(...vals, 0);
  const max = Math.max(...vals, 0);
  const range = max - min || 1;
  const x = (i: number) => (i / (history.length - 1)) * W;
  const y = (v: number) => H - ((v - min) / range) * H;
  const path = vals.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const zeroY = y(0);
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="flex-1 overflow-visible" preserveAspectRatio="none">
      <line x1={0} x2={W} y1={zeroY} y2={zeroY} stroke="var(--border)" strokeWidth={1} strokeDasharray="2 2" />
      <path d={path} fill="none" stroke={color} strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(history.length - 1)} cy={y(vals[vals.length - 1])} r={2.4} fill={color} />
    </svg>
  );
}
