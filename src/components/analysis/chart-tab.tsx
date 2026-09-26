"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, X, ZoomIn } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { deleteScreenshot } from "@/lib/supabase/storage";
import { useScreenshots, type ScreenshotTarget } from "@/lib/supabase/use-screenshots";

/**
 * One chart slot of a pre-trade analysis: its timeframe and its screenshots.
 *
 * This lived twice, once on the new-analysis screen and once on the edit
 * screen, as two copies that had drifted only in formatting. Both wrote their
 * images into the analysis row as base64, which is what a screenshot column
 * must never hold: the row is read in full every time the list loads, so a
 * handful of charts turn into megabytes on the wire per visit, forever. They
 * now go to Storage like every other screenshot in the app, through the shared
 * hook that is the only way an image gets stored.
 */

const MAX_PER_TAB = 5;

export function ChartTab({
  label,
  timeframe,
  onTimeframeChange,
  urls,
  onUrlsChange,
  placeholder,
  target,
}: {
  label: string;
  timeframe: string;
  onTimeframeChange: (v: string) => void;
  urls: string[];
  onUrlsChange: (urls: string[]) => void;
  placeholder: string;
  /** Where these charts are filed. */
  target: ScreenshotTarget;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLButtonElement>(null);
  const [dragging, setDragging] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const { display, upload, fullSize, uploading, error } = useScreenshots(target, urls);

  // The latest urls, for the paste handler: the listener is bound once, and a
  // stale closure would append to whatever the list was when it was bound.
  const urlsRef = useRef(urls);
  urlsRef.current = urls;

  useEffect(() => {
    async function onPaste(e: ClipboardEvent) {
      if (!dropZoneRef.current) return;
      const files = Array.from(e.clipboardData?.items ?? [])
        .filter((i) => i.type.startsWith("image/"))
        .map((i) => i.getAsFile())
        .filter((f): f is File => f !== null);
      if (files.length) await add(files);
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!lightbox) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightbox(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox]);

  async function add(files: FileList | File[]) {
    const current = urlsRef.current;
    const toAdd = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, MAX_PER_TAB - current.length);
    if (!toAdd.length) return;
    try {
      const stored = await upload(toAdd);
      onUrlsChange([...current, ...stored]);
    } catch {
      // `error` from the hook is already showing; the list is left untouched.
    }
  }

  function removeAt(index: number) {
    const url = urls[index];
    // Fire and forget: a file left behind costs storage, but blocking the edit
    // on a delete that failed would cost the trader their work.
    if (url && !url.startsWith("data:") && !url.startsWith("http")) {
      deleteScreenshot(url).catch(() => {});
    }
    onUrlsChange(urls.filter((_, i) => i !== index));
  }

  async function open(url: string) {
    const signed = await fullSize(url);
    if (signed) setLightbox(signed);
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs">Timeframe</Label>
        <Input
          value={timeframe}
          onChange={(e) => onTimeframeChange(e.target.value)}
          placeholder={placeholder}
          className="h-9 text-sm bg-background/50 font-mono max-w-48"
        />
      </div>

      {urls.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {urls.map((url, i) => {
            const src = display(url);
            return (
              <div
                key={i}
                className="relative group aspect-video rounded-lg overflow-hidden border border-border/60 bg-muted/30"
              >
                {src ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={src} alt={`${label} ${i + 1}`} className="w-full h-full object-cover" />
                ) : (
                  /* Still being signed. The tile already has its aspect ratio,
                     so nothing moves when the image arrives. */
                  <div aria-hidden className="h-full w-full animate-pulse bg-white/[0.04]" />
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => open(url)}
                    className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center text-foreground hover:bg-white"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeAt(i)}
                    className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center text-destructive hover:bg-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {urls.length < MAX_PER_TAB && (
        <button
          ref={dropZoneRef}
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (e.dataTransfer.files.length) add(e.dataTransfer.files);
          }}
          disabled={uploading}
          className={cn(
            "w-full flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-6 text-xs text-muted-foreground transition-all",
            dragging
              ? "border-primary/60 bg-primary/4 text-primary"
              : "border-border/50 hover:border-primary/40 hover:bg-muted/30",
            uploading && "opacity-60 cursor-wait"
          )}
        >
          <ImagePlus className={cn("w-5 h-5", dragging ? "text-primary" : "text-muted-foreground/60")} />
          {uploading ? (
            <span>Uploading...</span>
          ) : (
            <>
              <span className="font-medium">
                {urls.length === 0 ? `Add ${label} screenshots` : "Add more"}
              </span>
              <span className="text-muted-foreground/60">
                Click · drag &amp; drop · or paste · {MAX_PER_TAB - urls.length} remaining
              </span>
            </>
          )}
        </button>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && add(e.target.files)}
      />

      {lightbox && (
        <div className="screenshot-lightbox-overlay" onClick={() => setLightbox(null)}>
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
          >
            <X className="w-4 h-4" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox}
            alt="Full size"
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
