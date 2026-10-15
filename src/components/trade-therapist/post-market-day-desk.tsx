"use client";

import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { motion, useReducedMotion } from "motion/react";
import { ScreenshotUpload } from "@/components/screenshot-upload";
import { RPotentialAnalysisSection } from "@/components/trade-therapist/r-potential-analysis";
import { PostMarketDayPicker } from "@/components/trade-therapist/post-market-day-picker";
import { ScreenshotGallery } from "@/components/trade-therapist/screenshot-gallery";
import { ArrowRight, Trophy } from "lucide-react";
import { bestTradeLogged } from "@/lib/reviews/day-recap";
import { useAccess } from "@/components/access/access-provider";
import { dayOverview, isDayReviewed, postMarketDates } from "@/lib/post-market/day-overview";
import { initialPostMarketStep, postMarketSteps, type PostMarketStep } from "@/lib/post-market/flow";
import { getBestTradeOfDay, getBestTradesOfDay, getRPotentialAnalyses, getTradeRuleChecks, saveBestTradeOfDay, type BestTradeListRow } from "@/lib/supabase/queries";
import { tradeR, formatTotalR, instrumentName } from "@/lib/journal/weeks";
import { inOrder, netRColor } from "@/lib/journal/colors";
import { cn } from "@/lib/utils";
import type { BestTradeOfDay, RPotentialAnalysis, ScreenshotGroup, TradeJournalEntry, TradeRuleCheck } from "@/lib/types";

type Draft = Pick<BestTradeOfDay, "taken_was_best" | "notes" | "post_market_analysis" | "screenshot_groups" | "review_step">;
const emptyGroups = (): ScreenshotGroup[] => [{ label: "HTF", urls: [] }, { label: "Entry", urls: [] }];
const blank = (): Draft => ({ taken_was_best: false, notes: "", post_market_analysis: "", screenshot_groups: emptyGroups(), review_step: null });
const displayDate = (key: string) => format(new Date(`${key}T12:00:00`), "EEE d");

/**
 * One day's Post Market. It opens on the day overview; the guided review only
 * starts when the trader asks for it (`autoStart` when they already did, e.g.
 * from the Today screen), so opening the Therapist never drops you into a question.
 */
export function PostMarketDayDesk({ date, trades, onDateChange, autoStart = false }: { date: string; trades: TradeJournalEntry[]; onDateChange: (date: string) => void; autoStart?: boolean }) {
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
      setStep(autoStart ? initialPostMarketStep(entry, entitlements.bestTrade) : "complete");
    }).catch(() => setSaveState("error")).finally(() => { if (active) setLoading(false); });
    return () => {
      active = false;
      if (timer.current) {
        clearTimeout(timer.current);
        const value = draftRef.current;
        void queue.current.catch(() => null).then(() => saveBestTradeOfDay({ date, ...value })).catch(() => {});
      }
    };
  }, [date, entitlements.bestTrade, autoStart]);

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

  const hasReview = isDayReviewed(reviews[date]) || draft.review_step === "complete";
  // A review left halfway resumes where it stopped instead of at the first question.
  const resumeStep = !hasReview && draft.review_step && draft.review_step !== "complete" && steps.includes(draft.review_step) ? draft.review_step : null;

  async function backToOverview() {
    if (await flush()) setStep("complete");
  }

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
        <div className="flex shrink-0 items-center gap-2">
          <button type="button" disabled={saveState === "saving" || uploading} onClick={() => void backToOverview()} className="rounded-lg px-2 py-1.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:text-primary disabled:opacity-40">Day overview</button>
          <PostMarketDayPicker date={date} tradesByDay={tradesByDay} reviews={reviews} onSelect={selectDate} disabled={uploading} />
        </div>
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

  const verdict: "unknown" | "taken" | "missed" = !knownVerdict ? "unknown" : draft.taken_was_best ? "taken" : "missed";
  const betterShots = draft.screenshot_groups.filter((group) => group.urls.length > 0);
  // When the trade taken was the best one, its own charts are the evidence.
  const takenShots: ScreenshotGroup[] = dayTrades.flatMap((trade) => (trade.screenshot_groups ?? [])
    .filter((group) => group.urls.length > 0)
    .map((group) => ({ label: dayTrades.length > 1 ? `${instrumentName(trade.instrument)} · ${group.label}` : group.label, urls: group.urls })));
  const reviewButton = <button disabled={saveState === "saving" || uploading} onClick={() => void move(resumeStep ?? steps[0])} className={cn("inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors disabled:opacity-40", hasReview ? "border border-border/60 text-foreground hover:border-primary/40 hover:text-primary" : "bg-primary text-primary-foreground hover:bg-primary/90")}>{hasReview ? "Edit review" : resumeStep ? "Continue review" : "Start review"}<ArrowRight className="h-3.5 w-3.5" /></button>;

  return <div className="h-full overflow-y-auto lg:overflow-hidden">
    <div className="flex min-h-full flex-col gap-3 lg:h-full">
      <header className="flex shrink-0 flex-wrap items-end justify-between gap-3 px-0.5">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-primary">Post Market · {hasReview ? "Reviewed" : resumeStep ? "Review in progress" : "Not reviewed"}</p>
          <h2 className="mt-1 truncate font-heading text-xl font-bold tracking-tight sm:text-2xl">{format(new Date(`${date}T12:00:00`), "EEEE d MMMM yyyy")}</h2>
        </div>
        <div className="flex items-center gap-2">
          {status && <span role="status" className={cn("text-[11px]", saveState === "error" ? "text-destructive" : "text-muted-foreground")}>{status}</span>}
          <PostMarketDayPicker date={date} tradesByDay={tradesByDay} reviews={reviews} onSelect={selectDate} disabled={uploading} />
          {reviewButton}
        </div>
      </header>

      <div className="grid shrink-0 gap-2 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <div className="grid grid-cols-5 gap-1.5" aria-label="Recent logged days">
          {recent.map((key) => {
            const entries = tradesByDay[key] ?? [];
            const net = entries.reduce((total, trade) => total + tradeR(trade), 0);
            const row = reviews[key];
            return <button key={key} type="button" onClick={() => void selectDate(key)} aria-current={key === date ? "date" : undefined} className={cn("min-w-0 rounded-xl border px-2 py-2 text-left transition-colors sm:px-3", key === date ? "border-primary/55 bg-primary/[.08]" : "border-border/60 bg-card/50 hover:border-primary/40")}>
              <span className="flex items-center justify-between gap-1"><span className="truncate text-[11px] font-semibold">{displayDate(key)}</span>{row?.taken_was_best ? <Trophy className="h-3 w-3 shrink-0 text-success" /> : bestTradeLogged(row) ? <Trophy className="h-3 w-3 shrink-0 text-ice" /> : null}</span>
              <span className="mt-0.5 block truncate text-[11px] font-semibold tabular-nums" style={{ color: entries.length ? netRColor(net) : undefined }}>{entries.length ? formatTotalR(net) : <span className="font-normal text-muted-foreground">No trade</span>}</span>
              <span className={cn("mt-1.5 block h-0.5 w-6 rounded-full", isDayReviewed(row) ? "bg-success" : "bg-border")} />
            </button>;
          })}
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <Metric label="Trades taken" value={String(summary.tradeCount)} detail={summary.tradeCount ? `${summary.winnerCount} winner${summary.winnerCount === 1 ? "" : "s"}` : "Stayed out"} />
          <Metric label="Realised R" value={formatTotalR(summary.netR)} detail="Journal result" color={netRColor(summary.netR)} />
          <Metric label="Observed MFE" value={summary.measuredCount ? `${summary.measuredMfeTotal.toFixed(2)}R` : "—"} detail={summary.winnerCount ? `${summary.measuredCount}/${summary.winnerCount} winners` : "No winners"} />
        </div>
      </div>

      <div className="grid flex-1 gap-3 lg:min-h-0 lg:grid-cols-[minmax(0,1.6fr)_minmax(300px,1fr)]">
        {entitlements.bestTrade ? (
          <section className={cn("flex min-h-[26rem] flex-col overflow-hidden rounded-2xl border bg-card/65 lg:min-h-0", verdict === "missed" ? "border-ice/30" : verdict === "taken" ? "border-success/25" : "border-border/60")}>
            <div className="flex shrink-0 items-start justify-between gap-3 px-5 pt-4">
              <div className="min-w-0">
                <p className={cn("flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[.16em]", verdict === "missed" ? "text-ice" : verdict === "taken" ? "text-success" : "text-muted-foreground")}><Trophy className="h-3 w-3" /> Best trade of the day</p>
                <h3 className="mt-1 font-heading text-lg font-bold tracking-tight">
                  {verdict === "unknown" ? "Not reviewed yet" : verdict === "taken" ? (dayTrades.length ? "Your trade was the best trade" : "Staying out was the best call") : "A better trade was available"}
                </h3>
              </div>
              {verdict !== "unknown" && <button type="button" onClick={() => void move(verdict === "missed" ? "screenshots" : "verdict")} className="shrink-0 text-[11px] font-semibold text-primary">{verdict === "missed" ? (betterShots.length ? "Edit charts" : "Add charts") : "Edit"}</button>}
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-3 px-5 pb-5 pt-3">
              {verdict === "unknown" ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/60 bg-background/25 p-6 text-center">
                  <p className="max-w-sm text-sm text-muted-foreground">{dayTrades.length ? "Was the trade you took the best one the market offered today? If not, save the charts of the better trade here." : "Was staying out the right call, or was there a trade worth taking?"}</p>
                  {reviewButton}
                </div>
              ) : verdict === "missed" ? (
                betterShots.length ? <ScreenshotGallery groups={betterShots} className="flex-1" /> : (
                  <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-ice/30 bg-ice/[.03] p-6 text-center">
                    <p className="max-w-sm text-sm text-muted-foreground">No charts of the better trade yet. Add the higher timeframe and the entry so you can recognise it next time.</p>
                    <button type="button" onClick={() => void move("screenshots")} className="rounded-lg border border-ice/40 px-3.5 py-2 text-xs font-semibold text-ice hover:bg-ice/10">Add charts</button>
                  </div>
                )
              ) : takenShots.length ? <ScreenshotGallery groups={takenShots} className="flex-1" /> : (
                <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border/60 bg-background/25 p-6 text-center">
                  <p className="max-w-sm text-sm text-muted-foreground">{dayTrades.length ? "No charts on this trade. Add them in the journal to keep the example." : "No trade, and that was right. Nothing to chart."}</p>
                </div>
              )}
              {verdict !== "unknown" && draft.notes.trim() && (
                <div className="shrink-0 rounded-xl border border-border/50 bg-background/30 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{verdict === "missed" ? "Why it was the better trade" : "Why this was the best decision"}</p>
                  <p className="mt-1 line-clamp-4 whitespace-pre-wrap text-sm leading-snug">{draft.notes}</p>
                </div>
              )}
            </div>
          </section>
        ) : (
          <section className="flex min-h-[20rem] flex-col rounded-2xl border border-border/60 bg-card/65 p-5 lg:min-h-0">
            <div className="flex justify-between gap-2"><h3 className="font-heading text-lg font-bold tracking-tight">Session review</h3><button onClick={() => void move("market")} className="text-[11px] font-semibold text-primary">Edit</button></div>
            <p className="mt-3 min-h-0 flex-1 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{draft.post_market_analysis || "What did the market offer, and how did you respond?"}</p>
          </section>
        )}

        <div className="flex min-h-0 flex-col gap-3">
          <section className="flex min-h-48 flex-1 flex-col rounded-2xl border border-border/60 bg-card/65 p-4 lg:min-h-0">
            <div className="flex items-center justify-between"><h3 className="text-sm font-bold">Trades on this day</h3><span className="text-xs tabular-nums text-muted-foreground">{summary.tradeCount}</span></div>
            {dayTrades.length ? <div className="mt-2 grid min-h-0 flex-1 content-start gap-1.5 overflow-y-auto pr-1">{dayTrades.map((trade) => {
              const record = observations[trade.id];
              return <div key={trade.id} className="flex min-w-0 items-center gap-2 rounded-lg border border-border/50 bg-background/35 px-2.5 py-2 text-xs">
                <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", trade.execution_quality === "good" ? "bg-success" : trade.execution_quality === "bad" ? "bg-destructive" : "bg-border")} title={trade.execution_quality ? `Execution ${trade.execution_quality}` : "Execution not rated"} />
                <div className="min-w-0 flex-1"><p className="truncate font-semibold">{instrumentName(trade.instrument)} <span className="font-normal capitalize text-muted-foreground">{trade.direction}</span></p><p className="truncate text-[10px] text-muted-foreground">{trade.execution_time || trade.session} · {trade.result === "win" ? `MFE ${record?.mfe_r == null ? "not recorded" : `${record.mfe_r.toFixed(2)}R`}` : trade.result === "loss" ? "Stopped out" : "Break-even"}{record?.planned_take_profit_r != null ? ` · Plan ${record.planned_take_profit_r}R` : ""}</p></div>
                <span className="shrink-0 font-bold tabular-nums" style={{ color: netRColor(tradeR(trade)) }}>{formatTotalR(tradeR(trade))}</span>
                {trade.result === "win" && <button type="button" onClick={() => void move("r")} className="shrink-0 text-[10px] font-semibold text-primary">R data</button>}
                <Link href={`/journal/${trade.id}?from=trade-therapist`} className="shrink-0 text-[10px] text-muted-foreground hover:text-primary">Trade</Link>
              </div>;
            })}</div> : <div className="flex min-h-0 flex-1 flex-col items-center justify-center py-4 text-center"><p className="text-sm font-semibold">No trades taken</p><p className="mt-1 text-xs text-muted-foreground">Nothing realised on this day.</p></div>}
          </section>
          {entitlements.bestTrade && <section className="shrink-0 rounded-2xl border border-border/60 bg-card/65 p-4">
            <div className="flex justify-between gap-2"><h3 className="text-sm font-bold">Session review</h3><button onClick={() => void move("market")} className="text-[11px] font-semibold text-primary">Edit</button></div>
            <p className="mt-1.5 line-clamp-4 whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">{draft.post_market_analysis || "What did the market offer, and how did you respond?"}</p>
          </section>}
          <section className="shrink-0 rounded-2xl border border-border/60 bg-card/65 p-4">
            <h3 className="text-sm font-bold">R Potential</h3>
            {summary.winnerCount ? <div className="mt-1.5 space-y-0.5 text-xs text-muted-foreground"><p>Avg MFE <strong className="text-foreground">{summary.averageMfe == null ? "—" : `${summary.averageMfe.toFixed(2)}R`}</strong> · Avg winner <strong className="text-foreground">{summary.averageWinnerR?.toFixed(2)}R</strong></p><p>Reached 2R <strong className="text-foreground">{summary.reached2R}/{summary.measuredCount}</strong> · 2.5R <strong className="text-foreground">{summary.reached25R}/{summary.measuredCount}</strong> measured</p></div> : <p className="mt-1.5 text-xs text-muted-foreground">No winning trades to analyse on this day.</p>}
          </section>
        </div>
      </div>
    </div>
  </div>;
}

function Metric({ label, value, detail, color }: { label: string; value: string; detail: string; color?: string }) {
  return <div className="min-w-0 rounded-xl border border-border/60 bg-card/65 px-2.5 py-2 sm:px-4"><p className="truncate text-[10px] text-muted-foreground">{label}</p><p className="truncate font-heading text-base font-bold tabular-nums sm:text-xl" style={{ color }}>{value}</p><p className="truncate text-[9px] text-muted-foreground sm:text-[11px]">{detail}</p></div>;
}
