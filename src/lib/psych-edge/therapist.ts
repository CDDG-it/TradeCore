/**
 * MC Trade Therapist — composition layer.
 *
 * Turns the deterministic pattern engine (./patterns) into the three things the
 * product surfaces:
 *
 *   • buildFiveR            — the content for one Post-Trade 5R session.
 *   • buildPreTradeMirror   — today's context vs. past pattern situations.
 *   • computeCommitmentAdherence / computeReflectionConsistency — the two new
 *                             Mindscore signals.
 *
 * Everything here is derived from the trader's own data. Nothing is invented:
 * when there is no match, these return null / inapplicable rather than filling
 * the gap with generic advice.
 */
import { format, parse } from "date-fns";
import { tradeR, instrumentName } from "@/lib/journal/weeks";
import {
  detectPatterns,
  patternsForTrade,
  priorOccurrence,
  summarizePatterns,
  dailyTradeNorm,
  PATTERN_LABELS,
  PATTERN_THRESHOLDS,
  type DetectedPattern,
  type PatternStat,
} from "@/lib/psych-edge/patterns";
import type {
  TradeJournalEntry,
  PreTradeAnalysis,
  PsychEdgeSession,
  Commitment,
  CommitmentAdherenceLog,
  PatternType,
} from "@/lib/types";

const fmtR = (v: number) => `${v > 0 ? "+" : ""}${v.toFixed(1)}R`;
const fmtDay = (iso: string) => format(parse(iso.slice(0, 10), "yyyy-MM-dd", new Date()), "MMM d");

// ── Post-Trade 5R ───────────────────────────────────────────────────────
export interface FiveRContext {
  trade: TradeJournalEntry;
  netR: number;
  /** Reporting — factual recap, straight from the journal. */
  report: string;
  /** Every pattern that fired on this trade (highest confidence first). */
  patterns: DetectedPattern[];
  /** The pattern that drives Relating/Reasoning — the highest-confidence one. */
  driver: DetectedPattern | null;
  /** Relating — a comparable earlier occurrence of the driver pattern. */
  prior: DetectedPattern | null;
  /** Reasoning — cumulative cost of the driver pattern across all history. */
  stat: PatternStat | null;
  /** Reconstructing — a seed if-then commitment for the driver pattern. */
  scaffold: { trigger: string; action: string } | null;
}

/** Non-judgemental, factual one-liner from the journal. */
function reportLine(t: TradeJournalEntry): string {
  const r = tradeR(t);
  const resultLabel = t.result === "win" ? "won" : t.result === "loss" ? "lost" : "closed break-even";
  const parts = [`${instrumentName(t.instrument)} ${t.direction}`, `${t.session} session`, `${resultLabel} (${fmtR(r)})`];
  if (t.execution_quality) parts.push(`execution rated ${t.execution_quality}`);
  const checks = t.discipline?.custom_checks ?? [];
  if (checks.length) parts.push(`${checks.filter((c) => c.passed).length}/${checks.length} of your rules followed`);
  return parts.join(" · ") + ".";
}

/** Deterministic if-then seed per pattern — the trader rewrites it in their words. */
function scaffoldFor(type: PatternType): { trigger: string; action: string } {
  switch (type) {
    case "revenge":
      return { trigger: "I take a loss and feel the urge to get straight back in", action: `wait ${PATTERN_THRESHOLDS.revengeFastWindowMin} minutes and re-read my plan before the next entry` };
    case "size-escalation":
      return { trigger: "I've just taken two losses in a row", action: "keep the same R target — no adding size to win it back" };
    case "overtrading":
      return { trigger: "I've hit my normal number of trades for the day", action: "close the platform and log the day, even if a setup looks tempting" };
    case "plan-deviation":
      return { trigger: "I want to take a trade that isn't in today's analysis", action: "write down why before I enter, or skip it" };
  }
}

/**
 * Build the 5R content for one trade. `trades`/`analyses` are the full history so
 * Relating and the cumulative stats have context. Returns null if the trade isn't
 * in the history.
 */
export function buildFiveR(
  tradeId: string,
  trades: TradeJournalEntry[],
  analyses: PreTradeAnalysis[]
): FiveRContext | null {
  const trade = trades.find((t) => t.id === tradeId);
  if (!trade) return null;

  const all = detectPatterns(trades, analyses);
  const onTrade = patternsForTrade(tradeId, trades, analyses).sort((a, b) => b.confidence - a.confidence);
  const driver = onTrade[0] ?? null;
  const prior = driver ? priorOccurrence(driver, all) : null;
  const stat = driver ? summarizePatterns(all)[driver.type] : null;
  const scaffold = driver ? scaffoldFor(driver.type) : null;

  return {
    trade,
    netR: tradeR(trade),
    report: reportLine(trade),
    patterns: onTrade,
    driver,
    prior,
    stat,
    scaffold,
  };
}

/** Which trades are worth a 5R session: losses, bad execution, or any detected
 *  pattern. Returned newest-first, each tagged with its top pattern (if any). */
export interface TherapyTrade {
  trade: TradeJournalEntry;
  netR: number;
  topPattern: DetectedPattern | null;
}

export function tradesNeedingReflection(
  trades: TradeJournalEntry[],
  analyses: PreTradeAnalysis[]
): TherapyTrade[] {
  const events = detectPatterns(trades, analyses);
  const byTrade = new Map<string, DetectedPattern[]>();
  for (const e of events) {
    const list = byTrade.get(e.tradeId) ?? [];
    list.push(e);
    byTrade.set(e.tradeId, list);
  }
  return trades
    .filter((t) => t.result === "loss" || t.execution_quality === "bad" || byTrade.has(t.id))
    .sort((a, b) => b.date_time.localeCompare(a.date_time))
    .map((t) => {
      const list = (byTrade.get(t.id) ?? []).sort((a, b) => b.confidence - a.confidence);
      return { trade: t, netR: tradeR(t), topPattern: list[0] ?? null };
    });
}

// ── Pre-Trade Mirror ────────────────────────────────────────────────────
export interface MirrorSignals {
  /** Weekday label, e.g. "Monday". */
  weekday: string;
  /** "HH:mm" local time the Mirror was built. */
  time: string;
  /** Consecutive losses ending at the most recent trade. */
  lossStreak: number;
  /** Current MC Mindscore (0–100), or null when not computable. */
  mindscore: number | null;
  /** Trades in the last 3 that broke one of the trader's own rules. */
  openViolations: number;
}

export interface MirrorMatch {
  pattern: PatternType;
  label: string;
  /** 0–1 deterministic match strength; the card only shows above the floor. */
  score: number;
  /** The most costly past occurrence of this pattern — the "on [date]" evidence. */
  occurrence: DetectedPattern;
  /** Cumulative R this pattern has cost across all history. */
  cumulativeR: number;
  occurrenceCount: number;
  /** The trader's own if-then plan for this pattern, if one exists. */
  commitment: Commitment | null;
  /** Why the Mirror fired today — explainable, one clause per signal. */
  reasons: string[];
}

const chronological = (trades: TradeJournalEntry[]) =>
  [...trades].sort((a, b) => {
    const da = a.date_time.slice(0, 10);
    const db = b.date_time.slice(0, 10);
    if (da !== db) return da < db ? -1 : 1;
    const ta = a.execution_time ?? "99:99";
    const tb = b.execution_time ?? "99:99";
    if (ta !== tb) return ta < tb ? -1 : 1;
    return a.created_at.localeCompare(b.created_at);
  });

/**
 * Compare today's context to past pattern situations. Returns the signals always,
 * and a single top match when one crosses the threshold — otherwise match is null
 * (no match ⇒ no message, never invented).
 */
export function buildPreTradeMirror(input: {
  now?: Date;
  trades: TradeJournalEntry[];
  analyses: PreTradeAnalysis[];
  commitments: Commitment[];
  mindscore: number | null;
}): { signals: MirrorSignals; match: MirrorMatch | null } {
  const now = input.now ?? new Date();
  const ordered = chronological(input.trades);

  // ── Context signals ──
  let lossStreak = 0;
  for (let i = ordered.length - 1; i >= 0; i--) {
    if (tradeR(ordered[i]) < 0) lossStreak++;
    else break;
  }
  const last3 = ordered.slice(-3);
  const openViolations = last3.filter((t) => (t.discipline?.custom_checks ?? []).some((c) => !c.passed)).length;
  const todayKey = format(now, "yyyy-MM-dd");
  const hasPlanToday = input.analyses.some((a) => a.date.slice(0, 10) === todayKey);

  const signals: MirrorSignals = {
    weekday: format(now, "EEEE"),
    time: format(now, "HH:mm"),
    lossStreak,
    mindscore: input.mindscore,
    openViolations,
  };

  // ── Score each pattern against today's context ──
  const events = detectPatterns(input.trades, input.analyses);
  const stats = summarizePatterns(events);
  const norm = dailyTradeNorm(input.trades);

  const scored: { pattern: PatternType; score: number; reasons: string[] }[] = [];
  const lowMind = input.mindscore != null && input.mindscore < 50 ? (50 - input.mindscore) / 100 : 0;
  const mindReason = input.mindscore != null && input.mindscore < 50 ? `your Mindscore is at ${input.mindscore}` : null;

  // Revenge
  {
    const reasons: string[] = [];
    let score = 0;
    if (lossStreak >= 1) { score += Math.min(0.6, lossStreak * 0.3); reasons.push(`you're on a run of ${lossStreak} loss${lossStreak === 1 ? "" : "es"}`); }
    if (openViolations >= 1) { score += 0.2; reasons.push(`you broke a rule on ${openViolations} of your last 3 trades`); }
    if (lowMind) { score += lowMind * 0.5; if (mindReason) reasons.push(mindReason); }
    scored.push({ pattern: "revenge", score, reasons });
  }
  // Size escalation
  {
    const reasons: string[] = [];
    let score = 0;
    if (lossStreak >= 2) { score += Math.min(0.6, (lossStreak - 1) * 0.3); reasons.push(`${lossStreak} losses have stacked up in a row`); }
    if (lowMind) { score += lowMind * 0.4; if (mindReason && !reasons.includes(mindReason)) reasons.push(mindReason); }
    scored.push({ pattern: "size-escalation", score, reasons });
  }
  // Overtrading — recent days that ran over the personal norm
  {
    const reasons: string[] = [];
    let score = 0;
    if (norm.ready) {
      const recentDays = [...norm.countByDay.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1)).slice(0, 3);
      const overDays = recentDays.filter(([, c]) => c > norm.threshold).length;
      if (overDays >= 1) { score += 0.3 + Math.min(0.2, (overDays - 1) * 0.2); reasons.push(`you went over your normal trade count on ${overDays} of the last few days`); }
    }
    if (lowMind) { score += lowMind * 0.3; if (mindReason && !reasons.includes(mindReason)) reasons.push(mindReason); }
    scored.push({ pattern: "overtrading", score, reasons });
  }
  // Plan deviation
  {
    const reasons: string[] = [];
    let score = 0;
    if (stats["plan-deviation"].count >= 1) {
      if (hasPlanToday) { score += 0.35; reasons.push("you've prepared an analysis for today — the risk is trading around it"); }
      else { score += 0.2; reasons.push("there's no pre-trade analysis linked for today yet"); }
    }
    if (lowMind) { score += lowMind * 0.3; if (mindReason && !reasons.includes(mindReason)) reasons.push(mindReason); }
    scored.push({ pattern: "plan-deviation", score, reasons });
  }

  // ── Pick the strongest pattern that has actually happened before ──
  const candidates = scored
    .filter((s) => s.score >= PATTERN_THRESHOLDS.mirrorConfidenceFloor && stats[s.pattern].count >= 1)
    .sort((a, b) => b.score - a.score);

  const top = candidates[0];
  if (!top) return { signals, match: null };

  // The most costly past occurrence of this pattern is the evidence.
  const occurrences = events.filter((e) => e.type === top.pattern);
  const occurrence = [...occurrences].sort((a, b) => a.rImpact - b.rImpact || (a.date < b.date ? 1 : -1))[0];
  const commitment =
    input.commitments.find((c) => c.active && c.pattern_type === top.pattern) ??
    input.commitments.find((c) => c.pattern_type === top.pattern) ??
    null;

  return {
    signals,
    match: {
      pattern: top.pattern,
      label: PATTERN_LABELS[top.pattern],
      score: Math.min(1, top.score),
      occurrence,
      cumulativeR: stats[top.pattern].cumulativeR,
      occurrenceCount: stats[top.pattern].count,
      commitment,
      reasons: top.reasons,
    },
  };
}

// ── Mindscore signals ───────────────────────────────────────────────────
/**
 * Reflection consistency — of the trades worth reflecting on (losses, bad
 * execution, or a detected pattern) in the window, the share that got a completed
 * Post-Trade 5R session. The Pre-Trade Mirror is opportunistic (no match ⇒ no
 * session), so it can't be a fair denominator; this measures the post-trade half,
 * which is the one the trader can always complete.
 */
export function computeReflectionConsistency(
  trades: TradeJournalEntry[],
  analyses: PreTradeAnalysis[],
  sessions: PsychEdgeSession[],
  start: Date,
  end: Date
): { rate: number | null; completed: number; total: number } {
  const inRange = (iso: string) => {
    const d = iso.slice(0, 10);
    const s = format(start, "yyyy-MM-dd");
    const e = format(end, "yyyy-MM-dd");
    return d >= s && d <= e;
  };
  const worth = tradesNeedingReflection(trades, analyses).filter((t) => inRange(t.trade.date_time));
  if (worth.length === 0) return { rate: null, completed: 0, total: 0 };

  const doneByTrade = new Set(
    sessions.filter((s) => s.reconstruction_confirmed && s.trade_id).map((s) => s.trade_id as string)
  );
  const completed = worth.filter((t) => doneByTrade.has(t.trade.id)).length;
  return { rate: completed / worth.length, completed, total: worth.length };
}

/**
 * Commitment adherence — the behaviour-change signal. Every time a commitment's
 * trigger re-matched (a logged opportunity), did the pattern it guards against
 * stay away afterwards? Resolved deterministically: if the same pattern fired
 * again after the opportunity, the commitment wasn't held; if a later trade
 * exists and it didn't fire, it was. Unresolved opportunities (no later trade)
 * are excluded rather than counted either way.
 */
export function computeCommitmentAdherence(
  logs: CommitmentAdherenceLog[],
  commitments: Commitment[],
  trades: TradeJournalEntry[],
  analyses: PreTradeAnalysis[]
): { rate: number | null; followed: number; opportunities: number } {
  const events = detectPatterns(trades, analyses);
  const byId = new Map(commitments.map((c) => [c.id, c]));
  const tradeDays = trades.map((t) => t.date_time.slice(0, 10));

  let followed = 0;
  let opportunities = 0;
  for (const log of logs) {
    if (!log.matched) continue;
    const commitment = byId.get(log.commitment_id);
    if (!commitment?.pattern_type) continue;

    let held: boolean;
    if (log.followed != null) {
      held = log.followed; // trader/engine already resolved it
    } else {
      const hasLater = tradeDays.some((d) => d > log.date);
      if (!hasLater) continue; // can't resolve yet
      const recurred = events.some((e) => e.type === commitment.pattern_type && e.date > log.date);
      held = !recurred;
    }
    opportunities++;
    if (held) followed++;
  }
  return { rate: opportunities === 0 ? null : followed / opportunities, followed, opportunities };
}

export { fmtR as mirrorFormatR, fmtDay as mirrorFormatDay };
