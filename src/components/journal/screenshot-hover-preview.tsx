"use client";
/* eslint-disable @next/next/no-img-element -- Signed storage URLs need their original chart pixels. */

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

/** How long the pointer rests on a tile before its chart opens large. */
export const HOVER_PREVIEW_DELAY_MS = 800;

export interface HoverPreviewTarget {
  /** A sharp copy of the chart, already downloaded and decoded by the caller. */
  src: string;
  /** The tile the pointer rested on, in viewport coordinates. */
  tile: DOMRect;
  title: string;
  detail: string;
  detailColor?: string;
  /** What a click on the enlarged chart does: the same as clicking the tile. */
  onOpen: () => void;
}

const EDGE = 32;
const MAX_WIDTH = 1040;
const CAPTION = 40;
/** Slack around the box and the tile, so a hand that wobbles does not close it. */
const SLACK = 12;

/** Centred in the viewport, as large as it allows, keeping the chart box 16:9. */
function size() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  return Math.min(MAX_WIDTH, vw - EDGE * 2, ((vh - EDGE * 2 - CAPTION) * 16) / 9);
}

const within = (r: { left: number; top: number; right: number; bottom: number }, x: number, y: number) =>
  x >= r.left - SLACK && x <= r.right + SLACK && y >= r.top - SLACK && y <= r.bottom + SLACK;

/**
 * Loads and decodes an image, so it can be shown at full quality in one go.
 * Resolves either way: a copy that fails here still gets its own chance on screen.
 */
export function preloadImage(src: string): Promise<void> {
  const img = new Image();
  img.src = src;
  return img.decode().catch(() => {});
}

/**
 * A large view of a calendar tile's chart, centred on screen.
 *
 * It stays open while the pointer is on the enlarged chart. Before the pointer
 * has reached it, the tile it came from and the stretch between the two also
 * count, so moving from the tile to the chart never closes it. Once the
 * pointer has been on the chart, leaving the chart closes it. A click on the
 * chart opens the day, as the tile would; a click beside it, Escape, a scroll
 * or a resize closes it.
 */
export function ScreenshotHoverPreview({ target, onClose }: { target: HoverPreviewTarget | null; onClose: () => void }) {
  const reduce = useReducedMotion();
  const box = useRef<HTMLDivElement>(null);
  const reached = useRef(false);

  useEffect(() => {
    if (!target) return;
    reached.current = false;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onClose);
    window.addEventListener("scroll", onClose, { capture: true, passive: true });
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onClose);
      window.removeEventListener("scroll", onClose, { capture: true });
    };
  }, [target, onClose]);

  function onPointerMove(event: React.PointerEvent) {
    const chart = box.current?.getBoundingClientRect();
    if (!chart || !target) return;
    const { clientX: x, clientY: y } = event;
    if (within(chart, x, y)) { reached.current = true; return; }
    if (reached.current) { onClose(); return; }
    // On the way from the tile to the chart: the tile, the chart and the
    // rectangle spanning both.
    const t = target.tile;
    const span = { left: Math.min(t.left, chart.left), top: Math.min(t.top, chart.top), right: Math.max(t.right, chart.right), bottom: Math.max(t.bottom, chart.bottom) };
    if (!within(t, x, y) && !within(span, x, y)) onClose();
  }

  if (typeof document === "undefined") return null;
  const width = target ? size() : 0;

  return createPortal(
    <AnimatePresence>
      {target && (
        <motion.div
          key={target.src}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-[#04080f]/55"
          onPointerMove={onPointerMove}
          onWheel={onClose}
          onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.1 } }}
          transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
        >
          <motion.div
            ref={box}
            role="dialog"
            aria-label={`${target.title} chart`}
            onClick={() => { onClose(); target.onOpen(); }}
            className="cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-[#0b1120] shadow-[0_30px_80px_-20px_rgba(0,0,0,.75),0_0_0_1px_rgba(20,184,166,.08)]"
            style={{ width }}
            initial={{ scale: reduce ? 1 : 0.97 }}
            animate={{ scale: 1 }}
            exit={{ scale: reduce ? 1 : 0.98 }}
            transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className="aspect-video w-full bg-[#0a1323]">
              <img src={target.src} alt="" decoding="sync" className="h-full w-full object-contain" />
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
