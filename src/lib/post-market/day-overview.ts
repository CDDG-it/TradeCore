import type { BestTradeOfDay, RPotentialAnalysis, TradeJournalEntry } from "@/lib/types";
import { tradeR } from "@/lib/journal/weeks";

export function postMarketDates(trades: TradeJournalEntry[], reviews: Pick<BestTradeOfDay, "date">[], today: string): string[] {
  return [...new Set([today, ...trades.map((trade) => trade.date_time.slice(0, 10)), ...reviews.map((review) => review.date.slice(0, 10))])]
    .filter((date) => date <= today)
    .sort((a, b) => b.localeCompare(a));
}

export function dayOverview(trades: TradeJournalEntry[], observations: Record<string, RPotentialAnalysis>) {
  const winners = trades.filter((trade) => trade.result === "win");
  const measured = winners.flatMap((trade) => {
    const mfe = observations[trade.id]?.mfe_r;
    return mfe == null ? [] : [{ trade, mfe }];
  });
  return {
    tradeCount: trades.length,
    winnerCount: winners.length,
    netR: trades.reduce((total, trade) => total + tradeR(trade), 0),
    measuredCount: measured.length,
    measuredMfeTotal: measured.reduce((total, row) => total + row.mfe, 0),
    averageWinnerR: winners.length ? winners.reduce((total, trade) => total + tradeR(trade), 0) / winners.length : null,
    averageMfe: measured.length ? measured.reduce((total, row) => total + row.mfe, 0) / measured.length : null,
    reached2R: measured.filter((row) => row.mfe >= 2).length,
    reached25R: measured.filter((row) => row.mfe >= 2.5).length,
  };
}
