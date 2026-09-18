/**
 * Federal Reserve events: FOMC decision days and the minutes that follow.
 *
 * Like the exchange holidays, these are a published schedule rather than a
 * feed. The FOMC calendar is fixed a year or more ahead
 * (federalreserve.gov/monetarypolicy/fomccalendars.htm), so the decision dates
 * below are the Fed's own, verified, not estimated. A rate decision and the
 * Chair's press conference land on the second day of each meeting; the Summary
 * of Economic Projections (the "dot plot") is published at the four meetings
 * flagged `sep`. The minutes follow "three weeks after the date of the policy
 * decision" — the Fed's own rule — so they are derived as decision + 21 days.
 *
 * These are the days that move the whole rates complex, so they belong on the
 * calendar beside the data prints, whether or not a trader intends to trade
 * them. Nothing here needs a network call, which is also why the Fed events
 * still show when FRED is unavailable.
 */
import { addDays, format } from "date-fns";

export type FedEventKind = "fomc-decision" | "fomc-minutes";

export interface FedEvent {
  /** yyyy-MM-dd */
  date: string;
  title: string;
  kind: FedEventKind;
  /** A decision is always the day's headline; minutes are a notch below. */
  importance: "high" | "medium";
  detail: string;
}

/** FOMC decision days (day two of each meeting), from the Fed's published
 *  calendar. `sep` marks the meetings that also publish economic projections. */
const FOMC_DECISIONS: { date: string; sep: boolean }[] = [
  { date: "2025-01-29", sep: false },
  { date: "2025-03-19", sep: true },
  { date: "2025-05-07", sep: false },
  { date: "2025-06-18", sep: true },
  { date: "2025-07-30", sep: false },
  { date: "2025-09-17", sep: true },
  { date: "2025-10-29", sep: false },
  { date: "2025-12-10", sep: true },
  { date: "2026-01-28", sep: false },
  { date: "2026-03-18", sep: true },
  { date: "2026-04-29", sep: false },
  { date: "2026-06-17", sep: true },
  { date: "2026-07-29", sep: false },
  { date: "2026-09-16", sep: true },
  { date: "2026-10-28", sep: false },
  { date: "2026-12-09", sep: true },
  { date: "2027-01-27", sep: false },
  { date: "2027-03-17", sep: true },
  { date: "2027-04-28", sep: false },
  { date: "2027-06-09", sep: true },
  { date: "2027-07-28", sep: false },
  { date: "2027-09-15", sep: true },
  { date: "2027-10-27", sep: false },
  { date: "2027-12-08", sep: true },
];

/** Every Fed event in a calendar year, decisions and their minutes, sorted. */
export function fedEvents(year: number): FedEvent[] {
  const out: FedEvent[] = [];
  for (const m of FOMC_DECISIONS) {
    const decisionYear = Number(m.date.slice(0, 4));
    const minutesDate = format(addDays(new Date(m.date + "T12:00:00"), 21), "yyyy-MM-dd");
    const minutesYear = Number(minutesDate.slice(0, 4));

    if (decisionYear === year) {
      out.push({
        date: m.date,
        title: "FOMC rate decision",
        kind: "fomc-decision",
        importance: "high",
        detail: m.sep
          ? "Rate decision, press conference and Summary of Economic Projections"
          : "Rate decision and Chair's press conference",
      });
    }
    if (minutesYear === year) {
      out.push({
        date: minutesDate,
        title: "FOMC minutes",
        kind: "fomc-minutes",
        importance: "medium",
        detail: "Minutes of the previous FOMC meeting (three weeks on)",
      });
    }
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Fed events falling between two dates (inclusive), keyed by yyyy-MM-dd, so a
 * calendar grid that spills into a neighbouring month still marks them.
 */
export function fedEventsByDate(fromIso: string, toIso: string): Map<string, FedEvent[]> {
  const map = new Map<string, FedEvent[]>();
  const fromYear = Number(fromIso.slice(0, 4));
  const toYear = Number(toIso.slice(0, 4));
  for (let y = fromYear; y <= toYear; y++) {
    for (const e of fedEvents(y)) {
      if (e.date < fromIso || e.date > toIso) continue;
      const list = map.get(e.date) ?? [];
      list.push(e);
      map.set(e.date, list);
    }
  }
  return map;
}
