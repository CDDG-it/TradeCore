"use client";

import { Fragment, useMemo, useState } from "react";
import {
  startOfWeek, startOfMonth, endOfWeek, endOfMonth,
  subWeeks, subMonths, addWeeks, addMonths,
  differenceInCalendarWeeks, differenceInCalendarMonths,
  format, isWithinInterval,
} from "date-fns";
import { TrendingUp, TrendingDown, Trophy, DollarSign, Receipt, Activity, ChevronRight } from "lucide-react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { FundedAccount, PayoutEvent } from "@/lib/types";

type Period = "week" | "month";
/** Always show at least this many buckets, even with little / no activity, so
 *  the view never looks empty. Beyond that, the range grows to cover all history. */
const MIN_BUCKETS: Record<Period, number> = { week: 8, month: 6 };
/** Safety ceiling so a stray date can't blow the range up to thousands of rows. */
const MAX_BUCKETS: Record<Period, number> = { week: 156, month: 60 };

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

/* Build one bucket per period from the earliest activity (or a minimum
 * lookback floor, whichever is earlier) up to the bucket containing today —
 * so every month / week you added an account or took a payout is visible. */
function buildBuckets(
  period: Period,
  now: Date,
  earliest: Date | null,
): { start: Date; end: Date; label: string }[] {
  const currentStart = bucketStart(now, period);
  // Floor: never show fewer than MIN_BUCKETS periods.
  const floorAnchor = period === "week"
    ? subWeeks(now, MIN_BUCKETS.week - 1)
    : subMonths(now, MIN_BUCKETS.month - 1);
  const floorStart = bucketStart(floorAnchor, period);

  let firstStart = earliest ? bucketStart(earliest, period) : floorStart;
  if (firstStart > floorStart) firstStart = floorStart;

  const span = period === "week"
    ? differenceInCalendarWeeks(currentStart, firstStart, { weekStartsOn: 1 })
    : differenceInCalendarMonths(currentStart, firstStart);
  let count = span + 1;

  // Clamp to the ceiling by dropping the oldest buckets, keeping recent history.
  const cap = MAX_BUCKETS[period];
  if (count > cap) {
    count = cap;
    firstStart = period === "week"
      ? bucketStart(addWeeks(currentStart, -(cap - 1)), period)
      : bucketStart(addMonths(currentStart, -(cap - 1)), period);
  }

  const out: { start: Date; end: Date; label: string }[] = [];
  for (let i = 0; i < count; i++) {
    const start = period === "week"
      ? bucketStart(addWeeks(firstStart, i), period)
      : bucketStart(addMonths(firstStart, i), period);
    out.push({ start, end: bucketEnd(start, period), label: bucketLabel(start, period) });
  }
  return out;
}

const money = (n: number) => `$${Math.round(n).toLocaleString()}`;

/** Bar-chart plot height in px — bars are sized in px against this so their
 *  heights resolve reliably (percentage heights collapse inside a flex column). */
const CHART_PLOT_H = 140;

interface BucketRow {
  start: Date;
  end: Date;
  label: string;
  bought: number;
  passed: number;
  costs: number;
  payouts: number;
  net: number;
  rofa: number | null;
}

/** A calendar month grouping a set of week rows (week view only). */
interface WeekGroup {
  key: string;
  monthLabel: string;
  monthStart: Date;
  weeks: BucketRow[];
  costs: number;
  payouts: number;
  net: number;
  rofa: number | null;
  bought: number;
  passed: number;
}

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
  // Which months (in week view) have their weeks revealed. Undefined = the
  // default: only the latest month (index 0) is open, the rest are collapsed.
  const [expandedOverride, setExpandedOverride] = useState<Record<string, boolean>>({});

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

  // Earliest dated activity — the first purchase or payout — anchors the range.
  const earliestActivity = useMemo(() => {
    let min: number | null = null;
    for (const a of accounts) {
      if (!a.purchase_date) continue;
      const t = new Date(a.purchase_date + "T12:00:00").getTime();
      if (Number.isFinite(t) && (min == null || t < min)) min = t;
    }
    for (const p of paidPayouts) {
      const t = p.date.getTime();
      if (Number.isFinite(t) && (min == null || t < min)) min = t;
    }
    return min == null ? null : new Date(min);
  }, [accounts, paidPayouts]);

  const buckets = useMemo(
    () => buildBuckets(period, new Date(), earliestActivity),
    [period, earliestActivity],
  );

  const rows = useMemo<BucketRow[]>(() => {
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

  // Week view groups its weeks by calendar month — latest month first, newest
  // week first inside each. Month view uses the flat `rows` directly.
  const weekGroups = useMemo<WeekGroup[]>(() => {
    if (period !== "week") return [];
    const map = new Map<string, WeekGroup>();
    for (const r of rows) {
      const monthStart = startOfMonth(r.start);
      const key = format(monthStart, "yyyy-MM");
      let g = map.get(key);
      if (!g) {
        g = { key, monthLabel: format(monthStart, "MMM yyyy"), monthStart, weeks: [], costs: 0, payouts: 0, net: 0, rofa: null, bought: 0, passed: 0 };
        map.set(key, g);
      }
      g.weeks.push(r);
      g.costs += r.costs;
      g.payouts += r.payouts;
      g.bought += r.bought;
      g.passed += r.passed;
    }
    const groups = Array.from(map.values());
    for (const g of groups) {
      g.net = g.payouts - g.costs;
      g.rofa = g.costs > 0 ? g.payouts / g.costs : null;
      g.weeks.sort((a, b) => b.start.getTime() - a.start.getTime());
    }
    groups.sort((a, b) => b.monthStart.getTime() - a.monthStart.getTime());
    return groups;
  }, [period, rows]);

  const isMonthExpanded = (key: string, idx: number) => expandedOverride[key] ?? idx === 0;
  const toggleMonth = (key: string, idx: number) =>
    setExpandedOverride((prev) => ({ ...prev, [key]: !(prev[key] ?? idx === 0) }));

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

  // The chart mirrors what the table reveals: in month view every month, in
  // week view only the weeks of the currently-expanded months (chronological).
  const chartRows = useMemo<BucketRow[]>(() => {
    if (period === "month") return rows;
    const visible: BucketRow[] = [];
    weekGroups.forEach((g, idx) => {
      if (isMonthExpanded(g.key, idx)) visible.push(...g.weeks);
    });
    visible.sort((a, b) => a.start.getTime() - b.start.getTime());
    return visible;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, rows, weekGroups, expandedOverride]);

  // Chart scale — largest absolute costs/payouts among the visible bars.
  const chartMax = Math.max(1, ...chartRows.map((r) => Math.max(Math.abs(r.costs), Math.abs(r.payouts))));

  // Summary label for the visible range — first→last bucket, or a plain count.
  const rangeLabel = useMemo(() => {
    if (rows.length === 0) return "No activity";
    const first = rows[0].start;
    const last = rows[rows.length - 1].start;
    const fmt = period === "week" ? "MMM d, yyyy" : "MMM yyyy";
    const unit = period === "week" ? "weeks" : "months";
    return rows.length === 1
      ? format(first, fmt)
      : `${format(first, fmt)} → ${format(last, fmt)} · ${rows.length} ${unit}`;
  }, [rows, period]);

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

          {/* ── Window summary (spans the full activity range) ───────── */}
          <div className="rounded-xl border border-border/60 bg-card p-3">
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="font-semibold uppercase tracking-wider text-muted-foreground">
                {rangeLabel}
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

          {/* ── Table breakdown ──────────────────────────────────────── */}
          <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/30 text-muted-foreground uppercase tracking-wider">
                  <tr>
                    <th className="text-left px-3 py-2 font-semibold">{period === "week" ? "Month / week" : "Month"}</th>
                    <th className="text-right px-3 py-2 font-semibold">Costs</th>
                    <th className="text-right px-3 py-2 font-semibold">Payouts</th>
                    <th className="text-right px-3 py-2 font-semibold">Net</th>
                    <th className="text-right px-3 py-2 font-semibold">ROFA</th>
                    <th className="text-right px-3 py-2 font-semibold">Bought</th>
                    <th className="text-right px-3 py-2 font-semibold">Passed</th>
                  </tr>
                </thead>

                {period === "month" ? (
                  <tbody className="divide-y divide-border/40">
                    {rows.map((r) => (
                      <tr key={r.label} className="transition-colors hover:bg-muted/20">
                        <td className="px-3 py-2 font-medium">{r.label}</td>
                        <MetricCells row={r} />
                      </tr>
                    ))}
                  </tbody>
                ) : (
                  <tbody className="divide-y divide-border/40">
                    {weekGroups.map((g, idx) => {
                      const expanded = isMonthExpanded(g.key, idx);
                      return (
                        <Fragment key={g.key}>
                          {/* Month header — click to reveal / hide its weeks */}
                          <tr
                            onClick={() => toggleMonth(g.key, idx)}
                            className="cursor-pointer bg-muted/25 hover:bg-muted/40 transition-colors"
                          >
                            <td className="px-3 py-2 font-semibold">
                              <span className="inline-flex items-center gap-1.5">
                                <ChevronRight className={cn("w-3.5 h-3.5 shrink-0 transition-transform", expanded && "rotate-90")} />
                                {g.monthLabel}
                                <span className="text-[10px] font-normal text-muted-foreground/60">· {g.weeks.length} wk</span>
                              </span>
                            </td>
                            <MetricCells row={g} />
                          </tr>
                          {/* Weeks in this month */}
                          {expanded && g.weeks.map((r) => (
                            <tr key={r.label} className="transition-colors hover:bg-muted/20">
                              <td className="px-3 py-2 pl-9 text-muted-foreground">{r.label}</td>
                              <MetricCells row={r} />
                            </tr>
                          ))}
                        </Fragment>
                      );
                    })}
                  </tbody>
                )}

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

          {/* ── Bar chart — costs (turquoise) vs payouts (cyan) per bucket ── */}
          <div className="rounded-xl border border-border/60 bg-card p-3">
            <div className="flex items-center justify-between gap-2 mb-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Costs vs. payouts
              </p>
              {period === "week" && (
                <span className="text-[10px] text-muted-foreground/60">expanded months</span>
              )}
            </div>
            {chartRows.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-xs text-muted-foreground/60">
                Expand a month to see its weeks.
              </div>
            ) : (
              <>
                {/* Fixed-height plot in px (not %) so bars resolve reliably, with
                    a baseline axis and a minimum visible height for small values.
                    Scrolls horizontally once there are more buckets than fit. */}
                <div className="overflow-x-auto pb-1">
                  <div className="flex items-end gap-2 min-w-full" style={{ minWidth: `${chartRows.length * 34}px` }}>
                    {chartRows.map((r) => {
                      const cH = r.costs > 0 ? Math.max(3, (r.costs / chartMax) * CHART_PLOT_H) : 0;
                      const pH = r.payouts > 0 ? Math.max(3, (r.payouts / chartMax) * CHART_PLOT_H) : 0;
                      return (
                        <div key={r.label} className="flex-1 flex flex-col items-center min-w-[28px]">
                          <div
                            className="w-full flex items-end justify-center gap-0.5 border-b border-border/50"
                            style={{ height: CHART_PLOT_H }}
                          >
                            <div
                              className="w-1/2 max-w-[16px] rounded-t-sm transition-all"
                              style={{ height: cH, background: "#14B8A6", boxShadow: r.costs > 0 ? "0 0 8px rgba(20,184,166,0.35)" : undefined }}
                              title={`${r.label} · Costs: ${money(r.costs)}`}
                            />
                            <div
                              className="w-1/2 max-w-[16px] rounded-t-sm transition-all"
                              style={{ height: pH, background: "#06B6D4", boxShadow: r.payouts > 0 ? "0 0 8px rgba(6,182,212,0.35)" : undefined }}
                              title={`${r.label} · Payouts: ${money(r.payouts)}`}
                            />
                          </div>
                          <span className="mt-1.5 text-[9px] text-muted-foreground/70 tabular-nums truncate w-full text-center">
                            {r.label.split(" · ")[0]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-center gap-4 text-[10px] text-muted-foreground/80">
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm" style={{ background: "#14B8A6" }} /> Costs</span>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm" style={{ background: "#06B6D4" }} /> Payouts</span>
                </div>
              </>
            )}
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

/** The six metric columns (costs · payouts · net · rofa · bought · passed),
 *  shared by month rows, week rows and month-group header rows. */
function MetricCells({ row }: { row: Pick<BucketRow, "costs" | "payouts" | "net" | "rofa" | "bought" | "passed"> }) {
  return (
    <>
      <td className="px-3 py-2 text-right font-mono tabular-nums" style={{ color: row.costs > 0 ? "#14B8A6" : "var(--muted-foreground)" }}>
        {row.costs > 0 ? money(row.costs) : "—"}
      </td>
      <td className="px-3 py-2 text-right font-mono tabular-nums" style={{ color: row.payouts > 0 ? "#06B6D4" : "var(--muted-foreground)" }}>
        {row.payouts > 0 ? money(row.payouts) : "—"}
      </td>
      <td className="px-3 py-2 text-right font-mono tabular-nums font-semibold">
        <span className="inline-flex items-center justify-end gap-1" style={{ color: row.net === 0 ? "var(--muted-foreground)" : row.net > 0 ? "oklch(0.58 0.17 145)" : "oklch(0.58 0.22 25)" }}>
          {row.net > 0 && <TrendingUp className="w-3 h-3" />}
          {row.net < 0 && <TrendingDown className="w-3 h-3" />}
          {row.net === 0 ? "—" : `${row.net > 0 ? "+" : ""}${money(row.net)}`}
        </span>
      </td>
      <td className="px-3 py-2 text-right font-mono tabular-nums" style={{ color: rofaColor(row.rofa) }}>
        {row.rofa == null ? "—" : `${row.rofa.toFixed(2)}x`}
      </td>
      <td className="px-3 py-2 text-right tabular-nums">{row.bought || "—"}</td>
      <td className="px-3 py-2 text-right tabular-nums">
        {row.bought === 0 ? "—" : (
          <span className="inline-flex items-center gap-1">
            <span className="font-semibold" style={{ color: row.passed > 0 ? "oklch(0.58 0.17 145)" : "var(--muted-foreground)" }}>
              {row.passed}
            </span>
            <span className="text-muted-foreground/60">/ {row.bought}</span>
          </span>
        )}
      </td>
    </>
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
