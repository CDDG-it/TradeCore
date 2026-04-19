import Link from "next/link";
import {
  BookOpen,
  BarChart2,
  Brain,
  Zap,
  ArrowRight,
  TrendingUp,
  Flame,
  Check,
  ChevronRight,
  Moon,
  Activity,
} from "lucide-react";
import { Logo, LogoMark } from "@/components/logo";

const features = [
  {
    icon: BookOpen,
    title: "Trade Journal",
    description:
      "Log every trade with R:R, psychology notes, and screenshots. Build a systematic record of your edge.",
    accentClass: "text-ice",
    glowStyle: { background: "oklch(0.72 0.22 45 / 0.10)" },
    borderStyle: { borderColor: "oklch(0.72 0.22 45 / 0.20)" },
    iconGlowStyle: { color: "oklch(0.72 0.22 45)" },
    href: "/journal",
  },
  {
    icon: BarChart2,
    title: "Performance Analytics",
    description:
      "Visualise win rate, R:R distribution, and equity curve. Know exactly where your edge lives.",
    accentClass: "text-ice",
    glowStyle: { background: "oklch(0.72 0.22 45 / 0.10)" },
    borderStyle: { borderColor: "oklch(0.72 0.22 45 / 0.20)" },
    iconGlowStyle: { color: "oklch(0.72 0.22 45)" },
    href: "/analytics",
  },
  {
    icon: Brain,
    title: "Self-Improvement",
    description:
      "Daily journals, mental state check-ins, habit tracker, and playbook — unified in one focused workspace.",
    accentClass: "text-gold",
    glowStyle: { background: "oklch(0.72 0.22 45 / 0.10)" },
    borderStyle: { borderColor: "oklch(0.72 0.22 45 / 0.20)" },
    iconGlowStyle: { color: "oklch(0.72 0.22 45)" },
    href: "/self-improvement",
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

// ── Static preview mockups ────────────────────────────────────────────────────

function PreviewFrame({ children, title, icon: Icon, color }: {
  children: React.ReactNode;
  title: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "oklch(0.10 0.003 28)",
        border: "1px solid oklch(0.20 0.005 28)",
      }}
    >
      <div
        className="flex items-center gap-2.5 px-4 py-3"
        style={{ borderBottom: "1px solid oklch(0.18 0.005 28)" }}
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `${color}1a` }}
        >
          <Icon className="w-3.5 h-3.5" style={{ color }} />
        </div>
        <span className="text-sm font-semibold" style={{ color: "oklch(0.90 0.003 28)" }}>
          {title}
        </span>
        <div className="ml-auto flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "oklch(0.25 0.005 28)" }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "oklch(0.25 0.005 28)" }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "oklch(0.25 0.005 28)" }} />
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
      <div className="flex items-center gap-2 px-2 pb-1.5" style={{ borderBottom: "1px solid oklch(0.18 0.005 28)" }}>
        <span className="text-xs font-medium w-9" style={{ color: "oklch(0.45 0.005 28)" }}>Sym</span>
        <span className="flex-1 text-xs font-medium" style={{ color: "oklch(0.45 0.005 28)" }}>Setup</span>
        <span className="text-xs font-medium w-12 text-right" style={{ color: "oklch(0.45 0.005 28)" }}>R:R</span>
        <span className="text-xs font-medium w-14 text-right" style={{ color: "oklch(0.45 0.005 28)" }}>P&L</span>
      </div>
      {trades.map((t, i) => (
        <div
          key={i}
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg"
          style={{
            background: t.result === "win" ? "oklch(0.58 0.17 145 / 0.06)" : "oklch(0.58 0.22 25 / 0.06)",
            border: `1px solid ${t.result === "win" ? "oklch(0.58 0.17 145 / 0.12)" : "oklch(0.58 0.22 25 / 0.12)"}`,
          }}
        >
          <span className="text-xs font-bold w-9" style={{ color: "oklch(0.72 0.22 45)" }}>{t.symbol}</span>
          <span className="flex-1 text-xs" style={{ color: "oklch(0.60 0.005 28)" }}>{t.setup}</span>
          <span
            className="text-xs font-semibold w-12 text-right tabular-nums"
            style={{ color: t.result === "win" ? "oklch(0.58 0.17 145)" : "oklch(0.58 0.22 25)" }}
          >
            {t.rr}
          </span>
          <span
            className="text-xs font-bold w-14 text-right tabular-nums"
            style={{ color: t.result === "win" ? "oklch(0.58 0.17 145)" : "oklch(0.58 0.22 25)" }}
          >
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
          { label: "Win Rate", value: "67%", color: "oklch(0.58 0.17 145)" },
          { label: "Avg R:R", value: "2.4R", color: "oklch(0.72 0.22 45)" },
          { label: "Best Trade", value: "4.8R", color: "oklch(0.72 0.22 45)" },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="rounded-xl p-3 text-center"
            style={{ background: "oklch(0.07 0.003 28)", border: "1px solid oklch(0.18 0.005 28)" }}
          >
            <p className="text-base font-black tabular-nums" style={{ color }}>{value}</p>
            <p className="text-xs mt-0.5" style={{ color: "oklch(0.45 0.005 28)" }}>{label}</p>
          </div>
        ))}
      </div>
      <div>
        <p className="text-xs mb-2" style={{ color: "oklch(0.45 0.005 28)" }}>Equity curve — last 10 trades</p>
        <div className="flex items-end gap-1 h-14">
          {bars.map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t"
              style={{
                height: `${h}%`,
                background: h > 60
                  ? `oklch(0.58 0.17 145 / 0.7)`
                  : `oklch(0.58 0.22 25 / 0.7)`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function SelfImprovementPreview() {
  const metrics = [
    { label: "Mood", value: 8, color: "oklch(0.72 0.22 45)" },
    { label: "Energy", value: 7, color: "oklch(0.72 0.22 45)" },
    { label: "Focus", value: 9, color: "oklch(0.72 0.22 45)" },
    { label: "Stress", value: 3, color: "oklch(0.58 0.17 145)", invert: true },
  ];
  const habits = [
    { label: "📊 Pre-market review", done: true },
    { label: "🧘 Meditation", done: true },
    { label: "💪 Exercise", done: true },
    { label: "📚 Study setups", done: false },
  ];
  return (
    <div className="space-y-3">
      <p className="text-xs font-medium" style={{ color: "oklch(0.45 0.005 28)" }}>Today's tracker</p>
      <div className="space-y-2">
        {metrics.map(({ label, value, color }) => (
          <div key={label} className="space-y-1">
            <div className="flex justify-between">
              <span className="text-xs" style={{ color: "oklch(0.55 0.005 28)" }}>{label}</span>
              <span className="text-xs font-bold" style={{ color }}>{value}</span>
            </div>
            <div className="flex gap-0.5">
              {Array.from({ length: 10 }, (_, i) => (
                <div
                  key={i}
                  className="flex-1 h-1.5 rounded-full"
                  style={{
                    background: i < value
                      ? color
                      : "oklch(0.20 0.005 28)",
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={{ borderTop: "1px solid oklch(0.18 0.005 28)", paddingTop: "10px" }}>
        <p className="text-xs font-medium mb-2" style={{ color: "oklch(0.45 0.005 28)" }}>Habits — 3/4 done</p>
        <div className="space-y-1">
          {habits.map(({ label, done }) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-md shrink-0 flex items-center justify-center"
                style={{
                  background: done ? "oklch(0.58 0.17 145)" : "oklch(0.14 0.004 28)",
                  border: done ? "none" : "1px solid oklch(0.25 0.005 28)",
                }}
              >
                {done && <Check className="w-2.5 h-2.5 text-white" />}
              </div>
              <span className="text-xs" style={{ color: done ? "oklch(0.80 0.003 28)" : "oklch(0.45 0.005 28)" }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MarketNewsPreview() {
  const news = [
    {
      impact: "HIGH",
      impactColor: "oklch(0.58 0.22 25)",
      impactBg: "oklch(0.58 0.22 25 / 0.12)",
      headline: "CPI Data Beats Expectations — Inflation at 3.1%",
      source: "Reuters",
      time: "2m ago",
    },
    {
      impact: "MED",
      impactColor: "oklch(0.72 0.22 45)",
      impactBg: "oklch(0.72 0.22 45 / 0.12)",
      headline: "Fed Minutes Signal Rate Hold Through Q3",
      source: "Bloomberg",
      time: "1h ago",
    },
    {
      impact: "LOW",
      impactColor: "oklch(0.58 0.17 145)",
      impactBg: "oklch(0.58 0.17 145 / 0.12)",
      headline: "EIA Oil Inventory Report — Crude Draws Down 2.1M",
      source: "EIA",
      time: "3h ago",
    },
  ];
  return (
    <div className="space-y-2">
      {news.map(({ impact, impactColor, impactBg, headline, source, time }) => (
        <div
          key={headline}
          className="rounded-xl p-3"
          style={{ background: "oklch(0.07 0.003 28)", border: "1px solid oklch(0.18 0.005 28)" }}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className="text-xs font-bold px-1.5 py-0.5 rounded"
              style={{ background: impactBg, color: impactColor }}
            >
              {impact}
            </span>
            <span className="text-xs ml-auto" style={{ color: "oklch(0.40 0.005 28)" }}>{time}</span>
          </div>
          <p className="text-xs font-medium leading-snug" style={{ color: "oklch(0.80 0.003 28)" }}>
            {headline}
          </p>
          <p className="text-xs mt-1" style={{ color: "oklch(0.40 0.005 28)" }}>{source}</p>
        </div>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ── Ambient background glows ──────────────── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div
          className="absolute -top-48 -left-48 w-[700px] h-[700px] rounded-full"
          style={{
            background: "radial-gradient(circle, oklch(0.72 0.22 45 / 0.08), transparent 65%)",
          }}
        />
        <div
          className="absolute -bottom-48 -right-32 w-[800px] h-[800px] rounded-full"
          style={{
            background: "radial-gradient(circle, oklch(0.72 0.22 45 / 0.07), transparent 65%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(oklch(0.72 0.22 45 / 0.4) 1px, transparent 1px), linear-gradient(90deg, oklch(0.72 0.22 45 / 0.4) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      {/* ── Header ───────────────────────────────── */}
      <header
        className="relative z-10 px-6 py-4 sticky top-0"
        style={{
          background: "oklch(0.07 0.003 28 / 0.85)",
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
                background: "oklch(0.72 0.22 45)",
                color: "oklch(0.07 0.003 28)",
                boxShadow: "0 4px 16px oklch(0.72 0.22 45 / 0.30)",
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
          <div
            className="animate-fade-up inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold mb-12"
            style={{
              background: "oklch(0.72 0.22 45 / 0.10)",
              border: "1px solid oklch(0.72 0.22 45 / 0.30)",
              color: "oklch(0.72 0.22 45)",
              animationDelay: "0ms",
            }}
          >
            <Flame className="w-3 h-3" />
            Built for futures and commodities traders
          </div>

          <div
            className="animate-fade-up animate-float flex justify-center mb-10"
            style={{ animationDelay: "80ms" }}
          >
            <LogoMark variant="dark" size={88} />
          </div>

          <h1
            className="animate-fade-up text-7xl sm:text-8xl font-extrabold tracking-tight leading-none mb-5"
            style={{ animationDelay: "160ms" }}
          >
            <span style={{ color: "oklch(0.94 0.002 28)" }}>Trade</span>
            <span className="animate-shimmer-gold">core</span>
          </h1>

          <p
            className="animate-fade-up text-xl font-light mb-4"
            style={{
              animationDelay: "240ms",
              color: "oklch(0.72 0.005 28)",
            }}
          >
            Where self-improvement{" "}
            <span
              className="font-semibold"
              style={{ color: "oklch(0.94 0.002 28)" }}
            >
              meets trading.
            </span>
          </p>

          <p
            className="animate-fade-up text-base max-w-lg mx-auto mb-14 leading-relaxed"
            style={{
              animationDelay: "300ms",
              color: "oklch(0.55 0.005 28)",
            }}
          >
            A premium performance platform for serious traders. Discipline, habits, mindset, and execution — unified in one focused workspace.
          </p>

          <div
            className="animate-fade-up flex flex-col sm:flex-row items-center justify-center gap-3"
            style={{ animationDelay: "380ms" }}
          >
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-sm font-semibold transition-all hover:-translate-y-0.5"
              style={{
                background: "oklch(0.72 0.22 45)",
                color: "oklch(0.07 0.003 28)",
                boxShadow: "0 4px 24px oklch(0.72 0.22 45 / 0.35)",
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
                color: "oklch(0.65 0.005 28)",
                background: "oklch(1 0 0 / 3%)",
              }}
            >
              Sign in to your account
            </Link>
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────── */}
      <section className="relative z-10 px-6 py-28">
        <div className="mx-auto max-w-6xl">
          <div
            className="animate-fade-up text-center mb-16"
            style={{ animationDelay: "500ms" }}
          >
            <h2 className="text-4xl font-bold tracking-tight mb-3 leading-tight">
              The complete system.{" "}
              <span style={{ color: "oklch(0.40 0.005 28)", fontWeight: 400 }}>Built for serious traders.</span>
            </h2>
            <p
              className="text-sm max-w-sm mx-auto"
              style={{ color: "oklch(0.50 0.005 28)" }}
            >
              Built around the actual workflow of a disciplined trader — from pre-market to post-trade review.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map(({ icon: Icon, title, description, accentClass, glowStyle, borderStyle, iconGlowStyle, href }, i) => (
              <Link
                key={title}
                href={href}
                className="animate-fade-up group rounded-2xl p-6 block relative overflow-hidden transition-all duration-300 hover:-translate-y-1.5 cursor-pointer"
                style={{
                  background: "oklch(0.10 0.003 28)",
                  border: "1px solid oklch(0.18 0.005 28)",
                  animationDelay: `${560 + i * 60}ms`,
                }}
              >
                <div
                  className="absolute inset-x-0 top-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${Object.values(borderStyle)[0].replace('0.20', '0.60')}, transparent)`,
                  }}
                />
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
                  style={glowStyle}
                />
                <div
                  className="relative w-11 h-11 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
                  style={glowStyle}
                >
                  <Icon className="w-5 h-5" style={iconGlowStyle} />
                </div>
                <h3
                  className="relative font-bold text-sm mb-2.5 transition-colors"
                  style={{ color: "oklch(0.90 0.003 28)" }}
                >
                  {title}
                </h3>
                <p
                  className="relative text-xs leading-relaxed mb-5"
                  style={{ color: "oklch(0.50 0.005 28)" }}
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

      {/* ── Feature Previews ──────────────────────── */}
      <section className="relative z-10 px-6 pb-28">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold tracking-tight mb-3">
              A real look inside.
            </h2>
            <p className="text-sm max-w-sm mx-auto" style={{ color: "oklch(0.50 0.005 28)" }}>
              Here's what your workspace looks like once you're set up.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <PreviewFrame title="Trade Journal" icon={BookOpen} color="oklch(0.72 0.22 45)">
              <TradeJournalPreview />
            </PreviewFrame>

            <PreviewFrame title="Performance Analytics" icon={BarChart2} color="oklch(0.72 0.22 45)">
              <AnalyticsPreview />
            </PreviewFrame>

            <PreviewFrame title="Self-Improvement" icon={Brain} color="oklch(0.72 0.22 45)">
              <SelfImprovementPreview />
            </PreviewFrame>

            <PreviewFrame title="Market News" icon={Zap} color="oklch(0.70 0.16 72)">
              <MarketNewsPreview />
            </PreviewFrame>
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
          style={{ color: "oklch(0.38 0.005 28)" }}
        >
          Premium trading productivity for futures and commodities traders.
        </p>
      </footer>
    </div>
  );
}
