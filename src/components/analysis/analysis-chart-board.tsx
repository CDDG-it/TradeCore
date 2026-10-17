"use client";
/* eslint-disable @next/next/no-img-element -- Signed storage URLs and local previews need their original chart pixels. */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, ImagePlus, Maximize2, Plus, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { ScreenshotGroup } from "@/lib/types";
import { normalizeTimeframe } from "@/lib/timeframes";
import { useScreenshots, type ScreenshotTarget } from "@/lib/supabase/use-screenshots";
import { deleteScreenshot } from "@/lib/supabase/storage";
import { cn } from "@/lib/utils";

const PRESETS = ["Weekly", "Daily", "4H", "1H", "15m", "5m", "1m"];
const MAX_GROUPS = 8;
const MAX_IMAGES = 5;

/** One large chart, a thumbnail rail, and a separate screenshot group per timeframe. */
export function AnalysisChartBoard({ groups, onChange, target, readOnly = false, demo = false, onUploadingChange }: {
  groups: ScreenshotGroup[];
  onChange?: (groups: ScreenshotGroup[]) => void;
  target: ScreenshotTarget | null;
  readOnly?: boolean;
  demo?: boolean;
  onUploadingChange?: (uploading: boolean) => void;
}) {
  const [active, setActive] = useState(0);
  const [shot, setShot] = useState(0);
  const [adding, setAdding] = useState(false);
  const [custom, setCustom] = useState("");
  const [dragging, setDragging] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const reduce = useReducedMotion();
  const visibleGroups = readOnly ? groups.filter((group) => group.urls.length > 0) : groups;
  const safeActive = Math.min(active, Math.max(0, visibleGroups.length - 1));
  const group = visibleGroups[safeActive];
  const safeShot = Math.min(shot, Math.max(0, (group?.urls.length ?? 0) - 1));
  const url = group?.urls[safeShot];
  const chartSequence = visibleGroups.flatMap((item, groupIndex) => item.urls.map((_, shotIndex) => ({ groupIndex, shotIndex })));
  const sequenceIndex = chartSequence.findIndex((item) => item.groupIndex === safeActive && item.shotIndex === safeShot);
  const { display, upload, fullSize, uploading, error } = useScreenshots(target, group?.urls ?? []);
  const preview = url ? display(url) : null;

  useEffect(() => onUploadingChange?.(uploading), [uploading, onUploadingChange]);
  useEffect(() => {
    if (!lightbox) return;
    function escape(event: KeyboardEvent) { if (event.key === "Escape") setLightbox(null); }
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [lightbox]);

  function choose(index: number) { setActive(index); setShot(0); }
  function moveChart(direction: -1 | 1) {
    if (chartSequence.length < 2) return;
    const start = sequenceIndex < 0 ? (direction === 1 ? -1 : 0) : sequenceIndex;
    const next = chartSequence[(start + direction + chartSequence.length) % chartSequence.length];
    setActive(next.groupIndex);
    setShot(next.shotIndex);
  }
  function updateUrls(urls: string[]) {
    if (!group || !onChange) return;
    onChange(groups.map((item) => item.label === group.label ? { ...item, urls } : item));
  }
  function addGroup(label: string) {
    if (!onChange || groups.length >= MAX_GROUPS) return;
    const next = normalizeTimeframe(label);
    if (!next || groups.some((item) => item.label.toLowerCase() === next.toLowerCase())) return;
    onChange([...groups, { label: next, urls: [] }]);
    setActive(groups.length);
    setShot(0);
    setAdding(false);
    setCustom("");
  }
  function removeGroup() {
    if (!group || !onChange || group.urls.length) return;
    onChange(groups.filter((item) => item.label !== group.label));
    setActive(Math.max(0, safeActive - 1));
  }
  async function addFiles(files: FileList | File[]) {
    if (!group || !onChange || uploading || readOnly) return;
    const images = Array.from(files).filter((file) => file.type.startsWith("image/")).slice(0, MAX_IMAGES - group.urls.length);
    if (!images.length) return;
    try {
      const paths = demo ? await Promise.all(images.map((image) => new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(image);
      }))) : await upload(images);
      updateUrls([...group.urls, ...paths]);
      setShot(group.urls.length);
    } catch { /* The shared hook shows the error. */ }
  }
  function removeShot(index: number) {
    if (!group) return;
    const path = group.urls[index];
    if (path && !path.startsWith("data:") && !path.startsWith("http")) deleteScreenshot(path).catch(() => {});
    updateUrls(group.urls.filter((_, i) => i !== index));
    setShot((value) => Math.max(0, Math.min(value, group.urls.length - 2)));
  }
  async function openFull() {
    if (!url) return;
    const signed = await fullSize(url);
    if (signed) setLightbox(signed);
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex shrink-0 items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground">Chart evidence</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">One timeframe at a time. Keep the structure visible.</p>
        </div>
        {!readOnly && groups.length < MAX_GROUPS && <button type="button" onClick={() => setAdding(!adding)} disabled={uploading}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-primary/25 bg-primary/10 px-2.5 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/15 disabled:opacity-50">
          <Plus className="size-3.5" /> Timeframe
        </button>}
      </div>

      {adding && !readOnly && <div className="shrink-0 rounded-xl border border-border bg-background/70 p-3">
        <p className="mb-2 text-[11px] font-medium text-muted-foreground">Add a chart space for a timeframe</p>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.filter((item) => !groups.some((group) => group.label.toLowerCase() === item.toLowerCase())).map((item) =>
            <button key={item} type="button" onClick={() => addGroup(item)} className="rounded-md border border-border px-2.5 py-1.5 text-xs text-foreground/80 transition-colors hover:border-primary/50 hover:text-primary">{item}</button>)}
        </div>
        <div className="mt-2 flex gap-2">
          <input value={custom} onChange={(event) => setCustom(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addGroup(custom); } }}
            placeholder="Custom timeframe" aria-label="Custom timeframe" className="min-w-0 flex-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs outline-none focus:border-primary" />
          <button type="button" onClick={() => addGroup(custom)} className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">Add</button>
        </div>
      </div>}

      <div role="tablist" aria-label="Chart timeframes" className="flex shrink-0 gap-1.5 overflow-x-auto pb-1">
        {visibleGroups.map((item, index) => <button key={`${item.label}:${index}`} type="button" role="tab" aria-selected={safeActive === index} disabled={uploading}
          onClick={() => choose(index)} className={cn("relative isolate shrink-0 rounded-lg border px-3 py-2 text-xs font-semibold transition-[color,transform] hover:scale-[1.02] disabled:opacity-50",
            safeActive === index ? "border-primary/35 text-primary" : "border-border/70 text-muted-foreground hover:text-foreground")}>
          {safeActive === index && <motion.span layoutId="analysis-timeframe-active" className="absolute inset-0 -z-10 rounded-[7px] bg-primary/12 shadow-[0_0_22px_rgba(20,184,166,.12)]" transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }} />}
          {item.label}<span className="ml-2 text-[10px] opacity-50">{item.urls.length}</span>
        </button>)}
      </div>

      <div className="relative flex min-h-[16rem] flex-1 items-center justify-center overflow-hidden rounded-2xl border border-border/70 bg-[#0a1323] lg:min-h-0"
        onDragOver={!readOnly ? (event) => { event.preventDefault(); setDragging(true); } : undefined}
        onDragLeave={!readOnly ? () => setDragging(false) : undefined}
        onDrop={!readOnly ? (event) => { event.preventDefault(); setDragging(false); void addFiles(event.dataTransfer.files); } : undefined}>
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(20,184,166,.09),transparent_58%)]" />
        <AnimatePresence mode="wait" initial={false}>
          {url ? <motion.div key={`${group.label}:${safeShot}`} className="relative flex h-full w-full items-center justify-center p-3 sm:p-5"
            initial={{ opacity: 0, transform: reduce ? "none" : "scale(.985)" }} animate={{ opacity: 1, transform: "scale(1)" }} exit={{ opacity: 0 }} transition={{ duration: .18, ease: [.23, 1, .32, 1] }}>
            {preview ?
              <img src={preview} alt={`${group.label} chart ${safeShot + 1}`} className="max-h-full max-w-full rounded-lg object-contain shadow-[0_16px_45px_rgba(0,0,0,.35)]" />
              : <div className="h-4/5 w-4/5 animate-pulse rounded-xl bg-white/[.04]" />}
          </motion.div> : <motion.div key="empty" className="relative flex max-w-sm flex-col items-center px-6 py-10 text-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .18 }}>
            <div className="mb-4 flex size-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary"><ImagePlus className="size-6" /></div>
            <p className="text-sm font-semibold text-foreground">{group ? `Add your ${group.label} chart` : "No charts added"}</p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Capture the levels, structure and invalidation you want to remember.</p>
            {!readOnly && group && <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-85 disabled:opacity-50">
              <Plus className="size-3.5" /> {uploading ? "Uploading..." : "Upload screenshot"}
            </button>}
          </motion.div>}
        </AnimatePresence>
        {dragging && <div className="pointer-events-none absolute inset-2 z-10 flex items-center justify-center rounded-xl border-2 border-dashed border-primary bg-primary/10 text-sm font-semibold text-primary">Drop chart here</div>}
        {chartSequence.length > 1 && <>
          <button type="button" onClick={() => moveChart(-1)} aria-label="Previous chart" className="absolute left-2 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-[#0b1120]/85 text-white shadow-lg transition-[background-color,transform] hover:bg-[#1b3345] active:scale-95 sm:left-3"><ChevronLeft className="size-5" /></button>
          <button type="button" onClick={() => moveChart(1)} aria-label="Next chart" className="absolute right-2 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-[#0b1120]/85 text-white shadow-lg transition-[background-color,transform] hover:bg-[#1b3345] active:scale-95 sm:right-3"><ChevronRight className="size-5" /></button>
        </>}
        {url && <span className="absolute bottom-3 left-3 z-10 rounded-md border border-white/10 bg-[#0b1120]/85 px-2 py-1 text-[10px] font-semibold text-white/80">{group.label} · {safeShot + 1} / {group.urls.length}</span>}
        {url && preview && <button type="button" onClick={() => void openFull()} aria-label="Open chart full size" className="absolute right-3 top-3 z-10 flex size-9 items-center justify-center rounded-lg border border-white/15 bg-[#0b1120]/80 text-white"><Maximize2 className="size-4" /></button>}
      </div>

      <div className="flex min-h-14 shrink-0 items-center gap-2 overflow-x-auto pb-1">
        {group?.urls.map((item, index) => <div key={`${item}:${index}`} className={cn("group relative h-14 w-24 shrink-0 overflow-hidden rounded-lg border bg-muted/20", safeShot === index ? "border-primary" : "border-border/60")}>
          <button type="button" onClick={() => setShot(index)} aria-label={`Show ${group.label} chart ${index + 1}`} className="h-full w-full">
            {display(item) ? <img src={display(item)!} alt="" className="h-full w-full object-cover" /> : <span className="block h-full w-full animate-pulse bg-white/[.04]" />}
          </button>
          {!readOnly && <button type="button" onClick={() => removeShot(index)} aria-label={`Remove chart ${index + 1}`} className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-[#0b1120]/85 text-white opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"><X className="size-3" /></button>}
        </div>)}
        {!readOnly && group && group.urls.length > 0 && group.urls.length < MAX_IMAGES && <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} className="flex h-14 w-24 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-[10px] font-medium text-muted-foreground hover:border-primary/50 hover:text-primary disabled:opacity-50"><Plus className="size-4" /> Add chart</button>}
        {!readOnly && group && group.urls.length === 0 && <button type="button" onClick={removeGroup} className="ml-auto shrink-0 text-[11px] text-muted-foreground hover:text-destructive">Remove timeframe</button>}
      </div>
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
      {!readOnly && <input ref={inputRef} type="file" accept="image/*" multiple className="sr-only" tabIndex={-1} onChange={(event) => { if (event.target.files) void addFiles(event.target.files); event.target.value = ""; }} />}
      {lightbox && createPortal(<div role="dialog" aria-modal="true" aria-label="Chart full size" className="fixed inset-0 z-[200] flex items-center justify-center bg-[#050a15]/95 p-4" onClick={() => setLightbox(null)}>
        <button type="button" aria-label="Close chart" onClick={() => setLightbox(null)} className="absolute right-5 top-5 flex size-10 items-center justify-center rounded-full border border-white/15 text-white"><X className="size-5" /></button>
        <img src={lightbox} alt="Chart full size" className="max-h-full max-w-full object-contain" onClick={(event) => event.stopPropagation()} />
      </div>, document.body)}
    </div>
  );
}
