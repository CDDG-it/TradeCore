"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ChevronRight } from "lucide-react";

/**
 * Deep-dive feature sections for the landing page — the four flagship MC tools,
 * presented Apple-style: centered, large type, generous whitespace, minimal
 * copy. Each tool is a self-contained block with a headline, one supporting
 * line, a compact capability row and a quiet link. Copy lives in FEATURES.
 */

const EASE = [0.16, 1, 0.3, 1] as const;

interface Capability {
  term: string;
  detail: string;
}

interface DetailFeature {
  label: string;
  name: string;
  tagline: string;
  capabilities: Capability[];
  href: string;
}

const FEATURES: DetailFeature[] = [
  {
    label: "Overview",
    name: "Dashboard",
    tagline: "Your whole trading day on one screen.",
    capabilities: [
      { term: "One command center", detail: "Every account, trade and metric gathered in a single view." },
      { term: "Live P&L", detail: "Running profit and loss as the session unfolds." },
      { term: "Daily focus", detail: "The one thing to work on today, kept front and center." },
    ],
    href: "/features/dashboard",
  },
  {
    label: "Mindset",
    name: "MC Mind Edge",
    tagline: "One number for how ready you are to trade.",
    capabilities: [
      { term: "One readiness score", detail: "Rules, habits and kept commitments blended into a Mindscore." },
      { term: "Pre-trade mirror", detail: "A quick read on your state before the first trade." },
      { term: "Read over time", detail: "Week, month and all-time, with a heatmap and a clear breakdown." },
    ],
    href: "/features/psychological-edge",
  },
  {
    label: "Mindset",
    name: "MC Trade Therapist",
    tagline: "A coach that talks back, built from your own trades.",
    capabilities: [
      { term: "Runs on your data", detail: "Journal, results and discipline feed a structured 5R session." },
      { term: "Anchored in numbers", detail: "Each prompt names the trade you overheld or the rule you skipped." },
      { term: "Commitments carry", detail: "What you promise is saved and resurfaced on later trades." },
    ],
    href: "/features/trade-therapist",
  },
  {
    label: "Trading",
    name: "My Strategy",
    tagline: "Your playbook and rules, written down and always in reach.",
    capabilities: [
      { term: "Setups on paper", detail: "The exact conditions that qualify a trade, so it is a checklist." },
      { term: "Rules that govern", detail: "Risk and management fixed before the session, from size to stop." },
      { term: "Always in reach", detail: "One click away while you trade, a living reference." },
    ],
    href: "/features/strategy",
  },
  {
    label: "Markets",
    name: "MC News Dashboard",
    tagline: "See what is actually moving the market.",
    capabilities: [
      { term: "Live market core", detail: "Central banks, macro, commodities and earnings feed one hub." },
      { term: "Drill any node", detail: "Signals scored by impact, direction and confidence." },
      { term: "Filter to you", detail: "Narrow to the categories and impact that move your instrument." },
    ],
    href: "/features/news-city",
  },
];

export function FeatureDetailSections() {
  return (
    <section id="features" className="relative overflow-hidden bg-background px-6 py-28 md:py-40">
      {/* Hairline that anchors the section to the cards above it */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent"
      />

      <div className="mx-auto max-w-5xl">
        {/* Section header — centered */}
        <div className="mx-auto max-w-3xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-15%" }}
            transition={{ duration: 0.5, ease: EASE }}
            className="font-mono text-xs font-medium uppercase tracking-[0.24em] text-primary"
          >
            Inside the platform
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-15%" }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.08 }}
            className="mx-auto mt-5 max-w-3xl font-heading font-black tracking-tight text-foreground"
            style={{ fontSize: "clamp(2.25rem, 5.5vw, 4rem)", lineHeight: 1.03 }}
          >
            Five instruments for the operator behind the trades.
          </motion.h2>
        </div>

        {/* Tool blocks — centered, generous air */}
        <div className="mt-28 flex flex-col gap-32 md:mt-40 md:gap-48">
          {FEATURES.map((f, i) => (
            <ToolBlock key={f.name} feature={f} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ToolBlock({ feature: f, index }: { feature: DetailFeature; index: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 44 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-15%" }}
      transition={{ duration: 0.8, ease: EASE }}
      className="relative text-center"
    >
      {/* Soft turquoise gradient bloom behind the headline */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-15%] h-72 w-[36rem] max-w-full -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(20,184,166,0.12) 0%, transparent 70%)" }}
      />

      <p className="relative font-mono text-[11px] font-medium uppercase tracking-[0.24em] text-muted-foreground">
        <span className="text-primary">0{index + 1}</span>
        <span className="mx-2.5 text-border">/</span>
        {f.label}
      </p>

      <h3
        className="relative mx-auto mt-6 max-w-3xl font-heading font-black tracking-tight text-foreground"
        style={{ fontSize: "clamp(2.25rem, 5vw, 3.5rem)", lineHeight: 1.04 }}
      >
        {f.name}
      </h3>

      <p
        className="relative mx-auto mt-6 max-w-2xl font-body font-medium leading-snug text-foreground/80"
        style={{ fontSize: "clamp(1.2rem, 2.4vw, 1.6rem)" }}
      >
        {f.tagline}
      </p>

      <Link
        href={f.href}
        className="group relative mt-8 inline-flex items-center gap-1 font-body text-base font-semibold text-primary transition-colors hover:text-foreground"
      >
        Explore {f.name}
        <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
      </Link>

      {/* Minimal capability row — centered, no cards, no borders */}
      <div className="relative mx-auto mt-16 grid max-w-3xl gap-x-10 gap-y-10 sm:grid-cols-3">
        {f.capabilities.map((c, ci) => (
          <div key={c.term} className="text-center">
            <span className="font-mono text-xs tabular-nums text-primary/80">0{ci + 1}</span>
            <p className="mt-3 font-body text-[0.95rem] font-semibold text-foreground">{c.term}</p>
            <p className="mt-2 font-body text-sm leading-relaxed text-muted-foreground">{c.detail}</p>
          </div>
        ))}
      </div>
    </motion.article>
  );
}
