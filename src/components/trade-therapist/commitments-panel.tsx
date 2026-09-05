"use client";

/**
 * Commitments — the loop that carries a 5R session into the next trade.
 *
 * A commitment is an if/then the trader wrote themselves: when <trigger>, then
 * <action>. The pattern engine already detects the behaviours those are meant
 * to counter, so when the same pattern fires on a later trade this raises a
 * check: "you committed to this — did you hold it?" The trader answers, and the
 * kept rate becomes the one honest measure of whether reflection changed
 * anything.
 *
 * Nothing here infers adherence. A pattern re-firing only means the situation
 * recurred, so the check is raised and the answer is asked for, never guessed.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Check, X, Loader2, Plus, ExternalLink, Archive } from "lucide-react";
import { AccentPanel } from "@/components/ui/accent-panel";
import {
  getCommitments, createCommitment, updateCommitment,
  getCommitmentAdherenceLogs, createAdherenceLog, resolveAdherenceLog,
  getTrades, getAnalyses,
} from "@/lib/supabase/queries";
import { detectPatterns, PATTERN_LABELS } from "@/lib/psych-edge/patterns";
import { instrumentName } from "@/lib/journal/weeks";
import type {
  Commitment, CommitmentAdherenceLog, PatternType,
  TradeJournalEntry, PreTradeAnalysis,
} from "@/lib/types";

const PATTERN_OPTIONS = Object.entries(PATTERN_LABELS) as [PatternType, string][];

/** The day a commitment came into force — checks only count trades after it. */
const inForceFrom = (c: Commitment) => c.created_at.slice(0, 10);

export function CommitmentsPanel() {
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [logs, setLogs] = useState<CommitmentAdherenceLog[]>([]);
  const [trades, setTrades] = useState<TradeJournalEntry[]>([]);
  const [analyses, setAnalyses] = useState<PreTradeAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // New commitment form
  const [trigger, setTrigger] = useState("");
  const [action, setAction] = useState("");
  const [pattern, setPattern] = useState<PatternType | "">("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    Promise.all([getCommitments(), getCommitmentAdherenceLogs(), getTrades(), getAnalyses()])
      .then(([c, l, t, a]) => { setCommitments(c); setLogs(l); setTrades(t); setAnalyses(a); })
      .catch(() => setError("Could not load commitments. Run trade_therapist.sql in Supabase."))
      .finally(() => setLoading(false));
  }, []);

  const events = useMemo(() => detectPatterns(trades, analyses), [trades, analyses]);
  const tradeById = useMemo(
    () => new Map(trades.map((t) => [t.id, t])),
    [trades]
  );

  /**
   * Raise a check for every later re-occurrence of a commitment's pattern that
   * has not been checked yet. Idempotent: an existing log for the same
   * commitment + trade is never duplicated, and the commitment's own originating
   * trade is skipped, since that is the occurrence that prompted it.
   */
  useEffect(() => {
    if (loading || !commitments.length || !events.length) return;

    const have = new Set(logs.map((l) => `${l.commitment_id}|${l.trade_id ?? ""}`));
    const missing: { commitment_id: string; trade_id: string; date: string }[] = [];

    for (const c of commitments) {
      if (!c.active || !c.pattern_type) continue;
      const from = inForceFrom(c);
      for (const e of events) {
        if (e.type !== c.pattern_type) continue;
        if (e.tradeId === c.trade_id) continue;   // the occurrence that spawned it
        if (e.date <= from) continue;             // predates the commitment
        if (have.has(`${c.id}|${e.tradeId}`)) continue;
        missing.push({ commitment_id: c.id, trade_id: e.tradeId, date: e.date });
      }
    }
    if (!missing.length) return;

    let live = true;
    (async () => {
      const created: CommitmentAdherenceLog[] = [];
      for (const [i, m] of missing.entries()) {
        try {
          created.push(await createAdherenceLog({ ...m, matched: true, followed: null }));
        } catch {
          // A later failure is most likely the unique index rejecting a check
          // another session raised first, so keep going. A failure on the very
          // first is systemic — usually trade_therapist.sql not run yet — so
          // stop rather than firing a request per pattern occurrence.
          if (i === 0) break;
        }
      }
      if (live && created.length) setLogs((prev) => [...prev, ...created]);
    })();
    return () => { live = false; };
  }, [loading, commitments, events, logs]);

  const byId = useMemo(() => new Map(commitments.map((c) => [c.id, c])), [commitments]);
  const open = logs.filter((l) => l.followed === null && byId.get(l.commitment_id)?.active);
  const resolved = logs.filter((l) => l.followed !== null);
  const keptRate = resolved.length
    ? Math.round((resolved.filter((l) => l.followed).length / resolved.length) * 100)
    : null;

  /** Kept rate for one commitment, across its own resolved checks. */
  const rateFor = useCallback(
    (id: string) => {
      const mine = logs.filter((l) => l.commitment_id === id && l.followed !== null);
      if (!mine.length) return null;
      return {
        rate: Math.round((mine.filter((l) => l.followed).length / mine.length) * 100),
        n: mine.length,
      };
    },
    [logs]
  );

  async function resolve(id: string, followed: boolean) {
    setBusy(id); setError(null);
    try {
      const row = await resolveAdherenceLog(id, followed);
      setLogs((prev) => prev.map((l) => (l.id === id ? row : l)));
    } catch {
      setError("Could not save that answer.");
    } finally {
      setBusy(null);
    }
  }

  async function add() {
    if (!trigger.trim() || !action.trim()) return;
    setAdding(true); setError(null);
    try {
      const c = await createCommitment({
        trade_id: null,
        pattern_type: pattern || null,
        trigger_text: trigger.trim(),
        action_text: action.trim(),
        active: true,
      });
      setCommitments((prev) => [c, ...prev]);
      setTrigger(""); setAction(""); setPattern("");
    } catch {
      setError("Could not save. Run trade_therapist.sql in Supabase.");
    } finally {
      setAdding(false);
    }
  }

  async function retire(id: string) {
    setBusy(id); setError(null);
    try {
      const c = await updateCommitment(id, { active: false });
      setCommitments((prev) => prev.map((x) => (x.id === id ? c : x)));
    } catch {
      setError("Could not retire that commitment.");
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const active = commitments.filter((c) => c.active);
  const retired = commitments.filter((c) => !c.active);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <AccentPanel
        accent="primary"
        className="shrink-0 py-3.5"
        eyebrow="Commitments"
        title="Does the reflection actually carry?"
        headerRight={
          keptRate !== null ? (
            <div className="text-right">
              <p
                className="font-heading text-2xl font-black tabular-nums leading-none"
                style={{ color: keptRate >= 70 ? "#22c55e" : keptRate >= 40 ? "#14B8A6" : "#ef4444" }}
              >
                {keptRate}%
              </p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                kept · {resolved.length} checks
              </p>
            </div>
          ) : undefined
        }
      />

      {error && (
        <p className="shrink-0 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      )}

      {/* The working area: what needs answering and what already stands, beside
          the form for writing the next one. Columns scroll, the page does not. */}
      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[1.5fr_1fr]">
      <div className="flex min-h-0 flex-col gap-4 overflow-y-auto pr-1">
      {/* Open checks — the ask */}
      <section className="space-y-3">
        <h3 className="font-heading text-sm font-bold uppercase tracking-[0.14em] text-destructive/80">
          Needs an answer{open.length > 0 && ` · ${open.length}`}
        </h3>

        {open.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border/60 bg-card px-4 py-8 text-center text-xs text-muted-foreground">
            Nothing to check. A check appears here when a commitment&apos;s pattern shows up again on a later trade.
          </p>
        ) : (
          open.map((l) => {
            const c = byId.get(l.commitment_id)!;
            const t = l.trade_id ? tradeById.get(l.trade_id) : undefined;
            const ev = events.find((e) => e.tradeId === l.trade_id && e.type === c.pattern_type);
            return (
              <AccentPanel key={l.id} accent="destructive">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80">
                  You committed
                </p>
                <p className="mt-2 text-sm leading-relaxed">
                  <span className="text-muted-foreground">When</span>{" "}
                  <span className="font-semibold">{c.trigger_text}</span>
                  <span className="text-muted-foreground"> — then </span>
                  <span className="font-semibold">{c.action_text}</span>
                </p>

                <div className="mt-3 rounded-lg border border-border/50 bg-background/40 px-3 py-2.5">
                  <p className="text-[11px] text-muted-foreground">
                    {c.pattern_type && (
                      <span className="font-semibold text-foreground/80">
                        {PATTERN_LABELS[c.pattern_type]}
                      </span>
                    )}
                    {t && (
                      <>
                        {" "}on{" "}
                        <Link href={`/journal/${t.id}`} className="font-semibold text-primary hover:underline">
                          {instrumentName(t.instrument)}
                          <ExternalLink className="ml-1 inline h-3 w-3" />
                        </Link>{" "}
                        · {format(new Date(l.date + "T12:00:00"), "MMM d")}
                      </>
                    )}
                  </p>
                  {ev && <p className="mt-1.5 text-[12px] leading-snug text-foreground/75">{ev.detail}</p>}
                </div>

                <div className="mt-4 flex items-center gap-2 border-t border-border/40 pt-3.5">
                  <p className="mr-auto text-xs font-semibold text-muted-foreground">Did you hold it?</p>
                  <button
                    type="button"
                    onClick={() => resolve(l.id, true)}
                    disabled={busy === l.id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-success/40 bg-success/10 px-3 py-1.5 text-xs font-bold text-success transition-colors hover:bg-success/15 disabled:opacity-50"
                  >
                    <Check className="h-3.5 w-3.5" strokeWidth={3} /> Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => resolve(l.id, false)}
                    disabled={busy === l.id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-1.5 text-xs font-bold text-destructive transition-colors hover:bg-destructive/15 disabled:opacity-50"
                  >
                    <X className="h-3.5 w-3.5" strokeWidth={3} /> No
                  </button>
                </div>
              </AccentPanel>
            );
          })
        )}
      </section>

      {/* Standing commitments */}
      <section className="space-y-3">
        <h3 className="font-heading text-sm font-bold uppercase tracking-[0.14em] text-primary/80">
          In force{active.length > 0 && ` · ${active.length}`}
        </h3>

        {active.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border/60 bg-card px-4 py-8 text-center text-xs text-muted-foreground">
            No commitments yet. Write one below, or finish a 5R session and turn its reconstruction into one.
          </p>
        ) : (
          <div className="space-y-2">
            {active.map((c) => {
              const r = rateFor(c.id);
              return (
                <div key={c.id} className="rounded-xl border border-border/50 bg-card px-4 py-3">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-relaxed">
                        <span className="text-muted-foreground">When</span>{" "}
                        <span className="font-semibold">{c.trigger_text}</span>
                        <span className="text-muted-foreground"> — then </span>
                        <span className="font-semibold">{c.action_text}</span>
                      </p>
                      <p className="mt-1.5 text-[11px] text-muted-foreground">
                        {c.pattern_type ? (
                          <>Auto-checked on {PATTERN_LABELS[c.pattern_type]}</>
                        ) : (
                          <>No pattern attached — this one is not checked automatically</>
                        )}
                        {" · in force since "}
                        {format(new Date(c.created_at), "MMM d")}
                      </p>
                    </div>

                    {r && (
                      <div className="shrink-0 text-right">
                        <p
                          className="text-sm font-black tabular-nums leading-none"
                          style={{ color: r.rate >= 70 ? "#22c55e" : r.rate >= 40 ? "#14B8A6" : "#ef4444" }}
                        >
                          {r.rate}%
                        </p>
                        <p className="mt-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">
                          {r.n} check{r.n !== 1 ? "s" : ""}
                        </p>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => retire(c.id)}
                      disabled={busy === c.id}
                      title="Retire — keeps the history, stops new checks"
                      aria-label="Retire commitment"
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground disabled:opacity-50"
                    >
                      <Archive className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      </div>

      {/* Write one */}
      <AccentPanel accent="cyan" eyebrow="New" title="Write a commitment" className="min-h-0 overflow-y-auto">
        <div className="mt-4 space-y-2.5">
          <label className="block">
            <span className="text-[11px] font-semibold text-muted-foreground">When… (the trigger)</span>
            <input
              value={trigger}
              onChange={(e) => setTrigger(e.target.value)}
              placeholder="I take a full stop-out"
              className="mt-1.5 w-full rounded-lg border border-border/60 bg-background/40 px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-primary/50"
            />
          </label>
          <label className="block">
            <span className="text-[11px] font-semibold text-muted-foreground">…then (the action)</span>
            <input
              value={action}
              onChange={(e) => setAction(e.target.value)}
              placeholder="I step away from the screen for fifteen minutes"
              className="mt-1.5 w-full rounded-lg border border-border/60 bg-background/40 px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-primary/50"
            />
          </label>
          <label className="block">
            <span className="text-[11px] font-semibold text-muted-foreground">
              Check it against (optional — needed for automatic checks)
            </span>
            <select
              value={pattern}
              onChange={(e) => setPattern(e.target.value as PatternType | "")}
              className="mt-1.5 w-full rounded-lg border border-border/60 bg-background/40 px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary/50"
            >
              <option value="">No automatic check</option>
              {PATTERN_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={add}
            disabled={adding || !trigger.trim() || !action.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all hover:-translate-y-px disabled:opacity-40 disabled:hover:translate-y-0"
            style={{ background: "#14B8A6", boxShadow: "0 2px 12px rgba(20,184,166,0.26)" }}
          >
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Commit to it
          </button>
        </div>
      </AccentPanel>

      </div>

      {retired.length > 0 && (
        <p className="shrink-0 text-center text-[11px] text-muted-foreground/70">
          {retired.length} retired commitment{retired.length !== 1 ? "s" : ""} kept for history.
        </p>
      )}
    </div>
  );
}
