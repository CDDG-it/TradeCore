/**
 * When the trader makes money: hour of day, weekday x session, the trade's
 * place in the day, and how long it was held.
 *
 * Times are the clock times the trader typed on the trade (`execution_time` /
 * `execution_end_time`, "HH:MM"), so they are in whatever zone they log in.
 * Both are optional: every breakdown that needs a time reports how many trades
 * it could actually use, so a chart built on half the journal says so.
 */
import { getDay } from "date-fns";
import { inOrder } from "@/lib/journal/colors";
import { bucketize, type EdgeBucket } from "@/lib/journal/edge";
import type { Session, TradeJournalEntry } from "@/lib/types";

type TimedTrade = Pick<
  TradeJournalEntry,
  "result" | "rr" | "date_time" | "session" | "execution_time" | "execution_end_time" | "created_at"
>;

/** Minutes since midnight of an "HH:MM" string, or null when absent/invalid. */
export function minutesOfDay(hhmm?: string): number | null {
  if (!hhmm) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

const pad = (n: number) => String(n).padStart(2, "0");

export interface Coverage {
  /** Trades the breakdown could use. */
  used: number;
  /** Trades in the current selection. */
  total: number;
}

// ── Entry time ──────────────────────────────────────────────────────────

/** Slot widths the entry-time chart can be read at, in minutes. */
export type SlotSize = 15 | 30 | 60;

const clock = (min: number) => `${pad(Math.floor(min / 60) % 24)}:${pad(min % 60)}`;

/** "09:30" for a slot key (its start, in minutes since midnight). */
export const slotStart = (key: string) => clock(Number(key));

/**
 * R per trade by entry time, in slots of `size` minutes. Each bucket's label
 * is its window ("09:30–10:00"). Returns the span from the first to the last
 * slot that has a trade, empty slots included, so the axis reads as a clock.
 */
export function computeEntryTimeStats(
  trades: TimedTrade[],
  size: SlotSize = 30
): { buckets: EdgeBucket[]; coverage: Coverage } {
  const slotOf = (t: TimedTrade) => {
    const m = minutesOfDay(t.execution_time);
    return m === null ? null : Math.floor(m / size) * size;
  };
  const slots = trades.map(slotOf).filter((s): s is number => s !== null);
  if (slots.length === 0) return { buckets: [], coverage: { used: 0, total: trades.length } };

  const lo = Math.min(...slots);
  const hi = Math.max(...slots);
  const order = Array.from({ length: (hi - lo) / size + 1 }, (_, i) => {
    const start = lo + i * size;
    return { key: String(start), label: `${clock(start)}–${clock(start + size)}` };
  });
  return {
    buckets: bucketize(trades, (t) => {
      const s = slotOf(t);
      return s === null ? null : String(s);
    }, order),
    coverage: { used: slots.length, total: trades.length },
  };
}

// ── Weekday x session ───────────────────────────────────────────────────

export const WEEKDAYS = [
  { key: "1", label: "Mon", long: "Monday" },
  { key: "2", label: "Tue", long: "Tuesday" },
  { key: "3", label: "Wed", long: "Wednesday" },
  { key: "4", label: "Thu", long: "Thursday" },
  { key: "5", label: "Fri", long: "Friday" },
];

/** Chronological through the trading day. */
export const SESSIONS: Session[] = ["Asia", "London", "New York"];

const weekdayOf = (t: Pick<TradeJournalEntry, "date_time">) =>
  String(getDay(new Date(t.date_time.slice(0, 10) + "T12:00:00")));

export interface WeekdaySessionGrid {
  /** rows[weekday][session] */
  cells: Record<string, Record<string, EdgeBucket>>;
  /** Totals per weekday, in WEEKDAYS order. */
  byWeekday: EdgeBucket[];
  /** Totals per session, in SESSIONS order. */
  bySession: EdgeBucket[];
  /** Weekend trades are left out of the grid; counted so nothing vanishes silently. */
  weekendTrades: number;
}

export function computeWeekdaySessionGrid(trades: TimedTrade[]): WeekdaySessionGrid {
  const weekdays = new Set(WEEKDAYS.map((d) => d.key));
  const weekday = trades.filter((t) => weekdays.has(weekdayOf(t)));
  const sessionOrder = SESSIONS.map((s) => ({ key: s, label: s }));

  const cells: WeekdaySessionGrid["cells"] = {};
  for (const d of WEEKDAYS) {
    const dayTrades = weekday.filter((t) => weekdayOf(t) === d.key);
    cells[d.key] = Object.fromEntries(
      bucketize(dayTrades, (t) => t.session, sessionOrder).map((b) => [b.key, b])
    );
  }

  return {
    cells,
    byWeekday: bucketize(weekday, weekdayOf, WEEKDAYS),
    bySession: bucketize(weekday, (t) => t.session, sessionOrder),
    weekendTrades: trades.length - weekday.length,
  };
}

// ── Trade number of the day ─────────────────────────────────────────────

const ORDER_BUCKETS = [
  { key: "1", label: "1st trade" },
  { key: "2", label: "2nd trade" },
  { key: "3", label: "3rd trade" },
  { key: "4", label: "4th +" },
];

/**
 * R per trade by the trade's position in its day. A falling line here is the
 * clearest sign of overtrading: the first idea of the day is the planned one.
 * Order within a day comes from the entry time (then creation time).
 */
export function computeTradeOrderStats(trades: TimedTrade[]): EdgeBucket[] {
  const position = new Map<TimedTrade, number>();
  const seen = new Map<string, number>();
  for (const t of inOrder(trades)) {
    const day = t.date_time.slice(0, 10);
    const n = (seen.get(day) ?? 0) + 1;
    seen.set(day, n);
    position.set(t, n);
  }
  return bucketize(trades, (t) => String(Math.min(position.get(t) ?? 1, 4)), ORDER_BUCKETS);
}

// ── Hold time ───────────────────────────────────────────────────────────

const HOLD_BUCKETS = [
  { key: "5", label: "< 5 min", max: 5 },
  { key: "15", label: "5–15 min", max: 15 },
  { key: "30", label: "15–30 min", max: 30 },
  { key: "60", label: "30–60 min", max: 60 },
  { key: "inf", label: "> 1 hour", max: Infinity },
];

/** Minutes between entry and exit; an exit past midnight wraps to the next day. */
export function holdMinutes(t: Pick<TradeJournalEntry, "execution_time" | "execution_end_time">): number | null {
  const a = minutesOfDay(t.execution_time);
  const b = minutesOfDay(t.execution_end_time);
  if (a === null || b === null) return null;
  return b >= a ? b - a : b + 24 * 60 - a;
}

export function computeHoldTimeStats(trades: TimedTrade[]): { buckets: EdgeBucket[]; coverage: Coverage } {
  const keyOf = (t: TimedTrade) => {
    const m = holdMinutes(t);
    if (m === null) return null;
    return HOLD_BUCKETS.find((b) => m < b.max)?.key ?? "inf";
  };
  const used = trades.filter((t) => keyOf(t) !== null).length;
  return {
    buckets: used ? bucketize(trades, keyOf, HOLD_BUCKETS) : [],
    coverage: { used, total: trades.length },
  };
}
