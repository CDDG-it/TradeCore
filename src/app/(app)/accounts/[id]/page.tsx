"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  CheckCircle,
  Clock,
  Trash2,
  XCircle,
  Pencil,
  Plus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAccountById, getPayoutsByAccountId, deleteAccount, createPayout, deletePayout, computeAccountROI } from "@/lib/mock/store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PayoutStatus } from "@/lib/types";

function roiGreenDetail(roi: number): string {
  if (roi >= 5) return "oklch(0.38 0.14 145)";
  if (roi >= 3) return "oklch(0.45 0.16 145)";
  if (roi >= 2) return "oklch(0.52 0.17 145)";
  return "oklch(0.58 0.17 145)";
}

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

export default function AccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showAddPayout, setShowAddPayout] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutDate, setPayoutDate] = useState(new Date().toISOString().split("T")[0]);
  const [payoutNotes, setPayoutNotes] = useState("");
  const [payouts, setPayouts] = useState(() => getPayoutsByAccountId(id));
  const account = getAccountById(id);

  async function handleDelete() {
    setDeleting(true);
    await new Promise((r) => setTimeout(r, 300));
    deleteAccount(id);
    router.push("/accounts");
  }

  function handleAddPayout(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(payoutAmount);
    if (!amount || amount <= 0) return;
    createPayout({
      funded_account_id: id,
      amount,
      payout_date: payoutDate,
      status: "paid",
      notes: payoutNotes,
    });
    setPayouts(getPayoutsByAccountId(id));
    setPayoutAmount("");
    setPayoutNotes("");
    setShowAddPayout(false);
  }

  function handleDeletePayout(payoutId: string) {
    deletePayout(payoutId);
    setPayouts(getPayoutsByAccountId(id));
  }

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

  const totalPaidOut = payouts.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const roi = computeAccountROI(totalPaidOut, account.purchase_cost);

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Back + header */}
      <div>
        <Link href="/accounts" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Accounts
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{account.firm_name}</p>
            <h1 className="text-2xl font-bold tracking-tight">{account.account_name}</h1>
            <p className="text-sm text-muted-foreground mt-1">${account.account_size.toLocaleString()} · Cost: ${account.purchase_cost.toLocaleString()}</p>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            {!confirmDelete ? (
              <div className="flex items-center gap-2">
                <Link href={`/accounts/${id}/edit`}>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </Button>
                </Link>
                <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5" onClick={() => setConfirmDelete(true)}>
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-destructive font-medium">Delete this account?</span>
                <Button variant="outline" size="sm" className="bg-destructive text-white hover:bg-destructive/90 border-destructive" onClick={handleDelete} disabled={deleting}>
                  {deleting ? "Deleting..." : "Yes, delete"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setConfirmDelete(false)}>Cancel</Button>
              </div>
            )}
            <div className="text-right">
              <div className="flex items-center gap-1.5 justify-end">
                {roi >= 0
                ? <TrendingUp className="w-5 h-5" style={{ color: roi >= 1 ? roiGreenDetail(roi) : "oklch(0.70 0.16 72)" }} />
                : <TrendingDown className="w-5 h-5 text-destructive" />}
                <span className="text-3xl font-bold" style={{ color: roi >= 1 ? roiGreenDetail(roi) : roi > 0 ? "oklch(0.70 0.16 72)" : "oklch(0.58 0.22 25)" }}>
                  {roi}x
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Return on cost</p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Account Size", value: `$${account.account_size.toLocaleString()}`, color: undefined },
          { label: "Total Costs", value: `$${account.purchase_cost.toLocaleString()}`, color: "#F97316" },
          { label: "Total Payouts", value: `$${totalPaidOut.toLocaleString()}`, color: "#F97316" },
        ].map(({ label, value, color }) => (
          <Card key={label} className="bg-card border-border/50">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-2">{label}</p>
              <p className="text-lg font-bold font-mono" style={color ? { color } : undefined}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Payout history */}
      <Card className="bg-card border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-success" />
              Payouts
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs"
              onClick={() => setShowAddPayout(!showAddPayout)}
            >
              <Plus className="w-3.5 h-3.5" />
              Add payout
            </Button>
          </div>
        </CardHeader>

        {showAddPayout && (
          <CardContent className="border-t border-border/40 pt-4">
            <form onSubmit={handleAddPayout} className="space-y-3">
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Amount ($) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    placeholder="e.g. 500"
                    className="h-9 text-sm font-mono"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Date *</Label>
                  <Input
                    type="date"
                    value={payoutDate}
                    onChange={(e) => setPayoutDate(e.target.value)}
                    className="h-9 text-sm"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Notes</Label>
                  <Input
                    value={payoutNotes}
                    onChange={(e) => setPayoutNotes(e.target.value)}
                    placeholder="Optional..."
                    className="h-9 text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm">Save payout</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowAddPayout(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        )}

        <CardContent className="p-0">
          {payouts.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-sm text-muted-foreground">No payouts logged yet.</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Click "Add payout" to log your first payout.</p>
            </div>
          ) : (
            <>
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
                    <button
                      onClick={() => handleDeletePayout(payout.id)}
                      className="text-muted-foreground/40 hover:text-destructive transition-colors shrink-0"
                      title="Remove payout"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="px-5 py-3 border-t border-border/40 flex justify-between text-sm">
                <span className="text-muted-foreground">Total received</span>
                <span className="font-bold text-success">${totalPaidOut.toLocaleString()}</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

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

      <div className="text-xs text-muted-foreground/60">
        Account created {format(new Date(account.created_at), "MMMM d, yyyy")}
      </div>
    </div>
  );
}
