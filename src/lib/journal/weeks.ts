import {
  format, startOfISOWeek, endOfISOWeek, eachDayOfInterval,
  getISOWeek, getISOWeekYear,
} from "date-fns";
import type { TradeJournalEntry } from "@/lib/types";

// Expand short tickers to the names traders recognise at a glance.
export const INSTRUMENT_NAMES: Record<string, string> = {
  NQ: "Nasdaq", MNQ: "Nasdaq", ES: "SP500", MES: "SP500",
  GOLD: "Gold", GC: "Gold", XAUUSD: "Gold", CL: "Crude Oil",
  EURUSD: "EUR/USD", GBPUSD: "GBP/USD", BTC: "Bitcoin",
};
export const instrumentName = (s: string) => INSTRUMENT_NAMES[(s ?? "").toUpperCase()] ?? s;

// Weekdays only — Saturday and Sunday are dropped from the review.
export const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

/** R contribution of a single trade. */
export function tradeR(t: TradeJournalEntry): number {
  if (t.result === "win") return t.rr;
  if (t.result === "loss") return -1;
  return 0;
}

/**
 * Win rate over decisive trades only. Break-even trades are still reported in
 * the counts everywhere, but they never sit in the denominator — a scratch is
 * neither a win nor a loss, so counting it as one understates the edge.
 * Returns null when there is nothing decisive to rate.
 */
export function winRateOf(wins: number, losses: number): number | null {
  const decisive = wins + losses;
  return decisive > 0 ? Math.round((wins / decisive) * 100) : null;
}

/** Win rate of a set of trades — wins / (wins + losses), break-even excluded. */
export function tradesWinRate(trades: TradeJournalEntry[]): number | null {
  return winRateOf(
    trades.filter((t) => t.result === "win").length,
    trades.filter((t) => t.result === "loss").length,
  );
}

export type WeekGroup = {
  weekStart: string;        // yyyy-MM-dd (Monday)
  weekNum: number;
  year: number;
  rangeLabel: string;       // "Jun 8 – Jun 12, 2026" (Mon–Fri)
  days: { date: string; trades: TradeJournalEntry[] }[]; // Mon–Fri
  trades: TradeJournalEntry[];
  wins: number;
  losses: number;
  bes: number;
  totalR: number;
};

/** Build a single week group (Mon–Fri) for a given Monday date string. */
export function getWeekGroup(trades: TradeJournalEntry[], weekStart: string): WeekGroup {
  const start = new Date(weekStart + "T12:00:00");
  const end = endOfISOWeek(start);
  // Mon–Fri only (drop the weekend)
  const weekdays = eachDayOfInterval({ start, end }).slice(0, 5);
  const friday = weekdays[weekdays.length - 1];

  const days = weekdays.map((day) => {
    const key = format(day, "yyyy-MM-dd");
    return { date: key, trades: trades.filter((t) => t.date_time.slice(0, 10) === key) };
  });
  const weekTrades = days.flatMap((d) => d.trades);

  return {
    weekStart,
    weekNum: getISOWeek(start),
    year: getISOWeekYear(start),
    rangeLabel: `${format(start, "MMM d")} – ${format(friday, "MMM d, yyyy")}`,
    days,
    trades: weekTrades,
    wins: weekTrades.filter((t) => t.result === "win").length,
    losses: weekTrades.filter((t) => t.result === "loss").length,
    bes: weekTrades.filter((t) => t.result === "break-even").length,
    totalR: weekTrades.reduce((s, t) => s + tradeR(t), 0),
  };
}

/** Group all trades into weeks (Mon–Fri), newest first. */
export function buildWeekGroups(trades: TradeJournalEntry[]): WeekGroup[] {
  const weekStarts = new Set<string>();
  trades.forEach((t) => {
    const d = new Date(t.date_time.slice(0, 10) + "T12:00:00");
    weekStarts.add(format(startOfISOWeek(d), "yyyy-MM-dd"));
  });
  return [...weekStarts]
    .map((ws) => getWeekGroup(trades, ws))
    .sort((a, b) => b.weekStart.localeCompare(a.weekStart));
}

export function formatTotalR(totalR: number): string {
  return `${totalR >= 0 ? "+" : ""}${totalR.toFixed(1)}R`;
}
