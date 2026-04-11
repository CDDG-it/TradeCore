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
  TraderPlaybook,
  TradeDiscipline,
  DailyCommandState,
  CoachingInsight,
} from "@/lib/types";
import { mockNews, mockHabits, mockHabitCompletions, mockPlaybook } from "./data";

// ── Storage helpers ─────────────────────────────────────────────────
const KEYS = {
  analyses: "th_analyses",
  trades: "th_trades",
  accounts: "th_accounts",
  payouts: "th_payouts",
  habits: "th_habits",
  habitCompletions: "th_habit_completions",
  dailyTasks: "th_daily_tasks",
  playbook: "th_playbook",
  dailyStates: "th_daily_states",
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

// ── Trader Playbook ──────────────────────────────────────────────────
let _playbook: TraderPlaybook | null | undefined = undefined;

export function getPlaybook(): TraderPlaybook {
  if (_playbook !== undefined) return _playbook!;
  if (typeof window === "undefined") return { ...mockPlaybook };
  try {
    const raw = localStorage.getItem(KEYS.playbook);
    _playbook = raw ? (JSON.parse(raw) as TraderPlaybook) : { ...mockPlaybook };
    if (!raw) localStorage.setItem(KEYS.playbook, JSON.stringify(_playbook));
  } catch {
    _playbook = { ...mockPlaybook };
  }
  return _playbook!;
}

export function savePlaybook(p: TraderPlaybook): void {
  _playbook = { ...p, updated_at: new Date().toISOString() };
  if (typeof window === "undefined") return;
  localStorage.setItem(KEYS.playbook, JSON.stringify(_playbook));
}

// ── Daily Command State ──────────────────────────────────────────────
let _dailyStates: DailyCommandState[] | null = null;

function DSTATE(): DailyCommandState[] {
  if (_dailyStates === null) _dailyStates = load<DailyCommandState>(KEYS.dailyStates);
  return _dailyStates;
}

export function getDailyState(date: string): DailyCommandState {
  const existing = DSTATE().find((s) => s.date === date);
  if (existing) return existing;
  return {
    date,
    focus_note: "",
    pre_trade_checklist: [],
    market_context: {},
    eod_reflection: "",
    updated_at: new Date().toISOString(),
  };
}

export function saveDailyState(state: DailyCommandState): void {
  const updated = { ...state, updated_at: new Date().toISOString() };
  const idx = DSTATE().findIndex((s) => s.date === state.date);
  if (idx >= 0) {
    _dailyStates![idx] = updated;
  } else {
    _dailyStates = [updated, ...(DSTATE())];
  }
  save(KEYS.dailyStates, _dailyStates!);
}

// ── Discipline Score Utility ─────────────────────────────────────────
const DISCIPLINE_FIELDS: (keyof TradeDiscipline)[] = [
  "followed_plan",
  "traded_in_session",
  "respected_risk",
  "respected_max_trades",
  "matched_a_plus",
  "no_impulsive_entry",
  "no_revenge_trade",
  "respected_stop_loss",
  "journal_completed",
];

export function computeDisciplineScore(d: Partial<TradeDiscipline>): number {
  const trueCount = DISCIPLINE_FIELDS.filter((f) => d[f] === true).length;
  return Math.round((trueCount / DISCIPLINE_FIELDS.length) * 100);
}

export function getDisciplineFieldLabel(field: keyof TradeDiscipline): string {
  const labels: Partial<Record<keyof TradeDiscipline, string>> = {
    followed_plan: "Followed plan",
    traded_in_session: "Traded in allowed session",
    respected_risk: "Respected risk rules",
    respected_max_trades: "Respected max trades/day",
    matched_a_plus: "Matched A+ criteria",
    no_impulsive_entry: "No impulsive entry",
    no_revenge_trade: "No revenge trade",
    respected_stop_loss: "Respected stop loss",
    journal_completed: "Journal completed",
  };
  return labels[field] ?? field;
}

/** Returns average discipline score for a set of trades */
export function getAvgDisciplineScore(trades: TradeJournalEntry[]): number {
  const scored = trades.filter((t) => t.discipline);
  if (scored.length === 0) return 0;
  return Math.round(scored.reduce((s, t) => s + t.discipline!.score, 0) / scored.length);
}

// ── Coaching Insights Engine ─────────────────────────────────────────
export function generateCoachingInsights(
  trades: TradeJournalEntry[],
  habits: Habit[],
  completions: HabitCompletion[],
  playbook: TraderPlaybook | null
): CoachingInsight[] {
  const insights: CoachingInsight[] = [];

  if (trades.length < 3) {
    return [
      {
        id: "no-data",
        type: "suggestion",
        category: "performance",
        title: "Log more trades to unlock insights",
        description:
          "Add at least 5 trades to start seeing data-driven patterns. The coaching engine needs a sample to identify what's working and what isn't.",
        data_points: ["Currently: " + trades.length + " trade(s) logged", "Target: 5+ trades"],
        confidence: "high",
        timeframe: "all_time",
      },
    ];
  }

  // ── 1. Session performance ───────────────────────────────────────────
  const sessionMap: Record<string, { wins: number; total: number }> = {};
  trades.forEach((t) => {
    if (!sessionMap[t.session]) sessionMap[t.session] = { wins: 0, total: 0 };
    sessionMap[t.session].total++;
    if (t.result === "win") sessionMap[t.session].wins++;
  });
  const sessionRates = Object.entries(sessionMap)
    .map(([s, d]) => ({ session: s, rate: d.wins / d.total, total: d.total }))
    .sort((a, b) => b.rate - a.rate);

  if (sessionRates.length >= 2) {
    const best = sessionRates[0];
    const worst = sessionRates[sessionRates.length - 1];
    if (best.rate - worst.rate > 0.15 && best.total >= 2) {
      insights.push({
        id: "session-strength",
        type: "strength",
        category: "performance",
        title: `${best.session} is your strongest session`,
        description: `You win ${Math.round(best.rate * 100)}% of trades in ${best.session} vs ${Math.round(worst.rate * 100)}% in ${worst.session}. Prioritise your best setups here and be more selective elsewhere.`,
        data_points: sessionRates.map(
          (s) => `${s.session}: ${Math.round(s.rate * 100)}% win rate (${s.total} trades)`
        ),
        confidence: best.total >= 4 ? "high" : "medium",
        timeframe: "all_time",
      });
    }
  }

  // ── 2. Discipline ↔ results correlation ─────────────────────────────
  const withDisc = trades.filter((t) => t.discipline);
  if (withDisc.length >= 3) {
    const winScores = withDisc.filter((t) => t.result === "win").map((t) => t.discipline!.score);
    const lossScores = withDisc.filter((t) => t.result === "loss").map((t) => t.discipline!.score);
    const avg = (arr: number[]) =>
      arr.length > 0 ? arr.reduce((s, n) => s + n, 0) / arr.length : 0;
    const avgWin = avg(winScores);
    const avgLoss = avg(lossScores);

    if (lossScores.length >= 2 && avgWin - avgLoss > 12) {
      insights.push({
        id: "discipline-results-link",
        type: "pattern",
        category: "discipline",
        title: "Discipline score directly predicts your outcomes",
        description: `Winning trades average ${Math.round(avgWin)}% discipline vs ${Math.round(avgLoss)}% on losses — a ${Math.round(avgWin - avgLoss)} point gap. Your process quality is your edge.`,
        data_points: [
          `Wins avg discipline: ${Math.round(avgWin)}%`,
          `Losses avg discipline: ${Math.round(avgLoss)}%`,
          `Sample: ${withDisc.length} scored trades`,
        ],
        confidence: "high",
        timeframe: "all_time",
      });
    }

    // Most broken criteria
    const breaks: Partial<Record<keyof TradeDiscipline, number>> = {};
    withDisc.forEach((t) => {
      DISCIPLINE_FIELDS.forEach((f) => {
        if (!t.discipline![f as keyof TradeDiscipline]) {
          breaks[f as keyof TradeDiscipline] = (breaks[f as keyof TradeDiscipline] ?? 0) + 1;
        }
      });
    });
    const topBreak = Object.entries(breaks).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))[0];
    if (topBreak && (topBreak[1] ?? 0) >= 2) {
      insights.push({
        id: "top-discipline-break",
        type: "weakness",
        category: "discipline",
        title: `"${getDisciplineFieldLabel(topBreak[0] as keyof TradeDiscipline)}" is your most broken rule`,
        description: `This rule was broken in ${topBreak[1]} of ${withDisc.length} trades. Consistent rule-breaking here compounds losses over time.`,
        data_points: Object.entries(breaks)
          .filter(([, v]) => (v ?? 0) > 0)
          .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
          .slice(0, 5)
          .map(([k, v]) => `${getDisciplineFieldLabel(k as keyof TradeDiscipline)}: broken ${v}×`),
        confidence: "high",
        timeframe: "all_time",
      });
    }
  }

  // ── 3. Market regime performance ────────────────────────────────────
  const withCtx = trades.filter((t) => t.market_context?.regime);
  if (withCtx.length >= 3) {
    const regimeMap: Record<string, { wins: number; total: number }> = {};
    withCtx.forEach((t) => {
      const r = t.market_context!.regime!;
      if (!regimeMap[r]) regimeMap[r] = { wins: 0, total: 0 };
      regimeMap[r].total++;
      if (t.result === "win") regimeMap[r].wins++;
    });
    const regimes = Object.entries(regimeMap)
      .filter(([, d]) => d.total >= 2)
      .map(([regime, d]) => ({ regime, rate: d.wins / d.total, total: d.total }))
      .sort((a, b) => b.rate - a.rate);

    if (regimes.length >= 2) {
      const best = regimes[0];
      const worst = regimes[regimes.length - 1];
      if (best.rate - worst.rate > 0.15) {
        insights.push({
          id: "regime-performance",
          type: "pattern",
          category: "market",
          title: `You thrive in ${best.regime} markets, struggle in ${worst.regime}`,
          description: `${Math.round(best.rate * 100)}% win rate in ${best.regime} conditions vs ${Math.round(worst.rate * 100)}% when ${worst.regime}. Be more selective or reduce size in ${worst.regime} markets.`,
          data_points: regimes.map(
            (r) => `${r.regime}: ${Math.round(r.rate * 100)}% win rate (${r.total} trades)`
          ),
          confidence: best.total >= 3 ? "high" : "medium",
          timeframe: "all_time",
        });
      }
    }
  }

  // ── 4. Recent performance trend ──────────────────────────────────────
  const sorted = [...trades].sort(
    (a, b) =>
      new Date(b.date_time.slice(0, 10) + "T12:00:00").getTime() -
      new Date(a.date_time.slice(0, 10) + "T12:00:00").getTime()
  );
  const recent10 = sorted.slice(0, 10);
  const allWR = trades.length > 0 ? trades.filter((t) => t.result === "win").length / trades.length : 0;
  const recWR = recent10.length > 0 ? recent10.filter((t) => t.result === "win").length / recent10.length : 0;

  if (recent10.length >= 5 && recWR > allWR + 0.1) {
    insights.push({
      id: "improving-trend",
      type: "strength",
      category: "performance",
      title: "Your recent form is above your historical average",
      description: `Last 10 trades: ${Math.round(recWR * 100)}% win rate vs ${Math.round(allWR * 100)}% all-time. You're in a strong phase — maintain the approach and protect your capital.`,
      data_points: [
        `Recent 10 trades: ${Math.round(recWR * 100)}% win rate`,
        `All-time: ${Math.round(allWR * 100)}% win rate`,
      ],
      confidence: "medium",
      timeframe: "recent",
    });
  } else if (recent10.length >= 5 && recWR < allWR - 0.1) {
    insights.push({
      id: "declining-trend",
      type: "blind_spot",
      category: "performance",
      title: "Recent performance is below your baseline",
      description: `Last 10 trades: ${Math.round(recWR * 100)}% win rate vs ${Math.round(allWR * 100)}% all-time. Step back and identify what changed before adding size.`,
      data_points: [
        `Recent 10 trades: ${Math.round(recWR * 100)}% win rate`,
        `All-time: ${Math.round(allWR * 100)}% win rate`,
      ],
      confidence: "medium",
      timeframe: "recent",
    });
  }

  // ── 5. Habit ↔ trading correlation ──────────────────────────────────
  if (habits.length > 0 && completions.length >= 5) {
    const tradeDates = [...new Set(trades.map((t) => t.date_time.slice(0, 10)))];
    const dayStats = tradeDates
      .map((date) => {
        const dayTrades = trades.filter((t) => t.date_time.slice(0, 10) === date);
        const dayCompletions = completions.filter((c) => c.date === date && c.completed);
        return {
          habitRate: dayCompletions.length / habits.length,
          winRate: dayTrades.length > 0 ? dayTrades.filter((t) => t.result === "win").length / dayTrades.length : 0,
          tradeCount: dayTrades.length,
        };
      })
      .filter((d) => d.tradeCount > 0);

    if (dayStats.length >= 4) {
      const highHabit = dayStats.filter((d) => d.habitRate >= 0.7);
      const lowHabit = dayStats.filter((d) => d.habitRate < 0.4);
      if (highHabit.length >= 2 && lowHabit.length >= 2) {
        const highWR = highHabit.reduce((s, d) => s + d.winRate, 0) / highHabit.length;
        const lowWR = lowHabit.reduce((s, d) => s + d.winRate, 0) / lowHabit.length;
        if (highWR > lowWR + 0.1) {
          insights.push({
            id: "habit-performance-link",
            type: "pattern",
            category: "habits",
            title: "Strong daily habits correlate with better results",
            description: `Days with 70%+ habit completion show ${Math.round(highWR * 100)}% win rate vs ${Math.round(lowWR * 100)}% on low-habit days. Your preparation matters.`,
            data_points: [
              `High-habit days (${highHabit.length}): ${Math.round(highWR * 100)}% win rate`,
              `Low-habit days (${lowHabit.length}): ${Math.round(lowWR * 100)}% win rate`,
            ],
            confidence: "medium",
            timeframe: "all_time",
          });
        }
      }
    }
  }

  // ── 6. Overtrading ───────────────────────────────────────────────────
  if (playbook && playbook.max_trades_per_day > 0) {
    const dailyCounts = trades.reduce<Record<string, number>>((acc, t) => {
      const d = t.date_time.slice(0, 10);
      acc[d] = (acc[d] ?? 0) + 1;
      return acc;
    }, {});
    const overtradingDays = Object.values(dailyCounts).filter(
      (c) => c > playbook.max_trades_per_day
    ).length;
    if (overtradingDays > 0) {
      insights.push({
        id: "overtrading",
        type: "weakness",
        category: "discipline",
        title: `Overtrading detected on ${overtradingDays} day${overtradingDays > 1 ? "s" : ""}`,
        description: `You exceeded your ${playbook.max_trades_per_day} trade/day limit. Overtrading is a primary cause of compounding losses — quality always beats quantity.`,
        data_points: [
          `Your limit: ${playbook.max_trades_per_day} trades/day`,
          `Days exceeded: ${overtradingDays}`,
        ],
        confidence: "high",
        timeframe: "all_time",
      });
    }
  }

  // ── 7. R:R quality ───────────────────────────────────────────────────
  const lowRR = trades.filter((t) => t.rr < 1.5).length;
  const highRR = trades.filter((t) => t.rr >= 2.5).length;
  if (lowRR >= 3 && lowRR > highRR) {
    insights.push({
      id: "rr-quality",
      type: "suggestion",
      category: "performance",
      title: "Raise your minimum R:R threshold",
      description: `${lowRR} trades were taken below 1.5R — more than your high-quality trades. Only entering at 2R+ significantly improves your mathematical expectancy.`,
      data_points: [
        `Trades below 1.5R: ${lowRR}`,
        `Trades above 2.5R: ${highRR}`,
        "Aim for 2R+ as your minimum entry criterion",
      ],
      confidence: "medium",
      timeframe: "all_time",
    });
  }

  // ── 8. Prompt to enable discipline scoring ───────────────────────────
  if (withDisc.length === 0 && trades.length >= 3) {
    insights.push({
      id: "enable-discipline",
      type: "suggestion",
      category: "discipline",
      title: "Enable Discipline Scoring for deeper insights",
      description:
        "None of your trades have process data yet. Score your discipline on each trade to unlock powerful correlation analysis between behavior and results.",
      data_points: [
        "Takes 30 seconds per trade",
        "Unlocks 3+ additional insight types",
        "Shows exactly which rules drive your P&L",
      ],
      confidence: "high",
      timeframe: "all_time",
    });
  }

  return insights.slice(0, 9);
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
  _playbook = undefined;
  _dailyStates = null;
}
