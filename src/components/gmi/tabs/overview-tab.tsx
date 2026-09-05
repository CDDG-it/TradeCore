"use client";

/**
 * 01 OVERVIEW — the day so far, in three readings: what came over the wire,
 * what the last macro prints said, and what the week still has scheduled.
 *
 * Deliberately price-free. The quote providers on this tier are delayed, so a
 * wall of big numbers here would imply a liveness they cannot deliver; prices
 * live in the sections that frame them properly (03 Futures, 02 Markets).
 */
import Link from "next/link";
import { format, parseISO, addDays, addMonths, isSameDay } from "date-fns";
import { toneFor, useGmi } from "@/lib/gmi/client";
import type { NewsArticle } from "@/lib/gmi/types";
import type { CalendarEntry, CalendarMonth, CalendarEvent } from "@/lib/gmi/calendar";
import { Pane, Empty, Field, Label, a } from "../pane";

function fmtRel(v: number | null, unit: string): string {
  if (v == null) return "—";
  if (unit === "%") return `${v.toFixed(1)}%`;
  if (unit === "count") return Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(v);
  if (unit === "kpersons") return `${(v / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })}M`;
  if (unit === "$B") return `$${(v / 1000).toLocaleString(undefined, { maximumFractionDigits: 2 })}T`;
  if (unit === "$M") return `$${(v / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })}B`;
  return v.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

function fmtDelta(v: number, unit: string): string {
  const s = v > 0 ? "+" : "";
  if (unit === "%") return `${s}${(v * 100).toFixed(0)}bp`;
  if (unit === "kpersons") return `${s}${v.toFixed(0)}k`;
  if (unit === "count") return `${s}${Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(v)}`;
  return `${s}${fmtRel(v, unit)}`;
}

/** Provider sentiment, shown as a hairline in the margin — never a label. */
function sentimentColor(score: number | null): string {
  if (score == null) return "var(--muted-foreground)";
  if (score > 0.15) return "var(--success)";
  if (score < -0.15) return "var(--destructive)";
  return "var(--muted-foreground)";
}

export function OverviewTab() {
  const { env: newsEnv } = useGmi<NewsArticle[]>("/api/gmi/news", 15 * 60_000);
  const { env: printsEnv } = useGmi<CalendarEntry[]>("/api/gmi/calendar", 30 * 60_000);

  const thisMonth = format(new Date(), "yyyy-MM");
  const nextMonth = format(addMonths(new Date(), 1), "yyyy-MM");
  const { env: monthEnv } = useGmi<CalendarMonth>(`/api/gmi/calendar?month=${thisMonth}`, 60 * 60_000);
  const { env: nextEnv } = useGmi<CalendarMonth>(`/api/gmi/calendar?month=${nextMonth}`, 60 * 60_000);

  const articles = newsEnv?.data ?? [];
  const prints = (printsEnv?.data ?? []).slice(0, 9);

  // The seven days from today — the horizon a desk actually plans against.
  const today = new Date();
  const week = Array.from({ length: 7 }, (_, i) => addDays(today, i));
  const scheduled: CalendarEvent[] = [...(monthEnv?.data?.events ?? []), ...(nextEnv?.data?.events ?? [])];

  return (
    <div className="flex min-h-full flex-col gap-2 lg:h-full lg:min-h-0">
      <div className="grid grid-cols-1 gap-2 lg:min-h-0 lg:flex-1 lg:grid-cols-12">
        {/* ── The wire ─────────────────────────────────────────────────── */}
        <Pane
          index="01"
          label="The wire"
          right={<Label className="tracking-[0.18em]">{articles.length} items</Label>}
          scroll
          bodyClassName="px-0 py-0"
          className="min-h-[280px] lg:col-span-7"
        >
          {newsEnv?.status === "unavailable" ? (
            <Empty label="Wire down" hint="The news provider is unavailable. Every other section is unaffected." />
          ) : articles.length === 0 ? (
            <Empty label="No headlines" />
          ) : (
            <ol>
              {articles.map((art) => (
                <li key={art.id} className="border-b border-border/25 last:border-0">
                  <Link
                    href={art.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-baseline gap-3 px-3 py-[7px] transition-colors hover:bg-muted/20"
                  >
                    <span className="shrink-0 text-[12px] tabular-nums text-foreground/65">
                      {format(parseISO(art.publishedAt), "HH:mm")}
                    </span>
                    <span
                      aria-hidden
                      className="mt-[5px] h-[3px] w-[3px] shrink-0 rounded-full"
                      style={{ background: sentimentColor(art.sentimentScore) }}
                      title={art.sentimentScore == null ? "No sentiment score" : `Sentiment ${art.sentimentScore.toFixed(2)}`}
                    />
                    <span className="min-w-0 flex-1 truncate text-[13px] leading-snug text-foreground/90 transition-colors group-hover:text-primary">
                      {art.title}
                    </span>
                    {art.assets[0] && (
                      <span className="hidden shrink-0 font-mono text-[11px] tracking-wider text-primary md:inline">{art.assets[0]}</span>
                    )}
                    <span className="hidden w-24 shrink-0 truncate text-right text-[11px] uppercase tracking-wider text-foreground/65 xl:inline">
                      {art.source}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </Pane>

        {/* ── Latest prints ────────────────────────────────────────────── */}
        <Pane
          index="02"
          label="Latest prints"
          right={<Label className="tracking-[0.18em]">actual · vs prior</Label>}
          scroll
          className="min-h-[260px] lg:col-span-5"
        >
          {prints.length === 0 ? (
            <Empty label="Loading" />
          ) : (
            <div className="divide-y divide-border/25">
              {prints.map((e) => {
                const delta = e.actual != null && e.previous != null ? e.actual - e.previous : null;
                return (
                  <Field
                    key={e.id}
                    label={e.label}
                    sub={e.referenceDate ? format(parseISO(e.referenceDate), "MMM yy") : undefined}
                    value={fmtRel(e.actual, e.unit)}
                    trailing={
                      delta != null ? (
                        <span className="mr-2 text-[12px] tabular-nums" style={{ color: toneFor(delta) }}>
                          {fmtDelta(delta, e.unit)}
                        </span>
                      ) : undefined
                    }
                  />
                );
              })}
            </div>
          )}
        </Pane>
      </div>

      {/* ── Week ahead ───────────────────────────────────────────────────
          Seven columns from today. A day either has appointments or it is
          quiet, and quiet is worth seeing too. */}
      <Pane
        index="03"
        label="Week ahead"
        right={<Label className="hidden tracking-[0.18em] sm:inline">US macro · schedule from FRED</Label>}
        bodyClassName="p-0"
        className="shrink-0 lg:h-[132px]"
      >
        {/* Seven narrow columns need a laptop; on a phone the same week reads
            as seven rows, day on the left and what it holds on the right. */}
        <div className="grid grid-cols-1 divide-y divide-border/30 lg:h-full lg:grid-cols-7 lg:divide-x lg:divide-y-0">
          {week.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const events = scheduled.filter((e) => e.date === key);
            const isToday = isSameDay(day, today);
            const weekend = day.getDay() === 0 || day.getDay() === 6;
            return (
              <div
                key={key}
                className="flex min-w-0 items-baseline gap-3 p-2 lg:flex-col lg:items-stretch lg:gap-1"
                style={
                  isToday
                    ? { background: a("var(--primary)", 6) }
                    // Weekends are empty for a reason; say so rather than
                    // leaving a blank column that looks like missing data.
                    : weekend
                    ? { background: a("var(--muted-foreground)", 4) }
                    : undefined
                }
              >
                <div className="flex w-[4.5rem] shrink-0 items-baseline gap-1.5 lg:w-auto">
                  <span className={`text-[11px] font-semibold uppercase tracking-wider ${isToday ? "text-primary" : "text-foreground/75"}`}>
                    {isToday ? "Today" : format(day, "EEE")}
                  </span>
                  <span className={`text-[13px] font-bold tabular-nums ${isToday ? "text-primary" : "text-foreground/80"}`}>
                    {format(day, "d")}
                  </span>
                </div>
                <div className="min-w-0 flex-1 space-y-[3px] lg:min-h-0 lg:overflow-hidden">
                  {events.length === 0 ? (
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground/65">
                      {weekend ? "market closed" : "no releases"}
                    </span>
                  ) : (
                    events.slice(0, 3).map((e) => (
                      <p
                        key={e.id}
                        className="truncate border-l pl-1.5 text-[11px] leading-tight text-foreground/85"
                        style={{ borderColor: e.importance === "high" ? "var(--destructive)" : "var(--warning)" }}
                        title={`${e.label} · ${e.releaseName}`}
                      >
                        {e.label}
                      </p>
                    ))
                  )}
                  {events.length > 3 && (
                    <p className="pl-1.5 text-[11px] tabular-nums text-foreground/65">+{events.length - 3}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Pane>
    </div>
  );
}
