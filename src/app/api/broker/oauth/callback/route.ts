import { NextResponse } from "next/server";
import { createOAuthConnection } from "@/lib/broker/service";
import { exchangeCode, oauthConfig } from "@/lib/broker/tradovate-oauth";
import { requireUser } from "@/lib/broker/route-utils";
import { STATE_COOKIE } from "../start/route";

// Where Tradovate returns the trader after they authorise. Exchanges the code
// for tokens, stores only the refresh token, and sends them back to Accounts.
export const dynamic = "force-dynamic";

function back(request: Request, params: Record<string, string>) {
  const url = new URL("/accounts", request.url);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = NextResponse.redirect(url);
  res.cookies.delete({ name: STATE_COOKIE, path: "/api/broker/oauth" });
  return res;
}

export async function GET(request: Request) {
  const auth = await requireUser();
  if (!auth) return NextResponse.redirect(new URL("/login", request.url));

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const denied = url.searchParams.get("error");

  if (denied) return back(request, { broker: "cancelled" });

  // The state must match the cookie set when this flow started, or the code
  // did not come from a request this browser made.
  const expected = request.headers.get("cookie")?.match(new RegExp(`${STATE_COOKIE}=([^;]+)`))?.[1];
  if (!code || !state || !expected || state !== expected) {
    return back(request, { broker: "failed", reason: "The authorisation could not be verified. Try again." });
  }

  const config = oauthConfig();
  if (!config) return back(request, { broker: "failed", reason: "Tradovate authorisation is not configured." });

  try {
    const tokens = await exchangeCode(config, code);
    await createOAuthConnection(auth.supabase, auth.user.id, tokens);
    return back(request, { broker: "connected" });
  } catch (err) {
    console.error("[broker] oauth callback failed:", err instanceof Error ? err.name : "unknown");
    const reason = err instanceof Error && err.message ? err.message : "Could not complete the authorisation.";
    return back(request, { broker: "failed", reason });
  }
}
