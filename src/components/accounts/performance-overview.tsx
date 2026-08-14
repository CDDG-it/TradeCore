"use client";

import { useMemo, useState } from "react";
import {
  startOfWeek, startOfMonth, endOfWeek, endOfMonth,
  subWeeks, subMonths, format, isWithinInterval,
} from "date-fns";
import { TrendingUp, TrendingDown, Trophy, DollarSign, Receipt, Activity } from "lucide-react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { FundedAccount, PayoutEvent } from "@/lib/types";

type Period = "week" | "month";
const BUCKETS: Record<Period, number> = { week: 8, month: 6 };

/** An account counts as "passed" once it has left the evaluation phase — the
 *  trader graduated the eval, whether the account is now funded, paying out,
 *  or was later marked passed / inactive. */
function accountPassed(a: FundedAccount): boolean {
  return a.status === "passed" || a.phase === "funded" || a.phase === "payout";
}

function bucketStart(d: Date, period: Period): Date {
  return period === "week"
    ? startOfWeek(d, { weekStartsOn: 1 })
    : startOfMonth(d);
}

function bucketEnd(d: Date, period: Period): Date {
  return period === "week"
    ? endOfWeek(d, { weekStartsOn: 1 })
    : endOfMonth(d);
}

function bucketLabel(d: Date, period: Period): string {
  return period === "week"
    ? `Wk ${format(d, "w")} · ${format(d, "MMM d")}`
    : format(d, "MMM yyyy");
}

/* Build the last N period buckets ending with the one that contains today. */
function buildBuckets(period: Period, now: Date): { start: Date; end: Date; label: string }[] {
  const n = BUCKETS[period];
  const out: { start: Date; end: Date; label: string }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const anchor = period === "week" ? subWeeks(now, i) : subMonths(now, i);
    const start = bucketStart(anchor, period);
    const end = bucketEnd(anchor, period);
    out.push({ start, end, label: bucketLabel(start, period) });
  }
  return out;
}

const money = (n: number) => `$${Math.round(n).toLocaleString()}`;

interface Props {
  accounts: FundedAccount[];
  payoutMap: Record<string, PayoutEvent[]>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Performance overview — a right-side sheet that breaks funded-account P&L
 * (costs paid, payouts received, net, ROFA) into weekly or monthly buckets,
 * plus a cohort view of how many bought accounts eventually passed the eval.
 */
export function PerformanceOverview({ accounts, payoutMap, open, onOpenChange }: Props) {
  const [period, setPeriod] = useState<Period>("month");

  const buckets = useMemo(() => buildBuckets(period, new Date()), [period]);

  // Flatten all paid payouts once — the bucketing loop consults this list per period.
  const paidPayouts = useMemo(() => {
    const rows: { date: Date; amount: number }[] = [];
    for (const a of accounts) {
      for (const p of payoutMap[a.id] ?? []) {
        if (p.status === "paid") {
          rows.push({ date: new Date(p.payout_date + "T12:00:00"), amount: p.amount });
        }
      }
    }
    return rows;
  }, [accounts, payoutMap]);

  const rows = useMemo(() => {
    return buckets.map((b) => {
      const inBucket = { start: b.start, end: b.end };
      const bought = accounts.filter((a) =>
        a.purchase_date && isWithinInterval(new Date(a.purchase_date + "T12:00:00"), inBucket)
      );
      const costs = bought.reduce((s, a) => s + (a.purchase_cost ?? 0), 0);
      const payouts = paidPayouts
        .filter((p) => isWithinInterval(p.date, inBucket))
        .reduce((s, p) => s + p.amount, 0);
      const net = payouts - costs;
      const rofa = costs > 0 ? payouts / costs : null;
      const passed = bought.filter(accountPassed).length;
      return { ...b, bought: bought.length, passed, costs, payouts, net, rofa };
    });
  }, [buckets, accounts, paidPayouts]);

  const totals = useMemo(() => {
    const costs = rows.reduce((s, r) => s + r.costs, 0);
    const payouts = rows.reduce((s, r) => s + r.payouts, 0);
    const bought = rows.reduce((s, r) => s + r.bought, 0);
    const passed = rows.reduce((s, r) => s + r.passed, 0);
    // Overall ROFA for the visible window
    const rofa = costs > 0 ? payouts / costs : null;
    // Lifetime totals (whole account book) for the summary card
    const lifetimeCosts = accounts.reduce((s, a) => s + (a.purchase_cost ?? 0), 0);
    const lifetimePayouts = paidPayouts.reduce((s, p) => s + p.amount, 0);
    const lifetimeBought = accounts.length;
    const lifetimePassed = accounts.filter(accountPassed).length;
    const lifetimeRofa = lifetimeCosts > 0 ? lifetimePayouts / lifetimeCosts : null;
    return { costs, payouts, bought, passed, rofa, lifetimeCosts, lifetimePayouts, lifetimeBought, lifetimePassed, lifetimeRofa };
  }, [rows, accounts, paidPayouts]);

  // Chart scale — largest absolute net (or costs/payouts) in the window
  const maxAbs = Math.max(1, ...rows.map((r) => Math.max(Math.abs(r.costs), Math.abs(r.payouts))));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:!max-w-[820px] overflow-y-auto"
      >
        <SheetHeader className="border-b border-border/50">
          <div className="flex items-center justify-between gap-3 pr-8">
            <div>
              <SheetTitle className="text-lg font-heading font-semibold">Performance overview</SheetTitle>
              <SheetDescription>Costs, payouts and pass rate — per {period}.</SheetDescription>
            </div>
            <div className="flex rounded-lg border border-border/60 overflow-hidden shrink-0">
              {(["week", "month"] as Period[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors",
                    period === p
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </SheetHeader>

        <div className="px-4 pb-6 space-y-5">
          {/* ── Lifetime summary ─────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <SummaryTile icon={Receipt} label="Total costs" value={money(totals.lifetimeCosts)} color="#14B8A6" note="all time" />
            <SummaryTile icon={DollarSign} label="Total payouts" value={money(totals.lifetimePayouts)} color="#06B6D4" note="all time" />
            <SummaryTile
              icon={Activity}
              label="Lifetime ROFA"
              value={totals.lifetimeRofa == null ? "—" : `${totals.lifetimeRofa.toFixed(2)}x`}
              color={rofaColor(totals.lifetimeRofa)}
              note="payouts / costs"
            />
            <SummaryTile
              icon={Trophy}
              label="Accounts passed"
              value={`${totals.lifetimePassed}/${totals.lifetimeBought}`}
              color="oklch(0.58 0.17 145)"
              note={totals.lifetimeBought > 0 ? `${Math.round((totals.lifetimePassed / totals.lifetimeBought) * 100)}% pass rate` : "no accounts yet"}
            />
          </div>

          {/* ── Window summary (matches the period toggle) ───────────── */}
          <div className="rounded-xl border border-border/60 bg-card p-3">
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="font-semibold uppercase tracking-wider text-muted-foreground">
                Last {BUCKETS[period]} {period}s
              </span>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <StatChip label="Costs" value={money(totals.costs)} color="#14B8A6" />
                <StatChip label="Payouts" value={money(totals.payouts)} color="#06B6D4" />
                <StatChip
                  label="Net"
                  value={`${totals.payouts - totals.costs >= 0 ? "+" : ""}${money(totals.payouts - totals.costs)}`}
                  color={totals.payouts - totals.costs >= 0 ? "oklch(0.58 0.17 145)" : "oklch(0.58 0.22 25)"}
                />
                <StatChip
                  label="ROFA"
                  value={totals.rofa == null ? "—" : `${totals.rofa.toFixed(2)}x`}
                  color={rofaColor(totals.rofa)}
                />
                <StatChip label="Passed" value={`${totals.passed}/${totals.bought}`} color="oklch(0.58 0.17 145)" />
              </div>
            </div>
          </div>

          {/* ── Bar chart — costs (turquoise) vs payouts (cyan) per bucket ── */}
          <div className="rounded-xl border border-border/60 bg-card p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Costs vs. payouts
            </p>
            <div className="flex items-end gap-2 h-40">
              {rows.map((r) => {
                const cH = (r.costs / maxAbs) * 100;
                const pH = (r.payouts / maxAbs) * 100;
                return (
                  <div key={r.label} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                    <div className="flex-1 w-full flex items-end justify-center gap-0.5">
                      <div
                        className="w-1/2 rounded-t-sm transition-all"
                        style={{ height: `${cH}%`, background: "#14B8A6", boxShadow: r.costs > 0 ? "0 0 8px rgba(20,184,166,0.35)" : undefined }}
                        title={`Costs: ${money(r.costs)}`}
                      />
                      <div
                        className="w-1/2 rounded-t-sm transition-all"
                        style={{ height: `${pH}%`, background: "#06B6D4", boxShadow: r.payouts > 0 ? "0 0 8px rgba(6,182,212,0.35)" : undefined }}
                        title={`Payouts: ${money(r.payouts)}`}
                      />
                    </div>
                    <span className="text-[9px] text-muted-foreground/70 tabular-nums truncate w-full text-center">
                      {r.label.split(" · ")[0]}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex items-center justify-center gap-4 text-[10px] text-muted-foreground/80">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm" style={{ background: "#14B8A6" }} /> Costs</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm" style={{ background: "#06B6D4" }} /> Payouts</span>
            </div>
          </div>

          {/* ── Table breakdown ──────────────────────────────────────── */}
          <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/30 text-muted-foreground uppercase tracking-wider">
                  <tr>
                    <th className="text-left px-3 py-2 font-semibold">{period === "week" ? "Week" : "Month"}</th>
                    <th className="text-right px-3 py-2 font-semibold">Costs</th>
                    <th className="text-right px-3 py-2 font-semibold">Payouts</th>
                    <th className="text-right px-3 py-2 font-semibold">Net</th>
                    <th className="text-right px-3 py-2 font-semibold">ROFA</th>
                    <th className="text-right px-3 py-2 font-semibold">Bought</th>
                    <th className="text-right px-3 py-2 font-semibold">Passed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {rows.map((r) => (
                    <tr key={r.label} className="transition-colors hover:bg-muted/20">
                      <td className="px-3 py-2 font-medium">{r.label}</td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums" style={{ color: r.costs > 0 ? "#14B8A6" : "var(--muted-foreground)" }}>
                        {r.costs > 0 ? money(r.costs) : "—"}
                      </td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums" style={{ color: r.payouts > 0 ? "#06B6D4" : "var(--muted-foreground)" }}>
                        {r.payouts > 0 ? money(r.payouts) : "—"}
                      </td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums font-semibold">
                        <span className="inline-flex items-center justify-end gap-1" style={{ color: r.net === 0 ? "var(--muted-foreground)" : r.net > 0 ? "oklch(0.58 0.17 145)" : "oklch(0.58 0.22 25)" }}>
                          {r.net > 0 && <TrendingUp className="w-3 h-3" />}
                          {r.net < 0 && <TrendingDown className="w-3 h-3" />}
                          {r.net === 0 ? "—" : `${r.net > 0 ? "+" : ""}${money(r.net)}`}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums" style={{ color: rofaColor(r.rofa) }}>
                        {r.rofa == null ? "—" : `${r.rofa.toFixed(2)}x`}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{r.bought || "—"}</td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {r.bought === 0 ? "—" : (
                          <span className="inline-flex items-center gap-1">
                            <span className="font-semibold" style={{ color: r.passed > 0 ? "oklch(0.58 0.17 145)" : "var(--muted-foreground)" }}>
                              {r.passed}
                            </span>
                            <span className="text-muted-foreground/60">/ {r.bought}</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-border/60 bg-muted/20 font-semibold">
                  <tr>
                    <td className="px-3 py-2 uppercase tracking-wider text-[10px] text-muted-foreground">Total</td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums" style={{ color: "#14B8A6" }}>{money(totals.costs)}</td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums" style={{ color: "#06B6D4" }}>{money(totals.payouts)}</td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums" style={{ color: totals.payouts - totals.costs >= 0 ? "oklch(0.58 0.17 145)" : "oklch(0.58 0.22 25)" }}>
                      {totals.payouts - totals.costs >= 0 ? "+" : ""}{money(totals.payouts - totals.costs)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums" style={{ color: rofaColor(totals.rofa) }}>
                      {totals.rofa == null ? "—" : `${totals.rofa.toFixed(2)}x`}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{totals.bought}</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      <span className="font-semibold" style={{ color: totals.passed > 0 ? "oklch(0.58 0.17 145)" : "var(--muted-foreground)" }}>
                        {totals.passed}
                      </span>
                      <span className="text-muted-foreground/60"> / {totals.bought}</span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <p className="text-[10px] text-muted-foreground/60 px-1">
            Costs are bucketed by purchase date, payouts by their payout date. &ldquo;Passed&rdquo; counts accounts bought in
            that {period} that have since left the evaluation phase.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SummaryTile({
  icon: Icon, label, value, color, note,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string; value: string; color: string; note?: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-3">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `color-mix(in oklch, ${color} 12%, transparent)` }}>
          <Icon className="h-3.5 w-3.5" style={{ color }} />
        </span>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground truncate">{label}</p>
      </div>
      <p className="text-lg font-black tabular-nums leading-none" style={{ color }}>{value}</p>
      {note && <p className="text-[10px] text-muted-foreground/60 mt-1">{note}</p>}
    </div>
  );
}

function StatChip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
      <span className="text-muted-foreground">{label}</span>
      <span className="font-bold tabular-nums" style={{ color }}>{value}</span>
    </span>
  );
}

/** Colour ramp for ROFA multiples — matches the accounts page's roi tiles. */
function rofaColor(r: number | null): string {
  if (r == null) return "var(--muted-foreground)";
  if (r >= 5) return "oklch(0.38 0.14 145)";
  if (r >= 3) return "oklch(0.45 0.16 145)";
  if (r >= 2) return "oklch(0.52 0.17 145)";
  if (r >= 1) return "oklch(0.58 0.17 145)";
  if (r > 0) return "#EAB308";
  return "oklch(0.58 0.22 25)";
}
