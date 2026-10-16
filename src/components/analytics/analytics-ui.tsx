"use client";

import { Info } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { alpha, netRColor } from "@/lib/journal/colors";
import { formatR, EDGE_MIN_SAMPLE, type EdgeBucket } from "@/lib/journal/edge";
import { cn } from "@/lib/utils";

/** The app's strong ease-out. */
export const EASE = [0.23, 1, 0.32, 1] as const;

export const tradesLabel = (n: number) => `${n} trade${n === 1 ? "" : "s"}`;

/** Plain-language definitions, shared by every tooltip on the page. */
export const GLOSSARY = {
  rPerTrade:
    "Average result per trade in R, where 1R is what you risk. A win counts its R:R, a loss −1R, a break-even 0. Above zero means this way of trading makes money over time.",
  thin: `Fewer than ${EDGE_MIN_SAMPLE} trades. Too few to tell skill from luck, so it is shown greyed out and never used for conclusions.`,
  winRate: "Wins divided by wins plus losses. Break-evens are left out.",
  profitFactor: "R won on winners divided by R lost on losers. Above 1 makes money; 2 means every 1R lost brought 2R back.",
  breakRate: "How often you broke this rule on trades where it applied.",
  cost: "Your average R when you keep the rule minus your average R when you break it. This is what one breach costs you.",
  drill: "Click any bar, cell or row to narrow the whole desk to those trades. Click it again, or the chip, to undo.",
} as const;

/** A small (i) that explains a metric on hover or focus. */
export function MetricInfo({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger
        aria-label="What does this mean?"
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-full text-muted-foreground/60 transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none",
          className
        )}
      >
        <Info className="h-3.5 w-3.5" />
      </TooltipTrigger>
      <TooltipContent className="max-w-[260px] text-left leading-relaxed">{children}</TooltipContent>
    </Tooltip>
  );
}

/** R per trade, coloured by sign; greyed out when the sample is thin. */
export function RValue({ r, thin, className, digits }: { r: number; thin?: boolean; className?: string; digits?: number }) {
  return (
    <span
      className={cn("font-bold tabular-nums", thin && "text-muted-foreground", className)}
      style={thin ? undefined : { color: netRColor(r) }}
    >
      {formatR(r, digits)}
    </span>
  );
}

/** Shown in place of a chart that has nothing to work with yet. */
export function EmptyPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full min-h-[88px] items-center justify-center rounded-xl border border-dashed border-border/60 px-4 text-center text-xs leading-relaxed text-muted-foreground">
      {children}
    </div>
  );
}

/** What one bucket means, for a hover card. */
export function BucketTip({ title, b }: { title: string; b: EdgeBucket }) {
  return (
    <div className="space-y-0.5">
      <p className="font-semibold">{title}</p>
      {b.trades === 0 ? (
        <p className="opacity-80">No trades</p>
      ) : (
        <>
          <p>{formatR(b.expectancy)} per trade · {tradesLabel(b.trades)}</p>
          <p className="opacity-80">
            {b.winRate === null ? "No decisive trades" : `${b.winRate}% win rate`} · {formatR(b.totalR, 1)} total
          </p>
          {b.thin && <p className="opacity-80">Thin sample: not a conclusion yet</p>}
        </>
      )}
    </div>
  );
}

/** Dim the rest of a dimension once one of its segments is drilled into. */
export const segState = (selected: string | undefined, key: string) =>
  selected === undefined ? "idle" : selected === key ? "on" : "off";

/**
 * Horizontal bars diverging from zero: green right, red left, widths grow in.
 * Rows are buttons when `onSelect` is given: the drill-down for that bucket.
 */
export function EdgeBars({
  buckets,
  selected,
  onSelect,
  tipTitle = (b) => b.label,
  labelWidth = "6rem",
  emptyLabel,
}: {
  buckets: EdgeBucket[];
  selected?: string;
  onSelect?: (b: EdgeBucket) => void;
  tipTitle?: (b: EdgeBucket) => string;
  labelWidth?: string;
  emptyLabel?: string;
}) {
  const reduce = useReducedMotion();
  const filled = buckets.filter((b) => b.trades > 0);
  if (filled.length === 0) return <EmptyPanel>{emptyLabel ?? "No trades in this selection."}</EmptyPanel>;

  const maxAbs = Math.max(0.01, ...filled.map((b) => Math.abs(b.expectancy)));
  const hasNeg = filled.some((b) => b.expectancy < 0);
  const hasPos = filled.some((b) => b.expectancy > 0);
  const zero = hasNeg && hasPos ? 50 : hasNeg ? 100 : 0;
  const span = hasNeg && hasPos ? 50 : 100;

  return (
    <div className="space-y-0.5">
      {buckets.map((b, i) => {
        const w = b.trades ? Math.max((Math.abs(b.expectancy) / maxAbs) * span, 1.5) : 0;
        const left = b.expectancy >= 0 ? zero : zero - w;
        const state = segState(selected, b.key);
        return (
          <Tooltip key={b.key}>
            <TooltipTrigger
              disabled={!b.trades}
              onClick={onSelect && b.trades ? () => onSelect(b) : undefined}
              className={cn(
                "grid w-full items-center gap-2.5 rounded-md px-1.5 py-[5px] text-left text-xs transition-[background-color,opacity] duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary",
                onSelect && b.trades ? "cursor-pointer hover:bg-muted/40 active:scale-[.99]" : "cursor-default",
                state === "on" && "bg-primary/10 ring-1 ring-primary/50",
                state === "off" && "opacity-45"
              )}
              style={{ gridTemplateColumns: `${labelWidth} minmax(0,1fr) 3.75rem 1.75rem` }}
            >
              <span className={cn("truncate font-medium", (b.thin || !b.trades) && "text-muted-foreground")}>{b.label}</span>
              <span className="relative h-2 rounded-full bg-muted/30">
                {hasNeg && hasPos && <span className="absolute inset-y-[-3px] left-1/2 w-px bg-border" />}
                {b.trades > 0 && (
                  <motion.span
                    className="absolute inset-y-0 rounded-full"
                    initial={reduce ? false : { width: 0, left: `${zero}%` }}
                    animate={{ width: `${w}%`, left: `${left}%` }}
                    transition={{ duration: 0.55, delay: reduce ? 0 : i * 0.025, ease: EASE }}
                    style={{ background: b.thin ? alpha("var(--muted-foreground)", 35) : netRColor(b.expectancy) }}
                  />
                )}
              </span>
              <span className="text-right">
                {b.trades ? <RValue r={b.expectancy} thin={b.thin} /> : <span className="text-muted-foreground/50">–</span>}
              </span>
              <span className="text-right text-[10px] tabular-nums text-muted-foreground/70">{b.trades || ""}</span>
            </TooltipTrigger>
            <TooltipContent className="text-left">
              <BucketTip title={tipTitle(b)} b={b} />
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
