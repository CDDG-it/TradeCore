/**
 * Economic calendar provider — recent US releases from FRED.
 *
 * A true forward calendar with market consensus needs a paid provider; on the
 * free tier we can still show the objective half honestly: the most recent
 * headline releases with their actual and prior values, by reference period.
 * Consensus is left null (the UI shows it as unavailable, never invented).
 */
import { fetchJson } from "./cache";
import type { DataFreshness } from "./types";

interface ReleaseDef {
  id: string;
  label: string;
  unit: string;
  freshness: DataFreshness;
  importance: "high" | "medium" | "low";
}

const RELEASES: ReleaseDef[] = [
  { id: "CPIAUCSL", label: "CPI (all items)", unit: "index", freshness: "monthly", importance: "high" },
  { id: "CPILFESL", label: "Core CPI", unit: "index", freshness: "monthly", importance: "high" },
  { id: "PCEPI", label: "PCE Price Index", unit: "index", freshness: "monthly", importance: "high" },
  { id: "PCEPILFE", label: "Core PCE", unit: "index", freshness: "monthly", importance: "high" },
  { id: "PAYEMS", label: "Nonfarm Payrolls", unit: "kpersons", freshness: "monthly", importance: "high" },
  { id: "UNRATE", label: "Unemployment Rate", unit: "%", freshness: "monthly", importance: "high" },
  { id: "GDPC1", label: "Real GDP", unit: "$B", freshness: "monthly", importance: "high" },
  { id: "RSAFS", label: "Retail Sales", unit: "$M", freshness: "monthly", importance: "medium" },
  { id: "ICSA", label: "Initial Jobless Claims", unit: "count", freshness: "weekly", importance: "medium" },
];

export interface CalendarEntry {
  id: string;
  label: string;
  unit: string;
  freshness: DataFreshness;
  importance: "high" | "medium" | "low";
  referenceDate: string | null;
  actual: number | null;
  previous: number | null;
  consensus: null; // never available on the free tier
  status: "ok" | "unavailable";
}

interface FredObs {
  observations?: { date: string; value: string }[];
}

async function fetchRelease(def: ReleaseDef, apiKey: string): Promise<CalendarEntry> {
  const url =
    `https://api.stlouisfed.org/fred/series/observations?series_id=${def.id}` +
    `&api_key=${apiKey}&file_type=json&sort_order=desc&limit=2`;
  try {
    const json = await fetchJson<FredObs>(url, { timeoutMs: 8000, retries: 1 });
    const obs = (json.observations ?? []).filter((o) => o.value !== "." && o.value !== "");
    if (obs.length === 0) return { ...base(def), referenceDate: null, actual: null, previous: null, consensus: null, status: "unavailable" };
    const actual = Number(obs[0].value);
    const previous = obs[1] ? Number(obs[1].value) : null;
    // PAYEMS/claims come in thousands already in FRED (level in thousands of persons).
    return { ...base(def), referenceDate: obs[0].date, actual, previous, consensus: null, status: "ok" };
  } catch {
    return { ...base(def), referenceDate: null, actual: null, previous: null, consensus: null, status: "unavailable" };
  }
}

function base(def: ReleaseDef) {
  return { id: def.id, label: def.label, unit: def.unit, freshness: def.freshness, importance: def.importance };
}

export async function fetchCalendar(apiKey: string): Promise<CalendarEntry[]> {
  const entries = await Promise.all(RELEASES.map((d) => fetchRelease(d, apiKey)));
  // Most recent reference period first.
  return entries.sort((a, b) => (b.referenceDate ?? "").localeCompare(a.referenceDate ?? ""));
}
