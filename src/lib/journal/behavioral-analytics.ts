import { minutesOfDay } from "@/lib/journal/time-stats";
import { ruleAssessmentsByTrade, type RuleCheckRow } from "@/lib/journal/rule-stats";
import type { TradeJournalEntry } from "@/lib/types";

export type ResponseContext = "after-loss" | "after-win" | "other" | "unknown";
export type AssessedTrade = { trade: TradeJournalEntry; rules: { label: string; passed: boolean }[]; context: ResponseContext };
export type Adherence = { assessed: number; kept: number; broken: number; unassessed: number; rate: number | null };
export type TradingSession = { id: string; date: string; accountId: string | null; trades: AssessedTrade[]; orderReliable: boolean; firstBreachIndex: number | null };
export type DayTransition = { date: string; accountId: string | null; current: AssessedTrade; previous: AssessedTrade; previousDate: string; previousResult: TradeJournalEntry["result"] };

const groupKey = (trade: TradeJournalEntry) => `${trade.date_time.slice(0, 10)}|${trade.funded_account_id ?? "unlinked"}`;

/** Rule outcomes are about the recorded checks only. No check means unknown, never kept. */
export function summarizeAdherence(rows: AssessedTrade[]): Adherence {
  const assessed = rows.filter((row) => row.rules.length > 0);
  const kept = assessed.filter((row) => row.rules.every((rule) => rule.passed)).length;
  const broken = assessed.length - kept;
  return { assessed: assessed.length, kept, broken, unassessed: rows.length - assessed.length, rate: assessed.length ? Math.round(kept / assessed.length * 100) : null };
}

/**
 * A response is only attributed when every trade in that account/day has a
 * unique entry time, and the previous trade closed before the next entry.
 * Missing or overlapping timestamps cannot establish what happened "after".
 */
export function buildTradingSessions(trades: TradeJournalEntry[], checks: RuleCheckRow[] = []): TradingSession[] {
  const assessments = ruleAssessmentsByTrade(trades, checks);
  const groups = new Map<string, TradeJournalEntry[]>();
  for (const trade of trades) groups.set(groupKey(trade), [...(groups.get(groupKey(trade)) ?? []), trade]);

  return [...groups].map(([id, group]) => {
    const timed = group.map((trade) => ({ trade, start: minutesOfDay(trade.execution_time) }));
    const starts = timed.map((entry) => entry.start);
    const orderReliable = starts.every((start) => start !== null) && new Set(starts).size === starts.length;
    timed.sort((a, b) => (a.start ?? Infinity) - (b.start ?? Infinity) || a.trade.created_at.localeCompare(b.trade.created_at));
    const rows: AssessedTrade[] = timed.map(({ trade, start }, index) => {
      let context: ResponseContext = "unknown";
      if (orderReliable) {
        if (index === 0) context = "other";
        else {
          const previous = timed[index - 1];
          const priorExit = minutesOfDay(previous.trade.execution_end_time);
          if (priorExit !== null && start !== null && priorExit < start) {
            context = previous.trade.result === "loss" ? "after-loss" : previous.trade.result === "win" ? "after-win" : "other";
          }
        }
      }
      return { trade, rules: assessments.get(trade.id) ?? [], context };
    });
    const firstBreachIndex = orderReliable ? rows.findIndex((row) => row.rules.some((rule) => !rule.passed)) : -1;
    return {
      id,
      date: group[0].date_time.slice(0, 10),
      accountId: group[0].funded_account_id ?? null,
      trades: rows,
      orderReliable,
      firstBreachIndex: firstBreachIndex < 0 ? null : firstBreachIndex,
    };
  }).sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
}

export function flattenSessions(sessions: TradingSession[]): AssessedTrade[] {
  return sessions.flatMap((session) => session.trades);
}

/**
 * Compare the first decision of a trading day with the last closed decision
 * on that account's previous recorded trading day. A one-trade day needs no
 * intraday clock to establish its first/last trade. Multi-trade days do.
 * The caller filters target dates afterwards, so the prior day can sit just
 * outside the selected display period.
 */
export function buildDayTransitions(sessions: TradingSession[]): DayTransition[] {
  const byAccount = new Map<string, TradingSession[]>();
  for (const session of sessions) {
    const key = session.accountId ?? "unlinked";
    byAccount.set(key, [...(byAccount.get(key) ?? []), session]);
  }
  const transitions: DayTransition[] = [];
  for (const accountSessions of byAccount.values()) {
    const ordered = [...accountSessions].sort((a, b) => a.date.localeCompare(b.date));
    for (let i = 1; i < ordered.length; i++) {
      const previousDay = ordered[i - 1];
      const currentDay = ordered[i];
      if ((previousDay.trades.length > 1 && !previousDay.orderReliable) || (currentDay.trades.length > 1 && !currentDay.orderReliable)) continue;
      const previous = previousDay.trades.at(-1);
      const current = currentDay.trades[0];
      if (!previous || !current) continue;
      transitions.push({
        date: currentDay.date,
        accountId: currentDay.accountId,
        current,
        previous,
        previousDate: previousDay.date,
        previousResult: previous.trade.result,
      });
    }
  }
  return transitions.sort((a, b) => b.date.localeCompare(a.date) || (a.accountId ?? "").localeCompare(b.accountId ?? ""));
}

export function contextSummary(rows: AssessedTrade[], context: ResponseContext) {
  const matching = rows.filter((row) => row.context === context);
  const comparison = rows.filter((row) => row.context !== context && row.context !== "unknown");
  return { matching: summarizeAdherence(matching), comparison: summarizeAdherence(comparison), matchingRows: matching };
}
