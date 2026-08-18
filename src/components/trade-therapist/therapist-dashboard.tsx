"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  format, startOfMonth, endOfMonth, startOfWeek, eachDayOfInterval, isWeekend,
} from "date-fns";
import { Loader2, ChevronRight, CalendarCheck, Trophy, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getTrades, getAnalyses, getPsychEdgeSessions, getBestTradesOfDay, getWeeklyTradeReviews,
} from "@/lib/supabase/queries";
import { detectPatterns, summarizePatterns, PATTERN_DESCRIPTIONS } from "@/lib/psych-edge/patterns";
import { tradesNeedingReflection, computeReflectionConsistency } from "@/lib/psych-edge/therapist";
import { instrumentName, formatTotalR } from "@/lib/journal/weeks";
import { BestTradeDayDialog } from "@/components/journal/best-trade-day";
import { getProfile } from "@/lib/supabase/queries";
import type {
  TradeJournalEntry, PreTradeAnalysis, PsychEdgeSession, BestTradeOfDay, WeeklyTradeReview, PatternType,
} from "@/lib/types";

const TURQUOISE = "#14B8A6";
const TODAY = format(new Date(), "yyyy-MM-dd");

/** One headline metric. */
function StatCard({
  label, value, sub, tone,
}: { label: string; value: string; sub: string; tone?: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground leading-none">{label}</p>
      <p className={cn("mt-2 text-3xl font-black tabular-nums leading-none", tone)} style={!tone ? { color: TURQUOISE } : undefined}>
        {value}
      </p>
      <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">{sub}</p>
    </div>
  );
}

/**
 * MC Trade Therapist — the insights dashboard.
 *
 * Everything here is derived from the trader's own logged history by the
 * deterministic pattern engine (src/lib/psych-edge/patterns.ts), never an LLM:
 * which behaviours are costing R, which trades still need working through,
 * whether the best trade of the day is being logged, and where the weekly and
 * monthly reviews stand.
 */
export function TherapistDashboard({ onOpenFiveR }: { onOpenFiveR: () => void }) {
  const [trades, setTrades] = useState<TradeJournalEntry[] | null>(null);
  const [analyses, setAnalyses] = useState<PreTradeAnalysis[]>([]);
  const [sessions, setSessions] = useState<PsychEdgeSession[]>([]);
  const [bestTrades, setBestTrades] = useState<BestTradeOfDay[]>([]);
  const [reviews, setReviews] = useState<WeeklyTradeReview[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [btdDate, setBtdDate] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      getTrades(), getAnalyses(), getPsychEdgeSessions(), getBestTradesOfDay(), getWeeklyTradeReviews(),
    ])
      .then(([t, a, s, b, r]) => { setTrades(t); setAnalyses(a); setSessions(s); setBestTrades(b); setReviews(r); })
      .catch(() => setTrades([]));
    getProfile().then((p) => { if (p?.id) setUserId(p.id); });
  }, []);

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const patterns = useMemo(() => {
    if (!trades) return null;
    return summarizePatterns(detectPatterns(trades, analyses));
  }, [trades, analyses]);

  const queue = useMemo(() => {
    if (!trades) return [];
    const done = new Set(sessions.filter((s) => s.reconstruction_confirmed && s.trade_id).map((s) => s.trade_id as string));
    return tradesNeedingReflection(trades, analyses).filter((t) => !done.has(t.trade.id)).slice(0, 6);
  }, [trades, analyses, sessions]);

  const reflection = useMemo(() => {
    if (!trades) return { rate: null as number | null, completed: 0, total: 0 };
    return computeReflectionConsistency(trades, analyses, sessions, monthStart, monthEnd);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trades, analyses, sessions]);

  /** Best-trade logging coverage: weekdays so far this month that have an entry. */
  const bestCoverage = useMemo(() => {
    const weekdaysSoFar = eachDayOfInterval({ start: monthStart, end: now }).filter((d) => !isWeekend(d));
    const logged = new Set(bestTrades.map((b) => b.date.slice(0, 10)));
    const done = weekdaysSoFar.filter((d) => logged.has(format(d, "yyyy-MM-dd"))).length;
    return { done, total: weekdaysSoFar.length };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bestTrades]);

  const todaysBest = bestTrades.find((b) => b.date.slice(0, 10) === TODAY);

  const thisWeekStart = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekReviewDone = reviews.some((r) => r.week_start === thisWeekStart);

  if (!trades) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // The behaviour costing the most R, if any has fired.
  const ranked = patterns
    ? (Object.values(patterns) as { type: PatternType; label: string; count: number; cumulativeR: number; lastDate: string | null }[])
        .filter((p) => p.count > 0)
        .sort((a, b) => a.cumulativeR - b.cumulativeR)
    : [];
  const topLeak = ranked[0] ?? null;

  return (
    <div className="space-y-4">
      {/* Headline metrics */}
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Reflections this month"
          value={reflection.total === 0 ? "—" : `${reflection.completed}/${reflection.total}`}
          sub={reflection.total === 0
            ? "No trades yet that need working through."
            : "Losses, bad execution and flagged trades worked through with a 5R."}
        />
        <StatCard
          label="Behavioural cost"
          value={topLeak ? formatTotalR(ranked.reduce((s, p) => s + p.cumulativeR, 0)) : "0R"}
          sub={topLeak
            ? `Your biggest leak is ${topLeak.label.toLowerCase()} — ${topLeak.count}× so far.`
            : "No behavioural patterns detected in your history yet."}
          tone={topLeak ? "text-destructive" : "text-success"}
        />
        <StatCard
          label="Best trade logged"
          value={bestCoverage.total === 0 ? "—" : `${bestCoverage.done}/${bestCoverage.total}`}
          sub="Trading days this month where you logged the best trade available."
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-2 items-start">
        {/* Patterns */}
        <div className="rounded-2xl border border-border/60 bg-card p-4">
          <p className="text-sm font-semibold">What keeps costing you</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Detected from your own trades by a rule-based engine — every number traces back to real entries.
          </p>
          <div className="mt-3 space-y-2">
            {ranked.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground/70">
                Nothing flagged yet. Keep logging and this fills in.
              </p>
            ) : (
              ranked.map((p) => (
                <div key={p.type} className="rounded-lg border border-border/60 px-3 py-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs font-semibold">{p.label}</span>
                    <span className="text-xs font-black tabular-nums text-destructive">{formatTotalR(p.cumulativeR)}</span>
                  </div>
                  <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">
                    {PATTERN_DESCRIPTIONS[p.type]}
                  </p>
                  <p className="mt-1 text-[10px] tabular-nums text-muted-foreground/70">
                    {p.count}× · last {p.lastDate ? format(new Date(p.lastDate + "T12:00:00"), "MMM d") : "—"}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Reflection queue */}
        <div className="rounded-2xl border border-border/60 bg-card p-4">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-sm font-semibold">Trades to work through</p>
            {queue.length > 0 && (
              <button onClick={onOpenFiveR} className="text-[11px] font-semibold text-primary hover:underline">
                Start a 5R →
              </button>
            )}
          </div>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Decisive trades without a completed reflection.
          </p>
          <div className="mt-3 space-y-1.5">
            {queue.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground/70">
                All caught up — nothing waiting on a reflection.
              </p>
            ) : (
              queue.map(({ trade, netR, topPattern }) => (
                <Link
                  key={trade.id}
                  href={`/journal/${trade.id}`}
                  className="group flex items-center gap-2.5 rounded-lg border border-border/60 px-3 py-2 transition-colors hover:border-primary/40 hover:bg-muted/30"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold leading-none transition-colors group-hover:text-primary">
                      {instrumentName(trade.instrument)}
                      <span className="ml-1.5 font-normal text-muted-foreground">
                        {format(new Date(trade.date_time.slice(0, 10) + "T12:00:00"), "MMM d")}
                      </span>
                    </p>
                    {topPattern && (
                      <p className="mt-1 text-[10px] leading-none text-warning">Flagged: {topPattern.type.replace("-", " ")}</p>
                    )}
                  </div>
                  <span className={cn("text-xs font-bold tabular-nums", netR > 0 ? "text-success" : netR < 0 ? "text-destructive" : "text-warning")}>
                    {formatTotalR(netR)}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2 items-start">
        {/* Best trade of the day */}
        <div className="rounded-2xl border border-border/60 bg-card p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/10">
              <Trophy className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Best trade of the day</p>
              <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                Log the best trade the market actually offered today — the fastest way to train what you are missing.
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-muted/20 px-3 py-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground leading-none">Today</p>
              <p className={cn("mt-1 text-xs font-bold leading-none", todaysBest ? "text-success" : "text-muted-foreground")}>
                {todaysBest ? (todaysBest.taken_was_best ? "You took the best trade" : "Logged") : "Not logged yet"}
              </p>
            </div>
            <button
              onClick={() => setBtdDate(TODAY)}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-all hover:-translate-y-px"
              style={{ background: TURQUOISE, boxShadow: "0 2px 12px rgba(20,184,166,0.26)" }}
            >
              {todaysBest ? "Edit entry" : "Log best trade"}
            </button>
          </div>
        </div>

        {/* Reviews — moved here from the journal */}
        <div className="rounded-2xl border border-border/60 bg-card p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/10">
              <CalendarCheck className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Reviews</p>
              <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                Step back from single trades and look at the week and the month as a whole.
              </p>
            </div>
          </div>

          <div className="mt-3 space-y-1.5">
            <Link
              href={`/trade-therapist/review/${thisWeekStart}`}
              className="group flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2.5 transition-colors hover:border-primary/40 hover:bg-muted/30"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold leading-none transition-colors group-hover:text-primary">Weekly review</p>
                <p className="mt-1 text-[10px] leading-none text-muted-foreground">
                  Week of {format(startOfWeek(now, { weekStartsOn: 1 }), "MMM d")}
                </p>
              </div>
              <span className={cn("text-[10px] font-bold", weekReviewDone ? "text-success" : "text-muted-foreground")}>
                {weekReviewDone ? "Done" : "To write"}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
            </Link>

            <Link
              href={`/trade-therapist/review/month/${format(now, "yyyy-MM")}`}
              className="group flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2.5 transition-colors hover:border-primary/40 hover:bg-muted/30"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold leading-none transition-colors group-hover:text-primary">Monthly review</p>
                <p className="mt-1 text-[10px] leading-none text-muted-foreground">{format(now, "MMMM yyyy")}</p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </div>

      {btdDate && (
        <BestTradeDayDialog
          date={btdDate}
          userId={userId}
          open={btdDate !== null}
          onOpenChange={(v) => { if (!v) setBtdDate(null); }}
          onSaved={(entry) => {
            setBestTrades((prev) => {
              const rest = prev.filter((b) => b.date.slice(0, 10) !== btdDate);
              return entry ? [...rest, entry] : rest;
            });
          }}
        />
      )}
    </div>
  );
}
