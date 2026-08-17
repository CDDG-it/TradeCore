/**
 * US Treasury yields — data model.
 *
 * Source is the Treasury's own Daily Treasury Par Yield Curve: the rate the US
 * government pays to borrow at each maturity, published every business day.
 * Yields are the risk-free discount rate the whole market prices off, which is
 * why they matter to an index trader as much as to a bond desk.
 */

export type CurveShape = "normal" | "flat" | "inverted";

/** One point on the curve. */
export interface Tenor {
  /** Machine key, e.g. "10Y". */
  key: string;
  /** Display label, e.g. "10 yr". */
  label: string
  /** Maturity in years — drives x-axis spacing. */
  years: number;
  /** Yield in percent, e.g. 4.68. */
  yield: number;
  /** Change in basis points vs the previous business day. */
  chgDay: number | null;
  /** Change in basis points vs ~1 week ago. */
  chgWeek: number | null;
  /** Change in basis points vs ~1 month ago. */
  chgMonth: number | null;
}

/** A tracked yield spread, e.g. 2s10s. */
export interface Spread {
  key: string;
  label: string;
  /** What this spread is read for. */
  meaning: string;
  /** Spread in basis points (long leg − short leg). */
  bps: number;
  /** Change in bps vs the previous business day. */
  chgDay: number | null;
  inverted: boolean;
}

export interface BondSnapshot {
  /** Report date of the latest curve (yyyy-MM-dd). */
  date: string;
  tenors: Tenor[];
  spreads: Spread[];
  shape: CurveShape;
  /** Plain-language read on the curve. */
  readLabel: string;
  readDetail: string;
  /** Full history for the headline tenors, ascending by date. */
  history: { date: string; y2: number | null; y10: number | null; y30: number | null }[];
}
