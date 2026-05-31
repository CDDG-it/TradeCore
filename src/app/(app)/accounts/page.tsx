"use client";

import Link from "next/link";
import { Plus, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { PageWrapper } from "@/components/ui/page-wrapper";
import { Card, CardContent } from "@/components/ui/card";
import { getAccounts, computeAccountROI, getPayoutsByAccountId } from "@/lib/mock/store";
import { cn } from "@/lib/utils";

export default function AccountsPage() {
  const accounts = getAccounts();

  const totalFeePaid = accounts.reduce((s, a) => s + (a.purchase_cost ?? 0), 0);
  const totalPayouts = accounts.reduce((s, a) => {
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
        {accounts.length === 0 ? (
          <div className="bg-card border border-border/50 rounded-xl p-12 text-center">
            <p className="text-sm text-muted-foreground mb-3">No accounts added yet.</p>
            <Link href="/accounts/new" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
              <Plus className="w-3.5 h-3.5" /> Add your first account
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {accounts.map((acct) => {
              const payouts = getPayoutsByAccountId(acct.id);
              const totalPaid = payouts.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
              const roi = computeAccountROI(totalPaid, acct.purchase_cost);

              return (
                <Link key={acct.id} href={`/accounts/${acct.id}`}>
                  <Card className="bg-card border-border/50 hover:border-primary/30 transition-colors h-full">
                    <CardContent className="p-5">
                      <div className="mb-4">
                        <p className="text-xs text-muted-foreground mb-0.5">{acct.firm_name}</p>
                        <p className="font-semibold text-sm">{acct.account_name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">${acct.account_size.toLocaleString()}</p>
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
