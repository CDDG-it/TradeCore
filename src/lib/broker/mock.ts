import type { BrokerEnvironment } from "./types";
import { TradovateAuthError, type AccountFigures, type TradovateAccount, type TradovateToken } from "./tradovate";

/**
 * Local-development stand-in for Tradovate: two sim accounts whose balance
 * drifts with the clock, so the Live accounts panel can be exercised without
 * real credentials. Only reachable when NODE_ENV is not production.
 * Password "wrong" simulates a rejected login.
 */

const ACCOUNTS: (TradovateAccount & { base: number })[] = [
  { environment: "demo", id: 900001, name: "MFF-100K-01", active: true, base: 100_000 },
  { environment: "demo", id: 900002, name: "LUCID-50K-02", active: true, base: 50_000 },
];

export async function login(_username: string, password: string): Promise<TradovateToken> {
  if (password === "wrong") throw new TradovateAuthError("Incorrect username or password", true);
  return renew();
}

export async function renew(): Promise<TradovateToken> {
  return { accessToken: "mock-token", expiresAt: new Date(Date.now() + 60 * 60_000).toISOString() };
}

export async function listAccounts(): Promise<TradovateAccount[]> {
  return ACCOUNTS.map(({ base: _base, ...a }) => a);
}

export async function cashBalance(_token: string, _env: BrokerEnvironment, accountId: number): Promise<AccountFigures> {
  const acct = ACCOUNTS.find((a) => a.id === accountId);
  if (!acct) throw new Error("Unknown mock account");
  const t = Date.now() / 1000;
  const scale = acct.base / 100_000;
  const balance = round(acct.base + 1_240 * scale + Math.sin(t / 900) * 300 * scale);
  const open_pl = round(Math.sin(t / 45 + accountId) * 420 * scale);
  return { balance, equity: round(balance + open_pl), open_pl, day_pl: round(1_240 * scale + open_pl) };
}

export async function openPositionCounts(): Promise<Map<number, number>> {
  return new Map([[900001, 2]]);
}

const round = (n: number) => Math.round(n * 100) / 100;
