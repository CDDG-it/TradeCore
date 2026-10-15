"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ImageOff, Maximize2 } from "lucide-react";
import { Lightbox } from "@/components/screenshot-upload";
import { getScreenshotUrl, getScreenshotUrls } from "@/lib/supabase/storage";
import { cn } from "@/lib/utils";
import type { ScreenshotGroup } from "@/lib/types";

const isInline = (url: string) => url.startsWith("data:") || url.startsWith("http");

/**
 * Read-only chart viewer that fills the space it is given: one large chart, the
 * timeframe groups (HTF / Entry / ...) as tabs and the rest as thumbnails.
 * Charts are signed at preview size; the original is only fetched when one is
 * opened full screen.
 */
export function ScreenshotGallery({ groups, className }: { groups: ScreenshotGroup[]; className?: string }) {
  const filled = useMemo(() => groups.filter((group) => group.urls.length > 0), [groups]);
  const [groupIndex, setGroupIndex] = useState(0);
  const [shotIndex, setShotIndex] = useState(0);
  const [resolved, setResolved] = useState<Record<string, string>>({});
  const [lightbox, setLightbox] = useState<string | null>(null);

  const group = filled[Math.min(groupIndex, Math.max(0, filled.length - 1))];
  const shots = group?.urls ?? [];
  const current = shots[Math.min(shotIndex, Math.max(0, shots.length - 1))];
  const pathsKey = filled.flatMap((g) => g.urls).join("|");

  useEffect(() => {
    const paths = pathsKey ? pathsKey.split("|").filter((url) => !isInline(url)) : [];
    if (!paths.length) return;
    let active = true;
    getScreenshotUrls(paths, "preview").then((signed) => {
      if (active) setResolved((old) => ({ ...old, ...Object.fromEntries(paths.map((path, i) => [path, signed[i]])) }));
    }).catch(() => {});
    return () => { active = false; };
  }, [pathsKey]);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setLightbox(null); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [lightbox]);

  const src = (url: string) => (isInline(url) ? url : resolved[url] ?? null);

  async function openFull(url: string) {
    if (isInline(url)) { setLightbox(url); return; }
    try { setLightbox(await getScreenshotUrl(url, 3600, "full")); }
    catch { const preview = src(url); if (preview) setLightbox(preview); }
  }

  function step(delta: number) {
    if (!shots.length) return;
    setShotIndex((index) => (index + delta + shots.length) % shots.length);
  }

  if (!filled.length) {
    return (
      <div className={cn("flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 bg-background/25 p-6 text-center", className)}>
        <ImageOff className="h-5 w-5 text-muted-foreground/60" />
        <p className="text-xs text-muted-foreground">No charts saved.</p>
      </div>
    );
  }

  const shown = current ? src(current) : null;

  return (
    <div className={cn("flex min-h-0 flex-col gap-2", className)}>
      {filled.length > 1 && (
        <div className="flex shrink-0 gap-1" role="tablist" aria-label="Chart timeframe">
          {filled.map((g, index) => (
            <button
              key={`${g.label}-${index}`}
              type="button"
              role="tab"
              aria-selected={g === group}
              onClick={() => { setGroupIndex(index); setShotIndex(0); }}
              className={cn(
                "rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors",
                g === group ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {g.label} <span className="tabular-nums opacity-70">{g.urls.length}</span>
            </button>
          ))}
        </div>
      )}

      <div className="group/shot relative min-h-48 flex-1 overflow-hidden rounded-xl border border-border/60 bg-background/50">
        {shown ? (
          <button type="button" onClick={() => current && void openFull(current)} className="absolute inset-0 cursor-zoom-in" aria-label="Open chart full screen">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={shown} alt={`${group?.label ?? "Chart"} screenshot`} className="h-full w-full object-contain" />
          </button>
        ) : (
          <div className="absolute inset-0 animate-pulse bg-muted/20" />
        )}
        <span className="pointer-events-none absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-lg bg-background/70 text-muted-foreground opacity-0 backdrop-blur transition-opacity group-hover/shot:opacity-100">
          <Maximize2 className="h-3.5 w-3.5" />
        </span>
        {shots.length > 1 && (
          <>
            <button type="button" onClick={() => step(-1)} aria-label="Previous chart" className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-background/75 text-foreground backdrop-blur transition-colors hover:bg-background">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => step(1)} aria-label="Next chart" className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-background/75 text-foreground backdrop-blur transition-colors hover:bg-background">
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {shots.length > 1 && (
        <div className="flex shrink-0 gap-1.5 overflow-x-auto pb-0.5">
          {shots.map((url, index) => {
            const thumb = src(url);
            return (
              <button
                key={url}
                type="button"
                onClick={() => setShotIndex(index)}
                aria-label={`Chart ${index + 1}`}
                className={cn("h-12 w-20 shrink-0 overflow-hidden rounded-md border transition-colors", url === current ? "border-primary" : "border-border/60 opacity-70 hover:opacity-100")}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {thumb ? <img src={thumb} alt="" className="h-full w-full object-cover" /> : <span className="block h-full w-full animate-pulse bg-muted/20" />}
              </button>
            );
          })}
        </div>
      )}

      <Lightbox src={lightbox} onClose={() => setLightbox(null)} />
    </div>
  );
}
