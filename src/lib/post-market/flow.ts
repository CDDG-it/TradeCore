import type { BestTradeOfDay } from "@/lib/types";

export type PostMarketStep = NonNullable<BestTradeOfDay["review_step"]>;

export function postMarketSteps(bestTradeEnabled: boolean, takenWasBest: boolean, winnerCount: number): PostMarketStep[] {
  return bestTradeEnabled
    ? ["verdict", "why", "market", ...(!takenWasBest ? ["screenshots" as const] : []), ...(winnerCount ? ["r" as const] : []), "complete"]
    : ["market", ...(winnerCount ? ["r" as const] : []), "complete"];
}

export function initialPostMarketStep(
  entry: Pick<BestTradeOfDay, "review_step" | "taken_was_best" | "notes" | "screenshot_groups"> | null,
  bestTradeEnabled: boolean,
): PostMarketStep {
  if (!bestTradeEnabled) return entry?.review_step === "complete" ? "complete" : "market";
  const saved = entry?.review_step;
  if (saved && ["verdict", "why", "market", "screenshots", "r", "complete"].includes(saved)) return saved;
  // Legacy rows have no step. A recap-only row with the old default false
  // cannot be treated as an explicit No verdict.
  if (entry?.taken_was_best || entry?.notes.trim() || entry?.screenshot_groups?.some((group) => group.urls.length)) return "why";
  return "verdict";
}
