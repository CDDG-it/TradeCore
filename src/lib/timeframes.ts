/**
 * Shared trade-timeframe options + input normalisation.
 *
 * Scalpers work down to seconds, so the presets include second-based
 * timeframes, and the "Custom" field accepts anything a trader might type
 * ("15s", "15 sec", "15 seconds", "2h", "90m", …) and canonicalises it.
 */

export const TIMEFRAMES = ["5s", "15s", "30s", "1m", "5m", "15m", "1H", "4H", "Daily"];

/**
 * Canonicalise a free-typed timeframe. Seconds/minutes/hours/days/weeks are
 * normalised (e.g. "15 seconds" → "15s", "2 hours" → "2H"); anything that
 * doesn't parse is kept exactly as typed so nothing the trader enters is lost.
 */
export function normalizeTimeframe(input: string): string {
  const raw = input.trim();
  if (!raw) return "";
  const low = raw.toLowerCase();
  if (low === "daily" || low === "1d") return "Daily";
  if (low === "weekly" || low === "1w") return "Weekly";

  const m = low.match(
    /^(\d+(?:\.\d+)?)\s*(s|sec|secs|second|seconds|m|min|mins|minute|minutes|h|hr|hrs|hour|hours|d|day|days|w|wk|week|weeks)$/
  );
  if (!m) return raw; // e.g. a bare number or an unusual label — keep it verbatim

  const n = m[1];
  const unit = m[2];
  if (unit.startsWith("s")) return `${n}s`;
  if (unit.startsWith("min") || unit === "m") return `${n}m`;
  if (unit.startsWith("h")) return `${n}H`;
  if (unit.startsWith("d")) return `${n}D`;
  if (unit.startsWith("w")) return `${n}W`;
  return raw;
}
