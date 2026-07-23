"use client";

/**
 * Liquid Glass Card. Adapted from KokonutUI's Liquid Glass Card (MIT,
 * https://kokonutui.com) — trimmed to the essence of the effect and tuned for
 * the TradingMC dark navy surfaces: translucent fill, backdrop blur, a bright
 * inset edge-light, a top sheen and a soft hover sweep.
 */

import * as React from "react";
import { cn } from "@/lib/utils";

// The signature "liquid glass" edge: crisp inner highlights on the top-left,
// a matching lowlight bottom-right and a faint inner glow. Tuned lighter than
// the kokonut default so it reads on the navy background rather than washing out.
const GLASS_SHADOW =
  "shadow-[0_2px_8px_rgba(0,0,0,0.35),inset_3px_3px_0.5px_-3.5px_rgba(255,255,255,0.25),inset_-3px_-3px_0.5px_-3.5px_rgba(255,255,255,0.12),inset_1px_1px_1px_-0.5px_rgba(255,255,255,0.12),inset_-1px_-1px_1px_-0.5px_rgba(255,255,255,0.10),inset_0_0_8px_4px_rgba(255,255,255,0.02)]";

export type LiquidGlassCardProps = React.HTMLAttributes<HTMLDivElement>;

export function LiquidGlassCard({
  className,
  children,
  ...props
}: LiquidGlassCardProps) {
  return (
    <div
      className={cn(
        "group/glass relative overflow-hidden rounded-2xl border border-white/10",
        "bg-white/[0.045] backdrop-blur-xl",
        GLASS_SHADOW,
        className
      )}
      {...props}
    >
      {/* Bright top edge */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
      />

      <div className="relative">{children}</div>

      {/* Soft sweep on hover */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-r from-transparent via-white/[0.06] to-transparent opacity-0 transition-opacity duration-300 ease-out group-hover/glass:opacity-100 motion-reduce:transition-none"
      />
    </div>
  );
}
