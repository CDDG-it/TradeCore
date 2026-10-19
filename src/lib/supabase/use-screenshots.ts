"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { forgetScreenshotLinks, getScreenshotUrl, getScreenshotUrls, ScreenshotTooLargeError, uploadScreenshot } from "@/lib/supabase/storage";

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
  /** True once a path could not be signed, or its image would not load after a fresh link. */
  failed: (url: string) => boolean;
  /**
   * For an <img> that would not load. The first time, the reused link is
   * dropped and the path signed again; after that the path is marked failed.
   */
  onLoadError: (url: string) => void;
  /** Forget a failure and sign the path again. */
  retry: (url: string) => void;
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
  const [failures, setFailures] = useState<Set<string>>(new Set());
  const [attempt, setAttempt] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The set of paths on screen, as a stable string: `urls` is a fresh array on
  // every render, so depending on it directly would re-sign on every keystroke.
  const key = urls.join("\u0000");
  const resolvedRef = useRef(resolved);
  resolvedRef.current = resolved;
  const failuresRef = useRef(failures);
  failuresRef.current = failures;
  // Paths whose image already got one fresh link after failing to load.
  const reloaded = useRef(new Set<string>());

  useEffect(() => {
    const paths = key.split("\u0000").filter((u) => u.length > 0 && !isDirect(u));
    const missing = paths.filter((p) => !resolvedRef.current.has(p) && !failuresRef.current.has(p));
    if (!missing.length) return;

    let cancelled = false;
    // One batch first. If it fails, sign the paths one by one, so a single
    // missing or unreadable file costs only its own chart, not every chart on
    // screen, and the ones that fail are named instead of loading forever.
    getScreenshotUrls(missing, size)
      .then((signed) => missing.map((p, i) => ({ p, url: signed[i] as string | null })))
      .catch(() => Promise.all(missing.map((p) =>
        getScreenshotUrls([p], size).then(([url]) => ({ p, url }), () => ({ p, url: null as string | null }))
      )))
      .then((results) => {
        if (cancelled) return;
        setResolved((prev) => {
          const next = new Map(prev);
          results.forEach(({ p, url }) => { if (url) next.set(p, url); });
          return next;
        });
        const lost = results.filter(({ url }) => !url).map(({ p }) => p);
        if (lost.length) setFailures((prev) => new Set([...prev, ...lost]));
      });
    return () => {
      cancelled = true;
    };
  }, [key, size, attempt]);

  const display = useCallback(
    (url: string): string | null => (isDirect(url) ? url : resolved.get(url) ?? null),
    [resolved]
  );

  const failed = useCallback((url: string) => failures.has(url), [failures]);

  const retry = useCallback((url: string) => {
    forgetScreenshotLinks(url);
    setResolved((prev) => { const next = new Map(prev); next.delete(url); return next; });
    setFailures((prev) => { const next = new Set(prev); next.delete(url); return next; });
    setAttempt((n) => n + 1);
  }, []);

  const onLoadError = useCallback((url: string) => {
    if (isDirect(url)) return;
    if (reloaded.current.has(url)) {
      setFailures((prev) => new Set(prev).add(url));
      return;
    }
    reloaded.current.add(url);
    retry(url);
  }, [retry]);

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
        setError(err instanceof ScreenshotTooLargeError ? err.message : "Upload failed. Check your connection and try again.");
        throw err;
      } finally {
        setUploading(false);
      }
    },
    [target]
  );

  return { display, failed, onLoadError, retry, upload, fullSize, uploading, error, clearError: () => setError(null) };
}
