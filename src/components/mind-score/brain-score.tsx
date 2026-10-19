"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

/** The My Edge mark in a quiet state and a score-filled state. */
export function BrainScore({ score, className, animateIn = false }: {
  score: number | null;
  className?: string;
  /** Fill up from empty on mount, and glide between scores: for the Mindscore page itself. */
  animateIn?: boolean;
}) {
  const reduce = useReducedMotion();
  const amount = Math.max(0, Math.min(100, score ?? 0));
  // The artwork has transparent space above and below the shield. Fill within
  // the shield's visible bounds, rather than the complete PNG, so 74 reads as
  // 74% of the icon instead of a nearly full mark.
  const visibleTop = 9;
  const visibleBottom = 93;
  const clipTop = visibleBottom - (amount / 100) * (visibleBottom - visibleTop);
  // Keep the sculpted shading while shifting the blue asset into the score band.
  const hueShift = amount < 20 ? 185 : amount < 40 ? 225 : amount < 60 ? 245 : amount < 80 ? 0 : -35;
  const fill = <Image src="/product-icons/edge-matte-v3.png" alt="" fill sizes="(max-width: 640px) 128px, 180px" loading="eager" className="object-contain transition-[filter] duration-700" style={{ filter: `brightness(.82) saturate(.95) hue-rotate(${hueShift}deg)` }} />;
  return (
    <div
      className={cn("relative aspect-square shrink-0", className)}
      role="img"
      aria-label={score === null ? "Mindscore has no reading yet" : `My Edge icon filled to reflect a Mindscore of ${score}`}
    >
      <Image src="/product-icons/edge-matte-v3.png" alt="" fill sizes="(max-width: 640px) 128px, 180px" loading="eager" className="object-contain grayscale opacity-[.08]" />
      {animateIn ? (
        <motion.div
          className="absolute inset-0"
          aria-hidden="true"
          initial={{ clipPath: `inset(${reduce ? clipTop : visibleBottom}% 0 0 0)` }}
          animate={{ clipPath: `inset(${clipTop}% 0 0 0)` }}
          transition={{ duration: reduce ? 0 : 1.1, ease: [0.23, 1, 0.32, 1] }}
        >{fill}</motion.div>
      ) : (
        <div className="absolute inset-0 transition-[clip-path] duration-700 ease-out" style={{ clipPath: `inset(${clipTop}% 0 0 0)` }} aria-hidden="true">{fill}</div>
      )}
    </div>
  );
}
