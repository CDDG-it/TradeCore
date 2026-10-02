/**
 * The shared unit of the analytics page: a group of trades scored by what it
 * earns per trade.
 *
 * Every breakdown on /analytics (hour of day, weekday x session, trade number,
 * hold time, confluence stacking) is the same question asked of a different
 * slice: "when I trade like this, what do I make per trade?" This is that
 * question, answered once.
 *
 * Expectancy (R per trade) is the headline on purpose. Win rate alone rewards
 * small, frequent winners; R per trade is what actually compounds.
 */
import { tradeR, winRateOf } from "@/lib/journal/weeks";
import type { TradeSummary } from "@/lib/types";

/** Below this many trades a group is an anecdote, not evidence. */
export const EDGE_MIN_SAMPLE = 5;

export interface EdgeBucket {
  key: string;
  label: string;
  trades: number;
  wins: number;
  losses: number;
  /** 0-100 over decisive trades, null when nothing was decisive. */
  winRate: number | null;
  totalR: number;
  /** R per trade. 0 for an empty bucket. */
  expectancy: number;
  /** True when the sample is too small to draw a conclusion from. */
  thin: boolean;
}

export const round2 = (n: number) => Math.round(n * 100) / 100;

/** Score one group of trades. */
export function scoreBucket(
  key: string,
  label: string,
  trades: Pick<TradeSummary, "result" | "rr">[],
  minSample: number = EDGE_MIN_SAMPLE
): EdgeBucket {
  const wins = trades.filter((t) => t.result === "win").length;
  const losses = trades.filter((t) => t.result === "loss").length;
  const totalR = trades.reduce((s, t) => s + tradeR(t), 0);
  return {
    key,
    label,
    trades: trades.length,
    wins,
    losses,
    winRate: winRateOf(wins, losses),
    totalR: round2(totalR),
    expectancy: trades.length ? round2(totalR / trades.length) : 0,
    thin: trades.length < minSample,
  };
}

/**
 * Group trades by a key and score each group, in a fixed display order.
 * `order` lists every key with its label; keys without trades still come back
 * as empty buckets so a chart keeps its axis.
 */
export function bucketize<T extends Pick<TradeSummary, "result" | "rr">>(
  trades: T[],
  keyOf: (t: T) => string | null,
  order: { key: string; label: string }[],
  minSample: number = EDGE_MIN_SAMPLE
): EdgeBucket[] {
  const groups = new Map<string, T[]>();
  for (const t of trades) {
    const k = keyOf(t);
    if (k === null) continue;
    const list = groups.get(k);
    if (list) list.push(t);
    else groups.set(k, [t]);
  }
  return order.map(({ key, label }) => scoreBucket(key, label, groups.get(key) ?? [], minSample));
}

/** The best and worst buckets that are actually evidence. */
export function extremes(buckets: EdgeBucket[]): { best: EdgeBucket | null; worst: EdgeBucket | null } {
  const solid = buckets.filter((b) => !b.thin && b.trades > 0);
  if (solid.length === 0) return { best: null, worst: null };
  const sorted = [...solid].sort((a, b) => b.expectancy - a.expectancy);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  // With one solid bucket there is no "worst", only a lone result.
  return { best, worst: worst === best ? null : worst };
}

/** "+0.42R" / "−0.30R" / "0.00R", with a real minus sign. */
export function formatR(r: number, digits = 2): string {
  if (r > 0) return `+${r.toFixed(digits)}R`;
  if (r < 0) return `−${Math.abs(r).toFixed(digits)}R`;
  return `${(0).toFixed(digits)}R`;
}
