"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, Loader2 } from "lucide-react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { EASE_OUT, SPRING, rise } from "@/lib/motion";
import { CountUp } from "@/components/ui/count-up";
import { Segmented } from "@/components/ui/segmented";
import { GrowBar } from "@/components/ui/grow-bar";
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

const PERIOD_LABEL: Record<MindPeriod, string> = { week: "Week", month: "Month", all: "All time" };
const PART_META: Record<MindComponent["key"], string> = {
  rules: "Rule adherence", execution: "Execution", habits: "Daily habits",
  objectives: "Reflection work", goals: "Goal progress",
};
/** How strongly each signal's share of the score is drawn, in breakdown order. */
const SHADE = [1, 0.78, 0.6, 0.46, 0.34];

export function MindScoreBreakdown({ seed }: { seed?: MindInputs } = {}) {
  const { entitlements } = useAccess();
  const [data, setData] = useState<MindInputs | null>(seed ?? null);
  const [period, setPeriod] = useState<MindPeriod>("month");
  // The signal under the pointer, lit in both the breakdown and the share bar.
  const [focus, setFocus] = useState<MindComponent["key"] | null>(null);
  // The staggered entrance runs once; after it, a period switch answers at once.
  const [intro, setIntro] = useState(true);
  const stagger = (seconds: number) => (intro ? seconds : 0);

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

  if (!score) return <div className="flex h-56 items-center justify-center"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>;

  const current = score.pending ? null : score.total;
  const color = current === null ? "var(--primary)" : bandColorFor(current);

  if (entitlements.mindscore === "score") return <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-border/60 bg-card p-8 text-center"><div><BrainScore score={current} animateIn className="mx-auto size-40" /><p className="mt-4 font-heading text-xl font-bold" style={{ color }}>{score.pending ? "A fresh period" : score.band.label}</p><p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">Basic includes your MC Mindscore. Plus unlocks the full breakdown and trend.</p><Link href="/pricing" className="mt-4 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">See Plus</Link></div></div>;

  const bandLabel = score.pending ? "A fresh period" : current === null ? "No data yet" : score.band.label;
  const bandText = score.pending ? "Your score builds as you log trades, habits and reviews." : current === null ? "Start logging to see your process take shape." : score.band.description;

  // Each applicable signal's points, laid end to end: together they are the score.
  const shares = score.pending ? [] : score.components.reduce<{ key: MindComponent["key"]; start: number; points: number; shade: number }[]>((list, part, index) => {
    if (!part.applicable || part.contribution <= 0) return list;
    const start = list.length ? list[list.length - 1].start + list[list.length - 1].points : 0;
    return [...list, { key: part.key, start, points: part.contribution, shade: SHADE[index] ?? 0.34 }];
  }, []);
  const focused = focus ? score.components.find((part) => part.key === focus) ?? null : null;

  return (
    <MotionConfig reducedMotion="user">
    <div className="grid gap-3 lg:h-[calc(100dvh-14rem)] lg:min-h-[500px] lg:grid-cols-[minmax(0,1.12fr)_minmax(0,.88fr)]">
      <motion.section {...rise(0)} className="relative flex min-h-0 flex-col overflow-hidden rounded-2xl border border-border/60 bg-card p-4 shadow-[0_8px_30px_-18px_rgba(0,0,0,.5)] sm:p-5" aria-label="MC Mindscore trend">
        {/* The band's colour, softly behind the score; it follows the score as it changes. */}
        <div aria-hidden className="pointer-events-none absolute -left-24 -top-24 size-80 rounded-full opacity-[.13] blur-3xl transition-[background-color] duration-700" style={{ backgroundColor: color }} />

        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">MC Mindscore</p>
          <Segmented label="Mindscore period" value={period} onChange={setPeriod}
            options={(["week", "month", "all"] as MindPeriod[]).map((option) => ({ value: option, label: PERIOD_LABEL[option] }))} />
        </div>

        <div className="relative border-b border-border/60 py-4">
          <div className="flex items-center gap-4 sm:gap-6">
            <BrainScore score={current} animateIn className="size-28 sm:size-32 lg:size-[clamp(120px,18vh,170px)]" />
            <div className="min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="font-heading text-[clamp(3.5rem,7vw,6rem)] font-black leading-none tracking-[-0.07em] tabular-nums transition-colors duration-500" style={{ color }}>
                  {current === null ? "·" : <CountUp value={current} duration={0.9} changeDuration={0.45} />}
                </span>
                {current !== null && <span className="text-xs font-semibold text-muted-foreground">MC</span>}
              </div>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={bandLabel} initial={{ opacity: 0, transform: "translateY(4px)" }} animate={{ opacity: 1, transform: "translateY(0px)" }} exit={{ opacity: 0 }} transition={{ duration: 0.18, ease: EASE_OUT }}>
                  <p className="mt-1 text-sm font-semibold" style={{ color }}>{bandLabel}</p>
                  <p className="mt-1 max-w-[270px] text-xs leading-relaxed text-muted-foreground">{bandText}</p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* What each signal adds: the score, split into its parts. */}
          {shares.length > 0 && (
            <div className="mt-4">
              <div className="relative h-2 overflow-hidden rounded-full bg-muted-foreground/12" onPointerLeave={() => setFocus(null)}>
                {shares.map((share, index) => (
                  <motion.div
                    key={share.key}
                    className="absolute inset-0 origin-left cursor-default"
                    style={{ backgroundColor: color }}
                    onPointerEnter={() => setFocus(share.key)}
                    initial={{ transform: `translateX(${share.start}%) scaleX(0)`, opacity: share.shade }}
                    animate={{ transform: `translateX(${share.start}%) scaleX(${share.points / 100})`, opacity: focus === null ? share.shade : focus === share.key ? 1 : 0.18 }}
                    transition={{ transform: { duration: intro ? 0.7 : 0.45, delay: stagger(0.25 + index * 0.08), ease: EASE_OUT }, opacity: { duration: 0.15 } }}
                  />
                ))}
              </div>
              <p className="mt-2 h-4 truncate text-[11px] text-muted-foreground" aria-live="polite">
                {focused && focused.applicable
                  ? <><span className="font-semibold text-foreground">{PART_META[focused.key]}</span> adds <span className="font-bold tabular-nums" style={{ color }}>{Math.round(focused.contribution)}</span> of your {current} points · weighs {Math.round(focused.effectiveWeight)}%</>
                  : "Point at a signal to see what it adds to your score."}
              </p>
            </div>
          )}
        </div>

        <div className="relative mt-auto min-h-0 pt-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-xs font-semibold text-foreground">Your score over time</p>
            <span className="text-[10px] font-medium text-muted-foreground">{PERIOD_LABEL[period]}</span>
          </div>
          <div className="relative">
            {/* Keyed by period, so each switch draws its own line in. */}
            <MindscoreTrend key={period} points={trend} color={color} interactive animateIn />
            {!trend.some((point) => point.value !== null) && <p className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-xs text-muted-foreground">The curve appears when this period has activity.</p>}
          </div>
        </div>
      </motion.section>

      <div className="grid min-h-0 gap-3 lg:grid-rows-[minmax(0,1.12fr)_minmax(0,.88fr)]">
        <motion.section {...rise(1)} className="flex min-h-0 flex-col rounded-2xl border border-border/60 bg-card p-4" aria-label="Mindscore breakdown">
          <div className="flex items-baseline justify-between gap-3">
            <div><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">Breakdown</p><h2 className="mt-1 text-base font-semibold tracking-tight">What makes up your score</h2></div>
            <span className="text-[10px] text-muted-foreground">5 signals</span>
          </div>
          <div className="mt-2 flex-1 divide-y divide-border/60" onPointerLeave={() => setFocus(null)}>
            {score.components.map((part, index) => {
              const value = part.applicable && !score.pending ? part.value : null;
              const lit = focus === part.key;
              const dim = focus !== null && !lit;
              return <div
                key={part.key}
                onPointerEnter={() => setFocus(value === null ? null : part.key)}
                className={cn("-mx-2 rounded-lg px-2 py-1.5 transition-[opacity,background-color] duration-150 first:pt-1 last:pb-1", lit && "bg-muted/35", dim && "opacity-55")}
              >
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="truncate font-medium text-foreground/85">{PART_META[part.key]}</span>
                  <span className="shrink-0 font-bold tabular-nums" style={{ color: value === null ? "var(--muted-foreground)" : color }}>{value === null ? "—" : <><CountUp value={value} duration={0.8} changeDuration={0.45} />%</>}</span>
                </div>
                <GrowBar className="mt-1.5" value={(value ?? 0) / 100} color={color} duration={intro ? 0.7 : 0.45} delay={stagger(0.2 + index * 0.06)} />
                {part.key === "execution" && value !== null && (
                  <p className="mt-1 text-[10px] tabular-nums text-muted-foreground">
                    {score.execution.good} good · {score.execution.bad} bad (counts double){score.execution.unrated > 0 && ` · ${score.execution.unrated} unrated (counts as neutral)`}
                  </p>
                )}
              </div>;
            })}
          </div>
          <p className="mt-2 text-[10px] leading-snug text-muted-foreground">Each part is weighted by the work you can measure in this period.</p>
        </motion.section>

        <motion.section {...rise(2)} onAnimationComplete={() => setTimeout(() => setIntro(false), 700)} className="flex min-h-0 flex-col rounded-2xl border border-border/60 bg-card p-4 sm:p-5" aria-label="Mindscore next steps">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ice">Next steps</p>
          <h2 className="mt-1 text-base font-semibold tracking-tight">What lifts your score</h2>
          <div className="mt-3 divide-y divide-border/60">
            {score.objectives.map((objective, index) => {
              const done = objective.due && objective.rate >= 1;
              const progress = Math.min(objective.progress, objective.target);
              const rate = objective.due && objective.target > 0 ? progress / objective.target : 0;
              return <Link key={objective.key} href={objective.href} className="group -mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-2 text-xs transition-[background-color,color] duration-150 hover:bg-primary/[.06] hover:text-primary first:pt-1.5 last:pb-1.5">
                <span className="flex min-w-0 items-center gap-2.5">
                  <ProgressRing rate={rate} done={done} due={objective.due} delay={stagger(0.3 + index * 0.06)} />
                  <span className="truncate font-medium">{objective.label}</span>
                </span>
                <span className={cn("shrink-0 font-bold tabular-nums", done ? "text-success" : "text-muted-foreground")}>
                  {objective.due ? `${progress}/${objective.target}` : <span className="font-medium">Not due yet</span>}
                  <span aria-hidden="true" className="ml-2 inline-block font-normal text-muted-foreground/50 transition-[transform,color] duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary">↗</span>
                </span>
              </Link>;
            })}
          </div>
          {score.objectives.length === 0 && <p className="mt-3 text-xs text-muted-foreground">Your next steps appear as you begin logging.</p>}
        </motion.section>
      </div>
    </div>
    </MotionConfig>
  );
}

/** How far an objective is: a ring that fills to its share, or a check once it is met. */
function ProgressRing({ rate, done, due, delay }: { rate: number; done: boolean; due: boolean; delay: number }) {
  const r = 7;
  return (
    <span className="relative flex size-[18px] shrink-0 items-center justify-center" aria-hidden="true">
      <svg viewBox="0 0 18 18" className="absolute inset-0 -rotate-90">
        <circle cx="9" cy="9" r={r} fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground/20" />
        {due && rate > 0 && <motion.circle cx="9" cy="9" r={r} fill="none" strokeWidth="2" strokeLinecap="round"
          className={done ? "text-success" : "text-ice"} stroke="currentColor"
          initial={{ pathLength: 0 }} animate={{ pathLength: Math.min(1, rate) }} transition={{ duration: 0.7, delay, ease: EASE_OUT }} />}
      </svg>
      {done && <motion.span initial={{ opacity: 0, transform: "scale(0.6)" }} animate={{ opacity: 1, transform: "scale(1)" }} transition={{ ...SPRING, delay: delay ? delay + 0.5 : 0 }}>
        <Check className="size-2.5 text-success" strokeWidth={3} />
      </motion.span>}
    </span>
  );
}
