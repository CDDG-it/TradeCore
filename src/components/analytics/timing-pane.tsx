"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, Tooltip as ChartTooltip, XAxis, YAxis } from "recharts";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Pane, Switch } from "@/components/gmi/pane";
import { alpha, netRColor } from "@/lib/journal/colors";
import { extremes, formatR, type EdgeBucket } from "@/lib/journal/edge";
import { SESSIONS, WEEKDAYS, slotStart, type Coverage, type SlotSize, type WeekdaySessionGrid } from "@/lib/journal/time-stats";
import type { Drill } from "@/lib/journal/analytics-filter";
import type { Session } from "@/lib/types";
import { cn } from "@/lib/utils";
import { BucketTip, EASE, EdgeBars, EmptyPanel, RValue, tradesLabel } from "./analytics-ui";

type View = "hour" | "day" | "order" | "hold";

const VIEWS: { key: View; label: string }[] = [
  { key: "hour", label: "Hour" },
  { key: "day", label: "Day" },
  { key: "order", label: "Trade #" },
  { key: "hold", label: "Hold" },
];

const SLOTS: { key: `${SlotSize}`; label: string }[] = [
  { key: "15", label: "15m" },
  { key: "30", label: "30m" },
  { key: "60", label: "1h" },
];

// ── Entry time ──────────────────────────────────────────────────────────

interface Row extends EdgeBucket {
  start: string;
  r: number | null;
}

function SlotTip({ active, payload }: { active?: boolean; payload?: Array<{ payload: Row }> }) {
  if (!active || !payload?.length) return null;
  const b = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg">
      <BucketTip title={b.label} b={b} />
      {b.trades > 0 && <p className="mt-1 text-[10px] text-primary">Click to drill down</p>}
    </div>
  );
}

function HourChart({
  buckets, coverage, slot, baseline, drill, onDrill,
}: {
  buckets: EdgeBucket[];
  coverage: Coverage;
  slot: SlotSize;
  baseline: number;
  drill: Drill;
  onDrill: (d: Partial<Drill>) => void;
}) {
  if (buckets.length === 0) return <EmptyPanel>Log entry times on your trades to see which hours pay.</EmptyPanel>;
  const rows: Row[] = buckets.map((b) => ({ ...b, start: slotStart(b.key), r: b.trades ? b.expectancy : null }));
  const sel = drill.hourSlot && drill.hourSlot.size === slot ? String(drill.hourSlot.start) : undefined;
  const { best, worst } = extremes(buckets);
  // About ten labels across the axis, whatever the slot size.
  const every = Math.max(1, Math.ceil(rows.length / 10));

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-[150px] flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 6, right: 2, bottom: 0, left: -14 }} barCategoryGap="16%">
            <XAxis
              dataKey="start"
              axisLine={false}
              tickLine={false}
              interval={0}
              tick={({ x, y, index }: { x: number | string; y: number | string; index: number }) =>
                index % every === 0 ? (
                  <text x={x} y={Number(y) + 10} textAnchor="middle" fontSize={10} fill="var(--color-muted-foreground)">
                    {rows[index]?.start}
                  </text>
                ) : <g />
              }
            />
            <YAxis axisLine={false} tickLine={false} width={40} tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} tickFormatter={(v: number) => `${v > 0 ? "+" : ""}${v}R`} />
            <ChartTooltip content={<SlotTip />} cursor={{ fill: "var(--color-muted)", opacity: 0.3 }} />
            <ReferenceLine y={0} stroke="var(--color-muted-foreground)" strokeOpacity={0.45} />
            {baseline !== 0 && <ReferenceLine y={baseline} stroke="var(--color-primary)" strokeDasharray="4 4" strokeOpacity={0.75} />}
            <Bar dataKey="r" maxBarSize={28} radius={[3, 3, 3, 3]} animationDuration={600} animationEasing="ease-out">
              {rows.map((b) => {
                const on = sel === b.key;
                return (
                  <Cell
                    key={b.key}
                    cursor={b.trades ? "pointer" : "default"}
                    onClick={() => b.trades && onDrill({ hourSlot: on ? undefined : { start: Number(b.key), size: slot } })}
                    fill={b.thin ? "var(--color-muted-foreground)" : (b.r ?? 0) >= 0 ? "var(--win)" : "var(--loss)"}
                    fillOpacity={sel && !on ? 0.25 : b.thin ? 0.3 : 0.9}
                    stroke={on ? "var(--color-primary)" : undefined}
                    strokeWidth={on ? 2 : 0}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
        {best && <span>Best <b className="text-foreground">{best.label}</b> <RValue r={best.expectancy} /></span>}
        {worst && worst.expectancy < 0 && <span>Worst <b className="text-foreground">{worst.label}</b> <RValue r={worst.expectancy} /></span>}
        {!best && <span>No window has 5+ trades yet: try a wider slot or All time.</span>}
        <span className="ml-auto tabular-nums text-muted-foreground/70">{coverage.used}/{coverage.total} timed</span>
      </div>
    </div>
  );
}

// ── Weekday x session ───────────────────────────────────────────────────

function HeatCell({
  b, title, maxAbs, state, emphasis, onClick,
}: {
  b: EdgeBucket;
  title: string;
  maxAbs: number;
  state: "idle" | "on" | "off";
  emphasis?: boolean;
  onClick: () => void;
}) {
  const strength = b.trades && !b.thin ? 14 + (Math.abs(b.expectancy) / maxAbs) * 46 : 0;
  return (
    <Tooltip>
      <TooltipTrigger
        disabled={!b.trades}
        onClick={b.trades ? onClick : undefined}
        className={cn(
          "flex min-h-[34px] w-full flex-col items-center justify-center rounded-md border px-1 py-1 text-center transition-[transform,opacity,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary",
          b.trades ? "cursor-pointer hover:scale-[1.04] active:scale-95" : "border-dashed",
          "border-border/40",
          b.thin && b.trades > 0 && "bg-muted/20",
          emphasis && "bg-muted/25",
          state === "on" && "ring-2 ring-primary",
          state === "off" && "opacity-40"
        )}
        style={strength ? { background: alpha(netRColor(b.expectancy), strength) } : undefined}
      >
        {b.trades === 0 ? (
          <span className="text-xs text-muted-foreground/40">–</span>
        ) : (
          <>
            <span className={cn("text-[11px] font-bold leading-tight tabular-nums", b.thin ? "text-muted-foreground" : "text-foreground")}>
              {formatR(b.expectancy)}
            </span>
            <span className="text-[9px] leading-none tabular-nums text-muted-foreground">{b.trades}</span>
          </>
        )}
      </TooltipTrigger>
      <TooltipContent className="text-left">
        <BucketTip title={title} b={b} />
      </TooltipContent>
    </Tooltip>
  );
}

function Heatmap({ grid, drill, onDrill }: { grid: WeekdaySessionGrid; drill: Drill; onDrill: (d: Partial<Drill>) => void }) {
  const all = WEEKDAYS.flatMap((d) => SESSIONS.map((s) => grid.cells[d.key][s]));
  const maxAbs = Math.max(0.01, ...all.filter((b) => !b.thin).map((b) => Math.abs(b.expectancy)));
  const totalMax = Math.max(0.01, ...[...grid.byWeekday, ...grid.bySession].filter((b) => !b.thin).map((b) => Math.abs(b.expectancy)));
  const anyDrill = !!(drill.weekday || drill.session);

  const cellState = (day?: string, session?: Session) => {
    if (!anyDrill) return "idle" as const;
    const dayOk = !drill.weekday || !day || drill.weekday === day;
    const sesOk = !drill.session || !session || drill.session === session;
    return dayOk && sesOk ? ("on" as const) : ("off" as const);
  };
  const exact = (day?: string, session?: Session) => drill.weekday === day && drill.session === session;

  return (
    <div className="flex h-full flex-col justify-center">
      <div className="grid grid-cols-[2.25rem_repeat(3,minmax(0,1fr))_minmax(0,1fr)] gap-1">
        <span />
        {SESSIONS.map((s) => (
          <span key={s} className="truncate text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {s === "New York" ? "NY" : s}
          </span>
        ))}
        <span className="text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Day</span>
        {WEEKDAYS.map((d, i) => (
          <div key={d.key} className="contents">
            <span className="flex items-center text-xs font-medium text-muted-foreground">{d.label}</span>
            {SESSIONS.map((s) => (
              <HeatCell
                key={s}
                b={grid.cells[d.key][s]}
                title={`${d.long} · ${s}`}
                maxAbs={maxAbs}
                state={cellState(d.key, s)}
                onClick={() => onDrill(exact(d.key, s) ? { weekday: undefined, session: undefined } : { weekday: d.key, session: s })}
              />
            ))}
            <HeatCell
              b={grid.byWeekday[i]}
              title={`All ${d.long}s`}
              maxAbs={totalMax}
              emphasis
              state={cellState(d.key, drill.session)}
              onClick={() => onDrill(exact(d.key, undefined) ? { weekday: undefined } : { weekday: d.key, session: undefined })}
            />
          </div>
        ))}
        <span className="flex items-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">All</span>
        {grid.bySession.map((b) => (
          <HeatCell
            key={b.key}
            b={b}
            title={`Every ${b.label} session`}
            maxAbs={totalMax}
            emphasis
            state={cellState(drill.weekday, b.key as Session)}
            onClick={() => onDrill(exact(undefined, b.key as Session) ? { session: undefined } : { session: b.key as Session, weekday: undefined })}
          />
        ))}
        <span />
      </div>
      {grid.weekendTrades > 0 && <p className="mt-2 text-[10px] text-muted-foreground/70">{tradesLabel(grid.weekendTrades)} on weekends left out.</p>}
    </div>
  );
}

// ── Pane ────────────────────────────────────────────────────────────────

export function TimingPane({
  index, className, hours, hourCoverage, slot, onSlot, grid, order, hold, holdCoverage, baseline, drill, onDrill,
}: {
  index: string;
  className?: string;
  hours: EdgeBucket[];
  hourCoverage: Coverage;
  slot: SlotSize;
  onSlot: (s: SlotSize) => void;
  grid: WeekdaySessionGrid;
  order: EdgeBucket[];
  hold: EdgeBucket[];
  holdCoverage: Coverage;
  baseline: number;
  drill: Drill;
  onDrill: (d: Partial<Drill>) => void;
}) {
  const [view, setView] = useState<View>("hour");
  return (
    <Pane
      index={index}
      label="When you trade best"
      className={className}
      bodyClassName="flex flex-col p-3"
      right={<Switch options={VIEWS} value={view} onChange={setView} />}
    >
      <div className="mb-2 flex shrink-0 items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <span>
          {view === "hour" && "R per trade by entry time · dashed line is your average"}
          {view === "day" && "R per trade by weekday and session · click a cell, row or column"}
          {view === "order" && "Does the first trade of the day beat the rest?"}
          {view === "hold" && `Entry to exit against result · ${holdCoverage.used}/${holdCoverage.total} with both times`}
        </span>
        {view === "hour" && <Switch options={SLOTS} value={`${slot}`} onChange={(k) => onSlot(Number(k) as SlotSize)} />}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={view}
          className="min-h-0 flex-1"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2, ease: EASE }}
        >
          {view === "hour" && <HourChart buckets={hours} coverage={hourCoverage} slot={slot} baseline={baseline} drill={drill} onDrill={onDrill} />}
          {view === "day" && <Heatmap grid={grid} drill={drill} onDrill={onDrill} />}
          {view === "order" && <div className="flex h-full flex-col justify-center"><EdgeBars buckets={order} /></div>}
          {view === "hold" && (
            <div className="flex h-full flex-col justify-center">
              <EdgeBars buckets={hold} emptyLabel="Log entry and exit times to see how hold time relates to your results." />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </Pane>
  );
}
