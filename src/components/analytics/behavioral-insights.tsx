"use client";

import { useMemo, useState, type ReactNode } from "react";
import { format } from "date-fns";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ChevronRight, CircleHelp, Clock3, Crosshair } from "lucide-react";
import { inPeriod } from "@/lib/journal/analytics-filter";
import { buildTradingSessions, contextSummary, flattenSessions, summarizeAdherence, type AssessedTrade, type ResponseContext, type TradingSession } from "@/lib/journal/behavioral-analytics";
import type { FundedAccount, PreMarketExercise, TradeJournalEntry, TradeRuleCheck, Session } from "@/lib/types";
import { cn } from "@/lib/utils";
import styles from "./behavioral-insights.module.css";

type View = "fingerprint" | "drift";
const sessionNames: Session[] = ["Asia", "London", "New York"];
const dayLabel = (date: string) => format(new Date(`${date}T12:00:00`), "d MMM yyyy");
const rate = (value: number | null) => value === null ? "--" : `${value}%`;
const isBroken = (row: AssessedTrade) => row.rules.some((rule) => !rule.passed);
const assessmentLabel = (row: AssessedTrade) => row.rules.length === 0 ? "Not assessed" : isBroken(row) ? "Rule broken" : "Checks kept";

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
    <span className={cn("size-1.5 rounded-full", row.rules.length === 0 ? "bg-muted-foreground" : isBroken(row) ? "bg-destructive" : "bg-primary")} />{assessmentLabel(row)}
  </span>;
}

function DecisionDetail({ row, number }: { row: AssessedTrade; number?: number | null }) {
  return <Surface className="p-5 sm:p-6">
    <div className="flex items-start justify-between gap-3"><Kicker>Decision detail</Kicker><Crosshair className="size-4 text-primary" aria-hidden="true" /></div>
    <h3 className="mt-3 font-heading text-xl font-semibold tracking-tight">{row.trade.instrument}</h3>
    <p className="mt-1 text-xs text-muted-foreground">{dayLabel(row.trade.date_time.slice(0, 10))} / {row.trade.execution_time || "Time not logged"}{number ? ` / Trade ${number}` : ""}</p>
    <div className="mt-5 flex items-center justify-between border-y border-white/[.08] py-3"><TradeStatus row={row} /><span className="text-xs text-muted-foreground">{row.trade.result}</span></div>
    <div className="mt-2 divide-y divide-white/[.06]">{row.rules.length ? row.rules.map((rule) => <div key={rule.label} className="flex items-start justify-between gap-3 py-3 text-xs"><span className="max-w-[75%] leading-relaxed text-foreground/80">{rule.label}</span><span className={cn("shrink-0 font-semibold", rule.passed ? "text-primary" : "text-destructive")}>{rule.passed ? "Kept" : "Broken"}</span></div>) : <p className="py-4 text-xs leading-relaxed text-muted-foreground">No rule checks were saved for this trade. Its plan status is unknown.</p>}</div>
    <Link href={`/journal/${row.trade.id}`} className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-primary hover:text-foreground">Open in Journal <ArrowRight className="size-3.5" /></Link>
  </Surface>;
}

export function BehavioralInsights({ trades, ruleChecks, accounts, exercises }: { trades: TradeJournalEntry[]; ruleChecks: TradeRuleCheck[]; accounts: FundedAccount[]; exercises: PreMarketExercise[] }) {
  const [view, setView] = useState<View>("fingerprint");
  const [period, setPeriod] = useState("90d");
  const [accountId, setAccountId] = useState("all");
  const [context, setContext] = useState<ResponseContext>("after-loss");
  const [session, setSession] = useState<Session | "all">("all");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [tradeId, setTradeId] = useState<string | null>(null);
  const [evidenceId, setEvidenceId] = useState<string | null>(null);
  const today = format(new Date(), "yyyy-MM-dd");
  const filtered = useMemo(() => inPeriod(trades, period, today).filter((trade) => accountId === "all" || (accountId === "unlinked" ? !trade.funded_account_id : trade.funded_account_id === accountId)), [trades, period, today, accountId]);
  const tradingSessions = useMemo(() => buildTradingSessions(filtered, ruleChecks), [filtered, ruleChecks]);
  const allRows = useMemo(() => flattenSessions(tradingSessions), [tradingSessions]);
  const matchingRows = useMemo(() => allRows.filter((row) => session === "all" || row.trade.session === session), [allRows, session]);
  const profile = useMemo(() => contextSummary(matchingRows, context), [matchingRows, context]);
  const overall = useMemo(() => summarizeAdherence(matchingRows), [matchingRows]);
  const chosenSession = tradingSessions.find((item) => item.id === sessionId) ?? tradingSessions[0] ?? null;
  const chosenTrade = chosenSession?.trades.find((row) => row.trade.id === tradeId) ?? chosenSession?.trades[0] ?? null;
  const evidenceRows = [...profile.matchingRows].sort((a, b) => b.trade.date_time.localeCompare(a.trade.date_time) || (b.trade.execution_time ?? "").localeCompare(a.trade.execution_time ?? ""));
  const chosenEvidence = evidenceRows.find((row) => row.trade.id === evidenceId) ?? evidenceRows[0] ?? null;
  const preMarket = chosenSession ? exercises.find((item) => item.date === chosenSession.date && item.completed_at) : null;
  const accountName = (id: string | null) => id ? (accounts.find((account) => account.id === id)?.account_name ?? "Archived account") : "No account linked";
  const unknownSequence = matchingRows.filter((row) => row.context === "unknown").length;
  const delta = profile.matching.rate !== null && profile.comparison.rate !== null ? profile.matching.rate - profile.comparison.rate : null;
  const enough = profile.matching.assessed >= 5 && profile.comparison.assessed >= 5;
  const brokenRules = Object.entries(profile.matchingRows.flatMap((row) => row.rules.filter((rule) => !rule.passed).map((rule) => rule.label)).reduce<Record<string, number>>((counts, label) => { counts[label] = (counts[label] ?? 0) + 1; return counts; }, {})).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const changeSelection = () => { setSessionId(null); setTradeId(null); setEvidenceId(null); };

  return <div className="mx-auto max-w-[1500px] space-y-5 pb-12">
    <header className="flex flex-wrap items-start justify-between gap-4 py-1">
      <div><Link href="/analytics" className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:text-primary"><ArrowLeft className="size-3.5" /> Analytics desk</Link><h1 className="mt-3 font-heading text-3xl font-semibold tracking-[-.045em] sm:text-4xl">Behavioral insights<span className="text-primary">.</span></h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">A closer look at decisions, sequence and the rules you actually checked.</p></div>
      <span className="rounded-full border border-primary/20 bg-primary/[.07] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[.12em] text-primary">Journal evidence</span>
    </header>

    <div className="flex flex-col gap-3 rounded-2xl border border-white/[.08] bg-card/55 p-2.5 md:flex-row md:items-center md:justify-between">
      <div role="tablist" aria-label="Behavioral insight" className="grid grid-cols-2 rounded-xl bg-background/60 p-1">
        {([{"key":"fingerprint","label":"Fingerprint"},{"key":"drift","label":"Plan Drift"}] as const).map((item) => <button key={item.key} type="button" role="tab" aria-selected={view === item.key} onClick={() => setView(item.key)} className={cn(styles.tab, "relative min-h-9 rounded-lg px-4 text-xs font-semibold", view === item.key ? "bg-primary/[.13] text-primary shadow-[inset_0_0_0_1px_rgba(20,184,166,.19)]" : "text-muted-foreground hover:text-foreground")}>{item.label}</button>)}
      </div>
      <div className="flex flex-wrap gap-2">
        <label className="sr-only" htmlFor="behavior-period">Period</label><select id="behavior-period" value={period} onChange={(event) => { setPeriod(event.target.value); changeSelection(); }} className="h-9 rounded-lg border border-white/[.09] bg-background px-3 text-xs text-foreground"><option value="30d">Last 30 days</option><option value="90d">Last 90 days</option><option value="all">All time</option></select>
        <label className="sr-only" htmlFor="behavior-account">Account</label><select id="behavior-account" value={accountId} onChange={(event) => { setAccountId(event.target.value); changeSelection(); }} className="h-9 max-w-48 rounded-lg border border-white/[.09] bg-background px-3 text-xs text-foreground"><option value="all">All accounts</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.account_name}</option>)}<option value="unlinked">No account linked</option></select>
      </div>
    </div>

    {filtered.length === 0 ? <Surface className="p-12 text-center"><CircleHelp className="mx-auto size-7 text-primary" /><h2 className="mt-4 font-heading text-xl font-semibold">No trades in this selection</h2><p className="mt-2 text-sm text-muted-foreground">Choose a wider period or another account, or add trades in Journal.</p><Link href="/journal" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">Open Journal <ArrowRight className="size-4" /></Link></Surface> : <div key={view} className={cn(styles.enter, "space-y-4")}>
      {view === "fingerprint" ? <>
        <Surface className="relative overflow-hidden border-primary/20 bg-[radial-gradient(ellipse_at_85%_5%,rgba(20,184,166,.15),transparent_48%),linear-gradient(135deg,rgba(20,184,166,.055),rgba(11,17,32,.25))] p-6 sm:p-8">
          <div className="relative z-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end"><div><Kicker>01 / Behavioral fingerprint</Kicker><h2 className="mt-4 max-w-2xl font-heading text-3xl font-semibold leading-tight tracking-[-.04em] sm:text-[40px]">What changes after<br /><span className="text-primary">a {context === "after-loss" ? "loss" : "win"}?</span></h2><p className="mt-4 max-w-xl text-sm leading-relaxed text-foreground/65">Compare the first trade after a closed result with other trades whose order is known. Adherence means every checked rule on that trade was kept.</p></div><div className="flex h-fit gap-1 rounded-xl border border-white/[.09] bg-background/55 p-1" aria-label="Choose prior result">{([{"key":"after-loss","label":"After a loss"},{"key":"after-win","label":"After a win"}] as const).map((item) => <button key={item.key} type="button" onClick={() => { setContext(item.key); setEvidenceId(null); }} aria-pressed={context === item.key} className={cn(styles.tab, "rounded-lg px-3 py-2 text-xs font-semibold", context === item.key ? "bg-primary/[.14] text-primary" : "text-muted-foreground hover:text-foreground")}>{item.label}</button>)}</div></div>
          <div className="relative z-10 mt-8 grid gap-6 border-t border-white/[.1] pt-6 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center"><div className="flex items-baseline gap-2"><strong className={cn("font-heading text-5xl font-semibold leading-none tabular-nums tracking-[-.06em] sm:text-6xl", delta !== null && delta < 0 ? "text-destructive" : "text-primary")}>{delta === null ? "--" : `${delta > 0 ? "+" : ""}${delta}`}</strong><span className="text-sm text-muted-foreground">pts</span></div><div><p className="text-sm font-medium">{delta === null ? "Comparison unavailable" : delta === 0 ? "No observed difference in this selection" : `${Math.abs(delta)} percentage points ${delta < 0 ? "lower" : "higher"} checked-rule adherence`}</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{enough ? "Descriptive comparison only. It does not establish what caused the difference." : "Early observation: fewer than five assessed trades on at least one side."}</p></div></div>
        </Surface>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,.7fr)]">
          <Surface className="p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><Kicker>Response comparison</Kicker><h3 className="mt-2 font-heading text-xl font-semibold tracking-tight">Rules kept, side by side</h3></div><span className="rounded-full border border-white/[.08] px-2.5 py-1 text-[10px] text-muted-foreground">{profile.matching.assessed + profile.comparison.assessed} assessed trades</span></div><div className="mt-7 space-y-7"><ComparisonBar label={context === "after-loss" ? "After a loss" : "After a win"} value={profile.matching.rate} detail={`${profile.matching.kept} of ${profile.matching.assessed} assessed trades kept every checked rule`} highlight /><ComparisonBar label="Other known sequences" value={profile.comparison.rate} detail={`${profile.comparison.kept} of ${profile.comparison.assessed} assessed trades`} /></div><div className="mt-7 grid grid-cols-2 gap-5 border-t border-white/[.08] pt-5"><Metric label="Overall" value={rate(overall.rate)} detail={`${overall.kept}/${overall.assessed} assessed trades`} /><Metric label="Coverage gap" value={String(profile.matching.unassessed)} detail="Matching trades without rule checks" /></div></Surface>
          <Surface className="p-5 sm:p-6"><Kicker>Session lens</Kicker><h3 className="mt-2 font-heading text-xl font-semibold tracking-tight">Where does it show up?</h3><p className="mt-2 text-xs leading-relaxed text-muted-foreground">Select a session to update every comparison and the evidence below.</p><div className="mt-5 space-y-2">{sessionNames.map((item) => { const rows = allRows.filter((row) => row.trade.session === item && row.context === context); const summary = summarizeAdherence(rows); return <button key={item} type="button" aria-pressed={session === item} onClick={() => { setSession(session === item ? "all" : item); setEvidenceId(null); }} className={cn(styles.selectable, "flex w-full items-center gap-3 rounded-xl border p-3.5 text-left", session === item ? "border-primary/40 bg-primary/[.08]" : "border-white/[.07] bg-background/25")}><span className="min-w-0 flex-1 text-sm font-medium">{item}</span><span className="text-[11px] text-muted-foreground">{summary.kept}/{summary.assessed}</span><strong className="w-12 text-right text-sm tabular-nums text-primary">{rate(summary.rate)}</strong><ChevronRight className="size-3.5 text-muted-foreground" /></button>; })}</div><p className="mt-4 text-[11px] text-muted-foreground">{session === "all" ? "All sessions selected" : `Showing ${session}. Click again to reset.`}</p></Surface>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,.7fr)]">
          <Surface className="p-5 sm:p-6"><div className="flex flex-wrap items-end justify-between gap-3"><div><Kicker>Evidence trail</Kicker><h3 className="mt-2 font-heading text-xl font-semibold tracking-tight">Trades behind the pattern</h3></div><span className="text-xs text-muted-foreground">{profile.matchingRows.length} matching / {profile.matching.assessed} assessed</span></div>
            {evidenceRows.length ? <><div className="mt-6 flex flex-wrap gap-2" aria-label="Matching trades">{evidenceRows.slice(0, 40).map((row, index) => <button key={row.trade.id} type="button" onClick={() => setEvidenceId(row.trade.id)} aria-label={`${dayLabel(row.trade.date_time.slice(0, 10))}, ${row.trade.instrument}, ${assessmentLabel(row)}`} aria-pressed={chosenEvidence?.trade.id === row.trade.id} className={cn(styles.evidence, "relative flex size-9 items-center justify-center rounded-lg border text-[10px] font-semibold tabular-nums", chosenEvidence?.trade.id === row.trade.id ? "border-primary bg-primary/15 text-primary" : isBroken(row) ? "border-destructive/25 bg-destructive/[.07] text-destructive" : row.rules.length ? "border-primary/20 bg-primary/[.07] text-primary" : "border-white/[.08] bg-background/50 text-muted-foreground")}>{String(index + 1).padStart(2, "0")}</button>)}</div><div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-white/[.08] pt-4 text-[11px] text-muted-foreground"><span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-primary" /> Checks kept</span><span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-destructive" /> Rule broken</span><span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-muted-foreground" /> Not assessed</span></div>{evidenceRows.length > 40 && <p className="mt-3 text-xs text-muted-foreground">Showing the 40 most recent matching trades.</p>}</> : <p className="mt-6 text-sm text-muted-foreground">No trades with a verified sequence match this context.</p>}
          </Surface>
          <div className="space-y-4">{chosenEvidence ? <DecisionDetail key={chosenEvidence.trade.id} row={chosenEvidence} /> : <Surface className="p-5 sm:p-6"><Kicker>Decision detail</Kicker><p className="mt-4 text-sm text-muted-foreground">Choose a trade from the evidence trail to inspect its rule checks.</p></Surface>}</div>
        </div>
        <Surface className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"><div><Kicker>Observed deviations</Kicker><h3 className="mt-2 font-heading text-lg font-semibold">Rules to review</h3><div className="mt-4 space-y-2">{brokenRules.length ? brokenRules.map(([label, count]) => <div key={label} className="flex items-start justify-between gap-4 border-b border-white/[.06] py-2 text-xs"><span className="leading-relaxed text-foreground/80">{label}</span><strong className="tabular-nums text-destructive">{count}</strong></div>) : <p className="text-sm text-muted-foreground">No broken checked rules in this context.</p>}</div></div><div className="border-t border-white/[.08] pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0"><Kicker className="text-ice">Reading the signal</Kicker><p className="mt-3 text-sm leading-relaxed text-foreground/80">{unknownSequence} trades lack a reliable order. Trades with no checked rules count as unknown, not compliant. Only distinct entry times and a recorded prior exit establish an after-result sequence.</p><p className="mt-3 text-xs leading-relaxed text-muted-foreground">This view describes recorded checks; it cannot infer motive, patience or actual position risk.</p></div></Surface>
      </> : <DriftView sessions={tradingSessions} selected={chosenSession} selectedTrade={chosenTrade} onSession={(id) => { setSessionId(id); setTradeId(null); }} onTrade={setTradeId} accountName={accountName} preMarket={preMarket ?? null} />}
    </div>}
  </div>;
}

function DriftView({ sessions, selected, selectedTrade, onSession, onTrade, accountName, preMarket }: { sessions: TradingSession[]; selected: TradingSession | null; selectedTrade: AssessedTrade | null; onSession: (id: string) => void; onTrade: (id: string) => void; accountName: (id: string | null) => string; preMarket: PreMarketExercise | null }) {
  const summary = selected ? summarizeAdherence(selected.trades) : null;
  return <>
    <Surface className="relative overflow-hidden border-primary/20 bg-[radial-gradient(ellipse_at_85%_5%,rgba(6,182,212,.13),transparent_50%),linear-gradient(135deg,rgba(20,184,166,.05),rgba(11,17,32,.25))] p-6 sm:p-8"><Kicker>02 / Plan Drift</Kicker><h2 className="mt-4 max-w-2xl font-heading text-3xl font-semibold leading-tight tracking-[-.04em] sm:text-[40px]">Where did the plan<br /><span className="text-primary">shift?</span></h2><p className="mt-4 max-w-2xl text-sm leading-relaxed text-foreground/65">Walk through recorded decisions in one account-day group. A trade result never decides whether its rule checks passed.</p></Surface>
    <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[290px_minmax(0,1fr)]">
      <Surface className="h-fit p-3"><div className="px-2 py-2"><Kicker>Session index</Kicker><p className="mt-1 text-xs text-muted-foreground">{sessions.length} account-day groups</p></div><div className="mt-2 max-h-[42rem] space-y-1 overflow-y-auto pr-1">{sessions.map((item) => { const s = summarizeAdherence(item.trades); return <button key={item.id} type="button" aria-pressed={selected?.id === item.id} onClick={() => onSession(item.id)} className={cn(styles.selectable, "w-full rounded-xl border px-3.5 py-3 text-left", selected?.id === item.id ? "border-primary/40 bg-primary/[.08]" : "border-transparent hover:bg-background/40")}><span className="flex items-center justify-between gap-2"><strong className="text-xs font-semibold">{dayLabel(item.date)}</strong><ChevronRight className="size-3.5 text-muted-foreground" /></span><span className="mt-1 block truncate text-[11px] text-muted-foreground">{accountName(item.accountId)} / {item.trades.length} {item.trades.length === 1 ? "trade" : "trades"}</span><span className={cn("mt-2 block text-[10px] font-semibold", s.broken ? "text-destructive" : s.assessed ? "text-primary" : "text-muted-foreground")}>{s.broken ? `${s.broken} recorded breach${s.broken === 1 ? "" : "es"}` : s.assessed ? "No checked breach" : "No rules assessed"}</span></button>; })}</div></Surface>
      {selected && summary && <div className="space-y-4">
        <Surface className="p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><Kicker>Session / {dayLabel(selected.date)}</Kicker><h3 className="mt-2 font-heading text-xl font-semibold tracking-tight">{selected.orderReliable ? selected.firstBreachIndex === null ? summary.assessed ? "No recorded break" : "No assessed decisions" : `First recorded break at trade ${selected.firstBreachIndex + 1}` : "Sequence cannot be verified"}</h3><p className="mt-2 max-w-2xl text-xs leading-relaxed text-muted-foreground">{selected.orderReliable ? selected.firstBreachIndex === null ? "The checked rules show no breach in this account-day group. Unassessed trades remain unknown." : `A checked rule first failed at ${selected.trades[selected.firstBreachIndex].trade.execution_time}. Select a decision below to inspect it.` : "Some entry times are missing or tied. The first breach and order cannot be established reliably."}</p></div><Clock3 className="size-5 text-primary" /></div><div className="mt-6 grid gap-5 border-t border-white/[.08] pt-5 sm:grid-cols-4"><Metric label="Trades" value={String(selected.trades.length)} detail="In this group" /><Metric label="Assessed" value={String(summary.assessed)} detail="Rule checks saved" accent /><Metric label="Breaches" value={String(summary.broken)} detail="At least one rule broken" /><Metric label="Unknown" value={String(summary.unassessed)} detail="No rule checks" /></div></Surface>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,.85fr)]"><Surface className="p-5 sm:p-6"><Kicker>Decision sequence</Kicker><h3 className="mt-2 font-heading text-xl font-semibold tracking-tight">Every trade, in context</h3><div className={cn("relative mt-6 space-y-2", styles.rail)}>{selected.trades.map((row, index) => { const first = selected.orderReliable && selected.firstBreachIndex === index; const active = selectedTrade?.trade.id === row.trade.id; return <button key={row.trade.id} type="button" aria-pressed={active} onClick={() => onTrade(row.trade.id)} className={cn(styles.selectable, "relative z-10 flex w-full items-center gap-3 rounded-xl border p-3 text-left sm:p-3.5", active ? "border-primary/45 bg-primary/[.08]" : "border-white/[.07] bg-background/60", first && "ring-1 ring-destructive/35")}><span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full border bg-background text-[11px] font-semibold tabular-nums", isBroken(row) ? "border-destructive/45 text-destructive" : row.rules.length ? "border-primary/45 text-primary" : "border-white/[.15] text-muted-foreground")}>{selected.orderReliable ? String(index + 1).padStart(2, "0") : "?"}</span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold">{row.trade.instrument} <span className="font-normal text-muted-foreground">/ {row.trade.execution_time || "Time not logged"}</span></span><span className="mt-1 block"><TradeStatus row={row} /></span></span>{first ? <span className="hidden rounded-full border border-destructive/25 bg-destructive/[.08] px-2 py-1 text-[10px] font-semibold text-destructive sm:block">First break</span> : null}<ChevronRight className="size-3.5 shrink-0 text-muted-foreground" /></button>; })}</div></Surface><div className="space-y-4">{selectedTrade && <DecisionDetail key={selectedTrade.trade.id} row={selectedTrade} number={selected.orderReliable ? selected.trades.findIndex((row) => row.trade.id === selectedTrade.trade.id) + 1 : null} />}<Surface className="p-5 sm:p-6"><Kicker className="text-ice">Saved daily entry</Kicker><h3 className="mt-2 font-heading text-lg font-semibold">Pre-market focus</h3>{preMarket ? <div className="mt-4 space-y-4 text-sm"><div><p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Focus</p><p className="mt-1 leading-relaxed">{preMarket.focus || "None recorded"}</p></div><div><p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Commitment</p><p className="mt-1 leading-relaxed">{preMarket.commitment_text || "None recorded"}</p></div><p className="text-xs leading-relaxed text-muted-foreground">This entry belongs to the selected day. Its presence alone does not prove it was completed before each trade.</p></div> : <p className="mt-4 text-sm leading-relaxed text-muted-foreground">No completed pre-market exercise was found for this day.</p>}</Surface></div></div>
        <p className="px-1 text-xs leading-relaxed text-muted-foreground">The Playbook shows current limits, not a historical session plan. Unassessed trades are never marked compliant. A verified order requires unique entry times.</p>
      </div>}
    </div>
  </>;
}
