import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, tooManyRequests } from "@/lib/security/rate-limit";
import { NO_STORE } from "@/lib/security/public-api";
import { focusRules, type FocusAreaId } from "@/lib/trade-profile/focus-rules";
import { fetchProfileNews } from "@/lib/trade-profile/news";

// Recent articles for one trader type (?type=calm), for My Trade Profile's
// Today section. Signed-in users only; the answer is the same for everyone of
// that type, so the browser may hold it a little while.
export const dynamic = "force-dynamic";

const TYPES = new Set<string>(focusRules.map((r) => r.id));

export async function GET(req: Request) {
  const limited = rateLimit(req, "trade-profile-news", 30, 60_000);
  if (!limited.ok) return tooManyRequests(limited);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401, headers: { "Cache-Control": NO_STORE } });

  const type = new URL(req.url).searchParams.get("type") ?? "";
  if (!TYPES.has(type)) return NextResponse.json({ error: "Unknown type" }, { status: 400, headers: { "Cache-Control": NO_STORE } });

  const result = await fetchProfileNews(type as FocusAreaId);
  return NextResponse.json(result, { headers: { "Cache-Control": result.status === "ok" ? "private, max-age=900" : NO_STORE } });
}
