"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  format, startOfMonth, endOfMonth, startOfISOWeek, addMonths, subMonths, isWithinInterval,
} from "date-fns";
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTrades, getWeeklyTradeReviews } from "@/lib/supabase/queries";
import { getWeekGroup, tradeR, formatTotalR, instrumentName } from "@/lib/journal/weeks";
import type { TradeJournalEntry, WeeklyTradeReview } from "@/lib/types";

const TURQUOISE = "#14B8A6";

function Metric({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-xl border border-border/50 bg-muted/15 px-3 py-2.5 text-center">
      <p className={cn("text-xl font-black tabular-nums leading-none", tone)} style={!tone ? { color: TURQUOISE } : undefined}>{value}</p>
      <p className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}

/**
 * Monthly review — a read-only rollup of the month's weeks. It aggregates the
 * weekly numbers, surfaces the standout weeks and recurring behaviour, and links
 * into each week's review. Nothing to fill in here: the month is the sum of its
 * weeks, so completion is tracked at the weekly level.
 */
export function MonthlyReviewView({ month }: { month: string }) {
  const [trades, setTrades] = useState<TradeJournalEntry[] | null>(null);
  const [reviews, setReviews] = useState<WeeklyTradeReview[]>([]);

  useEffect(() => {
    Promise.all([getTrades(), getWeeklyTradeReviews()]).then(([t, r]) => { setTrades(t); setReviews(r); });
  }, []);

  const valid = /^\d{4}-\d{2}$/.test(month);
  const monthDate = useMemo(() => (valid ? new Date(month + "-01T12:00:00") : new Date()), [month, valid]);

  const data = useMemo(() => {
    if (!trades) return null;
    const start = startOfMonth(monthDate);
    const end = endOfMonth(monthDate);
    const inMonth = trades.filter((t) => isWithinInterval(new Date(t.date_time.slice(0, 10) + "T12:00:00"), { start, end }));
    const weekStarts = [...new Set(inMonth.map((t) => format(startOfISOWeek(new Date(t.date_time.slice(0, 10) + "T12:00:00")), "yyyy-MM-dd")))].sort();
    const weeks = weekStarts.map((ws) => getWeekGroup(trades, ws));

    const wins = inMonth.filter((t) => t.result === "win");
    const winRate = inMonth.length ? Math.round((wins.length / inMonth.length) * 100) : null;
    const avgRR = wins.length ? (wins.reduce((s, t) => s + t.rr, 0) / wins.length).toFixed(1) : "—";
    const totalR = inMonth.reduce((s, t) => s + tradeR(t), 0);

    const instruments = new Map<string, number>();
    inMonth.forEach((t) => instruments.set(instrumentName(t.instrument), (instruments.get(instrumentName(t.instrument)) ?? 0) + 1));
    const topInstruments = [...instruments.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

    return {
      inMonth, weeks, winRate, avgRR, totalR, topInstruments,
      wins: wins.length,
      losses: inMonth.filter((t) => t.result === "loss").length,
      bestWeek: weeks.length ? [...weeks].sort((a, b) => b.totalR - a.totalR)[0] : null,
    };
  }, [trades, monthDate]);

  if (!valid) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground text-sm">Invalid month.</p>
        <Link href="/trade-therapist?tab=reviews" className="text-primary text-sm hover:underline mt-2 inline-block">Back to reviews</Link>
      </div>
    );
  }
  if (!trades || !data) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  }

  const rTone = data.totalR > 0 ? "text-success" : data.totalR < 0 ? "text-destructive" : "text-warning";
  const prevMonth = format(subMonths(monthDate, 1), "yyyy-MM");
  const nextMonth = format(addMonths(monthDate, 1), "yyyy-MM");
  const nextDisabled = startOfMonth(addMonths(monthDate, 1)) > new Date();
  const reviewedWeeks = new Set(reviews.filter((r) => r.lessons || r.mistakes || r.prevention_plan).map((r) => r.week_start));

  return (
    <div className="space-y-4">
      <div>
        <Link href="/trade-therapist?tab=reviews" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to reviews
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-center gap-2">
            <Link href={`/trade-therapist/review/month/${prevMonth}`} aria-label="Previous month"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary">
              <ChevronLeft className="w-4 h-4" />
            </Link>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-primary/10 text-primary">Monthly review</span>
              <h1 className="text-2xl font-black tracking-tight mt-1.5">{format(monthDate, "MMMM yyyy")}</h1>
              <p className="text-sm text-muted-foreground">{data.inMonth.length} trade{data.inMonth.length !== 1 ? "s" : ""} across {data.weeks.length} week{data.weeks.length !== 1 ? "s" : ""}</p>
            </div>
            {!nextDisabled && (
              <Link href={`/trade-therapist/review/month/${nextMonth}`} aria-label="Next month"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary">
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>
          <div className="text-right">
            <p className={cn("text-3xl font-black leading-none", rTone)}>{formatTotalR(data.totalR)}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 mt-1">Month R</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        <Metric label="Trades" value={String(data.inMonth.length)} tone="text-foreground" />
        <Metric label="Win rate" value={data.winRate == null ? "—" : `${data.winRate}%`} />
        <Metric label="Avg R:R" value={data.avgRR === "—" ? "—" : `${data.avgRR}R`} tone="text-primary" />
        <Metric label="Wins" value={String(data.wins)} tone="text-success" />
        <Metric label="Losses" value={String(data.losses)} tone="text-destructive" />
        <Metric label="Best week" value={data.bestWeek ? formatTotalR(data.bestWeek.totalR) : "—"} tone="text-success" />
      </div>

      <div className="grid gap-3 lg:grid-cols-2 items-start">
        {/* Weeks */}
        <div className="rounded-2xl border border-border/60 bg-card p-4">
          <p className="text-sm font-semibold mb-2.5">Weeks</p>
          {data.weeks.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground/70">No trades this month.</p>
          ) : (
            <div className="space-y-1.5">
              {data.weeks.map((w) => (
                <Link
                  key={w.weekStart}
                  href={`/trade-therapist/review/${w.weekStart}`}
                  className="group flex items-center gap-3 rounded-lg border border-border/60 px-3 py-2.5 transition-colors hover:border-primary/40 hover:bg-muted/30"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold leading-none transition-colors group-hover:text-primary">Week {w.weekNum}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground leading-none">{w.rangeLabel}</p>
                  </div>
                  {reviewedWeeks.has(w.weekStart) && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                  )}
                  <span className="text-[11px] font-semibold text-muted-foreground tabular-nums">{w.wins}W {w.losses}L</span>
                  <span className={cn("w-12 shrink-0 text-right text-xs font-bold tabular-nums",
                    w.totalR > 0 ? "text-success" : w.totalR < 0 ? "text-destructive" : "text-warning")}>
                    {formatTotalR(w.totalR)}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Most traded — factual, no behavioural assumptions */}
        <div className="rounded-2xl border border-border/60 bg-card p-4">
          <div>
            <p className="text-sm font-semibold mb-2">Most traded</p>
            {data.topInstruments.length === 0 ? (
              <p className="text-xs text-muted-foreground/70">No trades this month.</p>
            ) : (
              <div className="space-y-1.5">
                {data.topInstruments.map(([name, count]) => (
                  <div key={name} className="flex items-center gap-2">
                    <span className="w-16 shrink-0 truncate text-[11px] text-muted-foreground">{name}</span>
                    <div className="h-1.5 flex-1 rounded-full bg-muted/40 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(count / data.inMonth.length) * 100}%`, background: TURQUOISE }} />
                    </div>
                    <span className="w-6 shrink-0 text-right text-[11px] font-bold tabular-nums text-foreground/70">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
