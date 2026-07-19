"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { PageWrapper } from "@/components/ui/page-wrapper";
import { cn } from "@/lib/utils";
import { getTrades, getAnalyses, getPsychEdgeSessions, savePsychEdgeSession } from "@/lib/supabase/queries";
import { computeReflection, buildPreMarketBriefing, RESPONSE_TAGS, type PsychEdgeReflection, type PreMarketBriefing } from "@/lib/psych-edge/engine";
import { HabitsView } from "@/components/habits/habits-view";
import { TradingRulesEditor } from "@/components/habits/trading-rules";
import { ConfluencesEditor } from "@/components/habits/confluences-editor";
import { MonteCarloSimulator } from "@/components/strategy/monte-carlo";
import type { TradeJournalEntry, PreTradeAnalysis, PsychEdgeSession, PsychEdgeResponseTag } from "@/lib/types";

const TODAY = format(new Date(), "yyyy-MM-dd");
const ACCENT = "oklch(0.70 0.12 183)"; // turquoise, matches the Mindset formula

const TAG_LABEL: Record<PsychEdgeResponseTag, string> = {
  calm: "Calm", anxious: "Anxious", euphoric: "Euphoric",
  frustrated: "Frustrated", rushed: "Rushed", numb: "Numb",
};

function EdgeReflectionView() {
  const [trades, setTrades] = useState<TradeJournalEntry[] | null>(null);
  const [analyses, setAnalyses] = useState<PreTradeAnalysis[]>([]);
  const [sessions, setSessions] = useState<PsychEdgeSession[]>([]);
  const [saveError, setSaveError] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [savingAnswer, setSavingAnswer] = useState(false);
  const [answerDraft, setAnswerDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");

  async function load() {
    const [t, a, s] = await Promise.all([getTrades(), getAnalyses(), getPsychEdgeSessions()]);
    setTrades(t);
    setAnalyses(a);
    setSessions(s);
    return { t, a, s };
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const priorSessions = useMemo(() => sessions.filter((s) => s.date !== TODAY), [sessions]);
  const todaysSession = useMemo(() => sessions.find((s) => s.date === TODAY) ?? null, [sessions]);

  const live = useMemo(
    () => (trades ? computeReflection(trades, analyses, priorSessions) : null),
    [trades, analyses, priorSessions]
  );
  const briefing = useMemo(
    () => (trades ? buildPreMarketBriefing(trades, analyses, priorSessions) : null),
    [trades, analyses, priorSessions]
  );

  // Regenerate whenever the latest trade differs from what today's saved
  // session (if any) is based on — a new trade means a new 5R reflection.
  useEffect(() => {
    if (!live) return;
    if (todaysSession && todaysSession.trade_id === live.tradeId) return;
    void persistNew(live);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live?.tradeId]);

  useEffect(() => {
    setAnswerDraft(todaysSession?.reasoning_answer ?? "");
    setNoteDraft(todaysSession?.reconstruction_note ?? "");
  }, [todaysSession?.id]);

  async function persistNew(r: PsychEdgeReflection) {
    setSaveError(false);
    try {
      const saved = await savePsychEdgeSession({
        date: TODAY,
        trade_id: r.tradeId,
        pattern_key: r.patternKey,
        recurring_pattern_label: r.recurringPatternLabel,
        report: r.report,
        relate: r.relate,
        reason: r.reason,
        primary_objective: r.primaryObjective,
        reminder: r.reminder,
        success_metric: r.successMetric,
        response_tag: null,
        reasoning_answer: null,
        reconstruction_note: null,
        reconstruction_confirmed: false,
      });
      setSessions((prev) => [saved, ...prev.filter((s) => s.date !== TODAY)]);
    } catch {
      setSaveError(true);
    }
  }

  /** Patches a field on today's session without disturbing the rest. */
  async function patch(fields: Partial<Pick<PsychEdgeSession, "response_tag" | "reasoning_answer" | "reconstruction_note" | "reconstruction_confirmed">>) {
    if (!todaysSession) return;
    setSaveError(false);
    try {
      const saved = await savePsychEdgeSession({
        date: todaysSession.date,
        trade_id: todaysSession.trade_id,
        pattern_key: todaysSession.pattern_key,
        recurring_pattern_label: todaysSession.recurring_pattern_label,
        report: todaysSession.report,
        relate: todaysSession.relate,
        reason: todaysSession.reason,
        primary_objective: todaysSession.primary_objective,
        reminder: todaysSession.reminder,
        success_metric: todaysSession.success_metric,
        response_tag: todaysSession.response_tag,
        reasoning_answer: todaysSession.reasoning_answer,
        reconstruction_note: todaysSession.reconstruction_note,
        reconstruction_confirmed: todaysSession.reconstruction_confirmed,
        ...fields,
      });
      setSessions((prev) => [saved, ...prev.filter((s) => s.date !== TODAY)]);
    } catch {
      setSaveError(true);
    }
  }

  async function regenerate() {
    setRegenerating(true);
    const { t, a } = await load();
    const s = await getPsychEdgeSessions();
    const prior = s.filter((x) => x.date !== TODAY);
    const fresh = computeReflection(t, a, prior);
    if (fresh) await persistNew(fresh);
    setRegenerating(false);
  }

  async function saveAnswer() {
    setSavingAnswer(true);
    await patch({ reasoning_answer: answerDraft.trim() || null });
    setSavingAnswer(false);
  }

  async function saveNote() {
    await patch({ reconstruction_note: noteDraft.trim() || null });
  }

  if (trades === null) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (trades.length === 0) return <EmptyState />;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px] items-start">
      {/* Main column — the 5R reflection, compact & screen-filling */}
      <div className="min-w-0">
        {todaysSession && (
          <Reflection
            session={todaysSession}
            tradesAnalyzed={live?.tradesAnalyzed ?? trades.length}
            onRegenerate={regenerate}
            regenerating={regenerating}
            saveError={saveError}
            answerDraft={answerDraft}
            setAnswerDraft={setAnswerDraft}
            onSaveAnswer={saveAnswer}
            savingAnswer={savingAnswer}
            noteDraft={noteDraft}
            setNoteDraft={setNoteDraft}
            onSaveNote={saveNote}
            onSetTag={(tag) => patch({ response_tag: tag })}
            onConfirm={() => patch({ reconstruction_confirmed: !todaysSession.reconstruction_confirmed })}
          />
        )}
      </div>

      {/* Side column — briefing + history, glanceable at a fixed width */}
      <aside className="space-y-4">
        {briefing && <PreMarketCheckUp briefing={briefing} />}
        {priorSessions.length > 0 && <History sessions={priorSessions} />}
      </aside>
    </div>
  );
}

// ── Hub: Reflection, Habits and My Strategy ────────────────────────────
type EdgeTab = "reflection" | "habits" | "strategy";
const EDGE_TABS: { key: EdgeTab; label: string }[] = [
  { key: "reflection", label: "Reflection" },
  { key: "habits", label: "Habits" },
  { key: "strategy", label: "My Strategy" },
];

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
          : <MyStrategyView />}
      </PageWrapper>
    </div>
  );
}

function MyStrategyView() {
  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <TradingRulesEditor />
        <ConfluencesEditor />
      </div>
      <div className="border-t border-border/60 pt-6">
        <MonteCarloSimulator />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-border p-10 text-center">
      <p className="text-sm text-muted-foreground mb-1">Nothing to analyze yet.</p>
      <p className="text-xs text-muted-foreground/70">Log a trade in the Journal and your first session appears here.</p>
    </div>
  );
}

// ── Pre-market check-up — a briefing, no input ───────────────────────
function PreMarketCheckUp({ briefing }: { briefing: PreMarketBriefing }) {
  if (!briefing.hasHistory) {
    return (
      <div className="rounded-xl border border-dashed border-border p-4">
        <p className="text-xs text-muted-foreground">Your pre-market check-up fills in once you&apos;ve reflected at least once.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-2.5">
      <p className="text-sm font-semibold">Pre-market check-up</p>

      {briefing.statusText && (
        <p className={cn("text-sm leading-relaxed", briefing.held ? "text-success" : "text-destructive")}>
          {briefing.statusText}
        </p>
      )}

      {briefing.objective && !briefing.statusText && (
        <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1">Carrying into today</p>
          <p className="text-sm text-foreground/85">{briefing.objective}</p>
          {briefing.reminder && <p className="text-xs text-muted-foreground mt-1">{briefing.reminder}</p>}
        </div>
      )}

      {briefing.recentMistakes.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Recent mistakes on record</p>
          {briefing.recentMistakes.map((m, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
              <span>
                <span className="tabular-nums text-muted-foreground/60">{format(new Date(m.date + "T12:00:00"), "MMM d")}</span>
                {" — "}
                <span className="text-foreground/70">&quot;{m.text}&quot;</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Post-trade reflection — the 5R walkthrough ───────────────────────
function StepLabel({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <span
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
        style={{ background: "oklch(0.70 0.12 183 / 0.15)", color: ACCENT }}
      >
        {n}
      </span>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">{children}</p>
    </div>
  );
}

function Reflection({
  session, tradesAnalyzed, onRegenerate, regenerating, saveError,
  answerDraft, setAnswerDraft, onSaveAnswer, savingAnswer,
  noteDraft, setNoteDraft, onSaveNote, onSetTag, onConfirm,
}: {
  session: PsychEdgeSession;
  tradesAnalyzed: number;
  onRegenerate: () => void;
  regenerating: boolean;
  saveError: boolean;
  answerDraft: string;
  setAnswerDraft: (v: string) => void;
  onSaveAnswer: () => void;
  savingAnswer: boolean;
  noteDraft: string;
  setNoteDraft: (v: string) => void;
  onSaveNote: () => void;
  onSetTag: (tag: PsychEdgeResponseTag) => void;
  onConfirm: () => void;
}) {
  const answerDirty = answerDraft.trim() !== (session.reasoning_answer ?? "").trim();
  const noteDirty = noteDraft.trim() !== (session.reconstruction_note ?? "").trim();
  const reasonStep = session.relate ? 4 : 3;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <p className="text-sm font-semibold">Post-trade reflection</p>
          <span className="text-xs text-muted-foreground/60 tabular-nums hidden sm:inline">· {tradesAnalyzed} trade{tradesAnalyzed !== 1 ? "s" : ""}</span>
        </div>
        <button
          onClick={onRegenerate}
          disabled={regenerating}
          title="Re-read the journal for new trades"
          className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground hover:border-primary/30 disabled:opacity-50 shrink-0"
        >
          {regenerating ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {saveError && (
        <p className="text-xs text-destructive">Could not save. Run the latest SQL migration (psych_edge_sessions) in Supabase.</p>
      )}

      {/* Two columns: the read-back / reasoning steps (1–4) beside the
          reconstruction (5), so the whole 5R loop fits one screen. */}
      <div className="grid gap-3 md:grid-cols-2 items-start">
        {/* Steps 1–4 */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3.5">
          {/* 1 — Report */}
          <div>
            <StepLabel n={1}>What happened</StepLabel>
            <p className="text-sm text-foreground/80">{session.report}</p>
          </div>

          {/* 2 — Respond */}
          <div>
            <StepLabel n={2}>How did it feel in the moment</StepLabel>
            <div className="flex flex-wrap gap-1.5">
              {RESPONSE_TAGS.map((tag) => {
                const active = session.response_tag === tag;
                return (
                  <button
                    key={tag}
                    onClick={() => onSetTag(tag)}
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-medium border transition-colors",
                      active ? "text-white" : "text-muted-foreground border-border bg-secondary hover:text-foreground"
                    )}
                    style={active ? { background: ACCENT, borderColor: ACCENT } : undefined}
                  >
                    {TAG_LABEL[tag]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3 — Relate */}
          {session.relate && (
            <div>
              <StepLabel n={3}>What this connects to</StepLabel>
              <p className="text-sm text-foreground/80">{session.relate}</p>
            </div>
          )}

          {/* 4 — Reason */}
          <div>
            <StepLabel n={reasonStep}>Why</StepLabel>
            <p className="text-sm font-semibold text-foreground leading-snug mb-2">{session.reason}</p>
            <textarea
              value={answerDraft}
              onChange={(e) => setAnswerDraft(e.target.value)}
              placeholder="Answer honestly — this is what the next session checks against."
              rows={2}
              className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/40 focus:border-primary/50 focus:ring-2 focus:ring-primary/15 resize-none"
            />
            {answerDirty && (
              <button
                onClick={onSaveAnswer}
                disabled={savingAnswer}
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-all disabled:opacity-50"
                style={{ background: ACCENT }}
              >
                {savingAnswer && <Loader2 className="w-3 h-3 animate-spin" />}
                Save answer
              </button>
            )}
          </div>
        </div>

        {/* 5 — Reconstruct */}
        {session.primary_objective ? (
          <div
            className="rounded-xl border p-4 space-y-3"
            style={{ borderColor: "oklch(0.70 0.12 183 / 0.4)", background: "oklch(0.70 0.12 183 / 0.06)" }}
          >
            <StepLabel n={reasonStep + 1}>What changes</StepLabel>

            <p className="text-sm font-semibold text-foreground">{session.primary_objective}</p>

            {session.reminder && (
              <p className="text-xs text-muted-foreground">{session.reminder}</p>
            )}

            {session.success_metric && (
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground/70">Success metric — </span>
                {session.success_metric}
              </p>
            )}

            <textarea
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              placeholder="Optional — phrase this in your own words, or add a condition."
              rows={2}
              className="w-full rounded-lg border border-border bg-input px-3 py-2 text-xs text-foreground outline-none transition-colors placeholder:text-muted-foreground/40 focus:border-primary/50 focus:ring-2 focus:ring-primary/15 resize-none"
            />
            <div className="flex flex-wrap items-center gap-2">
              {noteDirty && (
                <button
                  onClick={onSaveNote}
                  className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors"
                  style={{ borderColor: ACCENT, color: ACCENT }}
                >
                  Save note
                </button>
              )}
              <button
                onClick={onConfirm}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all",
                  session.reconstruction_confirmed ? "text-white" : "border text-muted-foreground hover:text-foreground"
                )}
                style={session.reconstruction_confirmed ? { background: "oklch(0.58 0.17 145)" } : { borderColor: "var(--border)" }}
              >
                {session.reconstruction_confirmed ? "Committed" : "Commit to this"}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function History({ sessions }: { sessions: PsychEdgeSession[] }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Session history</p>
      <div className="space-y-1.5 max-h-64 overflow-y-auto pr-0.5">
        {sessions.slice(0, 10).map((s, i, arr) => {
          const older = arr[i + 1];
          const carried = older && s.pattern_key && older.pattern_key === s.pattern_key;
          return (
            <div key={s.id} className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/20 px-3 py-2">
              <span className="text-xs text-muted-foreground tabular-nums w-16 shrink-0">
                {format(new Date(s.date + "T12:00:00"), "MMM d")}
              </span>
              {s.reconstruction_confirmed && <span className="w-1.5 h-1.5 rounded-full bg-success shrink-0" title="Committed" />}
              <span className="text-xs text-foreground/80 flex-1 truncate">{s.primary_objective ?? "—"}</span>
              {carried && (
                <span className="text-[10px] font-semibold uppercase tracking-wide text-destructive shrink-0">Repeated</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
