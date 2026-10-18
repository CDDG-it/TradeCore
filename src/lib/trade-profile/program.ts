import { thresholds } from "@/lib/trade-profile/config";
import type { FocusAreaId } from "@/lib/trade-profile/focus-rules";
import { addDays, daysBetween, type DateKey } from "@/lib/trade-profile/dates";
import type { Difficulty, Exercise, GoalTarget } from "@/lib/trade-profile/types";
import { domainOf } from "@/lib/trade-profile/types";

/**
 * How well an exercise fits a goal. 0 means it is not used.
 * Exact trait + direction beats same domain + direction; the goal's focus
 * area adds weight; general exercises (no target) are filler.
 */
export function relevance(ex: Exercise, goal: GoalTarget, area?: FocusAreaId): number {
  let score = 0;
  const t = ex.target;
  if (t.trait === null) score += 1;
  else if (t.direction === goal.direction) {
    if (t.trait === goal.trait) score += 4;
    else if (domainOf(t.trait) === domainOf(goal.trait)) score += 2;
  }
  if (area && ex.focusArea === area) score += 4;
  return score;
}

export function exercisePool(library: Exercise[], goal: GoalTarget, area?: FocusAreaId): Exercise[] {
  return library
    .map((ex) => ({ ex, r: relevance(ex, goal, area) }))
    .filter((x) => x.r > 0)
    .sort((a, b) => b.r - a.r || a.ex.difficulty - b.ex.difficulty || a.ex.id.localeCompare(b.ex.id))
    .map((x) => x.ex);
}

export interface ProgramWeek {
  week: number;
  targetDifficulty: Difficulty;
  exerciseIds: string[];
}

/** Two a week throughout: few enough to remember without opening the app. */
export const CHALLENGES_PER_WEEK = 2;
export const targetDifficulty = (week: number): Difficulty => (week <= 4 ? 1 : week <= 8 ? 2 : 3);

/**
 * Twelve weeks of two challenges a week; difficulty
 * steps from easy (1–4) to medium (5–8) to hard (9–12).
 *
 * Each week picks the exercises with the lowest cost, where cost weighs
 * relevance to the goal (1 per point below the best match), distance from the
 * week's target difficulty (2.5 per level), how often it was already used (1
 * per use), and a penalty for repeating last week (3). Exercises more than one
 * level above the week's target are never picked. Deterministic for a given
 * goal and library.
 */
export function buildProgram(library: Exercise[], goal: GoalTarget, area?: FocusAreaId): ProgramWeek[] {
  const pool = exercisePool(library, goal, area);
  const rel = new Map(pool.map((ex) => [ex.id, relevance(ex, goal, area)]));
  const top = Math.max(0, ...rel.values());
  const rank = new Map(pool.map((ex, i) => [ex.id, i]));
  const uses = new Map<string, number>();
  const weeks: ProgramWeek[] = [];
  let previous: string[] = [];
  for (let week = 1; week <= thresholds.programWeeks; week++) {
    const want = targetDifficulty(week);
    const n = Math.min(CHALLENGES_PER_WEEK, pool.length);
    const cost = (ex: Exercise) =>
      top - rel.get(ex.id)! + 2.5 * Math.abs(ex.difficulty - want) + (uses.get(ex.id) ?? 0) + (previous.includes(ex.id) ? 3 : 0);
    const eligible = pool.filter((ex) => ex.difficulty <= want + 1);
    const picked = [...(eligible.length >= n ? eligible : pool)]
      .sort((a, b) => cost(a) - cost(b) || rank.get(a.id)! - rank.get(b.id)!)
      .slice(0, n)
      .sort((a, b) => a.difficulty - b.difficulty || rank.get(a.id)! - rank.get(b.id)!)
      .map((ex) => ex.id);
    picked.forEach((id) => uses.set(id, (uses.get(id) ?? 0) + 1));
    weeks.push({ week, targetDifficulty: want, exerciseIds: picked });
    previous = picked;
  }
  return weeks;
}

export interface ProgramPosition {
  /** 0-based day since the start. */
  dayIndex: number;
  /** 1-based week, clamped to the program length. */
  week: number;
  dayOfWeek: number;
  started: boolean;
  finished: boolean;
}

export function programPosition(startDate: DateKey, todayKey: DateKey): ProgramPosition {
  const dayIndex = daysBetween(startDate, todayKey);
  const total = thresholds.programWeeks * 7;
  return {
    dayIndex,
    week: Math.min(thresholds.programWeeks, Math.max(1, Math.floor(dayIndex / 7) + 1)),
    dayOfWeek: ((dayIndex % 7) + 7) % 7,
    started: dayIndex >= 0,
    finished: dayIndex >= total,
  };
}

/** The challenge for a given day: the week's challenges take turns. */
export function exerciseForDay(program: ProgramWeek[], startDate: DateKey, day: DateKey): string | undefined {
  const pos = programPosition(startDate, day);
  if (!pos.started || pos.finished) return undefined;
  const ids = program[pos.week - 1]?.exerciseIds ?? [];
  return ids.length ? ids[pos.dayOfWeek % ids.length] : undefined;
}

export function weekDates(startDate: DateKey, week: number): DateKey[] {
  return Array.from({ length: 7 }, (_, i) => addDays(startDate, (week - 1) * 7 + i));
}

/** Retests that are due (week reached) and not yet taken. */
export function dueRetests(startDate: DateKey, todayKey: DateKey, taken: number[]): number[] {
  const pos = programPosition(startDate, todayKey);
  const reached = pos.started ? Math.floor(pos.dayIndex / 7) + 1 : 0;
  return thresholds.retestWeeks.filter((w) => reached >= w && !taken.includes(w));
}
