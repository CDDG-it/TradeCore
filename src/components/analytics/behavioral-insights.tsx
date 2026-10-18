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
  trades: TradeJournalEntry[];
  ruleChecks: TradeRuleCheck[];
  accounts: FundedAccount[];
  exercises: PreMarketExercise[];
  habits: Habit[];
  habitCompletions: HabitCompletion[];
  weeklyReviews: WeeklyTradeReview[];
  recaps: Pick<BestTradeOfDay, "date" | "review_step" | "taken_was_best" | "notes" | "post_market_analysis" | "updated_at">[];
};
type Focus = "all" | "loss" | "win" | "loss-streak" | "win-streak";
const dateLabel = (date: string) => format(new Date(`${date}T12:00:00`), "d MMM yyyy");
const shortDate = (date: string) => format(new Date(`${date}T12:00:00`), "d MMM");
const resultLabel = (result: ResponseDay["previousResult"]) => result === "loss" ? "verlies" : result === "win" ? "winst" : result === "break-even" ? "break-even" : "geen eerdere trade";
const focusOptions: { key: Focus; label: string; description: string }[] = [
  { key: "all", label: "Alle dagen", description: "Bekijk al je handelsdagen" },
  { key: "loss", label: "Na verlies", description: "Vorige handelsdag eindigde met verlies" },
  { key: "win", label: "Na winst", description: "Vorige handelsdag eindigde met winst" },
  { key: "loss-streak", label: "Na verliesreeks", description: "Minstens twee verliezen op rij" },
  { key: "win-streak", label: "Na winreeks", description: "Minstens twee winsten op rij" },
];
const factors = [
  { key: "habits" as const, label: "Gewoontes", detail: "Alle geplande gewoontes gedaan" },
  { key: "weeklyReview" as const, label: "Weekterugblik", detail: "Terugblik van de vorige week af" },
  { key: "preMarket" as const, label: "Oefening vóór de markt", detail: "Oefening die dag afgerond" },
  { key: "yesterdayRecap" as const, label: "Terugblik van gisteren", detail: "Terugblik na de markt van vorige kalenderdag" },
];

function Footprint({ flip = false }: { flip?: boolean }) {
  return <svg viewBox="0 0 48 70" fill="currentColor" aria-hidden="true" className={cn("h-9 w-7", flip && "-scale-x-100")}><path d="M18.5 27.5C12 31 10.5 39 12.2 49.5c1.3 9.1 6.2 15.1 13 15.1 7.7 0 11.7-7 10.4-17.2-.8-7.6-3.6-14.1-8.1-18.5-2.7-2.7-5.9-3.3-9.3-1.4Z" /><circle cx="11" cy="22" r="4.1" /><circle cx="17" cy="15" r="4.6" /><circle cx="24.5" cy="11" r="4.4" /><circle cx="32" cy="12" r="3.8" /><circle cx="38" cy="18" r="3" /></svg>;
}

function Status({ value, rules = false }: { value: Signal; rules?: boolean }) {
  const label = rules ? value === "yes" ? "Regels gevolgd" : value === "no" ? "Regel gebroken" : "Niet beoordeeld" : value === "yes" ? "Gedaan" : value === "no" ? "Niet gedaan" : "Geen gegevens";
  return <span className={cn("inline-flex shrink-0 items-center gap-1.5 text-[11px] font-semibold", value === "yes" ? "text-primary" : value === "no" ? "text-destructive" : "text-muted-foreground")}><span className={cn("flex size-5 items-center justify-center rounded-full border", value === "yes" ? "border-primary/30 bg-primary/10" : value === "no" ? "border-destructive/30 bg-destructive/10" : "border-white/10 bg-white/[.04]")}>{value === "yes" ? <Check className="size-3" /> : value === "no" ? <X className="size-3" /> : <Minus className="size-3" />}</span>{label}</span>;
}

function RuleCount({ rows }: { rows: ResponseDay[] }) {
  const summary = adherence(rows);
  if (!summary.assessed) return <p className="text-sm text-muted-foreground">Nog geen dagen met opgeslagen regelchecks in deze selectie.</p>;
  return <><strong className="font-heading text-3xl font-semibold tracking-tight text-primary sm:text-4xl">{summary.kept} <span className="text-xl text-muted-foreground">van</span> {summary.assessed}</strong><span className="text-xs text-muted-foreground"> dagen regels gevolgd</span></>;
}

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
  const visible = rows.filter((row) => focus === "all" || (focus === "loss" && row.previousResult === "loss") || (focus === "win" && row.previousResult === "win") || (focus === "loss-streak" && row.previousResult === "loss" && row.previousStreak >= 2) || (focus === "win-streak" && row.previousResult === "win" && row.previousStreak >= 2));
  const selected = visible.find((row) => row.id === selectedId) ?? visible[0];
  const assessed = adherence(visible);
  const focusLabel = focusOptions.find((option) => option.key === focus)?.label ?? "Alle dagen";

  return <div className="mx-auto max-w-[1180px] space-y-4 pb-8">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div><Link href="/analytics" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3.5" /> Analyses</Link><p className="mt-3 text-[10px] font-bold uppercase tracking-[.2em] text-primary">Gedragsinzichten</p><h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Volg je je regels na winst of verlies?</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Kies het resultaat van je vorige handelsdag. Bekijk daarna wat je deed en of je je regels volgde.</p></div>
      <div className="flex gap-2"><select aria-label="Periode" value={period} onChange={(event) => { setPeriod(event.target.value); setSelectedId(null); }} className="h-9 rounded-lg border border-white/10 bg-card px-3 text-xs"><option value="30d">30 dagen</option><option value="90d">90 dagen</option><option value="all">Alles</option></select><select aria-label="Account" value={accountId} onChange={(event) => { setAccountId(event.target.value); setSelectedId(null); }} className="h-9 max-w-40 rounded-lg border border-white/10 bg-card px-3 text-xs"><option value="all">Alle accounts</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.account_name}</option>)}<option value="unlinked">Zonder account</option></select></div>
    </header>

    {rows.length === 0 ? <section className="rounded-2xl border border-white/10 bg-card/60 p-8 text-sm text-muted-foreground">Geen trades in deze selectie. Kies een ruimere periode of voeg trades toe in je Journal.</section> : <>
      <section className="rounded-[22px] border border-white/[.08] bg-card/60 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2"><p className="mr-2 text-[10px] font-bold uppercase tracking-[.18em] text-primary">1 · Vorige handelsdag</p>{focusOptions.map((option) => <button key={option.key} type="button" onClick={() => { setFocus(option.key); setSelectedId(null); }} aria-pressed={focus === option.key} title={option.description} className={cn(styles.card, "rounded-full border px-3 py-1.5 text-xs font-semibold", focus === option.key ? "border-primary/45 bg-primary/10 text-primary" : "border-white/10 bg-background/40 text-muted-foreground hover:text-foreground")}>{option.label}</button>)}</div>
      </section>

      <section className="rounded-[22px] border border-primary/20 bg-[radial-gradient(circle_at_top_right,rgba(20,184,166,.12),transparent_55%)] p-4">
        <p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">2 · Volgde je daarna je regels?</p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-2"><div><h2 className="font-heading text-base font-semibold">{focusLabel}</h2><div className="mt-1"><RuleCount rows={visible} /></div></div><span className="text-[11px] text-muted-foreground">{visible.length - assessed.assessed} dagen zonder regelchecks tellen niet mee</span></div>
        <p className="mt-2 text-xs text-muted-foreground">Groen = alle regels gevolgd · rood = regel gebroken · grijs = niet beoordeeld. Klik op een voetstap voor de details.</p>
        {visible.length ? <div className={cn(styles.trail, "mt-3 flex gap-2 overflow-x-auto pb-2")} aria-label="Handelsdagen, nieuwste eerst">{visible.slice(0, 30).map((row, index) => <button key={row.id} type="button" onClick={() => setSelectedId(row.id)} aria-pressed={selected?.id === row.id} aria-label={`${dateLabel(row.date)}: ${row.rules === "yes" ? "regels gevolgd" : row.rules === "no" ? "regels gebroken" : "regelchecks ontbreken"}`} className={cn(styles.footprint, "flex min-w-16 shrink-0 flex-col items-center rounded-xl border px-2 py-2", selected?.id === row.id ? "border-primary/60 bg-primary/[.09]" : "border-white/[.07] bg-background/40", row.rules === "yes" ? "text-primary" : row.rules === "no" ? "text-destructive" : "text-muted-foreground")}><Footprint flip={index % 2 === 1} /><span className="mt-1 text-[10px] text-foreground/75">{shortDate(row.date)}</span></button>)}</div> : <p className="mt-4 text-xs text-muted-foreground">Er zijn geen dagen in deze situatie. Kies hierboven een andere situatie.</p>}
        {visible.length > 30 && <p className="mt-2 text-[11px] text-muted-foreground">De 30 meest recente dagen worden getoond.</p>}
      </section>

      {selected && <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,.9fr)]">
        <section className="rounded-[22px] border border-white/[.08] bg-card/60 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">3 · Bekijk een voetstap</p><h2 className="mt-1 font-heading text-xl font-semibold">{dateLabel(selected.date)}</h2><p className="mt-1 text-xs text-muted-foreground">Vorige handelsdag: {resultLabel(selected.previousResult)}{selected.previousStreak >= 2 ? ` · ${selected.previousStreak} op rij` : ""}</p></div><Link href={`/journal/${selected.tradeId}`} aria-label="Open deze trade in Journal" className="rounded-lg border border-white/10 p-2 text-muted-foreground hover:text-primary"><ArrowUpRight className="size-4" /></Link></div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">{factors.map((factor) => <div key={factor.key} className="rounded-xl border border-white/[.07] bg-background/35 p-3"><p className="text-xs font-semibold">{factor.label}</p><p className="mt-1 min-h-7 text-[11px] leading-snug text-muted-foreground">{factor.key === "habits" && selected.habitExpected ? `${selected.habitDone} van ${selected.habitExpected} gewoontes gedaan` : factor.detail}</p><div className="mt-2"><Status value={selected[factor.key]} /></div></div>)}</div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-primary/15 bg-primary/[.04] px-3 py-3"><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-primary">Tijdens de trade · regels</p><p className="mt-1 text-xs text-muted-foreground">Uitkomst vandaag: {selected.result === "loss" ? "verlies" : selected.result === "win" ? "winst" : "break-even"}</p></div><Status value={selected.rules} rules /></div>
        </section>
          <section className="rounded-[22px] border border-white/[.08] bg-card/60 p-4 sm:p-5"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">Wat hangt ermee samen?</p><h2 className="mt-1 font-heading text-xl font-semibold">Voorbereiding en regeltrouw</h2><p className="mt-2 text-xs leading-relaxed text-muted-foreground">Binnen “{focusLabel.toLowerCase()}” vergelijken we dagen waarop iets gedaan is met dagen waarop het niet gedaan is.</p><div className="mt-4 divide-y divide-white/[.07]">{factors.map((factor) => { const done = adherence(visible.filter((row) => row[factor.key] === "yes")); const missed = adherence(visible.filter((row) => row[factor.key] === "no")); return <div key={factor.key} className="py-3"><p className="text-xs font-semibold">{factor.label}</p>{done.assessed >= 3 && missed.assessed >= 3 ? <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">Gedaan: <strong className="text-primary">{done.kept} van {done.assessed}</strong> dagen regels gevolgd. Niet gedaan: <strong className="text-foreground">{missed.kept} van {missed.assessed}</strong>.</p> : <p className="mt-1 text-[11px] text-muted-foreground">Nog te weinig dagen met én zonder deze voorbereiding om te vergelijken.</p>}</div>; })}</div><p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">Een vergelijking verschijnt vanaf drie beoordeelde dagen in beide groepen. Dit is samenhang in je registraties, geen bewijs van oorzaak.</p></section>
      </div>}
      <p className="px-1 text-[11px] leading-relaxed text-muted-foreground">Een verlies kan nog steeds een trade zijn waarop je alle regels volgde. Zonder geplande gewoontes of zonder trade gisteren blijft die controle onbekend. Gewoontes en oefeningen vóór de markt worden per dag geregistreerd; het exacte moment vóór de trade is niet altijd te controleren.</p>
    </>}
  </div>;
}
