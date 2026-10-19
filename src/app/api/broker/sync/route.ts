import { syncTradovateTrades } from "@/lib/broker/service";
import { errorResponse, json, requireUser, sameOrigin } from "@/lib/broker/route-utils";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: "Forbidden" }, 403);
  const auth = await requireUser();
  if (!auth) return json({ error: "Not signed in" }, 401);
  try { return json(await syncTradovateTrades(auth.supabase, auth.user.id)); }
  catch (error) { return errorResponse(error); }
}
