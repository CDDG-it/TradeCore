/**
 * Outcome colours — one vocabulary for every surface that shows trades.
 *
 * Green wins, red losses, amber break-even (see globals.css). Kept here rather
 * than re-declared per page so the dashboard's week strip, the journal and the
 * Trade Therapist calendar can never drift apart.
 */
import type { TradeJournalEntry } from "@/lib/types";

export const WIN_COLOR = "oklch(0.58 0.17 145)";
export const LOSS_COLOR = "oklch(0.58 0.22 25)";
export const BE_COLOR = "oklch(0.70 0.16 72)";

/** Alpha-blend a colour toward transparent — works for oklch() strings. `pct` 0–100. */
export const alpha = (c: string, pct: number) => `color-mix(in oklch, ${c} ${pct}%, transparent)`;

/** The colour that stands for a trade's outcome. */
export function resultColor(t: TradeJournalEntry): string {
  return t.result === "win" ? WIN_COLOR : t.result === "loss" ? LOSS_COLOR : BE_COLOR;
}

/** Net R for a day/period gets its own colour — flat reads as break-even. */
export function netRColor(r: number): string {
  return r > 0 ? WIN_COLOR : r < 0 ? LOSS_COLOR : BE_COLOR;
}

/**
 * Trades in the order they were taken — earliest first, so the leftmost band
 * is the day's first trade.
 *
 * `date_time` carries the date only; the clock time lives in `execution_time`,
 * so sorting on the date alone left same-day trades in whatever order the
 * database returned them. Trades without a logged time sort after the timed
 * ones, oldest row first, since that is the only ordering we actually know.
 */
function orderKey(t: TradeJournalEntry): string {
  return `${t.date_time.slice(0, 10)}T${t.execution_time || "99:99"}|${t.created_at ?? ""}`;
}

export function inOrder(trades: TradeJournalEntry[]): TradeJournalEntry[] {
  return [...trades].sort((a, b) => orderKey(a).localeCompare(orderKey(b)));
}

/**
 * Hard-stop gradient: one equal band per trade, in the order taken. A day with
 * a break-even and a loss reads as half amber, half red — a mixed day can never
 * be mistaken for a single outcome.
 */
export function resultBands(trades: TradeJournalEntry[], pct: number): string | undefined {
  if (trades.length === 0) return undefined;
  const stops = inOrder(trades).flatMap((t, i) => {
    const c = alpha(resultColor(t), pct);
    return [
      `${c} ${((i / trades.length) * 100).toFixed(3)}%`,
      `${c} ${(((i + 1) / trades.length) * 100).toFixed(3)}%`,
    ];
  });
  return `linear-gradient(90deg, ${stops.join(", ")})`;
}
