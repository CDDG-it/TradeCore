"use client";

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { AlertTriangle, CheckCircle2, Database, Loader2, Play, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  migrateBase64Screenshots,
  scanBase64Screenshots,
  type MigrateResult,
  type ScanResult,
} from "@/lib/migrate/screenshots";

/**
 * Development only: moves base64 screenshots out of the database and into
 * Storage. Run it once, signed in as the account that owns the data, with
 * `npm run dev`. It never ships to production.
 */

const mb = (bytes: number) => `${(bytes / 1_048_576).toFixed(1)} MB`;

export default function MigrateScreenshotsPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const [userId, setUserId] = useState<string | null>(null);
  const [scan, setScan] = useState<ScanResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [result, setResult] = useState<MigrateResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setUserId(data.user?.id ?? null))
      .catch(() => {});
  }, []);

  async function doScan() {
    setScanning(true);
    setError(null);
    setResult(null);
    try {
      setScan(await scanBase64Screenshots());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setScanning(false);
    }
  }

  async function doMigrate() {
    if (!userId || !scan) return;
    setRunning(true);
    setError(null);
    try {
      setResult(await migrateBase64Screenshots(userId, (p) => setProgress(p.label)));
      setScan(await scanBase64Screenshots());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Migration failed");
    } finally {
      setRunning(false);
      setProgress(null);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 p-6">
      <header>
        <h1 className="flex items-center gap-2 text-lg font-semibold">
          <Database className="size-5 text-primary" />
          Move screenshots out of the database
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Older screenshots are stored as base64 inside the trade row, so every read of the journal downloads all of
          them. This moves each one into Storage and leaves only its path behind. Scanning changes nothing.
        </p>
      </header>

      {!userId && (
        <p className="rounded-xl border border-warning/40 bg-warning/5 p-3 text-sm text-warning">
          Not signed in. Log in first, otherwise row-level security returns no rows and the scan looks empty.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={doScan}
          disabled={scanning || running}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:border-primary/40 disabled:opacity-50"
        >
          {scanning ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
          Scan
        </button>

        <button
          type="button"
          onClick={doMigrate}
          disabled={!scan || scan.images === 0 || running || !userId}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:-translate-y-px disabled:opacity-50 disabled:hover:translate-y-0"
        >
          {running ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
          {running ? progress ?? "Migrating..." : "Migrate"}
        </button>
      </div>

      {error && (
        <p className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      )}

      {scan && (
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <p className="mb-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Found</p>
          {scan.images === 0 ? (
            <p className="flex items-center gap-2 text-sm text-success">
              <CheckCircle2 className="size-4" />
              No base64 screenshots left. Nothing to migrate.
            </p>
          ) : (
            <>
              <p className="font-mono text-2xl font-bold">{mb(scan.bytes)}</p>
              <p className="text-sm text-muted-foreground">
                {scan.images} image{scan.images === 1 ? "" : "s"} across {scan.rows} row
                {scan.rows === 1 ? "" : "s"}, pulled on every read.
              </p>
              <ul className="mt-3 space-y-1 border-t border-border/40 pt-3 text-xs text-muted-foreground">
                {(["trades", "analyses"] as const).map((t) => (
                  <li key={t} className="flex justify-between">
                    <span className="capitalize">{t}</span>
                    <span className="font-mono">
                      {scan.perTable[t].images} images · {mb(scan.perTable[t].bytes)}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {result && (
        <div className="rounded-xl border border-border/60 bg-card p-4 text-sm">
          <p className="flex items-center gap-2 font-medium text-success">
            <CheckCircle2 className="size-4" />
            {result.migrated} image{result.migrated === 1 ? "" : "s"} moved to Storage
          </p>
          {result.failed > 0 && (
            <>
              <p className="mt-2 text-destructive">
                {result.failed} row{result.failed === 1 ? "" : "s"} failed and were left untouched:
              </p>
              <ul className="mt-1 space-y-1 font-mono text-xs text-muted-foreground">
                {result.errors.slice(0, 8).map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}
