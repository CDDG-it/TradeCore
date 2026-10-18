"use client";

import { useMemo, useState, type ReactNode } from "react";
import { format } from "date-fns";
import Link from "next/link";
import { ArrowRight, BookOpen, Clock3, ShieldCheck } from "lucide-react";
import { inPeriod } from "@/lib/journal/analytics-filter";
import { buildTradingSessions, contextSummary, flattenSessions, summarizeAdherence, type AssessedTrade, type ResponseContext } from "@/lib/journal/behavioral-analytics";
import type { FundedAccount, PreMarketExercise, TradeJournalEntry, TradeRuleCheck, Session } from "@/lib/types";
import { cn } from "@/lib/utils";

type View = "fingerprint" | "drift";
const contexts: { key: ResponseContext; title: string; description: string }[] = [
  { key: "after-loss", title: "After a loss", description: "The next trade after a closed loss" },
  { key: "after-win", title: "After a win", description: "The next trade after a closed win" },
];
const sessions: Session[] = ["Asia", "London", "New York"];

function Surface({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={cn("rounded-2xl border border-border/70 bg-card/65 p-5 sm:p-6", className)}>{children}</section>;
}

function Stat({ label, value, detail, tone }: { label: string; value: string; detail: string; tone?: "good" | "bad" }) {
  return <div className="rounded-xl border border-border/60 bg-background/35 p-4 sm:p-5">
    <p className="text-[10px] font-semibold uppercase tracking-[.15em] text-muted-foreground">{label}</p>
    <p className={cn("mt-2 font-heading text-2xl font-bold tabular-nums tracking-tight sm:text-3xl", tone === "good" && "text-primary", tone === "bad" && "text-destructive")}>{value}</p>
    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{detail}</p>
  </div>;
}

const rate = (value: number | null) => value === null ? "No data" : `${value}%`;
const dayLabel = (date: string) => format(new Date(`${date}T12:00:00`), "EEE, d MMM yyyy");
const assessmentLabel = (row: AssessedTrade) => row.rules.length === 0 ? "Not assessed" : row.rules.some((rule) => !rule.passed) ? "Rule broken" : "Checks kept";

export function BehavioralInsights({ trades, ruleChecks, accounts, exercises }: {
  trades: TradeJournalEntry[];
  ruleChecks: TradeRuleCheck[];
  accounts: FundedAccount[];
  exercises: PreMarketExercise[];
}) {
  const [view, setView] = useState<View>("fingerprint");
  const [period, setPeriod] = useState("90d");
  const [accountId, setAccountId] = useState("all");
  const [context, setContext] = useState<ResponseContext>("after-loss");
  const [session, setSession] = useState<Session | "all">("all");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [tradeId, setTradeId] = useState<string | null>(null);
  const today = format(new Date(), "yyyy-MM-dd");
  const filtered = useMemo(() => inPeriod(trades, period, today).filter((trade) => accountId === "all" || (accountId === "unlinked" ? !trade.funded_account_id : trade.funded_account_id === accountId)), [trades, period, today, accountId]);
  const tradingSessions = useMemo(() => buildTradingSessions(filtered, ruleChecks), [filtered, ruleChecks]);
  const allRows = useMemo(() => flattenSessions(tradingSessions), [tradingSessions]);
  const matchingRows = useMemo(() => allRows.filter((row) => session === "all" || row.trade.session === session), [allRows, session]);
  const profile = useMemo(() => contextSummary(matchingRows, context), [matchingRows, context]);
  const chosenSession = tradingSessions.find((item) => item.id === sessionId) ?? tradingSessions[0] ?? null;
  const chosenTrade = chosenSession?.trades.find((row) => row.trade.id === tradeId) ?? chosenSession?.trades[0] ?? null;
  const preMarket = chosenSession ? exercises.find((item) => item.date === chosenSession.date && item.completed_at) : null;
  const accountName = (id: string | null) => id ? (accounts.find((account) => account.id === id)?.account_name ?? "Archived account") : "No account linked";
  const unknownSequence = matchingRows.filter((row) => row.context === "unknown").length;
  const delta = profile.matching.rate !== null && profile.comparison.rate !== null ? profile.matching.rate - profile.comparison.rate : null;
  const enough = profile.matching.assessed >= 5 && profile.comparison.assessed >= 5;

  return <div className="space-y-5 pb-12">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-primary">Analytics / Psychology</p>
        <h1 className="mt-2 font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Behavioral insights</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">See how your checked rules held up, and where a session first moved away from them.</p>
      </div>
      <Link href="/analytics" className="text-xs font-semibold text-primary transition-colors hover:text-foreground">Back to Analytics</Link>
    </div>

    <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card/65 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div role="tablist" aria-label="Behavioral insight" className="flex gap-1 rounded-xl bg-background/60 p-1">
        {([{"key":"fingerprint","label":"Behavioral Fingerprint"},{"key":"drift","label":"Plan Drift"}] as const).map((item) => <button key={item.key} type="button" role="tab" aria-selected={view === item.key} onClick={() => setView(item.key)} className={cn("rounded-lg px-3 py-2 text-xs font-semibold transition-colors sm:px-4", view === item.key ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground")}>{item.label}</button>)}
      </div>
      <div className="flex flex-wrap gap-2">
        <label className="sr-only" htmlFor="behavior-period">Period</label>
        <select id="behavior-period" value={period} onChange={(event) => { setPeriod(event.target.value); setSessionId(null); }} className="h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground"><option value="30d">Last 30 days</option><option value="90d">Last 90 days</option><option value="all">All time</option></select>
        <label className="sr-only" htmlFor="behavior-account">Account</label>
        <select id="behavior-account" value={accountId} onChange={(event) => { setAccountId(event.target.value); setSessionId(null); }} className="h-9 max-w-48 rounded-lg border border-border bg-background px-3 text-xs text-foreground"><option value="all">All accounts</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.account_name}</option>)}<option value="unlinked">No account linked</option></select>
      </div>
    </div>

    {filtered.length === 0 ? <Surface className="py-16 text-center"><BookOpen className="mx-auto size-7 text-primary" /><h2 className="mt-4 font-heading text-lg font-semibold">No trades in this selection</h2><p className="mt-2 text-sm text-muted-foreground">Choose a wider period or another account, or add trades in Journal.</p><Link href="/journal" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">Open Journal <ArrowRight className="size-4" /></Link></Surface> : view === "fingerprint" ? <>
      <Surface className="border-primary/20 bg-gradient-to-br from-primary/[.09] via-card/70 to-card/60">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div><p className="text-[10px] font-semibold uppercase tracking-[.15em] text-primary">Behavioral Fingerprint</p><h2 className="mt-2 font-heading text-xl font-bold tracking-tight sm:text-2xl">What happens after a result?</h2><p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">Compare the first trade after a closed {context === "after-loss" ? "loss" : "win"} with other trades whose sequence is known. The measure is how often every assessed rule was kept.</p></div>
          <div className="flex gap-1 rounded-lg border border-border/60 bg-background/45 p-1">{contexts.map((item) => <button key={item.key} type="button" onClick={() => setContext(item.key)} aria-pressed={context === item.key} className={cn("rounded-md px-3 py-2 text-xs font-semibold", context === item.key ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground")}>{item.title}</button>)}</div>
        </div>
        <p className="mt-5 text-sm leading-relaxed text-foreground/85">{!enough ? "There are not yet five assessed trades on both sides of this comparison. Treat the percentages as early observations." : delta === null ? "There is not enough comparable data to calculate a difference." : `Checked-rule adherence is ${Math.abs(delta)} percentage points ${delta < 0 ? "lower" : delta > 0 ? "higher" : "different"} after a ${context === "after-loss" ? "loss" : "win"} in this selection.`}</p>
      </Surface>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label={context === "after-loss" ? "After a loss" : "After a win"} value={rate(profile.matching.rate)} detail={`${profile.matching.kept} of ${profile.matching.assessed} assessed trades kept every checked rule`} tone={enough ? "good" : undefined} />
        <Stat label="Other known sequences" value={rate(profile.comparison.rate)} detail={`${profile.comparison.kept} of ${profile.comparison.assessed} assessed trades`} />
        <Stat label="Difference" value={delta === null ? "No data" : `${delta > 0 ? "+" : ""}${delta} pts`} detail={enough ? "Descriptive comparison, not a cause" : "Small sample"} tone={enough ? delta !== null && delta < 0 ? "bad" : "good" : undefined} />
        <Stat label="Data coverage" value={`${profile.matching.assessed + profile.comparison.assessed}`} detail={`${unknownSequence} trades lack a reliable sequence; ${profile.matching.unassessed} matching trades have no assessed rules`} />
      </div>
      <div className="grid gap-3 xl:grid-cols-[1.15fr_.85fr]">
        <Surface><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[.15em] text-primary">Context matrix</p><h3 className="mt-1 font-heading text-lg font-bold">Rule adherence by session</h3></div><select aria-label="Filter trade list by session" value={session} onChange={(event) => setSession(event.target.value as Session | "all")} className="h-9 rounded-lg border border-border bg-background px-3 text-xs"><option value="all">All sessions</option>{sessions.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
          <div className="mt-5 grid gap-2 sm:grid-cols-3">{sessions.map((item) => { const rows = allRows.filter((row) => row.trade.session === item && row.context === context); const s = summarizeAdherence(rows); return <button key={item} type="button" onClick={() => setSession(item)} className={cn("rounded-xl border p-4 text-left transition-colors", session === item ? "border-primary/50 bg-primary/[.08]" : "border-border/60 bg-background/30 hover:border-primary/30")}><span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{item}</span><span className="mt-2 block text-xl font-bold tabular-nums">{rate(s.rate)}</span><span className="mt-1 block text-xs text-muted-foreground">{s.kept}/{s.assessed} assessed{s.assessed > 0 && s.assessed < 5 ? " · small sample" : ""}</span></button>; })}</div>
          <p className="mt-5 text-xs leading-relaxed text-muted-foreground">Only trades with distinct entry times and a recorded prior exit enter the after-loss or after-win groups. A missing rule check is not counted as kept or broken.</p>
        </Surface>
        <Surface><p className="text-[10px] font-semibold uppercase tracking-[.15em] text-ice">Current coverage</p><h3 className="mt-1 font-heading text-lg font-bold">Measured, not inferred</h3><div className="mt-5 space-y-4 text-sm"><p><span className="font-semibold text-foreground">Available now:</span> response after wins and losses, plus checked-rule consistency.</p><p className="text-muted-foreground">Patience and position-risk discipline need structured pre-trade decisions and actual position risk before they can become reliable dimensions.</p><p className="text-muted-foreground">This view describes recorded behavior. It does not say why it changed or predict the next trade.</p></div></Surface>
      </div>
      <Surface><div className="flex flex-wrap items-baseline justify-between gap-2"><h3 className="font-heading text-lg font-bold">Trades behind this view</h3><span className="text-xs text-muted-foreground">{profile.matchingRows.length} matching trades{session !== "all" ? ` in ${session}` : ""}</span></div><div className="mt-4 divide-y divide-border/60">{profile.matchingRows.length === 0 ? <p className="py-6 text-sm text-muted-foreground">No trades with a verified sequence match this context.</p> : profile.matchingRows.slice(0, 30).map((row) => <Link key={row.trade.id} href={`/journal/${row.trade.id}`} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm transition-colors hover:text-primary"><span className="font-medium">{dayLabel(row.trade.date_time.slice(0, 10))} <span className="text-muted-foreground">/ {row.trade.execution_time} / {row.trade.instrument}</span></span><span className={cn("text-xs font-semibold", row.rules.length === 0 ? "text-muted-foreground" : row.rules.some((rule) => !rule.passed) ? "text-destructive" : "text-primary")}>{assessmentLabel(row)} <ArrowRight className="ml-1 inline size-3" /></span></Link>)}</div>{profile.matchingRows.length > 30 && <p className="pt-3 text-xs text-muted-foreground">Showing the first 30 matching trades.</p>}</Surface>
    </> : <>
      <Surface className="border-primary/20 bg-gradient-to-br from-primary/[.09] via-card/70 to-card/60"><p className="text-[10px] font-semibold uppercase tracking-[.15em] text-primary">Plan Drift</p><h2 className="mt-2 font-heading text-xl font-bold tracking-tight sm:text-2xl">Find the first recorded break in a session</h2><p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">Follow the trade sequence and inspect the exact rules assessed on each trade. Only a recorded broken rule is marked as a deviation. Trade results do not decide whether a decision followed the plan.</p></Surface>
      <div className="grid gap-3 lg:grid-cols-[260px_minmax(0,1fr)]">
        <Surface className="h-fit"><h3 className="font-heading text-base font-bold">Sessions</h3><p className="mt-1 text-xs text-muted-foreground">{tradingSessions.length} account-day groups</p><div className="mt-4 max-h-[34rem] space-y-1 overflow-y-auto pr-1">{tradingSessions.map((item) => { const s = summarizeAdherence(item.trades); return <button key={item.id} type="button" onClick={() => { setSessionId(item.id); setTradeId(null); }} className={cn("w-full rounded-xl border p-3 text-left transition-colors", chosenSession?.id === item.id ? "border-primary/50 bg-primary/[.08]" : "border-transparent hover:border-border hover:bg-background/40")}><span className="block text-xs font-semibold">{dayLabel(item.date)}</span><span className="mt-1 block text-[11px] text-muted-foreground">{accountName(item.accountId)} · {item.trades.length} trades</span><span className={cn("mt-2 block text-[10px] font-semibold", s.broken ? "text-destructive" : "text-muted-foreground")}>{s.broken ? `${s.broken} recorded breach${s.broken === 1 ? "" : "es"}` : s.assessed ? "No checked breach" : "No rules assessed"}</span></button>; })}</div></Surface>
        {chosenSession && <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{(() => { const s = summarizeAdherence(chosenSession.trades); return <><Stat label="Trades" value={String(chosenSession.trades.length)} detail="In this account-day group" /><Stat label="Assessed" value={String(s.assessed)} detail="At least one rule checked" /><Stat label="Recorded breaches" value={String(s.broken)} detail="Trades with a broken checked rule" tone={s.broken ? "bad" : undefined} /><Stat label="Without assessment" value={String(s.unassessed)} detail="No rule verdict recorded" /></>; })()}</div>
          <div className="grid gap-3 xl:grid-cols-[1.1fr_.9fr]">
            <Surface><div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[.15em] text-primary">Session timeline</p><h3 className="mt-1 font-heading text-lg font-bold">{dayLabel(chosenSession.date)}</h3></div><Clock3 className="size-5 text-primary" /></div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{chosenSession.orderReliable ? chosenSession.firstBreachIndex === null ? "No checked rule breach was recorded in this session." : `First recorded breach: trade ${chosenSession.firstBreachIndex + 1} at ${chosenSession.trades[chosenSession.firstBreachIndex].trade.execution_time}.` : "Some entry times are missing or tied. Trade order and the first breach cannot be established reliably."}</p>
              <div className="mt-5 space-y-2">{chosenSession.trades.map((row, index) => <button key={row.trade.id} type="button" onClick={() => setTradeId(row.trade.id)} className={cn("flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors", chosenTrade?.trade.id === row.trade.id ? "border-primary/50 bg-primary/[.08]" : "border-border/60 bg-background/25 hover:border-primary/30")}><span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums", row.rules.some((rule) => !rule.passed) ? "bg-destructive/12 text-destructive" : "bg-primary/10 text-primary")}>{String(index + 1).padStart(2, "0")}</span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold">{row.trade.instrument} · {row.trade.execution_time || "Time not logged"}</span><span className="mt-0.5 block text-[11px] text-muted-foreground">{row.trade.result} · {assessmentLabel(row)}</span></span><span className={cn("size-2 shrink-0 rounded-full", row.rules.length === 0 ? "bg-muted-foreground/50" : row.rules.some((rule) => !rule.passed) ? "bg-destructive" : "bg-primary")} /></button>)}</div>
            </Surface>
            <div className="space-y-3"><Surface><p className="text-[10px] font-semibold uppercase tracking-[.15em] text-ice">Written before the session</p><h3 className="mt-1 font-heading text-lg font-bold">Pre-market focus</h3>{preMarket ? <div className="mt-4 space-y-4 text-sm"><div><p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Focus</p><p className="mt-1 leading-relaxed">{preMarket.focus || "None recorded"}</p></div><div><p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Commitment</p><p className="mt-1 leading-relaxed">{preMarket.commitment_text || "None recorded"}</p></div></div> : <p className="mt-4 text-sm leading-relaxed text-muted-foreground">No completed pre-market exercise was found for this day. The timeline can still show recorded rule checks.</p>}</Surface>
              {chosenTrade && <Surface><div className="flex items-center justify-between"><p className="text-[10px] font-semibold uppercase tracking-[.15em] text-primary">Selected decision</p><ShieldCheck className="size-5 text-primary" /></div><h3 className="mt-2 font-heading text-lg font-bold">{chosenTrade.trade.instrument} at {chosenTrade.trade.execution_time || "unknown time"}</h3><p className="mt-1 text-xs text-muted-foreground">{chosenTrade.trade.result} · {assessmentLabel(chosenTrade)}</p><div className="mt-4 divide-y divide-border/60">{chosenTrade.rules.length ? chosenTrade.rules.map((rule) => <div key={rule.label} className="flex items-start justify-between gap-3 py-2.5 text-xs"><span className="leading-relaxed">{rule.label}</span><span className={cn("shrink-0 font-semibold", rule.passed ? "text-primary" : "text-destructive")}>{rule.passed ? "Kept" : "Broken"}</span></div>) : <p className="py-2 text-xs leading-relaxed text-muted-foreground">No rule was assessed on this trade. Its plan status is unknown.</p>}</div><Link href={`/journal/${chosenTrade.trade.id}`} className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-primary hover:text-foreground">Open trade in Journal <ArrowRight className="size-3.5" /></Link></Surface>}</div>
          </div>
          <p className="px-1 text-xs leading-relaxed text-muted-foreground">The Playbook shows current limits, not a historical session plan. This view does not infer position risk from R targets or call an unassessed trade compliant.</p>
        </div>}
      </div>
    </>}
  </div>;
}
