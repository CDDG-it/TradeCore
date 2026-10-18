"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
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
const factors: { key: Factor; label: string; short: string }[] = [
  { key: "habits", label: "Gewoontes", short: "Gewoontes" },
  { key: "weeklyReview", label: "Vorige week teruggekeken", short: "Weekreview" },
  { key: "preMarket", label: "Oefening vóór de markt", short: "Oefening" },
  { key: "yesterdayRecap", label: "Gisteren teruggekeken", short: "Gisteren" },
];
const focusItems: { key: Focus; label: string }[] = [
  { key: "all", label: "Alle dagen" },
  { key: "loss", label: "Na verlies" },
  { key: "win", label: "Na winst" },
  { key: "loss-streak", label: "Na 2+ verliezen" },
  { key: "win-streak", label: "Na 2+ winsten" },
];
const dayLabel = (date: string) => format(new Date(`${date}T12:00:00`), "d MMM yyyy", { locale: nl });
const shortDay = (date: string) => format(new Date(`${date}T12:00:00`), "d MMM", { locale: nl });
const filterRows = (rows: ResponseDay[], focus: Focus) => rows.filter((row) =>
  focus === "all" || (focus === "loss" && row.previousResult === "loss") ||
  (focus === "win" && row.previousResult === "win") ||
  (focus === "loss-streak" && row.previousResult === "loss" && row.previousStreak >= 2) ||
  (focus === "win-streak" && row.previousResult === "win" && row.previousStreak >= 2)
);
const colorOf = (value: Signal) => value === "yes" ? "#14B8A6" : value === "no" ? "#ef4444" : "#66758b";
const labelOf = (value: Signal, outcome = false) => outcome
  ? value === "yes" ? "Regels gevolgd" : value === "no" ? "Regel gebroken" : "Niet beoordeeld"
  : value === "yes" ? "Gedaan" : value === "no" ? "Niet gedaan" : "Onbekend";

function Footprint({ className = "" }: { className?: string }) {
  return <svg viewBox="0 0 48 70" fill="currentColor" aria-hidden="true" className={className}><path d="M18.5 27.5C12 31 10.5 39 12.2 49.5c1.3 9.1 6.2 15.1 13 15.1 7.7 0 11.7-7 10.4-17.2-.8-7.6-3.6-14.1-8.1-18.5-2.7-2.7-5.9-3.3-9.3-1.4Z" /><circle cx="11" cy="22" r="4.1" /><circle cx="17" cy="15" r="4.6" /><circle cx="24.5" cy="11" r="4.4" /><circle cx="32" cy="12" r="3.8" /><circle cx="38" cy="18" r="3" /></svg>;
}

function RingFigure({ title, rows, active, onClick }: { title: string; rows: ResponseDay[]; active: boolean; onClick: () => void }) {
  const summary = adherence(rows);
  const fraction = summary.rate ?? 0;
  return <button type="button" onClick={onClick} aria-pressed={active} className={cn(styles.figure, "group flex min-w-0 items-center gap-3 rounded-[22px] border p-3 text-left sm:gap-4 sm:p-4", active ? "border-primary/45 bg-primary/[.08]" : "border-white/[.08] bg-card/60 hover:border-primary/30")}>
    <svg viewBox="0 0 132 132" className="size-[86px] shrink-0 sm:size-[106px]" role="img" aria-label={`${title}: ${summary.kept} van ${summary.assessed} beoordeelde dagen regels gevolgd`}>
      <circle cx="66" cy="66" r="48" fill="rgba(20,184,166,.035)" stroke="rgba(148,163,184,.14)" strokeWidth="8" />
      {summary.assessed > 0 && <circle cx="66" cy="66" r="48" fill="none" stroke="#14B8A6" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${fraction * 3.016} 302`} transform="rotate(-90 66 66)" className={styles.ring} />}
      <circle cx="66" cy="66" r="33" fill="none" stroke="rgba(20,184,166,.15)" strokeWidth="1" />
      <path d="M58 58c-4 2-5 7-4 13 1 6 4 10 9 10s7-5 7-11c0-5-2-9-5-12-2-2-5-2-7 0Z" fill="#14B8A6" opacity=".88" />
      <circle cx="54" cy="53" r="2" fill="#14B8A6" /><circle cx="58" cy="49" r="2.2" fill="#14B8A6" /><circle cx="63" cy="47" r="2.1" fill="#14B8A6" /><circle cx="68" cy="48" r="1.9" fill="#14B8A6" /><circle cx="72" cy="52" r="1.7" fill="#14B8A6" />
    </svg>
    <span className="min-w-0"><span className="block text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground">{title}</span><span className="mt-1 block font-heading text-xl font-semibold leading-tight">{summary.assessed ? summary.rate === 0 ? "Geen groene dagen" : summary.rate === 100 ? "Alle dagen groen" : summary.rate! >= 50 ? "Meestal regels gevolgd" : "Vaker regelbreuk" : "Nog geen oordeel"}</span><span className="mt-2 block text-[11px] text-muted-foreground">{summary.assessed ? `${summary.kept} van ${summary.assessed} beoordeelde dagen` : "Geen regelchecks gevonden"}</span></span>
  </button>;
}

function ProcessFigure({ row }: { row: ResponseDay }) {
  const nodes = [
    { key: "habits" as const, x: 80, y: 70, tx: 80, ty: 28, anchor: "middle" as const, label: "Gewoontes" },
    { key: "weeklyReview" as const, x: 340, y: 70, tx: 340, ty: 28, anchor: "middle" as const, label: "Weekreview" },
    { key: "preMarket" as const, x: 80, y: 242, tx: 80, ty: 290, anchor: "middle" as const, label: "Oefening" },
    { key: "yesterdayRecap" as const, x: 340, y: 242, tx: 340, ty: 290, anchor: "middle" as const, label: "Gisteren" },
  ];
  return <figure className="rounded-[22px] border border-white/[.08] bg-[radial-gradient(circle_at_50%_45%,rgba(20,184,166,.1),transparent_60%)] p-4 sm:p-5">
    <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">Jouw dag in één figuur</p><h2 className="mt-1 font-heading text-xl font-semibold">{dayLabel(row.date)}</h2></div><Link href={`/journal/${row.tradeId}`} aria-label="Bekijk deze trade in je dagboek" className="rounded-lg border border-white/10 p-2 text-muted-foreground hover:text-primary"><ArrowUpRight className="size-4" /></Link></div>
    <svg viewBox="0 0 420 320" className="mx-auto mt-2 w-full max-w-[490px]" role="img" aria-label={`Vier voorbereidingen rond de trade. Regels: ${labelOf(row.rules, true)}.`}>
      <defs><radialGradient id="process-glow"><stop stopColor={colorOf(row.rules)} stopOpacity=".22" /><stop offset="1" stopColor={colorOf(row.rules)} stopOpacity="0" /></radialGradient></defs>
      <circle cx="210" cy="155" r="105" fill="url(#process-glow)" />
      {nodes.map((node) => <line key={node.key} x1="210" y1="155" x2={node.x} y2={node.y} stroke={colorOf(row[node.key])} strokeOpacity=".34" strokeWidth="1.5" strokeDasharray={row[node.key] === "unknown" ? "3 5" : undefined} />)}
      <circle cx="210" cy="155" r="58" fill="#0B1120" stroke={colorOf(row.rules)} strokeOpacity=".8" strokeWidth="2" />
      <circle cx="210" cy="155" r="48" fill="none" stroke={colorOf(row.rules)} strokeOpacity=".18" strokeWidth="1" />
      <g transform="translate(181 103) scale(1.2)" fill={colorOf(row.rules)}><path d="M18.5 27.5C12 31 10.5 39 12.2 49.5c1.3 9.1 6.2 15.1 13 15.1 7.7 0 11.7-7 10.4-17.2-.8-7.6-3.6-14.1-8.1-18.5-2.7-2.7-5.9-3.3-9.3-1.4Z" /><circle cx="11" cy="22" r="4.1" /><circle cx="17" cy="15" r="4.6" /><circle cx="24.5" cy="11" r="4.4" /><circle cx="32" cy="12" r="3.8" /><circle cx="38" cy="18" r="3" /></g>
      <text x="210" y="229" textAnchor="middle" fill={colorOf(row.rules)} fontSize="11" fontWeight="700">{row.rules === "yes" ? "REGELS GEVOLGD" : row.rules === "no" ? "REGEL GEBROKEN" : "NIET BEOORDEELD"}</text>
      {nodes.map((node) => <g key={node.key}><circle cx={node.x} cy={node.y} r="26" fill="#0B1120" stroke={colorOf(row[node.key])} strokeOpacity=".75" strokeWidth="2" /><text x={node.x} y={node.y + 6} textAnchor="middle" fill={colorOf(row[node.key])} fontSize="21" fontWeight="600">{row[node.key] === "yes" ? "✓" : row[node.key] === "no" ? "×" : "–"}</text><text x={node.tx} y={node.ty} textAnchor={node.anchor} fill="#aab8c9" fontSize="11" fontWeight="600">{node.label}</text></g>)}
    </svg>
    <figcaption className="border-t border-white/[.07] pt-3 text-xs leading-relaxed text-foreground/75">Na {row.previousResult === "loss" ? "een verlies" : row.previousResult === "win" ? "een winst" : row.previousResult === "break-even" ? "break-even" : "geen eerdere trade"}{row.previousStreak >= 2 ? ` (${row.previousStreak} op rij)` : ""} waren volgens je registraties {factors.filter((factor) => row[factor.key] === "yes").length} voorbereidingen afgerond. {row.rules === "yes" ? "Je volgde de opgeslagen regels." : row.rules === "no" ? "Je brak minstens één opgeslagen regel." : "Je regelgedrag is niet beoordeeld."}</figcaption>
  </figure>;
}

function StreakStrip({ title, rows, onClick }: { title: string; rows: ResponseDay[]; onClick: () => void }) {
  const summary = adherence(rows);
  return <button type="button" onClick={onClick} className={cn(styles.filter, "flex w-full items-center justify-between gap-3 rounded-xl border border-white/[.07] bg-background/35 px-3 py-2 text-left hover:border-primary/30")}><span className="min-w-[90px] text-[11px] font-semibold">{title}</span><span className="flex flex-1 justify-end gap-1.5" aria-hidden="true">{rows.length ? rows.slice(0, 10).map((row) => <span key={row.id} className="size-2.5 rounded-full" style={{ backgroundColor: colorOf(row.rules) }} />) : <span className="text-[11px] text-muted-foreground">Nog geen dagen</span>}</span><span className="min-w-[70px] text-right text-[10px] tabular-nums text-muted-foreground">{summary.assessed ? `${summary.kept}/${summary.assessed} groen` : "geen checks"}</span></button>;
}

function FootTrail({ rows, selectedId, onSelect }: { rows: ResponseDay[]; selectedId: string; onSelect: (id: string) => void }) {
  const recent = rows.slice(0, 24);
  const older = rows.find((row) => row.id === selectedId && !recent.some((item) => item.id === row.id));
  const shown = older ? [older, ...recent] : recent;
  return <section className="min-w-0 rounded-[22px] border border-white/[.08] bg-card/60 p-4 sm:p-5"><div className="flex flex-wrap items-end justify-between gap-2"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">Voetspoor door je handelsdagen</p><h2 className="mt-1 font-heading text-xl font-semibold">Zie het patroon, kies één dag</h2></div><span className="text-[11px] text-muted-foreground">Nieuwste eerst · {rows.length} dagen</span></div><div className={cn(styles.trail, "mt-4 flex gap-2 overflow-x-auto pb-3")} aria-label="Voetsporen per handelsdag">{shown.map((row, index) => <button key={row.id} type="button" onClick={() => onSelect(row.id)} aria-pressed={selectedId === row.id} aria-label={`${dayLabel(row.date)}: ${labelOf(row.rules, true)}; ${factors.filter((factor) => row[factor.key] === "yes").length} voorbereidingen gedaan`} className={cn(styles.footprint, "flex min-w-[62px] shrink-0 flex-col items-center rounded-xl border px-2 py-2", selectedId === row.id ? "border-primary/60 bg-primary/[.09]" : "border-white/[.07] bg-background/40", row.rules === "yes" ? "text-primary" : row.rules === "no" ? "text-destructive" : "text-muted-foreground")}><Footprint className={cn("h-9 w-7", index % 2 && "-scale-x-100")} /><span className="mt-1 text-[10px] text-foreground/70">{shortDay(row.date)}</span><span className="mt-2 flex gap-0.5" aria-hidden="true">{factors.map((factor) => <span key={factor.key} className="size-1 rounded-full" style={{ backgroundColor: colorOf(row[factor.key]) }} />)}</span></button>)}</div><div className="flex flex-wrap gap-x-5 gap-y-1 border-t border-white/[.07] pt-3 text-[11px] text-muted-foreground"><span><span className="text-primary">●</span> regels gevolgd</span><span><span className="text-destructive">●</span> regel gebroken</span><span><span className="text-muted-foreground">●</span> niet beoordeeld</span><span>Vier puntjes = voorbereiding van die dag</span></div></section>;
}

function ComparisonChart({ factor, rows }: { factor: typeof factors[number]; rows: ResponseDay[] }) {
  const done = adherence(rows.filter((row) => row[factor.key] === "yes"));
  const missed = adherence(rows.filter((row) => row[factor.key] === "no"));
  const enough = done.assessed >= 3 && missed.assessed >= 3;
  const difference = (done.rate ?? 0) - (missed.rate ?? 0);
  return <article className="rounded-2xl border border-white/[.08] bg-background/35 p-4"><h3 className="text-sm font-semibold">{factor.label}</h3><div className="mt-5 space-y-4">{[{ label: "Wel gedaan", score: done, color: "bg-primary" }, { label: "Niet gedaan", score: missed, color: "bg-cyan-400/55" }].map((line) => <div key={line.label}><div className="mb-2 flex items-baseline justify-between gap-2"><span className="text-[11px] text-muted-foreground">{line.label}</span><span className="text-[11px] tabular-nums text-foreground/70">{line.score.assessed ? `${line.score.kept} / ${line.score.assessed}` : "geen dagen"}</span></div><div className="h-3 overflow-hidden rounded-full bg-white/[.07]"><div className={cn(styles.bar, "h-full rounded-full", line.color)} style={{ width: `${line.score.rate ?? 0}%` }} /></div></div>)}</div><p className="mt-4 border-t border-white/[.07] pt-3 text-[11px] leading-relaxed text-muted-foreground">{enough ? difference === 0 ? "De balken zijn even lang: in deze dagen zie je geen verschil." : difference > 0 ? "De groene balk is langer: regels vaker gevolgd als dit gedaan was." : "De blauwe balk is langer: regels vaker gevolgd als dit niet gedaan was." : "Te weinig dagen met én zonder deze voorbereiding voor een vergelijking."}</p></article>;
}

export function BehavioralInsights({ trades, ruleChecks, accounts, exercises, habits, habitCompletions, weeklyReviews, recaps, preview = false }: Props) {
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
  const visible = filterRows(rows, focus);
  const selected = visible.find((row) => row.id === selectedId) ?? visible[0];
  const afterLoss = filterRows(rows, "loss");
  const afterWin = filterRows(rows, "win");
  const lossStreak = filterRows(rows, "loss-streak");
  const winStreak = filterRows(rows, "win-streak");
  const focusLabel = focusItems.find((item) => item.key === focus)?.label ?? "Alle dagen";

  return <div className="mx-auto max-w-[1380px] space-y-4 pb-8"><header className="flex flex-wrap items-end justify-between gap-4"><div><Link href="/analytics" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3.5" /> Analyses</Link><p className="mt-3 text-[10px] font-bold uppercase tracking-[.2em] text-primary">Gedragsinzichten</p><h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Je gedrag laat sporen achter<span className="text-primary">.</span></h1><p className="mt-2 text-sm text-muted-foreground">Zie wat er met je regels gebeurt na winst, verlies en je dagelijkse voorbereiding.</p></div><div className="flex gap-2"><select aria-label="Periode" value={period} onChange={(event) => { setPeriod(event.target.value); setSelectedId(null); }} className="h-9 rounded-lg border border-white/10 bg-card px-3 text-xs"><option value="30d">30 dagen</option><option value="90d">90 dagen</option><option value="all">Alles</option></select><select aria-label="Account" value={accountId} onChange={(event) => { setAccountId(event.target.value); setSelectedId(null); }} className="h-9 max-w-40 rounded-lg border border-white/10 bg-card px-3 text-xs"><option value="all">Alle accounts</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.account_name}</option>)}<option value="unlinked">Zonder account</option></select></div></header>
    {preview && <div className="rounded-xl border border-primary/25 bg-primary/[.07] px-4 py-2.5 text-xs text-primary"><strong>Voorbeeldgegevens.</strong> De figuren hieronder gebruiken verzonnen trades. Je echte patroon staat op de ingelogde pagina Gedragsinzichten.</div>}
    {rows.length === 0 ? <section className="rounded-2xl border border-white/10 bg-card/60 p-8 text-sm text-muted-foreground">Er zijn geen trades in deze periode. Kies een ruimere periode of voeg trades toe in je dagboek.</section> : <>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(350px,.9fr)]">
        <section className="rounded-[22px] border border-white/[.08] bg-card/60 p-4 sm:p-5"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">Wat doet een verlies of winst met je regeltrouw?</p><h2 className="mt-1 font-heading text-xl font-semibold">Twee vingerafdrukken, twee reacties</h2><p className="mt-2 text-xs text-muted-foreground">Meer groen in de ring betekent vaker je regels gevolgd op de volgende handelsdag.</p><div className="mt-4 grid gap-2 sm:grid-cols-2"><RingFigure title="Na verlies" rows={afterLoss} active={focus === "loss" || focus === "loss-streak"} onClick={() => { setFocus(focus === "loss" ? "all" : "loss"); setSelectedId(null); }} /><RingFigure title="Na winst" rows={afterWin} active={focus === "win" || focus === "win-streak"} onClick={() => { setFocus(focus === "win" ? "all" : "win"); setSelectedId(null); }} /></div><div className="mt-4 flex flex-wrap gap-1.5">{focusItems.map((item) => <button key={item.key} type="button" onClick={() => { setFocus(item.key); setSelectedId(null); }} aria-pressed={focus === item.key} className={cn(styles.filter, "rounded-full border px-2.5 py-1.5 text-[11px] font-semibold", focus === item.key ? "border-primary/40 bg-primary/10 text-primary" : "border-white/[.08] text-muted-foreground hover:text-foreground")}>{item.label}</button>)}</div><p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">“Na verlies” kijkt naar de volgende handelsdag op hetzelfde account. De ring gebruikt alleen dagen met opgeslagen regelchecks.</p><div className="mt-5 border-t border-white/[.07] pt-4"><p className="mb-2 text-[10px] font-bold uppercase tracking-[.16em] text-primary">Wat gebeurt er na een reeks?</p><div className="space-y-2"><StreakStrip title="2+ verliezen" rows={lossStreak} onClick={() => { setFocus("loss-streak"); setSelectedId(null); }} /><StreakStrip title="2+ winsten" rows={winStreak} onClick={() => { setFocus("win-streak"); setSelectedId(null); }} /></div></div></section>
        {selected && <ProcessFigure row={selected} />}
      </div>
      {visible.length ? <><FootTrail rows={visible} selectedId={selected.id} onSelect={setSelectedId} /><section className="rounded-[22px] border border-white/[.08] bg-card/60 p-4 sm:p-5"><div className="flex flex-wrap items-end justify-between gap-2"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">Voorbereiding en regeltrouw</p><h2 className="mt-1 font-heading text-xl font-semibold">Welke balk verandert als je iets overslaat?</h2></div><span className="text-xs text-muted-foreground">Selectie: {focusLabel.toLowerCase()}</span></div><p className="mt-2 text-xs text-muted-foreground">De lengte van elke balk toont op welk deel van de beoordeelde dagen je je regels volgde. Klik bovenaan op “Na verlies” of “Na winst” om de figuren te vergelijken.</p><div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{factors.map((factor) => <ComparisonChart key={factor.key} factor={factor} rows={visible} />)}</div></section></> : <section className="rounded-2xl border border-white/[.08] bg-card/60 p-6 text-sm text-muted-foreground">Er zijn nog geen dagen in deze selectie. Kies hierboven een andere groep.</section>}
      <p className="px-1 text-[11px] leading-relaxed text-muted-foreground">Dit zijn patronen in je registraties, geen bewezen oorzaken. Een verlies kan volledig volgens je regels zijn. Gewoontes en oefeningen worden per dag opgeslagen; hun exacte tijd vóór de trade is niet altijd bekend. Grijs betekent ontbrekende gegevens.</p>
    </>}
  </div>;
}
