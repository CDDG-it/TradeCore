"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";

// Exact same warm-white as hero background
const BG = "rgba(249,246,242,1)";

const CARDS = [
  {
    index:   0,
    section: "DAILY",
    name:    "Dashboard",
    route:   "/dashboard",
    desc:    "One view for your entire trading day. Habits, recent trades, funded account status and discipline score — all before the opening bell.",
    cta:     "Open dashboard",
    screenshot: "/screenshots/dashboard.jpg",
  },
  {
    index:   1,
    section: "TRADING",
    name:    "Journal",
    route:   "/journal",
    desc:    "Log every trade with setup, execution quality and session context. Review your full trade history in list or calendar view.",
    cta:     "View journal",
    screenshot: "/screenshots/journal.jpg",
  },
  {
    index:   2,
    section: "TRADING",
    name:    "Analysis",
    route:   "/analysis",
    desc:    "Build structured pre-market analysis notes around bias, key levels and session scenarios before you ever touch the keyboard.",
    cta:     "Review analyses",
    screenshot: "/screenshots/analysis.jpg",
  },
  {
    index:   3,
    section: "TRADING",
    name:    "Analytics",
    route:   "/analytics",
    desc:    "Find patterns in your execution over time. Win rate by session, R-multiples, day-of-week tendencies and discipline trends.",
    cta:     "See analytics",
    screenshot: "/screenshots/analytics.jpg",
  },
  {
    index:   4,
    section: "TRADING",
    name:    "Accounts",
    route:   "/accounts",
    desc:    "Track all funded prop firm accounts in one place. Monitor payouts, ROI multiples, drawdown thresholds and account phases.",
    cta:     "View accounts",
    screenshot: "/screenshots/accounts.jpg",
  },
] as const;

// ── Screenshot frame — no browser chrome, just the app with orange glow ───────
function ScreenshotFrame({ src, alt, eager }: { src: string; alt: string; eager?: boolean }) {
  // Pure CSS hover: no React state, and the glow lives on its own layer whose
  // opacity fades — gradients and stacked shadows can't be interpolated, so
  // transitioning them directly snaps on mouse-leave.
  return (
    <div
      className="group/frame relative w-full overflow-hidden rounded-2xl"
      style={{
        boxShadow: "0 0 0 1.5px rgba(249,115,22,0.22), 0 0 20px rgba(249,115,22,0.08), 0 8px 40px rgba(0,0,0,0.08)",
      }}
    >
      {/* Screenshot — aspect ratio matches 1200×900 crop */}
      <div className="relative w-full" style={{ aspectRatio: "4/3" }}>
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 768px) 100vw, 60vw"
          className="object-cover object-top"
          priority={eager}
        />
      </div>

      {/* Hover glow + rim light, faded in via opacity only */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover/frame:opacity-100"
        style={{
          boxShadow: "inset 0 0 0 2px rgba(249,115,22,0.60)",
          background: "linear-gradient(135deg, rgba(249,115,22,0.05) 0%, transparent 50%)",
        }}
      />
    </div>
  );
}

// ── Single full-height card ────────────────────────────────────────────────────
function FeatureCard({ card }: { card: (typeof CARDS)[number] }) {
  const isEven = card.index % 2 === 0;

  // Screenshot always gets the larger column (3 fr), text gets 2 fr
  const gridCols = isEven
    ? "lg:grid-cols-[2fr_3fr]"
    : "lg:grid-cols-[3fr_2fr]";

  return (
    <div
      className="min-h-screen flex items-center py-24 border-b"
      style={{ borderColor: "rgba(0,0,0,0.06)" }}
    >
      <div className="mx-auto w-full max-w-7xl px-6 sm:px-10">
        <div className={`grid grid-cols-1 ${gridCols} gap-12 lg:gap-20 items-center`}>
          {/* Text side — pushed to second visual position for odd cards */}
          <motion.div
            initial={{ opacity: 0, x: isEven ? -28 : 28 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.70, ease: [0.16, 1, 0.3, 1] }}
            className={`flex flex-col gap-6 ${!isEven ? "lg:order-2" : ""}`}
          >
            {/* Number + section label */}
            <div className="flex items-center gap-3">
              <span
                className="text-xs font-black tabular-nums leading-none"
                style={{
                  fontFamily: "var(--font-nunito), system-ui, sans-serif",
                  color:      "rgba(249,115,22,0.90)",
                }}
              >
                {String(card.index + 1).padStart(2, "0")}
              </span>
              <span
                className="h-px flex-1 max-w-[24px]"
                style={{ background: "rgba(249,115,22,0.30)" }}
              />
              <span
                style={{
                  fontFamily:    "var(--font-nunito), system-ui, sans-serif",
                  fontSize:      "0.625rem",
                  fontWeight:    700,
                  textTransform: "uppercase" as const,
                  letterSpacing: "0.18em",
                  color:         "rgba(60,48,36,0.40)",
                }}
              >
                {card.section}
              </span>
            </div>

            {/* Page name */}
            <h2
              className="font-black tracking-tight leading-[0.92]"
              style={{
                fontFamily: "var(--font-nunito), system-ui, sans-serif",
                fontSize:   "clamp(2.8rem, 5vw, 4.8rem)",
                color:      "rgba(15,12,8,0.90)",
              }}
            >
              {card.name}
            </h2>

            {/* Description */}
            <p
              className="leading-relaxed max-w-md"
              style={{
                fontFamily: "var(--font-nunito), system-ui, sans-serif",
                fontSize:   "clamp(0.95rem, 1.5vw, 1.05rem)",
                fontWeight: 400,
                color:      "rgba(60,48,36,0.55)",
              }}
            >
              {card.desc}
            </p>

            {/* CTA */}
            <Link
              href={card.route}
              className="self-start inline-flex items-center gap-2.5 rounded-full px-7 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
              style={{
                fontFamily: "var(--font-nunito), system-ui, sans-serif",
                background: "linear-gradient(135deg,#F97316 0%,#d97706 100%)",
                boxShadow:  "0 4px 24px rgba(249,115,22,0.28), 0 1px 3px rgba(0,0,0,0.10)",
              }}
            >
              {card.cta}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </motion.div>

          {/* Screenshot side */}
          <motion.div
            initial={{ opacity: 0, x: isEven ? 28 : -28 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.70, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
            className={!isEven ? "lg:order-1" : ""}
          >
            <ScreenshotFrame
              src={card.screenshot}
              alt={`${card.name} page screenshot`}
              eager={card.index === 0}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// ── Section ────────────────────────────────────────────────────────────────────
export function ProductPreview() {
  return (
    <section id="product" style={{ background: BG }} className="overflow-x-hidden scroll-mt-14">
      {/* Top border matching hero bottom strip */}
      <div
        className="h-px w-full"
        style={{ background: "rgba(0,0,0,0.06)" }}
      />

      {/* Section intro */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        className="text-center px-6 pt-24 pb-4"
      >
        <p
          style={{
            fontFamily:    "var(--font-nunito), system-ui, sans-serif",
            fontSize:      "0.625rem",
            fontWeight:    700,
            textTransform: "uppercase",
            letterSpacing: "0.20em",
            color:         "rgba(60,48,36,0.40)",
          }}
        >
          The workspace
        </p>
        <h2
          className="mt-3 font-black tracking-tight leading-[0.92]"
          style={{
            fontFamily: "var(--font-nunito), system-ui, sans-serif",
            fontSize:   "clamp(2rem, 5vw, 3rem)",
            color:      "rgba(15,12,8,0.88)",
          }}
        >
          Five tools. One platform.
        </h2>
        <p
          className="mt-4 mx-auto max-w-sm leading-relaxed"
          style={{
            fontFamily: "var(--font-nunito), system-ui, sans-serif",
            fontSize:   "0.9rem",
            color:      "rgba(60,48,36,0.50)",
          }}
        >
          Built around the way funded traders actually work — from pre-market prep to end-of-day review.
        </p>
      </motion.div>

      {/* Feature cards */}
      {CARDS.map((card) => (
        <FeatureCard key={card.route} card={card} />
      ))}

      {/* Footer strip */}
      <div
        className="px-6 py-10 border-t"
        style={{ borderColor: "rgba(0,0,0,0.07)" }}
      >
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link
            href="/"
            className="font-black text-sm tracking-tight leading-none hover:opacity-70 transition-opacity"
            style={{ fontFamily: "var(--font-nunito), system-ui, sans-serif" }}
          >
            <span style={{ color: "rgba(15,12,8,0.85)" }}>Trade</span>
            <span
              style={{
                background:            "linear-gradient(90deg,#F97316,#d97706)",
                WebkitBackgroundClip:  "text",
                WebkitTextFillColor:   "transparent",
                backgroundClip:        "text",
              }}
            >
              CORE
            </span>
          </Link>
          <p className="text-xs" style={{ color: "rgba(60,48,36,0.38)" }}>
            Where self-improvement meets trading.
          </p>
          <Link
            href="/dashboard"
            className="text-xs font-semibold text-[rgba(249,115,22,0.80)] transition-colors duration-200 hover:text-[#F97316]"
            style={{ fontFamily: "var(--font-nunito), system-ui, sans-serif" }}
          >
            Get started →
          </Link>
        </div>
      </div>
    </section>
  );
}
