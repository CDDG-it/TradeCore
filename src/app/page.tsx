"use client";

import Link from "next/link";
import { ArrowRight, ArrowDown, NotebookPen, Compass, BarChart3, Landmark } from "lucide-react";
import { FadeIn } from "@/components/ui/fade-in";
import { motion } from "motion/react";
import { ProductPreview } from "@/components/landing/product-preview";
import { CandlesCanvas } from "@/components/landing/candles-canvas";
import { CursorTrail } from "@/components/landing/cursor-trail";
import { LandingFooter } from "@/components/landing/footer";

const NUNITO = "var(--font-nunito), system-ui, sans-serif";

// ── Feature pillars — mirror the tools shown in the product preview ──────────
const PILLARS = [
  { icon: NotebookPen, label: "Trade Journal", desc: "Log every trade with full context", href: "/journal" },
  { icon: Compass, label: "Pre-Market Analysis", desc: "Structured prep before the bell", href: "/analysis" },
  { icon: BarChart3, label: "Performance Analytics", desc: "Find patterns in your execution", href: "/analytics" },
  { icon: Landmark, label: "Funded Accounts", desc: "Payouts, ROI and drawdown in view", href: "/accounts" },
] as const;

// ── Page ─────────────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    // No overflow class here: overflow-x-hidden disables the sticky header and
    // overflow-x-clip kills page scrolling entirely. Sections that animate
    // horizontally contain their own overflow instead.
    <div style={{ background: "oklch(0.98 0.003 45)" }}>
      {/* Orange line that follows the cursor across the whole page */}
      <CursorTrail />

      {/* ── Light glass header ── */}
      <header
        className="sticky top-0 z-20 px-6 py-4"
        style={{
          background: "rgba(249,246,242,0.88)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(0,0,0,0.07)",
        }}
      >
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <span
            className="font-black tracking-tight text-base leading-none"
            style={{ fontFamily: NUNITO }}
          >
            <span style={{ color: "rgba(15,12,8,0.88)" }}>Trade</span>
            <span style={{ background: "linear-gradient(90deg,#F97316,#d97706)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>CORE</span>
          </span>
          <Link
            href="/login"
            className="text-sm font-semibold text-[rgba(60,48,36,0.45)] transition-colors duration-200 hover:text-[rgba(15,12,8,0.85)]"
            style={{ fontFamily: NUNITO }}
          >
            Sign in
          </Link>
        </div>
      </header>

      {/* ── Hero — light background, orange + black candle visuals ── */}
      {/* 53px = header height (py-4 + text-base logo + 1px border) */}
      <section className="relative flex flex-col" style={{ minHeight: "calc(100svh - 53px)" }}>

        {/* Candlestick background */}
        <CandlesCanvas />

        {/* Content */}
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 text-center py-20">

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay: 0.10 }}
            className="font-black tracking-tight leading-[0.88] mb-6"
            style={{
              fontFamily: NUNITO,
              fontSize: "clamp(3.5rem,11vw,9rem)",
              color: "rgba(15,12,8,0.90)",
            }}
          >
            Trade
            <span style={{
              background: "linear-gradient(135deg,#F97316 0%,#d97706 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              core
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
              color: "rgba(60,48,36,0.55)",
            }}
          >
            Every trade logged. Every session prepped. Every payout tracked.
            The quiet work that separates funded traders from former ones.
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
                background: "linear-gradient(135deg,#F97316 0%,#d97706 100%)",
                boxShadow: "0 4px 28px rgba(249,115,22,0.35), 0 1px 3px rgba(0,0,0,0.12)",
              }}
            >
              Open dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#product"
              className="inline-flex items-center gap-2 rounded-full border px-7 py-3.5 text-sm font-semibold text-[rgba(60,48,36,0.60)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[rgba(249,115,22,0.45)] hover:text-[rgba(15,12,8,0.85)] active:translate-y-0"
              style={{
                fontFamily: NUNITO,
                borderColor: "rgba(16,11,6,0.14)",
                background: "rgba(249,246,242,0.65)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
              }}
            >
              See the platform
              <ArrowDown className="w-3.5 h-3.5" />
            </a>
          </motion.div>
        </div>

        {/* ── Feature strip — anchored to bottom ── */}
        <FadeIn delay={0.44}>
          <div
            className="relative z-10 border-t"
            style={{ borderColor: "rgba(0,0,0,0.08)" }}
          >
            <div className="mx-auto max-w-5xl grid grid-cols-2 lg:grid-cols-4">
              {PILLARS.map((p, i) => (
                <Link
                  key={p.label}
                  href={p.href}
                  className={`group relative px-6 py-6 text-left transition-colors duration-300 hover:bg-[rgba(249,115,22,0.05)] ${i > 0 ? "border-l" : ""} ${i >= 2 ? "max-lg:border-t lg:border-t-0" : ""} ${i === 2 ? "max-lg:border-l-0" : ""}`}
                  style={{ borderColor: "rgba(0,0,0,0.08)" }}
                >
                  {/* Orange accent line that grows in from the left on hover */}
                  <span
                    className="absolute left-0 top-0 h-[2px] w-0 transition-all duration-300 ease-out group-hover:w-full"
                    style={{ background: "linear-gradient(90deg,#F97316,#d97706)" }}
                  />
                  <div className="mb-2.5 flex items-center justify-between">
                    <p.icon
                      className="h-[18px] w-[18px] text-[rgba(60,48,36,0.40)] transition-all duration-300 group-hover:scale-110 group-hover:text-[#F97316]"
                      strokeWidth={1.75}
                    />
                    <ArrowRight className="h-3.5 w-3.5 -translate-x-1 text-[#F97316] opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
                  </div>
                  <p
                    className="text-sm font-bold mb-0.5 transition-colors duration-300"
                    style={{ fontFamily: NUNITO, color: "rgba(15,12,8,0.78)" }}
                  >
                    {p.label}
                  </p>
                  <p
                    className="text-xs leading-snug"
                    style={{ fontFamily: NUNITO, color: "rgba(60,48,36,0.48)" }}
                  >
                    {p.desc}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </FadeIn>

      </section>

      <ProductPreview />
      <LandingFooter />
    </div>
  );
}
