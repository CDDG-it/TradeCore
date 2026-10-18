"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import {
  ArrowRight, CalendarCheck, Check, Clock, Eye, FileCheck, Gauge, GitBranch, Hand, Lightbulb, ListChecks, Loader2,
  Pencil, Quote, Repeat, RotateCcw, Scale, ShieldAlert, Sparkles, Target, Wind, Zap, type LucideIcon,
} from "lucide-react";
import { TradeDetailDialog } from "@/components/journal/trade-detail-dialog";
import { MotionButton, PRESS, EASE_OUT } from "@/components/trade-therapist/motion-button";
import { getPreMarketExercise, getRecentPreMarketExerciseTypes, getTradeProfileBundle, savePreMarketExercise } from "@/lib/supabase/queries";
import {
  aggregateSessions, CATEGORY_LABEL, exerciseDefinition, PRE_MARKET_EXERCISES, selectExercise,
  type ExerciseCategory, type ExerciseField, type PreMarketExerciseDefinition,
} from "@/lib/pre-market/exercises";
import { focusAreas } from "@/lib/trade-profile/content/focus-areas";
import type { FocusAreaId } from "@/lib/trade-profile/focus-rules";
import { focusFromRow } from "@/lib/trade-profile/rows";
import { formatTotalR, tradeR } from "@/lib/journal/weeks";
import { instrumentName } from "@/lib/instruments";
import { netRColor } from "@/lib/journal/colors";
import { cn } from "@/lib/utils";
import type { CommitmentFormat, ExerciseTypeId, TradeJournalEntry } from "@/lib/types";

type Draft = { exercise_type: ExerciseTypeId; inputs: Record<string, unknown>; focus: string; commitment_text: string; commitment_format: CommitmentFormat | null };
type Step = 1 | 2 | 3;
type Filter = "all" | ExerciseCategory;

const emptyDraft = (type: ExerciseTypeId): Draft => ({ exercise_type: type, inputs: {}, focus: "", commitment_text: "", commitment_format: exerciseDefinition(type).suggestedCommitmentFormat });
const FORMAT_LABEL: Record<CommitmentFormat, string> = { rule: "Rule", if_then: "If / then", scope: "Scope" };
const FORMAT_HINT: Record<CommitmentFormat, string> = {
  rule: "One line you either kept or broke.",
  if_then: "A cue and the action that follows it.",
  scope: "Limits on trades, size or risk.",
};
const STEPS: { step: Step; label: string; title: string }[] = [
  { step: 1, label: "Look back", title: "Work through the exercise" },
  { step: 2, label: "Focus", title: "One focus for today" },
  { step: 3, label: "Commit", title: "Today's commitment" },
];
const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "routine", label: "Routine" },
  { key: "profile", label: "Trade Profile" },
  { key: "recovery", label: "After losses" },
];
const ICON: Record<ExerciseTypeId, LucideIcon> = {
  loss_win_review: Scale, mental_contrasting: Target, pre_mortem: ShieldAlert, mental_rehearsal: Repeat, rules_recall: ListChecks,
  state_check: Gauge, scenario_plan: GitBranch, post_loss_reset: RotateCcw, calm_plan: Wind, impulse_gate: Hand,
  follow_through: CalendarCheck, thrill_outlet: Zap, idea_parking: Lightbulb, evidence_file: FileCheck,
};
/** Big writing surfaces: they grow with the text (field-sizing) and start roomy. */
const TEXTAREA = "block w-full resize-y bg-transparent p-4 text-[15px] leading-relaxed outline-none [field-sizing:content] placeholder:text-muted-foreground/60";

/** Has a field been answered, in the way that field kind counts as answered? */
function answered(field: ExerciseField, value: unknown) {
  if (field.kind === "trade_review") return Object.values((value ?? {}) as Record<string, string>).some((text) => text.trim());
  if (field.kind === "list") return ((value ?? []) as string[]).some((line) => line.trim());
  return String(value ?? "").trim().length > 0;
}

/**
 * Pre-market, as a library and a guided session. The library on the left holds
 * every exercise (routine, after losses, and one per My Trade Profile focus
 * area); the session on the right walks through it in three steps (do the
 * exercise, pick one focus, commit), one step at a time with room to write.
 */
export function PreMarketExercises({ trades, date }: { trades: TradeJournalEntry[]; date: string }) {
  const reduceMotion = useReducedMotion();
  const [draft, setDraft] = useState<Draft>(emptyDraft("loss_win_review"));
  const [loaded, setLoaded] = useState<Draft | null>(null);
  const [suggested, setSuggested] = useState<ExerciseTypeId | null>(null);
  const [profileFocus, setProfileFocus] = useState<{ primary: FocusAreaId; secondary: FocusAreaId | null } | null>(null);
  const [completedAt, setCompletedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewing, setViewing] = useState<TradeJournalEntry | null>(null);
  const [step, setStep] = useState<Step>(1);
  const [direction, setDirection] = useState(1);
  const [filter, setFilter] = useState<Filter>("all");
  const [editing, setEditing] = useState(false);
  const definition = exerciseDefinition(draft.exercise_type);
  const draftKey = `premarket-library-draft:${date}`;

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([getPreMarketExercise(date), getRecentPreMarketExerciseTypes(1), getTradeProfileBundle().catch(() => null)]).then(([exercise, recent, bundle]) => {
      if (!active) return;
      const focus = bundle ? focusFromRow(bundle.profile) : null;
      const pick = selectExercise(aggregateSessions(trades), recent[0], focus?.primary);
      const stored: Draft = exercise ? { exercise_type: exercise.exercise_type, inputs: exercise.inputs, focus: exercise.focus, commitment_text: exercise.commitment_text, commitment_format: exercise.commitment_format } : emptyDraft(pick);
      let local: Draft | null = null;
      try { local = JSON.parse(sessionStorage.getItem(draftKey) ?? "null") as Draft | null; } catch { /* database state wins */ }
      setProfileFocus(focus);
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

  const requiredComplete = definition.fields.every((field) => !field.required || answered(field, draft.inputs[field.id]));
  // Exercises with required prompts are done when those are filled; the trade
  // review has none, so one written plan counts (or nothing to review at all).
  const hasRequired = definition.fields.some((field) => field.required);
  const reviewable = definition.fields.some((field) => field.kind === "trade_review" && trades.some((trade) => trade.result === field.tradeResult));
  const anyAnswered = definition.fields.some((field) => answered(field, draft.inputs[field.id]));
  const lookedBack = hasRequired ? requiredComplete : anyAnswered || !reviewable;
  const hasFocus = draft.focus.trim().length > 0;
  const hasCommitment = draft.commitment_text.trim().length > 0;
  const canComplete = Boolean(requiredComplete && hasFocus && hasCommitment);
  const doneFlags = [lookedBack, hasFocus, hasCommitment];
  const doneCount = doneFlags.filter(Boolean).length;
  const completed = Boolean(completedAt) && !dirty;
  const showSummary = completed && !editing;

  const update = (patch: Partial<Draft>) => setDraft((current) => ({ ...current, ...patch }));
  const setInput = (id: string, value: unknown) => setDraft((current) => ({ ...current, inputs: { ...current.inputs, [id]: value } }));

  function go(next: Step) {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  }

  function choose(type: ExerciseTypeId) {
    if (type === draft.exercise_type) return;
    setDraft((current) => ({ ...emptyDraft(type), focus: current.focus, commitment_text: current.commitment_text }));
    setDirection(1);
    setStep(1);
    setEditing(true);
  }

  async function save() {
    if (!canComplete) {
      setError("Finish the required prompts, today's focus and commitment first.");
      go(!lookedBack ? 1 : !hasFocus ? 2 : 3);
      return;
    }
    setSaving(true); setError(null);
    try {
      const result = await savePreMarketExercise({ date, ...draft });
      const clean: Draft = { exercise_type: result.exercise_type, inputs: result.inputs, focus: result.focus, commitment_text: result.commitment_text, commitment_format: result.commitment_format };
      setDraft(clean); setLoaded(clean); setCompletedAt(result.completed_at ?? new Date().toISOString());
      setEditing(false);
    } catch (e) {
      // 23514: the database still has the original three-exercise check.
      setError((e as { code?: string })?.code === "23514"
        ? "This exercise needs one database update: run sql/pre_market_exercise_types.sql in Supabase."
        : "Could not save. Check your connection and try again.");
    } finally { setSaving(false); }
  }

  const filtered = useMemo(() => PRE_MARKET_EXERCISES.filter((exercise) => filter === "all" || exercise.category === filter), [filter]);

  if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;

  const Icon = ICON[definition.id];
  const trains = definition.focusArea ? focusAreas[definition.focusArea] : null;

  return <MotionConfig reducedMotion="user">
    <div className="h-full overflow-y-auto overscroll-contain [scrollbar-gutter:stable]">
      <div className="grid gap-4 pb-8 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] lg:items-start">

        {/* ── Library ───────────────────────────────────────────── */}
        <aside className="min-w-0 lg:sticky lg:top-0">
          <div className="rounded-2xl border border-border/60 bg-card p-3 sm:p-4">
            <div className="flex items-baseline justify-between px-1">
              <h2 className="font-heading text-sm font-bold tracking-tight">Exercises</h2>
              <span className="text-[11px] tabular-nums text-muted-foreground">{PRE_MARKET_EXERCISES.length} in the library</span>
            </div>

            <div role="tablist" aria-label="Filter exercises" className="mt-3 flex gap-1 overflow-x-auto rounded-xl bg-background/40 p-1 [scrollbar-width:none]">
              {FILTERS.map((f) => {
                const on = f.key === filter;
                return <button key={f.key} type="button" role="tab" aria-selected={on} onClick={() => setFilter(f.key)}
                  className={cn("relative flex-1 whitespace-nowrap rounded-lg px-2 py-1.5 text-[11px] font-semibold transition-colors", on ? "text-foreground" : "text-muted-foreground hover:text-foreground")}>
                  {on && <motion.span layoutId="pm-filter" className="absolute inset-0 rounded-lg bg-card shadow-sm" transition={{ type: "spring", stiffness: 480, damping: 38 }} />}
                  <span className="relative">{f.label}</span>
                </button>;
              })}
            </div>

            <motion.ul layout className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:max-h-[calc(100vh-260px)] lg:flex-col lg:overflow-y-auto lg:overflow-x-visible lg:pb-0 [scrollbar-width:thin]" role="radiogroup" aria-label="Choose an exercise">
              <AnimatePresence initial={false} mode="popLayout">
                {filtered.map((exercise, index) => <LibraryCard key={exercise.id} exercise={exercise} index={index}
                  selected={exercise.id === draft.exercise_type} suggested={exercise.id === suggested}
                  yourFocus={!!exercise.focusArea && (exercise.focusArea === profileFocus?.primary || exercise.focusArea === profileFocus?.secondary)}
                  onChoose={() => choose(exercise.id)} />)}
              </AnimatePresence>
            </motion.ul>

            {(filter === "profile" || filter === "all") && !profileFocus && (
              <Link href="/trade-therapist?tab=profile" className="group mt-3 flex items-center gap-3 rounded-xl border border-dashed border-primary/30 p-3 text-xs text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground">
                <Sparkles className="h-4 w-4 shrink-0 text-primary" />
                <span className="flex-1">Take the Big Five in My Trade Profile and the exercise for your focus area is picked for you.</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            )}
          </div>
        </aside>

        {/* ── Session ───────────────────────────────────────────── */}
        <section className="min-w-0 overflow-hidden rounded-2xl border border-border/60 bg-card">
          {/* Header: which exercise and why. */}
          <div className="relative overflow-hidden border-b border-border/50 p-5 sm:p-7">
            <motion.div aria-hidden className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl"
              animate={reduceMotion ? undefined : { scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }} transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }} />
            <p className="relative text-[10px] font-semibold uppercase tracking-[.18em] text-primary">Before the open · {format(new Date(`${date}T12:00:00`), "EEEE d MMMM")}</p>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={definition.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2, ease: EASE_OUT }} className="relative mt-3 flex items-start gap-4">
                <motion.span initial={{ scale: 0.6, rotate: -12 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 380, damping: 22 }}
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-primary/30 bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </motion.span>
                <div className="min-w-0">
                  <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">{definition.title}</h2>
                  <p className="mt-1.5 max-w-[62ch] text-sm leading-relaxed text-muted-foreground">{definition.rationale}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <Chip><Clock className="h-3 w-3" /> About {definition.minutes} min</Chip>
                    <Chip>{definition.technique}</Chip>
                    {trains && <Chip tone="ice"><Sparkles className="h-3 w-3" /> Trains: {trains.title}</Chip>}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {showSummary ? (
            <CompletedSummary draft={draft} completedAt={completedAt!} onEdit={() => { setEditing(true); go(1); }} />
          ) : (
            <>
              {/* Stepper: every step is clickable; the bar fills as steps are done. */}
              <nav aria-label="Steps" className="grid grid-cols-3 gap-1 border-b border-border/50 px-3 pt-3 sm:px-5">
                {STEPS.map(({ step: s, label }) => {
                  const on = s === step;
                  const done = doneFlags[s - 1];
                  return <button key={s} type="button" onClick={() => go(s)} aria-current={on ? "step" : undefined}
                    className={cn("relative flex items-center justify-center gap-2 rounded-t-lg px-2 py-3 text-xs font-semibold transition-colors sm:justify-start sm:px-3", on ? "text-foreground" : "text-muted-foreground hover:text-foreground")}>
                    <motion.span animate={{ scale: done ? [1, 1.25, 1] : 1 }} transition={{ duration: 0.3 }}
                      className={cn("grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-bold tabular-nums", done ? "bg-primary text-primary-foreground" : on ? "border border-primary text-primary" : "border border-border text-muted-foreground")}>
                      {done ? <Check className="h-3 w-3" strokeWidth={3} /> : s}
                    </motion.span>
                    <span className="hidden sm:inline">{label}</span>
                    {on && <motion.span layoutId="pm-step" className="absolute inset-x-1 -bottom-px h-0.5 rounded-full bg-primary" transition={{ type: "spring", stiffness: 480, damping: 38 }} />}
                  </button>;
                })}
              </nav>

              <div className="relative min-h-[420px] overflow-hidden p-5 sm:p-7">
                <AnimatePresence mode="wait" initial={false} custom={direction}>
                  <motion.div key={`${definition.id}-${step}`} custom={direction}
                    initial={{ opacity: 0, x: direction * 28 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: direction * -28 }} transition={{ duration: 0.22, ease: EASE_OUT }}>
                    <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-primary">Step {step} of 3</p>
                    <h3 className="mt-1 font-heading text-xl font-bold tracking-tight">{STEPS[step - 1].title}</h3>

                    {step === 1 && <div className="mt-5 space-y-6">
                      {definition.fields.map((field, i) => <motion.div key={field.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + i * 0.06, duration: 0.24, ease: EASE_OUT }}>
                        <ExerciseFieldInput field={field} value={draft.inputs[field.id]} trades={trades} onChange={(value) => setInput(field.id, value)} onView={setViewing} />
                      </motion.div>)}
                    </div>}

                    {step === 2 && <FocusStep definition={definition} draft={draft} onChange={(focus) => update({ focus })} />}

                    {step === 3 && <CommitStep definition={definition} draft={draft} onChange={update} />}
                  </motion.div>
                </AnimatePresence>
              </div>

              <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border/50 px-5 py-4 sm:px-7">
                <div className="flex min-w-0 items-center gap-3">
                  <ProgressRing done={doneCount} />
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.p key={error ?? (dirty ? "dirty" : "idle")} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }} className="min-w-0 text-xs">
                      {error ? <span className="text-destructive">{error}</span>
                        : <span className="text-muted-foreground">{doneCount === 3 ? "Ready to complete." : `${3 - doneCount} step${3 - doneCount === 1 ? "" : "s"} to go.`}{dirty ? " Draft kept in this session." : ""}</span>}
                    </motion.p>
                  </AnimatePresence>
                </div>
                <div className="flex items-center gap-2">
                  {step > 1 && <MotionButton back onClick={() => go((step - 1) as Step)}>Back</MotionButton>}
                  {step < 3
                    ? <MotionButton primary onClick={() => go((step + 1) as Step)}>Next</MotionButton>
                    : <MotionButton primary={canComplete} onClick={() => void save()} disabled={saving || (!dirty && completed)} arrow={!saving}>
                      {saving && <Loader2 className="mr-1 inline h-3.5 w-3.5 animate-spin" />}{completedAt ? "Save changes" : "Complete exercise"}
                    </MotionButton>}
                </div>
              </footer>
            </>
          )}
        </section>
      </div>
      <TradeDetailDialog trade={viewing} open={viewing !== null} onOpenChange={(open) => !open && setViewing(null)} />
    </div>
  </MotionConfig>;
}

function Chip({ children, tone = "muted" }: { children: React.ReactNode; tone?: "muted" | "ice" }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium",
    tone === "ice" ? "border-ice/30 bg-ice/10 text-ice" : "border-border/60 bg-background/40 text-muted-foreground")}>{children}</span>;
}

function LibraryCard({ exercise, index, selected, suggested, yourFocus, onChoose }: {
  exercise: PreMarketExerciseDefinition; index: number; selected: boolean; suggested: boolean; yourFocus: boolean; onChoose: () => void;
}) {
  const Icon = ICON[exercise.id];
  return <motion.li layout initial={{ opacity: 0, y: 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
    transition={{ duration: 0.2, delay: Math.min(index, 8) * 0.025, ease: EASE_OUT }} className="w-[240px] shrink-0 lg:w-auto">
    <motion.button type="button" role="radio" aria-checked={selected} onClick={onChoose} whileHover={selected ? undefined : { x: 2 }} whileTap={{ scale: 0.98, transition: PRESS }}
      className={cn("relative flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors duration-200", selected ? "border-primary/50" : "border-border/50 hover:border-primary/30")}>
      {selected && <motion.span layoutId="pm-exercise" className="absolute inset-0 rounded-xl bg-primary/[.08]" transition={{ type: "spring", stiffness: 420, damping: 36 }} />}
      <span className={cn("relative grid h-9 w-9 shrink-0 place-items-center rounded-lg border transition-colors", selected ? "border-primary/40 bg-primary/15 text-primary" : "border-border/60 bg-background/40 text-muted-foreground")}>
        <Icon className="h-4 w-4" />
      </span>
      <span className="relative min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-[13px] font-semibold">{exercise.title}</span>
          {suggested && <span title="Suggested for today" className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-ice/12 px-1.5 py-0.5 text-[9px] font-semibold text-ice"><Sparkles className="h-2.5 w-2.5" />For you</span>}
        </span>
        <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
          {yourFocus ? "Your Trade Profile focus" : exercise.category === "profile" ? CATEGORY_LABEL.profile : exercise.technique} · {exercise.minutes} min
        </span>
      </span>
    </motion.button>
  </motion.li>;
}

function Field({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("rounded-xl border border-border/60 bg-background/35 transition-[border-color,box-shadow] duration-200 focus-within:border-primary/50 focus-within:shadow-[0_0_0_4px_color-mix(in_oklch,var(--primary)_12%,transparent)]", className)}>{children}</div>;
}

function FieldLabel({ field }: { field: ExerciseField }) {
  return <>
    <span className="flex items-center gap-2 text-sm font-semibold">{field.label}{!field.required && <span className="text-[10px] font-medium text-muted-foreground">Optional</span>}</span>
    <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{field.prompt}</span>
  </>;
}

function ExerciseFieldInput({ field, value, trades, onChange, onView }: { field: ExerciseField; value: unknown; trades: TradeJournalEntry[]; onChange: (value: unknown) => void; onView: (trade: TradeJournalEntry) => void }) {
  if (field.kind === "trade_review") {
    const selected = trades.filter((trade) => trade.result === field.tradeResult).sort((a, b) => b.date_time.localeCompare(a.date_time)).slice(0, field.count ?? 2);
    const answers = (value ?? {}) as Record<string, string>;
    const tone = field.tradeResult === "loss" ? "var(--destructive)" : "var(--success)";
    return <div>
      <div className="mb-3 flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: tone }} /><h4 className="text-sm font-semibold">{field.label}</h4></div>
      {selected.length ? <div className="grid gap-3 xl:grid-cols-2">{selected.map((trade, index) => {
        const done = Boolean((answers[trade.id] ?? "").trim());
        return <motion.div key={trade.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + index * 0.05, duration: 0.22, ease: EASE_OUT }}
          className={cn("rounded-xl border bg-background/30 p-3.5 transition-colors duration-200", done ? "border-success/30" : "border-border/60")}>
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{instrumentName(trade.instrument)} <span className="font-normal capitalize text-muted-foreground">{trade.direction}</span></p>
              <p className="text-[11px] text-muted-foreground">{format(new Date(`${trade.date_time.slice(0, 10)}T12:00:00`), "EEE d MMM")} · {trade.session} · <span className="font-semibold" style={{ color: netRColor(tradeR(trade)) }}>{formatTotalR(tradeR(trade))}</span></p>
            </div>
            <motion.button type="button" onClick={() => onView(trade)} whileTap={{ scale: 0.9, transition: PRESS }} aria-label="View trade" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"><Eye className="h-3.5 w-3.5" /></motion.button>
          </div>
          <Field className="mt-3">
            <textarea value={answers[trade.id] ?? ""} onChange={(e) => onChange({ ...answers, [trade.id]: e.target.value })} placeholder={field.prompt} className={cn(TEXTAREA, "min-h-28 text-sm")} />
          </Field>
        </motion.div>;
      })}</div> : <p className="rounded-xl border border-dashed border-border/60 p-4 text-sm text-muted-foreground">No matching trades yet. You can still set today&apos;s focus and commitment.</p>}
    </div>;
  }

  if (field.kind === "choice") {
    return <div>
      <FieldLabel field={field} />
      <div className="mt-3 grid gap-2 sm:grid-cols-2">{field.options?.map((option) => {
        const on = value === option.value;
        return <motion.button key={option.value} type="button" onClick={() => onChange(option.value)} whileTap={{ scale: 0.97, transition: PRESS }}
          className={cn("relative rounded-xl border px-4 py-3.5 text-left text-sm font-medium transition-colors duration-200", on ? "border-primary/50 text-foreground" : "border-border/60 bg-background/30 text-muted-foreground hover:border-primary/35 hover:text-foreground")}>
          {on && <motion.span layoutId={`choice-${field.id}`} className="absolute inset-0 rounded-xl bg-primary/[.09]" transition={{ type: "spring", stiffness: 420, damping: 36 }} />}
          <span className="relative flex items-center justify-between gap-2">{option.label}{on && <Check className="h-4 w-4 text-primary" />}</span>
        </motion.button>;
      })}</div>
    </div>;
  }

  if (field.kind === "scale") {
    const current = Number(value) || 0;
    return <div>
      <FieldLabel field={field} />
      <div className="mt-3 grid grid-cols-5 gap-1.5" role="radiogroup" aria-label={field.label}>
        {[1, 2, 3, 4, 5].map((n) => {
          const on = current === n;
          return <motion.button key={n} type="button" role="radio" aria-checked={on} onClick={() => onChange(n)} whileTap={{ scale: 0.92, transition: PRESS }}
            className={cn("relative h-12 rounded-xl border text-sm font-bold tabular-nums transition-colors", on ? "border-primary/60 text-primary-foreground" : n <= current ? "border-primary/30 bg-primary/10 text-primary" : "border-border/60 bg-background/30 text-muted-foreground hover:border-primary/35 hover:text-foreground")}>
            {on && <motion.span layoutId={`scale-${field.id}`} className="absolute inset-0 rounded-xl bg-primary" transition={{ type: "spring", stiffness: 480, damping: 34 }} />}
            <span className="relative">{n}</span>
          </motion.button>;
        })}
      </div>
      {field.scaleLabels && <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground"><span>{field.scaleLabels[0]}</span><span>{field.scaleLabels[1]}</span></div>}
    </div>;
  }

  if (field.kind === "list") {
    const lines = Array.from({ length: field.count ?? 3 }, (_, i) => ((value ?? []) as string[])[i] ?? "");
    return <div>
      <FieldLabel field={field} />
      <ol className="mt-3 space-y-2">
        {lines.map((line, i) => <li key={i} className="flex items-center gap-3">
          <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold tabular-nums transition-colors", line.trim() ? "bg-primary/15 text-primary" : "bg-muted/50 text-muted-foreground")}>{i + 1}</span>
          <Field className="flex-1">
            <input value={line} onChange={(e) => { const next = [...lines]; next[i] = e.target.value; onChange(next); }} placeholder={`${field.placeholder ?? "Line"} ${i + 1}`} className="h-12 w-full bg-transparent px-4 text-[15px] outline-none placeholder:text-muted-foreground/60" />
          </Field>
        </li>)}
      </ol>
    </div>;
  }

  return <label className="block">
    <FieldLabel field={field} />
    <Field className="mt-3">
      {field.kind === "textarea"
        ? <textarea value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} className={cn(TEXTAREA, "min-h-36")} />
        : <input type={field.kind === "number" ? "number" : "text"} min={field.kind === "number" ? 0 : undefined} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder}
          className="h-12 w-full bg-transparent px-4 text-[15px] outline-none placeholder:text-muted-foreground/60" />}
    </Field>
  </label>;
}

/** Step two: one focus, with the step-one answers beside it to draw from and a few ideas to start with. */
function FocusStep({ definition, draft, onChange }: { definition: PreMarketExerciseDefinition; draft: Draft; onChange: (focus: string) => void }) {
  const recap = definition.fields.flatMap((field) => {
    const value = draft.inputs[field.id];
    if (field.kind === "trade_review") return Object.values((value ?? {}) as Record<string, string>).filter((t) => t.trim()).map((t) => ({ label: field.label, text: t }));
    if (field.kind === "list") return ((value ?? []) as string[]).filter((t) => t.trim()).map((t) => ({ label: field.label, text: t }));
    if (field.kind === "scale" && value) return [{ label: field.label, text: `${value} of 5` }];
    if (field.kind === "choice" && value) return [{ label: field.label, text: field.options?.find((o) => o.value === value)?.label ?? String(value) }];
    return String(value ?? "").trim() ? [{ label: field.label, text: String(value) }] : [];
  });
  return <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
    <div>
      <p className="text-sm text-muted-foreground">What deserves your attention on every decision today? One thing, said plainly.</p>
      <Field className="mt-3">
        <textarea autoFocus value={draft.focus} onChange={(e) => onChange(e.target.value)} placeholder="Wait for the close beyond the level before entering." className={cn(TEXTAREA, "min-h-44 text-base")} />
      </Field>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {definition.focusIdeas.map((idea, i) => <motion.button key={idea} type="button" onClick={() => onChange(idea)} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 + i * 0.05 }} whileTap={{ scale: 0.95, transition: PRESS }}
          className={cn("rounded-full border px-3 py-1.5 text-xs font-medium transition-colors", draft.focus === idea ? "border-primary/60 bg-primary/10 text-primary" : "border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground")}>
          {idea}
        </motion.button>)}
      </div>
    </div>
    <div className="rounded-xl border border-border/50 bg-background/30 p-4">
      <p className="text-xs font-semibold text-foreground/80">From step 1</p>
      {recap.length ? <ul className="mt-2 space-y-2.5">
        {recap.map((r, i) => <li key={i} className="text-sm leading-relaxed"><span className="block text-[11px] font-medium text-muted-foreground">{r.label}</span>{r.text}</li>)}
      </ul> : <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Your answers from step 1 show here, so you can pick the one that matters most.</p>}
    </div>
  </div>;
}

/** Step three: the commitment, its format, a template to start from and a live preview of the line itself. */
function CommitStep({ definition, draft, onChange }: { definition: PreMarketExerciseDefinition; draft: Draft; onChange: (patch: Partial<Draft>) => void }) {
  const formatValue = draft.commitment_format ?? definition.suggestedCommitmentFormat;
  return <div className="mt-5 space-y-5">
    <p className="text-sm text-muted-foreground">{definition.commitmentPrompt}</p>
    <div>
      <p className="text-xs font-semibold">Format</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Commitment format">
        {(Object.keys(FORMAT_LABEL) as CommitmentFormat[]).map((f) => {
          const on = f === formatValue;
          return <motion.button key={f} type="button" role="radio" aria-checked={on} onClick={() => onChange({ commitment_format: f })} whileTap={{ scale: 0.97, transition: PRESS }}
            className={cn("relative rounded-xl border px-3.5 py-3 text-left transition-colors", on ? "border-primary/50" : "border-border/60 bg-background/30 hover:border-primary/35")}>
            {on && <motion.span layoutId="pm-format" className="absolute inset-0 rounded-xl bg-primary/[.09]" transition={{ type: "spring", stiffness: 420, damping: 36 }} />}
            <span className="relative flex items-center gap-2 text-sm font-semibold">
              {FORMAT_LABEL[f]}
              {f === definition.suggestedCommitmentFormat && <span className="rounded-full bg-ice/12 px-1.5 py-0.5 text-[9px] font-semibold text-ice">Suggested</span>}
            </span>
            <span className="relative mt-0.5 block text-[11px] text-muted-foreground">{FORMAT_HINT[f]}</span>
          </motion.button>;
        })}
      </div>
    </div>
    <div>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold">Your commitment</p>
        <button type="button" onClick={() => onChange({ commitment_text: definition.commitmentTemplate })} className="rounded-full border border-primary/40 px-2.5 py-1 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/10">Use template</button>
      </div>
      <Field className="mt-2">
        <textarea value={draft.commitment_text} onChange={(e) => onChange({ commitment_text: e.target.value })} placeholder={definition.commitmentTemplate} className={cn(TEXTAREA, "min-h-36 text-base")} />
      </Field>
    </div>
    <AnimatePresence initial={false}>
      {draft.commitment_text.trim() && <motion.figure initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.2, ease: EASE_OUT }}
        className="relative overflow-hidden rounded-2xl border border-primary/25 bg-primary/[.06] p-5">
        <Quote className="absolute right-4 top-4 h-8 w-8 text-primary/20" />
        <figcaption className="text-[10px] font-semibold uppercase tracking-[.16em] text-primary">Today, {FORMAT_LABEL[formatValue].toLowerCase()}</figcaption>
        <blockquote className="mt-2 max-w-[60ch] font-heading text-lg font-semibold leading-snug tracking-tight">{draft.commitment_text}</blockquote>
        {draft.focus.trim() && <p className="mt-3 text-xs text-muted-foreground">Focus: <span className="text-foreground/85">{draft.focus}</span></p>}
      </motion.figure>}
    </AnimatePresence>
  </div>;
}

function ProgressRing({ done }: { done: number }) {
  const r = 14;
  const c = 2 * Math.PI * r;
  return <span className="relative grid h-9 w-9 shrink-0 place-items-center" aria-label={`${done} of 3 steps done`}>
    <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90">
      <circle cx="18" cy="18" r={r} fill="none" strokeWidth="3" className="stroke-border/60" />
      <motion.circle cx="18" cy="18" r={r} fill="none" strokeWidth="3" strokeLinecap="round" className="stroke-primary"
        strokeDasharray={c} initial={false} animate={{ strokeDashoffset: c * (1 - done / 3) }} transition={{ duration: 0.45, ease: EASE_OUT }} />
    </svg>
    <span className="text-[10px] font-bold tabular-nums">{done}/3</span>
  </span>;
}

function CompletedSummary({ draft, completedAt, onEdit }: { draft: Draft; completedAt: string; onEdit: () => void }) {
  return <div className="relative p-5 sm:p-7">
    <div className="flex flex-col items-center py-6 text-center">
      <motion.span initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 300, damping: 18 }}
        className="grid h-16 w-16 place-items-center rounded-full bg-success/15 text-success">
        <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.15, duration: 0.45, ease: EASE_OUT }} />
        </svg>
      </motion.span>
      <motion.h3 initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mt-4 font-heading text-xl font-bold tracking-tight">Ready for the open</motion.h3>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.32 }} className="mt-1 text-xs text-muted-foreground">Completed at {format(new Date(completedAt), "HH:mm")}</motion.p>
    </div>
    <div className="grid gap-3 md:grid-cols-2">
      {[{ label: "Today's focus", text: draft.focus }, { label: `Commitment${draft.commitment_format ? ` · ${FORMAT_LABEL[draft.commitment_format]}` : ""}`, text: draft.commitment_text }].map((item, i) =>
        <motion.div key={item.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 + i * 0.08, duration: 0.25, ease: EASE_OUT }}
          className="rounded-xl border border-border/60 bg-background/30 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-primary">{item.label}</p>
          <p className="mt-1.5 text-base font-semibold leading-snug">{item.text}</p>
        </motion.div>)}
    </div>
    <div className="mt-5 flex justify-center">
      <MotionButton arrow={false} onClick={onEdit}><Pencil className="mr-1 inline h-3.5 w-3.5" /> Edit today&apos;s exercise</MotionButton>
    </div>
  </div>;
}
