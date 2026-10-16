"use client";

import { useMemo, useState } from "react";
import { addMonths, format, parse } from "date-fns";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, MousePointerClick, X } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Empty, Switch } from "@/components/gmi/pane";
import { PRESS } from "@/components/trade-therapist/motion-button";
import { scoreBucket } from "@/lib/journal/edge";
import {
  computeEntryTimeStats, computeHoldTimeStats, computeTradeOrderStats, computeWeekdaySessionGrid, type SlotSize,
} from "@/lib/journal/time-stats";
import { computeConfluencePairs, computeConfluenceStackStats, computeConfluenceStats } from "@/lib/journal/confluence-stats";
import { computeCleanVsBroken, computeRuleStats, ruleVerdictsByTrade } from "@/lib/journal/rule-stats";
import { buildFindings } from "@/lib/journal/analytics-findings";
import {
  applyDrill, computeDirectionStats, computeEquityCurve, computeHeadline, computeInstrumentStats, computeQualityStats,
  drillChips, inPeriod, type Drill, type DrillKey,
} from "@/lib/journal/analytics-filter";
import type { Session, TradeJournalEntry, TradeRuleCheck } from "@/lib/types";
import { cn } from "@/lib/utils";
import { EASE, GLOSSARY, MetricInfo } from "./analytics-ui";
import { KpiStrip } from "./kpi-strip";
import { TimingPane } from "./timing-pane";
import { ConfluencePane } from "./confluence-pane";
import { RulePane } from "./rule-pane";
import { DirectionPane, ExecutionPane, InstrumentPane } from "./breakdown-panes";
import { EquityPane } from "./equity-pane";

/*
 * Edge analytics as one screen: where the trader's results come from.
 *
 * A period sets the baseline; clicking any segment (an hour, a heatmap cell, a
 * confluence, a rule verdict, a market, ...) adds a drill-down that narrows the
 * whole desk. Each pane ignores its own dimension of the drill-down, so the
 * clicked segment stays visible, highlighted among its siblings, while every
 * other pane shows what that slice of trading looks like.
 */

type Mode = "month" | "30d" | "90d" | "all";

const MODES: { key: Mode; label: string }[] = [
  { key: "month", label: "Month" },
  { key: "30d", label: "30D" },
  { key: "90d", label: "90D" },
  { key: "all", label: "All" },
];
const SIDES: { key: "all" | "long" | "short"; label: string }[] = [
  { key: "all", label: "Both" },
  { key: "long", label: "Long" },
  { key: "short", label: "Short" },
];
const SESSION_OPTS: { key: "all" | Session; label: string }[] = [
  { key: "all", label: "All" },
  { key: "Asia", label: "Asia" },
  { key: "London", label: "LDN" },
  { key: "New York", label: "NY" },
];

const monthDate = (m: string) => parse(m, "yyyy-MM", new Date());

function MonthStepper({ month, first, last, onChange }: { month: string; first: string; last: string; onChange: (m: string) => void }) {
  const btn = "inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground disabled:pointer-events-none disabled:opacity-30";
  return (
    <motion.div
      initial={{ opacity: 0, width: 0 }}
      animate={{ opacity: 1, width: "auto" }}
      exit={{ opacity: 0, width: 0 }}
      transition={{ duration: 0.22, ease: EASE }}
      className="flex items-center overflow-hidden rounded-lg bg-background/40 p-0.5"
    >
      <motion.button whileTap={{ scale: 0.9, transition: PRESS }} type="button" aria-label="Previous month" className={btn} disabled={month <= first} onClick={() => onChange(format(addMonths(monthDate(month), -1), "yyyy-MM"))}>
        <ChevronLeft className="h-3.5 w-3.5" />
      </motion.button>
      <span className="min-w-[5.5rem] whitespace-nowrap text-center text-[11px] font-semibold uppercase tracking-wider tabular-nums">
        {format(monthDate(month), "MMM yyyy")}
      </span>
      <motion.button whileTap={{ scale: 0.9, transition: PRESS }} type="button" aria-label="Next month" className={btn} disabled={month >= last} onClick={() => onChange(format(addMonths(monthDate(month), 1), "yyyy-MM"))}>
        <ChevronRight className="h-3.5 w-3.5" />
      </motion.button>
    </motion.div>
  );
}

/** The drill-down without one key, so a pane can show its own siblings. */
const without = (drill: Drill, ...keys: DrillKey[]): Drill => {
  const next = { ...drill };
  for (const k of keys) delete next[k];
  return next;
};

export function AnalyticsDesk({ trades: allTrades, ruleChecks, today = new Date() }: { trades: TradeJournalEntry[]; ruleChecks: TradeRuleCheck[]; today?: Date }) {
  const todayKey = format(today, "yyyy-MM-dd");
  const bounds = useMemo(() => {
    const months = allTrades.map((t) => t.date_time.slice(0, 7)).sort();
    const current = todayKey.slice(0, 7);
    return { first: months[0] ?? current, last: current, latest: months[months.length - 1] ?? current };
  }, [allTrades, todayKey]);

  const [mode, setMode] = useState<Mode>("90d");
  const [month, setMonth] = useState<string | null>(null);
  const [drill, setDrill] = useState<Drill>({});
  const [slot, setSlot] = useState<SlotSize>(30);

  const shownMonth = month ?? bounds.latest;
  const period = mode === "month" ? shownMonth : mode;

  const verdicts = useMemo(() => ruleVerdictsByTrade(allTrades, ruleChecks), [allTrades, ruleChecks]);
  const base = useMemo(() => inPeriod(allTrades, period, todayKey), [allTrades, period, todayKey]);

  const s = useMemo(() => {
    const f = (d: Drill) => applyDrill(base, d, verdicts);
    const sel = f(drill);
    const forTime = f(without(drill, "hourSlot"));
    const forGrid = f(without(drill, "weekday", "session"));
    const forConf = f(without(drill, "confluence"));
    const forRule = f(without(drill, "rule"));

    const baseline = scoreBucket("all", "All trades", sel);
    const hour = computeEntryTimeStats(forTime, slot);
    const grid = computeWeekdaySessionGrid(forGrid);
    const order = computeTradeOrderStats(sel);
    const hold = computeHoldTimeStats(sel);
    const confluences = computeConfluenceStats(forConf);
    const pairs = computeConfluencePairs(forConf, 3, 60);
    const stack = computeConfluenceStackStats(sel);
    const rules = computeRuleStats(forRule, ruleChecks);
    const clean = computeCleanVsBroken(sel, ruleChecks);
    // Findings read the selection itself, so they always describe what is on screen.
    const findings = buildFindings({
      baseline,
      hours: computeEntryTimeStats(sel, slot).buckets,
      grid: computeWeekdaySessionGrid(sel),
      order,
      confluences: computeConfluenceStats(sel),
      rules: computeRuleStats(sel, ruleChecks),
      clean,
    });
    return {
      sel,
      baseline,
      headline: computeHeadline(sel),
      baseHeadline: computeHeadline(base),
      hour, grid, order, hold, confluences, pairs, stack, rules, clean, findings,
      quality: computeQualityStats(f(without(drill, "quality"))),
      direction: computeDirectionStats(f(without(drill, "direction"))),
      instruments: computeInstrumentStats(f(without(drill, "instrument"))),
      curve: computeEquityCurve(sel),
    };
  }, [base, drill, verdicts, ruleChecks, slot]);

  const confluenceName = useMemo(() => {
    const names = new Map<string, string>();
    for (const t of base) for (const c of t.confluences ?? []) {
      const k = (c ?? "").trim().toLowerCase();
      if (k && !names.has(k)) names.set(k, c.trim());
    }
    return (k: string) => names.get(k) ?? k;
  }, [base]);

  const chips = drillChips(drill, confluenceName);
  const drilled = chips.length > 0;
  const onDrill = (d: Partial<Drill>) => setDrill((prev) => {
    const next = { ...prev, ...d };
    for (const k of Object.keys(next) as DrillKey[]) if (next[k] === undefined) delete next[k];
    return next;
  });

  const paneH = "h-[22rem] lg:h-auto";

  return (
    <TooltipProvider delay={120}>
      <div className="flex flex-col gap-3 lg:h-[calc(100dvh-7.25rem)] lg:min-h-[40rem] lg:overflow-hidden">
        {/* Title and the period / side / session filters */}
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div className="flex items-baseline gap-3">
            <h1 className="font-heading text-lg font-bold leading-none tracking-tight text-foreground md:text-xl">Analytics</h1>
            <span className="text-[11px] tabular-nums text-muted-foreground">{base.length} trades in period</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <AnimatePresence initial={false}>
              {mode === "month" && <MonthStepper key="m" month={shownMonth} first={bounds.first} last={bounds.last} onChange={setMonth} />}
            </AnimatePresence>
            <Switch options={MODES} value={mode} onChange={setMode} />
            <Switch options={SIDES} value={drill.direction ?? "all"} onChange={(k) => onDrill({ direction: k === "all" ? undefined : k })} />
            <Switch options={SESSION_OPTS} value={drill.session ?? "all"} onChange={(k) => onDrill({ session: k === "all" ? undefined : k })} />
          </div>
        </div>

        {/* Active drill-down */}
        <div className="flex min-h-7 shrink-0 flex-wrap items-center gap-1.5">
          <AnimatePresence initial={false} mode="popLayout">
            {drilled ? (
              chips.map((c) => (
                <motion.button
                  key={c.key}
                  layout
                  type="button"
                  onClick={() => onDrill({ [c.key]: undefined })}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileTap={{ scale: 0.94, transition: PRESS }}
                  transition={{ duration: 0.18, ease: EASE }}
                  className="group inline-flex h-7 items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 pl-3 pr-2 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/20"
                >
                  {c.label}
                  <X className="h-3 w-3 opacity-70 transition-opacity group-hover:opacity-100" />
                </motion.button>
              ))
            ) : (
              <motion.span
                key="hint"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground"
              >
                <MousePointerClick className="h-3.5 w-3.5 text-primary" />
                Click any bar, cell or row to drill down
                <MetricInfo>{GLOSSARY.drill}</MetricInfo>
              </motion.span>
            )}
          </AnimatePresence>
          {drilled && (
            <motion.span layout className="ml-auto flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="tabular-nums">{s.sel.length} of {base.length} trades</span>
              <button type="button" onClick={() => setDrill({})} className="font-semibold text-primary hover:underline">Reset</button>
            </motion.span>
          )}
        </div>

        {base.length === 0 ? (
          <div className="flex min-h-[20rem] flex-1 items-center justify-center rounded-[22px] border border-white/[.07] bg-card/60">
            <Empty
              label="No trades in this period"
              hint={allTrades.length ? "Pick a wider period, or All, to see your patterns." : "Log trades in the journal and this desk fills itself."}
            />
          </div>
        ) : (
          <>
            <KpiStrip now={s.headline} base={s.baseHeadline} findings={s.findings} drilled={drilled} />
            <div className="grid min-h-0 flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-12 lg:grid-rows-[minmax(0,1.3fr)_minmax(0,1fr)]">
              <TimingPane
                index="01"
                className={cn(paneH, "sm:col-span-2 lg:col-span-5")}
                hours={s.hour.buckets}
                hourCoverage={s.hour.coverage}
                slot={slot}
                onSlot={(n) => { setSlot(n); onDrill({ hourSlot: undefined }); }}
                grid={s.grid}
                order={s.order}
                hold={s.hold.buckets}
                holdCoverage={s.hold.coverage}
                baseline={s.baseline.expectancy}
                drill={drill}
                onDrill={onDrill}
              />
              <ConfluencePane
                index="02"
                className={cn(paneH, "lg:col-span-4")}
                confluences={s.confluences}
                pairs={s.pairs}
                stack={s.stack}
                drill={drill}
                onDrill={onDrill}
              />
              <RulePane index="03" className={cn(paneH, "lg:col-span-3")} rules={s.rules} clean={s.clean} drill={drill} onDrill={onDrill} />
              <ExecutionPane index="04" className={cn("h-[13rem] lg:h-auto", "lg:col-span-2")} buckets={s.quality} drill={drill} onDrill={onDrill} />
              <DirectionPane index="05" className={cn("h-[13rem] lg:h-auto", "lg:col-span-2")} buckets={s.direction} drill={drill} onDrill={onDrill} />
              <InstrumentPane index="06" className={cn("h-[16rem] lg:h-auto", "lg:col-span-3")} buckets={s.instruments} drill={drill} onDrill={onDrill} />
              <EquityPane index="07" className={cn(paneH, "sm:col-span-2 lg:col-span-5")} points={s.curve} trades={s.sel} />
            </div>
          </>
        )}
      </div>
    </TooltipProvider>
  );
}
