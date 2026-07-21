"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
  LayoutDashboard, BookOpen, Crosshair, BarChart3, Wallet, Repeat,
  Brain, Sparkles, ScrollText, Activity, Globe, ArrowRight, type LucideIcon,
} from "lucide-react";

/**
 * All-features grid — a card per product surface, so the whole platform is
 * visible in one place beneath the curated FeaturesSection showcase. Kept in
 * TradingMC's identity: Nunito headings, navy surfaces, turquoise/cyan accents,
 * staggered whileInView reveal (the app's standard mechanism). House copy:
 * plain, trader-first, no em dashes. Order matches the app navigation.
 */
const NUNITO = "var(--font-nunito), system-ui, sans-serif";

type FeatureCard = {
  name: string;
  href: string;
  desc: string;
  Icon: LucideIcon;
  group: string;
};

const CARDS: FeatureCard[] = [
  {
    name: "Dashboard",
    href: "/features/dashboard",
    desc: "Your whole trading day on one screen. Habits, recent trades, account status and discipline score before the opening bell.",
    Icon: LayoutDashboard,
    group: "Trading",
  },
  {
    name: "Journal",
    href: "/features/journal",
    desc: "Every trade logged with the setup, session and execution quality that explains it. Result and execution scored apart.",
    Icon: BookOpen,
    group: "Trading",
  },
  {
    name: "Analysis",
    href: "/features/analysis",
    desc: "Structured pre market prep around bias, key levels and the scenarios you expect, so you act instead of improvise.",
    Icon: Crosshair,
    group: "Trading",
  },
  {
    name: "Analytics",
    href: "/features/analytics",
    desc: "Win rate by session, R multiples and discipline trends, found in your own history without a single spreadsheet.",
    Icon: BarChart3,
    group: "Trading",
  },
  {
    name: "Accounts",
    href: "/features/accounts",
    desc: "Every funded prop firm account, payout, ROI multiple and drawdown threshold tracked in one place.",
    Icon: Wallet,
    group: "Trading",
  },
  {
    name: "Habits",
    href: "/features/habits",
    desc: "Track the daily routine that keeps you sharp. Streaks, completion rate and a calendar you can check off any day.",
    Icon: Repeat,
    group: "Daily",
  },
  {
    name: "MC Mind Edge",
    href: "/features/psychological-edge",
    desc: "One Mindscore that blends rule adherence, habits and commitment follow-through, read straight from your own process.",
    Icon: Brain,
    group: "MC Mindset formula",
  },
  {
    name: "MC Trade Therapist",
    href: "/features/trade-therapist",
    desc: "A deterministic coaching session built from your real trades. Every question traces to concrete numbers, never generic motivation.",
    Icon: Sparkles,
    group: "MC Mindset formula",
  },
  {
    name: "My Strategy",
    href: "/features/strategy",
    desc: "Your playbook and rules written down and always in reach, so the plan you trade is the plan you decided on.",
    Icon: ScrollText,
    group: "MC Mindset formula",
  },
  {
    name: "Option Flow",
    href: "/features/option-flow",
    desc: "See where dealer size is really positioned, strike by strike, and read the structure behind the price.",
    Icon: Activity,
    group: "MC Option Flow",
  },
  {
    name: "MC News Dashboard",
    href: "/features/news-city",
    desc: "Central banks, macro data, commodities and earnings scored by impact, direction and confidence in one readable view.",
    Icon: Globe,
    group: "MC News Dashboard",
  },
];

export function AllFeaturesGrid() {
  return (
    <section
      id="all-features"
      className="relative px-5 md:px-10 lg:px-16 py-20 md:py-28"
      style={{ background: "linear-gradient(180deg,#0a0f1c 0%,#0B1120 100%)" }}
    >
      <div className="relative mx-auto max-w-7xl">
        {/* Heading */}
        <div className="max-w-2xl">
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="text-xs font-semibold uppercase tracking-[0.2em]"
            style={{ fontFamily: NUNITO, color: "#14B8A6" }}
          >
            The full platform
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
            className="mt-3 font-black tracking-tight"
            style={{ fontFamily: NUNITO, color: "rgba(248,250,252,0.94)", fontSize: "clamp(1.8rem,4vw,3rem)", lineHeight: 1.1 }}
          >
            Everything in{" "}
            <span style={{ background: "linear-gradient(135deg,#14B8A6 0%,#06B6D4 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              TradingMC
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.16 }}
            className="mt-4 leading-relaxed"
            style={{ fontFamily: NUNITO, color: "rgba(248,250,252,0.55)", fontSize: "clamp(0.95rem,1.8vw,1.1rem)" }}
          >
            Preparation, execution, review and mindset. Every part of the process, cleanly sorted into one platform.
          </motion.p>
        </div>

        {/* Cards */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CARDS.map((f, i) => {
            const Icon = f.Icon;
            return (
              <motion.div
                key={f.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: (i % 3) * 0.08 }}
              >
                <Link
                  href={f.href}
                  className="group relative flex h-full flex-col overflow-hidden rounded-2xl p-6 transition-all duration-200 hover:-translate-y-1"
                  style={{ background: "rgba(0,0,0,0.22)", border: "1px solid rgba(248,250,252,0.08)" }}
                >
                  {/* Accent wash on hover */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                    style={{ background: "radial-gradient(120% 90% at 0% 0%, rgba(20,184,166,0.10), transparent 60%)" }}
                  />
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                    style={{ background: "linear-gradient(90deg, transparent, rgba(20,184,166,0.55), transparent)" }}
                  />

                  <div className="relative flex items-center gap-3">
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: "linear-gradient(150deg, rgba(20,184,166,0.22), rgba(6,182,212,0.10))", border: "1px solid rgba(20,184,166,0.35)" }}
                    >
                      <Icon className="h-5 w-5" style={{ color: "#2DD4BF" }} strokeWidth={2} />
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-bold truncate" style={{ fontFamily: NUNITO, color: "rgba(248,250,252,0.94)", fontSize: "1.05rem" }}>
                        {f.name}
                      </h3>
                      <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "rgba(248,250,252,0.35)" }}>
                        {f.group}
                      </p>
                    </div>
                  </div>

                  <p className="relative mt-4 flex-1 leading-relaxed" style={{ fontFamily: NUNITO, color: "rgba(248,250,252,0.58)", fontSize: "0.92rem" }}>
                    {f.desc}
                  </p>

                  <span className="relative mt-5 inline-flex items-center gap-1.5 text-sm font-semibold" style={{ fontFamily: NUNITO, color: "#14B8A6" }}>
                    Learn more
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
