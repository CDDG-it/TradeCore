"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, TrendingUp, TrendingDown, ArrowRight, CalendarDays, ArrowUpDown, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";
import { PageHeader } from "@/components/ui/page-header";
import { PageWrapper } from "@/components/ui/page-wrapper";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAccounts, computeAccountROI, getPayoutsByAccountId, updateAccount } from "@/lib/supabase/queries";
import { PROP_FIRMS } from "@/lib/accounts-constants";
import { usePrivacy, mask } from "@/lib/use-privacy";
import { cn } from "@/lib/utils";
import type { FundedAccount, PayoutEvent } from "@/lib/types";

type StatusFilter = "all" | "active" | "inactive";
type PhaseFilter = "all" | "evaluation" | "funded";
type SortOrder = "newest" | "oldest";

/* "Funded" covers both the funded and payout phases — an account receiving
   payouts is past evaluation by definition. */
function matchesPhase(acct: FundedAccount, filter: PhaseFilter): boolean {
  if (filter === "all") return true;
  if (filter === "evaluation") return acct.phase === "evaluation";
  return acct.phase === "funded" || acct.phase === "payout";
}

function roiGreen(roi: number): string {
  if (roi >= 5) return "oklch(0.38 0.14 145)";
  if (roi >= 3) return "oklch(0.45 0.16 145)";
  if (roi >= 2) return "oklch(0.52 0.17 145)";
  return "oklch(0.58 0.17 145)";
}

export default function AccountsPage() {
  const router = useRouter();
  const { hidden, toggle } = usePrivacy();
  const [accounts, setAccounts] = useState<FundedAccount[]>([]);
  const [payoutMap, setPayoutMap] = useState<Record<string, PayoutEvent[]>>({});
  const [loading, setLoading] = useState(true);
  const [firmFilter, setFirmFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [phaseFilter, setPhaseFilter] = useState<PhaseFilter>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");

  useEffect(() => {
    getAccounts().then(async (accts) => {
      setAccounts(accts);
      const map: Record<string, PayoutEvent[]> = {};
      await Promise.all(accts.map(async (a) => {
        map[a.id] = await getPayoutsByAccountId(a.id);
      }));
      setPayoutMap(map);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Only show firms that the user actually has accounts with
  const uniqueFirms = PROP_FIRMS.filter((f) => accounts.some((a) => a.firm_name === f));
  // Include any custom firms not in PROP_FIRMS
  const customFirms = accounts
    .map((a) => a.firm_name)
    .filter((f) => f && !PROP_FIRMS.includes(f as (typeof PROP_FIRMS)[number]));
  const allFirms = [...uniqueFirms, ...customFirms];

  const firmAccounts = firmFilter === "all" ? accounts : accounts.filter((a) => a.firm_name === firmFilter);
  const activeAccounts = firmAccounts.filter((a) => a.status === "active");

  const totalFeePaid = firmAccounts.reduce((s, a) => s + (a.purchase_cost ?? 0), 0);
  const totalPayouts = firmAccounts.reduce((s, a) => {
    const payouts = payoutMap[a.id] ?? [];
    return s + payouts.filter((p) => p.status === "paid").reduce((ps, p) => ps + p.amount, 0);
  }, 0);
  const overallRoi = totalFeePaid > 0 ? Math.round((totalPayouts / totalFeePaid) * 10) / 10 : 0;
  const activeCapital = activeAccounts.reduce((s, a) => s + (a.current_balance ?? a.account_size), 0);

  const filtered = firmAccounts
    .filter((a) => {
      if (statusFilter === "all") return true;
      return a.status === statusFilter;
    })
    .filter((a) => matchesPhase(a, phaseFilter))
    .sort((a, b) => {
      const dateA = a.purchase_date ? new Date(a.purchase_date).getTime() : 0;
      const dateB = b.purchase_date ? new Date(b.purchase_date).getTime() : 0;
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

  const filterBtnBase = "rounded-lg border px-3 py-1.5 text-xs font-medium transition-all";
  const filterBtnInactive = "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground";

  /* One-click toggles on the cards. The card itself is a link, so the badge
     buttons stop the navigation. Updates are optimistic with a revert on error. */
  function patchLocal(id: string, patch: Partial<FundedAccount>) {
    setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }

  async function togglePhase(e: React.MouseEvent, acct: FundedAccount) {
    e.preventDefault();
    e.stopPropagation();
    const next = acct.phase === "evaluation" ? "funded" : "evaluation";
    patchLocal(acct.id, { phase: next });
    try {
      await updateAccount(acct.id, { phase: next });
    } catch {
      patchLocal(acct.id, { phase: acct.phase });
    }
  }

  async function toggleStatus(e: React.MouseEvent, acct: FundedAccount) {
    e.preventDefault();
    e.stopPropagation();
    const next = acct.status === "active" ? "inactive" : "active";
    // Stamp the date when deactivating; clear it on reactivation (null is
    // required to actually clear the column, undefined would be dropped)
    const inactive_date = next === "inactive"
      ? format(new Date(), "yyyy-MM-dd")
      : (null as unknown as undefined);
    patchLocal(acct.id, { status: next, inactive_date: inactive_date ?? undefined });
    try {
      await updateAccount(acct.id, { status: next, inactive_date });
    } catch {
      patchLocal(acct.id, { status: acct.status, inactive_date: acct.inactive_date });
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );

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
        {/* ── Filters — always visible when accounts exist ── */}
        {accounts.length > 0 && (
          <div className="flex flex-wrap items-center gap-3">
            {/* Firm filter — dropdown */}
            {allFirms.length > 0 && (
              <Select value={firmFilter} onValueChange={(v) => setFirmFilter(v ?? "all")}>
                <SelectTrigger className="h-9 min-w-[160px] border-border bg-card text-sm">
                  <SelectValue placeholder="All firms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All firms</SelectItem>
                  {allFirms.map((firm) => (
                    <SelectItem key={firm} value={firm}>{firm}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {allFirms.length > 0 && <div className="h-4 w-px bg-border" />}

            {/* Status filter */}
            <div className="flex gap-1.5">
              {(["all", "active", "inactive"] as StatusFilter[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    filterBtnBase, "capitalize",
                    statusFilter === s
                      ? s === "active"
                        ? "border-success bg-success/10 text-success"
                        : s === "inactive"
                        ? "border-destructive/50 bg-destructive/10 text-destructive"
                        : "border-primary bg-primary text-primary-foreground"
                      : filterBtnInactive
                  )}
                >
                  {s === "all" ? "All status" : s}
                </button>
              ))}
            </div>

            <div className="h-4 w-px bg-border" />

            {/* Phase filter — evaluation vs funded */}
            <div className="flex gap-1.5">
              {(["all", "evaluation", "funded"] as PhaseFilter[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPhaseFilter(p)}
                  className={cn(
                    filterBtnBase, "capitalize",
                    phaseFilter === p
                      ? p === "evaluation"
                        ? "border-warning bg-warning/10 text-warning"
                        : p === "funded"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-primary bg-primary text-primary-foreground"
                      : filterBtnInactive
                  )}
                >
                  {p === "all" ? "All phases" : p === "evaluation" ? "Evaluation" : "Funded"}
                </button>
              ))}
            </div>

            <div className="h-4 w-px bg-border" />

            {/* Sort by date */}
            <button
              onClick={() => setSortOrder(sortOrder === "newest" ? "oldest" : "newest")}
              className={cn(filterBtnBase, "flex items-center gap-1.5", filterBtnInactive)}
            >
              <ArrowUpDown className="w-3 h-3" />
              {sortOrder === "newest" ? "Newest first" : "Oldest first"}
            </button>

            <div className="h-4 w-px bg-border" />

            {/* Privacy toggle — hide balances when in public */}
            <button
              type="button"
              onClick={toggle}
              aria-pressed={hidden}
              title={hidden ? "Show balances" : "Hide balances (privacy mode)"}
              className={cn(
                filterBtnBase,
                "flex items-center gap-1.5",
                hidden ? "border-primary/50 bg-primary/10 text-primary" : filterBtnInactive
              )}
            >
              {hidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              {hidden ? "Hidden" : "Hide"}
            </button>
          </div>
        )}

        {/* ── Summary stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Costs", value: mask(`$${totalFeePaid.toLocaleString()}`, hidden), note: "all accounts", type: "cost" },
            { label: "Total Payouts", value: mask(`$${totalPayouts.toLocaleString()}`, hidden), note: "all accounts", type: "payout" },
            { label: "Active Capital", value: mask(`$${activeCapital.toLocaleString()}`, hidden), note: "active only", type: "capital" },
            { label: "Return on Cost", value: mask(`${overallRoi}x`, hidden), note: "all accounts", type: "roi" },
          ].map(({ label, value, note, type }) => {
            const roiColor = type === "roi"
              ? overallRoi >= 5 ? "oklch(0.38 0.14 145)"
                : overallRoi >= 3 ? "oklch(0.45 0.16 145)"
                : overallRoi >= 2 ? "oklch(0.52 0.17 145)"
                : overallRoi >= 1 ? "oklch(0.58 0.17 145)"
                : overallRoi > 0 ? "#EAB308"
                : "oklch(0.58 0.22 25)"
              : undefined;
            return (
            <div key={label} className={cn(
              "bg-card border rounded-xl p-4 text-center",
              type === "capital" ? "border-success/30" : "border-border/50"
            )}>
              <p
                className="text-xl font-bold"
                style={{
                  color: type === "cost" ? "#14B8A6"
                    : type === "payout" ? "#06B6D4"
                    : type === "roi" ? roiColor
                    : type === "capital" ? "oklch(0.58 0.17 145)"
                    : undefined,
                }}
              >{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              <p className="text-[10px] text-muted-foreground/50 mt-0.5">{note}</p>
            </div>
            );
          })}
        </div>

        {/* ── Account cards ── */}
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
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((acct) => {
              const payouts = payoutMap[acct.id] ?? [];
              const totalPaid = payouts.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
              const roi = computeAccountROI(totalPaid, acct.purchase_cost);
              const isActive = acct.status === "active";
              const isBlown = acct.status === "blown";

              return (
                // The wrapper handles navigation on click so the card keeps a real
                // :hover (an absolute overlay link would steal it and the card would
                // feel dead). Interactive controls inside stopPropagation, so the
                // phase/status toggles and the footer links never trigger navigation.
                <div
                  key={acct.id}
                  role="link"
                  tabIndex={0}
                  onClick={() => router.push(`/accounts/${acct.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      router.push(`/accounts/${acct.id}`);
                    }
                  }}
                  aria-label={`Open ${acct.firm_name} account`}
                  className="relative cursor-pointer rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                >
                  <Card className={cn(
                    "h-full border-2",
                    isActive
                      ? "border-success/35"
                      : isBlown
                      ? "border-destructive/40"
                      : "border-destructive/25"
                  )}>
                    <CardContent className="p-4">
                      <div className="mb-3 flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-baseline gap-2">
                            <p className="font-semibold text-sm truncate">{acct.firm_name}</p>
                            <span className="text-xs text-muted-foreground font-mono shrink-0">
                              {mask(`$${(acct.account_size / 1000).toFixed(0)}K`, hidden)}
                            </span>
                          </div>
                        </div>
                        <div className="relative z-10 flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => togglePhase(e, acct)}
                            title={acct.phase === "evaluation" ? "Click to mark as funded" : "Click to move back to evaluation"}
                            className={cn(
                              "text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full cursor-pointer transition-all hover:ring-1",
                              acct.phase === "evaluation"
                                ? "bg-warning/15 text-warning hover:ring-warning/50"
                                : "bg-primary/15 text-primary hover:ring-primary/50"
                            )}
                          >
                            {acct.phase === "evaluation" ? "Eval" : "Funded"}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => toggleStatus(e, acct)}
                            title={isActive ? "Click to mark as inactive" : "Click to reactivate"}
                            className={cn(
                              "text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full cursor-pointer transition-all hover:ring-1",
                              isActive
                                ? "bg-success/10 text-success hover:ring-success/50"
                                : isBlown
                                ? "bg-destructive/10 text-destructive hover:ring-destructive/50"
                                : acct.status === "passed"
                                ? "bg-primary/10 text-primary hover:ring-primary/50"
                                : "bg-destructive/10 text-destructive hover:ring-destructive/50"
                            )}
                          >
                            {acct.status}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5 mb-3">
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">Total Costs</p>
                          <p className="text-sm font-semibold font-mono" style={{ color: "#14B8A6" }}>{mask(`$${acct.purchase_cost.toLocaleString()}`, hidden)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">Total Payout</p>
                          <p className="text-sm font-semibold font-mono" style={{ color: "#06B6D4" }}>{mask(`$${totalPaid.toLocaleString()}`, hidden)}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs text-muted-foreground mb-0.5">Return on Cost</p>
                          <div className="flex items-center gap-1">
                            {roi >= 0 ? <TrendingUp className="w-3.5 h-3.5" style={{ color: roi >= 1 ? roiGreen(roi) : "#EAB308" }} /> : <TrendingDown className="w-3.5 h-3.5 text-destructive" />}
                            <span className="text-sm font-bold" style={{ color: roi >= 1 ? roiGreen(roi) : roi > 0 ? "#EAB308" : "oklch(0.58 0.22 25)" }}>
                              {mask(`${roi}x`, hidden)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="relative z-10 flex items-center justify-between gap-2">
                        {acct.purchase_date ? (
                          <span className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
                            <CalendarDays className="w-2.5 h-2.5" />
                            {format(new Date(acct.purchase_date + "T12:00:00"), "d MMM yyyy")}
                          </span>
                        ) : <span />}
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/accounts/${acct.id}?payout=open`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs text-primary flex items-center gap-1 hover:underline"
                          >
                            <Plus className="w-3 h-3" /> Add payout
                          </Link>
                          <Link
                            href={`/accounts/${acct.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs text-primary flex items-center gap-1 hover:underline"
                          >
                            Details <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        )}
      </PageWrapper>
    </div>
  );
}
