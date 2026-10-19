import { ImportBatch, ImportTrade, type ImportedTrade } from "@/lib/broker/imports";
import { z } from "zod";
import { sourceKey } from "@/lib/broker/source-key";
import { credentialStore } from "@/lib/broker/admin";
import { json, requireUser, sameOrigin } from "@/lib/broker/route-utils";

export const dynamic = "force-dynamic";
const COLUMNS = "id, source, source_key, external_account, broker_account_id, funded_account_id, instrument, direction, quantity, entry_time, exit_time, entry_price, exit_price, fees, pnl, status, journal_trade_id, created_at";

export async function GET(req: Request) {
  const auth = await requireUser();
  if (!auth) return json({ error: "Not signed in" }, 401);
  const offset = Number(new URL(req.url).searchParams.get("offset") ?? 0);
  if (!Number.isInteger(offset) || offset < 0 || offset > 50_000) return json({ error: "Invalid offset" }, 400);
  const { data, error } = await auth.supabase.from("broker_trade_imports").select(COLUMNS)
    .eq("status", "pending").order("created_at", { ascending: false }).order("id", { ascending: false })
    .range(offset, offset + 499);
  if (error) return json({ error: "Could not load imported trades. Run broker_trade_imports.sql first." }, 503);
  return json({ trades: (data ?? []) as ImportedTrade[], has_more: (data ?? []).length === 500 });
}

export async function POST(req: Request) {
  if (!sameOrigin(req)) return json({ error: "Forbidden" }, 403);
  const auth = await requireUser();
  if (!auth) return json({ error: "Not signed in" }, 401);
  const raw = await req.json().catch(() => null);
  const PreviewBatch = ImportBatch.extend({ trades: z.array(ImportTrade).min(1).max(5000), preview: z.literal(true) });
  const parsed = (raw?.preview === true ? PreviewBatch : ImportBatch).safeParse(raw);
  if (!parsed.success || parsed.data.source === "tradovate") return json({ error: "Invalid import batch" }, 400);
  const { source, trades } = parsed.data;
  const accountIds = [...new Set(trades.flatMap((row) => row.funded_account_id ? [row.funded_account_id] : []))];
  if (accountIds.length) {
    const { data } = await auth.supabase.from("funded_accounts").select("id").in("id", accountIds);
    if ((data ?? []).length !== accountIds.length) return json({ error: "An account does not belong to you" }, 403);
  }
  const rows = trades.map(({ source_id, ...row }) => ({
    ...row, source, source_key: sourceKey({ ...row, source_id }), user_id: auth.user.id,
    broker_account_id: null,
  }));
  const existing = new Set<string>();
  for (let i = 0; i < rows.length; i += 100) {
    const keys = [...new Set(rows.slice(i, i + 100).map((row) => row.source_key))];
    const { data, error } = await credentialStore().from("broker_trade_imports")
      .select("external_account, source_key")
      .eq("user_id", auth.user.id).eq("source", source).in("source_key", keys);
    if (error) return json({ error: "Could not check existing trades" }, 500);
    for (const row of data ?? []) existing.add(`${row.external_account}:${row.source_key}`);
  }
  const seen = new Set<string>();
  let duplicates = 0;
  for (const row of rows) {
    const key = `${row.external_account}:${row.source_key}`;
    if (existing.has(key) || seen.has(key)) duplicates++;
    seen.add(key);
  }
  if (raw.preview === true) return json({ received: rows.length, duplicates });
  const { error } = await credentialStore().from("broker_trade_imports").upsert(rows, {
    onConflict: "user_id,source,external_account,source_key", ignoreDuplicates: true,
  });
  if (error) return json({ error: "Could not save imported trades" }, 500);
  return json({ received: rows.length, duplicates });
}
