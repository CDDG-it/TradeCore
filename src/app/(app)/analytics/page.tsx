"use client";

import { useEffect, useMemo, useState } from "react";
import { format, subDays, subMonths } from "date-fns";
import { PageHeader } from "@/components/ui/page-header";
import { PageWrapper } from "@/components/ui/page-wrapper";
import { TooltipProvider } from "@/components/ui/tooltip";
import { FeatureGate } from "@/components/access/access-provider";
import { GLOSSARY, MetricInfo, RValue } from "@/components/analytics/analytics-ui";
import { KeyFindings } from "@/components/analytics/key-findings";
import { TimingSection } from "@/components/analytics/timing-section";
import { ConfluenceSection } from "@/components/analytics/confluence-section";
import { RuleSection } from "@/components/analytics/rule-section";
import { getAllTradeRuleChecks, getTrades } from "@/lib/supabase/queries";
import type { TradeJournalEntry, TradeRuleCheck } from "@/lib/types";
import { scoreBucket } from "@/lib/journal/edge";
import {
  computeHourStats, computeWeekdaySessionGrid, computeTradeOrderStats, computeHoldTimeStats,
} from "@/lib/journal/time-stats";
import {
  computeConfluenceStats, computeConfluenceStackStats, computeConfluencePairs,
} from "@/lib/journal/confluence-stats";
import { computeRuleStats, computeCleanVsBroken } from "@/lib/journal/rule-stats";
import { buildFindings } from "@/lib/journal/analytics-findings";
import { instrumentName } from "@/lib/journal/weeks";
import { cn } from "@/lib/utils";

/*
 * Edge analytics: where the trader's results come from.
 *
 * The journal already shows the month's scoreboard (net R, win rate, trade
 * count, execution) next to the calendar. This page deliberately does not
 * repeat it. It answers the follow-up question: when, with which setups and
 * under which rules do you actually make money?
 */

type Range = "all" | "12m" | "90d" | "30d";
type DirectionFilter = "all" | "long" | "short";

const RANGES: { id: Range; label: string }[] = [
  { id: "all", label: "All time" },
  { id: "12m", label: "12 months" },
  { id: "90d", label: "90 days" },
  { id: "30d", label: "30 days" },
];

function rangeStart(range: Range): string | null {
  const now = new Date();
  if (range === "12m") return format(subMonths(now, 12), "yyyy-MM-dd");
  if (range === "90d") return format(subDays(now, 90), "yyyy-MM-dd");
  if (range === "30d") return format(subDays(now, 30), "yyyy-MM-dd");
  return null;
}

/** Segmented control, matching the rest of the app's filters. */
function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { id: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex max-w-full overflow-x-auto rounded-lg border border-border/50">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={cn(
            "shrink-0 px-2.5 py-1.5 text-xs font-medium transition-colors",
            value === o.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function AnalyticsContent() {
  const [allTrades, setAllTrades] = useState<TradeJournalEntry[]>([]);
  const [ruleChecks, setRuleChecks] = useState<TradeRuleCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<Range>("all");
  const [instrument, setInstrument] = useState<string>("all");
  const [direction, setDirection] = useState<DirectionFilter>("all");

  useEffect(() => {
    Promise.all([getTrades(), getAllTradeRuleChecks()])
      .then(([t, checks]) => { setAllTrades(t); setRuleChecks(checks); })
      .finally(() => setLoading(false));
  }, []);

  // Instruments by how often they are traded, grouped by display name so a
  // micro and its full-size contract read as one market.
  const instruments = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of allTrades) {
      const name = instrumentName(t.instrument);
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([name]) => name);
  }, [allTrades]);

  const trades = useMemo(() => {
    const from = rangeStart(range);
    return allTrades.filter(
      (t) =>
        (!from || t.date_time.slice(0, 10) >= from) &&
        (instrument === "all" || instrumentName(t.instrument) === instrument) &&
        (direction === "all" || t.direction === direction)
    );
  }, [allTrades, range, instrument, direction]);

  const stats = useMemo(() => {
    const baseline = scoreBucket("all", "All trades", trades);
    const hour = computeHourStats(trades);
    const grid = computeWeekdaySessionGrid(trades);
    const order = computeTradeOrderStats(trades);
    const hold = computeHoldTimeStats(trades);
    const confluences = computeConfluenceStats(trades);
    const stack = computeConfluenceStackStats(trades);
    const pairs = computeConfluencePairs(trades);
    const rules = computeRuleStats(trades, ruleChecks);
    const clean = computeCleanVsBroken(trades, ruleChecks);
    const findings = buildFindings({ baseline, hours: hour.buckets, grid, order, confluences, rules, clean });
    return { baseline, hour, grid, order, hold, confluences, stack, pairs, rules, clean, findings };
  }, [trades, ruleChecks]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const { baseline } = stats;

  return (
    <TooltipProvider delay={120}>
      <div className="space-y-8">
        <PageHeader title="Analytics" />
        <PageWrapper className="space-y-10">
          {/* Intro + filters */}
          <div className="space-y-4">
            <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
              Where your results come from: the times, setups and rules that make you money, and the ones that cost you.
              Your scoreboard (net R, win rate, trade count) lives next to the calendar in the journal.
            </p>
            <div className="flex flex-wrap gap-2">
              <Segmented value={range} options={RANGES} onChange={setRange} />
              {instruments.length > 1 && (
                <Segmented
                  value={instrument}
                  options={[{ id: "all", label: "All markets" }, ...instruments.map((n) => ({ id: n, label: n }))]}
                  onChange={setInstrument}
                />
              )}
              <Segmented
                value={direction}
                options={[
                  { id: "all", label: "Both directions" },
                  { id: "long", label: "Long" },
                  { id: "short", label: "Short" },
                ]}
                onChange={setDirection}
              />
            </div>
          </div>

          {trades.length === 0 ? (
            <div className="rounded-2xl border border-border/50 bg-card px-6 py-16 text-center text-sm text-muted-foreground">
              No trades in this selection yet.
            </div>
          ) : (
            <>
              {/* Baseline: the yardstick every number below is read against */}
              <div className="flex flex-col gap-3 rounded-2xl border border-border/50 bg-card px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-baseline gap-3">
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Your average trade
                    <MetricInfo>{GLOSSARY.rPerTrade}</MetricInfo>
                  </span>
                  <RValue r={baseline.expectancy} className="text-2xl font-black" />
                </div>
                <p className="max-w-xl text-xs leading-relaxed text-muted-foreground sm:text-right">
                  Over {baseline.trades} trade{baseline.trades === 1 ? "" : "s"} in this selection. This is your yardstick: a time,
                  setup or rule that beats it is part of your edge, one below it is costing you.
                  {baseline.trades < 20 && " With this few trades most groups are still marked Thin."}
                </p>
              </div>

              <section className="space-y-3">
                <h2 className="font-heading text-base font-bold tracking-tight">Key findings</h2>
                <KeyFindings findings={stats.findings} />
              </section>

              <TimingSection
                baseline={baseline}
                hours={stats.hour.buckets}
                hourCoverage={stats.hour.coverage}
                grid={stats.grid}
                order={stats.order}
                hold={stats.hold.buckets}
                holdCoverage={stats.hold.coverage}
              />

              <ConfluenceSection
                baseline={baseline}
                confluences={stats.confluences}
                stack={stats.stack}
                pairs={stats.pairs}
              />

              <RuleSection rules={stats.rules} clean={stats.clean} />
            </>
          )}
        </PageWrapper>
      </div>
    </TooltipProvider>
  );
}

export default function AnalyticsPage() {
  return <FeatureGate feature="advancedAnalytics"><AnalyticsContent /></FeatureGate>;
}
