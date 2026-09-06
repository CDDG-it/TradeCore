"use client";

import { useMemo } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { tradeR, formatTotalR, instrumentName, winRateOf, tradesWinRate } from "@/lib/journal/weeks";
import type { TradeJournalEntry } from "@/lib/types";

const TURQUOISE = "var(--primary)";

/** One tight stat cell. */
function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-lg border border-border/50 bg-muted/20 px-2 py-1.5">
      <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground leading-none">{label}</p>
      <p className={cn("mt-1 text-base font-black tabular-nums leading-none", tone)}>{value}</p>
    </div>
  );
}

/** A labelled proportion bar, used for the breakdown rows. */
function Bar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="w-14 shrink-0 truncate text-[10px] text-muted-foreground">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted/40">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="w-7 shrink-0 text-right text-[10px] font-bold tabular-nums text-foreground/70">{value}</span>
    </div>
  );
}

/** Cumulative-R sparkline across the month, with a zero baseline. */
function RCurve({ trades }: { trades: TradeJournalEntry[] }) {
  const pts = useMemo(() => {
    const sorted = [...trades].sort((a, b) => a.date_time.localeCompare(b.date_time));
    const out: number[] = [];
    let run = 0;
    for (const t of sorted) {
      run += tradeR(t);
      out.push(run);
    }
    return out;
  }, [trades]);

  const W = 240, H = 48;
  if (pts.length < 2) {
    return (
      <div className="flex h-[48px] items-center justify-center text-[10px] text-muted-foreground/50">
        Not enough trades yet
      </div>
    );
  }
  const min = Math.min(0, ...pts);
  const max = Math.max(0, ...pts);
  const range = max - min || 1;
  const x = (i: number) => (i / (pts.length - 1)) * W;
  const y = (v: number) => H - ((v - min) / range) * H;
  const line = pts.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const area = `${line} L${W},${y(min)} L0,${y(min)} Z`;
  const end = pts[pts.length - 1];
  const color = end >= 0 ? "var(--color-success)" : "var(--color-destructive)";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="rcurve-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1={0} x2={W} y1={y(0)} y2={y(0)} stroke="var(--border)" strokeWidth={1} strokeDasharray="2 2" />
      <path d={area} fill="url(#rcurve-fill)" />
      <path d={line} fill="none" stroke={color} strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Compact analytics for the month currently on screen in the journal calendar.
 * Everything here is derived from the same trades the calendar is showing, so
 * the two halves of the page can never disagree. Sized to sit beside the grid
 * without scrolling.
 */
export function MonthAnalytics({ trades, monthLabel }: { trades: TradeJournalEntry[]; monthLabel: string }) {
  const wins = trades.filter((t) => t.result === "win");
  const losses = trades.filter((t) => t.result === "loss");
  const bes = trades.filter((t) => t.result === "break-even");
  const totalR = trades.reduce((s, t) => s + tradeR(t), 0);
  const winRate = winRateOf(wins.length, losses.length);
  const avgRR = wins.length ? (wins.reduce((s, t) => s + t.rr, 0) / wins.length).toFixed(1) : "—";
  const goodExec = trades.filter((t) => t.execution_quality === "good").length;
  const ratedExec = goodExec + trades.filter((t) => t.execution_quality === "bad").length;
  const execRate = ratedExec ? Math.round((goodExec / ratedExec) * 100) : null;

  // Long vs short — count, win rate and R for each side.
  const longs = trades.filter((t) => t.direction === "long");
  const shorts = trades.filter((t) => t.direction === "short");
  const sideWinRate = (list: TradeJournalEntry[]) => tradesWinRate(list) ?? 0;
  const longWinRate = sideWinRate(longs);
  const shortWinRate = sideWinRate(shorts);
  const longR = longs.reduce((s, t) => s + tradeR(t), 0);
  const shortR = shorts.reduce((s, t) => s + tradeR(t), 0);

  // Top instruments by trade count.
  const byInstrument = useMemo(() => {
    const map = new Map<string, number>();
    trades.forEach((t) => {
      const k = instrumentName(t.instrument);
      map.set(k, (map.get(k) ?? 0) + 1);
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  }, [trades]);

  if (trades.length === 0) {
    return (
      <div className="flex h-full flex-col rounded-2xl border border-border/50 bg-card p-4">
        <p className="text-sm font-semibold">{monthLabel}</p>
        <div className="flex flex-1 items-center justify-center">
          <p className="text-center text-xs text-muted-foreground/70">No trades logged this month.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-2.5 rounded-2xl border border-border/50 bg-card p-3.5">
      {/* Header */}
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-semibold leading-none">{monthLabel}</p>
        <Link href="/analytics" className="text-[10px] font-semibold text-primary hover:underline">
          Full analytics →
        </Link>
      </div>

      {/* Hero: net R */}
      <div className="rounded-xl border border-border/50 bg-muted/20 px-3 py-2.5">
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground leading-none">Net R</p>
            <p
              className="mt-1 text-2xl font-black tabular-nums leading-none"
              style={{ color: totalR > 0 ? "var(--color-success)" : totalR < 0 ? "var(--color-destructive)" : "var(--color-warning)" }}
            >
              {formatTotalR(totalR)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground leading-none">Win rate</p>
            <p className="mt-1 text-2xl font-black tabular-nums leading-none" style={{ color: TURQUOISE }}>
              {winRate == null ? "—" : `${winRate}%`}
            </p>
          </div>
        </div>
        <div className="mt-2">
          <RCurve trades={trades} />
        </div>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Trades" value={String(trades.length)} />
        <Stat label="Avg R:R" value={avgRR === "—" ? "—" : `${avgRR}R`} tone="text-primary" />
        <Stat label="Good exec" value={execRate == null ? "—" : `${execRate}%`} tone="text-success" />
      </div>

      {/* Result split */}
      <div className="space-y-1.5">
        <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Results</p>
        <Bar label="Wins" value={wins.length} total={trades.length} color="var(--color-success)" />
        <Bar label="Losses" value={losses.length} total={trades.length} color="var(--color-destructive)" />
        <Bar label="B/E" value={bes.length} total={trades.length} color="var(--color-warning)" />
      </div>

      {/* Instruments */}
      {byInstrument.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Most traded</p>
          {byInstrument.map(([name, count]) => (
            <Bar key={name} label={name} value={count} total={trades.length} color={TURQUOISE} />
          ))}
        </div>
      )}

      {/* Long vs short — how the month was actually traded */}
      <div className="mt-auto border-t border-border/40 pt-2.5">
        <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Direction</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-border/50 bg-muted/20 px-2 py-1.5">
            <div className="flex items-baseline justify-between gap-1">
              <span className="text-[10px] font-semibold text-muted-foreground">Long</span>
              <span className="text-base font-black tabular-nums leading-none text-success">{longs.length}</span>
            </div>
            <p className="mt-0.5 text-[9px] tabular-nums text-muted-foreground/70">
              {longs.length ? `${longWinRate}% win · ${formatTotalR(longR)}` : "—"}
            </p>
          </div>
          <div className="rounded-lg border border-border/50 bg-muted/20 px-2 py-1.5">
            <div className="flex items-baseline justify-between gap-1">
              <span className="text-[10px] font-semibold text-muted-foreground">Short</span>
              <span className="text-base font-black tabular-nums leading-none text-destructive">{shorts.length}</span>
            </div>
            <p className="mt-0.5 text-[9px] tabular-nums text-muted-foreground/70">
              {shorts.length ? `${shortWinRate}% win · ${formatTotalR(shortR)}` : "—"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
