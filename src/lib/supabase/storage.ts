/**
 * Supabase Storage helpers for private screenshot uploads.
 * Bucket: trade-screenshots  (private, RLS-enforced by storage policies)
 * Path format: {userId}/{entityType}/{entityId}/{filename}
 */
import { createClient } from "@/lib/supabase/client";

const BUCKET = "trade-screenshots";
const AVATAR_BUCKET = "avatars";

/** Replace the signed-in user's public profile image and return its URL. */
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
  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}

export async function deleteAvatar(userId: string, avatarUrl?: string): Promise<void> {
  const supabase = createClient();
  const extension = avatarUrl?.split("?")[0].split(".").pop() ?? "jpg";
  const { error } = await supabase.storage.from(AVATAR_BUCKET).remove([`${userId}/avatar.${extension}`]);
  if (error) throw error;
}

/** Upload a file and return its storage path (not a public URL). */
export async function uploadScreenshot(
  userId: string,
  entityType: "trades" | "analyses" | "best-trade",
  entityId: string,
  file: File
): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split(".").pop() ?? "jpg";
  const filename = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`;
  const path = `${userId}/${entityType}/${entityId}/${filename}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
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

/** Generate multiple signed URLs in one batch, all at the same size. */
export async function getScreenshotUrls(paths: string[], size: ScreenshotSize = "full"): Promise<string[]> {
  if (!paths.length) return [];
  // Split: data URLs pass through, storage paths get signed
  return Promise.all(paths.map((p) => getScreenshotUrl(p, 3600, size)));
}

/** Delete a screenshot from storage. */
export async function deleteScreenshot(path: string): Promise<void> {
  if (path.startsWith("data:") || path.startsWith("http")) return; // legacy, skip
  const supabase = createClient();
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) console.warn("Failed to delete screenshot:", error.message);
}
