import { thresholds as defaultThresholds } from "@/lib/trade-profile/config";
import { focusRules as defaultRules, type Condition, type FocusAreaId, type FocusRule, type RuleNode } from "@/lib/trade-profile/focus-rules";
import { rankFocusAreas } from "@/lib/trade-profile/focus";
import { traitScore } from "@/lib/trade-profile/scoring";
import type { Profile, TraitCode } from "@/lib/trade-profile/types";

/**
 * Trader types: the focus areas read the other way round. Each area is a
 * facet pattern (its rule); here every pattern is laid out with the trader's
 * own scores against it, so the profile page can show which types the profile
 * matches, which it nearly matches, and which personality signals make up each.
 *
 * Like the rules themselves these are prototype hypotheses, not validated
 * types: tendencies a profile can show, never a verdict about a trader.
 */

type Thresholds = Pick<typeof defaultThresholds, "high" | "low">;

/** One condition of a pattern, with where this trader stands on it. */
export interface TypeSignal {
  trait: TraitCode;
  op: Condition["op"];
  threshold: number;
  score: number;
  met: boolean;
  /** 0..1: how far toward the threshold the score has come (1 once met). */
  progress: number;
}

export interface TraderTypeReading {
  id: FocusAreaId;
  /** The pattern as AND-ed groups of OR-ed signals, in rule order. */
  groups: TypeSignal[][];
  /** The rule holds for this profile. */
  matched: boolean;
  /** Position among matched types (0 = primary), or null when not matched. */
  rank: number | null;
  /** 0..1: how close the profile is to the pattern (1 when matched). */
  closeness: number;
}

const resolve = (value: Condition["value"], t: Thresholds) => (value === "high" ? t.high : value === "low" ? t.low : value);

/**
 * The pattern as groups: every child of an `all` is its own group, and an `any`
 * is one group of alternatives (its leaves, however deeply nested).
 */
export function patternGroups(node: RuleNode): Condition[][] {
  if ("all" in node) return node.all.flatMap(patternGroups);
  if ("any" in node) return [leaves(node)];
  return [[node]];
}

function leaves(node: RuleNode): Condition[] {
  if ("all" in node) return node.all.flatMap(leaves);
  if ("any" in node) return node.any.flatMap(leaves);
  return [node];
}

function signal(c: Condition, profile: Profile, t: Thresholds): TypeSignal | null {
  const score = traitScore(profile, c.trait);
  if (score === undefined) return null;
  const threshold = resolve(c.value, t);
  const met = c.op === ">=" ? score >= threshold : score <= threshold;
  // Progress toward the line from the far end of the scale.
  const progress = met ? 1 : c.op === ">=" ? Math.max(0, score / threshold) : Math.max(0, (100 - score) / (100 - threshold));
  return { trait: c.trait, op: c.op, threshold, score, met, progress: Math.min(1, progress) };
}

/** Every trader type, with this profile laid against its pattern. Matched types first, by rank. */
export function readTraderTypes(profile: Profile, rules: FocusRule[] = defaultRules, t: Thresholds = defaultThresholds): TraderTypeReading[] {
  const ranked = rankFocusAreas(profile, rules, t).map((r) => r.id);
  const readings = rules.map((rule): TraderTypeReading => {
    const rank = ranked.indexOf(rule.id);
    const groups = rule.rule
      ? patternGroups(rule.rule).map((group) => group.map((c) => signal(c, profile, t)).filter((s): s is TypeSignal => s !== null))
      : [];
    // A group is as close as its best alternative; the pattern as close as its weakest group.
    const closeness = rank >= 0 ? 1 : groups.length ? Math.min(...groups.map((g) => Math.max(0, ...g.map((s) => s.progress)))) : 0;
    return { id: rule.id, groups, matched: rank >= 0, rank: rank >= 0 ? rank : null, closeness };
  });
  return readings.sort((a, b) =>
    a.rank !== null && b.rank !== null ? a.rank - b.rank : a.rank !== null ? -1 : b.rank !== null ? 1 : b.closeness - a.closeness,
  );
}
