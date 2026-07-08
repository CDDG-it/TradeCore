/**
 * Market Intelligence Hub — data model.
 *
 * Every signal is backed by a plain data object so the scene (Three.js nodes)
 * stays a dumb renderer and the content can later be swapped for a live news /
 * economic-calendar / AI-summary feed without touching any component.
 */

export type Direction = "hawkish" | "dovish" | "neutral";
export type TrendDirection = "rising" | "falling" | "flat";
export type Sentiment = "risk-on" | "risk-off" | "neutral";
export type RiskLevel = "low" | "moderate" | "elevated" | "high";

/** A one-glance market consequence, e.g. { label: "NASDAQ", direction: "down" }. */
export interface MarketImpact {
  label: string;
  direction: "up" | "down";
}

export interface CentralBank {
  id: "fed" | "ecb" | "boj";
  name: string;
  shortName: string;
  headline: string;
  rate: string;
  rateExpectation: string;
  direction: Direction;
  /** Liquidity stance, e.g. "Restrictive" / "Easing". */
  liquidity: string;
  impacts: MarketImpact[];
  impact: string;
  lastUpdated: string;
}

export interface Commodity {
  id: "oil" | "gold";
  name: string;
  price: string;
  change: string;
  direction: TrendDirection;
  supplyRisk: "low" | "medium" | "high";
  geopoliticalImpact: string;
  headline: string;
}

export interface MacroForce {
  id: "inflation" | "employment" | "growth";
  name: string;
  headline: string;
  metric: string;
  metricLabel: string;
  direction: TrendDirection;
  /** Display strength of the force, e.g. "HIGH" / "MODERATE" / "POSITIVE". */
  level: string;
  /** 0..1 — drives how much energy the node radiates in the scene. */
  intensity: number;
  impact: string;
}

export interface EarningsEvent {
  id: string;
  ticker: string;
  company: string;
  headline: string;
  /** e.g. "+12% beat" / "-4% miss". */
  surprise: string;
  direction: TrendDirection;
  impact: string;
}

export interface IndexQuote {
  id: "nq" | "es";
  name: string;
  ticker: string;
  price: string;
  change: string;
  direction: TrendDirection;
}

export interface MarketHQ {
  sentiment: Sentiment;
  regime: string;
  drivers: string[];
  indices: IndexQuote[];
}

export interface CityOverview {
  riskLevel: RiskLevel;
  mainDriver: string;
  latestEvent: string;
  sentiment: Sentiment;
  /** Display volatility, e.g. "Medium". */
  volatility: string;
}

// ── Intelligence feed ────────────────────────────────────────────────────
// The live signal feed that sits alongside the 3D hub. Each signal is tagged
// with the category node it belongs to so it can focus the camera there.

export type NewsCategory = "central-bank" | "commodity" | "macro" | "markets" | "earnings" | "geopolitics";
export type NewsImpact = "low" | "medium" | "high" | "very-high";
export type SignalTag = "alert" | "event";

export interface NewsItem {
  id: string;
  tag: SignalTag;
  /** Human label, e.g. "12m ago". */
  time: string;
  /** Minutes since publication — used for sorting/filtering. */
  minutesAgo: number;
  source: string;
  category: NewsCategory;
  impact: NewsImpact;
  direction: "up" | "down" | "neutral";
  title: string;
  /** Short "Market Impact:" line, e.g. "NASDAQ ↓". */
  marketImpact: string;
  /** 0..100 — how confident the read on this signal is. */
  confidence: number;
  whatHappened: string;
  whyItMatters: string;
  historicalContext: string;
  affectedAssets: string[];
  tickers: string[];
}

export interface NewsCityData {
  overview: CityOverview;
  centralBanks: CentralBank[];
  commodities: Commodity[];
  macroForces: MacroForce[];
  earnings: EarningsEvent[];
  marketHQ: MarketHQ;
  news: NewsItem[];
}
