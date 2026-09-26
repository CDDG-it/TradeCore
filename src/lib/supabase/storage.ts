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
 * database row: a row holds this path, and the bytes live in Storage where
 * they can be resized on the way out.
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
  return path;
}

/**
 * How large a screenshot should come back.
 *
 * Supabase resizes and re-encodes at the source, so a "preview" costs a
 * fraction of the original on the wire. A trading screenshot is often several
 * megabytes; the grid never shows it larger than a dialog, so asking for the
 * original there was paying for pixels nobody sees.
 *
 * "full" is the untouched file, for the lightbox, where the trader is
 * deliberately looking at detail.
 */
export type ScreenshotSize = "thumb" | "preview" | "full";

/* Quality is set high on purpose. A trading screenshot is mostly flat colour
   with thin lines and small text, which is exactly what aggressive compression
   ruins first, and Supabase serves WebP, which handles that content cheaply.
   Measured on this account: originals average ~106 KB, so there is no reason
   to trade away legibility for a few kilobytes. */
const TRANSFORMS: Record<Exclude<ScreenshotSize, "full">, { width: number; quality: number }> = {
  // Calendar tiles and small cards; generous enough for a high-density screen.
  thumb: { width: 640, quality: 82 },
  // The grid inside the journal and the upload dialog, where charts are read.
  preview: { width: 1600, quality: 88 },
};

/**
 * Generate a signed URL for a private screenshot path.
 * Expires in 1 hour (3600s). Call this when rendering, not in storage.
 */
export async function getScreenshotUrl(
  path: string,
  expiresIn = 3600,
  size: ScreenshotSize = "full"
): Promise<string> {
  // If the path is already a data URL or http URL (legacy base64 content), return as-is
  if (path.startsWith("data:") || path.startsWith("http")) return path;

  const supabase = createClient();
  const transform = size === "full" ? undefined : TRANSFORMS[size];
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, expiresIn, transform ? { transform } : undefined);
  if (error) throw error;
  return data.signedUrl;
}

/**
 * Sign several screenshots at once, all at the same size.
 *
 * One request per path, not one request for all of them. Supabase's batch
 * signing exists but cannot attach a transform, and asking for a resized
 * rendition is worth far more than saving a handful of small round trips: the
 * transform is the difference between sending a thumbnail and sending the
 * original. If batch signing ever learns transforms, this should use it.
 */
export async function getScreenshotUrls(paths: string[], size: ScreenshotSize = "full"): Promise<string[]> {
  if (!paths.length) return [];
  return Promise.all(paths.map((p) => getScreenshotUrl(p, 3600, size)));
}

/** Delete a screenshot from storage. */
export async function deleteScreenshot(path: string): Promise<void> {
  if (path.startsWith("data:") || path.startsWith("http")) return; // legacy, skip
  const supabase = createClient();
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) console.warn("Failed to delete screenshot:", error.message);
}
