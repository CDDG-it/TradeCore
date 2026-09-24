import { randomBytes } from "node:crypto";
import { TradovateAuthError, type TradovateToken } from "./tradovate";

/**
 * Tradovate OAuth: the connect flow the trade copiers use.
 *
 * The trader is sent to Tradovate's own site, logs in there and authorises
 * this app. We receive a short-lived code, exchange it for tokens, and store
 * only the refresh token. No password ever reaches TradingMC, and the trader
 * can revoke the app from Tradovate without touching us.
 *
 * Needs partner credentials (client id + secret), which Tradovate issues to
 * approved Ecosystem partners. Without them the flow reports itself as
 * unconfigured rather than half-working.
 */

const AUTHORIZE_URL = "https://trader.tradovate.com/oauth";
// The published example uses /auth/oauthtoken; the partner reference documents
// /v1/auth/oauthtoken. Both are tried, in that order, because only real
// partner credentials can settle which one this app is served by.
const TOKEN_URLS = ["https://live.tradovateapi.com/auth/oauthtoken", "https://live.tradovateapi.com/v1/auth/oauthtoken"];
const TIMEOUT_MS = 10_000;

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export function oauthConfig(): OAuthConfig | null {
  const { TRADOVATE_CLIENT_ID, TRADOVATE_CLIENT_SECRET, NEXT_PUBLIC_SITE_URL } = process.env;
  if (!TRADOVATE_CLIENT_ID || !TRADOVATE_CLIENT_SECRET) return null;
  const site = NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (!site) return null;
  return {
    clientId: TRADOVATE_CLIENT_ID,
    clientSecret: TRADOVATE_CLIENT_SECRET,
    // Must match the redirect URI registered with Tradovate exactly.
    redirectUri: `${site}/api/broker/oauth/callback`,
  };
}

/** Opaque value tying the callback to the browser that started the flow. */
export function newState(): string {
  return randomBytes(32).toString("base64url");
}

export function authorizeUrl(config: OAuthConfig, state: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    state,
  });
  return `${AUTHORIZE_URL}?${params.toString()}`;
}

export interface OAuthTokens extends TradovateToken {
  /** Absent when Tradovate does not rotate it; the stored one stays valid. */
  refreshToken: string | null;
}

interface TokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

async function exchange(config: OAuthConfig, form: Record<string, string>): Promise<OAuthTokens> {
  let lastError = "Tradovate did not accept the authorisation";
  for (const url of TOKEN_URLS) {
    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
        body: new URLSearchParams({ client_id: config.clientId, client_secret: config.clientSecret, ...form }),
        cache: "no-store",
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch {
      throw new TradovateAuthError("Could not reach Tradovate", false);
    }
    // A wrong path answers 404; a wrong grant answers 400. Only the first is
    // worth retrying against the other host.
    if (res.status === 404) continue;

    const body = (await res.json().catch(() => ({}))) as TokenResponse;
    if (!res.ok || !body.access_token) {
      lastError = body.error_description || body.error || `Tradovate responded ${res.status}`;
      throw new TradovateAuthError(lastError, res.status === 400);
    }
    return {
      accessToken: body.access_token,
      expiresAt: new Date(Date.now() + (body.expires_in ?? 3600) * 1000).toISOString(),
      refreshToken: body.refresh_token ?? null,
    };
  }
  throw new TradovateAuthError(lastError, false);
}

export function exchangeCode(config: OAuthConfig, code: string): Promise<OAuthTokens> {
  return exchange(config, { grant_type: "authorization_code", code, redirect_uri: config.redirectUri });
}

export function refreshTokens(config: OAuthConfig, refreshToken: string): Promise<OAuthTokens> {
  return exchange(config, { grant_type: "refresh_token", refresh_token: refreshToken });
}
