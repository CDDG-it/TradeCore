"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { ArrowUpRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { BrainScore } from "@/components/mind-score/brain-score";
import { MindscoreTrend } from "@/components/mind-score/mindscore-trend";
import { computeMindScoreTrend } from "@/lib/mind-score/trend";
import {
  getTrades, getHabits, getHabitCompletions, getPsychEdgeSessions, getBestTradesOfDay, getWeeklyTradeReviews, getAnalyses,
  getCommitmentAdherenceLogs, getTradingGoals, getAllTradeRuleChecks, getPreMarketExercises,
} from "@/lib/supabase/queries";
import {
  bandColorFor, computeMindScoreAll,
  type MindPeriod, type MindInputs, type MindComponent,
} from "@/lib/mind-score/mind-score";
import { useAccess } from "@/components/access/access-provider";
import styles from "./mindscore-breakdown.module.css";

const PERIOD_LABEL: Record<MindPeriod, string> = { week: "Week", month: "Month", all: "All time" };
const PART_META: Record<MindComponent["key"], { name: string; detail: string }> = {
  rules: { name: "Rule adherence", detail: "The rules you follow at the screen" },
  execution: { name: "Execution", detail: "Trades taken to plan and edge" },
  habits: { name: "Daily habits", detail: "The routine behind your sessions" },
  objectives: { name: "Reflection work", detail: "Reviews, preparation and commitments" },
  goals: { name: "Goal progress", detail: "Your measurable goals, on pace" },
};

export function MindScoreBreakdown({ seed }: { seed?: MindInputs } = {}) {
  const { entitlements } = useAccess();
  const [data, setData] = useState<MindInputs | null>(seed ?? null);
  const [period, setPeriod] = useState<MindPeriod>("month");

  useEffect(() => {
    if (seed) return;
    Promise.all([
      getTrades(), getHabits(), getHabitCompletions(),
      getPsychEdgeSessions(), getBestTradesOfDay(), getWeeklyTradeReviews(), getAnalyses(),
      getCommitmentAdherenceLogs(), getTradingGoals(), getAllTradeRuleChecks(), getPreMarketExercises(),
    ]).then(([trades, habits, completions, psychSessions, bestTrades, weeklyReviews, analyses, adherenceLogs, goals, ruleChecks, preMarketExercises]) => {
      setData({ trades, habits, completions, psychSessions, bestTrades, weeklyReviews, analyses, adherenceLogs, goals, ruleChecks, preMarketExercises });
    }).catch(() => setData({ trades: [], habits: [], completions: [], psychSessions: [], bestTrades: [], weeklyReviews: [], analyses: [], adherenceLogs: [], goals: [], ruleChecks: [], preMarketExercises: [] }));
  }, [seed]);

  const scores = useMemo(() => (data ? computeMindScoreAll(data) : null), [data]);
  const score = scores?.[period] ?? null;
  const trend = useMemo(() => (data && score ? computeMindScoreTrend(data, period, score) : []), [data, period, score]);

  if (!score) return <div className="flex min-h-72 items-center justify-center rounded-[28px] border border-white/10 bg-[#111d30]" role="status" aria-label="Loading MC Mindscore"><Loader2 className="size-5 animate-spin text-[#6ad5c9]" /></div>;

  const current = score.pending ? null : score.total;
  const color = current === null ? "#6ad5c9" : bandColorFor(current);
  const limited = entitlements.mindscore === "score";

  return (
    <div className="space-y-4 pb-8 text-[#f8fafc] sm:space-y-5">
      <header className="rise-in flex flex-col gap-5 pb-2 lg:flex-row lg:items-end lg:justify-between" style={{ "--i": 0 } as CSSProperties}>
        <div className="max-w-2xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#6ad5c9]">Your process, measured</p>
          <h1 className="mt-2 font-heading text-[clamp(1.8rem,3.2vw,2.8rem)] font-semibold leading-[1.06] tracking-[-0.055em]">MC Mindscore</h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#a9bec8]">A clear reading of the work behind your trading, from rules and execution to the habits that keep you steady.</p>
        </div>
        <div className="inline-flex w-fit max-w-full items-center gap-1 rounded-full border border-white/10 bg-[#142338] p-1" role="group" aria-label="Mindscore period">
          {(["week", "month", "all"] as MindPeriod[]).map((option) => (
            <button key={option} type="button" onClick={() => setPeriod(option)} aria-pressed={period === option}
              className={cn("press rounded-full px-3.5 py-2 text-xs font-semibold transition-colors duration-150 sm:px-4", period === option ? "bg-[#14b8a6] text-[#071920]" : "text-[#a9bec8] hover:text-white")}
            >{PERIOD_LABEL[option]}</button>
          ))}
        </div>
      </header>

      <div className={cn("grid gap-4 sm:gap-5", limited ? "max-w-4xl" : "lg:grid-cols-[minmax(0,1.05fr)_minmax(0,.95fr)]")}>
        <section className={cn(styles.scorePanel, "rise-in relative min-h-[315px] overflow-hidden rounded-[28px] border border-white/10 p-5 sm:p-7")} style={{ "--i": 1 } as CSSProperties} aria-label="Current MC Mindscore">
          <div className={styles.scoreGlow} aria-hidden="true" />
          <div className="relative flex h-full flex-col">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#86c7c4]">Current reading</p><p className="mt-1 text-xs text-[#a9bec8]">{PERIOD_LABEL[period]} · Process score</p></div>
              <span className="rounded-full border border-[#6ad5c9]/25 bg-[#6ad5c9]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#8ce3d9]">0-100 scale</span>
            </div>
            <div className="flex flex-1 flex-col items-center justify-center gap-2 py-4 sm:flex-row sm:justify-start sm:gap-6">
              <div className="relative flex size-40 shrink-0 items-center justify-center sm:size-44 lg:size-32 xl:size-44">
                <div className="absolute inset-1 rounded-full border border-white/10" aria-hidden="true" />
                <div className="absolute inset-4 rounded-full border border-[#6ad5c9]/10" aria-hidden="true" />
                <BrainScore score={current} className="relative size-32 sm:size-36 lg:size-28 xl:size-36" />
              </div>
              <div className="min-w-0 text-center sm:text-left">
                <div className="flex items-end justify-center gap-2 sm:justify-start"><span className="font-heading text-[clamp(4.6rem,10vw,7rem)] font-semibold leading-[.85] tracking-[-0.085em] tabular-nums" style={{ color }}>{current ?? "-"}</span>{current !== null && <span className="pb-2 text-sm font-semibold text-[#86a5ae]">/ 100</span>}</div>
                <p className="mt-4 text-base font-semibold" style={{ color }}>{score.pending ? "A fresh period" : current === null ? "No data yet" : score.band.label}</p>
                <p className="mt-1 max-w-[360px] text-xs leading-relaxed text-[#a9bec8] sm:text-sm">{score.pending ? "Your score builds as you log trades, habits and reviews." : current === null ? "Start logging to see your process take shape." : score.band.description}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-white/10 pt-4 text-xs text-[#9cb5bd]">
              <span><strong className="mr-1.5 font-semibold tabular-nums text-white">{score.tradeCount}</strong>{score.tradeCount === 1 ? "trade" : "trades"} measured</span>
              <span><strong className="mr-1.5 font-semibold tabular-nums text-white">{score.habitCompleted}/{score.habitExpected}</strong>habits completed</span>
            </div>
          </div>
        </section>

        {!limited && <section className="rise-in flex min-h-[315px] flex-col rounded-[28px] border border-white/10 bg-[#111d30] p-5 sm:p-7" style={{ "--i": 2 } as CSSProperties} aria-label="MC Mindscore trend">
          <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6ad5c9]">The pattern</p><h2 className="mt-2 text-lg font-semibold tracking-[-0.035em]">Your score over time</h2></div><span className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-medium text-[#a9bec8]">{PERIOD_LABEL[period]}</span></div>
          <p className="mt-2 text-xs leading-relaxed text-[#8faab4]">See where your process holds and where it needs attention.</p>
          <div className="relative mt-auto pt-8"><MindscoreTrend points={trend} color={color} interactive />{!trend.some((point) => point.value !== null) && <p className="pointer-events-none absolute inset-x-0 top-1/2 text-center text-xs text-[#a9bec8]">Your trend appears when this period has activity.</p>}</div>
        </section>}
      </div>

      {limited ? <div className="rise-in flex max-w-4xl flex-col gap-4 rounded-[24px] border border-[#14b8a6]/20 bg-[#102b38] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6" style={{ "--i": 2 } as CSSProperties}>
        <div><h2 className="text-base font-semibold">Go deeper into your score</h2><p className="mt-1 text-sm text-[#a9bec8]">Plus unlocks the five-part breakdown, trends and next steps.</p></div>
        <Link href="/pricing" className="press inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#14b8a6] px-5 py-3 text-sm font-semibold text-[#071920]">Explore Plus <ArrowUpRight className="size-4" aria-hidden="true" /></Link>
      </div> : <div className="grid gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,.85fr)]">
        <section className="rise-in rounded-[28px] border border-white/10 bg-[#111d30] p-5 sm:p-7" style={{ "--i": 3 } as CSSProperties} aria-label="Mindscore breakdown">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6ad5c9]">The breakdown</p><h2 className="mt-2 text-lg font-semibold tracking-[-0.035em]">Five parts of your edge</h2></div><span className="text-xs text-[#8faab4]">Weighted by what applies</span></div>
          <div className="mt-5 divide-y divide-white/10">
            {score.components.map((part, index) => {
              const value = part.applicable && !score.pending ? part.value : null;
              return <div key={part.key} className="rise-in grid gap-3 py-3.5 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_minmax(0,.85fr)_auto] sm:items-center sm:gap-5" style={{ "--i": index + 4 } as CSSProperties}>
                <div className="min-w-0"><p className="text-sm font-semibold text-[#f4fafb]">{PART_META[part.key].name}</p><p className="mt-0.5 text-[11px] text-[#8faab4]">{PART_META[part.key].detail}</p></div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10" role="meter" aria-label={`${PART_META[part.key].name} score`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value ?? undefined} aria-valuetext={value === null ? "No reading" : `${value} percent`}><div className={styles.barFill} style={{ "--fill": (value ?? 0) / 100, backgroundColor: value === null ? "#4c6473" : color } as CSSProperties} /></div>
                <div className="flex items-baseline justify-between gap-2 sm:justify-end sm:text-right"><span className="text-[10px] text-[#7f9ba5] sm:hidden">{Math.round(part.effectiveWeight)}% of score</span><span className="min-w-10 text-sm font-bold tabular-nums" style={{ color: value === null ? "#9cb5bd" : color }}>{value === null ? "-" : `${value}%`}</span></div>
                <p className="hidden text-[10px] text-[#7f9ba5] sm:col-start-2 sm:mt-[-8px] sm:block">{Math.round(part.effectiveWeight)}% of score</p>
              </div>;
            })}
          </div>
          <p className="mt-5 border-t border-white/10 pt-4 text-xs leading-relaxed text-[#8faab4]">A missing input does not count against you. Its weight moves to the parts you can measure.</p>
        </section>

        <section className="rise-in flex flex-col rounded-[28px] border border-white/10 bg-[#111d30] p-5 sm:p-7" style={{ "--i": 4 } as CSSProperties} aria-label="Mindscore next steps">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6ad5c9]">Keep building</p><h2 className="mt-2 text-lg font-semibold tracking-[-0.035em]">Your next steps</h2><p className="mt-2 text-xs leading-relaxed text-[#8faab4]">Small, repeatable actions shape the reading over time.</p>
          <div className="mt-5 divide-y divide-white/10">
            {score.objectives.map((objective) => {
              const done = objective.due && objective.rate >= 1;
              const progress = Math.min(objective.progress, objective.target);
              return <Link key={objective.key} href={objective.href} className="group flex items-center justify-between gap-4 py-3.5 text-sm first:pt-0 last:pb-0">
                <span className="min-w-0 font-medium text-[#e5f1f3] transition-colors duration-150 group-hover:text-[#6ad5c9]">{objective.label}</span>
                <span className="flex shrink-0 items-center gap-2 text-xs tabular-nums"><span className={cn("font-semibold", done ? "text-[#4ade80]" : "text-[#9cb5bd]")}>{objective.due ? `${progress}/${objective.target}` : "Not due"}</span><ArrowUpRight className="size-3.5 text-[#6ad5c9]" aria-hidden="true" /></span>
              </Link>;
            })}
          </div>
          {score.objectives.length === 0 && <p className="mt-5 text-sm text-[#a9bec8]">Your next steps appear as you begin logging.</p>}
        </section>
      </div>}
    </div>
  );
}
