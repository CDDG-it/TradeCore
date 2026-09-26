import { NextResponse } from "next/server";
import { rateLimit, tooManyRequests } from "@/lib/security/rate-limit";
import { NO_STORE, publicCache, upstreamFailure } from "@/lib/security/public-api";
import { fetchCotSnapshot } from "@/lib/cot/live";
import type { CotSnapshot } from "@/lib/cot/types";

// On-demand: live CFTC fetches. The route keeps its own last-good snapshot so a
// transient upstream failure still serves real, last-known-good numbers:
// never mock data. COT updates weekly, so a short cache is plenty.
export const dynamic = "force-dynamic";
export const revalidate = 0;

// COT is published once a week, so a quarter of an hour in the shared cache
// costs no freshness at all and takes the CFTC fetch off the hot path.
const CACHE = publicCache(900, 3600);

let _lastGood: CotSnapshot | null = null;

export async function GET(req: Request) {
  const limit = rateLimit(req, "cot", 30, 60_000);
  if (!limit.ok) return tooManyRequests(limit);

  try {
    const snapshot = await fetchCotSnapshot();
    _lastGood = snapshot;
    return NextResponse.json({ snapshot, live: true }, { headers: { "Cache-Control": CACHE } });
  } catch (err) {
    const error = upstreamFailure("cot", err);
    if (_lastGood) {
      return NextResponse.json(
        { snapshot: _lastGood, live: true, stale: true },
        { headers: { "Cache-Control": NO_STORE } }
      );
    }
    return NextResponse.json(
      { snapshot: null, live: false, error },
      { status: 200, headers: { "Cache-Control": NO_STORE } }
    );
  }
}
