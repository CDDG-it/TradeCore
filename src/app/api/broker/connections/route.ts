import { z } from "zod";
import { createConnection, listConnections } from "@/lib/broker/service";
import { errorResponse, json, requireUser, sameOrigin } from "@/lib/broker/route-utils";

// Read-only Tradovate logins. Secrets go in, never come back out.
export const dynamic = "force-dynamic";

const ConnectSchema = z.object({
  label: z.string().trim().max(60).default(""),
  username: z.string().trim().min(1).max(120),
  password: z.string().min(1).max(200),
});

export async function GET() {
  const auth = await requireUser();
  if (!auth) return json({ error: "Not signed in" }, 401);
  try {
    return json({ connections: await listConnections(auth.supabase) });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: "Forbidden" }, 403);
  const auth = await requireUser();
  if (!auth) return json({ error: "Not signed in" }, 401);

  const parsed = ConnectSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "Enter the Tradovate username and password." }, 400);

  try {
    const connection = await createConnection(auth.supabase, auth.user.id, parsed.data);
    return json({ connection }, 201);
  } catch (err) {
    return errorResponse(err);
  }
}
