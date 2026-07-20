"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { format, parse } from "date-fns";
import { Loader2, Check, Send, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  getTrades, getAnalyses, getPsychEdgeSessions, getPatternEvents,
  savePsychEdgeSession, upsertPatternEvent, createCommitment,
} from "@/lib/supabase/queries";
import { buildFiveR, tradesNeedingReflection, type FiveRContext } from "@/lib/psych-edge/therapist";
import {
  buildConversation, TAG_LABEL, INTENSITY_LABEL,
  type Answers, type Block, type Exchange,
} from "@/lib/psych-edge/conversation";
import { PATTERN_LABELS } from "@/lib/psych-edge/patterns";
import { instrumentName } from "@/lib/journal/weeks";
import { RESPONSE_TAGS } from "@/lib/psych-edge/engine";
import type {
  TradeJournalEntry, PreTradeAnalysis, PsychEdgeSession, PatternEvent, PsychEdgeSessionInput,
} from "@/lib/types";

const ACCENT = "oklch(0.70 0.12 183)"; // turquoise
const CYAN = "oklch(0.68 0.14 210)";   // data / AI accent
const GREEN = "oklch(0.58 0.17 145)";
const RED = "oklch(0.58 0.22 25)";

const fmtR = (v: number) => `${v > 0 ? "+" : ""}${v.toFixed(1)}R`;
const dayLabel = (iso: string) => format(parse(iso.slice(0, 10), "yyyy-MM-dd", new Date()), "MMM d");
const mix = (c: string, pct: number) => `color-mix(in oklch, ${c} ${pct}%, transparent)`;

/**
 * Post-Trade 5R, a guided session that reads like talking to someone. The
 * therapist speaks (grounded entirely in the trade and the pattern stats it
 * shows inline), asks one reflective question, and waits; the trader answers
 * back. The whole thread is deterministic, driven by conversation.ts, and
 * persists so a half-finished session resumes exactly where it left off.
 */
export function PostTrade5R() {
  const [trades, setTrades] = useState<TradeJournalEntry[] | null>(null);
  const [analyses, setAnalyses] = useState<PreTradeAnalysis[]>([]);
  const [sessions, setSessions] = useState<PsychEdgeSession[]>([]);
  const [events, setEvents] = useState<PatternEvent[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getTrades(), getAnalyses(), getPsychEdgeSessions(), getPatternEvents()])
      .then(([t, a, s, e]) => { setTrades(t); setAnalyses(a); setSessions(s); setEvents(e); });
  }, []);

  const queue = useMemo(() => (trades ? tradesNeedingReflection(trades, analyses) : []), [trades, analyses]);

  useEffect(() => {
    if (queue.length && (!selectedId || !queue.some((q) => q.trade.id === selectedId))) {
      setSelectedId(queue[0].trade.id);
    }
  }, [queue, selectedId]);

  const sessionByTrade = useMemo(
    () => new Map(sessions.filter((s) => s.trade_id).map((s) => [s.trade_id as string, s])),
    [sessions]
  );
  const ctx = useMemo(
    () => (selectedId && trades ? buildFiveR(selectedId, trades, analyses) : null),
    [selectedId, trades, analyses]
  );
  const selectedSession = selectedId ? sessionByTrade.get(selectedId) ?? null : null;

  if (trades === null) {
    return <div className="flex items-center justify-center h-40"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  }
  if (queue.length === 0) return <EmptyState hasTrades={trades.length > 0} />;

  const doneCount = queue.filter((q) => sessionByTrade.get(q.trade.id)?.reconstruction_confirmed).length;

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)] items-start">
      {/* Rail, trades worth working through */}
      <div className="rounded-xl border border-border bg-card p-3 lg:sticky lg:top-4">
        <div className="flex items-center justify-between px-1 pb-2">
          <p className="text-sm font-semibold">Sessions</p>
          <span className="text-[11px] font-semibold tabular-nums text-muted-foreground">{doneCount}/{queue.length}</span>
        </div>
        <p className="px-1 pb-2.5 text-[11px] text-muted-foreground leading-snug">
          Losses, bad execution, or a detected pattern. Newest first.
        </p>
        <div className="space-y-1 max-h-[calc(100dvh-16rem)] overflow-y-auto pr-0.5">
          {queue.map(({ trade, netR, topPattern }) => {
            const s = sessionByTrade.get(trade.id);
            const committed = !!s?.reconstruction_confirmed;
            const started = !!s && !committed;
            const active = trade.id === selectedId;
            return (
              <button key={trade.id} type="button" onClick={() => setSelectedId(trade.id)}
                className={cn("w-full text-left rounded-lg border px-3 py-2 transition-colors",
                  active ? "border-primary/50 bg-primary/5" : "border-border/60 hover:border-primary/30 hover:bg-muted/30")}>
                <div className="flex items-center gap-2">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border"
                    style={committed ? { background: GREEN, borderColor: GREEN } : started ? { borderColor: ACCENT } : { borderColor: "var(--border)" }}>
                    {committed && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3.5} />}
                    {started && <span className="h-1.5 w-1.5 rounded-full" style={{ background: ACCENT }} />}
                  </span>
                  <span className="text-sm font-bold font-mono truncate">{instrumentName(trade.instrument)}</span>
                  <span className="text-[11px] text-muted-foreground capitalize">{trade.direction}</span>
                  <span className="ml-auto text-xs font-bold tabular-nums" style={{ color: netR < 0 ? RED : "var(--muted-foreground)" }}>{fmtR(netR)}</span>
                </div>
                <div className="flex items-center justify-between mt-1 pl-6 gap-2">
                  <span className="text-[11px] text-muted-foreground tabular-nums">{dayLabel(trade.date_time)}</span>
                  {topPattern ? (
                    <span className="text-[10px] font-semibold uppercase tracking-wide truncate" style={{ color: CYAN }}>{PATTERN_LABELS[topPattern.type]}</span>
                  ) : (
                    <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/60">{committed ? "Done" : started ? "In session" : "No pattern"}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* The conversation */}
      <div className="min-w-0">
        {ctx ? (
          <Conversation
            key={ctx.trade.id}
            ctx={ctx}
            trades={trades}
            session={selectedSession}
            onSessionSaved={(saved) => setSessions((prev) => [saved, ...prev.filter((s) => s.trade_id !== saved.trade_id)])}
            onEventSaved={(saved) => setEvents((prev) => [saved, ...prev.filter((e) => !(e.trade_id === saved.trade_id && e.pattern_type === saved.pattern_type))])}
            existingEvents={events}
          />
        ) : null}
      </div>
    </div>
  );
}

/* ── Restore answers from a saved session ─────────────────────────────── */
function answersFromSession(s: PsychEdgeSession | null): Answers {
  if (!s) return {};
  if (s.reconstruction_note) {
    try { return JSON.parse(s.reconstruction_note) as Answers; } catch { /* fall through */ }
  }
  const a: Answers = {};
  if (s.response_tag) a.tag = s.response_tag;
  if (s.emotion_intensity != null) a.intensity = s.emotion_intensity;
  if (s.reasoning_answer) a.whatDifferent = s.reasoning_answer;
  if (s.reconstruction_confirmed) a.sealed = true;
  const m = s.commitment_statement && /^If (.+), then (.+)\.$/.exec(s.commitment_statement);
  if (m) { a.trigger = m[1]; a.action = m[2]; }
  return a;
}

/* ── The conversation thread ──────────────────────────────────────────── */
function Conversation({
  ctx, trades, session, existingEvents, onSessionSaved, onEventSaved,
}: {
  ctx: FiveRContext;
  trades: TradeJournalEntry[];
  session: PsychEdgeSession | null;
  existingEvents: PatternEvent[];
  onSessionSaved: (s: PsychEdgeSession) => void;
  onEventSaved: (e: PatternEvent) => void;
}) {
  const [answers, setAnswers] = useState<Answers>(() => answersFromSession(session));
  const [saveError, setSaveError] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const exchanges = useMemo(() => buildConversation(ctx, answers, trades), [ctx, answers, trades]);

  // Find the first exchange whose reply is still outstanding, the live turn.
  const activeIndex = exchanges.findIndex((e) => e.input && !isAnswered(e, answers));

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [activeIndex, exchanges.length]);

  async function persist(next: Answers) {
    setSaveError(false);
    const base = session;
    const sealed = !!next.sealed;
    const reasoning = [next.commonThread, next.whatDifferent].filter(Boolean).join(" · ") || null;
    const input: PsychEdgeSessionInput = {
      date: base?.date ?? ctx.trade.date_time.slice(0, 10),
      trade_id: ctx.trade.id,
      pattern_key: ctx.driver?.type ?? null,
      recurring_pattern_label: ctx.driver ? PATTERN_LABELS[ctx.driver.type] : null,
      report: ctx.report,
      relate: ctx.prior?.detail ?? null,
      reason: ctx.driver?.detail ?? "",
      primary_objective: null,
      reminder: null,
      success_metric: null,
      response_tag: next.tag ?? null,
      emotion_intensity: next.intensity ?? null,
      reasoning_answer: reasoning,
      mistake_cost: null,
      commitment_statement: sealed && next.trigger && next.action ? `If ${next.trigger}, then ${next.action}.` : null,
      reconstruction_note: JSON.stringify(next), // full transcript for resume
      reconstruction_confirmed: sealed,
    };
    try {
      const saved = await savePsychEdgeSession(input);
      onSessionSaved(saved);
    } catch { setSaveError(true); }
  }

  /** Commit an answer, persist, and fire any side effects (pattern event, commitment). */
  async function answer(patch: Partial<Answers>) {
    const next = { ...answers, ...patch };
    setAnswers(next);
    await persist(next);
    if (patch.confirmed !== undefined && ctx.driver) {
      try {
        const saved = await upsertPatternEvent({
          trade_id: ctx.trade.id, date: ctx.driver.date, pattern_type: ctx.driver.type,
          confidence: ctx.driver.confidence, r_impact: ctx.driver.rImpact, detail: ctx.driver.detail,
          trader_confirmed: patch.confirmed,
        });
        onEventSaved(saved);
      } catch { /* fail-soft */ }
    }
    if (patch.sealed && next.trigger && next.action) {
      try {
        await createCommitment({ trade_id: ctx.trade.id, pattern_type: ctx.driver?.type ?? null, trigger_text: next.trigger, action_text: next.action, active: true });
      } catch { /* fail-soft */ }
    }
  }

  const sealed = !!answers.sealed;

  return (
    <div className="space-y-3">
      {/* Header, who you're sitting with */}
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ background: mix(ACCENT, 15) }}>
          <Brain className="h-4 w-4" style={{ color: ACCENT }} strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">Your Trade Therapist</p>
          <p className="text-[11px] text-muted-foreground">Working through {instrumentName(ctx.trade.instrument)} {ctx.trade.direction} · {dayLabel(ctx.trade.date_time)} · <span style={{ color: ctx.netR < 0 ? RED : undefined }}>{fmtR(ctx.netR)}</span></p>
        </div>
        {sealed && (
          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white shrink-0" style={{ background: GREEN }}>
            <Check className="h-3 w-3" strokeWidth={3} /> Reflected
          </span>
        )}
      </div>

      {saveError && <p className="text-xs text-destructive">Couldn&apos;t save, run the trade_therapist.sql migration in Supabase.</p>}

      {/* Thread */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <div className="space-y-4">
          {exchanges.map((ex, i) => {
            const answered = ex.input ? isAnswered(ex, answers) : true;
            const isActive = i === activeIndex;
            // Don't render turns past the active one.
            if (activeIndex !== -1 && i > activeIndex) return null;
            return (
              <div key={ex.id} className="space-y-3">
                <TherapistTurn blocks={ex.blocks} />
                {ex.input && answered && ex.echo && <UserBubble text={ex.echo} />}
                {ex.input && isActive && (
                  <ActiveInput ex={ex} answers={answers} scaffold={ctx.scaffold} onAnswer={answer} />
                )}
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
}

function isAnswered(ex: Exchange, a: Answers): boolean {
  if (!ex.input) return true;
  switch (ex.input.kind) {
    case "emotion": return !!a.tag;
    case "intensity": return a.intensity != null;
    case "confirm": return a.confirmed !== undefined;
    case "text": return !!a[ex.input.key]?.trim();
    case "ifthen": return !!a.sealed;
  }
}

/* ── Therapist turn (bubbles + inline evidence) ───────────────────────── */
function TherapistTurn({ blocks }: { blocks: Block[] }) {
  return (
    <div className="flex gap-2.5">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full mt-0.5" style={{ background: mix(ACCENT, 15) }}>
        <Brain className="h-3.5 w-3.5" style={{ color: ACCENT }} strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1 space-y-2.5">
        {blocks.map((b, i) => <BlockView key={i} block={b} />)}
      </div>
    </div>
  );
}

function BlockView({ block }: { block: Block }) {
  if (block.kind === "text") {
    return <div className="inline-block rounded-2xl rounded-tl-sm bg-muted/60 px-3.5 py-2.5 text-sm leading-relaxed text-foreground/90 max-w-[46ch]">{block.text}</div>;
  }
  if (block.kind === "trade") return <TradeCard trade={block.trade} netR={block.netR} />;
  if (block.kind === "pattern") {
    const p = block.pattern;
    return (
      <div className="rounded-xl border px-3.5 py-3" style={{ borderColor: mix(CYAN, 40), background: mix(CYAN, 7) }}>
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: CYAN }}>{PATTERN_LABELS[p.type]}</span>
          <span className="ml-auto text-[10px] text-muted-foreground tabular-nums">confidence {Math.round(p.confidence * 100)}%</span>
        </div>
        <p className="text-sm text-foreground/85 leading-relaxed">{p.detail}</p>
      </div>
    );
  }
  if (block.kind === "prior") {
    return (
      <div className="rounded-lg border border-border/70 px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">The nearest time before, {dayLabel(block.prior.date)}</p>
        <p className="text-xs text-foreground/80 leading-relaxed">{block.prior.detail}</p>
      </div>
    );
  }
  // cost
  const { stat, occurrences } = block;
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="flex items-center gap-4 px-3.5 py-3 border-b border-border/60">
        <div>
          <p className="text-2xl font-black tabular-nums leading-none" style={{ color: stat.cumulativeR < 0 ? RED : "var(--foreground)" }}>{fmtR(stat.cumulativeR)}</p>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground mt-1">cumulative</p>
        </div>
        <div className="h-8 w-px bg-border" />
        <p className="text-xs text-muted-foreground leading-snug">
          Across <span className="font-semibold text-foreground/80 tabular-nums">{stat.count}</span> {PATTERN_LABELS[stat.type].toLowerCase()} trade{stat.count === 1 ? "" : "s"}, the whole run:
        </p>
      </div>
      <div className="divide-y divide-border/50 max-h-52 overflow-y-auto">
        {occurrences.map((o, i) => (
          <div key={i} className={cn("flex items-center gap-2 px-3.5 py-1.5 text-xs", o.isFocus && "bg-primary/5")}>
            <span className="tabular-nums text-muted-foreground w-14">{dayLabel(o.date)}</span>
            <span className="font-mono font-semibold truncate flex-1">{o.instrument}</span>
            {o.isFocus && <span className="text-[9px] font-bold uppercase tracking-wide" style={{ color: ACCENT }}>this one</span>}
            <span className="tabular-nums font-bold w-12 text-right" style={{ color: o.r < 0 ? RED : GREEN }}>{fmtR(o.r)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TradeCard({ trade, netR }: { trade: TradeJournalEntry; netR: number }) {
  const checks = trade.discipline?.custom_checks ?? [];
  const followed = checks.filter((c) => c.passed).length;
  return (
    <div className="rounded-xl border border-border bg-background/40 px-3.5 py-3 space-y-2 max-w-md">
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold font-mono">{instrumentName(trade.instrument)}</span>
        <span className="text-[11px] text-muted-foreground capitalize">{trade.direction}</span>
        <span className="ml-auto text-sm font-black tabular-nums" style={{ color: netR < 0 ? RED : GREEN }}>{fmtR(netR)}</span>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
        <span>{dayLabel(trade.date_time)}</span>
        <span>· {trade.session}</span>
        {trade.execution_time && <span>· entry {trade.execution_time}{trade.execution_end_time ? `–${trade.execution_end_time}` : ""}</span>}
        {trade.execution_quality && <span>· execution <span style={{ color: trade.execution_quality === "bad" ? RED : GREEN }}>{trade.execution_quality}</span></span>}
        {checks.length > 0 && <span>· rules <span className="tabular-nums text-foreground/70">{followed}/{checks.length}</span></span>}
      </div>
      {trade.mistakes?.trim() && (
        <p className="text-[11px] text-muted-foreground border-t border-border/50 pt-1.5"><span className="font-medium text-foreground/70">Your note, </span>{trade.mistakes.trim()}</p>
      )}
    </div>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <div className="inline-block rounded-2xl rounded-tr-sm px-3.5 py-2.5 text-sm leading-relaxed text-white max-w-[42ch]" style={{ background: ACCENT }}>
        {text}
      </div>
    </div>
  );
}

/* ── The trader's live reply ──────────────────────────────────────────── */
function ActiveInput({ ex, answers, scaffold, onAnswer }: {
  ex: Exchange; answers: Answers; scaffold: { trigger: string; action: string } | null; onAnswer: (p: Partial<Answers>) => void;
}) {
  const input = ex.input!;
  const [draft, setDraft] = useState("");
  const [trig, setTrig] = useState(answers.trigger ?? "");
  const [act, setAct] = useState(answers.action ?? "");

  if (input.kind === "emotion") {
    return (
      <div className="flex flex-wrap gap-1.5 pl-9">
        {RESPONSE_TAGS.map((t) => (
          <button key={t} onClick={() => onAnswer({ tag: t })}
            className="rounded-full px-3.5 py-1.5 text-xs font-medium border text-muted-foreground border-border bg-secondary hover:text-foreground hover:border-primary/40 transition-colors">
            {TAG_LABEL[t]}
          </button>
        ))}
      </div>
    );
  }

  if (input.kind === "intensity") {
    return (
      <div className="pl-9">
        <div className="flex gap-1.5 max-w-sm">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => onAnswer({ intensity: n })}
              className="flex-1 rounded-lg border border-border py-2 text-sm font-semibold text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors">
              {n}
            </button>
          ))}
        </div>
        <div className="flex justify-between max-w-sm mt-1 px-0.5">
          <span className="text-[10px] text-muted-foreground">{INTENSITY_LABEL[0]}</span>
          <span className="text-[10px] text-muted-foreground">{INTENSITY_LABEL[4]}</span>
        </div>
      </div>
    );
  }

  if (input.kind === "confirm") {
    return (
      <div className="flex gap-2 pl-9">
        <button onClick={() => onAnswer({ confirmed: true })}
          className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ background: ACCENT }}>
          Yes, that&apos;s it
        </button>
        <button onClick={() => onAnswer({ confirmed: false })}
          className="rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-muted/50 transition-colors">
          No, this one&apos;s different
        </button>
      </div>
    );
  }

  if (input.kind === "ifthen") {
    const ready = trig.trim() && act.trim();
    return (
      <div className="pl-9 space-y-2 max-w-md">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wide w-9 shrink-0" style={{ color: ACCENT }}>If</span>
          <Input value={trig} onChange={(e) => setTrig(e.target.value)} placeholder={scaffold?.trigger ?? "the exact trigger…"} className="text-sm" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wide w-9 shrink-0" style={{ color: ACCENT }}>then</span>
          <Input value={act} onChange={(e) => setAct(e.target.value)} placeholder={scaffold?.action ?? "what you'll do instead…"} className="text-sm" />
        </div>
        {scaffold && !trig && !act && (
          <button onClick={() => { setTrig(scaffold.trigger); setAct(scaffold.action); }} className="text-[11px] font-medium hover:underline" style={{ color: CYAN }}>
            Start from a suggestion
          </button>
        )}
        <button onClick={() => onAnswer({ trigger: trig.trim(), action: act.trim(), sealed: true })} disabled={!ready}
          className="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-40" style={{ background: GREEN }}>
          Commit &amp; close the session
        </button>
      </div>
    );
  }

  // text
  const send = () => { if (draft.trim()) onAnswer({ [input.key]: draft.trim() } as Partial<Answers>); };
  return (
    <div className="pl-9">
      <div className="flex items-end gap-2 max-w-lg">
        <Textarea value={draft} onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send(); }}
          placeholder={input.placeholder} className="min-h-[52px] text-sm resize-none" autoFocus />
        <button onClick={send} disabled={!draft.trim()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white transition-opacity disabled:opacity-40" style={{ background: ACCENT }}>
          <Send className="h-4 w-4" />
        </button>
      </div>
      <p className="text-[10px] text-muted-foreground/70 mt-1">⌘/Ctrl + Enter to send</p>
    </div>
  );
}

function EmptyState({ hasTrades }: { hasTrades: boolean }) {
  return (
    <div className="rounded-xl border border-dashed border-border p-10 text-center">
      <p className="text-sm text-muted-foreground mb-1">Nothing to sit down with right now.</p>
      <p className="text-xs text-muted-foreground/70">
        {hasTrades
          ? "Losing trades, bad-execution trades, and any the engine flags as a pattern open a session here."
          : "Log a trade in the Journal, the ones worth talking through will appear here."}
      </p>
    </div>
  );
}
