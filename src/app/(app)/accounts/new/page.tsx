"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Minus, Plus, Layers } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createAccount } from "@/lib/supabase/queries";
import type { FundedAccountInput } from "@/lib/types";
import { PROP_FIRMS, ACCOUNT_SIZE_PRESETS } from "@/lib/accounts-constants";
import { cn } from "@/lib/utils";

const MAX_QUANTITY = 20;

export default function NewAccountPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [customSize, setCustomSize] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [savedCount, setSavedCount] = useState(0);

  const [form, setForm] = useState<FundedAccountInput>({
    firm_name: "",
    account_name: "funded",
    account_type: "futures",
    // Every account starts in evaluation; promote to funded from the card
    phase: "evaluation",
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
    purchase_date: new Date().toISOString().split("T")[0],
    inactive_date: undefined,
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
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.firm_name) return;
    const qty = Math.max(1, Math.min(MAX_QUANTITY, Math.round(quantity || 1)));
    setSaving(true);
    setSavedCount(0);
    try {
      // Create N accounts sequentially so a mid-batch failure leaves a clear
      // partial count and doesn't hammer the API. When qty > 1 each record
      // gets a suffix on account_name so the list stays scannable.
      let first: string | null = null;
      for (let i = 0; i < qty; i++) {
        const record: FundedAccountInput = qty > 1
          ? { ...form, account_name: `${form.account_name} #${i + 1}` }
          : form;
        const created = await createAccount(record);
        if (i === 0) first = created.id;
        setSavedCount(i + 1);
      }
      router.push(qty === 1 && first ? `/accounts/${first}` : "/accounts");
    } catch (err) {
      console.error("Failed to create account:", err);
      setSaving(false);
    }
  }

  function bumpQty(delta: number) {
    setQuantity((q) => Math.max(1, Math.min(MAX_QUANTITY, q + delta)));
  }

  const isPresetSize = ACCOUNT_SIZE_PRESETS.some((p) => p.value === form.account_size) && !customSize;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href="/accounts" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Accounts
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-primary">Add Account</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Track {quantity === 1 ? "a new prop firm account" : `${quantity} identical prop firm accounts in one go`}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card className="shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Account Info</CardTitle></CardHeader>
          <CardContent className="space-y-4">

            {/* Firm */}
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
                  onChange={(e) => set("account_size", parseFloat(e.target.value) || 0)}
                  placeholder="Enter custom size…"
                  className="h-9 text-sm font-mono mt-2"
                />
              )}
            </div>

            {/* Purchase Cost + Purchase Date */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">
                  Purchase Cost ($) *
                  <span className="ml-1 text-muted-foreground/60 font-normal">— eval fee paid</span>
                </Label>
                <Input type="number" step="0.01" value={form.purchase_cost}
                  onChange={(e) => set("purchase_cost", parseFloat(e.target.value) || 0)}
                  placeholder="e.g. 149" className="h-9 text-sm font-mono" required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Purchase Date</Label>
                <Input type="date" value={form.purchase_date ?? ""}
                  onChange={(e) => set("purchase_date", e.target.value || undefined)}
                  className="h-9 text-sm" />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label className="text-xs">Notes</Label>
              <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)}
                placeholder="Any notes about this account, rules, strategy…" className="text-sm min-h-20 resize-none" />
            </div>

            {/* Quantity — bulk-add identical accounts (a fresh scale-up buys many at once) */}
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5">
                <Layers className="w-3 h-3" />
                Quantity
                <span className="ml-1 text-muted-foreground/60 font-normal">— 1 to {MAX_QUANTITY} identical accounts in one go</span>
              </Label>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 rounded-lg border border-border overflow-hidden bg-card">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    onClick={() => bumpQty(-1)}
                    disabled={quantity <= 1 || saving}
                    className="h-9 w-9 flex items-center justify-center text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <Input
                    type="number"
                    min={1}
                    max={MAX_QUANTITY}
                    value={quantity}
                    onChange={(e) => {
                      const n = parseInt(e.target.value, 10);
                      if (Number.isFinite(n)) setQuantity(Math.max(1, Math.min(MAX_QUANTITY, n)));
                      else setQuantity(1);
                    }}
                    className="h-9 w-14 text-center font-mono border-0 focus-visible:ring-0 tabular-nums"
                  />
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    onClick={() => bumpQty(1)}
                    disabled={quantity >= MAX_QUANTITY || saving}
                    className="h-9 w-9 flex items-center justify-center text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                {/* Live cost + presets */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {[1, 3, 5, 10, 20].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setQuantity(n)}
                      disabled={saving}
                      className={cn(
                        "rounded-md border px-2 py-1 text-[11px] font-semibold font-mono transition-all",
                        quantity === n
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      )}
                    >
                      {n}×
                    </button>
                  ))}
                </div>
              </div>
              {quantity > 1 && (
                <p className="text-[11px] text-muted-foreground/80 tabular-nums mt-1.5">
                  {quantity} accounts · total cost{" "}
                  <span className="font-semibold text-foreground/85 font-mono">
                    ${((form.purchase_cost || 0) * quantity).toLocaleString()}
                  </span>{" "}
                  · total size{" "}
                  <span className="font-semibold text-foreground/85 font-mono">
                    ${((form.account_size || 0) * quantity).toLocaleString()}
                  </span>
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Link href="/accounts"><Button type="button" variant="outline">Cancel</Button></Link>
          <Button type="submit" disabled={saving || !form.firm_name}>
            {saving
              ? quantity > 1
                ? `Adding ${savedCount + 1}/${quantity}…`
                : "Saving…"
              : quantity > 1
                ? `Add ${quantity} accounts`
                : "Add account"}
          </Button>
        </div>
      </form>
    </div>
  );
}
