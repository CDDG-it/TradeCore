/**
 * In-memory mock store with CRUD operations.
 * This module simulates a database layer. When Supabase is connected,
 * replace these functions with real DB queries — the interface stays the same.
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
} from "@/lib/types";
import {
  mockAnalyses,
  mockTrades,
  mockAccounts,
  mockPayouts,
  mockNews,
} from "./data";

// Mutable copies
let analyses = [...mockAnalyses];
let trades = [...mockTrades];
let accounts = [...mockAccounts];
let payouts = [...mockPayouts];
const news = [...mockNews];

function generateId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function now() {
  return new Date().toISOString();
}

// ── Pre-Trade Analysis ──────────────────────────────────────────────
export function getAnalyses(): PreTradeAnalysis[] {
  return [...analyses].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function getAnalysisById(id: string): PreTradeAnalysis | undefined {
  return analyses.find((a) => a.id === id);
}

export function createAnalysis(input: PreTradeAnalysisInput): PreTradeAnalysis {
  const analysis: PreTradeAnalysis = {
    ...input,
    id: generateId("analysis"),
    user_id: "user_1",
    created_at: now(),
    updated_at: now(),
  };
  analyses = [analysis, ...analyses];
  return analysis;
}

export function updateAnalysis(id: string, input: Partial<PreTradeAnalysisInput>): PreTradeAnalysis | undefined {
  const idx = analyses.findIndex((a) => a.id === id);
  if (idx === -1) return undefined;
  analyses[idx] = { ...analyses[idx], ...input, updated_at: now() };
  return analyses[idx];
}

export function deleteAnalysis(id: string): boolean {
  const len = analyses.length;
  analyses = analyses.filter((a) => a.id !== id);
  return analyses.length < len;
}

// ── Trade Journal ───────────────────────────────────────────────────
export function getTrades(): TradeJournalEntry[] {
  return [...trades].sort(
    (a, b) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime()
  );
}

export function getTradeById(id: string): TradeJournalEntry | undefined {
  return trades.find((t) => t.id === id);
}

export function createTrade(input: TradeJournalEntryInput): TradeJournalEntry {
  const trade: TradeJournalEntry = {
    ...input,
    id: generateId("trade"),
    user_id: "user_1",
    created_at: now(),
    updated_at: now(),
  };
  trades = [trade, ...trades];
  return trade;
}

export function updateTrade(id: string, input: Partial<TradeJournalEntryInput>): TradeJournalEntry | undefined {
  const idx = trades.findIndex((t) => t.id === id);
  if (idx === -1) return undefined;
  trades[idx] = { ...trades[idx], ...input, updated_at: now() };
  return trades[idx];
}

export function deleteTrade(id: string): boolean {
  const len = trades.length;
  trades = trades.filter((t) => t.id !== id);
  return trades.length < len;
}

// ── Funded Accounts ─────────────────────────────────────────────────
export function getAccounts(): FundedAccount[] {
  return [...accounts].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );
}

export function getAccountById(id: string): FundedAccount | undefined {
  return accounts.find((a) => a.id === id);
}

export function createAccount(input: FundedAccountInput): FundedAccount {
  const account: FundedAccount = {
    ...input,
    id: generateId("acct"),
    user_id: "user_1",
    created_at: now(),
    updated_at: now(),
  };
  accounts = [account, ...accounts];
  return account;
}

export function updateAccount(id: string, input: Partial<FundedAccountInput>): FundedAccount | undefined {
  const idx = accounts.findIndex((a) => a.id === id);
  if (idx === -1) return undefined;
  accounts[idx] = { ...accounts[idx], ...input, updated_at: now() };
  return accounts[idx];
}

export function deleteAccount(id: string): boolean {
  const len = accounts.length;
  accounts = accounts.filter((a) => a.id !== id);
  return accounts.length < len;
}

// ── Payouts ─────────────────────────────────────────────────────────
export function getPayoutsByAccountId(accountId: string): PayoutEvent[] {
  return payouts
    .filter((p) => p.funded_account_id === accountId)
    .sort((a, b) => new Date(b.payout_date).getTime() - new Date(a.payout_date).getTime());
}

export function createPayout(input: Omit<PayoutEvent, "id">): PayoutEvent {
  const payout: PayoutEvent = { ...input, id: generateId("payout") };
  payouts = [payout, ...payouts];
  return payout;
}

// ── News ────────────────────────────────────────────────────────────
export function getNews(filters?: {
  market?: string;
  impact?: string;
  asset?: string;
}): NewsItem[] {
  let result = [...news];
  if (filters?.market) {
    result = result.filter((n) => n.market_tags.includes(filters.market!));
  }
  if (filters?.impact) {
    result = result.filter((n) => n.impact_level === filters.impact);
  }
  if (filters?.asset) {
    result = result.filter((n) =>
      n.asset_tags.some((t) => t.toLowerCase().includes(filters.asset!.toLowerCase()))
    );
  }
  return result.sort(
    (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  );
}

export function getFeaturedNews(): NewsItem[] {
  return news.filter((n) => n.is_featured);
}

// ── Dashboard Stats ─────────────────────────────────────────────────
export function getDashboardStats(): DashboardStats {
  const allTrades = getTrades();
  const wins = allTrades.filter((t) => t.result === "win");
  const breakEvens = allTrades.filter((t) => t.result === "break-even");
  const activeAccts = getAccounts().filter((a) => a.status === "active");

  return {
    total_trades: allTrades.length,
    win_rate: allTrades.length > 0 ? Math.round((wins.length / allTrades.length) * 100) : 0,
    break_even_rate: allTrades.length > 0 ? Math.round((breakEvens.length / allTrades.length) * 100) : 0,
    average_rr: allTrades.length > 0
      ? Math.round((allTrades.reduce((sum, t) => sum + t.rr, 0) / allTrades.length) * 100) / 100
      : 0,
    total_pnl: allTrades.reduce((sum, t) => sum + t.pnl, 0),
    active_accounts: activeAccts.length,
    total_payouts: activeAccts.reduce((sum, a) => sum + a.payout_total, 0),
    total_drawdown_used: activeAccts.reduce((sum, a) => sum + a.drawdown_used, 0),
  };
}
