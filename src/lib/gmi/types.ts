/**
 * Global Markets Intelligence — shared data-layer types.
 *
 * Every dataset the page shows is wrapped in a {@link DataEnvelope} so the UI
 * can always state, honestly, where a number came from, when it was captured,
 * and whether it is realtime, delayed, or stale. Nothing is ever fabricated:
 * when a provider has no value we return `status: "unavailable"`, never a guess.
 */

/** How fresh a dataset is, by its provider's nature — drives the status badge. */
export type DataFreshness =
  | "realtime"
  | "delayed"
  | "daily"
  | "weekly"
  | "monthly";

/** Runtime state of a fetched dataset. */
export type DataStatus = "ok" | "stale" | "unavailable";

/** A standard wrapper around any provider payload. */
export interface DataEnvelope<T> {
  data: T | null;
  /** Human-readable provider, e.g. "Yahoo Finance", "FRED", "Marketaux". */
  source: string;
  /** The provider's inherent update cadence. */
  freshness: DataFreshness;
  /** ISO timestamp of when the underlying data was captured/published. */
  asOf: string | null;
  /** ISO timestamp of when our server last fetched it. */
  fetchedAt: string;
  status: DataStatus;
  /** Present only when status is "stale" or "unavailable". */
  error?: string;
}

/** A single quote used by the ticker header, pulse cards and futures grid. */
export interface Quote {
  symbol: string;
  label: string;
  /** Broad class, so the UI can group/format appropriately. */
  kind: "index" | "future" | "commodity" | "fx" | "rate" | "vol" | "crypto";
  price: number | null;
  change: number | null;
  changePct: number | null;
  prevClose: number | null;
  dayHigh?: number | null;
  dayLow?: number | null;
  volume?: number | null;
  /** ~40-point intraday close series for a sparkline; empty when unavailable. */
  spark: number[];
  /** Unit suffix for display, e.g. "%", or "" for plain price. */
  unit?: string;
  asOf: string | null;
}

/** One FRED (or Treasury) macro series point set. */
export interface MacroSeries {
  id: string;
  label: string;
  /** Latest observed value. */
  value: number | null;
  unit: string;
  freshness: DataFreshness;
  asOf: string | null;
  /** Prior-period change values, null when history is too short. */
  changeDay?: number | null;
  changeWeek?: number | null;
  changeMonth?: number | null;
  /** Downsampled recent history for a sparkline / curve. */
  history: { date: string; value: number }[];
  status: DataStatus;
}

/** A news article, objective fields only — sentiment shown as the provider's own score. */
export interface NewsArticle {
  id: string;
  title: string;
  snippet: string;
  url: string;
  source: string;
  publishedAt: string;
  /** Tickers/entities the provider tagged, e.g. ["NVDA","SOX"]. */
  assets: string[];
  /** Provider sentiment score in [-1,1], or null when not supplied. Never invented. */
  sentimentScore: number | null;
  category: string | null;
}

/** Per-company earnings, EPS only on the free TwelveData tier (revenue may be null). */
export interface EarningsRow {
  symbol: string;
  name: string;
  date: string;
  time: string | null;
  epsEstimate: number | null;
  epsActual: number | null;
  epsSurprisePct: number | null;
  revenueEstimate: number | null;
  revenueActual: number | null;
  revenueSurprisePct: number | null;
}
