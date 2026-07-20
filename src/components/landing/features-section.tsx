"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import {
  DashboardMock, JournalMock, MindEdgeMock, TherapistMock, IntelligenceMock, OptionFlowMock,
} from "@/components/landing/app-mocks";

/**
 * Features section — the Drift scroll-driven layout (sticky left column + a
 * column of revealing cards), re-skinned in TradingMC's identity. Reveal + the
 * active-nav highlight use Framer's viewport hooks (the same proven mechanism as
 * the rest of the app) rather than a hand-rolled IntersectionObserver: cards
 * slide in from the right once, and each highlights its nav item as it crosses
 * the middle of the screen. The card media are the hand-built app mockups.
 */
const NUNITO = "var(--font-nunito), system-ui, sans-serif";
const TURQ = "#14B8A6";

type Feat = { title: string; href: string; desc: string; Mock: React.ComponentType };

const FEATURES: Feat[] = [
  {
    title: "Your whole day, one screen",
    href: "/features/dashboard",
    desc: "Habits, recent trades, funded-account status and your discipline score, pulled into a single view before the opening bell. Cause and effect stay side by side, so a red day is never just a red number.",
    Mock: DashboardMock,
  },
  {
    title: "Every trade, logged and understood",
    href: "/features/journal",
    desc: "Record setup, session and execution quality in seconds, and score how you traded independently of what you made. The behaviour that compounds over months surfaces instead of the variance that swings day to day.",
    Mock: JournalMock,
  },
  {
    title: "One number for how ready you are",
    href: "/psychological-edge",
    desc: "MC Mind Edge blends rule adherence, habits and commitment follow-through into a single Mindscore. It reads the process you already produce, so nothing is faked and the number moves only when your behaviour does.",
    Mock: MindEdgeMock,
  },
  {
    title: "A coach that talks back",
    href: "/trade-therapist",
    desc: "The MC Trade Therapist runs a deterministic, data-driven session on your own trades. Every question traces to concrete numbers from your history, never generic motivation, and every commitment comes back when it matters.",
    Mock: TherapistMock,
  },
  {
    title: "See what is moving the market",
    href: "/features/news-city",
    desc: "Central banks, macro data, commodities and earnings, each scored by impact, direction and confidence, gathered into one readable view. Walk into the session with the context framed instead of reacting to it.",
    Mock: IntelligenceMock,
  },
  {
    title: "Dealer positioning, strike by strike",
    href: "/option-flow",
    desc: "Option Flow shows where the size is really positioned across strikes, so you can read the session structure behind the price instead of guessing at it.",
    Mock: OptionFlowMock,
  },
];

export function FeaturesSection() {
  const [active, setActive] = useState(0);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const scrollTo = (i: number) =>
    cardRefs.current[i]?.scrollIntoView({ behavior: "smooth", block: "center" });

  return (
    <section id="features" className="relative px-5 md:px-10 lg:px-16 py-20 md:py-32 lg:py-40" style={{ background: "linear-gradient(180deg,#0b1120 0%,#0a0f1c 100%)" }}>
      {/* Ambient glow */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[15%] top-[20%] h-[420px] w-[420px] rounded-full" style={{ background: "radial-gradient(circle, rgba(20,184,166,0.10) 0%, transparent 68%)" }} />
        <div className="absolute right-[8%] bottom-[12%] h-[360px] w-[360px] rounded-full" style={{ background: "radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 68%)" }} />
      </div>

      <div className="relative mx-auto max-w-7xl grid gap-16 lg:grid-cols-[400px_1fr] xl:grid-cols-[460px_1fr] xl:gap-32">
        {/* Left — sticky */}
        <div className="lg:sticky lg:top-0 lg:h-screen lg:flex lg:flex-col lg:justify-between lg:py-32">
          <div>
            <h2 className="font-normal tracking-tight" style={{ fontFamily: NUNITO, color: "rgba(248,250,252,0.94)", fontSize: "clamp(1.6rem,3.5vw,2.9rem)", lineHeight: 1.2 }}>
              Tools that build the trader,<br className="hidden sm:block" /> not just track the trades.
            </h2>

            <nav className="mt-10 hidden lg:flex lg:flex-col gap-2">
              {FEATURES.map((f, i) => (
                <button
                  key={f.title}
                  onClick={() => scrollTo(i)}
                  className="text-left rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
                  style={{
                    fontFamily: NUNITO,
                    background: "rgba(0,0,0,0.20)",
                    color: i === active ? "rgba(248,250,252,0.95)" : "rgba(248,250,252,0.40)",
                    border: `1px solid ${i === active ? "rgba(20,184,166,0.4)" : "transparent"}`,
                  }}
                >
                  {f.title}
                </button>
              ))}
            </nav>
          </div>

          <div className="hidden lg:flex lg:flex-col gap-4 mt-10">
            <p className="max-w-xs text-sm leading-relaxed" style={{ fontFamily: NUNITO, color: "rgba(248,250,252,0.55)" }}>
              Preparation, execution, review and mindset. No clutter, just your process, cleanly sorted.
            </p>
            <Link href="/signup" className="self-start inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5"
              style={{ fontFamily: NUNITO, background: "linear-gradient(135deg,#14B8A6 0%,#0D9488 100%)", boxShadow: "0 4px 22px rgba(20,184,166,0.32)" }}>
              Start for free <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Right — scrolling cards */}
        <div className="flex flex-col gap-8 md:gap-14">
          {FEATURES.map((f, i) => {
            const Mock = f.Mock;
            return (
              <motion.div
                key={f.title}
                ref={(el) => { cardRefs.current[i] = el; }}
                onViewportEnter={() => setActive(i)}
                viewport={{ amount: 0.5, margin: "-10% 0px -10% 0px" }}
              >
                <motion.div
                  initial={{ opacity: 0, x: 64 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  className="rounded-3xl p-6 md:p-8 backdrop-blur-sm"
                  style={{ background: "rgba(0,0,0,0.22)", border: "1px solid rgba(248,250,252,0.08)" }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "linear-gradient(150deg, rgba(20,184,166,0.22), rgba(6,182,212,0.10))", border: "1px solid rgba(20,184,166,0.35)" }}>
                      <span className="text-[11px] font-black" style={{ fontFamily: NUNITO, background: "linear-gradient(135deg,#14B8A6,#06B6D4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>MC</span>
                    </span>
                    <h3 className="font-medium" style={{ fontFamily: NUNITO, color: "rgba(248,250,252,0.94)", fontSize: "clamp(1.1rem,2.4vw,1.5rem)" }}>{f.title}</h3>
                  </div>

                  <div className="aspect-video rounded-2xl overflow-hidden" style={{ boxShadow: "0 0 0 1px rgba(20,184,166,0.18), 0 18px 50px rgba(0,0,0,0.5)" }}>
                    <Mock />
                  </div>

                  <p className="mt-5 leading-relaxed" style={{ fontFamily: NUNITO, color: "rgba(248,250,252,0.60)", fontSize: "clamp(0.9rem,1.6vw,1rem)" }}>
                    {f.desc}
                  </p>

                  <Link href={f.href} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold" style={{ fontFamily: NUNITO, color: TURQ }}>
                    Learn more <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
