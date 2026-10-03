import { NextResponse } from "next/server";
import { rateLimit, tooManyRequests } from "@/lib/security/rate-limit";
import { fetchNews } from "@/lib/gmi/news";
import { requireGlobalMarkets } from "@/lib/access/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  const denied = await requireGlobalMarkets("markets");
  if (denied) { denied.headers.set("Cache-Control", "private, no-store"); return denied; }
  const limit = rateLimit(req, "gmi:news", 30, 60_000);
  if (!limit.ok) { const response = tooManyRequests(limit); response.headers.set("Cache-Control", "private, no-store"); return response; }
  return NextResponse.json(await fetchNews(), { headers: { "Cache-Control": "private, no-store" } });
}
