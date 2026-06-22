import { NextResponse } from "next/server";
import { fetchLiveFlows } from "@/lib/option-flow/live";
import type { InstrumentFlow } from "@/lib/option-flow/types";

// Re-fetch live data at most once per minute (Yahoo futures are ~real-time).
export const revalidate = 60;

// Last successful full payload — served if a later fetch fails outright (network/upstream down).
// Never falls back to mock: we only ever return real, last-known-good numbers.
let _lastGood: InstrumentFlow[] | null = null;

export async function GET() {
  try {
    const flows = await fetchLiveFlows();
    _lastGood = flows;
    return NextResponse.json({ flows, live: true });
  } catch (err) {
    console.error("[option-flow] live fetch failed:", err);
    if (_lastGood) {
      // Serve the last real snapshot rather than mock data.
      return NextResponse.json({ flows: _lastGood, live: true, stale: true });
    }
    // Nothing cached yet (cold start + upstream down) — return empty, no mock.
    return NextResponse.json({ flows: [], live: false, error: err instanceof Error ? err.message : "unknown" });
  }
}
