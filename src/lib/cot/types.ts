/**
 * COT (Commitment of Traders) — data model.
 *
 * Sourced from the CFTC's weekly Legacy Futures-Only report, which splits every
 * futures market's open interest into three trader groups:
 *   • Large speculators (non-commercial) — funds & trend followers, the
 *     directional "smart money" this dashboard leads with.
 *   • Commercials — producers & hedgers, usually the other side of the specs.
 *   • Small traders (non-reportable) — retail.
 *
 * The report is published every Friday for the prior Tuesday, so the whole
 * dashboard refreshes weekly. Every number is real; nothing is synthesised.
 */

export type CotGroup = "index" | "metal" | "energy";
export type CotBias = "long" | "short" | "neutral";

/** One weekly report row for one market. */
export interface CotWeek {
  date: string; // yyyy-MM-dd (report Tuesday)
  specLong: number;
  specShort: number;
  commLong: number;
  commShort: number;
  retailLong: number;
  retailShort: number;
  openInterest: number;
  /** Large-speculator net position (long − short). The headline number. */
  netSpec: number;
  netComm: number;
  netRetail: number;
}

/** A plain-language read on what this week's positioning implies. */
export type CotSignalKind =
  | "crowded-long"    // specs very long vs their own year — squeeze risk
  | "crowded-short"   // specs very short — short-squeeze fuel
  | "building-long"   // specs adding longs
  | "building-short"  // specs adding shorts
  | "flipped"         // net position crossed zero this week
  | "unwinding"       // specs cutting exposure either way
  | "balanced";       // nothing notable

export interface CotSignal {
  kind: CotSignalKind;
  /** Short headline, e.g. "Crowded long". */
  label: string;
  /** One sentence a trader can act on. */
  detail: string;
  /** Visual weight: 2 = notable, 1 = mild, 0 = neutral. */
  weight: 0 | 1 | 2;
}

export interface CotInstrument {
  /** Short symbol traders recognise — ES, NQ, GC… */
  symbol: string;
  label: string;
  group: CotGroup;
  latest: CotWeek;
  prev: CotWeek | null;
  /** Week-over-week change in large-spec net position. */
  netSpecChg: number;
  /** COT index (0–100): where this week's net-spec sits in its own 1-year range. */
  cotIndex: number;
  /** Large-spec long share of spec open positions (0–1) — for the long/short split bar. */
  specLongShare: number;
  bias: CotBias;
  /** Week-over-week change in open interest — confirms or questions a move. */
  oiChg: number;
  /** Net position as a share of open interest (0..1) — how concentrated the bet is. */
  netShareOfOi: number;
  /** Derived, explainable read on the positioning. */
  signal: CotSignal;
  /** Ascending weekly history for the sparkline. */
  history: { date: string; netSpec: number }[];
}

export interface CotSnapshot {
  /** Latest report date seen across instruments (yyyy-MM-dd). */
  reportDate: string;
  instruments: CotInstrument[];
}
