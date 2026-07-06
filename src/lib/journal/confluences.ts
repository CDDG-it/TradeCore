import type { TradeJournalEntry } from "@/lib/types";

/**
 * Fixed, selectable confluences shown as quick-select chips in the journal.
 * Confluences used to be managed on the Profile page; they now live entirely
 * inside the Journal — this preset list is the baseline and the trader can
 * still type their own directly on a trade. Previously-used confluences are
 * merged in via `collectConfluenceOptions` so the library grows organically
 * without a profile field or a database migration.
 */
export const DEFAULT_CONFLUENCES = [
  "Demand zone",
  "Supply zone",
  "Liquidity sweep",
  "Structure break (BOS)",
  "Change of character",
  "Fair value gap",
  "Order block",
  "HTF trend alignment",
  "Session momentum",
  "Support / Resistance",
  "Fibonacci retracement",
  "Round number",
  "News catalyst",
  "Volume spike",
] as const;

/**
 * The quick-select confluence options for the journal: the preset list first,
 * then any additional confluences the trader has already used on past trades
 * (deduped, case-insensitively, preserving first-seen order).
 */
export function collectConfluenceOptions(trades: TradeJournalEntry[]): string[] {
  const seen = new Set(DEFAULT_CONFLUENCES.map((c) => c.toLowerCase()));
  const options: string[] = [...DEFAULT_CONFLUENCES];
  for (const trade of trades) {
    for (const c of trade.confluences ?? []) {
      const key = c.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      options.push(c.trim());
    }
  }
  return options;
}
