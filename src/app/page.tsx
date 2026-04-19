import Link from "next/link";
import {
  BookOpen,
  BarChart2,
  Brain,
  Zap,
  ArrowRight,
  Flame,
  Check,
  ChevronRight,
} from "lucide-react";
import { Logo, LogoMark } from "@/components/logo";
import { FadeIn, GlassCard, Stagger, StaggerItem } from "@/components/ui/fade-in";

const features = [
  {
    icon: BookOpen,
    title: "Trade Journal",
    description: "Log every trade with R:R, psychology notes, and screenshots. Build a systematic record of your edge.",
    color: "#F97316",
    href: "/journal",
  },
  {
    icon: BarChart2,
    title: "Performance Analytics",
    description: "Visualise win rate, R:R distribution, and equity curve. Know exactly where your edge lives.",
    color: "#F97316",
    href: "/analytics",
  },
  {
    icon: Brain,
    title: "Self-Improvement",
    description: "Daily journals, habit tracker, and playbook — unified in one focused workspace.",
    color: "#FBBF24",
    href: "/self-improvement",
  },
  {
    icon: Zap,
    title: "Market News",
    description: "Curated high-impact news for futures and commodities traders, filtered by market and impact level.",
    color: "#FBBF24",
    href: "/news",
  },
];

const stats = [
  { value: "4.2R", label: "Avg risk-reward tracked" },
  { value: "67%", label: "Win rate visibility" },
  { value: "100%", label: "Your data, your device" },
  { value: "0", label: "Setup required" },
];

function PreviewFrame({ children, title, icon: Icon, color }: {
  children: React.ReactNode;
  title: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div
      className="liquid-glass rounded-2xl overflow-hidden"
    >
      <div
        className="flex items-center gap-2.5 px-4 py-3"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `${color}1f` }}
        >
          <Icon className="w-3.5 h-3.5" style={{ color }} />
        </div>
        <span className="font-body text-sm font-semibold text-white/80">{title}</span>
        <div className="ml-auto flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-white/10" />
          <div className="w-2 h-2 rounded-full bg-white/10" />
          <div className="w-2 h-2 rounded-full bg-white/10" />
        </div>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function TradeJournalPreview() {
  const trades = [
    { symbol: "ES", setup: "Breakout retest", rr: "+3.2R", result: "win", pnl: "+$480" },
    { symbol: "NQ", setup: "Opening range", rr: "+1.8R", result: "win", pnl: "+$270" },
    { symbol: "CL", setup: "Supply zone", rr: "−1.0R", result: "loss", pnl: "−$150" },
    { symbol: "ES", setup: "Gap fill", rr: "+2.5R", result: "win", pnl: "+$375" },
  ];
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 px-2 pb-1.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <span className="font-body text-xs font-medium w-9 text-white/30">Sym</span>
        <span className="font-body flex-1 text-xs font-medium text-white/30">Setup</span>
        <span className="font-body text-xs font-medium w-12 text-right text-white/30">R:R</span>
        <span className="font-body text-xs font-medium w-14 text-right text-white/30">P&L</span>
      </div>
      {trades.map((t, i) => (
        <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded-xl"
          style={{
            background: t.result === "win" ? "oklch(0.58 0.17 145 / 0.07)" : "oklch(0.58 0.22 25 / 0.07)",
            border: `1px solid ${t.result === "win" ? "oklch(0.58 0.17 145 / 0.14)" : "oklch(0.58 0.22 25 / 0.14)"}`,
          }}
        >
          <span className="font-body text-xs font-bold w-9" style={{ color: "#F97316" }}>{t.symbol}</span>
          <span className="font-body flex-1 text-xs text-white/40">{t.setup}</span>
          <span className="font-body text-xs font-semibold w-12 text-right tabular-nums"
            style={{ color: t.result === "win" ? "oklch(0.65 0.18 145)" : "oklch(0.65 0.22 25)" }}>
            {t.rr}
          </span>
          <span className="font-body text-xs font-bold w-14 text-right tabular-nums"
            style={{ color: t.result === "win" ? "oklch(0.65 0.18 145)" : "oklch(0.65 0.22 25)" }}>
            {t.pnl}
          </span>
        </div>
      ))}
    </div>
  );
}

function AnalyticsPreview() {
  const bars = [65, 48, 72, 55, 80, 42, 68, 75, 58, 82];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Win Rate", value: "67%", color: "oklch(0.65 0.18 145)" },
          { label: "Avg R:R", value: "2.4R", color: "#F97316" },
          { label: "Best Trade", value: "4.8R", color: "#FBBF24" },
        ].map(({ label, value, color }) => (
          <div key={label} className="liquid-glass rounded-xl p-3 text-center">
            <p className="font-body text-base font-black tabular-nums" style={{ color }}>{value}</p>
            <p className="font-body text-xs mt-0.5 text-white/30">{label}</p>
          </div>
        ))}
      </div>
      <div>
        <p className="font-body text-xs mb-2 text-white/30">Equity curve — last 10 trades</p>
        <div className="flex items-end gap-1 h-14">
          {bars.map((h, i) => (
            <div key={i} className="flex-1 rounded-t"
              style={{ height: `${h}%`, background: h > 60 ? "oklch(0.65 0.18 145 / 0.7)" : "oklch(0.65 0.22 25 / 0.7)" }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SelfImprovementPreview() {
  const habits = [
    { label: "📊 Pre-market review", done: true },
    { label: "🧘 Meditation", done: true },
    { label: "💪 Exercise", done: true },
    { label: "📚 Study setups", done: false },
  ];
  return (
    <div className="space-y-3">
      <p className="font-body text-xs font-medium text-white/35">Today's habits — 3/4 done</p>
      <div className="space-y-1.5">
        {habits.map(({ label, done }) => (
          <div key={label} className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-md shrink-0 flex items-center justify-center"
              style={{
                background: done ? "oklch(0.58 0.17 145)" : "rgba(255,255,255,0.05)",
                border: done ? "none" : "1px solid rgba(255,255,255,0.12)",
              }}>
              {done && <Check className="w-2.5 h-2.5 text-white" />}
            </div>
            <span className="font-body text-xs" style={{ color: done ? "rgba(255,255,255,0.72)" : "rgba(255,255,255,0.28)" }}>
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MarketNewsPreview() {
  const news = [
    { impact: "HIGH", color: "oklch(0.65 0.22 25)", headline: "CPI Data Beats Expectations — Inflation at 3.1%", time: "2m ago" },
    { impact: "MED", color: "#F97316", headline: "Fed Minutes Signal Rate Hold Through Q3", time: "1h ago" },
    { impact: "LOW", color: "oklch(0.65 0.18 145)", headline: "EIA Oil Inventory Report — Crude Draws Down 2.1M", time: "3h ago" },
  ];
  return (
    <div className="space-y-2">
      {news.map(({ impact, color, headline, time }) => (
        <div key={headline} className="liquid-glass rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-body text-xs font-bold px-1.5 py-0.5 rounded"
              style={{ background: `${color}22`, color }}>{impact}</span>
            <span className="font-body text-xs ml-auto text-white/25">{time}</span>
          </div>
          <p className="font-body text-xs font-medium leading-snug text-white/70">{headline}</p>
        </div>
      ))}
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ── Editorial vertical grid lines ── */}
      <div className="pointer-events-none fixed inset-0 z-0 hidden lg:block" aria-hidden>
        <div className="absolute inset-y-0 w-px" style={{ left: "25%", background: "rgba(255,255,255,0.05)" }} />
        <div className="absolute inset-y-0 w-px" style={{ left: "50%", background: "rgba(255,255,255,0.07)" }} />
        <div className="absolute inset-y-0 w-px" style={{ left: "75%", background: "rgba(255,255,255,0.05)" }} />
      </div>

      {/* ── Hero background video ── */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: 0.45 }}
        >
          <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260306_074215_04640ca7-042c-45d6-bb56-58b1e8a42489.mp4" type="video/mp4" />
        </video>
        {/* Dark overlay to keep text readable */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(7,4,2,0.55) 0%, rgba(7,4,2,0.35) 40%, rgba(7,4,2,0.65) 100%)" }} />
        {/* Orange color tint overlay */}
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at top, rgba(249,115,22,0.12) 0%, transparent 60%)" }} />
        {/* Grain texture */}
        <div className="absolute inset-0 opacity-[0.028]"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")", backgroundRepeat: "repeat", backgroundSize: "128px 128px" }} />
      </div>

      {/* ── Header ── */}
      <header className="liquid-glass-strong relative z-20 px-6 py-4 sticky top-0 rounded-none">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <Logo variant="dark" size={28} />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login"
              className="font-body text-sm text-white/40 hover:text-white/80 transition-colors">
              Sign in
            </Link>
            <Link href="/dashboard"
              className="font-body liquid-glass-strong inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-semibold text-white transition-all hover:-translate-y-px"
              style={{ background: "rgba(249,115,22,0.18)", boxShadow: "0 4px 16px rgba(249,115,22,0.20)" }}>
              Open app
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-32 text-center">
        {/* Thin horizontal rule above hero content */}
        <div className="absolute inset-x-0 top-[52px] h-px" style={{ background: "rgba(255,255,255,0.06)" }} />

        <div className="mx-auto max-w-3xl">
          <FadeIn delay={0}>
            <div className="liquid-glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold font-body mb-12"
              style={{ color: "#F97316" }}>
              <Flame className="w-3 h-3" />
              Built for futures &amp; commodities traders
            </div>
          </FadeIn>

          <FadeIn delay={0.06}>
            <div className="flex justify-center mb-8">
              <LogoMark size={72} />
            </div>
          </FadeIn>

          <FadeIn delay={0.14}>
            <h1 className="font-heading italic text-[clamp(4rem,12vw,9rem)] tracking-tight leading-[0.88] text-white mb-6">
              Trade
              <br />
              <span style={{ background: "linear-gradient(135deg, #F97316 0%, #FBBF24 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                core.
              </span>
            </h1>
          </FadeIn>

          <FadeIn delay={0.22}>
            <p className="font-body text-lg font-light text-white/45 mb-12 max-w-md mx-auto leading-relaxed">
              A premium performance platform for serious traders.{" "}
              <span className="text-white/70 font-normal">Discipline, habits, mindset, and execution</span>{" "}
              — unified.
            </p>
          </FadeIn>

          <FadeIn delay={0.30}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/dashboard"
                className="font-body font-semibold inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm text-white transition-all hover:-translate-y-0.5 active:translate-y-0"
                style={{
                  background: "linear-gradient(135deg, #F97316 0%, #FBBF24 100%)",
                  boxShadow: "0 4px 28px rgba(249,115,22,0.40)",
                }}>
                Enter dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/login"
                className="font-body font-medium inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm liquid-glass text-white/50 hover:text-white/80 transition-all">
                Sign in
              </Link>
            </div>
          </FadeIn>
        </div>

        {/* Scroll indicator */}
        <FadeIn delay={0.55} className="absolute bottom-10 left-1/2 -translate-x-1/2">
          <div className="flex flex-col items-center gap-2 text-white/20">
            <span className="font-body text-[10px] uppercase tracking-[0.18em]">Scroll</span>
            <div className="w-px h-8 bg-gradient-to-b from-white/20 to-transparent" />
          </div>
        </FadeIn>
      </section>

      {/* ── Stats bar ── */}
      <FadeIn className="relative z-10 px-6 pb-20">
        <div className="mx-auto max-w-3xl">
          <div className="liquid-glass rounded-2xl px-8 py-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {stats.map(({ value, label }) => (
              <div key={label}>
                <p className="font-heading italic text-3xl text-white mb-1"
                  style={{ background: "linear-gradient(135deg, #F97316, #FBBF24)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  {value}
                </p>
                <p className="font-body text-xs text-white/35">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </FadeIn>

      {/* ── Features ── */}
      <section className="relative z-10 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <FadeIn className="text-center mb-16">
            <p className="font-body text-xs font-semibold uppercase tracking-[0.15em] text-white/30 mb-4">Platform</p>
            <h2 className="font-heading italic text-5xl md:text-6xl text-white tracking-tight leading-[0.9] mb-4">
              The complete system.
            </h2>
            <p className="font-body text-sm font-light text-white/40 max-w-sm mx-auto">
              Built around the actual workflow of a disciplined trader — from pre-market to post-trade review.
            </p>
          </FadeIn>

          <Stagger className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map(({ icon: Icon, title, description, color, href }) => (
              <StaggerItem key={title}>
                <Link href={href}
                  className="liquid-glass group rounded-2xl p-6 block relative overflow-hidden transition-all duration-300 hover:-translate-y-1.5 cursor-pointer h-full">
                  <div className="absolute inset-x-0 top-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: `linear-gradient(90deg, transparent, ${color}80, transparent)` }} />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{ background: `radial-gradient(ellipse at top, ${color}0d, transparent 70%)` }} />
                  <div className="relative w-10 h-10 rounded-xl flex items-center justify-center mb-5"
                    style={{ background: `${color}18` }}>
                    <Icon className="w-4.5 h-4.5" style={{ color }} />
                  </div>
                  <h3 className="font-body font-semibold text-sm text-white/85 mb-2 relative">{title}</h3>
                  <p className="font-body text-xs font-light leading-relaxed text-white/40 mb-5 relative">{description}</p>
                  <div className="relative inline-flex items-center gap-1 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-all duration-200 -translate-x-1 group-hover:translate-x-0"
                    style={{ color }}>
                    Open <ChevronRight className="w-3 h-3" />
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ── Feature Previews ── */}
      <section className="relative z-10 px-6 pb-28">
        <div className="mx-auto max-w-6xl">
          <FadeIn className="text-center mb-14">
            <h2 className="font-heading italic text-4xl md:text-5xl text-white tracking-tight leading-[0.9] mb-3">
              A real look inside.
            </h2>
            <p className="font-body text-sm font-light text-white/40 max-w-sm mx-auto">
              Here&apos;s what your workspace looks like once you&apos;re set up.
            </p>
          </FadeIn>

          <Stagger className="grid md:grid-cols-2 gap-5" staggerDelay={0.1}>
            <StaggerItem>
              <PreviewFrame title="Trade Journal" icon={BookOpen} color="#F97316">
                <TradeJournalPreview />
              </PreviewFrame>
            </StaggerItem>
            <StaggerItem>
              <PreviewFrame title="Performance Analytics" icon={BarChart2} color="#F97316">
                <AnalyticsPreview />
              </PreviewFrame>
            </StaggerItem>
            <StaggerItem>
              <PreviewFrame title="Self-Improvement" icon={Brain} color="#FBBF24">
                <SelfImprovementPreview />
              </PreviewFrame>
            </StaggerItem>
            <StaggerItem>
              <PreviewFrame title="Market News" icon={Zap} color="#FBBF24">
                <MarketNewsPreview />
              </PreviewFrame>
            </StaggerItem>
          </Stagger>
        </div>
      </section>

      {/* ── CTA ── */}
      <FadeIn className="relative z-10 px-6 pb-28">
        <div className="mx-auto max-w-2xl">
          <div className="liquid-glass-strong rounded-3xl px-10 py-14 text-center relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: "radial-gradient(ellipse at center top, rgba(249,115,22,0.12), transparent 60%)" }} />
            <p className="font-body text-xs font-semibold uppercase tracking-[0.15em] text-white/30 mb-4 relative">Ready?</p>
            <h2 className="font-heading italic text-4xl md:text-5xl text-white tracking-tight leading-[0.9] mb-4 relative">
              Start trading smarter.
            </h2>
            <p className="font-body text-sm font-light text-white/40 max-w-xs mx-auto mb-8 relative">
              No setup required. Your data stays on your device.
            </p>
            <Link href="/dashboard"
              className="font-body font-semibold relative inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm text-white transition-all hover:-translate-y-0.5"
              style={{
                background: "linear-gradient(135deg, #F97316 0%, #FBBF24 100%)",
                boxShadow: "0 4px 24px rgba(249,115,22,0.35)",
              }}>
              Open the app
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </FadeIn>

      {/* ── Footer ── */}
      <footer className="relative z-10 px-6 py-8 text-center" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="flex items-center justify-center mb-3">
          <Logo variant="dark" size={18} />
        </div>
        <p className="font-body text-xs text-white/25">
          Premium trading productivity for futures and commodities traders.
        </p>
      </footer>
    </div>
  );
}
