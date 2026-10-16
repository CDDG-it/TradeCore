"use client";

import { motion, useReducedMotion } from "motion/react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CountUp } from "@/components/ui/count-up";
import { Pane } from "@/components/gmi/pane";
import { formatR, type EdgeBucket } from "@/lib/journal/edge";
import { alpha, netRColor } from "@/lib/journal/colors";
import type { Drill } from "@/lib/journal/analytics-filter";
import { cn } from "@/lib/utils";
import { BucketTip, EASE, EdgeBars, segState } from "./analytics-ui";

const QUALITY_COLOR: Record<string, string> = {
  good: "var(--win)",
  bad: "var(--loss)",
  unrated: "var(--muted-foreground)",
};

/**
 * A share bar plus one row per bucket: used for execution quality and
 * direction, the two splits small enough to read at a glance.
 */
function SplitTiles({
  buckets, colorOf, selected, onSelect, title,
}: {
  buckets: EdgeBucket[];
  colorOf: (b: EdgeBucket) => string;
  selected?: string;
  onSelect: (b: EdgeBucket) => void;
  title: (b: EdgeBucket) => string;
}) {
  const reduce = useReducedMotion();
  const total = buckets.reduce((s, b) => s + b.trades, 0) || 1;
  return (
    <div className="flex h-full flex-col gap-2.5">
      <div className="flex h-2 shrink-0 overflow-hidden rounded-full bg-muted/30">
        {buckets.map((b) => (
          <motion.span
            key={b.key}
            className="h-full"
            style={{ background: colorOf(b), opacity: segState(selected, b.key) === "off" ? 0.3 : 0.85 }}
            initial={reduce ? false : { width: 0 }}
            animate={{ width: `${(b.trades / total) * 100}%` }}
            transition={{ duration: 0.6, ease: EASE }}
          />
        ))}
      </div>
      <div className="flex min-h-0 flex-1 flex-col justify-center gap-1.5">
        {buckets.map((b) => {
          const state = segState(selected, b.key);
          return (
            <Tooltip key={b.key}>
              <TooltipTrigger
                disabled={!b.trades}
                onClick={() => onSelect(b)}
                className={cn(
                  "flex min-w-0 items-center gap-2 rounded-xl border border-border/40 bg-muted/15 px-2.5 py-2 text-left transition-[background-color,border-color,opacity,transform] duration-200 hover:border-primary/40 active:scale-[.98] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50",
                  state === "on" && "border-primary bg-primary/10",
                  state === "off" && "opacity-45"
                )}
              >
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: colorOf(b) }} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold">{b.label}</span>
                  <span className="block text-[10px] tabular-nums text-muted-foreground">
                    {b.trades} · {b.winRate === null ? "–" : `${b.winRate}% win`}
                  </span>
                </span>
                <span
                  className={cn("shrink-0 text-sm font-black tabular-nums", b.thin && "text-muted-foreground")}
                  style={b.trades && !b.thin ? { color: netRColor(b.expectancy) } : undefined}
                >
                  {b.trades ? <CountUp value={b.expectancy} format={(n) => formatR(n)} /> : "–"}
                </span>
              </TooltipTrigger>
              <TooltipContent className="text-left">
                <BucketTip title={title(b)} b={b} />
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}

export function ExecutionPane({
  index, className, buckets, drill, onDrill,
}: {
  index: string;
  className?: string;
  buckets: EdgeBucket[];
  drill: Drill;
  onDrill: (d: Partial<Drill>) => void;
}) {
  const good = buckets.find((b) => b.key === "good");
  const bad = buckets.find((b) => b.key === "bad");
  const gap = good && bad && !good.thin && !bad.thin ? good.expectancy - bad.expectancy : null;
  return (
    <Pane index={index} label="Execution" className={className} bodyClassName="flex flex-col p-3">
      <p className="mb-2 shrink-0 truncate text-[11px] text-muted-foreground">
        {gap !== null ? <>Clean execution is worth <b style={{ color: netRColor(gap) }}>{formatR(gap)}</b> a trade</> : "Your own execution rating against result"}
      </p>
      <div className="min-h-0 flex-1">
        <SplitTiles
          buckets={buckets}
          colorOf={(b) => QUALITY_COLOR[b.key]}
          selected={drill.quality}
          onSelect={(b) => onDrill({ quality: drill.quality === b.key ? undefined : (b.key as Drill["quality"]) })}
          title={(b) => (b.key === "unrated" ? "No execution rating" : `${b.label} execution`)}
        />
      </div>
    </Pane>
  );
}

export function DirectionPane({
  index, className, buckets, drill, onDrill,
}: {
  index: string;
  className?: string;
  buckets: EdgeBucket[];
  drill: Drill;
  onDrill: (d: Partial<Drill>) => void;
}) {
  const [long, short] = buckets;
  const lean = long.trades + short.trades ? Math.round((long.trades / (long.trades + short.trades)) * 100) : null;
  return (
    <Pane index={index} label="Direction" className={className} bodyClassName="flex flex-col p-3">
      <p className="mb-2 shrink-0 truncate text-[11px] text-muted-foreground">
        {lean === null ? "No trades" : `${lean}% long · ${100 - lean}% short`}
      </p>
      <div className="min-h-0 flex-1">
        <SplitTiles
          buckets={buckets}
          colorOf={(b) => (b.key === "long" ? "var(--primary)" : "var(--ice)")}
          selected={drill.direction}
          onSelect={(b) => onDrill({ direction: drill.direction === b.key ? undefined : (b.key as Drill["direction"]) })}
          title={(b) => `${b.label} trades`}
        />
      </div>
    </Pane>
  );
}

export function InstrumentPane({
  index, className, buckets, drill, onDrill,
}: {
  index: string;
  className?: string;
  buckets: EdgeBucket[];
  drill: Drill;
  onDrill: (d: Partial<Drill>) => void;
}) {
  return (
    <Pane index={index} label="Markets" className={className} bodyClassName="flex flex-col p-3">
      <p className="mb-1.5 shrink-0 truncate text-[11px] text-muted-foreground">
        R per trade by market, most traded first · <span style={{ color: alpha("var(--foreground)", 70) }}>{buckets.length} markets</span>
      </p>
      <div className="min-h-0 flex-1 overflow-y-auto pr-0.5">
        <EdgeBars
          buckets={buckets}
          labelWidth="5.5rem"
          selected={drill.instrument}
          onSelect={(b) => onDrill({ instrument: drill.instrument === b.key ? undefined : b.key })}
        />
      </div>
    </Pane>
  );
}
