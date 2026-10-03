"use client";

import Link from "next/link";
import { addDays, addMonths, format, parseISO } from "date-fns";
import { useGmi } from "@/lib/gmi/client";
import type { CalendarEntry, CalendarMonth } from "@/lib/gmi/calendar";
import type { DataEnvelope } from "@/lib/gmi/types";
import { upcomingReleases } from "@/lib/gmi/news-view";

function DataState({ env }: { env: DataEnvelope<unknown> | null }) {
  return <p className="mt-3 text-xs text-muted-foreground">{!env ? "Loading releases." : env.status === "unavailable" ? "FRED is currently unavailable." : env.status === "stale" ? "Showing cached FRED data. Updates are delayed." : "Source: FRED. Release dates only; times are not provided."}</p>;
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

  return <aside className="min-w-0 space-y-7 lg:col-span-4">
    <section className="rounded-xl border border-border/60 bg-card/30 p-5">
      <div className="flex items-baseline justify-between gap-3"><h2 className="text-base font-semibold">Next 7 days</h2><Link href="/news-city?tab=calendar" className="text-xs font-medium text-primary hover:underline">Full calendar</Link></div>
      <DataState env={current} />
      {scheduleIncomplete && current?.data && <p className="mt-2 text-xs text-muted-foreground">The schedule may be incomplete while sources update.</p>}
      <ol className="mt-4 divide-y divide-border/50">
        {events.slice(0, 8).map((event) => <li key={event.id} className="py-3 first:pt-0">
          <p className="text-xs text-muted-foreground">{format(parseISO(event.date), "EEE, d MMM")}{event.released ? " · Released" : " · Scheduled"}</p>
          <p className="mt-1 text-sm font-medium leading-snug">{event.label}</p>
        </li>)}
      </ol>
      {!events.length && current?.data && !scheduleIncomplete && <p className="mt-4 text-sm text-muted-foreground">No releases scheduled in the next seven days.</p>}
      {events.length > 8 && <Link href="/news-city?tab=calendar" className="mt-2 block text-xs text-primary">View all {events.length} releases</Link>}
    </section>
    <section className="rounded-xl border border-border/60 bg-card/30 p-5">
      <h2 className="text-base font-semibold">Latest readings</h2>
      <p className="mt-1 text-xs text-muted-foreground">Actual and prior period. FRED data.</p>
      {latest?.status !== "ok" && <DataState env={latest} />}
      <dl className="mt-4 divide-y divide-border/50">
        {readings.map((entry) => <div key={entry.id} className="py-3 first:pt-0">
          <dt className="text-sm font-medium">{entry.label}</dt>
          <dd className="mt-1 text-xs text-muted-foreground">{entry.referenceDate ? format(parseISO(entry.referenceDate), "MMM yyyy") : "Period unavailable"} · {releaseUnit(entry.unit)}</dd>
          <dd className="mt-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 tabular-nums">
            <span className="text-base font-semibold">{releaseValue(entry.actual, entry.unit)}</span>
            <span className="text-xs text-muted-foreground">Prior {releaseValue(entry.previous, entry.unit)}</span>
          </dd>
        </div>)}
      </dl>
      {latest?.status === "ok" && !readings.length && <p className="mt-3 text-sm text-muted-foreground">No readings available.</p>}
    </section>
  </aside>;
}
