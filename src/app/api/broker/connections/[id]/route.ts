import { z } from "zod";
import { deleteConnection } from "@/lib/broker/service";
import { errorResponse, json, requireUser, sameOrigin } from "@/lib/broker/route-utils";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const Id = z.string().uuid();
/** Legacy password updates stay closed after the credential purge. */
export async function PATCH() {
  return json({ error: "Password connections are closed. Reconnect through Tradovate OAuth." }, 410);
}

/** Removes the login, its encrypted credentials, accounts and history. */
export async function DELETE(req: Request, ctx: Ctx) {
  if (!sameOrigin(req)) return json({ error: "Forbidden" }, 403);
  const auth = await requireUser();
  if (!auth) return json({ error: "Not signed in" }, 401);

  const id = Id.safeParse((await ctx.params).id);
  if (!id.success) return json({ error: "Connection not found" }, 404);

  try {
    await deleteConnection(auth.supabase, id.data);
    return json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
