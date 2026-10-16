"use client";

import { useState } from "react";
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
export const segState = (selected: string | string[] | undefined, key: string) =>
  selected === undefined ? "idle" : (Array.isArray(selected) ? selected.includes(key) : selected === key) ? "on" : "off";

/**
 * Ranked rows, one number each: label (with its trade count in small grey),
 * a bar diverging from zero, and R per trade. Everything else lives in the
 * hover. Rows are buttons when `onSelect` is given: the drill-down for that
 * bucket. `collapseThin` tucks samples under 5 trades behind a toggle, so the
 * list leads with what is actually evidence.
 */
export function EdgeBars({
  buckets,
  selected,
  onSelect,
  tipTitle = (b) => b.label,
  tip,
  labelWidth = "minmax(0,9rem)",
  emptyLabel,
  collapseThin = false,
  metric = (b) => b.expectancy,
  formatValue = (n) => formatR(n),
}: {
  buckets: EdgeBucket[];
  /** One key, or several (both halves of a drilled pair). */
  selected?: string | string[];
  onSelect?: (b: EdgeBucket) => void;
  tipTitle?: (b: EdgeBucket) => string;
  /** Replaces the default hover card. */
  tip?: (b: EdgeBucket) => React.ReactNode;
  labelWidth?: string;
  emptyLabel?: string;
  collapseThin?: boolean;
  /** The one number a row shows; R per trade unless a pane scores something else. */
  metric?: (b: EdgeBucket) => number;
  formatValue?: (n: number) => string;
}) {
  const reduce = useReducedMotion();
  const [showThin, setShowThin] = useState(false);
  const filled = buckets.filter((b) => b.trades > 0);
  if (filled.length === 0) return <EmptyPanel>{emptyLabel ?? "No trades in this selection."}</EmptyPanel>;

  const thinRows = collapseThin ? buckets.filter((b) => b.thin && b.trades > 0) : [];
  const rows = collapseThin && !showThin ? buckets.filter((b) => !b.thin || segState(selected, b.key) === "on") : buckets;
  if (collapseThin && rows.length === 0 && !showThin) {
    return (
      <EmptyPanel>
        <span>
          Nothing with 5+ trades yet.{" "}
          <button type="button" onClick={() => setShowThin(true)} className="font-semibold text-primary hover:underline">
            Show {thinRows.length} early read{thinRows.length === 1 ? "" : "s"}
          </button>
        </span>
      </EmptyPanel>
    );
  }

  const values = rows.filter((b) => b.trades > 0).map(metric);
  const maxAbs = Math.max(0.01, ...values.map(Math.abs));
  const hasNeg = values.some((v) => v < 0);
  const hasPos = values.some((v) => v > 0);
  const zero = hasNeg && hasPos ? 50 : hasNeg ? 100 : 0;
  const span = hasNeg && hasPos ? 50 : 100;
  const hiddenThin = thinRows.filter((b) => !rows.includes(b)).length;

  return (
    <div className="space-y-px">
      {rows.map((b, i) => {
        const v = metric(b);
        const w = b.trades ? Math.max((Math.abs(v) / maxAbs) * span, 1.5) : 0;
        const left = v >= 0 ? zero : zero - w;
        const state = segState(selected, b.key);
        const muted = b.thin || !b.trades;
        return (
          <Tooltip key={b.key}>
            <TooltipTrigger
              disabled={!b.trades}
              onClick={onSelect && b.trades ? () => onSelect(b) : undefined}
              className={cn(
                "grid w-full items-center gap-3 rounded-lg px-2 py-[7px] text-left text-[13px] transition-[background-color,opacity] duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary",
                onSelect && b.trades ? "cursor-pointer hover:bg-muted/35 active:scale-[.99]" : "cursor-default",
                state === "on" && "bg-primary/10 ring-1 ring-primary/50",
                state === "off" && "opacity-45"
              )}
              style={{ gridTemplateColumns: `${labelWidth} minmax(0,1fr) 3.75rem` }}
            >
              <span className={cn("flex min-w-0 items-baseline gap-1.5", muted && "text-muted-foreground")}>
                <span className="truncate">{b.label}</span>
                {b.trades > 0 && <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground/60">{b.trades}</span>}
              </span>
              <span className="relative h-1.5 rounded-full bg-muted/25">
                {hasNeg && hasPos && <span className="absolute inset-y-[-3px] left-1/2 w-px bg-border/70" />}
                {b.trades > 0 && (
                  <motion.span
                    className="absolute inset-y-0 rounded-full"
                    initial={reduce ? false : { width: 0, left: `${zero}%` }}
                    animate={{ width: `${w}%`, left: `${left}%` }}
                    transition={{ duration: 0.55, delay: reduce ? 0 : i * 0.025, ease: EASE }}
                    style={{ background: b.thin ? alpha("var(--muted-foreground)", 35) : alpha(netRColor(v), 80) }}
                  />
                )}
              </span>
              <span className="text-right">
                {b.trades ? (
                  <span className={cn("font-semibold tabular-nums", muted && "text-muted-foreground")} style={muted ? undefined : { color: netRColor(v) }}>
                    {formatValue(v)}
                  </span>
                ) : (
                  <span className="text-muted-foreground/50">–</span>
                )}
              </span>
            </TooltipTrigger>
            <TooltipContent className="max-w-[280px] text-left">
              {tip ? tip(b) : <BucketTip title={tipTitle(b)} b={b} />}
            </TooltipContent>
          </Tooltip>
        );
      })}
      {collapseThin && (hiddenThin > 0 || showThin) && thinRows.length > 0 && (
        <button
          type="button"
          onClick={() => setShowThin((x) => !x)}
          className="px-2 pt-1.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
        >
          {showThin ? "Hide early reads" : `+${hiddenThin} with too few trades`}
        </button>
      )}
    </div>
  );
}
