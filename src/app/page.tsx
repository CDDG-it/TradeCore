import Link from "next/link";
import { TrendingUp, BookOpen, BarChart2, Wallet, ArrowRight, CheckCircle } from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "Trade Journal",
    description:
      "Log every trade with setup, confluences, RR, psychology notes, and screenshots. Build a systematic record of your edge.",
  },
  {
    icon: TrendingUp,
    title: "Pre-Trade Analysis",
    description:
      "Write structured pre-market analysis with bias, key levels, planned setups, and invalidation criteria before you trade.",
  },
  {
    icon: BarChart2,
    title: "Performance Analytics",
    description:
      "Visualize win rate, RR distribution, setup performance, and equity curve. Know exactly where your edge lives.",
  },
  {
    icon: Wallet,
    title: "Funded Account Tracker",
    description:
      "Monitor ROI, drawdown, and payout progress across all your prop firm accounts in one clean dashboard.",
  },
];

const stats = [
  { value: "4.2", label: "Avg R:R tracked" },
  { value: "67%", label: "Win rate visibility" },
  { value: "3", label: "Accounts managed" },
  { value: "$2.2K", label: "Payouts tracked" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border/40 px-6 py-4">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sm tracking-wide">TradingHub</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Open app
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 pt-24 pb-20 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary mb-8">
            <CheckCircle className="w-3 h-3" />
            Built for futures and commodities traders
          </div>

          <h1 className="text-5xl font-bold tracking-tight leading-tight mb-6">
            Your edge,{" "}
            <span className="text-primary">organized.</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
            A premium trading productivity platform. Journal your trades, analyze your setups,
            track funded accounts, and scan markets — all in one focused workspace.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Enter dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors"
            >
              Sign in to your account
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-6 py-12 border-y border-border/30">
        <div className="mx-auto max-w-4xl grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-bold text-primary mb-1">{s.value}</div>
              <div className="text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold tracking-tight mb-3">
              Everything you need. Nothing you don&apos;t.
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Built around the actual workflow of a disciplined trader — from pre-market to post-trade review.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="rounded-xl border border-border/50 bg-card p-6 hover:border-primary/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-sm mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-12">
            <h2 className="text-2xl font-bold mb-3">Start building your edge today.</h2>
            <p className="text-muted-foreground mb-8 text-sm">
              No setup required. Explore the full platform with mock data in seconds.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Open TradingHub
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 px-6 py-8 text-center text-xs text-muted-foreground">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center">
            <TrendingUp className="w-3 h-3 text-primary" />
          </div>
          <span className="font-medium text-foreground/60">TradingHub</span>
        </div>
        <p>Premium trading productivity for futures and commodities traders.</p>
      </footer>
    </div>
  );
}
