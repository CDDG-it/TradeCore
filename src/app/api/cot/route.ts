import { NextResponse } from "next/server";
import { fetchCotSnapshot } from "@/lib/cot/live";
import type { CotSnapshot } from "@/lib/cot/types";

// On-demand: live CFTC fetches. The route keeps its own last-good snapshot so a
// transient upstream failure still serves real, last-known-good numbers —
// never mock data. COT updates weekly, so a short cache is plenty.
export const dynamic = "force-dynamic";
export const revalidate = 0;

let _lastGood: CotSnapshot | null = null;

export async function GET() {
  try {
    const snapshot = await fetchCotSnapshot();
    _lastGood = snapshot;
    return NextResponse.json({ snapshot, live: true });
  } catch (err) {
    console.error("[cot] snapshot fetch failed:", err);
    if (_lastGood) {
      return NextResponse.json({ snapshot: _lastGood, live: true, stale: true });
    }
    return NextResponse.json(
      { snapshot: null, live: false, error: err instanceof Error ? err.message : "unknown" },
      { status: 200 }
    );
  }
}
