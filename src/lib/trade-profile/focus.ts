import { thresholds as defaultThresholds } from "@/lib/trade-profile/config";
import { FALLBACK_AREA, focusRules as defaultRules } from "@/lib/trade-profile/focus-rules";
import type { Condition, FocusAreaId, FocusRule, RuleNode } from "@/lib/trade-profile/focus-rules";
import { traitScore } from "@/lib/trade-profile/scoring";
import type { Profile, TraitCode } from "@/lib/trade-profile/types";

export interface Hit {
  trait: TraitCode;
  score: number;
  op: Condition["op"];
  threshold: number;
  /** How far past the threshold, in POMP points (always ≥ 0). */
  distance: number;
}

export interface FocusResult {
  id: FocusAreaId;
  hits: Hit[];
  /** Sum of hit distances; used to rank areas. */
  strength: number;
}

type Thresholds = Pick<typeof defaultThresholds, "high" | "low">;

function resolve(value: Condition["value"], t: Thresholds): number {
  return value === "high" ? t.high : value === "low" ? t.low : value;
}

/** Evaluate a rule tree. Returns the conditions that made it true, or null if it is false. */
export function evaluate(node: RuleNode, profile: Profile, t: Thresholds): Hit[] | null {
  if ("all" in node) {
    const hits: Hit[] = [];
    for (const child of node.all) {
      const h = evaluate(child, profile, t);
      if (!h) return null;
      hits.push(...h);
    }
    return hits;
  }
  if ("any" in node) {
    const hits = node.any.flatMap((child) => evaluate(child, profile, t) ?? []);
    return hits.length ? hits : null;
  }
  const score = traitScore(profile, node.trait);
  if (score === undefined) return null;
  const threshold = resolve(node.value, t);
  const met = node.op === ">=" ? score >= threshold : score <= threshold;
  if (!met) return null;
  return [{ trait: node.trait, score, op: node.op, threshold, distance: Math.abs(score - threshold) }];
}

/** Every triggered area, strongest first. Falls back to the "maintain" area when none trigger. */
export function rankFocusAreas(
  profile: Profile,
  rules: FocusRule[] = defaultRules,
  t: Thresholds = defaultThresholds,
): FocusResult[] {
  const triggered: FocusResult[] = [];
  for (const r of rules) {
    if (!r.rule) continue;
    const hits = evaluate(r.rule, profile, t);
    if (hits) triggered.push({ id: r.id, hits, strength: hits.reduce((s, h) => s + h.distance, 0) });
  }
  // Stable sort keeps rule order for ties, so the data file also sets priority.
  triggered.sort((a, b) => b.strength - a.strength);
  return triggered.length ? triggered : [{ id: FALLBACK_AREA, hits: [], strength: 0 }];
}

/** At most one primary and one secondary area. */
export function placeInFocus(profile: Profile, rules?: FocusRule[], t?: Thresholds) {
  const ranked = rankFocusAreas(profile, rules, t);
  return { primary: ranked[0], secondary: ranked[1] as FocusResult | undefined };
}

export function suggestedGoalFor(id: FocusAreaId, rules: FocusRule[] = defaultRules) {
  return rules.find((r) => r.id === id)?.suggestedGoal ?? null;
}

/** True when the calm support note should be shown. */
export function needsSupportNote(profile: Profile, t = defaultThresholds): boolean {
  return t.supportNoteFacets.some((f) => (profile.facets[f] ?? 0) >= t.supportNote);
}
