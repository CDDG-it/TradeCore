/**
 * Global 10-year government bond yields — FRED (OECD harmonised long-term rates).
 *
 * One consistent methodology across the major economies, so the numbers are
 * comparable. These OECD series are MONTHLY and lag by a couple of months; that
 * cadence is surfaced honestly (never dressed up as live). Each economy also
 * carries a lat/lon so the globe can pin it.
 */
import { fetchJson } from "./cache";

export interface GlobalYield {
  id: string;
  country: string;
  fredId: string;
  lat: number;
  lon: number;
  /** Currency cross in our quotes universe, for the country panel. */
  fxSymbol: string | null;
  centralBank: string;
  value: number | null;
  prev: number | null;
  asOf: string | null;
  history: { date: string; value: number }[];
  status: "ok" | "unavailable";
}

interface Def {
  id: string; country: string; fredId: string;
  lat: number; lon: number; fxSymbol: string | null; centralBank: string;
}

export const ECONOMIES: Def[] = [
  { id: "us", country: "United States", fredId: "IRLTLT01USM156N", lat: 38, lon: -97, fxSymbol: "DXY", centralBank: "Federal Reserve" },
  { id: "de", country: "Germany", fredId: "IRLTLT01DEM156N", lat: 51, lon: 10, fxSymbol: "EURUSD", centralBank: "European Central Bank" },
  { id: "gb", country: "United Kingdom", fredId: "IRLTLT01GBM156N", lat: 54, lon: -2, fxSymbol: "GBPUSD", centralBank: "Bank of England" },
  { id: "jp", country: "Japan", fredId: "IRLTLT01JPM156N", lat: 36, lon: 138, fxSymbol: "USDJPY", centralBank: "Bank of Japan" },
  { id: "fr", country: "France", fredId: "IRLTLT01FRM156N", lat: 47, lon: 2, fxSymbol: "EURUSD", centralBank: "European Central Bank" },
  { id: "it", country: "Italy", fredId: "IRLTLT01ITM156N", lat: 42, lon: 12, fxSymbol: "EURUSD", centralBank: "European Central Bank" },
  { id: "ca", country: "Canada", fredId: "IRLTLT01CAM156N", lat: 56, lon: -106, fxSymbol: "USDCAD", centralBank: "Bank of Canada" },
  { id: "au", country: "Australia", fredId: "IRLTLT01AUM156N", lat: -25, lon: 133, fxSymbol: "AUDUSD", centralBank: "Reserve Bank of Australia" },
  { id: "ch", country: "Switzerland", fredId: "IRLTLT01CHM156N", lat: 47, lon: 8, fxSymbol: "USDCHF", centralBank: "Swiss National Bank" },
];

interface FredObs { observations?: { date: string; value: string }[] }

async function fetchOne(def: Def, apiKey: string): Promise<GlobalYield> {
  const url =
    `https://api.stlouisfed.org/fred/series/observations?series_id=${def.fredId}` +
    `&api_key=${apiKey}&file_type=json&sort_order=desc&limit=60`;
  try {
    const json = await fetchJson<FredObs>(url, { timeoutMs: 8000, retries: 1 });
    const raw = (json.observations ?? [])
      .filter((o) => o.value !== "." && o.value !== "")
      .map((o) => ({ date: o.date, value: Number(o.value) }))
      .filter((o) => Number.isFinite(o.value));
    if (raw.length === 0) return { ...def, value: null, prev: null, asOf: null, history: [], status: "unavailable" };
    const history = [...raw].reverse().slice(-36);
    return {
      ...def,
      value: raw[0].value,
      prev: raw[1]?.value ?? null,
      asOf: raw[0].date,
      history,
      status: "ok",
    };
  } catch {
    return { ...def, value: null, prev: null, asOf: null, history: [], status: "unavailable" };
  }
}

export async function fetchGlobalYields(apiKey: string): Promise<GlobalYield[]> {
  return Promise.all(ECONOMIES.map((d) => fetchOne(d, apiKey)));
}
