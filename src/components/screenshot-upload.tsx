"use client";

import { useRef, useState } from "react";
import { ImagePlus, X, ZoomIn, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScreenshotGroup } from "@/lib/types";

interface Props {
  groups: ScreenshotGroup[];
  onChange: (groups: ScreenshotGroup[]) => void;
  maxFilesPerGroup?: number;
  className?: string;
  readOnly?: boolean;
}

const PRESET_LABELS = ["HTF", "LTF", "Trade-entry"];

/** Resize and compress an image file to a max width, returning a base64 data URL */
function compressImage(file: File, maxWidth = 1400): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ScreenshotUpload({
  groups,
  onChange,
  maxFilesPerGroup = 5,
  className,
  readOnly = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [addingGroup, setAddingGroup] = useState(false);
  const [customLabel, setCustomLabel] = useState("");

  const safeTab = Math.min(activeTab, Math.max(0, groups.length - 1));
  const currentGroup = groups[safeTab];

  function addGroup(label: string) {
    const trimmed = label.trim();
    if (!trimmed) return;
    if (groups.some((g) => g.label === trimmed)) return;
    const newGroups = [...groups, { label: trimmed, urls: [] }];
    onChange(newGroups);
    setActiveTab(newGroups.length - 1);
    setAddingGroup(false);
    setCustomLabel("");
  }

  function removeGroup(idx: number) {
    const newGroups = groups.filter((_, i) => i !== idx);
    onChange(newGroups);
    setActiveTab((prev) => Math.min(prev, Math.max(0, newGroups.length - 1)));
  }

  async function processFiles(files: FileList | File[]) {
    if (!currentGroup) return;
    const remaining = maxFilesPerGroup - currentGroup.urls.length;
    const toAdd = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, remaining);
    if (!toAdd.length) return;
    setLoading(true);
    try {
      const compressed = await Promise.all(toAdd.map((f) => compressImage(f)));
      const newGroups = groups.map((g, i) =>
        i === safeTab ? { ...g, urls: [...g.urls, ...compressed] } : g
      );
      onChange(newGroups);
    } finally {
      setLoading(false);
    }
  }

  function removeUrl(groupIdx: number, url: string) {
    const newGroups = groups.map((g, i) =>
      i === groupIdx ? { ...g, urls: g.urls.filter((u) => u !== url) } : g
    );
    onChange(newGroups);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files);
  }

  // ── Read-only mode ──────────────────────────────────────────────────
  if (readOnly) {
    const populated = groups.filter((g) => g.urls.length > 0);
    if (!populated.length) return null;
    return (
      <div className={cn("space-y-5", className)}>
        {populated.map((group) => (
          <div key={group.label}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              {group.label}
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {group.urls.map((url, i) => (
                <div
                  key={i}
                  className="relative group aspect-video rounded-lg overflow-hidden border border-border/60 bg-muted/30 cursor-pointer"
                  onClick={() => setLightbox(url)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`${group.label} ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <ZoomIn className="w-4 h-4 text-white" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {lightbox && (
          <div className="screenshot-lightbox-overlay" onClick={() => setLightbox(null)}>
            <button
              type="button"
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              onClick={() => setLightbox(null)}
            >
              <X className="w-4 h-4" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightbox}
              alt="Screenshot full size"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </div>
    );
  }

  // ── Edit mode ───────────────────────────────────────────────────────
  return (
    <div className={cn("space-y-3", className)}>
      {/* Tab row */}
      {groups.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          {groups.map((g, i) => (
            <div key={i} className="relative group/tab">
              <button
                type="button"
                onClick={() => setActiveTab(i)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-lg transition-all pr-7",
                  safeTab === i
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                )}
              >
                {g.label}
                {g.urls.length > 0 && (
                  <span
                    className={cn(
                      "ml-1.5 text-[10px] font-normal",
                      safeTab === i ? "opacity-70" : "opacity-50"
                    )}
                  >
                    {g.urls.length}
                  </span>
                )}
              </button>
              {/* Remove tab */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeGroup(i);
                }}
                className="absolute top-0.5 right-0.5 w-5 h-5 rounded-md flex items-center justify-center opacity-0 group-hover/tab:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                title="Remove group"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          ))}

          {/* Add tab */}
          <button
            type="button"
            onClick={() => setAddingGroup(true)}
            className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            Add
          </button>
        </div>
      )}

      {/* Add-group panel */}
      {addingGroup && (
        <div className="border border-border/50 rounded-xl p-4 space-y-3 bg-muted/20">
          <p className="text-xs font-medium text-muted-foreground">
            Choose a timeframe label or enter a custom one
          </p>
          <div className="flex flex-wrap gap-2">
            {PRESET_LABELS.filter((l) => !groups.some((g) => g.label === l)).map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => addGroup(label)}
                className="px-3 py-1.5 text-xs bg-muted hover:bg-primary/10 hover:text-primary rounded-lg transition-colors font-medium"
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
              placeholder="e.g. Setup, Context..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addGroup(customLabel);
                }
                if (e.key === "Escape") {
                  setAddingGroup(false);
                  setCustomLabel("");
                }
              }}
              className="flex-1 px-3 py-1.5 text-xs bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground/50"
            />
            <button
              type="button"
              onClick={() => addGroup(customLabel)}
              className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setAddingGroup(false);
                setCustomLabel("");
              }}
              className="px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* No groups yet */}
      {groups.length === 0 && !addingGroup && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Organize screenshots by timeframe or chart type:
          </p>
          <div className="flex flex-wrap gap-2">
            {PRESET_LABELS.map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => addGroup(label)}
                className="px-3 py-1.5 text-xs bg-muted hover:bg-primary/10 hover:text-primary rounded-lg transition-colors font-medium flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                {label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setAddingGroup(true)}
              className="px-3 py-1.5 text-xs bg-muted hover:bg-primary/10 hover:text-primary rounded-lg transition-colors font-medium flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              Custom
            </button>
          </div>
        </div>
      )}

      {/* Current group screenshots + upload zone */}
      {currentGroup && (
        <>
          {/* Thumbnails */}
          {currentGroup.urls.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {currentGroup.urls.map((url, i) => (
                <div
                  key={i}
                  className="relative group aspect-video rounded-lg overflow-hidden border border-border/60 bg-muted/30"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`${currentGroup.label} ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => setLightbox(url)}
                      className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center text-foreground hover:bg-white transition-colors"
                      title="View full size"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeUrl(safeTab, url)}
                      className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center text-destructive hover:bg-white transition-colors"
                      title="Remove"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Upload zone */}
          {currentGroup.urls.length < maxFilesPerGroup && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              disabled={loading}
              className={cn(
                "w-full flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-7 text-xs text-muted-foreground transition-all",
                dragging
                  ? "border-primary/60 bg-primary/4 text-primary"
                  : "border-border/50 hover:border-primary/40 hover:bg-muted/30",
                loading && "opacity-60 cursor-wait"
              )}
            >
              <ImagePlus
                className={cn(
                  "w-5 h-5",
                  dragging ? "text-primary" : "text-muted-foreground/60"
                )}
              />
              {loading ? (
                <span>Processing...</span>
              ) : (
                <>
                  <span className="font-medium">
                    {currentGroup.urls.length === 0
                      ? `Add ${currentGroup.label} screenshots`
                      : "Add more"}
                  </span>
                  <span className="text-muted-foreground/60">
                    Click or drag & drop · {maxFilesPerGroup - currentGroup.urls.length} remaining ·
                    JPG, PNG, WebP
                  </span>
                </>
              )}
            </button>
          )}
        </>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && processFiles(e.target.files)}
      />

      {/* Lightbox */}
      {lightbox && (
        <div className="screenshot-lightbox-overlay" onClick={() => setLightbox(null)}>
          <button
            type="button"
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            onClick={() => setLightbox(null)}
          >
            <X className="w-4 h-4" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox}
            alt="Screenshot full size"
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
