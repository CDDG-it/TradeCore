# Broker integrations: deployment

1. Run `sql/broker_trade_imports.sql` in the Supabase SQL editor after the existing broker migrations. It removes all saved password credentials, keeps account snapshots/history, and blocks direct browser access to encrypted credentials.
2. Set `BROKER_ENCRYPTION_KEY` and `SUPABASE_SERVICE_ROLE_KEY` in the server environment. Never expose the service role key with a `NEXT_PUBLIC_` prefix. The service role is used only inside authenticated broker routes, with explicit user ID filters.
3. Register the Tradovate OAuth application with account, order and fill **read** permissions and **deny order placement/modification, account modification and other write permissions**. Verify these permissions in Tradovate's application settings. Only then set `TRADOVATE_OAUTH_READ_ONLY_CONFIRMED=true` plus `TRADOVATE_CLIENT_ID`, `TRADOVATE_CLIENT_SECRET` and `NEXT_PUBLIC_SITE_URL`. Register the exact callback URL `<site>/api/broker/oauth/callback`.
4. Password-based Tradovate connections will show "Reconnect with OAuth". Historical account data remains until the user removes the connection. The browser receives only connection metadata, account snapshots and imported trade fields; never broker tokens or encrypted credentials.

TopstepX uses its export file. Its ProjectX API key grants trading access, so the application neither asks for nor stores that key. Rithmic uses CSV import until production API access and conformance are available. Generic CSV mapping supports other futures firms. The CSV is parsed locally and only selected fields are submitted. Date/time values without a timezone use the offset selected in the importer.

Tradovate trade sync runs while Accounts is open, at most once per five minutes per connection. It pairs closed fills by account and contract. Net P&L remains blank because fills alone do not establish all account-specific fees; the user reviews it in the inbox before creating a journal entry.
