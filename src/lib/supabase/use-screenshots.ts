"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getScreenshotUrl, getScreenshotUrls, uploadScreenshot } from "@/lib/supabase/storage";

/**
 * The one place a screenshot enters or leaves Storage.
 *
 * Why it is a single place: the same three jobs (put the file somewhere, turn a
 * stored path into a URL the browser can fetch, sign the original when someone
 * opens it) had grown three separate implementations, and two of them quietly
 * wrote the image into the database row as base64 instead. That is what put
 * this project through a 5 GB egress quota in a month, and a fourth copy would
 * have found its own way to do the same. Everything that handles a screenshot
 * now goes through here.
 *
 * The rule this enforces: an image is never stored in a row. A row holds a
 * path. If the upload fails, the caller gets an error to show, not a base64
 * consolation prize that costs money on every read for the rest of time.
 */

export type ScreenshotEntity = "trades" | "analyses" | "best-trade";

export interface ScreenshotTarget {
  entityType: ScreenshotEntity;
  /** The row the images belong to. Best-trade entries are filed by date. */
  entityId: string;
}

export interface UseScreenshots {
  /**
   * A URL the browser can load, or null while a stored path is still being
   * signed. Null means "not yet", never "broken": handing back the raw path
   * makes the browser request a URL that cannot exist.
   */
  display: (url: string) => string | null;
  /** Upload files and return their stored paths. Throws if nothing was stored. */
  upload: (files: File[]) => Promise<string[]>;
  /** The full-size original, signed on demand. Null if it cannot be signed. */
  fullSize: (url: string) => Promise<string | null>;
  uploading: boolean;
  /** Set when an upload failed, so the caller can say so. */
  error: string | null;
  clearError: () => void;
}

/** Already displayable as-is: an inline image, or an absolute URL. */
const isDirect = (url: string) => url.startsWith("data:") || url.startsWith("http");

/**
 * @param target Where uploads are filed. Null for a read-only view.
 * @param urls   Every path currently on screen, so they can be signed up front.
 * @param size   Which rendition to sign for display; the original is fetched
 *               only when the lightbox opens.
 */
export function useScreenshots(
  target: ScreenshotTarget | null,
  urls: string[],
  size: "thumb" | "preview" | "full" = "preview"
): UseScreenshots {
  const [resolved, setResolved] = useState<Map<string, string>>(new Map());
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The set of paths on screen, as a stable string: `urls` is a fresh array on
  // every render, so depending on it directly would re-sign on every keystroke.
  const key = urls.join("\u0000");
  const resolvedRef = useRef(resolved);
  resolvedRef.current = resolved;

  useEffect(() => {
    const paths = key.split("\u0000").filter((u) => u.length > 0 && !isDirect(u));
    const missing = paths.filter((p) => !resolvedRef.current.has(p));
    if (!missing.length) return;

    let cancelled = false;
    getScreenshotUrls(missing, size)
      .then((signed) => {
        if (cancelled) return;
        setResolved((prev) => {
          const next = new Map(prev);
          missing.forEach((p, i) => next.set(p, signed[i]));
          return next;
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [key, size]);

  const display = useCallback(
    (url: string): string | null => (isDirect(url) ? url : resolved.get(url) ?? null),
    [resolved]
  );

  const fullSize = useCallback(async (url: string): Promise<string | null> => {
    if (isDirect(url)) return url;
    try {
      return await getScreenshotUrl(url, 3600, "full");
    } catch {
      // Fall back to whatever rendition is already signed, if any.
      return resolvedRef.current.get(url) ?? null;
    }
  }, []);

  const upload = useCallback(
    async (files: File[]): Promise<string[]> => {
      if (!target || !files.length) return [];
      setUploading(true);
      setError(null);
      try {
        const {
          data: { user },
        } = await createClient().auth.getUser();
        if (!user) throw new Error("not signed in");
        return await Promise.all(
          files.map((f) => uploadScreenshot(user.id, target.entityType, target.entityId, f))
        );
      } catch (err) {
        setError("Upload failed. Check your connection and try again.");
        throw err;
      } finally {
        setUploading(false);
      }
    },
    [target]
  );

  return { display, upload, fullSize, uploading, error, clearError: () => setError(null) };
}
