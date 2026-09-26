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

export type Table = "trades" | "analyses" | "best_trade_of_day";
export const TABLES: Table[] = ["trades", "analyses", "best_trade_of_day"];

/**
 * Which Storage folder each table's images belong in. Two of the names line up
 * with the table; the best-trade one does not, and its live uploads already
 * write to "best-trade", so a migrated image has to land in the same place.
 *
 * Typed off `uploadScreenshot` rather than repeating its union, so this cannot
 * drift away from what Storage actually accepts.
 */
const ENTITY: Record<Table, Parameters<typeof uploadScreenshot>[1]> = {
  trades: "trades",
  analyses: "analyses",
  best_trade_of_day: "best-trade",
};

interface Row {
  id: string;
  /** Best-trade rows are filed by day, not by row id. Absent on the others. */
  date?: string | null;
  screenshot_groups: ScreenshotGroup[] | null;
}

/**
 * The folder segment an image is stored under.
 *
 * This differs per table and getting it wrong is invisible: the upload
 * succeeds, the path is stored as returned, and the picture still renders. But
 * a migrated image and a later one from the same day would sit in different
 * folders, which makes every future cleanup wrong.
 */
function entityId(table: Table, row: Row): string {
  return table === "best_trade_of_day" ? (row.date ?? row.id) : row.id;
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
  const cols =
    table === "best_trade_of_day" ? "id, date, screenshot_groups" : "id, screenshot_groups";
  const { data, error } = await supabase.from(table).select(cols);
  if (error) throw new Error(`${table}: ${error.message}`);
  return (data ?? []) as unknown as Row[];
}

function base64Urls(row: Row): string[] {
  return (row.screenshot_groups ?? []).flatMap((g) => (g.urls ?? []).filter(isBase64));
}

/** Looks, changes nothing. */
export async function scanBase64Screenshots(): Promise<ScanResult> {
  // Built from TABLES rather than written out: a table added to the list above
  // and forgotten here would be scanned but silently left out of the totals.
  const perTable = Object.fromEntries(
    TABLES.map((t) => [t, { rows: 0, images: 0, bytes: 0 }])
  ) as ScanResult["perTable"];

  for (const table of TABLES) {
    for (const row of await readRows(table)) {
      const urls = base64Urls(row);
      if (!urls.length) continue;
      perTable[table].rows += 1;
      perTable[table].images += urls.length;
      perTable[table].bytes += urls.reduce((sum, u) => sum + payloadBytes(u), 0);
    }
  }

  const total = (key: "rows" | "images" | "bytes") =>
    TABLES.reduce((sum, t) => sum + perTable[t][key], 0);

  return {
    rows: total("rows"),
    images: total("images"),
    bytes: total("bytes"),
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
          urls.push(await uploadScreenshot(userId, ENTITY[table], entityId(table, row), file));
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
