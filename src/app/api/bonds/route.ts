import { NextResponse } from "next/server";
import { rateLimit, tooManyRequests } from "@/lib/security/rate-limit";
import { NO_STORE, publicCache, upstreamFailure } from "@/lib/security/public-api";
import { fetchBondSnapshot } from "@/lib/bonds/live";
import type { BondSnapshot } from "@/lib/bonds/types";

// On-demand: live Treasury fetches. The route keeps its own last-good snapshot
// so a transient upstream failure still serves real, last-known-good yields:
// never mock data. The curve updates once per business day.
export const dynamic = "force-dynamic";
export const revalidate = 0;

// The curve moves once a business day, so a quarter of an hour in the shared
// cache is free freshness-wise and saves a Treasury fetch per reader.
const CACHE = publicCache(900, 3600);

let _lastGood: BondSnapshot | null = null;

export async function GET(req: Request) {
  const limit = rateLimit(req, "bonds", 30, 60_000);
  if (!limit.ok) return tooManyRequests(limit);

  try {
    const snapshot = await fetchBondSnapshot();
    _lastGood = snapshot;
    return NextResponse.json({ snapshot, live: true }, { headers: { "Cache-Control": CACHE } });
  } catch (err) {
    const error = upstreamFailure("bonds", err);
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
