"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { EASE_OUT } from "@/lib/motion";
import { DOMAINS, type DomainCode } from "@/lib/trade-profile/types";
import { traitColor } from "@/components/trade-profile/primitives";

/**
 * A small image set into a line of type: a pill that carries the five trait
 * colours (or one trait's score) so a heading shows what it is about instead
 * of only naming it. Decorative: the words around it say the same thing.
 */
export function InlinePill({ code, value, className }: { code?: DomainCode; value?: number; className?: string }) {
  const reduce = useReducedMotion();
  const colors = code ? [traitColor[code]] : DOMAINS.map((d) => traitColor[d]);
  const fill = value === undefined ? 1 : Math.max(0.06, Math.min(1, value / 100));
  return (
    <span aria-hidden className={cn("relative mx-2 inline-block h-[0.82em] w-[2.4em] translate-y-[0.06em] overflow-hidden rounded-full border border-white/10 bg-muted/50 align-baseline", className)}>
      <motion.span
        className="absolute inset-0 rounded-full"
        style={{ background: colors.length > 1 ? `linear-gradient(90deg, ${colors.join(", ")})` : colors[0] }}
        initial={{ transform: "translateX(-100%)" }}
        animate={{ transform: `translateX(${(fill - 1) * 100}%)` }}
        transition={{ duration: reduce ? 0 : 0.9, delay: 0.25, ease: EASE_OUT }}
      />
      {/* A slow sheen across the pill, once, as it lands. */}
      {!reduce && (
        <motion.span
          className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/35 to-transparent"
          initial={{ transform: "translateX(-120%)" }}
          animate={{ transform: "translateX(260%)" }}
          transition={{ duration: 1.1, delay: 1, ease: EASE_OUT }}
        />
      )}
    </span>
  );
}

/**
 * An endless band of words, for the front door only (a page seen once or twice,
 * where a little ambient motion is welcome). Two copies slide by half their
 * width, so the loop has no seam. It pauses under the pointer and stands still
 * under reduced motion (see .tp-marquee in globals.css).
 */
export function Marquee({ items, className }: { items: string[]; className?: string }) {
  const row = (hidden: boolean) => (
    <ul aria-hidden={hidden || undefined} className="flex shrink-0 items-center">
      {items.map((item) => (
        <li key={item} className="flex items-center whitespace-nowrap px-5">
          {item}
          <span aria-hidden className="ml-10 size-1 rounded-full bg-primary/50" />
        </li>
      ))}
    </ul>
  );
  return (
    <div className={cn("tp-marquee-mask overflow-hidden", className)}>
      <div className="tp-marquee flex w-max">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
