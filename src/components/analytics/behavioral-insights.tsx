"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
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
  preview?: boolean;
};
type Focus = "all" | "loss" | "win" | "loss-streak" | "win-streak";
type Factor = "habits" | "weeklyReview" | "preMarket" | "yesterdayRecap";
const focusOptions: { key: Focus; label: string; explanation: string }[] = [
  { key: "all", label: "Alle dagen", explanation: "Alle geregistreerde handelsdagen" },
  { key: "loss", label: "Na verlies", explanation: "De vorige handelsdag op dit account eindigde met verlies" },
  { key: "win", label: "Na winst", explanation: "De vorige handelsdag op dit account eindigde met winst" },
  { key: "loss-streak", label: "Na 2+ verliezen", explanation: "De twee of meer vorige handelsdagen eindigden met verlies" },
  { key: "win-streak", label: "Na 2+ winsten", explanation: "De twee of meer vorige handelsdagen eindigden met winst" },
];
const factors: { key: Factor; short: string; name: string; question: string }[] = [
  { key: "habits", short: "Gewoontes", name: "Geplande gewoontes", question: "Had je alle geplande gewoontes gedaan?" },
  { key: "weeklyReview", short: "Week", name: "Weekterugblik", question: "Had je de vorige week teruggekeken?" },
  { key: "preMarket", short: "Vooraf", name: "Oefening vóór de markt", question: "Had je de oefening die dag afgerond?" },
  { key: "yesterdayRecap", short: "Gisteren", name: "Terugblik van gisteren", question: "Had je gisteren de markt teruggekeken?" },
];
const dayLabel = (date: string) => format(new Date(`${date}T12:00:00`), "d MMM yyyy", { locale: nl });
const shortDay = (date: string) => format(new Date(`${date}T12:00:00`), "d MMM", { locale: nl });
const resultLabel = (result: ResponseDay["previousResult"]) => result === "loss" ? "verlies" : result === "win" ? "winst" : result === "break-even" ? "gelijkspel" : "geen eerdere trade";
const rowsFor = (rows: ResponseDay[], focus: Focus) => rows.filter((row) =>
  focus === "all" ||
  (focus === "loss" && row.previousResult === "loss") ||
  (focus === "win" && row.previousResult === "win") ||
  (focus === "loss-streak" && row.previousResult === "loss" && row.previousStreak >= 2) ||
  (focus === "win-streak" && row.previousResult === "win" && row.previousStreak >= 2)
);

function Footprint({ flip = false }: { flip?: boolean }) {
  return <svg viewBox="0 0 48 70" fill="currentColor" aria-hidden="true" className={cn("h-8 w-6", flip && "-scale-x-100")}><path d="M18.5 27.5C12 31 10.5 39 12.2 49.5c1.3 9.1 6.2 15.1 13 15.1 7.7 0 11.7-7 10.4-17.2-.8-7.6-3.6-14.1-8.1-18.5-2.7-2.7-5.9-3.3-9.3-1.4Z" /><circle cx="11" cy="22" r="4.1" /><circle cx="17" cy="15" r="4.6" /><circle cx="24.5" cy="11" r="4.4" /><circle cx="32" cy="12" r="3.8" /><circle cx="38" cy="18" r="3" /></svg>;
}

function SignalDot({ value, outcome = false }: { value: Signal; outcome?: boolean }) {
  const label = outcome
    ? value === "yes" ? "Regels gevolgd" : value === "no" ? "Regel gebroken" : "Niet beoordeeld"
    : value === "yes" ? "Gedaan" : value === "no" ? "Niet gedaan" : "Onbekend";
  return <span title={label} aria-label={label} className={cn("inline-flex size-7 items-center justify-center rounded-lg border", value === "yes" ? "border-primary/30 bg-primary/10 text-primary" : value === "no" ? "border-destructive/30 bg-destructive/10 text-destructive" : "border-white/10 bg-white/[.04] text-muted-foreground")}>{value === "yes" ? <Check className="size-3.5" /> : value === "no" ? <X className="size-3.5" /> : <Minus className="size-3.5" />}</span>;
}

function RatioBar({ kept, assessed, muted = false }: { kept: number; assessed: number; muted?: boolean }) {
  const filled = assessed ? Math.round(kept / assessed * 10) : 0;
  return <div aria-hidden="true" className="flex gap-1">{Array.from({ length: 10 }, (_, index) => <span key={index} className={cn("h-2 flex-1 rounded-sm", index < filled ? muted ? "bg-foreground/45" : "bg-primary" : "bg-white/[.08]")} />)}</div>;
}

function FocusButton({ option, active, rows, onClick }: { option: typeof focusOptions[number]; active: boolean; rows: ResponseDay[]; onClick: () => void }) {
  const summary = adherence(rows);
  return <button type="button" onClick={onClick} aria-pressed={active} title={option.explanation} className={cn(styles.card, "min-w-[132px] rounded-xl border px-3 py-2.5 text-left", active ? "border-primary/45 bg-primary/[.1]" : "border-white/[.08] bg-background/40 hover:border-primary/25")}><span className={cn("block text-xs font-semibold", active ? "text-primary" : "text-foreground")}>{option.label}</span><span className="mt-1 block text-[11px] text-muted-foreground">{summary.assessed ? `${summary.kept} van ${summary.assessed} regels gevolgd` : "Nog geen regelchecks"}</span></button>;
}

function DayMap({ rows, selectedId, onSelect }: { rows: ResponseDay[]; selectedId: string; onSelect: (id: string) => void }) {
  const recent = rows.slice(0, 14);
  const selectedOlder = rows.find((row) => row.id === selectedId && !recent.some((item) => item.id === row.id));
  const shown = selectedOlder ? [selectedOlder, ...recent] : recent;
  return <section className="min-w-0 rounded-[22px] border border-white/[.08] bg-card/60 p-4 sm:p-5">
    <div className="flex flex-wrap items-end justify-between gap-2"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">De kaart van je handelsdagen</p><h2 className="mt-1 font-heading text-xl font-semibold">Wat ging vooraf aan elke trade?</h2></div><span className="text-[11px] text-muted-foreground">Nieuwste dagen bovenaan · kies een rij</span></div>
    <p className="mt-2 text-xs text-muted-foreground">Lees van links naar rechts: vorige resultaat → vier voorbereidingen → heb je je regels gevolgd?</p>
    <div className={cn(styles.trail, "mt-4 overflow-x-auto")}>
      <div className="min-w-[640px]">
        <div className="grid grid-cols-[minmax(150px,1.5fr)_repeat(5,minmax(65px,1fr))] gap-2 border-b border-white/[.08] pb-2 text-center text-[10px] text-muted-foreground">
          <span className="text-left">Handelsdag / daarvoor</span>
          {factors.map((factor) => <span key={factor.key} title={factor.question}>{factor.short}</span>)}
          <span className="font-semibold text-primary">Regels</span>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {shown.map((row, index) => <button key={row.id} type="button" onClick={() => onSelect(row.id)} aria-pressed={selectedId === row.id} className={cn(styles.dayRow, "mt-1 grid w-full grid-cols-[minmax(150px,1.5fr)_repeat(5,minmax(65px,1fr))] items-center gap-2 rounded-xl border px-2 py-1.5 text-left", selectedId === row.id ? "border-primary/40 bg-primary/[.06]" : "border-transparent hover:border-white/[.08] hover:bg-background/40")}>
            <span className="flex min-w-0 items-center gap-2"><span className={cn("shrink-0", row.rules === "yes" ? "text-primary" : row.rules === "no" ? "text-destructive" : "text-muted-foreground")}><Footprint flip={index % 2 === 1} /></span><span className="min-w-0"><span className="block text-xs font-semibold">{shortDay(row.date)}</span><span className="block truncate text-[10px] text-muted-foreground">na {resultLabel(row.previousResult)}{row.previousStreak >= 2 ? ` · ${row.previousStreak} op rij` : ""}</span></span></span>
            {factors.map((factor) => <span key={factor.key} className="flex justify-center"><SignalDot value={row[factor.key]} /></span>)}
            <span className="flex justify-center"><SignalDot value={row.rules} outcome /></span>
          </button>)}
        </div>
      </div>
    </div>
    <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground"><span className="text-primary">✓</span> gedaan of regels gevolgd · <span className="text-destructive">×</span> niet gedaan of regel gebroken · — onbekend. {rows.length > 14 ? "De 14 nieuwste dagen staan in de kaart." : ""}</p>
  </section>;
}

function DayExplanation({ row }: { row: ResponseDay }) {
  const done = factors.filter((factor) => row[factor.key] === "yes").map((factor) => factor.name.toLowerCase());
  const missed = factors.filter((factor) => row[factor.key] === "no").map((factor) => factor.name.toLowerCase());
  const ruleText = row.rules === "yes" ? "Je volgde alle opgeslagen regels." : row.rules === "no" ? "Je brak minstens één opgeslagen regel." : "Je regelgedrag is niet beoordeeld.";
  return <section className="rounded-[22px] border border-primary/20 bg-[radial-gradient(circle_at_top_right,rgba(20,184,166,.1),transparent_55%)] p-4 sm:p-5">
    <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">Eén dag uitgelegd</p><h2 className="mt-1 font-heading text-xl font-semibold">{dayLabel(row.date)}</h2><p className="mt-1 text-xs text-muted-foreground">Vorige handelsdag: {resultLabel(row.previousResult)}{row.previousStreak >= 2 ? ` · ${row.previousStreak} op rij` : ""}</p></div><Link href={`/journal/${row.tradeId}`} aria-label="Open deze trade in je dagboek" className="rounded-lg border border-white/10 p-2 text-muted-foreground hover:text-primary"><ArrowUpRight className="size-4" /></Link></div>
    <div className="mt-4 rounded-xl border border-white/[.08] bg-background/35 p-3 text-xs leading-relaxed">
      <p><span className="font-semibold text-primary">Vooraf gedaan:</span> {done.length ? done.join(", ") : "geen van deze vier onderdelen vastgelegd"}.</p>
      <p className="mt-2"><span className="font-semibold text-destructive">Niet gedaan:</span> {missed.length ? missed.join(", ") : "geen vastgelegde gemiste onderdelen"}.</p>
      <p className="mt-3 border-t border-white/[.08] pt-3 font-semibold">{ruleText}</p>
    </div>
    <p className="mt-3 text-[11px] text-muted-foreground">De trade eindigde met {resultLabel(row.result)}. Winst of verlies bepaalt hier niet of je je regels volgde.</p>
  </section>;
}

function FactorComparison({ factor, rows }: { factor: typeof factors[number]; rows: ResponseDay[] }) {
  const done = adherence(rows.filter((row) => row[factor.key] === "yes"));
  const missed = adherence(rows.filter((row) => row[factor.key] === "no"));
  const enough = done.assessed >= 3 && missed.assessed >= 3;
  const doneRate = done.rate ?? 0;
  const missedRate = missed.rate ?? 0;
  const direction = doneRate === missedRate ? "even vaak" : doneRate > missedRate ? "vaker" : "minder vaak";
  return <article className="rounded-xl border border-white/[.08] bg-background/35 p-3.5">
    <h3 className="text-xs font-semibold">{factor.name}</h3>
    <p className="mt-0.5 text-[11px] text-muted-foreground">{factor.question}</p>
    <div className="mt-4 space-y-3">
      <div><div className="mb-1.5 flex items-baseline justify-between gap-2 text-[11px]"><span className="text-muted-foreground">Wel gedaan</span><strong className="tabular-nums text-primary">{done.kept} van {done.assessed} dagen</strong></div><RatioBar kept={done.kept} assessed={done.assessed} /></div>
      <div><div className="mb-1.5 flex items-baseline justify-between gap-2 text-[11px]"><span className="text-muted-foreground">Niet gedaan</span><strong className="tabular-nums text-foreground/80">{missed.kept} van {missed.assessed} dagen</strong></div><RatioBar kept={missed.kept} assessed={missed.assessed} muted /></div>
    </div>
    <p className="mt-3 border-t border-white/[.07] pt-2.5 text-[11px] leading-relaxed text-foreground/75">{enough ? `Bij “wel gedaan” volgde je je regels ${direction}. ${done.assessed < 10 || missed.assessed < 10 ? "Dit zijn nog weinig dagen." : "Controleer ook de afzonderlijke dagen."}` : "Er zijn nog te weinig beoordeelde dagen in beide groepen om een verschil te lezen."}</p>
  </article>;
}

export function BehavioralInsights({ trades, ruleChecks, accounts, exercises, habits, habitCompletions, weeklyReviews, recaps, preview = false }: Props) {
  const [period, setPeriod] = useState("90d");
  const [accountId, setAccountId] = useState("all");
  const [focus, setFocus] = useState<Focus>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const today = format(new Date(), "yyyy-MM-dd");
  const accountTrades = useMemo(() => trades.filter((trade) => accountId === "all" || (accountId === "unlinked" ? !trade.funded_account_id : trade.funded_account_id === accountId)), [trades, accountId]);
  const periodTrades = useMemo(() => inPeriod(accountTrades, period, today), [accountTrades, period, today]);
  const allRows = useMemo(() => buildResponseDays({ trades: accountTrades, ruleChecks, habits, habitCompletions, weeklyReviews, exercises, recaps }), [accountTrades, ruleChecks, habits, habitCompletions, weeklyReviews, exercises, recaps]);
  const dates = useMemo(() => new Set(periodTrades.map((trade) => trade.date_time.slice(0, 10))), [periodTrades]);
  const rows = useMemo(() => allRows.filter((row) => dates.has(row.date)), [allRows, dates]);
  const visible = rowsFor(rows, focus);
  const selected = visible.find((row) => row.id === selectedId) ?? visible[0];
  const summary = adherence(visible);
  const focusLabel = focusOptions.find((item) => item.key === focus)?.label ?? "Alle dagen";
  const missing = visible.length - summary.assessed;
  const notable = factors.map((factor) => {
    const done = adherence(visible.filter((row) => row[factor.key] === "yes"));
    const missed = adherence(visible.filter((row) => row[factor.key] === "no"));
    return { factor, done, missed, gap: Math.abs((done.rate ?? 0) - (missed.rate ?? 0)) };
  }).filter((item) => item.done.assessed >= 3 && item.missed.assessed >= 3 && item.gap > 0)
    .sort((a, b) => b.gap - a.gap)[0];

  return <div className="mx-auto max-w-[1240px] space-y-4 pb-8">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div><Link href="/analytics" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3.5" /> Analyses</Link><p className="mt-3 text-[10px] font-bold uppercase tracking-[.2em] text-primary">Gedragsinzichten</p><h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Hoe reageer je na winst of verlies?</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Bekijk per handelsdag wat je vooraf deed en of je daarna je regels volgde.</p></div>
      <div className="flex gap-2"><select aria-label="Periode" value={period} onChange={(event) => { setPeriod(event.target.value); setSelectedId(null); }} className="h-9 rounded-lg border border-white/10 bg-card px-3 text-xs"><option value="30d">30 dagen</option><option value="90d">90 dagen</option><option value="all">Alles</option></select><select aria-label="Account" value={accountId} onChange={(event) => { setAccountId(event.target.value); setSelectedId(null); }} className="h-9 max-w-40 rounded-lg border border-white/10 bg-card px-3 text-xs"><option value="all">Alle accounts</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.account_name}</option>)}<option value="unlinked">Zonder account</option></select></div>
    </header>
    {preview && <div className="rounded-xl border border-primary/25 bg-primary/[.07] px-4 py-2.5 text-xs text-primary"><strong>Voorbeeldgegevens.</strong> Deze trades en gewoontes zijn verzonnen om de pagina te laten zien. Je echte cijfers staan op de ingelogde pagina Gedragsinzichten.</div>}
    {rows.length === 0 ? <section className="rounded-2xl border border-white/10 bg-card/60 p-8 text-sm text-muted-foreground">Er zijn geen trades in deze periode. Kies een ruimere periode of voeg trades toe in je dagboek.</section> : <>
      <section className="rounded-[22px] border border-white/[.08] bg-card/60 p-4 sm:p-5"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">1 · Kies wat er op je vorige handelsdag gebeurde</p><div className="mt-3 flex gap-2 overflow-x-auto pb-1">{focusOptions.map((option) => <FocusButton key={option.key} option={option} active={focus === option.key} rows={rowsFor(rows, option.key)} onClick={() => { setFocus(option.key); setSelectedId(null); }} />)}</div><p className="mt-2 text-[11px] text-muted-foreground">“Na verlies” kijkt naar je <strong className="font-medium text-foreground">volgende handelsdag</strong> op hetzelfde account. Een verliesreeks bestaat uit minstens twee handelsdagen met verlies.</p></section>

      <section className="rounded-[22px] border border-primary/20 bg-[radial-gradient(circle_at_top_right,rgba(20,184,166,.11),transparent_55%)] p-4 sm:p-5">
        <p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">2 · Dit gebeurde er in “{focusLabel.toLowerCase()}”</p>
        {summary.assessed ? <div className="mt-2 flex flex-wrap items-end gap-x-4 gap-y-2"><div><strong className="font-heading text-3xl font-semibold tracking-tight text-primary sm:text-4xl">{summary.kept} van {summary.assessed}</strong><span className="ml-2 text-sm text-foreground/80">dagen volgde je je regels</span></div><span className="text-xs text-muted-foreground">{summary.assessed - summary.kept} met een regelbreuk · {missing} zonder bruikbare regelchecks</span></div> : <p className="mt-3 text-sm text-muted-foreground">In deze selectie zijn nog geen dagen met opgeslagen regelchecks.</p>}
        <div className="mt-3"><RatioBar kept={summary.kept} assessed={summary.assessed} /></div>
        <p className="mt-2 text-[11px] text-muted-foreground">Elk blokje in de balk staat voor ongeveer een tiende van de beoordeelde dagen. Alleen opgeslagen regelchecks tellen mee; winst of verlies van de trade zelf niet.</p>
        <p className="mt-3 border-t border-white/[.08] pt-3 text-xs leading-relaxed text-foreground/80">{notable ? <>Wat opvalt: bij <strong className="text-foreground">{notable.factor.name.toLowerCase()}</strong> volgde je je regels op <strong className="text-primary">{notable.done.kept} van {notable.done.assessed}</strong> dagen wanneer dit gedaan was, tegenover <strong className="text-foreground">{notable.missed.kept} van {notable.missed.assessed}</strong> dagen wanneer dit niet gedaan was. Bekijk de afzonderlijke dagen hieronder.</> : "Voor een vergelijking van voorbereiding zijn er nog te weinig beoordeelde dagen waarop iets wel én niet gedaan is."}</p>
      </section>

      {visible.length ? <>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,.65fr)]">
          <DayMap rows={visible} selectedId={selected.id} onSelect={setSelectedId} />
          <DayExplanation row={selected} />
        </div>
        <section className="rounded-[22px] border border-white/[.08] bg-card/60 p-4 sm:p-5"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">3 · Welke voorbereiding lijkt samen te gaan met regeltrouw?</p><h2 className="mt-1 font-heading text-xl font-semibold">Lees de verhoudingen, niet alleen het percentage</h2><p className="mt-2 max-w-3xl text-xs leading-relaxed text-muted-foreground">Bijvoorbeeld: “3 van 5” betekent dat je op drie van vijf dagen met die voorbereiding je regels volgde. Vergelijk de groene balk met de grijze balk. Deze vier vergelijkingen gebruiken alleen dagen uit “{focusLabel.toLowerCase()}”.</p><div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{factors.map((factor) => <FactorComparison key={factor.key} factor={factor} rows={visible} />)}</div></section>
      </> : <section className="rounded-2xl border border-white/[.08] bg-card/60 p-6 text-sm text-muted-foreground">Er zijn nog geen handelsdagen in deze situatie. Kies hierboven een andere groep.</section>}
      <p className="px-1 text-[11px] leading-relaxed text-muted-foreground">Dit laat samenhang zien, geen oorzaak. Een verliestrade kan volledig volgens je regels zijn. Gewoontes en de oefening vóór de markt zijn per dag opgeslagen; de app kan niet altijd controleren of je ze vóór je trade deed. Een ontbrekende registratie telt als onbekend.</p>
    </>}
  </div>;
}
