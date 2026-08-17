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
  /** Ascending weekly history for the sparkline. */
  history: { date: string; netSpec: number }[];
}

export interface CotSnapshot {
  /** Latest report date seen across instruments (yyyy-MM-dd). */
  reportDate: string;
  instruments: CotInstrument[];
}
