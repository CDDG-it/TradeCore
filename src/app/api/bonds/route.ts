import { NextResponse } from "next/server";
import { fetchBondSnapshot } from "@/lib/bonds/live";
import type { BondSnapshot } from "@/lib/bonds/types";

// On-demand: live Treasury fetches. The route keeps its own last-good snapshot
// so a transient upstream failure still serves real, last-known-good yields —
// never mock data. The curve updates once per business day.
export const dynamic = "force-dynamic";
export const revalidate = 0;

let _lastGood: BondSnapshot | null = null;

export async function GET() {
  try {
    const snapshot = await fetchBondSnapshot();
    _lastGood = snapshot;
    return NextResponse.json({ snapshot, live: true });
  } catch (err) {
    console.error("[bonds] snapshot fetch failed:", err);
    if (_lastGood) {
      return NextResponse.json({ snapshot: _lastGood, live: true, stale: true });
    }
    return NextResponse.json(
      { snapshot: null, live: false, error: err instanceof Error ? err.message : "unknown" },
      { status: 200 }
    );
  }
}
