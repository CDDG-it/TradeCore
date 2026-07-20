"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Sparkles, Plus } from "lucide-react";

/**
 * About section — the Drift "about" block, re-skinned in TradingMC's identity:
 * dark fintech surface instead of cream, Nunito, turquoise/cyan accents. It
 * overlaps the hero with a rounded top edge, then hands off to the features.
 */
const NUNITO = "var(--font-nunito), system-ui, sans-serif";
const TURQ = "#14B8A6";
const T1 = "rgba(248,250,252,0.92)";
const T2 = "rgba(248,250,252,0.60)";
const LINE = "rgba(20,184,166,0.22)";

export function AboutSection() {
  return (
    <section
      className="relative z-10 rounded-t-[25px] px-6 py-20 md:py-32"
      style={{ background: "#0d1526", boxShadow: "0 -1px 0 rgba(20,184,166,0.18)" }}
    >
      {/* Top area */}
      <div className="mx-auto max-w-3xl flex flex-col items-center text-center gap-8">
        <motion.p
          initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-lg leading-relaxed" style={{ fontFamily: NUNITO, color: T2, fontSize: "clamp(1rem,2.2vw,1.15rem)" }}
        >
          We build tools that move with the way you actually trade, not over it. Designed for
          preparation, discipline and honest review, so your process compounds instead of your stress.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
          className="flex flex-wrap items-center justify-center gap-4"
        >
          <Link href="/signup"
            className="group inline-flex items-center gap-3 rounded-full pl-1.5 pr-6 py-1.5 text-xs font-medium uppercase tracking-wide text-white transition-transform duration-200 hover:-translate-y-0.5"
            style={{ fontFamily: NUNITO, background: "linear-gradient(135deg,#14B8A6 0%,#0D9488 100%)", boxShadow: "0 4px 22px rgba(20,184,166,0.32)" }}>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/95"><Sparkles className="h-3.5 w-3.5" style={{ color: TURQ }} /></span>
            Start for free
          </Link>
          <a href="#features"
            className="group inline-flex items-center gap-3 rounded-full pl-1.5 pr-6 py-1.5 text-xs font-medium uppercase tracking-wide transition-colors duration-200"
            style={{ fontFamily: NUNITO, color: T1, background: "rgba(20,184,166,0.10)", border: `1px solid ${LINE}` }}>
            <span className="flex h-7 w-7 items-center justify-center rounded-full" style={{ background: "rgba(20,184,166,0.18)" }}><Plus className="h-3.5 w-3.5" style={{ color: TURQ }} /></span>
            Explore features
          </a>
        </motion.div>
      </div>

      {/* Divider */}
      <div className="mx-auto max-w-6xl mt-16 md:mt-24 flex items-center gap-0.5">
        <span className="h-2 w-2 rounded-full" style={{ background: LINE }} />
        <span className="flex-1 h-[2px]" style={{ background: LINE }} />
        <span className="h-2 w-2 rounded-full" style={{ background: LINE }} />
      </div>

      {/* Bottom area */}
      <div className="mx-auto max-w-6xl mt-16 md:mt-24 flex flex-col md:flex-row gap-10 md:gap-20">
        <div className="shrink-0 flex md:flex-col items-center md:items-start gap-4">
          <MarkLogo />
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] leading-relaxed" style={{ color: T2 }}>
            Edge<br />Amplified
          </p>
        </div>
        <motion.p
          initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="font-normal" style={{ fontFamily: NUNITO, color: T1, fontSize: "clamp(1.5rem,4vw,2.6rem)", lineHeight: 1.3 }}
        >
          We make the tools and the deterministic coach that sit beside you. But most of all, we help
          you remember what disciplined trading looks like when software carries the cognitive weight,
          so you can attend to the one thing that decides your results: the next decision.
        </motion.p>
      </div>
    </section>
  );
}

/** The TradingMC "MC" mark, rendered in a turquoise→cyan gradient. */
function MarkLogo() {
  return (
    <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "linear-gradient(150deg, rgba(20,184,166,0.22), rgba(6,182,212,0.10))", border: "1px solid rgba(20,184,166,0.35)" }}>
      <span className="text-sm font-black tracking-tight" style={{ fontFamily: NUNITO, background: "linear-gradient(135deg,#14B8A6,#06B6D4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>MC</span>
    </span>
  );
}
