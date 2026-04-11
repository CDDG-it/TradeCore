"use client";

import Link from "next/link";
import { format } from "date-fns";
import {
  TrendingUp,
  TrendingDown,
  BookOpen,
  LineChart,
  BarChart2,
  Wallet,
  Newspaper,
  ArrowRight,
  Target,
  Activity,
  DollarSign,
  Plus,
  Zap,
  CheckSquare,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getDashboardStats, getTrades, getAccounts, getFeaturedNews } from "@/lib/mock/store";
import { cn } from "@/lib/utils";
import type { TradeResult } from "@/lib/types";

function ResultBadge({ result }: { result: TradeResult }) {
  if (result === "win")
    return (
      <span
        className="inline-flex items-center justify-center w-6 h-6 rounded-md text-xs font-bold"
        style={{ background: "oklch(0.58 0.17 145 / 0.15)", color: "oklch(0.58 0.17 145)" }}
      >
        W
      </span>
    );
  if (result === "loss")
    return (
      <span
        className="inline-flex items-center justify-center w-6 h-6 rounded-md text-xs font-bold"
        style={{ background: "oklch(0.58 0.22 25 / 0.15)", color: "oklch(0.58 0.22 25)" }}
      >
        L
      </span>
    );
  return (
    <span
      className="inline-flex items-center justify-center w-6 h-6 rounded-md text-xs font-bold"
      style={{ background: "oklch(0.70 0.16 72 / 0.15)", color: "oklch(0.70 0.16 72)" }}
    >
      B
    </span>
  );
}

export default function DashboardPage() {
  const stats = getDashboardStats();
  const recentTrades = getTrades().slice(0, 5);
  const accounts = getAccounts();
  const featuredNews = getFeaturedNews();

  const statCards = [
    {
      label: "Total Trades",
      value: stats.total_trades.toString(),
      icon: Activity,
      sub: `${stats.win_rate}% win rate`,
      accent: "oklch(0.72 0.14 220)",
      accentBg: "oklch(0.72 0.14 220 / 0.10)",
    },
    {
      label: "Avg R:R",
      value: `${stats.average_rr}R`,
      icon: Zap,
      sub: `${stats.break_even_rate}% break-even rate`,
      accent: "oklch(0.74 0.13 82)",
      accentBg: "oklch(0.74 0.13 82 / 0.10)",
    },
    {
      label: "Active Accounts",
      value: stats.active_accounts.toString(),
      icon: Wallet,
      sub: `$${stats.total_payouts.toLocaleString()} paid out`,
      accent: "oklch(0.58 0.17 145)",
      accentBg: "oklch(0.58 0.17 145 / 0.10)",
    },
    {
      label: "Drawdown Used",
      value: `$${stats.total_drawdown_used.toLocaleString()}`,
      icon: Target,
      sub: "Across all funded accounts",
      accent: "oklch(0.70 0.16 72)",
      accentBg: "oklch(0.70 0.16 72 / 0.10)",
    },
  ];

  const quickLinks = [
    { href: "/journal", label: "Trade Journal", icon: BookOpen, desc: "Log a new trade" },
    { href: "/analysis", label: "Analysis", icon: LineChart, desc: "Pre-trade prep" },
    { href: "/habits", label: "Habits", icon: CheckSquare, desc: "Daily routines" },
    { href: "/news", label: "News", icon: Newspaper, desc: "Market updates" },
  ];

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="animate-fade-up">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {format(new Date(), "EEEE, MMMM d, yyyy")}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, sub, accent, accentBg }, i) => (
          <div
            key={label}
            className="animate-fade-up rounded-xl p-5 relative overflow-hidden"
            style={{
              background: "oklch(0.12 0.018 252)",
              border: "1px solid oklch(0.22 0.025 252)",
              animationDelay: `${i * 60}ms`,
            }}
          >
            {/* Subtle top sheen */}
            <div
              className="absolute inset-x-0 top-0 h-px"
              style={{ background: `linear-gradient(90deg, transparent, ${accent.replace(')', ' / 0.40)')}, transparent)` }}
            />
            <div className="flex items-start justify-between mb-4">
              <p
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: "oklch(0.45 0.04 252)" }}
              >
                {label}
              </p>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: accentBg }}
              >
                <Icon className="w-3.5 h-3.5" style={{ color: accent }} />
              </div>
            </div>
            <p
              className="text-3xl font-black tracking-tight mb-1 tabular-nums"
              style={{ color: accent }}
            >
              {value}
            </p>
            <p className="text-xs text-muted-foreground">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent trades */}
        <div className="lg:col-span-2 animate-fade-up" style={{ animationDelay: "200ms" }}>
          <div
            className="rounded-xl overflow-hidden"
            style={{
              background: "oklch(0.12 0.018 252)",
              border: "1px solid oklch(0.22 0.025 252)",
            }}
          >
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: "1px solid oklch(0.22 0.025 252)" }}
            >
              <h2 className="text-sm font-semibold">Recent Trades</h2>
              <Link
                href="/journal"
                className="text-xs flex items-center gap-1 transition-colors hover:opacity-80"
                style={{ color: "oklch(0.72 0.14 220)" }}
              >
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {recentTrades.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-sm text-muted-foreground mb-3">No trades logged yet.</p>
                <Link
                  href="/journal/new"
                  className="inline-flex items-center gap-1.5 text-xs font-medium transition-colors"
                  style={{ color: "oklch(0.72 0.14 220)" }}
                >
                  <Plus className="w-3.5 h-3.5" /> Log your first trade
                </Link>
              </div>
            ) : (
              <div>
                {recentTrades.map((trade, i) => (
                  <Link
                    key={trade.id}
                    href={`/journal/${trade.id}`}
                    className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-white/[0.02]"
                    style={{
                      borderBottom: i < recentTrades.length - 1 ? "1px solid oklch(0.22 0.025 252)" : undefined,
                    }}
                  >
                    <div className="flex items-center gap-2 shrink-0">
                      <ResultBadge result={trade.result} />
                      {trade.direction === "long" ? (
                        <TrendingUp className="w-3.5 h-3.5 text-success" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5 text-destructive" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{trade.instrument}</p>
                      <p className="text-xs text-muted-foreground truncate capitalize">
                        {trade.session} · {trade.market}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p
                        className="text-sm font-bold"
                        style={{
                          color:
                            trade.result === "win"
                              ? "oklch(0.58 0.17 145)"
                              : trade.result === "loss"
                              ? "oklch(0.58 0.22 25)"
                              : "oklch(0.70 0.16 72)",
                        }}
                      >
                        {trade.result === "win" ? "+" : trade.result === "loss" ? "-" : ""}
                        {trade.rr}R
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(trade.date_time.slice(0, 10) + "T12:00:00"), "MMM d")}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Accounts summary */}
        <div className="space-y-4 animate-fade-up" style={{ animationDelay: "280ms" }}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Funded Accounts</h2>
            <Link
              href="/accounts"
              className="text-xs flex items-center gap-1 transition-colors hover:opacity-80"
              style={{ color: "oklch(0.72 0.14 220)" }}
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {accounts.length === 0 && (
            <div
              className="rounded-xl p-6 text-center"
              style={{
                background: "oklch(0.12 0.018 252)",
                border: "1px solid oklch(0.22 0.025 252)",
              }}
            >
              <p className="text-sm text-muted-foreground mb-3">No accounts added yet.</p>
              <Link
                href="/accounts/new"
                className="inline-flex items-center gap-1.5 text-xs font-medium transition-colors"
                style={{ color: "oklch(0.72 0.14 220)" }}
              >
                <Plus className="w-3.5 h-3.5" /> Add funded account
              </Link>
            </div>
          )}

          {accounts.map((acct) => {
            const drawdownPct = Math.round((acct.drawdown_used / acct.max_drawdown) * 100);
            const payoutPct = Math.min(
              100,
              Math.round((acct.payout_total / acct.next_payout_target) * 100)
            );
            return (
              <Link key={acct.id} href={`/accounts/${acct.id}`}>
                <div
                  className="rounded-xl p-4 transition-all hover:border-opacity-60 cursor-pointer"
                  style={{
                    background: "oklch(0.12 0.018 252)",
                    border: "1px solid oklch(0.22 0.025 252)",
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-xs font-semibold">{acct.account_name}</p>
                      <p className="text-xs text-muted-foreground">{acct.firm_name}</p>
                    </div>
                    <span
                      className="text-xs px-2 py-0.5 rounded-md font-medium capitalize"
                      style={
                        acct.phase === "funded"
                          ? { background: "oklch(0.58 0.17 145 / 0.15)", color: "oklch(0.58 0.17 145)" }
                          : acct.phase === "evaluation"
                          ? { background: "oklch(0.70 0.16 72 / 0.15)", color: "oklch(0.70 0.16 72)" }
                          : { background: "oklch(0.72 0.14 220 / 0.15)", color: "oklch(0.72 0.14 220)" }
                      }
                    >
                      {acct.phase}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-1 mb-3">
                    <span
                      className="text-lg font-black tabular-nums"
                      style={{
                        color:
                          acct.roi >= 0 ? "oklch(0.58 0.17 145)" : "oklch(0.58 0.22 25)",
                      }}
                    >
                      {acct.roi >= 0 ? "+" : ""}
                      {acct.roi}%
                    </span>
                    <span className="text-xs text-muted-foreground">ROI</span>
                  </div>

                  <div className="space-y-1 mb-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Drawdown</span>
                      <span>{drawdownPct}%</span>
                    </div>
                    <Progress
                      value={drawdownPct}
                      className={cn(
                        "h-1.5",
                        drawdownPct > 60 ? "[&>div]:bg-destructive" : "[&>div]:bg-warning"
                      )}
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Payout progress</span>
                      <span>
                        ${acct.payout_total.toLocaleString()} / $
                        {acct.next_payout_target.toLocaleString()}
                      </span>
                    </div>
                    <Progress value={payoutPct} className="h-1.5 [&>div]:bg-primary" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Quick navigation */}
      <div className="animate-fade-up" style={{ animationDelay: "360ms" }}>
        <h2 className="text-sm font-semibold mb-4">Quick Navigation</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {quickLinks.map(({ href, label, icon: Icon, desc }) => (
            <Link key={href} href={href}>
              <div
                className="rounded-xl p-4 transition-all hover:-translate-y-0.5 cursor-pointer group"
                style={{
                  background: "oklch(0.12 0.018 252)",
                  border: "1px solid oklch(0.22 0.025 252)",
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center mb-3 transition-all group-hover:scale-110"
                  style={{
                    background: "oklch(0.72 0.14 220 / 0.10)",
                  }}
                >
                  <Icon className="w-4 h-4" style={{ color: "oklch(0.72 0.14 220)" }} />
                </div>
                <p className="text-sm font-semibold">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Featured news */}
      {featuredNews.length > 0 && (
        <div className="animate-fade-up" style={{ animationDelay: "440ms" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">Featured News</h2>
            <Link
              href="/news"
              className="text-xs flex items-center gap-1 transition-colors hover:opacity-80"
              style={{ color: "oklch(0.72 0.14 220)" }}
            >
              All news <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {featuredNews.map((item) => (
              <div
                key={item.id}
                className="rounded-xl p-4"
                style={{
                  background: "oklch(0.12 0.018 252)",
                  border: "1px solid oklch(0.22 0.025 252)",
                }}
              >
                <div className="flex items-start gap-3">
                  <span
                    className="text-xs px-2 py-0.5 rounded-md font-semibold shrink-0 mt-0.5 capitalize"
                    style={
                      item.impact_level === "high"
                        ? { background: "oklch(0.58 0.22 25 / 0.15)", color: "oklch(0.58 0.22 25)" }
                        : item.impact_level === "medium"
                        ? { background: "oklch(0.70 0.16 72 / 0.15)", color: "oklch(0.70 0.16 72)" }
                        : { background: "oklch(0.28 0.025 252)", color: "oklch(0.55 0.04 252)" }
                    }
                  >
                    {item.impact_level}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-snug mb-1">{item.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{item.summary}</p>
                    <p
                      className="text-xs mt-2"
                      style={{ color: "oklch(0.40 0.03 252)" }}
                    >
                      {item.source_name} · {format(new Date(item.published_at), "MMM d, h:mm a")}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
