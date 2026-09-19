import { addDays, format, startOfWeek } from "date-fns";
import type { DashboardData } from "@/lib/dashboard/reads";
import type { FundedAccount, Habit, HabitCompletion, TradeJournalEntry, TradingGoal } from "@/lib/types";

/**
 * One illustrative trading week, dated relative to `now` so it always lands in
 * the current week. Shared by the public homepage sample and the dev-only
 * `/preview/dashboard` route, so both show the same desk.
 */
const discipline = {
  followed_plan: true, traded_in_session: true, respected_risk: true,
  respected_max_trades: true, matched_a_plus: true, no_impulsive_entry: true,
  no_revenge_trade: true, respected_stop_loss: true, journal_completed: true,
  score: 89, notes: "Waited for the planned level.",
};

function trade(id: string, day: string, stamp: string, result: TradeJournalEntry["result"], rr: number, quality: "good" | "bad"): TradeJournalEntry {
  return {
    id, user_id: "sample", date_time: day, instrument: "ES", market: "futures", session: "New York",
    timeframe: "15m", direction: "long", confluences: ["Planned level"], rr, result,
    screenshot_groups: [], execution_notes: "Sample journal entry", psychology_notes: "", mistakes: "", lessons: "",
    execution_quality: quality, discipline: { ...discipline, score: quality === "good" ? 89 : 61 },
    created_at: stamp, updated_at: stamp,
  };
}

function account(id: string, firm: string, name: string, size: number, balance: number, stamp: string): FundedAccount {
  return {
    id, user_id: "sample", firm_name: firm, account_name: name, account_type: "Evaluation", phase: "funded",
    account_size: size, purchase_cost: 149, start_balance: size, current_balance: balance,
    roi: Math.round(((balance - size) / 149) * 100), max_drawdown: size * 0.04, drawdown_used: 620,
    payout_total: 0, next_payout_target: size * 1.06, status: "active", notes: "",
    created_at: stamp, updated_at: stamp,
  };
}

export function sampleDashboardData(now: Date): DashboardData {
  const monday = startOfWeek(now, { weekStartsOn: 1 });
  const day = (offset: number) => format(addDays(monday, offset), "yyyy-MM-dd");
  const stamp = `${day(3)}T12:00:00`;
  const monthStart = format(addDays(monday, -21), "yyyy-MM-dd");

  const trades = [
    trade("sample-mon", day(0), stamp, "win", 1.8, "good"),
    trade("sample-tue", day(1), stamp, "loss", 1, "bad"),
    trade("sample-wed", day(2), stamp, "win", 2.3, "good"),
    trade("sample-thu", day(3), stamp, "win", 1.4, "good"),
  ];
  const habits: Habit[] = [
    { id: "plan", user_id: "sample", name: "Write the session plan", category: "routine", frequency: "weekdays", target_days: 5, color: "#14b8a6", icon: "", created_at: `${monthStart}T12:00:00`, updated_at: stamp },
    { id: "review", user_id: "sample", name: "Review the last trade", category: "review", frequency: "weekdays", target_days: 5, color: "#06b6d4", icon: "", created_at: `${monthStart}T12:00:00`, updated_at: stamp },
    { id: "pause", user_id: "sample", name: "Pause after a loss", category: "mindset", frequency: "weekdays", target_days: 5, color: "#14b8a6", icon: "", created_at: `${monthStart}T12:00:00`, updated_at: stamp },
  ];
  const today = format(now, "yyyy-MM-dd");
  const completions: HabitCompletion[] = [
    ...[0, 1, 2, 3].map((offset) => ({ id: `plan-${offset}`, habit_id: "plan", date: day(offset), completed: true })),
    ...[0, 2, 3].map((offset) => ({ id: `review-${offset}`, habit_id: "review", date: day(offset), completed: true })),
    ...[1, 3].map((offset) => ({ id: `pause-${offset}`, habit_id: "pause", date: day(offset), completed: true })),
    // Today's routine is done, whichever weekday the preview is opened on.
    ...["plan", "review", "pause"].map((habit) => ({ id: `${habit}-today`, habit_id: habit, date: today, completed: true })),
  ].filter((row, index, rows) => rows.findIndex((other) => other.habit_id === row.habit_id && other.date === row.date) === index);
  const goals: TradingGoal[] = [{
    id: "sample-goal", user_id: "sample", title: "Follow the entry plan", metric: "execution_rate",
    baseline: 50, target: 85, start_date: monthStart, end_date: format(addDays(monday, 13), "yyyy-MM-dd"),
    created_at: stamp, updated_at: stamp,
  }];
  const accounts = [
    account("sample-acct-1", "Topstep", "50K Combine", 50000, 52840 - 25000, stamp),
    account("sample-acct-2", "Apex", "25K Eval", 25000, 25000, stamp),
  ];

  return {
    trades, accounts, habits, completions, goals,
    analyses: [], bestTrades: [], weeklyReviews: [], adherenceLogs: [],
    firstName: "Alex",
    from: monthStart,
    today,
  };
}
