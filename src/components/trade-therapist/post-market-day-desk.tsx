"use client";

import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScreenshotUpload } from "@/components/screenshot-upload";
import { RPotentialAnalysisSection } from "@/components/trade-therapist/r-potential-analysis";
import { useAccess } from "@/components/access/access-provider";
import { dayOverview, postMarketDates } from "@/lib/post-market/day-overview";
import { getBestTradeOfDay, getBestTradesOfDay, getRPotentialAnalyses, saveBestTradeOfDay, type BestTradeListRow } from "@/lib/supabase/queries";
import { tradeR, formatTotalR, instrumentName } from "@/lib/journal/weeks";
import { inOrder, netRColor } from "@/lib/journal/colors";
import { cn } from "@/lib/utils";
import type { BestTradeOfDay, RPotentialAnalysis, ScreenshotGroup, TradeJournalEntry } from "@/lib/types";

type Draft = Pick<BestTradeOfDay, "taken_was_best" | "notes" | "post_market_analysis" | "screenshot_groups" | "review_step">;
type Panel = "best" | "market" | "charts" | "r" | null;
const emptyGroups = (): ScreenshotGroup[] => [{ label: "HTF", urls: [] }, { label: "Entry", urls: [] }];
const blank = (): Draft => ({ taken_was_best: false, notes: "", post_market_analysis: "", screenshot_groups: emptyGroups(), review_step: null });
const reviewed = (row?: BestTradeListRow) => Boolean(row && (row.review_step === "complete" || (row.review_step === null && (row.taken_was_best || row.notes.trim() || row.post_market_analysis.trim()))));
const displayDate = (key: string) => format(new Date(`${key}T12:00:00`), "EEE d");

export function PostMarketDayDesk({ date, trades, onDateChange }: { date: string; trades: TradeJournalEntry[]; onDateChange: (date: string) => void }) {
  const { entitlements } = useAccess();
  const [draft, setDraft] = useState<Draft>(blank);
  const [knownVerdict, setKnownVerdict] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [reviews, setReviews] = useState<Record<string, BestTradeListRow>>({});
  const [observations, setObservations] = useState<Record<string, RPotentialAnalysis>>({});
  const [panel, setPanel] = useState<Panel>(null);
  const [rTradeId, setRTradeId] = useState<string | null>(null);
  const [tradePage, setTradePage] = useState(0);
  const [visibleTrades, setVisibleTrades] = useState(4);
  const tradePanelRef = useRef<HTMLElement>(null);
  const [uploading, setUploading] = useState(false);
  const draftRef = useRef(draft);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queue = useRef<Promise<BestTradeOfDay | null>>(Promise.resolve(null));
  const revision = useRef(0);
  const rFlushRef: MutableRefObject<(() => Promise<void>) | null> = useRef(null);

  const tradesByDay = useMemo(() => {
    const map: Record<string, TradeJournalEntry[]> = {};
    for (const trade of trades) (map[trade.date_time.slice(0, 10)] ??= []).push(trade);
    return map;
  }, [trades]);
  const dayTrades = useMemo(() => inOrder(tradesByDay[date] ?? []), [tradesByDay, date]);
  const winnerIds = dayTrades.filter((trade) => trade.result === "win").map((trade) => trade.id).join(",");
  const summary = dayOverview(dayTrades, observations);
  const today = format(new Date(), "yyyy-MM-dd");
  const recent = [...new Set([date, ...postMarketDates(trades, Object.values(reviews), today).slice(0, 4)])].sort((a, b) => b.localeCompare(a)).slice(0, 5);
  const chartCount = draft.screenshot_groups.reduce((count, group) => count + group.urls.length, 0);
  const selectedRTrade = dayTrades.find((trade) => trade.id === rTradeId);
  const tradePages = Math.max(1, Math.ceil(dayTrades.length / visibleTrades));
  const status = uploading ? "Uploading..." : saveState === "saving" ? "Saving..." : saveState === "saved" ? "Saved" : saveState === "error" ? "Save failed. Try again." : "";

  useEffect(() => {
    getBestTradesOfDay().then((rows) => setReviews(Object.fromEntries(rows.map((row) => [row.date.slice(0, 10), row])))).catch(() => {});
  }, []);

  useEffect(() => {
    const panel = tradePanelRef.current;
    if (!panel) return;
    const observer = new ResizeObserver(() => {
      const rows = Math.max(1, Math.min(4, Math.floor((panel.clientHeight - 92) / 44)));
      setVisibleTrades(rows);
      setTradePage((page) => Math.min(page, Math.max(0, Math.ceil(dayTrades.length / rows) - 1)));
    });
    observer.observe(panel);
    return () => observer.disconnect();
  }, [dayTrades.length, loading]);

  useEffect(() => {
    let active = true;
    getBestTradeOfDay(date).then((entry) => {
      if (!active) return;
      const value: Draft = { taken_was_best: entry?.taken_was_best ?? false, notes: entry?.notes ?? "", post_market_analysis: entry?.post_market_analysis ?? "", screenshot_groups: entry?.screenshot_groups?.length ? entry.screenshot_groups : emptyGroups(), review_step: entry?.review_step ?? null };
      draftRef.current = value;
      setDraft(value);
      setKnownVerdict(Boolean(entry && (entry.review_step !== null || entry.taken_was_best || entry.notes.trim() || entry.screenshot_groups?.some((group) => group.urls.length))));
    }).catch(() => setSaveState("error")).finally(() => { if (active) setLoading(false); });
    return () => {
      active = false;
      if (timer.current) {
        clearTimeout(timer.current);
        const value = draftRef.current;
        void queue.current.catch(() => null).then(() => saveBestTradeOfDay({ date, ...value })).catch(() => {});
      }
    };
  }, [date]);

  useEffect(() => {
    let active = true;
    if (!winnerIds) return;
    getRPotentialAnalyses(winnerIds.split(",")).then((rows) => {
      if (active) setObservations(Object.fromEntries(rows.map((row) => [row.trade_id, row])));
    }).catch(() => {});
    return () => { active = false; };
  }, [winnerIds]);

  function persist(value: Draft): Promise<BestTradeOfDay> {
    const sequence = ++revision.current;
    setSaveState("saving");
    const next = queue.current.catch(() => null).then(() => saveBestTradeOfDay({ date, ...value }));
    queue.current = next;
    next.then((entry) => {
      setReviews((old) => ({ ...old, [date]: entry }));
      if (sequence === revision.current) setSaveState("saved");
    }).catch(() => { if (sequence === revision.current) setSaveState("error"); });
    return next;
  }

  function update(partial: Partial<Draft>) {
    const next = { ...draftRef.current, ...partial, review_step: draftRef.current.review_step ?? "verdict" } as Draft;
    draftRef.current = next;
    setDraft(next);
    setSaveState("idle");
    revision.current += 1;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { timer.current = null; void persist(next).catch(() => {}); }, 700);
  }

  async function flush(step?: Draft["review_step"]): Promise<boolean> {
    if (uploading) return false;
    const pending = timer.current !== null;
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    const next = step ? { ...draftRef.current, review_step: step } : draftRef.current;
    try {
      if (rFlushRef.current) await rFlushRef.current();
      if (pending || step) { draftRef.current = next; setDraft(next); await persist(next); }
      else { try { await queue.current; } catch { await persist(next); } }
      return true;
    } catch { setSaveState("error"); return false; }
  }

  async function answer(value: boolean) {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    const next: Draft = { ...draftRef.current, taken_was_best: value, review_step: draftRef.current.review_step ?? "verdict" };
    try { await persist(next); draftRef.current = next; setDraft(next); setKnownVerdict(true); }
    catch { setSaveState("error"); }
  }

  async function selectDate(next: string) {
    if (!next || next === date || next > today) return;
    if (await flush()) { setPanel(null); onDateChange(next); }
  }

  async function closePanel() { const saved = await flush(); if (saved) setPanel(null); return saved; }
  const hasReview = reviewed(reviews[date]) || draft.review_step === "complete";

  return <div className="flex h-full min-h-0 flex-col gap-2 overflow-hidden">
    <div className="flex shrink-0 items-center justify-between gap-2">
      <div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[.14em] text-primary">Post Market</p><h2 className="truncate font-heading text-base font-bold sm:text-xl">{format(new Date(`${date}T12:00:00`), "EEEE, MMMM d, yyyy")}</h2></div>
      <label className="shrink-0 text-[11px] text-muted-foreground">Choose day <input type="date" value={date} max={today} onChange={(event) => void selectDate(event.target.value)} disabled={uploading} className="ml-1 h-8 rounded-lg border border-border/70 bg-card px-1.5 text-xs text-foreground outline-none focus:border-primary/50" /></label>
    </div>
    <div className="grid shrink-0 grid-cols-5 gap-1" aria-label="Recent logged days">
      {recent.map((key) => {
        const entries = tradesByDay[key] ?? [];
        const net = entries.reduce((total, trade) => total + tradeR(trade), 0);
        return <button key={key} type="button" onClick={() => void selectDate(key)} aria-current={key === date ? "date" : undefined} className={cn("min-w-0 rounded-lg border px-1.5 py-1.5 text-left sm:px-3", key === date ? "border-primary/60 bg-primary/[.08]" : "border-border/60 bg-card/50 hover:border-primary/40")}><span className="block truncate text-[11px] font-semibold">{displayDate(key)}</span><span className="block truncate text-[10px] tabular-nums" style={{ color: entries.length ? netRColor(net) : undefined }}>{entries.length ? formatTotalR(net) : "No trade"}</span></button>;
      })}
    </div>
    <div className="grid shrink-0 grid-cols-3 gap-1 sm:gap-2">
      <Metric label="Trades taken" value={String(summary.tradeCount)} detail={summary.tradeCount ? `${summary.winnerCount} winners` : "Stayed out"} />
      <Metric label="Realised R" value={formatTotalR(summary.netR)} detail="Journal result" color={netRColor(summary.netR)} />
      <Metric label="Observed MFE" value={summary.measuredCount ? `${summary.measuredMfeTotal.toFixed(2)}R` : "—"} detail={summary.winnerCount ? `${summary.measuredCount}/${summary.winnerCount} winners` : "No winners"} />
    </div>
    {loading ? <p className="flex flex-1 items-center justify-center text-xs text-muted-foreground">Loading day...</p> : <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_5.5rem] gap-2 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,.7fr)] lg:grid-rows-1">
      <section ref={tradePanelRef} className="flex min-h-0 flex-col rounded-xl border border-border/60 bg-card/65 p-2.5 sm:p-4"><div className="flex items-center justify-between"><div><h3 className="text-xs font-bold sm:text-sm">Trades on this day</h3><p className="text-[10px] text-muted-foreground">Realised R and measured movement</p></div><span className="text-xs tabular-nums text-muted-foreground">{summary.tradeCount}</span></div>
        {dayTrades.length ? <div className="mt-1.5 grid min-h-0 flex-1 content-start gap-1">{dayTrades.slice(tradePage * visibleTrades, tradePage * visibleTrades + visibleTrades).map((trade) => {
          const record = observations[trade.id];
          return <div key={trade.id} className="flex min-w-0 items-center gap-1.5 rounded-lg border border-border/50 bg-background/35 px-2 py-1.5 text-xs"><div className="min-w-0 flex-1"><p className="truncate font-semibold">{instrumentName(trade.instrument)} <span className="font-normal capitalize text-muted-foreground">{trade.direction}</span></p><p className="truncate text-[10px] text-muted-foreground">{trade.execution_time || trade.session} · {trade.result === "win" ? `MFE ${record?.mfe_r == null ? "not recorded" : `${record.mfe_r.toFixed(2)}R`}` : trade.result === "loss" ? "Stopped out" : "Break-even"}{record?.planned_take_profit_r != null ? ` · Plan ${record.planned_take_profit_r}R` : ""}</p></div><span className="shrink-0 font-bold tabular-nums" style={{ color: netRColor(tradeR(trade)) }}>{formatTotalR(tradeR(trade))}</span>{trade.result === "win" && <button type="button" onClick={() => { setRTradeId(trade.id); setPanel("r"); }} className="shrink-0 text-[10px] font-semibold text-primary">R data</button>}<Link href={`/journal/${trade.id}?from=trade-therapist`} className="shrink-0 text-[10px] text-muted-foreground hover:text-primary">Trade</Link></div>;
        })}</div> : <div className="flex min-h-0 flex-1 flex-col items-center justify-center text-center"><p className="text-sm font-semibold">No trades taken</p><p className="mt-1 text-xs text-muted-foreground">No realised R or trade-level R Potential for this day.</p></div>}
        {tradePages > 1 && <div className="mt-1.5 flex shrink-0 items-center justify-between border-t border-border/50 pt-1.5 text-[10px]"><button disabled={tradePage === 0} onClick={() => setTradePage((page) => page - 1)} className="font-semibold text-primary disabled:opacity-30">Previous trades</button><span className="tabular-nums text-muted-foreground">{tradePage + 1}/{tradePages}</span><button disabled={tradePage === tradePages - 1} onClick={() => setTradePage((page) => page + 1)} className="font-semibold text-primary disabled:opacity-30">Next trades</button></div>}
      </section>
      <div className="grid min-h-0 grid-cols-3 gap-1.5 lg:grid-cols-1 lg:grid-rows-3 lg:gap-2">
        {entitlements.bestTrade && <section className="min-h-0 min-w-0 rounded-xl border border-border/60 bg-card/65 p-2 lg:p-3"><div className="flex justify-between gap-1"><h3 className="truncate text-[10px] font-bold lg:text-xs">Best trade</h3><button onClick={() => setPanel("best")} className="text-[10px] font-semibold text-primary">Edit</button></div><p className="mt-1 line-clamp-2 text-[10px] font-semibold lg:text-xs">{knownVerdict ? draft.taken_was_best ? dayTrades.length ? "Taken trade was best" : "Staying out was best" : "A better opportunity existed" : "Not reviewed yet"}</p><p className="mt-1 hidden line-clamp-2 text-[11px] text-muted-foreground lg:block">{draft.notes || "Record the reason behind this decision."}</p>{knownVerdict && !draft.taken_was_best ? <button onClick={() => setPanel("charts")} className="text-[10px] font-semibold text-primary">{chartCount} chart{chartCount === 1 ? "" : "s"}</button> : null}</section>}
        <section className={cn("min-h-0 min-w-0 rounded-xl border border-border/60 bg-card/65 p-2 lg:p-3", !entitlements.bestTrade && "col-span-2 lg:col-span-1 lg:row-span-2")}><div className="flex justify-between gap-1"><h3 className="truncate text-[10px] font-bold lg:text-xs">Session review</h3><button onClick={() => setPanel("market")} className="text-[10px] font-semibold text-primary">Edit</button></div><p className="mt-1 text-[10px] text-muted-foreground lg:hidden">{draft.post_market_analysis ? "Recorded" : "Not recorded"}</p><p className="mt-1 hidden line-clamp-3 whitespace-pre-wrap text-[11px] text-muted-foreground lg:block">{draft.post_market_analysis || "What did the market offer, and how did you respond?"}</p></section>
        <section className="min-h-0 min-w-0 rounded-xl border border-border/60 bg-card/65 p-2 lg:p-3"><h3 className="truncate text-[10px] font-bold lg:text-xs">R Potential</h3>{summary.winnerCount ? <div className="mt-1 space-y-0.5 text-[10px] text-muted-foreground"><p>MFE <strong className="text-foreground">{summary.averageMfe == null ? "—" : `${summary.averageMfe.toFixed(2)}R`}</strong><span className="hidden lg:inline"> · Winner <strong className="text-foreground">{summary.averageWinnerR?.toFixed(2)}R</strong></span></p><p className="hidden lg:block">Reached 2R <strong className="text-foreground">{summary.reached2R}/{summary.measuredCount}</strong> · 2.5R <strong className="text-foreground">{summary.reached25R}/{summary.measuredCount}</strong> measured</p></div> : <p className="mt-1 line-clamp-2 text-[10px] text-muted-foreground lg:text-[11px]">No winning trades to analyse today.</p>}</section>
      </div>
    </div>}
    <div className="flex shrink-0 items-center justify-between gap-2 text-[11px]"><span role="status" className={saveState === "error" ? "text-destructive" : "text-muted-foreground"}>{status}</span><button disabled={saveState === "saving" || uploading || (entitlements.bestTrade && !knownVerdict)} onClick={() => void flush("complete")} className={cn("rounded-lg border px-3 py-1.5 font-semibold disabled:opacity-40", hasReview ? "border-primary/40 text-primary" : "border-border/70 hover:border-primary/40")}>{hasReview ? "Review recorded" : "Mark day reviewed"}</button></div>

    <Dialog open={panel === "best"} onOpenChange={(open) => { if (!open) void closePanel(); }}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Best trade decision</DialogTitle><DialogDescription>{dayTrades.length ? "Was the trade you took the best available?" : "Was staying out of the market the best choice?"}</DialogDescription></DialogHeader><div className="grid grid-cols-2 gap-2"><button onClick={() => void answer(true)} className={cn("rounded-lg border px-3 py-2 text-xs font-semibold", knownVerdict && draft.taken_was_best ? "border-primary bg-primary/10 text-primary" : "border-border/70")}>Yes</button><button onClick={() => void answer(false)} className={cn("rounded-lg border px-3 py-2 text-xs font-semibold", knownVerdict && !draft.taken_was_best ? "border-primary bg-primary/10 text-primary" : "border-border/70")}>No</button></div><label className="text-xs font-semibold">{draft.taken_was_best ? "Why was this the best decision?" : "What made another setup better?"}<textarea rows={4} value={draft.notes} onChange={(event) => update({ notes: event.target.value })} onBlur={() => { if (timer.current) void flush(); }} className="mt-2 w-full resize-none rounded-lg border border-border/70 bg-background/40 p-3 text-sm font-normal outline-none focus:border-primary/50" /></label>{knownVerdict && !draft.taken_was_best && <button onClick={() => { void closePanel().then((saved) => { if (saved) setPanel("charts"); }); }} className="text-left text-xs font-semibold text-primary">Manage better-trade charts ({chartCount})</button>}<p role="status" className="text-[11px] text-muted-foreground">{status}</p></DialogContent></Dialog>
    <Dialog open={panel === "market"} onOpenChange={(open) => { if (!open) void closePanel(); }}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Session review</DialogTitle><DialogDescription>What did the market offer, and how did you respond?</DialogDescription></DialogHeader><textarea rows={7} value={draft.post_market_analysis} onChange={(event) => update({ post_market_analysis: event.target.value })} onBlur={() => { if (timer.current) void flush(); }} className="w-full resize-none rounded-lg border border-border/70 bg-background/40 p-3 text-sm outline-none focus:border-primary/50" /><p role="status" className="text-[11px] text-muted-foreground">{status}</p></DialogContent></Dialog>
    <Dialog open={panel === "charts"} onOpenChange={(open) => { if (!open) void closePanel(); }}><DialogContent className="max-h-[calc(100dvh-2rem)] max-w-2xl overflow-hidden"><DialogHeader><DialogTitle>Better-trade charts</DialogTitle><DialogDescription>Existing charts remain available here.</DialogDescription></DialogHeader><ScreenshotUpload compact groups={draft.screenshot_groups} onChange={(groups) => update({ screenshot_groups: groups })} onUploadingChange={setUploading} storageConfig={{ entityType: "best-trade", entityId: date }} /><p role="status" className="text-[11px] text-muted-foreground">{status}</p></DialogContent></Dialog>
    <Dialog open={panel === "r"} onOpenChange={(open) => { if (!open) void closePanel(); }}><DialogContent className="max-h-[calc(100dvh-2rem)] max-w-2xl overflow-hidden"><DialogHeader><DialogTitle>R Potential Analysis</DialogTitle><DialogDescription>Measure favorable movement before the original idea was invalidated.</DialogDescription></DialogHeader>{selectedRTrade && <RPotentialAnalysisSection key={selectedRTrade.id} trades={[selectedRTrade]} compact flushRef={rFlushRef} onSaved={(record) => setObservations((old) => ({ ...old, [record.trade_id]: record }))} />}</DialogContent></Dialog>
  </div>;
}

function Metric({ label, value, detail, color }: { label: string; value: string; detail: string; color?: string }) {
  return <div className="min-w-0 rounded-xl border border-border/60 bg-card/65 px-2 py-1.5 sm:px-4 sm:py-2"><p className="truncate text-[10px] text-muted-foreground">{label}</p><p className="truncate font-heading text-base font-bold tabular-nums sm:text-xl" style={{ color }}>{value}</p><p className="truncate text-[9px] text-muted-foreground sm:text-[11px]">{detail}</p></div>;
}
