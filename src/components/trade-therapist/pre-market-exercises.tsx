"use client";

import { useEffect, useState } from "react";
import { Check, ChevronDown, Eye, Loader2 } from "lucide-react";
import { AccentPanel } from "@/components/ui/accent-panel";
import { TradeDetailDialog } from "@/components/journal/trade-detail-dialog";
import { getPreMarketExercise, getRecentPreMarketExerciseTypes, savePreMarketExercise } from "@/lib/supabase/queries";
import { aggregateSessions, exerciseDefinition, PRE_MARKET_EXERCISES, selectExercise, type ExerciseField } from "@/lib/pre-market/exercises";
import { cn } from "@/lib/utils";
import type { CommitmentFormat, ExerciseTypeId, TradeJournalEntry } from "@/lib/types";

type Draft = { exercise_type: ExerciseTypeId; inputs: Record<string, unknown>; focus: string; commitment_text: string; commitment_format: CommitmentFormat | null };
const emptyDraft = (type: ExerciseTypeId): Draft => ({ exercise_type: type, inputs: {}, focus: "", commitment_text: "", commitment_format: exerciseDefinition(type).suggestedCommitmentFormat });

export function PreMarketExercises({ trades, date }: { trades: TradeJournalEntry[]; date: string }) {
  const [draft, setDraft] = useState<Draft>(emptyDraft("loss_win_review"));
  const [loaded, setLoaded] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [choosing, setChoosing] = useState(false);
  const [viewing, setViewing] = useState<TradeJournalEntry | null>(null);
  const definition = exerciseDefinition(draft.exercise_type);
  const draftKey = `premarket-library-draft:${date}`;

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([getPreMarketExercise(date), getRecentPreMarketExerciseTypes(1)]).then(([exercise, recent]) => {
      if (!active) return;
      const stored: Draft = exercise ? { exercise_type: exercise.exercise_type, inputs: exercise.inputs, focus: exercise.focus, commitment_text: exercise.commitment_text, commitment_format: exercise.commitment_format } : emptyDraft(selectExercise(aggregateSessions(trades), recent[0]));
      let local: Draft | null = null;
      try { local = JSON.parse(sessionStorage.getItem(draftKey) ?? "null") as Draft | null; } catch { /* database state wins */ }
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
  const canComplete = Boolean(requiredComplete && draft.focus.trim() && draft.commitment_text.trim());
  const setInput = (id: string, value: unknown) => { setDraft((current) => ({ ...current, inputs: { ...current.inputs, [id]: value } })); setSaved(false); };

  function choose(type: ExerciseTypeId) {
    setDraft((current) => ({ ...emptyDraft(type), focus: current.focus, commitment_text: current.commitment_text }));
    setChoosing(false); setSaved(false);
  }

  async function save() {
    if (!canComplete) { setError("Finish the required prompts, today's focus and commitment first."); return; }
    setSaving(true); setError(null);
    try {
      const result = await savePreMarketExercise({ date, ...draft });
      const clean: Draft = { exercise_type: result.exercise_type, inputs: result.inputs, focus: result.focus, commitment_text: result.commitment_text, commitment_format: result.commitment_format };
      setDraft(clean); setLoaded(clean); setSaved(true); setTimeout(() => setSaved(false), 2500);
    } catch { setError("Could not save. Run the daily commitments migration in Supabase."); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;
  return <div className="flex h-full min-h-0 flex-col gap-3">
    <header className="flex shrink-0 items-start justify-between gap-4 rounded-2xl border border-border/60 bg-card/80 p-4">
      <div><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-primary/75">Today&apos;s exercise</p><h2 className="mt-1 font-heading text-lg font-bold">{definition.title}</h2><p className="mt-1 max-w-2xl text-xs text-muted-foreground">{definition.rationale}</p></div>
      <div className="relative shrink-0"><button type="button" onClick={() => setChoosing(!choosing)} className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 px-3 py-2 text-xs font-semibold hover:border-primary/40">Choose another <ChevronDown className="h-3.5 w-3.5" /></button>{choosing && <div className="absolute right-0 z-20 mt-2 w-64 rounded-xl border border-border bg-popover p-1.5 shadow-2xl">{PRE_MARKET_EXERCISES.map((exercise) => <button key={exercise.id} type="button" onClick={() => choose(exercise.id)} className={cn("block w-full rounded-lg px-3 py-2 text-left", exercise.id === draft.exercise_type ? "bg-primary/10 text-primary" : "hover:bg-muted")}><span className="block text-xs font-semibold">{exercise.title}</span><span className="mt-0.5 block text-[10px] text-muted-foreground">{exercise.rationale}</span></button>)}</div>}</div>
    </header>
    <div className="grid min-h-0 flex-1 gap-3 overflow-y-auto lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,.75fr)]">
      <section className="grid content-start gap-3 sm:grid-cols-2">{definition.fields.map((field) => <ExerciseFieldInput key={field.id} field={field} value={draft.inputs[field.id]} trades={trades} onChange={(value) => setInput(field.id, value)} onView={setViewing} />)}</section>
      <aside className="flex flex-col gap-3"><AccentPanel accent="primary" className="p-4"><label className="text-[10px] font-semibold uppercase tracking-[.17em] text-primary/75">One focus for today</label><textarea value={draft.focus} onChange={(e) => setDraft((d) => ({ ...d, focus: e.target.value }))} rows={3} placeholder="What deserves your attention on every decision?" className="mt-2 w-full resize-none rounded-xl border border-border/60 bg-background/50 p-3 text-sm outline-none focus:border-primary/50" /></AccentPanel><AccentPanel accent="cyan" className="p-4"><div className="flex justify-between gap-2"><label className="text-[10px] font-semibold uppercase tracking-[.17em] text-cyan-400">Today&apos;s commitment</label><span className="text-[10px] text-muted-foreground">Suggested: {definition.suggestedCommitmentFormat.replace("_", "/")}</span></div><p className="mt-1 text-[11px] text-muted-foreground">{definition.commitmentPrompt}</p>{!draft.commitment_text && <button type="button" onClick={() => setDraft((current) => ({ ...current, commitment_text: definition.commitmentTemplate }))} className="mt-2 text-[11px] font-semibold text-cyan-400 hover:underline">Use suggested shape</button>}<textarea value={draft.commitment_text} onChange={(e) => setDraft((d) => ({ ...d, commitment_text: e.target.value }))} rows={4} placeholder="Max 3 trades. No entry before CPI." className="mt-2 w-full resize-none rounded-xl border border-border/60 bg-background/50 p-3 text-sm outline-none focus:border-cyan-400/50" /></AccentPanel></aside>
    </div>
    <footer className="flex shrink-0 items-center justify-between gap-3"><p className="text-xs">{error ? <span className="text-destructive">{error}</span> : saved ? <span className="inline-flex items-center gap-1.5 text-success"><Check className="h-3.5 w-3.5" /> Exercise completed</span> : dirty ? <span className="text-muted-foreground">Draft kept in this session.</span> : null}</p><button type="button" onClick={save} disabled={saving || !dirty || !canComplete} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground disabled:opacity-40">{saving && <Loader2 className="h-4 w-4 animate-spin" />} Complete exercise</button></footer>
    <TradeDetailDialog trade={viewing} open={viewing !== null} onOpenChange={(open) => !open && setViewing(null)} />
  </div>;
}

function ExerciseFieldInput({ field, value, trades, onChange, onView }: { field: ExerciseField; value: unknown; trades: TradeJournalEntry[]; onChange: (value: unknown) => void; onView: (trade: TradeJournalEntry) => void }) {
  if (field.kind === "trade_review") {
    const selected = trades.filter((trade) => trade.result === field.tradeResult).sort((a, b) => b.date_time.localeCompare(a.date_time)).slice(0, field.count ?? 2);
    const answers = (value ?? {}) as Record<string, string>;
    return <div className="space-y-2"><h3 className="text-[11px] font-bold uppercase tracking-[.14em] text-muted-foreground">{field.label}</h3>{selected.length ? selected.map((trade) => <div key={trade.id} className="rounded-xl border border-border/60 bg-card p-3"><div className="flex justify-between"><span className="text-xs font-semibold">{trade.instrument} · {trade.session}</span><button type="button" onClick={() => onView(trade)}><Eye className="h-3.5 w-3.5 text-muted-foreground" /></button></div><textarea value={answers[trade.id] ?? ""} onChange={(e) => onChange({ ...answers, [trade.id]: e.target.value })} rows={2} placeholder={field.prompt} className="mt-2 w-full resize-none rounded-lg border border-border bg-background p-2 text-xs" /></div>) : <p className="rounded-xl border border-dashed border-border p-4 text-xs text-muted-foreground">No matching trades yet. You can still complete today&apos;s focus and commitment.</p>}</div>;
  }
  if (field.kind === "choice") return <label className="rounded-xl border border-border/60 bg-card p-4"><span className="text-xs font-semibold">{field.label}</span><span className="mt-1 block text-[11px] text-muted-foreground">{field.prompt}</span><select value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} className="mt-3 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"><option value="">Choose one</option>{field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
  return <label className="rounded-xl border border-border/60 bg-card p-4"><span className="text-xs font-semibold">{field.label}</span><span className="mt-1 block text-[11px] text-muted-foreground">{field.prompt}</span>{field.kind === "textarea" ? <textarea value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} rows={4} placeholder={field.placeholder} className="mt-3 w-full resize-none rounded-lg border border-border bg-background p-3 text-sm" /> : <input type={field.kind === "number" ? "number" : "text"} min={field.kind === "number" ? 1 : undefined} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} className="mt-3 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" />}</label>;
}
