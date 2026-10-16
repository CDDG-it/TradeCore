"use client";

import { useMemo, useState } from "react";
import { addMonths, format, parse } from "date-fns";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronLeft, ChevronRight, SlidersHorizontal, X } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CountUp } from "@/components/ui/count-up";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Empty, Switch } from "@/components/gmi/pane";
import { PRESS } from "@/components/trade-therapist/motion-button";
import { formatR, scoreBucket } from "@/lib/journal/edge";
import { BE_COLOR, LOSS_COLOR, WIN_COLOR, netRColor } from "@/lib/journal/colors";
import {
  computeEntryTimeStats, computeHoldTimeStats, computeTradeOrderStats, computeWeekdaySessionGrid, type SlotSize,
} from "@/lib/journal/time-stats";
import { computeConfluencePairs, computeConfluenceStackStats, computeConfluenceStats } from "@/lib/journal/confluence-stats";
import { computeCleanVsBroken, computeRuleStats, ruleVerdictsByTrade } from "@/lib/journal/rule-stats";
import {
  applyDrill, computeDirectionStats, computeEquityCurve, computeHeadline, computeInstrumentStats, computeQualityStats,
  drillChips, inPeriod, pickSetups, type Drill, type DrillKey, type Headline,
} from "@/lib/journal/analytics-filter";
import type { Session, TradeJournalEntry, TradeRuleCheck } from "@/lib/types";
import { cn } from "@/lib/utils";
import { EASE, GLOSSARY } from "./analytics-ui";
import { SetupHero } from "./setup-hero";
import { ComboPane } from "./combo-pane";
import { ContextStrip } from "./context-strip";
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
    // Setups are ranked without the confluence drill, so the hero stays put while you drill into it.
    const setups = pickSetups(confluences, pairs, scoreBucket("conf", "", forConf).expectancy);
    return {
      sel,
      baseline,
      headline: computeHeadline(sel),
      baseHeadline: computeHeadline(base),
      hour, grid, order, hold, confluences, pairs, stack, rules, clean, setups,
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

  const activeFilters = (drill.direction ? 1 : 0) + (drill.session ? 1 : 0);
  const pane = "h-[24rem] lg:h-auto";
  const full = "h-full w-full";
  const timing = (defaultView: "hour" | "day") => (
    <TimingPane
      index="0"
      defaultView={defaultView}
      className={full}
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
  );

  return (
    <TooltipProvider delay={120}>
      <div className="flex flex-col gap-3 lg:h-[calc(100dvh-7.25rem)] lg:min-h-[40rem] lg:overflow-hidden">
        {/* Title, the one-line summary, and the period / filter controls */}
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-4 gap-y-1">
            <h1 className="font-heading text-lg font-bold leading-none tracking-tight text-foreground md:text-xl">Analytics</h1>
            {base.length > 0 && (
              <>
                <Summary now={s.headline} base={s.baseHeadline} drilled={drilled} />
                <span aria-hidden className="hidden h-3 w-px self-center bg-border sm:block" />
                <Record now={s.headline} base={s.baseHeadline} drilled={drilled} />
              </>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <AnimatePresence initial={false}>
              {mode === "month" && <MonthStepper key="m" month={shownMonth} first={bounds.first} last={bounds.last} onChange={setMonth} />}
            </AnimatePresence>
            <Switch options={MODES} value={mode} onChange={setMode} />
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  "relative inline-flex h-7 items-center gap-1.5 rounded-lg bg-background/40 px-2.5 text-[11px] font-semibold uppercase tracking-wider transition-colors hover:text-foreground",
                  activeFilters ? "text-primary" : "text-foreground/70"
                )}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Filter
                {activeFilters > 0 && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] text-primary-foreground">{activeFilters}</span>
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Side</DropdownMenuLabel>
                  <DropdownMenuRadioGroup value={drill.direction ?? "all"} onValueChange={(v) => onDrill({ direction: v === "all" ? undefined : (v as Drill["direction"]) })}>
                    {SIDES.map((o) => <DropdownMenuRadioItem key={o.key} value={o.key}>{o.label}</DropdownMenuRadioItem>)}
                  </DropdownMenuRadioGroup>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Session</DropdownMenuLabel>
                  <DropdownMenuRadioGroup value={drill.session ?? "all"} onValueChange={(v) => onDrill({ session: v === "all" ? undefined : (v as Session) })}>
                    {SESSION_OPTS.map((o) => <DropdownMenuRadioItem key={o.key} value={o.key}>{o.key === "all" ? "All sessions" : o.key}</DropdownMenuRadioItem>)}
                  </DropdownMenuRadioGroup>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Active drill-down: only takes room when there is one */}
        <AnimatePresence initial={false}>
          {drilled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: EASE }}
              className="flex shrink-0 flex-wrap items-center gap-1.5 overflow-hidden"
            >
              <AnimatePresence initial={false} mode="popLayout">
                {chips.map((c) => (
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
                ))}
              </AnimatePresence>
              <span className="ml-auto flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="tabular-nums">{s.sel.length} of {base.length} trades</span>
                <button type="button" onClick={() => setDrill({})} className="font-semibold text-primary hover:underline">Reset</button>
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {base.length === 0 ? (
          <div className="flex min-h-[20rem] flex-1 items-center justify-center rounded-[22px] border border-white/[.07] bg-card/60">
            <Empty
              label="No trades in this period"
              hint={allTrades.length ? "Pick a wider period, or All, to see your patterns." : "Log trades in the journal and this desk fills itself."}
            />
          </div>
        ) : (
          <>
            <SetupHero best={s.setups.best} worst={s.setups.worst} candidates={s.setups.candidates} drill={drill} onDrill={onDrill} />
            <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-3">
              <ConfluencePane index="02" className={pane} confluences={s.confluences} pairs={s.pairs} drill={drill} onDrill={onDrill} />
              <RulePane index="03" className={pane} rules={s.rules} clean={s.clean} drill={drill} onDrill={onDrill} />
              <ComboPane index="04" className={pane} pairs={s.pairs} stack={s.stack} drill={drill} onDrill={onDrill} />
            </div>
            <ContextStrip
              hours={s.hour.buckets}
              grid={s.grid}
              quality={s.quality}
              direction={s.direction}
              instruments={s.instruments}
              curve={s.curve}
              panels={{
                hour: timing("hour"),
                day: timing("day"),
                execution: <ExecutionPane index="0" className={full} buckets={s.quality} drill={drill} onDrill={onDrill} />,
                direction: <DirectionPane index="0" className={full} buckets={s.direction} drill={drill} onDrill={onDrill} />,
                market: <InstrumentPane index="0" className={full} buckets={s.instruments} drill={drill} onDrill={onDrill} />,
                curve: <EquityPane index="0" className={full} points={s.curve} trades={s.sel} />,
              }}
            />
          </>
        )}
      </div>
    </TooltipProvider>
  );
}

/** The period in one line: trades, R per trade and net R; the rest of the scoreboard is in the hover. */
function Summary({ now, base, drilled }: { now: Headline; base: Headline; drilled: boolean }) {
  const delta = drilled ? now.expectancy - base.expectancy : null;
  return (
    <Tooltip>
      <TooltipTrigger className="flex cursor-help items-baseline gap-2 text-xs text-muted-foreground">
        <span className="tabular-nums"><CountUp value={now.trades} /> trades</span>
        <span aria-hidden className="text-muted-foreground/40">·</span>
        <span className="tabular-nums">
          <CountUp value={now.expectancy} format={(n) => formatR(n)} className="font-semibold" />
          <span className="sr-only"> per trade</span>
        </span>
        <span className="text-muted-foreground/70">avg</span>
        {delta !== null && Math.abs(delta) >= 0.01 && (
          <span className="text-[11px] tabular-nums" style={{ color: netRColor(delta) }}>({formatR(delta)} vs period)</span>
        )}
        <span aria-hidden className="text-muted-foreground/40">·</span>
        <span className="tabular-nums" style={{ color: netRColor(now.netR) }}>
          <CountUp value={now.netR} format={(n) => formatR(n, 1)} className="font-semibold" />
        </span>
        <span className="text-muted-foreground/70">net</span>
      </TooltipTrigger>
      <TooltipContent className="max-w-[260px] text-left leading-relaxed">
        <p>Profit factor {now.profitFactor === null ? "–" : now.profitFactor.toFixed(2)}</p>
        <p className="opacity-80">{GLOSSARY.rPerTrade}</p>
      </TooltipContent>
    </Tooltip>
  );
}

/** Wins, losses and break-evens as counts and as one split bar, with the win rate beside them. */
function Record({ now, base, drilled }: { now: Headline; base: Headline; drilled: boolean }) {
  const reduce = useReducedMotion();
  const parts = [
    { key: "W", n: now.wins, color: WIN_COLOR, label: "wins" },
    { key: "L", n: now.losses, color: LOSS_COLOR, label: "losses" },
    { key: "BE", n: now.breakEven, color: BE_COLOR, label: "break-even" },
  ];
  const total = Math.max(1, now.trades);
  const delta = drilled && now.winRate !== null && base.winRate !== null ? now.winRate - base.winRate : null;
  return (
    <Tooltip>
      <TooltipTrigger className="flex cursor-help items-center gap-2.5 text-xs text-muted-foreground">
        <span className="flex items-baseline gap-2 tabular-nums">
          {parts.map((p) => (
            <span key={p.key} className="flex items-baseline gap-0.5">
              <span className="text-[10px] font-semibold" style={{ color: p.color }}>{p.key}</span>
              <CountUp value={p.n} className="font-semibold text-foreground/90" />
            </span>
          ))}
        </span>
        <span className="flex h-1.5 w-14 overflow-hidden rounded-full bg-muted/30" aria-hidden>
          {parts.map((p) => (
            <motion.span
              key={p.key}
              className="h-full"
              style={{ background: p.color, opacity: 0.85 }}
              initial={reduce ? false : { width: 0 }}
              animate={{ width: `${(p.n / total) * 100}%` }}
              transition={{ duration: 0.6, ease: EASE }}
            />
          ))}
        </span>
        <span className="tabular-nums">
          {now.winRate === null ? (
            <span className="text-muted-foreground/60">–</span>
          ) : (
            <CountUp value={now.winRate} format={(n) => `${Math.round(n)}%`} className="font-semibold text-foreground/90" />
          )}{" "}
          <span className="text-muted-foreground/70">win</span>
        </span>
        {delta !== null && delta !== 0 && (
          <span className="text-[11px] tabular-nums" style={{ color: delta > 0 ? WIN_COLOR : LOSS_COLOR }}>
            ({delta > 0 ? "+" : "−"}{Math.abs(delta)} pts)
          </span>
        )}
      </TooltipTrigger>
      <TooltipContent className="max-w-[260px] text-left leading-relaxed">
        <p>{now.wins} wins · {now.losses} losses · {now.breakEven} break-even</p>
        <p className="opacity-80">{GLOSSARY.winRate}</p>
      </TooltipContent>
    </Tooltip>
  );
}
