/**
 * Exchange holidays: the days the market itself is shut.
 *
 * A macro calendar that only shows releases hides the other half of a trader's
 * week. A full close means no cash session and no settlement; a half day means
 * liquidity drains from lunchtime on. Both change how a day should be traded,
 * so both belong on the calendar next to the data.
 *
 * These are rules, not a feed: US and UK market holidays are defined in law and
 * in the exchange's own published schedule (fixed dates with a weekend
 * substitution rule, nth-weekday rules, and Easter), so they are computed here
 * rather than fetched. Nothing is estimated and nothing needs a network call,
 * which is also why the holidays still show when FRED is unavailable.
 *
 * Covered: NYSE / CME (US) and the London Stock Exchange (UK, England & Wales
 * bank holidays). Local close times are the venue's own. One-off closures that
 * follow no rule (a royal proclamation, a national day of mourning) cannot be
 * derived and are therefore absent rather than guessed.
 */

export type HolidayMarket = "US" | "UK";

export interface MarketHoliday {
  /** yyyy-MM-dd */
  date: string;
  market: HolidayMarket;
  name: string;
  /** A full close, or a shortened session. */
  kind: "closed" | "early-close";
  /** Local closing time on a half day, e.g. "13:00 ET". */
  closes?: string;
}

const iso = (d: Date) => d.toISOString().slice(0, 10);
/** yyyy-MM-dd from a date's *local* parts, for bounds that came from a UI grid. */
const localKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const utc = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d));
/** 0 = Sunday. */
const dow = (d: Date) => d.getUTCDay();
const isWeekend = (d: Date) => dow(d) === 0 || dow(d) === 6;
const shift = (d: Date, days: number) => new Date(d.getTime() + days * 86_400_000);

/** The nth (1-based) `weekday` of a month; a negative `n` counts back from the end. */
function nthWeekday(year: number, month: number, weekday: number, n: number): Date {
  if (n > 0) {
    const first = utc(year, month, 1);
    const delta = (weekday - dow(first) + 7) % 7;
    return shift(first, delta + (n - 1) * 7);
  }
  const last = utc(year, month + 1, 0);
  const delta = (dow(last) - weekday + 7) % 7;
  return shift(last, -delta);
}

/** Easter Sunday, Gregorian (Meeus/Jones/Butcher). */
function easter(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return utc(year, month, day);
}

/**
 * The US rule: a holiday on a Saturday is taken on the Friday before, one on a
 * Sunday on the Monday after. New Year's Day is the exception, since the market
 * does not reach back into the previous year to close.
 */
function usObserved(d: Date, allowBackShift = true): Date {
  if (dow(d) === 6) return allowBackShift ? shift(d, -1) : d;
  if (dow(d) === 0) return shift(d, 1);
  return d;
}

/** The UK rule: a bank holiday on a weekend moves to the next free weekday. */
function ukSubstitute(d: Date, taken: Set<string>): Date {
  let out = d;
  while (isWeekend(out) || taken.has(iso(out))) out = shift(out, 1);
  return out;
}

/** NYSE and CME: full closes and 13:00 ET half days for one calendar year. */
function usHolidays(year: number): MarketHoliday[] {
  const out: MarketHoliday[] = [];
  const closed = (date: Date, name: string) => out.push({ date: iso(date), market: "US", name, kind: "closed" });
  const half = (date: Date, name: string) =>
    out.push({ date: iso(date), market: "US", name, kind: "early-close", closes: "13:00 ET" });

  const good = shift(easter(year), -2);

  // New Year's Day never closes the last Friday of the old year.
  closed(usObserved(utc(year, 1, 1), false), "New Year's Day");
  closed(nthWeekday(year, 1, 1, 3), "Martin Luther King Jr. Day");
  closed(nthWeekday(year, 2, 1, 3), "Washington's Birthday");
  closed(good, "Good Friday");
  closed(nthWeekday(year, 5, 1, -1), "Memorial Day");
  closed(usObserved(utc(year, 6, 19)), "Juneteenth");
  closed(usObserved(utc(year, 7, 4)), "Independence Day");
  closed(nthWeekday(year, 9, 1, 1), "Labor Day");

  const thanksgiving = nthWeekday(year, 11, 4, 4);
  closed(thanksgiving, "Thanksgiving");
  closed(usObserved(utc(year, 12, 25)), "Christmas Day");

  // Half days: the session before a holiday, when that day is itself a trading
  // day. July 3 and December 24 drop out when the holiday is observed on them.
  const taken = new Set(out.map((h) => h.date));
  const july3 = utc(year, 7, 3);
  if (!isWeekend(july3) && !taken.has(iso(july3))) half(july3, "Independence Day eve");
  half(shift(thanksgiving, 1), "Day after Thanksgiving");
  const dec24 = utc(year, 12, 24);
  if (!isWeekend(dec24) && !taken.has(iso(dec24))) half(dec24, "Christmas Eve");

  return out;
}

/** London Stock Exchange: England & Wales bank holidays and 12:30 half days. */
function ukHolidays(year: number): MarketHoliday[] {
  const out: MarketHoliday[] = [];
  const taken = new Set<string>();
  const closed = (date: Date, name: string) => {
    const d = ukSubstitute(date, taken);
    taken.add(iso(d));
    out.push({ date: iso(d), market: "UK", name, kind: "closed" });
  };
  const half = (date: Date, name: string) => {
    if (isWeekend(date) || taken.has(iso(date))) return;
    out.push({ date: iso(date), market: "UK", name, kind: "early-close", closes: "12:30 UK" });
  };

  const e = easter(year);
  closed(utc(year, 1, 1), "New Year's Day");
  closed(shift(e, -2), "Good Friday");
  closed(shift(e, 1), "Easter Monday");
  closed(nthWeekday(year, 5, 1, 1), "Early May bank holiday");
  closed(nthWeekday(year, 5, 1, -1), "Spring bank holiday");
  closed(nthWeekday(year, 8, 1, -1), "Summer bank holiday");
  closed(utc(year, 12, 25), "Christmas Day");
  closed(utc(year, 12, 26), "Boxing Day");

  half(utc(year, 12, 24), "Christmas Eve");
  half(utc(year, 12, 31), "New Year's Eve");

  return out;
}

/** US first: this is a US-centric desk, and the New York session leads the day. */
const MARKET_ORDER: HolidayMarket[] = ["US", "UK"];
const marketRank = (m: HolidayMarket) => MARKET_ORDER.indexOf(m);

/** Every US and UK market holiday in a calendar year, earliest first. */
export function marketHolidays(year: number): MarketHoliday[] {
  return [...usHolidays(year), ...ukHolidays(year)].sort(
    (a, b) => a.date.localeCompare(b.date) || marketRank(a.market) - marketRank(b.market)
  );
}

/**
 * Holidays falling between two dates (inclusive), keyed by yyyy-MM-dd, so a
 * calendar grid that spills into the neighbouring month still marks them.
 */
export function holidaysByDate(from: Date, to: Date): Map<string, MarketHoliday[]> {
  // The bounds come from a calendar grid, whose days are local midnight: read
  // them in local parts, or a timezone ahead of UTC would shift the window a
  // day and drop the holiday on its last cell.
  const fromIso = localKey(from);
  const toIso = localKey(to);
  const map = new Map<string, MarketHoliday[]>();
  for (let y = from.getFullYear(); y <= to.getFullYear(); y++) {
    for (const h of marketHolidays(y)) {
      if (h.date < fromIso || h.date > toIso) continue;
      const list = map.get(h.date) ?? [];
      list.push(h);
      map.set(h.date, list);
    }
  }
  return map;
}

/**
 * One day's closures reduced to the shortest honest labels for a calendar cell:
 * "US\u00b7UK closed", "US 13:00". Markets that are shut in the same way share a
 * chip, so a cell never repeats the word twice and truncates both.
 */
export function holidayChips(day: MarketHoliday[]): { key: string; text: string; closed: boolean }[] {
  const groups = new Map<string, { markets: HolidayMarket[]; kind: MarketHoliday["kind"]; closes?: string }>();
  for (const h of day) {
    const key = `${h.kind}:${h.closes ?? ""}`;
    const g = groups.get(key) ?? { markets: [], kind: h.kind, closes: h.closes };
    if (!g.markets.includes(h.market)) g.markets.push(h.market);
    groups.set(key, g);
  }
  return [...groups.entries()]
    // A full close outranks a half day.
    .sort(([, x], [, y]) => Number(y.kind === "closed") - Number(x.kind === "closed"))
    .map(([key, g]) => ({
      key,
      text: `${g.markets.sort((m, n) => marketRank(m) - marketRank(n)).join("\u00b7")} ${
        g.kind === "closed" ? "closed" : g.closes?.split(" ")[0] ?? "early"
      }`,
      closed: g.kind === "closed",
    }));
}
