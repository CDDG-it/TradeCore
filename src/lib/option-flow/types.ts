/**
 * Option Flow data model.
 *
 * Mirrors the output shapes of the Python options engine (`/option/engine.py`):
 *   - Zones        → engine `_merge_zones` / `zone_status.tag_zone_status`
 *   - SessionLevels→ data/session_levels.py `compute_session_levels`
 *   - Cot          → analysis/cot_bias.py `score_cot`
 *   - WeeklyBias   → analysis/weekly_bias.py `compute_weekly_bias`
 *   - MacroScore   → analysis/weekly_bias.py `score_macro`
 *
 * Mock data lives in `./data.ts`. When the live Python pipeline (or a Supabase
 * cache of it) is wired up, only the loader in `./data.ts` needs to change —
 * these shapes stay stable.
 */

export type InstrumentKey = "NQ" | "GC";
export type Timeframe = "weekly" | "intraday";
export type ZoneSide = "resistance" | "support";

/** untested → never traded into; approaching → price near; defended → rejected; broken → traded through */
export type ZoneStatus = "untested" | "approaching" | "defended" | "broken";
export type ZoneConfidence = "STRONG" | "HIGH" | "MEDIUM" | "LOW" | "BREAKING";
export type BiasDirection = "BULLISH" | "BEARISH" | "NEUTRAL";
export type ConfidenceLabel = "High" | "Moderate" | "Low";

export interface Zone {
  /** Native futures price of the level */
  price: number;
  /** Confluence sources that produced/confirmed this level (e.g. "PDH", "OI call wall", "VWAP +1σ") */
  sources: string[];
  /** 1–5; higher = more confluence agrees here */
  strength: number;
  status: ZoneStatus;
  confidence: ZoneConfidence;
}

export interface Zones {
  resistance: Zone[];
  support: Zone[];
}

/** Named session levels — all in native futures points. Null = not available this session. */
export interface SessionLevels {
  // Prior day RTH
  PDH: number | null;
  PDL: number | null;
  PDC: number | null;
  PDO: number | null;
  // Overnight / Globex
  ONH: number | null;
  ONL: number | null;
  // World sessions
  Asia_H: number | null;
  Asia_L: number | null;
  London_H: number | null;
  London_L: number | null;
  PreNY_H: number | null;
  PreNY_L: number | null;
  // RTH
  ORH: number | null;
  ORL: number | null;
  Sess_H: number | null;
  Sess_L: number | null;
  // VWAP + standard-deviation bands
  VWAP: number | null;
  "VWAP+1": number | null;
  "VWAP+2": number | null;
  "VWAP-1": number | null;
  "VWAP-2": number | null;
}

/** One weekly COT print + analysis (CFTC large-spec positioning). */
export interface Cot {
  score: number; // -1 .. +1
  label: BiasDirection | "bullish" | "bearish" | "neutral";
  net_spec: number; // large speculator net contracts
  net_spec_chg: number; // week-over-week change
  normalized_positioning: number; // 0 (max short) .. 1 (max long) vs 26wk range
  momentum_4wk: number; // -1 .. +1
  net_comm: number; // commercial hedger net (contrarian)
  open_interest: number;
  /** 26-week net-spec history for the area chart */
  history: { date: string; net_spec: number }[];
}

/** Weekly directional bias = 40% COT + 35% macro + 25% PCR. */
export interface WeeklyBias {
  bias: BiasDirection;
  score: number; // -1 .. +1
  confidence: ConfidenceLabel;
  components: {
    cot: number;
    macro: number;
    pcr: number;
  };
}

export interface MacroScore {
  name: "DXY" | "CRUDE" | "COPPER";
  score: number; // -1 .. +1
  label: "bullish" | "bearish" | "neutral";
  /** signed correlation weight to the instrument (sign = direction of influence) */
  relationship: number;
}

/**
 * Put/Call ratio context from the options chain.
 * Null when the source (e.g. free Yahoo Finance) does not expose futures options.
 */
export interface OiContext {
  pcr: number | null;
  pcr_bias: "bullish" | "bearish" | "neutral" | "unavailable";
  max_pain: number | null;
  gex_flip: number | null;
}

export interface InstrumentFlow {
  key: InstrumentKey;
  label: string;
  spot: number;
  /** ISO timestamp of when this snapshot was produced */
  updatedAt: string;
  dataSource: "tastytrade" | "yfinance" | "yahoo" | "mock";
  /** True when built from live market data, false for mock fallback */
  live: boolean;
  /** Optional caveat about data completeness (e.g. PCR not available) */
  note?: string;
  bias: WeeklyBias;
  cot: Cot;
  macro: MacroScore[];
  oi: OiContext;
  sessionLevels: SessionLevels;
  zones: {
    weekly: Zones;
    intraday: Zones;
  };
}
