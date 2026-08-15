"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import { ArrowRight, Sparkles, Gauge, ScrollText, Newspaper, type LucideIcon } from "lucide-react";

/**
 * Deep-dive feature sections for the landing page — the four flagship MC tools,
 * presented as an editorial index. A sticky numbered rail on the left tracks
 * scroll position; each tool reads as a full-width block with its own visual.
 * Copy lives in the FEATURES array. Two tools ship with real captures; the two
 * without get a clean branded glass panel rather than invented imagery.
 */

const EASE = [0.16, 1, 0.3, 1] as const;

type Visual =
  | { kind: "shot"; src: string; aspect: string }
  | { kind: "emblem" };

interface DetailFeature {
  label: string;
  name: string;
  icon: LucideIcon;
  tagline: string;
  intro: string;
  points: string[];
  href: string;
  visual: Visual;
}

const FEATURES: DetailFeature[] = [
  {
    label: "Mindset",
    name: "MC Trade Therapist",
    icon: Sparkles,
    tagline: "A coach that talks back, built from your own trades.",
    intro:
      "Most trading advice is a poster on the wall. The MC Trade Therapist runs a real session on your own trades, so the conversation is about what you actually did, not what a generic mindset video thinks you should feel.",
    points: [
      "Reads your journal, results and discipline data, then works a structured 5R flow around the patterns it finds.",
      "Every prompt is tied to concrete numbers, so you confront the trade you overheld or the rule you skipped.",
      "Commitments you make are saved and surfaced again later, so the work carries into your next trades.",
    ],
    href: "/features/trade-therapist",
    visual: { kind: "emblem" },
  },
  {
    label: "Mindset",
    name: "MC Mindscore & habit tracking",
    icon: Gauge,
    tagline: "One number for how ready you are to trade.",
    intro:
      "Discipline is hard to see until it is already gone. MC Mind Edge turns the process behind your trading into one honest Mindscore, read straight from the habits and commitments you already produce.",
    points: [
      "One score blends three inputs: how well you followed your rules, how consistent your habits were and the commitments you kept.",
      "Build daily, weekday or weekend habits and check them off from an overview or a full calendar you can backfill.",
      "Track by week, month and all time, with an activity heatmap and a breakdown of what lifted or dragged the score.",
    ],
    href: "/features/psychological-edge",
    visual: { kind: "shot", src: "/screenshots/habits.png", aspect: "1144 / 626" },
  },
  {
    label: "Trading",
    name: "My Strategy",
    icon: ScrollText,
    tagline: "Your playbook and rules, written down and always in reach.",
    intro:
      "A strategy in your head changes shape under pressure. My Strategy puts your playbook on paper, so the setups you take at nine thirty are the same ones you chose in the cold light of the weekend.",
    points: [
      "Write out each setup with the exact conditions that qualify it, so a valid trade is a checklist and not a gut call.",
      "Set the risk and management rules that govern every position, from size to where you are wrong.",
      "Keep it one click away while you trade and review, so your plan stays a living reference.",
    ],
    href: "/features/strategy",
    visual: { kind: "emblem" },
  },
  {
    label: "Markets",
    name: "MC News Dashboard",
    icon: Newspaper,
    tagline: "See what is actually moving the market.",
    intro:
      "Price does not move in a vacuum. The MC News Dashboard turns the day's noise into a clear picture of what is driving risk right now, so you walk into the session knowing the context instead of reacting to it.",
    points: [
      "An interactive hub where central banks, macro data, commodities, earnings and index impact feed the market core in real time.",
      "Click any node to drill into its signals, each scored by impact, direction and confidence.",
      "Filter to the categories and impact levels you care about, so you see the events that matter for your instrument.",
    ],
    href: "/features/news-city",
    visual: { kind: "shot", src: "/screenshots/market-intelligence.png", aspect: "1670 / 848" },
  },
];

export function FeatureDetailSections() {
  const [active, setActive] = useState(0);
  const blockRefs = useRef<(HTMLElement | null)[]>([]);

  // Scroll-spy: whichever block sits in the middle band of the viewport is the
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
    <section className="relative bg-background px-6 py-24 md:py-32">
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
            The four tools that build the trader.
          </motion.h2>
        </div>

        <div className="mt-16 grid gap-y-24 lg:mt-24 lg:grid-cols-[210px_1fr] lg:gap-x-20">
          {/* Sticky numbered index rail (desktop) */}
          <aside className="hidden lg:block">
            <div className="sticky top-28">
              <p className="font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground/70">
                The toolkit
              </p>
              <ol className="mt-6 space-y-1">
                {FEATURES.map((f, i) => {
                  const on = active === i;
                  return (
                    <li key={f.name}>
                      <button
                        type="button"
                        onClick={() => goTo(i)}
                        className="group flex w-full items-center gap-3 py-2 text-left"
                      >
                        {/* Active bar */}
                        <span
                          className="h-6 w-px shrink-0 origin-center transition-all duration-300"
                          style={{
                            background: on ? "var(--primary)" : "var(--border)",
                            transform: on ? "scaleY(1)" : "scaleY(0.55)",
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
                              : "color-mix(in oklch, var(--foreground) 45%, transparent)",
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

          {/* Detail column */}
          <div className="flex flex-col gap-28 md:gap-36">
            {FEATURES.map((f, i) => (
              <DetailBlock
                key={f.name}
                ref={(el) => {
                  blockRefs.current[i] = el;
                }}
                feature={f}
                index={i}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function DetailBlock({
  feature: f,
  index,
  ref,
}: {
  feature: DetailFeature;
  index: number;
  ref: (el: HTMLElement | null) => void;
}) {
  const Icon = f.icon;
  return (
    <motion.article
      ref={ref}
      data-index={index}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-12%" }}
      transition={{ duration: 0.7, ease: EASE }}
      className="scroll-mt-28"
    >
      {/* Eyebrow: index + hairline + label */}
      <div className="flex items-center gap-4">
        <span className="font-mono text-sm font-medium tabular-nums text-primary">
          0{index + 1}
        </span>
        <span className="h-px w-8 bg-border" />
        <span className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          {f.label}
        </span>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/35 bg-primary/10">
          <Icon className="h-[18px] w-[18px] text-primary" strokeWidth={2} />
        </span>
        <h3 className="font-heading text-2xl font-black tracking-tight text-foreground md:text-[2rem] md:leading-[1.1]">
          {f.name}
        </h3>
      </div>

      <p className="mt-4 max-w-2xl font-body text-lg font-medium leading-snug text-foreground/90 md:text-xl">
        {f.tagline}
      </p>

      {/* Visual */}
      <div className="mt-8">
        {f.visual.kind === "shot" ? (
          <div
            className="relative w-full overflow-hidden rounded-2xl border border-border/60 bg-card shadow-[0_30px_70px_-34px_rgba(0,0,0,0.85)]"
            style={{ aspectRatio: f.visual.aspect }}
          >
            <Image
              src={f.visual.src}
              alt={`${f.name} in TradingMC`}
              fill
              sizes="(max-width: 1024px) 100vw, 760px"
              quality={90}
              className="object-cover object-top"
            />
            {/* Soft inner top edge for a glass feel */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"
            />
          </div>
        ) : (
          <EmblemPanel Icon={Icon} name={f.name} tagline={f.tagline} />
        )}
      </div>

      {/* Intro + capability list, side by side */}
      <div className="mt-8 grid gap-x-12 gap-y-6 md:grid-cols-[0.9fr_1.1fr]">
        <p className="font-body text-base leading-relaxed text-muted-foreground">{f.intro}</p>

        <ul className="flex flex-col divide-y divide-border/50 border-t border-border/50">
          {f.points.map((p) => (
            <li key={p} className="flex gap-3 py-3">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
              <span className="font-body text-sm leading-relaxed text-muted-foreground">{p}</span>
            </li>
          ))}
        </ul>
      </div>

      <Link
        href={f.href}
        className="group mt-8 inline-flex items-center gap-1.5 font-body text-sm font-semibold text-primary"
      >
        Learn more
        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
      </Link>
    </motion.article>
  );
}

/** Branded glass panel for tools without a screenshot — no invented UI. */
function EmblemPanel({ Icon, name, tagline }: { Icon: LucideIcon; name: string; tagline: string }) {
  return (
    <div
      className="relative flex w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] px-8 text-center shadow-[0_30px_70px_-34px_rgba(0,0,0,0.85)] backdrop-blur-xl"
      style={{ aspectRatio: "16 / 8" }}
    >
      {/* Ambient turquoise glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[340px] w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(20,184,166,0.18) 0%, transparent 70%)" }}
      />
      {/* Bright top edge */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
      />

      <div className="relative flex flex-col items-center">
        <span
          className="flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/40"
          style={{
            background: "linear-gradient(135deg, rgba(20,184,166,0.18), rgba(6,182,212,0.08))",
            boxShadow: "0 8px 30px rgba(20,184,166,0.25)",
          }}
        >
          <Icon className="h-7 w-7 text-primary" strokeWidth={1.75} />
        </span>
        <p className="mt-5 font-heading text-lg font-bold text-foreground">{name}</p>
        <p className="mt-1.5 max-w-xs font-body text-sm leading-snug text-muted-foreground">{tagline}</p>
      </div>
    </div>
  );
}
