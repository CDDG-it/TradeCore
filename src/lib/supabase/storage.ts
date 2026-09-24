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
 * Generate a signed URL for a private screenshot path.
 * Expires in 1 hour (3600s). Call this when rendering, not in storage.
 */
export async function getScreenshotUrl(path: string, expiresIn = 3600): Promise<string> {
  // If the path is already a data URL or http URL (legacy base64 content), return as-is
  if (path.startsWith("data:") || path.startsWith("http")) return path;

  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}

/** Generate multiple signed URLs in one batch. */
export async function getScreenshotUrls(paths: string[]): Promise<string[]> {
  if (!paths.length) return [];
  // Split: data URLs pass through, storage paths get signed
  const results = await Promise.all(paths.map((p) => getScreenshotUrl(p)));
  return results;
}

/** Delete a screenshot from storage. */
export async function deleteScreenshot(path: string): Promise<void> {
  if (path.startsWith("data:") || path.startsWith("http")) return; // legacy, skip
  const supabase = createClient();
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) console.warn("Failed to delete screenshot:", error.message);
}
