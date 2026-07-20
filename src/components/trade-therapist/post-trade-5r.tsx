"use client";

import { useEffect, useMemo, useState } from "react";
import { format, parse } from "date-fns";
import { Loader2, Check, ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  getTrades, getAnalyses, getPsychEdgeSessions, getPatternEvents,
  savePsychEdgeSession, upsertPatternEvent, createCommitment,
} from "@/lib/supabase/queries";
import { buildFiveR, tradesNeedingReflection, type FiveRContext } from "@/lib/psych-edge/therapist";
import { PATTERN_LABELS } from "@/lib/psych-edge/patterns";
import { instrumentName } from "@/lib/journal/weeks";
import { RESPONSE_TAGS } from "@/lib/psych-edge/engine";
import type {
  TradeJournalEntry, PreTradeAnalysis, PsychEdgeSession, PatternEvent,
  PsychEdgeResponseTag, PsychEdgeSessionInput,
} from "@/lib/types";

const ACCENT = "oklch(0.70 0.12 183)"; // turquoise
const CYAN = "oklch(0.68 0.14 210)";   // data / AI accent
const GREEN = "oklch(0.58 0.17 145)";
const RED = "oklch(0.58 0.22 25)";

const TAG_LABEL: Record<PsychEdgeResponseTag, string> = {
  calm: "Calm", anxious: "Anxious", euphoric: "Euphoric",
  frustrated: "Frustrated", rushed: "Rushed", numb: "Numb",
};
const INTENSITY_LABEL = ["Barely", "Mild", "Noticeable", "Strong", "Overwhelming"];

const fmtR = (v: number) => `${v > 0 ? "+" : ""}${v.toFixed(1)}R`;
const dayLabel = (iso: string) => format(parse(iso.slice(0, 10), "yyyy-MM-dd", new Date()), "MMM d");

type StepKey = "report" | "respond" | "relate" | "reason" | "reconstruct";
const STEP_META: Record<StepKey, { n: number; title: string; sub: string }> = {
  report: { n: 1, title: "Reporting", sub: "What the data shows" },
  respond: { n: 2, title: "Responding", sub: "How it felt" },
  relate: { n: 3, title: "Relating", sub: "Where you've seen this" },
  reason: { n: 4, title: "Reasoning", sub: "What it's costing" },
  reconstruct: { n: 5, title: "Reconstructing", sub: "Your commitment" },
};

/**
 * Post-Trade 5R — a short, guided session per trade. Reporting is automatic;
 * every other step is one screen, one question, Socratic in tone. The pattern
 * engine drives Relating and Reasoning with the trader's own numbers; the
 * Reconstructing commitment is saved and reused by the Pre-Trade Mirror.
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

  const queue = useMemo(
    () => (trades ? tradesNeedingReflection(trades, analyses) : []),
    [trades, analyses]
  );

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
    <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)] items-start">
      {/* Rail — trades worth reflecting on */}
      <div className="rounded-xl border border-border bg-card p-3 lg:sticky lg:top-4">
        <div className="flex items-center justify-between px-1 pb-2">
          <p className="text-sm font-semibold">Trades to work through</p>
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
              <button
                key={trade.id}
                type="button"
                onClick={() => setSelectedId(trade.id)}
                className={cn(
                  "w-full text-left rounded-lg border px-3 py-2 transition-colors",
                  active ? "border-primary/50 bg-primary/5" : "border-border/60 hover:border-primary/30 hover:bg-muted/30"
                )}
              >
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
                    <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/60">{committed ? "Done" : started ? "In progress" : "No pattern"}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* The 5R flow for the selected trade */}
      <div className="min-w-0">
        {ctx ? (
          <FiveRFlow
            key={ctx.trade.id}
            ctx={ctx}
            session={selectedSession}
            existingEvent={events.find((e) => e.trade_id === ctx.trade.id && e.pattern_type === ctx.driver?.type) ?? null}
            onSessionSaved={(saved) => setSessions((prev) => [saved, ...prev.filter((s) => s.trade_id !== saved.trade_id)])}
            onEventSaved={(saved) => setEvents((prev) => [saved, ...prev.filter((e) => e.id !== saved.id && !(e.trade_id === saved.trade_id && e.pattern_type === saved.pattern_type))])}
          />
        ) : null}
      </div>
    </div>
  );
}

/* ── The stepped flow ─────────────────────────────────────────────────── */
function FiveRFlow({
  ctx, session, existingEvent, onSessionSaved, onEventSaved,
}: {
  ctx: FiveRContext;
  session: PsychEdgeSession | null;
  existingEvent: PatternEvent | null;
  onSessionSaved: (s: PsychEdgeSession) => void;
  onEventSaved: (e: PatternEvent) => void;
}) {
  const { trade, driver, prior, stat, scaffold } = ctx;
  const [saveError, setSaveError] = useState(false);

  // Local, editable copies seeded from what's saved.
  const [tag, setTag] = useState<PsychEdgeResponseTag | null>(session?.response_tag ?? null);
  const [intensity, setIntensity] = useState<number | null>(session?.emotion_intensity ?? null);
  const [confirmed, setConfirmed] = useState<boolean | null>(existingEvent?.trader_confirmed ?? null);
  const [reasonAnswer, setReasonAnswer] = useState(session?.reasoning_answer ?? "");
  const [trigger, setTrigger] = useState("");
  const [action, setAction] = useState("");

  // Build the ordered step list from state: Relating only with a pattern,
  // Reasoning only once that pattern is confirmed.
  const steps = useMemo<StepKey[]>(() => {
    const s: StepKey[] = ["report", "respond"];
    if (driver) s.push("relate");
    if (driver && confirmed === true) s.push("reason");
    s.push("reconstruct");
    return s;
  }, [driver, confirmed]);

  const [idx, setIdx] = useState(0);
  const step = steps[Math.min(idx, steps.length - 1)];
  const sealed = !!session?.reconstruction_confirmed;

  async function persist(fields: Partial<PsychEdgeSessionInput>) {
    setSaveError(false);
    const base = session;
    const input: PsychEdgeSessionInput = {
      date: base?.date ?? trade.date_time.slice(0, 10),
      trade_id: trade.id,
      pattern_key: base?.pattern_key ?? driver?.type ?? null,
      recurring_pattern_label: base?.recurring_pattern_label ?? (driver ? PATTERN_LABELS[driver.type] : null),
      report: base?.report ?? ctx.report,
      relate: base?.relate ?? prior?.detail ?? null,
      reason: base?.reason ?? driver?.detail ?? "",
      primary_objective: base?.primary_objective ?? null,
      reminder: base?.reminder ?? null,
      success_metric: base?.success_metric ?? null,
      // Seed from live local state so a save that only sets one field never
      // clobbers another the trader just entered (before its own save resolves).
      response_tag: tag ?? base?.response_tag ?? null,
      emotion_intensity: intensity ?? base?.emotion_intensity ?? null,
      reasoning_answer: (reasonAnswer.trim() || base?.reasoning_answer) ?? null,
      mistake_cost: base?.mistake_cost ?? null,
      commitment_statement: base?.commitment_statement ?? null,
      reconstruction_note: base?.reconstruction_note ?? null,
      reconstruction_confirmed: base?.reconstruction_confirmed ?? false,
      ...fields,
    };
    try {
      const saved = await savePsychEdgeSession(input);
      onSessionSaved(saved);
      return saved;
    } catch {
      setSaveError(true);
      return null;
    }
  }

  async function recordConfirm(value: boolean) {
    setConfirmed(value);
    if (!driver) return;
    try {
      const saved = await upsertPatternEvent({
        trade_id: trade.id, date: driver.date, pattern_type: driver.type,
        confidence: driver.confidence, r_impact: driver.rImpact, detail: driver.detail,
        trader_confirmed: value,
      });
      onEventSaved(saved);
    } catch { /* fail-soft — table may not exist yet */ }
    // If they refute, drop back so Reasoning isn't required.
    if (value === false) setIdx((i) => Math.min(i, steps.indexOf("relate")));
  }

  async function seal() {
    const trig = trigger.trim();
    const act = action.trim();
    if (!trig || !act) return;
    const statement = `If ${trig}, then ${act}.`;
    const saved = await persist({ commitment_statement: statement, reconstruction_confirmed: true });
    if (!saved) return;
    try {
      await createCommitment({
        trade_id: trade.id,
        pattern_type: driver?.type ?? null,
        trigger_text: trig,
        action_text: act,
        active: true,
      });
    } catch { /* fail-soft */ }
  }

  const canNext =
    step === "report" ? true :
    step === "respond" ? tag != null && intensity != null :
    step === "relate" ? confirmed != null :
    step === "reason" ? true :
    false;

  const r = ctx.netR;

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
          <p className="text-[11px] text-muted-foreground mt-0.5">A short session — one question at a time. Nothing here is graded.</p>
        </div>
        {sealed && (
          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white" style={{ background: GREEN }}>
            <Check className="h-3 w-3" strokeWidth={3} /> Reflected
          </span>
        )}
      </div>

      {/* Progress dots */}
      <div className="flex items-center gap-1.5 px-1">
        {steps.map((k, i) => {
          const active = i === idx;
          const past = i < idx;
          return (
            <div key={k} className="flex items-center gap-1.5">
              <div className="flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold transition-colors"
                  style={active ? { background: ACCENT, color: "white" } : past ? { background: GREEN, color: "white" } : { background: "var(--muted)", color: "var(--muted-foreground)" }}>
                  {past ? <Check className="h-2.5 w-2.5" strokeWidth={3.5} /> : STEP_META[k].n}
                </span>
                <span className={cn("text-[11px] font-semibold hidden sm:inline", active ? "text-foreground" : "text-muted-foreground")}>{STEP_META[k].title}</span>
              </div>
              {i < steps.length - 1 && <span className="h-px w-3 bg-border" />}
            </div>
          );
        })}
      </div>

      {saveError && (
        <p className="text-xs text-destructive">Couldn&apos;t save — run the trade_therapist.sql migration in Supabase.</p>
      )}

      {/* Step body */}
      <div className="rounded-xl border border-border bg-card p-5 min-h-[13rem]">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{STEP_META[step].sub}</p>

        {step === "report" && (
          <div className="mt-2 space-y-3">
            <p className="text-base font-semibold">Here&apos;s what your journal recorded.</p>
            <p className="text-sm text-foreground/85 leading-relaxed">{ctx.report}</p>
            {trade.mistakes?.trim() && (
              <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground/70">Your logged note — </span>{trade.mistakes.trim()}</p>
            )}
          </div>
        )}

        {step === "respond" && (
          <div className="mt-2 space-y-4">
            <p className="text-base font-semibold">What state were you in when you took it?</p>
            <div className="flex flex-wrap gap-1.5">
              {RESPONSE_TAGS.map((t) => {
                const on = tag === t;
                return (
                  <button key={t} onClick={() => { setTag(t); persist({ response_tag: t }); }}
                    className={cn("rounded-full px-3 py-1 text-xs font-medium border transition-colors", on ? "text-white" : "text-muted-foreground border-border bg-secondary hover:text-foreground")}
                    style={on ? { background: ACCENT, borderColor: ACCENT } : undefined}>
                    {TAG_LABEL[t]}
                  </button>
                );
              })}
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">How strongly did it run?</p>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((n) => {
                  const on = intensity === n;
                  return (
                    <button key={n} onClick={() => { setIntensity(n); persist({ emotion_intensity: n }); }}
                      className={cn("flex-1 rounded-lg border py-2 text-xs font-semibold transition-colors", on ? "text-white" : "text-muted-foreground border-border hover:text-foreground")}
                      style={on ? { background: CYAN, borderColor: CYAN } : undefined}>
                      {n}
                    </button>
                  );
                })}
              </div>
              {intensity != null && <p className="text-[11px] text-muted-foreground mt-1.5">{INTENSITY_LABEL[intensity - 1]}</p>}
            </div>
          </div>
        )}

        {step === "relate" && driver && (
          <div className="mt-2 space-y-3">
            <p className="text-base font-semibold">This looks like a pattern I&apos;ve seen in your data.</p>
            <div className="rounded-lg border px-3 py-2.5" style={{ borderColor: "color-mix(in oklch, " + CYAN + " 40%, transparent)", background: "color-mix(in oklch, " + CYAN + " 8%, transparent)" }}>
              <div className="flex items-center gap-1.5 mb-1">
                <Sparkles className="h-3.5 w-3.5" style={{ color: CYAN }} />
                <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: CYAN }}>{PATTERN_LABELS[driver.type]}</span>
                <span className="text-[10px] text-muted-foreground ml-auto tabular-nums">confidence {Math.round(driver.confidence * 100)}%</span>
              </div>
              <p className="text-sm text-foreground/85">{driver.detail}</p>
            </div>
            {prior && (
              <p className="text-xs text-muted-foreground leading-relaxed">
                The last time was <span className="font-medium text-foreground/75">{dayLabel(prior.date)}</span> — {prior.detail}
              </p>
            )}
            <p className="text-sm text-foreground/80">Does that read true for this trade?</p>
            <div className="flex gap-2">
              <button onClick={() => recordConfirm(true)}
                className={cn("rounded-lg border px-4 py-2 text-sm font-semibold transition-colors", confirmed === true ? "text-white" : "hover:bg-muted/50")}
                style={confirmed === true ? { background: ACCENT, borderColor: ACCENT } : { borderColor: "var(--border)" }}>
                Yes, that&apos;s it
              </button>
              <button onClick={() => recordConfirm(false)}
                className={cn("rounded-lg border px-4 py-2 text-sm font-semibold transition-colors", confirmed === false ? "bg-muted text-foreground" : "hover:bg-muted/50")}
                style={{ borderColor: "var(--border)" }}>
                Not this time
              </button>
            </div>
          </div>
        )}

        {step === "reason" && driver && stat && (
          <div className="mt-2 space-y-3">
            <p className="text-base font-semibold">Here&apos;s what this pattern has cost you.</p>
            <div className="flex items-center gap-4 rounded-lg border border-border px-3 py-2.5">
              <div>
                <p className="text-2xl font-black tabular-nums leading-none" style={{ color: stat.cumulativeR < 0 ? RED : "var(--foreground)" }}>{fmtR(stat.cumulativeR)}</p>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground mt-1">cumulative</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <p className="text-xs text-muted-foreground leading-snug">
                Across <span className="font-semibold text-foreground/80 tabular-nums">{stat.count}</span> {PATTERN_LABELS[driver.type].toLowerCase()} trade{stat.count === 1 ? "" : "s"} in your history.
              </p>
            </div>
            <div>
              <p className="text-sm text-foreground/85 mb-1.5">What was different this time — or was it the same trigger as before?</p>
              <Textarea value={reasonAnswer} onChange={(e) => setReasonAnswer(e.target.value)}
                onBlur={() => reasonAnswer.trim() !== (session?.reasoning_answer ?? "").trim() && persist({ reasoning_answer: reasonAnswer.trim() || null })}
                placeholder="In your own words…" className="min-h-[80px] text-sm" />
            </div>
          </div>
        )}

        {step === "reconstruct" && (
          <div className="mt-2 space-y-3">
            {sealed ? (
              <>
                <p className="text-base font-semibold">Your commitment is set.</p>
                <p className="text-sm text-foreground/85 rounded-lg border border-border px-3 py-2.5">{session?.commitment_statement}</p>
                <p className="text-[11px] text-muted-foreground">The Pre-Trade Mirror will bring this back the next time the same situation lines up.</p>
              </>
            ) : (
              <>
                <p className="text-base font-semibold">Write one if-then rule you&apos;ll hold to.</p>
                <p className="text-xs text-muted-foreground">Concrete beats grand. This gets stored and resurfaced when it becomes relevant again.</p>
                <div className="space-y-2">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: ACCENT }}>If</span>
                    <Input value={trigger} onChange={(e) => setTrigger(e.target.value)}
                      placeholder={scaffold?.trigger ?? "the trigger…"} className="mt-1 text-sm" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: ACCENT }}>then</span>
                    <Input value={action} onChange={(e) => setAction(e.target.value)}
                      placeholder={scaffold?.action ?? "the action…"} className="mt-1 text-sm" />
                  </div>
                </div>
                {scaffold && !trigger && !action && (
                  <button onClick={() => { setTrigger(scaffold.trigger); setAction(scaffold.action); }}
                    className="text-[11px] font-medium hover:underline" style={{ color: CYAN }}>
                    Start from a suggestion
                  </button>
                )}
                <button onClick={seal} disabled={!trigger.trim() || !action.trim()}
                  className="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
                  style={{ background: GREEN }}>
                  Commit &amp; finish
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Nav */}
      <div className="flex items-center justify-between">
        <button onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-30">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        {step !== "reconstruct" && (
          <button onClick={() => setIdx((i) => Math.min(steps.length - 1, i + 1))} disabled={!canNext}
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
            style={{ background: ACCENT }}>
            Continue <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function EmptyState({ hasTrades }: { hasTrades: boolean }) {
  return (
    <div className="rounded-xl border border-dashed border-border p-10 text-center">
      <p className="text-sm text-muted-foreground mb-1">Nothing to work through right now.</p>
      <p className="text-xs text-muted-foreground/70">
        {hasTrades
          ? "Losing trades, bad-execution trades, and any the engine flags as a pattern show up here for a 5R session."
          : "Log a trade in the Journal — the ones worth reflecting on will appear here."}
      </p>
    </div>
  );
}
