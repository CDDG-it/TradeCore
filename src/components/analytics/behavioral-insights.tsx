"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Check, HelpCircle, X } from "lucide-react";
import { inPeriod } from "@/lib/journal/analytics-filter";
import { adherence, buildResponseDays, type ResponseDay, type Signal } from "@/lib/journal/behavioral-context";
import type { BestTradeOfDay, Habit, HabitCompletion, PreMarketExercise, TradeJournalEntry, TradeRuleCheck, WeeklyTradeReview } from "@/lib/types";
import { cn } from "@/lib/utils";
import { MotionConfig, motion } from "motion/react";
import { EASE_OUT, SPRING, rise } from "@/lib/motion";
import { GrowBar } from "@/components/ui/grow-bar";
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
  { key: "habits", label: "Habits", axis: "Habits" },
  { key: "weeklyReview", label: "Weekly review", axis: "Weekly review" },
  { key: "preMarket", label: "Pre-market exercise", axis: "Exercise" },
  { key: "yesterdayRecap", label: "Yesterday’s recap", axis: "Recap" },
];
const axes = ["Rules", ...factors.map((factor) => factor.axis)];
const focusItems: { key: Focus; label: string }[] = [
  { key: "all", label: "All days" },
  { key: "loss", label: "After a loss" },
  { key: "win", label: "After a win" },
  { key: "loss-streak", label: "After 2+ losses" },
  { key: "win-streak", label: "After 2+ wins" },
];
const dateLabel = (date: string) => format(new Date(`${date}T12:00:00`), "MMM d, yyyy", { locale: enUS });
const shortDate = (date: string) => format(new Date(`${date}T12:00:00`), "MMM d", { locale: enUS });
const groupRows = (rows: ResponseDay[], focus: Focus) => rows.filter((row) =>
  focus === "all" || (focus === "loss" && row.previousResult === "loss") ||
  (focus === "win" && row.previousResult === "win") ||
  (focus === "loss-streak" && row.previousResult === "loss" && row.previousStreak >= 2) ||
  (focus === "win-streak" && row.previousResult === "win" && row.previousStreak >= 2)
);
const status = (value: Signal, rule = false) => rule
  ? value === "yes" ? "Rules followed" : value === "no" ? "Rule broken" : "Not assessed"
  : value === "yes" ? "Done" : value === "no" ? "Not done" : "Unknown";
const signalClass = (value: Signal) => value === "yes" ? "text-primary" : value === "no" ? "text-rose-400" : "text-slate-500";

function signalRate(rows: ResponseDay[], key: Factor | "rules") {
  const known = rows.filter((row) => row[key] !== "unknown");
  return known.length ? Math.round(100 * known.filter((row) => row[key] === "yes").length / known.length) : null;
}

function RadarProfile({ rows, color, title, tone }: { rows: ResponseDay[]; color: string; title: string; tone: "loss" | "win" }) {
  const values = [signalRate(rows, "rules"), ...factors.map((factor) => signalRate(rows, factor.key))];
  const point = (index: number, radius: number) => {
    const angle = -Math.PI / 2 + index * (Math.PI * 2 / 5);
    return `${150 + Math.cos(angle) * radius},${143 + Math.sin(angle) * radius}`;
  };
  const rings = [25, 50, 75, 100];
  const complete = values.every((value) => value !== null);
  const assessed = adherence(rows);
  // The axis under the pointer, read out beside its point.
  const [hover, setHover] = useState<number | null>(null);
  const centre = axes.map(() => "150,143").join(" ");
  const at = (i: number) => point(i, Math.max(4, values[i] ?? 0) * .92).split(",").map(Number);
  return <div className={cn(styles.profileCard, tone === "loss" ? styles.lossCard : styles.winCard, "min-w-0 rounded-2xl border p-4")}>
    <div className="flex items-center justify-between gap-2"><h3 className="flex items-center gap-2 font-heading text-base font-semibold"><span className="size-2 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 14px ${color}80` }} />{title}</h3><span className="rounded-full border border-white/10 bg-background/40 px-2 py-1 text-[11px] text-muted-foreground">{rows.length} days</span></div>
    <svg viewBox="0 0 300 285" className={cn(styles.radar, "mx-auto mt-1 block w-full max-w-[285px]")} role="img" aria-label={`${title}: ${axes.map((label, i) => `${label} ${values[i] === null ? "unknown" : `${values[i]} percent`}`).join(", ")}`}>
      {rings.map((ring) => <polygon key={ring} points={axes.map((_, i) => point(i, ring * .92)).join(" ")} fill="none" stroke="#334155" strokeOpacity={ring === 100 ? .6 : .35} strokeWidth="1" />)}
      {axes.map((label, i) => <line key={label} x1="150" y1="143" x2={point(i, 92).split(",")[0]} y2={point(i, 92).split(",")[1]} stroke="#334155" strokeOpacity=".42" />)}
      {complete && <motion.polygon initial={{ points: centre }} animate={{ points: values.map((value, i) => point(i, Math.max(4, value ?? 0) * .92)).join(" ") }} transition={{ duration: 0.55, ease: EASE_OUT }} fill={color} fillOpacity=".16" stroke={color} strokeWidth="2.5" strokeLinejoin="round" className={styles.radarShape} />}
      {values.map((value, i) => value === null ? null : <motion.circle key={i} initial={{ cx: 150, cy: 143 }} animate={{ cx: at(i)[0], cy: at(i)[1], r: hover === i ? 5.5 : 3.5 }} transition={{ duration: 0.55, ease: EASE_OUT, r: SPRING }} fill={color} />)}
      {/* Larger, invisible targets, so a vertex is easy to point at. */}
      {values.map((value, i) => value === null ? null : <circle key={`hit-${i}`} cx={at(i)[0]} cy={at(i)[1]} r="13" fill="transparent" onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)} />)}
      {hover !== null && values[hover] !== null && (() => {
        const [x, y] = at(hover);
        const label = `${axes[hover]} · ${values[hover]}%`;
        const width = label.length * 6.2 + 16;
        const left = Math.min(Math.max(x - width / 2, 4), 296 - width);
        const top = y < 40 ? y + 12 : y - 32;
        return <motion.g className="pointer-events-none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.12 }}>
          <rect x={left} y={top} width={width} height="22" rx="6" fill="#0b1120" stroke={color} strokeOpacity=".55" />
          <text x={left + width / 2} y={top + 15} textAnchor="middle" style={{ fill: "#f8fafc", fontSize: 11 }}>{label}</text>
        </motion.g>;
      })()}
      <text x="150" y="31" textAnchor="middle">Rules</text>
      <text x="263" y="112" textAnchor="middle">Habits</text>
      <text x="226" y="265" textAnchor="middle">Weekly review</text>
      <text x="74" y="265" textAnchor="middle">Exercise</text>
      <text x="37" y="112" textAnchor="middle">Recap</text>
    </svg>
    <p className="border-t border-white/[.08] pt-3 text-xs text-muted-foreground"><span className="font-semibold" style={{ color }}>{assessed.assessed ? `${assessed.kept} of ${assessed.assessed}` : "No"}</span> assessed days with rules followed</p>
    {!complete && <p className="mt-1 text-[11px] text-muted-foreground">One or more factors have not been recorded yet.</p>}
  </div>;
}

function OutcomeStrip({ title, rows, active, onClick }: { title: string; rows: ResponseDay[]; active: boolean; onClick: () => void }) {
  const kept = rows.filter((row) => row.rules === "yes").length;
  const broken = rows.filter((row) => row.rules === "no").length;
  const unknown = rows.length - kept - broken;
  const summary = adherence(rows);
  return <button type="button" onClick={onClick} aria-pressed={active} className={cn(styles.filter, "w-full rounded-xl border p-3 text-left", active ? "border-primary/45 bg-primary/[.07]" : "border-white/[.08] bg-background/35 hover:border-primary/30")}>
    <span className="flex items-center justify-between gap-3"><span className="text-xs font-semibold">{title}</span><span className="text-xs tabular-nums text-muted-foreground">{summary.rate === null ? "—" : `${summary.rate}%`} rules followed</span></span>
    <span className="relative mt-2.5 block h-2 overflow-hidden rounded-full bg-slate-700/65" aria-hidden="true">{rows.length > 0 && [
      { key: "kept", share: kept / rows.length, start: 0, className: "bg-primary" },
      { key: "broken", share: broken / rows.length, start: kept / rows.length, className: "bg-rose-400" },
      { key: "unknown", share: unknown / rows.length, start: (kept + broken) / rows.length, className: "bg-slate-600" },
    ].map((part, index) => <motion.span key={part.key} className={cn("absolute inset-0 origin-left", part.className)}
      initial={{ transform: `translateX(${part.start * 100}%) scaleX(0)` }} animate={{ transform: `translateX(${part.start * 100}%) scaleX(${part.share})` }}
      transition={{ duration: 0.5, delay: 0.1 + index * 0.06, ease: EASE_OUT }} />)}</span>
    <span className="mt-1.5 block text-[10px] text-muted-foreground">{summary.assessed ? `${summary.kept} of ${summary.assessed} assessed days` : "No assessed days yet"}</span>
  </button>;
}

function DayDetail({ row }: { row: ResponseDay }) {
  const previous = row.previousResult === "loss" ? "a loss" : row.previousResult === "win" ? "a win" : row.previousResult === "break-even" ? "break-even" : "no prior result";
  const signals: { label: string; value: Signal; rule?: boolean }[] = [{ label: "Rules", value: row.rules, rule: true }, ...factors.map((factor) => ({ label: factor.label, value: row[factor.key] }))];
  return <motion.div initial={{ opacity: 0, transform: "translateY(4px)" }} animate={{ opacity: 1, transform: "translateY(0px)" }} transition={{ duration: 0.18, ease: EASE_OUT }} className={cn(styles.selectedDay, row.rules === "yes" ? styles.selectedKept : row.rules === "no" ? styles.selectedBroken : styles.selectedUnknown, "min-w-0 rounded-2xl border bg-background/40 p-4 sm:p-5")}>
    <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">Selected trading day</p><h3 className="mt-1 font-heading text-xl font-semibold">{dateLabel(row.date)}</h3><p className="mt-1 text-xs text-muted-foreground">{row.previousResult ? `After ${previous}` : "No prior result"}{row.previousStreak >= 2 ? ` · ${row.previousStreak} in a row` : ""}</p></div><Link href={`/journal/${row.tradeId}`} aria-label="View this trade in your journal" className="rounded-lg border border-white/10 p-2 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"><ArrowUpRight className="size-4" /></Link></div>
    <div className="mt-4 grid gap-1.5">{signals.map((item) => <div key={item.label} className="flex items-center justify-between gap-3 rounded-xl border border-white/[.06] bg-card/55 px-3 py-2.5"><span className="flex items-center gap-2.5 text-xs font-medium"><span className={cn("grid size-6 place-items-center rounded-full border", item.value === "yes" ? "border-primary/25 bg-primary/10" : item.value === "no" ? "border-rose-400/25 bg-rose-400/10" : "border-slate-500/25 bg-slate-500/10", signalClass(item.value))}>{item.value === "yes" ? <Check className="size-3.5" /> : item.value === "no" ? <X className="size-3.5" /> : <HelpCircle className="size-3.5" />}</span>{item.label}</span><span className={cn("text-[11px]", signalClass(item.value))}>{status(item.value, item.rule)}</span></div>)}</div>
    <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">Trade result: {row.result === "loss" ? "loss" : row.result === "win" ? "win" : "break-even"}. Rule adherence is separate from the result.</p>
  </motion.div>;
}

function History({ rows, selected, onSelect }: { rows: ResponseDay[]; selected: ResponseDay; onSelect: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const recent = expanded ? rows : rows.slice(0, 28);
  const older = rows.find((row) => row.id === selected.id && !recent.some((item) => item.id === row.id));
  const shown = older ? [older, ...recent] : recent;
  return <section className={cn(styles.insightCard, "rounded-[22px] border p-5")}><div className="flex flex-wrap items-end justify-between gap-2"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">Day by day</p><h2 className="mt-1 font-heading text-xl font-semibold">Select a day. See what led into it.</h2></div><span className="text-[11px] text-muted-foreground">Newest first · {rows.length} days</span></div>
    <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1.12fr)_minmax(300px,.88fr)] lg:gap-4"><div className="min-w-0 rounded-2xl border border-white/[.07] bg-background/30 p-3 sm:p-4"><div className="grid grid-cols-5 gap-2 sm:grid-cols-7 lg:grid-cols-6 xl:grid-cols-7" aria-label="Trading days">{shown.map((row) => <button key={row.id} type="button" onClick={() => onSelect(row.id)} aria-pressed={selected.id === row.id} aria-label={`${dateLabel(row.date)}: ${status(row.rules, true)}`} className={cn(styles.day, "relative isolate flex min-w-0 flex-col gap-2 rounded-xl border px-2 py-2 text-left", selected.id === row.id ? "border-transparent" : "border-white/[.07] bg-card/45")}>{selected.id === row.id && <motion.span layoutId="insight-selected-day" className="absolute inset-0 -z-10 rounded-xl border border-primary/60 bg-primary/[.08]" transition={SPRING} />}<span className={cn("h-6 w-full rounded-md", row.rules === "yes" ? "bg-primary/85" : row.rules === "no" ? "bg-rose-400/90" : "bg-slate-600/80")} /><span className="whitespace-nowrap text-[10px] text-foreground/75">{shortDate(row.date)}</span></button>)}</div>{rows.length > 28 && <button type="button" onClick={() => setExpanded(!expanded)} aria-expanded={expanded} className="mt-3 text-[11px] font-medium text-primary hover:text-primary/80">{expanded ? "Show fewer days" : `Show all ${rows.length} days`}</button>}<div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-white/[.07] pt-3 text-[11px] text-muted-foreground"><span><i className="mr-1.5 inline-block size-2 rounded-sm bg-primary" />Rules followed</span><span><i className="mr-1.5 inline-block size-2 rounded-sm bg-rose-400" />Rule broken</span><span><i className="mr-1.5 inline-block size-2 rounded-sm bg-slate-600" />Not assessed</span></div></div><DayDetail key={selected.id} row={selected} /></div>
  </section>;
}

function ComparisonCard({ factor, rows }: { factor: typeof factors[number]; rows: ResponseDay[] }) {
  const done = adherence(rows.filter((row) => row[factor.key] === "yes"));
  const missed = adherence(rows.filter((row) => row[factor.key] === "no"));
  const enough = done.assessed >= 3 && missed.assessed >= 3;
  const difference = (done.rate ?? 0) - (missed.rate ?? 0);
  return <article className={cn(styles.comparisonCard, "rounded-2xl border border-white/[.08] bg-background/35 p-4")}><h3 className="text-sm font-semibold">{factor.label}</h3><p className="mt-1 text-[11px] text-muted-foreground">Rules followed on days when you...</p><div className="mt-5 space-y-4">{[{ label: "did it", data: done, color: "bg-primary" }, { label: "did not", data: missed, color: "bg-cyan-400" }].map(({ label, data, color }) => <div key={label}><div className="mb-1.5 flex items-baseline justify-between gap-2 text-[11px]"><span>{label}</span><span className="tabular-nums text-muted-foreground">{data.rate === null ? "—" : `${data.rate}%`} <span className="opacity-60">({data.kept}/{data.assessed})</span></span></div><GrowBar className="h-2 bg-slate-700/70" fillClassName={color} value={(data.rate ?? 0) / 100} duration={0.6} /></div>)}</div><p className="mt-5 border-t border-white/[.07] pt-3 text-[11px] leading-relaxed text-muted-foreground">{!enough ? "Not enough assessed days to compare these groups reliably." : difference === 0 ? "No visible difference in this selection." : difference > 0 ? "Rules were followed more often when you did this." : "Rules were followed more often when you did not do this."}</p></article>;
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
  const focusLabel = focusItems.find((item) => item.key === focus)?.label ?? "All days";

  return <MotionConfig reducedMotion="user"><div className="mx-auto max-w-[1380px] space-y-5 pb-8"><header className="flex flex-wrap items-end justify-between gap-4"><div><Link href="/analytics" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3.5" /> Analytics</Link><p className="mt-3 text-[10px] font-bold uppercase tracking-[.2em] text-primary">Behavioral insights</p><h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">Your behavior after wins and losses<span className="text-primary">.</span></h1><p className="mt-2 text-sm text-muted-foreground">See how your preparation and rule adherence change after the previous result.</p></div><select aria-label="Period" value={period} onChange={(event) => { setPeriod(event.target.value); setSelectedId(null); }} className="h-9 rounded-lg border border-white/10 bg-card px-3 text-xs"><option value="30d">30 days</option><option value="90d">90 days</option><option value="all">All time</option></select></header>
    {preview && <div className="rounded-xl border border-primary/25 bg-primary/[.07] px-4 py-2.5 text-xs text-primary"><strong>Sample data.</strong> These charts use sample trades. Your own patterns appear on the signed-in Behavioral insights page.</div>}
    {rows.length === 0 ? <section className="rounded-2xl border border-white/10 bg-card/60 p-8 text-sm text-muted-foreground">There are no trades in this period. Choose a longer period or add trades to your journal.</section> : <>
      <motion.section {...rise(0)} className={cn(styles.insightCard, "rounded-[22px] border p-5")}><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">Behavioral profile</p><h2 className="mt-1 font-heading text-xl font-semibold">What changes after a loss or win?</h2><p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-muted-foreground">Each axis shows how often you completed that part on the next trading day. Further out means more often; for rules it means followed more often.</p></div><span className="text-[11px] text-muted-foreground">Only recorded days are included</span></div><div className="mt-4 grid gap-3 md:grid-cols-2"><RadarProfile rows={afterLoss} title="After a loss" color="#fb7185" tone="loss" /><RadarProfile rows={afterWin} title="After a win" color="#14B8A6" tone="win" /></div></motion.section>
      <motion.section {...rise(1)} className={cn(styles.insightCard, "rounded-[22px] border p-5")}><div className="flex flex-wrap items-end justify-between gap-2"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">Rule adherence</p><h2 className="mt-1 font-heading text-xl font-semibold">What happens after a streak?</h2></div><span className="text-[11px] text-muted-foreground">Select a group</span></div><div className="mt-4 grid gap-2 sm:grid-cols-2"><OutcomeStrip title="After a loss" rows={afterLoss} active={focus === "loss"} onClick={() => { setFocus("loss"); setSelectedId(null); }} /><OutcomeStrip title="After a win" rows={afterWin} active={focus === "win"} onClick={() => { setFocus("win"); setSelectedId(null); }} /><OutcomeStrip title="After 2+ losses" rows={lossStreak} active={focus === "loss-streak"} onClick={() => { setFocus("loss-streak"); setSelectedId(null); }} /><OutcomeStrip title="After 2+ wins" rows={winStreak} active={focus === "win-streak"} onClick={() => { setFocus("win-streak"); setSelectedId(null); }} /></div><div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-muted-foreground"><button type="button" onClick={() => { setFocus("all"); setSelectedId(null); }} aria-pressed={focus === "all"} className={cn("rounded-full border px-2.5 py-1", focus === "all" ? "border-primary/40 bg-primary/10 text-primary" : "border-white/10 hover:text-foreground")}>All days</button><span><i className="mr-1.5 inline-block size-2 rounded-sm bg-primary" />Followed</span><span><i className="mr-1.5 inline-block size-2 rounded-sm bg-rose-400" />Broken</span><span><i className="mr-1.5 inline-block size-2 rounded-sm bg-slate-600" />Unknown</span></div><p className="mt-3 text-[11px] text-muted-foreground">“After a loss” means the next trading day on the same account.</p></motion.section>
      {visible.length ? <><motion.div {...rise(2)}><History rows={visible} selected={selected} onSelect={setSelectedId} /></motion.div><motion.section {...rise(3)} className={cn(styles.insightCard, "rounded-[22px] border p-5")}><div className="flex flex-wrap items-end justify-between gap-2"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">Preparation and rules</p><h2 className="mt-1 font-heading text-xl font-semibold">Which preparation relates to rule adherence?</h2></div><span className="text-xs text-muted-foreground">{focusLabel}</span></div><p className="mt-2 text-xs text-muted-foreground">Compare the two bars for each factor. Their length shows the share of assessed days when you followed your rules.</p><div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{factors.map((factor) => <ComparisonCard key={factor.key} factor={factor} rows={visible} />)}</div></motion.section></> : <section className="rounded-2xl border border-white/[.08] bg-card/60 p-6 text-sm text-muted-foreground">There are no days in this selection yet. Choose another group above.</section>}
      <p className="px-1 text-[11px] leading-relaxed text-muted-foreground">These charts show patterns in your records, not proven causes. A losing trade can still follow every rule. Habits and exercises are recorded by day; their exact timing before a trade is not always known. Gray means missing data.</p>
    </>}
  </div></MotionConfig>;
}
