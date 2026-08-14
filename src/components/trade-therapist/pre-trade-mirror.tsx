"use client";

import { useEffect, useMemo, useState } from "react";
import { format, parse } from "date-fns";
import { Loader2, Check, X, Pencil, ShieldCheck, Brain } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  getTrades, getAnalyses, getCommitments,
  getHabits, getHabitCompletions, getPsychEdgeSessions, getBestTradesOfDay, getWeeklyTradeReviews,
  createAdherenceLog, updateCommitment,
} from "@/lib/supabase/queries";
import { buildPreTradeMirror, type MirrorMatch, type MirrorSignals } from "@/lib/psych-edge/therapist";
import { computeMindScore, bandColorFor, type MindInputs } from "@/lib/mind-score/mind-score";
import { TAG_LABEL } from "@/lib/psych-edge/conversation";
import { tradeR, instrumentName } from "@/lib/journal/weeks";
import type { Commitment, TradeJournalEntry, PsychEdgeSession } from "@/lib/types";

const ACCENT = "oklch(0.70 0.12 183)";
const CYAN = "oklch(0.68 0.14 210)";
const GREEN = "oklch(0.58 0.17 145)";
const RED = "oklch(0.58 0.22 25)";

const fmtR = (v: number) => `${v > 0 ? "+" : ""}${v.toFixed(1)}R`;
const dayLabel = (iso: string) => format(parse(iso.slice(0, 10), "yyyy-MM-dd", new Date()), "MMM d");

type Resolution = "confirmed" | "adjusted" | "dismissed";

/**
 * Pre-Trade Mirror, before a session, hold today's context up against the past.
 * If a behavioural pattern the trader has a history of lines up with today's
 * signals above the threshold, it surfaces one concrete, dated message with the
 * commitment they made last time. No match ⇒ no message; nothing is invented.
 */
export function PreTradeMirror() {
  const [data, setData] = useState<MindInputs | null>(null);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [resolution, setResolution] = useState<Resolution | null>(null);

  useEffect(() => {
    Promise.all([
      getTrades(), getAnalyses(), getCommitments(),
      getHabits(), getHabitCompletions(), getPsychEdgeSessions(), getBestTradesOfDay(), getWeeklyTradeReviews(),
    ]).then(([trades, analyses, commitments, habits, completions, psychSessions, bestTrades, weeklyReviews]) => {
      setCommitments(commitments);
      setData({ trades, habits, completions, psychSessions, bestTrades, weeklyReviews, analyses });
    }).catch(() => setData({ trades: [], habits: [], completions: [], psychSessions: [], bestTrades: [], weeklyReviews: [], analyses: [] }));
  }, []);

  const mindscore = useMemo(() => (data ? computeMindScore(data, "month").total : null), [data]);
  const mirror = useMemo(
    () => (data ? buildPreTradeMirror({ trades: data.trades, analyses: data.analyses, commitments, mindscore }) : null),
    [data, commitments, mindscore]
  );

  if (!data || !mirror) {
    return <div className="flex items-center justify-center h-40"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px] items-start">
      <div className="min-w-0 space-y-4">
        {mirror.match ? (
          <MatchCard
            match={mirror.match}
            occurrenceTrade={data.trades.find((t) => t.id === mirror.match!.occurrence.tradeId) ?? null}
            occurrenceSession={data.psychSessions.find((s) => s.trade_id === mirror.match!.occurrence.tradeId) ?? null}
            resolution={resolution}
            onResolve={async (res, editedAction) => {
              setResolution(res);
              const c = mirror.match!.commitment;
              try {
                if (res === "adjusted" && c && editedAction) {
                  const updated = await updateCommitment(c.id, { action_text: editedAction });
                  setCommitments((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
                }
                if (c) {
                  await createAdherenceLog({
                    commitment_id: c.id,
                    trade_id: null,
                    date: format(new Date(), "yyyy-MM-dd"),
                    matched: res !== "dismissed",
                    followed: null,
                  });
                }
              } catch { /* fail-soft */ }
            }}
          />
        ) : (
          <NoMatch signals={mirror.signals} />
        )}
      </div>

      <SignalsPanel signals={mirror.signals} mindscore={mindscore} />
    </div>
  );
}

/* ── The match ────────────────────────────────────────────────────────── */
function MatchCard({
  match, occurrenceTrade, occurrenceSession, resolution, onResolve,
}: {
  match: MirrorMatch;
  occurrenceTrade: TradeJournalEntry | null;
  occurrenceSession: PsychEdgeSession | null;
  resolution: Resolution | null;
  onResolve: (res: Resolution, editedAction?: string) => void;
}) {
  const c = match.commitment;
  const [editing, setEditing] = useState(false);
  const [action, setAction] = useState(c?.action_text ?? "");

  if (resolution) {
    return (
      <div className="rounded-xl border bg-card p-5" style={{ borderColor: resolution === "dismissed" ? "var(--border)" : "color-mix(in oklch, " + GREEN + " 45%, transparent)" }}>
        <div className="flex items-center gap-2">
          {resolution === "dismissed"
            ? <X className="h-4 w-4 text-muted-foreground" />
            : <ShieldCheck className="h-4 w-4" style={{ color: GREEN }} />}
          <p className="text-sm font-semibold">
            {resolution === "confirmed" && "Locked in for today."}
            {resolution === "adjusted" && "Updated, and locked in for today."}
            {resolution === "dismissed" && "Set aside for today."}
          </p>
        </div>
        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
          {resolution === "dismissed"
            ? "Noted that this doesn't fit today. It'll still surface again next time the signals line up."
            : "This counts as a live commitment check, whether it held shows up in your Commitment adherence."}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-3 border-b border-border/60 flex items-center gap-2" style={{ background: "color-mix(in oklch, " + CYAN + " 7%, transparent)" }}>
        <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: CYAN }}>{match.label}</span>
        <span className="text-[10px] text-muted-foreground ml-auto tabular-nums">match {Math.round(match.score * 100)}%</span>
      </div>

      <div className="p-5 space-y-4">
        {/* The therapist speaks, grounded in a real past trade */}
        <div className="flex gap-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full mt-0.5" style={{ background: "color-mix(in oklch, " + ACCENT + " 15%, transparent)" }}>
            <Brain className="h-3.5 w-3.5" style={{ color: ACCENT }} strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1 space-y-2.5">
            <p className="text-sm text-foreground/85">Before you take anything on, I want to hold today up against something.</p>
            <div className="rounded-xl border px-3.5 py-3" style={{ borderColor: "color-mix(in oklch, " + CYAN + " 40%, transparent)", background: "color-mix(in oklch, " + CYAN + " 7%, transparent)" }}>
              <p className="text-base font-semibold leading-snug">
                On {dayLabel(match.occurrence.date)}, under conditions like today&apos;s, {lower(match.occurrence.detail)}
              </p>
              <p className="text-sm text-muted-foreground mt-1.5">
                That pattern has cost you{" "}
                <span className="font-bold tabular-nums" style={{ color: match.cumulativeR < 0 ? RED : "var(--foreground)" }}>{fmtR(match.cumulativeR)}</span>{" "}
                across {match.occurrenceCount} trade{match.occurrenceCount === 1 ? "" : "s"}.
              </p>
            </div>
          </div>
        </div>

        {/* The exact trade being referenced — journal notes and 5R reflection from that day */}
        {occurrenceTrade && <ReferencedTrade trade={occurrenceTrade} session={occurrenceSession} />}

        {c ? (
          <div className="rounded-lg border px-3.5 py-3" style={{ borderColor: "color-mix(in oklch, " + ACCENT + " 40%, transparent)", background: "color-mix(in oklch, " + ACCENT + " 6%, transparent)" }}>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Your own plan from then</p>
            {editing ? (
              <div className="space-y-1.5">
                <p className="text-sm"><span className="font-semibold" style={{ color: ACCENT }}>If</span> {c.trigger_text}, <span className="font-semibold" style={{ color: ACCENT }}>then</span></p>
                <Input value={action} onChange={(e) => setAction(e.target.value)} className="text-sm" autoFocus />
              </div>
            ) : (
              <p className="text-sm text-foreground/90 leading-relaxed">
                <span className="font-semibold" style={{ color: ACCENT }}>If</span> {c.trigger_text}, <span className="font-semibold" style={{ color: ACCENT }}>then</span> {c.action_text}.
              </p>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">
            You haven&apos;t set an if-then commitment for this pattern yet, the next Post-Trade 5R on one of these trades will ask for one.
          </p>
        )}

        <p className="text-sm font-medium text-foreground/80">Does that hold today?</p>

        <div className="flex flex-wrap gap-2">
          {editing ? (
            <button onClick={() => { onResolve("adjusted", action.trim() || undefined); }}
              className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ background: GREEN }}>
              <Check className="h-4 w-4" /> Save &amp; commit
            </button>
          ) : (
            <>
              <button onClick={() => onResolve("confirmed")}
                className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ background: ACCENT }}>
                <Check className="h-4 w-4" /> Yes, it holds
              </button>
              {c && (
                <button onClick={() => setEditing(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-muted/50">
                  <Pencil className="h-4 w-4" /> Adjust it
                </button>
              )}
              <button onClick={() => onResolve("dismissed")}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted/50">
                <X className="h-4 w-4" /> Not today
              </button>
            </>
          )}
        </div>

        {/* Why this surfaced, keep it explainable */}
        <div className="pt-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Why you&apos;re seeing this</p>
          <ul className="space-y-0.5">
            {match.reasons.map((rsn, i) => (
              <li key={i} className="text-[11px] text-muted-foreground flex gap-1.5">
                <span style={{ color: CYAN }}>·</span> {cap(rsn)}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ── The referenced trade — recap, journal, and the 5R reflection from then ── */
function ReferencedTrade({ trade, session }: { trade: TradeJournalEntry; session: PsychEdgeSession | null }) {
  const r = tradeR(trade);
  const checks = trade.discipline?.custom_checks ?? [];
  const followed = checks.filter((c) => c.passed).length;
  const notes = [
    { label: "Execution", text: trade.execution_notes },
    { label: "Psychology", text: trade.psychology_notes },
    { label: "Mistakes", text: trade.mistakes },
    { label: "Lessons", text: trade.lessons },
  ].filter((n) => n.text && n.text.trim());

  return (
    <div className="rounded-xl border border-border bg-background/40 overflow-hidden">
      <div className="px-3.5 py-2.5 border-b border-border/60 flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">The trade in question</span>
        <span className="text-sm font-bold font-mono ml-1">{instrumentName(trade.instrument)}</span>
        <span className="text-[11px] text-muted-foreground capitalize">{trade.direction}</span>
        <span className="ml-auto text-sm font-black tabular-nums" style={{ color: r < 0 ? RED : GREEN }}>{fmtR(r)}</span>
      </div>
      <div className="px-3.5 py-2.5 space-y-2.5">
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          <span>{dayLabel(trade.date_time)}</span>
          <span>· {trade.session}</span>
          {trade.execution_time && <span>· entry {trade.execution_time}{trade.execution_end_time ? `–${trade.execution_end_time}` : ""}</span>}
          {trade.execution_quality && <span>· execution <span style={{ color: trade.execution_quality === "bad" ? RED : GREEN }}>{trade.execution_quality}</span></span>}
          {checks.length > 0 && <span>· rules <span className="tabular-nums text-foreground/70">{followed}/{checks.length}</span></span>}
        </div>

        {/* What you wrote in your journal that day */}
        {notes.length > 0 ? (
          <div className="space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Your journal that day</p>
            {notes.map((n) => (
              <p key={n.label} className="text-xs leading-relaxed text-foreground/80">
                <span className="font-medium text-foreground/55">{n.label}: </span>{n.text.trim()}
              </p>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-muted-foreground/70 italic">No journal notes were written on this trade.</p>
        )}

        {/* Your 5R reflection on this trade */}
        <ReflectionSummary session={session} />
      </div>
    </div>
  );
}

function ReflectionSummary({ session }: { session: PsychEdgeSession | null }) {
  const has = session && (session.response_tag || session.reasoning_answer || session.commitment_statement || session.reconstruction_confirmed);
  if (!has) {
    return <p className="text-[11px] text-muted-foreground/70 italic border-t border-border/50 pt-2">No 5R reflection was logged for this trade yet.</p>;
  }
  return (
    <div className="border-t border-border/50 pt-2 space-y-1">
      <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: CYAN }}>Your 5R reflection then</p>
      {session!.response_tag && (
        <p className="text-xs text-foreground/80">
          <span className="font-medium text-foreground/55">Felt: </span>{TAG_LABEL[session!.response_tag]}{session!.emotion_intensity ? ` (${session!.emotion_intensity}/5)` : ""}
        </p>
      )}
      {session!.reasoning_answer && (
        <p className="text-xs text-foreground/80 leading-relaxed"><span className="font-medium text-foreground/55">Reflected: </span>{session!.reasoning_answer}</p>
      )}
      {session!.commitment_statement && (
        <p className="text-xs leading-relaxed font-medium" style={{ color: ACCENT }}>{session!.commitment_statement}</p>
      )}
    </div>
  );
}

function NoMatch({ signals }: { signals: MirrorSignals }) {
  return (
    <div className="rounded-xl border border-dashed border-border p-8 text-center">
      <ShieldCheck className="h-6 w-6 mx-auto mb-2" style={{ color: GREEN }} />
      <p className="text-sm font-semibold">Nothing lines up today.</p>
      <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto leading-relaxed">
        Today&apos;s context doesn&apos;t match any pattern in your history strongly enough to flag.
        {signals.lossStreak > 0 ? " You're carrying a loss streak, so stay honest at the screen." : " Trade your plan."}
      </p>
    </div>
  );
}

/* ── Today's signals ──────────────────────────────────────────────────── */
function SignalsPanel({ signals, mindscore }: { signals: MirrorSignals; mindscore: number | null }) {
  const rows: { label: string; value: string; tone?: string }[] = [
    { label: "Today", value: `${signals.weekday}, ${signals.time}` },
    { label: "Loss streak", value: signals.lossStreak === 0 ? "None" : `${signals.lossStreak} in a row`, tone: signals.lossStreak > 0 ? RED : undefined },
    { label: "MC Mindscore", value: mindscore == null ? "—" : String(mindscore), tone: mindscore == null ? undefined : bandColorFor(mindscore) },
    { label: "Open rule slips", value: signals.openViolations === 0 ? "None" : `${signals.openViolations} of last 3`, tone: signals.openViolations > 0 ? RED : undefined },
  ];
  return (
    <div className="rounded-xl border border-border bg-card p-4 lg:sticky lg:top-4">
      <p className="text-sm font-semibold mb-2.5">Today&apos;s context</p>
      <div className="space-y-2.5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">{r.label}</span>
            <span className="text-sm font-semibold tabular-nums" style={{ color: r.tone ?? "var(--foreground)" }}>{r.value}</span>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground/70 mt-3 leading-snug">
        These are the signals the Mirror weighs against your pattern history.
      </p>
    </div>
  );
}

const lower = (s: string) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);
const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
