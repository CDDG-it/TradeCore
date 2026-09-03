/**
 * Confluence performance — which of the trader's own setups actually pay.
 *
 * Every trade carries the confluences that justified it, and the library is
 * curated in My Edge, but nothing measured them until now. This groups the
 * journal by confluence and scores each one.
 *
 * The headline metric is expectancy (R per trade), not win rate: a setup that
 * wins 40% of the time at 3R is worth more than one that wins 60% at 1R, and
 * ranking on win rate alone would recommend the wrong one. Win rate is still
 * reported, it just is not what the list is sorted by.
 */
import { tradeR } from "@/lib/journal/weeks";
import type { TradeJournalEntry } from "@/lib/types";

/** Below this many trades a confluence is not evidence, it is an anecdote. */
export const CONFLUENCE_MIN_SAMPLE = 5;

export interface ConfluenceStat {
  /** Display label, as first written by the trader. */
  name: string;
  trades: number;
  wins: number;
  losses: number;
  /** 0–100, over decisive trades only (break-evens excluded from the rate). */
  winRate: number;
  /** Sum of R across every trade carrying this confluence. */
  totalR: number;
  /** R per trade — the number that decides whether a setup is worth taking. */
  expectancy: number;
  /** True when the sample is too small to draw a conclusion from. */
  thin: boolean;
}

export function computeConfluenceStats(
  trades: TradeJournalEntry[],
  minSample: number = CONFLUENCE_MIN_SAMPLE
): ConfluenceStat[] {
  const acc = new Map<
    string,
    { name: string; trades: number; wins: number; losses: number; totalR: number }
  >();

  for (const t of trades) {
    // Group case-insensitively so a one-off typed straight onto a trade lands
    // with its library counterpart; display the form first written.
    const seen = new Set<string>();
    for (const raw of t.confluences ?? []) {
      const name = (raw ?? "").trim();
      if (!name) continue;
      const key = name.toLowerCase();
      // One trade counts once per confluence, even if it was listed twice.
      if (seen.has(key)) continue;
      seen.add(key);

      const row = acc.get(key) ?? { name, trades: 0, wins: 0, losses: 0, totalR: 0 };
      row.trades += 1;
      if (t.result === "win") row.wins += 1;
      else if (t.result === "loss") row.losses += 1;
      row.totalR += tradeR(t);
      acc.set(key, row);
    }
  }

  const round2 = (n: number) => Math.round(n * 100) / 100;

  return [...acc.values()]
    .map((d) => {
      const decisive = d.wins + d.losses;
      return {
        name: d.name,
        trades: d.trades,
        wins: d.wins,
        losses: d.losses,
        winRate: decisive > 0 ? Math.round((d.wins / decisive) * 100) : 0,
        totalR: round2(d.totalR),
        expectancy: round2(d.totalR / d.trades),
        thin: d.trades < minSample,
      };
    })
    // Trustworthy samples first, each group ranked by what it earns per trade,
    // so the top of the list is never an anecdote.
    .sort((a, b) =>
      a.thin !== b.thin ? Number(a.thin) - Number(b.thin) : b.expectancy - a.expectancy
    );
}
