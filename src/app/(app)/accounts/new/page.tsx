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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createAccount } from "@/lib/mock/store";
import type { FundedAccountInput } from "@/lib/types";
import { PROP_FIRMS, ACCOUNT_SIZE_PRESETS, ACCOUNT_TYPES } from "@/lib/accounts-constants";
import { cn } from "@/lib/utils";

export default function NewAccountPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [customSize, setCustomSize] = useState(false);

  const [form, setForm] = useState<FundedAccountInput>({
    firm_name: "",
    account_name: "Pro",
    account_type: "futures",
    phase: "funded",
    account_size: 50000,
    purchase_cost: 149,
    start_balance: 50000,
    current_balance: 50000,
    roi: 0,
    max_drawdown: 0,
    trailing_drawdown: undefined,
    drawdown_used: 0,
    payout_total: 0,
    next_payout_target: 0,
    status: "active",
    notes: "",
  });

  function set<K extends keyof FundedAccountInput>(key: K, value: FundedAccountInput[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "account_size") {
        next.start_balance = value as number;
        next.current_balance = value as number;
      }
      return next;
    });
  }

  function selectSize(value: number) {
    setCustomSize(false);
    set("account_size", value);
    set("start_balance", value);
    set("current_balance", value);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.firm_name || !form.account_name) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 300));
    const created = createAccount(form);
    router.push(`/accounts/${created.id}`);
  }

  const isPresetSize = ACCOUNT_SIZE_PRESETS.some((p) => p.value === form.account_size) && !customSize;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href="/accounts" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Accounts
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-primary">Add Account</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Track a new prop firm account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card className="shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Account Info</CardTitle></CardHeader>
          <CardContent className="space-y-4">

            {/* Firm Name — select menu */}
            <div className="space-y-1.5">
              <Label className="text-xs">Firm *</Label>
              <Select value={form.firm_name} onValueChange={(v) => { if (v) set("firm_name", v); }} required>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select a prop firm…" />
                </SelectTrigger>
                <SelectContent>
                  {PROP_FIRMS.map((firm) => (
                    <SelectItem key={firm} value={firm}>{firm}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Account Type — button group */}
            <div className="space-y-1.5">
              <Label className="text-xs">Account Type *</Label>
              <div className="flex flex-wrap gap-2">
                {ACCOUNT_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => set("account_name", type)}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
                      form.account_name === type
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Account Size — button group + custom */}
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
                  onChange={(e) => set("account_size", parseFloat(e.target.value) || 0)}
                  placeholder="Enter custom size…"
                  className="h-9 text-sm font-mono mt-2"
                />
              )}
            </div>

            {/* Purchase Cost */}
            <div className="space-y-1.5">
              <Label className="text-xs">
                Purchase Cost ($) *
                <span className="ml-1 text-muted-foreground/60 font-normal">— eval fee paid</span>
              </Label>
              <Input type="number" step="0.01" value={form.purchase_cost}
                onChange={(e) => set("purchase_cost", parseFloat(e.target.value) || 0)}
                placeholder="e.g. 149" className="h-9 text-sm font-mono" required />
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
          <Link href="/accounts"><Button type="button" variant="outline">Cancel</Button></Link>
          <Button type="submit" disabled={saving || !form.firm_name}>
            {saving ? "Saving…" : "Add account"}
          </Button>
        </div>
      </form>
    </div>
  );
}
