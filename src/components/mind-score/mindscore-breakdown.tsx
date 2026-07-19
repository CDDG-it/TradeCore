"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getTrades, getHabits, getHabitCompletions, getPsychEdgeSessions, getBestTradesOfDay, getWeeklyTradeReviews, getAnalyses,
} from "@/lib/supabase/queries";
import {
  computeMindScoreAll, MIND_BANDS, BAND_COLORS, bandColorFor,
  type MindPeriod, type MindScore, type MindInputs,
} from "@/lib/mind-score/mind-score";

const alpha = (c: string, pct: number) => `color-mix(in oklch, ${c} ${pct}%, transparent)`;

const PERIOD_LABEL: Record<MindPeriod, string> = { week: "Week", month: "Month", all: "All time" };

/** The MC Mindscore breakdown — period scores, band scale, calculation and legend,
 *  laid out compactly to fit one screen. Self-loading so it drops into a route or tab. */
export function MindScoreBreakdown() {
  const [data, setData] = useState<MindInputs | null>(null);
  const [period, setPeriod] = useState<MindPeriod>("month");

  useEffect(() => {
    Promise.all([
      getTrades(), getHabits(), getHabitCompletions(),
      getPsychEdgeSessions(), getBestTradesOfDay(), getWeeklyTradeReviews(), getAnalyses(),
    ]).then(([trades, habits, completions, psychSessions, bestTrades, weeklyReviews, analyses]) => {
      setData({ trades, habits, completions, psychSessions, bestTrades, weeklyReviews, analyses });
    }).catch(() => setData({ trades: [], habits: [], completions: [], psychSessions: [], bestTrades: [], weeklyReviews: [], analyses: [] }));
  }, []);

  const scores = useMemo(() => (data ? computeMindScoreAll(data) : null), [data]);
  const score = scores?.[period] ?? null;

  if (!scores || !score) {
    return (
      <div className="flex items-center justify-center h-56">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Period switch — week / month / all-time at a glance, doubles as the selector */}
      <div className="grid grid-cols-3 gap-2.5">
        {(["week", "month", "all"] as MindPeriod[]).map((p) => {
          const s = scores[p];
          const c = bandColorFor(s.total);
          const active = period === p;
          return (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={cn(
                "rounded-xl border px-3 py-2.5 text-left transition-colors",
                active ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/30 hover:bg-muted/30"
              )}
            >
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{PERIOD_LABEL[p]}</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black tabular-nums leading-none" style={{ color: c }}>
                  {s.total == null ? "—" : s.total}
                </span>
                <span className="text-[11px] font-medium truncate" style={{ color: c }}>{s.total == null ? "" : s.band.label}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected period — band + scale, condensed */}
      <BandPanel score={score} />

      {/* Calculation + objectives side by side */}
      <div className="grid gap-3 md:grid-cols-2 items-start">
        <ComponentBreakdown score={score} />
        <ObjectivesBreakdown score={score} />
      </div>
    </div>
  );
}

/* ── Band scale + current-state explanation (condensed) ───────────────── */
function BandPanel({ score }: { score: MindScore }) {
  const c = bandColorFor(score.total);
  const marker = score.total ?? 0;
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-4">
        <span className="text-4xl font-black tabular-nums leading-none shrink-0" style={{ color: c }}>
          {score.total == null ? "—" : score.total}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold" style={{ color: c }}>{score.total == null ? "No data yet" : score.band.label}</p>
          <p className="text-xs text-muted-foreground leading-snug">{score.band.description}</p>
        </div>
      </div>

      {/* Band scale */}
      <div className="mt-3 relative">
        <div className="flex h-2.5 w-full overflow-hidden rounded-full">
          {MIND_BANDS.map((b, i) => (
            <div key={b.min} className="h-full flex-1" style={{ background: alpha(BAND_COLORS[i], 55) }} />
          ))}
        </div>
        {score.total != null && (
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2" style={{ left: `${marker}%` }}>
            <div className="w-3.5 h-3.5 rounded-full border-2 border-card" style={{ background: c, boxShadow: `0 0 0 1px ${c}, 0 0 8px ${alpha(c, 60)}` }} />
          </div>
        )}
      </div>

      {/* What each zone means — aligned under its slice of the scale */}
      <div className="mt-2 flex w-full gap-1">
        {MIND_BANDS.map((b, i) => {
          const active = score.total != null && score.total >= b.min && (score.total < b.max || b.max === 100);
          return (
            <div key={b.min} className="flex-1 min-w-0 text-center">
              <p className="text-[10px] font-bold leading-tight" style={{ color: active ? BAND_COLORS[i] : alpha(BAND_COLORS[i], 65) }}>
                {b.label}
              </p>
              <p className="text-[9px] tabular-nums text-muted-foreground/70">{b.min}–{b.max}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── How the score is calculated (condensed) ──────────────────────────── */
function ComponentBreakdown({ score }: { score: MindScore }) {
  const c = bandColorFor(score.total);
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-2.5">
      <p className="text-sm font-semibold">How your score is built</p>
      <div className="space-y-2">
        {score.components.map((comp) => {
          const applicable = comp.applicable;
          return (
            <div key={comp.key}>
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-medium">{comp.label}</span>
                <span className="tabular-nums text-muted-foreground">
                  {applicable ? (
                    <>weight {Math.round(comp.effectiveWeight)}% · <span className="font-semibold text-foreground/70">+{comp.contribution.toFixed(1)} pts</span></>
                  ) : "no data this period"}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <div className="h-1.5 flex-1 rounded-full bg-muted-foreground/12 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${comp.value ?? 0}%`, background: applicable ? c : "var(--muted-foreground)" }} />
                </div>
                <span className="text-xs font-bold tabular-nums w-9 text-right" style={{ color: applicable ? c : "var(--muted-foreground)" }}>
                  {comp.value == null ? "—" : `${comp.value}%`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between border-t border-border/60 pt-2">
        <span className="text-xs font-semibold">MC Mindscore</span>
        <span className="text-lg font-black tabular-nums" style={{ color: c }}>
          {score.total == null ? "—" : score.total}
        </span>
      </div>
    </div>
  );
}

/* ── Objectives — the process points that lift the score (condensed) ───── */
function ObjectivesBreakdown({ score }: { score: MindScore }) {
  const c = bandColorFor(score.total);
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-2.5">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-semibold">Objectives</p>
        <span className="text-xs font-bold tabular-nums" style={{ color: c }}>{Math.round(score.objectivesScore)}%</span>
      </div>
      <div className="space-y-2">
        {score.objectives.map((o) => {
          const pct = Math.round(o.rate * 100);
          const full = o.rate >= 1;
          return (
            <Link key={o.key} href={o.href}
              className="block rounded-lg border border-border/70 px-3 py-2 transition-colors hover:border-primary/30 hover:bg-muted/30">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold">{o.label}</span>
                <span className={cn("text-[11px] font-bold tabular-nums", full ? "text-success" : "text-muted-foreground")}>
                  {Math.min(o.progress, o.target)}/{o.target}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 w-full rounded-full bg-muted-foreground/12 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: full ? "#22c55e" : c }} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/* ── What the percentages mean (condensed inline rows) ────────────────── */
