import { z } from "zod";
import { deleteConnection, updatePassword } from "@/lib/broker/service";
import { errorResponse, json, requireUser, sameOrigin } from "@/lib/broker/route-utils";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const Id = z.string().uuid();
const PasswordSchema = z.object({ password: z.string().min(1).max(200) });

/** Re-enter the password after it changed or Tradovate rejected it. */
export async function PATCH(req: Request, ctx: Ctx) {
  if (!sameOrigin(req)) return json({ error: "Forbidden" }, 403);
  const auth = await requireUser();
  if (!auth) return json({ error: "Not signed in" }, 401);

  const id = Id.safeParse((await ctx.params).id);
  const body = PasswordSchema.safeParse(await req.json().catch(() => null));
  if (!id.success || !body.success) return json({ error: "Enter the password." }, 400);

  try {
    await updatePassword(auth.supabase, auth.user.id, id.data, body.data.password);
    return json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
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
