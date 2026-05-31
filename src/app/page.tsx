"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  Activity,
  ArrowRightCircle,
  BookOpen,
  CandlestickChart,
  CheckCircle2,
  Clock3,
  LineChart,
  Menu,
  SearchCheck,
  ShieldCheck,
  WalletCards,
  X,
} from "lucide-react";

// ── Constants ─────────────────────────────────────────────────────────────────
const GOLD = "#D6B46A";

const NAV_LINKS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Journal", href: "/journal" },
  { label: "Analysis", href: "/analysis" },
  { label: "Analytics", href: "/analytics" },
  { label: "Accounts", href: "/accounts" },
];

const MOBILE_LINKS = [
  ...NAV_LINKS,
  { label: "Settings", href: "/settings" },
];

const FEATURE_PILLS = [
  { icon: BookOpen, label: "Journal" },
  { icon: SearchCheck, label: "Analysis" },
  { icon: WalletCards, label: "Funded Accounts" },
];

const STAT_CARDS = [
  { label: "Total Trades", value: "0" },
  { label: "Active Capital", value: "—" },
  { label: "Discipline Score", value: "—" },
];

const DASHBOARD_TABS = ["Dashboard", "Journal", "Analysis", "Analytics", "Accounts"];

// ── Animation variants ────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.12,
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
};

// ── Shared style helpers ──────────────────────────────────────────────────────
const glassBase: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
};

const glassBorder = "border border-white/10";

// ── Component ─────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-[#050505] text-[#F5F2EA]">

      {/* ── Background video ──────────────────────────────────────────────── */}
      <video
        autoPlay
        muted
        loop
        playsInline
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover"
      >
        <source
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260518_003132_8b7edcb6-c64d-4a52-a9ca-879942e122ad.mp4"
          type="video/mp4"
        />
      </video>

      {/* ── Overlays ─────────────────────────────────────────────────────── */}
      <div className="absolute inset-0 bg-black/65" aria-hidden />
      <div
        className="absolute inset-0"
        aria-hidden
        style={{
          background:
            "linear-gradient(to bottom, #050505 0%, transparent 20%, transparent 80%, #050505 100%)",
        }}
      />
      {/* Gold radial glow top-left */}
      <div
        className="absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 55% 45% at -5% 0%, rgba(214,180,106,0.13) 0%, transparent 65%)",
        }}
      />

      {/* ── Page shell ───────────────────────────────────────────────────── */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col px-5 sm:px-8">

        {/* ── Navbar ───────────────────────────────────────────────────────── */}
        <nav className="flex items-center justify-between py-5">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10"
              style={{ background: "rgba(214,180,106,0.10)" }}
            >
              <CandlestickChart className="h-4 w-4" style={{ color: GOLD }} />
            </span>
            <span
              className="text-sm font-black tracking-tight leading-none"
              style={{ fontFamily: "var(--font-nunito), system-ui, sans-serif" }}
            >
              <span className="text-white">Trade</span>
              <span style={{ color: GOLD }}>CORE</span>
            </span>
          </Link>

          {/* Desktop center nav */}
          <ul className="hidden md:flex items-center gap-0.5">
            {NAV_LINKS.map((l) => (
              <li key={l.label}>
                <Link
                  href={l.href}
                  className="px-3.5 py-1.5 rounded-full text-sm text-white/50 transition-colors hover:text-white/85 hover:bg-white/[0.06]"
                  style={{ fontFamily: "var(--font-barlow), system-ui, sans-serif" }}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Desktop right actions */}
          <div className="hidden md:flex items-center gap-2">
            <Link
              href="/login"
              className={`px-4 py-2 rounded-full text-sm text-white/60 ${glassBorder} transition-all hover:border-white/20 hover:text-white/85`}
              style={{
                fontFamily: "var(--font-barlow), system-ui, sans-serif",
                fontWeight: 500,
                ...glassBase,
              }}
            >
              Sign in
            </Link>
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-full text-sm font-semibold text-black transition-all hover:brightness-110 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                fontFamily: "var(--font-barlow), system-ui, sans-serif",
                background: GOLD,
                boxShadow: `0 4px 20px rgba(214,180,106,0.32)`,
              }}
            >
              Open dashboard
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className={`md:hidden flex items-center justify-center w-9 h-9 rounded-full ${glassBorder} text-white/60 hover:text-white hover:border-white/20 transition-all`}
            style={glassBase}
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </button>
        </nav>

        {/* ── Mobile menu backdrop ─────────────────────────────────────────── */}
        <AnimatePresence>
          {menuOpen && (
            <>
              <motion.div
                key="backdrop"
                className="fixed inset-0 z-40 md:hidden bg-black/40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMenuOpen(false)}
              />
              <motion.aside
                key="mobile-menu"
                className="fixed inset-y-0 right-0 z-50 flex w-72 flex-col p-6 md:hidden"
                initial={{ opacity: 0, x: "100%" }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: "100%" }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  background: "rgba(7,6,5,0.97)",
                  backdropFilter: "blur(24px)",
                  WebkitBackdropFilter: "blur(24px)",
                  borderLeft: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                {/* Menu header */}
                <div className="flex items-center justify-between mb-7">
                  <span
                    className="text-sm font-black tracking-tight"
                    style={{ fontFamily: "var(--font-nunito), system-ui, sans-serif" }}
                  >
                    <span className="text-white">Trade</span>
                    <span style={{ color: GOLD }}>CORE</span>
                  </span>
                  <button
                    onClick={() => setMenuOpen(false)}
                    className="p-1.5 rounded-full text-white/45 hover:text-white transition-colors"
                    aria-label="Close menu"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Menu links */}
                <nav className="flex flex-col gap-0.5">
                  {MOBILE_LINKS.map((l) => (
                    <Link
                      key={l.label}
                      href={l.href}
                      onClick={() => setMenuOpen(false)}
                      className="px-4 py-3 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/[0.06] transition-colors"
                      style={{ fontFamily: "var(--font-barlow), system-ui, sans-serif" }}
                    >
                      {l.label}
                    </Link>
                  ))}
                </nav>

                {/* Bottom actions */}
                <div className="mt-auto pt-4 flex flex-col gap-2">
                  <Link
                    href="/login"
                    onClick={() => setMenuOpen(false)}
                    className={`w-full text-center rounded-full px-4 py-2.5 text-sm text-white/60 ${glassBorder} hover:border-white/20 transition-all`}
                    style={{
                      fontFamily: "var(--font-barlow), system-ui, sans-serif",
                      background: "rgba(255,255,255,0.04)",
                    }}
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="w-full text-center rounded-full px-4 py-2.5 text-sm font-semibold text-black transition-all hover:brightness-110"
                    style={{
                      fontFamily: "var(--font-barlow), system-ui, sans-serif",
                      background: GOLD,
                    }}
                  >
                    Open dashboard
                  </Link>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* ── Hero content ─────────────────────────────────────────────────── */}
        <div className="flex flex-1 items-center">
          <div className="w-full grid grid-cols-1 gap-10 py-16 lg:grid-cols-2 lg:gap-20 lg:py-0">

            {/* ── Left: Copy ────────────────────────────────────────────────── */}
            <div className="flex flex-col justify-center">

              {/* Badge */}
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={0}
              >
                <span
                  className={`inline-flex items-center gap-2 rounded-full ${glassBorder} bg-white/5 px-4 py-2 text-sm text-white/65 backdrop-blur-md`}
                  style={{ fontFamily: "var(--font-barlow), system-ui, sans-serif" }}
                >
                  <Activity className="h-3.5 w-3.5 shrink-0" style={{ color: GOLD }} />
                  Personal trading command center
                </span>
              </motion.div>

              {/* Heading */}
              <motion.h1
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={1}
                className="mt-6 leading-[0.88] tracking-[-0.045em]"
                style={{
                  fontFamily: "var(--font-instrument-serif), Georgia, serif",
                  fontSize: "clamp(3.2rem, 7.5vw, 7.5rem)",
                  maxWidth: "18ch",
                }}
              >
                Build discipline around{" "}
                <span style={{ color: GOLD }}>every trade.</span>
              </motion.h1>

              {/* Subtext */}
              <motion.p
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={2}
                className="mt-6 max-w-[42ch] text-base leading-relaxed text-white/55"
                style={{
                  fontFamily: "var(--font-barlow), system-ui, sans-serif",
                  fontWeight: 300,
                }}
              >
                TradeCore brengt je journal, pre-trade analysis, funded accounts,
                analytics en discipline routines samen in één gefocust dashboard
                voor futures traders.
              </motion.p>

              {/* CTA row */}
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={3}
                className="mt-8 flex flex-wrap items-center gap-3"
              >
                {/* Primary */}
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-black transition-all hover:brightness-110 hover:scale-[1.03] active:scale-[0.98]"
                  style={{
                    fontFamily: "var(--font-barlow), system-ui, sans-serif",
                    background: GOLD,
                    boxShadow: `0 4px 28px rgba(214,180,106,0.38)`,
                  }}
                >
                  <ArrowRightCircle className="h-4 w-4 shrink-0" />
                  Open dashboard
                </Link>

                {/* Secondary */}
                <Link
                  href="/dashboard"
                  className={`inline-flex items-center gap-2 rounded-full ${glassBorder} px-6 py-3 text-sm text-white/60 backdrop-blur-sm transition-all hover:border-[rgba(214,180,106,0.30)] hover:text-white/80`}
                  style={{
                    fontFamily: "var(--font-barlow), system-ui, sans-serif",
                    background: "rgba(255,255,255,0.04)",
                  }}
                >
                  <LineChart className="h-4 w-4 shrink-0" />
                  View workflow
                </Link>
              </motion.div>

              {/* Feature pills */}
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={4}
                className="mt-5 flex flex-wrap items-center gap-2"
              >
                {FEATURE_PILLS.map(({ icon: Icon, label }) => (
                  <span
                    key={label}
                    className={`inline-flex items-center gap-1.5 rounded-full ${glassBorder} px-3 py-1.5 text-xs text-white/50 backdrop-blur-sm`}
                    style={{ background: "rgba(255,255,255,0.03)" }}
                  >
                    <Icon className="h-3 w-3 shrink-0" style={{ color: GOLD, opacity: 0.8 }} />
                    {label}
                  </span>
                ))}
              </motion.div>
            </div>

            {/* ── Right: Dashboard preview ───────────────────────────────────── */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={5}
              className="relative hidden lg:flex items-center justify-center"
            >

              {/* Floating card 1 — Pre-trade checklist (top-left) */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
                className={`absolute -top-6 -left-8 z-10 flex items-center gap-2.5 rounded-2xl ${glassBorder} px-4 py-3 text-xs backdrop-blur-md`}
                style={{ background: "rgba(255,255,255,0.07)" }}
              >
                <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: GOLD }} />
                <div>
                  <div
                    className="text-white/80 leading-none mb-0.5"
                    style={{ fontFamily: "var(--font-barlow), system-ui, sans-serif", fontWeight: 500 }}
                  >
                    Pre-trade checklist
                  </div>
                  <div className="text-white/40" style={{ fontFamily: "var(--font-barlow), system-ui, sans-serif" }}>
                    3 rules confirmed
                  </div>
                </div>
              </motion.div>

              {/* Floating card 2 — Risk focus (bottom-left) */}
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 5.4, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
                className={`absolute -bottom-4 -left-6 z-10 flex items-center gap-2.5 rounded-2xl ${glassBorder} px-4 py-3 text-xs backdrop-blur-md`}
                style={{ background: "rgba(255,255,255,0.07)" }}
              >
                <ShieldCheck className="h-4 w-4 shrink-0" style={{ color: GOLD }} />
                <div>
                  <div
                    className="text-white/80 leading-none mb-0.5"
                    style={{ fontFamily: "var(--font-barlow), system-ui, sans-serif", fontWeight: 500 }}
                  >
                    Risk focus
                  </div>
                  <div className="text-white/40" style={{ fontFamily: "var(--font-barlow), system-ui, sans-serif" }}>
                    No overtrading
                  </div>
                </div>
              </motion.div>

              {/* Floating card 3 — Session (top-right) */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                className={`absolute -top-4 -right-6 z-10 flex items-center gap-2.5 rounded-2xl ${glassBorder} px-4 py-3 text-xs backdrop-blur-md`}
                style={{ background: "rgba(255,255,255,0.07)" }}
              >
                <Clock3 className="h-4 w-4 shrink-0" style={{ color: GOLD }} />
                <div>
                  <div
                    className="text-white/80 leading-none mb-0.5"
                    style={{ fontFamily: "var(--font-barlow), system-ui, sans-serif", fontWeight: 500 }}
                  >
                    Session
                  </div>
                  <div className="text-white/40" style={{ fontFamily: "var(--font-barlow), system-ui, sans-serif" }}>
                    NY Open
                  </div>
                </div>
              </motion.div>

              {/* ── Main mockup card ───────────────────── */}
              <div
                className={`w-full max-w-md rounded-3xl ${glassBorder} p-5 backdrop-blur-xl`}
                style={{ background: "rgba(255,255,255,0.05)" }}
              >
                {/* Card header */}
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <div
                      className="text-sm font-semibold text-white/90 leading-none"
                      style={{ fontFamily: "var(--font-nunito), system-ui, sans-serif" }}
                    >
                      Command Center
                    </div>
                    <div
                      className="text-[11px] text-white/35 mt-1"
                      style={{ fontFamily: "var(--font-barlow), system-ui, sans-serif" }}
                    >
                      Sunday, May 31
                    </div>
                  </div>
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/[0.08]"
                    style={{ background: "rgba(214,180,106,0.10)" }}
                  >
                    <CandlestickChart className="h-4 w-4" style={{ color: GOLD }} />
                  </span>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {STAT_CARDS.map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-xl border border-white/[0.07] p-3"
                      style={{ background: "rgba(255,255,255,0.03)" }}
                    >
                      <div
                        className="text-[10px] text-white/30 leading-none mb-2"
                        style={{ fontFamily: "var(--font-barlow), system-ui, sans-serif" }}
                      >
                        {stat.label}
                      </div>
                      <div
                        className="text-xl font-bold text-white/65 leading-none"
                        style={{ fontFamily: "var(--font-nunito), system-ui, sans-serif" }}
                      >
                        {stat.value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Weekly section */}
                <div
                  className="rounded-xl border border-white/[0.07] p-3 mb-3"
                  style={{ background: "rgba(255,255,255,0.03)" }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="text-[11px] font-semibold text-white/55"
                      style={{ fontFamily: "var(--font-barlow), system-ui, sans-serif" }}
                    >
                      This week
                    </span>
                    <span
                      className="text-[10px] text-white/22"
                      style={{ fontFamily: "var(--font-barlow), system-ui, sans-serif" }}
                    >
                      May 25 – 31
                    </span>
                  </div>
                  <p
                    className="text-xs text-white/28 italic"
                    style={{ fontFamily: "var(--font-barlow), system-ui, sans-serif" }}
                  >
                    No trades logged yet.
                  </p>
                </div>

                {/* Tab row */}
                <div
                  className="flex items-center gap-1 rounded-xl border border-white/[0.07] p-1"
                  style={{ background: "rgba(255,255,255,0.02)" }}
                >
                  {DASHBOARD_TABS.map((tab) => (
                    <span
                      key={tab}
                      className="flex-1 text-center rounded-lg py-1.5 transition-colors"
                      style={{
                        fontFamily: "var(--font-barlow), system-ui, sans-serif",
                        fontSize: "9px",
                        ...(tab === "Dashboard"
                          ? { background: GOLD, color: "#000", fontWeight: 700 }
                          : { color: "rgba(255,255,255,0.32)" }),
                      }}
                    >
                      {tab}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </section>
  );
}
