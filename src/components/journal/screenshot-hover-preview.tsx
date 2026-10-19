"use client";
/* eslint-disable @next/next/no-img-element -- Signed storage URLs need their original chart pixels. */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useScreenshots } from "@/lib/supabase/use-screenshots";

/** How long the pointer rests on a tile before its chart opens large. */
export const HOVER_PREVIEW_DELAY_MS = 1200;

export interface HoverPreviewTarget {
  /** The stored screenshot path. */
  path: string;
  /** The tile's thumbnail, shown at once while the large copy loads. */
  thumb: string;
  /** Where the tile sits on screen; the preview opens beside it. */
  rect: DOMRect;
  title: string;
  detail: string;
  detailColor?: string;
}

const GAP = 12;
const EDGE = 16;
const MAX_WIDTH = 760;
const MIN_WIDTH = 320;
const CAPTION = 40;

/**
 * Where the preview goes: beside the tile, on whichever side has more room,
 * as large as that side allows, and vertically centred on the tile without
 * leaving the viewport. Never over the tile itself, so the chart under the
 * pointer stays visible.
 */
function place(rect: DOMRect) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const right = vw - rect.right - GAP - EDGE;
  const left = rect.left - GAP - EDGE;
  const side = right >= left ? "right" : "left";
  let width = Math.min(MAX_WIDTH, Math.max(right, left));
  // The chart box is 16:9; shrink to fit a short window.
  width = Math.min(width, ((vh - EDGE * 2 - CAPTION) * 16) / 9);
  if (width < MIN_WIDTH) return null;
  const height = (width * 9) / 16 + CAPTION;
  const x = side === "right" ? rect.right + GAP : rect.left - GAP - width;
  const y = Math.min(Math.max(EDGE, rect.top + rect.height / 2 - height / 2), vh - EDGE - height);
  return { x, y, width, side } as const;
}

/**
 * A large, read-only view of a calendar tile's chart that opens while the
 * pointer rests on the tile. It takes no pointer events: moving off the tile
 * closes it, and a click still goes to the tile underneath.
 */
export function ScreenshotHoverPreview({ target, onClose }: { target: HoverPreviewTarget | null; onClose: () => void }) {
  const reduce = useReducedMotion();
  const { display, failed } = useScreenshots(null, target ? [target.path] : [], "preview");
  const [loaded, setLoaded] = useState<string | null>(null);
  const large = target && !failed(target.path) ? display(target.path) : null;
  const ready = !!large && loaded === large;

  // A scroll or a key moves the tile away from the preview: close it.
  useEffect(() => {
    if (!target) return;
    const close = () => onClose();
    window.addEventListener("scroll", close, { capture: true, passive: true });
    window.addEventListener("resize", close);
    window.addEventListener("keydown", close);
    return () => {
      window.removeEventListener("scroll", close, { capture: true });
      window.removeEventListener("resize", close);
      window.removeEventListener("keydown", close);
    };
  }, [target, onClose]);

  if (typeof document === "undefined") return null;
  const spot = target ? place(target.rect) : null;

  return createPortal(
    <AnimatePresence>
      {target && spot && (
        <motion.div
          key={target.path}
          role="tooltip"
          aria-label={`${target.title} chart`}
          className="pointer-events-none fixed z-[70] overflow-hidden rounded-2xl border border-white/10 bg-[#0b1120] shadow-[0_30px_80px_-20px_rgba(0,0,0,.75),0_0_0_1px_rgba(20,184,166,.08)]"
          style={{ left: spot.x, top: spot.y, width: spot.width, transformOrigin: spot.side === "right" ? "left center" : "right center" }}
          initial={{ opacity: 0, scale: reduce ? 1 : 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: reduce ? 1 : 0.98, transition: { duration: 0.1 } }}
          transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
        >
          <div className="relative aspect-video w-full bg-[#0a1323]">
            {!ready && <img src={target.thumb} alt="" className="absolute inset-0 h-full w-full object-contain" />}
            {large && (
              <img
                src={large}
                alt=""
                onLoad={() => setLoaded(large)}
                className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-150 ${ready ? "opacity-100" : "opacity-0"}`}
              />
            )}
          </div>
          <div className="flex h-10 items-center justify-between gap-3 border-t border-white/[.06] px-3.5 text-xs">
            <span className="truncate font-semibold text-foreground">{target.title}</span>
            <span className="shrink-0 font-bold tabular-nums" style={{ color: target.detailColor }}>{target.detail}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
