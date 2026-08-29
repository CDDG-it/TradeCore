import { NextResponse } from "next/server";
import { fetchEarnings } from "@/lib/gmi/earnings";
import type { DataEnvelope, EarningsRow } from "@/lib/gmi/types";

// Twelve Data earnings (EPS estimate/actual/surprise per index heavyweight).
// Per-symbol caching lives in the provider; this route just wraps the result in
// the standard envelope. EPS only on the free tier — revenue is unavailable.
export const dynamic = "force-dynamic";
export const revalidate = 0;

type EarningsPayload = { rows: EarningsRow[]; missing: string[] };

export async function GET() {
  const apiKey = process.env.TWELVEDATA_API_KEY;
  if (!apiKey) {
    const env: DataEnvelope<EarningsPayload> = {
      data: null,
      source: "Twelve Data",
      freshness: "daily",
      asOf: null,
      fetchedAt: new Date().toISOString(),
      status: "unavailable",
      error: "TWELVEDATA_API_KEY not configured",
    };
    return NextResponse.json(env);
  }

  try {
    const result = await fetchEarnings(apiKey);
    const env: DataEnvelope<EarningsPayload> = {
      data: result,
      source: "Twelve Data",
      freshness: "daily",
      asOf: result.rows[0]?.date ?? null,
      fetchedAt: new Date().toISOString(),
      status: result.missing.length > 0 ? "stale" : "ok",
    };
    return NextResponse.json(env);
  } catch (err) {
    const env: DataEnvelope<EarningsPayload> = {
      data: null,
      source: "Twelve Data",
      freshness: "daily",
      asOf: null,
      fetchedAt: new Date().toISOString(),
      status: "unavailable",
      error: err instanceof Error ? err.message : "unknown",
    };
    return NextResponse.json(env);
  }
}
