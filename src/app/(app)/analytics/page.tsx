"use client";

import { useEffect, useMemo, useState } from "react";
import { addMonths, format, parse } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
import { cn } from "@/lib/utils";

/*
 * Edge analytics: where the trader's results come from.
 *
 * The journal already shows the month's scoreboard (net R, win rate, trade
 * count, execution) next to the calendar. This page deliberately does not
 * repeat it. It answers the follow-up question: when, with which setups and
 * under which rules do you actually make money?
 */

/** "yyyy-MM" of a month, or "all" for the whole journal. */
type MonthKey = string;

const monthOf = (t: Pick<TradeJournalEntry, "date_time">) => t.date_time.slice(0, 7);
const monthDate = (m: MonthKey) => parse(m, "yyyy-MM", new Date());
const shiftMonth = (m: MonthKey, by: number) => format(addMonths(monthDate(m), by), "yyyy-MM");

/** Month stepper with an "All time" escape, sized for the page header. */
function MonthPicker({
  month,
  first,
  last,
  onChange,
}: {
  month: MonthKey;
  first: MonthKey;
  last: MonthKey;
  onChange: (m: MonthKey) => void;
}) {
  const all = month === "all";
  const stepBtn =
    "inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground disabled:pointer-events-none disabled:opacity-30";
  return (
    <div className="flex items-center gap-1.5">
      <div className={cn("flex items-center rounded-lg border border-border/50 p-0.5", all && "opacity-60")}>
        <button
          type="button"
          aria-label="Previous month"
          className={stepBtn}
          disabled={!all && month <= first}
          onClick={() => onChange(all ? last : shiftMonth(month, -1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="min-w-[4.75rem] text-center text-xs font-semibold tabular-nums sm:min-w-[7.5rem]">
          <span className="sm:hidden">{format(monthDate(all ? last : month), "MMM yy")}</span>
          <span className="hidden sm:inline">{format(monthDate(all ? last : month), "MMMM yyyy")}</span>
        </span>
        <button
          type="button"
          aria-label="Next month"
          className={stepBtn}
          disabled={!all && month >= last}
          onClick={() => onChange(all ? last : shiftMonth(month, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <button
        type="button"
        onClick={() => onChange(all ? last : "all")}
        className={cn(
          "h-8 rounded-lg border px-2.5 text-xs font-medium transition-colors",
          all ? "border-primary bg-primary text-primary-foreground" : "border-border/50 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        )}
      >
        All time
      </button>
    </div>
  );
}

function AnalyticsContent() {
  const [allTrades, setAllTrades] = useState<TradeJournalEntry[]>([]);
  const [ruleChecks, setRuleChecks] = useState<TradeRuleCheck[]>([]);
  const [loading, setLoading] = useState(true);
  // null until the trades are in; then the latest month with a trade.
  const [picked, setPicked] = useState<MonthKey | null>(null);
  useEffect(() => {
    Promise.all([getTrades(), getAllTradeRuleChecks()])
      .then(([t, checks]) => { setAllTrades(t); setRuleChecks(checks); })
      .finally(() => setLoading(false));
  }, []);

  // The span the stepper can move through: first traded month to this month.
  const bounds = useMemo(() => {
    const current = format(new Date(), "yyyy-MM");
    const months = allTrades.map(monthOf).sort();
    return {
      first: months[0] ?? current,
      last: current,
      latestTraded: months[months.length - 1] ?? current,
    };
  }, [allTrades]);

  const month = picked ?? bounds.latestTraded;

  const trades = useMemo(
    () => (month === "all" ? allTrades : allTrades.filter((t) => monthOf(t) === month)),
    [allTrades, month]
  );

  const stats = useMemo(() => {
    const baseline = scoreBucket("all", "All trades", trades);
    const hour = computeHourStats(trades);
    const grid = computeWeekdaySessionGrid(trades);
    const order = computeTradeOrderStats(trades);
    const hold = computeHoldTimeStats(trades);
    const confluences = computeConfluenceStats(trades);
    const stack = computeConfluenceStackStats(trades);
    const pairs = computeConfluencePairs(trades, undefined, 4);
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

  const periodLabel = month === "all" ? "All time" : format(monthDate(month), "MMMM yyyy");

  return (
    <TooltipProvider delay={120}>
      <div>
        <PageHeader
          title="Analytics"
          action={<MonthPicker month={month} first={bounds.first} last={bounds.last} onChange={setPicked} />}
        />
        <PageWrapper className="space-y-7">
          {/* Banner: the period and the yardstick every number below is read against */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-border/50 bg-card px-4 py-2.5 text-xs">
            <span className="font-semibold">{periodLabel}</span>
            <span className="tabular-nums text-muted-foreground">
              {baseline.trades} trade{baseline.trades === 1 ? "" : "s"}
            </span>
            {baseline.trades > 0 && (
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                Average trade <RValue r={baseline.expectancy} className="text-sm" />
                <MetricInfo>
                  {`${GLOSSARY.rPerTrade} This is your yardstick: a time, setup or rule above it is part of your edge, one below it costs you.`}
                </MetricInfo>
              </span>
            )}
            {baseline.trades > 0 && baseline.trades < 20 && (
              <span className="text-muted-foreground/70 sm:ml-auto">
                Small sample: groups under 5 trades show as Thin.{month !== "all" && " Try All time for stronger patterns."}
              </span>
            )}
          </div>

          {trades.length === 0 ? (
            <div className="rounded-2xl border border-border/50 bg-card px-6 py-12 text-center text-sm text-muted-foreground">
              No trades in {periodLabel}.
            </div>
          ) : (
            <>
              <KeyFindings findings={stats.findings} />

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
