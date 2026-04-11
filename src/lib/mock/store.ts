/**
 * Persistent data store using localStorage.
 * All data survives page refreshes. Clear localStorage to reset.
 * When Supabase is connected, replace these functions with real DB queries —
 * the interface stays identical.
 */
import type {
  PreTradeAnalysis,
  PreTradeAnalysisInput,
  TradeJournalEntry,
  TradeJournalEntryInput,
  FundedAccount,
  FundedAccountInput,
  PayoutEvent,
  NewsItem,
  DashboardStats,
  Habit,
  HabitCompletion,
  DailyTask,
} from "@/lib/types";
import { mockNews, mockHabits, mockHabitCompletions } from "./data";

// ── Storage helpers ─────────────────────────────────────────────────
const KEYS = {
  analyses: "th_analyses",
  trades: "th_trades",
  accounts: "th_accounts",
  payouts: "th_payouts",
  habits: "th_habits",
  habitCompletions: "th_habit_completions",
  dailyTasks: "th_daily_tasks",
} as const;

function load<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function save<T>(key: string, data: T[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}
}

// ── Lazy-loaded store (reads localStorage on first access) ──────────
let _analyses: PreTradeAnalysis[] | null = null;
let _trades: TradeJournalEntry[] | null = null;
let _accounts: FundedAccount[] | null = null;
let _payouts: PayoutEvent[] | null = null;
let _habits: Habit[] | null = null;
let _habitCompletions: HabitCompletion[] | null = null;
let _dailyTasks: DailyTask[] | null = null;

function A(): PreTradeAnalysis[] {
  if (_analyses === null) _analyses = load<PreTradeAnalysis>(KEYS.analyses);
  return _analyses;
}
function T(): TradeJournalEntry[] {
  if (_trades === null) _trades = load<TradeJournalEntry>(KEYS.trades);
  return _trades;
}
function ACC(): FundedAccount[] {
  if (_accounts === null) _accounts = load<FundedAccount>(KEYS.accounts);
  return _accounts;
}
function P(): PayoutEvent[] {
  if (_payouts === null) _payouts = load<PayoutEvent>(KEYS.payouts);
  return _payouts;
}

// ── Utilities ───────────────────────────────────────────────────────
function generateId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}
function now() {
  return new Date().toISOString();
}

// ── Pre-Trade Analysis ──────────────────────────────────────────────
export function getAnalyses(): PreTradeAnalysis[] {
  return [...A()].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function getAnalysisById(id: string): PreTradeAnalysis | undefined {
  return A().find((a) => a.id === id);
}

export function createAnalysis(input: PreTradeAnalysisInput): PreTradeAnalysis {
  const analysis: PreTradeAnalysis = {
    ...input,
    id: generateId("analysis"),
    user_id: "user_1",
    created_at: now(),
    updated_at: now(),
  };
  _analyses = [analysis, ...A()];
  save(KEYS.analyses, _analyses);
  return analysis;
}

export function updateAnalysis(
  id: string,
  input: Partial<PreTradeAnalysisInput>
): PreTradeAnalysis | undefined {
  const idx = A().findIndex((a) => a.id === id);
  if (idx === -1) return undefined;
  _analyses![idx] = { ..._analyses![idx], ...input, updated_at: now() };
  save(KEYS.analyses, _analyses!);
  return _analyses![idx];
}

export function deleteAnalysis(id: string): boolean {
  const before = A().length;
  _analyses = _analyses!.filter((a) => a.id !== id);
  save(KEYS.analyses, _analyses);
  return _analyses.length < before;
}

// ── Trade Journal ───────────────────────────────────────────────────
export function getTrades(): TradeJournalEntry[] {
  return [...T()].sort(
    (a, b) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime()
  );
}

export function getTradeById(id: string): TradeJournalEntry | undefined {
  return T().find((t) => t.id === id);
}

export function createTrade(input: TradeJournalEntryInput): TradeJournalEntry {
  const trade: TradeJournalEntry = {
    ...input,
    id: generateId("trade"),
    user_id: "user_1",
    created_at: now(),
    updated_at: now(),
  };
  _trades = [trade, ...T()];
  save(KEYS.trades, _trades);
  return trade;
}

export function updateTrade(
  id: string,
  input: Partial<TradeJournalEntryInput>
): TradeJournalEntry | undefined {
  const idx = T().findIndex((t) => t.id === id);
  if (idx === -1) return undefined;
  _trades![idx] = { ..._trades![idx], ...input, updated_at: now() };
  save(KEYS.trades, _trades!);
  return _trades![idx];
}

export function deleteTrade(id: string): boolean {
  const before = T().length;
  _trades = _trades!.filter((t) => t.id !== id);
  save(KEYS.trades, _trades);
  return _trades.length < before;
}

// ── Funded Accounts ─────────────────────────────────────────────────
export function getAccounts(): FundedAccount[] {
  return [...ACC()].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );
}

export function getAccountById(id: string): FundedAccount | undefined {
  return ACC().find((a) => a.id === id);
}

export function createAccount(input: FundedAccountInput): FundedAccount {
  const account: FundedAccount = {
    ...input,
    id: generateId("acct"),
    user_id: "user_1",
    created_at: now(),
    updated_at: now(),
  };
  _accounts = [account, ...ACC()];
  save(KEYS.accounts, _accounts);
  return account;
}

export function updateAccount(
  id: string,
  input: Partial<FundedAccountInput>
): FundedAccount | undefined {
  const idx = ACC().findIndex((a) => a.id === id);
  if (idx === -1) return undefined;
  _accounts![idx] = { ..._accounts![idx], ...input, updated_at: now() };
  save(KEYS.accounts, _accounts!);
  return _accounts![idx];
}

export function deleteAccount(id: string): boolean {
  const before = ACC().length;
  _accounts = _accounts!.filter((a) => a.id !== id);
  save(KEYS.accounts, _accounts);
  // Also remove associated payouts
  _payouts = P().filter((p) => p.funded_account_id !== id);
  save(KEYS.payouts, _payouts);
  return _accounts.length < before;
}

// ── Payouts ─────────────────────────────────────────────────────────
export function getPayoutsByAccountId(accountId: string): PayoutEvent[] {
  return P()
    .filter((p) => p.funded_account_id === accountId)
    .sort((a, b) => new Date(b.payout_date).getTime() - new Date(a.payout_date).getTime());
}

export function createPayout(input: Omit<PayoutEvent, "id">): PayoutEvent {
  const payout: PayoutEvent = { ...input, id: generateId("payout") };
  _payouts = [payout, ...P()];
  save(KEYS.payouts, _payouts);
  return payout;
}

export function deletePayout(id: string): boolean {
  const before = P().length;
  _payouts = _payouts!.filter((p) => p.id !== id);
  save(KEYS.payouts, _payouts);
  return _payouts.length < before;
}

// ── News (static — not user-editable) ──────────────────────────────
const news = [...mockNews];

export function getNews(filters?: {
  market?: string;
  impact?: string;
  asset?: string;
}): NewsItem[] {
  let result = [...news];
  if (filters?.market) result = result.filter((n) => n.market_tags.includes(filters.market!));
  if (filters?.impact) result = result.filter((n) => n.impact_level === filters.impact);
  if (filters?.asset)
    result = result.filter((n) =>
      n.asset_tags.some((t) => t.toLowerCase().includes(filters.asset!.toLowerCase()))
    );
  return result.sort(
    (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  );
}

export function getFeaturedNews(): NewsItem[] {
  return news.filter((n) => n.is_featured);
}

// ── Dashboard stats ─────────────────────────────────────────────────
export function getDashboardStats(): DashboardStats {
  const allTrades = getTrades();
  const wins = allTrades.filter((t) => t.result === "win");
  const breakEvens = allTrades.filter((t) => t.result === "break-even");
  const activeAccts = getAccounts().filter((a) => a.status === "active");

  return {
    total_trades: allTrades.length,
    win_rate:
      allTrades.length > 0 ? Math.round((wins.length / allTrades.length) * 100) : 0,
    break_even_rate:
      allTrades.length > 0 ? Math.round((breakEvens.length / allTrades.length) * 100) : 0,
    average_rr:
      allTrades.length > 0
        ? Math.round((allTrades.reduce((s, t) => s + t.rr, 0) / allTrades.length) * 100) / 100
        : 0,
    active_accounts: activeAccts.length,
    total_payouts: activeAccts.reduce((s, a) => s + a.payout_total, 0),
    total_drawdown_used: activeAccts.reduce((s, a) => s + a.drawdown_used, 0),
  };
}

// ── Habits ──────────────────────────────────────────────────────────
function H(): Habit[] {
  if (_habits === null) {
    const stored = load<Habit>(KEYS.habits);
    _habits = stored.length > 0 ? stored : [...mockHabits];
    if (stored.length === 0) save(KEYS.habits, _habits);
  }
  return _habits;
}
function HC(): HabitCompletion[] {
  if (_habitCompletions === null) {
    const stored = load<HabitCompletion>(KEYS.habitCompletions);
    _habitCompletions = stored.length > 0 ? stored : [...mockHabitCompletions];
    if (stored.length === 0) save(KEYS.habitCompletions, _habitCompletions);
  }
  return _habitCompletions;
}
function DT(): DailyTask[] {
  if (_dailyTasks === null) _dailyTasks = load<DailyTask>(KEYS.dailyTasks);
  return _dailyTasks;
}

export function getHabits(): Habit[] {
  return [...H()].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
}

export function createHabit(input: Omit<Habit, "id" | "user_id" | "created_at" | "updated_at">): Habit {
  const habit: Habit = {
    ...input,
    id: generateId("habit"),
    user_id: "user_1",
    created_at: now(),
    updated_at: now(),
  };
  _habits = [habit, ...H()];
  save(KEYS.habits, _habits);
  return habit;
}

export function updateHabit(id: string, input: Partial<Habit>): Habit | undefined {
  const idx = H().findIndex((h) => h.id === id);
  if (idx === -1) return undefined;
  _habits![idx] = { ..._habits![idx], ...input, updated_at: now() };
  save(KEYS.habits, _habits!);
  return _habits![idx];
}

export function deleteHabit(id: string): boolean {
  const before = H().length;
  _habits = _habits!.filter((h) => h.id !== id);
  save(KEYS.habits, _habits);
  // Remove completions for this habit
  _habitCompletions = HC().filter((c) => c.habit_id !== id);
  save(KEYS.habitCompletions, _habitCompletions);
  return _habits.length < before;
}

export function getHabitCompletions(habitId?: string, date?: string): HabitCompletion[] {
  let result = HC();
  if (habitId) result = result.filter((c) => c.habit_id === habitId);
  if (date) result = result.filter((c) => c.date === date);
  return result;
}

export function toggleHabitCompletion(habitId: string, date: string): HabitCompletion {
  const existing = HC().find((c) => c.habit_id === habitId && c.date === date);
  if (existing) {
    const idx = _habitCompletions!.findIndex((c) => c.id === existing.id);
    _habitCompletions![idx] = { ...existing, completed: !existing.completed };
    save(KEYS.habitCompletions, _habitCompletions!);
    return _habitCompletions![idx];
  }
  const completion: HabitCompletion = {
    id: generateId("hc"),
    habit_id: habitId,
    date,
    completed: true,
  };
  _habitCompletions = [completion, ...HC()];
  save(KEYS.habitCompletions, _habitCompletions);
  return completion;
}

/** Returns streak (consecutive days completed up to and including today) */
export function getHabitStreak(habitId: string): number {
  const completions = HC()
    .filter((c) => c.habit_id === habitId && c.completed)
    .map((c) => c.date)
    .sort((a, b) => b.localeCompare(a));

  if (completions.length === 0) return 0;

  let streak = 0;
  const today = new Date().toISOString().slice(0, 10);
  let checkDate = today;

  for (let i = 0; i < 365; i++) {
    if (completions.includes(checkDate)) {
      streak++;
      const d = new Date(checkDate + "T12:00:00");
      d.setDate(d.getDate() - 1);
      checkDate = d.toISOString().slice(0, 10);
    } else {
      // Allow today to be incomplete (streak counts yesterday back)
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

// ── Daily Tasks ──────────────────────────────────────────────────────
export function getDailyTasks(date: string): DailyTask[] {
  return DT()
    .filter((t) => t.date === date)
    .sort((a, b) => {
      const priority = { high: 0, medium: 1, low: 2 };
      return priority[a.priority] - priority[b.priority];
    });
}

export function createDailyTask(input: Omit<DailyTask, "id" | "user_id" | "created_at">): DailyTask {
  const task: DailyTask = {
    ...input,
    id: generateId("task"),
    user_id: "user_1",
    created_at: now(),
  };
  _dailyTasks = [task, ...DT()];
  save(KEYS.dailyTasks, _dailyTasks);
  return task;
}

export function updateDailyTask(id: string, input: Partial<DailyTask>): DailyTask | undefined {
  const idx = DT().findIndex((t) => t.id === id);
  if (idx === -1) return undefined;
  _dailyTasks![idx] = { ..._dailyTasks![idx], ...input };
  save(KEYS.dailyTasks, _dailyTasks!);
  return _dailyTasks![idx];
}

export function deleteDailyTask(id: string): boolean {
  const before = DT().length;
  _dailyTasks = _dailyTasks!.filter((t) => t.id !== id);
  save(KEYS.dailyTasks, _dailyTasks);
  return _dailyTasks.length < before;
}

// ── Dev helper — clears all user data from localStorage ─────────────
export function clearAllData(): void {
  if (typeof window === "undefined") return;
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
  _analyses = null;
  _trades = null;
  _accounts = null;
  _payouts = null;
  _habits = null;
  _habitCompletions = null;
  _dailyTasks = null;
}
