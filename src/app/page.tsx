import Link from "next/link";
import { BookOpen, BarChart2, Wallet, ArrowRight, CheckCircle, TrendingUp } from "lucide-react";
import { Logo, LogoMark } from "@/components/logo";

const features = [
  {
    icon: BookOpen,
    title: "Trade Journal",
    description:
      "Log every trade with setup, confluences, R:R, psychology notes, and screenshots. Build a systematic record of your edge.",
    accent: "text-primary",
    glow: "bg-primary/8",
  },
  {
    icon: TrendingUp,
    title: "Pre-Trade Analysis",
    description:
      "Write structured pre-market analysis with bias, key levels, planned setups, and invalidation before you trade.",
    accent: "text-gold",
    glow: "bg-gold/8",
  },
  {
    icon: BarChart2,
    title: "Performance Analytics",
    description:
      "Visualise win rate, R:R distribution, setup performance, and equity curve. Know exactly where your edge lives.",
    accent: "text-primary",
    glow: "bg-primary/8",
  },
  {
    icon: Wallet,
    title: "Funded Accounts",
    description:
      "Monitor ROI, drawdown, and payout progress across all your prop firm accounts in one clean dashboard.",
    accent: "text-gold",
    glow: "bg-gold/8",
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
      {/* ── Background decoration ─────────────────── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        {/* Navy top-left orb */}
        <div
          className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full opacity-[0.04]"
          style={{ background: "radial-gradient(circle, oklch(0.22 0.08 252), transparent 70%)" }}
        />
        {/* Gold bottom-right orb */}
        <div
          className="absolute -bottom-48 -right-24 w-[700px] h-[700px] rounded-full opacity-[0.06]"
          style={{ background: "radial-gradient(circle, oklch(0.70 0.13 82), transparent 65%)" }}
        />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage:
              "linear-gradient(oklch(0.22 0.08 252) 1px, transparent 1px), linear-gradient(90deg, oklch(0.22 0.08 252) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* ── Header ───────────────────────────────── */}
      <header className="relative z-10 border-b border-border/30 px-6 py-4 backdrop-blur-sm bg-background/80 sticky top-0">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <Logo variant="light" size={28} />
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
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all hover:shadow-md hover:-translate-y-px"
            >
              Open app
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────── */}
      <section className="relative z-10 px-6 pt-20 pb-24 text-center">
        <div className="mx-auto max-w-3xl">
          {/* Badge */}
          <div
            className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold/6 px-4 py-1.5 text-xs font-medium text-gold mb-10"
            style={{ animationDelay: "0ms" }}
          >
            <CheckCircle className="w-3 h-3" />
            Built for futures and commodities traders
          </div>

          {/* Logo mark — floating */}
          <div
            className="animate-fade-up animate-float flex justify-center mb-8"
            style={{ animationDelay: "80ms" }}
          >
            <LogoMark variant="light" size={80} />
          </div>

          {/* Wordmark */}
          <h1
            className="animate-fade-up text-6xl sm:text-7xl font-extrabold tracking-tight leading-none mb-4"
            style={{ animationDelay: "160ms" }}
          >
            <span className="text-primary">Trade</span>
            <span className="animate-shimmer-gold">On</span>
          </h1>

          {/* Tagline */}
          <p
            className="animate-fade-up text-xl text-muted-foreground mb-4"
            style={{ animationDelay: "240ms" }}
          >
            Your edge,{" "}
            <span className="font-semibold text-foreground">organized.</span>
          </p>

          {/* Description */}
          <p
            className="animate-fade-up text-base text-muted-foreground/80 max-w-lg mx-auto mb-12 leading-relaxed"
            style={{ animationDelay: "300ms" }}
          >
            A premium trading productivity platform. Journal your trades, analyse your setups,
            track funded accounts, and scan markets — all in one focused workspace.
          </p>

          {/* CTAs */}
          <div
            className="animate-fade-up flex flex-col sm:flex-row items-center justify-center gap-3"
            style={{ animationDelay: "380ms" }}
          >
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all hover:shadow-lg hover:-translate-y-0.5 shadow-primary/20 shadow-md"
            >
              Enter dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl border border-border px-7 py-3.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/3 transition-all"
            >
              Sign in to your account
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats bar ─────────────────────────────── */}
      <section className="relative z-10 px-6 py-10 border-y border-border/25">
        <div className="mx-auto max-w-4xl grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className="animate-fade-up text-center"
              style={{ animationDelay: `${400 + i * 80}ms` }}
            >
              <div className="text-3xl font-extrabold text-gold mb-1 tabular-nums">{s.value}</div>
              <div className="text-xs text-muted-foreground leading-snug">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ──────────────────────────────── */}
      <section className="relative z-10 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div
            className="animate-fade-up text-center mb-16"
            style={{ animationDelay: "500ms" }}
          >
            <h2 className="text-3xl font-bold tracking-tight mb-3">
              Everything you need.{" "}
              <span className="text-muted-foreground font-normal">Nothing you don&apos;t.</span>
            </h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Built around the actual workflow of a disciplined trader — from pre-market to post-trade review.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map(({ icon: Icon, title, description, accent, glow }, i) => (
              <div
                key={title}
                className="animate-fade-up group rounded-2xl border border-border/50 bg-card p-6 hover:border-primary/25 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                style={{ animationDelay: `${560 + i * 60}ms` }}
              >
                <div
                  className={`w-10 h-10 rounded-xl ${glow} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                >
                  <Icon className={`w-5 h-5 ${accent}`} />
                </div>
                <h3 className="font-semibold text-sm mb-2">{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA section ───────────────────────────── */}
      <section className="relative z-10 px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <div
            className="animate-fade-up relative rounded-3xl border border-gold/20 overflow-hidden"
            style={{ animationDelay: "700ms" }}
          >
            {/* Inner glow */}
            <div
              className="absolute inset-0 opacity-40"
              style={{
                background:
                  "radial-gradient(ellipse at 50% 0%, oklch(0.70 0.13 82 / 0.08), transparent 60%), radial-gradient(ellipse at 50% 100%, oklch(0.22 0.08 252 / 0.06), transparent 60%)",
              }}
            />
            <div className="relative px-10 py-14">
              <div className="flex justify-center mb-6">
                <LogoMark variant="light" size={48} />
              </div>
              <h2 className="text-2xl font-bold mb-3 tracking-tight">
                Start building your edge today.
              </h2>
              <p className="text-sm text-muted-foreground mb-8 max-w-sm mx-auto">
                No setup required. Start logging trades immediately — your data stays on your device.
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all hover:shadow-lg hover:-translate-y-0.5"
              >
                Open TradeOn
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────── */}
      <footer className="relative z-10 border-t border-border/25 px-6 py-8 text-center">
        <div className="flex items-center justify-center mb-3">
          <Logo variant="light" size={18} />
        </div>
        <p className="text-xs text-muted-foreground">
          Premium trading productivity for futures and commodities traders.
        </p>
      </footer>
    </div>
  );
}
