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

/**
 * Execution quality across [start, end] — the share of rated trades the trader
 * marked as good.
 *
 * Only rated trades count. An unrated trade is not a bad one: leaving it out
 * keeps the number honest, the same way break-even trades are kept out of the
 * win-rate denominator instead of being scored as losses.
 */
export function computeExecutionScore(
  trades: TradeJournalEntry[],
  start: Date,
  end: Date
): { score: number | null; good: number; bad: number } {
  let good = 0;
  let bad = 0;
  for (const t of trades) {
    if (!t.execution_quality) continue;
    const d = tradeDate(t);
    if (d < start || d > end) continue;
    if (t.execution_quality === "good") good++;
    else bad++;
  }
  const rated = good + bad;
  return { score: rated > 0 ? Math.round((good / rated) * 100) : null, good, bad };
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

// Anything earlier than this is treated as a bogus created_at (e.g. a null that
// parsed to the 1970 epoch). Habits realistically can't predate the app.
const SANE_EPOCH = new Date("2015-01-01T00:00:00").getTime();

/** Day (ms) a habit should start being scored from: its created_at when that is
 *  a plausible date, otherwise its first-ever completion, otherwise never. */
function habitStartTime(h: Habit, completions: HabitCompletion[]): number {
  const created = startOfDay(new Date(h.created_at)).getTime();
  if (Number.isFinite(created) && created >= SANE_EPOCH) return created;

  let earliest = Infinity;
  for (const c of completions) {
    if (c.habit_id !== h.id || !c.completed) continue;
    const t = new Date(c.date + "T00:00:00").getTime();
    if (Number.isFinite(t) && t < earliest) earliest = t;
  }
  return earliest; // Infinity ⇒ no data, so the habit contributes nothing.
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

  // A habit only starts counting from the day it became active — days before it
  // existed are neither expected nor a "miss", so a fresh habit isn't penalised
  // for history it was never part of. `created_at` is the source of truth, but
  // guard against missing/bogus values (a null date parses to 1970, which would
  // otherwise balloon the "all-time" expected count): if it's not a plausible
  // date, fall back to the habit's earliest completion, or exclude it entirely.
  const createdOn = new Map(
    habits.map((h) => [h.id, habitStartTime(h, completions)])
  );

  let expected = 0;
  let completed = 0;
  for (const day of eachDayOfInterval({ start: rangeStart, end: rangeEnd })) {
    const weekday = day.getDay();
    const dayTime = day.getTime();
    const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(
      day.getDate()
    ).padStart(2, "0")}`;
    for (const h of habits) {
      if (!frequencyAppliesOn(h.frequency, weekday)) continue;
      if (dayTime < (createdOn.get(h.id) ?? 0)) continue;
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
