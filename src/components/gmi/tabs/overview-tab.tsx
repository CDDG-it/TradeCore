"use client";

/**
 * OVERVIEW — what is open, what is coming, and what was reported.
 *
 * Deliberately price-free: the quote providers on this tier are delayed, so a
 * grid of big numbers here would imply a liveness they cannot deliver. Prices
 * live on the tabs that frame them properly (Futures charts, FX on Markets);
 * this page answers the questions that are answerable exactly — which session
 * is trading, which releases are scheduled, what landed, what is on the wire.
 */
import { useSyncExternalStore } from "react";
import Link from "next/link";
import { format, parseISO, addMonths, differenceInCalendarDays } from "date-fns";
import { ArrowUpRight, ArrowUp, ArrowDown, Minus, Clock } from "lucide-react";
import { toneFor, timeAgo, useGmi, FRESHNESS_LABEL } from "@/lib/gmi/client";
import { SESSIONS, sessionState, fmtDuration } from "@/lib/gmi/sessions";
import type { NewsArticle } from "@/lib/gmi/types";
import type { CalendarEntry, CalendarMonth, CalendarEvent } from "@/lib/gmi/calendar";
import { Panel, Unavailable, a } from "../panel";

/* ── Session clock ─────────────────────────────────────────────────────────
   Exchange cash hours in each venue's own local time, resolved through the
   IANA database so daylight saving is never guessed. */

/** Ticks every 30s, and stays null on the server so hydration can't disagree
 *  with the client about what time it is. */
function subscribeClock(onChange: () => void) {
  const id = setInterval(onChange, 30_000);
  return () => clearInterval(id);
}
function useClock(): Date | null {
  const bucket = useSyncExternalStore(
    subscribeClock,
    () => Math.floor(Date.now() / 30_000),
    () => null
  );
  return bucket == null ? null : new Date(bucket * 30_000);
}

function SessionClock() {
  const now = useClock();

  return (
    <Panel
      eyebrow="Session clock"
      title="Exchange hours"
      accent="cyan"
      action={<span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/70"><Clock className="h-3 w-3" /> venue local time</span>}
    >
      <div className="grid gap-2.5 sm:grid-cols-3">
        {SESSIONS.map((w) => {
          const st = now ? sessionState(w, now) : null;
          const live = st?.open ?? false;
          const tone = live ? "var(--success)" : "var(--muted-foreground)";
          return (
            <div
              key={w.key}
              className="relative overflow-hidden rounded-xl border border-border/50 bg-muted/[0.06] p-3"
              style={live ? { background: `linear-gradient(150deg, ${a("var(--success)", 8)}, transparent 60%)` } : undefined}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <span
                    className={live ? "h-1.5 w-1.5 rounded-full animate-pulse" : "h-1.5 w-1.5 rounded-full"}
                    style={{ background: tone, boxShadow: live ? `0 0 8px ${a("var(--success)", 70)}` : undefined }}
                  />
                  {w.label}
                </span>
                <span className="font-mono text-xs font-bold tabular-nums text-foreground/80">{st?.localTime ?? "—:—"}</span>
              </div>

              <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-border/60">
                <div
                  className="h-full rounded-full transition-[width] duration-700 ease-out"
                  style={{ width: `${(st?.progress ?? 0) * 100}%`, background: live ? "var(--success)" : "var(--muted-foreground)" }}
                />
              </div>

              <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground/70">
                <span className="uppercase tracking-wider">{w.hours}</span>
                <span className="tabular-nums">
                  {!st
                    ? "—"
                    : live
                    ? `closes in ${fmtDuration(st.minutesToEdge)}`
                    : st.nextOpenDay
                    ? `opens ${st.nextOpenDay} ${String(Math.floor(w.openMin / 60)).padStart(2, "0")}:${String(w.openMin % 60).padStart(2, "0")}`
                    : `opens in ${fmtDuration(st.minutesToEdge)}`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

/* ── Formatting ───────────────────────────────────────────────────────────── */

function fmtRel(v: number | null, unit: string): string {
  if (v == null) return "—";
  if (unit === "%") return `${v.toFixed(1)}%`;
  if (unit === "count") return Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(v);
  if (unit === "kpersons") return `${(v / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })}M`;
  if (unit === "$B") return `$${(v / 1000).toLocaleString(undefined, { maximumFractionDigits: 2 })}T`;
  if (unit === "$M") return `$${(v / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })}B`;
  return v.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

function sentimentTone(score: number | null): string {
  if (score == null) return "var(--muted-foreground)";
  if (score > 0.15) return "var(--success)";
  if (score < -0.15) return "var(--destructive)";
  return "var(--muted-foreground)";
}

/** Days-from-today, in words a trader reads without doing arithmetic. */
function whenLabel(date: string): string {
  const d = differenceInCalendarDays(parseISO(date), new Date());
  if (d === 0) return "today";
  if (d === 1) return "tomorrow";
  if (d < 7) return format(parseISO(date), "EEEE");
  return format(parseISO(date), "EEE d MMM");
}

export function OverviewTab() {
  const { env: newsEnv } = useGmi<NewsArticle[]>("/api/gmi/news", 15 * 60_000);
  const { env: latestEnv } = useGmi<CalendarEntry[]>("/api/gmi/calendar", 30 * 60_000);

  // The schedule spans a month boundary, so look at this month and the next.
  const thisMonth = format(new Date(), "yyyy-MM");
  const nextMonth = format(addMonths(new Date(), 1), "yyyy-MM");
  const { env: monthEnv } = useGmi<CalendarMonth>(`/api/gmi/calendar?month=${thisMonth}`, 60 * 60_000);
  const { env: nextEnv } = useGmi<CalendarMonth>(`/api/gmi/calendar?month=${nextMonth}`, 60 * 60_000);

  const articles = (newsEnv?.data ?? []).slice(0, 8);
  const prints = (latestEnv?.data ?? []).filter((e) => e.importance === "high").slice(0, 5);

  const upcoming: CalendarEvent[] = [...(monthEnv?.data?.events ?? []), ...(nextEnv?.data?.events ?? [])]
    .filter((e) => !e.released)
    .sort((x, y) => x.date.localeCompare(y.date))
    .slice(0, 6);

  return (
    <div className="space-y-4">
      <SessionClock />

      <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <Panel eyebrow="Wire" title="Latest market news" env={newsEnv}>
          {newsEnv?.status === "unavailable" ? (
            <Unavailable hint="News provider temporarily unavailable. Other data is unaffected." />
          ) : articles.length === 0 ? (
            <Unavailable label="No headlines" />
          ) : (
            <ol className="divide-y divide-border/40">
              {articles.map((art) => (
                <li key={art.id}>
                  <Link href={art.url} target="_blank" rel="noopener noreferrer" className="group flex items-start gap-3 py-2.5">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: sentimentTone(art.sentimentScore) }} />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-xs font-medium leading-snug text-foreground transition-colors group-hover:text-primary">{art.title}</p>
                      <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span className="font-medium text-foreground/70">{art.source}</span>
                        <span>· {timeAgo(art.publishedAt)}</span>
                        {art.assets[0] && <span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[9px] text-primary">{art.assets[0]}</span>}
                      </div>
                    </div>
                    <ArrowUpRight className="mt-1 h-3.5 w-3.5 shrink-0 -translate-x-1 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-70" />
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </Panel>

        <div className="space-y-4">
          {/* What is coming — real appointments from FRED's release calendar. */}
          <Panel eyebrow="Schedule" title="Next releases" env={monthEnv}>
            {upcoming.length === 0 ? (
              <Unavailable label="Nothing scheduled" hint="No further US releases on the calendar in this window." />
            ) : (
              <ul className="space-y-1.5">
                {upcoming.map((e) => (
                  <li key={e.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-muted/[0.06] px-3 py-2">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span
                        className="h-6 w-[3px] shrink-0 rounded-full"
                        style={{ background: e.importance === "high" ? "var(--destructive)" : "var(--warning)" }}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-foreground">{e.label}</p>
                        <p className="text-[10px] text-muted-foreground/70">{e.releaseName}</p>
                      </div>
                    </div>
                    <span className="shrink-0 text-right">
                      <span className="block text-[11px] font-semibold capitalize text-foreground/85">{whenLabel(e.date)}</span>
                      <span className="block font-mono text-[10px] tabular-nums text-muted-foreground/60">{format(parseISO(e.date), "d MMM")}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {/* What already landed. */}
          <Panel eyebrow="Macro" title="Latest prints" env={latestEnv}>
            {prints.length === 0 ? (
              <Unavailable label="Loading releases…" />
            ) : (
              <ul className="space-y-1.5">
                {prints.map((e) => {
                  const delta = e.actual != null && e.previous != null ? e.actual - e.previous : null;
                  const Icon = delta == null ? Minus : delta > 0 ? ArrowUp : delta < 0 ? ArrowDown : Minus;
                  return (
                    <li key={e.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-muted/[0.06] px-3 py-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-foreground">{e.label}</p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          {e.referenceDate ? format(parseISO(e.referenceDate), "MMM yyyy") : "—"}
                          <span className="ml-1.5 uppercase tracking-wider text-muted-foreground/50">{FRESHNESS_LABEL[e.freshness]}</span>
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="font-mono text-sm font-bold tabular-nums text-foreground">{fmtRel(e.actual, e.unit)}</span>
                        {delta != null && <Icon className="h-3.5 w-3.5" strokeWidth={2.5} style={{ color: toneFor(delta) }} />}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
