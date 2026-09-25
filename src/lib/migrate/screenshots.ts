"use client";

import { createClient } from "@/lib/supabase/client";
import { uploadScreenshot } from "@/lib/supabase/storage";
import type { ScreenshotGroup } from "@/lib/types";

/**
 * One-off migration: screenshots stored as base64 inside the row move into
 * Storage, and the row keeps only the path.
 *
 * Why it matters: a base64 image lives in the `screenshot_groups` column, so
 * every read of that row streams the whole picture out of the database. The
 * journal reads every trade at once, which means opening it used to download
 * the entire screenshot archive. In Storage the same image is fetched only
 * when it is shown, and can be resized on the way out.
 *
 * Safety:
 *  - Runs as the signed-in user, so row-level security scopes it to their own
 *    rows. No elevated key is involved.
 *  - Scan first, write only on an explicit second call.
 *  - The base64 is replaced only after its upload succeeded, one row at a
 *    time, so an interrupted run leaves every row either fully migrated or
 *    untouched.
 *  - Re-running is safe: anything that is not a `data:` URL is skipped.
 */

type Table = "trades" | "analyses";
const TABLES: Table[] = ["trades", "analyses"];

/** Storage groups entity folders by table name; "analyses" matches already. */
const ENTITY: Record<Table, "trades" | "analyses"> = { trades: "trades", analyses: "analyses" };

interface Row {
  id: string;
  screenshot_groups: ScreenshotGroup[] | null;
}

export interface ScanResult {
  rows: number;
  images: number;
  bytes: number;
  perTable: Record<Table, { rows: number; images: number; bytes: number }>;
}

export interface MigrateProgress {
  done: number;
  total: number;
  label: string;
}

export interface MigrateResult {
  migrated: number;
  failed: number;
  errors: string[];
}

const isBase64 = (url: string) => url.startsWith("data:");

/** Roughly what the base64 payload costs in the row, in bytes. */
function payloadBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(",");
  const body = comma === -1 ? dataUrl : dataUrl.slice(comma + 1);
  // 4 base64 characters encode 3 bytes.
  return Math.round((body.length * 3) / 4);
}

async function readRows(table: Table): Promise<Row[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from(table).select("id, screenshot_groups");
  if (error) throw new Error(`${table}: ${error.message}`);
  return (data ?? []) as Row[];
}

function base64Urls(row: Row): string[] {
  return (row.screenshot_groups ?? []).flatMap((g) => (g.urls ?? []).filter(isBase64));
}

/** Looks, changes nothing. */
export async function scanBase64Screenshots(): Promise<ScanResult> {
  const perTable = {
    trades: { rows: 0, images: 0, bytes: 0 },
    analyses: { rows: 0, images: 0, bytes: 0 },
  } as ScanResult["perTable"];

  for (const table of TABLES) {
    for (const row of await readRows(table)) {
      const urls = base64Urls(row);
      if (!urls.length) continue;
      perTable[table].rows += 1;
      perTable[table].images += urls.length;
      perTable[table].bytes += urls.reduce((sum, u) => sum + payloadBytes(u), 0);
    }
  }

  return {
    rows: perTable.trades.rows + perTable.analyses.rows,
    images: perTable.trades.images + perTable.analyses.images,
    bytes: perTable.trades.bytes + perTable.analyses.bytes,
    perTable,
  };
}

const EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

/** Turns a data URL into a File the existing upload helper accepts. */
async function toFile(dataUrl: string, index: number): Promise<File> {
  const blob = await (await fetch(dataUrl)).blob();
  const ext = EXT[blob.type] ?? "png";
  return new File([blob], `migrated_${Date.now()}_${index}.${ext}`, { type: blob.type || "image/png" });
}

/**
 * Moves every base64 screenshot into Storage and rewrites the rows.
 * `onProgress` is called after each row so the page can show where it is.
 */
export async function migrateBase64Screenshots(
  userId: string,
  onProgress?: (p: MigrateProgress) => void
): Promise<MigrateResult> {
  const supabase = createClient();
  const result: MigrateResult = { migrated: 0, failed: 0, errors: [] };

  const work: { table: Table; row: Row }[] = [];
  for (const table of TABLES) {
    for (const row of await readRows(table)) {
      if (base64Urls(row).length) work.push({ table, row });
    }
  }

  let done = 0;
  for (const { table, row } of work) {
    try {
      let index = 0;
      // Build the new groups first; the row is written once, at the end, so a
      // failure mid-row cannot leave half its images pointing nowhere.
      const groups: ScreenshotGroup[] = [];
      for (const group of row.screenshot_groups ?? []) {
        const urls: string[] = [];
        for (const url of group.urls ?? []) {
          if (!isBase64(url)) {
            urls.push(url);
            continue;
          }
          const file = await toFile(url, index++);
          urls.push(await uploadScreenshot(userId, ENTITY[table], row.id, file));
          result.migrated += 1;
        }
        groups.push({ ...group, urls });
      }

      const { error } = await supabase.from(table).update({ screenshot_groups: groups }).eq("id", row.id);
      if (error) throw new Error(error.message);
    } catch (err) {
      result.failed += 1;
      result.errors.push(`${table} ${row.id}: ${err instanceof Error ? err.message : "unknown error"}`);
    }
    done += 1;
    onProgress?.({ done, total: work.length, label: `${table} ${done}/${work.length}` });
  }

  return result;
}
