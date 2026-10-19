import { addDays, fromKey, type DateKey } from "@/lib/trade-profile/dates";
import type { FocusAreaId } from "@/lib/trade-profile/focus-rules";
import type { FacetCode, Profile } from "@/lib/trade-profile/types";

/**
 * The psychology dashboard's model: the fears and problems a trading profile
 * can be prone to, how strongly the profile points at each, and what the
 * journal shows around them. Pure functions, so they can be tested and run on
 * demo data.
 *
 * Like the focus areas these are prototype hypotheses: a facet pattern makes
 * a fear more likely, it does not mean the trader has it.
 */

export type FearId = "lossFear" | "revenge" | "fomo" | "hesitation" | "drift";

export interface FearSpec {
  id: FearId;
  /** Facets that make the fear more likely; `low` facets count from the bottom of the scale. */
  facets: { facet: FacetCode; dir: "high" | "low" }[];
  /** The journal pattern that shows it. */
  pattern: PatternId;
  /** The trader types this fear belongs to most. */
  types: FocusAreaId[];
}

export const FEARS: FearSpec[] = [
  { id: "lossFear", facets: [{ facet: "N1", dir: "high" }, { facet: "N6", dir: "high" }], pattern: "badAfterLoss", types: ["calm", "selfTrust"] },
  { id: "revenge", facets: [{ facet: "N2", dir: "high" }, { facet: "N5", dir: "high" }], pattern: "quickReentry", types: ["calm", "impulse"] },
  { id: "fomo", facets: [{ facet: "E5", dir: "high" }, { facet: "N5", dir: "high" }, { facet: "C6", dir: "low" }], pattern: "overtrading", types: ["impulse", "thrill", "curiosity"] },
  { id: "hesitation", facets: [{ facet: "N4", dir: "high" }, { facet: "C1", dir: "low" }], pattern: "missedBetter", types: ["selfTrust"] },
  { id: "drift", facets: [{ facet: "C5", dir: "low" }, { facet: "C3", dir: "low" }, { facet: "C2", dir: "low" }], pattern: "rulesAfterLoss", types: ["followThrough", "curiosity"] },
];

/** 0..100: how strongly the profile points at a fear (the mean of its facets, low ones turned around). */
export function fearIntensity(profile: Profile, fear: FearSpec): number {
  const values = fear.facets.map(({ facet, dir }) => {
    const score = profile.facets[facet] ?? 50;
    return dir === "high" ? score : 100 - score;
  });
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

export type FearLevel = "low" | "moderate" | "elevated";
export const fearLevel = (intensity: number): FearLevel => (intensity >= 60 ? "elevated" : intensity >= 40 ? "moderate" : "low");

/** The fears, strongest first, with this trader's type's own fears flagged. */
export function readFears(profile: Profile, type: FocusAreaId) {
  return FEARS.map((fear) => ({ fear, intensity: fearIntensity(profile, fear), ofType: fear.types.includes(type) }))
    .sort((a, b) => Number(b.ofType) - Number(a.ofType) || b.intensity - a.intensity);
}

// ── The journal side ────────────────────────────────────────────────────

/** The parts of a trade the patterns read. */
export interface PatternTrade {
  id: string;
  /** ISO date (time ignored). */
  date_time: string;
  result: "win" | "loss" | "break-even";
  /** "HH:MM" entry time, when logged. */
  execution_time?: string;
  /** "HH:MM" exit time, when logged. */
  execution_end_time?: string;
  execution_quality?: "good" | "bad";
}
export interface PatternRuleCheck { trade_id: string; status: "kept" | "broken" | "not_applicable" }
export interface PatternRecap { date: string; taken_was_best: boolean; review_step?: string | null }

export type PatternId = "quickReentry" | "rulesAfterLoss" | "overtrading" | "missedBetter" | "badAfterLoss";

export interface PatternReading {
  id: PatternId;
  /** The headline figure, 0..1, or null when there is too little data. */
  value: number | null;
  /** A comparison figure for the same measure, when there is one (e.g. after a win). */
  baseline: number | null;
  /** How many cases the figure rests on. */
  n: number;
  /** Extra numbers for the sentence. */
  detail: Record<string, number>;
}

/** Fewer cases than this and a pattern says "not enough data" instead of a figure. */
export const MIN_CASES = 4;
/** A new trade this soon after a losing trade counts as a quick re-entry. */
export const REENTRY_MINUTES = 30;

const minutes = (hhmm?: string) => {
  if (!hhmm || !/^\d{1,2}:\d{2}/.test(hhmm)) return null;
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const day = (t: PatternTrade) => t.date_time.slice(0, 10);
const ratio = (a: number, b: number) => (b > 0 ? a / b : null);

/** Trades in time order: by day, then entry time, then id for stability. */
function ordered(trades: PatternTrade[]) {
  return [...trades].sort((a, b) => day(a).localeCompare(day(b)) || (minutes(a.execution_time) ?? 0) - (minutes(b.execution_time) ?? 0) || a.id.localeCompare(b.id));
}

/**
 * What the journal shows over the last `windowDays` up to `today`:
 * - quickReentry: losing trades followed by another trade the same day within
 *   REENTRY_MINUTES of the loss's exit (or entry, when no exit was logged).
 * - rulesAfterLoss: share of rule checks kept on trades that follow a loss,
 *   against trades that follow a win.
 * - overtrading: share of trading days with clearly more trades than usual
 *   (at least three and at least one and a half times the median day).
 * - missedBetter: share of reviewed days where a better trade was available.
 * - badAfterLoss: share of trades rated bad execution right after a loss,
 *   against all rated trades.
 */
export function readPatterns(
  input: { trades: PatternTrade[]; ruleChecks: PatternRuleCheck[]; recaps: PatternRecap[] },
  today: DateKey,
  windowDays = 90,
): Record<PatternId, PatternReading> {
  const from = addDays(today, -windowDays);
  const trades = ordered(input.trades.filter((t) => day(t) >= from && day(t) <= today));
  const checksByTrade = new Map<string, PatternRuleCheck[]>();
  for (const c of input.ruleChecks) checksByTrade.set(c.trade_id, [...(checksByTrade.get(c.trade_id) ?? []), c]);

  // Each trade with the one before it, when that was earlier the same day or on an earlier day.
  const pairs = trades.slice(1).map((t, i) => ({ prev: trades[i], t }));

  // Quick re-entry after a loss.
  const losses = trades.filter((t) => t.result === "loss");
  let quick = 0;
  for (const { prev, t } of pairs) {
    if (prev.result !== "loss" || day(prev) !== day(t)) continue;
    const end = minutes(prev.execution_end_time) ?? minutes(prev.execution_time);
    const start = minutes(t.execution_time);
    if (end !== null && start !== null && start - end <= REENTRY_MINUTES && start >= end) quick++;
  }

  // Rules kept after a loss vs after a win.
  const keptRate = (filter: (prev: PatternTrade) => boolean) => {
    let kept = 0;
    let assessed = 0;
    for (const { prev, t } of pairs) {
      if (!filter(prev)) continue;
      for (const c of checksByTrade.get(t.id) ?? []) {
        if (c.status === "not_applicable") continue;
        assessed++;
        if (c.status === "kept") kept++;
      }
    }
    return { kept, assessed };
  };
  const afterLoss = keptRate((p) => p.result === "loss");
  const afterWin = keptRate((p) => p.result === "win");

  // Overtrading days.
  const perDay = new Map<string, number>();
  for (const t of trades) perDay.set(day(t), (perDay.get(day(t)) ?? 0) + 1);
  const counts = [...perDay.values()].sort((a, b) => a - b);
  const median = counts.length ? counts[Math.floor((counts.length - 1) / 2)] : 0;
  const heavy = counts.filter((c) => c >= Math.max(3, Math.ceil(median * 1.5))).length;

  // Better trade available, on reviewed days.
  const recaps = input.recaps.filter((r) => r.date.slice(0, 10) >= from && r.date.slice(0, 10) <= today && r.review_step !== null);
  const missed = recaps.filter((r) => !r.taken_was_best).length;

  // Bad execution right after a loss vs overall.
  const rated = trades.filter((t) => t.execution_quality);
  const ratedAfterLoss = pairs.filter(({ prev, t }) => prev.result === "loss" && t.execution_quality).map(({ t }) => t);
  const badShare = (list: PatternTrade[]) => ratio(list.filter((t) => t.execution_quality === "bad").length, list.length);

  const enough = (n: number, value: number | null) => (n >= MIN_CASES ? value : null);
  return {
    quickReentry: { id: "quickReentry", value: enough(losses.length, ratio(quick, losses.length)), baseline: null, n: losses.length, detail: { quick, losses: losses.length } },
    rulesAfterLoss: {
      id: "rulesAfterLoss",
      value: enough(afterLoss.assessed, ratio(afterLoss.kept, afterLoss.assessed)),
      baseline: afterWin.assessed >= MIN_CASES ? ratio(afterWin.kept, afterWin.assessed) : null,
      n: afterLoss.assessed,
      detail: { kept: afterLoss.kept, assessed: afterLoss.assessed },
    },
    overtrading: { id: "overtrading", value: enough(counts.length, ratio(heavy, counts.length)), baseline: null, n: counts.length, detail: { heavy, days: counts.length, median } },
    missedBetter: { id: "missedBetter", value: enough(recaps.length, ratio(missed, recaps.length)), baseline: null, n: recaps.length, detail: { missed, reviewed: recaps.length } },
    badAfterLoss: {
      id: "badAfterLoss",
      value: enough(ratedAfterLoss.length, badShare(ratedAfterLoss)),
      baseline: rated.length >= MIN_CASES ? badShare(rated) : null,
      n: ratedAfterLoss.length,
      detail: { afterLoss: ratedAfterLoss.length },
    },
  };
}

// ── Demo journals ───────────────────────────────────────────────────────

/** How each demo trader's journal leans, so the dashboard has something true to its type to show. */
const DEMO_LEAN: Record<string, { lossRate: number; quickAfterLoss: number; keptAfterLoss: number; heavyDays: number; missed: number; badAfterLoss: number }> = {
  anxiousScalper: { lossRate: 0.5, quickAfterLoss: 0.55, keptAfterLoss: 0.45, heavyDays: 0.2, missed: 0.3, badAfterLoss: 0.6 },
  impulsiveOvertrader: { lossRate: 0.52, quickAfterLoss: 0.7, keptAfterLoss: 0.35, heavyDays: 0.45, missed: 0.2, badAfterLoss: 0.55 },
  disciplinedHesitant: { lossRate: 0.38, quickAfterLoss: 0.05, keptAfterLoss: 0.9, heavyDays: 0, missed: 0.6, badAfterLoss: 0.2 },
  balanced: { lossRate: 0.42, quickAfterLoss: 0.1, keptAfterLoss: 0.85, heavyDays: 0.05, missed: 0.2, badAfterLoss: 0.15 },
};

/** A small deterministic generator, so a demo journal is the same on every render. */
function seeded(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Six weeks of weekday trading for a demo trader, shaped by their type. Never written anywhere. */
export function demoJournal(personaId: string, today: DateKey) {
  const lean = DEMO_LEAN[personaId] ?? DEMO_LEAN.balanced;
  const rand = seeded([...personaId].reduce((a, c) => a + c.charCodeAt(0), 0));
  const trades: PatternTrade[] = [];
  const ruleChecks: PatternRuleCheck[] = [];
  const recaps: PatternRecap[] = [];
  const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  for (let i = 42; i >= 1; i--) {
    const date = addDays(today, -i);
    const weekday = fromKey(date).getDay();
    if (weekday === 0 || weekday === 6) continue;
    const count = rand() < lean.heavyDays ? 4 + Math.floor(rand() * 3) : 1 + Math.floor(rand() * 2);
    let clock = 9 * 60 + 35 + Math.floor(rand() * 20);
    let prevLoss = false;
    for (let k = 0; k < count; k++) {
      const loss = rand() < lean.lossRate;
      const id = `demo-${date}-${k}`;
      const hold = 8 + Math.floor(rand() * 25);
      trades.push({
        id,
        date_time: date,
        result: loss ? "loss" : rand() < 0.1 ? "break-even" : "win",
        execution_time: hhmm(clock),
        execution_end_time: hhmm(clock + hold),
        execution_quality: prevLoss ? (rand() < lean.badAfterLoss ? "bad" : "good") : rand() < 0.2 ? "bad" : "good",
      });
      ruleChecks.push({ trade_id: id, status: prevLoss ? (rand() < lean.keptAfterLoss ? "kept" : "broken") : rand() < 0.85 ? "kept" : "broken" });
      // After a loss, the next entry comes quickly or after a proper pause.
      clock += hold + (loss && rand() < lean.quickAfterLoss ? 3 + Math.floor(rand() * 20) : 45 + Math.floor(rand() * 60));
      prevLoss = loss;
    }
    recaps.push({ date, taken_was_best: rand() >= lean.missed, review_step: "complete" });
  }
  return { trades, ruleChecks, recaps };
}
