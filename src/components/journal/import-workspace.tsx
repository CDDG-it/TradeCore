"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, FileUp, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { PageWrapper } from "@/components/ui/page-wrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IMPORT_FIELDS, parseCsv, parseDirection, parseNumber, parseTimestamp, suggestColumns, type ImportField } from "@/lib/broker/csv";
import { isComplete, type ImportedTrade, type ImportTradeInput } from "@/lib/broker/imports";
import { getAccounts } from "@/lib/supabase/queries";
import type { FundedAccount } from "@/lib/types";

type Source = "topstepx" | "rithmic" | "csv";
const LABELS: Record<ImportField, string> = {
  external_account: "Account", instrument: "Instrument", direction: "Direction", quantity: "Contracts", entry_date: "Entry date (if separate)", exit_date: "Exit date (if separate)",
  entry_time: "Entry time", exit_time: "Exit time", entry_price: "Entry price", exit_price: "Exit price",
  pnl: "Net P&L", fees: "Fees", source_id: "Trade ID",
};

async function api(url: string, method: "POST" | "PATCH", body: unknown) {
  const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}

export function ImportWorkspace() {
  const [source, setSource] = useState<Source>("topstepx");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<ImportField, string>>(() => suggestColumns([]));
  const [offset, setOffset] = useState("+00:00");
  const [accountFallback, setAccountFallback] = useState("");
  const [imports, setImports] = useState<ImportedTrade[]>([]);
  const [accounts, setAccounts] = useState<FundedAccount[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [checked, setChecked] = useState<{ signature: string; duplicates: number } | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [edit, setEdit] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const all: ImportedTrade[] = [];
    for (let offset = 0; offset < 5000; offset += 500) {
      const response = await fetch(`/api/broker/imports?offset=${offset}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Import inbox is not available. Run broker_trade_imports.sql in Supabase.");
      const data = await response.json();
      all.push(...data.trades);
      if (!data.has_more) break;
    }
    setImports(all);
  }, []);
  useEffect(() => { void load().catch((e) => setMessage(e.message)); void getAccounts().then(setAccounts).catch(() => {}); }, [load]);

  async function chooseFile(file: File | undefined) {
    if (!file) return;
    setMessage("");
    if (file.size > 5_000_000) { setMessage("Choose a CSV smaller than 5 MB."); return; }
    try {
      const parsed = parseCsv((await file.text()).replace(/^\uFEFF/, ""));
      if (parsed.length < 2) throw new Error("The file has no trade rows.");
      setHeaders(parsed[0]); setRows(parsed.slice(1)); setMapping(suggestColumns(parsed[0]));
    } catch (e) { setMessage(e instanceof Error ? e.message : "Could not read CSV"); }
  }

  const normalized = useMemo(() => rows.map((row) => {
    const value = (field: ImportField) => {
      const i = headers.indexOf(mapping[field]);
      return i < 0 ? "" : row[i] ?? "";
    };
    const result: ImportTradeInput = {
      source_id: value("source_id") || undefined,
      external_account: value("external_account") || accountFallback.trim(),
      instrument: value("instrument"),
      direction: parseDirection(value("direction")),
      quantity: parseNumber(value("quantity")),
      entry_time: parseTimestamp([value("entry_date"), value("entry_time")].filter(Boolean).join(" "), offset),
      exit_time: parseTimestamp([value("exit_date"), value("exit_time")].filter(Boolean).join(" "), offset),
      entry_price: parseNumber(value("entry_price")),
      exit_price: parseNumber(value("exit_price")),
      pnl: parseNumber(value("pnl")), fees: parseNumber(value("fees")),
    };
    return result;
  }), [headers, mapping, rows, offset, accountFallback]);
  const valid = normalized.filter((row) => row.external_account && row.instrument);
  const incomplete = valid.filter((row) => !isComplete(row)).length;
  const signature = JSON.stringify([source, valid]);
  const pending = imports.filter((row) => row.status === "pending");

  async function saveFile(preview: boolean) {
    if (!valid.length) { setMessage("Map at least account, instrument and contracts before importing."); return; }
    if (valid.length > 5000) { setMessage("This export has more than 5,000 trades. Split it by date range before importing."); return; }
    setBusy(true); setMessage("");
    try {
      let duplicates = 0;
      for (let i = 0; i < valid.length; i += preview ? valid.length : 500) {
        const result = await api("/api/broker/imports", "POST", { source, trades: valid.slice(i, i + (preview ? valid.length : 500)), preview });
        duplicates += result.duplicates ?? 0;
      }
      if (preview) setChecked({ signature, duplicates });
      else {
        setMessage(`${valid.length - duplicates} new trades added to the inbox; ${duplicates} duplicates skipped.`);
        setRows([]); setHeaders([]); setChecked(null);
        await load();
      }
    } catch (e) { setMessage(e instanceof Error ? e.message : "Import failed"); }
    finally { setBusy(false); }
  }

  async function action(id: string, name: "accept" | "ignore" | "edit", values?: Record<string, unknown>) {
    setBusy(true); setMessage("");
    try {
      await api(`/api/broker/imports/${id}`, "PATCH", { action: name, values });
      setEditing(null); setEdit({}); await load();
    } catch (e) { setMessage(e instanceof Error ? e.message : "Could not update trade"); }
    finally { setBusy(false); }
  }

  function startEdit(row: ImportedTrade) {
    setEditing(row.id);
    setEdit({
      direction: row.direction ?? "", quantity: row.quantity?.toString() ?? "",
      entry_time: row.entry_time?.slice(0, 16) ?? "", exit_time: row.exit_time?.slice(0, 16) ?? "",
      entry_price: row.entry_price?.toString() ?? "", exit_price: row.exit_price?.toString() ?? "",
      pnl: row.pnl?.toString() ?? "", fees: row.fees?.toString() ?? "",
      funded_account_id: row.funded_account_id ?? "",
    });
  }

  function saveEdit(id: string) {
    const numeric = ["quantity", "entry_price", "exit_price", "pnl", "fees"] as const;
    const values: Record<string, unknown> = {
      direction: edit.direction || null,
      entry_time: edit.entry_time ? parseTimestamp(edit.entry_time, "+00:00") : null,
      exit_time: edit.exit_time ? parseTimestamp(edit.exit_time, "+00:00") : null,
      funded_account_id: edit.funded_account_id || null,
    };
    for (const field of numeric) values[field] = edit[field] ? parseNumber(edit[field]) : null;
    void action(id, "edit", values);
  }

  return <div className="space-y-6">
    <PageHeader badge="Trading" title="Import trades" subtitle="Review broker executions before adding them to your journal"
      action={<Link href="/journal" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Journal</Link>} />
    <PageWrapper>
      <section className="space-y-4 rounded-2xl border border-border/60 bg-card p-5">
        <div>
          <h2 className="text-sm font-semibold">Upload a broker export</h2>
          <p className="mt-1 text-xs text-muted-foreground">The CSV is read in your browser. Only mapped trade fields are saved. No file or login is stored.</p>
          <p className="mt-2 text-xs text-primary/90">{source === "topstepx" ? "In TopstepX, open Orders or Trades, choose Export, and upload that file here. No ProjectX API key is needed." : source === "rithmic" ? "Use a trade or fill history export from your Rithmic platform. Direct Rithmic login is not requested." : "Use a CSV trade export from your futures platform and map its columns below."}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="grid gap-1 text-xs">Platform
            <select className="h-10 rounded-lg border border-border bg-background px-3 text-sm" value={source} onChange={(e) => setSource(e.target.value as Source)}>
              <option value="topstepx">TopstepX</option><option value="rithmic">Rithmic</option><option value="csv">Other futures platform</option>
            </select>
          </label>
          <label className="grid gap-1 text-xs">Timezone for dates without an offset
            <Input value={offset} onChange={(e) => setOffset(e.target.value)} pattern="[+-][0-9]{2}:[0-9]{2}" placeholder="+00:00" />
          </label>
          <label className="grid gap-1 text-xs">Account if absent from CSV
            <Input value={accountFallback} onChange={(e) => setAccountFallback(e.target.value)} placeholder="e.g. Topstep 50K" maxLength={120} />
          </label>
          <label className="grid gap-1 text-xs">CSV file
            <Input type="file" accept=".csv,text/csv" onChange={(e) => void chooseFile(e.target.files?.[0])} />
          </label>
        </div>
        {headers.length > 0 && <>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {IMPORT_FIELDS.map((field) => <label key={field} className="grid gap-1 text-xs">{LABELS[field]}
              <select className="h-9 rounded-lg border border-border bg-background px-2 text-sm" value={mapping[field]}
                onChange={(e) => setMapping((prev) => ({ ...prev, [field]: e.target.value }))}>
                <option value="">Not in file</option>{headers.map((h, i) => <option key={`${h}-${i}`} value={h}>{h}</option>)}
              </select>
            </label>)}
          </div>
          <p className="text-xs text-muted-foreground">{rows.length} rows · {valid.length} valid for inbox · {incomplete} need details before journaling</p>
          <div className="overflow-x-auto rounded-lg border border-border/50"><table className="w-full min-w-[640px] text-left text-xs"><thead className="bg-muted/30"><tr><th className="p-2">Account</th><th>Instrument</th><th>Side</th><th>Entry</th><th>Exit</th><th>P&L</th></tr></thead><tbody>{normalized.slice(0, 5).map((row, i) => <tr className="border-t border-border/40" key={i}><td className="p-2">{row.external_account || "Missing"}</td><td>{row.instrument || "Missing"}</td><td>{row.direction || "Missing"}</td><td>{row.entry_time || "Missing"}</td><td>{row.exit_time || "Missing"}</td><td>{row.pnl ?? "Missing"}</td></tr>)}</tbody></table></div>
          {checked?.signature === signature && <p className="text-xs text-muted-foreground">{checked.duplicates} duplicates · {valid.length - checked.duplicates} new trades</p>}
          <div className="flex gap-2"><Button variant="outline" disabled={busy || !valid.length} onClick={() => void saveFile(true)}>Check duplicates</Button>
          <Button disabled={busy || !valid.length || checked?.signature !== signature} onClick={() => void saveFile(false)}><FileUp className="size-4" /> Import to inbox</Button></div>
        </>}
      </section>
      {message && <p role="status" className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">{message}</p>}
      <section className="space-y-3">
        <div className="flex items-center justify-between"><h2 className="text-sm font-semibold">Import inbox <span className="text-muted-foreground">({pending.length})</span></h2><Button size="sm" variant="ghost" onClick={() => void load()}><RefreshCw className="size-4" /> Refresh</Button></div>
        {pending.length === 0 && <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No trades waiting for review.</p>}
        {pending.map((row) => <article key={row.id} className="rounded-xl border border-border/60 bg-card p-4">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-semibold">{row.instrument} · {row.direction ?? "Direction missing"} · {row.quantity ?? "?"} contracts</p><p className="mt-1 text-xs text-muted-foreground">{row.source} · {row.external_account} · {row.entry_time ? new Date(row.entry_time).toLocaleString() : "Entry time missing"}</p></div><p className="font-mono text-sm">{row.pnl === null ? "P&L missing" : `$${row.pnl.toFixed(2)}`}</p></div>
          {!isComplete(row) && <p className="mt-2 text-xs text-warning">Complete missing fields before adding this trade to the journal.</p>}
          {editing === row.id && <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {(["direction", "quantity", "entry_time", "exit_time", "entry_price", "exit_price", "pnl", "fees"] as const).map((field) => <label key={field} className="grid gap-1 text-xs capitalize">{field.replace("_", " ")}
              {field === "direction" ? <select className="h-9 rounded-lg border border-border bg-background px-2" value={edit[field]} onChange={(e) => setEdit((prev) => ({ ...prev, [field]: e.target.value }))}><option value="">Unknown</option><option value="long">Long</option><option value="short">Short</option></select> : <Input type={field.endsWith("time") ? "datetime-local" : "number"} step="any" value={edit[field]} onChange={(e) => setEdit((prev) => ({ ...prev, [field]: e.target.value }))} />}
            </label>)}
            <label className="grid gap-1 text-xs">Funded account<select className="h-9 rounded-lg border border-border bg-background px-2" value={edit.funded_account_id} onChange={(e) => setEdit((prev) => ({ ...prev, funded_account_id: e.target.value }))}><option value="">None</option>{accounts.map((a) => <option key={a.id} value={a.id}>{a.firm_name} · {a.account_name}</option>)}</select></label>
            <div className="flex items-end"><Button size="sm" disabled={busy} onClick={() => saveEdit(row.id)}><Check className="size-4" /> Save details</Button></div>
          </div>}
          <div className="mt-3 flex gap-2"><Button size="sm" variant="outline" onClick={() => editing === row.id ? setEditing(null) : startEdit(row)}>{editing === row.id ? "Cancel edit" : "Edit / link account"}</Button><Button size="sm" disabled={busy || !isComplete(row)} onClick={() => void action(row.id, "accept")}>Add to journal</Button><Button size="sm" variant="ghost" disabled={busy} onClick={() => void action(row.id, "ignore")}>Ignore</Button></div>
        </article>)}
      </section>
    </PageWrapper>
  </div>;
}
