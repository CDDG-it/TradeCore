"use client";

import { useId, type CSSProperties, type ReactNode } from "react";
import { motion } from "motion/react";
import { SPRING } from "@/lib/motion";
import { cn } from "@/lib/utils";

export interface SegmentedOption<T extends string> {
  value: T;
  label: ReactNode;
  /** Accessible name when the label is an icon or abbreviated. */
  title?: string;
}

/**
 * A row of mutually exclusive choices whose selection is a pill that slides
 * from the old choice to the new one, so a switch reads as one movement
 * instead of two buttons changing colour.
 *
 * `pillClassName` / `pillStyle` colour the pill (primary by default); the
 * active label takes `activeClassName`. Inside a link or a clickable card,
 * pass `isolate` so a choice does not also open the card.
 */
export function Segmented<T extends string>({
  options, value, onChange, label, size = "md", shape = "pill", className,
  buttonClassName, activeClassName = "text-primary-foreground", pillClassName = "bg-primary shadow-[0_0_18px_rgba(20,184,166,.22)]",
  pillStyle, isolate = false, disabled = false,
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Accessible name of the group. */
  label: string;
  size?: "xs" | "sm" | "md";
  shape?: "pill" | "rounded";
  className?: string;
  buttonClassName?: string;
  activeClassName?: string;
  pillClassName?: string;
  pillStyle?: CSSProperties;
  isolate?: boolean;
  disabled?: boolean;
}) {
  const id = useId();
  const radius = shape === "pill" ? "rounded-full" : size === "xs" ? "rounded-md" : "rounded-lg";
  return (
    <div role="group" aria-label={label} className={cn("flex items-center gap-0.5 border border-border/70 bg-muted/25", shape === "pill" ? "rounded-full p-1" : size === "xs" ? "rounded-lg p-0.5" : "rounded-xl p-0.5", className)}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            title={option.title}
            aria-pressed={active}
            disabled={disabled}
            onClick={(event) => {
              if (isolate) { event.preventDefault(); event.stopPropagation(); }
              if (!active) onChange(option.value);
            }}
            className={cn(
              "relative isolate inline-flex items-center justify-center gap-1.5 font-semibold transition-[color,transform] duration-150 active:scale-[.96] disabled:opacity-50",
              radius,
              size === "xs" ? "px-1.5 py-0.5 text-[9px] uppercase tracking-wider sm:px-2 sm:text-[10px]" : size === "sm" ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-[11px]",
              active ? activeClassName : "text-muted-foreground hover:text-foreground",
              buttonClassName,
            )}
          >
            {active && <motion.span layoutId={`segmented-${id}`} className={cn("absolute inset-0 -z-10", radius, pillClassName)} style={pillStyle} transition={SPRING} />}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
