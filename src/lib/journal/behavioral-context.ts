import { format, startOfWeek, subDays, subWeeks } from "date-fns";
import { frequencyApplies } from "@/lib/habits";
import { isDayReviewed } from "@/lib/post-market/day-overview";
import { buildTradingSessions, type TradingSession } from "@/lib/journal/behavioral-analytics";
import type { BestTradeOfDay, Habit, HabitCompletion, PreMarketExercise, TradeJournalEntry, TradeRuleCheck, WeeklyTradeReview } from "@/lib/types";

export type Signal = "yes" | "no" | "unknown";
export type ResponseDay = {
  id: string;
  date: string;
  accountId: string | null;
  tradeId: string;
  result: TradeJournalEntry["result"];
  previousResult: TradeJournalEntry["result"] | null;
  previousStreak: number;
  rules: Signal;
  habits: Signal;
  habitDone: number;
  habitExpected: number;
  weeklyReview: Signal;
  preMarket: Signal;
  yesterdayRecap: Signal;
};

type Inputs = {
  trades: TradeJournalEntry[];
  ruleChecks: TradeRuleCheck[];
  habits: Habit[];
  habitCompletions: HabitCompletion[];
  weeklyReviews: WeeklyTradeReview[];
  exercises: PreMarketExercise[];
  recaps: Pick<BestTradeOfDay, "date" | "review_step" | "taken_was_best" | "notes" | "post_market_analysis" | "updated_at">[];
};

const dayDate = (date: string) => new Date(`${date}T12:00:00`);
const dayKey = (date: Date) => format(date, "yyyy-MM-dd");

function rulesFor(session: TradingSession): Signal {
  if (session.trades.some((row) => row.rules.some((rule) => !rule.passed))) return "no";
  if (session.trades.every((row) => row.rules.length > 0)) return "yes";
  return "unknown";
}

/** A completed record only counts when it was saved before the trading day. */
function savedBefore(timestamp: string | null | undefined, date: string): boolean {
  return Boolean(timestamp && !Number.isNaN(Date.parse(timestamp)) && timestamp < `${date}T00:00:00`);
}

export function buildResponseDays({ trades, ruleChecks, habits, habitCompletions, weeklyReviews, exercises, recaps }: Inputs): ResponseDay[] {
  const sessions = buildTradingSessions(trades, ruleChecks);
  const done = new Set(habitCompletions.filter((row) => row.completed).map((row) => `${row.habit_id}|${row.date}`));
  const reviews = new Map(weeklyReviews.map((row) => [row.week_start, row]));
  const pre = new Map(exercises.filter((row) => row.completed_at).map((row) => [row.date, row]));
  const recap = new Map(recaps.map((row) => [row.date, row]));
  const byAccount = new Map<string, TradingSession[]>();
  for (const session of sessions) {
    const key = session.accountId ?? "unlinked";
    byAccount.set(key, [...(byAccount.get(key) ?? []), session]);
  }
  const rows: ResponseDay[] = [];
  for (const accountSessions of byAccount.values()) {
    const ordered = [...accountSessions].sort((a, b) => a.date.localeCompare(b.date));
    for (let index = 0; index < ordered.length; index++) {
      const session = ordered[index];
      const previous = ordered[index - 1];
      const date = session.date;
      const calendarDay = dayDate(date);
      const priorWeek = dayKey(startOfWeek(subWeeks(calendarDay, 1), { weekStartsOn: 1 }));
      const review = reviews.get(priorWeek);
      const due = habits.filter((habit) => {
        const created = habit.created_at?.slice(0, 10);
        return created && created <= date && frequencyApplies(habit.frequency, calendarDay.getDay());
      });
      const completed = due.filter((habit) => done.has(`${habit.id}|${date}`)).length;
      const yesterday = dayKey(subDays(calendarDay, 1));
      const hadTradeYesterday = ordered.some((candidate) => candidate.date === yesterday);
      const yesterdayRow = recap.get(yesterday);
      const exercise = pre.get(date);
      let previousStreak = 0;
      if (previous && (previous.trades.length === 1 || previous.orderReliable) && previous.trades.length) {
        const previousResult = previous.trades.at(-1)?.trade.result;
        if (previousResult === "win" || previousResult === "loss") {
          for (let cursor = index - 1; cursor >= 0; cursor--) {
            const candidate = ordered[cursor];
            if ((candidate.trades.length > 1 && !candidate.orderReliable) || candidate.trades.at(-1)?.trade.result !== previousResult) break;
            previousStreak++;
          }
        }
      }
      const first = session.trades[0];
      if (!first) continue;
      rows.push({
        id: session.id,
        date,
        accountId: session.accountId,
        tradeId: first.trade.id,
        result: session.trades.at(-1)?.trade.result ?? first.trade.result,
        previousResult: previous && (previous.trades.length === 1 || previous.orderReliable) ? previous.trades.at(-1)?.trade.result ?? null : null,
        previousStreak,
        rules: rulesFor(session),
        habits: due.length ? completed === due.length ? "yes" : "no" : "unknown",
        habitDone: completed,
        habitExpected: due.length,
        weeklyReview: review ? (savedBefore(review.updated_at, date) && Boolean(review.mistakes.trim() || review.lessons.trim() || review.prevention_plan.trim()) ? "yes" : "unknown") : "no",
        preMarket: exercise ? "yes" : "no",
        yesterdayRecap: !hadTradeYesterday && !yesterdayRow ? "unknown" : yesterdayRow && isDayReviewed(yesterdayRow) ? (savedBefore(yesterdayRow.updated_at, date) ? "yes" : "unknown") : "no",
      });
    }
  }
  return rows.sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
}

export function adherence(rows: ResponseDay[]): { kept: number; assessed: number; rate: number | null } {
  const assessed = rows.filter((row) => row.rules !== "unknown");
  const kept = assessed.filter((row) => row.rules === "yes").length;
  return { kept, assessed: assessed.length, rate: assessed.length ? Math.round(100 * kept / assessed.length) : null };
}
