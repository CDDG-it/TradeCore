"use client";

import { motion } from "motion/react";
import { BookOpen, Crosshair, Wallet } from "lucide-react";

/**
 * "Why traders need this" — a documented landing section (PRODUCT_REQUIREMENTS:
 * "why traders need journaling + analysis + funded tracking"). Each pillar's
 * copy is condensed from the existing "why every trader needs this" blocks in
 * lib/landing/features.ts. No invented claims. Dark, tokens, Nunito + Barlow.
 */
const EASE = [0.16, 1, 0.3, 1] as const;

const PILLARS = [
  {
    icon: BookOpen,
    title: "Journaling",
    body: "Every prop firm wants to see process, not luck. A complete journal is the line between a trader who caught a good run and one who can repeat results — and the evidence that tells you whether to push on or step back.",
  },
  {
    icon: Crosshair,
    title: "Analysis",
    body: "Discretionary traders blow accounts on trades they never intended to take. Pre-market analysis draws a clear line between a setup and a temptation, turning your session decisions into a checklist instead of a coin flip.",
  },
  {
    icon: Wallet,
    title: "Funded tracking",
    body: "Scaling means more accounts, and more accounts means more ways to make an expensive mistake. A single source of truth for payouts and risk is what lets you grow the number of accounts without growing the chaos.",
  },
];

export function WhySection() {
  return (
    <section className="border-y border-border/60 bg-card/40 px-6 py-24 md:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-15%" }}
            transition={{ duration: 0.5, ease: EASE }}
            className="font-mono text-xs font-medium uppercase tracking-[0.24em] text-primary"
          >
            Why it works
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-15%" }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.08 }}
            className="mt-4 font-heading text-3xl font-black tracking-tight text-foreground md:text-5xl"
          >
            Funded traders are paid for consistency, not single trades.
          </motion.h2>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {PILLARS.map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ duration: 0.6, ease: EASE, delay: i * 0.1 }}
                className="rounded-2xl border border-border/60 bg-background/60 p-7"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/35 bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" strokeWidth={2} />
                </span>
                <h3 className="mt-5 font-heading text-xl font-black tracking-tight text-foreground">{p.title}</h3>
                <p className="mt-3 font-body text-[0.95rem] leading-relaxed text-muted-foreground">{p.body}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
