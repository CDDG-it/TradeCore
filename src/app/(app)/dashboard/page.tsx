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
  Trophy,
  Target,
  Activity,
  DollarSign,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getDashboardStats, getTrades, getAccounts, getFeaturedNews } from "@/lib/mock/store";
import { cn } from "@/lib/utils";
import type { TradeResult } from "@/lib/types";

function resultBadge(result: TradeResult) {
  if (result === "win")
    return (
      <Badge className="bg-success/15 text-success border-success/20 text-xs">W</Badge>
    );
  if (result === "loss")
    return (
      <Badge className="bg-destructive/15 text-destructive border-destructive/20 text-xs">L</Badge>
    );
  return (
    <Badge className="bg-warning/15 text-warning border-warning/20 text-xs">BE</Badge>
  );
}

function pnlColor(pnl: number) {
  if (pnl > 0) return "text-success";
  if (pnl < 0) return "text-destructive";
  return "text-muted-foreground";
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
      color: "text-primary",
    },
    {
      label: "Total P&L",
      value: `$${stats.total_pnl.toLocaleString()}`,
      icon: DollarSign,
      sub: `Avg ${stats.average_rr}R per trade`,
      color: stats.total_pnl >= 0 ? "text-success" : "text-destructive",
    },
    {
      label: "Active Accounts",
      value: stats.active_accounts.toString(),
      icon: Wallet,
      sub: `$${stats.total_payouts.toLocaleString()} paid out`,
      color: "text-primary",
    },
    {
      label: "Drawdown Used",
      value: `$${stats.total_drawdown_used.toLocaleString()}`,
      icon: Target,
      sub: "Across all funded accounts",
      color: "text-warning",
    },
  ];

  const quickLinks = [
    { href: "/journal", label: "Trade Journal", icon: BookOpen, desc: "Log a new trade" },
    { href: "/analysis", label: "Analysis", icon: LineChart, desc: "Pre-trade prep" },
    { href: "/analytics", label: "Analytics", icon: BarChart2, desc: "View performance" },
    { href: "/news", label: "News", icon: Newspaper, desc: "Market updates" },
  ];

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {format(new Date(), "EEEE, MMMM d, yyyy")}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, sub, color }) => (
          <Card key={label} className="bg-card border-border/50">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  {label}
                </p>
                <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
                  <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
              </div>
              <p className={cn("text-2xl font-bold tracking-tight mb-1", color)}>{value}</p>
              <p className="text-xs text-muted-foreground">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent trades */}
        <div className="lg:col-span-2">
          <Card className="bg-card border-border/50">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold">Recent Trades</CardTitle>
              <Link
                href="/journal"
                className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
              >
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/40">
                {recentTrades.map((trade) => (
                  <Link
                    key={trade.id}
                    href={`/journal/${trade.id}`}
                    className="flex items-center gap-4 px-6 py-3.5 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-2 w-20 shrink-0">
                      {resultBadge(trade.result)}
                      <span
                        className={cn(
                          "text-xs font-medium uppercase",
                          trade.direction === "long" ? "text-success" : "text-destructive"
                        )}
                      >
                        {trade.direction === "long" ? (
                          <TrendingUp className="w-3.5 h-3.5" />
                        ) : (
                          <TrendingDown className="w-3.5 h-3.5" />
                        )}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{trade.instrument}</p>
                      <p className="text-xs text-muted-foreground truncate">{trade.setup}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={cn("text-sm font-semibold", pnlColor(trade.pnl))}>
                        {trade.pnl > 0 ? "+" : ""}${trade.pnl.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(trade.date_time), "MMM d")}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Accounts summary */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Funded Accounts</h2>
            <Link
              href="/accounts"
              className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {accounts.map((acct) => {
            const drawdownPct = Math.round((acct.drawdown_used / acct.max_drawdown) * 100);
            const payoutPct = Math.min(
              100,
              Math.round((acct.payout_total / acct.next_payout_target) * 100)
            );
            return (
              <Link key={acct.id} href={`/accounts/${acct.id}`}>
                <Card className="bg-card border-border/50 hover:border-primary/30 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-xs font-semibold">{acct.account_name}</p>
                        <p className="text-xs text-muted-foreground">{acct.firm_name}</p>
                      </div>
                      <Badge
                        className={cn(
                          "text-xs",
                          acct.phase === "funded"
                            ? "bg-success/15 text-success border-success/20"
                            : acct.phase === "evaluation"
                            ? "bg-warning/15 text-warning border-warning/20"
                            : "bg-primary/15 text-primary border-primary/20"
                        )}
                      >
                        {acct.phase}
                      </Badge>
                    </div>

                    <div className="flex items-baseline gap-1 mb-3">
                      <span
                        className={cn(
                          "text-lg font-bold",
                          acct.roi >= 0 ? "text-success" : "text-destructive"
                        )}
                      >
                        {acct.roi >= 0 ? "+" : ""}
                        {acct.roi}%
                      </span>
                      <span className="text-xs text-muted-foreground">ROI</span>
                    </div>

                    {/* Drawdown bar */}
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

                    {/* Payout bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Payout progress</span>
                        <span>${acct.payout_total.toLocaleString()} / ${acct.next_payout_target.toLocaleString()}</span>
                      </div>
                      <Progress value={payoutPct} className="h-1.5 [&>div]:bg-primary" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Quick navigation */}
      <div>
        <h2 className="text-sm font-semibold mb-4">Quick Navigation</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {quickLinks.map(({ href, label, icon: Icon, desc }) => (
            <Link key={href} href={href}>
              <Card className="bg-card border-border/50 hover:border-primary/30 transition-colors group">
                <CardContent className="p-4">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Featured news */}
      {featuredNews.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">Featured News</h2>
            <Link
              href="/news"
              className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
            >
              All news <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {featuredNews.map((item) => (
              <Card key={item.id} className="bg-card border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Badge
                      className={cn(
                        "text-xs shrink-0 mt-0.5",
                        item.impact_level === "high"
                          ? "bg-destructive/15 text-destructive border-destructive/20"
                          : item.impact_level === "medium"
                          ? "bg-warning/15 text-warning border-warning/20"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {item.impact_level}
                    </Badge>
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-snug mb-1">{item.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{item.summary}</p>
                      <p className="text-xs text-muted-foreground/60 mt-2">
                        {item.source_name} · {format(new Date(item.published_at), "MMM d, h:mm a")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
