"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Check, Minus, X } from "lucide-react";
import { inPeriod } from "@/lib/journal/analytics-filter";
import { adherence, buildResponseDays, type ResponseDay, type Signal } from "@/lib/journal/behavioral-context";
import type { BestTradeOfDay, FundedAccount, Habit, HabitCompletion, PreMarketExercise, TradeJournalEntry, TradeRuleCheck, WeeklyTradeReview } from "@/lib/types";
import { cn } from "@/lib/utils";
import styles from "./behavioral-insights.module.css";

type Props = {
  trades: TradeJournalEntry[]; ruleChecks: TradeRuleCheck[]; accounts: FundedAccount[];
  exercises: PreMarketExercise[]; habits: Habit[]; habitCompletions: HabitCompletion[];
  weeklyReviews: WeeklyTradeReview[];
  recaps: Pick<BestTradeOfDay, "date" | "review_step" | "taken_was_best" | "notes" | "post_market_analysis" | "updated_at">[];
};
type Focus = "all" | "loss" | "win" | "loss-streak" | "win-streak";
const labelDate = (date: string) => format(new Date(`${date}T12:00:00`), "d MMM");
const pct = (value: number | null) => value === null ? "—" : `${value}%`;

function Footprint({ flip = false }: { flip?: boolean }) {
  return <svg viewBox="0 0 48 70" fill="currentColor" aria-hidden="true" className={cn("h-10 w-7", flip && "-scale-x-100")}><path d="M18.5 27.5C12 31 10.5 39 12.2 49.5c1.3 9.1 6.2 15.1 13 15.1 7.7 0 11.7-7 10.4-17.2-.8-7.6-3.6-14.1-8.1-18.5-2.7-2.7-5.9-3.3-9.3-1.4Z" /><circle cx="11" cy="22" r="4.1" /><circle cx="17" cy="15" r="4.6" /><circle cx="24.5" cy="11" r="4.4" /><circle cx="32" cy="12" r="3.8" /><circle cx="38" cy="18" r="3" /></svg>;
}

function SignalMark({ value }: { value: Signal }) {
  return <span aria-label={value === "yes" ? "Done" : value === "no" ? "Missed" : "Unknown"} className={cn("inline-flex size-5 items-center justify-center rounded-full border", value === "yes" ? "border-primary/35 bg-primary/10 text-primary" : value === "no" ? "border-destructive/35 bg-destructive/10 text-destructive" : "border-white/10 bg-white/[.04] text-muted-foreground")}>{value === "yes" ? <Check className="size-3" /> : value === "no" ? <X className="size-3" /> : <Minus className="size-3" />}</span>;
}

function ContextCard({ title, rows, selected, onClick }: { title: string; rows: ResponseDay[]; selected: boolean; onClick: () => void }) {
  const summary = adherence(rows);
  return <button type="button" onClick={onClick} aria-pressed={selected} className={cn(styles.card, "rounded-2xl border p-4 text-left", selected ? "border-primary/45 bg-primary/[.08]" : "border-white/[.08] bg-card/60 hover:border-primary/30")}><div className="flex items-start justify-between gap-2"><span className="text-[11px] font-semibold">{title}</span><span className="text-[10px] text-muted-foreground">{summary.assessed} assessed</span></div><div className="mt-4 flex items-end justify-between gap-2"><strong className="font-heading text-3xl font-semibold tracking-tight text-primary">{pct(summary.rate)}</strong><div className="flex max-w-24 flex-wrap justify-end gap-1" aria-hidden="true">{rows.slice(0, 9).map((row) => <span key={row.id} className={cn("size-1.5 rounded-full", row.rules === "yes" ? "bg-primary" : row.rules === "no" ? "bg-destructive" : "bg-muted-foreground/45")} />)}</div></div><p className="mt-2 text-[10px] text-muted-foreground">Rules kept on {summary.kept}/{summary.assessed} days</p></button>;
}

const dimensions = [
  { key: "habits" as const, title: "Habits" },
  { key: "weeklyReview" as const, title: "Prior week review" },
  { key: "preMarket" as const, title: "Pre-market exercise" },
  { key: "yesterdayRecap" as const, title: "Yesterday’s recap" },
];

export function BehavioralInsights({ trades, ruleChecks, accounts, exercises, habits, habitCompletions, weeklyReviews, recaps }: Props) {
  const [period, setPeriod] = useState("90d");
  const [accountId, setAccountId] = useState("all");
  const [focus, setFocus] = useState<Focus>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const today = format(new Date(), "yyyy-MM-dd");
  const accountTrades = useMemo(() => trades.filter((trade) => accountId === "all" || (accountId === "unlinked" ? !trade.funded_account_id : trade.funded_account_id === accountId)), [trades, accountId]);
  const filtered = useMemo(() => inPeriod(accountTrades, period, today), [accountTrades, period, today]);
  const allRows = useMemo(() => buildResponseDays({ trades: accountTrades, ruleChecks, habits, habitCompletions, weeklyReviews, exercises, recaps }), [accountTrades, ruleChecks, habits, habitCompletions, weeklyReviews, exercises, recaps]);
  const dates = useMemo(() => new Set(filtered.map((trade) => trade.date_time.slice(0, 10))), [filtered]);
  const rows = useMemo(() => allRows.filter((row) => dates.has(row.date)), [allRows, dates]);
  const afterLoss = rows.filter((row) => row.previousResult === "loss");
  const afterWin = rows.filter((row) => row.previousResult === "win");
  const lossStreak = afterLoss.filter((row) => row.previousStreak >= 2);
  const winStreak = afterWin.filter((row) => row.previousStreak >= 2);
  const visible = rows.filter((row) => focus === "all" || (focus === "loss" && row.previousResult === "loss") || (focus === "win" && row.previousResult === "win") || (focus === "loss-streak" && row.previousResult === "loss" && row.previousStreak >= 2) || (focus === "win-streak" && row.previousResult === "win" && row.previousStreak >= 2));
  const selected = visible.find((row) => row.id === selectedId) ?? visible[0];
  const links = dimensions.map((dimension) => {
    const yes = adherence(visible.filter((row) => row[dimension.key] === "yes"));
    const no = adherence(visible.filter((row) => row[dimension.key] === "no"));
    return { ...dimension, yes, no, delta: yes.rate !== null && no.rate !== null ? yes.rate - no.rate : null };
  });
  const strongest = links.filter((item) => item.yes.assessed >= 3 && item.no.assessed >= 3 && item.delta !== null).sort((a, b) => Math.abs(b.delta ?? 0) - Math.abs(a.delta ?? 0))[0];
  const context = selected?.previousStreak >= 2 ? `${selected.previousStreak} ${selected.previousResult === "loss" ? "losses" : "wins"} in a row` : selected?.previousResult ? `After a ${selected.previousResult}` : "No prior result";

  return <div className="mx-auto max-w-[1440px] space-y-4 pb-8">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><Link href="/analytics" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3.5" /> Analytics</Link><p className="mt-5 text-[10px] font-bold uppercase tracking-[.2em] text-primary">Behavioral insights</p><h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Your process fingerprint<span className="text-primary">.</span></h1><p className="mt-2 text-sm text-muted-foreground">Five recorded signals around each trading day. See what changes after a loss, win or streak.</p></div><div className="flex gap-2"><select aria-label="Period" value={period} onChange={(event) => { setPeriod(event.target.value); setSelectedId(null); }} className="h-9 rounded-lg border border-white/10 bg-card px-3 text-xs"><option value="30d">30 days</option><option value="90d">90 days</option><option value="all">All time</option></select><select aria-label="Account" value={accountId} onChange={(event) => { setAccountId(event.target.value); setSelectedId(null); }} className="h-9 max-w-40 rounded-lg border border-white/10 bg-card px-3 text-xs"><option value="all">All accounts</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.account_name}</option>)}<option value="unlinked">Unlinked</option></select></div></header>
    {rows.length === 0 ? <div className="rounded-2xl border border-white/10 bg-card/60 p-8 text-sm text-muted-foreground">No trades in this selection. Add a trade with rule checks in Journal or choose a wider period.</div> : <>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4"><ContextCard title="After a loss" rows={afterLoss} selected={focus === "loss"} onClick={() => setFocus(focus === "loss" ? "all" : "loss")} /><ContextCard title="After a win" rows={afterWin} selected={focus === "win"} onClick={() => setFocus(focus === "win" ? "all" : "win")} /><ContextCard title="After 2+ losses" rows={lossStreak} selected={focus === "loss-streak"} onClick={() => setFocus(focus === "loss-streak" ? "all" : "loss-streak")} /><ContextCard title="After 2+ wins" rows={winStreak} selected={focus === "win-streak"} onClick={() => setFocus(focus === "win-streak" ? "all" : "win-streak")} /></div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(350px,.75fr)]">
        <section className="min-w-0 overflow-hidden rounded-[22px] border border-white/[.08] bg-card/60 p-4 sm:p-5"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">The footprint trail</p><h2 className="mt-1 font-heading text-lg font-semibold">Preparation → decision</h2></div><span className="text-[11px] text-muted-foreground">{visible.length} trading days</span></div><div className="mt-4 flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground"><span className="inline-flex items-center gap-1"><span className="size-1.5 rounded-full bg-primary" /> Rules kept</span><span className="inline-flex items-center gap-1"><span className="size-1.5 rounded-full bg-destructive" /> Broken</span><span className="inline-flex items-center gap-1"><span className="size-1.5 rounded-full bg-muted-foreground" /> Unknown</span><button type="button" onClick={() => setFocus("all")} className="ml-auto text-primary hover:underline">Show all</button></div><div className={cn(styles.trail, "mt-4 flex gap-2 overflow-x-auto pb-3 pt-3")} aria-label="Trading day footprints">{[...visible].reverse().slice(-30).map((row, index) => <button key={row.id} type="button" onClick={() => setSelectedId(row.id)} aria-pressed={selected?.id === row.id} aria-label={`${labelDate(row.date)}, ${row.rules === "yes" ? "rules kept" : row.rules === "no" ? "rule broken" : "rules unknown"}`} className={cn(styles.footprint, "flex min-w-14 flex-col items-center rounded-xl border px-2 py-2.5", selected?.id === row.id ? "border-primary/60 bg-primary/[.09]" : "border-white/[.07] bg-background/40", row.rules === "yes" ? "text-primary" : row.rules === "no" ? "text-destructive" : "text-muted-foreground")}><Footprint flip={index % 2 === 1} /><span className="mt-1 text-[10px] text-foreground/70">{labelDate(row.date)}</span></button>)}</div><p className="mt-1 text-[10px] text-muted-foreground">Each footprint is one trading day. Colour uses saved rule checks. Select a day to inspect its five signals.</p>
          <div className="mt-5 border-t border-white/[.08] pt-4"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">Preparation links</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{dimensions.map((dimension) => { const yes = adherence(visible.filter((row) => row[dimension.key] === "yes")); const no = adherence(visible.filter((row) => row[dimension.key] === "no")); return <div key={dimension.key} className="rounded-xl border border-white/[.07] bg-background/35 px-3 py-3"><p className="text-xs font-semibold">{dimension.title}</p><div className="mt-2 flex items-end justify-between gap-3 text-[11px]"><span className="text-muted-foreground">Done <strong className="ml-1 font-semibold text-primary">{pct(yes.rate)}</strong><small className="ml-1">({yes.assessed})</small></span><span className="text-muted-foreground">Missed <strong className="ml-1 font-semibold text-foreground">{pct(no.rate)}</strong><small className="ml-1">({no.assessed})</small></span></div><div className="mt-2 flex h-1 gap-1"><span className="rounded-full bg-primary" style={{ width: `${yes.rate ?? 0}%` }} /><span className="rounded-full bg-white/20" style={{ width: `${no.rate ?? 0}%` }} /></div></div>; })}</div></div>
        </section>
        <div className="space-y-4"><section className="rounded-[22px] border border-primary/20 bg-[radial-gradient(circle_at_top_right,rgba(20,184,166,.12),transparent_60%)] p-5"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">Strongest recorded link</p>{strongest ? <><h2 className="mt-2 font-heading text-xl font-semibold">{strongest.title}</h2><p className="mt-2 text-sm text-foreground/80">Rule adherence is <strong className="text-primary">{Math.abs(strongest.delta ?? 0)} points {strongest.delta! >= 0 ? "higher" : "lower"}</strong> on days this was done.</p><p className="mt-2 text-[11px] text-muted-foreground">{strongest.yes.assessed} done days vs {strongest.no.assessed} missed days. Descriptive association, not proof of cause.</p></> : <><h2 className="mt-2 font-heading text-xl font-semibold">More paired days needed</h2><p className="mt-2 text-xs leading-relaxed text-muted-foreground">A link appears once a signal has at least three assessed days in both done and missed groups.</p></>}</section>
          {selected && <section className="rounded-[22px] border border-white/[.08] bg-card/60 p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">Selected day · {labelDate(selected.date)}</p><h2 className="mt-1 font-heading text-xl font-semibold">{context}</h2></div><Link href={`/journal/${selected.tradeId}`} aria-label="Open trade in Journal" className="rounded-lg border border-white/10 p-2 text-muted-foreground hover:text-primary"><ArrowUpRight className="size-4" /></Link></div><div className="mt-4 divide-y divide-white/[.07]">{[{ label: "Rules followed", value: selected.rules, detail: "All checked trades" }, { label: "Habits done", value: selected.habits, detail: selected.habitExpected ? `${selected.habitDone}/${selected.habitExpected} due` : "No habits due" }, { label: "Previous week review", value: selected.weeklyReview, detail: "Saved before this day" }, { label: "Pre-market exercise", value: selected.preMarket, detail: "Completed on this day" }, { label: "Yesterday’s post-market recap", value: selected.yesterdayRecap, detail: "Calendar day before this trade" }].map((item) => <div key={item.label} className="flex items-center justify-between gap-3 py-2.5"><div><p className="text-xs font-medium">{item.label}</p><p className="mt-0.5 text-[10px] text-muted-foreground">{item.detail}</p></div><SignalMark value={item.value as Signal} /></div>)}</div><p className="mt-3 text-[11px] text-muted-foreground">Result: <span className="font-semibold text-foreground">{selected.result}</span> · An outcome can be a loss even when every rule was followed.</p></section>}
        </div>
      </div><p className="px-1 text-[11px] leading-relaxed text-muted-foreground">Streaks use previous recorded trading days on the same account. Recap checks the previous calendar day; if there was no trade yesterday it remains unknown. Habit and pre-market completion are recorded by day, so timing before entry cannot always be verified. Missing rule checks remain unknown.</p>
    </>}
  </div>;
}
