/**
 * Live COT data from the CFTC Socrata public reporting API (no key required).
 *
 * Endpoint: Legacy Futures-Only report (resource 6dca-aqww). One request per
 * market, ~1 year of weekly history, run server-side from /api/cot.
 *
 * Runs server-side only.
 */

import type { CotGroup, CotInstrument, CotSnapshot, CotWeek } from "./types";

const CFTC_RESOURCE = "https://publicreporting.cftc.gov/resource/6dca-aqww.json";
const LOOKBACK_WEEKS = 52;

/** The markets we surface, with the exact CFTC `market_and_exchange_names`
 *  prefix each maps to (verified against the live API). */
const MARKETS: { symbol: string; label: string; group: CotGroup; like: string }[] = [
  { symbol: "ES", label: "E-mini S&P 500", group: "index", like: "E-MINI S&P 500 -" },
  { symbol: "NQ", label: "E-mini Nasdaq-100", group: "index", like: "NASDAQ MINI -" },
  { symbol: "YM", label: "E-mini Dow (DJIA)", group: "index", like: "DJIA Consolidated -" },
  { symbol: "RTY", label: "E-mini Russell 2000", group: "index", like: "RUSSELL E-MINI -" },
  { symbol: "GC", label: "Gold", group: "metal", like: "GOLD -" },
  { symbol: "SI", label: "Silver", group: "metal", like: "SILVER -" },
  { symbol: "CL", label: "Crude Oil (WTI)", group: "energy", like: "CRUDE OIL, LIGHT SWEET - NEW YORK" },
  { symbol: "NG", label: "Natural Gas", group: "energy", like: "NATURAL GAS - NEW YORK" },
];

const SELECT = [
  "report_date_as_yyyy_mm_dd",
  "noncomm_positions_long_all",
  "noncomm_positions_short_all",
  "comm_positions_long_all",
  "comm_positions_short_all",
  "nonrept_positions_long_all",
  "nonrept_positions_short_all",
  "open_interest_all",
].join(",");

type Raw = Record<string, string>;

function num(v: string | undefined): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function toWeek(r: Raw): CotWeek {
  const specLong = num(r.noncomm_positions_long_all);
  const specShort = num(r.noncomm_positions_short_all);
  const commLong = num(r.comm_positions_long_all);
  const commShort = num(r.comm_positions_short_all);
  const retailLong = num(r.nonrept_positions_long_all);
  const retailShort = num(r.nonrept_positions_short_all);
  return {
    date: (r.report_date_as_yyyy_mm_dd ?? "").slice(0, 10),
    specLong, specShort, commLong, commShort, retailLong, retailShort,
    openInterest: num(r.open_interest_all),
    netSpec: specLong - specShort,
    netComm: commLong - commShort,
    netRetail: retailLong - retailShort,
  };
}

async function fetchMarket(like: string): Promise<CotWeek[]> {
  const where = `market_and_exchange_names like '${like}%'`;
  const url =
    `${CFTC_RESOURCE}?$select=${encodeURIComponent(SELECT)}` +
    `&$where=${encodeURIComponent(where)}` +
    `&$order=${encodeURIComponent("report_date_as_yyyy_mm_dd DESC")}` +
    `&$limit=${LOOKBACK_WEEKS}`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`CFTC ${res.status}`);
  const rows = (await res.json()) as Raw[];
  return rows.map(toWeek).reverse(); // ascending by date
}

function buildInstrument(
  meta: { symbol: string; label: string; group: CotGroup },
  weeks: CotWeek[]
): CotInstrument | null {
  if (weeks.length < 2) return null;
  const latest = weeks[weeks.length - 1];
  const prev = weeks[weeks.length - 2];
  const nets = weeks.map((w) => w.netSpec);
  const min = Math.min(...nets);
  const max = Math.max(...nets);
  const range = max - min;
  const cotIndex = range > 0 ? Math.round(((latest.netSpec - min) / range) * 100) : 50;

  const specTotal = latest.specLong + latest.specShort;
  const specLongShare = specTotal > 0 ? latest.specLong / specTotal : 0.5;

  // Bias from the large-spec net stance, with a small dead-band around flat.
  const netThresh = latest.openInterest * 0.02; // 2% of OI ≈ "meaningful"
  const bias = latest.netSpec > netThresh ? "long" : latest.netSpec < -netThresh ? "short" : "neutral";

  return {
    symbol: meta.symbol,
    label: meta.label,
    group: meta.group,
    latest,
    prev,
    netSpecChg: latest.netSpec - prev.netSpec,
    cotIndex,
    specLongShare,
    bias,
    history: weeks.map((w) => ({ date: w.date, netSpec: w.netSpec })),
  };
}

export async function fetchCotSnapshot(): Promise<CotSnapshot> {
  const results = await Promise.all(
    MARKETS.map(async (m) => {
      try {
        const weeks = await fetchMarket(m.like);
        return buildInstrument(m, weeks);
      } catch (err) {
        console.error(`[cot] ${m.symbol} fetch failed:`, err);
        return null;
      }
    })
  );
  const instruments = results.filter((x): x is CotInstrument => x !== null);
  if (instruments.length === 0) throw new Error("CFTC: no instruments returned");
  const reportDate = instruments
    .map((i) => i.latest.date)
    .sort()
    .at(-1)!;
  return { reportDate, instruments };
}
