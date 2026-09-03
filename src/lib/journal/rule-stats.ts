/**
 * Per-rule breakdown — which of the trader's own rules get broken, and what
 * each breach actually costs.
 *
 * Every trade stores its discipline checklist in `discipline.custom_checks`,
 * seeded from `profiles.discipline_rules` (the rules written in My Edge). The
 * per-trade data was always there; nothing aggregated it, so the trader could
 * not see that, say, sizing up costs them a full R every time.
 *
 * Built deliberately on custom_checks alone. TradeDiscipline also carries nine
 * fixed booleans (followed_plan, no_revenge_trade, …) but no surface in the app
 * ever toggles them — they are defaulted to false and left there, so counting
 * them would report every standard rule as broken on every trade.
 */
import { tradeR } from "@/lib/journal/weeks";
import type { TradeJournalEntry } from "@/lib/types";

/** Below this many assessments a rule is not a pattern, it is a coincidence. */
export const RULE_MIN_SAMPLE = 5;

export interface RuleStat {
  /** The rule as the trader wrote it. */
  label: string;
  /** Trades where this rule was on the checklist. */
  evaluated: number;
  kept: number;
  broken: number;
  /** 0–100 — how often it gets broken when it applies. */
  breakRate: number;
  /** Average R on trades where the rule was kept (null if never kept). */
  rKept: number | null;
  /** Average R on trades where it was broken (null if never broken). */
  rBroken: number | null;
  /**
   * R given up per breach — the gap between keeping and breaking it. Null when
   * one side has no trades, since there is nothing to compare against.
   */
  cost: number | null;
  /** True when the sample is too small to draw a conclusion from. */
  thin: boolean;
}

export function computeRuleStats(
  trades: TradeJournalEntry[],
  minSample: number = RULE_MIN_SAMPLE
): RuleStat[] {
  const acc = new Map<
    string,
    { label: string; keptR: number[]; brokenR: number[] }
  >();

  for (const t of trades) {
    const checks = t.discipline?.custom_checks;
    if (!checks?.length) continue;

    const r = tradeR(t);
    const seen = new Set<string>();
    for (const c of checks) {
      const label = (c?.label ?? "").trim();
      if (!label) continue;
      // Group case-insensitively; one trade counts once per rule even if the
      // same rule was somehow listed twice.
      const key = label.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);

      const row = acc.get(key) ?? { label, keptR: [], brokenR: [] };
      (c.passed ? row.keptR : row.brokenR).push(r);
      acc.set(key, row);
    }
  }

  const round2 = (n: number) => Math.round(n * 100) / 100;
  const mean = (xs: number[]) =>
    xs.length ? round2(xs.reduce((s, x) => s + x, 0) / xs.length) : null;

  return [...acc.values()]
    .map((d) => {
      const kept = d.keptR.length;
      const broken = d.brokenR.length;
      const evaluated = kept + broken;
      const rKept = mean(d.keptR);
      const rBroken = mean(d.brokenR);
      return {
        label: d.label,
        evaluated,
        kept,
        broken,
        breakRate: evaluated > 0 ? Math.round((broken / evaluated) * 100) : 0,
        rKept,
        rBroken,
        // Only meaningful with trades on both sides of the rule.
        cost: rKept !== null && rBroken !== null ? round2(rKept - rBroken) : null,
        thin: evaluated < minSample,
      };
    })
    .sort((a, b) => {
      // Reliable samples first, then the most expensive breach, then the most
      // frequent — so the top of the list is what to fix on Monday.
      if (a.thin !== b.thin) return Number(a.thin) - Number(b.thin);
      if (a.cost !== null && b.cost !== null && a.cost !== b.cost) return b.cost - a.cost;
      if (a.cost !== null && b.cost === null) return -1;
      if (a.cost === null && b.cost !== null) return 1;
      return b.breakRate - a.breakRate;
    });
}
