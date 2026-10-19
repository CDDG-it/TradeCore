"use client";
/* eslint-disable @next/next/no-img-element -- Analysis charts use signed storage URLs. */

import { useEffect, useState } from "react";
import Link from "next/link";
import { addDays, addWeeks, format, getISOWeek, isSameISOWeek, startOfISOWeek, subWeeks } from "date-fns";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, CalendarDays, ChevronLeft, ChevronRight, ImageIcon, Plus, TrendingDown, TrendingUp } from "lucide-react";
import { getAnalysisById, type AnalysisListRow } from "@/lib/supabase/queries";
import { useScreenshots } from "@/lib/supabase/use-screenshots";
import type { Bias, PreTradeAnalysis } from "@/lib/types";
import { cn } from "@/lib/utils";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function biasStyle(bias: Bias) {
  return bias === "bullish" ? "border-success/25 bg-success/10 text-success" : bias === "bearish" ? "border-destructive/25 bg-destructive/10 text-destructive" : "border-warning/25 bg-warning/10 text-warning";
}

function Bias({ bias }: { bias: Bias }) {
  return <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold capitalize", biasStyle(bias))}>
    {bias === "bullish" ? <TrendingUp className="size-3" /> : bias === "bearish" ? <TrendingDown className="size-3" /> : null}{bias}
  </span>;
}

function ChartPeek({ analysis, preview }: { analysis: PreTradeAnalysis; preview: boolean }) {
  const first = analysis.screenshot_groups?.find((group) => group.urls.length)?.urls[0];
  const label = analysis.screenshot_groups?.find((group) => group.urls.length)?.label;
  const { display, onLoadError } = useScreenshots(null, first ? [first] : []);
  const image = first ? display(first) : null;
  if (!first) return null;
  return <Link href={preview ? `/preview/analysis?view=review&id=${analysis.id}` : `/analysis/${analysis.id}`} aria-label={`Open ${analysis.instrument} charts`} className="group relative block min-h-44 overflow-hidden rounded-xl border border-border/60 bg-[#0a1323]">
    {image ? <img src={image} alt={`${analysis.instrument} ${label} chart`} onError={() => onLoadError(first)} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.035]" /> : <div className="h-full w-full animate-pulse bg-white/[.04]" />}
    <span className="absolute bottom-2 left-2 rounded-md border border-white/15 bg-[#0b1120]/85 px-2 py-1 text-[10px] font-semibold text-white/85">{label} chart</span>
    <span className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-md bg-[#0b1120]/80 text-white/85"><ArrowRight className="size-3.5" /></span>
  </Link>;
}

export function AnalysisOverview({ analyses, previewDetails }: { analyses: AnalysisListRow[]; previewDetails?: PreTradeAnalysis[] }) {
  const reduce = useReducedMotion();
  const [weekDate, setWeekDate] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<PreTradeAnalysis | null>(null);
  const [detailFailedId, setDetailFailedId] = useState<string | null>(null);
  const weekStart = startOfISOWeek(weekDate);
  const weekEnd = addDays(weekStart, 6);
  const weekStartKey = format(weekStart, "yyyy-MM-dd");
  const weekEndKey = format(weekEnd, "yyyy-MM-dd");
  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const todayKey = format(new Date(), "yyyy-MM-dd");
  const currentWeek = isSameISOWeek(weekDate, new Date());

  const weekRows = analyses.filter((row) => row.date >= weekStartKey && row.date <= weekEndKey)
    .sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at));
  const rows = selectedDay ? weekRows.filter((row) => row.date === selectedDay) : weekRows;
  const activeId = selectedId && rows.some((row) => row.id === selectedId) ? selectedId : rows[0]?.id ?? null;
  const activeRow = rows.find((row) => row.id === activeId) ?? null;
  const activeIndex = rows.findIndex((row) => row.id === activeId);

  useEffect(() => {
    if (!activeId) return;
    const sample = previewDetails?.find((item) => item.id === activeId);
    if (sample) return;
    let cancelled = false;
    getAnalysisById(activeId).then((value) => {
      if (cancelled) return;
      if (!value) { setDetailFailedId(activeId); return; }
      setDetail(value);
    }).catch(() => { if (!cancelled) setDetailFailedId(activeId); });
    return () => { cancelled = true; };
  }, [activeId, previewDetails]);

  const selected = previewDetails?.find((item) => item.id === activeId) ?? (detail?.id === activeId ? detail : null);
  const waitingForDetail = Boolean(activeId && !selected && !previewDetails && detailFailedId !== activeId);
  const preview = Boolean(previewDetails);
  const detailHref = activeRow ? preview ? `/preview/analysis?view=review&id=${activeRow.id}` : `/analysis/${activeRow.id}` : "/analysis";

  function moveWeek(direction: -1 | 1) {
    setWeekDate((date) => direction < 0 ? subWeeks(date, 1) : addWeeks(date, 1));
    setSelectedDay(null);
    setSelectedId(null);
    setDetail(null);
  }

  return <div className="flex flex-col gap-3 lg:h-[calc(100dvh-7.5rem)] lg:min-h-[40rem] lg:overflow-hidden">
    <header className="flex shrink-0 flex-wrap items-center justify-between gap-3">
      <div><h1 className="font-heading text-2xl font-bold tracking-tight">Analysis</h1><p className="mt-0.5 text-xs text-muted-foreground">Your market reads, in context.</p></div>
      <Link href={preview ? "/preview/analysis" : "/analysis/new"} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-[0_4px_18px_rgba(20,184,166,.18)] transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[0_6px_24px_rgba(20,184,166,.28)]"><Plus className="size-4" /> New analysis</Link>
    </header>

    <section aria-label="Analysis week" className="shrink-0 rounded-2xl border border-border/70 bg-card/75 p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5"><span className="flex size-9 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary"><CalendarDays className="size-4" /></span><AnimatePresence mode="wait" initial={false}><motion.div key={weekStartKey} initial={{ opacity: 0, transform: reduce ? "none" : "translateY(5px)" }} animate={{ opacity: 1, transform: "translateY(0px)" }} exit={{ opacity: 0, transform: reduce ? "none" : "translateY(-5px)" }} transition={{ duration: .16, ease: [.23, 1, .32, 1] }}><p className="text-sm font-semibold">{format(weekStart, "d MMM")} – {format(weekEnd, "d MMM yyyy")}</p><p className="text-[11px] text-muted-foreground">Week {getISOWeek(weekDate)} · {weekRows.length} {weekRows.length === 1 ? "analysis" : "analyses"}</p></motion.div></AnimatePresence></div>
        <div className="flex items-center gap-1.5">
          {!currentWeek && <button type="button" onClick={() => { setWeekDate(new Date()); setSelectedDay(null); setSelectedId(null); }} className="mr-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10">This week</button>}
          <button type="button" onClick={() => moveWeek(-1)} aria-label="Previous week" className="flex size-8 items-center justify-center rounded-lg border border-border/70 text-muted-foreground transition-colors hover:border-primary/35 hover:text-foreground"><ChevronLeft className="size-4" /></button>
          <button type="button" onClick={() => moveWeek(1)} disabled={currentWeek} aria-label="Next week" className="flex size-8 items-center justify-center rounded-lg border border-border/70 text-muted-foreground transition-colors hover:border-primary/35 hover:text-foreground disabled:opacity-35"><ChevronRight className="size-4" /></button>
        </div>
      </div>
      <div className="mt-1 flex gap-1.5 overflow-x-auto py-2">
        <button type="button" onClick={() => { setSelectedDay(null); setSelectedId(null); }} aria-pressed={!selectedDay} className={cn("relative isolate flex min-w-[5.5rem] shrink-0 flex-col items-start rounded-xl border px-3 py-2 text-left transition-[color,border-color,box-shadow] duration-200 hover:shadow-[0_0_18px_rgba(20,184,166,.1)]", !selectedDay ? "border-primary/40 text-primary" : "border-border/70 text-muted-foreground hover:border-primary/25 hover:text-foreground")}>{!selectedDay && <motion.span layoutId="analysis-overview-day" className="absolute inset-0 -z-10 rounded-[11px] bg-primary/10" transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 36 }} />}<span className="text-[10px] font-medium">All week</span><span className="mt-0.5 text-sm font-bold tabular-nums">{weekRows.length}</span></button>
        {days.map((date, index) => { const key = format(date, "yyyy-MM-dd"); const count = weekRows.filter((row) => row.date === key).length; const active = selectedDay === key; return <button key={key} type="button" onClick={() => { setSelectedDay(key); setSelectedId(null); }} aria-pressed={active} className={cn("relative isolate flex min-w-[4.25rem] flex-1 flex-col items-start rounded-xl border px-3 py-2 text-left transition-[color,border-color,box-shadow] duration-200 hover:shadow-[0_0_18px_rgba(20,184,166,.1)]", active ? "border-primary/40 text-primary" : "border-border/70 text-muted-foreground hover:border-primary/25 hover:text-foreground")}>
          {active && <motion.span layoutId="analysis-overview-day" className="absolute inset-0 -z-10 rounded-[11px] bg-primary/10" transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 36 }} />}
          <span className="flex w-full items-center justify-between gap-1 text-[10px] font-medium">{DAYS[index]}{count > 0 ? <span className="flex size-4 items-center justify-center rounded-full bg-primary/15 text-[9px] font-bold text-primary">{count}</span> : key === todayKey ? <span className="size-1 rounded-full bg-primary" /> : null}</span><span className={cn("mt-0.5 text-sm font-bold tabular-nums", count ? "text-foreground" : "text-muted-foreground/45")}>{format(date, "d")}</span>
        </button>; })}
      </div>
    </section>

    <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(19rem,.8fr)_minmax(0,1.2fr)]">
      <section aria-label="Analyses in selected period" className="flex min-h-[20rem] flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/75 lg:min-h-0">
        <div className="flex shrink-0 items-center justify-between border-b border-border/60 px-4 py-3"><h2 className="text-sm font-semibold">{selectedDay ? format(new Date(`${selectedDay}T12:00:00`), "EEEE, d MMMM") : currentWeek ? "This week's reads" : `Week ${getISOWeek(weekDate)} reads`}</h2><span className="text-[11px] tabular-nums text-muted-foreground">{rows.length}</span></div>
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-2.5">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={`${weekStartKey}:${selectedDay ?? "all"}`} className="space-y-2" initial={{ opacity: 0, transform: reduce ? "none" : "translateY(7px)" }} animate={{ opacity: 1, transform: "translateY(0px)" }} exit={{ opacity: 0 }} transition={{ duration: .18, ease: [.23, 1, .32, 1] }}>
              {rows.length ? rows.map((row) => <button key={row.id} type="button" onClick={() => setSelectedId(row.id)} aria-pressed={activeId === row.id} className={cn("group relative isolate w-full overflow-hidden rounded-xl border p-3.5 text-left transition-[border-color,transform] duration-150 active:scale-[.985] motion-safe:hover:-translate-y-0.5 hover:border-primary/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary", activeId === row.id ? "border-primary/35" : "border-border/60 bg-background/30")}>
                {activeId === row.id && <motion.span layoutId="analysis-overview-selection" className="absolute inset-0 -z-10 rounded-[11px] bg-primary/[.075] shadow-[inset_2px_0_0_#14b8a6,0_0_24px_rgba(20,184,166,.06)]" transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 460, damping: 40 }} />}
                <div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="text-base font-bold tracking-tight text-foreground">{row.instrument}<span className="ml-2 text-[10px] font-medium capitalize text-muted-foreground">{row.market}</span></p><p className="mt-0.5 text-[11px] text-muted-foreground">{format(new Date(`${row.date}T12:00:00`), "EEE d MMM")} · {row.session}</p></div><Bias bias={row.bias} /></div>
                <p className="mt-2.5 line-clamp-2 text-xs leading-relaxed text-foreground/70">{row.thesis}</p>
                {row.used_for_trade && <span className="mt-2 inline-block text-[10px] font-semibold text-primary">Linked to a trade</span>}
              </button>) : <div className="flex min-h-44 flex-col items-center justify-center rounded-xl border border-dashed border-border/70 p-5 text-center"><ImageIcon className="size-5 text-muted-foreground/45" /><p className="mt-3 text-sm font-medium text-foreground/80">No analyses here yet</p><p className="mt-1 text-xs text-muted-foreground">Choose another day or add a new analysis.</p></div>}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      <section aria-label="Selected analysis preview" className="flex min-h-[29rem] flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/75 lg:min-h-0">
        {activeRow ? <>
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border/60 px-4 py-3 sm:px-5"><div className="flex items-center gap-2.5"><h2 className="text-lg font-bold tracking-tight">{activeRow.instrument} analysis</h2><Bias bias={activeRow.bias} /></div><div className="flex items-center gap-2"><div className="flex items-center gap-1" aria-label="Browse analyses"><button type="button" onClick={() => setSelectedId(rows[activeIndex - 1].id)} disabled={activeIndex <= 0} aria-label="Previous analysis" className="flex size-7 items-center justify-center rounded-lg border border-border/70 text-muted-foreground transition-[border-color,color,transform] duration-150 hover:border-primary/30 hover:text-foreground active:scale-95 disabled:opacity-30 disabled:hover:border-border/70"><ChevronLeft className="size-3.5" /></button><button type="button" onClick={() => setSelectedId(rows[activeIndex + 1].id)} disabled={activeIndex >= rows.length - 1} aria-label="Next analysis" className="flex size-7 items-center justify-center rounded-lg border border-border/70 text-muted-foreground transition-[border-color,color,transform] duration-150 hover:border-primary/30 hover:text-foreground active:scale-95 disabled:opacity-30 disabled:hover:border-border/70"><ChevronRight className="size-3.5" /></button></div><Link href={detailHref} className="inline-flex items-center gap-1.5 rounded-lg border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-[background-color,transform] duration-150 hover:bg-primary/15 active:scale-[.97]">Open analysis <ArrowRight className="size-3.5" /></Link></div></div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={activeRow.id} initial={{ opacity: 0, transform: reduce ? "none" : "translateY(8px)" }} animate={{ opacity: 1, transform: "translateY(0px)" }} exit={{ opacity: 0 }} transition={{ duration: .18, ease: [.23, 1, .32, 1] }} className="space-y-4">
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground"><CalendarDays className="size-3.5" />{format(new Date(`${activeRow.date}T12:00:00`), "EEEE, d MMMM yyyy")}<span className="text-border">·</span>{activeRow.session}</div>
                {waitingForDetail ? <div className="space-y-3"><div className="h-36 animate-pulse rounded-xl bg-white/[.04]" /><div className="h-28 animate-pulse rounded-xl bg-white/[.04]" /></div> : <>
                  <div className={cn("grid gap-3", selected?.screenshot_groups?.some((group) => group.urls.length) && "md:grid-cols-[minmax(0,1fr)_minmax(12rem,.8fr)]")}>
                    <article className="rounded-xl border border-border/70 bg-background/35 p-4"><h3 className="text-[10px] font-semibold uppercase tracking-[.14em] text-primary">Market thesis</h3><p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">{activeRow.thesis}</p></article>
                    {selected && <ChartPeek analysis={selected} preview={preview} />}
                  </div>
                  {(selected?.long_scenario || selected?.short_scenario) && <div className="grid gap-3 md:grid-cols-2">
                    {selected.long_scenario && <article className="rounded-xl border border-success/20 bg-success/[.04] p-4"><h3 className="flex items-center gap-1.5 text-xs font-semibold text-success"><TrendingUp className="size-3.5" /> Long scenario</h3><p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-foreground/75">{selected.long_scenario}</p></article>}
                    {selected.short_scenario && <article className="rounded-xl border border-destructive/20 bg-destructive/[.04] p-4"><h3 className="flex items-center gap-1.5 text-xs font-semibold text-destructive"><TrendingDown className="size-3.5" /> Short scenario</h3><p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-foreground/75">{selected.short_scenario}</p></article>}
                  </div>}
                </>}
              </motion.div>
            </AnimatePresence>
          </div>
        </> : <div className="flex h-full flex-col items-center justify-center p-8 text-center"><span className="flex size-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary"><CalendarDays className="size-6" /></span><h2 className="mt-4 text-lg font-semibold">A clear view of every market read</h2><p className="mt-2 max-w-xs text-sm text-muted-foreground">Select a day with an analysis, or start a new one.</p><Link href={preview ? "/preview/analysis" : "/analysis/new"} className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-primary">New analysis <ArrowRight className="size-3.5" /></Link></div>}
      </section>
    </div>
  </div>;
}
