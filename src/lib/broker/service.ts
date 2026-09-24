import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createDataKey, hasEncryptionKey, open, seal, secretKey } from "./crypto";
import * as mock from "./mock";
import * as tradovate from "./tradovate";
import { TradovateAuthError, type TradovateToken } from "./tradovate";
import type {
  AccountSnapshot,
  BrokerAccountsResponse,
  BrokerConnectionView,
  BrokerKind,
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
 *  - A connection whose password was rejected is never retried automatically
 *    (repeated bad logins can lock the Tradovate account); the trader has to
 *    enter the password again.
 *  - One failing connection or account never fails the others.
 */

type Adapter = Pick<typeof tradovate, "login" | "renew" | "listAccounts" | "cashBalance" | "openPositionCounts">;
const ADAPTERS: Record<BrokerKind, Adapter> = { tradovate, mock };

const CONNECTION_COLUMNS = "id, broker, label, username_hint, state, last_error, last_sync_at, created_at";
const RENEW_WINDOW_MS = 15 * 60_000;
const HISTORY_BUCKET_MS = 5 * 60_000;

export class BrokerError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

/** Which broker a new connection uses: real Tradovate when configured, the mock only in development. */
function newConnectionBroker(): BrokerKind | null {
  if (tradovate.appCredentials()) return "tradovate";
  if (process.env.NODE_ENV !== "production") return "mock";
  return null;
}

const secretContext = (userId: string, connectionId: string) => `broker:${userId}:${connectionId}:login`;
const tokenContext = (userId: string, connectionId: string) => `broker:${userId}:${connectionId}:token`;
const keyContext = (userId: string, connectionId: string) => `broker:${userId}:${connectionId}:key`;

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

function usernameHint(username: string): string {
  const u = username.trim();
  if (u.length <= 4) return `${u.slice(0, 1)}•••`;
  return `${u.slice(0, 3)}•••${u.slice(-2)}`;
}

function isMissingTable(error: { code?: string; message?: string } | null): boolean {
  return !!error && (error.code === "42P01" || error.code === "PGRST205" || /does not exist|could not find the table/i.test(error.message ?? ""));
}

/* ── Login rate limit ──────────────────────────────────────────────────
   Each connect / password update is a real Tradovate login. Capping them per
   user protects the trader's Tradovate account from lockout and stops this
   endpoint being used to guess passwords.

   Counted in the database, not in memory: serverless runs many instances, and
   a per-instance counter barely limits anything. The table is reachable only
   through a security-definer function, so a stolen browser token cannot clear
   its own attempts to reset the cap. */
const LOGIN_WINDOW_MINUTES = 15;
const LOGIN_MAX = 5;

async function takeLoginAttempt(supabase: SupabaseClient) {
  const { data, error } = await supabase.rpc("broker_take_login_attempt", {
    max_attempts: LOGIN_MAX,
    window_minutes: LOGIN_WINDOW_MINUTES,
  });
  // A missing function means the hardening migration has not been run: fail
  // closed rather than silently dropping the limit.
  if (error) throw new BrokerError("Login protection is not configured on this server yet.", 503);
  if (data === false) throw new BrokerError("Too many login attempts. Wait a few minutes and try again.", 429);
}

/* ── Reads ─────────────────────────────────────────────────────────── */

export async function setupIssue(supabase: SupabaseClient): Promise<BrokerSetupIssue | null> {
  if (!hasEncryptionKey()) return "missing_key";
  const { error } = await supabase.from("broker_connections").select("id").limit(1);
  if (isMissingTable(error)) return "missing_tables";
  if (!newConnectionBroker()) return "not_configured";
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
    { onConflict: "connection_id,environment,external_id" }
  );
  if (error) throw new BrokerError("Could not save the discovered accounts", 500);
}

export async function createConnection(
  supabase: SupabaseClient,
  userId: string,
  input: { label: string; username: string; password: string }
): Promise<BrokerConnectionView> {
  const broker = newConnectionBroker();
  if (!broker) throw new BrokerError("The Tradovate integration is not configured on this server yet.", 503);
  if (!hasEncryptionKey()) throw new BrokerError("Secure storage is not configured on this server yet.", 503);
  await takeLoginAttempt(supabase);

  // Log in before anything is stored, so a wrong password is never saved.
  const id = randomUUID();
  const adapter = ADAPTERS[broker];
  let token: TradovateToken;
  try {
    token = await adapter.login(input.username, input.password, id);
  } catch (err) {
    if (err instanceof TradovateAuthError) throw new BrokerError(err.message, 400);
    throw new BrokerError("Could not reach Tradovate. Try again shortly.", 502);
  }

  const { data: conn, error } = await supabase
    .from("broker_connections")
    .insert({
      id,
      user_id: userId,
      broker,
      label: input.label.trim() || "Tradovate",
      username_hint: usernameHint(input.username),
      state: "connected",
      last_sync_at: new Date().toISOString(),
    })
    .select(CONNECTION_COLUMNS)
    .single();
  if (error || !conn) throw new BrokerError(isMissingTable(error) ? "Run broker_connections.sql in Supabase first." : "Could not save the connection", 500);

  // This connection's own key. The master key only ever sees the wrapped form.
  const { key, wrapped } = createDataKey(keyContext(userId, id));
  const { error: credError } = await supabase.from("broker_credentials").insert({
    connection_id: id,
    user_id: userId,
    wrapped_key: wrapped,
    secret: seal(JSON.stringify({ u: input.username, p: input.password }), key, secretContext(userId, id)),
    token: seal(token.accessToken, key, tokenContext(userId, id)),
    token_expires_at: token.expiresAt,
  });
  if (credError) {
    await supabase.from("broker_connections").delete().eq("id", id);
    throw new BrokerError("Could not store the credentials securely", 500);
  }

  try {
    await discoverAccounts(supabase, adapter, userId, id, token.accessToken);
  } catch {
    await supabase.from("broker_connections").update({ state: "error", last_error: "Logged in, but the account list could not be read yet" }).eq("id", id);
  }
  await audit(supabase, "connection.created", id, conn.label);
  return conn as BrokerConnectionView;
}

export async function updatePassword(supabase: SupabaseClient, userId: string, connectionId: string, password: string) {
  if (!hasEncryptionKey()) throw new BrokerError("Secure storage is not configured on this server yet.", 503);
  const { data: conn } = await supabase.from("broker_connections").select("id, broker").eq("id", connectionId).maybeSingle();
  const { data: cred } = await supabase.from("broker_credentials").select("secret, wrapped_key").eq("connection_id", connectionId).maybeSingle();
  if (!conn || !cred) throw new BrokerError("Connection not found", 404);
  await takeLoginAttempt(supabase);

  const oldKey = secretKey(cred.wrapped_key, keyContext(userId, connectionId));
  const { u: username } = JSON.parse(open(cred.secret, oldKey, secretContext(userId, connectionId))) as { u: string };
  const adapter = ADAPTERS[conn.broker as BrokerKind];
  let token: TradovateToken;
  try {
    token = await adapter.login(username, password, connectionId);
  } catch (err) {
    if (err instanceof TradovateAuthError) throw new BrokerError(err.message, 400);
    throw new BrokerError("Could not reach Tradovate. Try again shortly.", 502);
  }

  // A new password gets a new data key, so the old one is retired with it.
  const { key, wrapped } = createDataKey(keyContext(userId, connectionId));
  await supabase
    .from("broker_credentials")
    .update({
      wrapped_key: wrapped,
      secret: seal(JSON.stringify({ u: username, p: password }), key, secretContext(userId, connectionId)),
      token: seal(token.accessToken, key, tokenContext(userId, connectionId)),
      token_expires_at: token.expiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq("connection_id", connectionId);
  await supabase
    .from("broker_connections")
    .update({ state: "connected", last_error: null, updated_at: new Date().toISOString() })
    .eq("id", connectionId);
  await discoverAccounts(supabase, adapter, userId, connectionId, token.accessToken).catch(() => {});
  await audit(supabase, "password.updated", connectionId);
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
  secret: string;
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
  if (!next) {
    // The stored password itself is being used. That is the event worth
    // recording; a token refresh is routine and would only flood the log.
    const { u, p } = JSON.parse(open(cred.secret, key, secretContext(userId, conn.id))) as { u: string; p: string };
    await audit(supabase, "password.used", conn.id, "login to refresh balances");
    next = await adapter.login(u, p, conn.id);
    fresh = true;
  }
  await supabase
    .from("broker_credentials")
    .update({ token: seal(next.accessToken, key, ctx), token_expires_at: next.expiresAt, updated_at: new Date().toISOString() })
    .eq("connection_id", conn.id);
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
    return accounts.map((a) => emptySnapshot(a, conn.last_error ?? "Login rejected. Enter the password again."));
  }
  if (!cred) return accounts.map((a) => emptySnapshot(a, "Credentials missing. Remove and add this login again."));

  const adapter = ADAPTERS[conn.broker];
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
    await supabase.from("broker_credentials").update({ token: null, token_expires_at: null }).eq("connection_id", conn.id);
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
  if (setup === "missing_tables" || setup === "missing_key") return { setup, connections: [], accounts: [] };

  const [connections, { data: accountRows }, { data: credRows }] = await Promise.all([
    listConnections(supabase),
    supabase.from("broker_accounts").select("id, connection_id, environment, external_id, name").order("name"),
    supabase.from("broker_credentials").select("connection_id, secret, wrapped_key, token, token_expires_at"),
  ]);
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
  return { setup, connections: await listConnections(supabase).catch(() => connections), accounts: snapshots };
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
