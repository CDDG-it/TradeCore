"use client";

import Link from "next/link";
import { Plus, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { PageWrapper } from "@/components/ui/page-wrapper";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getAccounts, computeAccountROI } from "@/lib/mock/store";
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

  const totalFeePaid = accounts.reduce((s, a) => s + (a.purchase_cost ?? 0), 0);
  const totalPayouts = accounts.reduce((s, a) => s + a.payout_total, 0);
  const activeCount = accounts.filter((a) => a.status === "active").length;
  // Overall ROI multiple = total payout / total fees paid (e.g. 2.0x)
  const overallRoi = totalFeePaid > 0
    ? Math.round((totalPayouts / totalFeePaid) * 10) / 10
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Trading"
        title="Accounts"
        subtitle="Funded and personal accounts"
        action={
          <Link
            href="/accounts/new"
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all hover:-translate-y-px shrink-0"
            style={{
              background: "oklch(0.72 0.22 45)",
              color: "oklch(0.07 0.003 28)",
              boxShadow: "0 4px 14px oklch(0.72 0.22 45 / 0.30)",
            }}
          >
            <Plus className="w-4 h-4" />
            Add account
          </Link>
        }
      />
      <PageWrapper>
      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Fees Paid", value: `$${totalFeePaid.toLocaleString()}`, tooltip: "Total real money invested in prop firm challenges" },
          { label: "Total Payouts", value: `$${totalPayouts.toLocaleString()}`, tooltip: "Total money received from all accounts" },
          { label: "Active Accounts", value: activeCount.toString(), tooltip: undefined },
          { label: "Return on Cost", value: `${overallRoi}x`, tooltip: "Total payouts ÷ total fees paid" },
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
          // ROI = payout received / actual fees paid × 100
          const roi = computeAccountROI(acct.payout_total, acct.purchase_cost);

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

                  {/* Balance + ROI on Cost */}
                  <div className="flex items-end justify-between mb-4">
                    <div>
                      <p className="text-2xl font-bold font-mono">
                        ${acct.current_balance.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        of ${acct.account_size.toLocaleString()} account
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        {roi >= 0 ? (
                          <TrendingUp className="w-4 h-4 text-success" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-destructive" />
                        )}
                        <span
                          className={cn(
                            "text-lg font-bold",
                            roi >= 1 ? "text-success" : roi > 0 ? "text-warning" : "text-destructive"
                          )}
                        >
                          {roi}x
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        on ${acct.purchase_cost.toLocaleString()} paid
                      </p>
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
      </PageWrapper>
    </div>
  );
}
