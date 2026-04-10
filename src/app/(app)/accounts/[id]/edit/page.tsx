"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { getAccountById, updateAccount } from "@/lib/mock/store";
import type { AccountPhase, AccountStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const PHASES: AccountPhase[] = ["evaluation", "funded", "payout"];
const STATUSES: AccountStatus[] = ["active", "inactive", "blown", "passed"];

export default function EditAccountPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const account = getAccountById(id);
  const [saving, setSaving] = useState(false);

  if (!account) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground text-sm">Account not found.</p>
        <Link href="/accounts" className="text-primary text-sm hover:underline mt-2 inline-block">← Back to accounts</Link>
      </div>
    );
  }

  const [form, setForm] = useState({
    firm_name: account.firm_name,
    account_name: account.account_name,
    account_type: account.account_type,
    phase: account.phase as AccountPhase,
    account_size: account.account_size,
    purchase_cost: account.purchase_cost ?? 0,
    start_balance: account.start_balance,
    current_balance: account.current_balance,
    roi: account.roi,
    max_drawdown: account.max_drawdown,
    trailing_drawdown: account.trailing_drawdown,
    drawdown_used: account.drawdown_used,
    payout_total: account.payout_total,
    next_payout_target: account.next_payout_target,
    status: account.status as AccountStatus,
    notes: account.notes,
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      const cost = key === "purchase_cost" ? (value as number) : prev.purchase_cost;
      const start = key === "start_balance" ? (value as number) : prev.start_balance;
      const current = key === "current_balance" ? (value as number) : prev.current_balance;
      if (cost > 0) {
        next.roi = Math.round(((current - start) / cost) * 10000) / 100;
      }
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.firm_name || !form.account_name) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 300));
    updateAccount(id, form);
    router.push(`/accounts/${id}`);
  }

  const profitGained = form.current_balance - form.start_balance;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href={`/accounts/${id}`} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Account
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Edit Account</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{account.firm_name} · {account.account_name}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
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
                <Label className="text-xs">Phase</Label>
                <div className="flex gap-1">
                  {PHASES.map((p) => (
                    <button key={p} type="button" onClick={() => set("phase", p)}
                      className={cn("flex-1 py-1.5 rounded-lg text-xs font-medium transition-all capitalize",
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
              <div className="space-y-1.5">
                <Label className="text-xs">Status</Label>
                <div className="flex gap-1">
                  {STATUSES.map((s) => (
                    <button key={s} type="button" onClick={() => set("status", s)}
                      className={cn("flex-1 py-1.5 rounded-lg text-xs font-medium transition-all capitalize",
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
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Financials</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Account Size ($)</Label>
                <Input type="number" value={form.account_size}
                  onChange={(e) => set("account_size", parseFloat(e.target.value) || 0)}
                  className="h-9 text-sm font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">
                  Purchase Cost ($)
                  <span className="ml-1 text-muted-foreground/60 font-normal">— real money paid</span>
                </Label>
                <Input type="number" step="0.01" value={form.purchase_cost}
                  onChange={(e) => set("purchase_cost", parseFloat(e.target.value) || 0)}
                  placeholder="e.g. 149" className="h-9 text-sm font-mono" />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Current Balance ($)</Label>
                <Input type="number" step="0.01" value={form.current_balance}
                  onChange={(e) => set("current_balance", parseFloat(e.target.value) || 0)}
                  className="h-9 text-sm font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">ROI on Purchase Cost (%)</Label>
                <div className="relative">
                  <Input type="number" step="0.01" value={form.roi} readOnly
                    className="h-9 text-sm font-mono bg-muted cursor-not-allowed pr-24" />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/70">
                    {profitGained >= 0 ? "+" : ""}${profitGained.toFixed(0)} profit
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground/60">Based on purchase cost, not account size</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Drawdown</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Max Drawdown ($)</Label>
                <Input type="number" value={form.max_drawdown}
                  onChange={(e) => set("max_drawdown", parseFloat(e.target.value) || 0)}
                  className="h-9 text-sm font-mono" />
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
          <Link href={`/accounts/${id}`}><Button type="button" variant="outline">Cancel</Button></Link>
          <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save changes"}</Button>
        </div>
      </form>
    </div>
  );
}
