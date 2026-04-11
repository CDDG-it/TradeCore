export type Bias = "bullish" | "bearish" | "neutral";
export type Direction = "long" | "short";
export type TradeResult = "win" | "loss" | "break-even";
export type Market = "futures" | "commodities";
export type Session = "London" | "New York" | "Asia";
export type AccountPhase = "evaluation" | "funded" | "payout";
export type AccountStatus = "active" | "inactive" | "blown" | "passed";
export type PayoutStatus = "pending" | "paid" | "rejected";
export type ImpactLevel = "high" | "medium" | "low";
export type MarketRegime = "trending" | "ranging" | "choppy";
export type VolatilityLevel = "low" | "medium" | "high" | "extreme";
export type TraderType = "scalper" | "day_trader" | "swing" | "position" | "custom";
export type InsightType = "strength" | "weakness" | "pattern" | "suggestion" | "blind_spot";
export type InsightCategory = "performance" | "discipline" | "psychology" | "market" | "habits";

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

/** A labeled group of screenshots (e.g. "HTF", "LTF", "Entry") */
export interface ScreenshotGroup {
  label: string;
  urls: string[];
}

// ── Trader Playbook ─────────────────────────────────────────────────────────
export interface TraderPlaybook {
  trader_type: TraderType;
  trading_style: string;
  markets: string[];
  preferred_sessions: string[];
  preferred_setups: string[];
  preferred_timeframes: string[];
  max_trades_per_day: number;
  max_daily_risk_percent: number;
  ideal_market_conditions: string;
  a_plus_criteria: string;
  non_negotiable_rules: string[];
  common_weaknesses: string[];
  pre_trade_routine: string[];
  updated_at: string;
}

// ── Trade Discipline Score ──────────────────────────────────────────────────
export interface TradeDiscipline {
  followed_plan: boolean;
  traded_in_session: boolean;
  respected_risk: boolean;
  respected_max_trades: boolean;
  matched_a_plus: boolean;
  no_impulsive_entry: boolean;
  no_revenge_trade: boolean;
  respected_stop_loss: boolean;
  journal_completed: boolean;
  /** Computed 0–100 from the boolean fields above */
  score: number;
  notes: string;
}

// ── Market Context ──────────────────────────────────────────────────────────
export interface TradeMarketContext {
  regime: MarketRegime;
  volatility: VolatilityLevel;
  news_day: boolean;
  major_event: boolean;
  htf_bias: Bias;
  /** Trader's confidence in their read of the context, 1–5 */
  confidence: number;
  notes: string;
}

// ── Daily Command Center State ──────────────────────────────────────────────
export interface DailyCommandState {
  date: string;
  focus_note: string;
  /** Parallel boolean array matching playbook.pre_trade_routine */
  pre_trade_checklist: boolean[];
  market_context: Partial<TradeMarketContext>;
  eod_reflection: string;
  updated_at: string;
}

// ── Coaching Insights ───────────────────────────────────────────────────────
export interface CoachingInsight {
  id: string;
  type: InsightType;
  category: InsightCategory;
  title: string;
  description: string;
  data_points: string[];
  confidence: "high" | "medium" | "low";
  timeframe: "recent" | "monthly" | "all_time";
}

// ── Core Domain Types ───────────────────────────────────────────────────────
export interface PreTradeAnalysis {
  id: string;
  user_id: string;
  title: string;
  date: string;
  instrument: string;
  market: Market;
  session: Session;
  bias: Bias;
  thesis: string;
  long_scenario: string;
  short_scenario: string;
  notes: string;
  screenshot_groups: ScreenshotGroup[];
  used_for_trade: boolean;
  created_at: string;
  updated_at: string;
}

export interface TradeJournalEntry {
  id: string;
  user_id: string;
  linked_analysis_id?: string;
  /** ISO date string (date only, e.g. "2026-04-09") */
  date_time: string;
  instrument: string;
  market: Market;
  session: Session;
  /** Timeframe(s) used e.g. "1H / 15m" */
  timeframe: string;
  direction: Direction;
  confluences: string[];
  rr: number;
  result: TradeResult;
  screenshot_groups: ScreenshotGroup[];
  execution_notes: string;
  psychology_notes: string;
  mistakes: string;
  lessons: string;
  /** Optional process discipline self-assessment */
  discipline?: TradeDiscipline;
  /** Optional structured market context at time of trade */
  market_context?: TradeMarketContext;
  created_at: string;
  updated_at: string;
}

export interface FundedAccount {
  id: string;
  user_id: string;
  firm_name: string;
  account_name: string;
  account_type: string;
  phase: AccountPhase;
  account_size: number;
  /** Real out-of-pocket cost paid to the prop firm (e.g. $149 eval fee) */
  purchase_cost: number;
  start_balance: number;
  current_balance: number;
  /** ROI based on purchase_cost, not account size */
  roi: number;
  max_drawdown: number;
  trailing_drawdown?: number;
  drawdown_used: number;
  payout_total: number;
  next_payout_target: number;
  status: AccountStatus;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface PayoutEvent {
  id: string;
  funded_account_id: string;
  payout_date: string;
  amount: number;
  status: PayoutStatus;
  notes: string;
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source_name: string;
  source_url: string;
  published_at: string;
  market_tags: string[];
  impact_level: ImpactLevel;
  asset_tags: string[];
  image_url?: string;
  is_featured: boolean;
}

// ── Habit Tracker ────────────────────────────────────────────────────────────
export type HabitFrequency = "daily" | "weekdays" | "weekends";
export type HabitCategory = "mindset" | "routine" | "research" | "health" | "review" | "other";

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  category: HabitCategory;
  frequency: HabitFrequency;
  target_days: number;
  color: string;
  icon: string;
  created_at: string;
  updated_at: string;
}

export interface HabitCompletion {
  id: string;
  habit_id: string;
  date: string;
  completed: boolean;
  notes?: string;
}

export interface DailyTask {
  id: string;
  user_id: string;
  date: string;
  text: string;
  completed: boolean;
  priority: "high" | "medium" | "low";
  created_at: string;
}

// ── Form / Input types ───────────────────────────────────────────────────────
export type PreTradeAnalysisInput = Omit<PreTradeAnalysis, "id" | "user_id" | "created_at" | "updated_at">;
export type TradeJournalEntryInput = Omit<TradeJournalEntry, "id" | "user_id" | "created_at" | "updated_at">;
export type FundedAccountInput = Omit<FundedAccount, "id" | "user_id" | "created_at" | "updated_at">;

// ── Dashboard stats ──────────────────────────────────────────────────────────
export interface DashboardStats {
  total_trades: number;
  win_rate: number;
  break_even_rate: number;
  average_rr: number;
  active_accounts: number;
  total_payouts: number;
  total_drawdown_used: number;
}
