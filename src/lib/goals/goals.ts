/**
 * My Goals — targets on the numbers the app already measures.
 *
 * Nothing about a goal's progress is stored. The row holds the intent (what
 * you are aiming at, from where, over which window) and everything else is
 * recomputed from trades and habits on read, so a goal can never quietly
 * disagree with the journal behind it.
 */
import { startOfDay, endOfDay, differenceInCalendarDays } from "date-fns";
import {
  computeExecutionScore, computeTradeRulesScore, computeHabitScore,
} from "@/lib/discipline";
import { tradeR } from "@/lib/journal/weeks";
import type { GoalMetric, TradingGoal, TradeJournalEntry, Habit, HabitCompletion } from "@/lib/types";

export interface GoalMetricMeta {
  key: GoalMetric;
  label: string;
  /** What the number means, in the trader's language. */
  help: string;
  unit: "percent" | "R" | "count";
  /** Sensible target when the metric is first picked. */
  defaultTarget: number;
  /**
   * Whether the number piles up inside the window (clean days, R, trades) or
   * describes a level that the window as a whole sits at (execution rate,
   * adherence, win rate).
   *
   * It decides whether a baseline makes sense. "60% → 80%" is a journey from a
   * starting level, so progress is measured from the 60. Fifteen clean days is
   * not a journey from anywhere: the days already banked this month are part
   * of the fifteen, and subtracting them as a "baseline" would wipe out
   * progress the trader had actually made.
   */
  accumulates: boolean;
}

export const GOAL_METRICS: GoalMetricMeta[] = [
  {
    key: "execution_rate",
    label: "Execution rate",
    help: "The share of rated trades you took to plan and to your edge.",
    unit: "percent",
    defaultTarget: 80,
    accumulates: false,
  },
  {
    key: "clean_days",
    label: "Clean days",
    help: "Days you traded without a single badly executed trade on them.",
    unit: "count",
    defaultTarget: 15,
    accumulates: true,
  },
  {
    key: "rule_adherence",
    label: "Rule adherence",
    help: "Your average score on the discipline checklist you fill in per trade.",
    unit: "percent",
    defaultTarget: 90,
    accumulates: false,
  },
  {
    key: "habit_consistency",
    label: "Habit consistency",
    help: "The share of scheduled habit reps you actually kept.",
    unit: "percent",
    defaultTarget: 85,
    accumulates: false,
  },
  {
    key: "win_rate",
    label: "Win rate",
    help: "Wins as a share of decided trades. Break-evens sit out of the maths.",
    unit: "percent",
    defaultTarget: 55,
    accumulates: false,
  },
  {
    key: "net_r",
    label: "Net R",
    help: "Total R banked across the window.",
    unit: "R",
    defaultTarget: 20,
    accumulates: true,
  },
  {
    key: "trades_logged",
    label: "Trades logged",
    help: "How many trades you actually wrote up.",
    unit: "count",
    defaultTarget: 40,
    accumulates: true,
  },
];

export const METRIC_META: Record<GoalMetric, GoalMetricMeta> = Object.fromEntries(
  GOAL_METRICS.map((m) => [m.key, m])
) as Record<GoalMetric, GoalMetricMeta>;

/** Format a metric's value in its own unit. */
export function formatGoalValue(metric: GoalMetric, value: number | null): string {
  if (value == null) return "—";
  const { unit } = METRIC_META[metric];
  if (unit === "percent") return `${Math.round(value)}%`;
  if (unit === "R") return `${value > 0 ? "+" : ""}${value.toFixed(1)}R`;
  return String(Math.round(value));
}

export interface GoalInputs {
  trades: TradeJournalEntry[];
  habits: Habit[];
  completions: HabitCompletion[];
  now?: Date;
}

export type GoalState = "on-track" | "behind" | "achieved" | "missed" | "no-data";

export interface GoalProgress {
  /** Where the metric stands right now, or null when nothing measurable yet. */
  current: number | null;
  /** 0–1 of the way from the baseline to the target. */
  ratio: number;
  state: GoalState;
  /** Days left in the window; 0 once it has closed. */
  daysLeft: number;
  /** How far through the window we are, 0–1 — the bar a goal has to keep up with. */
  timeElapsed: number;
  /** True once the window has closed. */
  closed: boolean;
}

const dayOf = (t: TradeJournalEntry) => t.date_time.slice(0, 10);

/**
 * Days that were traded and hold no badly executed trade.
 *
 * A day nobody rated does not count as clean: the goal is about deliberate
 * good execution, and an unrated day is an absence of evidence rather than
 * evidence of a clean day.
 */
function cleanDays(trades: TradeJournalEntry[]): number {
  const byDay = new Map<string, TradeJournalEntry[]>();
  for (const t of trades) {
    const k = dayOf(t);
    const list = byDay.get(k);
    if (list) list.push(t);
    else byDay.set(k, [t]);
  }
  let n = 0;
  for (const list of byDay.values()) {
    const good = list.filter((t) => t.execution_quality === "good").length;
    const bad = list.filter((t) => t.execution_quality === "bad").length;
    if (bad === 0 && good > 0) n += 1;
  }
  return n;
}

/** Where a metric stands over [start, end]. Null when there is nothing to measure. */
export function measureMetric(
  metric: GoalMetric,
  input: GoalInputs,
  start: Date,
  end: Date
): number | null {
  const inWindow = input.trades.filter((t) => {
    const d = new Date(dayOf(t) + "T12:00:00");
    return d >= start && d <= end;
  });

  switch (metric) {
    case "execution_rate":
      return computeExecutionScore(input.trades, start, end).score;
    case "rule_adherence":
      return computeTradeRulesScore(input.trades, start, end);
    case "habit_consistency":
      return computeHabitScore(input.habits, input.completions, start, end);
    case "clean_days":
      return cleanDays(inWindow);
    case "trades_logged":
      return inWindow.length;
    case "net_r":
      return inWindow.length === 0 ? null : inWindow.reduce((s, t) => s + tradeR(t), 0);
    case "win_rate": {
      const decided = inWindow.filter((t) => t.result !== "break-even");
      if (decided.length === 0) return null;
      return Math.round(
        (decided.filter((t) => t.result === "win").length / decided.length) * 100
      );
    }
  }
}

/**
 * Progress against a goal.
 *
 * `ratio` is measured from the baseline, not from zero: "60% → 80%" is half
 * done at 70%, and reading it as 70/80 would flatter it. Without a baseline
 * the journey starts at zero, which is the right reading for the counting
 * metrics ("15 clean days").
 *
 * `state` compares progress against how much of the window has gone. A goal
 * is only "behind" once the calendar has moved further than the number has —
 * before the window opens there is nothing to be behind on.
 */
export function computeGoalProgress(goal: TradingGoal, input: GoalInputs): GoalProgress {
  const now = input.now ?? new Date();
  const start = startOfDay(new Date(goal.start_date + "T12:00:00"));
  const end = endOfDay(new Date(goal.end_date + "T12:00:00"));

  const current = measureMetric(goal.metric, input, start, end);

  // An accumulating metric never subtracts a baseline: what is already in the
  // window counts towards the target rather than against it.
  const from = METRIC_META[goal.metric].accumulates ? 0 : (goal.baseline ?? 0);
  const span = goal.target - from;
  const ratio =
    current == null
      ? 0
      : span === 0
        ? current >= goal.target ? 1 : 0
        : Math.max(0, Math.min(1, (current - from) / span));

  const totalDays = Math.max(1, differenceInCalendarDays(end, start) + 1);
  const goneDays = Math.max(0, Math.min(totalDays, differenceInCalendarDays(now, start) + 1));
  const timeElapsed = goneDays / totalDays;
  const closed = now > end;
  const daysLeft = closed ? 0 : Math.max(0, differenceInCalendarDays(end, now));

  const hit = current != null && current >= goal.target;
  const state: GoalState = hit
    ? "achieved"
    : closed
      ? "missed"
      : current == null
        ? "no-data"
        // A little slack: a goal is not "behind" for being a nose off the pace.
        : ratio + 0.1 >= timeElapsed
          ? "on-track"
          : "behind";

  return { current, ratio, state, daysLeft, timeElapsed, closed };
}

/** The sentence shown when the trader did not write their own title. */
export function describeGoal(goal: TradingGoal): string {
  const meta = METRIC_META[goal.metric];
  const target = formatGoalValue(goal.metric, goal.target);
  if (goal.baseline != null && !meta.accumulates) {
    return `${meta.label}: ${formatGoalValue(goal.metric, goal.baseline)} → ${target}`;
  }
  return `${meta.label} of ${target}`;
}
