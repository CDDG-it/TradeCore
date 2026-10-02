/**
 * Per-rule breakdown: which of the trader's own rules get broken, and what
 * each breach actually costs.
 *
 * Two sources, newest first:
 *
 *  - `trade_rule_checks`: what the trade form writes today. One row per trade
 *    per standing rule (My Edge) and per pre-market commitment, each marked
 *    kept / broken / not_applicable.
 *  - `discipline.custom_checks`: the older checklist stored on the trade itself.
 *    New trades leave it empty, but older ones only have this, so it is read
 *    for any trade that has no rule checks of its own.
 *
 * A trade is never counted from both, so switching systems cannot double it.
 * `not_applicable` is not an assessment and is ignored.
 *
 * TradeDiscipline also carries nine fixed booleans (followed_plan, ...) but no
 * surface in the app ever toggles them: counting them would report every
 * standard rule as broken on every trade.
 */
import { round2, scoreBucket, type EdgeBucket } from "@/lib/journal/edge";
import { tradeR } from "@/lib/journal/weeks";
import type { TradeJournalEntry, TradeRuleCheck } from "@/lib/types";

/** Below this many assessments a rule is not a pattern, it is a coincidence. */
export const RULE_MIN_SAMPLE = 5;

/** Commitments are a new sentence every morning; they are scored as one habit. */
export const COMMITMENT_LABEL = "Daily pre-market commitment";

export type RuleCheckRow = Pick<TradeRuleCheck, "trade_id" | "source_type" | "source_text_snapshot" | "status">;

type RuleTrade = Pick<TradeJournalEntry, "id" | "result" | "rr" | "discipline">;

export interface RuleStat {
  /** The rule as the trader wrote it. */
  label: string;
  /** Trades where this rule was assessed (kept or broken). */
  evaluated: number;
  kept: number;
  broken: number;
  /** 0-100: how often it gets broken when it applies. */
  breakRate: number;
  /** Average R on trades where the rule was kept (null if never kept). */
  rKept: number | null;
  /** Average R on trades where it was broken (null if never broken). */
  rBroken: number | null;
  /**
   * R given up per breach: the gap between keeping and breaking it. Null when
   * one side has no trades, since there is nothing to compare against.
   */
  cost: number | null;
  /** Cost per breach x times broken: what this rule has cost in total. */
  totalCost: number | null;
  /** True when the sample is too small to draw a conclusion from. */
  thin: boolean;
}

/** Every kept/broken assessment per trade, from whichever source the trade has. */
function assessmentsByTrade(
  trades: RuleTrade[],
  ruleChecks: RuleCheckRow[]
): Map<RuleTrade, { key: string; label: string; passed: boolean }[]> {
  const fromChecks = new Map<string, { key: string; label: string; passed: boolean }[]>();
  for (const c of ruleChecks) {
    if (c.status === "not_applicable") continue;
    const label = c.source_type === "commitment" ? COMMITMENT_LABEL : (c.source_text_snapshot ?? "").trim();
    if (!label) continue;
    const list = fromChecks.get(c.trade_id) ?? [];
    list.push({ key: label.toLowerCase(), label, passed: c.status === "kept" });
    fromChecks.set(c.trade_id, list);
  }

  const out = new Map<RuleTrade, { key: string; label: string; passed: boolean }[]>();
  for (const t of trades) {
    const raw =
      fromChecks.get(t.id) ??
      (t.discipline?.custom_checks ?? [])
        .map((c) => ({ label: (c?.label ?? "").trim(), passed: !!c?.passed }))
        .filter((c) => c.label)
        .map((c) => ({ ...c, key: c.label.toLowerCase() }));

    // One verdict per rule per trade. If the same rule appears twice (several
    // commitments in a day), a single breach makes the trade a breach.
    const merged = new Map<string, { key: string; label: string; passed: boolean }>();
    for (const a of raw) {
      const prev = merged.get(a.key);
      merged.set(a.key, prev ? { ...prev, passed: prev.passed && a.passed } : a);
    }
    if (merged.size) out.set(t, [...merged.values()]);
  }
  return out;
}

export function computeRuleStats(
  trades: RuleTrade[],
  ruleChecks: RuleCheckRow[] = [],
  minSample: number = RULE_MIN_SAMPLE
): RuleStat[] {
  const acc = new Map<string, { label: string; keptR: number[]; brokenR: number[] }>();

  for (const [t, assessments] of assessmentsByTrade(trades, ruleChecks)) {
    const r = tradeR(t);
    for (const a of assessments) {
      const row = acc.get(a.key) ?? { label: a.label, keptR: [], brokenR: [] };
      (a.passed ? row.keptR : row.brokenR).push(r);
      acc.set(a.key, row);
    }
  }

  const mean = (xs: number[]) =>
    xs.length ? round2(xs.reduce((s, x) => s + x, 0) / xs.length) : null;

  return [...acc.values()]
    .map((d) => {
      const kept = d.keptR.length;
      const broken = d.brokenR.length;
      const evaluated = kept + broken;
      const rKept = mean(d.keptR);
      const rBroken = mean(d.brokenR);
      // Only meaningful with trades on both sides of the rule.
      const cost = rKept !== null && rBroken !== null ? round2(rKept - rBroken) : null;
      return {
        label: d.label,
        evaluated,
        kept,
        broken,
        breakRate: evaluated > 0 ? Math.round((broken / evaluated) * 100) : 0,
        rKept,
        rBroken,
        cost,
        totalCost: cost === null ? null : round2(cost * broken),
        thin: evaluated < minSample,
      };
    })
    .sort((a, b) => {
      // Reliable samples first, then what the rule has cost in total, then how
      // often it breaks, so the top of the list is what to fix on Monday.
      if (a.thin !== b.thin) return Number(a.thin) - Number(b.thin);
      if (a.totalCost !== null && b.totalCost !== null && a.totalCost !== b.totalCost) return b.totalCost - a.totalCost;
      if (a.totalCost !== null && b.totalCost === null) return -1;
      if (a.totalCost === null && b.totalCost !== null) return 1;
      return b.breakRate - a.breakRate;
    });
}

export interface CleanVsBroken {
  /** Trades where every assessed rule was kept. */
  clean: EdgeBucket;
  /** Trades where at least one rule was broken. */
  broken: EdgeBucket;
  /** Trades with no rule assessed at all; left out of both sides. */
  unassessed: number;
  /** clean - broken R per trade, null unless both sides are evidence. */
  gap: number | null;
  /** gap x broken trades: an estimate of what the breaches cost overall. */
  rGivenUp: number | null;
}

/** The whole rulebook as one number: what a clean trade earns over a messy one. */
export function computeCleanVsBroken(
  trades: RuleTrade[],
  ruleChecks: RuleCheckRow[] = [],
  minSample: number = RULE_MIN_SAMPLE
): CleanVsBroken {
  const assessed = assessmentsByTrade(trades, ruleChecks);
  const clean: RuleTrade[] = [];
  const broken: RuleTrade[] = [];
  for (const [t, list] of assessed) (list.every((a) => a.passed) ? clean : broken).push(t);

  const c = scoreBucket("clean", "All rules kept", clean, minSample);
  const b = scoreBucket("broken", "A rule broken", broken, minSample);
  const gap = !c.thin && !b.thin ? round2(c.expectancy - b.expectancy) : null;
  return {
    clean: c,
    broken: b,
    unassessed: trades.length - assessed.size,
    gap,
    rGivenUp: gap === null ? null : round2(gap * b.trades),
  };
}
