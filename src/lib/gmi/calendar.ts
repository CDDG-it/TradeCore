/**
 * Economic calendar provider — US macro releases from FRED.
 *
 * Two shapes, one provider:
 *   • {@link fetchCalendar}      — the most recent prints (actual, prior, trend).
 *   • {@link fetchCalendarMonth} — a real calendar: every scheduled release date
 *     in a month, straight from FRED's own release calendar, with the print
 *     attached once it has landed.
 *
 * Release dates are FRED's published schedule (past *and* forthcoming), so the
 * forward half of the calendar is real rather than estimated. What a print will
 * be is never guessed: a scheduled event carries no value, and market consensus
 * (a paid dataset) stays absent rather than invented. FRED does not publish
 * clock times, so none are shown.
 */
import { cached, fetchJson } from "./cache";
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
  /** Last ~12 observations (ascending) for a trend sparkline. */
  history: { date: string; value: number }[];
  status: "ok" | "unavailable";
}

/** One release, on one date, in the calendar grid. */
export interface CalendarEvent {
  id: string;
  seriesId: string;
  label: string;
  /** FRED's own name for the release this series belongs to. */
  releaseName: string;
  importance: "high" | "medium" | "low";
  unit: string;
  freshness: DataFreshness;
  /** Release date, yyyy-MM-dd. */
  date: string;
  /** True once the print has landed. */
  released: boolean;
  /** Period the print covers (only for released events). */
  referenceDate: string | null;
  actual: number | null;
  previous: number | null;
}

export interface CalendarMonth {
  /** yyyy-MM the grid covers. */
  month: string;
  events: CalendarEvent[];
}

interface FredObs {
  observations?: { date: string; value: string; realtime_start?: string }[];
}

/* ── Recent prints (unchanged shape, used by Overview and the detail panel) ── */

async function fetchRelease(def: ReleaseDef, apiKey: string): Promise<CalendarEntry> {
  const url =
    `https://api.stlouisfed.org/fred/series/observations?series_id=${def.id}` +
    `&api_key=${apiKey}&file_type=json&sort_order=desc&limit=13`;
  try {
    const json = await fetchJson<FredObs>(url, { timeoutMs: 8000, retries: 1 });
    const obs = (json.observations ?? [])
      .filter((o) => o.value !== "." && o.value !== "")
      .map((o) => ({ date: o.date, value: Number(o.value) }))
      .filter((o) => Number.isFinite(o.value));
    if (obs.length === 0) return { ...base(def), referenceDate: null, actual: null, previous: null, consensus: null, history: [], status: "unavailable" };
    const actual = obs[0].value;
    const previous = obs[1]?.value ?? null;
    const history = [...obs].reverse(); // ascending
    return { ...base(def), referenceDate: obs[0].date, actual, previous, consensus: null, history, status: "ok" };
  } catch {
    return { ...base(def), referenceDate: null, actual: null, previous: null, consensus: null, history: [], status: "unavailable" };
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

/* ── The calendar grid ────────────────────────────────────────────────────── */

/** Which FRED release publishes a series. Stable, so cached for a day. */
async function releaseOf(seriesId: string, apiKey: string): Promise<{ id: number; name: string } | null> {
  try {
    const { value } = await cached(`fred:series-release:${seriesId}`, 24 * 60 * 60_000, async () => {
      const json = await fetchJson<{ releases?: { id: number; name: string }[] }>(
        `https://api.stlouisfed.org/fred/series/release?series_id=${seriesId}&api_key=${apiKey}&file_type=json`,
        { timeoutMs: 8000, retries: 1 }
      );
      const r = json.releases?.[0];
      if (!r) throw new Error("no release");
      return { id: r.id, name: r.name };
    });
    return value;
  } catch {
    return null;
  }
}

/** FRED's published schedule for a release, past and forthcoming. */
async function releaseDates(releaseId: number, from: string, to: string, apiKey: string): Promise<string[]> {
  try {
    const { value } = await cached(`fred:release-dates:${releaseId}:${from}:${to}`, 6 * 60 * 60_000, async () => {
      const json = await fetchJson<{ release_dates?: { date: string }[] }>(
        // Singular `release/dates` — the plural endpoint ignores release_id and
        // would hand every series the whole calendar.
        `https://api.stlouisfed.org/fred/release/dates?release_id=${releaseId}` +
          `&api_key=${apiKey}&file_type=json&realtime_start=${from}&realtime_end=${to}` +
          `&include_release_dates_with_no_data=true&sort_order=asc&limit=1000`,
        { timeoutMs: 9000, retries: 1 }
      );
      return (json.release_dates ?? []).map((d) => d.date);
    });
    return value;
  } catch {
    return [];
  }
}

/**
 * First-print observations with the date they were published (`output_type=4`
 * returns initial releases, whose `realtime_start` is the publication date), so
 * a past calendar day can show exactly what landed on it — matched, not guessed.
 */
async function initialPrints(
  seriesId: string, from: string, to: string, apiKey: string
): Promise<{ published: string; reference: string; value: number }[]> {
  try {
    const { value } = await cached(`fred:initial:${seriesId}:${from}:${to}`, 6 * 60 * 60_000, async () => {
      const json = await fetchJson<FredObs>(
        `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}` +
          `&api_key=${apiKey}&file_type=json&output_type=4&realtime_start=${from}&realtime_end=${to}` +
          `&sort_order=asc&limit=200`,
        { timeoutMs: 9000, retries: 1 }
      );
      return (json.observations ?? [])
        .filter((o) => o.value !== "." && o.value !== "" && o.realtime_start)
        .map((o) => ({ published: String(o.realtime_start), reference: o.date, value: Number(o.value) }))
        .filter((o) => Number.isFinite(o.value));
    });
    return value;
  } catch {
    return [];
  }
}

const iso = (d: Date) => d.toISOString().slice(0, 10);

/**
 * Every scheduled release in `month` (yyyy-MM), with the print attached where
 * one has landed. Days without a release simply have no events.
 */
export async function fetchCalendarMonth(apiKey: string, month: string): Promise<CalendarMonth> {
  const [y, m] = month.split("-").map(Number);
  const monthStart = new Date(Date.UTC(y, m - 1, 1));
  const monthEnd = new Date(Date.UTC(y, m, 0));
  const today = new Date();

  // A little history either side: enough to resolve the prior print for the
  // first release of the month, and FRED rejects a realtime window past today.
  const printsFrom = iso(new Date(Date.UTC(y, m - 5, 1)));
  const printsTo = iso(today < monthEnd ? today : monthEnd);
  const datesFrom = iso(monthStart);
  const datesTo = iso(monthEnd);

  const defs = await Promise.all(
    RELEASES.map(async (def) => ({ def, release: await releaseOf(def.id, apiKey) }))
  );

  // Several series share one release (CPI and Core CPI, payrolls and the
  // unemployment rate); fetch each release's schedule once.
  const uniqueReleases = [...new Set(defs.map((d) => d.release?.id).filter((x): x is number => x != null))];
  const scheduleEntries = await Promise.all(
    uniqueReleases.map(async (id) => [id, await releaseDates(id, datesFrom, datesTo, apiKey)] as const)
  );
  const schedule = new Map(scheduleEntries);

  const printEntries = await Promise.all(
    RELEASES.map(async (def) => [def.id, await initialPrints(def.id, printsFrom, printsTo, apiKey)] as const)
  );
  const prints = new Map(printEntries);

  const todayIso = iso(today);
  const events: CalendarEvent[] = [];

  for (const { def, release } of defs) {
    if (!release) continue;
    const dates = schedule.get(release.id) ?? [];
    const series = prints.get(def.id) ?? [];
    for (const date of dates) {
      const idx = series.findIndex((p) => p.published === date);
      const hit = idx >= 0 ? series[idx] : null;
      events.push({
        id: `${def.id}:${date}`,
        seriesId: def.id,
        label: def.label,
        releaseName: release.name,
        importance: def.importance,
        unit: def.unit,
        freshness: def.freshness,
        date,
        released: Boolean(hit) || date <= todayIso,
        referenceDate: hit?.reference ?? null,
        actual: hit?.value ?? null,
        previous: idx > 0 ? series[idx - 1].value : null,
      });
    }
  }

  events.sort((a, b) => a.date.localeCompare(b.date) || a.label.localeCompare(b.label));
  return { month, events };
}
