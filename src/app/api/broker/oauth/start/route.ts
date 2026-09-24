import { NextResponse } from "next/server";
import { authorizeUrl, newState, oauthConfig } from "@/lib/broker/tradovate-oauth";
import { json, requireUser } from "@/lib/broker/route-utils";

// Sends the trader to Tradovate's own site to authorise this app. Nothing is
// stored until they come back through the callback.
export const dynamic = "force-dynamic";

export const STATE_COOKIE = "tradovate_oauth_state";

export async function GET() {
  const auth = await requireUser();
  if (!auth) return json({ error: "Not signed in" }, 401);

  const config = oauthConfig();
  if (!config) return json({ error: "Tradovate authorisation is not configured on this server yet." }, 503);

  // Ties the callback to this browser: a code delivered to any other session
  // carries no matching cookie and is rejected.
  const state = newState();
  const res = NextResponse.redirect(authorizeUrl(config, state));
  res.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/broker/oauth",
    maxAge: 600,
  });
  return res;
}
