/**
 * MC Mindscore: one number for how ready a trader is to trade their edge.
 *
 * It blends the things a trader controls into a single 0-100 score:
 *   • Rule adherence:    the per-trade discipline checklist (at the screen)
 *   • Execution:         the share of rated trades taken to plan and to edge
 *   • Habit consistency: daily/lifestyle habits (away from the charts)
 *   • Objectives:        weekly review, pre-trade analysis, best trade and commitments
 *   • Goals:             pace-adjusted progress against measurable active goals
 *
 * Every input is derived from data the trader already produces, so nothing is faked.
 * The score is computed over any window, so week / month / all-time all use one engine.
 */

import {
  startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfDay, endOfDay,
  eachDayOfInterval, min as dfMin, subDays,
} from "date-fns";
import { computeTradeRulesScore, computeHabitCounts, computeExecutionScore } from "@/lib/discipline";
import { computeGoalProgress } from "@/lib/goals/goals";
import { isReviewOpen } from "@/lib/journal/weeks";
import type {
  Habit, HabitCompletion, PsychEdgeSession, BestTradeOfDay, WeeklyTradeReview, PreTradeAnalysis,
  CommitmentAdherenceLog, TradingGoal, TradeSummary,
} from "@/lib/types";

export type MindPeriod = "week" | "month" | "all";

/**
 * Nominal weights (out of 100), rescaled among the components that apply.
 *
 * Rules and execution are both "at the screen" and together carry 55: the
 * checklist says whether you ticked your non-negotiables, execution says
 * whether the trade was actually the one your plan and your edge called for.
 * They overlap, so execution is deliberately the smaller of the two.
 */
export const MIND_WEIGHTS = { rules: 35, execution: 20, habits: 20, objectives: 15, goals: 10 } as const;

export interface Objective {
  key: string;
  label: string;
  description: string;
  href: string;
  /** Qualifying units done inside the window. */
  progress: number;
  /** Units for a full completion in the window. */
  target: number;
  /** 0..1 completion rate (capped). */
  rate: number;
  /** Share of the objectives sub-score this objective is worth (0..100). */
  contribution: number;
}

export interface MindComponent {
  key: "rules" | "execution" | "habits" | "objectives" | "goals";
  label: string;
  /** 0..100 sub-score, or null when the component does not apply this window. */
  value: number | null;
  /** Nominal weight out of 100. */
  weight: number;
  /** Effective weight after rescaling among applicable components (0..100). */
  effectiveWeight: number;
  /** Points this component adds to the final score (value × effectiveWeight). */
  contribution: number;
  applicable: boolean;
}

export interface MindBand {
  min: number;
  max: number;
  label: string;
  description: string;
}

export interface MindScore {
  period: MindPeriod;
  total: number | null;
  /**
   * The window is the current, still-unfolding period and nothing has been
   * logged in it yet, so a computed 0 would be misleading and demotivating.
   * When true, surfaces should show a friendly "score builds as you go" state
   * instead of a red zero.
   */
  pending: boolean;
  components: MindComponent[];
  objectives: Objective[];
  objectivesScore: number; // 0..100
  band: MindBand;
  tradeCount: number;
  habitCompleted: number;
  habitExpected: number;
  /** The window actually measured. */
  rangeStart: Date;
  rangeEnd: Date;
}

/** The five percentage bands and what each one means for trading. */
export const MIND_BANDS: MindBand[] = [
  {
    min: 0, max: 20, label: "Not trade-ready",
    description: "Process and state are off: step back and protect your capital before taking risk.",
  },
  {
    min: 20, max: 40, label: "Fragile",
    description: "Discipline breaks easily. Size down hard and treat every rule as non-negotiable.",
  },
  {
    min: 40, max: 60, label: "Inconsistent",
    description: "Holds some days, slips on others. Close the gaps before pushing size.",
  },
  {
    min: 60, max: 80, label: "Solid",
    description: "Disciplined and mostly consistent. Keep the routine tight.",
  },
  {
    min: 80, max: 100, label: "Peak state",
    description: "Rules, routine and process all locked in. Trade your edge from here.",
  },
];

export function bandFor(total: number | null): MindBand {
  if (total == null) return MIND_BANDS[0];
  return MIND_BANDS.find((b) => total >= b.min && (total < b.max || b.max === 100)) ?? MIND_BANDS[MIND_BANDS.length - 1];
}

/** Band colours, one per band: red → amber → yellow → turquoise → green. No orange, per the brand palette. */
/** Band colours as tokens, so the light theme's darker ramp applies too: the
 *  raw amber and green read as pastel on a white card. */
export const BAND_COLORS = [
  "var(--band-1)", "var(--band-2)", "var(--band-3)", "var(--band-4)", "var(--band-5)",
];

/** The colour for a score, matched to its band. Drives every MC Mindscore visual so they stay in sync. */
export function bandColorFor(total: number | null): string {
  if (total == null) return "var(--muted-foreground)";
  const i = MIND_BANDS.findIndex((b) => total >= b.min && (total < b.max || b.max === 100));
  return BAND_COLORS[Math.max(0, i)];
}

const dayKey = (iso: string) => iso.slice(0, 10);
const isWeekday = (d: Date) => d.getDay() >= 1 && d.getDay() <= 5;

function mondayKey(d: Date): string {
  const m = startOfWeek(d, { weekStartsOn: 1 });
  return `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}-${String(m.getDate()).padStart(2, "0")}`;
}

export interface MindInputs {
  now?: Date;
  trades: TradeSummary[];
  habits: Habit[];
  completions: HabitCompletion[];
  /* The four below are declared as the minimum this module actually reads,
     not as the full row. A `Pick` accepts a complete object just as happily,
     so nothing that already passes whole rows breaks; what it buys is that the
     list reads feeding this can stay narrow without the types quietly claiming
     fields that were never fetched. */
  psychSessions: Pick<PsychEdgeSession, "date" | "created_at">[];
  bestTrades: Pick<BestTradeOfDay, "date" | "created_at">[];
  weeklyReviews: Pick<WeeklyTradeReview, "week_start" | "created_at">[];
  analyses: Pick<PreTradeAnalysis, "id" | "date" | "created_at">[];
  /** Commitment re-checks. Optional: callers that predate the commitment loop
   *  simply contribute no commitment objective. */
  adherenceLogs?: Pick<CommitmentAdherenceLog, "date" | "followed" | "created_at">[];
  /** Active goal progress contributes to the score when it is measurable. */
  goals?: TradingGoal[];
}

/** Earliest day any tracked activity exists: the anchor for the all-time window. */
function earliestActivity(input: MindInputs): Date {
  const dates: number[] = [];
  input.trades.forEach((t) => dates.push(new Date(dayKey(t.date_time) + "T12:00:00").getTime()));
  input.psychSessions.forEach((s) => dates.push(new Date(dayKey(s.date) + "T12:00:00").getTime()));
  input.bestTrades.forEach((b) => dates.push(new Date(dayKey(b.date) + "T12:00:00").getTime()));
  input.weeklyReviews.forEach((r) => dates.push(new Date(r.week_start + "T12:00:00").getTime()));
  const valid = dates.filter((n) => Number.isFinite(n));
  if (!valid.length) return startOfDay(subDays(new Date(), 83)); // fall back to ~12 weeks
  return startOfDay(new Date(Math.min(...valid)));
}

function windowFor(period: MindPeriod, now: Date, input: MindInputs): { start: Date; end: Date } {
  if (period === "week") return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
  if (period === "month") return { start: startOfMonth(now), end: endOfMonth(now) };
  return { start: earliestActivity(input), end: endOfDay(now) };
}

export function computeMindScore(input: MindInputs, period: MindPeriod): MindScore {
  const now = input.now ?? new Date();
  const { start, end } = windowFor(period, now, input);
  const clampEnd = dfMin([end, endOfDay(now)]);

  // Days in the measured window, up to today.
  const days = clampEnd >= start ? eachDayOfInterval({ start, end: clampEnd }) : [];
  const weekdayCount = Math.max(1, days.filter(isWeekday).length);
  const mondaysInRange = days.filter((d) => d.getDay() === 1).map(mondayKey);

  // ── Objectives (rate-based, so any window works) ──────────────────────
  const reviewSet = new Set(input.weeklyReviews.map((r) => r.week_start));
  const inRange = (iso: string) => {
    const d = new Date(dayKey(iso) + "T12:00:00");
    return d >= start && d <= clampEnd;
  };
  const bestDays = new Set(input.bestTrades.filter((b) => inRange(b.date)).map((b) => dayKey(b.date)));
  // A weekly review becomes "due" when the trading week behind it is over:
  // that is Friday, not Sunday, since the weekend adds nothing to review. Until
  // then the week is neither counted for nor against you, so the objective
  // cannot drag the score down mid-week. Same rule as the review page itself.
  const completedMondays = mondaysInRange.filter((k) => isReviewOpen(k, now));
  const reviewTarget = completedMondays.length;
  const reviewsDone = completedMondays.filter((k) => reviewSet.has(k)).length;
  const reviewRate = reviewTarget === 0 ? 1 : Math.min(1, reviewsDone / reviewTarget);

  // ── Pre-trade analysis: every day you traded needs an analysis prepared
  // beforehand. A trade only earns its day if it links to an analysis dated
  // on or before the trade's day: an analysis written after the fact, or none
  // at all, earns nothing. Days without trades are not required.
  const analysisById = new Map(input.analyses.map((a) => [a.id, a]));
  const tradedDays = new Set<string>();
  const analysedDays = new Set<string>();
  for (const t of input.trades) {
    const day = dayKey(t.date_time);
    if (!inRange(t.date_time)) continue;
    tradedDays.add(day);
    const linked = t.linked_analysis_id ? analysisById.get(t.linked_analysis_id) : undefined;
    if (linked && dayKey(linked.date) <= day) analysedDays.add(day);
  }
  const analysisTarget = tradedDays.size; // nothing required on non-trading days
  const analysisRate = analysisTarget === 0 ? 1 : Math.min(1, analysedDays.size / analysisTarget);

  // ── Commitments: did the reflection carry into the next trade? ────────
  // Counts every check raised in the window, not only the answered ones:
  // confirming the check is part of the work, so ignoring them cannot score.
  // Never kept is never guessed: an unanswered check simply is not a kept one.
  const windowLogs = (input.adherenceLogs ?? []).filter((l) => inRange(l.date));
  const checksRaised = windowLogs.length;
  const checksKept = windowLogs.filter((l) => l.followed === true).length;

  const rawObjectives: Omit<Objective, "contribution">[] = [
    {
      key: "weekly-review", label: "Weekly review", description: "Complete each week's review once the trading week is over: from Friday",
      href: "/trade-therapist?tab=reviews", progress: reviewsDone, target: reviewTarget,
      rate: reviewRate,
    },
    {
      key: "pre-trade-analysis", label: "Pre-trade analysis", description: "Prepare an analysis before you trade: every day you take a trade",
      href: "/analysis", progress: analysedDays.size, target: analysisTarget,
      rate: analysisRate,
    },
    {
      key: "best-trade", label: "Best trade of the day", description: "Log the best trade available each day",
      href: "/trade-therapist?tab=daily", progress: bestDays.size, target: weekdayCount,
      rate: Math.min(1, bestDays.size / weekdayCount),
    },
  ];

  // Only an objective once a commitment has actually been tested: otherwise it
  // would contribute a free full score and dilute the others.
  if (checksRaised > 0) {
    rawObjectives.push({
      key: "commitments-kept",
      label: "Commitments kept",
      description: "Hold the if/then commitments you wrote, and confirm each check",
      href: "/trade-therapist?tab=commitments",
      progress: checksKept,
      target: checksRaised,
      rate: Math.min(1, checksKept / checksRaised),
    });
  }

  const share = 100 / rawObjectives.length;
  const objectives: Objective[] = rawObjectives.map((o) => ({ ...o, contribution: o.rate * share }));
  const objectivesScore = objectives.reduce((s, o) => s + o.contribution, 0);

  // ── Rules & habits over the same window ───────────────────────────────
  const rules = computeTradeRulesScore(input.trades, start, clampEnd);
  const execution = computeExecutionScore(input.trades, start, clampEnd);
  const { completed: habitCompleted, expected: habitExpected } = computeHabitCounts(input.habits, input.completions, start, clampEnd);
  const habits = habitExpected === 0 ? null : Math.round((habitCompleted / habitExpected) * 100);
  const tradeCount = input.trades.filter((t) => {
    if (!t.discipline) return false;
    const d = new Date(dayKey(t.date_time) + "T12:00:00");
    return d >= start && d <= clampEnd;
  }).length;

  // Compare each live goal with the portion of its own window that has elapsed.
  // A goal earns no points merely for being created: it needs measurable data.
  // The current standing of active goals is the same across the three score
  // periods, while the other components use their selected period's window.
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const goalReadings = (input.goals ?? [])
    .filter((goal) => !goal.archived_at && goal.start_date <= today && goal.end_date >= today)
    .map((goal) => ({ goal, progress: computeGoalProgress(goal, { trades: input.trades, habits: input.habits, completions: input.completions, now }) }))
    .filter(({ goal, progress }) => {
      if (progress.current == null || progress.timeElapsed <= 0) return false;
      // Count metrics report zero even before the first trade. Setting a goal
      // alone should not reduce the score; a traded day with zero clean days
      // remains measurable and does count.
      if ((goal.metric === "trades_logged" || goal.metric === "clean_days") && progress.current === 0) {
        return input.trades.some((trade) => trade.date_time.slice(0, 10) >= goal.start_date && trade.date_time.slice(0, 10) <= today);
      }
      return true;
    });
  const goalScore = goalReadings.length
    ? Math.round(goalReadings.reduce((sum, { progress }) => sum + Math.min(1, progress.ratio / progress.timeElapsed), 0) / goalReadings.length * 100)
    : null;

  // ── Blend (rescale weights among applicable components) ───────────────
  const raw: { key: MindComponent["key"]; label: string; value: number | null; weight: number }[] = [
    { key: "rules", label: "Rule adherence", value: rules, weight: MIND_WEIGHTS.rules },
    { key: "execution", label: "Execution", value: execution.score, weight: MIND_WEIGHTS.execution },
    { key: "habits", label: "Habit consistency", value: habits, weight: MIND_WEIGHTS.habits },
    { key: "objectives", label: "Objectives", value: Math.round(objectivesScore), weight: MIND_WEIGHTS.objectives },
    { key: "goals", label: "Goal progress", value: goalScore, weight: MIND_WEIGHTS.goals },
  ];
  const applicableWeight = raw.filter((c) => c.value != null).reduce((s, c) => s + c.weight, 0);

  const components: MindComponent[] = raw.map((c) => {
    const applicable = c.value != null;
    const effectiveWeight = applicable && applicableWeight > 0 ? (c.weight / applicableWeight) * 100 : 0;
    const contribution = applicable ? (c.value! * effectiveWeight) / 100 : 0;
    return { key: c.key, label: c.label, value: c.value, weight: c.weight, effectiveWeight, contribution, applicable };
  });

  const total = applicableWeight === 0 ? null : Math.round(components.reduce((s, c) => s + c.contribution, 0));

  // "Fresh period" detection: the window runs up to today and nothing has been
  // logged in it yet. Every real activity signal is checked, so a single trade,
  // habit tick or review flips it off. Past windows always have their earliest
  // activity inside them (all-time is anchored to it), so this only fires for a
  // just-started week or month: never for a completed one.
  const tradesInWindow = input.trades.filter((t) => {
    const d = new Date(dayKey(t.date_time) + "T12:00:00");
    return d >= start && d <= clampEnd;
  }).length;
  const anyActivity =
    tradesInWindow > 0 || habitCompleted > 0 || reviewsDone > 0 ||
    bestDays.size > 0 || analysedDays.size > 0;
  const windowIncludesToday = start <= endOfDay(now) && clampEnd >= startOfDay(now);
  const pending = !anyActivity && windowIncludesToday;

  return {
    period, total, pending, components, objectives, objectivesScore,
    band: bandFor(total), tradeCount, habitCompleted, habitExpected,
    rangeStart: start, rangeEnd: clampEnd,
  };
}

/** Convenience: compute all three windows at once. */
export function computeMindScoreAll(input: MindInputs): Record<MindPeriod, MindScore> {
  return {
    week: computeMindScore(input, "week"),
    month: computeMindScore(input, "month"),
    all: computeMindScore(input, "all"),
  };
}
