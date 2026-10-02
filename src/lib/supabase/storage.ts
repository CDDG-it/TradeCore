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

/**
 * Above this, a screenshot is re-encoded before it is stored. Below it, the
 * file goes up untouched.
 *
 * The threshold exists so the common case keeps its exact pixels: a normal
 * chart capture is a few hundred kilobytes and re-encoding it would only lose
 * detail in the thin lines and small text that make a chart readable. What it
 * catches is the pathological case, a lossless 4K PNG of several megabytes,
 * where the file is large because of how it was saved rather than what it
 * shows.
 */
const RECOMPRESS_ABOVE_BYTES = 1_500_000;
const MAX_STORED_WIDTH = 2560;

/**
 * Re-encode an oversized image, or hand back the original.
 *
 * Never throws: if a browser cannot do the work, storing the file as it came
 * is a worse outcome than storing nothing, so the original is returned.
 */
async function shrinkIfHuge(file: File): Promise<Blob> {
  if (file.size <= RECOMPRESS_ABOVE_BYTES || typeof document === "undefined") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = bitmap.width > MAX_STORED_WIDTH ? MAX_STORED_WIDTH / bitmap.width : 1;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return file;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.92)
    );
    // Only take the re-encode if it actually helped.
    return blob && blob.size < file.size ? blob : file;
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
 */
export async function uploadScreenshot(
  userId: string,
  entityType: "trades" | "analyses" | "best-trade",
  entityId: string,
  file: File
): Promise<string> {
  const supabase = createClient();
  const body = await shrinkIfHuge(file);
  // A re-encoded file is a JPEG whatever it started as, so the extension has
  // to follow the bytes rather than the original name.
  const ext = body === file ? file.name.split(".").pop() ?? "jpg" : "jpg";
  const filename = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`;
  const path = `${userId}/${entityType}/${entityId}/${filename}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, body, {
    cacheControl: "3600",
    contentType: body.type || file.type || "image/jpeg",
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
 * a full-size chart. "full" is the untouched file, for the lightbox, where the
 * trader is deliberately looking at detail.
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
        cacheControl: "3600",
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

/**
 * Sign several screenshots at once, all at the same size, in order.
 *
 * One batch request for the renditions, and a second only for paths that have
 * none yet (older uploads), which are served from the original meanwhile.
 */
export async function getScreenshotUrls(
  paths: string[],
  size: ScreenshotSize = "full",
  expiresIn = 3600
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
    const { data, error } = await bucket.createSignedUrls(keys, expiresIn);
    if (error) throw error;
    const byPath = new Map<string, string>();
    (data ?? []).forEach((item, k) => {
      if (item.error || !item.signedUrl) return;
      // Fall back to the position if a path ever comes back missing or prefixed.
      const path = item.path?.replace(new RegExp(`^${BUCKET}/`), "") ?? keys[k];
      byPath.set(keys.includes(path) ? path : keys[k], item.signedUrl);
    });
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
 * Generate a signed URL for a private screenshot path.
 * Expires in 1 hour (3600s). Call this when rendering, not in storage.
 */
export async function getScreenshotUrl(
  path: string,
  expiresIn = 3600,
  size: ScreenshotSize = "full"
): Promise<string> {
  const [url] = await getScreenshotUrls([path], size, expiresIn);
  return url;
}

/** Delete a screenshot, and its renditions, from storage. */
export async function deleteScreenshot(path: string): Promise<void> {
  if (path.startsWith("data:") || path.startsWith("http")) return; // legacy, skip
  const supabase = createClient();
  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([path, ...(Object.keys(RENDITIONS) as Rendition[]).map((size) => renditionPath(path, size))]);
  if (error) console.warn("Failed to delete screenshot:", error.message);
}
