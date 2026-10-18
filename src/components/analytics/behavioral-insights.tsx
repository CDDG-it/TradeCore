"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { inPeriod } from "@/lib/journal/analytics-filter";
import { adherence, buildResponseDays, type ResponseDay, type Signal } from "@/lib/journal/behavioral-context";
import type { BestTradeOfDay, Habit, HabitCompletion, PreMarketExercise, TradeJournalEntry, TradeRuleCheck, WeeklyTradeReview } from "@/lib/types";
import { cn } from "@/lib/utils";
import styles from "./behavioral-insights.module.css";

type Props = {
  trades: TradeJournalEntry[];
  ruleChecks: TradeRuleCheck[];
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
  { key: "weeklyReview", label: "Weekterugblik", short: "Week" },
  { key: "preMarket", label: "Oefening vóór de markt", short: "Vooraf" },
  { key: "yesterdayRecap", label: "Terugblik van gisteren", short: "Gisteren" },
];
const focusItems: { key: Focus; label: string }[] = [
  { key: "all", label: "Alle dagen" },
  { key: "loss", label: "Na verlies" },
  { key: "win", label: "Na winst" },
  { key: "loss-streak", label: "Na 2+ verliezen" },
  { key: "win-streak", label: "Na 2+ winsten" },
];
const dateLabel = (date: string) => format(new Date(`${date}T12:00:00`), "d MMM yyyy", { locale: nl });
const shortDate = (date: string) => format(new Date(`${date}T12:00:00`), "d MMM", { locale: nl });
const colorOf = (value: Signal) => value === "yes" ? "#14B8A6" : value === "no" ? "#ef4444" : "#66758b";
const statusLabel = (value: Signal, rule = false) => rule
  ? value === "yes" ? "Regels gevolgd" : value === "no" ? "Regel gebroken" : "Niet beoordeeld"
  : value === "yes" ? "Gedaan" : value === "no" ? "Niet gedaan" : "Onbekend";
const groupRows = (rows: ResponseDay[], focus: Focus) => rows.filter((row) =>
  focus === "all" || (focus === "loss" && row.previousResult === "loss") ||
  (focus === "win" && row.previousResult === "win") ||
  (focus === "loss-streak" && row.previousResult === "loss" && row.previousStreak >= 2) ||
  (focus === "win-streak" && row.previousResult === "win" && row.previousStreak >= 2)
);

/** Four toes are the four preparations; the sole is the saved rule verdict. */
function FootprintGlyph({ sole, toes, className = "", filledColor }: { sole: Signal; toes?: Signal[]; className?: string; filledColor?: string }) {
  const colors = toes ?? [sole, sole, sole, sole];
  const pigment = (value: Signal) => value === "yes" && filledColor ? filledColor : colorOf(value);
  return <svg viewBox="0 0 100 140" className={className} aria-hidden="true" fill="none">
    <path d="M42 48C27 49 18 66 21 90c3 25 15 43 35 43 21 0 33-18 33-44 0-20-8-35-20-42-8-5-18-5-27 1Z" fill={pigment(sole)} fillOpacity=".92" stroke={pigment(sole)} strokeWidth="2" />
    <circle cx="16" cy="29" r="7" fill={pigment(colors[0])} />
    <circle cx="34" cy="16" r="9" fill={pigment(colors[1])} />
    <circle cx="56" cy="13" r="10" fill={pigment(colors[2])} />
    <circle cx="78" cy="23" r="8.5" fill={pigment(colors[3])} />
  </svg>;
}

function FootprintGroup({ title, rows, active, onClick }: { title: string; rows: ResponseDay[]; active: boolean; onClick: () => void }) {
  const summary = adherence(rows);
  return <button type="button" onClick={onClick} aria-pressed={active} className={cn(styles.figure, "min-w-0 rounded-[22px] border p-4 text-left", active ? "border-primary/45 bg-primary/[.07]" : "border-white/[.08] bg-background/35 hover:border-primary/30")}>
    <span className="flex items-baseline justify-between gap-3"><span className="font-heading text-lg font-semibold">{title}</span><span className="text-[11px] tabular-nums text-muted-foreground">{summary.assessed ? `${summary.kept} van ${summary.assessed} groen` : "Geen regelchecks"}</span></span>
    <span className="mt-3 grid min-h-[104px] grid-cols-8 gap-x-1 gap-y-1" aria-hidden="true">{rows.slice(0, 24).map((row) => <FootprintGlyph key={row.id} sole={row.rules} toes={factors.map((factor) => row[factor.key])} className="h-[27px] w-[20px]" />)}</span>
    <span className="mt-3 block text-[11px] text-muted-foreground">{rows.length > 24 ? "De 24 nieuwste voetafdrukken" : rows.length ? "Elke voetafdruk is één handelsdag" : "Nog geen handelsdagen"}</span>
  </button>;
}

function StreakLine({ title, rows, active, onClick }: { title: string; rows: ResponseDay[]; active: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} aria-pressed={active} className={cn(styles.filter, "flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left", active ? "border-primary/40 bg-primary/[.08]" : "border-white/[.07] bg-background/35 hover:border-primary/25")}><span className="min-w-[100px] text-[11px] font-semibold">{title}</span><span className="flex flex-1 justify-end gap-1.5" aria-hidden="true">{rows.slice(0, 12).map((row) => <FootprintGlyph key={row.id} sole={row.rules} toes={factors.map((factor) => row[factor.key])} className="h-[25px] w-[18px]" />)}</span><span className="min-w-[52px] text-right text-[10px] text-muted-foreground">{rows.length ? `${rows.length} dagen` : "geen dagen"}</span></button>;
}

function SelectedFootprint({ row }: { row: ResponseDay }) {
  const previous = row.previousResult === "loss" ? "verlies" : row.previousResult === "win" ? "winst" : row.previousResult === "break-even" ? "break-even" : "geen eerdere trade";
  return <figure className="rounded-[22px] border border-white/[.08] bg-card/60 p-4 sm:p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">Eén voetafdruk uitgelicht</p><h2 className="mt-1 font-heading text-xl font-semibold">{dateLabel(row.date)}</h2><p className="mt-1 text-xs text-muted-foreground">Na {previous}{row.previousStreak >= 2 ? ` · ${row.previousStreak} op rij` : ""}</p></div><Link href={`/journal/${row.tradeId}`} aria-label="Bekijk deze trade in je dagboek" className="rounded-lg border border-white/10 p-2 text-muted-foreground hover:text-primary"><ArrowUpRight className="size-4" /></Link></div>
    <div className="mt-4 grid grid-cols-[minmax(140px,.8fr)_minmax(170px,1fr)] items-center gap-3 rounded-2xl border border-white/[.07] bg-background/35 p-3 sm:gap-5">
      <div className="relative flex justify-center"><div className="absolute inset-0 rounded-full bg-primary/[.06] blur-2xl" /><FootprintGlyph sole={row.rules} toes={factors.map((factor) => row[factor.key])} className={cn(styles.largeFootprint, "relative h-[220px] w-[160px] sm:h-[255px] sm:w-[184px]")} /></div>
      <div><p className="mb-3 text-[10px] font-bold uppercase tracking-[.16em] text-muted-foreground">Tenen · voorbereiding</p><div className="space-y-2.5">{factors.map((factor) => <div key={factor.key} className="flex items-center justify-between gap-2 text-[11px]"><span className="flex min-w-0 items-center gap-2"><span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: colorOf(row[factor.key]) }} /><span className="leading-tight text-foreground/85">{factor.short}</span></span><span className="shrink-0 text-muted-foreground">{statusLabel(row[factor.key])}</span></div>)}</div><div className="mt-4 border-t border-white/[.08] pt-3"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-muted-foreground">Zool · regels</p><p className={cn("mt-1 text-xs font-semibold", row.rules === "yes" ? "text-primary" : row.rules === "no" ? "text-destructive" : "text-muted-foreground")}>{statusLabel(row.rules, true)}</p></div></div>
    </div><figcaption className="mt-3 text-[11px] leading-relaxed text-muted-foreground">De kleur van de zool gaat over je regels, niet over winst of verlies. Deze trade eindigde met {row.result === "loss" ? "verlies" : row.result === "win" ? "winst" : "break-even"}.</figcaption>
  </figure>;
}

function FootTrail({ rows, selectedId, onSelect }: { rows: ResponseDay[]; selectedId: string; onSelect: (id: string) => void }) {
  const recent = rows.slice(0, 24);
  const older = rows.find((row) => row.id === selectedId && !recent.some((item) => item.id === row.id));
  const shown = older ? [older, ...recent] : recent;
  return <section className="min-w-0 rounded-[22px] border border-white/[.08] bg-card/60 p-4 sm:p-5"><div className="flex flex-wrap items-end justify-between gap-2"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">Voetspoor door je handelsdagen</p><h2 className="mt-1 font-heading text-xl font-semibold">Kies een afdruk om de dag te bekijken</h2></div><span className="text-[11px] text-muted-foreground">Nieuwste eerst · {rows.length} dagen</span></div><div className={cn(styles.trail, "mt-4 flex gap-2 overflow-x-auto pb-3")} aria-label="Voetafdrukken per handelsdag">{shown.map((row) => <button key={row.id} type="button" onClick={() => onSelect(row.id)} aria-pressed={selectedId === row.id} aria-label={`${dateLabel(row.date)}: ${statusLabel(row.rules, true)}`} className={cn(styles.footprint, "flex min-w-[62px] shrink-0 flex-col items-center rounded-xl border px-2 py-2", selectedId === row.id ? "border-primary/60 bg-primary/[.09]" : "border-white/[.07] bg-background/40")}><FootprintGlyph sole={row.rules} toes={factors.map((factor) => row[factor.key])} className="h-[43px] w-[34px]" /><span className="mt-1 text-[10px] text-foreground/70">{shortDate(row.date)}</span></button>)}</div><p className="border-t border-white/[.07] pt-3 text-[11px] text-muted-foreground">Vier tenen = voorbereiding · zool = regels. <span className="text-primary">Groen</span> gedaan, <span className="text-destructive">rood</span> niet gedaan of gebroken, grijs onbekend.</p></section>;
}

function ComparisonFootprints({ kept, assessed, faded = false }: { kept: number; assessed: number; faded?: boolean }) {
  const filled = assessed ? Math.round(10 * kept / assessed) : 0;
  return <span className="flex gap-0.5" aria-hidden="true">{Array.from({ length: 10 }, (_, index) => <FootprintGlyph key={index} sole={index < filled ? "yes" : "unknown"} filledColor={faded ? "#06B6D4" : undefined} className="h-[24px] min-w-0 flex-1" />)}</span>;
}

function ComparisonCard({ factor, rows }: { factor: typeof factors[number]; rows: ResponseDay[] }) {
  const done = adherence(rows.filter((row) => row[factor.key] === "yes"));
  const missed = adherence(rows.filter((row) => row[factor.key] === "no"));
  const enough = done.assessed >= 3 && missed.assessed >= 3;
  const difference = (done.rate ?? 0) - (missed.rate ?? 0);
  return <article className="rounded-2xl border border-white/[.08] bg-background/35 p-4"><h3 className="text-sm font-semibold">{factor.label}</h3><div className="mt-4 space-y-4"><div><div className="mb-1 flex justify-between gap-2 text-[11px]"><span className="text-muted-foreground">Wel gedaan</span><span className="tabular-nums text-primary">{done.assessed ? `${done.kept} / ${done.assessed}` : "—"}</span></div><ComparisonFootprints kept={done.kept} assessed={done.assessed} /></div><div><div className="mb-1 flex justify-between gap-2 text-[11px]"><span className="text-muted-foreground">Niet gedaan</span><span className="tabular-nums text-cyan-400">{missed.assessed ? `${missed.kept} / ${missed.assessed}` : "—"}</span></div><ComparisonFootprints kept={missed.kept} assessed={missed.assessed} faded /></div></div><p className="mt-4 border-t border-white/[.07] pt-3 text-[11px] leading-relaxed text-muted-foreground">{enough ? difference === 0 ? "Beide rijen zijn even vol." : difference > 0 ? "Bovenste rij is voller: vaker regels gevolgd als dit gedaan was." : "Onderste rij is voller: vaker regels gevolgd als dit niet gedaan was." : "Nog te weinig dagen in beide groepen om te vergelijken."}</p></article>;
}

export function BehavioralInsights({ trades, ruleChecks, exercises, habits, habitCompletions, weeklyReviews, recaps, preview = false }: Props) {
  const [period, setPeriod] = useState("90d");
  const [focus, setFocus] = useState<Focus>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const today = format(new Date(), "yyyy-MM-dd");
  const filtered = useMemo(() => inPeriod(trades, period, today), [trades, period, today]);
  const allRows = useMemo(() => buildResponseDays({ trades, ruleChecks, habits, habitCompletions, weeklyReviews, exercises, recaps }), [trades, ruleChecks, habits, habitCompletions, weeklyReviews, exercises, recaps]);
  const dates = useMemo(() => new Set(filtered.map((trade) => trade.date_time.slice(0, 10))), [filtered]);
  const rows = useMemo(() => allRows.filter((row) => dates.has(row.date)), [allRows, dates]);
  const visible = groupRows(rows, focus);
  const selected = visible.find((row) => row.id === selectedId) ?? visible[0];
  const afterLoss = groupRows(rows, "loss");
  const afterWin = groupRows(rows, "win");
  const lossStreak = groupRows(rows, "loss-streak");
  const winStreak = groupRows(rows, "win-streak");
  const focusLabel = focusItems.find((item) => item.key === focus)?.label ?? "Alle dagen";

  return <div className="mx-auto max-w-[1380px] space-y-4 pb-8"><header className="flex flex-wrap items-end justify-between gap-4"><div><Link href="/analytics" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3.5" /> Analyses</Link><p className="mt-3 text-[10px] font-bold uppercase tracking-[.2em] text-primary">Gedragsinzichten</p><h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Jouw handelsdagen laten sporen achter<span className="text-primary">.</span></h1><p className="mt-2 text-sm text-muted-foreground">Elke voetafdruk laat je voorbereiding en regelgedrag op één dag zien.</p></div><select aria-label="Periode" value={period} onChange={(event) => { setPeriod(event.target.value); setSelectedId(null); }} className="h-9 rounded-lg border border-white/10 bg-card px-3 text-xs"><option value="30d">30 dagen</option><option value="90d">90 dagen</option><option value="all">Alles</option></select></header>
    {preview && <div className="rounded-xl border border-primary/25 bg-primary/[.07] px-4 py-2.5 text-xs text-primary"><strong>Voorbeeldgegevens.</strong> De voetafdrukken hieronder gebruiken verzonnen trades. Je echte patroon staat op de ingelogde pagina Gedragsinzichten.</div>}
    {rows.length === 0 ? <section className="rounded-2xl border border-white/10 bg-card/60 p-8 text-sm text-muted-foreground">Er zijn geen trades in deze periode. Kies een ruimere periode of voeg trades toe in je dagboek.</section> : <>
      <div className="grid gap-3 lg:items-start lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,.95fr)]">
        <section className="rounded-[22px] border border-white/[.08] bg-card/60 p-4 sm:p-5"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">Reactie op het vorige resultaat</p><h2 className="mt-1 font-heading text-xl font-semibold">Na verlies en na winst</h2><p className="mt-2 text-xs text-muted-foreground">Iedere kleine voetafdruk is een echte handelsdag uit de selectie. De zool toont of je de opgeslagen regels volgde.</p><div className="mt-4 grid gap-2 sm:grid-cols-2"><FootprintGroup title="Na verlies" rows={afterLoss} active={focus === "loss" || focus === "loss-streak"} onClick={() => { setFocus(focus === "loss" ? "all" : "loss"); setSelectedId(null); }} /><FootprintGroup title="Na winst" rows={afterWin} active={focus === "win" || focus === "win-streak"} onClick={() => { setFocus(focus === "win" ? "all" : "win"); setSelectedId(null); }} /></div><div className="mt-4 flex flex-wrap gap-1.5">{focusItems.map((item) => <button key={item.key} type="button" onClick={() => { setFocus(item.key); setSelectedId(null); }} aria-pressed={focus === item.key} className={cn(styles.filter, "rounded-full border px-2.5 py-1.5 text-[11px] font-semibold", focus === item.key ? "border-primary/40 bg-primary/10 text-primary" : "border-white/[.08] text-muted-foreground hover:text-foreground")}>{item.label}</button>)}</div><div className="mt-4 border-t border-white/[.07] pt-4"><p className="mb-2 text-[10px] font-bold uppercase tracking-[.16em] text-primary">Na een reeks</p><div className="space-y-2"><StreakLine title="2+ verliezen" rows={lossStreak} active={focus === "loss-streak"} onClick={() => { setFocus("loss-streak"); setSelectedId(null); }} /><StreakLine title="2+ winsten" rows={winStreak} active={focus === "win-streak"} onClick={() => { setFocus("win-streak"); setSelectedId(null); }} /></div></div><p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">“Na verlies” betekent: de volgende handelsdag op hetzelfde account.</p></section>
        {selected && <SelectedFootprint row={selected} />}
      </div>
      {visible.length ? <><FootTrail rows={visible} selectedId={selected.id} onSelect={setSelectedId} /><section className="rounded-[22px] border border-white/[.08] bg-card/60 p-4 sm:p-5"><div className="flex flex-wrap items-end justify-between gap-2"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">Voorbereiding en regeltrouw</p><h2 className="mt-1 font-heading text-xl font-semibold">Wanneer zijn er meer groene voetafdrukken?</h2></div><span className="text-xs text-muted-foreground">Selectie: {focusLabel.toLowerCase()}</span></div><p className="mt-2 text-xs text-muted-foreground">Tien voetafdrukken verbeelden de verhouding. De kleine breuk ernaast is het exacte aantal beoordeelde dagen. Vergelijk de bovenste en onderste rij.</p><div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{factors.map((factor) => <ComparisonCard key={factor.key} factor={factor} rows={visible} />)}</div></section></> : <section className="rounded-2xl border border-white/[.08] bg-card/60 p-6 text-sm text-muted-foreground">Er zijn nog geen dagen in deze selectie. Kies hierboven een andere groep.</section>}
      <p className="px-1 text-[11px] leading-relaxed text-muted-foreground">De figuren tonen patronen in je registraties, geen bewezen oorzaken. Een verliestrade kan volledig volgens je regels zijn. Gewoontes en oefeningen zijn per dag opgeslagen; hun exacte tijd vóór de trade is niet altijd bekend. Grijs betekent ontbrekende gegevens.</p>
    </>}
  </div>;
}
