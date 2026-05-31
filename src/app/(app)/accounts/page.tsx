"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { PageWrapper } from "@/components/ui/page-wrapper";
import { Card, CardContent } from "@/components/ui/card";
import { getAccounts, computeAccountROI, getPayoutsByAccountId } from "@/lib/mock/store";
import { cn } from "@/lib/utils";

export default function AccountsPage() {
  const accounts = getAccounts();
  const [firmFilter, setFirmFilter] = useState<string>("all");

  // Unique firms from existing accounts, preserving insertion order
  const uniqueFirms = Array.from(new Set(accounts.map((a) => a.firm_name).filter(Boolean)));

  const filtered = firmFilter === "all" ? accounts : accounts.filter((a) => a.firm_name === firmFilter);

  const totalFeePaid = filtered.reduce((s, a) => s + (a.purchase_cost ?? 0), 0);
  const totalPayouts = filtered.reduce((s, a) => {
    const payouts = getPayoutsByAccountId(a.id);
    return s + payouts.filter((p) => p.status === "paid").reduce((ps, p) => ps + p.amount, 0);
  }, 0);
  const overallRoi = totalFeePaid > 0 ? Math.round((totalPayouts / totalFeePaid) * 10) / 10 : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Trading"
        title="Accounts"
        subtitle="Funded prop firm accounts"
        action={
          <Link
            href="/accounts/new"
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all hover:-translate-y-px shrink-0 bg-primary text-primary-foreground"
          >
            <Plus className="w-4 h-4" />
            Add account
          </Link>
        }
      />
      <PageWrapper>
        {/* Firm filter — only shown when there are multiple firms */}
        {uniqueFirms.length > 1 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFirmFilter("all")}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
                firmFilter === "all"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
              )}
            >
              All firms
            </button>
            {uniqueFirms.map((firm) => (
              <button
                key={firm}
                onClick={() => setFirmFilter(firm)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
                  firmFilter === firm
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                )}
              >
                {firm}
              </button>
            ))}
          </div>
        )}

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Fee Paid", value: `$${totalFeePaid.toLocaleString()}` },
            { label: "Total Payouts", value: `$${totalPayouts.toLocaleString()}` },
            { label: "Return on Cost", value: `${overallRoi}x` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-card border border-border/50 rounded-xl p-4 text-center">
              <p className="text-xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Account cards */}
        {filtered.length === 0 ? (
          <div className="bg-card border border-border/50 rounded-xl p-12 text-center">
            {accounts.length === 0 ? (
              <>
                <p className="text-sm text-muted-foreground mb-3">No accounts added yet.</p>
                <Link href="/accounts/new" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                  <Plus className="w-3.5 h-3.5" /> Add your first account
                </Link>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No accounts for {firmFilter}.</p>
            )}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((acct) => {
              const payouts = getPayoutsByAccountId(acct.id);
              const totalPaid = payouts.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
              const roi = computeAccountROI(totalPaid, acct.purchase_cost);

              return (
                <Link key={acct.id} href={`/accounts/${acct.id}`}>
                  <Card className="bg-card border-border/50 hover:border-primary/30 transition-colors h-full">
                    <CardContent className="p-5">
                      <div className="mb-4">
                        <p className="text-xs text-muted-foreground mb-0.5">{acct.firm_name}</p>
                        <div className="flex items-baseline gap-2">
                          <p className="font-semibold text-sm">{acct.account_name}</p>
                          <span className="text-xs text-muted-foreground font-mono">
                            ${(acct.account_size / 1000).toFixed(0)}K
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">Fee Paid</p>
                          <p className="text-sm font-semibold font-mono">${acct.purchase_cost.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">Total Payout</p>
                          <p className="text-sm font-semibold font-mono">${totalPaid.toLocaleString()}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs text-muted-foreground mb-0.5">ROI</p>
                          <div className="flex items-center gap-1">
                            {roi >= 0 ? (
                              <TrendingUp className="w-3.5 h-3.5 text-success" />
                            ) : (
                              <TrendingDown className="w-3.5 h-3.5 text-destructive" />
                            )}
                            <span className={cn("text-sm font-bold",
                              roi >= 1 ? "text-success" : roi > 0 ? "text-warning" : "text-destructive")}>
                              {roi}x
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end">
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
        )}
      </PageWrapper>
    </div>
  );
}
