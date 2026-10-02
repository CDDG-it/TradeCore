"use client";

import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { alpha, netRColor } from "@/lib/journal/colors";
import { formatR, EDGE_MIN_SAMPLE, type EdgeBucket } from "@/lib/journal/edge";
import type { Coverage } from "@/lib/journal/time-stats";
import { cn } from "@/lib/utils";

/** Plain-language definitions, shared by every tooltip on the page. */
export const GLOSSARY = {
  rPerTrade:
    "Average result per trade in R, where 1R is what you risk. A win counts its R:R, a loss −1R, a break-even 0. Above zero means this way of trading makes money over time.",
  vsAvg:
    "How much better or worse this is than your average trade in the current selection. Positive means it beats your baseline.",
  thin: `Fewer than ${EDGE_MIN_SAMPLE} trades. Too few to tell skill from luck, so it is shown greyed out and never used for conclusions.`,
  coverage:
    "Only trades with the needed times filled in can be placed here. The more trades you log with entry and exit times, the sharper this gets.",
  winRate: "Wins divided by wins plus losses. Break-evens are left out.",
  breakRate: "How often you broke this rule on trades where it applied.",
  cost: "Your average R when you keep the rule minus your average R when you break it. This is what one breach costs you.",
  totalCost: "Cost per breach multiplied by the number of times you broke it: what this rule has cost you in total.",
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

/** Column / stat label with its explanation attached. */
export function MetricLabel({ children, info, className }: { children: React.ReactNode; info?: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground", className)}>
      {children}
      {info && <MetricInfo>{info}</MetricInfo>}
    </span>
  );
}

/** Marks a too-small sample, so it never reads as a finding. */
export function ThinTag() {
  return (
    <Tooltip>
      <TooltipTrigger className="shrink-0 rounded border border-border/60 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/80">
        Thin
      </TooltipTrigger>
      <TooltipContent className="max-w-[240px] text-left leading-relaxed">{GLOSSARY.thin}</TooltipContent>
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

/** A section of the page: title, a fixed line on what it shows, and the computed takeaway. */
export function Section({
  title,
  explainer,
  takeaway,
  children,
}: {
  title: string;
  explainer: string;
  takeaway?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="max-w-3xl space-y-1.5">
        <h2 className="font-heading text-base font-bold tracking-tight">{title}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{explainer}</p>
      </div>
      {takeaway && (
        <div className="rounded-xl border border-primary/25 bg-primary/[0.06] px-4 py-3 text-sm leading-relaxed text-foreground/90">
          {takeaway}
        </div>
      )}
      {children}
    </section>
  );
}

/** A card inside a section, with a title, a one-line "how to read" and optional coverage. */
export function Panel({
  title,
  hint,
  coverage,
  className,
  children,
}: {
  title: string;
  hint?: string;
  coverage?: Coverage;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("rounded-2xl border border-border/50 bg-card p-4 sm:p-5", className)}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
        <div className="min-w-0 space-y-0.5">
          <h3 className="text-sm font-semibold">{title}</h3>
          {hint && <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p>}
        </div>
        {coverage && coverage.total > 0 && (
          <span className="inline-flex items-center gap-1 text-[11px] tabular-nums text-muted-foreground">
            {coverage.used} of {coverage.total} trades
            <MetricInfo>{GLOSSARY.coverage}</MetricInfo>
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

/** Shown in place of a chart that has nothing to work with yet. */
export function EmptyPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[120px] items-center justify-center rounded-xl border border-dashed border-border/60 px-4 text-center text-xs leading-relaxed text-muted-foreground">
      {children}
    </div>
  );
}

/**
 * Horizontal bars diverging from zero: green right, red left. Used for every
 * ordered breakdown (trade number, hold time, confluence stacking, weekday).
 */
export function BucketBars({ buckets, emptyLabel }: { buckets: EdgeBucket[]; emptyLabel?: string }) {
  const filled = buckets.filter((b) => b.trades > 0);
  if (filled.length === 0) return <EmptyPanel>{emptyLabel ?? "No trades in this selection."}</EmptyPanel>;

  const maxAbs = Math.max(0.01, ...filled.map((b) => Math.abs(b.expectancy)));
  const hasNeg = filled.some((b) => b.expectancy < 0);
  const hasPos = filled.some((b) => b.expectancy > 0);
  // Zero sits in the middle only when both signs are present.
  const zero = hasNeg && hasPos ? 50 : hasNeg ? 100 : 0;
  const span = hasNeg && hasPos ? 50 : 100;

  return (
    <div className="space-y-2.5">
      {buckets.map((b) => {
        const w = b.trades ? (Math.abs(b.expectancy) / maxAbs) * span : 0;
        const left = b.expectancy >= 0 ? zero : zero - w;
        return (
          <div key={b.key} className="grid grid-cols-[6.5rem_1fr_4.25rem] items-center gap-3 text-xs sm:grid-cols-[7.5rem_1fr_4.5rem_4.5rem]">
            <span className={cn("flex items-center gap-1.5 truncate font-medium", (b.thin || !b.trades) && "text-muted-foreground")}>
              <span className="truncate">{b.label}</span>
            </span>
            <div className="relative h-2.5 rounded-full bg-muted/30">
              {hasNeg && hasPos && <span className="absolute inset-y-[-3px] left-1/2 w-px bg-border" />}
              {b.trades > 0 && (
                <span
                  className="absolute inset-y-0 rounded-full"
                  style={{
                    left: `${left}%`,
                    width: `${Math.max(w, 1.5)}%`,
                    background: b.thin ? alpha("var(--muted-foreground)", 35) : netRColor(b.expectancy),
                  }}
                />
              )}
            </div>
            <span className="text-right">
              {b.trades ? <RValue r={b.expectancy} thin={b.thin} /> : <span className="text-muted-foreground/50">–</span>}
            </span>
            <span className="hidden items-center justify-end gap-1.5 text-right tabular-nums text-muted-foreground sm:flex">
              {b.thin && b.trades > 0 && <ThinTag />}
              {b.trades}
            </span>
          </div>
        );
      })}
      <div className="grid grid-cols-[6.5rem_1fr_4.25rem] gap-3 pt-1 text-[10px] uppercase tracking-wider text-muted-foreground/60 sm:grid-cols-[7.5rem_1fr_4.5rem_4.5rem]">
        <span />
        <span />
        <span className="text-right">R / trade</span>
        <span className="hidden text-right sm:block">Trades</span>
      </div>
    </div>
  );
}
