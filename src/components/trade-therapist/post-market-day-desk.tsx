"use client";

import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { motion, useReducedMotion } from "motion/react";
import { ScreenshotUpload } from "@/components/screenshot-upload";
import { RPotentialAnalysisSection } from "@/components/trade-therapist/r-potential-analysis";
import { PostMarketDayPicker } from "@/components/trade-therapist/post-market-day-picker";
import { useAccess } from "@/components/access/access-provider";
import { dayOverview, postMarketDates } from "@/lib/post-market/day-overview";
import { initialPostMarketStep, postMarketSteps, type PostMarketStep } from "@/lib/post-market/flow";
import { getBestTradeOfDay, getBestTradesOfDay, getRPotentialAnalyses, getTradeRuleChecks, saveBestTradeOfDay, type BestTradeListRow } from "@/lib/supabase/queries";
import { tradeR, formatTotalR, instrumentName } from "@/lib/journal/weeks";
import { inOrder, netRColor } from "@/lib/journal/colors";
import { cn } from "@/lib/utils";
import type { BestTradeOfDay, RPotentialAnalysis, ScreenshotGroup, TradeJournalEntry, TradeRuleCheck } from "@/lib/types";

type Draft = Pick<BestTradeOfDay, "taken_was_best" | "notes" | "post_market_analysis" | "screenshot_groups" | "review_step">;
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
  const [ruleChecks, setRuleChecks] = useState<TradeRuleCheck[]>([]);
  const [step, setStep] = useState<PostMarketStep>("verdict");
  const [uploading, setUploading] = useState(false);
  const reduceMotion = useReducedMotion();
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
  const steps = postMarketSteps(entitlements.bestTrade, draft.taken_was_best, dayTrades.filter((trade) => trade.result === "win").length);
  const currentStep = steps.includes(step) ? step : steps[0];
  const stepIndex = steps.indexOf(currentStep);
  const summary = dayOverview(dayTrades, observations);
  const today = format(new Date(), "yyyy-MM-dd");
  const recent = [...new Set([date, ...postMarketDates(trades, Object.values(reviews), today).slice(0, 4)])].sort((a, b) => b.localeCompare(a)).slice(0, 5);
  const chartCount = draft.screenshot_groups.reduce((count, group) => count + group.urls.length, 0);
  const status = uploading ? "Uploading..." : saveState === "saving" ? "Saving..." : saveState === "saved" ? "Saved" : saveState === "error" ? "Save failed. Try again." : "";

  useEffect(() => {
    getBestTradesOfDay().then((rows) => setReviews(Object.fromEntries(rows.map((row) => [row.date.slice(0, 10), row])))).catch(() => {});
  }, []);

  useEffect(() => {
    let active = true;
    getBestTradeOfDay(date).then((entry) => {
      if (!active) return;
      const value: Draft = { taken_was_best: entry?.taken_was_best ?? false, notes: entry?.notes ?? "", post_market_analysis: entry?.post_market_analysis ?? "", screenshot_groups: entry?.screenshot_groups?.length ? entry.screenshot_groups : emptyGroups(), review_step: entry?.review_step ?? null };
      draftRef.current = value;
      setDraft(value);
      setKnownVerdict(Boolean(entry && (entry.review_step !== null || entry.taken_was_best || entry.notes.trim() || entry.screenshot_groups?.some((group) => group.urls.length))));
      setStep(initialPostMarketStep(entry, entitlements.bestTrade));
    }).catch(() => setSaveState("error")).finally(() => { if (active) setLoading(false); });
    return () => {
      active = false;
      if (timer.current) {
        clearTimeout(timer.current);
        const value = draftRef.current;
        void queue.current.catch(() => null).then(() => saveBestTradeOfDay({ date, ...value })).catch(() => {});
      }
    };
  }, [date, entitlements.bestTrade]);

  useEffect(() => {
    let active = true;
    if (!winnerIds) return;
    getRPotentialAnalyses(winnerIds.split(",")).then((rows) => {
      if (active) setObservations(Object.fromEntries(rows.map((row) => [row.trade_id, row])));
    }).catch(() => {});
    return () => { active = false; };
  }, [winnerIds]);

  useEffect(() => {
    let active = true;
    Promise.all(dayTrades.map((trade) => getTradeRuleChecks(trade.id)))
      .then((rows) => { if (active) setRuleChecks(rows.flat()); })
      .catch(() => { if (active) setRuleChecks([]); });
    return () => { active = false; };
  }, [dayTrades]);

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
    const next = { ...draftRef.current, ...partial, review_step: currentStep } as Draft;
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
    const next: Draft = { ...draftRef.current, taken_was_best: value, review_step: "why" };
    try { await persist(next); draftRef.current = next; setDraft(next); setKnownVerdict(true); setStep("why"); }
    catch { setSaveState("error"); }
  }

  async function move(target: PostMarketStep) {
    if (await flush(target)) setStep(target);
  }

  async function selectDate(next: string): Promise<boolean> {
    if (!next || next > today) return false;
    if (next === date) return true;
    if (await flush()) { onDateChange(next); return true; }
    return false;
  }

  const hasReview = reviewed(reviews[date]) || draft.review_step === "complete";

  if (loading) return <div className="flex h-full items-center justify-center rounded-2xl border border-border/60 bg-card/60 text-xs text-muted-foreground">Loading day...</div>;

  if (currentStep !== "complete") {
    const titles: Record<PostMarketStep, string> = {
      verdict: dayTrades.length ? "Was your trade the best trade?" : "Was staying out the best choice?",
      why: draft.taken_was_best ? "Why was this the best decision?" : "What made another trade better?",
      market: "How did you respond to the market?",
      screenshots: "Document the better trade",
      r: "How far did the winning trades move?",
      complete: "Post Market review",
    };
    const eyebrow = currentStep === "r" ? "R Potential Analysis" : currentStep === "screenshots" ? "Best Trade of the Day" : "Post Market review";
    const next = steps[stepIndex + 1];
    return <div className="flex h-full min-h-0 flex-col gap-3">
      <header className="flex shrink-0 items-center justify-between gap-3 px-0.5">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-primary">Post Market · {format(new Date(`${date}T12:00:00`), "EEE, MMM d, yyyy")}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{dayTrades.length ? `${dayTrades.length} trade${dayTrades.length === 1 ? "" : "s"} · ${formatTotalR(summary.netR)} realised` : "No trades taken"}</p>
        </div>
        <PostMarketDayPicker date={date} tradesByDay={tradesByDay} reviews={reviews} onSelect={selectDate} disabled={uploading} />
      </header>
      <div className="flex shrink-0 items-center justify-between gap-4 px-0.5">
        <span className="text-[10px] font-semibold uppercase tracking-[.14em] text-muted-foreground">Step {stepIndex + 1} of {steps.length - 1}</span>
        <div className="flex gap-1" aria-label="Review progress">{steps.slice(0, -1).map((item, index) => <span key={item} className={cn("h-1 w-6 rounded-full transition-colors duration-200", index <= stepIndex ? "bg-primary" : "bg-border")} />)}</div>
      </div>
      <motion.section key={currentStep} initial={{ opacity: 0, transform: reduceMotion ? "none" : "translateY(6px)" }} animate={{ opacity: 1, transform: "translateY(0px)" }} transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }} className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/65 shadow-[0_24px_60px_-40px_rgba(0,0,0,.55)]">
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-5 sm:px-8 sm:py-7">
          <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col justify-center">
            <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-primary">{eyebrow}</p>
            <h2 className="mt-2 font-heading text-xl font-bold tracking-tight sm:text-2xl">{titles[currentStep]}</h2>
            {currentStep === "verdict" && <>
              <p className="mt-2 text-xs text-muted-foreground">Choose the answer that best describes this day.</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {([true, false] as const).map((choice) => <button key={String(choice)} type="button" disabled={saveState === "saving"} onClick={() => void answer(choice)} className={cn("min-h-28 rounded-xl border bg-background/35 p-5 text-left transition-[border-color,background-color] duration-150 hover:border-primary/50 hover:bg-primary/[.06] disabled:opacity-50", knownVerdict && draft.taken_was_best === choice ? "border-primary/50" : "border-border/60")}>
                  <span className="block text-base font-semibold">{choice ? "Yes" : "No"}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">{choice ? dayTrades.length ? "The trade taken was the best available." : "Staying out was the best decision." : "A better opportunity was available."}</span>
                </button>)}
              </div>
            </>}
            {currentStep === "why" && <>
              <p className="mt-2 text-xs text-muted-foreground">{draft.taken_was_best ? "Record why this decision was the strongest one available." : "Describe what made the other setup preferable."}</p>
              {dayTrades.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{dayTrades.map((trade) => <Link key={trade.id} href={`/journal/${trade.id}?from=trade-therapist`} className="rounded-md border border-border/60 px-2.5 py-1 text-[11px] hover:border-primary/40 hover:text-primary">{instrumentName(trade.instrument)} · {formatTotalR(tradeR(trade))}</Link>)}</div>}
              <textarea value={draft.notes} onChange={(event) => update({ notes: event.target.value })} onBlur={() => { if (timer.current) void flush(); }} placeholder={draft.taken_was_best ? "Why was this the best decision?" : "Why was the other trade better?"} className="mt-5 min-h-36 w-full resize-none rounded-xl border border-border/70 bg-background/35 p-4 text-sm outline-none focus:border-primary/50 sm:min-h-48" />
            </>}
            {currentStep === "market" && <>
              <p className="mt-2 text-xs text-muted-foreground">What did the market offer, and how did you respond?</p>
              <textarea value={draft.post_market_analysis} onChange={(event) => update({ post_market_analysis: event.target.value })} onBlur={() => { if (timer.current) void flush(); }} placeholder="Your session reflection..." className="mt-5 min-h-44 w-full resize-none rounded-xl border border-border/70 bg-background/35 p-4 text-sm outline-none focus:border-primary/50 sm:min-h-56" />
              {ruleChecks.length > 0 && <div className="mt-4 border-t border-border/50 pt-3"><p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Commitment and rule checks</p>{ruleChecks.map((check) => <div key={check.id} className="flex justify-between gap-3 py-1 text-xs"><span>{check.source_text_snapshot}</span><span className="shrink-0 capitalize text-muted-foreground">{check.status.replaceAll("_", " ")}</span></div>)}</div>}
            </>}
            {currentStep === "screenshots" && <>
              <p className="mt-2 text-xs text-muted-foreground">Keep the higher timeframe and entry evidence for the better setup.</p>
              <div className="mt-5"><ScreenshotUpload compact groups={draft.screenshot_groups} onChange={(groups) => update({ screenshot_groups: groups })} onUploadingChange={setUploading} storageConfig={{ entityType: "best-trade", entityId: date }} /></div>
            </>}
            {currentStep === "r" && <div className="mt-5"><RPotentialAnalysisSection key={date} trades={dayTrades} compact flushRef={rFlushRef} onSaved={(record) => setObservations((old) => ({ ...old, [record.trade_id]: record }))} /></div>}
          </div>
        </div>
        <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-border/60 px-5 py-3 sm:px-8">
          <button type="button" disabled={stepIndex === 0 || saveState === "saving" || uploading} onClick={() => void move(steps[stepIndex - 1])} className="text-xs font-semibold text-muted-foreground hover:text-primary disabled:opacity-30">Back</button>
          <span role="status" className={cn("text-center text-[11px]", saveState === "error" ? "text-destructive" : "text-muted-foreground")}>{status || "Autosave on"}</span>
          {currentStep === "verdict" ? <span className="w-20" /> : <button type="button" disabled={saveState === "saving" || uploading} onClick={() => void move(next)} className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-40">{next === "complete" ? "Finish review" : "Continue"}</button>}
        </footer>
      </motion.section>
    </div>;
  }

  return <div className="flex h-full min-h-0 flex-col gap-2">
    <div className="flex shrink-0 items-center justify-between gap-2">
      <div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[.14em] text-primary">Post Market</p><h2 className="truncate font-heading text-base font-bold sm:text-xl">{format(new Date(`${date}T12:00:00`), "EEEE, MMMM d, yyyy")}</h2></div>
      <PostMarketDayPicker date={date} tradesByDay={tradesByDay} reviews={reviews} onSelect={selectDate} disabled={uploading} />
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
      <section className="flex min-h-0 flex-col rounded-xl border border-border/60 bg-card/65 p-2.5 sm:p-4"><div className="flex items-center justify-between"><div><h3 className="text-xs font-bold sm:text-sm">Trades on this day</h3><p className="text-[10px] text-muted-foreground">Realised R and measured movement</p></div><span className="text-xs tabular-nums text-muted-foreground">{summary.tradeCount}</span></div>
        {dayTrades.length ? <div className="mt-1.5 grid min-h-0 flex-1 content-start gap-1 overflow-y-auto pr-1">{dayTrades.map((trade) => {
          const record = observations[trade.id];
          return <div key={trade.id} className="flex min-w-0 items-center gap-1.5 rounded-lg border border-border/50 bg-background/35 px-2 py-1.5 text-xs"><div className="min-w-0 flex-1"><p className="truncate font-semibold">{instrumentName(trade.instrument)} <span className="font-normal capitalize text-muted-foreground">{trade.direction}</span></p><p className="truncate text-[10px] text-muted-foreground">{trade.execution_time || trade.session} · {trade.result === "win" ? `MFE ${record?.mfe_r == null ? "not recorded" : `${record.mfe_r.toFixed(2)}R`}` : trade.result === "loss" ? "Stopped out" : "Break-even"}{record?.planned_take_profit_r != null ? ` · Plan ${record.planned_take_profit_r}R` : ""}</p></div><span className="shrink-0 font-bold tabular-nums" style={{ color: netRColor(tradeR(trade)) }}>{formatTotalR(tradeR(trade))}</span>{trade.result === "win" && <button type="button" onClick={() => void move("r")} className="shrink-0 text-[10px] font-semibold text-primary">R data</button>}<Link href={`/journal/${trade.id}?from=trade-therapist`} className="shrink-0 text-[10px] text-muted-foreground hover:text-primary">Trade</Link></div>;
        })}</div> : <div className="flex min-h-0 flex-1 flex-col items-center justify-center text-center"><p className="text-sm font-semibold">No trades taken</p><p className="mt-1 text-xs text-muted-foreground">No realised R or trade-level R Potential for this day.</p></div>}
      </section>
      <div className="grid min-h-0 grid-cols-3 gap-1.5 lg:grid-cols-1 lg:grid-rows-3 lg:gap-2">
        {entitlements.bestTrade && <section className="min-h-0 min-w-0 rounded-xl border border-border/60 bg-card/65 p-2 lg:p-3"><div className="flex justify-between gap-1"><h3 className="truncate text-[10px] font-bold lg:text-xs">Best trade</h3><button onClick={() => void move("verdict")} className="text-[10px] font-semibold text-primary">Edit</button></div><p className="mt-1 line-clamp-2 text-[10px] font-semibold lg:text-xs">{knownVerdict ? draft.taken_was_best ? dayTrades.length ? "Taken trade was best" : "Staying out was best" : "A better opportunity existed" : "Not reviewed yet"}</p><p className="mt-1 hidden line-clamp-2 text-[11px] text-muted-foreground lg:block">{draft.notes || "Record the reason behind this decision."}</p>{knownVerdict && !draft.taken_was_best ? <button onClick={() => void move("screenshots")} className="text-[10px] font-semibold text-primary">{chartCount} chart{chartCount === 1 ? "" : "s"}</button> : null}</section>}
        <section className={cn("min-h-0 min-w-0 rounded-xl border border-border/60 bg-card/65 p-2 lg:p-3", !entitlements.bestTrade && "col-span-2 lg:col-span-1 lg:row-span-2")}><div className="flex justify-between gap-1"><h3 className="truncate text-[10px] font-bold lg:text-xs">Session review</h3><button onClick={() => void move("market")} className="text-[10px] font-semibold text-primary">Edit</button></div><p className="mt-1 text-[10px] text-muted-foreground lg:hidden">{draft.post_market_analysis ? "Recorded" : "Not recorded"}</p><p className="mt-1 hidden line-clamp-3 whitespace-pre-wrap text-[11px] text-muted-foreground lg:block">{draft.post_market_analysis || "What did the market offer, and how did you respond?"}</p></section>
        <section className="min-h-0 min-w-0 rounded-xl border border-border/60 bg-card/65 p-2 lg:p-3"><h3 className="truncate text-[10px] font-bold lg:text-xs">R Potential</h3>{summary.winnerCount ? <div className="mt-1 space-y-0.5 text-[10px] text-muted-foreground"><p>MFE <strong className="text-foreground">{summary.averageMfe == null ? "—" : `${summary.averageMfe.toFixed(2)}R`}</strong><span className="hidden lg:inline"> · Winner <strong className="text-foreground">{summary.averageWinnerR?.toFixed(2)}R</strong></span></p><p className="hidden lg:block">Reached 2R <strong className="text-foreground">{summary.reached2R}/{summary.measuredCount}</strong> · 2.5R <strong className="text-foreground">{summary.reached25R}/{summary.measuredCount}</strong> measured</p></div> : <p className="mt-1 line-clamp-2 text-[10px] text-muted-foreground lg:text-[11px]">No winning trades to analyse today.</p>}</section>
      </div>
    </div>}
    <div className="flex shrink-0 items-center justify-between gap-2 text-[11px]"><span role="status" className={saveState === "error" ? "text-destructive" : "text-muted-foreground"}>{status || (hasReview ? "Review recorded" : "")}</span><button disabled={saveState === "saving" || uploading} onClick={() => void move(steps[0])} className="rounded-lg border border-primary/40 px-3 py-1.5 font-semibold text-primary disabled:opacity-40">Edit review</button></div>

  </div>;
}

function Metric({ label, value, detail, color }: { label: string; value: string; detail: string; color?: string }) {
  return <div className="min-w-0 rounded-xl border border-border/60 bg-card/65 px-2 py-1.5 sm:px-4 sm:py-2"><p className="truncate text-[10px] text-muted-foreground">{label}</p><p className="truncate font-heading text-base font-bold tabular-nums sm:text-xl" style={{ color }}>{value}</p><p className="truncate text-[9px] text-muted-foreground sm:text-[11px]">{detail}</p></div>;
}
