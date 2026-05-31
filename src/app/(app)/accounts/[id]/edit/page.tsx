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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAccountById, updateAccount } from "@/lib/mock/store";
import { PROP_FIRMS, ACCOUNT_SIZE_PRESETS } from "@/lib/accounts-constants";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "blown", label: "Blown" },
  { value: "passed", label: "Passed" },
] as const;

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

  const initialCustomSize = !ACCOUNT_SIZE_PRESETS.some((p) => p.value === account.account_size);
  const [customSize, setCustomSize] = useState(initialCustomSize);

  const [form, setForm] = useState({
    firm_name: account.firm_name,
    account_name: account.account_name,
    account_type: account.account_type,
    phase: account.phase,
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
    status: account.status,
    notes: account.notes,
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function selectSize(value: number) {
    setCustomSize(false);
    setForm((prev) => ({ ...prev, account_size: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.firm_name) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 300));
    updateAccount(id, form);
    router.push(`/accounts/${id}`);
  }

  const isPresetSize = ACCOUNT_SIZE_PRESETS.some((p) => p.value === form.account_size) && !customSize;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href={`/accounts/${id}`} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Account
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Edit Account</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{account.firm_name} · ${(account.account_size / 1000).toFixed(0)}K</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card className="shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Account Info</CardTitle></CardHeader>
          <CardContent className="space-y-4">

            {/* Firm */}
            <div className="space-y-1.5">
              <Label className="text-xs">Firm *</Label>
              <Select value={form.firm_name} onValueChange={(v) => { if (v) set("firm_name", v); }}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select a prop firm…" />
                </SelectTrigger>
                <SelectContent>
                  {PROP_FIRMS.map((firm) => (
                    <SelectItem key={firm} value={firm}>{firm}</SelectItem>
                  ))}
                  {form.firm_name && !PROP_FIRMS.includes(form.firm_name as (typeof PROP_FIRMS)[number]) && (
                    <SelectItem value={form.firm_name}>{form.firm_name}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Account Size */}
            <div className="space-y-1.5">
              <Label className="text-xs">Account Size *</Label>
              <div className="flex flex-wrap gap-2">
                {ACCOUNT_SIZE_PRESETS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => selectSize(p.value)}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-xs font-medium font-mono transition-all",
                      isPresetSize && form.account_size === p.value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCustomSize(true)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
                    customSize
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  Custom
                </button>
              </div>
              {customSize && (
                <Input
                  type="number"
                  autoFocus
                  value={form.account_size}
                  onChange={(e) => setForm((prev) => ({ ...prev, account_size: parseFloat(e.target.value) || 0 }))}
                  placeholder="Enter custom size…"
                  className="h-9 text-sm font-mono mt-2"
                />
              )}
            </div>

            {/* Purchase Cost */}
            <div className="space-y-1.5">
              <Label className="text-xs">
                Purchase Cost ($)
                <span className="ml-1 text-muted-foreground/60 font-normal">— eval fee paid</span>
              </Label>
              <Input type="number" step="0.01" value={form.purchase_cost}
                onChange={(e) => set("purchase_cost", parseFloat(e.target.value) || 0)}
                className="h-9 text-sm font-mono" />
            </div>

            {/* Status — active / inactive toggle */}
            <div className="space-y-1.5">
              <Label className="text-xs">Account Status</Label>
              <div className="flex gap-2">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => set("status", opt.value)}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
                      form.status === opt.value
                        ? opt.value === "active"
                          ? "border-success bg-success/10 text-success"
                          : opt.value === "blown"
                          ? "border-destructive bg-destructive/10 text-destructive"
                          : "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label className="text-xs">Notes</Label>
              <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)}
                placeholder="Any notes about this account, rules, strategy…" className="text-sm min-h-20 resize-none" />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Link href={`/accounts/${id}`}><Button type="button" variant="outline">Cancel</Button></Link>
          <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
        </div>
      </form>
    </div>
  );
}
