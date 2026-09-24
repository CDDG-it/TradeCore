import { z } from "zod";
import { readHistory } from "@/lib/broker/service";
import { errorResponse, json, requireUser } from "@/lib/broker/route-utils";

// Equity series for one account: /api/broker/history?account=<id>&from=<iso>&to=<iso>
export const dynamic = "force-dynamic";

const Query = z.object({
  account: z.string().uuid(),
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
});

export async function GET(req: Request) {
  const auth = await requireUser();
  if (!auth) return json({ error: "Not signed in" }, 401);

  const params = Object.fromEntries(new URL(req.url).searchParams);
  const q = Query.safeParse(params);
  if (!q.success) return json({ error: "Invalid query" }, 400);

  const to = q.data.to ?? new Date().toISOString();
  const from = q.data.from ?? new Date(Date.now() - 7 * 86_400_000).toISOString();
  try {
    return json({ points: await readHistory(auth.supabase, q.data.account, from, to) });
  } catch (err) {
    return errorResponse(err);
  }
}
