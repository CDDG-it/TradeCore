import { z } from "zod";
import { credentialStore } from "@/lib/broker/admin";
import { isComplete, type ImportedTrade } from "@/lib/broker/imports";
import { json, requireUser, sameOrigin } from "@/lib/broker/route-utils";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };
const Edit = z.object({
  funded_account_id: z.string().uuid().nullable().optional(),
  direction: z.enum(["long", "short"]).nullable().optional(),
  quantity: z.number().positive().nullable().optional(),
  entry_time: z.string().datetime({ offset: true }).nullable().optional(),
  exit_time: z.string().datetime({ offset: true }).nullable().optional(),
  entry_price: z.number().finite().nullable().optional(),
  exit_price: z.number().finite().nullable().optional(),
  pnl: z.number().finite().nullable().optional(),
  fees: z.number().finite().nullable().optional(),
}).strict();

export async function PATCH(req: Request, ctx: Ctx) {
  if (!sameOrigin(req)) return json({ error: "Forbidden" }, 403);
  const auth = await requireUser();
  if (!auth) return json({ error: "Not signed in" }, 401);
  const id = z.string().uuid().safeParse((await ctx.params).id);
  const body = z.object({ action: z.enum(["accept", "ignore", "edit"]), values: Edit.optional() }).safeParse(await req.json().catch(() => null));
  if (!id.success || !body.success) return json({ error: "Invalid request" }, 400);
  const db = credentialStore();
  const { data: row, error } = await db.from("broker_trade_imports").select("*")
    .eq("id", id.data).eq("user_id", auth.user.id).maybeSingle();
  if (error || !row) return json({ error: "Imported trade not found" }, 404);
  if (row.status !== "pending") return json({ error: "This trade has already been reviewed" }, 409);

  if (body.data.action === "edit") {
    const values = body.data.values;
    if (!values || !Object.keys(values).length) return json({ error: "Nothing to update" }, 400);
    if (values.funded_account_id) {
      const { data: account } = await auth.supabase.from("funded_accounts").select("id").eq("id", values.funded_account_id).maybeSingle();
      if (!account) return json({ error: "Account not found" }, 404);
    }
    const { error: updateError } = await db.from("broker_trade_imports").update(values)
      .eq("id", id.data).eq("user_id", auth.user.id).eq("status", "pending");
    return updateError ? json({ error: "Could not update trade" }, 500) : json({ ok: true });
  }
  if (body.data.action === "ignore") {
    const { error: updateError } = await db.from("broker_trade_imports").update({ status: "ignored" })
      .eq("id", id.data).eq("user_id", auth.user.id).eq("status", "pending");
    return updateError ? json({ error: "Could not ignore trade" }, 500) : json({ ok: true });
  }

  const trade = row as ImportedTrade;
  if (!isComplete(trade)) return json({ error: "Complete the trade fields before adding it to the journal" }, 400);
  if (trade.funded_account_id) {
    const { data: account } = await auth.supabase.from("funded_accounts").select("id").eq("id", trade.funded_account_id).maybeSingle();
    if (!account) return json({ error: "Account not found" }, 404);
  }
  if (new Date(trade.exit_time!) < new Date(trade.entry_time!)) return json({ error: "Exit must be after entry" }, 400);
  const { data: journalId, error: acceptError } = await db.rpc("broker_accept_import", {
    p_import_id: id.data, p_user_id: auth.user.id,
  });
  if (acceptError || !journalId) return json({ error: "Could not add this trade to the journal" }, 409);
  return json({ ok: true, journal_trade_id: journalId });
}
