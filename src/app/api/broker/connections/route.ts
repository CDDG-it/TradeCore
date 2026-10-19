import { listConnections } from "@/lib/broker/service";
import { errorResponse, json, requireUser } from "@/lib/broker/route-utils";

// Read-only Tradovate logins. Secrets go in, never come back out.
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireUser();
  if (!auth) return json({ error: "Not signed in" }, 401);
  try {
    return json({ connections: await listConnections(auth.supabase) });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST() {
  return json({ error: "Password connections are closed. Connect through Tradovate OAuth." }, 410);
}
