import { NextResponse } from "next/server";
import { fetchLiveFlows } from "@/lib/option-flow/live";
import { getAllFlows } from "@/lib/option-flow/data";

// Re-fetch live data at most once per minute (Yahoo futures are ~real-time).
export const revalidate = 60;

export async function GET() {
  try {
    const flows = await fetchLiveFlows();
    return NextResponse.json({ flows, live: true });
  } catch (err) {
    // Network/weekend/upstream failure → serve mock so the tab still renders.
    console.error("[option-flow] live fetch failed, falling back to mock:", err);
    return NextResponse.json({
      flows: getAllFlows(),
      live: false,
      error: err instanceof Error ? err.message : "unknown",
    });
  }
}
