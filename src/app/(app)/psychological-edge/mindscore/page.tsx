"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getTrades, getHabits, getHabitCompletions, getPsychEdgeSessions, getBestTradesOfDay, getWeeklyTradeReviews,
} from "@/lib/supabase/queries";
import {
  computeMindScoreAll, MIND_BANDS, bandFor, type MindPeriod, type MindScore, type MindInputs,
} from "@/lib/mind-score/mind-score";

// Red → amber → yellow → turquoise → green. No orange, per the brand palette.
const BAND_COLORS = ["#ef4444", "#f59e0b", "#eab308", "#14B8A6", "#22c55e"];
const bandColor = (total: number | null) => {
  if (total == null) return "var(--muted-foreground)";
  const i = MIND_BANDS.findIndex((b) => total >= b.min && (total < b.max || b.max === 100));
  return BAND_COLORS[Math.max(0, i)];
};
const alpha = (c: string, pct: number) => `color-mix(in oklch, ${c} ${pct}%, transparent)`;

const PERIOD_LABEL: Record<MindPeriod, string> = { week: "This week", month: "This month", all: "All time" };

export default function MindScorePage() {
  const [data, setData] = useState<MindInputs | null>(null);
  const [period, setPeriod] = useState<MindPeriod>("month");

  useEffect(() => {
    Promise.all([
      getTrades(), getHabits(), getHabitCompletions(),
      getPsychEdgeSessions(), getBestTradesOfDay(), getWeeklyTradeReviews(),
    ]).then(([trades, habits, completions, psychSessions, bestTrades, weeklyReviews]) => {
      setData({ trades, habits, completions, psychSessions, bestTrades, weeklyReviews });
    }).catch(() => setData({ trades: [], habits: [], completions: [], psychSessions: [], bestTrades: [], weeklyReviews: [] }));
  }, []);

  const scores = useMemo(() => (data ? computeMindScoreAll(data) : null), [data]);
  const score = scores?.[period] ?? null;

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <Link href="/psychological-edge" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
          ← Psychological Edge
        </Link>
        <div className="mt-2">
          <p className="font-body text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-1.5">
            MC Mindset Formula
          </p>
          <h1 className="font-heading font-black text-2xl md:text-3xl text-foreground tracking-tight leading-[0.95]">
            MC Mindscore
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
            One number for how ready you are to trade your edge — built from your rule adherence, habit consistency
            and the process objectives you complete. Completing objectives raises the score.
          </p>
        </div>
      </div>

      {!scores || !score ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Period quick-stats */}
          <div className="grid grid-cols-3 gap-3">
            {(["week", "month", "all"] as MindPeriod[]).map((p) => {
              const s = scores[p];
              const c = bandColor(s.total);
              const active = period === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={cn(
                    "rounded-xl border p-4 text-left transition-colors relative overflow-hidden",
                    active ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/30 hover:bg-muted/30"
                  )}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{PERIOD_LABEL[p]}</p>
                  <p className="text-3xl font-black tabular-nums leading-none mt-2" style={{ color: c }}>
                    {s.total == null ? "—" : `${s.total}%`}
                  </p>
                  <p className="text-[11px] font-medium mt-1.5" style={{ color: c }}>{s.total == null ? "No data" : s.band.label}</p>
                </button>
              );
            })}
          </div>

          {/* Selected period: band scale + explanation */}
          <BandPanel score={score} />

          {/* Calculation */}
          <div className="grid gap-4 md:grid-cols-2 items-start">
            <ComponentBreakdown score={score} />
            <ObjectivesBreakdown score={score} />
          </div>

          {/* Band legend */}
          <BandLegend total={score.total} />
        </>
      )}
    </div>
  );
}

/* ── Band scale + current-state explanation ───────────────────────────── */
function BandPanel({ score }: { score: MindScore }) {
  const c = bandColor(score.total);
  const marker = score.total ?? 0;
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            {PERIOD_LABEL[score.period]}
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-6xl font-black tabular-nums leading-none" style={{ color: c }}>
              {score.total == null ? "—" : score.total}
            </span>
            <span className="text-lg font-bold text-muted-foreground/60">/ 100</span>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-bold" style={{ color: c }}>{score.band.label}</p>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{score.band.description}</p>
        </div>
      </div>

      {/* Band scale */}
      <div className="mt-5">
        <div className="relative">
          <div className="flex h-3 w-full overflow-hidden rounded-full">
            {MIND_BANDS.map((b, i) => (
              <div key={b.min} className="h-full flex-1" style={{ background: alpha(BAND_COLORS[i], 55) }} />
            ))}
          </div>
          {score.total != null && (
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2" style={{ left: `${marker}%` }}>
              <div className="w-4 h-4 rounded-full border-2 border-card" style={{ background: c, boxShadow: `0 0 0 1px ${c}, 0 0 8px ${alpha(c, 60)}` }} />
            </div>
          )}
        </div>
        <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground/60 tabular-nums">
          <span>0</span><span>20</span><span>40</span><span>60</span><span>80</span><span>100</span>
        </div>
      </div>
    </div>
  );
}

/* ── How the score is calculated ──────────────────────────────────────── */
function ComponentBreakdown({ score }: { score: MindScore }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
      <p className="text-sm font-semibold">How your score is built</p>
      <p className="text-xs text-muted-foreground -mt-1">
        A weighted average of the areas that apply this period. Weights rescale when an area has no data yet.
      </p>

      <div className="space-y-2.5 pt-1">
        {score.components.map((c) => {
          const applicable = c.applicable;
          return (
            <div key={c.key} className={cn("rounded-xl border p-3", applicable ? "border-border/70" : "border-dashed border-border/50 opacity-60")}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold">{c.label}</span>
                <span className="text-sm font-bold tabular-nums" style={{ color: c.key === "objectives" ? "#14B8A6" : undefined }}>
                  {c.value == null ? "—" : `${c.value}%`}
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-muted-foreground/12 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${c.value ?? 0}%`, background: "#14B8A6" }} />
              </div>
              <div className="flex items-center justify-between mt-1.5 text-[11px] text-muted-foreground tabular-nums">
                <span>
                  {applicable ? `weight ${Math.round(c.effectiveWeight)}%` : "no data this period"}
                </span>
                <span className="font-semibold text-foreground/70">
                  {applicable ? `+${c.contribution.toFixed(1)} pts` : "—"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between border-t border-border/60 pt-3">
        <span className="text-sm font-semibold">MC Mindscore</span>
        <span className="text-xl font-black tabular-nums" style={{ color: bandColor(score.total) }}>
          {score.total == null ? "—" : score.total}
        </span>
      </div>
    </div>
  );
}

/* ── Objectives — the process points that lift the score ──────────────── */
function ObjectivesBreakdown({ score }: { score: MindScore }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-semibold">Objectives</p>
        <span className="text-sm font-bold tabular-nums" style={{ color: "#14B8A6" }}>{Math.round(score.objectivesScore)}%</span>
      </div>
      <p className="text-xs text-muted-foreground -mt-1">
        Process work that compounds your edge. Each one you keep up lifts the objectives score above — and with it, your MC Mindscore.
      </p>

      <div className="space-y-2 pt-1">
        {score.objectives.map((o) => {
          const pct = Math.round(o.rate * 100);
          const full = o.rate >= 1;
          return (
            <Link key={o.key} href={o.href}
              className="block rounded-xl border border-border/70 p-3 transition-colors hover:border-primary/30 hover:bg-muted/30">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold">{o.label}</span>
                <span className={cn("text-[11px] font-bold tabular-nums", full ? "text-success" : "text-muted-foreground")}>
                  {Math.min(o.progress, o.target)}/{o.target}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">{o.description}</p>
              <div className="mt-2 h-1.5 w-full rounded-full bg-muted-foreground/12 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: full ? "#22c55e" : "#14B8A6" }} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/* ── What the percentages mean ────────────────────────────────────────── */
function BandLegend({ total }: { total: number | null }) {
  const current = bandFor(total);
  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
      <p className="text-sm font-semibold">What the score means</p>
      <div className="space-y-1.5">
        {MIND_BANDS.map((b, i) => {
          const active = total != null && b.label === current.label;
          return (
            <div key={b.min}
              className={cn("flex items-start gap-3 rounded-xl border p-3 transition-colors",
                active ? "border-primary/50 bg-primary/5" : "border-border/60")}>
              <div className="shrink-0 w-16 text-center">
                <span className="text-xs font-bold tabular-nums" style={{ color: BAND_COLORS[i] }}>{b.min}–{b.max}%</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold" style={{ color: BAND_COLORS[i] }}>
                  {b.label}{active && <span className="ml-2 text-[10px] font-semibold uppercase tracking-wider text-primary">You are here</span>}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{b.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
