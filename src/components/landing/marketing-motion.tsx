"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";
import { motion, useInView, useReducedMotion, type Transition } from "motion/react";
import { MindscoreTrend } from "@/components/mind-score/mindscore-trend";
import { BrainScore } from "@/components/mind-score/brain-score";

/**
 * Shared motion vocabulary for the public page. Every reveal on the page uses
 * the same strong ease-out curve (mirrors --ease-out-strong in globals.css) so
 * the sections read as one system. Reveals animate opacity and the full
 * transform string only: both composite on the GPU, and Motion's x/y
 * shorthands would fall back to the main thread.
 */
export const EASE_OUT = [0.23, 1, 0.32, 1] as const;
export const EASE_IN_OUT = [0.77, 0, 0.175, 1] as const;

const viewport = { once: true, amount: 0.25, margin: "0px 0px -8% 0px" } as const;

function revealTransition(delay: number, duration = 0.6): Transition {
  return { duration, delay, ease: EASE_OUT };
}

/** One-time presentation motion for read-only marketing compositions. */
export function MarketingReveal({ children, className, delay = 0, distance = 24, style }: {
  children: ReactNode;
  className?: string;
  delay?: number;
  /** Travel distance in px. Dropped entirely under reduced motion. */
  distance?: number;
  style?: CSSProperties;
}) {
  const reduceMotion = useReducedMotion();
  const from = reduceMotion ? "translateY(0px)" : `translateY(${distance}px)`;

  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0, transform: from }}
      whileInView={{ opacity: 1, transform: "translateY(0px)" }}
      viewport={viewport}
      transition={revealTransition(delay)}
    >
      {children}
    </motion.div>
  );
}

/** A hairline that draws itself along one axis. Explains a connection between two things. */
export function DrawLine({ axis = "x", className, style, delay = 0, duration = 0.7 }: {
  axis?: "x" | "y";
  className?: string;
  style?: CSSProperties;
  delay?: number;
  duration?: number;
}) {
  const reduceMotion = useReducedMotion();
  const collapsed = axis === "x" ? "scaleX(0)" : "scaleY(0)";
  const full = axis === "x" ? "scaleX(1)" : "scaleY(1)";

  return (
    <motion.span
      aria-hidden="true"
      className={className}
      style={{ transformOrigin: axis === "x" ? "left center" : "center top", ...style }}
      initial={{ opacity: reduceMotion ? 0 : 1, transform: reduceMotion ? full : collapsed }}
      whileInView={{ opacity: 1, transform: full }}
      viewport={viewport}
      transition={revealTransition(delay, duration)}
    />
  );
}

/** A bar or fill that grows from its baseline. Used for illustrative charts only. */
export function GrowBar({ axis = "y", className, style, delay = 0, duration = 0.7 }: {
  axis?: "x" | "y";
  className?: string;
  style?: CSSProperties;
  delay?: number;
  duration?: number;
}) {
  const reduceMotion = useReducedMotion();
  const collapsed = axis === "x" ? "scaleX(0.12)" : "scaleY(0.12)";
  const full = axis === "x" ? "scaleX(1)" : "scaleY(1)";

  return (
    <motion.span
      aria-hidden="true"
      className={className}
      style={{ transformOrigin: axis === "x" ? "left center" : "center bottom", ...style }}
      initial={{ opacity: 0, transform: reduceMotion ? full : collapsed }}
      whileInView={{ opacity: 1, transform: full }}
      viewport={viewport}
      transition={revealTransition(delay, duration)}
    />
  );
}

/** An SVG path that draws itself from start to end. Explains a sequence in time (a session's price path). */
export function DrawPath({ d, className, delay = 0, duration = 1.4, stroke, strokeWidth = 2 }: {
  d: string;
  className?: string;
  delay?: number;
  duration?: number;
  stroke: string;
  strokeWidth?: number;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.path
      d={d}
      className={className}
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ opacity: reduceMotion ? 0 : 1, pathLength: reduceMotion ? 1 : 0 }}
      whileInView={{ opacity: 1, pathLength: 1 }}
      viewport={viewport}
      transition={{ duration, delay, ease: EASE_OUT }}
    />
  );
}

/** A marker that pins itself onto a point: scales in from its anchor, never from nothing. */
export function PinReveal({ children, className, style, delay = 0, origin = "center bottom" }: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  delay?: number;
  origin?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      style={{ transformOrigin: origin, ...style }}
      initial={{ opacity: 0, transform: reduceMotion ? "scale(1)" : "scale(0.9)" }}
      whileInView={{ opacity: 1, transform: "scale(1)" }}
      viewport={viewport}
      transition={revealTransition(delay, 0.45)}
    >
      {children}
    </motion.div>
  );
}

/**
 * Text that writes itself in, left to right. Progress is linear; nothing eases
 * while you type. The clip lives on an inner box: an element clipped to nothing
 * never intersects the viewport, so the unclipped wrapper is what gets observed.
 */
export function WriteIn({ children, className, delay = 0, duration = 1.1 }: {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
}) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const hidden = reduceMotion ? { opacity: 0, clipPath: "inset(0 0% 0 0)" } : { opacity: 1, clipPath: "inset(0 100% 0 0)" };

  return (
    <span ref={ref} className={className}>
      <motion.span
        className="inline-block"
        initial={hidden}
        animate={inView ? { opacity: 1, clipPath: "inset(0 0% 0 0)" } : hidden}
        transition={{ duration, delay, ease: "linear" }}
      >
        {children}
      </motion.span>
    </span>
  );
}

/** Chapter index, heading and standfirst. Shared by every section between the hero and the close. */
export function SectionHeader({ index, label, title, children, align = "split", className, id }: {
  index?: string;
  label: string;
  title: ReactNode;
  children?: ReactNode;
  /** `split` puts the standfirst in a right column on large screens; `stack` keeps it under the heading. */
  align?: "split" | "stack";
  className?: string;
  id?: string;
}) {
  const split = align === "split" && children;
  return (
    <div className={`${split ? "grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.52fr)] lg:items-end lg:gap-20" : ""} ${className ?? ""}`}>
      <MarketingReveal>
        <p className="marketing-eyebrow">{index && <span className="tabular-nums">{index}</span>}{label}</p>
        <h2 id={id} className="font-display mt-6 max-w-[860px] text-balance text-[clamp(2.6rem,4.8vw,5.4rem)] font-semibold leading-[1.02] tracking-[-0.055em]">{title}</h2>
      </MarketingReveal>
      {children && (
        <MarketingReveal delay={0.1} className={split ? "lg:pb-2" : "mt-7"}>
          <p className="max-w-[520px] text-lg leading-[1.65] text-[#4d6871]">{children}</p>
        </MarketingReveal>
      )}
    </div>
  );
}

const scoreParts = [
  { name: "Rule adherence", weight: 35, color: "#174657", note: "Did the session follow the written plan?" },
  { name: "Execution", weight: 20, color: "#0d817c", note: "Entries, exits and risk as planned." },
  { name: "Habit consistency", weight: 20, color: "#14b8a6", note: "The routines kept on and off the charts." },
  { name: "Reflection work", weight: 15, color: "#06b6d4", note: "Prepared before, examined after." },
  { name: "Goal progress", weight: 10, color: "#91dfd5", note: "Movement toward the active goal." },
] as const;

export function MindscoreAssembly() {
  const illustrativeTrend = [52, 57, 54, 62, 61, 66, 64, 70, 68, 74].map((value, index) => ({
    date: `2026-09-${String(index + 1).padStart(2, "0")}`,
    value,
  }));

  return (
    <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:gap-14" aria-label="MC Mindscore weighting: rule adherence 35 percent, execution 20 percent, habit consistency 20 percent, reflection work 15 percent, goal progress 10 percent">
      <MarketingReveal className="relative flex min-h-[420px] flex-col justify-between overflow-hidden rounded-[32px] border border-[#c2dcda] bg-[#edf7f5] p-7 shadow-[0_28px_75px_rgba(27,88,92,.10)] sm:min-h-[500px] sm:p-10 lg:p-12">
        <div className="flex items-start justify-between gap-4 border-b border-[#c2dcda] pb-5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#54737b]">MC Mindscore</span>
          <span className="rounded-full border border-[#a8cfcb] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#167c79]">Illustrative data</span>
        </div>
        <div className="my-7 flex items-center gap-4 sm:gap-6">
          <BrainScore score={74} className="size-[120px] sm:size-[150px]" />
          <div><span className="font-display text-[clamp(4rem,10vw,7rem)] font-semibold leading-[0.85] tracking-[-0.09em] tabular-nums text-[#102b37]">74</span><span className="mt-2 block text-sm font-semibold text-[#167c79]">Solid</span></div>
        </div>
        <div>
          <div className="mb-3 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.12em] text-[#54737b]"><span>Score over time</span><span>Example period</span></div>
          <MindscoreTrend points={illustrativeTrend} color="#0d817c" light />
          <p className="mt-5 text-xs leading-relaxed text-[#5b7780]">One score shaped by the work behind every session. The curve above is illustrative.</p>
        </div>
      </MarketingReveal>

      <div className="min-w-0">
        <MarketingReveal delay={0.05}><p className="font-display text-2xl font-semibold tracking-[-0.04em] text-[#102b37] sm:text-3xl">Five measurable parts.</p></MarketingReveal>
        <dl className="mt-6 border-t border-[#bdd7d4]">
          {scoreParts.map((part, index) => (
            <MarketingReveal key={part.name} delay={0.1 + index * 0.07} distance={16} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 gap-y-3 border-b border-[#bdd7d4] py-5">
              <dt className="flex min-w-0 items-start gap-4">
                <span aria-hidden="true" className="mt-1.5 h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: part.color }} />
                <span className="min-w-0"><span className="block text-sm font-semibold text-[#102b37] sm:text-base">{part.name}</span><span className="mt-0.5 block text-xs leading-relaxed text-[#67838a] sm:text-sm">{part.note}</span></span>
              </dt>
              <dd className="font-display text-2xl font-semibold tabular-nums tracking-[-0.05em] text-[#102b37] sm:text-3xl">{part.weight}%</dd>
              <dd aria-hidden="true" className="col-span-2 h-1 overflow-hidden rounded-full bg-[#d7e8e7]">
                <GrowBar axis="x" delay={0.25 + index * 0.07} className="block h-full rounded-full" style={{ width: `${part.weight}%`, backgroundColor: part.color }} />
              </dd>
            </MarketingReveal>
          ))}
        </dl>
        <MarketingReveal delay={0.4} distance={12}><p className="mt-6 max-w-xl text-sm leading-relaxed text-[#526e75]">No active goal? Its weight is shared across the other logged work.</p></MarketingReveal>
      </div>
    </div>
  );
}
