"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  format, startOfMonth, endOfMonth, startOfISOWeek, addMonths, subMonths, isWithinInterval,
} from "date-fns";
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import { MotionConfig, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { EASE_OUT, rise } from "@/lib/motion";
import { CountUp } from "@/components/ui/count-up";
import { GrowBar } from "@/components/ui/grow-bar";
import { getTrades, getWeeklyTradeReviews, getAllTradeRuleChecks } from "@/lib/supabase/queries";
import { peekRead, primeRead } from "@/lib/supabase/cache";
import { getWeekGroup, tradeR, formatTotalR, instrumentName, tradesWinRate } from "@/lib/journal/weeks";
import type { TradeJournalEntry, WeeklyTradeReview } from "@/lib/types";
import { persistentBrokenPatterns } from "@/lib/reviews/rule-patterns";

const TURQUOISE = "var(--primary)";

/* Which way the last month step went, so the next month slides in from that
   side (each month is its own route, so the view mounts anew). */
let lastStep = 0;

function Metric({ label, value, tone }: { label: string; value: React.ReactNode; tone?: string }) {
  return (
    <div className="rounded-xl border border-border/50 bg-muted/15 px-3 py-2.5 text-center">
      <p className={cn("text-xl font-black tabular-nums leading-none", tone)} style={!tone ? { color: TURQUOISE } : undefined}>{value}</p>
      <p className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}

/**
 * Monthly review: a read-only rollup of the month's weeks. It aggregates the
 * weekly numbers, surfaces the standout weeks and recurring behaviour, and links
 * into each week's review. Nothing to fill in here: the month is the sum of its
 * weeks, so completion is tracked at the weekly level.
 */
/* Moving to another month mounts this view afresh. Starting from the reads
   already cached renders that month at once, instead of flashing a spinner
   and rebuilding the page; fresh data still replaces it. Rule checks are not
   a cached read, so they are kept under a `trades` key: any trade write
   (which is what changes them) and any account switch drops them. */
const RULE_CHECKS_KEY = "trades:allRuleChecks";

export function MonthlyReviewView({ month }: { month: string }) {
  const [trades, setTrades] = useState<TradeJournalEntry[] | null>(() => peekRead<TradeJournalEntry[]>("trades") ?? null);
  const [reviews, setReviews] = useState<WeeklyTradeReview[]>(() => peekRead<WeeklyTradeReview[]>("weeklyReviews") ?? []);
  const [ruleChecks, setRuleChecks] = useState<Awaited<ReturnType<typeof getAllTradeRuleChecks>>>(() => peekRead<Awaited<ReturnType<typeof getAllTradeRuleChecks>>>(RULE_CHECKS_KEY) ?? []);

  // The step is used once, by this mount's entrance.
  useEffect(() => { lastStep = 0; }, []);

  useEffect(() => {
    Promise.all([getTrades(), getWeeklyTradeReviews(), getAllTradeRuleChecks()]).then(([t, r, checks]) => {
      primeRead(RULE_CHECKS_KEY, checks);
      setTrades(t); setReviews(r); setRuleChecks(checks);
    });
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
    const winRate = tradesWinRate(inMonth);
    const avgRR = wins.length ? (wins.reduce((s, t) => s + t.rr, 0) / wins.length).toFixed(1) : "-";
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
  const persistentPatterns = (() => {
    const dateByTrade = new Map(data.inMonth.map((trade) => [trade.id, trade.date_time.slice(0, 10)]));
    return persistentBrokenPatterns(ruleChecks.filter((check) => dateByTrade.has(check.trade_id)).map((check) => ({ ...check, date: dateByTrade.get(check.trade_id)! })));
  })();

  const step = lastStep;
  return (
    <MotionConfig reducedMotion="user">
    <motion.div className="space-y-4" initial={{ opacity: 0, transform: `translateX(${step * 18}px)` }} animate={{ opacity: 1, transform: "translateX(0px)" }} transition={{ duration: 0.22, ease: EASE_OUT }}>
      <div>
        <Link href="/trade-therapist?tab=reviews" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to reviews
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-center gap-2">
            <Link href={`/trade-therapist/review/month/${prevMonth}`} aria-label="Previous month" onClick={() => { lastStep = -1; }}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary">
              <ChevronLeft className="w-4 h-4" />
            </Link>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-primary/10 text-primary">Monthly review</span>
              <h1 className="text-2xl font-black tracking-tight mt-1.5">{format(monthDate, "MMMM yyyy")}</h1>
              <p className="text-sm text-muted-foreground">{data.inMonth.length} trade{data.inMonth.length !== 1 ? "s" : ""} across {data.weeks.length} week{data.weeks.length !== 1 ? "s" : ""}</p>
            </div>
            {!nextDisabled && (
              <Link href={`/trade-therapist/review/month/${nextMonth}`} aria-label="Next month" onClick={() => { lastStep = 1; }}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary">
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>
          <div className="text-right">
            <p className={cn("text-3xl font-black leading-none tabular-nums", rTone)}><CountUp value={data.totalR} format={formatTotalR} duration={0.9} /></p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 mt-1">Month R</p>
          </div>
        </div>
      </div>

      <motion.div {...rise(1)} className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        <Metric label="Trades" value={<CountUp value={data.inMonth.length} />} tone="text-foreground" />
        <Metric label="Win rate" value={data.winRate == null ? "-" : <CountUp value={data.winRate} format={(n) => `${Math.round(n)}%`} />} />
        <Metric label="Avg R:R" value={data.avgRR === "-" ? "-" : <CountUp value={Number(data.avgRR)} format={(n) => `${n.toFixed(1)}R`} />} tone="text-primary" />
        <Metric label="Wins" value={<CountUp value={data.wins} />} tone="text-success" />
        <Metric label="Losses" value={<CountUp value={data.losses} />} tone="text-destructive" />
        <Metric label="Best week" value={data.bestWeek ? <CountUp value={data.bestWeek.totalR} format={formatTotalR} /> : "-"} tone="text-success" />
      </motion.div>

      {persistentPatterns.length > 0 && <div className="rounded-2xl border border-destructive/25 bg-destructive/5 p-4"><p className="text-[10px] font-semibold uppercase tracking-[.14em] text-destructive">Persistent pattern</p>{persistentPatterns.map((pattern) => <div key={pattern.text} className="mt-2 flex items-start justify-between gap-3 text-sm"><span className="font-medium">{pattern.text}</span><span className="shrink-0 text-xs font-semibold text-destructive">broken across {pattern.weeks} weeks</span></div>)}</div>}

      <motion.div {...rise(2)} className="grid grid-cols-[minmax(0,1fr)] items-start gap-3 lg:grid-cols-2">
        {/* Weeks */}
        <div className="rounded-2xl border border-border/60 bg-card p-4">
          <p className="text-sm font-semibold mb-2.5">Weeks</p>
          {data.weeks.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground/70">No trades this month.</p>
          ) : (
            <div className="space-y-1.5">
              {data.weeks.map((w, index) => {
                const best = data.weeks.length > 1 && w.weekStart === data.bestWeek?.weekStart && w.totalR > 0;
                return <motion.div key={w.weekStart} initial={{ opacity: 0, transform: "translateY(6px)" }} animate={{ opacity: 1, transform: "translateY(0px)" }} transition={{ duration: 0.3, delay: 0.2 + index * 0.05, ease: EASE_OUT }}>
                <Link
                  href={`/trade-therapist/review/${w.weekStart}`}
                  className={cn("group flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors hover:border-primary/40 hover:bg-muted/30", best ? "border-success/35 bg-success/[.05]" : "border-border/60")}
                >
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 text-xs font-bold leading-none transition-colors group-hover:text-primary">Week {w.weekNum}{best && <span className="rounded-full bg-success/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-success">Best</span>}</p>
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
                </motion.div>;
              })}
            </div>
          )}
        </div>

        {/* Most traded: factual, no behavioural assumptions */}
        <div className="rounded-2xl border border-border/60 bg-card p-4">
          <div>
            <p className="text-sm font-semibold mb-2">Most traded</p>
            {data.topInstruments.length === 0 ? (
              <p className="text-xs text-muted-foreground/70">No trades this month.</p>
            ) : (
              <div className="space-y-1.5">
                {data.topInstruments.map(([name, count], index) => (
                  <div key={name} className="flex items-center gap-2">
                    <span className="w-16 shrink-0 truncate text-[11px] text-muted-foreground">{name}</span>
                    <GrowBar className="h-1.5 flex-1 bg-muted/40" value={count / data.inMonth.length} color={TURQUOISE} delay={0.25 + index * 0.06} />
                    <span className="w-6 shrink-0 text-right text-[11px] font-bold tabular-nums text-foreground/70">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
    </MotionConfig>
  );
}
