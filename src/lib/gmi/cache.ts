/**
 * Global Markets Intelligence — server-side cache, dedupe and resilient fetch.
 *
 * All external calls funnel through here so the page respects provider rate
 * limits and never hammers an upstream. Three guarantees:
 *   • TTL cache        — repeated requests inside the window reuse one payload.
 *   • In-flight dedupe — concurrent misses share a single upstream call.
 *   • Last-good        — on failure we serve the previous value (flagged stale)
 *                        rather than mock data or an error.
 *
 * The cache is module-scoped: it lives for the lifetime of a warm server
 * instance, exactly like the existing `_lastGood` snapshots in the other API
 * routes. It is a best-effort accelerator, never a source of truth.
 */

type Entry<T> = { value: T; storedAt: number };

const store = new Map<string, Entry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

export interface CachedResult<T> {
  value: T;
  /** Epoch ms the value was fetched. */
  storedAt: number;
  /** True when the fresh fetch failed and we served the prior value. */
  stale: boolean;
}

/**
 * Return a cached value if within `ttlMs`, otherwise fetch via `fn`.
 * On fetch failure, fall back to any stored value (marked stale). If nothing
 * is cached and the fetch fails, the error propagates to the caller.
 */
export async function cached<T>(
  key: string,
  ttlMs: number,
  fn: () => Promise<T>
): Promise<CachedResult<T>> {
  const now = Date.now();
  const hit = store.get(key) as Entry<T> | undefined;
  if (hit && now - hit.storedAt < ttlMs) {
    return { value: hit.value, storedAt: hit.storedAt, stale: false };
  }

  // Dedupe concurrent misses onto one upstream call.
  const existing = inflight.get(key) as Promise<T> | undefined;
  const run =
    existing ??
    (async () => {
      try {
        const value = await fn();
        store.set(key, { value, storedAt: Date.now() });
        return value;
      } finally {
        inflight.delete(key);
      }
    })();
  inflight.set(key, run);

  try {
    const value = await run;
    const entry = store.get(key) as Entry<T>;
    return { value, storedAt: entry?.storedAt ?? Date.now(), stale: false };
  } catch (err) {
    if (hit) return { value: hit.value, storedAt: hit.storedAt, stale: true };
    throw err;
  }
}

/** Peek at a stored value without triggering a fetch. */
export function peek<T>(key: string): CachedResult<T> | null {
  const hit = store.get(key) as Entry<T> | undefined;
  return hit ? { value: hit.value, storedAt: hit.storedAt, stale: true } : null;
}

/**
 * fetch() with a timeout, retries and exponential backoff. Retries only on
 * network errors and 5xx / 429 responses; 4xx (other than 429) fail fast since
 * retrying a bad request or an unauthorized key is pointless.
 */
export async function fetchJson<T = unknown>(
  url: string,
  opts: {
    timeoutMs?: number;
    retries?: number;
    headers?: Record<string, string>;
    /** Parse a non-JSON body (e.g. CSV) yourself. */
    parse?: (res: Response) => Promise<T>;
  } = {}
): Promise<T> {
  const { timeoutMs = 8000, retries = 2, headers, parse } = opts;
  let lastErr: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) {
      // 400ms, 800ms, 1600ms … with a little jitter.
      const backoff = 400 * 2 ** (attempt - 1) + Math.random() * 200;
      await new Promise((r) => setTimeout(r, backoff));
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "TradingMC/1.0 (+global-markets)", ...headers },
        cache: "no-store",
        signal: controller.signal,
      });
      if (!res.ok) {
        // Retry transient upstream problems; fail fast on client errors.
        if (res.status >= 500 || res.status === 429) {
          lastErr = new Error(`HTTP ${res.status}`);
          continue;
        }
        throw new Error(`HTTP ${res.status}`);
      }
      return parse ? await parse(res) : ((await res.json()) as T);
    } catch (err) {
      lastErr = err;
      // AbortError and network failures fall through to another attempt.
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("fetch failed");
}
