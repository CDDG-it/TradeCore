export type Bias = "bullish" | "bearish" | "neutral";
export type Direction = "long" | "short";
export type TradeResult = "win" | "loss" | "break-even";
export type Market = "futures" | "commodities" | "forex" | "crypto";
export type Session = "London" | "New York" | "Asia" | "Pre-market" | "Post-market";
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
  key_levels: string[];
  planned_setup: string;
  confluences: string[];
  invalidation: string;
  notes: string;
  screenshot_urls: string[];
  used_for_trade: boolean;
  created_at: string;
  updated_at: string;
}

export interface TradeJournalEntry {
  id: string;
  user_id: string;
  linked_analysis_id?: string;
  date_time: string;
  instrument: string;
  market: Market;
  session: Session;
  direction: Direction;
  setup: string;
  confluences: string[];
  entry_price?: number;
  stop_loss?: number;
  take_profit?: number;
  rr: number;
  result: TradeResult;
  pnl: number;
  screenshot_urls: string[];
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
  start_balance: number;
  current_balance: number;
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
  total_pnl: number;
  active_accounts: number;
  total_payouts: number;
  total_drawdown_used: number;
}
