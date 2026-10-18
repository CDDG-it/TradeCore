import { thresholds } from "@/lib/trade-profile/config";
import { addDays, daysBetween, type DateKey } from "@/lib/trade-profile/dates";
import { traitScore } from "@/lib/trade-profile/scoring";
import type { Checkin, CheckinDone, DomainCode, FacetCode, Profile, TraitCode } from "@/lib/trade-profile/types";

const POINTS: Record<CheckinDone, number> = { yes: 1, partly: 0.5, no: 0 };

/**
 * Share of program days so far with the challenge done (partly counts half).
 * Days without a check-in count as not done. Today only counts once logged,
 * so the rate does not drop just because the day is not over.
 */
export function completionRate(checkins: Record<DateKey, Checkin>, startDate: DateKey, todayKey: DateKey): number {
  const total = thresholds.programWeeks * 7;
  const elapsedBeforeToday = Math.min(Math.max(daysBetween(startDate, todayKey), 0), total);
  const loggedToday = checkins[todayKey] !== undefined && daysBetween(startDate, todayKey) < total;
  const days = elapsedBeforeToday + (loggedToday ? 1 : 0);
  if (days === 0) return 0;
  let points = 0;
  for (let i = 0; i < days; i++) {
    const c = checkins[addDays(startDate, i)];
    if (c) points += POINTS[c.done];
  }
  return points / days;
}

/**
 * Consecutive days, ending today, with the challenge done or partly done.
 * If today is not logged yet the streak still counts up to yesterday.
 */
export function streak(checkins: Record<DateKey, Checkin>, todayKey: DateKey): number {
  let day = checkins[todayKey] ? todayKey : addDays(todayKey, -1);
  let n = 0;
  while (checkins[day] && checkins[day].done !== "no") {
    n++;
    day = addDays(day, -1);
  }
  return n;
}

export function stateSeries(checkins: Record<DateKey, Checkin>, startDate: DateKey) {
  return Object.entries(checkins)
    .filter(([d]) => d >= startDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, c]) => ({ date, day: daysBetween(startDate, date) + 1, state: c.state, difficulty: c.difficulty }));
}

export interface DiffRow {
  trait: TraitCode;
  before: number;
  after: number;
  change: number;
}

/** Before vs. after for a domain and its six facets (only traits scored on both occasions). */
export function retestDiff(before: Profile, after: Profile, domain: DomainCode): DiffRow[] {
  const traits: TraitCode[] = [domain, ...([1, 2, 3, 4, 5, 6] as const).map((n) => `${domain}${n}` as FacetCode)];
  return traits.flatMap((trait) => {
    const b = traitScore(before, trait);
    const a = traitScore(after, trait);
    return b === undefined || a === undefined ? [] : [{ trait, before: b, after: a, change: a - b }];
  });
}
