import { tradeR } from "@/lib/journal/weeks";
import type { BestTradeOfDay, TradeJournalEntry, TradeSummary } from "@/lib/types";

/**
 * One trading day of a weekly review, read back from what was already written
 * that day: the journal's mistakes and lessons per trade, the execution rating,
 * and the Post Market verdict on whether a winning trade was there to take.
 * Nothing here is entered twice; the week's reflection is where it gets summed up.
 */

type BestTradeRow = Pick<BestTradeOfDay, "taken_was_best" | "notes" | "post_market_analysis">;

export type DayOutcome = "win" | "loss" | "be" | null;
/** All rated trades good / some good, some bad / all bad / nothing rated. */
export type DayExecution = "good" | "mixed" | "bad" | null;
/** The best trade of the day was the one taken / was logged as missed / not reviewed. */
export type DayOpportunity = "taken" | "missed" | "none";

export interface DayRecap {
  date: string;
  trades: { id: string; instrument: string; r: number }[];
  outcome: DayOutcome;
  r: number;
  mistakes: string[];
  lessons: string[];
  execution: DayExecution;
  goodExec: number;
  ratedExec: number;
  opportunity: DayOpportunity;
  /** Why the missed trade was the better one, from the Post Market review. */
  opportunityNote: string;
}

/** A day's Post Market review counts as a "missed winner" only once words are written. */
export function bestTradeLogged(best: BestTradeRow | undefined): boolean {
  return Boolean(
    best && !best.taken_was_best &&
      ((best.post_market_analysis ?? "").trim() || (best.notes ?? "").trim())
  );
}

function uniqueText(values: (string | undefined)[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of values) {
    const text = (raw ?? "").trim();
    const key = text.toLowerCase();
    if (!text || seen.has(key)) continue;
    seen.add(key);
    out.push(text);
  }
  return out;
}

export function buildDayRecaps(
  days: { date: string; trades: TradeSummary[] }[],
  tradesById: Map<string, TradeJournalEntry>,
  bestByDay: Record<string, BestTradeRow>
): DayRecap[] {
  return days.map(({ date, trades }) => {
    const full = trades.map((t) => tradesById.get(t.id)).filter((t): t is TradeJournalEntry => Boolean(t));
    const r = trades.reduce((s, t) => s + tradeR(t), 0);
    const outcome: DayOutcome = trades.length === 0 ? null : r > 0 ? "win" : r < 0 ? "loss" : "be";

    const goodExec = trades.filter((t) => t.execution_quality === "good").length;
    const ratedExec = goodExec + trades.filter((t) => t.execution_quality === "bad").length;
    const execution: DayExecution =
      ratedExec === 0 ? null : goodExec === ratedExec ? "good" : goodExec === 0 ? "bad" : "mixed";

    const best = bestByDay[date];
    const opportunity: DayOpportunity = best?.taken_was_best ? "taken" : bestTradeLogged(best) ? "missed" : "none";
    const opportunityNote =
      opportunity === "missed" ? ((best?.notes ?? "").trim() || (best?.post_market_analysis ?? "").trim()) : "";

    return {
      date,
      trades: trades.map((t) => ({ id: t.id, instrument: t.instrument, r: tradeR(t) })),
      outcome,
      r,
      mistakes: uniqueText(full.map((t) => t.mistakes)),
      lessons: uniqueText(full.map((t) => t.lessons)),
      execution,
      goodExec,
      ratedExec,
      opportunity,
      opportunityNote,
    };
  });
}

export interface WeekRecapSummary {
  /** Days whose rated trades were all executed well. */
  goodDays: number;
  /** Days with at least one rated trade. */
  ratedDays: number;
  missed: number;
  /** Days with trades that have no Post Market verdict yet. */
  unreviewed: number;
}

export function summarizeDayRecaps(recaps: DayRecap[]): WeekRecapSummary {
  return {
    goodDays: recaps.filter((d) => d.execution === "good").length,
    ratedDays: recaps.filter((d) => d.execution !== null).length,
    missed: recaps.filter((d) => d.opportunity === "missed").length,
    unreviewed: recaps.filter((d) => d.trades.length > 0 && d.opportunity === "none").length,
  };
}
