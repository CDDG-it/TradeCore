"use client";

/**
 * Commitments: the loop that carries a 5R session into the next trade.
 *
 * A commitment is an if/then the trader wrote themselves: if <trigger>, then
 * <action>. The pattern engine already detects the behaviours those are meant
 * to counter, so when the same pattern fires on a later trade this raises a
 * check: "you committed to this: did you hold it?" The trader answers, and the
 * kept rate becomes the one honest measure of whether reflection changed
 * anything.
 *
 * Nothing here infers adherence. A pattern re-firing only means the situation
 * recurred, so the check is raised and the answer is asked for, never guessed.
 */

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { AnimatePresence, motion } from "motion/react";
import { Check, X, Loader2, Plus, ExternalLink, Archive } from "lucide-react";
import { cn } from "@/lib/utils";
import { AccentPanel } from "@/components/ui/accent-panel";
import { CountUp, EASE_OUT } from "@/components/ui/count-up";
import {
  getCommitments, createCommitment, updateCommitment,
  getCommitmentAdherenceLogs, createAdherenceLog, resolveAdherenceLog,
  getTrades, getAnalyses,
} from "@/lib/supabase/queries";
import { detectPatterns, PATTERN_LABELS, PATTERN_DESCRIPTIONS, type AnalysisRef } from "@/lib/psych-edge/patterns";
import { instrumentName } from "@/lib/journal/weeks";
import type {
  Commitment, CommitmentAdherenceLog, PatternType, TradeSummary,
} from "@/lib/types";

const PATTERN_OPTIONS = Object.entries(PATTERN_LABELS) as [PatternType, string][];

/** The day a commitment came into force: checks only count trades after it. */
const inForceFrom = (c: Commitment) => c.created_at.slice(0, 10);

const rateTone = (rate: number) => (rate >= 70 ? "var(--win)" : rate >= 40 ? "var(--primary)" : "var(--loss)");
const indexed = (i: number) => ({ "--i": i }) as CSSProperties;

/** Enter from just below, leave upwards: an answered check moves on, it does not vanish. */
const cardMotion = {
  layout: true,
  initial: { opacity: 0, transform: "translateY(8px)" },
  animate: { opacity: 1, transform: "translateY(0px)" },
  exit: { opacity: 0, transform: "translateY(-8px)" },
  transition: { duration: 0.22, ease: EASE_OUT },
} as const;

/** Everything the panel would otherwise read from Supabase, for the dev preview. */
export type CommitmentsSeed = {
  commitments: Commitment[];
  logs: CommitmentAdherenceLog[];
  trades: TradeSummary[];
  analyses: AnalysisRef[];
};

/** The last checks on one commitment as a row of dots, oldest first: the
 *  kept rate, but readable as a run rather than a number. */
function Ledger({ logs }: { logs: CommitmentAdherenceLog[] }) {
  const recent = [...logs].sort((a, b) => a.date.localeCompare(b.date)).slice(-12);
  if (!recent.length) return null;
  return (
    <span className="inline-flex items-center gap-1" aria-label={`${recent.length} recent checks`}>
      {recent.map((l, i) => (
        <span
          key={l.id}
          title={`${format(new Date(l.date + "T12:00:00"), "MMM d")}: ${l.followed === null ? "waiting for your answer" : l.followed ? "kept" : "not kept"}`}
          style={indexed(i)}
          className={cn(
            "dot-in h-2 w-2 rounded-full",
            l.followed === true && "bg-win",
            l.followed === false && "bg-loss",
            l.followed === null && "border border-dashed border-primary/60"
          )}
        />
      ))}
    </span>
  );
}

/**
 * One half of the sentence: the leading word fixed in the margin, a blank
 * that grows with what is written, and a hint beneath instead of an example
 * inside it. The blank's underline picks up the accent on focus.
 */
function IfThenField({ word, value, onChange, label, hint }: {
  word: string; value: string; onChange: (v: string) => void; label: string; hint: string;
}) {
  return (
    <label className="grid grid-cols-[3.25rem_minmax(0,1fr)] gap-x-3">
      <span className="pt-1 font-heading text-lg text-muted-foreground">{word}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        rows={2}
        onInput={(e) => { const t = e.currentTarget; t.style.height = "auto"; t.style.height = `${t.scrollHeight}px`; }}
        className="w-full resize-none border-b-2 border-border/70 bg-transparent pb-1.5 font-heading text-lg leading-snug tracking-tight text-foreground outline-none transition-colors focus:border-primary focus-visible:outline-none"
      />
      <span className="col-start-2 mt-1.5 text-[11px] text-muted-foreground/70">{hint}</span>
    </label>
  );
}

export function CommitmentsPanel({ seed }: { seed?: CommitmentsSeed } = {}) {
  const [commitments, setCommitments] = useState<Commitment[]>(seed?.commitments ?? []);
  const [logs, setLogs] = useState<CommitmentAdherenceLog[]>(seed?.logs ?? []);
  const [trades, setTrades] = useState<TradeSummary[]>(seed?.trades ?? []);
  const [analyses, setAnalyses] = useState<AnalysisRef[]>(seed?.analyses ?? []);
  const [loading, setLoading] = useState(!seed);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // New commitment form
  const [trigger, setTrigger] = useState("");
  const [action, setAction] = useState("");
  const [pattern, setPattern] = useState<PatternType | "">("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (seed) return;
    Promise.all([getCommitments(), getCommitmentAdherenceLogs(), getTrades(), getAnalyses()])
      .then(([c, l, t, a]) => { setCommitments(c); setLogs(l); setTrades(t); setAnalyses(a); })
      .catch(() => setError("Could not load commitments. Run trade_therapist.sql in Supabase."))
      .finally(() => setLoading(false));
  }, [seed]);

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
    if (seed || loading || !commitments.length || !events.length) return;

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
          // first is systemic (usually trade_therapist.sql not run yet), so
          // stop rather than firing a request per pattern occurrence.
          if (i === 0) break;
        }
      }
      if (live && created.length) setLogs((prev) => [...prev, ...created]);
    })();
    return () => { live = false; };
  }, [seed, loading, commitments, events, logs]);

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
      const row = seed
        ? { ...logs.find((l) => l.id === id)!, followed }
        : await resolveAdherenceLog(id, followed);
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
    const draft = {
      trade_id: null,
      pattern_type: pattern || null,
      trigger_text: trigger.trim(),
      action_text: action.trim(),
      active: true,
    };
    try {
      const c = seed
        ? { ...draft, id: `local-${Date.now()}`, user_id: "preview", created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
        : await createCommitment(draft);
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
      const c = seed ? { ...byId.get(id)!, active: false } : await updateCommitment(id, { active: false });
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
  const canAdd = Boolean(trigger.trim() && action.trim());

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      {/* The header carries the three numbers that matter, and the kept rate
          gets a meter so a run of good answers is visible as a bar filling. */}
      <AccentPanel
        accent="primary"
        className="shrink-0 py-3.5"
        eyebrow="Commitments"
        title="Does the reflection actually carry?"
        headerRight={
          <div className="flex items-end gap-5 text-right sm:gap-7">
            <div className="hidden sm:block">
              <p className="font-heading text-2xl font-black tabular-nums leading-none" style={{ color: open.length ? "var(--loss)" : "var(--muted-foreground)" }}>
                <CountUp value={open.length} />
              </p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">to answer</p>
            </div>
            <div className="hidden sm:block">
              <p className="font-heading text-2xl font-black tabular-nums leading-none text-foreground">
                <CountUp value={active.length} />
              </p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">in force</p>
            </div>
            <div className="min-w-[88px]">
              <p
                className="font-heading text-2xl font-black tabular-nums leading-none"
                style={{ color: keptRate === null ? "var(--muted-foreground)" : rateTone(keptRate) }}
              >
                {keptRate === null ? "–" : <><CountUp value={keptRate} />%</>}
              </p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                kept · {resolved.length} check{resolved.length === 1 ? "" : "s"}
              </p>
              <span className="mt-1.5 block h-[3px] w-full overflow-hidden rounded-full bg-foreground/10">
                <span
                  className="meter-fill block h-full w-full rounded-full"
                  style={{ "--fill": (keptRate ?? 0) / 100, background: keptRate === null ? "transparent" : rateTone(keptRate) } as CSSProperties}
                />
              </span>
            </div>
          </div>
        }
      />

      {error && (
        <p className="shrink-0 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      )}

      {/* The working area: what needs answering and what already stands, beside
          the form for writing the next one. Columns scroll, the page does not. */}
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)] gap-3 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="flex min-h-0 flex-col gap-5 overflow-y-auto pr-1">
          {/* Open checks: the ask */}
          <section className="space-y-2.5">
            <h3 className="font-heading text-[11px] font-bold uppercase tracking-[0.16em] text-loss/80">
              Needs an answer{open.length > 0 && ` · ${open.length}`}
            </h3>

            <AnimatePresence initial={false} mode="popLayout">
              {open.length === 0 ? (
                <motion.p
                  key="none"
                  {...cardMotion}
                  className="rounded-2xl border border-dashed border-border/60 bg-card px-4 py-7 text-center text-xs text-muted-foreground"
                >
                  Nothing to check. A check appears here when a commitment&apos;s pattern shows up again on a later trade.
                </motion.p>
              ) : (
                open.map((l) => {
                  const c = byId.get(l.commitment_id)!;
                  const t = l.trade_id ? tradeById.get(l.trade_id) : undefined;
                  const ev = events.find((e) => e.tradeId === l.trade_id && e.type === c.pattern_type);
                  return (
                    <motion.div key={l.id} {...cardMotion}>
                      <AccentPanel accent="destructive" className="py-4">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80">
                          You committed
                        </p>
                        <p className="mt-2 font-heading text-[15px] leading-snug tracking-tight">
                          <span className="text-muted-foreground">If</span>{" "}
                          <span className="font-semibold">{c.trigger_text}</span>
                          <span className="text-muted-foreground">, then </span>
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

                        <div className="mt-3.5 flex items-center gap-2 border-t border-border/40 pt-3">
                          <p className="mr-auto text-xs font-semibold text-muted-foreground">Did you hold it?</p>
                          <button
                            type="button"
                            onClick={() => resolve(l.id, true)}
                            disabled={busy === l.id}
                            className="press inline-flex items-center gap-1.5 rounded-lg border border-win/40 bg-win/10 px-3.5 py-1.5 text-xs font-bold text-win hover:bg-win/20 disabled:opacity-50"
                          >
                            <Check className="h-3.5 w-3.5" strokeWidth={3} /> Yes
                          </button>
                          <button
                            type="button"
                            onClick={() => resolve(l.id, false)}
                            disabled={busy === l.id}
                            className="press inline-flex items-center gap-1.5 rounded-lg border border-loss/40 bg-loss/10 px-3.5 py-1.5 text-xs font-bold text-loss hover:bg-loss/20 disabled:opacity-50"
                          >
                            <X className="h-3.5 w-3.5" strokeWidth={3} /> No
                          </button>
                        </div>
                      </AccentPanel>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </section>

          {/* Standing commitments */}
          <section className="space-y-2.5">
            <h3 className="font-heading text-[11px] font-bold uppercase tracking-[0.16em] text-primary/80">
              In force{active.length > 0 && ` · ${active.length}`}
            </h3>

            <AnimatePresence initial={false} mode="popLayout">
              {active.length === 0 ? (
                <motion.p
                  key="none"
                  {...cardMotion}
                  className="rounded-2xl border border-dashed border-border/60 bg-card px-4 py-7 text-center text-xs text-muted-foreground"
                >
                  No commitments yet. Write one beside this, or finish a 5R session and turn its reconstruction into one.
                </motion.p>
              ) : (
                active.map((c, i) => {
                  const r = rateFor(c.id);
                  const mine = logs.filter((l) => l.commitment_id === c.id);
                  return (
                    <motion.div
                      key={c.id}
                      {...cardMotion}
                      style={indexed(i)}
                      className="rise-in group/commit relative overflow-hidden rounded-xl border border-border/50 bg-card px-4 py-3.5"
                    >
                      {/* A spine in the commitment's own kept tone, so a row of
                          cards reads as a row of verdicts. */}
                      <span
                        aria-hidden
                        className="absolute inset-y-0 left-0 w-[3px]"
                        style={{ background: r ? rateTone(r.rate) : "color-mix(in oklch, var(--primary) 40%, transparent)" }}
                      />
                      <div className="flex items-start gap-3 pl-1.5">
                        <div className="min-w-0 flex-1">
                          <p className="font-heading text-[15px] leading-snug tracking-tight">
                            <span className="text-muted-foreground">If</span>{" "}
                            <span className="font-semibold">{c.trigger_text}</span>
                            <span className="text-muted-foreground">, then </span>
                            <span className="font-semibold">{c.action_text}</span>
                          </p>
                          <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                            <span>
                              {c.pattern_type ? (
                                <>Checked on <span className="font-semibold text-foreground/75">{PATTERN_LABELS[c.pattern_type]}</span></>
                              ) : (
                                <>Not checked automatically</>
                              )}
                              {" · since "}
                              {format(new Date(c.created_at), "MMM d")}
                            </span>
                            <Ledger logs={mine} />
                          </p>
                        </div>

                        {r && (
                          <div className="shrink-0 text-right">
                            <p className="text-base font-black tabular-nums leading-none" style={{ color: rateTone(r.rate) }}>
                              <CountUp value={r.rate} />%
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
                          title="Retire: keeps the history, stops new checks"
                          aria-label="Retire commitment"
                          className="press flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted/60 hover:text-foreground disabled:opacity-50"
                        >
                          <Archive className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </section>
        </div>

        {/* Write one: an if/then the trader writes in their own words. No
            example text in the blanks: the sentence has to be theirs. Once
            both halves exist it is read back as one line before committing. */}
        <AccentPanel accent="cyan" eyebrow="Write it yourself" title="If ___, then ___." className="min-h-0 overflow-y-auto">
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            A commitment is one situation and one response. Write both as they actually happen to you, not as advice.
          </p>
          <div className="mt-5 space-y-5">
            <IfThenField word="If" value={trigger} onChange={setTrigger} label="The situation" hint="The situation, exactly as it happens to you." />
            <IfThenField word="then" value={action} onChange={setAction} label="The response" hint="What you will do instead, the moment it happens." />
          </div>

          <AnimatePresence initial={false}>
            {canAdd && (
              <motion.blockquote
                key="preview"
                initial={{ opacity: 0, transform: "translateY(6px)" }}
                animate={{ opacity: 1, transform: "translateY(0px)" }}
                exit={{ opacity: 0, transform: "translateY(6px)" }}
                transition={{ duration: 0.2, ease: EASE_OUT }}
                className="mt-5 rounded-xl border border-primary/30 bg-primary/[0.06] px-4 py-3"
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary/80">Reads as</p>
                <p className="mt-1.5 font-heading text-[15px] leading-snug tracking-tight text-foreground">
                  If {trigger.trim().replace(/[.!]+$/, "")}, then {action.trim().replace(/[.!]+$/, "")}.
                </p>
              </motion.blockquote>
            )}
          </AnimatePresence>

          <div className="mt-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Optionally, check it against a pattern
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Pattern to check against">
              {([["", "No automatic check"], ...PATTERN_OPTIONS] as [PatternType | "", string][]).map(([value, label]) => {
                const on = pattern === value;
                return (
                  <button
                    key={value || "none"}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    title={value ? PATTERN_DESCRIPTIONS[value] : "Keep the commitment without automatic checks"}
                    onClick={() => setPattern(value)}
                    className={cn(
                      "press rounded-full border px-3 py-1.5 text-[11px] font-semibold",
                      on
                        ? "border-primary/60 bg-primary/15 text-primary"
                        : "border-border/60 text-muted-foreground hover:border-border hover:text-foreground"
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground/80">
              {pattern
                ? `A check is raised whenever ${PATTERN_LABELS[pattern].toLowerCase()} shows up on a later trade.`
                : "Without a pattern the commitment stands, but nothing checks it for you."}
            </p>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={add}
              disabled={adding || !canAdd}
              className="press inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
              style={{ background: "var(--primary)", boxShadow: "0 2px 12px color-mix(in oklch, var(--primary) 26%, transparent)" }}
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
