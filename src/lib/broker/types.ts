/* Shapes shared by the broker API routes and the Live accounts panel.
   Nothing secret ever appears in these types. */

export type BrokerKind = "tradovate" | "mock";
export type BrokerEnvironment = "live" | "demo";
export type ConnectionState = "connected" | "auth_failed" | "error";

export type AuthMethod = "password" | "oauth";

export interface BrokerConnectionView {
  id: string;
  broker: BrokerKind;
  /** "oauth" connections never stored a password. */
  auth_method: AuthMethod;
  label: string;
  username_hint: string;
  state: ConnectionState;
  last_error: string | null;
  last_sync_at: string | null;
  created_at: string;
}

/** One account's normalized numbers. `null` means the broker did not report it; never a guess. */
export interface AccountSnapshot {
  account_id: string;
  connection_id: string;
  label: string;
  environment: BrokerEnvironment;
  external_account_id: number;
  currency: "USD";
  balance: number | null;
  equity: number | null;
  open_pl: number | null;
  day_pl: number | null;
  open_positions_count: number | null;
  connection_state: "connected" | "error";
  last_update_ts: string | null;
  error: string | null;
}

/** Why the feature cannot run yet, so the UI can say so instead of failing. */
export type BrokerSetupIssue = "missing_tables" | "missing_key" | "not_configured";

export interface BrokerAccountsResponse {
  setup: BrokerSetupIssue | null;
  /** True when the Tradovate OAuth flow is available, so the UI offers it. */
  oauth_available: boolean;
  connections: BrokerConnectionView[];
  accounts: AccountSnapshot[];
}
