"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, Clock, Eye, Loader2, Pencil, Quote, Sparkles, Wand2 } from "lucide-react";
import { TradeDetailDialog } from "@/components/journal/trade-detail-dialog";
import { PRESS, EASE_OUT } from "@/components/trade-therapist/motion-button";
import { ExerciseIcon } from "@/components/trade-therapist/exercise-icons";
import "@/components/trade-therapist/pre-market-glass.css";
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
const SPRING = { type: "spring", stiffness: 420, damping: 30 } as const;
/** Big writing surfaces: they start roomy and grow with the text, so they never scroll inside. */
const TEXTAREA = "block w-full resize-none overflow-hidden bg-transparent p-4 text-[15px] leading-relaxed outline-none placeholder:text-muted-foreground/60";

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
 *
 * Nothing scrolls inside the page: the library shows every exercise and the
 * text fields grow with what you write. Motion is kept to the controls you
 * touch, not to content sliding in.
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
  const [filter, setFilter] = useState<Filter>("all");
  const [editing, setEditing] = useState(false);
  // Answers per exercise, so switching to another exercise and back keeps them.
  const answersByType = useRef<Partial<Record<ExerciseTypeId, Record<string, unknown>>>>({});
  const scroller = useRef<HTMLDivElement>(null);
  const session = useRef<HTMLElement>(null);
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

  /** Bring the top of the session back into view when it has scrolled away, without a scroll animation. */
  function revealSession() {
    const box = scroller.current;
    const card = session.current;
    if (!box || !card) return;
    const offset = card.getBoundingClientRect().top - box.getBoundingClientRect().top;
    if (offset < 0) box.scrollTop += offset - 8;
  }

  function go(next: Step) {
    setStep(next);
    requestAnimationFrame(revealSession);
  }

  function choose(type: ExerciseTypeId) {
    if (type === draft.exercise_type) return;
    answersByType.current[draft.exercise_type] = draft.inputs;
    setDraft((current) => ({ ...emptyDraft(type), inputs: answersByType.current[type] ?? {}, focus: current.focus, commitment_text: current.commitment_text }));
    setStep(1);
    setEditing(true);
    setError(null);
    requestAnimationFrame(revealSession);
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
      requestAnimationFrame(revealSession);
    } catch (e) {
      // 23514: the database still has the original three-exercise check.
      setError((e as { code?: string })?.code === "23514"
        ? "This exercise needs one database update: run sql/pre_market_exercise_types.sql in Supabase."
        : "Could not save. Check your connection and try again.");
    } finally { setSaving(false); }
  }

  const filtered = useMemo(() => PRE_MARKET_EXERCISES.filter((exercise) => filter === "all" || exercise.category === filter), [filter]);

  if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;

  const trains = definition.focusArea ? focusAreas[definition.focusArea] : null;
  const stepDone = doneFlags[step - 1];

  return <MotionConfig reducedMotion="user">
    <div ref={scroller} className="relative h-full overflow-y-auto overscroll-contain [scrollbar-gutter:stable]">
      {/* Two soft brand glows behind the glass, so it has something to catch. */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[900px] overflow-hidden">
        <div className="absolute -left-24 top-10 h-80 w-80 rounded-full bg-primary/[.13] blur-[90px]" />
        <div className="absolute right-0 top-64 h-96 w-96 rounded-full bg-ice/[.10] blur-[110px]" />
      </div>

      <div className="relative grid gap-4 pb-8 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] lg:items-start">

        {/* ── Library ───────────────────────────────────────────── */}
        <aside className="pm-glass min-w-0 p-3 sm:p-4">
          <div className="flex items-baseline justify-between px-1">
            <h2 className="font-heading text-sm font-bold tracking-tight">Exercises</h2>
            <span className="text-[11px] tabular-nums text-muted-foreground">{PRE_MARKET_EXERCISES.length} in the library</span>
          </div>

          <div role="tablist" aria-label="Filter exercises" className="pm-well mt-3 flex gap-1 p-1">
            {FILTERS.map((f) => {
              const on = f.key === filter;
              return <motion.button key={f.key} type="button" role="tab" aria-selected={on} onClick={() => setFilter(f.key)} whileTap={{ scale: 0.94, transition: PRESS }}
                className={cn("relative flex-1 whitespace-nowrap rounded-lg px-2 py-1.5 text-[11px] font-semibold transition-colors", on ? "text-foreground" : "text-muted-foreground hover:text-foreground")}>
                {on && <motion.span layoutId="pm-filter" className="absolute inset-0 rounded-lg bg-primary/15 shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--primary)_45%,transparent),0_0_16px_-4px_color-mix(in_oklab,var(--primary)_60%,transparent)]" transition={SPRING} />}
                <span className="relative">{f.label}</span>
              </motion.button>;
            })}
          </div>

          <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1" role="radiogroup" aria-label="Choose an exercise">
            {filtered.map((exercise) => <LibraryCard key={exercise.id} exercise={exercise}
              selected={exercise.id === draft.exercise_type} suggested={exercise.id === suggested}
              yourFocus={!!exercise.focusArea && (exercise.focusArea === profileFocus?.primary || exercise.focusArea === profileFocus?.secondary)}
              onChoose={() => choose(exercise.id)} />)}
          </ul>

          {(filter === "profile" || filter === "all") && !profileFocus && (
            <Link href="/trade-therapist?tab=profile" className="group mt-3 flex items-center gap-3 rounded-xl border border-dashed border-primary/30 p-3 text-xs text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground">
              <Sparkles className="h-4 w-4 shrink-0 text-primary transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
              <span className="flex-1">Take the Big Five in My Trade Profile and the exercise for your focus area is picked for you.</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
          )}
        </aside>

        {/* ── Session ───────────────────────────────────────────── */}
        <section ref={session} className="pm-glass min-w-0 overflow-hidden">
          {/* Header: which exercise and why. */}
          <div className="relative border-b border-white/[.06] p-5 sm:p-7">
            <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-primary">Before the open · {format(new Date(`${date}T12:00:00`), "EEEE d MMMM")}</p>
            <motion.div key={definition.id} initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.18 }} className="mt-3 flex items-start gap-4">
              <motion.span initial="rest" animate="active" className="pm-glass pm-glass--active grid h-14 w-14 shrink-0 place-items-center text-primary">
                <ExerciseIcon id={definition.id} size={26} />
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
          </div>

          {showSummary ? (
            <CompletedSummary draft={draft} completedAt={completedAt!} onEdit={() => { setEditing(true); go(1); }} />
          ) : (
            <>
              {/* Stepper: every step is clickable; done steps carry a tick. */}
              <nav aria-label="Steps" className="grid grid-cols-3 gap-1.5 border-b border-white/[.06] p-2.5 sm:px-5">
                {STEPS.map(({ step: s, label }) => {
                  const on = s === step;
                  const done = doneFlags[s - 1];
                  return <motion.button key={s} type="button" onClick={() => go(s)} aria-current={on ? "step" : undefined}
                    whileHover={on ? undefined : { y: -1.5 }} whileTap={{ scale: 0.96, transition: PRESS }}
                    className={cn("relative flex items-center justify-center gap-2 rounded-xl px-2 py-2.5 text-xs font-semibold transition-colors sm:justify-start sm:px-3", on ? "text-foreground" : "text-muted-foreground hover:text-foreground")}>
                    {on && <motion.span layoutId="pm-step" className="absolute inset-0 rounded-xl bg-primary/[.12] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--primary)_45%,transparent),0_0_22px_-6px_color-mix(in_oklab,var(--primary)_60%,transparent)]" transition={SPRING} />}
                    <motion.span key={String(done)} initial={done ? { scale: 0.4 } : false} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 16 }}
                      className={cn("relative grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-bold tabular-nums", done ? "bg-primary text-primary-foreground shadow-[0_0_12px_-2px_var(--primary)]" : on ? "border border-primary text-primary" : "border border-border text-muted-foreground")}>
                      {done ? <Check className="h-3 w-3" strokeWidth={3} /> : s}
                    </motion.span>
                    <span className="relative hidden sm:inline">{label}</span>
                  </motion.button>;
                })}
              </nav>

              <motion.div key={`${definition.id}-${step}`} initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }} className="p-5 sm:p-7">
                <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-primary">Step {step} of 3</p>
                <h3 className="mt-1 font-heading text-xl font-bold tracking-tight">{STEPS[step - 1].title}</h3>

                {step === 1 && <div className="mt-5 space-y-6">
                  {definition.fields.map((field) => <ExerciseFieldInput key={field.id} field={field} value={draft.inputs[field.id]} trades={trades} onChange={(value) => setInput(field.id, value)} onView={setViewing} />)}
                </div>}

                {step === 2 && <FocusStep definition={definition} draft={draft} onChange={(focus) => update({ focus })} />}

                {step === 3 && <CommitStep definition={definition} draft={draft} onChange={update} />}
              </motion.div>

              <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[.06] px-5 py-4 sm:px-7">
                <div className="flex min-w-0 items-center gap-3">
                  <ProgressRing done={doneCount} />
                  <p className="min-w-0 text-xs">
                    {error ? <span className="text-destructive">{error}</span>
                      : <span className="text-muted-foreground">{doneCount === 3 ? "Ready to complete." : `${3 - doneCount} step${3 - doneCount === 1 ? "" : "s"} to go.`}{dirty ? " Draft kept in this session." : ""}</span>}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {step > 1 && <GlowButton icon="back" onClick={() => go((step - 1) as Step)}>Back</GlowButton>}
                  {step < 3
                    ? <GlowButton primary icon="next" nudge={stepDone} onClick={() => go((step + 1) as Step)}>Next</GlowButton>
                    : <GlowButton primary ready={canComplete && (dirty || !completed)} icon={saving ? "saving" : "check"} onClick={() => void save()} disabled={saving || (!dirty && completed)}>
                      {completedAt ? "Save changes" : "Complete exercise"}
                    </GlowButton>}
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

/**
 * The page's buttons. Primary: a turquoise-to-cyan fill with a light sweep on
 * hover, a lift and a glow; `ready` makes the glow breathe and the sweep run on
 * its own, `nudge` makes the arrow lean forward. Secondary: glass with a glowing
 * edge on hover.
 */
function GlowButton({ primary = false, ready = false, nudge = false, icon, disabled, onClick, children, size = "md" }: {
  primary?: boolean; ready?: boolean; nudge?: boolean; icon?: "next" | "back" | "check" | "saving" | "edit" | "wand";
  disabled?: boolean; onClick?: () => void; children: React.ReactNode; size?: "sm" | "md";
}) {
  const reduce = useReducedMotion();
  const Icon = icon === "back" ? ArrowLeft : icon === "next" ? ArrowRight : icon === "check" ? Check : icon === "edit" ? Pencil : icon === "wand" ? Wand2 : icon === "saving" ? Loader2 : null;
  const live = ready && !disabled && !reduce;
  return <motion.button type="button" onClick={onClick} disabled={disabled} initial="rest" whileHover={disabled ? undefined : "hover"} whileTap={disabled ? undefined : { scale: 0.95, transition: PRESS }}
    variants={{ rest: { y: 0 }, hover: { y: -2 } }}
    transition={live ? { ...SPRING, boxShadow: { duration: 2.2, repeat: Infinity, ease: "easeInOut" } } : SPRING}
    animate={live ? { boxShadow: ["0 0 0 0 rgba(20,184,166,0.0), 0 0 18px -6px rgba(20,184,166,0.55)", "0 0 0 4px rgba(20,184,166,0.16), 0 0 30px -4px rgba(20,184,166,0.8)", "0 0 0 0 rgba(20,184,166,0.0), 0 0 18px -6px rgba(20,184,166,0.55)"] } : undefined}
    style={live ? undefined : { boxShadow: primary && !disabled ? "0 6px 22px -10px rgba(20,184,166,0.8)" : undefined }}
    className={cn("group/glow relative inline-flex items-center justify-center gap-1.5 overflow-hidden rounded-xl font-semibold transition-[opacity,color,border-color] duration-200 disabled:pointer-events-none disabled:opacity-40",
      size === "sm" ? "px-3 py-1.5 text-[11px]" : "px-4 py-2.5 text-xs",
      primary ? "bg-gradient-to-r from-primary to-[color-mix(in_oklab,var(--primary)_55%,var(--ice))] text-[var(--on-brand)]" : "pm-glass pm-glass--hover text-foreground")}>
    {primary && <motion.span aria-hidden className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/40 to-transparent"
      variants={{ rest: { x: "0%", opacity: 0 }, hover: { x: "320%", opacity: 1, transition: { duration: 0.7, ease: "easeOut" } } }}
      animate={live ? { x: ["0%", "320%"], opacity: [0, 1, 0] } : undefined}
      {...(live ? { transition: { duration: 1.6, repeat: Infinity, repeatDelay: 1.4, ease: "easeInOut" } } : {})} />}
    {Icon && icon === "back" && <motion.span variants={{ rest: { x: 0 }, hover: { x: -3 } }} className="relative"><Icon className="h-3.5 w-3.5" /></motion.span>}
    {Icon && (icon === "edit" || icon === "wand") && <motion.span variants={{ rest: { rotate: 0, scale: 1 }, hover: { rotate: -14, scale: 1.15 } }} className="relative"><Icon className="h-3.5 w-3.5" /></motion.span>}
    <span className="relative">{children}</span>
    {Icon && icon === "next" && <motion.span variants={{ rest: { x: 0 }, hover: { x: 3 } }} animate={nudge && !reduce ? { x: [0, 4, 0] } : undefined}
      {...(nudge && !reduce ? { transition: { duration: 0.9, repeat: Infinity, repeatDelay: 0.6, ease: "easeInOut" } } : {})} className="relative"><Icon className="h-3.5 w-3.5" /></motion.span>}
    {Icon && icon === "check" && <motion.span variants={{ rest: { scale: 1, rotate: 0 }, hover: { scale: 1.2, rotate: -8 } }} className="relative"><Icon className="h-3.5 w-3.5" strokeWidth={3} /></motion.span>}
    {Icon && icon === "saving" && <Icon className="relative h-3.5 w-3.5 animate-spin" />}
  </motion.button>;
}

function Chip({ children, tone = "muted" }: { children: React.ReactNode; tone?: "muted" | "ice" }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium backdrop-blur",
    tone === "ice" ? "border-ice/30 bg-ice/10 text-ice shadow-[0_0_14px_-6px_var(--ice)]" : "border-white/10 bg-white/[.03] text-muted-foreground")}>{children}</span>;
}

function LibraryCard({ exercise, selected, suggested, yourFocus, onChoose }: {
  exercise: PreMarketExerciseDefinition; selected: boolean; suggested: boolean; yourFocus: boolean; onChoose: () => void;
}) {
  return <li className="min-w-0">
    <motion.button type="button" role="radio" aria-checked={selected} onClick={onChoose}
      initial="rest" animate={selected ? "active" : "rest"} whileHover={selected ? "active" : "hover"} whileTap={{ scale: 0.97, transition: PRESS }}
      className={cn("pm-glass group flex h-full w-full items-start gap-3 p-3 text-left", selected ? "pm-glass--active" : "pm-glass--hover")}>
      <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg transition-[color,background-color,box-shadow] duration-300",
        selected ? "bg-primary/15 text-primary shadow-[0_0_18px_-4px_color-mix(in_oklab,var(--primary)_70%,transparent)]" : "bg-white/[.04] text-muted-foreground group-hover:text-foreground")}>
        <ExerciseIcon id={exercise.id} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-[13px] font-semibold">{exercise.title}</span>
          {suggested && <span title="Suggested for today" className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-ice/12 px-1.5 py-0.5 text-[9px] font-semibold text-ice shadow-[0_0_10px_-4px_var(--ice)]"><Sparkles className="h-2.5 w-2.5" />For you</span>}
        </span>
        <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
          {yourFocus ? "Your Trade Profile focus" : exercise.category === "profile" ? CATEGORY_LABEL.profile : exercise.technique} · {exercise.minutes} min
        </span>
      </span>
    </motion.button>
  </li>;
}

/** A textarea that grows with its content, so it never scrolls inside (works where CSS field-sizing does not). */
function GrowingTextarea({ className, value, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { value: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);
  return <textarea ref={ref} value={value} className={cn(TEXTAREA, className)} {...props} />;
}

function Field({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("pm-well", className)}>{children}</div>;
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
      <div className="mb-3 flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: tone, boxShadow: `0 0 10px ${tone}` }} /><h4 className="text-sm font-semibold">{field.label}</h4></div>
      {selected.length ? <div className="grid gap-3 xl:grid-cols-2">{selected.map((trade) => {
        const done = Boolean((answers[trade.id] ?? "").trim());
        return <div key={trade.id} className={cn("pm-glass p-3.5", done && "pm-glass--active")}>
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{instrumentName(trade.instrument)} <span className="font-normal capitalize text-muted-foreground">{trade.direction}</span></p>
              <p className="text-[11px] text-muted-foreground">{format(new Date(`${trade.date_time.slice(0, 10)}T12:00:00`), "EEE d MMM")} · {trade.session} · <span className="font-semibold" style={{ color: netRColor(tradeR(trade)) }}>{formatTotalR(tradeR(trade))}</span></p>
            </div>
            <motion.button type="button" onClick={() => onView(trade)} whileHover={{ scale: 1.1, rotate: -6 }} whileTap={{ scale: 0.9, transition: PRESS }} aria-label="View trade"
              className="pm-glass pm-glass--hover flex h-8 w-8 shrink-0 items-center justify-center text-muted-foreground hover:text-primary"><Eye className="h-3.5 w-3.5" /></motion.button>
          </div>
          <Field className="mt-3">
            <GrowingTextarea value={answers[trade.id] ?? ""} onChange={(e) => onChange({ ...answers, [trade.id]: e.target.value })} placeholder={field.prompt} rows={4} className="min-h-28 text-sm" />
          </Field>
        </div>;
      })}</div> : <p className="rounded-xl border border-dashed border-border/60 p-4 text-sm text-muted-foreground">No matching trades yet. You can still set today&apos;s focus and commitment.</p>}
    </div>;
  }

  if (field.kind === "choice") {
    return <div>
      <FieldLabel field={field} />
      <div className="mt-3 grid gap-2 sm:grid-cols-2">{field.options?.map((option) => {
        const on = value === option.value;
        return <motion.button key={option.value} type="button" onClick={() => onChange(option.value)} whileHover={{ y: -2 }} whileTap={{ scale: 0.97, transition: PRESS }}
          className={cn("pm-glass px-4 py-3.5 text-left text-sm font-medium transition-colors duration-200", on ? "pm-glass--active text-foreground" : "pm-glass--hover text-muted-foreground hover:text-foreground")}>
          <span className="flex items-center justify-between gap-2">{option.label}
            <AnimatePresence>{on && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: "spring", stiffness: 500, damping: 18 }}><Check className="h-4 w-4 text-primary" /></motion.span>}</AnimatePresence>
          </span>
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
          return <motion.button key={n} type="button" role="radio" aria-checked={on} onClick={() => onChange(n)} whileHover={{ y: -2 }} whileTap={{ scale: 0.9, transition: PRESS }}
            className={cn("pm-well relative h-12 text-sm font-bold tabular-nums transition-colors", on ? "text-[var(--on-brand)]" : n <= current ? "text-primary" : "text-muted-foreground hover:text-foreground")}>
            {n <= current && !on && <span className="absolute inset-0 rounded-[inherit] bg-primary/10" />}
            {on && <motion.span layoutId={`scale-${field.id}`} className="absolute inset-0 rounded-[inherit] bg-gradient-to-br from-primary to-[color-mix(in_oklab,var(--primary)_55%,var(--ice))] shadow-[0_0_20px_-4px_var(--primary)]" transition={SPRING} />}
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
          <motion.span animate={{ scale: line.trim() ? 1.08 : 1 }} transition={{ type: "spring", stiffness: 500, damping: 18 }}
            className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold tabular-nums transition-[background-color,color,box-shadow]", line.trim() ? "bg-primary/20 text-primary shadow-[0_0_12px_-3px_var(--primary)]" : "bg-white/[.05] text-muted-foreground")}>{i + 1}</motion.span>
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
        ? <GrowingTextarea value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} rows={5} className="min-h-36" />
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
        <GrowingTextarea value={draft.focus} onChange={(e) => onChange(e.target.value)} placeholder="Wait for the close beyond the level before entering." rows={6} className="min-h-44 text-base" />
      </Field>
      <p className="mt-4 text-[11px] font-medium text-muted-foreground">Or start from one of these</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {definition.focusIdeas.map((idea) => {
          const on = draft.focus === idea;
          return <motion.button key={idea} type="button" onClick={() => onChange(idea)} whileHover={{ y: -2, scale: 1.03 }} whileTap={{ scale: 0.94, transition: PRESS }}
            className={cn("rounded-full border px-3.5 py-1.5 text-xs font-medium backdrop-blur transition-[color,border-color,box-shadow,background-color] duration-200",
              on ? "border-primary/60 bg-primary/15 text-primary shadow-[0_0_16px_-4px_var(--primary)]" : "border-white/10 bg-white/[.03] text-muted-foreground hover:border-primary/45 hover:text-foreground hover:shadow-[0_0_14px_-6px_var(--primary)]")}>
            {idea}
          </motion.button>;
        })}
      </div>
    </div>
    <div className="pm-glass p-4">
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
          return <motion.button key={f} type="button" role="radio" aria-checked={on} onClick={() => onChange({ commitment_format: f })} whileHover={{ y: -2 }} whileTap={{ scale: 0.97, transition: PRESS }}
            className={cn("pm-glass px-3.5 py-3 text-left", on ? "pm-glass--active" : "pm-glass--hover")}>
            <span className="flex items-center gap-2 text-sm font-semibold">
              {FORMAT_LABEL[f]}
              {f === definition.suggestedCommitmentFormat && <span className="rounded-full bg-ice/12 px-1.5 py-0.5 text-[9px] font-semibold text-ice">Suggested</span>}
            </span>
            <span className="mt-0.5 block text-[11px] text-muted-foreground">{FORMAT_HINT[f]}</span>
          </motion.button>;
        })}
      </div>
    </div>
    <div>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold">Your commitment</p>
        <GlowButton size="sm" icon="wand" onClick={() => onChange({ commitment_text: definition.commitmentTemplate })}>Use template</GlowButton>
      </div>
      <Field className="mt-2">
        <GrowingTextarea value={draft.commitment_text} onChange={(e) => onChange({ commitment_text: e.target.value })} placeholder={definition.commitmentTemplate} rows={5} className="min-h-36 text-base" />
      </Field>
    </div>
    {draft.commitment_text.trim() && <figure className="pm-glass pm-glass--active relative overflow-hidden p-5">
      <Quote className="absolute right-4 top-4 h-8 w-8 text-primary/20" />
      <figcaption className="text-[10px] font-semibold uppercase tracking-[.16em] text-primary">Today, {FORMAT_LABEL[formatValue].toLowerCase()}</figcaption>
      <blockquote className="mt-2 max-w-[60ch] font-heading text-lg font-semibold leading-snug tracking-tight">{draft.commitment_text}</blockquote>
      {draft.focus.trim() && <p className="mt-3 text-xs text-muted-foreground">Focus: <span className="text-foreground/85">{draft.focus}</span></p>}
    </figure>}
  </div>;
}

function ProgressRing({ done }: { done: number }) {
  const r = 14;
  const c = 2 * Math.PI * r;
  return <span className="relative grid h-9 w-9 shrink-0 place-items-center" aria-label={`${done} of 3 steps done`}>
    <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90 drop-shadow-[0_0_6px_color-mix(in_oklab,var(--primary)_60%,transparent)]">
      <circle cx="18" cy="18" r={r} fill="none" strokeWidth="3" className="stroke-white/10" />
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
        className="grid h-16 w-16 place-items-center rounded-full bg-success/15 text-success shadow-[0_0_30px_-6px_var(--success)]">
        <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.15, duration: 0.45, ease: EASE_OUT }} />
        </svg>
      </motion.span>
      <h3 className="mt-4 font-heading text-xl font-bold tracking-tight">Ready for the open</h3>
      <p className="mt-1 text-xs text-muted-foreground">Completed at {format(new Date(completedAt), "HH:mm")}</p>
    </div>
    <div className="grid gap-3 md:grid-cols-2">
      {[{ label: "Today's focus", text: draft.focus }, { label: `Commitment${draft.commitment_format ? ` · ${FORMAT_LABEL[draft.commitment_format]}` : ""}`, text: draft.commitment_text }].map((item) =>
        <div key={item.label} className="pm-glass p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-primary">{item.label}</p>
          <p className="mt-1.5 text-base font-semibold leading-snug">{item.text}</p>
        </div>)}
    </div>
    <div className="mt-5 flex justify-center">
      <GlowButton icon="edit" onClick={onEdit}>Edit today&apos;s exercise</GlowButton>
    </div>
  </div>;
}
