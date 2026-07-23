"use client";

/**
 * Animated win-rate ring. Adapted from KokonutUI's Apple Activity Card (MIT,
 * https://kokonutui.com) — the signature sweep animation (the arc draws itself
 * in from empty on mount / value change) reworked to a single ring in the
 * TradingMC palette: a green→turquoise gradient stroke with a soft glow.
 *
 * Center content is passed as children (e.g. the win-rate percentage).
 */

import { useId } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

const GREEN = "oklch(0.58 0.17 145)";
const TURQUOISE = "oklch(0.72 0.14 183)";

interface WinRateRingProps {
  /** 0–100. The share of the ring that fills in. */
  percent: number;
  size?: number;
  strokeWidth?: number;
  from?: string;
  to?: string;
  trackColor?: string;
  /** Seconds to delay the sweep — lets several rings stagger in. */
  delay?: number;
  className?: string;
  children?: React.ReactNode;
}

export function WinRateRing({
  percent,
  size = 116,
  strokeWidth = 11,
  from = GREEN,
  to = TURQUOISE,
  trackColor = "color-mix(in oklch, var(--muted-foreground) 14%, transparent)",
  delay = 0,
  className,
  children,
}: WinRateRingProps) {
  const gradientId = useId();
  const clamped = Math.max(0, Math.min(100, percent));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference * (1 - clamped / 100);
  const c = size / 2;

  return (
    <div
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block -rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>

        {/* Track */}
        <circle cx={c} cy={c} r={radius} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />

        {/* Progress — sweeps in from empty */}
        <motion.circle
          cx={c}
          cy={c}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.6, delay, ease: [0.16, 1, 0.3, 1] }}
          style={{ filter: `drop-shadow(0 0 5px color-mix(in oklch, ${to} 45%, transparent))` }}
        />
      </svg>

      {children && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {children}
        </div>
      )}
    </div>
  );
}
