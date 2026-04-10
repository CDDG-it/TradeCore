"use client";

import { use } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Shield,
  Target,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getAccountById, getPayoutsByAccountId } from "@/lib/mock/store";
import { cn } from "@/lib/utils";
import type { PayoutStatus } from "@/lib/types";

function PayoutStatusBadge({ status }: { status: PayoutStatus }) {
  const config = {
    paid: { cls: "bg-success/15 text-success border-success/20", icon: CheckCircle },
    pending: { cls: "bg-warning/15 text-warning border-warning/20", icon: Clock },
    rejected: { cls: "bg-destructive/15 text-destructive border-destructive/20", icon: XCircle },
  };
  const { cls, icon: Icon } = config[status];
  return (
    <Badge className={cn("text-xs flex items-center gap-1", cls)}>
      <Icon className="w-3 h-3" />
      {status}
    </Badge>
  );
}

export default function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const account = getAccountById(id);

  if (!account) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground text-sm">Account not found.</p>
        <Link href="/accounts" className="text-primary text-sm hover:underline mt-2 inline-block">
          ← Back to accounts
        </Link>
      </div>
    );
  }

  const payouts = getPayoutsByAccountId(id);
  const drawdownPct = Math.min(100, Math.round((account.drawdown_used / account.max_drawdown) * 100));
  const drawdownRemaining = account.max_drawdown - account.drawdown_used;
  const profitGained = account.current_balance - account.start_balance;
  const payoutTarget = account.next_payout_target;
  const payoutProgress =
    account.phase !== "evaluation"
      ? Math.min(100, Math.round((account.payout_total / payoutTarget) * 100))
      : Math.min(100, Math.round((profitGained / payoutTarget) * 100));

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back + header */}
      <div>
        <Link
          href="/accounts"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Accounts
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{account.firm_name}</p>
            <h1 className="text-2xl font-bold tracking-tight">{account.account_name}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge className={cn(
                "capitalize text-xs",
                account.phase === "funded" ? "bg-success/15 text-success border-success/20"
                  : account.phase === "evaluation" ? "bg-warning/15 text-warning border-warning/20"
                  : "bg-primary/15 text-primary border-primary/20"
              )}>
                {account.phase}
              </Badge>
              <Badge className={cn(
                "capitalize text-xs",
                account.status === "active" ? "bg-success/15 text-success border-success/20"
                  : "bg-muted text-muted-foreground"
              )}>
                {account.status}
              </Badge>
              <span className="text-xs text-muted-foreground">
                ${account.account_size.toLocaleString()} {account.account_type}
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="flex items-center gap-1.5 justify-end">
              {account.roi >= 0 ? (
                <TrendingUp className="w-5 h-5 text-success" />
              ) : (
                <TrendingDown className="w-5 h-5 text-destructive" />
              )}
              <span className={cn("text-3xl font-bold", account.roi >= 0 ? "text-success" : "text-destructive")}>
                {account.roi >= 0 ? "+" : ""}{account.roi}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground">ROI</p>
          </div>
        </div>
      </div>

      {/* Balance metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Current Balance", value: `$${account.current_balance.toLocaleString()}`, icon: DollarSign },
          { label: "Start Balance", value: `$${account.start_balance.toLocaleString()}`, icon: DollarSign },
          { label: "P&L Gained", value: `${profitGained >= 0 ? "+" : ""}$${profitGained.toLocaleString()}`, icon: profitGained >= 0 ? TrendingUp : TrendingDown },
          { label: "Total Payouts", value: `$${account.payout_total.toLocaleString()}`, icon: DollarSign },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label} className="bg-card border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
              <p className="text-lg font-bold font-mono">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Drawdown tracker */}
      <Card className="bg-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Shield className="w-4 h-4 text-warning" />
            Drawdown Tracker
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Drawdown used</span>
              <span className={cn("font-semibold", drawdownPct > 60 ? "text-destructive" : "text-warning")}>
                ${account.drawdown_used.toLocaleString()} / ${account.max_drawdown.toLocaleString()}
              </span>
            </div>
            <Progress
              value={drawdownPct}
              className={cn("h-3", drawdownPct > 60 ? "[&>div]:bg-destructive" : "[&>div]:bg-warning")}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{drawdownPct}% of max drawdown used</span>
              <span>${drawdownRemaining.toLocaleString()} remaining</span>
            </div>
          </div>

          {account.trailing_drawdown && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Trailing drawdown</span>
                <span className="font-semibold text-muted-foreground">
                  ${account.trailing_drawdown.toLocaleString()} limit
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs text-muted-foreground">
                <div className="bg-muted/40 rounded-lg p-3 text-center">
                  <p className="font-semibold text-foreground text-sm">${account.trailing_drawdown.toLocaleString()}</p>
                  <p>Max trailing</p>
                </div>
                <div className="bg-muted/40 rounded-lg p-3 text-center">
                  <p className="font-semibold text-foreground text-sm">${account.drawdown_used.toLocaleString()}</p>
                  <p>Currently used</p>
                </div>
                <div className="bg-muted/40 rounded-lg p-3 text-center">
                  <p className={cn("font-semibold text-sm", (account.trailing_drawdown - account.drawdown_used) < 500 ? "text-destructive" : "text-success")}>
                    ${(account.trailing_drawdown - account.drawdown_used).toLocaleString()}
                  </p>
                  <p>Safe buffer</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payout tracker */}
      <Card className="bg-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            {account.phase === "evaluation" ? "Profit Target" : "Payout Tracker"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {account.phase === "evaluation" ? "Profit gained" : "Total paid out"}
              </span>
              <span className="font-semibold">
                ${account.phase === "evaluation" ? profitGained.toLocaleString() : account.payout_total.toLocaleString()} / ${payoutTarget.toLocaleString()}
              </span>
            </div>
            <Progress value={payoutProgress} className="h-3 [&>div]:bg-primary" />
            <p className="text-xs text-muted-foreground">
              {payoutProgress}% of target · ${(payoutTarget - (account.phase === "evaluation" ? profitGained : account.payout_total)).toLocaleString()} to go
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Payout history */}
      {payouts.length > 0 && (
        <Card className="bg-card border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-success" />
              Payout History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/40">
              {payouts.map((payout) => (
                <div key={payout.id} className="flex items-center gap-4 px-5 py-4">
                  <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {format(new Date(payout.payout_date), "MMMM d, yyyy")}
                    </p>
                    {payout.notes && (
                      <p className="text-xs text-muted-foreground truncate">{payout.notes}</p>
                    )}
                  </div>
                  <PayoutStatusBadge status={payout.status} />
                  <p className="text-sm font-bold text-success shrink-0">
                    +${payout.amount.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-border/40 flex justify-between text-sm">
              <span className="text-muted-foreground">Total received</span>
              <span className="font-bold text-success">
                $
                {payouts
                  .filter((p) => p.status === "paid")
                  .reduce((s, p) => s + p.amount, 0)
                  .toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {account.notes && (
        <Card className="bg-card border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground/80 leading-relaxed">{account.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Meta */}
      <div className="text-xs text-muted-foreground/60">
        Account created {format(new Date(account.created_at), "MMMM d, yyyy")} · Last updated{" "}
        {format(new Date(account.updated_at), "MMM d, yyyy")}
      </div>
    </div>
  );
}
