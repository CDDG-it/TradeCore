"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { PageWrapper } from "@/components/ui/page-wrapper";
import { Card, CardContent } from "@/components/ui/card";
import { getAccounts, computeAccountROI, getPayoutsByAccountId } from "@/lib/mock/store";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | "active" | "inactive";

export default function AccountsPage() {
  const accounts = getAccounts();
  const [firmFilter, setFirmFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const uniqueFirms = Array.from(new Set(accounts.map((a) => a.firm_name).filter(Boolean)));

  // Stats use ALL accounts (firm-filtered but not status-filtered)
  const firmAccounts = firmFilter === "all" ? accounts : accounts.filter((a) => a.firm_name === firmFilter);
  const activeAccounts = firmAccounts.filter((a) => a.status === "active");

  const totalFeePaid = firmAccounts.reduce((s, a) => s + (a.purchase_cost ?? 0), 0);
  const totalPayouts = firmAccounts.reduce((s, a) => {
    const payouts = getPayoutsByAccountId(a.id);
    return s + payouts.filter((p) => p.status === "paid").reduce((ps, p) => ps + p.amount, 0);
  }, 0);
  const overallRoi = totalFeePaid > 0 ? Math.round((totalPayouts / totalFeePaid) * 10) / 10 : 0;
  const activeCapital = activeAccounts.reduce((s, a) => s + (a.current_balance ?? a.account_size), 0);

  // Cards filtered by firm + status
  const filtered = firmAccounts.filter((a) => {
    if (statusFilter === "all") return true;
    return a.status === statusFilter;
  });

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
        {/* Filters */}
        {(uniqueFirms.length > 1 || accounts.length > 0) && (
          <div className="flex flex-wrap items-center gap-3">
            {/* Firm filter */}
            {uniqueFirms.length > 1 && (
              <div className="flex flex-wrap gap-1.5">
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

            {/* Divider between filter groups */}
            {uniqueFirms.length > 1 && <div className="h-4 w-px bg-border" />}

            {/* Status filter */}
            {accounts.length > 0 && (
              <div className="flex gap-1.5">
                {(["all", "active", "inactive"] as StatusFilter[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-xs font-medium capitalize transition-all",
                      statusFilter === s
                        ? s === "active"
                          ? "border-success bg-success/10 text-success"
                          : s === "inactive"
                          ? "border-muted-foreground bg-muted text-muted-foreground"
                          : "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    )}
                  >
                    {s === "all" ? "All status" : s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Summary stats — always based on all accounts in firm filter */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Fee Paid", value: `$${totalFeePaid.toLocaleString()}`, note: "all accounts" },
            { label: "Total Payouts", value: `$${totalPayouts.toLocaleString()}`, note: "all accounts" },
            { label: "Active Capital", value: `$${activeCapital.toLocaleString()}`, note: "active only", highlight: true },
            { label: "Return on Cost", value: `${overallRoi}x`, note: "all accounts" },
          ].map(({ label, value, note, highlight }) => (
            <div key={label} className={cn(
              "bg-card border rounded-xl p-4 text-center",
              highlight ? "border-success/30" : "border-border/50"
            )}>
              <p className={cn("text-xl font-bold", highlight && "text-success")}>{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              <p className="text-[10px] text-muted-foreground/50 mt-0.5">{note}</p>
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
              <p className="text-sm text-muted-foreground">No accounts match the current filter.</p>
            )}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((acct) => {
              const payouts = getPayoutsByAccountId(acct.id);
              const totalPaid = payouts.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
              const roi = computeAccountROI(totalPaid, acct.purchase_cost);
              const isInactive = acct.status === "inactive" || acct.status === "blown";

              return (
                <Link key={acct.id} href={`/accounts/${acct.id}`}>
                  <Card className={cn(
                    "bg-card border-border/50 hover:border-primary/30 transition-colors h-full",
                    isInactive && "opacity-60"
                  )}>
                    <CardContent className="p-5">
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className="text-xs text-muted-foreground">{acct.firm_name}</p>
                          {acct.status !== "active" && (
                            <span className={cn(
                              "text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full",
                              acct.status === "blown" ? "bg-destructive/10 text-destructive" :
                              acct.status === "passed" ? "bg-success/10 text-success" :
                              "bg-muted text-muted-foreground"
                            )}>
                              {acct.status}
                            </span>
                          )}
                        </div>
                        <div className="flex items-baseline gap-2">
                          <p className="font-semibold text-sm">{acct.firm_name}</p>
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
