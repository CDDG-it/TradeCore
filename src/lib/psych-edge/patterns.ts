/**
 * MC Trade Therapist — the pattern engine.
 *
 * Rule-based, deterministic, and fully explainable: no LLM, no scoring model,
 * no generic advice. Every pattern fires on a FIXED threshold, and every finding
 * carries the concrete numbers that produced it, all traceable back to the
 * trader's own journal. This is the single engine behind both the Post-Trade 5R
 * session (Relating / Reasoning) and the Pre-Trade Mirror.
 *
 * Four behavioural patterns are detected:
 *
 *   1. Revenge trade    — a trade taken shortly after a loss, with impulsive /
 *                         aggressive markers. (Size isn't recorded in the
 *                         journal, so we proxy "oversize after a loss" with a
 *                         short re-entry window + a broken rule + an above-average
 *                         R target.)
 *   2. Size escalation  — 2+ consecutive losses whose R targets step up. (Again a
 *                         proxy for growing size — rr is the only aggression
 *                         number the journal records.)
 *   3. Overtrading      — a day whose trade count exceeds the trader's personal
 *                         mean + 1.5·SD of daily counts.
 *   4. Plan deviation   — a trade that ignores the day's pre-trade analysis:
 *                         either no analysis linked when one existed for the day,
 *                         or a direction that contradicts the linked bias.
 *
 * The proxies are a deliberate call (see the codebase notes): the journal has no
 * position-size or € field, so revenge/escalation lean on timing, rule breaks and
 * the R target rather than raw contract size. If a size column is added later, the
 * thresholds here are the seams to tighten.
 */
import { differenceInMinutes, format, parse } from "date-fns";
import { tradeR, instrumentName } from "@/lib/journal/weeks";
import type { PatternType, PreTradeAnalysis, TradeJournalEntry } from "@/lib/types";

// ── Fixed thresholds — the whole engine's tunable surface, in one place ──
export const PATTERN_THRESHOLDS = {
  /** Revenge: a re-entry within this many minutes of the prior trade counts as "quick". */
  revengeWindowMin: 30,
  /** Revenge: inside this tighter window, confidence is boosted (clearly impulsive). */
  revengeFastWindowMin: 15,
  /** Size escalation: minimum consecutive losses required (spec: "2+"). */
  escalationMinStreak: 2,
  /** Overtrading: standard-deviations above the personal mean that trip the flag. */
  overtradingSdMultiplier: 1.5,
  /** Overtrading: don't compute a threshold until we have this many trading days. */
  overtradingMinDays: 5,
  /** Only surface a comparable past event at or above this confidence in the Mirror. */
  mirrorConfidenceFloor: 0.5,
} as const;

export const PATTERN_LABELS: Record<PatternType, string> = {
  revenge: "Revenge trade",
  "size-escalation": "Size escalation",
  overtrading: "Overtrading",
  "plan-deviation": "Plan deviation",
};

/** Plain-language, non-judgemental description of each pattern (for tooltips/UI). */
export const PATTERN_DESCRIPTIONS: Record<PatternType, string> = {
  revenge: "A trade taken quickly after a loss, with impulsive markers.",
  "size-escalation": "Consecutive losses where the R target keeps stepping up.",
  overtrading: "More trades in a day than your personal norm.",
  "plan-deviation": "A trade that steps away from that day's pre-trade analysis.",
};

// ── A single detected occurrence ────────────────────────────────────────
export interface DetectedPattern {
  type: PatternType;
  tradeId: string;
  /** ISO day of the focus trade. */
  date: string;
  /** 0–1, deterministic from how far the situation overshot the threshold. */
  confidence: number;
  /** R contribution of the focus trade — uniform across patterns so cumulative
   *  P&L is comparable. Pattern-specific numbers live in `detail`. */
  rImpact: number;
  /** Deterministic explanation, with the numbers behind it. */
  detail: string;
}

// ── Chronological ordering ──────────────────────────────────────────────
// date_time is date-only; execution_time ("HH:MM") orders within a day. Trades
// missing an entry time sort to the end of their day, then by created_at.
interface Ordered {
  trade: TradeJournalEntry;
  day: string;
  /** Minutes-since-midnight of the entry, or null when no entry time is logged. */
  entryMin: number | null;
  /** Minutes-since-midnight of the exit, or null. */
  exitMin: number | null;
  r: number;
}

function minutesOfDay(hhmm?: string): number | null {
  if (!hhmm) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

function order(trades: TradeJournalEntry[]): Ordered[] {
  return trades
    .map((trade) => ({
      trade,
      day: trade.date_time.slice(0, 10),
      entryMin: minutesOfDay(trade.execution_time),
      exitMin: minutesOfDay(trade.execution_end_time),
      r: tradeR(trade),
    }))
    .sort((a, b) => {
      if (a.day !== b.day) return a.day < b.day ? -1 : 1;
      const ae = a.entryMin ?? 24 * 60 + 1;
      const be = b.entryMin ?? 24 * 60 + 1;
      if (ae !== be) return ae - be;
      return a.trade.created_at.localeCompare(b.trade.created_at);
    });
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const round2 = (n: number) => Math.round(n * 100) / 100;
const fmtR = (v: number) => `${v > 0 ? "+" : ""}${v.toFixed(1)}R`;
const fmtDay = (iso: string) => format(parse(iso, "yyyy-MM-dd", new Date()), "MMM d");

/** Whether any custom discipline rule was marked not-followed on a trade. */
function brokeARule(t: TradeJournalEntry): boolean {
  return (t.discipline?.custom_checks ?? []).some((c) => !c.passed);
}

/** Trader's average R target (rr) across all trades — the baseline the revenge
 *  "aggressive size" proxy compares against. */
function avgRrTarget(trades: TradeJournalEntry[]): number {
  const rrs = trades.map((t) => t.rr).filter((n) => Number.isFinite(n) && n > 0);
  if (rrs.length === 0) return 0;
  return rrs.reduce((s, n) => s + n, 0) / rrs.length;
}

// ── 1. Revenge trade ────────────────────────────────────────────────────
// Fires when the immediately preceding trade (same day) was a loss and this
// trade re-entered quickly. Confidence layers the impulsive/aggressive markers
// the journal can actually see: how fast the re-entry was, whether a rule broke,
// and whether the R target ran above the trader's own average.
function revengeFor(idx: number, ord: Ordered[], avgRr: number): DetectedPattern | null {
  const cur = ord[idx];
  const prev = ord[idx - 1];
  if (!prev) return null;
  if (prev.day !== cur.day) return null; // only within a session
  if (prev.r >= 0) return null; // the prior trade must have been a loss

  // Gap from the prior trade's exit (or entry) to this entry, when times exist.
  const prevRef = prev.exitMin ?? prev.entryMin;
  const gap = prevRef != null && cur.entryMin != null ? cur.entryMin - prevRef : null;
  const timingKnown = gap != null && gap >= 0;
  if (timingKnown && gap! > PATTERN_THRESHOLDS.revengeWindowMin) return null;

  const brokeRule = brokeARule(cur.trade);
  const aboveAvgRr = avgRr > 0 && cur.trade.rr > avgRr;

  // Without a timestamp we can't confirm speed — only fire on a corroborating
  // marker (broken rule or oversized target) and cap the confidence.
  if (!timingKnown && !brokeRule && !aboveAvgRr) return null;

  let confidence = 0.5;
  if (timingKnown && gap! <= PATTERN_THRESHOLDS.revengeFastWindowMin) confidence += 0.2;
  if (brokeRule) confidence += 0.15;
  if (aboveAvgRr) confidence += 0.15;
  if (!timingKnown) confidence = Math.min(confidence, 0.6);

  const gapText = timingKnown
    ? `${gap} min after a ${fmtR(prev.r)} loss on ${instrumentName(prev.trade.instrument)}`
    : `right after a ${fmtR(prev.r)} loss on ${instrumentName(prev.trade.instrument)}`;
  const markers = [
    brokeRule ? "a rule you'd set was broken" : null,
    aboveAvgRr ? `the R target (${cur.trade.rr.toFixed(1)}) ran above your ${avgRr.toFixed(1)} average` : null,
  ].filter(Boolean);
  const detail =
    `You re-entered ${gapText}` +
    (markers.length ? `, and ${markers.join(" and ")}.` : ".");

  return { type: "revenge", tradeId: cur.trade.id, date: cur.day, confidence: clamp01(confidence), rImpact: round2(cur.r), detail };
}

// ── 2. Size escalation ──────────────────────────────────────────────────
// The consecutive-loss streak ending at this trade, where the R targets step up.
function escalationFor(idx: number, ord: Ordered[]): DetectedPattern | null {
  const cur = ord[idx];
  if (cur.r >= 0) return null; // streak must end on a loss

  // Walk back over consecutive losses.
  const streak: Ordered[] = [];
  for (let i = idx; i >= 0; i--) {
    if (ord[i].r < 0) streak.unshift(ord[i]);
    else break;
  }
  if (streak.length < PATTERN_THRESHOLDS.escalationMinStreak) return null;

  const rrs = streak.map((s) => s.trade.rr);
  const first = rrs[0];
  const last = rrs[rrs.length - 1];
  // Non-decreasing across the streak, with a real increase end-to-end.
  const nonDecreasing = rrs.every((v, i) => i === 0 || v >= rrs[i - 1]);
  if (!nonDecreasing || !(last > first)) return null;

  let confidence = 0.5;
  confidence += Math.min(0.3, (streak.length - 2) * 0.1); // longer streaks read stronger
  if (first > 0 && last >= first * 2) confidence += 0.15; // target doubled or more

  const detail =
    `${streak.length} losses in a row, and the R target climbed from ${first.toFixed(1)} to ${last.toFixed(1)} across them ` +
    `(${fmtR(streak.reduce((s, x) => s + x.r, 0))} over the streak).`;

  return { type: "size-escalation", tradeId: cur.trade.id, date: cur.day, confidence: clamp01(confidence), rImpact: round2(cur.r), detail };
}

// ── 3. Overtrading ──────────────────────────────────────────────────────
// A day whose trade count exceeds the personal mean + 1.5·SD of daily counts.
interface DailyNorm {
  mean: number;
  sd: number;
  threshold: number;
  countByDay: Map<string, number>;
  ready: boolean;
}

export function dailyTradeNorm(trades: TradeJournalEntry[]): DailyNorm {
  const countByDay = new Map<string, number>();
  for (const t of trades) {
    const day = t.date_time.slice(0, 10);
    countByDay.set(day, (countByDay.get(day) ?? 0) + 1);
  }
  const counts = [...countByDay.values()];
  const n = counts.length;
  if (n < PATTERN_THRESHOLDS.overtradingMinDays) {
    return { mean: 0, sd: 0, threshold: Infinity, countByDay, ready: false };
  }
  const mean = counts.reduce((s, c) => s + c, 0) / n;
  const variance = counts.reduce((s, c) => s + (c - mean) ** 2, 0) / n;
  const sd = Math.sqrt(variance);
  const threshold = mean + PATTERN_THRESHOLDS.overtradingSdMultiplier * sd;
  return { mean, sd, threshold, countByDay, ready: true };
}

function overtradingFor(cur: Ordered, norm: DailyNorm): DetectedPattern | null {
  if (!norm.ready) return null;
  const count = norm.countByDay.get(cur.day) ?? 0;
  if (!(count > norm.threshold)) return null;

  // Confidence scales with how far past the threshold the day ran.
  const over = count - norm.threshold;
  const confidence = clamp01(0.6 + (norm.sd > 0 ? Math.min(0.4, (over / norm.sd) * 0.4) : 0.2));
  const detail =
    `${count} trades that day — your norm is ${norm.mean.toFixed(1)} ± ${norm.sd.toFixed(1)}, ` +
    `so anything over ${norm.threshold.toFixed(1)} is unusual for you.`;

  return { type: "overtrading", tradeId: cur.trade.id, date: cur.day, confidence, rImpact: round2(cur.r), detail };
}

// ── 4. Plan deviation ───────────────────────────────────────────────────
// Either: a day had a pre-trade analysis but this trade didn't link one, or the
// trade's direction contradicts the linked analysis's bias.
function planDeviationFor(
  cur: Ordered,
  analysisById: Map<string, PreTradeAnalysis>,
  analysisDays: Set<string>
): DetectedPattern | null {
  const t = cur.trade;
  const linked = t.linked_analysis_id ? analysisById.get(t.linked_analysis_id) : undefined;

  if (linked && (linked.bias === "bullish" || linked.bias === "bearish")) {
    const expected = linked.bias === "bullish" ? "long" : "short";
    if (t.direction !== expected) {
      return {
        type: "plan-deviation",
        tradeId: t.id,
        date: cur.day,
        confidence: 0.9,
        rImpact: round2(cur.r),
        detail: `Your analysis called ${linked.bias} but you took this ${instrumentName(t.instrument)} trade ${t.direction} — a direct reversal of your own plan.`,
      };
    }
    return null; // linked and consistent → no deviation
  }

  // No usable link. If a plan existed for the day, trading without it is a deviation.
  if (!linked && analysisDays.has(cur.day)) {
    return {
      type: "plan-deviation",
      tradeId: t.id,
      date: cur.day,
      confidence: 0.6,
      rImpact: round2(cur.r),
      detail: `You prepared an analysis that day but took this ${instrumentName(t.instrument)} trade without linking it — the plan wasn't in the loop.`,
    };
  }
  return null;
}

// ── Full-history detection ──────────────────────────────────────────────
/**
 * Every pattern occurrence across the trade history, in chronological order.
 * Deterministic and recomputable — nothing here depends on stored state.
 */
export function detectPatterns(
  trades: TradeJournalEntry[],
  analyses: PreTradeAnalysis[]
): DetectedPattern[] {
  if (trades.length === 0) return [];
  const ord = order(trades);
  const avgRr = avgRrTarget(trades);
  const norm = dailyTradeNorm(trades);
  const analysisById = new Map(analyses.map((a) => [a.id, a]));
  const analysisDays = new Set(analyses.map((a) => a.date.slice(0, 10)));

  const out: DetectedPattern[] = [];
  for (let i = 0; i < ord.length; i++) {
    const cur = ord[i];
    const revenge = revengeFor(i, ord, avgRr);
    if (revenge) out.push(revenge);
    const escalation = escalationFor(i, ord);
    if (escalation) out.push(escalation);
    const overtrading = overtradingFor(cur, norm);
    if (overtrading) out.push(overtrading);
    const deviation = planDeviationFor(cur, analysisById, analysisDays);
    if (deviation) out.push(deviation);
  }
  return out;
}

/** All patterns that fired on one specific trade. */
export function patternsForTrade(
  tradeId: string,
  trades: TradeJournalEntry[],
  analyses: PreTradeAnalysis[]
): DetectedPattern[] {
  return detectPatterns(trades, analyses).filter((p) => p.tradeId === tradeId);
}

// ── Cumulative stats per pattern ────────────────────────────────────────
export interface PatternStat {
  type: PatternType;
  label: string;
  /** Number of times this pattern has fired. */
  count: number;
  /** Sum of the R impact across every occurrence — the cumulative cost/gain. */
  cumulativeR: number;
  /** Mean confidence across occurrences (0–1). */
  avgConfidence: number;
  /** Most recent occurrence, if any. */
  lastDate: string | null;
}

export function summarizePatterns(events: DetectedPattern[]): Record<PatternType, PatternStat> {
  const types: PatternType[] = ["revenge", "size-escalation", "overtrading", "plan-deviation"];
  const out = {} as Record<PatternType, PatternStat>;
  for (const type of types) {
    const hits = events.filter((e) => e.type === type);
    const cumulativeR = round2(hits.reduce((s, e) => s + e.rImpact, 0));
    const avgConfidence = hits.length ? round2(hits.reduce((s, e) => s + e.confidence, 0) / hits.length) : 0;
    const lastDate = hits.length ? hits[hits.length - 1].date : null;
    out[type] = { type, label: PATTERN_LABELS[type], count: hits.length, cumulativeR, avgConfidence, lastDate };
  }
  return out;
}

/**
 * A comparable earlier occurrence of the same pattern — the "Relating" evidence.
 * Given a focus trade and one of its detected patterns, returns the most recent
 * PRIOR occurrence of that pattern type (before the focus trade), if any, above
 * the Mirror confidence floor. This is the concrete "on [date] the same thing
 * happened" the trader is asked to confirm or refute.
 */
export function priorOccurrence(
  focus: DetectedPattern,
  allEvents: DetectedPattern[]
): DetectedPattern | null {
  // allEvents is chronological, so the last match on an earlier day is the nearest.
  const before = allEvents.filter(
    (e) =>
      e.type === focus.type &&
      e.tradeId !== focus.tradeId &&
      e.date < focus.date &&
      e.confidence >= PATTERN_THRESHOLDS.mirrorConfidenceFloor
  );
  return before.length ? before[before.length - 1] : null;
}

export { fmtR as formatR, fmtDay as formatPatternDay };
