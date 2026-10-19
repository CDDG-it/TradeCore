/**
 * Supabase Storage helpers for private screenshot uploads.
 * Bucket: trade-screenshots  (private, RLS-enforced by storage policies)
 * Path format: {userId}/{entityType}/{entityId}/{filename}
 */
import { createClient } from "@/lib/supabase/client";

const BUCKET = "trade-screenshots";
const AVATAR_BUCKET = "avatars";

/**
 * Replace the signed-in user's profile image and return its storage path.
 *
 * A path, not a URL. The avatars bucket used to be world-readable and this
 * returned a public link that was then saved on the account, which meant
 * anyone holding a user's id could fetch their face. The bucket is private
 * now, so what is stored is the path and the link is signed at the moment it
 * is shown.
 */
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${userId}/avatar.${ext}`;
  const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(path, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: true,
  });
  if (error) throw error;
  /* The path carries a version marker. Replacing a photo with another of the
     same type writes to the same key, so without one the stored value would be
     byte-for-byte what it already was: nothing downstream would notice a
     change, no new link would be signed, and the browser would go on showing
     the picture it had cached. The marker is stripped before signing. */
  return `${path}?v=${Date.now()}`;
}

/**
 * The storage path inside an `avatar_url` that may be either.
 *
 * Accounts written before the bucket was closed hold a full public URL. Those
 * links no longer resolve, but the path is still in them, so the old value is
 * read rather than discarded and the trader keeps the photo they uploaded.
 */
function avatarPath(stored: string): string {
  const clean = stored.split("?")[0];
  const marker = `/${AVATAR_BUCKET}/`;
  const i = clean.indexOf(marker);
  return i === -1 ? clean : clean.slice(i + marker.length);
}

/**
 * A link the browser can load for a stored avatar, or null if there is none.
 * Signed for an hour, which outlives any page a profile photo appears on.
 */
export async function getAvatarUrl(stored?: string | null): Promise<string | null> {
  if (!stored) return null;
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .createSignedUrl(avatarPath(stored), 3600);
  return error ? null : data.signedUrl;
}

export async function deleteAvatar(userId: string, storedAvatar?: string): Promise<void> {
  const supabase = createClient();
  // Derive the extension from whatever is stored, path or legacy URL alike.
  const extension = storedAvatar ? avatarPath(storedAvatar).split(".").pop() ?? "jpg" : "jpg";
  const { error } = await supabase.storage.from(AVATAR_BUCKET).remove([`${userId}/avatar.${extension}`]);
  if (error) throw error;
}

/* Stored screenshots never change: every upload gets a new, unique path, and
   a rendition is written once next to it. So the browser may keep them as long
   as it likes, and a chart opened twice is downloaded once. */
const IMMUTABLE = "31536000";

/** The largest screenshot that is stored, after the lossless pass below. */
export const MAX_SCREENSHOT_BYTES = 10 * 1024 * 1024;

/** Thrown for a file over MAX_SCREENSHOT_BYTES, so the caller can say why. */
export class ScreenshotTooLargeError extends Error {
  constructor() {
    super(`Screenshot is larger than ${MAX_SCREENSHOT_BYTES / 1024 / 1024} MB. Save it as PNG or JPEG at screen size and try again.`);
    this.name = "ScreenshotTooLargeError";
  }
}

/**
 * Above this, a screenshot is re-encoded as lossless WebP before it is stored.
 * Below it, the file goes up untouched. A normal chart capture is a few hundred
 * kilobytes; what this catches is a 4K PNG of several megabytes, which costs
 * that much storage once and that much bandwidth every time it is opened.
 */
const LOSSLESS_ABOVE_BYTES = 1_500_000;

/**
 * The same pixels in fewer bytes, or the original.
 *
 * Lossless WebP keeps every pixel exactly and is typically several times
 * smaller than PNG on flat-colour charts. The result is decoded again and
 * compared with the source pixel by pixel; it is only used if every value
 * matches and it actually came out smaller. A browser that cannot encode WebP
 * (it silently returns PNG), cannot decode the file, or produces anything that
 * differs keeps the original. Never throws.
 */
async function losslessIfHuge(file: File): Promise<Blob> {
  if (file.size <= LOSSLESS_ABOVE_BYTES || typeof document === "undefined") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();
    const source = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

    // Quality 1 is the lossless encoder for WebP in canvas.
    const webp = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 1));
    if (!webp || webp.type !== "image/webp" || webp.size >= file.size) return file;

    const check = await createImageBitmap(webp);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(check, 0, 0);
    check.close();
    const decoded = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    if (decoded.length !== source.length) return file;
    const a = new Uint32Array(source.buffer);
    const b = new Uint32Array(decoded.buffer);
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return file;
    return webp;
  } catch {
    return file;
  }
}

/**
 * Upload a file and return its storage path (not a public URL).
 *
 * This is the only way an image is stored. Nothing writes a picture into a
 * database row: a row holds this path, and the bytes live in Storage, next to
 * the smaller renditions made here for the grid and the calendar.
 *
 * The stored original keeps every pixel of what was uploaded: a chart is thin
 * lines and small text, and any lossy re-encode or downscale softens exactly
 * that. Only a very large file is repacked, losslessly (see losslessIfHuge).
 */
export async function uploadScreenshot(
  userId: string,
  entityType: "trades" | "analyses" | "best-trade",
  entityId: string,
  file: File
): Promise<string> {
  const supabase = createClient();
  const body = await losslessIfHuge(file);
  if (body.size > MAX_SCREENSHOT_BYTES) throw new ScreenshotTooLargeError();
  // A repacked file is WebP whatever it started as, so the extension follows the bytes.
  const ext = body === file ? file.name.split(".").pop()?.toLowerCase() || "png" : "webp";
  const filename = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`;
  const path = `${userId}/${entityType}/${entityId}/${filename}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, body, {
    cacheControl: IMMUTABLE,
    contentType: body.type || file.type || "image/png",
    upsert: false,
  });
  if (error) throw error;
  // The original is safely stored; renditions are a bonus. If one fails, that
  // size falls back to the original when it is shown.
  await storeRenditions(path, body);
  return path;
}

/**
 * How large a screenshot should come back.
 *
 * "thumb" and "preview" are smaller copies made in the browser at upload time
 * and stored beside the original, so the grid and the calendar never download
 * a full-size chart. "full" is the untouched file, for the journal's chart
 * views and the lightbox, where the trader is reading detail.
 *
 * Why the browser and not Supabase: Supabase can resize on the way out (Image
 * Transformations), but only on the Pro plan, and even there it is metered per
 * image. Resizing once at upload costs nothing afterwards, works on every plan,
 * and makes the project free to move off Pro.
 */
export type ScreenshotSize = "thumb" | "preview" | "full";
type Rendition = Exclude<ScreenshotSize, "full">;

/* Quality is set high on purpose. A trading screenshot is mostly flat colour
   with thin lines and small text, which is exactly what aggressive compression
   ruins first, and WebP handles that content cheaply. Measured on this
   account: originals average ~106 KB, so there is no reason to trade away
   legibility for a few kilobytes. */
const RENDITIONS: Record<Rendition, { width: number; quality: number }> = {
  // Calendar tiles and small cards; generous enough for a high-density screen.
  thumb: { width: 640, quality: 0.82 },
  // The grid inside the journal and the upload dialog, where charts are read.
  preview: { width: 1600, quality: 0.88 },
};

/** Where a rendition of a stored screenshot lives: next to it, same folder. */
export const renditionPath = (path: string, size: Rendition) => `${path}.${size}`;

/**
 * Scale an image down to `width` (never up) and encode it. WebP where the
 * browser can encode it, JPEG otherwise. Null if the browser cannot decode
 * the file at all.
 */
async function encodeRendition(source: Blob, width: number, quality: number): Promise<Blob | null> {
  if (typeof document === "undefined") return null;
  try {
    const bitmap = await createImageBitmap(source);
    const scale = bitmap.width > width ? width / bitmap.width : 1;
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return null;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const toBlob = (type: string) =>
      new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
    // A browser that cannot encode WebP silently hands back a PNG instead.
    const webp = await toBlob("image/webp");
    if (webp && webp.type === "image/webp") return webp;
    return await toBlob("image/jpeg");
  } catch {
    return null;
  }
}

/**
 * Make and store every rendition of one screenshot. Never throws: a missing
 * rendition only means that size is served from the original.
 */
async function storeRenditions(path: string, source: Blob): Promise<void> {
  const supabase = createClient();
  await Promise.all(
    (Object.keys(RENDITIONS) as Rendition[]).map(async (size) => {
      const { width, quality } = RENDITIONS[size];
      const blob = await encodeRendition(source, width, quality);
      if (!blob) return;
      const { error } = await supabase.storage.from(BUCKET).upload(renditionPath(path, size), blob, {
        cacheControl: IMMUTABLE,
        contentType: blob.type,
        // Same as the original: the bucket grants insert, not update. A copy
        // that already exists (another tab got there first) is simply kept.
        upsert: false,
      });
      if (error && !/exists|duplicate/i.test(error.message)) {
        console.warn(`Screenshot ${size} not stored:`, error.message);
      }
    })
  );
}

/* Screenshots uploaded before renditions existed have none. The first time one
   is shown, it is served from the original and its renditions are made in the
   background, so from then on it loads small like any other. Once per path per
   page load, two at a time, so a full grid of old charts does not stampede. */
const backfillQueue: string[] = [];
const backfillSeen = new Set<string>();
let backfillRunning = 0;

function queueBackfill(path: string) {
  if (typeof window === "undefined" || backfillSeen.has(path)) return;
  backfillSeen.add(path);
  backfillQueue.push(path);
  pumpBackfill();
}

function pumpBackfill() {
  while (backfillRunning < 2 && backfillQueue.length) {
    const path = backfillQueue.shift()!;
    backfillRunning++;
    createClient()
      .storage.from(BUCKET)
      .download(path)
      .then(({ data }) => (data ? storeRenditions(path, data) : undefined))
      .catch(() => {})
      .finally(() => {
        backfillRunning--;
        pumpBackfill();
      });
  }
}

/* ── Signed links, reused ───────────────────────────────────────────────
   A signed link carries a fresh token every time it is made, and the browser
   caches by the full link. Signing again on every page view therefore meant
   downloading every chart again on every page view, which is most of what
   screenshots cost in bandwidth. Links are kept for this tab session instead,
   and handed out again while they have a comfortable margin left, so the
   browser's own cache (the files are marked immutable) serves repeat views. */
const SIGNED_LINK_SECONDS = 6 * 60 * 60;
const REUSE_MARGIN_MS = 15 * 60 * 1000;
const LINK_STORE = "tmc:screenshot-links";

type CachedLink = { url: string; until: number };
let links: Map<string, CachedLink> | null = null;

function linkCache(): Map<string, CachedLink> {
  if (links) return links;
  links = new Map();
  try {
    const raw = window.sessionStorage.getItem(LINK_STORE);
    const now = Date.now();
    if (raw) for (const [key, link] of JSON.parse(raw) as [string, CachedLink][]) if (link.until - now > REUSE_MARGIN_MS) links.set(key, link);
  } catch { /* No storage (private mode, blocked): links live for this page only. */ }
  return links;
}

function saveLinks() {
  try { window.sessionStorage.setItem(LINK_STORE, JSON.stringify([...linkCache()])); } catch { /* best effort */ }
}

function forgetLinks(keys: string[]) {
  const cache = linkCache();
  keys.forEach((key) => cache.delete(key));
  saveLinks();
}

/**
 * Sign several screenshots at once, all at the same size, in order.
 *
 * One batch request for the renditions, and a second only for paths that have
 * none yet (older uploads), which are served from the original meanwhile.
 */
export async function getScreenshotUrls(
  paths: string[],
  size: ScreenshotSize = "full",
  /** The shortest life the links may have; reused links always have more. */
  expiresIn = SIGNED_LINK_SECONDS
): Promise<string[]> {
  if (!paths.length) return [];
  const out: (string | null)[] = paths.map((p) => (p.startsWith("data:") || p.startsWith("http") ? p : null));
  const stored = paths.map((p, i) => ({ p, i })).filter(({ i }) => out[i] === null);
  if (!stored.length) return out as string[];

  const supabase = createClient();
  const bucket = supabase.storage.from(BUCKET);

  /* Sign a batch and index the answers by path: the API reports each path
     separately (a missing object is a per-item error, not a failed call) and
     does not promise to keep the order it was asked in. */
  const signAll = async (keys: string[]) => {
    const cache = linkCache();
    const now = Date.now();
    const byPath = new Map<string, string>();
    const fresh = keys.filter((key) => {
      const hit = cache.get(key);
      if (hit && hit.until - now > REUSE_MARGIN_MS) byPath.set(key, hit.url);
      return !byPath.has(key);
    });
    if (!fresh.length) return byPath;

    const seconds = Math.max(expiresIn, SIGNED_LINK_SECONDS);
    const { data, error } = await bucket.createSignedUrls(fresh, seconds);
    if (error) throw error;
    const until = now + seconds * 1000;
    (data ?? []).forEach((item, k) => {
      if (item.error || !item.signedUrl) return;
      // Fall back to the position if a path ever comes back missing or prefixed.
      const path = item.path?.replace(new RegExp(`^${BUCKET}/`), "") ?? fresh[k];
      const key = fresh.includes(path) ? path : fresh[k];
      byPath.set(key, item.signedUrl);
      cache.set(key, { url: item.signedUrl, until });
    });
    saveLinks();
    return byPath;
  };

  let needOriginal = stored;
  if (size !== "full") {
    const signed = await signAll(stored.map(({ p }) => renditionPath(p, size)));
    needOriginal = stored.filter(({ p, i }) => {
      const url = signed.get(renditionPath(p, size));
      if (url) out[i] = url;
      return !url;
    });
    needOriginal.forEach(({ p }) => queueBackfill(p));
  }

  if (needOriginal.length) {
    const signed = await signAll(needOriginal.map(({ p }) => p));
    for (const { p, i } of needOriginal) {
      const url = signed.get(p);
      if (!url) throw new Error(`Could not sign screenshot ${p}`);
      out[i] = url;
    }
  }
  return out as string[];
}

/**
 * A signed URL for a private screenshot path. Call this when rendering, never
 * store the result: it expires (see SIGNED_LINK_SECONDS).
 */
export async function getScreenshotUrl(
  path: string,
  expiresIn = SIGNED_LINK_SECONDS,
  size: ScreenshotSize = "full"
): Promise<string> {
  const [url] = await getScreenshotUrls([path], size, expiresIn);
  return url;
}

/** Every stored key for one screenshot: the original and its renditions. */
const keysOf = (path: string) => [path, ...(Object.keys(RENDITIONS) as Rendition[]).map((size) => renditionPath(path, size))];

/** Delete a screenshot, and its renditions, from storage. */
export async function deleteScreenshot(path: string): Promise<void> {
  if (path.startsWith("data:") || path.startsWith("http")) return; // legacy, skip
  const supabase = createClient();
  forgetLinks(keysOf(path));
  const { error } = await supabase.storage.from(BUCKET).remove(keysOf(path));
  if (error) console.warn("Failed to delete screenshot:", error.message);
}

/**
 * Delete every screenshot filed under one row, for when the row itself is
 * deleted. Without this a deleted trade left its charts in Storage for good,
 * quietly filling the plan's quota with files nothing can reach any more.
 *
 * Never throws: the row is already gone, and a leftover file is a cost, not an
 * error the trader can act on.
 */
export async function deleteScreenshotsOf(
  userId: string,
  entityType: "trades" | "analyses" | "best-trade",
  entityId: string
): Promise<void> {
  const folder = `${userId}/${entityType}/${entityId}`;
  const bucket = createClient().storage.from(BUCKET);
  try {
    for (;;) {
      const { data, error } = await bucket.list(folder, { limit: 1000 });
      if (error || !data?.length) return;
      const keys = data.map((item) => `${folder}/${item.name}`);
      forgetLinks(keys);
      const { error: removeError } = await bucket.remove(keys);
      if (removeError) return console.warn("Failed to delete screenshots:", removeError.message);
      if (data.length < 1000) return;
    }
  } catch {
    /* best effort */
  }
}
