"use client";
/* eslint-disable @next/next/no-img-element -- Signed storage URLs need their original chart pixels. */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useScreenshots } from "@/lib/supabase/use-screenshots";

/** How long the pointer rests on a tile before its chart opens large. */
export const HOVER_PREVIEW_DELAY_MS = 800;

export interface HoverPreviewTarget {
  /** The stored screenshot path. */
  path: string;
  /** The tile's thumbnail, shown at once while the large copy loads. */
  thumb: string;
  title: string;
  detail: string;
  detailColor?: string;
}

const EDGE = 32;
const MAX_WIDTH = 1040;
const CAPTION = 40;

/** Centred in the viewport, as large as it allows, keeping the chart box 16:9. */
function size() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  return Math.min(MAX_WIDTH, vw - EDGE * 2, ((vh - EDGE * 2 - CAPTION) * 16) / 9);
}

/**
 * A large, read-only view of a calendar tile's chart that opens in the middle
 * of the screen while the pointer rests on the tile. It takes no pointer
 * events: moving off the tile closes it, and a click still goes to the tile.
 */
export function ScreenshotHoverPreview({ target, onClose }: { target: HoverPreviewTarget | null; onClose: () => void }) {
  const reduce = useReducedMotion();
  const { display, failed } = useScreenshots(null, target ? [target.path] : [], "preview");
  const [loaded, setLoaded] = useState<string | null>(null);
  const large = target && !failed(target.path) ? display(target.path) : null;
  const ready = !!large && loaded === large;

  // A scroll, resize or key press closes it.
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
  const width = target ? size() : 0;

  return createPortal(
    <AnimatePresence>
      {target && (
        <motion.div
          key={target.path}
          className="pointer-events-none fixed inset-0 z-[70] flex items-center justify-center bg-[#04080f]/55"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.1 } }}
          transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
        >
        <motion.div
          role="tooltip"
          aria-label={`${target.title} chart`}
          className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b1120] shadow-[0_30px_80px_-20px_rgba(0,0,0,.75),0_0_0_1px_rgba(20,184,166,.08)]"
          style={{ width }}
          initial={{ scale: reduce ? 1 : 0.96 }}
          animate={{ scale: 1 }}
          exit={{ scale: reduce ? 1 : 0.98 }}
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
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
