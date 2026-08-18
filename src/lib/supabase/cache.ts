/**
 * A tiny client-side read cache for Supabase queries.
 *
 * Every page fetches its data in a `useEffect`, so without this each navigation
 * re-runs the same reads (getTrades, getProfile, …) from scratch and shows a
 * spinner. This memoises read results for a short window and de-duplicates
 * concurrent identical requests, so moving between the dashboard, journal,
 * analytics and therapist feels instant instead of reloading everything.
 *
 * Correctness over cleverness: any mutation calls `invalidateReads()`, which
 * clears the whole cache, so the next read is guaranteed fresh. The TTL only
 * bounds staleness between reads when nothing has changed.
 */

const TTL = 60_000; // ms a cached read stays fresh

type Entry = { at: number; data: unknown };
const store = new Map<string, Entry>();
const inflight = new Map<string, Promise<unknown>>();

/** Run `fetcher` through the cache under `key`. */
export async function cachedRead<T>(key: string, fetcher: () => Promise<T>, ttl = TTL): Promise<T> {
  const hit = store.get(key);
  if (hit && Date.now() - hit.at < ttl) return hit.data as T;

  const existing = inflight.get(key);
  if (existing) return existing as Promise<T>;

  const p = fetcher()
    .then((data) => {
      store.set(key, { at: Date.now(), data });
      inflight.delete(key);
      return data;
    })
    .catch((err) => {
      inflight.delete(key);
      throw err;
    });
  inflight.set(key, p);
  return p as Promise<T>;
}

/** Drop cached reads. Called by every mutation so writes are never masked. */
export function invalidateReads(): void {
  store.clear();
  inflight.clear();
}
