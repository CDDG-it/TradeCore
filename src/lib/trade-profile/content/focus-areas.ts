/**
 * Wording for the development focus areas. The rules that trigger them live in
 * config/focusRules.ts under the same ids. All areas are prototype hypotheses.
 */
import type { FocusAreaId } from "@/lib/trade-profile/focus-rules";

export interface FocusAreaText {
  /** The area as a trader type: a tendency a profile can show, never a label for a person. */
  traderType: string;
  title: string;
  /** One sentence on what this area is about. */
  summary: string;
  /** The facet pattern, described in words. */
  pattern: string;
  /** The trading problem it targets. */
  tradingProblem: string;
  /** Why the suggested goal fits, in one sentence. */
  goalRationale: string;
}

export const focusAreas: Record<FocusAreaId, FocusAreaText> = {
  calm: {
    traderType: "Pressure-reactive trader",
    title: "Calm under pressure",
    summary: "Building steadier reactions when the market moves against you.",
    pattern: "High Anxiety, Anger and/or Vulnerability (Neuroticism facets).",
    tradingProblem: "Freezing, panic exits, and revenge trades after losses.",
    goalRationale: "Lowering Neuroticism means working on how intensely stress and frustration land, and how long they last.",
  },
  impulse: {
    traderType: "Impulse-driven trader",
    title: "Impulse control",
    summary: "Putting a pause between the urge to trade and the click.",
    pattern: "High Immoderation (Neuroticism) together with low Cautiousness (Conscientiousness).",
    tradingProblem: "Unplanned entries, oversizing and chasing.",
    goalRationale: "Raising Cautiousness means practising a short, deliberate check before acting.",
  },
  followThrough: {
    traderType: "Plan-drifting trader",
    title: "Follow-through",
    summary: "Turning the plan you wrote into the trades you take and the reviews you do.",
    pattern: "Low Self-Discipline, Dutifulness and/or Orderliness (Conscientiousness facets).",
    tradingProblem: "Skipping the plan, an inconsistent routine, and trades that never get reviewed.",
    goalRationale: "Raising Conscientiousness means building small, repeatable routines you keep.",
  },
  thrill: {
    traderType: "Action-seeking trader",
    title: "Thrill management",
    summary: "Getting your need for excitement met somewhere other than your P&L.",
    pattern: "High Excitement-Seeking (Extraversion).",
    tradingProblem: "Overtrading, and trading out of boredom.",
    goalRationale:
      "The goal is not to become a different person. It is to channel Excitement-Seeking outside the session, so that trading can stay boring on purpose.",
  },
  curiosity: {
    traderType: "Strategy explorer",
    title: "Focused curiosity",
    summary: "Keeping your curiosity while giving one approach a fair test.",
    pattern: "High Openness (especially Adventurousness) together with low Self-Discipline.",
    tradingProblem: "Strategy hopping, and never building a sample size.",
    goalRationale: "Raising Self-Discipline means directing your Openness toward one approach at a time.",
  },
  selfTrust: {
    traderType: "Second-guessing trader",
    title: "Self-trust",
    summary: "Acting on your own analysis without waiting for certainty.",
    pattern: "High Self-Consciousness (Neuroticism) together with low Self-Efficacy (Conscientiousness).",
    tradingProblem: "Hesitation, missed valid setups, and moving stops out of fear.",
    goalRationale: "Raising Self-Efficacy means collecting evidence, one step at a time, that you can execute your plan.",
  },
  maintain: {
    traderType: "Steady all-rounder",
    title: "Maintain and refine",
    summary: "None of the focus patterns stood out, so this is about protecting a solid baseline.",
    pattern: "No focus-area rule was triggered.",
    tradingProblem: "Keeping a good baseline stable through drawdowns and busy periods.",
    goalRationale: "Choose any trait you would like to develop. The program adapts to your choice.",
  },
};
