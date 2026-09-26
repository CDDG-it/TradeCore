/**
 * A per-caller ceiling for the API routes that sit in front of a third-party
 * provider and need no login.
 *
 * Why it exists: `/api/gmi/news` spends a Marketaux request from a free tier of
 * a hundred a day, `/api/gmi/macro` and the yield routes spend FRED quota, and
 * `/api/prices` makes three Yahoo calls per miss. Those routes are reachable by
 * anyone who knows the URL, so without a ceiling a single script can burn the
 * day's quota for every real trader on the site.
 *
 * What it is not: the counter lives in one server instance's memory, so a
 * request served by a second warm instance starts from its own count, and a
 * cold start forgets everything. That makes this a brake on casual abuse and on
 * a runaway client, not a defence against a determined distributed attacker.
 * Anything stronger needs shared state; this costs nothing and needs no
 * service. The TTL caches behind these routes are what keep the quota safe in
 * the normal case, and this is the guard on the abnormal one.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** A caller cannot be allowed to grow the map without end. */
const MAX_KEYS = 5_000;

function sweep(now: number): void {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
  // Still too many distinct callers in one window: drop the oldest entries,
  // which a Map gives us in insertion order.
  while (buckets.size > MAX_KEYS) {
    const oldest = buckets.keys().next().value;
    if (oldest === undefined) break;
    buckets.delete(oldest);
  }
}

/**
 * The caller's address as the platform reports it. `x-forwarded-for` is a list
 * appended to by each proxy, and only the entry Vercel itself adds can be
 * trusted, so we take the first and accept that callers behind one NAT share a
 * bucket. A request with no address at all is bucketed together under
 * "unknown" rather than waved through.
 */
export function callerKey(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

export interface RateLimitResult {
  ok: boolean;
  /** Requests left in the current window. */
  remaining: number;
  /** Seconds until the window resets, for Retry-After. */
  retryAfter: number;
}

/**
 * Count one request against `name` for this caller.
 * `limit` requests are allowed per `windowMs`.
 */
export function rateLimit(
  req: Request,
  name: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  if (buckets.size > MAX_KEYS) sweep(now);

  const key = `${name}:${callerKey(req)}`;
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfter: 0 };
  }

  bucket.count += 1;
  const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
  if (bucket.count > limit) return { ok: false, remaining: 0, retryAfter };
  return { ok: true, remaining: limit - bucket.count, retryAfter };
}

/** The 429 to return when {@link rateLimit} refuses. */
export function tooManyRequests(result: RateLimitResult): Response {
  return new Response(JSON.stringify({ error: "Too many requests" }), {
    status: 429,
    headers: {
      "Content-Type": "application/json",
      "Retry-After": String(result.retryAfter),
      "Cache-Control": "no-store",
    },
  });
}
