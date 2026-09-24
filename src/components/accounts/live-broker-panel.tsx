"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { KeyRound, Link2, Loader2, Lock, Plus, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mask } from "@/lib/use-privacy";
import { cn } from "@/lib/utils";
import type { AccountSnapshot, BrokerAccountsResponse, BrokerConnectionView } from "@/lib/broker/types";

/**
 * Live accounts: read-only balance, equity and P&L straight from Tradovate.
 * Polls /api/broker/accounts every 15s while the tab is visible. A failed read
 * keeps the last good numbers on screen, greyed out as stale, rather than
 * blanking them or inventing new ones.
 */

const POLL_MS = 15_000;
const STALE_MS = 30_000;

const money = (n: number | null, hidden: boolean) =>
  n === null ? "n/a" : mask(n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }), hidden);

const signedMoney = (n: number | null, hidden: boolean) =>
  n === null ? "n/a" : mask(`${n > 0 ? "+" : n < 0 ? "-" : ""}${Math.abs(n).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 })}`, hidden);

const plColor = (n: number | null) =>
  n === null ? undefined : n > 0 ? "var(--win)" : n < 0 ? "var(--loss)" : "var(--be)";

function ago(ts: string | null, now: number): string {
  if (!ts) return "never";
  const s = Math.max(0, Math.round((now - Date.parse(ts)) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

async function send(url: string, method: "POST" | "PATCH" | "DELETE", body?: unknown): Promise<string | null> {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.ok) return null;
  const data = await res.json().catch(() => ({}));
  return typeof data.error === "string" ? data.error : "Something went wrong. Try again.";
}

export function LiveBrokerPanel({ hidden }: { hidden: boolean }) {
  const [data, setData] = useState<BrokerAccountsResponse | null>(null);
  const [lastGood, setLastGood] = useState<Record<string, AccountSnapshot>>({});
  const [loadError, setLoadError] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [connectOpen, setConnectOpen] = useState(false);
  const [outcome, setOutcome] = useState<{ ok: boolean; text: string } | null>(null);
  const [passwordFor, setPasswordFor] = useState<BrokerConnectionView | null>(null);
  const inFlight = useRef(false);

  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const res = await fetch("/api/broker/accounts", { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const next = (await res.json()) as BrokerAccountsResponse;
      setData(next);
      setLoadError(false);
      setLastGood((prev) => {
        const merged: Record<string, AccountSnapshot> = {};
        for (const s of next.accounts) {
          merged[s.account_id] = s.connection_state === "connected" ? s : prev[s.account_id] ?? s;
        }
        return merged;
      });
    } catch {
      setLoadError(true);
    } finally {
      inFlight.current = false;
    }
  }, []);

  // The OAuth callback returns here with its result in the address bar.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const result = params.get("broker");
    if (!result) return;
    setOutcome(
      result === "connected"
        ? { ok: true, text: "Tradovate connected. Your accounts are loading." }
        : result === "cancelled"
        ? { ok: false, text: "Authorisation cancelled." }
        : { ok: false, text: params.get("reason") || "The authorisation did not complete." }
    );
    params.delete("broker");
    params.delete("reason");
    const rest = params.toString();
    window.history.replaceState({}, "", window.location.pathname + (rest ? `?${rest}` : ""));
  }, []);

  useEffect(() => {
    refresh();
    const poll = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, POLL_MS);
    const tick = setInterval(() => setNow(Date.now()), 1000);
    const onVisible = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(poll);
      clearInterval(tick);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  const connections = data?.connections ?? [];
  const accounts = (data?.accounts ?? []).map((s) => {
    const shown = lastGood[s.account_id] ?? s;
    return { live: s, shown };
  });
  const fresh = accounts.filter(({ shown }) => shown.last_update_ts && now - Date.parse(shown.last_update_ts) < STALE_MS);
  const sum = (k: "balance" | "equity" | "day_pl") =>
    fresh.length && fresh.every(({ shown }) => shown[k] !== null)
      ? fresh.reduce((t, { shown }) => t + (shown[k] as number), 0)
      : null;

  const setup = data?.setup ?? null;
  const oauthAvailable = data?.oauth_available ?? false;
  const canConnect = data !== null && setup === null;

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="relative flex size-2">
            {fresh.length > 0 && <span className="absolute inline-flex size-full animate-ping rounded-full bg-success/60" />}
            <span className={cn("relative inline-flex size-2 rounded-full", fresh.length > 0 ? "bg-success" : "bg-muted-foreground/40")} />
          </span>
          <h2 className="text-sm font-semibold tracking-tight">Live accounts</h2>
          <span className="inline-flex items-center gap-1 rounded-full border border-border/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            <Lock className="size-2.5" /> Tradovate · read-only
          </span>
        </div>
        <div className="flex items-center gap-2">
          {connections.length > 0 && (
            <button
              type="button"
              onClick={refresh}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
              title="Refresh now"
            >
              <RefreshCw className="size-3" /> Refresh
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              // OAuth leaves the app: the trader signs in at Tradovate itself
              // and we never see the password.
              if (oauthAvailable) window.location.href = "/api/broker/oauth/start";
              else setConnectOpen(true);
            }}
            disabled={!canConnect}
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-all hover:-translate-y-px hover:bg-primary/15 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          >
            <Link2 className="size-3.5" /> Connect Tradovate
          </button>
        </div>
      </div>

      {outcome && (
        <div
          className={cn(
            "flex items-start justify-between gap-3 rounded-xl border p-3 text-xs",
            outcome.ok ? "border-success/40 bg-success/5 text-success" : "border-destructive/40 bg-destructive/5 text-destructive"
          )}
        >
          <span>{outcome.text}</span>
          <button type="button" onClick={() => setOutcome(null)} className="shrink-0 opacity-60 hover:opacity-100">
            Dismiss
          </button>
        </div>
      )}

      {data === null && !loadError && (
        <div className="flex h-24 items-center justify-center rounded-xl border border-border/50 bg-card">
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        </div>
      )}

      {data === null && loadError && (
        <div className="rounded-xl border border-border/50 bg-card p-5 text-sm text-muted-foreground">
          Live accounts could not be loaded. They will retry automatically.
        </div>
      )}

      {setup && <SetupNotice issue={setup} />}

      {data && !setup && connections.length === 0 && (
        <div className="rounded-xl border border-dashed border-border/70 bg-card/60 p-6 text-center">
          <ShieldCheck className="mx-auto mb-2 size-5 text-primary" />
          <p className="text-sm font-medium">See every prop account live, in one place</p>
          <p className="mx-auto mt-1 max-w-md text-xs text-muted-foreground">
            {oauthAvailable
              ? "You sign in at Tradovate itself and authorise TradingMC there, so your password never reaches us. Balances, equity and P&L update every 15 seconds. Read-only: nothing here can place or change an order."
              : "Connect the Tradovate login your firm gave you. Balances, equity and P&L update every 15 seconds. Read-only: nothing here can place or change an order."}
          </p>
        </div>
      )}

      {accounts.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Balance", value: money(sum("balance"), hidden) },
              { label: "Equity", value: money(sum("equity"), hidden) },
              { label: "Day P&L", value: signedMoney(sum("day_pl"), hidden), color: plColor(sum("day_pl")) },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-border/50 bg-card p-3 text-center sm:p-4">
                <p className="font-mono text-sm font-bold sm:text-lg" style={{ color: s.color }}>{s.value}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{s.label} · {fresh.length} live</p>
              </div>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {accounts.map(({ live, shown }) => {
              const stale = !shown.last_update_ts || now - Date.parse(shown.last_update_ts) >= STALE_MS;
              return (
                <div
                  key={live.account_id}
                  className={cn(
                    "rounded-2xl border bg-card p-4 transition-opacity",
                    stale ? "border-border/40 opacity-55" : "border-success/30"
                  )}
                >
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{shown.label}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {connections.find((c) => c.id === live.connection_id)?.label}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                        live.environment === "live" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                      )}
                    >
                      {live.environment === "live" ? "Live" : "Sim"}
                    </span>
                  </div>
                  <p className="font-mono text-xl font-bold tracking-tight">{money(shown.balance, hidden)}</p>
                  <p className="mb-3 text-[11px] text-muted-foreground">Balance</p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <Figure label="Equity" value={money(shown.equity, hidden)} />
                    <Figure label="Open P&L" value={signedMoney(shown.open_pl, hidden)} color={plColor(shown.open_pl)} />
                    <Figure label="Day P&L" value={signedMoney(shown.day_pl, hidden)} color={plColor(shown.day_pl)} />
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2 text-[10px] text-muted-foreground">
                    <span>
                      {shown.open_positions_count === null
                        ? "Positions n/a"
                        : `${shown.open_positions_count} open position${shown.open_positions_count === 1 ? "" : "s"}`}
                    </span>
                    <span className={cn(live.error && "text-destructive")} title={live.error ?? undefined}>
                      {live.error && stale ? live.error : `Updated ${ago(shown.last_update_ts, now)}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {connections.length > 0 && (
        <ConnectionList
          connections={connections}
          onPassword={setPasswordFor}
          onChanged={refresh}
        />
      )}

      <ConnectDialog open={connectOpen} onOpenChange={setConnectOpen} onConnected={refresh} />
      <PasswordDialog connection={passwordFor} onClose={() => setPasswordFor(null)} onSaved={refresh} />
    </section>
  );
}

function Figure({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="min-w-0">
      <p className="truncate font-mono font-semibold" style={{ color }}>{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

function SetupNotice({ issue }: { issue: NonNullable<BrokerAccountsResponse["setup"]> }) {
  const text = {
    missing_tables: "Live accounts need a database update. Run broker_connections.sql, broker_hardening.sql and broker_oauth.sql from the sql folder in the Supabase SQL editor.",
    missing_key: "Secure credential storage is not configured on the server yet (BROKER_ENCRYPTION_KEY).",
    not_configured: "The Tradovate app credentials are not configured on the server yet.",
  }[issue];
  return <div className="rounded-xl border border-border/50 bg-card p-4 text-xs text-muted-foreground">{text}</div>;
}

const STATE_STYLE: Record<BrokerConnectionView["state"], { label: string; className: string }> = {
  connected: { label: "Connected", className: "text-success" },
  error: { label: "Retrying", className: "text-warning" },
  auth_failed: { label: "Login rejected", className: "text-destructive" },
};

function ConnectionList({
  connections,
  onPassword,
  onChanged,
}: {
  connections: BrokerConnectionView[];
  onPassword: (c: BrokerConnectionView) => void;
  onChanged: () => void;
}) {
  const [confirming, setConfirming] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function remove(id: string) {
    setBusy(id);
    setError(await send(`/api/broker/connections/${id}`, "DELETE"));
    setBusy(null);
    setConfirming(null);
    onChanged();
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card">
      <p className="border-b border-border/40 px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        Connected logins
      </p>
      <ul className="divide-y divide-border/40">
        {connections.map((c) => {
          const state = STATE_STYLE[c.state];
          return (
            <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {c.label} <span className="font-mono text-xs text-muted-foreground">{c.username_hint}</span>
                  {c.auth_method === "oauth" && (
                    <span className="ml-2 rounded-full bg-success/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-success">
                      no password stored
                    </span>
                  )}
                  {c.broker === "mock" && <span className="ml-2 text-[10px] uppercase text-muted-foreground">dev mock</span>}
                </p>
                <p className="text-[11px]">
                  <span className={state.className}>{state.label}</span>
                  {c.last_error && c.state !== "connected" && <span className="text-muted-foreground"> · {c.last_error}</span>}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                {confirming === c.id ? (
                  <>
                    <span className="text-xs text-muted-foreground">Remove login and its history?</span>
                    <Button size="xs" variant="destructive" disabled={busy === c.id} onClick={() => remove(c.id)}>
                      {busy === c.id ? <Loader2 className="animate-spin" /> : "Remove"}
                    </Button>
                    <Button size="xs" variant="ghost" onClick={() => setConfirming(null)}>Cancel</Button>
                  </>
                ) : (
                  <>
                    {c.auth_method === "oauth" ? (
                      <Button
                        size="xs"
                        variant={c.state === "auth_failed" ? "default" : "ghost"}
                        onClick={() => (window.location.href = "/api/broker/oauth/start")}
                      >
                        <ShieldCheck /> Reauthorise
                      </Button>
                    ) : (
                      <Button size="xs" variant={c.state === "auth_failed" ? "default" : "ghost"} onClick={() => onPassword(c)}>
                        <KeyRound /> {c.state === "auth_failed" ? "Re-enter password" : "Password"}
                      </Button>
                    )}
                    <Button size="icon-xs" variant="ghost" onClick={() => setConfirming(c.id)} aria-label={`Remove ${c.label}`}>
                      <Trash2 />
                    </Button>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {error && <p className="px-4 pb-3 text-xs text-destructive">{error}</p>}
    </div>
  );
}

function SecurityNotes() {
  return (
    <ul className="space-y-1.5 rounded-lg border border-border/50 bg-muted/30 p-3 text-[11px] text-muted-foreground">
      <li className="flex gap-2"><Lock className="mt-0.5 size-3 shrink-0 text-primary" /> Encrypted with AES-256 before it is stored. The key never leaves the server.</li>
      <li className="flex gap-2"><ShieldCheck className="mt-0.5 size-3 shrink-0 text-primary" /> Read-only: TradingMC can see balances and P&L, never place or change orders.</li>
      <li className="flex gap-2"><Trash2 className="mt-0.5 size-3 shrink-0 text-primary" /> Remove the login any time; the stored credentials are deleted with it.</li>
    </ul>
  );
}

function ConnectDialog({
  open,
  onOpenChange,
  onConnected,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onConnected: () => void;
}) {
  const [label, setLabel] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function close(o: boolean) {
    onOpenChange(o);
    if (!o) {
      // Never keep a password in memory longer than the dialog.
      setPassword("");
      setError(null);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const err = await send("/api/broker/connections", "POST", { label, username, password });
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    setLabel("");
    setUsername("");
    close(false);
    onConnected();
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Connect Tradovate</DialogTitle>
            <DialogDescription>
              Use the Tradovate login from your prop firm (Lucid, MyFundedFutures and others). Every account under it shows up automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="bk-label">Name</Label>
            <Input id="bk-label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. MFF 100k" maxLength={60} autoComplete="off" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="bk-user">Tradovate username</Label>
            <Input id="bk-user" value={username} onChange={(e) => setUsername(e.target.value)} required maxLength={120} autoComplete="off" spellCheck={false} autoCapitalize="none" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="bk-pass">Tradovate password</Label>
            <Input id="bk-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required maxLength={200} autoComplete="off" />
          </div>
          <SecurityNotes />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => close(false)}>Cancel</Button>
            <Button type="submit" disabled={busy || !username || !password}>
              {busy ? <Loader2 className="animate-spin" /> : <Plus />} Connect
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PasswordDialog({
  connection,
  onClose,
  onSaved,
}: {
  connection: BrokerConnectionView | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function close() {
    setPassword("");
    setError(null);
    onClose();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!connection) return;
    setBusy(true);
    setError(null);
    const err = await send(`/api/broker/connections/${connection.id}`, "PATCH", { password });
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    close();
    onSaved();
  }

  return (
    <Dialog open={connection !== null} onOpenChange={(o) => !o && close()}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Update password</DialogTitle>
            <DialogDescription>
              {connection?.label} <span className="font-mono">{connection?.username_hint}</span>. The new password is checked with Tradovate before it is saved.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="bk-newpass">Tradovate password</Label>
            <Input id="bk-newpass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required maxLength={200} autoComplete="off" />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={close}>Cancel</Button>
            <Button type="submit" disabled={busy || !password}>
              {busy ? <Loader2 className="animate-spin" /> : <KeyRound />} Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
