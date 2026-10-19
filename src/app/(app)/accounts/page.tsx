"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, TrendingUp, TrendingDown, ArrowRight, CalendarDays, ArrowUpDown, Eye, EyeOff, BarChart3 } from "lucide-react";
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
import { PerformanceOverview } from "@/components/accounts/performance-overview";
import { LiveBrokerPanel } from "@/components/accounts/live-broker-panel";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { EASE_OUT, SPRING } from "@/lib/motion";
import { CountUp } from "@/components/ui/count-up";
import { Segmented } from "@/components/ui/segmented";

type StatusFilter = "all" | "active" | "inactive";
type PhaseFilter = "all" | "evaluation" | "funded";
type SortOrder = "newest" | "oldest";

/* "Funded" covers both the funded and payout phases: an account receiving
   payouts is past evaluation by definition. */
function matchesPhase(acct: FundedAccount, filter: PhaseFilter): boolean {
  if (filter === "all") return true;
  if (filter === "evaluation") return acct.phase === "evaluation";
  return acct.phase === "funded" || acct.phase === "payout";
}

/**
 * A figure that privacy mode can hide. Hiding and showing cross over with a
 * short blur, but the real figure is never itself drawn blurred: privacy mode
 * is for screens other people can see, and a blurred number still gives away
 * its length and shape.
 */
function Masked({ hidden, children }: { hidden: boolean; children: React.ReactNode }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span key={hidden ? "hidden" : "shown"} className="inline-block"
        initial={{ opacity: 0, filter: "blur(4px)" }} animate={{ opacity: 1, filter: "blur(0px)" }} exit={{ opacity: 0, filter: "blur(4px)" }}
        transition={{ duration: 0.14, ease: EASE_OUT }}>
        {hidden ? mask("", true) : children}
      </motion.span>
    </AnimatePresence>
  );
}

const money = (n: number) => `$${Math.round(n).toLocaleString()}`;

function roiGreen(roi: number): string {
  if (roi >= 5) return "oklch(0.38 0.14 145)";
  if (roi >= 3) return "oklch(0.45 0.16 145)";
  if (roi >= 2) return "oklch(0.52 0.17 145)";
  return "var(--win)";
}

export default function AccountsPage() {
  const router = useRouter();
  const { hidden, toggle } = usePrivacy();
  const [accounts, setAccounts] = useState<FundedAccount[]>([]);
  const [payoutMap, setPayoutMap] = useState<Record<string, PayoutEvent[]>>({});
  const [loading, setLoading] = useState(true);
  const [firmFilter, setFirmFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [phaseFilter, setPhaseFilter] = useState<PhaseFilter>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [perfOpen, setPerfOpen] = useState(false);
  const [, startNav] = useTransition();
  // Cards stagger in on the first showing only; filtering afterwards just moves them.
  const [intro, setIntro] = useState(true);

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

  const filterBtnBase = "rounded-lg border px-3 py-1.5 text-xs font-medium transition-[border-color,background-color,color]";
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
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setPerfOpen(true)}
              disabled={accounts.length === 0}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-card px-3.5 py-2 text-sm font-semibold text-foreground/85 transition-all hover:-translate-y-px hover:border-primary/40 hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              title="Cost, payout and pass-rate breakdown per week / month"
            >
              <BarChart3 className="w-4 h-4 text-primary" />
              Performance
            </button>
            <Link
              href="/accounts/new"
              className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all hover:-translate-y-px bg-primary text-primary-foreground"
            >
              <Plus className="w-4 h-4" />
              Add account
            </Link>
          </div>
        }
      />
      <PerformanceOverview
        accounts={accounts}
        payoutMap={payoutMap}
        open={perfOpen}
        onOpenChange={setPerfOpen}
      />
      <PageWrapper>
        {/* ── Live balances from connected Tradovate logins ── */}
        <LiveBrokerPanel hidden={hidden} />

        {/* ── Filters: always visible when accounts exist ── */}
        {accounts.length > 0 && (
          <div className="flex flex-wrap items-center gap-3">
            {/* Firm filter: dropdown */}
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
            <Segmented label="Account status" shape="rounded" size="sm" value={statusFilter} onChange={setStatusFilter}
              className="bg-card" buttonClassName="capitalize font-medium text-xs px-3"
              activeClassName={statusFilter === "active" ? "text-success" : statusFilter === "inactive" ? "text-destructive" : "text-primary-foreground"}
              pillClassName={statusFilter === "active" ? "bg-success/12 ring-1 ring-success/50" : statusFilter === "inactive" ? "bg-destructive/10 ring-1 ring-destructive/40" : "bg-primary"}
              options={(["all", "active", "inactive"] as StatusFilter[]).map((s) => ({ value: s, label: s === "all" ? "All status" : s }))} />

            <div className="h-4 w-px bg-border" />

            {/* Phase filter: evaluation vs funded */}
            <Segmented label="Account phase" shape="rounded" size="sm" value={phaseFilter} onChange={setPhaseFilter}
              className="bg-card" buttonClassName="font-medium text-xs px-3"
              activeClassName={phaseFilter === "evaluation" ? "text-warning" : phaseFilter === "funded" ? "text-primary" : "text-primary-foreground"}
              pillClassName={phaseFilter === "evaluation" ? "bg-warning/12 ring-1 ring-warning/50" : phaseFilter === "funded" ? "bg-primary/12 ring-1 ring-primary/50" : "bg-primary"}
              options={(["all", "evaluation", "funded"] as PhaseFilter[]).map((p) => ({ value: p, label: p === "all" ? "All phases" : p === "evaluation" ? "Evaluation" : "Funded" }))} />

            <div className="h-4 w-px bg-border" />

            {/* Sort by date */}
            <button
              onClick={() => setSortOrder(sortOrder === "newest" ? "oldest" : "newest")}
              className={cn(filterBtnBase, "flex items-center gap-1.5", filterBtnInactive)}
            >
              <ArrowUpDown className={cn("w-3 h-3 transition-transform duration-200", sortOrder === "oldest" && "rotate-180")} />
              {sortOrder === "newest" ? "Newest first" : "Oldest first"}
            </button>

            <div className="h-4 w-px bg-border" />

            {/* Privacy toggle: hide balances when in public */}
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
            { label: "Total Costs", value: <CountUp value={totalFeePaid} format={money} changeDuration={0.4} />, note: "all accounts", type: "cost" },
            { label: "Total Payouts", value: <CountUp value={totalPayouts} format={money} changeDuration={0.4} />, note: "all accounts", type: "payout" },
            { label: "Active Capital", value: <CountUp value={activeCapital} format={money} changeDuration={0.4} />, note: "active only", type: "capital" },
            { label: "Return on Cost", value: <CountUp value={overallRoi} format={(n) => `${Math.round(n * 10) / 10}x`} changeDuration={0.4} />, note: "all accounts", type: "roi" },
          ].map(({ label, value, note, type }) => {
            const roiColor = type === "roi"
              ? overallRoi >= 5 ? "oklch(0.38 0.14 145)"
                : overallRoi >= 3 ? "oklch(0.45 0.16 145)"
                : overallRoi >= 2 ? "oklch(0.52 0.17 145)"
                : overallRoi >= 1 ? "var(--win)"
                : overallRoi > 0 ? "var(--be)"
                : "var(--loss)"
              : undefined;
            return (
            <div key={label} className={cn(
              "bg-card border rounded-xl p-4 text-center",
              type === "capital" ? "border-success/30" : "border-border/50"
            )}>
              <p
                className="text-xl font-bold tabular-nums"
                style={{
                  color: type === "cost" ? "var(--primary)"
                    : type === "payout" ? "var(--ice)"
                    : type === "roi" ? roiColor
                    : type === "capital" ? "var(--win)"
                    : undefined,
                }}
              ><Masked hidden={hidden}>{value}</Masked></p>
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
          <MotionConfig reducedMotion="user">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Filtering or sorting moves cards to their new place; ones that
                leave fade out, ones that join fade in. */}
            <AnimatePresence mode="popLayout" initial={false}>
            {filtered.map((acct, index) => {
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
                <motion.div
                  key={acct.id}
                  layout
                  initial={{ opacity: 0, transform: "translateY(8px)" }}
                  animate={{ opacity: 1, transform: "translateY(0px)" }}
                  exit={{ opacity: 0, transform: "scale(0.97)", transition: { duration: 0.14 } }}
                  transition={{ duration: 0.28, delay: intro ? Math.min(index, 8) * 0.04 : 0, ease: EASE_OUT, layout: SPRING }}
                  onAnimationComplete={index === 0 && intro ? () => setIntro(false) : undefined}
                  role="link"
                  tabIndex={0}
                  onMouseEnter={() => router.prefetch(`/accounts/${acct.id}`)}
                  onFocus={() => router.prefetch(`/accounts/${acct.id}`)}
                  onClick={() => startNav(() => router.push(`/accounts/${acct.id}`))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      startNav(() => router.push(`/accounts/${acct.id}`));
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
                              <Masked hidden={hidden}>{`$${(acct.account_size / 1000).toFixed(0)}K`}</Masked>
                            </span>
                          </div>
                        </div>
                        <div className="relative z-10 flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => togglePhase(e, acct)}
                            title={acct.phase === "evaluation" ? "Click to mark as funded" : "Click to move back to evaluation"}
                            className={cn(
                              "text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full cursor-pointer transition-[background-color,color,box-shadow] duration-150 hover:ring-1",
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
                              "text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full cursor-pointer transition-[background-color,color,box-shadow] duration-150 hover:ring-1",
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
                          <p className="text-sm font-semibold font-mono" style={{ color: "var(--primary)" }}><Masked hidden={hidden}>{`$${acct.purchase_cost.toLocaleString()}`}</Masked></p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">Total Payout</p>
                          <p className="text-sm font-semibold font-mono" style={{ color: "var(--ice)" }}><Masked hidden={hidden}>{`$${totalPaid.toLocaleString()}`}</Masked></p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs text-muted-foreground mb-0.5">Return on Cost</p>
                          <div className="flex items-center gap-1">
                            {roi >= 0 ? <TrendingUp className="w-3.5 h-3.5" style={{ color: roi >= 1 ? roiGreen(roi) : "var(--be)" }} /> : <TrendingDown className="w-3.5 h-3.5 text-destructive" />}
                            <span className="text-sm font-bold" style={{ color: roi >= 1 ? roiGreen(roi) : roi > 0 ? "var(--be)" : "var(--loss)" }}>
                              <Masked hidden={hidden}>{`${roi}x`}</Masked>
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
                </motion.div>
              );
            })}
            </AnimatePresence>
          </div>
          </MotionConfig>
        )}
      </PageWrapper>
    </div>
  );
}
