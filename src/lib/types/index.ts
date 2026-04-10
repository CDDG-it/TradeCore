export type Bias = "bullish" | "bearish" | "neutral";
export type Direction = "long" | "short";
export type TradeResult = "win" | "loss" | "break-even";
export type Market = "futures" | "commodities";
export type Session = "London" | "New York" | "Asia";
export type AccountPhase = "evaluation" | "funded" | "payout";
export type AccountStatus = "active" | "inactive" | "blown" | "passed";
export type PayoutStatus = "pending" | "paid" | "rejected";
export type ImpactLevel = "high" | "medium" | "low";

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

// Form types for create/edit
export type PreTradeAnalysisInput = Omit<PreTradeAnalysis, "id" | "user_id" | "created_at" | "updated_at">;
export type TradeJournalEntryInput = Omit<TradeJournalEntry, "id" | "user_id" | "created_at" | "updated_at">;
export type FundedAccountInput = Omit<FundedAccount, "id" | "user_id" | "created_at" | "updated_at">;

// Dashboard stats
export interface DashboardStats {
  total_trades: number;
  win_rate: number;
  break_even_rate: number;
  average_rr: number;
  active_accounts: number;
  total_payouts: number;
  total_drawdown_used: number;
}
