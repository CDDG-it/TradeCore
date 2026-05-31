"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FadeIn } from "@/components/ui/fade-in";
import { useEffect, useRef } from "react";

// ── Inline candlestick canvas for hero ───────────────────────────────────────
interface Candle { o: number; h: number; l: number; c: number }

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

const HERO_N = 180;
const HERO_CANDLES = genCandles(HERO_N, 99);
const HERO_W = 11;
const HERO_GAP = 3;
const HERO_STEP = HERO_W + HERO_GAP;

function HeroCandlesticks() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offsetRef = useRef(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener("resize", resize);

    const TOTAL = HERO_N * HERO_STEP;

    const draw = () => {
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      ctx.clearRect(0, 0, W, H);

      const off = offsetRef.current % TOTAL;
      const startIdx = Math.floor(off / HERO_STEP) % HERO_N;
      const pixOff = off % HERO_STEP;
      const count = Math.ceil(W / HERO_STEP) + 3;

      let minP = Infinity, maxP = -Infinity;
      for (let i = 0; i < count; i++) {
        const c = HERO_CANDLES[(startIdx + i) % HERO_N];
        if (c.l < minP) minP = c.l;
        if (c.h > maxP) maxP = c.h;
      }
      const pad = (maxP - minP) * 0.2;
      minP -= pad; maxP += pad;
      const pRange = maxP - minP;

      const cTop = H * 0.08;
      const cBot = H * 0.92;
      const cH = cBot - cTop;
      const py = (p: number) => cTop + ((maxP - p) / pRange) * cH;

      // Grid
      ctx.strokeStyle = "rgba(0,0,0,0.06)";
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const y = cTop + (i / 4) * cH;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }

      // Candles
      for (let i = 0; i < count; i++) {
        const ci = (startIdx + i) % HERO_N;
        const c = HERO_CANDLES[ci];
        const x = i * HERO_STEP - pixOff;
        if (x < -HERO_STEP || x > W + HERO_STEP) continue;

        const bull = c.c >= c.o;
        const bTop = py(Math.max(c.o, c.c));
        const bBot = py(Math.min(c.o, c.c));
        const bH = Math.max(1.5, bBot - bTop);
        const cx = x + HERO_W / 2;

        ctx.strokeStyle = bull ? "rgba(234,88,12,0.55)" : "rgba(153,27,27,0.48)";
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(cx, py(c.h)); ctx.lineTo(cx, py(c.l)); ctx.stroke();
        ctx.fillStyle = bull ? "rgba(249,115,22,0.28)" : "rgba(185,28,28,0.22)";
        ctx.fillRect(x, bTop, HERO_W, bH);
        ctx.strokeStyle = bull ? "rgba(234,88,12,0.65)" : "rgba(153,27,27,0.55)";
        ctx.lineWidth = 0.75;
        ctx.strokeRect(x, bTop, HERO_W, bH);
      }

      // Fade edges
      const fadeL = ctx.createLinearGradient(0, 0, 80, 0);
      fadeL.addColorStop(0, "rgba(255,255,255,1)");
      fadeL.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = fadeL;
      ctx.fillRect(0, 0, 80, H);

      const fadeR = ctx.createLinearGradient(W - 80, 0, W, 0);
      fadeR.addColorStop(0, "rgba(255,255,255,0)");
      fadeR.addColorStop(1, "rgba(255,255,255,1)");
      ctx.fillStyle = fadeR;
      ctx.fillRect(W - 80, 0, 80, H);

      offsetRef.current += 0.22;
      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full"
      style={{ height: 120, display: "block" }}
      aria-hidden
    />
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">

      {/* ── Background video (orange-tinted) ── */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            opacity: 0.55,
            filter: "grayscale(1) brightness(0.75) contrast(1.1)",
          }}
        >
          <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260302_085640_276ea93b-d7da-4418-a09b-2aa5b490e838.mp4" type="video/mp4" />
        </video>
        {/* Orange colour wash */}
        <div className="absolute inset-0"
          style={{ background: "rgba(249,115,22,0.38)", mixBlendMode: "multiply" }} />
        {/* White vignette */}
        <div className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse 100% 100% at 50% 50%, transparent 30%, rgba(255,255,255,0.88) 100%)" }} />
        {/* Top + bottom white fades */}
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0.75) 0%, transparent 25%, transparent 75%, rgba(255,255,255,0.75) 100%)" }} />
        {/* Centre readability wash */}
        <div className="absolute inset-0"
          style={{ background: "rgba(255,255,255,0.18)" }} />
      </div>

      {/* ── Header ── */}
      <header
        className="relative z-20 px-6 py-4 sticky top-0"
        style={{
          background: "rgba(255,255,255,0.82)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(0,0,0,0.07)",
        }}
      >
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <span
            className="font-black tracking-tight text-base leading-none"
            style={{ fontFamily: "var(--font-nunito), system-ui, sans-serif" }}
          >
            <span className="text-gray-900">Trade</span>
            <span style={{ background: "linear-gradient(90deg,#F97316,#FBBF24)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>CORE</span>
          </span>
          <Link
            href="/login"
            className="text-sm text-gray-400 hover:text-gray-900 transition-colors"
            style={{ fontFamily: "var(--font-nunito), system-ui, sans-serif", fontWeight: 600 }}
          >
            Sign in
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
        {/* Candlestick chart — above the hero content */}
        <div className="w-full max-w-2xl mb-10 relative z-10" style={{ opacity: 0.72 }}>
          <HeroCandlesticks />
        </div>

        <div className="mx-auto max-w-xl">
          <FadeIn delay={0.10}>
            <h1
              className="font-heading font-black text-[clamp(3rem,9vw,7rem)] tracking-tight leading-none text-gray-900 mb-6 whitespace-nowrap"
            >
              Trade<span style={{ background: "linear-gradient(135deg, #F97316 0%, #FBBF24 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>core</span>
            </h1>
          </FadeIn>

          <FadeIn delay={0.22}>
            <p className="font-body text-lg font-light text-gray-500 mb-10 leading-relaxed">
              The Ultimate Trading Tool
            </p>
          </FadeIn>

          <FadeIn delay={0.30}>
            <Link
              href="/dashboard"
              className="font-body font-semibold inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm text-white transition-all hover:-translate-y-0.5 active:translate-y-0"
              style={{
                background: "linear-gradient(135deg, #F97316 0%, #FBBF24 100%)",
                boxShadow: "0 4px 28px rgba(249,115,22,0.35)",
              }}
            >
              Open dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
