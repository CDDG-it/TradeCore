"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Check, HelpCircle, X } from "lucide-react";
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
const factors: { key: Factor; label: string; axis: string }[] = [
  { key: "habits", label: "Gewoontes", axis: "Gewoontes" },
  { key: "weeklyReview", label: "Weekterugblik", axis: "Weekreview" },
  { key: "preMarket", label: "Oefening vóór de markt", axis: "Oefening" },
  { key: "yesterdayRecap", label: "Terugblik van gisteren", axis: "Recap" },
];
const axes = ["Regels", ...factors.map((factor) => factor.axis)];
const focusItems: { key: Focus; label: string }[] = [
  { key: "all", label: "Alle dagen" },
  { key: "loss", label: "Na verlies" },
  { key: "win", label: "Na winst" },
  { key: "loss-streak", label: "Na 2+ verliezen" },
  { key: "win-streak", label: "Na 2+ winsten" },
];
const dateLabel = (date: string) => format(new Date(`${date}T12:00:00`), "d MMM yyyy", { locale: nl });
const shortDate = (date: string) => format(new Date(`${date}T12:00:00`), "d MMM", { locale: nl });
const groupRows = (rows: ResponseDay[], focus: Focus) => rows.filter((row) =>
  focus === "all" || (focus === "loss" && row.previousResult === "loss") ||
  (focus === "win" && row.previousResult === "win") ||
  (focus === "loss-streak" && row.previousResult === "loss" && row.previousStreak >= 2) ||
  (focus === "win-streak" && row.previousResult === "win" && row.previousStreak >= 2)
);
const status = (value: Signal, rule = false) => rule
  ? value === "yes" ? "Regels gevolgd" : value === "no" ? "Regel gebroken" : "Niet beoordeeld"
  : value === "yes" ? "Gedaan" : value === "no" ? "Niet gedaan" : "Onbekend";
const signalClass = (value: Signal) => value === "yes" ? "text-primary" : value === "no" ? "text-rose-400" : "text-slate-500";

function signalRate(rows: ResponseDay[], key: Factor | "rules") {
  const known = rows.filter((row) => row[key] !== "unknown");
  return known.length ? Math.round(100 * known.filter((row) => row[key] === "yes").length / known.length) : null;
}

function RadarProfile({ rows, color, title }: { rows: ResponseDay[]; color: string; title: string }) {
  const values = [signalRate(rows, "rules"), ...factors.map((factor) => signalRate(rows, factor.key))];
  const point = (index: number, radius: number) => {
    const angle = -Math.PI / 2 + index * (Math.PI * 2 / 5);
    return `${150 + Math.cos(angle) * radius},${143 + Math.sin(angle) * radius}`;
  };
  const rings = [25, 50, 75, 100];
  const complete = values.every((value) => value !== null);
  const assessed = adherence(rows);
  return <div className="min-w-0">
    <div className="flex items-baseline justify-between gap-2"><h3 className="font-heading text-base font-semibold">{title}</h3><span className="text-[11px] text-muted-foreground">{rows.length} dagen</span></div>
    <svg viewBox="0 0 300 285" className={cn(styles.radar, "mx-auto mt-1 block w-full max-w-[285px]")} role="img" aria-label={`${title}: ${axes.map((label, i) => `${label} ${values[i] === null ? "onbekend" : `${values[i]} procent`}`).join(", ")}`}>
      {rings.map((ring) => <polygon key={ring} points={axes.map((_, i) => point(i, ring * .92)).join(" ")} fill="none" stroke="#334155" strokeOpacity={ring === 100 ? .6 : .35} strokeWidth="1" />)}
      {axes.map((label, i) => <line key={label} x1="150" y1="143" x2={point(i, 92).split(",")[0]} y2={point(i, 92).split(",")[1]} stroke="#334155" strokeOpacity=".42" />)}
      {complete && <polygon points={values.map((value, i) => point(i, Math.max(4, value ?? 0) * .92)).join(" ")} fill={color} fillOpacity=".16" stroke={color} strokeWidth="2.5" strokeLinejoin="round" className={styles.radarShape} />}
      {values.map((value, i) => value === null ? null : <circle key={i} cx={point(i, Math.max(4, value) * .92).split(",")[0]} cy={point(i, Math.max(4, value) * .92).split(",")[1]} r="3.5" fill={color} />)}
      <text x="150" y="31" textAnchor="middle">Regels</text>
      <text x="263" y="112" textAnchor="middle">Gewoontes</text>
      <text x="226" y="265" textAnchor="middle">Weekreview</text>
      <text x="74" y="265" textAnchor="middle">Oefening</text>
      <text x="37" y="112" textAnchor="middle">Recap</text>
    </svg>
    <p className="border-t border-white/[.07] pt-3 text-xs text-muted-foreground"><span className="font-medium text-foreground">{assessed.assessed ? `${assessed.kept} van ${assessed.assessed}` : "Geen"}</span> beoordeelde dagen met regels gevolgd</p>
    {!complete && <p className="mt-1 text-[11px] text-muted-foreground">Een of meer onderdelen zijn nog niet geregistreerd.</p>}
  </div>;
}

function OutcomeStrip({ title, rows, active, onClick }: { title: string; rows: ResponseDay[]; active: boolean; onClick: () => void }) {
  const kept = rows.filter((row) => row.rules === "yes").length;
  const broken = rows.filter((row) => row.rules === "no").length;
  const unknown = rows.length - kept - broken;
  const summary = adherence(rows);
  return <button type="button" onClick={onClick} aria-pressed={active} className={cn(styles.filter, "w-full rounded-xl border p-3 text-left", active ? "border-primary/45 bg-primary/[.07]" : "border-white/[.08] bg-background/35 hover:border-primary/30")}>
    <span className="flex items-center justify-between gap-3"><span className="text-xs font-semibold">{title}</span><span className="text-xs tabular-nums text-muted-foreground">{summary.rate === null ? "—" : `${summary.rate}%`} regels gevolgd</span></span>
    <span className="mt-2.5 flex h-2 overflow-hidden rounded-full bg-slate-700/65" aria-hidden="true">{rows.length > 0 && <><span className="bg-primary" style={{ width: `${100 * kept / rows.length}%` }} /><span className="bg-rose-400" style={{ width: `${100 * broken / rows.length}%` }} /><span className="bg-slate-600" style={{ width: `${100 * unknown / rows.length}%` }} /></>}</span>
    <span className="mt-1.5 block text-[10px] text-muted-foreground">{summary.assessed ? `${summary.kept} van ${summary.assessed} beoordeelde dagen` : "Nog geen beoordeelde dagen"}</span>
  </button>;
}

function DayDetail({ row }: { row: ResponseDay }) {
  const previous = row.previousResult === "loss" ? "verlies" : row.previousResult === "win" ? "winst" : row.previousResult === "break-even" ? "break-even" : "geen eerdere trade";
  const signals: { label: string; value: Signal; rule?: boolean }[] = [{ label: "Regels", value: row.rules, rule: true }, ...factors.map((factor) => ({ label: factor.label, value: row[factor.key] }))];
  return <section className="rounded-[22px] border border-white/[.08] bg-card/60 p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">Handelsdag uitgelicht</p><h2 className="mt-1 font-heading text-xl font-semibold">{dateLabel(row.date)}</h2><p className="mt-1 text-xs text-muted-foreground">Na {previous}{row.previousStreak >= 2 ? ` · ${row.previousStreak} op rij` : ""}</p></div><Link href={`/journal/${row.tradeId}`} aria-label="Bekijk deze trade in je dagboek" className="rounded-lg border border-white/10 p-2 text-muted-foreground hover:text-primary"><ArrowUpRight className="size-4" /></Link></div>
    <div className="mt-5 space-y-1.5">{signals.map((item) => <div key={item.label} className="flex items-center justify-between gap-3 rounded-xl border border-white/[.06] bg-background/30 px-3 py-2.5"><span className="flex items-center gap-2.5 text-xs font-medium"><span className={cn("grid size-6 place-items-center rounded-full border", item.value === "yes" ? "border-primary/25 bg-primary/10" : item.value === "no" ? "border-rose-400/25 bg-rose-400/10" : "border-slate-500/25 bg-slate-500/10", signalClass(item.value))}>{item.value === "yes" ? <Check className="size-3.5" /> : item.value === "no" ? <X className="size-3.5" /> : <HelpCircle className="size-3.5" />}</span>{item.label}</span><span className={cn("text-[11px]", signalClass(item.value))}>{status(item.value, item.rule)}</span></div>)}</div>
    <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">Deze trade eindigde met {row.result === "loss" ? "verlies" : row.result === "win" ? "winst" : "break-even"}. De regelstatus staat los van het resultaat.</p>
  </section>;
}

function History({ rows, selectedId, onSelect }: { rows: ResponseDay[]; selectedId: string; onSelect: (id: string) => void }) {
  const recent = rows.slice(0, 24);
  const older = rows.find((row) => row.id === selectedId && !recent.some((item) => item.id === row.id));
  const shown = older ? [older, ...recent] : recent;
  return <section className="rounded-[22px] border border-white/[.08] bg-card/60 p-5"><div className="flex flex-wrap items-end justify-between gap-2"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">Dag voor dag</p><h2 className="mt-1 font-heading text-xl font-semibold">Hoe stabiel volg je je regels?</h2></div><span className="text-[11px] text-muted-foreground">Nieuwste eerst · {rows.length} dagen</span></div><div className={cn(styles.trail, "mt-5 flex gap-2 overflow-x-auto pb-3")} aria-label="Handelsdagen">{shown.map((row) => <button key={row.id} type="button" onClick={() => onSelect(row.id)} aria-pressed={selectedId === row.id} aria-label={`${dateLabel(row.date)}: ${status(row.rules, true)}`} className={cn(styles.day, "flex min-w-[54px] shrink-0 flex-col items-center gap-2 rounded-xl border px-2 py-2.5", selectedId === row.id ? "border-primary/50 bg-primary/[.07]" : "border-white/[.07] bg-background/30")}><span className={cn("size-7 rounded-lg", row.rules === "yes" ? "bg-primary" : row.rules === "no" ? "bg-rose-400" : "bg-slate-600")} /><span className="text-[10px] text-foreground/70">{shortDate(row.date)}</span></button>)}</div><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 border-t border-white/[.07] pt-3 text-[11px] text-muted-foreground"><span><i className="mr-1.5 inline-block size-2 rounded-sm bg-primary" />Regels gevolgd</span><span><i className="mr-1.5 inline-block size-2 rounded-sm bg-rose-400" />Regel gebroken</span><span><i className="mr-1.5 inline-block size-2 rounded-sm bg-slate-600" />Niet beoordeeld</span></div></section>;
}

function ComparisonCard({ factor, rows }: { factor: typeof factors[number]; rows: ResponseDay[] }) {
  const done = adherence(rows.filter((row) => row[factor.key] === "yes"));
  const missed = adherence(rows.filter((row) => row[factor.key] === "no"));
  const enough = done.assessed >= 3 && missed.assessed >= 3;
  const difference = (done.rate ?? 0) - (missed.rate ?? 0);
  return <article className="rounded-2xl border border-white/[.08] bg-background/35 p-4"><h3 className="text-sm font-semibold">{factor.label}</h3><p className="mt-1 text-[11px] text-muted-foreground">Regels gevolgd op dagen dat je dit...</p><div className="mt-5 space-y-4">{[{ label: "wel deed", data: done, color: "bg-primary" }, { label: "niet deed", data: missed, color: "bg-cyan-400" }].map(({ label, data, color }) => <div key={label}><div className="mb-1.5 flex items-baseline justify-between gap-2 text-[11px]"><span>{label}</span><span className="tabular-nums text-muted-foreground">{data.rate === null ? "—" : `${data.rate}%`} <span className="opacity-60">({data.kept}/{data.assessed})</span></span></div><div className="h-2 overflow-hidden rounded-full bg-slate-700/70"><div className={cn("h-full rounded-full", color)} style={{ width: `${data.rate ?? 0}%` }} /></div></div>)}</div><p className="mt-5 border-t border-white/[.07] pt-3 text-[11px] leading-relaxed text-muted-foreground">{!enough ? "Nog te weinig beoordeelde dagen om dit eerlijk te vergelijken." : difference === 0 ? "Geen zichtbaar verschil in deze selectie." : difference > 0 ? "Vaker regels gevolgd wanneer je dit deed." : "Vaker regels gevolgd wanneer je dit niet deed."}</p></article>;
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

  return <div className="mx-auto max-w-[1380px] space-y-4 pb-8"><header className="flex flex-wrap items-end justify-between gap-4"><div><Link href="/analytics" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3.5" /> Analyses</Link><p className="mt-3 text-[10px] font-bold uppercase tracking-[.2em] text-primary">Gedragsinzichten</p><h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Je gedrag na winst en verlies<span className="text-primary">.</span></h1><p className="mt-2 text-sm text-muted-foreground">Zie hoe je voorbereiding en regeltrouw veranderen na het vorige resultaat.</p></div><select aria-label="Periode" value={period} onChange={(event) => { setPeriod(event.target.value); setSelectedId(null); }} className="h-9 rounded-lg border border-white/10 bg-card px-3 text-xs"><option value="30d">30 dagen</option><option value="90d">90 dagen</option><option value="all">Alles</option></select></header>
    {preview && <div className="rounded-xl border border-primary/25 bg-primary/[.07] px-4 py-2.5 text-xs text-primary"><strong>Voorbeeldgegevens.</strong> De figuren gebruiken verzonnen trades. Je eigen patroon staat op de ingelogde pagina Gedragsinzichten.</div>}
    {rows.length === 0 ? <section className="rounded-2xl border border-white/10 bg-card/60 p-8 text-sm text-muted-foreground">Er zijn geen trades in deze periode. Kies een ruimere periode of voeg trades toe in je dagboek.</section> : <>
      <section className="rounded-[22px] border border-white/[.08] bg-card/60 p-5"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">Gedragsprofiel</p><h2 className="mt-1 font-heading text-xl font-semibold">Wat verandert na een verlies of winst?</h2><p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-muted-foreground">Elke hoek toont hoe vaak je dat onderdeel deed op de volgende handelsdag. Verder naar buiten betekent vaker gedaan; bij regels betekent het vaker gevolgd.</p></div><span className="text-[11px] text-muted-foreground">Alleen geregistreerde dagen tellen mee</span></div><div className="mt-4 grid gap-3 md:grid-cols-2"><div className="rounded-2xl border border-white/[.07] bg-background/30 p-4"><RadarProfile rows={afterLoss} title="Na verlies" color="#06B6D4" /></div><div className="rounded-2xl border border-white/[.07] bg-background/30 p-4"><RadarProfile rows={afterWin} title="Na winst" color="#14B8A6" /></div></div></section>
      <div className="grid gap-3 lg:items-start lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,.95fr)]"><section className="rounded-[22px] border border-white/[.08] bg-card/60 p-5"><div className="flex flex-wrap items-end justify-between gap-2"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">Regeltrouw</p><h2 className="mt-1 font-heading text-xl font-semibold">Wat gebeurt er na een reeks?</h2></div><span className="text-[11px] text-muted-foreground">Selecteer een groep</span></div><div className="mt-4 space-y-2"><OutcomeStrip title="Na verlies" rows={afterLoss} active={focus === "loss"} onClick={() => { setFocus("loss"); setSelectedId(null); }} /><OutcomeStrip title="Na winst" rows={afterWin} active={focus === "win"} onClick={() => { setFocus("win"); setSelectedId(null); }} /><OutcomeStrip title="Na 2+ verliezen" rows={lossStreak} active={focus === "loss-streak"} onClick={() => { setFocus("loss-streak"); setSelectedId(null); }} /><OutcomeStrip title="Na 2+ winsten" rows={winStreak} active={focus === "win-streak"} onClick={() => { setFocus("win-streak"); setSelectedId(null); }} /></div><div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-muted-foreground"><button type="button" onClick={() => { setFocus("all"); setSelectedId(null); }} aria-pressed={focus === "all"} className={cn("rounded-full border px-2.5 py-1", focus === "all" ? "border-primary/40 bg-primary/10 text-primary" : "border-white/10 hover:text-foreground")}>Alle dagen</button><span><i className="mr-1.5 inline-block size-2 rounded-sm bg-primary" />Gevolgd</span><span><i className="mr-1.5 inline-block size-2 rounded-sm bg-rose-400" />Gebroken</span><span><i className="mr-1.5 inline-block size-2 rounded-sm bg-slate-600" />Onbekend</span></div><p className="mt-3 text-[11px] text-muted-foreground">“Na verlies” is de volgende handelsdag op hetzelfde account.</p></section>{selected && <DayDetail row={selected} />}</div>
      {visible.length ? <><History rows={visible} selectedId={selected.id} onSelect={setSelectedId} /><section className="rounded-[22px] border border-white/[.08] bg-card/60 p-5"><div className="flex flex-wrap items-end justify-between gap-2"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">Voorbereiding en regels</p><h2 className="mt-1 font-heading text-xl font-semibold">Welke voorbereiding hangt samen met regeltrouw?</h2></div><span className="text-xs text-muted-foreground">{focusLabel}</span></div><p className="mt-2 text-xs text-muted-foreground">Vergelijk per onderdeel de bovenste en onderste balk. De lengte laat zien op welk deel van de beoordeelde dagen je je regels volgde.</p><div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{factors.map((factor) => <ComparisonCard key={factor.key} factor={factor} rows={visible} />)}</div></section></> : <section className="rounded-2xl border border-white/[.08] bg-card/60 p-6 text-sm text-muted-foreground">Er zijn nog geen dagen in deze selectie. Kies hierboven een andere groep.</section>}
      <p className="px-1 text-[11px] leading-relaxed text-muted-foreground">De figuren tonen patronen in je registraties, geen bewezen oorzaken. Een verliestrade kan volledig volgens je regels zijn. Gewoontes en oefeningen zijn per dag opgeslagen; hun exacte tijd vóór de trade is niet altijd bekend. Grijs betekent ontbrekende gegevens.</p>
    </>}
  </div>;
}
