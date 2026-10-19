"use client";

import { motion } from "motion/react";
import { EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * A progress bar that grows in and glides between values on the compositor.
 *
 * The fill is a full-width bar slid left inside a clipped track, not a width:
 * a transform skips layout, and unlike scaleX it keeps the rounded end round
 * at any length. Give it `delay` for a staggered first appearance; pass 0
 * afterwards so a later change answers at once.
 */
export function GrowBar({
  value, color, className, fillClassName, delay = 0, duration = 0.7,
}: {
  /** 0..1 */
  value: number;
  color?: string;
  /** The track: height, radius and background. */
  className?: string;
  fillClassName?: string;
  delay?: number;
  duration?: number;
}) {
  const share = Math.max(0, Math.min(1, value));
  return (
    <div className={cn("h-1 overflow-hidden rounded-full bg-muted-foreground/15", className)}>
      <motion.div
        className={cn("h-full w-full rounded-full", fillClassName)}
        style={color ? { backgroundColor: color } : undefined}
        initial={{ transform: "translateX(-100%)" }}
        animate={{ transform: `translateX(${(share - 1) * 100}%)` }}
        transition={{ duration, delay, ease: EASE_OUT }}
      />
    </div>
  );
}
