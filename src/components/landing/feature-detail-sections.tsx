"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import { ArrowRight, Check, Sparkles, Gauge, ScrollText, Newspaper, type LucideIcon } from "lucide-react";

/**
 * Deep-dive feature sections for the landing page — the four flagship MC tools,
 * shown below the product cards as alternating text + visual blocks. Copy is
 * pulled from lib/landing/features.ts. Two tools ship with real captures; the
 * two without get a clean branded glass panel rather than invented imagery.
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
  return (
    <section className="relative bg-background px-6 py-24 md:py-28">
      <div className="mx-auto max-w-6xl">
        {/* Section header */}
        <div className="mx-auto max-w-2xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-15%" }}
            transition={{ duration: 0.5, ease: EASE }}
            className="font-mono text-xs font-medium uppercase tracking-[0.24em] text-primary"
          >
            A closer look
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-15%" }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.08 }}
            className="mt-4 font-heading text-3xl font-black tracking-tight text-foreground md:text-4xl"
          >
            The four tools that build the trader.
          </motion.h2>
        </div>

        <div className="mt-20 flex flex-col gap-24 md:gap-32">
          {FEATURES.map((f, i) => (
            <DetailRow key={f.name} feature={f} flip={i % 2 === 1} />
          ))}
        </div>
      </div>
    </section>
  );
}

function DetailRow({ feature: f, flip }: { feature: DetailFeature; flip: boolean }) {
  const Icon = f.icon;
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
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/35 bg-primary/10">
            <Icon className="h-4 w-4 text-primary" strokeWidth={2} />
          </span>
          <span className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {f.label}
          </span>
        </div>

        <h3 className="mt-5 font-heading text-2xl font-black tracking-tight text-foreground md:text-[2rem]">
          {f.name}
        </h3>
        <p className="mt-3 font-body text-lg font-medium leading-snug text-foreground/90">{f.tagline}</p>
        <p className="mt-4 font-body text-base leading-relaxed text-muted-foreground">{f.intro}</p>

        <ul className="mt-6 space-y-3">
          {f.points.map((p) => (
            <li key={p} className="flex gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/12">
                <Check className="h-3 w-3 text-primary" strokeWidth={2.5} />
              </span>
              <span className="font-body text-sm leading-relaxed text-muted-foreground">{p}</span>
            </li>
          ))}
        </ul>

        <Link
          href={f.href}
          className="group mt-7 inline-flex items-center gap-1.5 font-body text-sm font-semibold text-primary"
        >
          Learn more
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Visual */}
      <div className={flip ? "md:order-1" : ""}>
        {f.visual.kind === "shot" ? (
          <div
            className="relative w-full overflow-hidden rounded-2xl border border-border/60 bg-card shadow-[0_24px_60px_-30px_rgba(0,0,0,0.8)]"
            style={{ aspectRatio: f.visual.aspect }}
          >
            <Image
              src={f.visual.src}
              alt={`${f.name} in TradingMC`}
              fill
              sizes="(max-width: 768px) 100vw, 560px"
              quality={90}
              className="object-cover object-top"
            />
          </div>
        ) : (
          <EmblemPanel Icon={Icon} name={f.name} tagline={f.tagline} />
        )}
      </div>
    </motion.div>
  );
}

/** Branded glass panel for tools without a screenshot — no invented UI. */
function EmblemPanel({ Icon, name, tagline }: { Icon: LucideIcon; name: string; tagline: string }) {
  return (
    <div
      className="relative flex w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] px-8 text-center shadow-[0_24px_60px_-30px_rgba(0,0,0,0.8)] backdrop-blur-xl"
      style={{ aspectRatio: "16 / 11" }}
    >
      {/* Ambient turquoise glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[320px] w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-full"
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
