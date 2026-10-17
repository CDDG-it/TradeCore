"use client";

import { useMemo } from "react";
import Link from "next/link";
import { addDays, format, parseISO } from "date-fns";
import { ArrowUpRight } from "lucide-react";
import { useGmi } from "@/lib/gmi/client";
import type { CalendarEvent, CalendarMonth } from "@/lib/gmi/calendar";
import { fedEventsByDate } from "@/lib/gmi/fed-events";

type BriefEvent = { key: string; date: string; label: string };

/** Short, date-aware alert using the same high-impact releases as Global Markets. */
export function AnalysisNewsBrief({ date, preview = false }: { date: string; preview?: boolean }) {
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(date);
  const from = valid ? date : format(new Date(), "yyyy-MM-dd");
  const to = format(addDays(parseISO(from), 7), "yyyy-MM-dd");
  const firstMonth = from.slice(0, 7);
  const nextMonth = to.slice(0, 7);
  const first = useGmi<CalendarMonth>(preview ? null : `/api/gmi/calendar?month=${firstMonth}`, 30 * 60_000);
  const second = useGmi<CalendarMonth>(preview || nextMonth === firstMonth ? null : `/api/gmi/calendar?month=${nextMonth}`, 30 * 60_000);

  const events = useMemo(() => {
    if (preview) return [
      { key: "demo-cpi", date: from, label: "CPI release" },
      { key: "demo-payrolls", date: format(addDays(parseISO(from), 3), "yyyy-MM-dd"), label: "Nonfarm Payrolls" },
    ];

    const byRelease = new Map<string, CalendarEvent>();
    for (const event of [...(first.env?.data?.events ?? []), ...(second.env?.data?.events ?? [])]) {
      if (event.importance !== "high" || event.date < from || event.date > to) continue;
      const key = `${event.date}:${event.releaseName}`;
      const held = byRelease.get(key);
      if (!held || (held.label.startsWith("Core") && !event.label.startsWith("Core"))) byRelease.set(key, event);
    }
    const releases: BriefEvent[] = [...byRelease.values()].map((event) => ({ key: event.id, date: event.date, label: event.label }));
    const fed: BriefEvent[] = [...fedEventsByDate(from, to).values()].flat()
      .filter((event) => event.importance === "high")
      .map((event) => ({ key: `fed:${event.date}`, date: event.date, label: event.title }));
    return [...releases, ...fed].sort((a, b) => a.date.localeCompare(b.date) || a.label.localeCompare(b.label)).slice(0, 2);
  }, [first.env, second.env, from, to, preview]);

  const loading = !preview && (first.loading || (nextMonth !== firstMonth && second.loading));
  const unavailable = !preview && first.env?.status === "unavailable" && (nextMonth === firstMonth || second.env?.status === "unavailable");
  const today = format(new Date(), "yyyy-MM-dd");

  return <aside aria-label="High-impact news events" className="rounded-xl border border-destructive/20 bg-destructive/[.035] px-3 py-2.5">
    <div className="flex items-center justify-between gap-2">
      <h3 className="flex items-center gap-2 text-xs font-semibold text-foreground"><span aria-hidden className="size-1.5 rounded-full bg-destructive shadow-[0_0_10px_var(--destructive)]" /> High-impact events</h3>
      {preview ? <span className="text-[10px] text-muted-foreground">Sample events</span> : <Link href="/news-city?tab=calendar" className="inline-flex items-center gap-0.5 text-[10px] font-medium text-muted-foreground hover:text-primary">Calendar <ArrowUpRight className="size-3" /></Link>}
    </div>
    <div className="mt-2 space-y-1.5">
      {events.map((event) => <p key={event.key} className="flex items-center justify-between gap-3 text-xs"><span className="min-w-0 truncate text-foreground/85">{event.label}</span><span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">{event.date === today ? "Today" : format(parseISO(event.date), "d MMM")}</span></p>)}
      {!events.length && <p className="text-[11px] text-muted-foreground">{loading ? "Loading calendar…" : unavailable ? "Calendar unavailable" : "No high-impact releases in the next 7 days"}</p>}
    </div>
  </aside>;
}
