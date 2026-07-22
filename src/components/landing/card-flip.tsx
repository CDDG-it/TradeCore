"use client";

/**
 * Liquid-glass flip card. Adapted from KokonutUI's Card Flip (MIT,
 * https://kokonutui.com) — reworked to glassmorphism and the TradingMC palette
 * (turquoise/cyan, no orange), with a real product link on the back.
 */

import Link from "next/link";
import { ArrowRight, Repeat2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export interface CardFlipProps {
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  href: string;
  cta?: string;
}

// Shared liquid-glass surface for both faces: translucent fill, blur, hairline
// border and a soft outer shadow.
const GLASS = cn(
  "overflow-hidden rounded-2xl",
  "border border-white/10",
  "bg-white/[0.045] backdrop-blur-xl",
  "shadow-[0_8px_32px_rgba(0,0,0,0.38)]",
);

// Specular highlights that sell the glass: a diagonal sheen and a bright top edge.
function Sheen() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.12] via-transparent to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"
      />
    </>
  );
}

export function CardFlip({
  title,
  subtitle,
  description,
  features,
  href,
  cta = "Open",
}: CardFlipProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div
      className="group relative h-[320px] w-full [perspective:2000px]"
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
    >
      <div
        className={cn(
          "relative h-full w-full [transform-style:preserve-3d]",
          "transition-transform duration-500 ease-[cubic-bezier(0.77,0,0.175,1)]",
          "motion-reduce:transition-none",
          isFlipped ? "[transform:rotateY(180deg)]" : "[transform:rotateY(0deg)]",
        )}
      >
        {/* Front */}
        <div
          className={cn(
            "absolute inset-0 h-full w-full",
            "[backface-visibility:hidden] [transform:rotateY(0deg)]",
            GLASS,
          )}
        >
          <Sheen />

          {/* Ambient turquoise glow rings */}
          <div aria-hidden className="absolute inset-0 flex items-center justify-center">
            <div className="relative flex h-[100px] w-[160px] items-center justify-center">
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "absolute h-[50px] w-[50px] rounded-[140px] opacity-0",
                    "shadow-[0_0_50px_rgba(20,184,166,0.5)]",
                    "animate-[glassRing_3s_linear_infinite] motion-reduce:animate-none",
                    "group-hover:animate-[glassRing_2s_linear_infinite]",
                  )}
                  style={{ animationDelay: `${i * 0.3}s` }}
                />
              ))}
            </div>
          </div>

          {/* Bottom label */}
          <div className="absolute inset-x-0 bottom-0 p-5">
            <div className="flex items-end justify-between gap-3">
              <div className="space-y-1.5">
                <h3 className="font-heading text-lg font-bold leading-snug tracking-tight text-white transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-1">
                  {title}
                </h3>
                <p className="line-clamp-2 text-sm leading-snug text-white/55 transition-transform delay-[50ms] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-1">
                  {subtitle}
                </p>
              </div>
              <div className="relative shrink-0">
                <div className="absolute inset-[-8px] rounded-lg bg-gradient-to-br from-primary/25 via-primary/10 to-transparent" />
                <Repeat2 aria-hidden className="relative z-10 h-4 w-4 text-primary" />
              </div>
            </div>
          </div>
        </div>

        {/* Back */}
        <div
          className={cn(
            "absolute inset-0 flex h-full w-full flex-col p-6",
            "[backface-visibility:hidden] [transform:rotateY(180deg)]",
            GLASS,
          )}
        >
          <Sheen />

          <div className="relative flex-1 space-y-5">
            <div className="space-y-2">
              <h3 className="font-heading text-lg font-bold leading-snug tracking-tight text-white">
                {title}
              </h3>
              <p className="text-sm leading-relaxed text-white/55">{description}</p>
            </div>

            <div className="space-y-2">
              {features.map((feature, index) => (
                <div
                  key={feature}
                  className="flex items-center gap-2 text-sm text-white/75 transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]"
                  style={{
                    transform: isFlipped ? "translateX(0)" : "translateX(-10px)",
                    opacity: isFlipped ? 1 : 0,
                    transitionDelay: `${index * 50 + 150}ms`,
                  }}
                >
                  <ArrowRight aria-hidden className="h-3 w-3 shrink-0 text-primary" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mt-5 border-t border-white/10 pt-5">
            <Link
              href={href}
              className="group/start -m-3 flex items-center justify-between rounded-xl p-3 transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            >
              <span className="text-sm font-semibold text-white transition-colors duration-300 group-hover/start:text-primary">
                {cta}
              </span>
              <ArrowRight
                aria-hidden
                className="h-4 w-4 text-primary transition-transform duration-300 group-hover/start:translate-x-0.5"
              />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
