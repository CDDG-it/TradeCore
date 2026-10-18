"use client";

import { useMemo, useState, type ReactNode } from "react";
import { format } from "date-fns";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ChevronRight, CircleHelp, Clock3, Crosshair } from "lucide-react";
import { inPeriod } from "@/lib/journal/analytics-filter";
import { buildDayTransitions, buildTradingSessions, summarizeAdherence, type AssessedTrade, type DayTransition, type TradingSession } from "@/lib/journal/behavioral-analytics";
import type { FundedAccount, PreMarketExercise, TradeJournalEntry, TradeRuleCheck } from "@/lib/types";
import { cn } from "@/lib/utils";
import styles from "./behavioral-insights.module.css";

type Focus = "all" | "loss" | "win";
const dayLabel = (date: string) => format(new Date(`${date}T12:00:00`), "d MMM yyyy");
const rate = (value: number | null) => value === null ? "--" : `${value}%`;
const isBroken = (row: AssessedTrade) => row.rules.some((rule) => !rule.passed);
const statusLabel = (row: AssessedTrade) => row.rules.length === 0 ? "Not assessed" : isBroken(row) ? "Rule broken" : "Checks kept";

function Surface({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={cn("rounded-[24px] border border-white/[.08] bg-card/60", className)}>{children}</section>;
}

function Kicker({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={cn("text-[10px] font-bold uppercase tracking-[.19em] text-primary", className)}>{children}</p>;
}

function Metric({ label, value, detail, accent = false }: { label: string; value: string; detail: string; accent?: boolean }) {
  return <div className="min-w-0 border-t border-white/[.08] pt-4">
    <p className="text-[10px] font-semibold uppercase tracking-[.15em] text-muted-foreground">{label}</p>
    <p className={cn("mt-2 font-heading text-[28px] font-semibold leading-none tabular-nums tracking-[-.045em] sm:text-[34px]", accent && "text-primary")}>{value}</p>
    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{detail}</p>
  </div>;
}

function ComparisonBar({ label, value, detail, highlight = false }: { label: string; value: number | null; detail: string; highlight?: boolean }) {
  return <div className="space-y-2.5">
    <div className="flex items-baseline justify-between gap-4"><span className={cn("text-sm font-medium", highlight ? "text-foreground" : "text-muted-foreground")}>{label}</span><strong className={cn("font-heading text-xl font-semibold tabular-nums", highlight && "text-primary")}>{rate(value)}</strong></div>
    <div className="h-2 overflow-hidden rounded-full bg-white/[.07]" aria-hidden="true"><div className={cn(styles.bar, highlight ? "bg-primary" : "bg-ice/65")} style={{ transform: `scaleX(${(value ?? 0) / 100})` }} /></div>
    <p className="text-xs text-muted-foreground">{detail}</p>
  </div>;
}

function TradeStatus({ row }: { row: AssessedTrade }) {
  return <span className={cn("inline-flex items-center gap-1.5 text-[11px] font-semibold", row.rules.length === 0 ? "text-muted-foreground" : isBroken(row) ? "text-destructive" : "text-primary")}>
    <span className={cn("size-1.5 rounded-full", row.rules.length === 0 ? "bg-muted-foreground" : isBroken(row) ? "bg-destructive" : "bg-primary")} />{statusLabel(row)}
  </span>;
}

function DecisionDetail({ row, transition, number }: { row: AssessedTrade; transition?: DayTransition; number?: number }) {
  return <Surface className="p-5 sm:p-6">
    <div className="flex items-start justify-between gap-3"><Kicker>Decision detail</Kicker><Crosshair className="size-4 text-primary" aria-hidden="true" /></div>
    <h3 className="mt-3 font-heading text-xl font-semibold tracking-tight">{row.trade.instrument}</h3>
    <p className="mt-1 text-xs text-muted-foreground">{dayLabel(row.trade.date_time.slice(0, 10))} / {row.trade.execution_time || "Time not logged"}{number ? ` / Trade ${number}` : ""}</p>
    {transition && <p className="mt-4 rounded-lg border border-white/[.08] bg-background/35 px-3 py-2 text-xs text-foreground/80">Previous recorded day: <strong className="font-semibold text-foreground">{transition.previousResult}</strong> on {dayLabel(transition.previousDate)}</p>}
    <div className="mt-5 flex items-center justify-between border-y border-white/[.08] py-3"><TradeStatus row={row} /><span className="text-xs text-muted-foreground">{row.trade.result}</span></div>
    <div className="mt-2 divide-y divide-white/[.06]">{row.rules.length ? row.rules.map((rule) => <div key={rule.label} className="flex items-start justify-between gap-3 py-3 text-xs"><span className="max-w-[75%] leading-relaxed text-foreground/80">{rule.label}</span><span className={cn("shrink-0 font-semibold", rule.passed ? "text-primary" : "text-destructive")}>{rule.passed ? "Kept" : "Broken"}</span></div>) : <p className="py-4 text-xs leading-relaxed text-muted-foreground">No rule checks were saved for this trade. Its plan status is unknown.</p>}</div>
    <Link href={`/journal/${row.trade.id}`} className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-primary hover:text-foreground">Open in Journal <ArrowRight className="size-3.5" /></Link>
  </Surface>;
}

function DailyRhythm({ rows, transitions, selectedId, onSelect }: { rows: AssessedTrade[]; transitions: DayTransition[]; selectedId: string | null; onSelect: (id: string) => void }) {
  const recent = rows.slice(0, 35);
  const selectedOlder = rows.find((row) => row.trade.id === selectedId && !recent.some((item) => item.trade.id === row.trade.id));
  const displayed = selectedOlder ? [...recent, selectedOlder] : recent;
  return <Surface className="p-5 sm:p-6">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><Kicker>Decision rhythm</Kicker><h3 className="mt-2 font-heading text-xl font-semibold tracking-tight">The first decision, day by day</h3></div><span className="text-xs text-muted-foreground">{rows.length} ordered trading days</span></div>
    <p className="mt-2 max-w-2xl text-xs leading-relaxed text-muted-foreground">Each tile is the first trade of one recorded trading day. Select a day to see its rules and the previous result.</p>
    {displayed.length ? <div className="mt-6 flex flex-wrap gap-2" aria-label="First trades by day">{displayed.map((row) => { const prior = transitions.find((item) => item.current.trade.id === row.trade.id); const active = (selectedId ?? rows[0]?.trade.id) === row.trade.id; return <button key={row.trade.id} type="button" onClick={() => onSelect(row.trade.id)} aria-label={`${dayLabel(row.trade.date_time.slice(0, 10))}, ${statusLabel(row)}${prior ? `, after a ${prior.previousResult}` : ""}`} aria-pressed={active} className={cn(styles.evidence, "flex h-12 w-12 flex-col items-center justify-center rounded-lg border text-[10px] font-semibold", active ? "border-primary bg-primary/15 text-primary" : isBroken(row) ? "border-destructive/25 bg-destructive/[.07] text-destructive" : row.rules.length ? "border-primary/20 bg-primary/[.07] text-primary" : "border-white/[.08] bg-background/50 text-muted-foreground")}><span className="tabular-nums">{row.trade.date_time.slice(8, 10)}</span><span className="mt-0.5 text-[8px] uppercase opacity-70">{format(new Date(`${row.trade.date_time.slice(0, 10)}T12:00:00`), "MMM")}</span></button>; })}</div> : <p className="mt-6 text-sm text-muted-foreground">No day has a reliable first trade yet.</p>}
    <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-white/[.08] pt-4 text-[11px] text-muted-foreground"><span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-primary" /> Checks kept</span><span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-destructive" /> Rule broken</span><span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-muted-foreground" /> Not assessed</span></div>
    {rows.length > recent.length && <p className="mt-3 text-xs text-muted-foreground">Showing the 35 most recent days{selectedOlder ? " and the selected day" : ""}.</p>}
  </Surface>;
}

function IntradaySection({ sessions, selected, selectedTrade, onSession, onTrade, accountName, preMarket }: { sessions: TradingSession[]; selected: TradingSession | null; selectedTrade: AssessedTrade | null; onSession: (id: string) => void; onTrade: (id: string) => void; accountName: (id: string | null) => string; preMarket: PreMarketExercise | null }) {
  if (sessions.length === 0) return <Surface className="p-5 sm:p-6"><Kicker className="text-ice">03 / Within-day drift</Kicker><h3 className="mt-2 font-heading text-xl font-semibold">One decision per day</h3><p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">No day in this selection has multiple trades. Your day-to-day pattern above is the relevant view; there is no intraday sequence to reconstruct.</p></Surface>;
  const summary = selected ? summarizeAdherence(selected.trades) : null;
  return <div className="space-y-4">
    <div className="px-1"><Kicker className="text-ice">03 / Within-day drift</Kicker><h2 className="mt-2 font-heading text-2xl font-semibold tracking-tight">When a day has more than one trade</h2><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Inspect the first recorded rule break within a session. This section only shows multi-trade days.</p></div>
    <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[290px_minmax(0,1fr)]">
      <Surface className="h-fit p-3"><div className="px-2 py-2"><Kicker>Session index</Kicker><p className="mt-1 text-xs text-muted-foreground">{sessions.length} multi-trade days</p></div><div className="mt-2 max-h-[38rem] space-y-1 overflow-y-auto pr-1">{sessions.map((item) => { const s = summarizeAdherence(item.trades); return <button key={item.id} type="button" aria-pressed={selected?.id === item.id} onClick={() => onSession(item.id)} className={cn(styles.selectable, "w-full rounded-xl border px-3.5 py-3 text-left", selected?.id === item.id ? "border-primary/40 bg-primary/[.08]" : "border-transparent hover:bg-background/40")}><span className="flex items-center justify-between gap-2"><strong className="text-xs font-semibold">{dayLabel(item.date)}</strong><ChevronRight className="size-3.5 text-muted-foreground" /></span><span className="mt-1 block truncate text-[11px] text-muted-foreground">{accountName(item.accountId)} / {item.trades.length} trades</span><span className={cn("mt-2 block text-[10px] font-semibold", s.broken ? "text-destructive" : s.assessed ? "text-primary" : "text-muted-foreground")}>{s.broken ? `${s.broken} recorded breach${s.broken === 1 ? "" : "es"}` : s.assessed ? "No checked breach" : "No rules assessed"}</span></button>; })}</div></Surface>
      {selected && summary && <div className="space-y-4">
        <Surface className="p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><Kicker>Session / {dayLabel(selected.date)}</Kicker><h3 className="mt-2 font-heading text-xl font-semibold tracking-tight">{selected.orderReliable ? selected.firstBreachIndex === null ? summary.assessed ? "No recorded break" : "No assessed decisions" : `First recorded break at trade ${selected.firstBreachIndex + 1}` : "Sequence cannot be verified"}</h3><p className="mt-2 max-w-2xl text-xs leading-relaxed text-muted-foreground">{selected.orderReliable ? selected.firstBreachIndex === null ? "The checked rules show no breach in this account-day group. Unassessed trades remain unknown." : `A checked rule first failed at ${selected.trades[selected.firstBreachIndex].trade.execution_time}. Select a decision below to inspect it.` : "Some entry times are missing or tied. The first breach and order cannot be established reliably."}</p></div><Clock3 className="size-5 text-primary" /></div><div className="mt-6 grid gap-5 border-t border-white/[.08] pt-5 sm:grid-cols-4"><Metric label="Trades" value={String(selected.trades.length)} detail="In this group" /><Metric label="Assessed" value={String(summary.assessed)} detail="Rule checks saved" accent /><Metric label="Breaches" value={String(summary.broken)} detail="At least one rule broken" /><Metric label="Unknown" value={String(summary.unassessed)} detail="No rule checks" /></div></Surface>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,.85fr)]"><Surface className="p-5 sm:p-6"><Kicker>Decision sequence</Kicker><h3 className="mt-2 font-heading text-xl font-semibold tracking-tight">Every trade, in context</h3><div className={cn("relative mt-6 space-y-2", styles.rail)}>{selected.trades.map((row, index) => { const first = selected.orderReliable && selected.firstBreachIndex === index; const active = selectedTrade?.trade.id === row.trade.id; return <button key={row.trade.id} type="button" aria-pressed={active} onClick={() => onTrade(row.trade.id)} className={cn(styles.selectable, "relative z-10 flex w-full items-center gap-3 rounded-xl border p-3 text-left sm:p-3.5", active ? "border-primary/45 bg-primary/[.08]" : "border-white/[.07] bg-background/60", first && "ring-1 ring-destructive/35")}><span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full border bg-background text-[11px] font-semibold tabular-nums", isBroken(row) ? "border-destructive/45 text-destructive" : row.rules.length ? "border-primary/45 text-primary" : "border-white/[.15] text-muted-foreground")}>{selected.orderReliable ? String(index + 1).padStart(2, "0") : "?"}</span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold">{row.trade.instrument} <span className="font-normal text-muted-foreground">/ {row.trade.execution_time || "Time not logged"}</span></span><span className="mt-1 block"><TradeStatus row={row} /></span></span>{first && <span className="hidden rounded-full border border-destructive/25 bg-destructive/[.08] px-2 py-1 text-[10px] font-semibold text-destructive sm:block">First break</span>}<ChevronRight className="size-3.5 shrink-0 text-muted-foreground" /></button>; })}</div></Surface><div className="space-y-4">{selectedTrade && <DecisionDetail key={selectedTrade.trade.id} row={selectedTrade} number={selected.orderReliable ? selected.trades.findIndex((row) => row.trade.id === selectedTrade.trade.id) + 1 : undefined} />}<Surface className="p-5 sm:p-6"><Kicker className="text-ice">Saved daily entry</Kicker><h3 className="mt-2 font-heading text-lg font-semibold">Pre-market focus</h3>{preMarket ? <div className="mt-4 space-y-4 text-sm"><div><p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Focus</p><p className="mt-1 leading-relaxed">{preMarket.focus || "None recorded"}</p></div><div><p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Commitment</p><p className="mt-1 leading-relaxed">{preMarket.commitment_text || "None recorded"}</p></div><p className="text-xs leading-relaxed text-muted-foreground">This entry belongs to the selected day. Its presence alone does not prove it was completed before each trade.</p></div> : <p className="mt-4 text-sm leading-relaxed text-muted-foreground">No completed pre-market exercise was found for this day.</p>}</Surface></div></div>
      </div>}
    </div>
  </div>;
}

export function BehavioralInsights({ trades, ruleChecks, accounts, exercises }: { trades: TradeJournalEntry[]; ruleChecks: TradeRuleCheck[]; accounts: FundedAccount[]; exercises: PreMarketExercise[] }) {
  const [period, setPeriod] = useState("90d");
  const [accountId, setAccountId] = useState("all");
  const [focus, setFocus] = useState<Focus>("all");
  const [dailyId, setDailyId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [tradeId, setTradeId] = useState<string | null>(null);
  const today = format(new Date(), "yyyy-MM-dd");
  const accountTrades = useMemo(() => trades.filter((trade) => accountId === "all" || (accountId === "unlinked" ? !trade.funded_account_id : trade.funded_account_id === accountId)), [trades, accountId]);
  const filtered = useMemo(() => inPeriod(accountTrades, period, today), [accountTrades, period, today]);
  const allSessions = useMemo(() => buildTradingSessions(accountTrades, ruleChecks), [accountTrades, ruleChecks]);
  const selectedIds = useMemo(() => new Set(filtered.map((trade) => `${trade.date_time.slice(0, 10)}|${trade.funded_account_id ?? "unlinked"}`)), [filtered]);
  const sessions = useMemo(() => allSessions.filter((item) => selectedIds.has(item.id)), [allSessions, selectedIds]);
  const transitions = useMemo(() => buildDayTransitions(allSessions).filter((item) => selectedIds.has(`${item.date}|${item.accountId ?? "unlinked"}`)), [allSessions, selectedIds]);
  const dailyRows = useMemo(() => sessions.filter((item) => item.trades.length === 1 || item.orderReliable).map((item) => item.trades[0]), [sessions]);
  const multiSessions = useMemo(() => sessions.filter((item) => item.trades.length > 1), [sessions]);
  const dailySummary = useMemo(() => summarizeAdherence(dailyRows), [dailyRows]);
  const lossTransitions = transitions.filter((item) => item.previousResult === "loss");
  const winTransitions = transitions.filter((item) => item.previousResult === "win");
  const afterLoss = summarizeAdherence(lossTransitions.map((item) => item.current));
  const afterWin = summarizeAdherence(winTransitions.map((item) => item.current));
  const delta = afterLoss.rate !== null && afterWin.rate !== null ? afterLoss.rate - afterWin.rate : null;
  const enough = afterLoss.assessed >= 5 && afterWin.assessed >= 5;
  const selectedDaily = dailyRows.find((row) => row.trade.id === dailyId) ?? dailyRows[0] ?? null;
  const selectedTransition = transitions.find((item) => item.current.trade.id === selectedDaily?.trade.id);
  const chosenSession = multiSessions.find((item) => item.id === sessionId) ?? multiSessions[0] ?? null;
  const chosenTrade = chosenSession?.trades.find((row) => row.trade.id === tradeId) ?? chosenSession?.trades[0] ?? null;
  const preMarket = chosenSession ? exercises.find((item) => item.date === chosenSession.date && item.completed_at) ?? null : null;
  const accountName = (id: string | null) => id ? (accounts.find((account) => account.id === id)?.account_name ?? "Archived account") : "No account linked";
  const focusedTransitions = transitions.filter((item) => focus === "all" || item.previousResult === focus);
  const brokenRules = Object.entries(dailyRows.flatMap((row) => row.rules.filter((rule) => !rule.passed).map((rule) => rule.label)).reduce<Record<string, number>>((counts, label) => { counts[label] = (counts[label] ?? 0) + 1; return counts; }, {})).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const ambiguousDays = sessions.filter((item) => item.trades.length > 1 && !item.orderReliable).length;
  const changeSelection = () => { setDailyId(null); setSessionId(null); setTradeId(null); };

  return <div className="mx-auto max-w-[1500px] space-y-5 pb-12">
    <header className="flex flex-wrap items-start justify-between gap-4 py-1">
      <div><Link href="/analytics" className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:text-primary"><ArrowLeft className="size-3.5" /> Analytics desk</Link><h1 className="mt-3 font-heading text-3xl font-semibold tracking-[-.045em] sm:text-4xl">Behavioral insights<span className="text-primary">.</span></h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">Your decision pattern across trading days, with the underlying rule checks one click away.</p></div>
      <span className="rounded-full border border-primary/20 bg-primary/[.07] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[.12em] text-primary">Journal evidence</span>
    </header>

    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[.08] bg-card/55 p-3">
      <p className="px-1 text-xs text-muted-foreground">One view. Every trading day.</p>
      <div className="flex flex-wrap gap-2"><label className="sr-only" htmlFor="behavior-period">Period</label><select id="behavior-period" value={period} onChange={(event) => { setPeriod(event.target.value); changeSelection(); }} className="h-9 rounded-lg border border-white/[.09] bg-background px-3 text-xs text-foreground"><option value="30d">Last 30 days</option><option value="90d">Last 90 days</option><option value="all">All time</option></select><label className="sr-only" htmlFor="behavior-account">Account</label><select id="behavior-account" value={accountId} onChange={(event) => { setAccountId(event.target.value); changeSelection(); }} className="h-9 max-w-48 rounded-lg border border-white/[.09] bg-background px-3 text-xs text-foreground"><option value="all">All accounts</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.account_name}</option>)}<option value="unlinked">No account linked</option></select></div>
    </div>

    {filtered.length === 0 ? <Surface className="p-12 text-center"><CircleHelp className="mx-auto size-7 text-primary" /><h2 className="mt-4 font-heading text-xl font-semibold">No trades in this selection</h2><p className="mt-2 text-sm text-muted-foreground">Choose a wider period or another account, or add trades in Journal.</p><Link href="/journal" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">Open Journal <ArrowRight className="size-4" /></Link></Surface> : <div className={cn(styles.enter, "space-y-5")}>
      <Surface className="relative overflow-hidden border-primary/20 bg-[radial-gradient(ellipse_at_85%_5%,rgba(20,184,166,.15),transparent_48%),linear-gradient(135deg,rgba(20,184,166,.055),rgba(11,17,32,.25))] p-6 sm:p-8">
        <Kicker>01 / The next trading day</Kicker><h2 className="mt-4 max-w-3xl font-heading text-3xl font-semibold leading-tight tracking-[-.04em] sm:text-[40px]">Does yesterday&apos;s result<br /><span className="text-primary">change today&apos;s discipline?</span></h2><p className="mt-4 max-w-2xl text-sm leading-relaxed text-foreground/65">We compare the first trade of a recorded trading day after a prior loss with the first trade after a prior win. Days are linked within the same account. A skipped calendar day does not break the sequence.</p>
        <div className="mt-8 grid gap-6 border-t border-white/[.1] pt-6 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center"><div className="flex items-baseline gap-2"><strong className={cn("font-heading text-5xl font-semibold leading-none tabular-nums tracking-[-.06em] sm:text-6xl", delta !== null && delta < 0 ? "text-destructive" : "text-primary")}>{delta === null ? "--" : `${delta > 0 ? "+" : ""}${delta}`}</strong><span className="text-sm text-muted-foreground">pts</span></div><div><p className="text-sm font-medium">{delta === null ? "Comparison needs assessed trades after both a loss and a win" : delta === 0 ? "Same recorded rule adherence after wins and losses" : `${Math.abs(delta)} percentage points ${delta < 0 ? "lower" : "higher"} after a loss`}</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{enough ? "A descriptive pattern, not evidence that the previous result caused it." : "Early observation: fewer than five assessed trades in at least one group."}</p></div></div>
      </Surface>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,.75fr)]">
        <Surface className="p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><Kicker>Day-to-day fingerprint</Kicker><h3 className="mt-2 font-heading text-xl font-semibold tracking-tight">Rule adherence after a result</h3></div><span className="rounded-full border border-white/[.08] px-2.5 py-1 text-[10px] text-muted-foreground">{afterLoss.assessed + afterWin.assessed} assessed days</span></div><div className="mt-7 space-y-7"><ComparisonBar label="After a loss" value={afterLoss.rate} detail={`${afterLoss.kept} of ${afterLoss.assessed} assessed first trades kept every checked rule`} highlight /><ComparisonBar label="After a win" value={afterWin.rate} detail={`${afterWin.kept} of ${afterWin.assessed} assessed first trades kept every checked rule`} /></div><div className="mt-7 grid grid-cols-2 gap-5 border-t border-white/[.08] pt-5"><Metric label="Daily consistency" value={rate(dailySummary.rate)} detail={`${dailySummary.kept}/${dailySummary.assessed} assessed first trades`} /><Metric label="Unknown" value={String(dailySummary.unassessed)} detail="First trades without rule checks" /></div></Surface>
        <Surface className="p-5 sm:p-6"><Kicker>What this measures</Kicker><h3 className="mt-2 font-heading text-xl font-semibold tracking-tight">Same process, different day</h3><p className="mt-4 text-sm leading-relaxed text-foreground/80">A day counts as compliant only when every checked rule on its first trade was kept. Trade profit, R and strategy outcome do not decide the verdict.</p><div className="mt-6 grid grid-cols-2 gap-5"><Metric label="Day pairs" value={String(transitions.length)} detail="Previous recorded day available" accent /><Metric label="Multi-trade days" value={String(multiSessions.length)} detail="Also explored below" /></div><p className="mt-5 border-t border-white/[.08] pt-4 text-xs leading-relaxed text-muted-foreground">{ambiguousDays} days have an uncertain intraday order. A prior day can sit just outside the selected period. Break-even days appear in the evidence but not the win/loss comparison. Unlinked trades form one separate stream; link accounts if you trade several.</p></Surface>
      </div>

      <div id="decision-rhythm" className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,.75fr)]"><DailyRhythm rows={dailyRows} transitions={transitions} selectedId={dailyId} onSelect={setDailyId} />{selectedDaily ? <DecisionDetail key={selectedDaily.trade.id} row={selectedDaily} transition={selectedTransition} /> : <Surface className="p-5 sm:p-6"><Kicker>Decision detail</Kicker><p className="mt-4 text-sm text-muted-foreground">No first trade has a reliable order in this selection.</p></Surface>}</div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,.75fr)]"><Surface className="p-5 sm:p-6"><div className="flex flex-wrap items-end justify-between gap-3"><div><Kicker>Recorded day pairs</Kicker><h3 className="mt-2 font-heading text-xl font-semibold tracking-tight">Review the evidence</h3></div><div className="flex gap-1 rounded-lg border border-white/[.08] bg-background/40 p-1" aria-label="Filter by previous result">{([{"key":"all","label":"All"},{"key":"loss","label":"After loss"},{"key":"win","label":"After win"}] as const).map((item) => <button key={item.key} type="button" aria-pressed={focus === item.key} onClick={() => setFocus(item.key)} className={cn(styles.tab, "rounded-md px-2.5 py-1.5 text-[11px] font-semibold", focus === item.key ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground")}>{item.label}</button>)}</div></div><div className="mt-5 max-h-80 divide-y divide-white/[.07] overflow-y-auto">{focusedTransitions.length ? focusedTransitions.map((item) => <button key={item.current.trade.id} type="button" onClick={() => { setDailyId(item.current.trade.id); document.getElementById("decision-rhythm")?.scrollIntoView({ behavior: "auto", block: "center" }); }} className="flex w-full flex-wrap items-center justify-between gap-2 py-3 text-left text-xs hover:text-primary"><span className="font-medium">{dayLabel(item.date)} <span className="font-normal text-muted-foreground">/ after {item.previousResult} / {item.current.trade.instrument}</span></span><TradeStatus row={item.current} /></button>) : <p className="py-6 text-sm text-muted-foreground">No recorded day pair matches this filter.</p>}</div></Surface><Surface className="p-5 sm:p-6"><Kicker>Repeated deviations</Kicker><h3 className="mt-2 font-heading text-xl font-semibold tracking-tight">Rules to revisit</h3><div className="mt-4 space-y-2">{brokenRules.length ? brokenRules.map(([label, count]) => <div key={label} className="flex items-start justify-between gap-4 border-b border-white/[.06] py-2 text-xs"><span className="leading-relaxed text-foreground/80">{label}</span><strong className="tabular-nums text-destructive">{count}</strong></div>) : <p className="text-sm text-muted-foreground">No broken checked rules on the first trade of a day.</p>}</div><p className="mt-5 text-xs leading-relaxed text-muted-foreground">Counts describe the first trade of each ordered day, including days with no prior result in the data.</p></Surface></div>

      <IntradaySection sessions={multiSessions} selected={chosenSession} selectedTrade={chosenTrade} onSession={(id) => { setSessionId(id); setTradeId(null); }} onTrade={setTradeId} accountName={accountName} preMarket={preMarket} />
      <p className="px-1 text-xs leading-relaxed text-muted-foreground">These insights describe recorded rule checks. They cannot infer motive, patience or actual position risk. The Playbook shows current limits, not a historical session plan.</p>
    </div>}
  </div>;
}
