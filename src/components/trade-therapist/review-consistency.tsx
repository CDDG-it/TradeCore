"use client";

import Link from "next/link";
import { format } from "date-fns";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { AccentPanel } from "@/components/ui/accent-panel";
import { CountUp } from "@/components/ui/count-up";
import type { CSSProperties } from "react";

export type WeekCell = {
  ws: string;
  weekNum: number;
  rangeLabel: string;
  current: boolean;
  state: "done" | "missed" | "open";
};

const indexed = (i: number) => ({ "--i": i }) as CSSProperties;

/**
 * Reviews kept: how the review habit is holding, in one glance.
 *
 * Three readings, in the order they matter: the streak (the thing to protect),
 * the share of closed weeks written (the arc), and every tracked week as its
 * own cell, oldest first, so a missed one is a visible gap rather than a
 * number. The streak is underlined across the cells it is made of, so the
 * count and the strip are visibly the same fact.
 *
 * Motion: the two numbers run up, the arc draws, the cells rise in oldest
 * first, then the streak underline draws back from the newest week. All of it
 * is the widget taking its reading, once, on open. Nothing loops except a
 * slow breath on the week still trading.
 */
export function ReviewConsistency({
  cells, streak, done, closed, nextToWrite, className,
}: {
  /** Oldest first. */
  cells: WeekCell[];
  streak: number;
  done: number;
  closed: number;
  nextToWrite?: { ws: string; weekNum: number } | null;
  className?: string;
}) {
  const pct = closed ? Math.round((done / closed) * 100) : 0;
  const n = cells.length;

  // The cells the streak is made of: walk back from the newest, skip weeks
  // still trading and the just-closed week that is still yours to write, then
  // take the run of written ones.
  let end = n - 1;
  while (end >= 0 && cells[end].state === "open") end--;
  if (end >= 0 && cells[end].state === "missed") end--;
  let start = end;
  while (start >= 0 && cells[start].state === "done") start--;
  start++;
  const span = streak > 0 && end >= start ? { start, end } : null;
  const tone = streak > 0 ? "var(--primary)" : "var(--muted-foreground)";

  return (
    <AccentPanel accent="primary" eyebrow="Consistency" title="Reviews kept" className={className}>
      <div className="mt-3 flex items-center gap-4 sm:gap-5">
        {/* Share of closed weeks written, drawn as an arc. */}
        <div className="relative h-[72px] w-[72px] shrink-0" title={`${done} of ${closed} closed weeks written`}>
          <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="color-mix(in oklch, var(--foreground) 10%, transparent)" strokeWidth="3" />
            <circle
              cx="18" cy="18" r="15.5" fill="none" pathLength={100}
              className="arc-progress" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round"
              style={{ "--arc": pct } as CSSProperties}
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <span className="text-[13px] font-black tabular-nums leading-none text-foreground">
              <CountUp value={pct} />%
            </span>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-[40px] font-black leading-none tabular-nums" style={{ color: tone }}>
              <CountUp value={streak} />
            </span>
            <span className="text-xs text-muted-foreground">week{streak === 1 ? "" : "s"} in a row</span>
          </div>
          <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
            <span className="font-semibold text-foreground">{done}</span> of {closed} closed week{closed === 1 ? "" : "s"} written
            {nextToWrite && (
              <>
                {" · "}
                <Link href={`/trade-therapist/review/${nextToWrite.ws}`} className="inline-flex items-center gap-0.5 font-semibold text-warning hover:underline">
                  week {nextToWrite.weekNum} waiting <ArrowRight className="h-3 w-3" />
                </Link>
              </>
            )}
          </p>
        </div>
      </div>

      {/* One cell per week, oldest first. The streak underline sits beneath
          exactly the cells it counts. */}
      <div className="relative mt-4 pb-2" style={{ "--w": `calc((100% - ${(n - 1) * 3}px) / ${n})` } as CSSProperties}>
        <div className="flex items-end gap-[3px]">
          {cells.map((c, i) => (
            <Link
              key={c.ws}
              href={`/trade-therapist/review/${c.ws}`}
              title={
                `Week ${c.weekNum} · ${c.rangeLabel}: ` +
                (c.state === "open" ? "still trading: review opens Friday" : c.state === "done" ? "reviewed" : "not written")
              }
              style={indexed(i)}
              className={cn(
                "review-cell relative h-10 flex-1 rounded-[4px] border",
                c.state === "done" && "border-transparent bg-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_0_12px_color-mix(in_oklch,var(--primary)_35%,transparent)]",
                // A missed week still has to read as a week, not a gap.
                c.state === "missed" && "border-foreground/20 bg-foreground/[0.05]",
                c.state === "open" && "review-cell-open border-dashed border-primary/50 bg-primary/5"
              )}
            >
              <span className="sr-only">Week {c.weekNum}</span>
              {c.current && <span aria-hidden className="absolute left-1/2 top-1.5 h-1 w-1 -translate-x-1/2 rounded-full bg-primary" />}
            </Link>
          ))}
        </div>
        {span && (
          <span
            aria-hidden
            className="grow-x absolute bottom-0 h-[2px] rounded-full bg-primary"
            style={{
              left: `calc(${span.start} * (var(--w) + 3px))`,
              width: `calc(${span.end - span.start + 1} * var(--w) + ${(span.end - span.start) * 3}px)`,
            }}
          />
        )}
      </div>

      {/* The two end dates are the first thing to go when the row cannot
          hold the legend as well. */}
      <div className="mt-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[10px] text-muted-foreground/60">
        <span className="hidden sm:inline">{format(new Date(cells[0].ws + "T12:00:00"), "MMM d")}</span>
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-[2px] bg-primary" /> written</span>
          <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-[2px] border border-foreground/20 bg-foreground/[0.05]" /> missed</span>
          <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-[2px] border border-dashed border-primary/50" /> still trading</span>
        </span>
        <span className="hidden sm:inline">this week</span>
      </div>
    </AccentPanel>
  );
}
