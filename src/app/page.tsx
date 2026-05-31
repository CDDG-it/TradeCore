"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FadeIn } from "@/components/ui/fade-in";
import { motion } from "motion/react";
import { useEffect, useRef } from "react";

// Dark bg constant – matches app background oklch(0.08 0.014 252) ≈ rgb(10,11,22)
const DARK = "rgba(10,11,22,";

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

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = MUX_SRC;
      return;
    }

    let hlsInstance: import("hls.js").default | null = null;
    import("hls.js").then(({ default: Hls }) => {
      if (!Hls.isSupported()) return;
      hlsInstance = new Hls({ startLevel: -1 });
      hlsInstance.loadSource(MUX_SRC);
      hlsInstance.attachMedia(video);
    });

    return () => { hlsInstance?.destroy(); };
  }, []);

  return (
    <video
      ref={videoRef}
      autoPlay loop muted playsInline
      className="absolute inset-0 h-full w-full object-cover"
      style={{
        opacity: 0.55,
        filter: "sepia(0.5) saturate(3.0) hue-rotate(10deg) brightness(0.65) contrast(1.08)",
      }}
    />
  );
}

// ── Candlestick background — dark cinematic ──────────────────────────────────
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

      // Candles — more vivid on dark bg
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

        ctx.strokeStyle = bull ? "rgba(249,115,22,0.55)" : "rgba(153,27,27,0.42)";
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(cx, py(c.h)); ctx.lineTo(cx, py(c.l)); ctx.stroke();
        ctx.fillStyle = bull ? "rgba(249,115,22,0.25)" : "rgba(185,28,28,0.20)";
        ctx.fillRect(x, bTop, HERO_W, bH);
        ctx.strokeStyle = bull ? "rgba(249,115,22,0.65)" : "rgba(153,27,27,0.52)";
        ctx.lineWidth = 0.75;
        ctx.strokeRect(x, bTop, HERO_W, bH);
      }

      // Center radial mask — dims candles in text area on dark bg
      const radialCx = W / 2;
      const radialCy = H * 0.42;
      const radialR = Math.min(W * 0.46, H * 0.56);
      const radial = ctx.createRadialGradient(radialCx, radialCy, radialR * 0.10, radialCx, radialCy, radialR);
      radial.addColorStop(0, `${DARK}0.88)`);
      radial.addColorStop(0.38, `${DARK}0.62)`);
      radial.addColorStop(0.72, `${DARK}0.18)`);
      radial.addColorStop(1, `${DARK}0)`);
      ctx.fillStyle = radial;
      ctx.fillRect(0, 0, W, H);

      // Edge fades into dark bg
      const fadeTop = ctx.createLinearGradient(0, 0, 0, H * 0.14);
      fadeTop.addColorStop(0, `${DARK}0.95)`);
      fadeTop.addColorStop(1, `${DARK}0)`);
      ctx.fillStyle = fadeTop;
      ctx.fillRect(0, 0, W, H * 0.14);

      const fadeBot = ctx.createLinearGradient(0, H * 0.75, 0, H);
      fadeBot.addColorStop(0, `${DARK}0)`);
      fadeBot.addColorStop(1, `${DARK}0.90)`);
      ctx.fillStyle = fadeBot;
      ctx.fillRect(0, H * 0.75, W, H);

      const fadeL = ctx.createLinearGradient(0, 0, 100, 0);
      fadeL.addColorStop(0, `${DARK}0.90)`);
      fadeL.addColorStop(1, `${DARK}0)`);
      ctx.fillStyle = fadeL;
      ctx.fillRect(0, 0, 100, H);

      const fadeR = ctx.createLinearGradient(W - 100, 0, W, 0);
      fadeR.addColorStop(0, `${DARK}0)`);
      fadeR.addColorStop(1, `${DARK}0.90)`);
      ctx.fillStyle = fadeR;
      ctx.fillRect(W - 100, 0, 100, H);

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
    <div className="min-h-screen overflow-x-hidden" style={{ background: "oklch(0.08 0.014 252)" }}>

      {/* ── Dark glass header ── */}
      <header
        className="relative z-20 sticky top-0 px-6 py-4"
        style={{
          background: "rgba(10,11,22,0.82)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <span
            className="font-black tracking-tight text-base leading-none"
            style={{ fontFamily: "var(--font-nunito), system-ui, sans-serif" }}
          >
            <span className="text-white">Trade</span>
            <span style={{ background: "linear-gradient(90deg,#F97316,#FBBF24)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>CORE</span>
          </span>
          <Link
            href="/login"
            className="text-sm transition-colors duration-200"
            style={{ fontFamily: "var(--font-nunito), system-ui, sans-serif", fontWeight: 600, color: "rgba(255,255,255,0.38)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.85)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.38)")}
          >
            Sign in
          </Link>
        </div>
      </header>

      {/* ── Hero — full viewport, dark cinematic ── */}
      <section className="relative flex flex-col" style={{ minHeight: "calc(100svh - 57px)" }}>

        {/* Mux video layers */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <HeroVideo />
          {/* Dark base overlay */}
          <div className="absolute inset-0" style={{ background: `${DARK}0.50)` }} />
          {/* Orange bloom — cinematic accent */}
          <div className="absolute inset-0" style={{
            background: "radial-gradient(ellipse 65% 45% at 50% 28%, rgba(249,115,22,0.22) 0%, transparent 68%)"
          }} />
          {/* Vignette — darkens edges */}
          <div className="absolute inset-0" style={{
            background: "radial-gradient(ellipse 100% 100% at 50% 50%, transparent 28%, rgba(10,11,22,0.88) 100%)"
          }} />
          {/* Bottom fade to dark bg */}
          <div className="absolute inset-0" style={{
            background: "linear-gradient(to bottom, transparent 55%, rgba(10,11,22,0.96) 100%)"
          }} />
        </div>

        {/* Atmospheric candlestick — dark variant, on top of video */}
        <HeroCandlesticks />

        {/* Content */}
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 text-center py-20">

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay: 0.10 }}
            className="font-black tracking-tight leading-[0.88] mb-5"
            style={{
              fontFamily: "var(--font-nunito), system-ui, sans-serif",
              fontSize: "clamp(4rem,11vw,9rem)",
              color: "rgba(255,255,255,0.94)",
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
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay: 0.22 }}
            className="mb-10 leading-relaxed"
            style={{
              fontFamily: "var(--font-nunito), system-ui, sans-serif",
              fontSize: "clamp(1rem,2.4vw,1.2rem)",
              fontWeight: 300,
              letterSpacing: "0.02em",
              color: "rgba(255,255,255,0.42)",
            }}
          >
            The Ultimate Trading Tool
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay: 0.34 }}
          >
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2.5 rounded-full px-8 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
              style={{
                fontFamily: "var(--font-nunito), system-ui, sans-serif",
                background: "linear-gradient(135deg,#F97316 0%,#FBBF24 100%)",
                boxShadow: "0 4px 28px rgba(249,115,22,0.40), 0 1px 2px rgba(0,0,0,0.25)",
              }}
            >
              Open dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>

        {/* ── Feature strip — anchored to bottom ── */}
        <FadeIn delay={0.44}>
          <div
            className="relative z-10 border-t"
            style={{ borderColor: "rgba(255,255,255,0.06)" }}
          >
            <div className="mx-auto max-w-2xl grid grid-cols-2 divide-x" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              {PILLARS.map((p) => (
                <div key={p.label} className="px-8 py-5 text-center" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                  <p
                    className="text-sm font-semibold mb-0.5"
                    style={{ fontFamily: "var(--font-nunito), system-ui, sans-serif", color: "rgba(255,255,255,0.78)" }}
                  >
                    {p.label}
                  </p>
                  <p
                    className="text-xs leading-snug"
                    style={{ fontFamily: "var(--font-nunito), system-ui, sans-serif", color: "rgba(255,255,255,0.30)" }}
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
