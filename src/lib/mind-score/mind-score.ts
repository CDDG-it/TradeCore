/**
 * MC Mindscore — one number for how ready a trader is to trade their edge.
 *
 * It blends the things a trader controls into a single 0–100 score:
 *   • Rule adherence  — the per-trade discipline checklist (what happens at the screen)
 *   • Habit consistency — daily/lifestyle habits (what happens away from the charts)
 *   • Objectives       — the process work that compounds an edge: your weekly review,
 *                        your psychology reflections, logging the best trade of the day
 *
 * Objectives are not a separate "game" — completing them raises the same MC Mindscore.
 * Every input is derived from data the trader already produces, so nothing is faked.
 *
 * The score is computed over any window, so week / month / all-time all use one engine.
 */

import {
  startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfDay, endOfDay,
  eachDayOfInterval, min as dfMin, subDays,
} from "date-fns";
import { computeTradeRulesScore, computeHabitCounts } from "@/lib/discipline";
import type {
  TradeJournalEntry, Habit, HabitCompletion, PsychEdgeSession, BestTradeOfDay, WeeklyTradeReview,
} from "@/lib/types";

export type MindPeriod = "week" | "month" | "all";

/** Nominal weights (out of 100). Rescaled among the components that apply. */
export const MIND_WEIGHTS = { rules: 45, habits: 25, objectives: 30 } as const;

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
  key: "rules" | "habits" | "objectives";
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
    description: "Your process and state aren't where they need to be. Step back, rebuild the routine, and protect your capital before taking any risk.",
  },
  {
    min: 20, max: 40, label: "Fragile",
    description: "Discipline is thin and easily broken. Expect impulsive decisions — size down hard and treat every rule as non-negotiable.",
  },
  {
    min: 40, max: 60, label: "Inconsistent",
    description: "The process holds some days and slips on others. Close the gaps in your habits and objectives before pushing size.",
  },
  {
    min: 60, max: 80, label: "Solid",
    description: "You're disciplined and mostly consistent. A few objectives short of your best state — keep the routine tight.",
  },
  {
    min: 80, max: 100, label: "Peak state",
    description: "Rules, routine and reflection are all locked in. This is the state to trade your edge from.",
  },
];

export function bandFor(total: number | null): MindBand {
  if (total == null) return MIND_BANDS[0];
  return MIND_BANDS.find((b) => total >= b.min && (total < b.max || b.max === 100)) ?? MIND_BANDS[MIND_BANDS.length - 1];
}

/** Band colours, one per band: red → amber → yellow → turquoise → green. No orange, per the brand palette. */
export const BAND_COLORS = ["#ef4444", "#f59e0b", "#eab308", "#14B8A6", "#22c55e"];

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
  trades: TradeJournalEntry[];
  habits: Habit[];
  completions: HabitCompletion[];
  psychSessions: PsychEdgeSession[];
  bestTrades: BestTradeOfDay[];
  weeklyReviews: WeeklyTradeReview[];
}

/** Earliest day any tracked activity exists — the anchor for the all-time window. */
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
  const weekCount = Math.max(1, mondaysInRange.length);

  // ── Objectives (rate-based, so any window works) ──────────────────────
  const reviewSet = new Set(input.weeklyReviews.map((r) => r.week_start));
  const inRange = (iso: string) => {
    const d = new Date(dayKey(iso) + "T12:00:00");
    return d >= start && d <= clampEnd;
  };
  const psychDays = new Set(input.psychSessions.filter((s) => inRange(s.date)).map((s) => dayKey(s.date)));
  const bestDays = new Set(input.bestTrades.filter((b) => inRange(b.date)).map((b) => dayKey(b.date)));
  const reviewsDone = mondaysInRange.filter((k) => reviewSet.has(k)).length;

  const rawObjectives: Omit<Objective, "contribution">[] = [
    {
      key: "weekly-review", label: "Weekly review", description: "Complete your weekly trade review",
      href: "/journal", progress: reviewsDone, target: weekCount,
      rate: Math.min(1, reviewsDone / weekCount),
    },
    {
      key: "psych-reflections", label: "Psychology reflections", description: "Reflect on your trading days",
      href: "/psychological-edge", progress: psychDays.size, target: weekdayCount,
      rate: Math.min(1, psychDays.size / weekdayCount),
    },
    {
      key: "best-trade", label: "Best trade of the day", description: "Log the best trade available each day",
      href: "/journal", progress: bestDays.size, target: weekdayCount,
      rate: Math.min(1, bestDays.size / weekdayCount),
    },
  ];

  const share = 100 / rawObjectives.length;
  const objectives: Objective[] = rawObjectives.map((o) => ({ ...o, contribution: o.rate * share }));
  const objectivesScore = objectives.reduce((s, o) => s + o.contribution, 0);

  // ── Rules & habits over the same window ───────────────────────────────
  const rules = computeTradeRulesScore(input.trades, start, clampEnd);
  const { completed: habitCompleted, expected: habitExpected } = computeHabitCounts(input.habits, input.completions, start, clampEnd);
  const habits = habitExpected === 0 ? null : Math.round((habitCompleted / habitExpected) * 100);
  const tradeCount = input.trades.filter((t) => {
    if (!t.discipline) return false;
    const d = new Date(dayKey(t.date_time) + "T12:00:00");
    return d >= start && d <= clampEnd;
  }).length;

  // ── Blend (rescale weights among applicable components) ───────────────
  const raw: { key: MindComponent["key"]; label: string; value: number | null; weight: number }[] = [
    { key: "rules", label: "Rule adherence", value: rules, weight: MIND_WEIGHTS.rules },
    { key: "habits", label: "Habit consistency", value: habits, weight: MIND_WEIGHTS.habits },
    { key: "objectives", label: "Objectives", value: Math.round(objectivesScore), weight: MIND_WEIGHTS.objectives },
  ];
  const applicableWeight = raw.filter((c) => c.value != null).reduce((s, c) => s + c.weight, 0);

  const components: MindComponent[] = raw.map((c) => {
    const applicable = c.value != null;
    const effectiveWeight = applicable && applicableWeight > 0 ? (c.weight / applicableWeight) * 100 : 0;
    const contribution = applicable ? (c.value! * effectiveWeight) / 100 : 0;
    return { key: c.key, label: c.label, value: c.value, weight: c.weight, effectiveWeight, contribution, applicable };
  });

  const total = applicableWeight === 0 ? null : Math.round(components.reduce((s, c) => s + c.contribution, 0));

  return {
    period, total, components, objectives, objectivesScore,
    band: bandFor(total), tradeCount, habitCompleted, habitExpected,
    rangeStart: start, rangeEnd: clampEnd,
  };
}

/** Convenience — compute all three windows at once. */
export function computeMindScoreAll(input: MindInputs): Record<MindPeriod, MindScore> {
  return {
    week: computeMindScore(input, "week"),
    month: computeMindScore(input, "month"),
    all: computeMindScore(input, "all"),
  };
}
