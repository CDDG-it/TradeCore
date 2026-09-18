/**
 * A tiny client-side read cache for Supabase queries.
 *
 * Every page fetches its data in a `useEffect`, so without this each navigation
 * re-runs the same reads (getTrades, getProfile, ...) from scratch and shows a
 * spinner. This memoises read results for a short window and de-duplicates
 * concurrent identical requests, so moving between the dashboard, journal,
 * analytics and therapist feels instant instead of reloading everything.
 *
 * Correctness over cleverness: every mutation calls `invalidateReads()`. Given
 * a prefix it drops only the reads that could have changed (a habit tick
 * drops `habitCompletions*`, not the trades); with no argument it clears the
 * whole cache. The TTL only bounds staleness between reads when nothing has
 * changed.
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

/** Put a value in the cache directly: for data that arrived another way
 *  (a server render, a mutation's returned row) so the next read is a hit. */
export function primeRead<T>(key: string, data: T): void {
  store.set(key, { at: Date.now(), data });
}

/**
 * Drop cached reads. Called by every mutation so writes are never masked.
 * With prefixes, only keys starting with one of them are dropped; a write to
 * one table then leaves every other table's cached rows in place.
 */
export function invalidateReads(...prefixes: string[]): void {
  if (prefixes.length === 0) {
    store.clear();
    inflight.clear();
    return;
  }
  const match = (k: string) => prefixes.some((p) => k.startsWith(p));
  for (const k of [...store.keys()]) if (match(k)) store.delete(k);
  for (const k of [...inflight.keys()]) if (match(k)) inflight.delete(k);
}
