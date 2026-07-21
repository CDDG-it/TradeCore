"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowRight, ArrowDown } from "lucide-react";
import { motion, useScroll, useTransform } from "motion/react";
import { AboutSection } from "@/components/landing/about-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { AllFeaturesGrid } from "@/components/landing/all-features-grid";
import { CandlesCanvas } from "@/components/landing/candles-canvas";
import { LandingFooter } from "@/components/landing/footer";
import { LandingNav } from "@/components/landing/landing-nav";

const NUNITO = "var(--font-nunito), system-ui, sans-serif";

// ── Page ─────────────────────────────────────────────────────────────────────
export default function HomePage() {
  // Scroll-driven parallax: the hero content drifts down and fades as you scroll
  // into the product section, so the two layers feel like they have depth.
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 110]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    // No overflow class here: overflow-x-hidden disables the sticky header and
    // overflow-x-clip kills page scrolling entirely. Sections that animate
    // horizontally contain their own overflow instead.
    <div style={{ background: "#0B1120" }}>

      {/* ── Top navigation: Features dropdown, Coming soon, Sign in, Make account ── */}
      <LandingNav />

      {/* ── Hero — dark navy background, turquoise + neutral candle visuals ── */}
      {/* 53px = header height (py-4 + text-base logo + 1px border) */}
      <section ref={heroRef} className="relative flex flex-col" style={{ minHeight: "calc(100svh - 53px)" }}>

        {/* Candlestick background */}
        <CandlesCanvas />

        {/* Ambient drifting glow — adds depth behind the headline */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(20,184,166,0.16) 0%, transparent 65%)" }}
          animate={{ scale: [1, 1.18, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 9, ease: "easeInOut", repeat: Infinity }}
        />

        {/* Content — parallax + fade on scroll */}
        <motion.div
          style={{ y: contentY, opacity: contentOpacity }}
          className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 text-center py-20">

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <motion.img
            src="/tradingmc-app-dark.svg"
            alt="TradingMC"
            width={104}
            height={104}
            initial={{ opacity: 0, y: 18, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            className="mb-8 h-24 w-24 sm:h-28 sm:w-28"
            style={{ filter: "drop-shadow(0 8px 30px rgba(20,184,166,0.22))" }}
          />

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay: 0.10 }}
            className="font-black tracking-tight leading-[0.88] mb-6"
            style={{
              fontFamily: NUNITO,
              fontSize: "clamp(2.5rem,8vw,6rem)",
              color: "rgba(248,250,252,0.94)",
            }}
          >
            Trading
            <span style={{
              background: "linear-gradient(135deg,#14B8A6 0%,#06B6D4 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              MC
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay: 0.22 }}
            className="mb-10 max-w-xl leading-relaxed"
            style={{
              fontFamily: NUNITO,
              fontSize: "clamp(1rem,2.4vw,1.2rem)",
              fontWeight: 400,
              letterSpacing: "0.01em",
              color: "rgba(248,250,252,0.60)",
            }}
          >
            Great traders are built beyond the charts. Capture every trade,
            analyze your performance, and develop the habits that drive
            long-term consistency.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay: 0.34 }}
            className="flex flex-wrap items-center justify-center gap-3"
          >
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2.5 rounded-full px-8 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
              style={{
                fontFamily: NUNITO,
                background: "linear-gradient(135deg,#14B8A6 0%,#0D9488 100%)",
                boxShadow: "0 4px 28px rgba(20,184,166,0.40), 0 1px 3px rgba(0,0,0,0.35)",
              }}
            >
              Open dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 rounded-full border px-7 py-3.5 text-sm font-semibold text-[rgba(248,250,252,0.65)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[rgba(20,184,166,0.45)] hover:text-[rgba(248,250,252,0.92)] active:translate-y-0"
              style={{
                fontFamily: NUNITO,
                borderColor: "rgba(248,250,252,0.14)",
                background: "rgba(248,250,252,0.06)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
              }}
            >
              See the platform
              <ArrowDown className="w-3.5 h-3.5" />
            </a>
          </motion.div>
        </motion.div>

      </section>

      <AboutSection />
      <FeaturesSection />
      <AllFeaturesGrid />

      {/* ── Closing CTA band ── */}
      <section className="relative overflow-hidden" style={{ background: "#0B1120" }}>
        <div className="h-px w-full" style={{ background: "rgba(248,250,252,0.08)" }} />
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(20,184,166,0.14) 0%, transparent 68%)" }}
        />
        <div className="relative mx-auto max-w-3xl px-6 py-24 sm:py-32 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="font-black tracking-tight leading-[0.95]"
            style={{ fontFamily: NUNITO, fontSize: "clamp(2rem,6vw,3.6rem)", color: "rgba(248,250,252,0.95)" }}
          >
            Build the trader{" "}
            <span style={{ background: "linear-gradient(135deg,#14B8A6 0%,#06B6D4 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              behind the results.
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className="mt-5 mx-auto max-w-lg leading-relaxed"
            style={{ fontFamily: NUNITO, fontSize: "clamp(1rem,2.4vw,1.15rem)", color: "rgba(248,250,252,0.6)" }}
          >
            Preparation, execution, review and mindset in one place. Start with your next session.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            className="mt-9 flex flex-wrap items-center justify-center gap-3"
          >
            <Link href="/signup" className="inline-flex items-center gap-2.5 rounded-full px-8 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
              style={{ fontFamily: NUNITO, background: "linear-gradient(135deg,#14B8A6 0%,#0D9488 100%)", boxShadow: "0 4px 28px rgba(20,184,166,0.40)" }}>
              Create your account <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-full border px-7 py-3.5 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5"
              style={{ fontFamily: NUNITO, color: "rgba(248,250,252,0.7)", borderColor: "rgba(248,250,252,0.16)", background: "rgba(248,250,252,0.05)" }}>
              Open the dashboard
            </Link>
          </motion.div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
