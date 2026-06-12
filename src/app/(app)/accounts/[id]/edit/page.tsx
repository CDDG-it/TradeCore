"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAccountById, updateAccount } from "@/lib/supabase/queries";
import type { FundedAccount } from "@/lib/types";
import { PROP_FIRMS, ACCOUNT_SIZE_PRESETS } from "@/lib/accounts-constants";
import { cn } from "@/lib/utils";

import type { AccountPhase, AccountStatus } from "@/lib/types";

const DEFAULT_FORM = {
  firm_name: "", account_name: "funded", account_type: "funded",
  phase: "funded" as AccountPhase, account_size: 100000, purchase_cost: 0,
  start_balance: 100000, current_balance: 100000, roi: 0,
  max_drawdown: 5, trailing_drawdown: undefined as number | undefined,
  drawdown_used: 0, payout_total: 0, next_payout_target: 0,
  status: "active" as AccountStatus, notes: "",
};

export default function EditAccountPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [account, setAccount] = useState<FundedAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [customSize, setCustomSize] = useState(false);
  const [form, setForm] = useState<typeof DEFAULT_FORM & { purchase_date?: string; inactive_date?: string }>(DEFAULT_FORM);

  useEffect(() => {
    getAccountById(id).then((acct) => {
      if (!acct) { setNotFound(true); setLoading(false); return; }
      setAccount(acct);
      setCustomSize(!ACCOUNT_SIZE_PRESETS.some((p) => p.value === acct.account_size));
      setForm({
        firm_name: acct.firm_name, account_name: acct.account_name,
        account_type: acct.account_type, phase: acct.phase,
        account_size: acct.account_size, purchase_cost: acct.purchase_cost ?? 0,
        start_balance: acct.start_balance, current_balance: acct.current_balance,
        roi: acct.roi, max_drawdown: acct.max_drawdown,
        trailing_drawdown: acct.trailing_drawdown, drawdown_used: acct.drawdown_used,
        payout_total: acct.payout_total, next_payout_target: acct.next_payout_target,
        status: acct.status, notes: acct.notes,
        purchase_date: acct.purchase_date ?? "",
        inactive_date: acct.inactive_date ?? "",
      });
      setLoading(false);
    });
  }, [id]);

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
    try {
      await updateAccount(id, {
        ...form,
        purchase_date: form.purchase_date || undefined,
        inactive_date: form.inactive_date || undefined,
      });
      router.push(`/accounts/${id}`);
    } catch (err) {
      console.error("Failed to save account:", err);
      setSaving(false);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );

  if (notFound) return (
    <div className="text-center py-20">
      <p className="text-muted-foreground text-sm">Account not found.</p>
      <Link href="/accounts" className="text-primary text-sm hover:underline mt-2 inline-block">← Back to accounts</Link>
    </div>
  );

  const isPresetSize = ACCOUNT_SIZE_PRESETS.some((p) => p.value === form.account_size) && !customSize;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href={`/accounts/${id}`} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Account
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Edit Account</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{form.firm_name} · ${(form.account_size / 1000).toFixed(0)}K</p>
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
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">
                  Purchase Cost ($)
                  <span className="ml-1 text-muted-foreground/60 font-normal">— eval fee paid</span>
                </Label>
                <Input type="number" step="0.01" value={form.purchase_cost}
                  onChange={(e) => set("purchase_cost", parseFloat(e.target.value) || 0)}
                  className="h-9 text-sm font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Purchase Date</Label>
                <Input type="date" value={form.purchase_date ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, purchase_date: e.target.value || undefined }))}
                  className="h-9 text-sm" />
              </div>
            </div>

            {/* Phase and status are managed with one click on the account
                card in the overview, not from this form. */}

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
