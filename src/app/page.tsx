"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowRight, ArrowDown } from "lucide-react";
import { motion, useScroll, useTransform } from "motion/react";
import { ProductPreview } from "@/components/landing/product-preview";
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

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay: 0.10 }}
            className="font-black tracking-tight leading-[0.88] mb-6"
            style={{
              fontFamily: NUNITO,
              fontSize: "clamp(3.5rem,11vw,9rem)",
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
              href="#product"
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

      <ProductPreview />
      <LandingFooter />
    </div>
  );
}
