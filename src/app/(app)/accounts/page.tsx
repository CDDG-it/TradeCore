"use client";

import Link from "next/link";
import { Plus, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getAccounts } from "@/lib/mock/store";
import { cn } from "@/lib/utils";
import type { AccountPhase, AccountStatus } from "@/lib/types";

function PhaseBadge({ phase }: { phase: AccountPhase }) {
  const config = {
    funded: "bg-success/15 text-success border-success/20",
    evaluation: "bg-warning/15 text-warning border-warning/20",
    payout: "bg-primary/15 text-primary border-primary/20",
  };
  return (
    <Badge className={cn("text-xs capitalize", config[phase])}>{phase}</Badge>
  );
}

function StatusDot({ status }: { status: AccountStatus }) {
  const colors = {
    active: "bg-success",
    inactive: "bg-muted-foreground",
    blown: "bg-destructive",
    passed: "bg-primary",
  };
  return <span className={cn("w-1.5 h-1.5 rounded-full inline-block", colors[status])} />;
}

export default function AccountsPage() {
  const accounts = getAccounts();

  const totalValue = accounts.reduce((s, a) => s + a.current_balance, 0);
  const totalPayouts = accounts.reduce((s, a) => s + a.payout_total, 0);
  const activeCount = accounts.filter((a) => a.status === "active").length;
  const avgRoi =
    accounts.length > 0
      ? (accounts.reduce((s, a) => s + a.roi, 0) / accounts.length).toFixed(1)
      : "0";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Funded Accounts</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {accounts.length} accounts · {activeCount} active
          </p>
        </div>
        <Link
          href="/accounts/new"
          className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all hover:-translate-y-px shrink-0"
          style={{
            background: "oklch(0.74 0.13 82)",
            color: "oklch(0.08 0.014 252)",
            boxShadow: "0 4px 14px oklch(0.74 0.13 82 / 0.30)",
          }}
        >
          <Plus className="w-4 h-4" />
          Add account
        </Link>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Capital", value: `$${(totalValue / 1000).toFixed(0)}K` },
          { label: "Total Payouts", value: `$${totalPayouts.toLocaleString()}` },
          { label: "Active Accounts", value: activeCount.toString() },
          { label: "Avg ROI", value: `${avgRoi}%` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-card border border-border/50 rounded-xl p-4 text-center">
            <p className="text-xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Account cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {accounts.map((acct) => {
          const drawdownPct = Math.min(
            100,
            Math.round((acct.drawdown_used / acct.max_drawdown) * 100)
          );
          const payoutPct = Math.min(
            100,
            acct.next_payout_target > 0
              ? Math.round((acct.payout_total / acct.next_payout_target) * 100)
              : 0
          );
          const drawdownRemaining = acct.max_drawdown - acct.drawdown_used;

          return (
            <Link key={acct.id} href={`/accounts/${acct.id}`}>
              <Card className="bg-card border-border/50 hover:border-primary/30 transition-colors h-full">
                <CardContent className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <StatusDot status={acct.status} />
                        <span className="text-xs text-muted-foreground">{acct.firm_name}</span>
                      </div>
                      <p className="font-semibold text-sm">{acct.account_name}</p>
                    </div>
                    <PhaseBadge phase={acct.phase} />
                  </div>

                  {/* Balance + ROI */}
                  <div className="flex items-end justify-between mb-4">
                    <div>
                      <p className="text-2xl font-bold font-mono">
                        ${acct.current_balance.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        of ${acct.account_size.toLocaleString()} account
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-right">
                      {acct.roi >= 0 ? (
                        <TrendingUp className="w-4 h-4 text-success" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-destructive" />
                      )}
                      <span
                        className={cn(
                          "text-lg font-bold",
                          acct.roi >= 0 ? "text-success" : "text-destructive"
                        )}
                      >
                        {acct.roi >= 0 ? "+" : ""}
                        {acct.roi}%
                      </span>
                    </div>
                  </div>

                  {/* Drawdown */}
                  <div className="space-y-1.5 mb-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Drawdown used</span>
                      <span
                        className={cn(
                          "font-medium",
                          drawdownPct > 60 ? "text-destructive" : drawdownPct > 40 ? "text-warning" : "text-muted-foreground"
                        )}
                      >
                        ${acct.drawdown_used.toLocaleString()} / ${acct.max_drawdown.toLocaleString()}
                      </span>
                    </div>
                    <Progress
                      value={drawdownPct}
                      className={cn(
                        "h-1.5",
                        drawdownPct > 60 ? "[&>div]:bg-destructive" : "[&>div]:bg-warning"
                      )}
                    />
                    <p className="text-xs text-muted-foreground">
                      ${drawdownRemaining.toLocaleString()} remaining before breach
                    </p>
                  </div>

                  {/* Payout progress */}
                  {acct.phase !== "evaluation" && (
                    <div className="space-y-1.5 border-t border-border/30 pt-3">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Payout progress</span>
                        <span className="font-medium">
                          ${acct.payout_total.toLocaleString()} / ${acct.next_payout_target.toLocaleString()}
                        </span>
                      </div>
                      <Progress value={payoutPct} className="h-1.5 [&>div]:bg-primary" />
                    </div>
                  )}

                  {acct.phase === "evaluation" && (
                    <div className="space-y-1.5 border-t border-border/30 pt-3">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Profit target</span>
                        <span className="font-medium">
                          ${(acct.current_balance - acct.start_balance).toLocaleString()} / ${acct.next_payout_target.toLocaleString()}
                        </span>
                      </div>
                      <Progress
                        value={Math.min(
                          100,
                          Math.round(
                            ((acct.current_balance - acct.start_balance) / acct.next_payout_target) * 100
                          )
                        )}
                        className="h-1.5 [&>div]:bg-warning"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-end mt-3">
                    <span className="text-xs text-primary flex items-center gap-1">
                      Details <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
