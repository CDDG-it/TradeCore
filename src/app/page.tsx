import Link from "next/link";
import {
  BookOpen,
  BarChart2,
  Wallet,
  ArrowRight,
  TrendingUp,
  ChevronRight,
  Flame,
  CheckSquare,
  Zap,
} from "lucide-react";
import { Logo, LogoMark } from "@/components/logo";

const features = [
  {
    icon: BookOpen,
    title: "Trade Journal",
    description:
      "Log every trade with R:R, psychology notes, and screenshots. Build a systematic record of your edge.",
    accentClass: "text-ice",
    glowStyle: { background: "oklch(0.72 0.14 220 / 0.10)" },
    borderStyle: { borderColor: "oklch(0.72 0.14 220 / 0.20)" },
    iconGlowStyle: { color: "oklch(0.72 0.14 220)" },
    href: "/journal",
  },
  {
    icon: TrendingUp,
    title: "Pre-Trade Analysis",
    description:
      "Write structured pre-market analysis with bias, long and short scenarios before every trade.",
    accentClass: "text-gold",
    glowStyle: { background: "oklch(0.74 0.13 82 / 0.10)" },
    borderStyle: { borderColor: "oklch(0.74 0.13 82 / 0.20)" },
    iconGlowStyle: { color: "oklch(0.74 0.13 82)" },
    href: "/analysis",
  },
  {
    icon: BarChart2,
    title: "Performance Analytics",
    description:
      "Visualise win rate, R:R distribution, and equity curve. Know exactly where your edge lives.",
    accentClass: "text-ice",
    glowStyle: { background: "oklch(0.72 0.14 220 / 0.10)" },
    borderStyle: { borderColor: "oklch(0.72 0.14 220 / 0.20)" },
    iconGlowStyle: { color: "oklch(0.72 0.14 220)" },
    href: "/analytics",
  },
  {
    icon: Wallet,
    title: "Funded Accounts",
    description:
      "Monitor real ROI, drawdown, and payout progress across all your prop firm accounts.",
    accentClass: "text-gold",
    glowStyle: { background: "oklch(0.74 0.13 82 / 0.10)" },
    borderStyle: { borderColor: "oklch(0.74 0.13 82 / 0.20)" },
    iconGlowStyle: { color: "oklch(0.74 0.13 82)" },
    href: "/accounts",
  },
  {
    icon: CheckSquare,
    title: "Habit Tracker",
    description:
      "Build elite daily routines. Track streaks, check off habits, and compound the disciplines that matter.",
    accentClass: "text-success",
    glowStyle: { background: "oklch(0.58 0.17 145 / 0.10)" },
    borderStyle: { borderColor: "oklch(0.58 0.17 145 / 0.20)" },
    iconGlowStyle: { color: "oklch(0.58 0.17 145)" },
    href: "/habits",
  },
  {
    icon: Zap,
    title: "Market News",
    description:
      "Curated high-impact news for futures and commodities traders, filtered by market and impact level.",
    accentClass: "text-warning",
    glowStyle: { background: "oklch(0.70 0.16 72 / 0.10)" },
    borderStyle: { borderColor: "oklch(0.70 0.16 72 / 0.20)" },
    iconGlowStyle: { color: "oklch(0.70 0.16 72)" },
    href: "/news",
  },
];

const stats = [
  { value: "4.2R", label: "Avg risk-reward tracked" },
  { value: "67%", label: "Win rate visibility" },
  { value: "100%", label: "Your data, your device" },
  { value: "0", label: "Setup required" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ── Ambient background glows ──────────────── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        {/* Ice blue top-left glow */}
        <div
          className="absolute -top-48 -left-48 w-[700px] h-[700px] rounded-full"
          style={{
            background: "radial-gradient(circle, oklch(0.72 0.14 220 / 0.08), transparent 65%)",
          }}
        />
        {/* Gold bottom-right glow */}
        <div
          className="absolute -bottom-48 -right-32 w-[800px] h-[800px] rounded-full"
          style={{
            background: "radial-gradient(circle, oklch(0.74 0.13 82 / 0.07), transparent 65%)",
          }}
        />
        {/* Center subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(oklch(0.72 0.14 220 / 0.4) 1px, transparent 1px), linear-gradient(90deg, oklch(0.72 0.14 220 / 0.4) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      {/* ── Header ───────────────────────────────── */}
      <header
        className="relative z-10 px-6 py-4 sticky top-0"
        style={{
          background: "oklch(0.08 0.014 252 / 0.85)",
          borderBottom: "1px solid oklch(1 0 0 / 6%)",
          backdropFilter: "blur(16px)",
        }}
      >
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <Logo variant="dark" size={28} />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all hover:-translate-y-px"
              style={{
                background: "oklch(0.72 0.14 220)",
                color: "oklch(0.08 0.014 252)",
                boxShadow: "0 4px 16px oklch(0.72 0.14 220 / 0.30)",
              }}
            >
              Open app
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────── */}
      <section className="relative z-10 px-6 pt-24 pb-28 text-center">
        <div className="mx-auto max-w-3xl">
          {/* Pill badge */}
          <div
            className="animate-fade-up inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold mb-12"
            style={{
              background: "oklch(0.74 0.13 82 / 0.10)",
              border: "1px solid oklch(0.74 0.13 82 / 0.30)",
              color: "oklch(0.74 0.13 82)",
              animationDelay: "0ms",
            }}
          >
            <Flame className="w-3 h-3" />
            Built for futures and commodities traders
          </div>

          {/* Floating logo mark */}
          <div
            className="animate-fade-up animate-float flex justify-center mb-10"
            style={{ animationDelay: "80ms" }}
          >
            <LogoMark variant="dark" size={88} />
          </div>

          {/* Wordmark headline */}
          <h1
            className="animate-fade-up text-7xl sm:text-8xl font-extrabold tracking-tight leading-none mb-5"
            style={{ animationDelay: "160ms" }}
          >
            <span style={{ color: "oklch(0.93 0.008 252)" }}>Trade</span>
            <span className="animate-shimmer-gold">On</span>
          </h1>

          <p
            className="animate-fade-up text-xl font-light mb-4"
            style={{
              animationDelay: "240ms",
              color: "oklch(0.72 0.06 252)",
            }}
          >
            Your edge,{" "}
            <span
              className="font-semibold"
              style={{ color: "oklch(0.93 0.008 252)" }}
            >
              organized.
            </span>
          </p>

          <p
            className="animate-fade-up text-base max-w-lg mx-auto mb-14 leading-relaxed"
            style={{
              animationDelay: "300ms",
              color: "oklch(0.55 0.04 252)",
            }}
          >
            A premium trading productivity platform. Journal trades, analyse setups, track funded
            accounts, build habits — all in one focused workspace.
          </p>

          <div
            className="animate-fade-up flex flex-col sm:flex-row items-center justify-center gap-3"
            style={{ animationDelay: "380ms" }}
          >
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-sm font-semibold transition-all hover:-translate-y-0.5"
              style={{
                background: "oklch(0.72 0.14 220)",
                color: "oklch(0.08 0.014 252)",
                boxShadow: "0 4px 24px oklch(0.72 0.14 220 / 0.35)",
              }}
            >
              Enter dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-sm font-medium transition-all hover:border-opacity-60"
              style={{
                border: "1px solid oklch(1 0 0 / 12%)",
                color: "oklch(0.65 0.04 252)",
                background: "oklch(1 0 0 / 3%)",
              }}
            >
              Sign in to your account
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats bar ─────────────────────────────── */}
      <section
        className="relative z-10 px-6 py-12"
        style={{ borderTop: "1px solid oklch(1 0 0 / 6%)", borderBottom: "1px solid oklch(1 0 0 / 6%)" }}
      >
        <div className="mx-auto max-w-4xl grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className="animate-fade-up text-center"
              style={{ animationDelay: `${400 + i * 80}ms` }}
            >
              <div
                className="text-4xl font-black mb-1.5 tabular-nums animate-shimmer-gold"
              >
                {s.value}
              </div>
              <div
                className="text-xs leading-snug"
                style={{ color: "oklch(0.50 0.04 252)" }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ──────────────────────────────── */}
      <section className="relative z-10 px-6 py-28">
        <div className="mx-auto max-w-6xl">
          <div
            className="animate-fade-up text-center mb-16"
            style={{ animationDelay: "500ms" }}
          >
            <h2
              className="text-4xl font-bold tracking-tight mb-3 leading-tight"
            >
              Everything you need.{" "}
              <span style={{ color: "oklch(0.40 0.04 252)", fontWeight: 400 }}>Nothing you don&apos;t.</span>
            </h2>
            <p
              className="text-sm max-w-sm mx-auto"
              style={{ color: "oklch(0.50 0.04 252)" }}
            >
              Built around the actual workflow of a disciplined trader — from pre-market to post-trade review.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map(({ icon: Icon, title, description, accentClass, glowStyle, borderStyle, iconGlowStyle, href }, i) => (
              <Link
                key={title}
                href={href}
                className="animate-fade-up group rounded-2xl p-6 block relative overflow-hidden transition-all duration-300 hover:-translate-y-1.5 cursor-pointer"
                style={{
                  background: "oklch(0.12 0.018 252)",
                  border: "1px solid oklch(0.22 0.025 252)",
                  animationDelay: `${560 + i * 60}ms`,
                }}
              >
                {/* Top border glow on hover */}
                <div
                  className="absolute inset-x-0 top-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${Object.values(borderStyle)[0].replace('0.20', '0.60')}, transparent)`,
                  }}
                />

                {/* Background glow on hover */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
                  style={glowStyle}
                />

                {/* Icon */}
                <div
                  className="relative w-11 h-11 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
                  style={glowStyle}
                >
                  <Icon className="w-5 h-5" style={iconGlowStyle} />
                </div>

                <h3
                  className="relative font-bold text-sm mb-2.5 transition-colors"
                  style={{ color: "oklch(0.90 0.008 252)" }}
                >
                  {title}
                </h3>
                <p
                  className="relative text-xs leading-relaxed mb-5"
                  style={{ color: "oklch(0.50 0.04 252)" }}
                >
                  {description}
                </p>
                <div
                  className={`relative inline-flex items-center gap-1 text-xs font-semibold ${accentClass} opacity-0 group-hover:opacity-100 transition-all duration-200 -translate-x-1 group-hover:translate-x-0`}
                >
                  Open <ChevronRight className="w-3 h-3" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Quick links bar ───────────────────────── */}
      <section className="relative z-10 px-6 pb-20">
        <div className="mx-auto max-w-4xl">
          <div
            className="rounded-2xl p-6"
            style={{
              background: "oklch(0.11 0.016 252)",
              border: "1px solid oklch(0.74 0.13 82 / 0.15)",
              boxShadow: "0 0 40px oklch(0.74 0.13 82 / 0.05)",
            }}
          >
            <p
              className="text-xs text-center mb-5 uppercase tracking-widest font-semibold"
              style={{ color: "oklch(0.74 0.13 82 / 0.70)" }}
            >
              Jump straight in
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  href: "/journal/new",
                  label: "Log a Trade",
                  icon: BookOpen,
                  style: { color: "oklch(0.72 0.14 220)", bg: "oklch(0.72 0.14 220 / 0.10)" },
                },
                {
                  href: "/analysis/new",
                  label: "New Analysis",
                  icon: TrendingUp,
                  style: { color: "oklch(0.74 0.13 82)", bg: "oklch(0.74 0.13 82 / 0.10)" },
                },
                {
                  href: "/habits",
                  label: "Daily Habits",
                  icon: CheckSquare,
                  style: { color: "oklch(0.58 0.17 145)", bg: "oklch(0.58 0.17 145 / 0.10)" },
                },
                {
                  href: "/accounts/new",
                  label: "Add Account",
                  icon: Wallet,
                  style: { color: "oklch(0.74 0.13 82)", bg: "oklch(0.74 0.13 82 / 0.10)" },
                },
              ].map(({ href, label, icon: Icon, style: s }) => (
                <Link
                  key={href}
                  href={href}
                  className="group flex flex-col items-center gap-2.5 rounded-xl p-4 transition-all hover:-translate-y-0.5"
                  style={{
                    border: "1px solid transparent",
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all group-hover:scale-110"
                    style={{ background: s.bg }}
                  >
                    <Icon className="w-4 h-4" style={{ color: s.color }} />
                  </div>
                  <span
                    className="text-xs font-medium text-center leading-tight"
                    style={{ color: "oklch(0.70 0.04 252)" }}
                  >
                    {label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────── */}
      <section className="relative z-10 px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <div
            className="animate-fade-up relative rounded-3xl overflow-hidden"
            style={{
              animationDelay: "700ms",
              background: "oklch(0.11 0.016 252)",
              border: "1px solid oklch(0.74 0.13 82 / 0.25)",
              boxShadow: "0 0 60px oklch(0.74 0.13 82 / 0.08), inset 0 1px 0 oklch(1 0 0 / 6%)",
            }}
          >
            {/* Background radial */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse at 50% -20%, oklch(0.74 0.13 82 / 0.12), transparent 60%), radial-gradient(ellipse at 50% 120%, oklch(0.72 0.14 220 / 0.07), transparent 60%)",
              }}
            />

            <div className="relative px-10 py-16">
              <div className="flex justify-center mb-6">
                <LogoMark variant="dark" size={52} />
              </div>
              <h2 className="text-3xl font-bold mb-3 tracking-tight">
                Start building your edge today.
              </h2>
              <p
                className="text-sm mb-10 max-w-sm mx-auto leading-relaxed"
                style={{ color: "oklch(0.52 0.04 252)" }}
              >
                No setup required. Start logging trades immediately — your data stays on your device.
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl px-10 py-4 text-sm font-bold transition-all hover:-translate-y-0.5"
                style={{
                  background: "linear-gradient(135deg, oklch(0.74 0.13 82) 0%, oklch(0.82 0.16 82) 100%)",
                  color: "oklch(0.08 0.014 252)",
                  boxShadow: "0 4px 20px oklch(0.74 0.13 82 / 0.40)",
                }}
              >
                Open TradeOn
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────── */}
      <footer
        className="relative z-10 px-6 py-8 text-center"
        style={{ borderTop: "1px solid oklch(1 0 0 / 5%)" }}
      >
        <div className="flex items-center justify-center mb-3">
          <Logo variant="dark" size={18} />
        </div>
        <p
          className="text-xs"
          style={{ color: "oklch(0.38 0.03 252)" }}
        >
          Premium trading productivity for futures and commodities traders.
        </p>
      </footer>
    </div>
  );
}
