import type { GoalTarget, TraitCode } from "@/lib/trade-profile/types";

/**
 * Focus-area rules — PROTOTYPE HYPOTHESES, not validated cut-offs.
 *
 * A condition compares one trait's POMP score with a threshold. `value` can be
 * 'high' / 'low' (the defaults in config.ts) or an explicit number.
 * Group conditions with `all` (every one must hold) or `any` (at least one).
 *
 * Ranking: when several areas trigger, the one whose triggering traits sit
 * furthest past their thresholds (summed) is primary.
 *
 * The wording for each area lives in content/focus-areas.ts under the same id.
 */
export interface Condition {
  trait: TraitCode;
  op: ">=" | "<=";
  value: "high" | "low" | number;
}
export type RuleNode = Condition | { all: RuleNode[] } | { any: RuleNode[] };

export interface FocusRule {
  id: FocusAreaId;
  /** Absent for the fallback area, which applies when nothing else triggers. */
  rule?: RuleNode;
  /** The goal recommended to a trader whose primary area this is. Null: trader picks. */
  suggestedGoal: GoalTarget | null;
}

export type FocusAreaId = "calm" | "impulse" | "followThrough" | "thrill" | "curiosity" | "selfTrust" | "maintain";

export const FALLBACK_AREA: FocusAreaId = "maintain";

export const focusRules: FocusRule[] = [
  {
    id: "calm",
    rule: {
      any: [
        { trait: "N1", op: ">=", value: "high" }, // Anxiety
        { trait: "N2", op: ">=", value: "high" }, // Anger
        { trait: "N6", op: ">=", value: "high" }, // Vulnerability
      ],
    },
    suggestedGoal: { trait: "N", direction: "decrease" },
  },
  {
    id: "impulse",
    rule: {
      all: [
        { trait: "N5", op: ">=", value: "high" }, // Immoderation
        { trait: "C6", op: "<=", value: "low" }, // Cautiousness
      ],
    },
    suggestedGoal: { trait: "C6", direction: "increase" },
  },
  {
    id: "followThrough",
    rule: {
      any: [
        { trait: "C5", op: "<=", value: "low" }, // Self-Discipline
        { trait: "C3", op: "<=", value: "low" }, // Dutifulness
        { trait: "C2", op: "<=", value: "low" }, // Orderliness
      ],
    },
    suggestedGoal: { trait: "C", direction: "increase" },
  },
  {
    id: "thrill",
    rule: { any: [{ trait: "E5", op: ">=", value: "high" }] }, // Excitement-Seeking
    suggestedGoal: { trait: "E5", direction: "channel" },
  },
  {
    id: "curiosity",
    rule: {
      all: [
        {
          any: [
            { trait: "O", op: ">=", value: "high" }, // Openness
            { trait: "O4", op: ">=", value: "high" }, // Adventurousness
          ],
        },
        { trait: "C5", op: "<=", value: "low" }, // Self-Discipline
      ],
    },
    suggestedGoal: { trait: "C5", direction: "increase" },
  },
  {
    id: "selfTrust",
    rule: {
      all: [
        { trait: "N4", op: ">=", value: "high" }, // Self-Consciousness
        { trait: "C1", op: "<=", value: "low" }, // Self-Efficacy
      ],
    },
    suggestedGoal: { trait: "C1", direction: "increase" },
  },
  { id: "maintain", suggestedGoal: null },
];
