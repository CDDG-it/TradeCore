"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";

/**
 * Deep-dive feature sections for the landing page — the four flagship MC tools,
 * presented as an editorial ledger. A sticky numbered rail on the left tracks
 * scroll position; each tool is a typographic entry with a compact capability
 * grid rather than a marketing card. Copy lives in the FEATURES array.
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
  intro: string;
  capabilities: Capability[];
  href: string;
}

const FEATURES: DetailFeature[] = [
  {
    label: "Mindset",
    name: "MC Trade Therapist",
    tagline: "A coach that talks back, built from your own trades.",
    intro:
      "Most trading advice is a poster on the wall. The Trade Therapist runs a real session on the trades you actually took, so the conversation is about what you did, not what a generic mindset clip thinks you should feel.",
    capabilities: [
      { term: "Runs on your data", detail: "Journal, results and discipline feed a structured 5R session." },
      { term: "Anchored in numbers", detail: "Each prompt names the trade you overheld or the rule you skipped." },
      { term: "Commitments carry", detail: "What you promise is saved and resurfaced on later trades." },
    ],
    href: "/features/trade-therapist",
  },
  {
    label: "Mindset",
    name: "MC Mindscore",
    tagline: "One number for how ready you are to trade.",
    intro:
      "Discipline is hard to see until it is already gone. Mind Edge turns the process behind your trading into one honest Mindscore, read straight from the habits and commitments you already produce.",
    capabilities: [
      { term: "One honest score", detail: "Rule-following, habit streaks and kept commitments, blended." },
      { term: "Habits, your way", detail: "Daily, weekday or weekend, checked from an overview or calendar." },
      { term: "Read over time", detail: "Week, month and all-time, with a heatmap and a clear breakdown." },
    ],
    href: "/features/psychological-edge",
  },
  {
    label: "Trading",
    name: "My Strategy",
    tagline: "Your playbook and rules, written down and always in reach.",
    intro:
      "A strategy in your head changes shape under pressure. My Strategy puts your playbook on paper, so the setups you take at nine thirty are the same ones you chose in the cold light of the weekend.",
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
    intro:
      "Price does not move in a vacuum. The News Dashboard turns the day's noise into a clear read on what is driving risk right now, so you walk into the session knowing the context instead of reacting to it.",
    capabilities: [
      { term: "Live market core", detail: "Central banks, macro, commodities and earnings feed one hub." },
      { term: "Drill any node", detail: "Signals scored by impact, direction and confidence." },
      { term: "Filter to you", detail: "Narrow to the categories and impact that move your instrument." },
    ],
    href: "/features/news-city",
  },
];

export function FeatureDetailSections() {
  const [active, setActive] = useState(0);
  const blockRefs = useRef<(HTMLElement | null)[]>([]);

  // Scroll-spy: whichever entry sits in the middle band of the viewport is the
  // "active" one, so the sticky rail always points at what you are reading.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(Number((entry.target as HTMLElement).dataset.index));
          }
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    for (const el of blockRefs.current) if (el) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const goTo = (i: number) =>
    blockRefs.current[i]?.scrollIntoView({ behavior: "smooth", block: "center" });

  return (
    <section className="relative overflow-hidden bg-background px-6 py-24 md:py-32">
      {/* Hairline that anchors the section to the cards above it */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent"
      />

      <div className="mx-auto max-w-6xl">
        {/* Section header */}
        <div className="max-w-2xl">
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
            className="mt-4 font-heading text-3xl font-black tracking-tight text-foreground md:text-[2.75rem] md:leading-[1.08]"
          >
            Four instruments for the operator behind the trades.
          </motion.h2>
        </div>

        <div className="mt-16 grid gap-y-20 lg:mt-24 lg:grid-cols-[200px_1fr] lg:gap-x-24">
          {/* Sticky numbered index rail (desktop) */}
          <aside className="hidden lg:block">
            <div className="sticky top-28">
              <p className="font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground/70">
                The toolkit
              </p>
              <ol className="mt-6">
                {FEATURES.map((f, i) => {
                  const on = active === i;
                  return (
                    <li key={f.name}>
                      <button
                        type="button"
                        onClick={() => goTo(i)}
                        className="group flex w-full items-center gap-3 py-2.5 text-left"
                      >
                        <span
                          className="h-6 w-px shrink-0 origin-center transition-all duration-300"
                          style={{
                            background: on ? "var(--primary)" : "var(--border)",
                            transform: on ? "scaleY(1)" : "scaleY(0.5)",
                          }}
                        />
                        <span
                          className="font-mono text-[11px] tabular-nums transition-colors duration-300"
                          style={{ color: on ? "var(--primary)" : "var(--muted-foreground)" }}
                        >
                          0{i + 1}
                        </span>
                        <span
                          className="font-body text-sm font-semibold leading-tight transition-colors duration-300"
                          style={{
                            color: on
                              ? "var(--foreground)"
                              : "color-mix(in oklch, var(--foreground) 42%, transparent)",
                          }}
                        >
                          {f.name}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>
          </aside>

          {/* Ledger of entries */}
          <div className="flex flex-col">
            {FEATURES.map((f, i) => (
              <Entry
                key={f.name}
                ref={(el) => {
                  blockRefs.current[i] = el;
                }}
                feature={f}
                index={i}
                first={i === 0}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Entry({
  feature: f,
  index,
  first,
  ref,
}: {
  feature: DetailFeature;
  index: number;
  first: boolean;
  ref: (el: HTMLElement | null) => void;
}) {
  return (
    <motion.article
      ref={ref}
      data-index={index}
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-12%" }}
      transition={{ duration: 0.7, ease: EASE }}
      className={
        "relative scroll-mt-28 " +
        (first ? "pb-16 md:pb-20" : "border-t border-border/60 py-16 md:py-20")
      }
    >
      {/* Oversized ghost numeral as a quiet typographic mark */}
      <span
        aria-hidden
        className="pointer-events-none absolute right-0 top-6 select-none font-heading font-black leading-none tracking-tighter text-foreground/[0.04]"
        style={{ fontSize: "clamp(5rem, 12vw, 9rem)" }}
      >
        0{index + 1}
      </span>

      <p className="font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
        {f.label}
      </p>

      <h3 className="relative mt-4 max-w-xl font-heading text-3xl font-black tracking-tight text-foreground md:text-[2.5rem] md:leading-[1.06]">
        {f.name}
      </h3>

      <p className="relative mt-5 max-w-2xl font-body text-xl font-medium leading-snug text-foreground/90 md:text-2xl">
        {f.tagline}
      </p>

      <p className="relative mt-5 max-w-2xl font-body text-base leading-relaxed text-muted-foreground">
        {f.intro}
      </p>

      {/* Capability ledger — definition rows, no bullets, no cards */}
      <dl className="relative mt-10 grid gap-x-10 gap-y-8 border-t border-border/60 pt-8 sm:grid-cols-3">
        {f.capabilities.map((c) => (
          <div key={c.term}>
            <dt className="font-body text-sm font-semibold text-foreground">{c.term}</dt>
            <dd className="mt-2 font-body text-sm leading-relaxed text-muted-foreground">
              {c.detail}
            </dd>
          </div>
        ))}
      </dl>

      <Link
        href={f.href}
        className="group relative mt-10 inline-flex items-center gap-2 font-body text-sm font-semibold text-foreground transition-colors hover:text-primary"
      >
        <span
          aria-hidden
          className="h-px w-6 bg-primary transition-all duration-300 group-hover:w-9"
        />
        Explore {f.name}
      </Link>
    </motion.article>
  );
}
