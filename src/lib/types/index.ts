export type Bias = "bullish" | "bearish" | "choppy";
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

/** Best trade of the day — one per calendar day, whether or not you traded. */
export interface BestTradeOfDay {
  id: string;
  user_id: string;
  date: string; // ISO date (day)
  taken_was_best: boolean;
  notes: string;
  /** Free-form post-market recap of the whole session — what the market did,
   *  which setups appeared, how the day should have been traded. */
  post_market_analysis: string;
  screenshot_groups: ScreenshotGroup[];
  created_at: string;
  updated_at: string;
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
  /** Computed 0–100 from the boolean fields above + custom_checks */
  score: number;
  notes: string;
  /** User-defined custom discipline rules */
  custom_checks?: { label: string; passed: boolean }[];
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
  /** Entry (execution) time e.g. "09:32" */
  execution_time?: string;
  /** Exit time e.g. "10:14" */
  execution_end_time?: string;
  /** Subjective execution quality rating */
  execution_quality?: "good" | "bad";
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
  /** Date the account/eval was purchased */
  purchase_date?: string;
  /** Date the account went inactive/expired */
  inactive_date?: string;
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

// ── Self-Improvement ─────────────────────────────────────────────────────────

export interface DailyJournalEntry {
  id: string;
  user_id: string;
  date: string; // ISO date "2026-04-13"
  mood_note: string;
  mental_state: string;
  what_went_well: string;
  what_hurt_performance: string;
  improve_tomorrow: string;
  created_at: string;
  updated_at: string;
}

export interface DailyStateCheck {
  id: string;
  user_id: string;
  date: string;
  mood: number; // 1-10
  energy: number;
  focus: number;
  stress: number;
  confidence: number;
  emotional_stability: number;
  patience: number;
  impulsiveness: number; // 1=low impulsive (good), 10=high impulsive (bad)
  created_at: string;
  updated_at: string;
}

export interface SleepRecovery {
  id: string;
  user_id: string;
  date: string;
  hours_slept: number;
  sleep_quality: number; // 1-10
  training_movement: boolean;
  screen_discipline: number; // 1-10 (10=great discipline)
  rest_quality: number; // 1-10
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface PersonalStandard {
  id: string;
  user_id: string;
  text: string; // e.g. "I stay calm under pressure"
  created_at: string;
}

export interface PersonalStandardScore {
  id: string;
  standard_id: string;
  date: string;
  lived: boolean; // did they live up to this standard today?
  created_at: string;
}

export interface WeeklyReflection {
  id: string;
  user_id: string;
  week_start: string; // ISO date of Monday
  best_habits: string;
  biggest_weakness: string;
  emotional_patterns: string;
  what_improved: string;
  what_hurt_performance: string;
  focus_next_week: string;
  created_at: string;
  updated_at: string;
}

/** Trade-focused weekly review attached to the Journal page. The trade stats
 *  are derived from the journal; only the qualitative fields and the per-day
 *  "did I take the best trade" flags are persisted here. */
export interface WeeklyTradeReview {
  id: string;
  user_id: string;
  week_start: string; // ISO date of Monday
  mistakes: string;
  lessons: string;
  prevention_plan: string;
  /** Map of ISO date -> whether you took the best available trade that day
   *  (true on no-trade days means staying out was the right call). */
  best_trade_days: Record<string, boolean>;
  created_at: string;
  updated_at: string;
}

export type WeeklyTradeReviewInput = Omit<
  WeeklyTradeReview,
  "id" | "user_id" | "created_at" | "updated_at"
>;

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

// ── Psychological Edge ────────────────────────────────────────────────────────
// A generated coaching session: reads the trade journal, finds contradictions
// and behavioral patterns, and produces one measurable objective for the next
// session. The facts (report/relate) come entirely from the journal — the
// trader is never asked to re-type anything that's already logged. The only
// things the trader adds are a one-tap emotional tag and a short written
// answer to the engine's targeted "why" question, which becomes memory for
// the next session's commitment check.
export type PsychEdgeResponseTag = "calm" | "anxious" | "euphoric" | "frustrated" | "rushed" | "numb";

export interface PsychEdgeSession {
  id: string;
  user_id: string;
  /** ISO date (day) this session was generated on. */
  date: string;
  /** The most recent trade this session's analysis is based on, if any. */
  trade_id: string | null;
  /** Stable key identifying the behavioral pattern driving this session's
   *  focus, e.g. "recurring-rule:no-revenge-trade" or "bias-mismatch" — used
   *  to check next session whether the same pattern recurred. */
  pattern_key: string | null;
  /** Human label for the pattern, e.g. the broken rule's own wording. */
  recurring_pattern_label: string | null;
  /** Report — a factual, no-judgement recap of the trade this session covers. */
  report: string;
  /** Relate — how this trade connects to trailing history, if anything does. */
  relate: string | null;
  /** Reason — the engine's targeted challenge question for this trade. */
  reason: string;
  primary_objective: string | null;
  reminder: string | null;
  success_metric: string | null;
  /** Respond — one-tap emotional read of the trade, set by the trader. */
  response_tag: PsychEdgeResponseTag | null;
  /** Respond — how strongly that emotion ran, 1 (barely) – 5 (overwhelming). */
  emotion_intensity: number | null;
  /** Reason, trader's side — their own written answer to `reason` (why it happened). */
  reasoning_answer: string | null;
  /** Reason, deeper — the trader spelling out why this was a mistake and what it
   *  actually cost them (the R, the rule, the trust in their own process). */
  mistake_cost: string | null;
  /** Reconstruct — the trader's own, explicit commitment not to repeat this,
   *  in their own words. Required before a reflection can be committed. */
  commitment_statement: string | null;
  /** Reconstruct — optional trader override/addition to `primary_objective`. */
  reconstruction_note: string | null;
  /** Whether the trader has explicitly committed to today's objective. */
  reconstruction_confirmed: boolean;
  created_at: string;
  updated_at: string;
}

export type PsychEdgeSessionInput = Omit<
  PsychEdgeSession,
  "id" | "user_id" | "created_at" | "updated_at"
>;

// ── MC Trade Therapist ────────────────────────────────────────────────────────
// A deterministic, data-driven behavioural coach. Everything below is derived
// from — and traceable to — the trader's own trade history. No LLM, no generic
// motivation: the pattern engine (src/lib/psych-edge/patterns.ts) fires on fixed,
// explainable thresholds, and each finding carries the concrete numbers behind it.

/** The four behavioural patterns the engine detects. Each is rule-based with a
 *  fixed threshold and an explainable confidence score. */
export type PatternType = "revenge" | "size-escalation" | "overtrading" | "plan-deviation";

/** A single occurrence of a pattern the engine detected on one trade. Persisted
 *  so the Pre-Trade Mirror can point back to concrete past situations, and so a
 *  cumulative P&L impact per pattern can be tracked over time. The row is a log
 *  of a deterministic detection — recomputable from trades — plus the trader's
 *  own confirm/refute from the 5R "Relating" step. */
export interface PatternEvent {
  id: string;
  user_id: string;
  /** The trade the pattern fired on. */
  trade_id: string;
  /** ISO day of that trade. */
  date: string;
  pattern_type: PatternType;
  /** 0–1, built deterministically from the threshold overshoot. */
  confidence: number;
  /** R contribution of the focus trade — the cost (or gain) attributed to this event. */
  r_impact: number;
  /** Deterministic, human-readable explanation with the numbers behind it. */
  detail: string;
  /** Trader's response in the 5R "Relating" step: true = recognised, false =
   *  refuted, null = not yet reviewed. */
  trader_confirmed: boolean | null;
  created_at: string;
}

export type PatternEventInput = Omit<PatternEvent, "id" | "user_id" | "created_at">;

/** An if-then commitment the trader wrote in the 5R "Reconstructing" step
 *  ("als [trigger], dan [actie]"). Stored and linked to the pattern it addresses
 *  so the next Pre-Trade Mirror can resurface it, and so adherence can be tracked. */
export interface Commitment {
  id: string;
  user_id: string;
  /** The trade whose 5R session produced this commitment, if any. */
  trade_id: string | null;
  /** Which behavioural pattern this commitment is meant to counter. */
  pattern_type: PatternType | null;
  /** The "if" — the trigger condition, in the trader's own words. */
  trigger_text: string;
  /** The "then" — the committed action. */
  action_text: string;
  /** Still in force. Superseded commitments are kept for history but deactivated. */
  active: boolean;
  created_at: string;
  updated_at: string;
}

export type CommitmentInput = Omit<Commitment, "id" | "user_id" | "created_at" | "updated_at">;

/** One check of whether a commitment was honoured. Written whenever a
 *  commitment's trigger re-matches a later situation (in the Pre-Trade Mirror or
 *  a later 5R session): did the trader follow the commitment this time? This is
 *  the signal that measures behaviour change, not just journaling. */
export interface CommitmentAdherenceLog {
  id: string;
  user_id: string;
  commitment_id: string;
  /** The trade the re-match was checked against, if the check is trade-anchored. */
  trade_id: string | null;
  date: string;
  /** The trigger matched this situation (i.e. the commitment was relevant). */
  matched: boolean;
  /** Whether the trader followed the commitment. null until resolved. */
  followed: boolean | null;
  created_at: string;
}

export type CommitmentAdherenceLogInput = Omit<CommitmentAdherenceLog, "id" | "user_id" | "created_at">;
