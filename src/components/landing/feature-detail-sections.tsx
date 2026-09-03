"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";

/**
 * The five flagship MC tools, presented as an editorial index rather than five
 * identical centred hero blocks: each tool is one hairline-ruled row, with its
 * identity on the left and what it actually does on the right.
 *
 * The tools are a parallel set, not a sequence, so they carry their category
 * label instead of a running number — the numbering on the home page is
 * reserved for the plan/log/review rhythm, which genuinely is ordered.
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
    <section id="features" className="relative bg-background px-6 py-24 md:px-10 md:py-32">
      <div className="mx-auto max-w-6xl">
        {/* Section header — left-aligned, no centred bloom */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: 0.6, ease: EASE }}
          className="max-w-3xl"
        >
          <p className="font-body text-[13px] font-semibold text-primary">Inside the platform</p>
          <h2
            className="mt-5 font-heading font-black tracking-tight text-foreground"
            style={{ fontSize: "clamp(2rem,4.6vw,3.25rem)", lineHeight: 1.05 }}
          >
            Five instruments for the operator behind the trades.
          </h2>
        </motion.div>

        <div className="mt-16 md:mt-20">
          {FEATURES.map((f) => (
            <ToolRow key={f.name} feature={f} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ToolRow({ feature: f }: { feature: DetailFeature }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-12%" }}
      transition={{ duration: 0.6, ease: EASE }}
      className="grid gap-8 border-t border-border/70 py-12 last:border-b md:grid-cols-[minmax(0,20rem)_1fr] md:gap-16 md:py-14"
    >
      {/* Identity */}
      <div>
        <p className="font-body text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
          {f.label}
        </p>
        <h3 className="mt-3 font-heading text-2xl font-black tracking-tight text-foreground md:text-[1.75rem]">
          {f.name}
        </h3>
        <p className="mt-3 font-body text-[0.95rem] leading-relaxed text-foreground/70">
          {f.tagline}
        </p>
        <Link
          href={f.href}
          className="group mt-5 inline-flex items-center gap-1.5 font-body text-sm font-semibold text-primary transition-colors hover:text-foreground"
        >
          Explore {f.name}
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* What it does */}
      <dl className="grid content-start gap-x-10 gap-y-7 sm:grid-cols-3">
        {f.capabilities.map((c) => (
          <div key={c.term}>
            <dt className="font-body text-[0.9rem] font-semibold text-foreground">{c.term}</dt>
            <dd className="mt-2 font-body text-sm leading-relaxed text-muted-foreground">{c.detail}</dd>
          </div>
        ))}
      </dl>
    </motion.article>
  );
}
