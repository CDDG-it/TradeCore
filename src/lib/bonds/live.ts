/**
 * Live US Treasury yields from the Treasury's own Daily Par Yield Curve CSV.
 * Public domain, no API key. One request covers the whole current year, which
 * gives us the latest curve plus the history for day/week/month changes.
 *
 * Runs server-side only (called from the /api/bonds route handler).
 */

import type { BondSnapshot, CurveShape, Spread, Tenor } from "./types";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

/** The tenors we surface, mapped to their CSV column headers. */
const TENORS: { key: string; label: string; years: number; col: string }[] = [
  { key: "1M", label: "1 mo", years: 1 / 12, col: "1 Mo" },
  { key: "3M", label: "3 mo", years: 0.25, col: "3 Mo" },
  { key: "6M", label: "6 mo", years: 0.5, col: "6 Mo" },
  { key: "1Y", label: "1 yr", years: 1, col: "1 Yr" },
  { key: "2Y", label: "2 yr", years: 2, col: "2 Yr" },
  { key: "3Y", label: "3 yr", years: 3, col: "3 Yr" },
  { key: "5Y", label: "5 yr", years: 5, col: "5 Yr" },
  { key: "7Y", label: "7 yr", years: 7, col: "7 Yr" },
  { key: "10Y", label: "10 yr", years: 10, col: "10 Yr" },
  { key: "20Y", label: "20 yr", years: 20, col: "20 Yr" },
  { key: "30Y", label: "30 yr", years: 30, col: "30 Yr" },
];

/** Split one CSV line, honouring quoted fields. */
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (const ch of line) {
    if (ch === '"') inQ = !inQ;
    else if (ch === "," && !inQ) { out.push(cur); cur = ""; }
    else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

/** "08/14/2026" → "2026-08-14" */
function toIso(us: string): string {
  const [m, d, y] = us.split("/");
  if (!m || !d || !y) return us;
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

type Row = { date: string; vals: Record<string, number | null> };

async function fetchCurveRows(year: number): Promise<Row[]> {
  const url =
    `https://home.treasury.gov/resource-center/data-chart-center/interest-rates/daily-treasury-rates.csv/${year}/all` +
    `?type=daily_treasury_yield_curve&field_tdr_date_value=${year}&page&_format=csv`;
  const res = await fetch(url, { headers: { "User-Agent": UA }, next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`Treasury ${res.status}`);
  const csv = await res.text();
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length < 2) throw new Error("Treasury: empty CSV");

  const header = splitCsvLine(lines[0]).map((h) => h.replace(/^"|"$/g, ""));
  const rows: Row[] = [];
  for (const line of lines.slice(1)) {
    const cells = splitCsvLine(line).map((c) => c.replace(/^"|"$/g, ""));
    if (cells.length !== header.length) continue;
    const vals: Record<string, number | null> = {};
    header.forEach((h, i) => {
      if (i === 0) return;
      const n = Number(cells[i]);
      vals[h] = Number.isFinite(n) ? n : null;
    });
    rows.push({ date: toIso(cells[0]), vals });
  }
  // CSV comes newest-first; return ascending by date.
  return rows.sort((a, b) => a.date.localeCompare(b.date));
}

const bps = (a: number, b: number) => Math.round((a - b) * 100);

/** Pick the row closest to `tradingDaysBack` before the last row. */
function rowBack(rows: Row[], tradingDaysBack: number): Row | null {
  const i = rows.length - 1 - tradingDaysBack;
  return i >= 0 ? rows[i] : null;
}

function classify(y3m: number | null, y2: number | null, y10: number | null): { shape: CurveShape; label: string; detail: string } {
  // Judged on 2s10s, with 3M10Y as the recession-signal confirmation.
  if (y2 == null || y10 == null) {
    return { shape: "flat", label: "Incomplete curve", detail: "Not every maturity published a yield today." };
  }
  const s = bps(y10, y2);
  const s3m = y3m != null ? bps(y10, y3m) : null;

  if (s < -10) {
    return {
      shape: "inverted",
      label: "Inverted curve",
      detail:
        `Two-year yields sit above ten-year (${s} bp). Investors are paid more to lend for two years than for ten — a bet that rates must fall, ` +
        `which has historically preceded recessions by roughly 6–18 months.${s3m != null && s3m < 0 ? " The 3-month/10-year spread is inverted too, the version the Fed's own research watches most closely." : ""}`,
    };
  }
  if (s < 25) {
    return {
      shape: "flat",
      label: "Flat curve",
      detail:
        `Only ${s} bp separates two-year and ten-year yields. A flat curve says the market sees little growth or inflation premium ahead — ` +
        `late-cycle behaviour, and a curve that can tip either way on the next inflation print.`,
    };
  }
  return {
    shape: "normal",
    label: "Normal curve",
    detail:
      `Ten-year yields sit ${s} bp above two-year. Lenders are paid for taking duration risk, the historically healthy shape — ` +
      `it points to growth and inflation expectations that build with time rather than a market bracing for cuts.`,
  };
}

export async function fetchBondSnapshot(): Promise<BondSnapshot> {
  const year = new Date().getFullYear();
  let rows = await fetchCurveRows(year);
  // Early January: the current year may not have enough history yet for the
  // month-over-month comparison, so pull the previous year in as well.
  if (rows.length < 25) {
    const prev = await fetchCurveRows(year - 1).catch(() => [] as Row[]);
    rows = [...prev, ...rows];
  }
  if (!rows.length) throw new Error("Treasury: no rows");

  const last = rows[rows.length - 1];
  const dayAgo = rowBack(rows, 1);
  const weekAgo = rowBack(rows, 5);
  const monthAgo = rowBack(rows, 21);

  const tenors: Tenor[] = TENORS.flatMap((t) => {
    const y = last.vals[t.col];
    if (y == null) return [];
    const chg = (prev: Row | null) => {
      const p = prev?.vals[t.col];
      return p == null ? null : bps(y, p);
    };
    return [{
      key: t.key, label: t.label, years: t.years, yield: y,
      chgDay: chg(dayAgo), chgWeek: chg(weekAgo), chgMonth: chg(monthAgo),
    }];
  });

  const get = (col: string) => last.vals[col] ?? null;
  const getPrev = (col: string) => dayAgo?.vals[col] ?? null;

  const y3m = get("3 Mo"), y2 = get("2 Yr"), y5 = get("5 Yr"), y10 = get("10 Yr"), y30 = get("30 Yr");

  const mkSpread = (
    key: string, label: string, meaning: string, longLeg: number | null, shortLeg: number | null,
    longCol: string, shortCol: string
  ): Spread[] => {
    if (longLeg == null || shortLeg == null) return [];
    const value = bps(longLeg, shortLeg);
    const pl = getPrev(longCol), ps = getPrev(shortCol);
    return [{
      key, label, meaning, bps: value,
      chgDay: pl != null && ps != null ? value - bps(pl, ps) : null,
      inverted: value < 0,
    }];
  };

  const spreads: Spread[] = [
    ...mkSpread("2s10s", "2s10s", "The classic recession bellwether — ten-year minus two-year.", y10, y2, "10 Yr", "2 Yr"),
    ...mkSpread("3m10y", "3M/10Y", "The Fed's preferred inversion measure.", y10, y3m, "10 Yr", "3 Mo"),
    ...mkSpread("5s30s", "5s30s", "Long-end steepness — inflation and fiscal risk premium.", y30, y5, "30 Yr", "5 Yr"),
  ];

  const read = classify(y3m, y2, y10);

  const history = rows.slice(-120).map((r) => ({
    date: r.date,
    y2: r.vals["2 Yr"] ?? null,
    y10: r.vals["10 Yr"] ?? null,
    y30: r.vals["30 Yr"] ?? null,
  }));

  return {
    date: last.date,
    tenors,
    spreads,
    shape: read.shape,
    readLabel: read.label,
    readDetail: read.detail,
    history,
  };
}
