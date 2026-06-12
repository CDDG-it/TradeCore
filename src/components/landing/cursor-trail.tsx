"use client";

import { useEffect, useRef } from "react";

interface TrailPoint { x: number; y: number; t: number }

// How long a point stays visible before it has fully faded (ms)
const LIFE = 900;

/**
 * Orange line that follows the cursor across the landing page. Drawn on a
 * fixed full-screen canvas: a soft wide glow pass underneath and a thin
 * bright core on top, both fading out per segment as points age.
 * Skipped entirely for touch devices and reduced-motion users.
 */
export function CursorTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointsRef = useRef<TrailPoint[]>([]);
  const rafRef = useRef<number>(0);
  const runningRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // No trail on touch-only devices: there is no hover cursor to follow
    if (window.matchMedia("(pointer: coarse)").matches && !window.matchMedia("(pointer: fine)").matches) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const now = performance.now();
      const pts = (pointsRef.current = pointsRef.current.filter((p) => now - p.t < LIFE));

      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      if (pts.length < 2) {
        // Nothing left to fade — stop the loop until the next pointer move
        runningRef.current = false;
        return;
      }

      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1];
        const b = pts[i];
        // Skip jumps (e.g. cursor re-entering the window somewhere else)
        const dx = b.x - a.x, dy = b.y - a.y;
        if (dx * dx + dy * dy > 200 * 200) continue;

        const age = (now - b.t) / LIFE;          // 0 = fresh, 1 = gone
        const fade = Math.max(0, 1 - age);
        const eased = fade * fade;               // slow fade tail

        // Soft glow pass
        ctx.strokeStyle = `rgba(249,115,22,${0.10 * eased})`;
        ctx.lineWidth = 11;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();

        // Bright core
        ctx.strokeStyle = `rgba(249,115,22,${0.55 * eased})`;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    const onMove = (e: PointerEvent) => {
      pointsRef.current.push({ x: e.clientX, y: e.clientY, t: performance.now() });
      if (!runningRef.current) {
        runningRef.current = true;
        rafRef.current = requestAnimationFrame(draw);
      }
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-50"
      aria-hidden
    />
  );
}
