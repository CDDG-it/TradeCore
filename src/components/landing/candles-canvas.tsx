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

      // Turquoise bulls, neutral gray bears on dark navy bg
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

        // Wick
        ctx.strokeStyle = bull ? "rgba(20,184,166,0.55)" : "rgba(100,116,139,0.45)";
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(cx, py(c.h)); ctx.lineTo(cx, py(c.l)); ctx.stroke();
        // Body fill
        ctx.fillStyle = bull ? "rgba(20,184,166,0.22)" : "rgba(100,116,139,0.18)";
        ctx.fillRect(x, bTop, W, bH);
        // Body border
        ctx.strokeStyle = bull ? "rgba(20,184,166,0.72)" : "rgba(100,116,139,0.55)";
        ctx.lineWidth = 0.75;
        ctx.strokeRect(x, bTop, W, bH);
      }

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

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
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
