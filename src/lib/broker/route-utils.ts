import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { BrokerError } from "./service";

/* Shared plumbing for the /api/broker routes: every route is tied to the
   signed-in Supabase user (verified with the Auth server, not just the
   cookie), refuses cross-site writes, and never lets a response be cached. */

const NO_STORE = { "Cache-Control": "no-store, max-age=0" };

export function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE });
}

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? { supabase, user } : null;
}

/** Writes must come from this site: blocks cross-site form posts and fetches. */
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host === req.headers.get("host");
  } catch {
    return false;
  }
}

export function errorResponse(err: unknown) {
  if (err instanceof BrokerError) return json({ error: err.message }, err.status);
  // Deliberately generic: internal errors can carry request details.
  console.error("[broker] unexpected error:", err instanceof Error ? err.name : "unknown");
  return json({ error: "Something went wrong. Try again." }, 500);
}
