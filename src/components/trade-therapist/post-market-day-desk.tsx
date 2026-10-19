"use client";

import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ScreenshotUpload } from "@/components/screenshot-upload";
import { RPotentialAnalysisSection } from "@/components/trade-therapist/r-potential-analysis";
import { PostMarketDayPicker } from "@/components/trade-therapist/post-market-day-picker";
import { ScreenshotGallery } from "@/components/trade-therapist/screenshot-gallery";
import { ArrowRight, Check, Target, Trophy } from "lucide-react";
import { EASE_OUT, MotionButton, PRESS } from "@/components/trade-therapist/motion-button";
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

const STEP_LABELS: Record<PostMarketStep, string> = { verdict: "Verdict", why: "Reasoning", market: "Session", screenshots: "Charts", r: "R potential", complete: "Done" };
const STEP_VARIANTS = {
  enter: (direction: number) => ({ opacity: 0, x: 28 * direction }),
  center: { opacity: 1, x: 0 },
  exit: (direction: number) => ({ opacity: 0, x: -28 * direction }),
};
const WHY_TAKEN_CHIPS = ["Clean higher-timeframe level", "Waited for confirmation", "Playbook setup", "Right session and timing", "Risk clearly defined"];
const WHY_MISSED_CHIPS = ["Cleaner higher-timeframe level", "Better risk to reward", "Clearer confirmation", "I was in another trade", "Hesitated on the entry", "Not in my playbook yet"];
const MARKET_CHIPS = ["Trend day", "Range day", "News-driven volatility", "Stayed patient", "Followed my plan", "Forced a trade", "Exited too early", "Chased an entry"];
const wordCount = (text: string) => (text.trim() ? text.trim().split(/\s+/).length : 0);
const chipLine = (chip: string) => `• ${chip}`;
const hasChip = (text: string, chip: string) => text.split("\n").some((line) => line.trim() === chipLine(chip));
// Quick-add phrases sit as their own bullet line, so a second tap takes them back out.
const toggleChip = (text: string, chip: string) => hasChip(text, chip)
  ? text.split("\n").filter((line) => line.trim() !== chipLine(chip)).join("\n")
  : `${text.trimEnd() ? `${text.trimEnd()}\n` : ""}${chipLine(chip)}`;

/**
 * One day's Post Market. It opens on the day overview; the guided review only
 * starts when the trader asks for it (`autoStart` when they already did, e.g.
 * from the Today screen), so opening the Therapist never drops you into a question.
 */
export function PostMarketDayDesk({ date, trades, onDateChange, autoStart = false }: { date: string; trades: TradeJournalEntry[]; onDateChange: (date: string) => void; autoStart?: boolean }) {
  const { entitlements } = useAccess();
  const [draft, setDraft] = useState<Draft>(blank);
  const [knownVerdict, setKnownVerdict] = useState(false);
  /* The day whose review is on screen. Switching days keeps the desk mounted
     and the previous day visible (dimmed) until the next one has loaded, so
     the layout never collapses to a loading line and rebuilds. */
  const [loadedDate, setLoadedDate] = useState<string | null>(null);
  const loading = loadedDate === null;
  const switching = !loading && loadedDate !== date;
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [reviews, setReviews] = useState<Record<string, BestTradeListRow>>({});
  const [observations, setObservations] = useState<Record<string, RPotentialAnalysis>>({});
  const [ruleChecks, setRuleChecks] = useState<TradeRuleCheck[]>([]);
  const [step, setStep] = useState<PostMarketStep>("verdict");
  const [direction, setDirection] = useState(1);
  const [justFinished, setJustFinished] = useState(false);
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
      setJustFinished(false);
      setSaveState("idle");
    }).catch(() => { if (active) setSaveState("error"); }).finally(() => { if (active) setLoadedDate(date); });
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
    try { await persist(next); draftRef.current = next; setDraft(next); setKnownVerdict(true); setDirection(1); setStep("why"); }
    catch { setSaveState("error"); }
  }

  async function move(target: PostMarketStep) {
    if (await flush(target)) setStep(target);
  }

  /** Step within the flow, sliding the way you are going; finishing celebrates once on the overview. */
  async function go(target: PostMarketStep) {
    const forward = steps.indexOf(target) >= steps.indexOf(currentStep);
    setDirection(forward ? 1 : -1);
    if (await flush(target)) {
      setStep(target);
      if (target === "complete") { setJustFinished(true); setTimeout(() => setJustFinished(false), 3600); }
    }
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

  // Keyboard: Y / N answers the verdict, Ctrl/⌘ + Enter moves on from a written step.
  useEffect(() => {
    if (loading || switching || currentStep === "complete") return;
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing = target && (target.tagName === "TEXTAREA" || target.tagName === "INPUT" || target.isContentEditable);
      if (currentStep === "verdict" && !typing && !event.metaKey && !event.ctrlKey && !event.altKey) {
        const key = event.key.toLowerCase();
        if (key === "y" || key === "n") { event.preventDefault(); void answer(key === "y"); }
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        const next = steps[steps.indexOf(currentStep) + 1];
        if (next) { event.preventDefault(); void go(next); }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

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
    const hints: Record<PostMarketStep, string> = {
      verdict: "Be honest: this is the one question the whole review hangs on.",
      why: draft.taken_was_best ? "Name what made this the strongest decision available." : "Name what the other setup had that yours did not.",
      market: "What did the market offer today, and how did you respond to it?",
      screenshots: "Keep the higher timeframe and the entry, so you recognise it next time.",
      r: "Measure how far each winner ran, against what you banked.",
      complete: "",
    };
    const eyebrow = currentStep === "r" ? "R Potential Analysis" : currentStep === "screenshots" ? "Best Trade of the Day" : "Post Market review";
    const next = steps[stepIndex + 1];
    const flowSteps = steps.slice(0, -1);
    const reachedIndex = Math.max(stepIndex, draft.review_step ? steps.indexOf(draft.review_step) : 0);
    const busy = saveState === "saving" || uploading;
    const progress = flowSteps.length ? (stepIndex / flowSteps.length) * 100 : 0;
    const chips = currentStep === "why" ? (draft.taken_was_best ? WHY_TAKEN_CHIPS : WHY_MISSED_CHIPS) : currentStep === "market" ? MARKET_CHIPS : [];
    const textField = currentStep === "why" ? "notes" : currentStep === "market" ? "post_market_analysis" : null;
    const text = textField ? draft[textField] : "";

    return <div aria-busy={switching} className={cn("flex h-full min-h-0 gap-3 transition-opacity duration-200", switching && "pointer-events-none opacity-60")}>
      {/* Step rail: where you are, what is done, jump back to any answered step. */}
      <aside className="hidden w-60 shrink-0 flex-col gap-3 lg:flex">
        <div className="rounded-2xl border border-border/60 bg-card/65 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-primary">Post Market</p>
          <p className="mt-1 font-heading text-base font-bold tracking-tight">{format(new Date(`${date}T12:00:00`), "EEEE d MMM")}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{dayTrades.length ? <>{dayTrades.length} trade{dayTrades.length === 1 ? "" : "s"} · <span className="font-semibold tabular-nums" style={{ color: netRColor(summary.netR) }}>{formatTotalR(summary.netR)}</span></> : "No trades taken"}</p>
        </div>
        <nav aria-label="Review steps" className="flex-1 rounded-2xl border border-border/60 bg-card/65 p-2">
          {flowSteps.map((item, index) => {
            const done = index < stepIndex || (hasReview && index !== stepIndex);
            const current = item === currentStep;
            const reachable = !busy && (hasReview || index <= reachedIndex);
            return <button key={item} type="button" disabled={!reachable || current} onClick={() => void go(item)}
              className={cn("relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors", current ? "text-foreground" : reachable ? "text-muted-foreground hover:bg-background/40 hover:text-foreground" : "text-muted-foreground/40")}>
              {current && <motion.span layoutId="pm-step-active" className="absolute inset-0 rounded-xl border border-primary/35 bg-primary/[.08]" transition={{ type: "spring", stiffness: 420, damping: 36 }} />}
              <span className={cn("relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold tabular-nums transition-colors duration-300",
                done ? "border-success/40 bg-success/15 text-success" : current ? "border-primary bg-primary text-primary-foreground" : "border-border")}>
                {done ? <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={PRESS}><Check className="h-3 w-3" /></motion.span> : index + 1}
              </span>
              <span className="relative text-xs font-semibold">{STEP_LABELS[item]}</span>
            </button>;
          })}
        </nav>
        <MotionButton onClick={() => void backToOverview()} disabled={busy} back className="w-full">Day overview</MotionButton>
      </aside>

      <section className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/65 shadow-[0_24px_60px_-40px_rgba(0,0,0,.55)]">
        {/* Progress fills as you go; it is the one bar on the screen. */}
        <div className="h-1 shrink-0 bg-border/40"><motion.div className="h-full bg-gradient-to-r from-primary to-ice" initial={false} animate={{ width: `${progress}%` }} transition={{ duration: 0.5, ease: EASE_OUT }} /></div>
        <div className="flex shrink-0 items-center justify-between gap-3 px-5 pt-4 sm:px-8 lg:hidden">
          <button type="button" disabled={busy} onClick={() => void backToOverview()} className="text-[11px] font-semibold text-muted-foreground hover:text-primary">← Overview</button>
          <span className="text-[10px] font-semibold uppercase tracking-[.14em] text-muted-foreground">Step {stepIndex + 1} of {flowSteps.length}</span>
        </div>
        <div className="flex shrink-0 justify-end px-5 pt-4 sm:px-8">
          <PostMarketDayPicker date={date} tradesByDay={tradesByDay} reviews={reviews} onSelect={selectDate} disabled={uploading} />
        </div>

        <div className="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.div key={currentStep} custom={direction} variants={STEP_VARIANTS} initial="enter" animate="center" exit="exit"
              transition={{ duration: reduceMotion ? 0 : 0.22, ease: EASE_OUT }}
              className="mx-auto flex min-h-full w-full max-w-3xl flex-col justify-center px-5 py-6 sm:px-8">
              <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04, duration: 0.24, ease: EASE_OUT }} className="hidden text-[10px] font-semibold uppercase tracking-[.18em] text-primary lg:block">
                Step {stepIndex + 1} of {flowSteps.length} · {eyebrow}
              </motion.p>
              <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-primary lg:hidden">{eyebrow}</p>
              <motion.h2 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07, duration: 0.28, ease: EASE_OUT }} className="mt-2 font-heading text-2xl font-bold tracking-tight sm:text-3xl">{titles[currentStep]}</motion.h2>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12, duration: 0.3 }} className="mt-2 text-sm text-muted-foreground">{hints[currentStep]}</motion.p>

              {currentStep === "verdict" && <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {([true, false] as const).map((choice, index) => {
                  const selected = knownVerdict && draft.taken_was_best === choice;
                  const Icon = choice ? Trophy : Target;
                  return <motion.button key={String(choice)} type="button" disabled={busy} onClick={() => void answer(choice)}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 + index * 0.06, duration: 0.28, ease: EASE_OUT }}
                    whileHover={{ y: -4 }} whileTap={{ scale: 0.97, transition: PRESS }}
                    className={cn("group/choice relative min-h-40 overflow-hidden rounded-2xl border bg-background/35 p-6 text-left transition-[border-color,background-color,box-shadow] duration-200 disabled:opacity-50",
                      selected ? "border-primary/60 bg-primary/[.07]" : "border-border/60 hover:border-primary/45 hover:bg-primary/[.04] hover:shadow-[0_18px_40px_-24px_color-mix(in_oklch,var(--primary)_55%,transparent)]")}>
                    <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl transition-colors duration-200", choice ? "bg-success/12 text-success" : "bg-ice/12 text-ice")}>
                      <Icon className="h-5 w-5 transition-transform duration-300 ease-out group-hover/choice:scale-110 group-hover/choice:-rotate-6" />
                    </span>
                    <span className="mt-4 block font-heading text-xl font-bold">{choice ? "Yes" : "No"}</span>
                    <span className="mt-1 block text-sm text-muted-foreground">{choice ? dayTrades.length ? "The trade I took was the best one available." : "Staying out was the right call." : "A better opportunity was there."}</span>
                    <kbd className="absolute right-4 top-4 rounded-md border border-border/60 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">{choice ? "Y" : "N"}</kbd>
                    {selected && <motion.span layoutId="pm-verdict" className="absolute bottom-4 right-4 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground" transition={PRESS}><Check className="h-3.5 w-3.5" /></motion.span>}
                  </motion.button>;
                })}
              </div>}

              {textField && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14, duration: 0.28, ease: EASE_OUT }} className="mt-6">
                {currentStep === "why" && dayTrades.length > 0 && <div className="mb-3 flex flex-wrap gap-1.5">{dayTrades.map((trade) => <Link key={trade.id} href={`/journal/${trade.id}?from=trade-therapist`} className="rounded-md border border-border/60 px-2.5 py-1 text-[11px] transition-colors hover:border-primary/40 hover:text-primary">{instrumentName(trade.instrument)} · <span style={{ color: netRColor(tradeR(trade)) }}>{formatTotalR(tradeR(trade))}</span></Link>)}</div>}
                <div className="group/field rounded-2xl border border-border/70 bg-background/35 transition-[border-color,box-shadow] duration-200 focus-within:border-primary/50 focus-within:shadow-[0_0_0_4px_color-mix(in_oklch,var(--primary)_12%,transparent)]">
                  <textarea autoFocus value={text} onChange={(event) => update({ [textField]: event.target.value } as Partial<Draft>)} onBlur={() => { if (timer.current) void flush(); }}
                    placeholder={currentStep === "why" ? (draft.taken_was_best ? "Why was this the best decision?" : "Why was the other trade better?") : "Your session reflection..."}
                    className="min-h-40 w-full resize-none bg-transparent p-4 text-sm leading-relaxed outline-none sm:min-h-52" />
                  <div className="flex items-center justify-between gap-3 border-t border-border/40 px-4 py-2 text-[10px] text-muted-foreground">
                    <span className="tabular-nums">{wordCount(text)} word{wordCount(text) === 1 ? "" : "s"}</span>
                    <span className="hidden sm:inline">Ctrl/⌘ + Enter to continue</span>
                  </div>
                </div>
                {chips.length > 0 && <div className="mt-3">
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Quick add</p>
                  <div className="flex flex-wrap gap-1.5">{chips.map((chip, index) => {
                    const on = hasChip(text, chip);
                    return <motion.button key={chip} type="button" onClick={() => update({ [textField]: toggleChip(text, chip) } as Partial<Draft>)}
                      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 + index * 0.03, duration: 0.18, ease: EASE_OUT }}
                      whileTap={{ scale: 0.94, transition: PRESS }}
                      className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors duration-150",
                        on ? "border-primary/50 bg-primary/12 text-primary" : "border-border/60 text-muted-foreground hover:border-primary/35 hover:text-foreground")}>
                      <AnimatePresence initial={false}>{on && <motion.span initial={{ width: 0, opacity: 0 }} animate={{ width: "auto", opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.15 }}><Check className="h-3 w-3" /></motion.span>}</AnimatePresence>
                      {chip}
                    </motion.button>;
                  })}</div>
                </div>}
                {currentStep === "market" && ruleChecks.length > 0 && <div className="mt-5 rounded-xl border border-border/50 bg-background/25 p-3"><p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Commitment and rule checks</p>{ruleChecks.map((check) => <div key={check.id} className="flex justify-between gap-3 py-1 text-xs"><span>{check.source_text_snapshot}</span><span className={cn("shrink-0 capitalize", check.status === "kept" ? "text-success" : check.status === "broken" ? "text-destructive" : "text-muted-foreground")}>{check.status.replaceAll("_", " ")}</span></div>)}</div>}
              </motion.div>}

              {currentStep === "screenshots" && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14, duration: 0.28, ease: EASE_OUT }} className="mt-6"><ScreenshotUpload compact groups={draft.screenshot_groups} onChange={(groups) => update({ screenshot_groups: groups })} onUploadingChange={setUploading} storageConfig={{ entityType: "best-trade", entityId: date }} /></motion.div>}
              {currentStep === "r" && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14, duration: 0.28, ease: EASE_OUT }} className="mt-6"><RPotentialAnalysisSection key={date} trades={dayTrades} compact flushRef={rFlushRef} onSaved={(record) => setObservations((old) => ({ ...old, [record.trade_id]: record }))} /></motion.div>}
            </motion.div>
          </AnimatePresence>
        </div>

        <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-border/60 px-5 py-3 sm:px-8">
          <MotionButton back disabled={stepIndex === 0 || busy} onClick={() => void go(steps[stepIndex - 1])}>Back</MotionButton>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={status || "idle"} role="status" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}
              className={cn("inline-flex items-center gap-1.5 text-center text-[11px]", saveState === "error" ? "text-destructive" : saveState === "saved" ? "text-success" : "text-muted-foreground")}>
              {saveState === "saved" && <Check className="h-3 w-3" />}{status || "Autosave on"}
            </motion.span>
          </AnimatePresence>
          {currentStep === "verdict" ? <span className="hidden text-[11px] text-muted-foreground sm:inline">Press Y or N</span> : <MotionButton primary disabled={busy} onClick={() => void go(next)}>{next === "complete" ? "Finish review" : "Continue"}</MotionButton>}
        </footer>
      </section>
    </div>;
  }

  const verdict: "unknown" | "taken" | "missed" = !knownVerdict ? "unknown" : draft.taken_was_best ? "taken" : "missed";
  const betterShots = draft.screenshot_groups.filter((group) => group.urls.length > 0);
  // When the trade taken was the best one, its own charts are the evidence.
  const takenShots: ScreenshotGroup[] = dayTrades.flatMap((trade) => (trade.screenshot_groups ?? [])
    .filter((group) => group.urls.length > 0)
    .map((group) => ({ label: dayTrades.length > 1 ? `${instrumentName(trade.instrument)} · ${group.label}` : group.label, urls: group.urls })));
  const reviewButton = <button disabled={saveState === "saving" || uploading} onClick={() => void move(resumeStep ?? steps[0])} className={cn("inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors disabled:opacity-40", hasReview ? "border border-border/60 text-foreground hover:border-primary/40 hover:text-primary" : "bg-primary text-primary-foreground hover:bg-primary/90")}>{hasReview ? "Edit review" : resumeStep ? "Continue review" : "Start review"}<ArrowRight className="h-3.5 w-3.5" /></button>;

  return <div aria-busy={switching} className={cn("h-full overflow-y-auto transition-opacity duration-200 lg:overflow-hidden", switching && "pointer-events-none opacity-60")}>
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

      <AnimatePresence>
        {justFinished && <motion.div initial={{ opacity: 0, y: -8, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, y: -8, height: 0 }} transition={{ duration: 0.28, ease: EASE_OUT }} className="shrink-0 overflow-hidden">
          <div className="flex items-center gap-3 rounded-xl border border-success/30 bg-success/[.07] px-4 py-2.5">
            <motion.span initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ ...PRESS, delay: 0.1 }} className="flex h-7 w-7 items-center justify-center rounded-full bg-success text-background"><Check className="h-4 w-4" /></motion.span>
            <div><p className="text-sm font-semibold">Review recorded</p><p className="text-xs text-muted-foreground">This day now counts toward your weekly review and MC Mindscore.</p></div>
          </div>
        </motion.div>}
      </AnimatePresence>

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
          <section className="shrink-0 rounded-2xl border border-border/60 bg-card/65 px-4 py-3">
            <div className="flex items-center justify-between"><h3 className="text-xs font-bold">Trades on this day</h3><span className="text-[11px] tabular-nums text-muted-foreground">{summary.tradeCount}</span></div>
            {dayTrades.length ? <div className="mt-1.5 max-h-28 space-y-1 overflow-y-auto pr-1">{dayTrades.map((trade) => (
              <div key={trade.id} className="flex min-w-0 items-center gap-2 rounded-md px-1.5 py-1 text-[11px] transition-colors hover:bg-background/40">
                <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", trade.execution_quality === "good" ? "bg-success" : trade.execution_quality === "bad" ? "bg-destructive" : "bg-border")} title={trade.execution_quality ? `Execution ${trade.execution_quality}` : "Execution not rated"} />
                <span className="min-w-0 flex-1 truncate"><span className="font-semibold">{instrumentName(trade.instrument)}</span> <span className="capitalize text-muted-foreground">{trade.direction} · {trade.execution_time || trade.session}</span></span>
                <span className="shrink-0 font-bold tabular-nums" style={{ color: netRColor(tradeR(trade)) }}>{formatTotalR(tradeR(trade))}</span>
                <Link href={`/journal/${trade.id}?from=trade-therapist`} className="shrink-0 text-[10px] text-muted-foreground hover:text-primary">Open</Link>
              </div>
            ))}</div> : <p className="mt-1 text-[11px] text-muted-foreground">No trades taken on this day.</p>}
          </section>

          {entitlements.bestTrade && <section className="flex min-h-56 flex-[1.15] flex-col rounded-2xl border border-border/60 bg-card/65 p-4 lg:min-h-0">
            <div className="flex shrink-0 items-start justify-between gap-2">
              <div><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-primary">Session review</p><h3 className="mt-0.5 text-sm font-bold">How you responded to the market</h3></div>
              <button onClick={() => void move("market")} className="text-[11px] font-semibold text-primary">{draft.post_market_analysis.trim() ? "Edit" : "Write"}</button>
            </div>
            <div className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
              {draft.post_market_analysis.trim()
                ? <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{draft.post_market_analysis}</p>
                : <button type="button" onClick={() => void move("market")} className="flex h-full min-h-24 w-full items-center justify-center rounded-xl border border-dashed border-border/60 bg-background/25 p-4 text-center text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary">What did the market offer, and how did you respond?</button>}
              {ruleChecks.length > 0 && <div className="mt-4 border-t border-border/50 pt-3">
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Commitment and rule checks</p>
                {ruleChecks.map((check) => <div key={check.id} className="flex justify-between gap-3 py-1 text-xs"><span className="min-w-0">{check.source_text_snapshot}</span><span className={cn("shrink-0 capitalize", check.status === "kept" ? "text-success" : check.status === "broken" ? "text-destructive" : "text-muted-foreground")}>{check.status.replaceAll("_", " ")}</span></div>)}
              </div>}
            </div>
          </section>}

          <section className="flex min-h-56 flex-1 flex-col rounded-2xl border border-border/60 bg-card/65 p-4 lg:min-h-0">
            <div className="flex shrink-0 items-start justify-between gap-2">
              <div><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-ice">R Potential</p><h3 className="mt-0.5 text-sm font-bold">How far the winners ran</h3></div>
              {summary.winnerCount > 0 && <button onClick={() => void move("r")} className="text-[11px] font-semibold text-primary">{summary.measuredCount < summary.winnerCount ? "Measure" : "Edit"}</button>}
            </div>
            {summary.winnerCount ? <div className="mt-3 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
              <div className="grid shrink-0 grid-cols-2 gap-1.5 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
                <RTile label="Avg MFE" value={summary.averageMfe == null ? "—" : `${summary.averageMfe.toFixed(2)}R`} />
                <RTile label="Avg winner" value={summary.averageWinnerR == null ? "—" : `${summary.averageWinnerR.toFixed(2)}R`} />
                <RTile label="Reached 2R" value={`${summary.reached2R}/${summary.measuredCount}`} />
                <RTile label="Reached 2.5R" value={`${summary.reached25R}/${summary.measuredCount}`} />
              </div>
              <RRunBars winners={dayTrades.filter((trade) => trade.result === "win")} observations={observations} />
            </div> : <p className="mt-3 text-xs text-muted-foreground">No winning trades to analyse on this day.</p>}
          </section>
        </div>
      </div>
    </div>
  </div>;
}

function RTile({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-border/50 bg-background/30 px-2.5 py-2"><p className="font-heading text-base font-bold tabular-nums">{value}</p><p className="text-[10px] text-muted-foreground">{label}</p></div>;
}

/** Per winner: what was banked (solid) against how far price ran (MFE, ghost). */
function RRunBars({ winners, observations }: { winners: TradeJournalEntry[]; observations: Record<string, RPotentialAnalysis> }) {
  const reduceMotion = useReducedMotion();
  const max = Math.max(1, ...winners.map((trade) => Math.max(tradeR(trade), observations[trade.id]?.mfe_r ?? 0)));
  return <div className="space-y-2">
    {winners.map((trade, index) => {
      const realised = tradeR(trade);
      const mfe = observations[trade.id]?.mfe_r;
      return <div key={trade.id}>
        <div className="mb-1 flex justify-between gap-2 text-[11px]"><span className="truncate font-semibold">{instrumentName(trade.instrument)}</span><span className="shrink-0 tabular-nums text-muted-foreground"><span className="text-success">{formatTotalR(realised)}</span> of {mfe == null ? "not measured" : `${mfe.toFixed(2)}R`}</span></div>
        <div className="relative h-2 overflow-hidden rounded-full bg-muted/40">
          {mfe != null && <motion.span className="absolute inset-y-0 left-0 origin-left rounded-full bg-ice/30" style={{ width: `${(mfe / max) * 100}%` }} initial={{ scaleX: reduceMotion ? 1 : 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.6, delay: index * 0.06, ease: [0.23, 1, 0.32, 1] }} />}
          <motion.span className="absolute inset-y-0 left-0 origin-left rounded-full bg-success" style={{ width: `${(realised / max) * 100}%` }} initial={{ scaleX: reduceMotion ? 1 : 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.5, delay: 0.1 + index * 0.06, ease: [0.23, 1, 0.32, 1] }} />
        </div>
      </div>;
    })}
    <p className="flex gap-3 pt-0.5 text-[10px] text-muted-foreground"><span className="flex items-center gap-1"><span className="h-1.5 w-3 rounded-full bg-success" />Banked</span><span className="flex items-center gap-1"><span className="h-1.5 w-3 rounded-full bg-ice/30" />Max run (MFE)</span></p>
  </div>;
}

function Metric({ label, value, detail, color }: { label: string; value: string; detail: string; color?: string }) {
  return <div className="min-w-0 rounded-xl border border-border/60 bg-card/65 px-2.5 py-2 sm:px-4"><p className="truncate text-[10px] text-muted-foreground">{label}</p><p className="truncate font-heading text-base font-bold tabular-nums sm:text-xl" style={{ color }}>{value}</p><p className="truncate text-[9px] text-muted-foreground sm:text-[11px]">{detail}</p></div>;
}
