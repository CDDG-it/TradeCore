"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createAccount } from "@/lib/mock/store";
import type { AccountPhase, AccountStatus, FundedAccountInput } from "@/lib/types";
import { cn } from "@/lib/utils";

const PHASES: AccountPhase[] = ["evaluation", "funded", "payout"];
const STATUSES: AccountStatus[] = ["active", "inactive", "blown", "passed"];

export default function NewAccountPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<FundedAccountInput>({
    firm_name: "",
    account_name: "",
    account_type: "futures",
    phase: "funded",
    account_size: 50000,
    purchase_cost: 149,
    start_balance: 50000,
    current_balance: 50000,
    roi: 0,
    max_drawdown: 2000,
    trailing_drawdown: undefined,
    drawdown_used: 0,
    payout_total: 0,
    next_payout_target: 3000,
    status: "active",
    notes: "",
  });

  function set<K extends keyof FundedAccountInput>(key: K, value: FundedAccountInput[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      // Auto-calculate ROI on purchase cost whenever relevant fields change
      const cost = key === "purchase_cost" ? (value as number) : prev.purchase_cost;
      const start = key === "start_balance" ? (value as number) : prev.start_balance;
      const current = key === "current_balance" ? (value as number) : prev.current_balance;
      if (cost > 0) {
        next.roi = Math.round(((current - start) / cost) * 10000) / 100;
      }
      // Keep account_size + start_balance in sync when account_size changes
      if (key === "account_size") {
        next.start_balance = value as number;
        next.current_balance = value as number;
        if (cost > 0) next.roi = 0;
      }
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.firm_name || !form.account_name) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 300));
    const created = createAccount(form);
    router.push(`/accounts/${created.id}`);
  }

  const profitGained = form.current_balance - form.start_balance;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href="/accounts" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Accounts
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-primary">Add Funded Account</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Track a new prop firm account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Account Info */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Account Info</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Firm Name *</Label>
                <Input value={form.firm_name} onChange={(e) => set("firm_name", e.target.value)}
                  placeholder="e.g. Topstep, Apex, FTMO..." className="h-9 text-sm" required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Account Name *</Label>
                <Input value={form.account_name} onChange={(e) => set("account_name", e.target.value)}
                  placeholder="e.g. 50K Futures" className="h-9 text-sm" required />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Account Type</Label>
                <div className="flex gap-1.5">
                  {["futures", "commodities"].map((t) => (
                    <button key={t} type="button" onClick={() => set("account_type", t)}
                      className={cn("flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize",
                        form.account_type === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Phase</Label>
                <div className="flex gap-1">
                  {PHASES.map((p) => (
                    <button key={p} type="button" onClick={() => set("phase", p)}
                      className={cn("flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize",
                        form.phase === p
                          ? p === "funded" ? "bg-success text-success-foreground"
                            : p === "evaluation" ? "bg-warning text-warning-foreground"
                            : "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:text-foreground")}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Status</Label>
              <div className="flex gap-1.5">
                {STATUSES.map((s) => (
                  <button key={s} type="button" onClick={() => set("status", s)}
                    className={cn("flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize",
                      form.status === s
                        ? s === "active" ? "bg-success text-success-foreground"
                          : s === "blown" ? "bg-destructive text-white"
                          : "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:text-foreground")}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financials */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Financials</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Account Size ($) *</Label>
                <Input type="number" value={form.account_size}
                  onChange={(e) => set("account_size", parseFloat(e.target.value) || 0)}
                  className="h-9 text-sm font-mono" required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">
                  Purchase Cost ($) *
                  <span className="ml-1 text-muted-foreground/60 font-normal">— real money paid</span>
                </Label>
                <Input type="number" step="0.01" value={form.purchase_cost}
                  onChange={(e) => set("purchase_cost", parseFloat(e.target.value) || 0)}
                  placeholder="e.g. 149" className="h-9 text-sm font-mono" required />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Current Balance ($) *</Label>
                <Input type="number" step="0.01" value={form.current_balance}
                  onChange={(e) => set("current_balance", parseFloat(e.target.value) || 0)}
                  className="h-9 text-sm font-mono" required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">ROI on Purchase Cost (%)</Label>
                <div className="relative">
                  <Input type="number" step="0.01" value={form.roi} readOnly
                    className="h-9 text-sm font-mono bg-muted cursor-not-allowed pr-24"
                    title="Auto-calculated: (profit / purchase cost) × 100" />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/70">
                    {profitGained >= 0 ? "+" : ""}${profitGained.toFixed(0)} profit
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground/60">Based on purchase cost, not account size</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Drawdown */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Drawdown</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Max Drawdown ($) *</Label>
                <Input type="number" value={form.max_drawdown}
                  onChange={(e) => set("max_drawdown", parseFloat(e.target.value) || 0)}
                  className="h-9 text-sm font-mono" required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Trailing Drawdown ($)</Label>
                <Input type="number" value={form.trailing_drawdown ?? ""}
                  onChange={(e) => set("trailing_drawdown", e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="Optional" className="h-9 text-sm font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Drawdown Used ($)</Label>
                <Input type="number" step="0.01" value={form.drawdown_used}
                  onChange={(e) => set("drawdown_used", parseFloat(e.target.value) || 0)}
                  className="h-9 text-sm font-mono" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payout */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Payout Tracking</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Total Paid Out ($)</Label>
                <Input type="number" step="0.01" value={form.payout_total}
                  onChange={(e) => set("payout_total", parseFloat(e.target.value) || 0)}
                  className="h-9 text-sm font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Next Payout Target ($)</Label>
                <Input type="number" value={form.next_payout_target}
                  onChange={(e) => set("next_payout_target", parseFloat(e.target.value) || 0)}
                  className="h-9 text-sm font-mono" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Notes</Label>
              <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)}
                placeholder="Any notes about this account, rules, strategy..." className="text-sm min-h-20 resize-none" />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Link href="/accounts"><Button type="button" variant="outline">Cancel</Button></Link>
          <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Add account"}</Button>
        </div>
      </form>
    </div>
  );
}
