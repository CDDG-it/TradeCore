/**
 * Psychological Edge — turns the raw journal + day-after-loss protocol entries
 * into the handful of numbers that show whether a trader actually trades
 * differently after a losing day.
 *
 * P&L is measured in R (the unit the whole app already tracks), summed per
 * trading day. A "loss day" is any trading day with net R < 0; a
 * "day-after-loss" is a trading day whose previous trading day was a loss.
 */
import { tradeR } from "@/lib/journal/weeks";
import type { TradeJournalEntry, DailyEdge } from "@/lib/types";

const dayKey = (t: TradeJournalEntry) => t.date_time.slice(0, 10);

/** Net R per trading day (only days that actually have trades). */
export function dayNetR(trades: TradeJournalEntry[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const t of trades) {
    const k = dayKey(t);
    map.set(k, (map.get(k) ?? 0) + tradeR(t));
  }
  return map;
}

export type PriorOutcome = "loss" | "breakeven" | "win";

/** The most recent trading day strictly before `today`, and its outcome. */
export function detectPriorDay(
  trades: TradeJournalEntry[],
  today: string
): { date: string; netR: number; outcome: PriorOutcome } | null {
  const map = dayNetR(trades);
  const prior = [...map.keys()].filter((d) => d < today).sort();
  if (prior.length === 0) return null;
  const date = prior[prior.length - 1];
  const netR = map.get(date)!;
  const outcome: PriorOutcome = netR < 0 ? "loss" : netR > 0 ? "win" : "breakeven";
  return { date, netR, outcome };
}

export interface EdgeInsights {
  tradingDays: number;
  /** Chart/insights meaningfully unlock after ~20 trading days. */
  ready: boolean;
  /** Number of day-after-loss days that have any protocol entry. */
  trackedDayAfterLoss: number;

  avgRDayAfterLoss: number | null;
  avgROther: number | null;

  /** % of tracked day-after-loss days where an extra trade or size-up happened. */
  pctExtraOrSizedUp: number | null;

  /** Average trading days to earn back a loss day's damage. */
  avgDaysToRecovery: number | null;

  /** % of tracked day-after-loss days where the daily rule was followed. */
  pctRuleFollowed: number | null;
  avgRWhenFollowed: number | null;
  avgRWhenNotFollowed: number | null;
}

const mean = (xs: number[]): number | null =>
  xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null;

export function computeEdgeInsights(
  trades: TradeJournalEntry[],
  edges: DailyEdge[]
): EdgeInsights {
  const map = dayNetR(trades);
  const days = [...map.keys()].sort();
  const tradingDays = days.length;

  // Split trading days into day-after-loss vs the rest.
  const dayAfterLoss = new Set<string>();
  for (let i = 1; i < days.length; i++) {
    if ((map.get(days[i - 1]) ?? 0) < 0) dayAfterLoss.add(days[i]);
  }
  const dalR = days.filter((d) => dayAfterLoss.has(d)).map((d) => map.get(d)!);
  const otherR = days.filter((d) => !dayAfterLoss.has(d)).map((d) => map.get(d)!);

  // Days to recover each loss day's damage from subsequent trading days.
  const recoveries: number[] = [];
  for (let i = 0; i < days.length; i++) {
    const loss = map.get(days[i])!;
    if (loss >= 0) continue;
    let regained = 0;
    let count = 0;
    for (let j = i + 1; j < days.length; j++) {
      regained += map.get(days[j])!;
      count += 1;
      if (regained >= -loss) {
        recoveries.push(count);
        break;
      }
    }
  }

  // Protocol entries on day-after-loss days.
  const tracked = edges.filter((e) => e.yesterday_loss);
  const ruleTracked = tracked.filter((e) => e.rule_followed != null);
  const followed = ruleTracked.filter((e) => e.rule_followed === "ja");
  const notFollowed = ruleTracked.filter((e) => e.rule_followed !== "ja");
  const rOf = (e: DailyEdge) => map.get(e.date);

  const pct = (num: number, den: number): number | null =>
    den ? Math.round((num / den) * 100) : null;

  return {
    tradingDays,
    ready: tradingDays >= 20,
    trackedDayAfterLoss: tracked.length,
    avgRDayAfterLoss: mean(dalR),
    avgROther: mean(otherR),
    pctExtraOrSizedUp: tracked.length
      ? pct(tracked.filter((e) => e.triggered_extra || e.sized_up).length, tracked.length)
      : null,
    avgDaysToRecovery: mean(recoveries),
    pctRuleFollowed: ruleTracked.length ? pct(followed.length, ruleTracked.length) : null,
    avgRWhenFollowed: mean(followed.map(rOf).filter((r): r is number => r != null)),
    avgRWhenNotFollowed: mean(notFollowed.map(rOf).filter((r): r is number => r != null)),
  };
}
