"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  format, startOfWeek, subWeeks, endOfWeek, startOfDay, subMonths, startOfMonth, endOfMonth, isWithinInterval,
} from "date-fns";
import {
  Loader2, ArrowRight, CheckCircle2, Circle, Lock, ChevronDown, ChevronUp, PenLine,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getTrades, getWeeklyTradeReviews } from "@/lib/supabase/queries";
import { getWeekGroup, formatTotalR, tradeR } from "@/lib/journal/weeks";
import type { TradeJournalEntry, WeeklyTradeReview } from "@/lib/types";

type Mode = "weekly" | "monthly";

/**
 * Reviews — a two-pane surface. On the left a weekly/monthly toggle and the list
 * of periods (collapsible); on the right your review progress and a running
 * digest of exactly what you wrote. It reports only facts and your own words —
 * it makes no assumptions about your mistakes or patterns.
 */
export function ReviewsPanel() {
  const [trades, setTrades] = useState<TradeJournalEntry[] | null>(null);
  const [reviews, setReviews] = useState<WeeklyTradeReview[]>([]);
  const [mode, setMode] = useState<Mode>("weekly");
  const [listOpen, setListOpen] = useState(true);

  useEffect(() => {
    Promise.all([getTrades(), getWeeklyTradeReviews()]).then(([t, r]) => { setTrades(t); setReviews(r); });
  }, []);

  const reviewByWeek = useMemo(() => new Map(reviews.map((r) => [r.week_start, r])), [reviews]);
  const written = (r?: WeeklyTradeReview) => Boolean(r && (r.lessons || r.mistakes || r.prevention_plan));

  const weeks = useMemo(() => {
    if (!trades) return [];
    const now = new Date();
    return Array.from({ length: 12 }).map((_, i) => {
      const monday = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
      const ws = format(monday, "yyyy-MM-dd");
      return {
        ws, group: getWeekGroup(trades, ws),
        ended: endOfWeek(monday, { weekStartsOn: 1 }) < startOfDay(now),
        current: i === 0, review: reviewByWeek.get(ws),
      };
    });
  }, [trades, reviewByWeek]);

  const months = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }).map((_, i) => {
      const m = startOfMonth(subMonths(now, i));
      return { key: format(m, "yyyy-MM"), label: format(m, "MMMM yyyy"), date: m };
    });
  }, []);

  const writtenNotes = useMemo(
    () => reviews.filter((r) => written(r)).sort((a, b) => b.week_start.localeCompare(a.week_start)).slice(0, 8),
    [reviews]
  );

  if (!trades) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  }

  const closedWeeks = weeks.filter((w) => w.ended);
  const doneCount = closedWeeks.filter((w) => written(w.review)).length;
  const pct = closedWeeks.length ? Math.round((doneCount / closedWeeks.length) * 100) : 0;
  // Current streak of consecutive closed weeks with a written review (newest → back).
  let streak = 0;
  for (const w of closedWeeks) { if (written(w.review)) streak++; else break; }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] items-start">
      {/* LEFT — toggle + list */}
      <div className="rounded-2xl border border-border/60 bg-card">
        <div className="flex items-center justify-between gap-3 p-3 border-b border-border/40">
          <div className="flex rounded-lg border border-border/60 overflow-hidden">
            {(["weekly", "monthly"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn("px-4 py-1.5 text-xs font-semibold capitalize transition-colors",
                  mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}
              >
                {m}
              </button>
            ))}
          </div>
          <button
            onClick={() => setListOpen((v) => !v)}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            {listOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {listOpen ? "Collapse" : "Expand"}
          </button>
        </div>

        {listOpen && (
          <div className="p-3">
            {mode === "weekly" ? (
              <div className="space-y-1.5">
                {weeks.map(({ ws, group, ended, current, review }) => {
                  const done = written(review);
                  return (
                    <Link key={ws} href={`/trade-therapist/review/${ws}`}
                      className="group flex items-center gap-2.5 rounded-lg border border-border/60 px-3 py-2.5 transition-colors hover:border-primary/40 hover:bg-muted/30">
                      {!ended ? <Lock className="w-4 h-4 shrink-0 text-primary/70" />
                        : done ? <CheckCircle2 className="w-4 h-4 shrink-0 text-success" />
                        : <Circle className="w-4 h-4 shrink-0 text-muted-foreground/40" />}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold leading-none transition-colors group-hover:text-primary">
                          Week {group.weekNum}{current && <span className="ml-1.5 font-normal text-primary">· current</span>}
                        </p>
                        <p className="mt-1 text-[10px] text-muted-foreground leading-none">{group.rangeLabel}</p>
                      </div>
                      <span className="text-[11px] font-semibold text-muted-foreground tabular-nums">{group.wins}W {group.losses}L</span>
                      <span className={cn("w-12 shrink-0 text-right text-xs font-bold tabular-nums",
                        group.totalR > 0 ? "text-success" : group.totalR < 0 ? "text-destructive" : "text-warning")}>
                        {formatTotalR(group.totalR)}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-1.5">
                {months.map(({ key, label, date }) => {
                  const r = (trades ?? []).filter((t) => isWithinInterval(new Date(t.date_time.slice(0, 10) + "T12:00:00"),
                    { start: startOfMonth(date), end: endOfMonth(date) })).reduce((s, t) => s + tradeR(t), 0);
                  return (
                    <Link key={key} href={`/trade-therapist/review/month/${key}`}
                      className="group flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2.5 transition-colors hover:border-primary/40 hover:bg-muted/30">
                      <span className="flex-1 text-xs font-semibold transition-colors group-hover:text-primary">{label}</span>
                      <span className={cn("text-xs font-bold tabular-nums", r > 0 ? "text-success" : r < 0 ? "text-destructive" : "text-muted-foreground")}>{formatTotalR(r)}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* RIGHT — progress + what you wrote (facts only) */}
      <div className="space-y-4">
        <div className="rounded-2xl border border-border/60 bg-card p-4">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-sm font-semibold">Review progress</p>
            <span className="text-xs font-bold tabular-nums text-primary">{doneCount}/{closedWeeks.length}</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted-foreground/12">
            <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${pct}%`, background: "#14B8A6" }} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-border/50 bg-muted/15 px-3 py-2 text-center">
              <p className="text-lg font-black tabular-nums leading-none text-foreground">{streak}</p>
              <p className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Week streak</p>
            </div>
            <div className="rounded-lg border border-border/50 bg-muted/15 px-3 py-2 text-center">
              <p className="text-lg font-black tabular-nums leading-none text-foreground">{closedWeeks.length - doneCount}</p>
              <p className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Still to write</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-4">
          <div className="flex items-center gap-2">
            <PenLine className="w-4 h-4 text-primary" />
            <p className="text-sm font-semibold">Your reflections</p>
          </div>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Exactly what you wrote, newest first — your words only.</p>
          <div className="mt-3 space-y-2.5">
            {writtenNotes.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground/70">No reflections written yet — close a week to add one.</p>
            ) : (
              writtenNotes.map((r) => {
                const group = getWeekGroup(trades, r.week_start);
                return (
                  <Link key={r.week_start} href={`/trade-therapist/review/${r.week_start}`}
                    className="block rounded-lg border border-border/60 px-3 py-2.5 transition-colors hover:border-primary/40 hover:bg-muted/30">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[11px] font-bold">Week {group.weekNum}</span>
                      <span className="text-[10px] text-muted-foreground">{group.rangeLabel}</span>
                    </div>
                    {r.mistakes && (
                      <p className="mt-1.5 text-[11px] leading-snug"><span className="font-semibold text-destructive">The problem: </span><span className="text-muted-foreground">{r.mistakes}</span></p>
                    )}
                    {r.lessons && (
                      <p className="mt-1 text-[11px] leading-snug"><span className="font-semibold text-success">What worked: </span><span className="text-muted-foreground">{r.lessons}</span></p>
                    )}
                    {r.prevention_plan && (
                      <p className="mt-1 text-[11px] leading-snug"><span className="font-semibold text-primary">Focus next week: </span><span className="text-muted-foreground">{r.prevention_plan}</span></p>
                    )}
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
