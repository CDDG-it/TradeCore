import { eachDayOfInterval, startOfDay, min as minDate } from "date-fns";
import type { TradeJournalEntry, Habit, HabitCompletion } from "@/lib/types";

/**
 * Discipline blends the two things a trader actually controls:
 *
 *   1. Trade-rule adherence — the per-trade discipline checklist score.
 *      This is what happens *at the screen* and stays the dominant signal.
 *   2. Habit consistency     — completion of the daily/lifestyle habits that
 *      happen *away from the charts*. This is the behavioural layer.
 *
 * Weighting: 70% trade rules, 30% habits. Trade rules dominate on purpose —
 * habits should nudge the score, never overpower the actual trading process.
 * When only one side has data for the period, that side stands alone; we never
 * punish a trader for a dimension we cannot measure yet (e.g. no habits set up,
 * or no scored trades in the range).
 *
 * "Consistency over time" is captured implicitly: the habit score is measured
 * across *every* applicable day in the period (not just today), so a trader who
 * shows up daily scores higher than one who completes everything on a single day.
 */
export const DISCIPLINE_WEIGHTS = { tradeRules: 0.7, habits: 0.3 } as const;

export interface DisciplineBreakdown {
  /** 0–100 average of the per-trade discipline scores, or null if none scored. */
  tradeRules: number | null;
  /** 0–100 habit completion across the period, or null if no habits apply. */
  habits: number | null;
  /** 0–100 blended score, or null when there is nothing to measure. */
  total: number | null;
  /** Number of scored trades that fed the trade-rule score. */
  tradeCount: number;
  /** Habit check-ins completed vs expected across the period. */
  habitCompleted: number;
  habitExpected: number;
}

const tradeDate = (t: TradeJournalEntry) => new Date(t.date_time.slice(0, 10) + "T12:00:00");

/** Whether a habit with the given frequency is expected on a specific weekday. */
function frequencyAppliesOn(freq: Habit["frequency"], weekday: number): boolean {
  // weekday: 0 = Sunday … 6 = Saturday
  if (freq === "weekdays") return weekday >= 1 && weekday <= 5;
  if (freq === "weekends") return weekday === 0 || weekday === 6;
  return true; // "daily"
}

/** Average per-trade discipline score for trades inside [start, end]. */
export function computeTradeRulesScore(
  trades: TradeJournalEntry[],
  start: Date,
  end: Date
): number | null {
  const scored = trades.filter((t) => {
    if (!t.discipline) return false;
    const d = tradeDate(t);
    return d >= start && d <= end;
  });
  if (scored.length === 0) return null;
  const sum = scored.reduce((s, t) => s + (t.discipline?.score ?? 0), 0);
  return Math.round(sum / scored.length);
}

/**
 * Habit completion rate across [start, end], only counting days up to today
 * (future days are not "misses"). Each applicable habit-day is one expected
 * completion; the score is completed / expected.
 */
export function computeHabitCounts(
  habits: Habit[],
  completions: HabitCompletion[],
  start: Date,
  end: Date
): { completed: number; expected: number } {
  const today = startOfDay(new Date());
  const rangeStart = startOfDay(start);
  const rangeEnd = startOfDay(minDate([end, today]));
  if (habits.length === 0 || rangeEnd < rangeStart) return { completed: 0, expected: 0 };

  // Fast lookup of the days a habit was actually completed.
  const done = new Set(
    completions.filter((c) => c.completed).map((c) => `${c.habit_id}|${c.date}`)
  );

  let expected = 0;
  let completed = 0;
  for (const day of eachDayOfInterval({ start: rangeStart, end: rangeEnd })) {
    const weekday = day.getDay();
    const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(
      day.getDate()
    ).padStart(2, "0")}`;
    for (const h of habits) {
      if (!frequencyAppliesOn(h.frequency, weekday)) continue;
      expected += 1;
      if (done.has(`${h.id}|${key}`)) completed += 1;
    }
  }
  return { completed, expected };
}

export function computeHabitScore(
  habits: Habit[],
  completions: HabitCompletion[],
  start: Date,
  end: Date
): number | null {
  const { completed, expected } = computeHabitCounts(habits, completions, start, end);
  if (expected === 0) return null;
  return Math.round((completed / expected) * 100);
}

/** Full discipline breakdown (trade rules, habits, blended total) for a period. */
export function computeDiscipline(
  trades: TradeJournalEntry[],
  habits: Habit[],
  completions: HabitCompletion[],
  start: Date,
  end: Date
): DisciplineBreakdown {
  const tradeRules = computeTradeRulesScore(trades, start, end);
  const { completed: habitCompleted, expected: habitExpected } = computeHabitCounts(habits, completions, start, end);
  const habitsScore = habitExpected === 0 ? null : Math.round((habitCompleted / habitExpected) * 100);

  const tradeCount = trades.filter((t) => {
    if (!t.discipline) return false;
    const d = tradeDate(t);
    return d >= start && d <= end;
  }).length;

  let total: number | null;
  if (tradeRules === null && habitsScore === null) total = null;
  else if (tradeRules === null) total = habitsScore;
  else if (habitsScore === null) total = tradeRules;
  else
    total = Math.round(
      DISCIPLINE_WEIGHTS.tradeRules * tradeRules + DISCIPLINE_WEIGHTS.habits * habitsScore
    );

  return { tradeRules, habits: habitsScore, total, tradeCount, habitCompleted, habitExpected };
}
