"use client";

import { useEffect, useMemo, useState } from "react";
import {
  format, startOfMonth, endOfMonth, isWithinInterval,
} from "date-fns";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTrades, getAnalyses, getBestTradesOfDay } from "@/lib/supabase/queries";
import { detectPatterns, summarizePatterns, PATTERN_DESCRIPTIONS } from "@/lib/psych-edge/patterns";
import { tradeR, formatTotalR } from "@/lib/journal/weeks";
import { TradeCalendar } from "@/components/trade-therapist/trade-calendar";
import type { TradeJournalEntry, PreTradeAnalysis, BestTradeOfDay, PatternType } from "@/lib/types";

const TURQUOISE = "#14B8A6";

function StatCard({ label, value, sub, tone }: { label: string; value: string; sub: string; tone?: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground leading-none">{label}</p>
      <p className={cn("mt-2 text-2xl font-black tabular-nums leading-none", tone)} style={!tone ? { color: TURQUOISE } : undefined}>{value}</p>
      <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">{sub}</p>
    </div>
  );
}

/**
 * MC Trade Therapist — Overview. A month of taken trades and their outcomes on
 * a calendar, the behaviour the pattern engine says is costing the most R, and
 * the month's headline numbers. Clicking a day opens its post-market analysis.
 */
export function TherapistOverview({ onOpenDay }: { onOpenDay: (date: string) => void }) {
  const [trades, setTrades] = useState<TradeJournalEntry[] | null>(null);
  const [analyses, setAnalyses] = useState<PreTradeAnalysis[]>([]);
  const [bestTrades, setBestTrades] = useState<BestTradeOfDay[]>([]);
  const [month, setMonth] = useState(startOfMonth(new Date()));

  useEffect(() => {
    Promise.all([getTrades(), getAnalyses(), getBestTradesOfDay()])
      .then(([t, a, b]) => { setTrades(t); setAnalyses(a); setBestTrades(b); })
      .catch(() => setTrades([]));
  }, []);

  const monthTrades = useMemo(() => {
    if (!trades) return [];
    const start = startOfMonth(month), end = endOfMonth(month);
    return trades.filter((t) => isWithinInterval(new Date(t.date_time.slice(0, 10) + "T12:00:00"), { start, end }));
  }, [trades, month]);

  const patterns = useMemo(() => (trades ? summarizePatterns(detectPatterns(trades, analyses)) : null), [trades, analyses]);

  const analysedDays = useMemo(() => {
    const s = new Set<string>();
    bestTrades.forEach((b) => {
      if (b.taken_was_best || (b.post_market_analysis ?? "").trim() || (b.notes ?? "").trim() || (b.screenshot_groups ?? []).some((g) => g.urls.length > 0)) {
        s.add(b.date.slice(0, 10));
      }
    });
    return s;
  }, [bestTrades]);

  if (!trades) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  }

  const wins = monthTrades.filter((t) => t.result === "win").length;
  const winRate = monthTrades.length ? Math.round((wins / monthTrades.length) * 100) : null;
  const monthR = monthTrades.reduce((s, t) => s + tradeR(t), 0);

  const ranked = patterns
    ? (Object.values(patterns) as { type: PatternType; label: string; count: number; cumulativeR: number; lastDate: string | null }[])
        .filter((p) => p.count > 0)
        .sort((a, b) => a.cumulativeR - b.cumulativeR)
    : [];
  const topLeak = ranked[0] ?? null;
  const behaviourCost = ranked.reduce((s, p) => s + p.cumulativeR, 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="This month"
          value={monthTrades.length === 0 ? "—" : formatTotalR(monthR)}
          sub={`${monthTrades.length} trade${monthTrades.length !== 1 ? "s" : ""}${winRate == null ? "" : ` · ${winRate}% win`}`}
          tone={monthR > 0 ? "text-success" : monthR < 0 ? "text-destructive" : undefined}
        />
        <StatCard
          label="Behavioural cost"
          value={topLeak ? formatTotalR(behaviourCost) : "0R"}
          sub={topLeak ? `Biggest leak: ${topLeak.label.toLowerCase()} — ${topLeak.count}x so far.` : "No behavioural patterns detected in your history yet."}
          tone={topLeak ? "text-destructive" : "text-success"}
        />
        <StatCard
          label="Days analysed"
          value={String(analysedDays.size)}
          sub="Days you have written a post-market analysis or logged the best trade."
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px] items-start">
        <TradeCalendar
          month={month}
          onMonthChange={setMonth}
          trades={trades}
          analysed={analysedDays}
          onSelectDay={onOpenDay}
        />

        <div className="rounded-2xl border border-border/60 bg-card p-4">
          <p className="text-sm font-semibold">What keeps costing you</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Detected from your own trades by a rule-based engine — every number traces back to real entries.
          </p>
          <div className="mt-3 space-y-2">
            {ranked.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground/70">Nothing flagged yet. Keep logging and this fills in.</p>
            ) : (
              ranked.map((p) => (
                <div key={p.type} className="rounded-lg border border-border/60 px-3 py-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs font-semibold">{p.label}</span>
                    <span className="text-xs font-black tabular-nums text-destructive">{formatTotalR(p.cumulativeR)}</span>
                  </div>
                  <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">{PATTERN_DESCRIPTIONS[p.type]}</p>
                  <p className="mt-1 text-[10px] tabular-nums text-muted-foreground/70">
                    {p.count}x · last {p.lastDate ? format(new Date(p.lastDate + "T12:00:00"), "MMM d") : "—"}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
