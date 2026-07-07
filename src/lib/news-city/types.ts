/**
 * MC News City — data model.
 *
 * Every location in the city is backed by a plain data object so the scene
 * (Three.js meshes) stays a dumb renderer and the content can later be swapped
 * for a live news / economic-calendar feed without touching any component.
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
  /** 0..1 — drives how much energy the engine radiates in the scene. */
  intensity: number;
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

export interface NewsCityData {
  overview: CityOverview;
  centralBanks: CentralBank[];
  commodities: Commodity[];
  macroForces: MacroForce[];
  marketHQ: MarketHQ;
}
