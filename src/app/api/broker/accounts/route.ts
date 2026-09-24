import { readLiveAccounts } from "@/lib/broker/service";
import { errorResponse, json, requireUser } from "@/lib/broker/route-utils";

// Live balance / equity / P&L for every connected account. Polled by the
// Live accounts panel while it is on screen.
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireUser();
  if (!auth) return json({ error: "Not signed in" }, 401);
  try {
    return json(await readLiveAccounts(auth.supabase, auth.user.id));
  } catch (err) {
    return errorResponse(err);
  }
}
