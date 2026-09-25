"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { BrainScore } from "@/components/mind-score/brain-score";
import { MindscoreTrend } from "@/components/mind-score/mindscore-trend";
import { computeMindScoreTrend } from "@/lib/mind-score/trend";
import {
  getTrades, getHabits, getHabitCompletions, getPsychEdgeSessions, getBestTradesOfDay, getWeeklyTradeReviews, getAnalyses,
  getCommitmentAdherenceLogs, getTradingGoals,
} from "@/lib/supabase/queries";
import {
  bandColorFor, computeMindScoreAll,
  type MindPeriod, type MindInputs, type MindComponent,
} from "@/lib/mind-score/mind-score";

const PERIOD_LABEL: Record<MindPeriod, string> = { week: "Week", month: "Month", all: "All time" };
const PART_META: Record<MindComponent["key"], string> = {
  rules: "Rule adherence", execution: "Execution", habits: "Daily habits",
  objectives: "Reflection work", goals: "Goal progress",
};

export function MindScoreBreakdown({ seed }: { seed?: MindInputs } = {}) {
  const [data, setData] = useState<MindInputs | null>(seed ?? null);
  const [period, setPeriod] = useState<MindPeriod>("month");

  useEffect(() => {
    if (seed) return;
    Promise.all([
      getTrades(), getHabits(), getHabitCompletions(),
      getPsychEdgeSessions(), getBestTradesOfDay(), getWeeklyTradeReviews(), getAnalyses(),
      getCommitmentAdherenceLogs(), getTradingGoals(),
    ]).then(([trades, habits, completions, psychSessions, bestTrades, weeklyReviews, analyses, adherenceLogs, goals]) => {
      setData({ trades, habits, completions, psychSessions, bestTrades, weeklyReviews, analyses, adherenceLogs, goals });
    }).catch(() => setData({ trades: [], habits: [], completions: [], psychSessions: [], bestTrades: [], weeklyReviews: [], analyses: [], adherenceLogs: [], goals: [] }));
  }, [seed]);

  const scores = useMemo(() => (data ? computeMindScoreAll(data) : null), [data]);
  const score = scores?.[period] ?? null;
  const trend = useMemo(() => (data && score ? computeMindScoreTrend(data, period, score) : []), [data, period, score]);

  if (!score) return <div className="flex h-56 items-center justify-center"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>;

  const current = score.pending ? null : score.total;
  const color = current === null ? "var(--primary)" : bandColorFor(current);

  return (
    <div className="grid gap-3 lg:h-[calc(100dvh-14rem)] lg:min-h-[500px] lg:grid-cols-[minmax(0,1.12fr)_minmax(0,.88fr)]">
      <section className="relative flex min-h-0 flex-col overflow-hidden rounded-2xl border border-border/60 bg-card p-4 shadow-[0_8px_30px_-18px_rgba(0,0,0,.5)] sm:p-5" aria-label="MC Mindscore trend">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">MC Mindscore</p>
          <div className="flex items-center gap-1 rounded-full border border-border/70 bg-muted/25 p-1" role="group" aria-label="Mindscore period">
            {(["week", "month", "all"] as MindPeriod[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setPeriod(option)}
                aria-pressed={period === option}
                className={cn("rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors", period === option ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
              >{PERIOD_LABEL[option]}</button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 border-b border-border/60 py-4 sm:gap-6">
          <BrainScore score={current} className="size-28 sm:size-32 lg:size-[clamp(120px,18vh,170px)]" />
          <div className="min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="font-heading text-[clamp(3.5rem,7vw,6rem)] font-black leading-none tracking-[-0.07em] tabular-nums" style={{ color }}>{current ?? "·"}</span>
              {current !== null && <span className="text-xs font-semibold text-muted-foreground">MC</span>}
            </div>
            <p className="mt-1 text-sm font-semibold" style={{ color }}>{score.pending ? "A fresh period" : current === null ? "No data yet" : score.band.label}</p>
            <p className="mt-1 max-w-[270px] text-xs leading-relaxed text-muted-foreground">
              {score.pending ? "Your score builds as you log trades, habits and reviews." : current === null ? "Start logging to see your process take shape." : score.band.description}
            </p>
          </div>
        </div>

        <div className="mt-auto min-h-0 pt-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-xs font-semibold text-foreground">Your score over time</p>
            <span className="text-[10px] font-medium text-muted-foreground">{PERIOD_LABEL[period]}</span>
          </div>
          <div className="relative">
            <MindscoreTrend points={trend} color={color} interactive />
            {!trend.some((point) => point.value !== null) && <p className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-xs text-muted-foreground">The curve appears when this period has activity.</p>}
          </div>
        </div>
      </section>

      <div className="grid min-h-0 gap-3 lg:grid-rows-[minmax(0,1.12fr)_minmax(0,.88fr)]">
        <section className="flex min-h-0 flex-col rounded-2xl border border-border/60 bg-card p-4" aria-label="Mindscore breakdown">
          <div className="flex items-baseline justify-between gap-3">
            <div><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">Breakdown</p><h2 className="mt-1 text-base font-semibold tracking-tight">What makes up your score</h2></div>
            <span className="text-[10px] text-muted-foreground">5 signals</span>
          </div>
          <div className="mt-2 flex-1 divide-y divide-border/60">
            {score.components.map((part) => {
              const value = part.applicable && !score.pending ? part.value : null;
              return <div key={part.key} className="py-1.5 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between gap-3 text-xs"><span className="truncate font-medium text-foreground/85">{PART_META[part.key]}</span><span className="shrink-0 font-bold tabular-nums" style={{ color: value === null ? "var(--muted-foreground)" : color }}>{value === null ? "—" : `${value}%`}</span></div>
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted-foreground/15"><div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${value ?? 0}%`, background: color }} /></div>
              </div>;
            })}
          </div>
          <p className="mt-2 text-[10px] leading-snug text-muted-foreground">Each part is weighted by the work you can measure in this period.</p>
        </section>

        <section className="flex min-h-0 flex-col rounded-2xl border border-border/60 bg-card p-4 sm:p-5" aria-label="Mindscore next steps">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ice">Next steps</p>
          <h2 className="mt-1 text-base font-semibold tracking-tight">What lifts your score</h2>
          <div className="mt-3 divide-y divide-border/60">
            {score.objectives.map((objective) => {
              const done = objective.rate >= 1;
              const progress = Math.min(objective.progress, objective.target);
              return <Link key={objective.key} href={objective.href} className="group flex items-center justify-between gap-3 py-2 text-xs transition-colors hover:text-primary first:pt-0 last:pb-0">
                <span className="min-w-0 truncate font-medium">{objective.label}</span>
                <span className={cn("shrink-0 font-bold tabular-nums", done ? "text-success" : "text-muted-foreground")}>{progress}/{objective.target}<span aria-hidden="true" className="ml-2 font-normal text-muted-foreground/50 group-hover:text-primary">↗</span></span>
              </Link>;
            })}
          </div>
          {score.objectives.length === 0 && <p className="mt-3 text-xs text-muted-foreground">Your next steps appear as you begin logging.</p>}
        </section>
      </div>
    </div>
  );
}
