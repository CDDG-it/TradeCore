"use client";

import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import Link from "next/link";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isFuture, isToday } from "date-fns";
import { motion, useReducedMotion } from "motion/react";
import { CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, ExternalLink, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScreenshotUpload } from "@/components/screenshot-upload";
import { RPotentialAnalysisSection } from "@/components/trade-therapist/r-potential-analysis";
import { initialPostMarketStep, postMarketSteps, type PostMarketStep } from "@/lib/post-market/flow";
import { useAccess } from "@/components/access/access-provider";
import { cn } from "@/lib/utils";
import { getBestTradeOfDay, getBestTradesOfDay, saveBestTradeOfDay, deleteBestTradeOfDay, getTradeRuleChecks, type BestTradeListRow } from "@/lib/supabase/queries";
import { tradeR, formatTotalR, instrumentName } from "@/lib/journal/weeks";
import { inOrder, resultBands, resultColor, alpha, netRColor } from "@/lib/journal/colors";
import type { BestTradeOfDay, ScreenshotGroup, TradeJournalEntry, TradeRuleCheck } from "@/lib/types";

type Step = PostMarketStep;
type Draft = Pick<BestTradeOfDay, "taken_was_best" | "notes" | "post_market_analysis" | "screenshot_groups" | "review_step">;

const emptyGroups = (): ScreenshotGroup[] => [{ label: "HTF", urls: [] }, { label: "Entry", urls: [] }];
const emptyDraft = (): Draft => ({ taken_was_best: false, notes: "", post_market_analysis: "", screenshot_groups: emptyGroups(), review_step: null });
const hasEntry = (row?: BestTradeListRow) => Boolean(row && (row.review_step === "complete" || row.taken_was_best || row.notes.trim() || row.post_market_analysis.trim()));

export function DailyBestTrade({ date, trades, onDateChange, onSaved }: {
  date: string;
  trades: TradeJournalEntry[];
  onDateChange: (date: string) => void;
  onSaved?: (date: string, entry: BestTradeOfDay | null) => void;
}) {
  const { entitlements } = useAccess();
  const bestTradeEnabled = entitlements.bestTrade;
  const reduceMotion = useReducedMotion();
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [step, setStep] = useState<Step>("verdict");
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);
  const [calendarWeek, setCalendarWeek] = useState(() => new Date(date + "T12:00:00"));
  const [bestByDay, setBestByDay] = useState<Record<string, BestTradeListRow>>({});
  const [ruleChecks, setRuleChecks] = useState<TradeRuleCheck[]>([]);
  const draftRef = useRef<Draft>(draft);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queue = useRef<Promise<BestTradeOfDay | null>>(Promise.resolve(null));
  const revision = useRef(0);
  const rFlushRef: MutableRefObject<(() => Promise<void>) | null> = useRef(null);

  const selectedDate = useMemo(() => new Date(date + "T12:00:00"), [date]);
  const tradesByDay = useMemo(() => {
    const map: Record<string, TradeJournalEntry[]> = {};
    for (const trade of trades) (map[trade.date_time.slice(0, 10)] ??= []).push(trade);
    return map;
  }, [trades]);
  const dayTrades = useMemo(() => inOrder(tradesByDay[date] ?? []), [tradesByDay, date]);
  const winners = useMemo(() => dayTrades.filter((trade) => trade.result === "win"), [dayTrades]);
  const steps = useMemo<Step[]>(() => postMarketSteps(bestTradeEnabled, draft.taken_was_best, winners.length),
  [bestTradeEnabled, draft.taken_was_best, winners.length]);
  const currentStep = steps.includes(step) ? step : steps[0];
  const stepIndex = steps.indexOf(currentStep);
  const dayR = dayTrades.reduce((total, trade) => total + tradeR(trade), 0);
  const weekStart = startOfWeek(calendarWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(calendarWeek, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const reviewedDays = weekDays.filter((day) => {
    const key = format(day, "yyyy-MM-dd");
    return (tradesByDay[key] ?? []).length > 0 && hasEntry(bestByDay[key]);
  }).length;
  const tradedDays = weekDays.filter((day) => (tradesByDay[format(day, "yyyy-MM-dd")] ?? []).length > 0).length;

  useEffect(() => {
    getBestTradesOfDay().then((rows) => setBestByDay(Object.fromEntries(rows.map((row) => [row.date.slice(0, 10), row])))).catch(() => {});
  }, []);

  useEffect(() => {
    let active = true;
    getBestTradeOfDay(date).then((entry) => {
      if (!active) return;
      const next: Draft = {
        taken_was_best: entry?.taken_was_best ?? false,
        notes: entry?.notes ?? "",
        post_market_analysis: entry?.post_market_analysis ?? "",
        screenshot_groups: entry?.screenshot_groups?.length ? entry.screenshot_groups : emptyGroups(),
        review_step: entry?.review_step ?? null,
      };
      draftRef.current = next;
      setDraft(next);
      setStep(initialPostMarketStep(entry, bestTradeEnabled));
    }).catch(() => setSaveState("error")).finally(() => { if (active) setLoading(false); });
    return () => {
      active = false;
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
        const value = draftRef.current;
        void queue.current.catch(() => null).then(() => saveBestTradeOfDay({
          date,
          taken_was_best: value.taken_was_best,
          notes: value.notes,
          post_market_analysis: value.post_market_analysis,
          screenshot_groups: bestTradeEnabled || value.screenshot_groups.some((group) => group.urls.length) ? value.screenshot_groups : [],
          review_step: value.review_step,
        })).catch(() => {});
      }
    };
  }, [date, bestTradeEnabled]);

  useEffect(() => {
    Promise.all(dayTrades.map((trade) => getTradeRuleChecks(trade.id)))
      .then((rows) => setRuleChecks(rows.flat())).catch(() => setRuleChecks([]));
  }, [dayTrades]);

  function persist(value: Draft): Promise<BestTradeOfDay> {
    const sequence = ++revision.current;
    setSaveState("saving");
    const next = queue.current.catch(() => null).then(() => saveBestTradeOfDay({
      date,
      taken_was_best: value.taken_was_best,
      notes: value.notes,
      post_market_analysis: value.post_market_analysis,
      screenshot_groups: bestTradeEnabled || value.screenshot_groups.some((group) => group.urls.length) ? value.screenshot_groups : [],
      review_step: value.review_step,
    }));
    queue.current = next;
    next.then((entry) => {
      setBestByDay((old) => ({ ...old, [date]: entry }));
      onSaved?.(date, entry);
      if (sequence === revision.current) setSaveState("saved");
    }).catch(() => { if (sequence === revision.current) setSaveState("error"); });
    return next;
  }

  function update(partial: Partial<Draft>) {
    const next = { ...draftRef.current, ...partial, review_step: currentStep };
    draftRef.current = next;
    setDraft(next);
    setSaveState("idle");
    revision.current += 1;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { timer.current = null; void persist(next).catch(() => {}); }, 700);
  }

  async function flush(nextStep?: Step): Promise<boolean> {
    if (uploadingScreenshot) return false;
    const pending = timer.current !== null;
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    const next = nextStep ? { ...draftRef.current, review_step: nextStep } : draftRef.current;
    try {
      if (rFlushRef.current) await rFlushRef.current();
      if (pending || nextStep) {
        draftRef.current = next;
        setDraft(next);
        await persist(next);
      } else {
        try { await queue.current; }
        catch { await persist(next); }
      }
      return true;
    } catch {
      setSaveState("error");
      return false;
    }
  }

  async function answerVerdict(answer: boolean) {
    const next = { ...draftRef.current, taken_was_best: answer, review_step: "why" as const };
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    try {
      await persist(next);
      draftRef.current = next;
      setDraft(next);
      setStep("why");
    } catch { setSaveState("error"); }
  }

  async function move(target: Step) {
    if (await flush(target)) setStep(target);
  }

  async function selectDate(nextDate: string) {
    if (nextDate === date) { setCalendarOpen(false); return; }
    if (!(await flush())) return;
    setCalendarOpen(false);
    onDateChange(nextDate);
  }

  async function clearDay() {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    setSaveState("saving");
    try {
      await queue.current.catch(() => null);
      await deleteBestTradeOfDay(date);
      const fresh = emptyDraft();
      draftRef.current = fresh; setDraft(fresh);
      setStep(bestTradeEnabled ? "verdict" : "market");
      setBestByDay((old) => { const copy = { ...old }; delete copy[date]; return copy; });
      setSaveState("idle");
      onSaved?.(date, null);
    } catch { setSaveState("error"); }
  }

  const textareaClass = "mt-5 min-h-48 w-full flex-1 resize-none rounded-xl border border-border/60 bg-background/40 px-4 py-4 text-sm leading-relaxed outline-none placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/10";
  const stepTitle: Record<Step, string> = {
    verdict: dayTrades.length ? "Was your trade the best trade?" : "Was staying out the best decision?",
    why: draft.taken_was_best ? "Why was this the best decision?" : "Why was another trade better?",
    market: "Post Market review",
    screenshots: "The best trade of the day",
    r: "R Potential Analysis",
    complete: "Review complete",
  };

  return <div className="flex min-h-[calc(100dvh-11rem)] flex-col gap-3 lg:h-full lg:min-h-0">
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
      <Dialog open={calendarOpen} onOpenChange={(open) => { setCalendarOpen(open); if (open) setCalendarWeek(selectedDate); }}>
        <button type="button" disabled={uploadingScreenshot} onClick={() => setCalendarOpen(true)} className="inline-flex h-9 items-center gap-2 rounded-lg border border-border/60 bg-card/70 px-3 text-xs font-semibold hover:border-primary/40 disabled:opacity-50">
          <CalendarDays className="h-4 w-4 text-primary" />{format(selectedDate, "EEEE, MMM d, yyyy")}<ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader><DialogTitle>Choose a review day</DialogTitle><DialogDescription>Switch between days and weeks. Changes are saved before opening another day.</DialogDescription></DialogHeader>
          <div className="flex items-center justify-between gap-2 text-xs">
            <div className="flex gap-1">
              <button type="button" onClick={() => setCalendarWeek(subWeeks(calendarWeek, 1))} aria-label="Previous week" className="rounded-lg border border-border/60 p-1.5 hover:text-primary"><ChevronLeft className="h-4 w-4" /></button>
              <button type="button" onClick={() => setCalendarWeek(addWeeks(calendarWeek, 1))} aria-label="Next week" className="rounded-lg border border-border/60 p-1.5 hover:text-primary"><ChevronRight className="h-4 w-4" /></button>
            </div>
            <span className="font-semibold">{format(weekStart, "MMM d")} – {format(weekEnd, "MMM d, yyyy")}</span>
            <span className="text-muted-foreground">{reviewedDays}/{tradedDays} reviewed</span>
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {weekDays.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const dayTradesFor = inOrder(tradesByDay[key] ?? []);
              const netR = dayTradesFor.reduce((total, trade) => total + tradeR(trade), 0);
              const future = isFuture(day) && !isToday(day);
              return <button key={key} type="button" disabled={future} onClick={() => void selectDate(key)} aria-label={`${format(day, "EEEE, MMMM d")}${hasEntry(bestByDay[key]) ? ", reviewed" : ""}`} className={cn("relative flex min-h-16 flex-col items-center justify-center rounded-lg border px-1 text-xs transition-colors", key === date ? "border-primary text-primary" : "border-border/60 hover:border-primary/40", future && "opacity-30")} style={dayTradesFor.length ? { background: resultBands(dayTradesFor, 12) } : undefined}>
                {dayTradesFor.length > 0 && <span aria-hidden className="absolute inset-x-0 top-0 flex h-[2px]">{dayTradesFor.map((trade) => <span key={trade.id} className="flex-1" style={{ background: resultColor(trade), boxShadow: `0 0 8px ${alpha(resultColor(trade), 45)}` }} />)}</span>}
                <span className="text-[9px] uppercase text-muted-foreground">{format(day, "EEE")}</span><span className="font-bold">{format(day, "d")}</span><span className="text-[9px] tabular-nums" style={{ color: dayTradesFor.length ? netRColor(netR) : undefined }}>{dayTradesFor.length ? formatTotalR(netR) : "—"}</span>
                {hasEntry(bestByDay[key]) && <Check className="absolute right-1 top-1 h-2.5 w-2.5 text-primary" />}
              </button>;
            })}
          </div>
          <button type="button" onClick={() => void selectDate(format(new Date(), "yyyy-MM-dd"))} className="justify-self-end text-xs font-semibold text-primary hover:underline">Today</button>
        </DialogContent>
      </Dialog>
      <span className="text-[11px] text-muted-foreground">{dayTrades.length ? `${dayTrades.length} trade${dayTrades.length === 1 ? "" : "s"} · ${formatTotalR(dayR)}` : "No trades taken"}</span>
    </div>

    {loading ? <div className="flex min-h-0 flex-1 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div> : <>
      <div className="flex shrink-0 items-center justify-between gap-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Post Market · {stepIndex + 1} / {steps.length}</span>
        <div className="flex gap-1" aria-label="Review progress">{steps.map((item, index) => <span key={item} className={cn("h-1 w-6 rounded-full", index <= stepIndex ? "bg-primary" : "bg-border")} />)}</div>
      </div>
      <motion.div key={currentStep} initial={{ opacity: 0, transform: reduceMotion ? "none" : "translateY(8px)" }} animate={{ opacity: 1, transform: "translateY(0px)" }} transition={{ duration: reduceMotion ? 0.15 : 0.2, ease: [0.23, 1, 0.32, 1] }} className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-border/60 bg-card/70" >
        <div className="mx-auto flex min-h-full max-w-3xl flex-col justify-center px-5 py-7 sm:px-9 sm:py-9">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">{currentStep === "verdict" || currentStep === "why" || currentStep === "screenshots" ? "Best Trade of the Day" : currentStep === "r" ? "Exit analysis" : "Daily review"}</p>
          <h2 className="mt-2 font-heading text-xl font-bold tracking-tight sm:text-2xl">{stepTitle[currentStep]}</h2>

          {currentStep === "verdict" && <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {([true, false] as const).map((answer) => <button key={String(answer)} type="button" disabled={saveState === "saving"} onClick={() => void answerVerdict(answer)} className="min-h-24 rounded-xl border border-border/60 bg-background/40 p-5 text-left text-base font-semibold transition-[border-color,background-color] duration-150 hover:border-primary/50 hover:bg-primary/5 disabled:opacity-50">
              {answer ? "Yes" : "No"}<span className="mt-1 block text-xs font-normal text-muted-foreground">{answer ? "Continue with what worked." : dayTrades.length ? "Review the better opportunity." : "Review the opportunity you chose to pass on."}</span>
            </button>)}
          </div>}

          {currentStep === "why" && <>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{draft.taken_was_best ? "Record the decision quality that made this the best available trade." : "Describe the better setup and why it was preferable."}</p>
            {dayTrades.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{dayTrades.map((trade) => <Link key={trade.id} href={`/journal/${trade.id}?from=trade-therapist`} className="inline-flex items-center gap-1 rounded-lg border border-border/60 px-2.5 py-1 text-xs hover:border-primary/40 hover:text-primary">{instrumentName(trade.instrument)} · {formatTotalR(tradeR(trade))}<ExternalLink className="h-3 w-3" /></Link>)}</div>}
            <textarea value={draft.notes} onChange={(event) => update({ notes: event.target.value })} onBlur={() => { if (timer.current) void flush(); }} placeholder={draft.taken_was_best ? "What made this the highest-quality decision?" : "What made the other setup better?"} className={textareaClass} />
          </>}

          {currentStep === "market" && <>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">What did the market offer, and how did you respond?</p>
            <textarea value={draft.post_market_analysis} onChange={(event) => update({ post_market_analysis: event.target.value })} onBlur={() => { if (timer.current) void flush(); }} placeholder="Your session reflection..." className={textareaClass} />
            {ruleChecks.length > 0 && <div className="mt-4 border-t border-border/50 pt-3"><p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Commitment and rule checks</p>{ruleChecks.map((check) => <div key={check.id} className="flex justify-between gap-3 py-1 text-xs"><span>{check.source_text_snapshot}</span><span className="shrink-0 capitalize text-muted-foreground">{check.status.replaceAll("_", " ")}</span></div>)}</div>}
          </>}

          {currentStep === "screenshots" && <>
            <p className="mt-2 text-xs text-muted-foreground">Document the higher timeframe read and entry of the better trade.</p>
            <div className="mt-5"><ScreenshotUpload groups={draft.screenshot_groups} onChange={(groups) => update({ screenshot_groups: groups })} onUploadingChange={setUploadingScreenshot} storageConfig={{ entityType: "best-trade", entityId: date }} /></div>
          </>}

          {currentStep === "r" && <RPotentialAnalysisSection key={date} trades={dayTrades} flushRef={rFlushRef} />}

          {currentStep === "complete" && <div className="mt-6 space-y-3 text-sm">
            {bestTradeEnabled && <div className="rounded-xl border border-border/60 bg-background/30 p-4"><p className="text-xs text-muted-foreground">Best trade decision</p><p className="mt-1 font-semibold">{draft.taken_was_best ? "Your decision was the best available" : "A better trade was available"}</p>{draft.notes && <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{draft.notes}</p>}</div>}
            <div className="rounded-xl border border-border/60 bg-background/30 p-4"><p className="text-xs text-muted-foreground">Session review</p><p className="mt-1 whitespace-pre-wrap leading-relaxed">{draft.post_market_analysis || "No written reflection yet."}</p></div>
            {winners.length > 0 && <p className="text-xs text-muted-foreground">R Potential observations: {winners.length} winning trade{winners.length === 1 ? "" : "s"}. Use Previous to revisit them.</p>}
            <button type="button" onClick={() => void clearDay()} className="text-xs text-muted-foreground hover:text-destructive">Clear this day’s best-trade review</button>
          </div>}
        </div>
      </motion.div>
      <div className="flex shrink-0 items-center justify-between gap-3 pb-1">
        <button type="button" disabled={stepIndex === 0 || saveState === "saving" || uploadingScreenshot} onClick={() => void move(steps[stepIndex - 1])} className="rounded-lg border border-border/60 px-4 py-2 text-xs font-semibold disabled:opacity-30">Previous</button>
        <span role="status" className={cn("min-w-16 text-center text-[11px]", saveState === "error" ? "text-destructive" : "text-muted-foreground")}>{uploadingScreenshot ? "Uploading..." : saveState === "saving" ? "Saving..." : saveState === "saved" ? "Saved" : saveState === "error" ? "Save failed. Retry by continuing." : ""}</span>
        {currentStep !== "verdict" && currentStep !== "complete" ? <button type="button" disabled={saveState === "saving" || uploadingScreenshot} onClick={() => void move(steps[stepIndex + 1])} className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50">{steps[stepIndex + 1] === "complete" ? "Finish review" : "Continue"}</button> : <span className="w-20" />}
      </div>
    </>}
  </div>;
}
