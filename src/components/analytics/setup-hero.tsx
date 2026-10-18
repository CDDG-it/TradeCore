"use client";

import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, TrendingDown, TrendingUp } from "lucide-react";
import { CountUp } from "@/components/ui/count-up";
import { PRESS } from "@/components/trade-therapist/motion-button";
import { formatR } from "@/lib/journal/edge";
import { LOSS_COLOR, WIN_COLOR, alpha } from "@/lib/journal/colors";
import { sameKeys, type Drill, type Setup } from "@/lib/journal/analytics-filter";
import { cn } from "@/lib/utils";
import { EASE, tradesLabel } from "./analytics-ui";

function SetupCard({
  tone, setup, index, drill, onDrill, hasCandidates,
}: {
  tone: "good" | "bad";
  hasCandidates: boolean;
  setup: Setup | null;
  index: number;
  drill: Drill;
  onDrill: (d: Partial<Drill>) => void;
}) {
  const reduce = useReducedMotion();
  const color = tone === "good" ? WIN_COLOR : LOSS_COLOR;
  const Icon = tone === "good" ? TrendingUp : TrendingDown;
  const eyebrow = tone === "good" ? "Pays the most" : "Costs the most";
  const on = !!setup && sameKeys(drill.confluence, setup.keys);

  const body = setup ? (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <Icon className="h-3.5 w-3.5" style={{ color }} />
          {eyebrow}
          <span className="font-medium normal-case tracking-normal text-muted-foreground/60">· {setup.kind === "pair" ? "combination" : "confluence"}</span>
        </p>
        <span className={cn("inline-flex items-center gap-1 text-[11px] font-medium transition-colors", on ? "text-primary" : "text-muted-foreground/60 group-hover:text-primary")}>
          {on ? "Showing these trades" : "See trades"}
          <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5" />
        </span>
      </div>
      <div className="mt-2 flex items-end justify-between gap-4">
        <p className="line-clamp-2 min-w-0 font-heading text-xl font-bold leading-tight tracking-tight md:text-2xl" title={setup.label}>{setup.label}</p>
        <p className="shrink-0 text-3xl font-black leading-none tabular-nums md:text-4xl" style={{ color }}>
          <CountUp value={setup.expectancy} format={(n) => formatR(n)} />
        </p>
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">
        per trade over {tradesLabel(setup.trades)}
        {setup.winRate !== null && ` · ${setup.winRate}% win rate`} · {formatR(setup.totalR, 1)} in total
      </p>
    </>
  ) : (
    <div className="flex h-full flex-col justify-center">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5 opacity-50" />
        {eyebrow}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        {!hasCandidates
          ? "No confluence or pair has 5+ trades in this selection yet."
          : tone === "good"
            ? "No setup with 5+ trades makes money yet."
            : "Nothing costs you yet: every setup with 5+ trades beats your average."}
      </p>
    </div>
  );

  return (
    <motion.button
      type="button"
      disabled={!setup}
      onClick={() => setup && onDrill({ confluence: on ? undefined : setup.keys })}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: reduce ? 0 : index * 0.06, ease: EASE }}
      whileHover={setup && !reduce ? { y: -2 } : undefined}
      whileTap={setup ? { scale: 0.99, transition: PRESS } : undefined}
      className={cn(
        "group relative min-w-0 overflow-hidden rounded-[22px] border px-5 py-4 text-left shadow-[0_18px_48px_-30px_rgba(0,0,0,.9)] transition-[border-color] duration-300 disabled:cursor-default",
        on ? "border-primary/60" : "border-white/[.07] hover:border-white/[.14]"
      )}
      style={{
        backgroundImage: setup
          ? `radial-gradient(120% 140% at 0% 0%, ${alpha(color, 12)}, transparent 55%), linear-gradient(145deg, var(--card), color-mix(in oklch, var(--card) 88%, var(--background)))`
          : "linear-gradient(145deg, var(--card), color-mix(in oklch, var(--card) 88%, var(--background)))",
      }}
    >
      {body}
    </motion.button>
  );
}

/** The two answers the page leads with: the setup to repeat and the one to drop. */
export function SetupHero({
  best, worst, candidates, drill, onDrill,
}: {
  best: Setup | null;
  worst: Setup | null;
  candidates: number;
  drill: Drill;
  onDrill: (d: Partial<Drill>) => void;
}) {
  return (
    <div className="grid shrink-0 gap-3 md:grid-cols-2">
      <SetupCard tone="good" setup={best} index={0} drill={drill} onDrill={onDrill} hasCandidates={candidates > 0} />
      <SetupCard tone="bad" setup={worst} index={1} drill={drill} onDrill={onDrill} hasCandidates={candidates > 0} />
    </div>
  );
}
