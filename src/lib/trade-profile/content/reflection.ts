/** Weekly reflection questions and the daily one-item state rating. */
import type { Direction, TraitCode } from "@/lib/trade-profile/types";
import { traitName } from "@/lib/trade-profile/content/traits";

export const weeklyQuestions = [
  "Which challenge this week moved you closest to your goal, and why?",
  "When was your goal tested hardest at the screen, and what did you do?",
  "What one thing will you do differently next week?",
];

export interface StateItem {
  question: string;
  /** Labels for 1 and 7. */
  low: string;
  high: string;
}

/**
 * Daily state rating per goal ("trait:direction"). Ratings run 1-7, and higher
 * always means "more in line with the goal", so progress lines read the same way
 * for every goal.
 */
const stateItems: Record<string, StateItem> = {
  "N:decrease": { question: "How calm and steady did I stay today?", low: "Very tense", high: "Very steady" },
  "N1:decrease": { question: "How free of worry did I feel today?", low: "Very worried", high: "Untroubled" },
  "N2:decrease": { question: "How well did I keep frustration in check today?", low: "Lost my temper", high: "Fully composed" },
  "N4:decrease": { question: "How comfortable was I being wrong or being seen today?", low: "Very exposed", high: "At ease" },
  "N5:decrease": { question: "How well did I resist urges today?", low: "Gave in to every urge", high: "Fully in control" },
  "N6:decrease": { question: "How composed was I under pressure today?", low: "Overwhelmed", high: "Composed" },
  "C:increase": { question: "How disciplined and organised was I today?", low: "Not at all", high: "Completely" },
  "C1:increase": { question: "How much did I trust my own analysis today?", low: "Not at all", high: "Fully" },
  "C2:increase": { question: "How orderly were my setup and routine today?", low: "Chaotic", high: "Very orderly" },
  "C3:increase": { question: "How well did I keep the rules I set myself today?", low: "Broke them all", high: "Kept them all" },
  "C5:increase": {
    question: "How well did I stick to the plan today, even when it was dull?",
    low: "Not at all",
    high: "Completely",
  },
  "C6:increase": { question: "How carefully did I think before acting today?", low: "Acted on impulse", high: "Very deliberate" },
  "E5:channel": {
    question: "How well did I keep thrill-seeking out of my trading today?",
    low: "Traded for the rush",
    high: "Trading stayed boring",
  },
};

const directionWord: Record<Direction, string> = {
  increase: "more",
  decrease: "less",
  channel: "in a channelled way",
};

export function stateItemFor(trait: TraitCode, direction: Direction): StateItem {
  return (
    stateItems[`${trait}:${direction}`] ?? {
      question: `How much did I act ${directionWord[direction]} in line with “${traitName(trait)}” today?`,
      low: "Not at all",
      high: "Completely",
    }
  );
}
