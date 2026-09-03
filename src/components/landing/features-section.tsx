"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import { Brain, Sparkles, ScrollText, ArrowRight, type LucideIcon } from "lucide-react";
import { FEATURES } from "@/lib/landing/features";

/**
 * Features — one cohesive section (merged from the old sticky showcase + card
 * grid). Content is pulled straight from lib/landing/features.ts, the single
 * source of truth: the seven documented features that ship with real captures
 * become an offset showcase; the four MC-edge tools (no screenshot yet) become
 * clean token-styled cards. Dark, restrained, Nunito + Barlow, design tokens.
 */
const EASE = [0.16, 1, 0.3, 1] as const;

// Features that have a real screenshot in /public/screenshots — shown large.
const SHOWCASE = ["dashboard", "journal", "analysis", "analytics", "accounts", "habits", "news-city"];
// The MC-edge tools, presented as cards (no invented imagery).
const EDGE: { slug: string; icon: LucideIcon }[] = [
  { slug: "psychological-edge", icon: Brain },
  { slug: "trade-therapist", icon: Sparkles },
  { slug: "strategy", icon: ScrollText },
];

const bySlug = Object.fromEntries(FEATURES.map((f) => [f.slug, f]));
const showcase = SHOWCASE.map((s) => bySlug[s]).filter(Boolean);

export function FeaturesSection() {
  return (
    <section id="features" className="bg-background px-6 py-24 md:py-32">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="max-w-2xl">
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-15%" }}
            transition={{ duration: 0.5, ease: EASE }}
            className="font-mono text-xs font-medium uppercase tracking-[0.24em] text-primary"
          >
            The platform
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-15%" }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.08 }}
            className="mt-4 font-heading text-3xl font-black tracking-tight text-foreground md:text-5xl"
          >
            Tools that build the trader, not just track the trades.
          </motion.h2>
        </div>

        {/* Showcase — real captures, alternating offset */}
        <div className="mt-20 flex flex-col gap-24 md:gap-32">
          {showcase.map((f, i) => (
            <ShowcaseItem key={f.slug} feature={f} index={i} flip={i % 2 === 1} />
          ))}
        </div>

        {/* MC-edge cards */}
        <div className="mt-28">
          <motion.h3
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-15%" }}
            transition={{ duration: 0.6, ease: EASE }}
            className="font-heading text-2xl font-black tracking-tight text-foreground md:text-3xl"
          >
            The MC edge
          </motion.h3>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {EDGE.map(({ slug, icon: Icon }, i) => {
              const f = bySlug[slug];
              if (!f) return null;
              return (
                <motion.div
                  key={slug}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-10%" }}
                  transition={{ duration: 0.5, ease: EASE, delay: (i % 4) * 0.08 }}
                >
                  <Link
                    href={`/features/${f.slug}`}
                    className="group flex h-full flex-col rounded-2xl border border-border/60 bg-card p-6 transition-all duration-200 hover:-translate-y-1 hover:border-primary/40"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/35 bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" strokeWidth={2} />
                    </span>
                    <h4 className="mt-4 font-heading text-lg font-bold text-foreground">{f.name}</h4>
                    <p className="mt-2 flex-1 font-body text-sm leading-relaxed text-muted-foreground">{f.tagline}</p>
                    <span className="mt-4 inline-flex items-center gap-1.5 font-body text-sm font-semibold text-primary">
                      Learn more
                      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function ShowcaseItem({
  feature: f,
  index,
  flip,
}: {
  feature: (typeof FEATURES)[number];
  index: number;
  flip: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-12%" }}
      transition={{ duration: 0.7, ease: EASE }}
      className="grid items-center gap-8 md:grid-cols-2 md:gap-14"
    >
      {/* Text */}
      <div className={flip ? "md:order-2" : ""}>
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm font-semibold tabular-nums text-primary">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {f.section}
          </span>
        </div>
        <h3 className="mt-4 font-heading text-2xl font-black tracking-tight text-foreground md:text-[2rem]">
          {f.name}
        </h3>
        <p className="mt-3 font-body text-lg font-medium leading-snug text-foreground/90">{f.tagline}</p>
        <p className="mt-4 font-body text-base leading-relaxed text-muted-foreground">{f.blurb}</p>
        <Link
          href={`/features/${f.slug}`}
          className="group mt-6 inline-flex items-center gap-1.5 font-body text-sm font-semibold text-primary"
        >
          Learn more
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Screenshot */}
      <div className={flip ? "md:order-1" : ""}>
        <div
          className="relative w-full overflow-hidden rounded-2xl border border-border/60 bg-card shadow-[0_24px_60px_-30px_rgba(0,0,0,0.8)]"
          style={{ aspectRatio: f.aspect }}
        >
          <Image
            src={f.screenshot}
            alt={`${f.name} in TradingMC`}
            fill
            sizes="(max-width: 768px) 100vw, 560px"
            quality={90}
            className="object-cover object-top"
          />
        </div>
      </div>
    </motion.div>
  );
}
