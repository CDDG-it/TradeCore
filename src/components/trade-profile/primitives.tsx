"use client";

import { useId, type ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { EASE_OUT, SPRING } from "@/lib/motion";
import { CountUp } from "@/components/ui/count-up";
import { thresholds } from "@/lib/trade-profile/config";
import type { DomainCode, Difficulty } from "@/lib/trade-profile/types";
import { referenceById, sourceUrl, type Reference, type RefStatus } from "@/lib/trade-profile/content/references";
import { copy } from "@/lib/trade-profile/content/copy";

/** Domain hues from globals.css (--trait-*): distinct, non-semantic, no orange. */
export const traitColor: Record<DomainCode, string> = {
  N: "var(--trait-n)",
  E: "var(--trait-e)",
  O: "var(--trait-o)",
  A: "var(--trait-a)",
  C: "var(--trait-c)",
};

/**
 * A small section label. Sentence case and normal tracking on purpose: an
 * uppercase eyebrow above every block is the template look this page avoids.
 */
export function Eyebrow({ children, tone = "muted", className }: { children: ReactNode; tone?: "muted" | "primary" | "ice"; className?: string }) {
  return (
    <p
      className={cn(
        "text-xs font-semibold",
        tone === "muted" && "text-muted-foreground",
        tone === "primary" && "text-primary",
        tone === "ice" && "text-ice",
        className,
      )}
    >
      {children}
    </p>
  );
}

/** Inner tile, the same surface the Therapist uses inside its panels. */
export function Tile({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-xl border border-border/50 bg-background/30 p-3 sm:p-4", className)}>{children}</div>;
}

/**
 * Horizontal POMP bar with the low/high threshold ticks. The fill grows in
 * from the left when it appears and glides to a new value: a full-width bar
 * slid inside a clipped track, so it never touches layout and keeps its
 * rounded end at any length.
 */
export function ScaleBar({ value, color = "var(--primary)", size = "md", delay = 0.1 }: { value: number; color?: string; size?: "sm" | "md"; delay?: number }) {
  const share = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("relative w-full rounded-full bg-muted/60", size === "md" ? "h-2" : "h-1.5")}>
      <span className="absolute inset-0 overflow-hidden rounded-full">
        <motion.span
          className="absolute inset-0 rounded-full"
          style={{ background: color }}
          initial={{ transform: "translateX(-100%)" }}
          animate={{ transform: `translateX(${share - 100}%)` }}
          transition={{ duration: 0.8, delay, ease: EASE_OUT }}
        />
      </span>
      {[thresholds.low, thresholds.high].map((t) => (
        <span key={t} aria-hidden className="absolute -inset-y-1 w-px bg-foreground/20" style={{ left: `${t}%` }} />
      ))}
    </div>
  );
}

/** A score that counts up to its value when it first shows. */
export function Score({ value, className }: { value: number; className?: string }) {
  return <CountUp value={value} duration={0.8} changeDuration={0.4} className={cn("font-bold tabular-nums", className)} />;
}

export function Pill({ children, tone = "neutral", className }: { children: ReactNode; tone?: "neutral" | "primary" | "ice" | "win" | "be"; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold leading-none",
        tone === "neutral" && "border-border/60 bg-muted/40 text-foreground/80",
        tone === "primary" && "border-primary/25 bg-primary/10 text-primary",
        tone === "ice" && "border-ice/25 bg-ice/10 text-ice",
        tone === "win" && "border-win/25 bg-win/10 text-win",
        tone === "be" && "border-be/25 bg-be/10 text-be",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function DifficultyPill({ level }: { level: Difficulty }) {
  return <Pill tone={level === 1 ? "primary" : level === 2 ? "ice" : "neutral"}>{copy.today.difficulty[level - 1]}</Pill>;
}

export function StatusPill({ status }: { status: RefStatus }) {
  return <Pill tone={status === "verified" ? "win" : status === "to verify" ? "be" : "ice"}>{copy.library.status[status]}</Pill>;
}

/** The way out to the original article, in a new tab. Sources without one (prototype hypotheses) show their label unlinked. */
export function SourceLink({ reference, children, className }: { reference: Reference; children?: ReactNode; className?: string }) {
  const href = sourceUrl(reference);
  if (!href) return children ? <span className={className}>{children}</span> : null;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className={cn("group/source inline-flex min-w-0 items-center gap-1 font-medium text-primary underline-offset-4 transition-colors duration-150 hover:underline", className)}>
      {children ?? copy.library.openSource}
      <ArrowUpRight aria-hidden className="size-3 shrink-0 transition-transform duration-200 group-hover/source:-translate-y-px group-hover/source:translate-x-px" />
    </a>
  );
}

/** The sources under a read, drill or exercise: how far each is checked, what we rely on it for, the citation and a link to the original. */
export function SourceList({ ids, title }: { ids: readonly string[]; title: string }) {
  return (
    <section>
      <Eyebrow className="mb-2">{title}</Eyebrow>
      <ul className="space-y-3.5">
        {ids.map((rid) => {
          const r = referenceById[rid];
          if (!r) return null;
          return (
            <li key={rid} className="text-xs">
              <StatusPill status={r.status} />
              <p className="mt-1.5 leading-relaxed text-foreground/85">{r.claim}</p>
              <p className="mt-1 leading-relaxed text-muted-foreground">{r.citation}</p>
              {sourceUrl(r) && <p className="mt-1.5"><SourceLink reference={r} /></p>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** A row of equal-width choices (radio semantics), sized for thumbs. */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: readonly { value: T; label: ReactNode }[];
  value: T | undefined;
  onChange: (v: T) => void;
  label: string;
  className?: string;
}) {
  // The selection is one pill that slides between the choices.
  const pill = useId();
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("grid gap-1 rounded-xl border border-border/50 bg-background/40 p-1", className)}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={cn(
              "press relative isolate min-h-10 rounded-lg px-2 text-sm font-medium tabular-nums transition-colors",
              on ? "text-primary-foreground" : "text-foreground/70 hover:bg-muted/60 hover:text-foreground",
            )}
          >
            {on && <motion.span layoutId={`tp-segmented-${pill}`} className="absolute inset-0 -z-10 rounded-lg bg-primary shadow-[0_4px_14px_oklch(0.70_0.13_183_/_0.28)]" transition={SPRING} />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Tile>
      <Eyebrow>{label}</Eyebrow>
      <p className="mt-1.5 text-2xl font-bold tabular-nums tracking-tight">{typeof value === "number" ? <CountUp value={value} /> : value}</p>
    </Tile>
  );
}

export function ProgressLine({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/60" role="progressbar" aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100}>
      <motion.div
        className="h-full w-full rounded-full bg-primary"
        initial={{ transform: "translateX(-100%)" }}
        animate={{ transform: `translateX(${(Math.max(0, Math.min(1, value)) - 1) * 100}%)` }}
        transition={{ duration: 0.7, ease: EASE_OUT }}
      />
    </div>
  );
}
