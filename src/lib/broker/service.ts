import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createDataKey, hasEncryptionKey, open, seal, secretKey } from "./crypto";
import { credentialStore, hasCredentialStore } from "./admin";
import { sourceKey } from "./source-key";
import * as tradovate from "./tradovate";
import { oauthConfig, refreshTokens, type OAuthTokens } from "./tradovate-oauth";
import { TradovateAuthError, type TradovateToken } from "./tradovate";
import type {
  AccountSnapshot,
  BrokerAccountsResponse,
  BrokerConnectionView,
  BrokerSetupIssue,
} from "./types";

/**
 * Server-side orchestration for live broker accounts. Every function takes the
 * request's user-scoped Supabase client, so row-level security applies to all
 * reads and writes, and runs only inside /api/broker route handlers.
 *
 * Guarantees:
 *  - Credentials and tokens are sealed before they touch the database and are
 *    opened only in memory for the duration of one request.
 *  - Legacy password connections cannot authenticate and must reconnect via OAuth.
 *  - One failing connection or account never fails the others.
 */

type Adapter = Pick<typeof tradovate, "renew" | "listAccounts" | "cashBalance" | "openPositionCounts">;

const CONNECTION_COLUMNS = "id, broker, auth_method, label, username_hint, state, last_error, last_sync_at, trades_synced_at, created_at";
const RENEW_WINDOW_MS = 15 * 60_000;
const HISTORY_BUCKET_MS = 5 * 60_000;

export class BrokerError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

/** Only an explicitly confirmed read-only OAuth app can be offered. */
export function oauthAvailable(): boolean {
  return oauthConfig() !== null;
}

const tokenContext = (userId: string, connectionId: string) => `broker:${userId}:${connectionId}:token`;
const keyContext = (userId: string, connectionId: string) => `broker:${userId}:${connectionId}:key`;
const refreshContext = (userId: string, connectionId: string) => `broker:${userId}:${connectionId}:refresh`;

/**
 * Append to the credential audit trail. Never throws: a log that cannot be
 * written must not take the feature down with it. The trail is append-only in
 * the database, so these entries cannot be edited or deleted afterwards.
 */
async function audit(supabase: SupabaseClient, action: string, connectionId: string | null, detail?: string) {
  await supabase
    .rpc("broker_audit", { action, connection_id: connectionId, detail: detail ?? null })
    .then(undefined, () => {});
}

function isMissingTable(error: { code?: string; message?: string } | null): boolean {
  return !!error && (error.code === "42P01" || error.code === "PGRST205" || /does not exist|could not find the table/i.test(error.message ?? ""));
}

/** A column the code needs but the database has not been migrated for yet. */
function isMissingColumn(error: { code?: string } | null): boolean {
  return error?.code === "42703";
}

/* ── Reads ─────────────────────────────────────────────────────────── */

export async function setupIssue(supabase: SupabaseClient): Promise<BrokerSetupIssue | null> {
  if (!hasEncryptionKey()) return "missing_key";
  if (!hasCredentialStore()) return "missing_service_key";
  // Probe every table and column this code reads. A half-applied migration
  // would otherwise surface as a failed load with nothing to act on; this way
  // the panel says which file still has to be run.
  const [connections, credentials, audit, imports] = await Promise.all([
    supabase.from("broker_connections").select("id, auth_method, trades_synced_at").limit(1),
    credentialStore().from("broker_credentials").select("connection_id, refresh_token, wrapped_key").limit(1),
    supabase.from("broker_audit_log").select("id").limit(1),
    supabase.from("broker_trade_imports").select("id").limit(1),
  ]);
  for (const { error } of [connections, credentials, audit, imports]) {
    if (isMissingTable(error) || isMissingColumn(error)) return "missing_tables";
  }
  if (!oauthAvailable()) return "not_configured";
  return null;
}

export async function listConnections(supabase: SupabaseClient): Promise<BrokerConnectionView[]> {
  const { data, error } = await supabase
    .from("broker_connections")
    .select(CONNECTION_COLUMNS)
    .order("created_at", { ascending: true });
  if (error) throw new BrokerError("Could not load connections", 500);
  return (data ?? []) as BrokerConnectionView[];
}

/* ── Connect / update / remove ─────────────────────────────────────── */

async function discoverAccounts(
  supabase: SupabaseClient,
  adapter: Adapter,
  userId: string,
  connectionId: string,
  accessToken: string
) {
  const accounts = await adapter.listAccounts(accessToken);
  if (accounts.length === 0) return;
  const { error } = await supabase.from("broker_accounts").upsert(
    accounts.map((a) => ({
      connection_id: connectionId,
      user_id: userId,
      environment: a.environment,
      external_id: a.id,
      name: a.name,
    })),
    // Keyed on the trader, not the connection: reconnecting a firm moves its
    // accounts to the new connection rather than duplicating them.
    { onConflict: "user_id,environment,external_id" }
  );
  if (error) throw new BrokerError("Could not save the discovered accounts", 500);
  await dropEmptyConnections(supabase, connectionId);
}

/**
 * Removes connections that no longer hold any account. That happens when a
 * trader reconnects a firm: the accounts move to the fresh connection and the
 * superseded one is left empty. The connection just used is never touched,
 * since its accounts may still be loading.
 */
async function dropEmptyConnections(supabase: SupabaseClient, keepId: string) {
  const { data: conns } = await supabase.from("broker_connections").select("id");
  const { data: accts } = await supabase.from("broker_accounts").select("connection_id");
  if (!conns || !accts) return;
  const inUse = new Set(accts.map((a) => a.connection_id));
  const stale = conns.map((c) => c.id).filter((id) => id !== keepId && !inUse.has(id));
  if (stale.length > 0) await supabase.from("broker_connections").delete().in("id", stale);
}

/**
 * Completes an OAuth authorisation: stores the refresh token Tradovate handed
 * back and discovers the accounts it covers. No password is involved at any
 * point, and the trader can revoke this from Tradovate itself.
 */
export async function createOAuthConnection(
  supabase: SupabaseClient,
  userId: string,
  tokens: OAuthTokens
): Promise<string> {
  if (!hasEncryptionKey()) throw new BrokerError("Secure storage is not configured on this server yet.", 503);
  if (!hasCredentialStore()) throw new BrokerError("Server-only credential storage is not configured yet.", 503);
  if (!tokens.refreshToken) {
    throw new BrokerError("Tradovate did not return a refresh token, so this connection could not be kept alive.", 502);
  }

  const id = randomUUID();
  const { data: conn, error } = await supabase
    .from("broker_connections")
    .insert({
      id,
      user_id: userId,
      broker: "tradovate",
      auth_method: "oauth",
      label: "Tradovate",
      username_hint: "authorised at Tradovate",
      state: "connected",
      last_sync_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error || !conn) {
    throw new BrokerError(isMissingTable(error) ? "Run broker_oauth.sql in Supabase first." : "Could not save the connection", 500);
  }

  const { key, wrapped } = createDataKey(keyContext(userId, id));
  const { error: credError } = await credentialStore().from("broker_credentials").insert({
    connection_id: id,
    user_id: userId,
    wrapped_key: wrapped,
    secret: null,
    refresh_token: seal(tokens.refreshToken, key, refreshContext(userId, id)),
    token: seal(tokens.accessToken, key, tokenContext(userId, id)),
    token_expires_at: tokens.expiresAt,
  });
  if (credError) {
    await supabase.from("broker_connections").delete().eq("id", id);
    throw new BrokerError("Could not store the authorisation securely", 500);
  }

  await discoverAccounts(supabase, tradovate, userId, id, tokens.accessToken).catch(async () => {
    await supabase
      .from("broker_connections")
      .update({ state: "error", last_error: "Authorised, but the account list could not be read yet" })
      .eq("id", id);
  });
  await audit(supabase, "connection.authorised", id, "via Tradovate OAuth");
  return id;
}

export async function deleteConnection(supabase: SupabaseClient, connectionId: string) {
  // Credentials, accounts and history cascade with the connection row.
  const { error, count } = await supabase.from("broker_connections").delete({ count: "exact" }).eq("id", connectionId);
  if (error) throw new BrokerError("Could not remove the connection", 500);
  if (!count) throw new BrokerError("Connection not found", 404);
  // The connection row is gone, so this entry keeps no reference to it.
  await audit(supabase, "connection.deleted", null);
}

/* ── Live snapshots ────────────────────────────────────────────────── */

interface AccountRow {
  id: string;
  connection_id: string;
  environment: "live" | "demo";
  external_id: number;
  name: string;
}

interface CredentialRow {
  connection_id: string;
  refresh_token: string | null;
  wrapped_key: string | null;
  token: string | null;
  token_expires_at: string | null;
}

/** A usable access token: cached, renewed near expiry, or a fresh login as last resort. */
async function accessToken(
  supabase: SupabaseClient,
  adapter: Adapter,
  userId: string,
  conn: BrokerConnectionView,
  cred: CredentialRow
): Promise<{ token: string; fresh: boolean }> {
  const ctx = tokenContext(userId, conn.id);
  const key = secretKey(cred.wrapped_key, keyContext(userId, conn.id));
  const expiresIn = cred.token_expires_at ? Date.parse(cred.token_expires_at) - Date.now() : 0;

  if (cred.token && expiresIn > RENEW_WINDOW_MS) return { token: open(cred.token, key, ctx), fresh: false };

  let next: TradovateToken | null = null;
  let fresh = false;
  if (cred.token && expiresIn > 60_000) {
    next = await adapter.renew(open(cred.token, key, ctx)).catch(() => null);
  }
  let rotatedRefresh: string | null = null;
  if (!next && conn.auth_method === "oauth") {
    // No password exists for this connection: the refresh token is the only
    // credential, and Tradovate may hand back a new one to replace it.
    const config = oauthConfig();
    if (!config || !cred.refresh_token) {
      throw new TradovateAuthError("Reconnect this Tradovate login.", true);
    }
    const tokens: OAuthTokens = await refreshTokens(config, open(cred.refresh_token, key, refreshContext(userId, conn.id)));
    rotatedRefresh = tokens.refreshToken;
    next = tokens;
    fresh = true;
  }
  if (!next) throw new TradovateAuthError("Reconnect this Tradovate login with OAuth.", true);
  const { error: saveError } = await credentialStore()
    .from("broker_credentials")
    .update({
      token: seal(next.accessToken, key, ctx),
      token_expires_at: next.expiresAt,
      ...(rotatedRefresh ? { refresh_token: seal(rotatedRefresh, key, refreshContext(userId, conn.id)) } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("connection_id", conn.id)
    .eq("user_id", userId);
  if (saveError) throw new TradovateAuthError("Could not update broker authorisation. Reconnect this login.", false);
  return { token: next.accessToken, fresh };
}

function emptySnapshot(a: AccountRow, error: string): AccountSnapshot {
  return {
    account_id: a.id,
    connection_id: a.connection_id,
    label: a.name,
    environment: a.environment,
    external_account_id: a.external_id,
    currency: "USD",
    balance: null,
    equity: null,
    open_pl: null,
    day_pl: null,
    open_positions_count: null,
    connection_state: "error",
    last_update_ts: null,
    error,
  };
}

async function connectionSnapshots(
  supabase: SupabaseClient,
  userId: string,
  conn: BrokerConnectionView,
  cred: CredentialRow | undefined,
  accounts: AccountRow[]
): Promise<AccountSnapshot[]> {
  if (conn.state === "auth_failed") {
    return accounts.map((a) => emptySnapshot(a, conn.last_error ?? "Reconnect this login with OAuth."));
  }
  if (!cred) return accounts.map((a) => emptySnapshot(a, "Credentials missing. Remove and add this login again."));

  if (conn.auth_method !== "oauth") return accounts.map((a) => emptySnapshot(a, "Reconnect this login with OAuth."));
  const adapter = tradovate;
  let token: string;
  try {
    const t = await accessToken(supabase, adapter, userId, conn, cred);
    token = t.token;
    // After a full login, pick up accounts the firm added since the last one.
    if (t.fresh) await discoverAccounts(supabase, adapter, userId, conn.id, token).catch(() => {});
  } catch (err) {
    const permanent = err instanceof TradovateAuthError && err.permanent;
    const message = err instanceof TradovateAuthError ? err.message : "Could not reach Tradovate";
    await supabase
      .from("broker_connections")
      .update({ state: permanent ? "auth_failed" : "error", last_error: message, updated_at: new Date().toISOString() })
      .eq("id", conn.id);
    return accounts.map((a) => emptySnapshot(a, message));
  }

  const envs = [...new Set(accounts.map((a) => a.environment))];
  const positionMaps = new Map(
    await Promise.all(
      envs.map(async (env) => [env, await adapter.openPositionCounts(token, env).catch(() => null)] as const)
    )
  );

  const now = new Date().toISOString();
  const results = await Promise.allSettled(accounts.map((a) => adapter.cashBalance(token, a.environment, a.external_id)));
  let sessionExpired = false;
  const snapshots = results.map((r, i): AccountSnapshot => {
    const a = accounts[i];
    if (r.status === "rejected") {
      if (r.reason instanceof TradovateAuthError) sessionExpired = true;
      return emptySnapshot(a, "Balance could not be read");
    }
    const positions = positionMaps.get(a.environment);
    return {
      ...emptySnapshot(a, ""),
      ...r.value,
      open_positions_count: positions ? positions.get(a.external_id) ?? 0 : null,
      connection_state: "connected",
      last_update_ts: now,
      error: null,
    };
  });

  // Write the connection state only when it changed or once a minute, not on every poll.
  const anyOk = snapshots.some((s) => s.connection_state === "connected");
  const lastSync = conn.last_sync_at ? Date.parse(conn.last_sync_at) : 0;
  if (anyOk && (conn.state !== "connected" || Date.now() - lastSync > 60_000)) {
    await supabase.from("broker_connections").update({ state: "connected", last_error: null, last_sync_at: now }).eq("id", conn.id);
  } else if (!anyOk && accounts.length > 0 && conn.state !== "error") {
    await supabase.from("broker_connections").update({ state: "error", last_error: "Balances could not be read" }).eq("id", conn.id);
  }
  // A token Tradovate no longer accepts: drop it so the next poll logs in again.
  if (sessionExpired) {
    await credentialStore().from("broker_credentials").update({ token: null, token_expires_at: null }).eq("connection_id", conn.id).eq("user_id", userId);
  }
  return snapshots;
}

async function recordHistory(supabase: SupabaseClient, userId: string, snapshots: AccountSnapshot[]) {
  const bucket = new Date(Math.floor(Date.now() / HISTORY_BUCKET_MS) * HISTORY_BUCKET_MS).toISOString();
  const rows = snapshots
    .filter((s) => s.connection_state === "connected" && s.balance !== null)
    .map((s) => ({ account_id: s.account_id, user_id: userId, bucket, balance: s.balance, equity: s.equity, day_pl: s.day_pl }));
  if (rows.length === 0) return;
  await supabase.from("broker_account_history").upsert(rows, { onConflict: "account_id,bucket", ignoreDuplicates: true });
}

export async function readLiveAccounts(supabase: SupabaseClient, userId: string): Promise<BrokerAccountsResponse> {
  const setup = await setupIssue(supabase);
  if (setup === "missing_tables" || setup === "missing_key" || setup === "missing_service_key") return { setup, oauth_available: false, connections: [], accounts: [] };

  const [connections, { data: accountRows, error: accountError }, { data: credRows, error: credentialError }] = await Promise.all([
    listConnections(supabase),
    supabase.from("broker_accounts").select("id, connection_id, environment, external_id, name").order("name"),
    credentialStore().from("broker_credentials").select("connection_id, refresh_token, wrapped_key, token, token_expires_at").eq("user_id", userId),
  ]);
  if (accountError || credentialError) throw new BrokerError("Could not load broker accounts securely", 500);
  const accounts = (accountRows ?? []) as AccountRow[];
  const creds = new Map(((credRows ?? []) as CredentialRow[]).map((c) => [c.connection_id, c]));

  const perConnection = await Promise.allSettled(
    connections.map((c) =>
      connectionSnapshots(supabase, userId, c, creds.get(c.id), accounts.filter((a) => a.connection_id === c.id))
    )
  );
  const snapshots = perConnection.flatMap((r, i) =>
    r.status === "fulfilled"
      ? r.value
      : accounts.filter((a) => a.connection_id === connections[i].id).map((a) => emptySnapshot(a, "Unexpected error"))
  );
  await recordHistory(supabase, userId, snapshots).catch(() => {});

  // Re-read connection states after this round so the UI shows the latest.
  return {
    setup,
    oauth_available: oauthAvailable(),
    connections: await listConnections(supabase).catch(() => connections),
    accounts: snapshots,
  };
}

export async function readHistory(supabase: SupabaseClient, accountId: string, from: string, to: string) {
  const { data, error } = await supabase
    .from("broker_account_history")
    .select("bucket, balance, equity, day_pl")
    .eq("account_id", accountId)
    .gte("bucket", from)
    .lte("bucket", to)
    .order("bucket", { ascending: true })
    .limit(2000);
  if (error) throw new BrokerError("Could not load history", 500);
  return data ?? [];
}

/** Refresh completed Tradovate executions at most once per five minutes per connection. */
export async function syncTradovateTrades(supabase: SupabaseClient, userId: string) {
  if (!hasCredentialStore() || !hasEncryptionKey()) throw new BrokerError("Broker sync is not configured", 503);
  const connections = (await listConnections(supabase)).filter((c) => c.broker === "tradovate" && c.auth_method === "oauth");
  let imported = 0;
  const errors: string[] = [];
  for (const conn of connections) {
    if (conn.trades_synced_at && Date.now() - Date.parse(conn.trades_synced_at) < 5 * 60_000) continue;
    const { data: cred } = await credentialStore().from("broker_credentials")
      .select("connection_id, refresh_token, wrapped_key, token, token_expires_at")
      .eq("connection_id", conn.id).eq("user_id", userId).maybeSingle();
    if (!cred) { errors.push(`${conn.label}: reconnect required`); continue; }
    const { data: accounts } = await supabase.from("broker_accounts")
      .select("id, external_id, environment, name").eq("connection_id", conn.id);
    if (!accounts?.length) continue;
    try {
      const { token } = await accessToken(supabase, tradovate, userId, conn, cred as CredentialRow);
      for (const env of ["live", "demo"] as const) {
        const inEnv = accounts.filter((a) => a.environment === env);
        if (!inEnv.length) continue;
        const byExternalId = new Map(inEnv.map((a) => [a.external_id, a]));
        const closed = await tradovate.listClosedTrades(token, env);
        const rows = closed.flatMap((trade) => {
          const account = byExternalId.get(trade.account_id);
          if (!account) return [];
          const input = {
            source_id: `${env}:${trade.source_id}`,
            external_account: `${env}:${trade.account_id}`,
            instrument: trade.instrument, direction: trade.direction, quantity: trade.quantity,
            entry_time: trade.entry_time, exit_time: trade.exit_time,
            entry_price: trade.entry_price, exit_price: trade.exit_price,
            fees: null, pnl: trade.pnl,
          };
          return [{ ...input, user_id: userId, source: "tradovate", source_key: sourceKey(input), broker_account_id: account.id }];
        });
        for (let i = 0; i < rows.length; i += 500) {
          const { error } = await credentialStore().from("broker_trade_imports").upsert(rows.slice(i, i + 500), {
            onConflict: "user_id,source,external_account,source_key", ignoreDuplicates: true,
          });
          if (error) throw error;
          imported += Math.min(500, rows.length - i);
        }
      }
      await supabase.from("broker_connections").update({ trades_synced_at: new Date().toISOString() })
        .eq("id", conn.id);
    } catch {
      errors.push(`${conn.label}: trade sync failed`);
    }
  }
  return { processed: imported, errors };
}
