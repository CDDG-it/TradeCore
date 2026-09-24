import type { BrokerEnvironment } from "./types";

/**
 * Read-only Tradovate client: the same username/password → access token flow
 * the Tradovate web trader uses, against its REST API.
 *
 * READ-ONLY BY CONSTRUCTION. Every request goes through `call()`, which
 * refuses any path outside READ_ONLY_PATHS. There is no order, position
 * change or account mutation endpoint in this file, and adding one requires
 * editing the allowlist on purpose.
 *
 * Never log credentials or tokens from here: errors carry Tradovate's own
 * message text only.
 */

const HOSTS: Record<BrokerEnvironment, string> = {
  live: "https://live.tradovateapi.com/v1",
  demo: "https://demo.tradovateapi.com/v1",
};

export const READ_ONLY_PATHS = [
  "/auth/accesstokenrequest",
  "/auth/renewaccesstoken",
  "/account/list",
  "/cashBalance/getCashBalanceSnapshot",
  "/position/list",
] as const;
type ReadOnlyPath = (typeof READ_ONLY_PATHS)[number];

const TIMEOUT_MS = 8000;

export class TradovateAuthError extends Error {
  /** true when retrying with the same password cannot work (wrong password, captcha). */
  constructor(message: string, readonly permanent: boolean) {
    super(message);
  }
}

export interface AppCredentials {
  appId: string;
  appVersion: string;
  cid: string;
  sec: string;
}

export function appCredentials(): AppCredentials | null {
  const { TRADOVATE_APP_ID, TRADOVATE_APP_VERSION, TRADOVATE_CID, TRADOVATE_SEC } = process.env;
  if (!TRADOVATE_APP_ID || !TRADOVATE_CID || !TRADOVATE_SEC) return null;
  return { appId: TRADOVATE_APP_ID, appVersion: TRADOVATE_APP_VERSION || "1.0", cid: TRADOVATE_CID, sec: TRADOVATE_SEC };
}

export interface TradovateToken {
  accessToken: string;
  expiresAt: string;
}

async function call<T>(
  env: BrokerEnvironment,
  path: ReadOnlyPath,
  init: { method: "GET" | "POST"; token?: string; body?: unknown }
): Promise<T> {
  if (!(READ_ONLY_PATHS as readonly string[]).includes(path)) {
    throw new Error("Blocked: not a read-only Tradovate endpoint");
  }
  const res = await fetch(HOSTS[env] + path, {
    method: init.method,
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(init.token ? { Authorization: `Bearer ${init.token}` } : {}),
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (res.status === 401) throw new TradovateAuthError("Tradovate session expired", false);
  if (!res.ok) throw new Error(`Tradovate ${path} responded ${res.status}`);
  return (await res.json()) as T;
}

interface AccessTokenResponse {
  accessToken?: string;
  expirationTime?: string;
  errorText?: string;
  "p-ticket"?: string;
  "p-time"?: number;
  "p-captcha"?: boolean;
}

export async function login(username: string, password: string, deviceId: string): Promise<TradovateToken> {
  const app = appCredentials();
  if (!app) throw new Error("Tradovate app credentials are not configured");

  const body: Record<string, unknown> = {
    name: username,
    password,
    appId: app.appId,
    appVersion: app.appVersion,
    cid: app.cid,
    sec: app.sec,
    deviceId,
  };

  // Tradovate throttles logins with a "penalty ticket": wait p-time seconds and
  // resend with the ticket. A captcha cannot be solved from a server.
  for (let attempt = 0; attempt < 2; attempt++) {
    const r = await call<AccessTokenResponse>("live", "/auth/accesstokenrequest", { method: "POST", body });
    if (r.accessToken && r.expirationTime) return { accessToken: r.accessToken, expiresAt: r.expirationTime };
    if (r["p-captcha"]) {
      throw new TradovateAuthError(
        "Tradovate wants a captcha for this login. Log in once at trader.tradovate.com, then reconnect here.",
        true
      );
    }
    if (r["p-ticket"] && attempt === 0) {
      const wait = Math.min(Number(r["p-time"] ?? 1), 10);
      await new Promise((ok) => setTimeout(ok, wait * 1000));
      body["p-ticket"] = r["p-ticket"];
      continue;
    }
    throw new TradovateAuthError(r.errorText || "Tradovate rejected the login", true);
  }
  throw new TradovateAuthError("Tradovate is throttling logins. Try again in a minute.", false);
}

export async function renew(token: string): Promise<TradovateToken> {
  const r = await call<AccessTokenResponse>("live", "/auth/renewaccesstoken", { method: "GET", token });
  if (!r.accessToken || !r.expirationTime) throw new TradovateAuthError("Token renewal failed", false);
  return { accessToken: r.accessToken, expiresAt: r.expirationTime };
}

export interface TradovateAccount {
  environment: BrokerEnvironment;
  id: number;
  name: string;
  active: boolean;
}

/**
 * Accounts on both servers: prop evaluation and sim-funded accounts live on
 * Tradovate's demo server, real-money ones on live. A failing server is
 * skipped so the other still reports.
 */
export async function listAccounts(token: string): Promise<TradovateAccount[]> {
  const envs: BrokerEnvironment[] = ["live", "demo"];
  const results = await Promise.allSettled(
    envs.map((env) => call<{ id: number; name: string; active?: boolean; archived?: boolean }[]>(env, "/account/list", { method: "GET", token }))
  );
  const out: TradovateAccount[] = [];
  results.forEach((r, i) => {
    if (r.status !== "fulfilled" || !Array.isArray(r.value)) return;
    for (const a of r.value) {
      if (a.archived) continue;
      out.push({ environment: envs[i], id: a.id, name: a.name, active: a.active !== false });
    }
  });
  if (out.length === 0 && results.every((r) => r.status === "rejected")) {
    const first = results[0] as PromiseRejectedResult;
    throw first.reason;
  }
  return out;
}

interface CashBalanceSnapshot {
  errorText?: string;
  totalCashValue?: number;
  netLiq?: number;
  openPnL?: number;
  realizedPnL?: number;
  totalPnL?: number;
}

const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

export interface AccountFigures {
  balance: number | null;
  equity: number | null;
  open_pl: number | null;
  day_pl: number | null;
}

export async function cashBalance(token: string, env: BrokerEnvironment, accountId: number): Promise<AccountFigures> {
  const r = await call<CashBalanceSnapshot>(env, "/cashBalance/getCashBalanceSnapshot", {
    method: "POST",
    token,
    body: { accountId },
  });
  if (r.errorText) throw new Error(r.errorText);
  const balance = num(r.totalCashValue);
  const equity = num(r.netLiq);
  const open_pl = num(r.openPnL) ?? (balance !== null && equity !== null ? equity - balance : null);
  const realized = num(r.realizedPnL);
  const day_pl = num(r.totalPnL) ?? (realized !== null && open_pl !== null ? realized + open_pl : null);
  return { balance, equity, open_pl, day_pl };
}

/** Open positions per account id on one server. */
export async function openPositionCounts(token: string, env: BrokerEnvironment): Promise<Map<number, number>> {
  const positions = await call<{ accountId: number; netPos: number }[]>(env, "/position/list", { method: "GET", token });
  const counts = new Map<number, number>();
  for (const p of positions ?? []) {
    if (p.netPos) counts.set(p.accountId, (counts.get(p.accountId) ?? 0) + 1);
  }
  return counts;
}
