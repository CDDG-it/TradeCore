"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";

/**
 * About / positioning block. Overlaps the hero with a rounded top edge, then
 * hands off to the product preview. Dark fintech per UX_UI_DIRECTION: restrained,
 * design-system tokens only (no inline hex), Nunito headings + Barlow body.
 * Copy is the documented positioning — "self-improvement meets trading" — not
 * invented feature claims.
 */
const EASE = [0.16, 1, 0.3, 1] as const;

export function AboutSection() {
  return (
    <section className="relative z-10 -mt-6 rounded-t-[28px] border-t border-primary/15 bg-card/40 px-6 py-24 md:py-32">
      <div className="mx-auto max-w-4xl">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 0.6, ease: EASE }}
          className="font-mono text-xs font-medium uppercase tracking-[0.24em] text-primary"
        >
          Where self-improvement meets trading
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.08 }}
          className="mt-6 font-heading text-3xl font-black leading-[1.15] tracking-tight text-foreground md:text-[2.75rem]"
        >
          Great traders are built beyond the charts. TradingMC carries the
          cognitive weight — preparation, discipline and honest review — so you
          can attend to the one thing that decides your results:{" "}
          <span className="text-primary">the next decision.</span>
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.16 }}
          className="mt-10 grid gap-8 border-t border-border/60 pt-10 md:grid-cols-2"
        >
          <p className="font-body text-base leading-relaxed text-muted-foreground">
            Capture every trade with the context that explains it, prepare each
            session with a written plan, and track your funded accounts in one
            place. The parts that decide your results stop hiding in separate
            tabs.
          </p>
          <p className="font-body text-base leading-relaxed text-muted-foreground">
            A deterministic coach sits beside the tools, reading the process you
            already produce. No generic motivation — just the discipline that
            compounds over months instead of the variance that swings day to
            day.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.24 }}
          className="mt-10"
        >
          <Link
            href="/signup"
            className="group inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 font-body text-sm font-semibold text-primary-foreground shadow-[0_4px_28px_-6px_var(--primary)] transition-transform duration-200 hover:-translate-y-0.5"
          >
            Start for free
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
