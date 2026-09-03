/**
 * All Supabase database queries. RLS enforces user_id = auth.uid() —
 * every function here is automatically scoped to the authenticated user.
 * Never import or use the service_role key in this file.
 */
import { createClient } from "@/lib/supabase/client";
import { cachedRead, invalidateReads } from "@/lib/supabase/cache";
import type {
  PreTradeAnalysis,
  PreTradeAnalysisInput,
  TradeJournalEntry,
  TradeJournalEntryInput,
  FundedAccount,
  FundedAccountInput,
  PayoutEvent,
  Habit,
  HabitCompletion,
  WeeklyReflection,
  WeeklyTradeReview,
  WeeklyTradeReviewInput,
  PsychEdgeSession,
  PsychEdgeSessionInput,
  BestTradeOfDay,
  PreMarketExercise,
  DashboardStats,
  Commitment,
  CommitmentInput,
  PatternEvent,
  PatternEventInput,
  CommitmentAdherenceLog,
  CommitmentAdherenceLogInput,
} from "@/lib/types";

function now() {
  return new Date().toISOString();
}

// ── Pre-Trade Analysis ───────────────────────────────────────────────

async function _getAnalyses(): Promise<PreTradeAnalysis[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("analyses")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PreTradeAnalysis[];
}

export async function getAnalysisById(id: string): Promise<PreTradeAnalysis | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("analyses")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data as PreTradeAnalysis;
}

export async function createAnalysis(
  input: PreTradeAnalysisInput,
  id?: string
): Promise<PreTradeAnalysis> {
  const supabase = createClient();
  invalidateReads();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const record = {
    ...(id ? { id } : {}),
    ...input,
    user_id: user.id,
    created_at: now(),
    updated_at: now(),
  };
  const { data, error } = await supabase
    .from("analyses")
    .insert(record)
    .select()
    .single();
  if (error) throw error;
  return data as PreTradeAnalysis;
}

export async function updateAnalysis(
  id: string,
  input: Partial<PreTradeAnalysisInput>
): Promise<PreTradeAnalysis> {
  const supabase = createClient();
  invalidateReads();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data, error } = await supabase
    .from("analyses")
    .update({ ...input, updated_at: now() })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();
  if (error) throw error;
  return data as PreTradeAnalysis;
}

export async function deleteAnalysis(id: string): Promise<void> {
  const supabase = createClient();
  invalidateReads();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase.from("analyses").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw error;
}

// ── Trade Journal ────────────────────────────────────────────────────

async function _getTrades(): Promise<TradeJournalEntry[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("trades")
    .select("*")
    .order("date_time", { ascending: false });
  if (error) throw error;
  return (data ?? []) as TradeJournalEntry[];
}

export async function getTradeById(id: string): Promise<TradeJournalEntry | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("trades")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data as TradeJournalEntry;
}

export async function createTrade(
  input: TradeJournalEntryInput,
  id?: string
): Promise<TradeJournalEntry> {
  const supabase = createClient();
  invalidateReads();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const record = {
    ...(id ? { id } : {}),
    ...input,
    user_id: user.id,
    created_at: now(),
    updated_at: now(),
  };
  const { data, error } = await supabase
    .from("trades")
    .insert(record)
    .select()
    .single();
  if (error) throw error;
  return data as TradeJournalEntry;
}

export async function updateTrade(
  id: string,
  input: Partial<TradeJournalEntryInput>
): Promise<TradeJournalEntry> {
  const supabase = createClient();
  invalidateReads();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data, error } = await supabase
    .from("trades")
    .update({ ...input, updated_at: now() })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();
  if (error) throw error;
  return data as TradeJournalEntry;
}

export async function deleteTrade(id: string): Promise<void> {
  const supabase = createClient();
  invalidateReads();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase.from("trades").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw error;
}

// ── Funded Accounts ──────────────────────────────────────────────────

async function _getAccounts(): Promise<FundedAccount[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("funded_accounts")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as FundedAccount[];
}

export async function getAccountById(id: string): Promise<FundedAccount | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("funded_accounts")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data as FundedAccount;
}

export async function createAccount(input: FundedAccountInput): Promise<FundedAccount> {
  const supabase = createClient();
  invalidateReads();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const record = {
    ...input,
    user_id: user.id,
    created_at: now(),
    updated_at: now(),
  };
  const { data, error } = await supabase
    .from("funded_accounts")
    .insert(record)
    .select()
    .single();
  if (error) throw error;
  return data as FundedAccount;
}

export async function updateAccount(
  id: string,
  input: Partial<FundedAccountInput>
): Promise<FundedAccount> {
  const supabase = createClient();
  invalidateReads();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data, error } = await supabase
    .from("funded_accounts")
    .update({ ...input, updated_at: now() })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();
  if (error) throw error;
  return data as FundedAccount;
}

export async function deleteAccount(id: string): Promise<void> {
  const supabase = createClient();
  invalidateReads();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  // Cascades to payout_events via FK
  const { error } = await supabase.from("funded_accounts").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw error;
}

// ── Payout Events ────────────────────────────────────────────────────

export async function getPayoutsByAccountId(accountId: string): Promise<PayoutEvent[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("payout_events")
    .select("*")
    .eq("funded_account_id", accountId)
    .order("payout_date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PayoutEvent[];
}

export async function createPayout(input: Omit<PayoutEvent, "id">): Promise<PayoutEvent> {
  const supabase = createClient();
  invalidateReads();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data, error } = await supabase
    .from("payout_events")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as PayoutEvent;
}

export async function deletePayout(id: string): Promise<void> {
  const supabase = createClient();
  invalidateReads();
  const { error } = await supabase.from("payout_events").delete().eq("id", id);
  if (error) throw error;
}

// ── Habits ───────────────────────────────────────────────────────────

async function _getHabits(): Promise<Habit[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("habits")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Habit[];
}

export async function createHabit(
  input: Omit<Habit, "id" | "user_id" | "created_at" | "updated_at">
): Promise<Habit> {
  const supabase = createClient();
  invalidateReads();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const record = { ...input, user_id: user.id, created_at: now(), updated_at: now() };
  const { data, error } = await supabase
    .from("habits")
    .insert(record)
    .select()
    .single();
  if (error) throw error;
  return data as Habit;
}

export async function updateHabit(id: string, input: Partial<Habit>): Promise<Habit> {
  const supabase = createClient();
  invalidateReads();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data, error } = await supabase
    .from("habits")
    .update({ ...input, updated_at: now() })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();
  if (error) throw error;
  return data as Habit;
}

export async function deleteHabit(id: string): Promise<void> {
  const supabase = createClient();
  invalidateReads();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  await supabase.from("habit_completions").delete().eq("habit_id", id);
  const { error } = await supabase.from("habits").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw error;
}

async function _getHabitCompletions(habitId?: string, date?: string): Promise<HabitCompletion[]> {
  const supabase = createClient();
  let query = supabase.from("habit_completions").select("*");
  if (habitId) query = query.eq("habit_id", habitId);
  if (date) query = query.eq("date", date);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as HabitCompletion[];
}

export async function toggleHabitCompletion(
  habitId: string,
  date: string
): Promise<HabitCompletion> {
  const supabase = createClient();
  invalidateReads();
  const { data: existing } = await supabase
    .from("habit_completions")
    .select("*")
    .eq("habit_id", habitId)
    .eq("date", date)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from("habit_completions")
      .update({ completed: !existing.completed })
      .eq("id", existing.id)
      .select()
      .single();
    if (error) throw error;
    return data as HabitCompletion;
  }

  const { data, error } = await supabase
    .from("habit_completions")
    .insert({ habit_id: habitId, date, completed: true })
    .select()
    .single();
  if (error) throw error;
  return data as HabitCompletion;
}

export async function getHabitStreak(habitId: string): Promise<number> {
  const supabase = createClient();
  const { data } = await supabase
    .from("habit_completions")
    .select("date")
    .eq("habit_id", habitId)
    .eq("completed", true)
    .order("date", { ascending: false });

  const completedDates = (data ?? []).map((r: { date: string }) => r.date).sort((a: string, b: string) => b.localeCompare(a));
  if (!completedDates.length) return 0;

  let streak = 0;
  const today = new Date().toISOString().slice(0, 10);
  let checkDate = today;

  for (let i = 0; i < 365; i++) {
    if (completedDates.includes(checkDate)) {
      streak++;
      const d = new Date(checkDate + "T12:00:00");
      d.setDate(d.getDate() - 1);
      checkDate = d.toISOString().slice(0, 10);
    } else {
      if (checkDate === today) {
        const d = new Date(checkDate + "T12:00:00");
        d.setDate(d.getDate() - 1);
        checkDate = d.toISOString().slice(0, 10);
        continue;
      }
      break;
    }
  }
  return streak;
}

// ── Weekly Reflection ────────────────────────────────────────────────

export async function getWeeklyReflection(weekStart: string): Promise<WeeklyReflection | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("weekly_reflections")
    .select("*")
    .eq("week_start", weekStart)
    .maybeSingle();
  if (error) return null;
  return data as WeeklyReflection | null;
}

export async function saveWeeklyReflection(
  input: Omit<WeeklyReflection, "id" | "user_id" | "created_at" | "updated_at">
): Promise<WeeklyReflection> {
  const supabase = createClient();
  invalidateReads();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: existing } = await supabase
    .from("weekly_reflections")
    .select("id")
    .eq("week_start", input.week_start)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from("weekly_reflections")
      .update({ ...input, updated_at: now() })
      .eq("id", existing.id)
      .select()
      .single();
    if (error) throw error;
    return data as WeeklyReflection;
  }

  const { data, error } = await supabase
    .from("weekly_reflections")
    .insert({ ...input, user_id: user.id, created_at: now(), updated_at: now() })
    .select()
    .single();
  if (error) throw error;
  return data as WeeklyReflection;
}

// ── Weekly Trade Reviews (Journal page) ──────────────────────────────
// Fail-soft: if the weekly_trade_reviews table has not been created yet,
// reads return empty so the Weekly Review tab still renders its derived stats.

async function _getWeeklyTradeReviews(): Promise<WeeklyTradeReview[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("weekly_trade_reviews")
    .select("*");
  if (error) return [];
  return (data ?? []).map((r) => ({
    ...r,
    best_trade_days: (r.best_trade_days ?? {}) as Record<string, boolean>,
  })) as WeeklyTradeReview[];
}

export async function saveWeeklyTradeReview(
  input: WeeklyTradeReviewInput
): Promise<WeeklyTradeReview> {
  const supabase = createClient();
  invalidateReads();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: existing } = await supabase
    .from("weekly_trade_reviews")
    .select("id")
    .eq("week_start", input.week_start)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from("weekly_trade_reviews")
      .update({ ...input, updated_at: now() })
      .eq("id", existing.id)
      .select()
      .single();
    if (error) throw error;
    return data as WeeklyTradeReview;
  }

  const { data, error } = await supabase
    .from("weekly_trade_reviews")
    .insert({ ...input, user_id: user.id, created_at: now(), updated_at: now() })
    .select()
    .single();
  if (error) throw error;
  return data as WeeklyTradeReview;
}

// ── Monte Carlo settings (Strategy page) ─────────────────────────────
// One saved simulation setup per user, stored as a JSON blob so the input
// shape can evolve without a schema change. Fail-soft: if the table hasn't
// been created yet, reads return null and the simulator falls back to defaults.
import type { MonteCarloInputs } from "@/lib/strategy/monte-carlo";

export async function getMonteCarloSettings(): Promise<MonteCarloInputs | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("monte_carlo_settings")
    .select("inputs")
    .maybeSingle();
  if (error || !data?.inputs) return null;
  return data.inputs as MonteCarloInputs;
}

export async function saveMonteCarloSettings(inputs: MonteCarloInputs): Promise<void> {
  const supabase = createClient();
  invalidateReads();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: existing } = await supabase
    .from("monte_carlo_settings")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("monte_carlo_settings")
      .update({ inputs, updated_at: now() })
      .eq("id", existing.id);
    if (error) throw error;
    return;
  }

  const { error } = await supabase
    .from("monte_carlo_settings")
    .insert({ user_id: user.id, inputs, created_at: now(), updated_at: now() });
  if (error) throw error;
}

// ── Dashboard Stats ──────────────────────────────────────────────────

export async function getDashboardStats(): Promise<DashboardStats> {
  const [trades, accounts] = await Promise.all([getTrades(), getAccounts()]);

  const wins = trades.filter((t) => t.result === "win");
  const breakEvens = trades.filter((t) => t.result === "break-even");
  const activeAccts = accounts.filter((a) => a.status === "active");

  return {
    total_trades: trades.length,
    win_rate: trades.length > 0 ? Math.round((wins.length / trades.length) * 100) : 0,
    break_even_rate: trades.length > 0 ? Math.round((breakEvens.length / trades.length) * 100) : 0,
    average_rr:
      trades.length > 0
        ? Math.round((trades.reduce((s, t) => s + t.rr, 0) / trades.length) * 100) / 100
        : 0,
    active_accounts: activeAccts.length,
    total_payouts: activeAccts.reduce((s, a) => s + (a.payout_total ?? 0), 0),
    total_drawdown_used: activeAccts.reduce((s, a) => s + (a.drawdown_used ?? 0), 0),
  };
}

// ── ROI utility (kept here for convenience) ──────────────────────────
export function computeAccountROI(payout_total: number, purchase_cost: number): number {
  if (!purchase_cost || purchase_cost <= 0) return 0;
  return Math.round((payout_total / purchase_cost) * 10) / 10;
}

// ── Daily Tasks ──────────────────────────────────────────────────────
import type { DailyTask } from "@/lib/types";

export async function getDailyTasks(date: string): Promise<DailyTask[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("daily_tasks")
    .select("*")
    .eq("date", date)
    .order("created_at", { ascending: true });
  if (error) return [];
  return (data ?? []) as DailyTask[];
}

export async function createDailyTask(
  input: Omit<DailyTask, "id" | "user_id" | "created_at">
): Promise<DailyTask> {
  const supabase = createClient();
  invalidateReads();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data, error } = await supabase
    .from("daily_tasks")
    .insert({ ...input, user_id: user.id, created_at: now() })
    .select()
    .single();
  if (error) throw error;
  return data as DailyTask;
}

export async function updateDailyTask(id: string, input: Partial<DailyTask>): Promise<DailyTask> {
  const supabase = createClient();
  invalidateReads();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data, error } = await supabase
    .from("daily_tasks")
    .update(input)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();
  if (error) throw error;
  return data as DailyTask;
}

export async function deleteDailyTask(id: string): Promise<void> {
  const supabase = createClient();
  invalidateReads();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase.from("daily_tasks").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw error;
}

// ── Trader Playbook ──────────────────────────────────────────────────
import type { TraderPlaybook } from "@/lib/types";

async function _getPlaybook(): Promise<TraderPlaybook | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("trader_playbooks")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  return data ? (data.playbook_data as TraderPlaybook) : null;
}

export async function savePlaybook(p: TraderPlaybook): Promise<void> {
  const supabase = createClient();
  invalidateReads();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const updated = { ...p, updated_at: now() };
  const { data: existing } = await supabase
    .from("trader_playbooks")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("trader_playbooks")
      .update({ playbook_data: updated, updated_at: now() })
      .eq("id", existing.id);
  } else {
    await supabase
      .from("trader_playbooks")
      .insert({ user_id: user.id, playbook_data: updated, created_at: now(), updated_at: now() });
  }
}

// ── Profile ──────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  email: string | null;
  username: string | null;
  full_name: string | null;
  bio: string | null;
  discipline_rules: string | null;
  /** Newline-separated list of the trader's saved confluence options, selectable in the journal */
  confluence_options: string | null;
  preferred_session: string | null;
  preferred_instrument: string | null;
  timezone: string | null;
  created_at: string;
  updated_at: string | null;
}

export type UserProfileUpdate = Partial<Omit<UserProfile, "id" | "email" | "username" | "created_at" | "updated_at">>;

async function _getProfile(): Promise<UserProfile | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  return data as UserProfile | null;
}

export async function upsertProfile(input: UserProfileUpdate): Promise<UserProfile> {
  const supabase = createClient();
  invalidateReads();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("profiles")
    .upsert({ ...input, id: user.id, updated_at: now() }, { onConflict: "id" })
    .select()
    .single();
  if (error) throw error;
  return data as UserProfile;
}

// ── Coaching utilities (pure computation, re-exported from mock store) ─
export {
  generateCoachingInsights,
  computeDisciplineScore,
  getAvgDisciplineScore,
  getDisciplineFieldLabel,
} from "@/lib/mock/store";

// ── Psychological Edge (psych_edge_sessions) ─────────────────────────
// Fail-soft: if the psych_edge_sessions table has not been created yet,
// reads return empty so the page still renders the computed reflection —
// it just can't persist history or check prior commitments until the
// migration runs.

async function _getPsychEdgeSessions(): Promise<PsychEdgeSession[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("psych_edge_sessions")
    .select("*")
    .order("date", { ascending: false });
  if (error) return [];
  return (data ?? []) as PsychEdgeSession[];
}

export async function savePsychEdgeSession(
  input: PsychEdgeSessionInput
): Promise<PsychEdgeSession> {
  const supabase = createClient();
  invalidateReads();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Reflections are keyed per trade — one deep 5R walkthrough per bad-execution
  // trade. Fall back to the day key only for any legacy row without a trade_id.
  const lookup = supabase.from("psych_edge_sessions").select("id");
  const { data: existing } = await (
    input.trade_id ? lookup.eq("trade_id", input.trade_id) : lookup.eq("date", input.date)
  ).maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from("psych_edge_sessions")
      .update({ ...input, updated_at: now() })
      .eq("id", existing.id)
      .select()
      .single();
    if (error) throw error;
    return data as PsychEdgeSession;
  }

  const { data, error } = await supabase
    .from("psych_edge_sessions")
    .insert({ ...input, user_id: user.id, created_at: now(), updated_at: now() })
    .select()
    .single();
  if (error) throw error;
  return data as PsychEdgeSession;
}

// ── MC Trade Therapist — commitments, pattern events, adherence ──────
// All fail-soft: until trade_therapist.sql is run, reads return empty and
// writes throw a caught error, so the pages still render the computed content.

async function _getCommitments(): Promise<Commitment[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("commitments")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []) as Commitment[];
}

export async function createCommitment(input: CommitmentInput): Promise<Commitment> {
  const supabase = createClient();
  invalidateReads();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data, error } = await supabase
    .from("commitments")
    .insert({ ...input, user_id: user.id, created_at: now(), updated_at: now() })
    .select()
    .single();
  if (error) throw error;
  return data as Commitment;
}

export async function updateCommitment(id: string, input: Partial<CommitmentInput>): Promise<Commitment> {
  const supabase = createClient();
  invalidateReads();
  const { data, error } = await supabase
    .from("commitments")
    .update({ ...input, updated_at: now() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Commitment;
}

async function _getPatternEvents(): Promise<PatternEvent[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("pattern_events")
    .select("*")
    .order("date", { ascending: true });
  if (error) return [];
  return (data ?? []) as PatternEvent[];
}

/** Upsert one detected pattern occurrence (keyed on trade + pattern type). Used
 *  when the trader engages with a pattern in the 5R "Relating" step, so the log
 *  reflects reality without duplicating on re-detection. */
export async function upsertPatternEvent(input: PatternEventInput): Promise<PatternEvent> {
  const supabase = createClient();
  invalidateReads();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data, error } = await supabase
    .from("pattern_events")
    .upsert(
      { ...input, user_id: user.id, created_at: now() },
      { onConflict: "user_id,trade_id,pattern_type" }
    )
    .select()
    .single();
  if (error) throw error;
  return data as PatternEvent;
}

export async function getCommitmentAdherenceLogs(): Promise<CommitmentAdherenceLog[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("commitment_adherence_log")
    .select("*")
    .order("date", { ascending: true });
  if (error) return [];
  return (data ?? []) as CommitmentAdherenceLog[];
}

export async function createAdherenceLog(
  input: CommitmentAdherenceLogInput
): Promise<CommitmentAdherenceLog> {
  const supabase = createClient();
  invalidateReads();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data, error } = await supabase
    .from("commitment_adherence_log")
    .insert({ ...input, user_id: user.id, created_at: now() })
    .select()
    .single();
  if (error) throw error;
  return data as CommitmentAdherenceLog;
}

export async function resolveAdherenceLog(id: string, followed: boolean): Promise<CommitmentAdherenceLog> {
  const supabase = createClient();
  invalidateReads();
  const { data, error } = await supabase
    .from("commitment_adherence_log")
    .update({ followed })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as CommitmentAdherenceLog;
}

// ── Best Trade of the Day ────────────────────────────────────────────
// Fail-soft: if the best_trade_of_day table hasn't been created yet, reads
// return empty/null so the Journal still renders.

async function _getBestTradesOfDay(): Promise<BestTradeOfDay[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("best_trade_of_day")
    .select("*")
    .order("date", { ascending: false });
  if (error) return [];
  return (data ?? []).map((r) => ({
    ...r,
    post_market_analysis: r.post_market_analysis ?? "",
    screenshot_groups: (r.screenshot_groups ?? []) as BestTradeOfDay["screenshot_groups"],
  })) as BestTradeOfDay[];
}

export async function getBestTradeOfDay(date: string): Promise<BestTradeOfDay | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("best_trade_of_day")
    .select("*")
    .eq("date", date)
    .maybeSingle();
  if (error || !data) return null;
  return { ...data, post_market_analysis: data.post_market_analysis ?? "", screenshot_groups: (data.screenshot_groups ?? []) } as BestTradeOfDay;
}

export async function saveBestTradeOfDay(
  input: Pick<BestTradeOfDay, "date" | "taken_was_best" | "notes" | "post_market_analysis" | "screenshot_groups">
): Promise<BestTradeOfDay> {
  const supabase = createClient();
  invalidateReads();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: existing } = await supabase
    .from("best_trade_of_day")
    .select("id")
    .eq("date", input.date)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from("best_trade_of_day")
      .update({ ...input, updated_at: now() })
      .eq("id", existing.id)
      .select()
      .single();
    if (error) throw error;
    return data as BestTradeOfDay;
  }

  const { data, error } = await supabase
    .from("best_trade_of_day")
    .insert({ ...input, user_id: user.id, created_at: now(), updated_at: now() })
    .select()
    .single();
  if (error) throw error;
  return data as BestTradeOfDay;
}

export async function deleteBestTradeOfDay(date: string): Promise<void> {
  const supabase = createClient();
  invalidateReads();
  const { error } = await supabase.from("best_trade_of_day").delete().eq("date", date);
  if (error) throw error;
}

// ── Pre-Market Exercise ──────────────────────────────────────────────
// Fail-soft: if the pre_market_exercise table hasn't been created yet, reads
// return null so the Trade Therapist still renders.

export async function getPreMarketExercise(date: string): Promise<PreMarketExercise | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("pre_market_exercise")
    .select("*")
    .eq("date", date)
    .maybeSingle();
  if (error || !data) return null;
  return {
    ...data,
    loss_plans: (data.loss_plans ?? {}) as Record<string, string>,
    win_plans: (data.win_plans ?? {}) as Record<string, string>,
    focus: data.focus ?? "",
  } as PreMarketExercise;
}

export async function savePreMarketExercise(
  input: Pick<PreMarketExercise, "date" | "loss_plans" | "win_plans" | "focus">
): Promise<PreMarketExercise> {
  const supabase = createClient();
  invalidateReads();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: existing } = await supabase
    .from("pre_market_exercise")
    .select("id")
    .eq("date", input.date)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from("pre_market_exercise")
      .update({ ...input, updated_at: now() })
      .eq("id", existing.id)
      .select()
      .single();
    if (error) throw error;
    return data as PreMarketExercise;
  }

  const { data, error } = await supabase
    .from("pre_market_exercise")
    .insert({ ...input, user_id: user.id, created_at: now(), updated_at: now() })
    .select()
    .single();
  if (error) throw error;
  return data as PreMarketExercise;
}

// ── Cached wrappers for the hot, cross-page reads ─────────────────────
export function getTrades(): Promise<TradeJournalEntry[]> {
  return cachedRead("trades", _getTrades);
}

export function getProfile(): Promise<UserProfile | null> {
  return cachedRead("profile", _getProfile);
}

export function getAccounts(): Promise<FundedAccount[]> {
  return cachedRead("accounts", _getAccounts);
}

export function getHabits(): Promise<Habit[]> {
  return cachedRead("habits", _getHabits);
}

export function getAnalyses(): Promise<PreTradeAnalysis[]> {
  return cachedRead("analyses", _getAnalyses);
}

export function getBestTradesOfDay(): Promise<BestTradeOfDay[]> {
  return cachedRead("bestTrades", _getBestTradesOfDay);
}

export function getWeeklyTradeReviews(): Promise<WeeklyTradeReview[]> {
  return cachedRead("weeklyReviews", _getWeeklyTradeReviews);
}

export function getPsychEdgeSessions(): Promise<PsychEdgeSession[]> {
  return cachedRead("psychSessions", _getPsychEdgeSessions);
}

export function getPlaybook(): Promise<TraderPlaybook | null> {
  return cachedRead("playbook", _getPlaybook);
}

export function getCommitments(): Promise<Commitment[]> {
  return cachedRead("commitments", _getCommitments);
}

export function getPatternEvents(): Promise<PatternEvent[]> {
  return cachedRead("patternEvents", _getPatternEvents);
}

export function getHabitCompletions(habitId?: string, date?: string): Promise<HabitCompletion[]> {
  return cachedRead(`habitCompletions:${habitId ?? ""}:${date ?? ""}`, () => _getHabitCompletions(habitId, date));
}
