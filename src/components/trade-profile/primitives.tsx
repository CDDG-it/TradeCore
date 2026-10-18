"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { thresholds } from "@/lib/trade-profile/config";
import type { DomainCode, Difficulty } from "@/lib/trade-profile/types";
import type { RefStatus } from "@/lib/trade-profile/content/references";
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

/** Horizontal POMP bar with the low/high threshold ticks. */
export function ScaleBar({ value, color = "var(--primary)", size = "md" }: { value: number; color?: string; size?: "sm" | "md" }) {
  return (
    <div className={cn("relative w-full rounded-full bg-muted/60", size === "md" ? "h-2" : "h-1.5")}>
      <div className="transition-[width] duration-700 ease-out absolute inset-y-0 left-0 rounded-full" style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }} />
      {[thresholds.low, thresholds.high].map((t) => (
        <span key={t} aria-hidden className="absolute -inset-y-1 w-px bg-foreground/20" style={{ left: `${t}%` }} />
      ))}
    </div>
  );
}

export function Score({ value, className }: { value: number; className?: string }) {
  return <span className={cn("font-bold tabular-nums", className)}>{Math.round(value)}</span>;
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
              "press min-h-10 rounded-lg px-2 text-sm font-medium tabular-nums transition-colors",
              on ? "bg-primary text-primary-foreground shadow-[0_4px_14px_oklch(0.70_0.13_183_/_0.28)]" : "text-foreground/70 hover:bg-muted/60 hover:text-foreground",
            )}
          >
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
      <p className="mt-1.5 text-2xl font-bold tabular-nums tracking-tight">{value}</p>
    </Tile>
  );
}

export function ProgressLine({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/60" role="progressbar" aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100}>
      <div className="transition-[width] duration-700 ease-out h-full rounded-full bg-primary" style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }} />
    </div>
  );
}
