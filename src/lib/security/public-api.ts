/**
 * Shared answers for the API routes that need no login.
 *
 * Two jobs. First, caching: these routes serve the same market data to every
 * reader, so a shared cache in front of them turns thousands of polls into one
 * upstream call. `s-maxage` is what the CDN holds;
 * `stale-while-revalidate` lets it keep answering from the last good copy while
 * it refreshes behind the reader, so a cold instance never becomes a cold page.
 * `max-age=0` keeps the browser itself honest so a reload really does ask.
 *
 * Second, error text: an upstream failure message can carry the URL that
 * failed, and those URLs have provider keys in their query strings. Nothing
 * from a provider is repeated to the caller; it goes to the server log instead.
 */

/** A good answer, held by the shared cache for `seconds`. */
export function publicCache(seconds: number, staleFor = seconds * 10): string {
  return `public, max-age=0, s-maxage=${seconds}, stale-while-revalidate=${staleFor}`;
}

/** A failure, or anything user-specific: never held anywhere. */
export const NO_STORE = "no-store, max-age=0";

/**
 * What the caller is told when an upstream call fails. The real error is
 * logged, under a label, and never returned.
 */
export function upstreamFailure(label: string, err: unknown): string {
  console.error(`[${label}] upstream failed:`, err instanceof Error ? err.message : err);
  return "upstream unavailable";
}
