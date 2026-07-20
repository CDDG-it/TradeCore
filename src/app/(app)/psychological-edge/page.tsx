"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Loader2, Check } from "lucide-react";
import { PageWrapper } from "@/components/ui/page-wrapper";
import { cn } from "@/lib/utils";
import { getTrades, getAnalyses, getPsychEdgeSessions, savePsychEdgeSession } from "@/lib/supabase/queries";
import { computeReflectionForTrade, RESPONSE_TAGS, type PsychEdgeReflection } from "@/lib/psych-edge/engine";
import { tradeR, instrumentName } from "@/lib/journal/weeks";
import { HabitsView } from "@/components/habits/habits-view";
import { MindScoreBreakdown } from "@/components/mind-score/mindscore-breakdown";
import type { TradeJournalEntry, PreTradeAnalysis, PsychEdgeSession, PsychEdgeResponseTag, PsychEdgeSessionInput } from "@/lib/types";

const ACCENT = "oklch(0.70 0.12 183)"; // turquoise, matches the Mindset formula
const GREEN = "oklch(0.58 0.17 145)";
const RED = "oklch(0.58 0.22 25)";

const TAG_LABEL: Record<PsychEdgeResponseTag, string> = {
  calm: "Calm", anxious: "Anxious", euphoric: "Euphoric",
  frustrated: "Frustrated", rushed: "Rushed", numb: "Numb",
};

const fmtR = (v: number) => `${v > 0 ? "+" : ""}${v.toFixed(1)}R`;
const dayLabel = (iso: string) => format(new Date(iso.slice(0, 10) + "T12:00:00"), "MMM d");

/**
 * Reflection tab — every bad-execution trade in the journal gets its own deep
 * 5R walkthrough. The rail lists them all so the whole record of losses is in
 * one place; the panel steps the trader through Report → Respond → Relate →
 * Reason → Reconstruct for the selected trade, each R in its own explained box.
 */
function EdgeReflectionView() {
  const [trades, setTrades] = useState<TradeJournalEntry[] | null>(null);
  const [analyses, setAnalyses] = useState<PreTradeAnalysis[]>([]);
  const [sessions, setSessions] = useState<PsychEdgeSession[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    Promise.all([getTrades(), getAnalyses(), getPsychEdgeSessions()]).then(([t, a, s]) => {
      setTrades(t); setAnalyses(a); setSessions(s);
    });
  }, []);

  // Only bad-execution trades need a reflection, newest first.
  const badTrades = useMemo(
    () => (trades ?? [])
      .filter((t) => t.execution_quality === "bad")
      .sort((a, b) => b.date_time.localeCompare(a.date_time)),
    [trades]
  );

  useEffect(() => {
    if (badTrades.length && (!selectedId || !badTrades.some((t) => t.id === selectedId))) {
      setSelectedId(badTrades[0].id);
    }
  }, [badTrades, selectedId]);

  const sessionByTrade = useMemo(
    () => new Map(sessions.filter((s) => s.trade_id).map((s) => [s.trade_id as string, s])),
    [sessions]
  );

  const selectedTrade = badTrades.find((t) => t.id === selectedId) ?? null;
  const selectedSession = selectedId ? sessionByTrade.get(selectedId) ?? null : null;

  const reflection = useMemo(
    () => (selectedTrade && trades ? computeReflectionForTrade(selectedTrade.id, trades, analyses) : null),
    [selectedTrade, trades, analyses]
  );

  /** Persist a change to the selected trade's reflection, seeding the computed
   *  5R content the first time the trader touches it. */
  async function patch(fields: Partial<Pick<PsychEdgeSession, "response_tag" | "reasoning_answer" | "mistake_cost" | "commitment_statement" | "reconstruction_note" | "reconstruction_confirmed">>) {
    if (!selectedTrade || !reflection) return;
    setSaveError(false);
    const base = selectedSession;
    const input: PsychEdgeSessionInput = {
      date: base?.date ?? selectedTrade.date_time.slice(0, 10),
      trade_id: selectedTrade.id,
      pattern_key: base?.pattern_key ?? reflection.patternKey,
      recurring_pattern_label: base?.recurring_pattern_label ?? reflection.recurringPatternLabel,
      report: base?.report ?? reflection.report,
      relate: base?.relate ?? reflection.relate,
      reason: base?.reason ?? reflection.reason,
      primary_objective: base?.primary_objective ?? reflection.primaryObjective,
      reminder: base?.reminder ?? reflection.reminder,
      success_metric: base?.success_metric ?? reflection.successMetric,
      response_tag: base?.response_tag ?? null,
      reasoning_answer: base?.reasoning_answer ?? null,
      mistake_cost: base?.mistake_cost ?? null,
      commitment_statement: base?.commitment_statement ?? null,
      reconstruction_note: base?.reconstruction_note ?? null,
      reconstruction_confirmed: base?.reconstruction_confirmed ?? false,
      ...fields,
    };
    try {
      const saved = await savePsychEdgeSession(input);
      setSessions((prev) => [saved, ...prev.filter((s) => s.trade_id !== selectedTrade.id)]);
    } catch {
      setSaveError(true);
    }
  }

  if (trades === null) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (badTrades.length === 0) return <EmptyState hasTrades={trades.length > 0} />;

  return (
    <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)] items-start">
      {/* Rail — every loss on record, with its reflection status */}
      <TradeList
        trades={badTrades}
        sessionByTrade={sessionByTrade}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />

      {/* Panel — the 5R walkthrough for the selected trade */}
      <div className="min-w-0">
        {selectedTrade && reflection ? (
          <FiveRWalkthrough
            key={selectedTrade.id}
            trade={selectedTrade}
            session={selectedSession}
            reflection={reflection}
            saveError={saveError}
            onSetTag={(tag) => patch({ response_tag: tag })}
            onSaveAnswer={(v) => patch({ reasoning_answer: v.trim() || null })}
            onSaveCost={(v) => patch({ mistake_cost: v.trim() || null })}
            onSaveCommitment={(v) => patch({ commitment_statement: v.trim() || null })}
            onSaveNote={(v) => patch({ reconstruction_note: v.trim() || null })}
            onToggleCommit={() => patch({ reconstruction_confirmed: !selectedSession?.reconstruction_confirmed })}
          />
        ) : null}
      </div>
    </div>
  );
}

/* ── Rail: all bad-execution trades ───────────────────────────────────── */
function TradeList({
  trades, sessionByTrade, selectedId, onSelect,
}: {
  trades: TradeJournalEntry[];
  sessionByTrade: Map<string, PsychEdgeSession>;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const reflectedCount = trades.filter((t) => sessionByTrade.get(t.id)?.reconstruction_confirmed).length;

  return (
    <div className="rounded-xl border border-border bg-card p-3 lg:sticky lg:top-4">
      <div className="flex items-center justify-between px-1 pb-2">
        <p className="text-sm font-semibold">Trades to reflect on</p>
        <span className="text-[11px] font-semibold tabular-nums text-muted-foreground">{reflectedCount}/{trades.length} done</span>
      </div>
      <p className="px-1 pb-2.5 text-[11px] text-muted-foreground leading-snug">
        Every trade you rated <span className="text-foreground/80 font-medium">bad execution</span> in the journal. Work through each one.
      </p>
      <div className="space-y-1 max-h-[calc(100dvh-16rem)] overflow-y-auto pr-0.5">
        {trades.map((t) => {
          const s = sessionByTrade.get(t.id);
          const committed = !!s?.reconstruction_confirmed;
          const started = !!s && !committed;
          const r = tradeR(t);
          const active = t.id === selectedId;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelect(t.id)}
              className={cn(
                "w-full text-left rounded-lg border px-3 py-2 transition-colors",
                active ? "border-primary/50 bg-primary/5" : "border-border/60 hover:border-primary/30 hover:bg-muted/30"
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border"
                  style={committed
                    ? { background: GREEN, borderColor: GREEN }
                    : started
                    ? { borderColor: ACCENT }
                    : { borderColor: "var(--border)" }}
                >
                  {committed && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3.5} />}
                  {started && <span className="h-1.5 w-1.5 rounded-full" style={{ background: ACCENT }} />}
                </span>
                <span className="text-sm font-bold font-mono truncate">{instrumentName(t.instrument)}</span>
                <span className="text-[11px] text-muted-foreground capitalize">{t.direction}</span>
                <span className="ml-auto text-xs font-bold tabular-nums" style={{ color: r < 0 ? RED : "var(--muted-foreground)" }}>{fmtR(r)}</span>
              </div>
              <div className="flex items-center justify-between mt-1 pl-6">
                <span className="text-[11px] text-muted-foreground tabular-nums">{dayLabel(t.date_time)}</span>
                <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: committed ? GREEN : started ? ACCENT : "var(--muted-foreground)" }}>
                  {committed ? "Reflected" : started ? "In progress" : "Not started"}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── The 5R walkthrough — one explained box per R ─────────────────────── */
function FiveRWalkthrough({
  trade, session, reflection, saveError,
  onSetTag, onSaveAnswer, onSaveCost, onSaveCommitment, onSaveNote, onToggleCommit,
}: {
  trade: TradeJournalEntry;
  session: PsychEdgeSession | null;
  reflection: PsychEdgeReflection;
  saveError: boolean;
  onSetTag: (tag: PsychEdgeResponseTag) => void;
  onSaveAnswer: (v: string) => void;
  onSaveCost: (v: string) => void;
  onSaveCommitment: (v: string) => void;
  onSaveNote: (v: string) => void;
  onToggleCommit: () => void;
}) {
  const [answer, setAnswer] = useState(session?.reasoning_answer ?? "");
  const [cost, setCost] = useState(session?.mistake_cost ?? "");
  const [commitment, setCommitment] = useState(session?.commitment_statement ?? "");
  const [note, setNote] = useState(session?.reconstruction_note ?? "");

  useEffect(() => {
    setAnswer(session?.reasoning_answer ?? "");
    setCost(session?.mistake_cost ?? "");
    setCommitment(session?.commitment_statement ?? "");
    setNote(session?.reconstruction_note ?? "");
  }, [session?.id, session?.reasoning_answer, session?.mistake_cost, session?.commitment_statement, session?.reconstruction_note]);

  const answerDirty = answer.trim() !== (session?.reasoning_answer ?? "").trim();
  const costDirty = cost.trim() !== (session?.mistake_cost ?? "").trim();
  const commitmentDirty = commitment.trim() !== (session?.commitment_statement ?? "").trim();
  const noteDirty = note.trim() !== (session?.reconstruction_note ?? "").trim();

  const respondDone = !!session?.response_tag;
  const reasonDone = !!(session?.reasoning_answer && session.reasoning_answer.trim());
  const costDone = !!(session?.mistake_cost && session.mistake_cost.trim());
  const commitmentDone = !!(session?.commitment_statement && session.commitment_statement.trim());
  const commitDone = !!session?.reconstruction_confirmed;

  // Every written step must be done before the trader can seal the commitment —
  // no one-click "commit" without actually working through the reflection.
  const writtenSteps = [respondDone, reasonDone, costDone, commitmentDone];
  const writtenCount = writtenSteps.filter(Boolean).length;
  const canCommit = writtenSteps.every(Boolean);
  const doneCount = writtenCount + (commitDone ? 1 : 0);

  const r = tradeR(trade);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold font-mono">{instrumentName(trade.instrument)}</span>
            <span className="text-[11px] text-muted-foreground capitalize">{trade.direction} · {trade.session} · {dayLabel(trade.date_time)}</span>
            <span className="text-xs font-bold tabular-nums" style={{ color: r < 0 ? RED : "var(--muted-foreground)" }}>{fmtR(r)}</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Deep reflection — every step is on you. Own the mistake, then commit.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {commitDone && (
            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white" style={{ background: GREEN }}>
              <Check className="h-3 w-3" strokeWidth={3} /> Reflected
            </span>
          )}
          <span className="text-[11px] font-semibold tabular-nums text-muted-foreground">{doneCount}/5 complete</span>
        </div>
      </div>

      {saveError && (
        <p className="text-xs text-destructive">Could not save. Run the latest SQL migration (psych_edge_per_trade) in Supabase.</p>
      )}

      {/* 1 — Report */}
      <StepBox n={1} title="Report" subtitle="What happened"
        purpose="Read back exactly what the journal recorded. No spin, no excuses — just the facts of the trade.">
        <p className="text-sm text-foreground/85">{reflection.report}</p>
        {trade.mistakes?.trim() && (
          <p className="text-xs text-muted-foreground mt-2">
            <span className="font-medium text-foreground/70">Your logged mistake — </span>{trade.mistakes.trim()}
          </p>
        )}
      </StepBox>

      {/* 2 — Respond */}
      <StepBox n={2} title="Respond" subtitle="How it felt" done={respondDone}
        purpose="Name the emotional state you were in when you took this trade. You can't manage what you won't name.">
        <div className="flex flex-wrap gap-1.5">
          {RESPONSE_TAGS.map((tag) => {
            const active = session?.response_tag === tag;
            return (
              <button
                key={tag}
                onClick={() => onSetTag(tag)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
                  active ? "text-white" : "text-muted-foreground border-border bg-secondary hover:text-foreground"
                )}
                style={active ? { background: ACCENT, borderColor: ACCENT } : undefined}
              >
                {TAG_LABEL[tag]}
              </button>
            );
          })}
        </div>
      </StepBox>

      {/* 3 — Relate */}
      <StepBox n={3} title="Relate" subtitle="What it connects to"
        purpose="See how this trade fits your recent history — the pattern behind the mistake, not just the one-off.">
        <p className="text-sm text-foreground/85">
          {reflection.relate ?? "Nothing in your recent history repeats this one yet. Log it honestly so a pattern has room to show up."}
        </p>
      </StepBox>

      {/* 4 — Reason */}
      <StepBox n={4} title="Reason" subtitle="Why it happened & why it's a mistake" done={reasonDone && costDone}
        purpose="The hard part. First name the real reason it happened — then be honest with yourself about why it was a mistake and what it cost. This is what your next reflection checks you against.">
        <p className="text-sm font-semibold text-foreground leading-snug mb-2">{reflection.reason}</p>
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Why it happened — the specific decision, not the outcome."
          rows={2}
          className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/40 focus:border-primary/50 focus:ring-2 focus:ring-primary/15 resize-none"
        />
        {answerDirty && (
          <button
            onClick={() => onSaveAnswer(answer)}
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-all"
            style={{ background: ACCENT }}
          >
            Save answer
          </button>
        )}

        <p className="text-sm font-semibold text-foreground leading-snug mt-4 mb-2">
          Why was this a mistake — and what did it cost you?
        </p>
        <textarea
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          placeholder="Spell it out: the R lost, the rule broken, the trust in your own process. Make it concrete enough to sting."
          rows={2}
          className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/40 focus:border-primary/50 focus:ring-2 focus:ring-primary/15 resize-none"
        />
        {costDirty && (
          <button
            onClick={() => onSaveCost(cost)}
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-all"
            style={{ background: ACCENT }}
          >
            Save
          </button>
        )}
      </StepBox>

      {/* 5 — Reconstruct */}
      <StepBox n={5} title="Reconstruct" subtitle="What changes & your commitment" done={commitmentDone && commitDone}
        purpose="Turn the reflection into one concrete change — then state, in your own words, that you won't do this again, and commit to it.">
        {reflection.primaryObjective && (
          <p className="text-sm font-semibold text-foreground">{reflection.primaryObjective}</p>
        )}
        {reflection.reminder && <p className="text-xs text-muted-foreground mt-1">{reflection.reminder}</p>}
        {reflection.successMetric && (
          <p className="text-xs text-muted-foreground mt-1">
            <span className="font-medium text-foreground/70">Success metric — </span>{reflection.successMetric}
          </p>
        )}

        <p className="text-sm font-semibold text-foreground leading-snug mt-4 mb-2">
          Your commitment — in your own words
        </p>
        <textarea
          value={commitment}
          onChange={(e) => setCommitment(e.target.value)}
          placeholder="Finish it plainly: “Next time [situation], I will [action] instead — and I will not [the mistake] again, because …”"
          rows={3}
          className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/40 focus:border-primary/50 focus:ring-2 focus:ring-primary/15 resize-none"
        />
        {commitmentDirty && (
          <button
            onClick={() => onSaveCommitment(commitment)}
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-all"
            style={{ background: ACCENT }}
          >
            Save commitment
          </button>
        )}

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional — anything else you want to remember, or a condition to watch for."
          rows={2}
          className="mt-3 w-full rounded-lg border border-border bg-input px-3 py-2 text-xs text-foreground outline-none transition-colors placeholder:text-muted-foreground/40 focus:border-primary/50 focus:ring-2 focus:ring-primary/15 resize-none"
        />
        <div className="flex flex-wrap items-center gap-2 mt-2.5">
          {noteDirty && (
            <button
              onClick={() => onSaveNote(note)}
              className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors"
              style={{ borderColor: ACCENT, color: ACCENT }}
            >
              Save note
            </button>
          )}
          <button
            onClick={onToggleCommit}
            disabled={!commitDone && !canCommit}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all",
              commitDone ? "text-white" : "border text-muted-foreground hover:text-foreground",
              !commitDone && !canCommit && "cursor-not-allowed opacity-40 hover:text-muted-foreground"
            )}
            style={commitDone ? { background: GREEN } : { borderColor: "var(--border)" }}
          >
            {commitDone ? "Committed" : "Commit to this"}
          </button>
          {!commitDone && !canCommit && (
            <span className="text-[11px] text-muted-foreground">
              Complete every step above — own it before you commit.
            </span>
          )}
        </div>
      </StepBox>
    </div>
  );
}

/* ── One explained 5R box ─────────────────────────────────────────────── */
function StepBox({
  n, title, subtitle, purpose, done, children,
}: {
  n: number; title: string; subtitle: string; purpose: string; done?: boolean; children: React.ReactNode;
}) {
  const interactive = done !== undefined;
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
          style={done
            ? { background: GREEN, color: "white" }
            : { background: "oklch(0.70 0.12 183 / 0.15)", color: ACCENT }}
        >
          {done ? <Check className="h-3 w-3" strokeWidth={3.5} /> : n}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2 flex-wrap">
            <p className="text-sm font-bold">{title}</p>
            <p className="text-xs font-medium text-muted-foreground/80">{subtitle}</p>
            {interactive && !done && (
              <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Needs you</span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{purpose}</p>
          <div className="mt-2.5">{children}</div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ hasTrades }: { hasTrades: boolean }) {
  return (
    <div className="rounded-xl border border-dashed border-border p-10 text-center">
      <p className="text-sm text-muted-foreground mb-1">No trades to reflect on.</p>
      <p className="text-xs text-muted-foreground/70">
        {hasTrades
          ? "Rate a trade's execution as “bad” in the journal and it appears here for a deep 5R reflection."
          : "Log a trade in the Journal, and any you rate as bad execution show up here to reflect on."}
      </p>
    </div>
  );
}

// ── Hub: Reflection, Habits, MC Mindscore and the Trade Therapist ──────
type EdgeTab = "reflection" | "habits" | "mindscore" | "therapist";
const EDGE_TABS: { key: EdgeTab; label: string }[] = [
  { key: "reflection", label: "Reflection" },
  { key: "habits", label: "Habits" },
  { key: "mindscore", label: "MC Mindscore" },
  { key: "therapist", label: "MC Trade Therapist" },
];

/** MC Trade Therapist — intentionally empty for now; the shell is here so the
 *  tab exists and can be built out. */
function TradeTherapistView() {
  return (
    <div className="rounded-xl border border-dashed border-border p-10 text-center">
      <p className="text-sm text-muted-foreground">MC Trade Therapist</p>
    </div>
  );
}

export default function PsychologicalEdgePage() {
  const [tab, setTab] = useState<EdgeTab>("reflection");

  // Allow deep-linking to a specific tab.
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    if (EDGE_TABS.some((x) => x.key === t)) setTab(t as EdgeTab);
  }, []);

  return (
    <div className="space-y-5">
      {/* Compact header — title and tabs share one row to save vertical space */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-body text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-1.5">
            MC Mindset Formula
          </p>
          <h1 className="font-heading font-black text-2xl md:text-3xl text-foreground tracking-tight leading-[0.95]">
            Psychological Edge
          </h1>
        </div>

        <div className="flex w-full sm:w-fit rounded-lg border border-border/60 overflow-hidden">
          {EDGE_TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                "flex-1 sm:flex-none px-4 sm:px-5 py-2 text-sm font-semibold transition-colors",
                tab === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <PageWrapper>
        {tab === "reflection" ? <EdgeReflectionView />
          : tab === "habits" ? <HabitsView />
          : tab === "mindscore" ? <MindScoreBreakdown />
          : <TradeTherapistView />}
      </PageWrapper>
    </div>
  );
}
