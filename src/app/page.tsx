"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FadeIn } from "@/components/ui/fade-in";
import { useEffect, useRef } from "react";

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

const HERO_N = 200;
const HERO_CANDLES = genCandles(HERO_N, 77);
const HERO_W = 14;
const HERO_GAP = 6;
const HERO_STEP = HERO_W + HERO_GAP;

// ── Mux HLS video ────────────────────────────────────────────────────────────
const MUX_SRC = "https://stream.mux.com/QgTir2Bu4u6d01CqyKEBCks68PIm2nCM7vhwXgenS00tw.m3u8";

function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Safari supports HLS natively
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = MUX_SRC;
      return;
    }

    // Chrome/Firefox: use hls.js (already in package.json)
    let hlsInstance: import("hls.js").default | null = null;
    import("hls.js").then(({ default: Hls }) => {
      if (!Hls.isSupported()) return;
      hlsInstance = new Hls({ startLevel: -1 });
      hlsInstance.loadSource(MUX_SRC);
      hlsInstance.attachMedia(video);
    });

    return () => {
      hlsInstance?.destroy();
    };
  }, []);

  return (
    <video
      ref={videoRef}
      autoPlay
      loop
      muted
      playsInline
      className="absolute inset-0 h-full w-full object-cover"
      style={{
        opacity: 0.40,
        filter: "sepia(0.6) saturate(2.8) hue-rotate(12deg) brightness(0.75) contrast(1.05)",
      }}
    />
  );
}

// ── Candlestick background — full-section, atmospheric ──────────────────────
function HeroCandlesticks() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offsetRef = useRef(0);
  const lastTsRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
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
    };
    resize();
    window.addEventListener("resize", resize);

    const TOTAL = HERO_N * HERO_STEP;

    const draw = (ts: number) => {
      if (lastTsRef.current !== null) {
        const dt = Math.min(ts - lastTsRef.current, 50);
        offsetRef.current += (dt / 1000) * 16;
      }
      lastTsRef.current = ts;

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
      const pad = (maxP - minP) * 0.28;
      minP -= pad; maxP += pad;
      const pRange = maxP - minP;

      const cTop = H * 0.04;
      const cBot = H * 0.96;
      const cH = cBot - cTop;
      const py = (p: number) => cTop + ((maxP - p) / pRange) * cH;

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

        ctx.strokeStyle = bull ? "rgba(234,88,12,0.28)" : "rgba(153,27,27,0.22)";
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(cx, py(c.h)); ctx.lineTo(cx, py(c.l)); ctx.stroke();
        ctx.fillStyle = bull ? "rgba(249,115,22,0.13)" : "rgba(185,28,28,0.10)";
        ctx.fillRect(x, bTop, HERO_W, bH);
        ctx.strokeStyle = bull ? "rgba(234,88,12,0.32)" : "rgba(153,27,27,0.26)";
        ctx.lineWidth = 0.75;
        ctx.strokeRect(x, bTop, HERO_W, bH);
      }

      // Center radial mask — clears text area
      const radialCx = W / 2;
      const radialCy = H * 0.42;
      const radialR = Math.min(W * 0.46, H * 0.56);
      const radial = ctx.createRadialGradient(radialCx, radialCy, radialR * 0.15, radialCx, radialCy, radialR);
      radial.addColorStop(0, "rgba(255,255,255,0.96)");
      radial.addColorStop(0.45, "rgba(255,255,255,0.72)");
      radial.addColorStop(0.75, "rgba(255,255,255,0.28)");
      radial.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = radial;
      ctx.fillRect(0, 0, W, H);

      const fadeTop = ctx.createLinearGradient(0, 0, 0, H * 0.12);
      fadeTop.addColorStop(0, "rgba(255,255,255,1)");
      fadeTop.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = fadeTop;
      ctx.fillRect(0, 0, W, H * 0.12);

      const fadeBot = ctx.createLinearGradient(0, H * 0.78, 0, H);
      fadeBot.addColorStop(0, "rgba(255,255,255,0)");
      fadeBot.addColorStop(1, "rgba(255,255,255,1)");
      ctx.fillStyle = fadeBot;
      ctx.fillRect(0, H * 0.78, W, H);

      const fadeL = ctx.createLinearGradient(0, 0, 110, 0);
      fadeL.addColorStop(0, "rgba(255,255,255,1)");
      fadeL.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = fadeL;
      ctx.fillRect(0, 0, 110, H);

      const fadeR = ctx.createLinearGradient(W - 110, 0, W, 0);
      fadeR.addColorStop(0, "rgba(255,255,255,0)");
      fadeR.addColorStop(1, "rgba(255,255,255,1)");
      ctx.fillStyle = fadeR;
      ctx.fillRect(W - 110, 0, 110, H);

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
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden
    />
  );
}

// ── Feature pillars ──────────────────────────────────────────────────────────
const PILLARS = [
  { label: "Trade Journal", desc: "Log every trade with full context" },
  { label: "Performance Analytics", desc: "Find patterns in your execution" },
] as const;

// ── Page ─────────────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">

      {/* ── Header ── */}
      <header
        className="relative z-20 sticky top-0 px-6 py-4"
        style={{
          background: "rgba(255,255,255,0.88)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
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
            className="text-sm text-gray-400 hover:text-gray-900 transition-colors duration-200"
            style={{ fontFamily: "var(--font-nunito), system-ui, sans-serif", fontWeight: 600 }}
          >
            Sign in
          </Link>
        </div>
      </header>

      {/* ── Hero — full viewport, unified ── */}
      <section className="relative flex flex-col" style={{ minHeight: "calc(100svh - 57px)" }}>

        {/* Mux HLS video — warm orange-tinted, behind candlesticks */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <HeroVideo />
          {/* White wash to keep the light theme */}
          <div className="absolute inset-0" style={{ background: "rgba(255,255,255,0.62)" }} />
          {/* Subtle orange bloom at top-center */}
          <div className="absolute inset-0" style={{
            background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(249,115,22,0.12) 0%, transparent 70%)"
          }} />
        </div>

        {/* Atmospheric candlestick — on top of video, behind content */}
        <HeroCandlesticks />

        {/* Content — centered in all available space */}
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 text-center py-20">

          <FadeIn delay={0.14}>
            <h1
              className="font-black tracking-tight leading-[0.88] text-gray-900 mb-5"
              style={{
                fontFamily: "var(--font-nunito), system-ui, sans-serif",
                fontSize: "clamp(4rem,11vw,9rem)",
              }}
            >
              Trade
              <span style={{
                background: "linear-gradient(135deg,#F97316 0%,#FBBF24 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                core
              </span>
            </h1>
          </FadeIn>

          <FadeIn delay={0.23}>
            <p
              className="text-gray-400 mb-10 leading-relaxed"
              style={{
                fontFamily: "var(--font-nunito), system-ui, sans-serif",
                fontSize: "clamp(1rem,2.4vw,1.25rem)",
                fontWeight: 400,
                letterSpacing: "0.01em",
              }}
            >
              The Ultimate Trading Tool
            </p>
          </FadeIn>

          <FadeIn delay={0.32}>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2.5 rounded-full px-8 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
              style={{
                fontFamily: "var(--font-nunito), system-ui, sans-serif",
                background: "linear-gradient(135deg,#F97316 0%,#FBBF24 100%)",
                boxShadow: "0 4px 24px rgba(249,115,22,0.32), 0 1px 2px rgba(0,0,0,0.08)",
              }}
            >
              Open dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
          </FadeIn>
        </div>

        {/* ── Feature strip — 2 pillars, anchored to bottom ── */}
        <FadeIn delay={0.44}>
          <div
            className="relative z-10 border-t"
            style={{ borderColor: "rgba(0,0,0,0.06)" }}
          >
            <div className="mx-auto max-w-2xl grid grid-cols-2 divide-x divide-black/[0.06]">
              {PILLARS.map((p) => (
                <div key={p.label} className="px-8 py-5 text-center">
                  <p
                    className="text-sm font-semibold text-gray-800 mb-0.5"
                    style={{ fontFamily: "var(--font-nunito), system-ui, sans-serif" }}
                  >
                    {p.label}
                  </p>
                  <p
                    className="text-xs text-gray-400 leading-snug"
                    style={{ fontFamily: "var(--font-nunito), system-ui, sans-serif" }}
                  >
                    {p.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>

      </section>
    </div>
  );
}
