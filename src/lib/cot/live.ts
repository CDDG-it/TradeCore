/**
 * Live COT data from the CFTC Socrata public reporting API (no key required).
 *
 * Endpoint: Legacy Futures-Only report (resource 6dca-aqww). One request per
 * market, ~1 year of weekly history, run server-side from /api/cot.
 *
 * Runs server-side only.
 */

import type { CotGroup, CotInstrument, CotSignal, CotSnapshot, CotWeek } from "./types";

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

const kFmt = (n: number) => `${Math.abs(n) >= 1000 ? `${(Math.abs(n) / 1000).toFixed(1)}k` : Math.abs(n)}`;

/**
 * Turn the raw numbers into one explainable read. Pure function of the data —
 * every branch is a stated rule, so the UI can show *why* it says what it says.
 */
function deriveSignal(
  label: string, cotIndex: number, netSpec: number, prevNet: number, chg: number
): CotSignal {
  const flipped = (netSpec > 0 && prevNet < 0) || (netSpec < 0 && prevNet > 0);
  const shrinking = Math.abs(netSpec) < Math.abs(prevNet);
  const meaningful = Math.abs(chg) > Math.abs(prevNet) * 0.1;

  if (flipped) {
    return {
      kind: "flipped", label: netSpec > 0 ? "Flipped net long" : "Flipped net short", weight: 2,
      detail: `Large specs crossed from ${netSpec > 0 ? "net short to net long" : "net long to net short"} in ${label} this week — a change of stance, not just of size.`,
    };
  }
  // Crowding is judged on the 1-year range, but the wording must respect which
  // side specs are actually on — "most bullish in a year" while still net short
  // is a washed-out short base, not a crowded long.
  if (cotIndex >= 90) {
    return netSpec > 0
      ? {
          kind: "crowded-long", label: "Crowded long", weight: 2,
          detail: `Specs are their most net-long in a year. A crowded long has few buyers left to add, so ${label} carries unwind risk if the story cracks.`,
        }
      : {
          kind: "crowded-long", label: "Shorts nearly gone", weight: 2,
          detail: `Specs are still net short, but the least short in a year — the bearish bet has largely been covered, so ${label} has lost that tailwind.`,
        };
  }
  if (cotIndex <= 10) {
    return netSpec < 0
      ? {
          kind: "crowded-short", label: "Crowded short", weight: 2,
          detail: `Specs are their most net-short in a year. Heavy shorts are fuel for a squeeze if ${label} catches a bid.`,
        }
      : {
          kind: "crowded-short", label: "Longs washed out", weight: 2,
          detail: `Specs are still net long, but the least long in a year — the bullish crowd has capitulated, which historically marks a low-expectation base in ${label}.`,
        };
  }
  if (meaningful && shrinking) {
    return {
      kind: "unwinding", label: "Unwinding", weight: 1,
      detail: `Specs cut ${kFmt(chg)} contracts of exposure — conviction is draining rather than reversing.`,
    };
  }
  if (meaningful && chg > 0) {
    return {
      kind: "building-long", label: "Adding longs", weight: 1,
      detail: `Specs added ${kFmt(chg)} contracts net long — money is moving with the trend, not against it.`,
    };
  }
  if (meaningful && chg < 0) {
    return {
      kind: "building-short", label: "Adding shorts", weight: 1,
      detail: `Specs added ${kFmt(chg)} contracts net short — pressure is building on the downside.`,
    };
  }
  return {
    kind: "balanced", label: "Balanced", weight: 0,
    detail: `No crowding and little change this week — positioning is not the story in ${label} right now.`,
  };
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

  const netSpecChg = latest.netSpec - prev.netSpec;

  return {
    symbol: meta.symbol,
    label: meta.label,
    group: meta.group,
    latest,
    prev,
    netSpecChg,
    cotIndex,
    specLongShare,
    bias,
    oiChg: latest.openInterest - prev.openInterest,
    netShareOfOi: latest.openInterest > 0 ? Math.abs(latest.netSpec) / latest.openInterest : 0,
    signal: deriveSignal(meta.symbol, cotIndex, latest.netSpec, prev.netSpec, netSpecChg),
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
