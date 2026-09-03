"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { CandlesCanvas } from "@/components/landing/candles-canvas";
import { LayoutShowcase } from "@/components/landing/layout-showcase";
import { FeatureDetailSections } from "@/components/landing/feature-detail-sections";
import { LandingFooter } from "@/components/landing/footer";
import { LandingNav } from "@/components/landing/landing-nav";

const EASE = [0.16, 1, 0.3, 1] as const;

/** The working rhythm the product is built around. A real sequence, so it earns
 *  its numbering — unlike a set of parallel features. */
const RHYTHM = [
  { step: "01", title: "Plan the session", body: "Bias, levels and the rules you are holding yourself to — set before the open." },
  { step: "02", title: "Log the trade", body: "Entry, exit and the honest reason you took it, captured while it is fresh." },
  { step: "03", title: "Review the week", body: "What the pattern says, written down, so the same mistake stops repeating." },
];

export default function HomePage() {
  return (
    <div style={{ background: "#0B1120" }}>
      <LandingNav />

      {/* ── Hero — asymmetric: the claim on the left, the working rhythm right ── */}
      {/* 53px = header height (py-4 + text-base logo + 1px border) */}
      <section
        className="relative flex flex-col justify-center overflow-hidden"
        style={{ minHeight: "calc(100svh - 53px)" }}
      >
        {/* Candles sit low and to the right, masked so they never fight the copy */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.55]"
          style={{
            maskImage: "linear-gradient(to top, #000 0%, transparent 72%)",
            WebkitMaskImage: "linear-gradient(to top, #000 0%, transparent 72%)",
          }}
        >
          <CandlesCanvas />
        </div>

        <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-16 px-6 py-24 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20 lg:px-10">
          {/* Left — the claim */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            <p className="font-body text-[13px] font-semibold tracking-[0.02em] text-[#14B8A6]">
              Where self-improvement meets trading
            </p>

            <h1
              className="mt-6 max-w-[15ch] font-heading font-black tracking-tight text-[rgba(248,250,252,0.96)]"
              style={{ fontSize: "clamp(2.25rem,4.4vw,3.6rem)", lineHeight: 1.05, textWrap: "balance" }}
            >
              Great traders are built beyond the charts.
            </h1>

            <p className="mt-7 max-w-xl font-body text-[1.05rem] leading-relaxed text-[rgba(248,250,252,0.62)]">
              TradingMC is the journal, the scorecard and the coach for futures
              traders who treat preparation as part of the edge. Every number on
              it comes from your own history.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-lg bg-[#14B8A6] px-6 py-3 font-body text-sm font-bold text-[#04121a] transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
              >
                Open dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center rounded-lg border border-[rgba(248,250,252,0.16)] px-6 py-3 font-body text-sm font-semibold text-[rgba(248,250,252,0.72)] transition-colors duration-200 hover:border-[rgba(248,250,252,0.34)] hover:text-[rgba(248,250,252,0.95)]"
              >
                See the platform
              </a>
            </div>
          </motion.div>

          {/* Right — the rhythm, as a hairline-ruled index */}
          <motion.ol
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.12 }}
            className="border-t border-[rgba(248,250,252,0.10)]"
          >
            {RHYTHM.map((r) => (
              <li
                key={r.step}
                className="group grid grid-cols-[auto_1fr] gap-x-5 border-b border-[rgba(248,250,252,0.10)] py-6"
              >
                <span className="font-body text-[11px] font-bold tabular-nums text-[#14B8A6]">
                  {r.step}
                </span>
                <div>
                  <p className="font-heading text-base font-bold text-[rgba(248,250,252,0.94)]">
                    {r.title}
                  </p>
                  <p className="mt-1.5 font-body text-sm leading-relaxed text-[rgba(248,250,252,0.55)]">
                    {r.body}
                  </p>
                </div>
              </li>
            ))}
          </motion.ol>
        </div>
      </section>

      <FeatureDetailSections />

      <LayoutShowcase />

      <LandingFooter />
    </div>
  );
}
