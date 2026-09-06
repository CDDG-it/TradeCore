"use client";

import { useEffect, useRef } from "react";

// Dark bg constant – app navy background  #0B1120 ≈ rgba(11,17,32)
const DARK = "rgba(11,17,32,";

// ── Candle generation ────────────────────────────────────────────────────────
interface Candle { o: number; h: number; l: number; c: number }

function genCandles(n: number, seed = 42): Candle[] {
  let s = seed;
  const rand = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  const out: Candle[] = [];
  let p = 4820;
  for (let i = 0; i < n; i++) {
    const d = (rand() - 0.47) * 100;
    const o = p, c = p + d;
    const h = Math.max(o, c) + rand() * 60;
    const l = Math.min(o, c) - rand() * 60;
    p = c;
    out.push({ o, h, l, c });
  }
  return out;
}

const N = 200;
const CANDLES = genCandles(N, 77);
const W = 14;
const GAP = 6;
const STEP = W + GAP;

/**
 * Slowly drifting candlestick chart on the dark navy landing background.
 * Turquoise bulls, neutral gray bears, with a radial mask that keeps the center
 * readable for overlaid content. Used on the landing hero and auth pages.
 */
export function CandlesCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offsetRef = useRef(0);
  const lastTsRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);
  // Cursor position in canvas space. `tx/ty` are the raw targets set on mouse
  // move; `x/y` chase them each frame so the spotlight glides rather than snaps.
  const pointerRef = useRef<{ x: number; y: number; tx: number | null; ty: number | null }>({
    x: 0,
    y: 0,
    tx: null,
    ty: null,
  });
  // Smoothed y-scale: without this the chart visibly "jumps" every time a
  // candle scrolls out of the visible window and min/max recompute.
  const scaleRef = useRef<{ min: number; max: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let dpr = window.devicePixelRatio || 1;
    const resize = () => {
      dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const TOTAL = N * STEP;

    const draw = (ts: number) => {
      if (!reducedMotion) {
        if (lastTsRef.current !== null) {
          const dt = Math.min(ts - lastTsRef.current, 50);
          offsetRef.current += (dt / 1000) * 16;
        }
        lastTsRef.current = ts;
      }

      const cw = canvas.offsetWidth;
      const ch = canvas.offsetHeight;
      ctx.clearRect(0, 0, cw, ch);

      // Ease the cursor position; idle at the content center until first move.
      const ptr = pointerRef.current;
      if (ptr.tx === null || ptr.ty === null) {
        ptr.x = cw / 2;
        ptr.y = ch * 0.42;
      } else {
        ptr.x += (ptr.tx - ptr.x) * 0.08;
        ptr.y += (ptr.ty - ptr.y) * 0.08;
      }
      // Gentle parallax: the whole chart drifts a few px toward the cursor.
      const parX = ((ptr.x - cw / 2) / cw) * 22;
      const parY = ((ptr.y - ch / 2) / ch) * 14;

      const off = offsetRef.current % TOTAL;
      const startIdx = Math.floor(off / STEP) % N;
      const pixOff = off % STEP;
      const count = Math.ceil(cw / STEP) + 3;

      let tMin = Infinity, tMax = -Infinity;
      for (let i = 0; i < count; i++) {
        const c = CANDLES[(startIdx + i) % N];
        if (c.l < tMin) tMin = c.l;
        if (c.h > tMax) tMax = c.h;
      }
      const pad = (tMax - tMin) * 0.28;
      tMin -= pad; tMax += pad;

      if (!scaleRef.current) scaleRef.current = { min: tMin, max: tMax };
      const sc = scaleRef.current;
      const k = 0.04; // per-frame lerp toward target scale
      sc.min += (tMin - sc.min) * k;
      sc.max += (tMax - sc.max) * k;
      const pRange = sc.max - sc.min;

      const cTop = ch * 0.04;
      const cBot = ch * 0.96;
      const cH = cBot - cTop;
      const py = (p: number) => cTop + ((sc.max - p) / pRange) * cH;

      // Turquoise bulls, neutral gray bears on dark navy bg. The layer is
      // translated by the parallax offset so it reacts to the cursor.
      ctx.save();
      ctx.translate(parX, parY);
      // Candles near the cursor come up out of the background one by one. The
      // falloff is on the horizontal distance only, so running the cursor along
      // the hero lights a travelling band of the series rather than a blob.
      const REACH = 190;
      for (let i = 0; i < count; i++) {
        const ci = (startIdx + i) % N;
        const c = CANDLES[ci];
        const x = i * STEP - pixOff;
        if (x < -STEP || x > cw + STEP) continue;

        const bull = c.c >= c.o;
        const bTop = py(Math.max(c.o, c.c));
        const bBot = py(Math.min(c.o, c.c));
        const bH = Math.max(1.5, bBot - bTop);
        const cx = x + W / 2;

        // 0 far away, 1 right under the cursor, eased so the edge of the band
        // is soft instead of a hard circle.
        const d = Math.abs(cx + parX - ptr.x);
        const near = d > REACH ? 0 : Math.pow(1 - d / REACH, 2);

        const hue = bull ? "20,184,166" : "100,116,139";
        const base = bull ? 0.55 : 0.45;

        // Wick
        ctx.strokeStyle = `rgba(${hue},${base + near * 0.35})`;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(cx, py(c.h)); ctx.lineTo(cx, py(c.l)); ctx.stroke();
        // Body fill
        ctx.fillStyle = `rgba(${hue},${(bull ? 0.22 : 0.18) + near * 0.3})`;
        ctx.fillRect(x, bTop, W, bH);
        // Body border — the lit candles also gain a faint bloom of their own.
        if (near > 0.05) {
          ctx.shadowColor = `rgba(${hue},${near * 0.5})`;
          ctx.shadowBlur = 12 * near;
        }
        ctx.strokeStyle = `rgba(${hue},${(bull ? 0.72 : 0.55) + near * 0.28})`;
        ctx.lineWidth = 0.75 + near * 0.6;
        ctx.strokeRect(x, bTop, W, bH);
        ctx.shadowBlur = 0;
      }
      ctx.restore();

      // Crosshair — the one gesture every chart shares. Only drawn once the
      // reader has actually moved a pointer, and kept faint enough that it
      // reads as an instrument rather than a graphic.
      if (ptr.tx !== null && ptr.ty !== null) {
        ctx.save();
        ctx.setLineDash([3, 5]);
        ctx.lineWidth = 1;
        const fadeH = ctx.createLinearGradient(0, 0, cw, 0);
        fadeH.addColorStop(0, "rgba(20,184,166,0)");
        fadeH.addColorStop(0.5, "rgba(20,184,166,0.20)");
        fadeH.addColorStop(1, "rgba(20,184,166,0)");
        ctx.strokeStyle = fadeH;
        ctx.beginPath(); ctx.moveTo(0, ptr.y); ctx.lineTo(cw, ptr.y); ctx.stroke();

        const fadeV = ctx.createLinearGradient(0, 0, 0, ch);
        fadeV.addColorStop(0, "rgba(20,184,166,0)");
        fadeV.addColorStop(0.45, "rgba(20,184,166,0.20)");
        fadeV.addColorStop(1, "rgba(20,184,166,0)");
        ctx.strokeStyle = fadeV;
        ctx.beginPath(); ctx.moveTo(ptr.x, 0); ctx.lineTo(ptr.x, ch); ctx.stroke();
        ctx.restore();
      }

      // Cursor spotlight — an additive turquoise glow that lifts the candles it
      // passes over. Drawn before the readability mask so the text area stays calm.
      ctx.globalCompositeOperation = "lighter";
      const spot = ctx.createRadialGradient(ptr.x, ptr.y, 0, ptr.x, ptr.y, 260);
      spot.addColorStop(0, "rgba(20,184,166,0.16)");
      spot.addColorStop(0.5, "rgba(6,182,212,0.05)");
      spot.addColorStop(1, "rgba(20,184,166,0)");
      ctx.fillStyle = spot;
      ctx.fillRect(0, 0, cw, ch);
      ctx.globalCompositeOperation = "source-over";

      // Center radial mask — softens candles in the content area on dark bg
      const radialCx = cw / 2;
      const radialCy = ch * 0.42;
      const radialR = Math.min(cw * 0.46, ch * 0.56);
      const radial = ctx.createRadialGradient(radialCx, radialCy, radialR * 0.10, radialCx, radialCy, radialR);
      radial.addColorStop(0, `${DARK}0.92)`);
      radial.addColorStop(0.38, `${DARK}0.66)`);
      radial.addColorStop(0.72, `${DARK}0.18)`);
      radial.addColorStop(1, `${DARK}0)`);
      ctx.fillStyle = radial;
      ctx.fillRect(0, 0, cw, ch);

      // Edge fades
      const fadeTop = ctx.createLinearGradient(0, 0, 0, ch * 0.14);
      fadeTop.addColorStop(0, `${DARK}0.98)`);
      fadeTop.addColorStop(1, `${DARK}0)`);
      ctx.fillStyle = fadeTop;
      ctx.fillRect(0, 0, cw, ch * 0.14);

      const fadeBot = ctx.createLinearGradient(0, ch * 0.75, 0, ch);
      fadeBot.addColorStop(0, `${DARK}0)`);
      fadeBot.addColorStop(1, `${DARK}0.96)`);
      ctx.fillStyle = fadeBot;
      ctx.fillRect(0, ch * 0.75, cw, ch);

      const fadeL = ctx.createLinearGradient(0, 0, 100, 0);
      fadeL.addColorStop(0, `${DARK}0.95)`);
      fadeL.addColorStop(1, `${DARK}0)`);
      ctx.fillStyle = fadeL;
      ctx.fillRect(0, 0, 100, ch);

      const fadeR = ctx.createLinearGradient(cw - 100, 0, cw, 0);
      fadeR.addColorStop(0, `${DARK}0)`);
      fadeR.addColorStop(1, `${DARK}0.95)`);
      ctx.fillStyle = fadeR;
      ctx.fillRect(cw - 100, 0, 100, ch);

      if (!reducedMotion) rafRef.current = requestAnimationFrame(draw);
    };

    const onResize = () => {
      resize();
      if (reducedMotion) draw(0);
    };
    window.addEventListener("resize", onResize);

    // Pointer rather than mouse events, so a finger dragging across the hero
    // moves the crosshair and lights the candles the same way a cursor does.
    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointerRef.current.tx = e.clientX - rect.left;
      pointerRef.current.ty = e.clientY - rect.top;
    };
    const onLeave = () => {
      pointerRef.current.tx = null;
      pointerRef.current.ty = null;
    };
    if (!reducedMotion) {
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerleave", onLeave);
      window.addEventListener("pointercancel", onLeave);
    }

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("pointercancel", onLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden
    />
  );
}
