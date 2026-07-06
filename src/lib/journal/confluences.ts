/**
 * Preset confluence suggestions.
 *
 * The trader's real, reusable confluence library is saved in
 * `profiles.confluence_options` and managed on the Trading Behaviour page —
 * only those saved confluences appear as quick-select chips when logging a
 * trade. This preset list is offered purely as one-click suggestions to seed
 * that library; it is not itself the source shown in the Journal.
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
