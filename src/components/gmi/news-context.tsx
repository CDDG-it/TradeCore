"use client";

import Link from "next/link";
import { addDays, addMonths, format, parseISO } from "date-fns";
import { useGmi } from "@/lib/gmi/client";
import type { CalendarEntry, CalendarMonth } from "@/lib/gmi/calendar";
import type { DataEnvelope } from "@/lib/gmi/types";
import { upcomingReleases } from "@/lib/gmi/news-view";
import s from "./news-desk.module.css";

function DataState({ env }: { env: DataEnvelope<unknown> | null }) {
  return <p className={s.railNote}>{!env ? "Loading releases." : env.status === "unavailable" ? "FRED is currently unavailable." : env.status === "stale" ? "Showing cached FRED data. Updates are delayed." : "Source: FRED. Release dates only; times are not provided."}</p>;
}

export function releaseValue(value: number | null, unit: string): string {
  if (value == null) return "Not available";
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value)}${unit === "%" ? "%" : ""}`;
}
export function releaseUnit(unit: string): string {
  const units: Record<string, string> = { index: "Index", kpersons: "Thousands of persons", count: "Count", "$B": "Billions of dollars", "$M": "Millions of dollars", "%": "Percent" };
  return units[unit] ?? unit;
}

export function NewsContext({ now }: { now: number | null }) {
  const today = now == null ? null : new Date(now);
  const month = today ? format(today, "yyyy-MM") : null;
  const nextMonth = today ? format(addMonths(today, 1), "yyyy-MM") : null;
  const { env: current } = useGmi<CalendarMonth>(month ? `/api/gmi/calendar?month=${month}` : null, 30 * 60_000);
  const { env: next } = useGmi<CalendarMonth>(nextMonth ? `/api/gmi/calendar?month=${nextMonth}` : null, 30 * 60_000);
  const { env: latest } = useGmi<CalendarEntry[]>("/api/gmi/calendar", 30 * 60_000);
  const from = today ? format(today, "yyyy-MM-dd") : "";
  const until = today ? format(addDays(today, 7), "yyyy-MM-dd") : "";
  const events = upcomingReleases([...(current?.data?.events ?? []), ...(next?.data?.events ?? [])], from, until);
  const ids = ["CPIAUCSL", "CPILFESL", "PCEPI", "UNRATE", "PAYEMS", "GDPC1"];
  const readings = ids.flatMap((id) => (latest?.data ?? []).filter((entry) => entry.id === id));
  const scheduleIncomplete = !current || current.status !== "ok" || (month !== format(today ? addDays(today, 6) : new Date(), "yyyy-MM") && (!next || next.status !== "ok"));

  const days = new Map<string, typeof events>();
  for (const event of events.slice(0, 8)) {
    if (!days.has(event.date)) days.set(event.date, []);
    days.get(event.date)!.push(event);
  }

  return <aside className={s.rail}>
    <section>
      <div className={s.railHeader}><h2>Coming up</h2><Link href="/news-city?tab=calendar">Calendar</Link></div>
      <p className={s.railNote}>The next seven days</p>
      {current?.status !== "ok" && <DataState env={current} />}
      {scheduleIncomplete && current?.data && <p className={s.railNote}>Schedule incomplete while sources update.</p>}
      <div className={s.agenda}>
        {[...days.entries()].map(([date, releases]) => <div key={date} className={s.agendaDay}>
          <time dateTime={date} className={s.agendaDate}><strong>{format(parseISO(date), "dd")}</strong><span>{format(parseISO(date), "EEE, MMM")}</span></time>
          <ol className={s.agendaItems}>{releases.map((event) => <li key={event.id}><p>{event.label}</p><small>{event.released ? "Released" : "Scheduled"}</small></li>)}</ol>
        </div>)}
      </div>
      {!events.length && current?.data && !scheduleIncomplete && <p className={s.railNote}>No releases scheduled in the next seven days.</p>}
      {events.length > 8 && <Link href="/news-city?tab=calendar" className="mt-3 inline-block text-xs text-primary">View all {events.length} releases</Link>}
      <p className={s.railNote}>FRED schedule. Dates only; times not provided.</p>
    </section>
    <section className={s.readings}>
      <div className={s.railHeader}><h2>Economic readings</h2></div>
      <p className={s.railNote}>Latest reported values</p>
      {latest?.status !== "ok" && <DataState env={latest} />}
      {readings.length > 0 && <table className={s.readingsTable}>
        <caption className="sr-only">Latest economic readings with actual and prior period values</caption>
        <thead><tr><th scope="col">Indicator</th><th scope="col">Actual</th><th scope="col">Prior</th></tr></thead>
        <tbody>{readings.map((entry) => <tr key={entry.id}>
          <th scope="row">{entry.label}<span>{entry.referenceDate ? format(parseISO(entry.referenceDate), "MMM yyyy") : "Period unavailable"}</span><span className={s.unit}>{releaseUnit(entry.unit)}</span></th>
          <td>{entry.actual == null ? <span aria-label="Not available">-</span> : releaseValue(entry.actual, entry.unit)}</td>
          <td>{entry.previous == null ? <span aria-label="Not available">-</span> : releaseValue(entry.previous, entry.unit)}</td>
        </tr>)}</tbody>
      </table>}
      {latest?.status === "ok" && !readings.length && <p className={s.railNote}>No readings available.</p>}
    </section>
    <p className={s.railFoot}>Source: FRED. Figures describe the stated reporting period. Original publications appear in the release feed.</p>
  </aside>;
}
