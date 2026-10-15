"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import { Check, Eye, Loader2, Sparkles } from "lucide-react";
import { TradeDetailDialog } from "@/components/journal/trade-detail-dialog";
import { MotionButton, PRESS, EASE_OUT } from "@/components/trade-therapist/motion-button";
import { StepPanel, type PanelStatus } from "@/components/trade-therapist/step-panel";
import { getPreMarketExercise, getRecentPreMarketExerciseTypes, savePreMarketExercise } from "@/lib/supabase/queries";
import { aggregateSessions, exerciseDefinition, PRE_MARKET_EXERCISES, selectExercise, type ExerciseField } from "@/lib/pre-market/exercises";
import { formatTotalR, tradeR } from "@/lib/journal/weeks";
import { instrumentName } from "@/lib/instruments";
import { netRColor } from "@/lib/journal/colors";
import { cn } from "@/lib/utils";
import type { CommitmentFormat, ExerciseTypeId, TradeJournalEntry } from "@/lib/types";

type Draft = { exercise_type: ExerciseTypeId; inputs: Record<string, unknown>; focus: string; commitment_text: string; commitment_format: CommitmentFormat | null };
const emptyDraft = (type: ExerciseTypeId): Draft => ({ exercise_type: type, inputs: {}, focus: "", commitment_text: "", commitment_format: exerciseDefinition(type).suggestedCommitmentFormat });
const FORMAT_LABEL: Record<CommitmentFormat, string> = { rule: "Rule", if_then: "If / then", scope: "Scope" };

/**
 * Pre-market, laid out like the Therapist's Today screen: the exercise to pick
 * on top, then three numbered steps in the order you do them before the open
 * (look back, choose one focus, commit). The step to do next carries the
 * accent, so the screen tells you where you are without a progress meter.
 */
export function PreMarketExercises({ trades, date }: { trades: TradeJournalEntry[]; date: string }) {
  const reduceMotion = useReducedMotion();
  const [draft, setDraft] = useState<Draft>(emptyDraft("loss_win_review"));
  const [loaded, setLoaded] = useState<Draft | null>(null);
  const [suggested, setSuggested] = useState<ExerciseTypeId | null>(null);
  const [completedAt, setCompletedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewing, setViewing] = useState<TradeJournalEntry | null>(null);
  const definition = exerciseDefinition(draft.exercise_type);
  const draftKey = `premarket-library-draft:${date}`;

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([getPreMarketExercise(date), getRecentPreMarketExerciseTypes(1)]).then(([exercise, recent]) => {
      if (!active) return;
      const pick = selectExercise(aggregateSessions(trades), recent[0]);
      const stored: Draft = exercise ? { exercise_type: exercise.exercise_type, inputs: exercise.inputs, focus: exercise.focus, commitment_text: exercise.commitment_text, commitment_format: exercise.commitment_format } : emptyDraft(pick);
      let local: Draft | null = null;
      try { local = JSON.parse(sessionStorage.getItem(draftKey) ?? "null") as Draft | null; } catch { /* database state wins */ }
      setSuggested(pick);
      setCompletedAt(exercise?.completed_at ?? null);
      setLoaded(stored); setDraft(local ?? stored);
    }).catch(() => setError("Could not load today's exercise.")).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [date, draftKey, trades]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(loaded);
  useEffect(() => {
    if (loading) return;
    try { if (dirty) sessionStorage.setItem(draftKey, JSON.stringify(draft)); else sessionStorage.removeItem(draftKey); } catch { /* optional */ }
  }, [draft, draftKey, dirty, loading]);

  const requiredComplete = definition.fields.every((field) => !field.required || String(draft.inputs[field.id] ?? "").trim());
  // Exercises with required prompts are done when those are filled; the trade
  // review has none, so one written plan counts (or nothing to review at all).
  const hasRequired = definition.fields.some((field) => field.required);
  const reviewable = definition.fields.some((field) => field.kind === "trade_review" && trades.some((trade) => trade.result === field.tradeResult));
  const anyAnswered = definition.fields.some((field) => {
    const value = draft.inputs[field.id];
    if (field.kind === "trade_review") return Object.values((value ?? {}) as Record<string, string>).some((text) => text.trim());
    return String(value ?? "").trim().length > 0;
  });
  const lookedBack = hasRequired ? requiredComplete : anyAnswered || !reviewable;
  const hasFocus = draft.focus.trim().length > 0;
  const hasCommitment = draft.commitment_text.trim().length > 0;
  const canComplete = Boolean(requiredComplete && hasFocus && hasCommitment);
  const doneCount = [lookedBack, hasFocus, hasCommitment].filter(Boolean).length;
  const completed = Boolean(completedAt) && !dirty;
  const activeStep = !lookedBack ? 1 : !hasFocus ? 2 : !hasCommitment ? 3 : 0;

  const setInput = (id: string, value: unknown) => { setDraft((current) => ({ ...current, inputs: { ...current.inputs, [id]: value } })); setJustSaved(false); };

  function choose(type: ExerciseTypeId) {
    if (type === draft.exercise_type) return;
    setDraft((current) => ({ ...emptyDraft(type), focus: current.focus, commitment_text: current.commitment_text }));
    setJustSaved(false);
  }

  async function save() {
    if (!canComplete) { setError("Finish the required prompts, today's focus and commitment first."); return; }
    setSaving(true); setError(null);
    try {
      const result = await savePreMarketExercise({ date, ...draft });
      const clean: Draft = { exercise_type: result.exercise_type, inputs: result.inputs, focus: result.focus, commitment_text: result.commitment_text, commitment_format: result.commitment_format };
      setDraft(clean); setLoaded(clean); setCompletedAt(result.completed_at ?? new Date().toISOString());
      setJustSaved(true); setTimeout(() => setJustSaved(false), 3200);
    } catch { setError("Could not save. Run the daily commitments migration in Supabase."); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;

  const status = (done: boolean, step: number): PanelStatus => done ? { label: "Done", tone: "done" } : activeStep === step ? { label: "Now", tone: "todo" } : { label: "To do", tone: "waiting" };

  return <MotionConfig reducedMotion="user">
    <div className="h-full overflow-y-auto lg:overflow-hidden">
      <div className="flex min-h-full flex-col gap-3 lg:h-full">
        {/* Hero: which exercise, why, and how far along today's prep is. */}
        <motion.header initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24, ease: EASE_OUT }}
          className="relative shrink-0 overflow-hidden rounded-2xl border border-border/60 bg-card/65 p-5 sm:p-6">
          <motion.div aria-hidden className="pointer-events-none absolute -left-24 -top-28 h-64 w-64 rounded-full bg-primary/10 blur-3xl"
            animate={reduceMotion ? undefined : { scale: [1, 1.12, 1], opacity: [0.8, 1, 0.8] }} transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }} />
          <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="min-w-0 max-w-xl">
              <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-primary">Before the open · {format(new Date(`${date}T12:00:00`), "EEEE d MMMM")}</p>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={draft.exercise_type} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18, ease: EASE_OUT }}>
                  <h2 className="mt-1.5 font-heading text-2xl font-bold tracking-tight sm:text-3xl">{definition.title}</h2>
                  <p className="mt-1.5 text-sm text-muted-foreground">{definition.rationale}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">Exercise</p>
              <div className="grid gap-1.5 sm:grid-cols-3" role="radiogroup" aria-label="Choose an exercise">
                {PRE_MARKET_EXERCISES.map((exercise, index) => {
                  const selected = exercise.id === draft.exercise_type;
                  return <motion.button key={exercise.id} type="button" role="radio" aria-checked={selected} onClick={() => choose(exercise.id)}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, delay: 0.08 + index * 0.04, ease: EASE_OUT }}
                    whileHover={selected ? undefined : { y: -2 }} whileTap={{ scale: 0.96, transition: PRESS }}
                    className={cn("relative min-w-0 rounded-xl border px-3 py-2.5 text-left transition-colors duration-200 sm:w-44", selected ? "border-primary/50 text-foreground" : "border-border/50 bg-background/30 text-muted-foreground hover:border-primary/35 hover:text-foreground")}>
                    {selected && <motion.span layoutId="pm-exercise" className="absolute inset-0 rounded-xl bg-primary/[.09]" transition={{ type: "spring", stiffness: 420, damping: 36 }} />}
                    <span className="relative flex items-center justify-between gap-2">
                      <span className="truncate text-xs font-semibold">{exercise.title}</span>
                      {exercise.id === suggested && <span title="Suggested from your recent sessions" className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-ice/12 px-1.5 py-0.5 text-[9px] font-semibold text-ice"><Sparkles className="h-2.5 w-2.5" />For you</span>}
                    </span>
                  </motion.button>;
                })}
              </div>
            </div>
          </div>
        </motion.header>

        {/* Three steps, filling the rest of the viewport. */}
        <div className="grid flex-1 gap-3 lg:min-h-0 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <StepPanel index={0} reduceMotion={reduceMotion} active={activeStep === 1} lift={false} step="01" eyebrow="Look back" title={definition.fields[0]?.kind === "trade_review" ? "Your recent trades" : "Know your obstacle"} status={status(lookedBack, 1)}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={draft.exercise_type} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2, ease: EASE_OUT }} className="space-y-4">
                {definition.fields.map((field) => <ExerciseFieldInput key={field.id} field={field} value={draft.inputs[field.id]} trades={trades} onChange={(value) => setInput(field.id, value)} onView={setViewing} />)}
              </motion.div>
            </AnimatePresence>
          </StepPanel>

          <StepPanel index={1} reduceMotion={reduceMotion} active={activeStep === 2} lift={false} step="02" eyebrow="Choose" title="One focus for today" status={status(hasFocus, 2)}>
            <p className="text-xs text-muted-foreground">What deserves your attention on every decision today? One thing, said plainly.</p>
            <Field className="mt-3">
              <textarea value={draft.focus} onChange={(e) => { setDraft((d) => ({ ...d, focus: e.target.value })); setJustSaved(false); }} rows={5} placeholder="Wait for the close beyond the level before entering."
                className="w-full resize-none bg-transparent p-3 text-sm leading-relaxed outline-none" />
            </Field>
          </StepPanel>

          <StepPanel index={2} reduceMotion={reduceMotion} active={activeStep === 3} lift={false} step="03" eyebrow="Commit" title="Today's commitment" status={status(hasCommitment, 3)}>
            <p className="text-xs text-muted-foreground">{definition.commitmentPrompt}</p>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="rounded-full bg-ice/12 px-2 py-0.5 text-[10px] font-semibold text-ice">Suggested: {FORMAT_LABEL[definition.suggestedCommitmentFormat]}</span>
              <AnimatePresence initial={false}>
                {!hasCommitment && <motion.button type="button" onClick={() => setDraft((current) => ({ ...current, commitment_text: definition.commitmentTemplate }))}
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.15 }} whileTap={{ scale: 0.94, transition: PRESS }}
                  className="rounded-full border border-primary/40 px-2 py-0.5 text-[10px] font-semibold text-primary transition-colors hover:bg-primary/10">Use template</motion.button>}
              </AnimatePresence>
            </div>
            <Field className="mt-3">
              <textarea value={draft.commitment_text} onChange={(e) => { setDraft((d) => ({ ...d, commitment_text: e.target.value })); setJustSaved(false); }} rows={5} placeholder="Max 3 trades. No entry before CPI."
                className="w-full resize-none bg-transparent p-3 text-sm leading-relaxed outline-none" />
            </Field>
          </StepPanel>
        </div>

        <motion.footer initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="flex shrink-0 flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/65 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex gap-1" aria-label={`${doneCount} of 3 steps done`}>
              {[lookedBack, hasFocus, hasCommitment].map((done, i) => <span key={i} className="h-1.5 w-8 overflow-hidden rounded-full bg-border/60"><motion.span className="block h-full origin-left rounded-full bg-primary" initial={false} animate={{ scaleX: done ? 1 : 0 }} transition={{ duration: 0.35, ease: EASE_OUT }} /></span>)}
            </div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.p key={error ? "error" : justSaved ? "saved" : completed ? "completed" : dirty ? "dirty" : "idle"} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }} className="text-xs">
                {error ? <span className="text-destructive">{error}</span>
                  : justSaved || completed ? <span className="inline-flex items-center gap-1.5 text-success"><Check className="h-3.5 w-3.5" /> Exercise completed{completedAt ? ` at ${format(new Date(completedAt), "HH:mm")}` : ""}</span>
                  : dirty ? <span className="text-muted-foreground">Draft kept in this session.</span>
                  : <span className="text-muted-foreground">{3 - doneCount} step{3 - doneCount === 1 ? "" : "s"} to go.</span>}
              </motion.p>
            </AnimatePresence>
          </div>
          <MotionButton primary={canComplete && !completed} onClick={() => void save()} disabled={saving || !dirty || !canComplete} arrow={!saving}>
            {saving && <Loader2 className="mr-1 inline h-3.5 w-3.5 animate-spin" />}{completed ? "Completed" : completedAt ? "Save changes" : "Complete exercise"}
          </MotionButton>
        </motion.footer>
      </div>
      <TradeDetailDialog trade={viewing} open={viewing !== null} onOpenChange={(open) => !open && setViewing(null)} />
    </div>
  </MotionConfig>;
}

function Field({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("rounded-xl border border-border/60 bg-background/35 transition-[border-color,box-shadow] duration-200 focus-within:border-primary/50 focus-within:shadow-[0_0_0_4px_color-mix(in_oklch,var(--primary)_12%,transparent)]", className)}>{children}</div>;
}

function ExerciseFieldInput({ field, value, trades, onChange, onView }: { field: ExerciseField; value: unknown; trades: TradeJournalEntry[]; onChange: (value: unknown) => void; onView: (trade: TradeJournalEntry) => void }) {
  if (field.kind === "trade_review") {
    const selected = trades.filter((trade) => trade.result === field.tradeResult).sort((a, b) => b.date_time.localeCompare(a.date_time)).slice(0, field.count ?? 2);
    const answers = (value ?? {}) as Record<string, string>;
    const tone = field.tradeResult === "loss" ? "var(--destructive)" : "var(--success)";
    return <div>
      <div className="mb-2 flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full" style={{ background: tone }} /><h3 className="text-[10px] font-semibold uppercase tracking-[.14em] text-muted-foreground">{field.label}</h3></div>
      {selected.length ? <div className="grid gap-2 xl:grid-cols-2">{selected.map((trade, index) => {
        const answered = Boolean((answers[trade.id] ?? "").trim());
        return <motion.div key={trade.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + index * 0.05, duration: 0.22, ease: EASE_OUT }}
          className={cn("rounded-xl border bg-background/30 p-3 transition-colors duration-200", answered ? "border-success/30" : "border-border/60")}>
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold">{instrumentName(trade.instrument)} <span className="font-normal capitalize text-muted-foreground">{trade.direction}</span></p>
              <p className="text-[10px] text-muted-foreground">{format(new Date(`${trade.date_time.slice(0, 10)}T12:00:00`), "EEE d MMM")} · {trade.session} · <span className="font-semibold" style={{ color: netRColor(tradeR(trade)) }}>{formatTotalR(tradeR(trade))}</span></p>
            </div>
            <motion.button type="button" onClick={() => onView(trade)} whileTap={{ scale: 0.9, transition: PRESS }} aria-label="View trade" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"><Eye className="h-3.5 w-3.5" /></motion.button>
          </div>
          <Field className="mt-2">
            <textarea value={answers[trade.id] ?? ""} onChange={(e) => onChange({ ...answers, [trade.id]: e.target.value })} rows={2} placeholder={field.prompt} className="w-full resize-none bg-transparent p-2.5 text-xs leading-relaxed outline-none" />
          </Field>
        </motion.div>;
      })}</div> : <p className="rounded-xl border border-dashed border-border/60 p-4 text-xs text-muted-foreground">No matching trades yet. You can still complete today&apos;s focus and commitment.</p>}
    </div>;
  }
  if (field.kind === "choice") {
    return <div>
      <p className="text-xs font-semibold">{field.label}</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{field.prompt}</p>
      <div className="mt-2 grid gap-1.5 sm:grid-cols-2">{field.options?.map((option) => {
        const on = value === option.value;
        return <motion.button key={option.value} type="button" onClick={() => onChange(option.value)} whileTap={{ scale: 0.96, transition: PRESS }}
          className={cn("relative rounded-xl border px-3 py-2.5 text-left text-xs font-medium transition-colors duration-200", on ? "border-primary/50 text-foreground" : "border-border/60 bg-background/30 text-muted-foreground hover:border-primary/35 hover:text-foreground")}>
          {on && <motion.span layoutId={`choice-${field.id}`} className="absolute inset-0 rounded-xl bg-primary/[.09]" transition={{ type: "spring", stiffness: 420, damping: 36 }} />}
          <span className="relative flex items-center justify-between gap-2">{option.label}{on && <Check className="h-3.5 w-3.5 text-primary" />}</span>
        </motion.button>;
      })}</div>
    </div>;
  }
  return <label className="block">
    <span className="text-xs font-semibold">{field.label}</span>
    <span className="mt-0.5 block text-[11px] text-muted-foreground">{field.prompt}</span>
    <Field className="mt-2">
      {field.kind === "textarea"
        ? <textarea value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} rows={3} placeholder={field.placeholder} className="w-full resize-none bg-transparent p-3 text-sm leading-relaxed outline-none" />
        : <input type={field.kind === "number" ? "number" : "text"} min={field.kind === "number" ? 1 : undefined} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} className="h-10 w-full bg-transparent px-3 text-sm outline-none" />}
    </Field>
  </label>;
}
