"use client";

import Image from "next/image";
import { motion } from "motion/react";

/**
 * Product preview marquee — a subtle, continuous scroll of the real product
 * screenshots that already ship in /public/screenshots. No invented imagery.
 * Motion drives the loop (duplicated track) instead of a CSS gimmick, kept slow
 * per UX_UI_DIRECTION ("subtle motion, avoid flashy gimmicks").
 */
const SHOTS: { src: string; label: string }[] = [
  { src: "/screenshots/dashboard.png", label: "Dashboard" },
  { src: "/screenshots/journal.png", label: "Journal" },
  { src: "/screenshots/analysis.png", label: "Analysis" },
  { src: "/screenshots/analytics.png", label: "Analytics" },
  { src: "/screenshots/accounts.png", label: "Accounts" },
  { src: "/screenshots/habits.png", label: "Habits" },
  { src: "/screenshots/market-intelligence.png", label: "Market Intelligence" },
];

const TRACK = [...SHOTS, ...SHOTS];

export function MarqueeSection() {
  return (
    <section className="relative overflow-hidden bg-background py-16 md:py-24">
      {/* Edge fades keep the strip feeling infinite without hard cut-offs. */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background to-transparent md:w-32" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background to-transparent md:w-32" />

      <motion.div
        className="flex w-max gap-4"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 48, ease: "linear", repeat: Infinity }}
      >
        {TRACK.map((shot, i) => (
          <figure
            key={`${shot.label}-${i}`}
            className="relative h-[220px] w-[360px] shrink-0 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-[0_18px_50px_-24px_rgba(0,0,0,0.7)] md:h-[300px] md:w-[500px]"
          >
            <Image
              src={shot.src}
              alt={`${shot.label} in TradingMC`}
              fill
              sizes="500px"
              quality={90}
              className="object-cover object-top"
            />
            <figcaption className="absolute left-3 top-3 rounded-md border border-border/60 bg-background/80 px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground backdrop-blur">
              {shot.label}
            </figcaption>
          </figure>
        ))}
      </motion.div>
    </section>
  );
}
