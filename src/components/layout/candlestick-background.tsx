"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "@/lib/theme-context";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Candle { o: number; h: number; l: number; c: number }

// ── Stable data (module-level, seeded) ───────────────────────────────────────
function genCandles(n: number, seed = 42): Candle[] {
  let s = seed;
  const rand = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  const out: Candle[] = [];
  let p = 4820;
  for (let i = 0; i < n; i++) {
    const d = (rand() - 0.47) * 95;
    const o = p, c = p + d;
    const h = Math.max(o, c) + rand() * 55;
    const l = Math.min(o, c) - rand() * 55;
    p = c;
    out.push({ o, h, l, c });
  }
  return out;
}

function calcSMA(candles: Candle[], period: number): number[] {
  return candles.map((_, i) => {
    if (i < period - 1) return 0;
    const s = candles.slice(i - period + 1, i + 1);
    return s.reduce((a, c) => a + (c.o + c.c) / 2, 0) / period;
  });
}

const N = 220;
const CANDLES = genCandles(N);
const SMA20 = calcSMA(CANDLES, 20);
const SMA50 = calcSMA(CANDLES, 50);
const W_CANDLE = 13;
const GAP = 4;
const STEP = W_CANDLE + GAP;

// ── Component ─────────────────────────────────────────────────────────────────
export function CandlestickBackground() {
  const pathname = usePathname();
  const { theme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offsetRef = useRef(0);
  const lastTsRef = useRef<number | null>(null);
  const themeRef = useRef(theme);
  const rafRef = useRef<number>(0);

  // Keep theme ref in sync
  themeRef.current = theme;

  const visible = [
    "/dashboard", "/journal", "/analysis", "/analytics", "/accounts",
  ].some((p) => pathname === p || pathname.startsWith(p + "/"));

  useEffect(() => {
    if (!visible) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let dpr = window.devicePixelRatio || 1;
    const resize = () => {
      dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      lastTsRef.current = null; // reset timestamp so first frame after resize doesn't jump
    };
    resize();
    window.addEventListener("resize", resize);

    const TOTAL = N * STEP;

    const draw = (ts: number) => {
      if (lastTsRef.current !== null) {
        const dt = Math.min(ts - lastTsRef.current, 100); // cap at 100ms — absorbs tab-switch spikes cleanly
        offsetRef.current += (dt / 1000) * 9; // 9 px/s — slow, cinematic
      }
      lastTsRef.current = ts;

      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      const isDark = themeRef.current !== "light";
      ctx.clearRect(0, 0, W, H);

      const off = offsetRef.current % TOTAL;
      const startIdx = Math.floor(off / STEP) % N;
      const pixOff = off % STEP;
      const count = Math.ceil(W / STEP) + 3;

      // Price range
      let minP = Infinity, maxP = -Infinity;
      for (let i = 0; i < count; i++) {
        const c = CANDLES[(startIdx + i) % N];
        if (c.l < minP) minP = c.l;
        if (c.h > maxP) maxP = c.h;
      }
      const pad = (maxP - minP) * 0.18;
      minP -= pad; maxP += pad;
      const pRange = maxP - minP;

      const cTop = H * 0.10;
      const cBot = H * 0.90;
      const cH = cBot - cTop;
      const py = (p: number) => cTop + ((maxP - p) / pRange) * cH;

      // ── Grid ────────────────────────────────────────────────────────────
      ctx.strokeStyle = isDark
        ? "rgba(255,255,255,0.028)"
        : "rgba(0,0,0,0.055)";
      ctx.lineWidth = 1;
      for (let i = 0; i <= 6; i++) {
        const y = cTop + (i / 6) * cH;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }
      const vCount = Math.floor(W / 120);
      ctx.strokeStyle = isDark ? "rgba(255,255,255,0.018)" : "rgba(0,0,0,0.038)";
      for (let i = 1; i < vCount; i++) {
        const x = (i / vCount) * W;
        ctx.beginPath(); ctx.moveTo(x, cTop); ctx.lineTo(x, cBot); ctx.stroke();
      }

      // ── Candles ──────────────────────────────────────────────────────────
      for (let i = 0; i < count; i++) {
        const ci = (startIdx + i) % N;
        const c = CANDLES[ci];
        const x = i * STEP - pixOff;
        if (x < -STEP || x > W + STEP) continue;

        const bull = c.c >= c.o;
        const bTop = py(Math.max(c.o, c.c));
        const bBot = py(Math.min(c.o, c.c));
        const bH = Math.max(1.5, bBot - bTop);
        const cx = x + W_CANDLE / 2;

        if (isDark) {
          // Match hero section: orange bulls, warm dark bears
          ctx.strokeStyle = bull ? "rgba(249,115,22,0.55)" : "rgba(172,48,14,0.45)";
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(cx, py(c.h)); ctx.lineTo(cx, py(c.l)); ctx.stroke();
          ctx.fillStyle = bull ? "rgba(249,115,22,0.22)" : "rgba(172,48,14,0.18)";
          ctx.fillRect(x, bTop, W_CANDLE, bH);
          ctx.strokeStyle = bull ? "rgba(249,115,22,0.72)" : "rgba(172,48,14,0.55)";
          ctx.lineWidth = 0.75;
          ctx.strokeRect(x, bTop, W_CANDLE, bH);
        } else {
          ctx.strokeStyle = bull ? "rgba(249,115,22,0.55)" : "rgba(16,11,6,0.45)";
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(cx, py(c.h)); ctx.lineTo(cx, py(c.l)); ctx.stroke();
          ctx.fillStyle = bull ? "rgba(249,115,22,0.22)" : "rgba(16,11,6,0.12)";
          ctx.fillRect(x, bTop, W_CANDLE, bH);
          ctx.strokeStyle = bull ? "rgba(249,115,22,0.72)" : "rgba(16,11,6,0.55)";
          ctx.lineWidth = 0.75;
          ctx.strokeRect(x, bTop, W_CANDLE, bH);
        }
      }

      // ── SMA 20 ───────────────────────────────────────────────────────────
      ctx.strokeStyle = isDark ? "rgba(249,115,22,0.38)" : "rgba(249,115,22,0.55)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([]);
      ctx.beginPath();
      let first = true;
      for (let i = 0; i < count; i++) {
        const ci = (startIdx + i) % N;
        if (ci < 19) { first = true; continue; }
        const x = i * STEP - pixOff + W_CANDLE / 2;
        const y = py(SMA20[ci]);
        if (first) { ctx.moveTo(x, y); first = false; }
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // ── SMA 50 ───────────────────────────────────────────────────────────
      ctx.strokeStyle = isDark ? "rgba(251,191,36,0.20)" : "rgba(202,138,4,0.38)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      first = true;
      for (let i = 0; i < count; i++) {
        const ci = (startIdx + i) % N;
        if (ci < 49) { first = true; continue; }
        const x = i * STEP - pixOff + W_CANDLE / 2;
        const y = py(SMA50[ci]);
        if (first) { ctx.moveTo(x, y); first = false; }
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[3]"
      aria-hidden
    />
  );
}
