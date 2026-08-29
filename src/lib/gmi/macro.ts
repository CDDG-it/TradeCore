/**
 * Macro provider — FRED (Federal Reserve Bank of St. Louis).
 *
 * Powers the Macro subtab: the rates ladder, real yields, curve spreads and the
 * Fed & liquidity block. Each series carries its own publication cadence, which
 * we surface honestly — a weekly balance-sheet figure is never shown as daily.
 *
 * Requires FRED_API_KEY (server-side only). FRED allows generous rate limits,
 * but we still fetch the whole set in one cached batch per request.
 */
import { fetchJson } from "./cache";
import type { DataFreshness, MacroSeries } from "./types";

interface SeriesDef {
  id: string;
  label: string;
  unit: string;
  freshness: DataFreshness;
  group: "rates" | "real" | "spread" | "liquidity" | "money";
}

/** The curated FRED universe. IDs are the canonical FRED series identifiers. */
export const FRED_SERIES: SeriesDef[] = [
  // Nominal Treasury yields (daily)
  { id: "DGS2", label: "US 2-Year", unit: "%", freshness: "daily", group: "rates" },
  { id: "DGS5", label: "US 5-Year", unit: "%", freshness: "daily", group: "rates" },
  { id: "DGS10", label: "US 10-Year", unit: "%", freshness: "daily", group: "rates" },
  { id: "DGS30", label: "US 30-Year", unit: "%", freshness: "daily", group: "rates" },
  // Real yield + spreads (daily)
  { id: "DFII10", label: "10Y Real Yield", unit: "%", freshness: "daily", group: "real" },
  { id: "T10Y2Y", label: "2s10s Spread", unit: "bp", freshness: "daily", group: "spread" },
  { id: "T10Y3M", label: "3M10Y Spread", unit: "bp", freshness: "daily", group: "spread" },
  // Fed & liquidity
  { id: "EFFR", label: "Fed Funds (EFFR)", unit: "%", freshness: "daily", group: "liquidity" },
  { id: "WALCL", label: "Fed Balance Sheet", unit: "$B", freshness: "weekly", group: "liquidity" },
  { id: "WRESBAL", label: "Bank Reserves", unit: "$B", freshness: "weekly", group: "liquidity" },
  { id: "RRPONTSYD", label: "Reverse Repo", unit: "$B", freshness: "daily", group: "liquidity" },
  { id: "WTREGEN", label: "Treasury General Acct", unit: "$B", freshness: "weekly", group: "liquidity" },
  // Money supply (monthly)
  { id: "M1SL", label: "M1 Money Stock", unit: "$B", freshness: "monthly", group: "money" },
  { id: "M2SL", label: "M2 Money Stock", unit: "$B", freshness: "monthly", group: "money" },
];

interface FredObs {
  observations?: { date: string; value: string }[];
}

// FRED reports these in millions of dollars; others ($B, money supply) are
// already in billions. We normalise everything to billions so the UI is
// consistent and the T/B formatting is correct.
const MILLIONS_SERIES = new Set(["WALCL", "WRESBAL", "WTREGEN"]);

/** Value on or before `target`, from an ascending [{date,value}] list. */
function valueAsOf(hist: { date: string; value: number }[], target: Date): number | null {
  const t = target.getTime();
  for (let i = hist.length - 1; i >= 0; i--) {
    if (new Date(hist[i].date).getTime() <= t) return hist[i].value;
  }
  return null;
}

async function fetchSeries(def: SeriesDef, apiKey: string): Promise<MacroSeries> {
  const url =
    `https://api.stlouisfed.org/fred/series/observations?series_id=${def.id}` +
    `&api_key=${apiKey}&file_type=json&sort_order=desc&limit=400`;
  try {
    const json = await fetchJson<FredObs>(url, { timeoutMs: 8000, retries: 2 });
    const scale = MILLIONS_SERIES.has(def.id) ? 1 / 1000 : 1; // millions → billions
    const raw = (json.observations ?? [])
      .filter((o) => o.value !== "." && o.value !== "")
      .map((o) => ({ date: o.date, value: Number(o.value) * scale }))
      .filter((o) => Number.isFinite(o.value));
    if (raw.length === 0) {
      return { ...blank(def), status: "unavailable" };
    }
    // raw is desc; build ascending history for the curve/sparkline (last ~180).
    const asc = [...raw].reverse();
    const history = asc.slice(-180);
    const latest = raw[0];
    const latestDate = new Date(latest.date);
    const dayAgo = valueAsOf(asc, new Date(latestDate.getTime() - 1 * 86400e3 - 43200e3));
    const weekAgo = valueAsOf(asc, new Date(latestDate.getTime() - 7 * 86400e3));
    const monthAgo = valueAsOf(asc, new Date(latestDate.getTime() - 30 * 86400e3));

    return {
      id: def.id,
      label: def.label,
      value: latest.value,
      unit: def.unit,
      freshness: def.freshness,
      asOf: latest.date,
      changeDay: dayAgo != null ? round(latest.value - dayAgo, def.unit) : null,
      changeWeek: weekAgo != null ? round(latest.value - weekAgo, def.unit) : null,
      changeMonth: monthAgo != null ? round(latest.value - monthAgo, def.unit) : null,
      history,
      status: "ok",
    };
  } catch {
    return { ...blank(def), status: "unavailable" };
  }
}

/** Spread series are already in %; show their change in basis points. */
function round(n: number, unit: string): number {
  if (unit === "bp") return Math.round(n * 100);
  return Math.round(n * 1000) / 1000;
}

function blank(def: SeriesDef): MacroSeries {
  return {
    id: def.id,
    label: def.label,
    value: null,
    unit: def.unit,
    freshness: def.freshness,
    asOf: null,
    changeDay: null,
    changeWeek: null,
    changeMonth: null,
    history: [],
    status: "unavailable",
  };
}

export function seriesGroup(id: string): SeriesDef["group"] | null {
  return FRED_SERIES.find((s) => s.id === id)?.group ?? null;
}

/** Fetch the whole curated FRED set. Spreads (T10Y2Y/T10Y3M) are reported by
 *  FRED in percentage points; we keep the raw value and let the UI format bp. */
export async function fetchMacro(apiKey: string): Promise<MacroSeries[]> {
  return Promise.all(FRED_SERIES.map((d) => fetchSeries(d, apiKey)));
}
