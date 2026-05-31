"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "@/lib/theme-context";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Candle { o: number; h: number; l: number; c: number }

// ── Data generation (stable, runs once at module load) ────────────────────────
function genCandles(n: number, seed = 42): Candle[] {
  // Simple seeded pseudo-random for consistent SSR/CSR
  let s = seed;
  const rand = () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };

  const out: Candle[] = [];
  let p = 4820;
  for (let i = 0; i < n; i++) {
    const d = (rand() - 0.47) * 95;
    const o = p;
    const c = p + d;
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
  const mouseRef = useRef({ x: -1, y: -1, active: false });
  const offsetRef = useRef(0);
  const rafRef = useRef<number>(0);

  const visible = pathname === "/dashboard" && theme !== "light";

  useEffect(() => {
    if (!visible) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const onMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY, active: true };
    };
    const onLeave = () => { mouseRef.current.active = false; };
    window.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onLeave);

    const TOTAL = N * STEP;

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      const off = offsetRef.current % TOTAL;
      const startIdx = Math.floor(off / STEP) % N;
      const pixOff = off % STEP;
      const count = Math.ceil(W / STEP) + 3;

      // ── Compute visible price range ──────────────────────────────────────
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

      // ── Horizontal grid ──────────────────────────────────────────────────
      ctx.strokeStyle = "rgba(255,255,255,0.028)";
      ctx.lineWidth = 1;
      for (let i = 0; i <= 6; i++) {
        const y = cTop + (i / 6) * cH;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }

      // ── Vertical grid ────────────────────────────────────────────────────
      ctx.strokeStyle = "rgba(255,255,255,0.018)";
      const vCount = Math.floor(W / 120);
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

        // Wick
        ctx.strokeStyle = bull
          ? "rgba(249,115,22,0.32)"
          : "rgba(172,48,14,0.26)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, py(c.h));
        ctx.lineTo(cx, py(c.l));
        ctx.stroke();

        // Body fill
        ctx.fillStyle = bull
          ? "rgba(249,115,22,0.18)"
          : "rgba(172,48,14,0.15)";
        ctx.fillRect(x, bTop, W_CANDLE, bH);

        // Body border
        ctx.strokeStyle = bull
          ? "rgba(249,115,22,0.42)"
          : "rgba(172,48,14,0.32)";
        ctx.lineWidth = 0.75;
        ctx.strokeRect(x, bTop, W_CANDLE, bH);
      }

      // ── SMA 20 (amber) ───────────────────────────────────────────────────
      ctx.strokeStyle = "rgba(249,115,22,0.28)";
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

      // ── SMA 50 (gold, dashed) ────────────────────────────────────────────
      ctx.strokeStyle = "rgba(251,191,36,0.20)";
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

      // ── Crosshair ────────────────────────────────────────────────────────
      const { x: mx, y: my, active } = mouseRef.current;
      if (active && mx >= 0 && my >= 0) {
        ctx.strokeStyle = "rgba(249,115,22,0.45)";
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);

        ctx.beginPath(); ctx.moveTo(0, my); ctx.lineTo(W, my); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(mx, 0); ctx.lineTo(mx, H); ctx.stroke();
        ctx.setLineDash([]);

        // Price label (right edge)
        if (my >= cTop && my <= cBot) {
          const price = maxP - ((my - cTop) / cH) * pRange;
          const label = price.toFixed(0);

          const lw = 54, lh = 20;
          ctx.fillStyle = "rgba(249,115,22,0.92)";
          ctx.fillRect(W - lw - 2, my - lh / 2, lw, lh);

          ctx.fillStyle = "rgba(0,0,0,0.88)";
          ctx.font = "bold 11px monospace";
          ctx.textAlign = "right";
          ctx.textBaseline = "middle";
          ctx.fillText(label, W - 6, my);
        }

        // Dot at candle intersection
        const relX = mx % STEP;
        const nearCandleCenter = relX >= 0 && relX <= W_CANDLE;
        if (nearCandleCenter) {
          ctx.fillStyle = "rgba(249,115,22,0.70)";
          ctx.beginPath();
          ctx.arc(mx, my, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // ── Advance ──────────────────────────────────────────────────────────
      offsetRef.current += 0.28;
      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
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
