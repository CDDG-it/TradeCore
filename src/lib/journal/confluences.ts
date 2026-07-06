/**
 * Preset confluence suggestions + explanations.
 *
 * The trader's real, reusable confluence library is saved in
 * `profiles.confluence_options` and managed on the Trading Behaviour page —
 * only those saved confluences appear as quick-select chips when logging a
 * trade. This preset list is offered purely as one-click suggestions to seed
 * that library; it is not itself the source shown in the Journal.
 *
 * `CONFLUENCE_INFO` backs the hover tooltip shown on every confluence chip —
 * what the concept means and how to use it when logging a trade.
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

export const CONFLUENCE_INFO: Record<string, string> = {
  "demand zone": "A price area where past buying pressure was strong enough to reverse or stall a decline. Use it to time longs when price returns to the zone.",
  "supply zone": "A price area where past selling pressure was strong enough to reverse or stall an advance. Use it to time shorts when price returns to the zone.",
  "liquidity sweep": "Price briefly pierces a prior high/low to trigger stops and resting orders before reversing. Look for a quick wick through the level followed by a fast rejection back inside range.",
  "structure break (bos)": "Price closes beyond the most recent swing high/low, confirming the trend is continuing. Use it to confirm direction before entering with the break.",
  "change of character": "The first break of structure against the prevailing trend — an early signal the trend may be turning. Treat it as a warning to tighten risk or look for reversal setups.",
  "fair value gap": "An imbalance left by a fast, one-sided move where price skipped over an area with little two-way trading. Price often returns to 'fill' this gap before continuing.",
  "order block": "The last opposing candle before a strong, structure-breaking move — thought to mark where large orders entered. Watch for a reaction when price revisits it.",
  "htf trend alignment": "Your trade direction matches the higher-timeframe trend. Trading with this alignment generally has better follow-through than trading against it.",
  "session momentum": "A clear directional push tied to a specific session's open (e.g. London or New York). Use it to favor trades in the direction the session is already moving.",
  "support / resistance": "A horizontal level where price has reacted more than once. Use it as a reference for entries, stops, or targets.",
  "fibonacci retracement": "A pullback measured against a prior swing using Fibonacci ratios (e.g. 61.8%, 50%). Use common retracement levels as potential entry zones within a trend.",
  "round number": "A psychologically significant price level (e.g. 20000, 1.1000) where orders tend to cluster. Expect added reaction or hesitation around these levels.",
  "news catalyst": "A scheduled release or headline (CPI, NFP, Fed, earnings) driving the move. Note it so you can separate news-driven volatility from your normal edge.",
  "volume spike": "A sudden, above-average surge in traded volume. Use it to confirm real participation behind a move rather than a low-volume fakeout.",
};

/** Lookup with a graceful fallback for custom, trader-added confluences. */
export function confluenceInfo(label: string): string {
  return (
    CONFLUENCE_INFO[label.trim().toLowerCase()] ??
    "A custom confluence you added yourself. Use it to tag trades where this specific factor lined up, so you can review its edge later in Analytics."
  );
}
