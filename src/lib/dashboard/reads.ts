/**
 * The dashboard's reads: everything the desk shows, in one round of queries.
 *
 * Runs on the server (the dashboard page renders with its data already in the
 * HTML) but takes the client as a parameter, so it works with either Supabase
 * client. RLS scopes every row to the signed-in user whichever one is used.
 *
 * Two things keep it small:
 *   • Column lists. The desk never opens a trade, so it never needs the
 *     screenshots, notes or market context that make a trade row heavy; an
 *     analysis is only ever matched by id and date; a best-trade row only
 *     says which day it was logged on.
 *   • A date floor. The mind score, the win rate and the week strip look at
 *     this month at most; goals reach back to their own start. Nothing before
 *     the earliest of those is fetched, so a long journal costs nothing here.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { startOfMonth, startOfWeek, subDays } from "date-fns";
import { localDayKey } from "@/lib/dates";
import { columns } from "@/lib/supabase/columns";
import type {
  TradeJournalEntry, FundedAccount, Habit, HabitCompletion, PreTradeAnalysis,
  BestTradeOfDay, WeeklyTradeReview, CommitmentAdherenceLog, TradingGoal,
} from "@/lib/types";

/* Each list below is declared through `columns<T>()`, which derives the row
   type from the column names. Before, these were plain strings cast to the
   full domain type, so the result claimed every field while carrying a third
   of them: a component reading `execution_notes` off a dashboard trade
   compiled happily and found `undefined` at runtime. Now the omission is
   checked.

   `created_at` rides along on the three date-keyed lists. It is eight bytes and
   it is what the mind score needs to place a row in time, so fetching it is
   cheaper than maintaining a second set of types for rows without it. */

/** Every trade column except the writing: this is exactly `TradeSummary`, so
 *  the desk's rows and the app's shared trade type are the same shape. The
 *  fields left out are the four prose ones, the screenshots and the market
 *  context, which together are nearly all of a trade row's weight. */
const TRADES = columns<TradeJournalEntry>()(
  "id", "user_id", "date_time", "instrument", "market", "session", "timeframe",
  "direction", "confluences", "rr", "result", "execution_time", "execution_end_time",
  "execution_quality", "linked_analysis_id", "discipline", "created_at",
);
const COMPLETIONS = columns<HabitCompletion>()("id", "habit_id", "date", "completed");
const ANALYSES = columns<PreTradeAnalysis>()("id", "date", "created_at");
const BEST_TRADES = columns<BestTradeOfDay>()("id", "date", "created_at");
const WEEKLY_REVIEWS = columns<WeeklyTradeReview>()("id", "week_start", "created_at");
const ADHERENCE = columns<CommitmentAdherenceLog>()("id", "date", "followed", "created_at");

export type DashboardTradeRow = typeof TRADES.row;
export type DashboardCompletionRow = typeof COMPLETIONS.row;
export type DashboardAnalysisRow = typeof ANALYSES.row;
export type DashboardBestTradeRow = typeof BEST_TRADES.row;
export type DashboardWeeklyReviewRow = typeof WEEKLY_REVIEWS.row;
export type DashboardAdherenceRow = typeof ADHERENCE.row;

export interface DashboardData {
  /** Trades from `from` onward, newest first. Text and screenshot fields are absent. */
  trades: DashboardTradeRow[];
  accounts: FundedAccount[];
  habits: Habit[];
  /** Completions from `from` onward. */
  completions: DashboardCompletionRow[];
  /** Every analysis, id and date only. */
  analyses: DashboardAnalysisRow[];
  bestTrades: DashboardBestTradeRow[];
  weeklyReviews: DashboardWeeklyReviewRow[];
  adherenceLogs: DashboardAdherenceRow[];
  goals: TradingGoal[];
  firstName: string | null;
  /** The first day (yyyy-MM-dd) the trades and completions cover. */
  from: string;
  /** The day this was read, on the server's clock. The browser takes over
   *  from its own clock straight after hydration. */
  today: string;
}

type Rows = PromiseLike<{ data: unknown; error: unknown }>;

/** Fail-soft reads: a table that has not been migrated yet reads as empty. */
async function soft<T>(q: Rows): Promise<T[]> {
  const { data, error } = await q;
  return error ? [] : ((data ?? []) as T[]);
}

async function strict<T>(q: Rows): Promise<T[]> {
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as T[];
}

export async function readDashboard(supabase: SupabaseClient, now: Date = new Date()): Promise<DashboardData> {
  // The goals decide how far back the trades have to reach, so they go first;
  // the small per-user tables ride along in the same round trip.
  const [goals, habits, accounts, profile] = await Promise.all([
    soft<TradingGoal>(supabase.from("trading_goals").select("*").order("end_date", { ascending: false })),
    strict<Habit>(supabase.from("habits").select("*").order("created_at", { ascending: true })),
    strict<FundedAccount>(supabase.from("funded_accounts").select("*").order("updated_at", { ascending: false })),
    supabase.from("profiles").select("full_name").maybeSingle(),
  ]);

  // A day of slack either side: this runs on a server clock that may be a
  // few hours off the trader's, and the browser draws the real windows.
  const floors = [startOfMonth(now), startOfWeek(now, { weekStartsOn: 1 })].map(localDayKey);
  for (const g of goals) if (!g.archived_at) floors.push(g.start_date);
  const from = localDayKey(subDays(new Date(floors.sort()[0] + "T12:00:00"), 1));

  const [trades, completions, analyses, bestTrades, weeklyReviews, adherenceLogs] = await Promise.all([
    strict<DashboardTradeRow>(
      supabase.from("trades").select(TRADES.select).gte("date_time", from).order("date_time", { ascending: false })
    ),
    // Scoped through the habits the user owns, so the filter is on habit ids.
    habits.length === 0
      ? Promise.resolve([] as DashboardCompletionRow[])
      : strict<DashboardCompletionRow>(
          supabase.from("habit_completions").select(COMPLETIONS.select)
            .in("habit_id", habits.map((h) => h.id)).gte("date", from)
        ),
    strict<DashboardAnalysisRow>(supabase.from("analyses").select(ANALYSES.select)),
    soft<DashboardBestTradeRow>(supabase.from("best_trade_of_day").select(BEST_TRADES.select).gte("date", from)),
    soft<DashboardWeeklyReviewRow>(supabase.from("weekly_trade_reviews").select(WEEKLY_REVIEWS.select).gte("week_start", from)),
    soft<DashboardAdherenceRow>(supabase.from("commitment_adherence_log").select(ADHERENCE.select).gte("date", from)),
  ]);

  const fullName = (profile.data as { full_name?: string | null } | null)?.full_name ?? null;

  return {
    trades, accounts, habits, completions, analyses, bestTrades, weeklyReviews, adherenceLogs, goals,
    firstName: fullName ? fullName.split(" ")[0] : null,
    from,
    today: localDayKey(now),
  };
}
