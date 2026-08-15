"use client";

/**
 * Flow-field particle background. Adapted from KokonutUI's FlowField (MIT,
 * https://kokonutui.com) — reworked to fill its parent container (instead of the
 * viewport) and locked to the TradingMC palette: turquoise→cyan streams over the
 * navy base. Used only behind the landing showcase cards.
 */

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface Particle {
  x: number;
  y: number;
  speed: number;
  hue: number;
  life: number;
  maxLife: number;
}

// Navy base matches --background (#0B1120) so the field blends seamlessly into
// the surrounding section. Hues run turquoise (168) → cyan (~194).
const BG = "11, 17, 32";
const HUE_START = 170;
const HUE_RANGE = 24;
const SATURATION = 85;
const LIGHTNESS = 60;
const TRAIL_ALPHA = 0.045;

const PARTICLE_COUNTS = { sparse: 600, medium: 1100, dense: 1800 } as const;
type Density = keyof typeof PARTICLE_COUNTS;

/** Smooth organic 2D noise via a multi-octave trig series → angle in radians. */
function fieldAngle(x: number, y: number, t: number): number {
  const s = 0.0025;
  return (
    Math.sin(x * s + t * 0.0007) * Math.PI +
    Math.cos(y * s + t * 0.0005) * Math.PI +
    Math.sin((x + y) * s * 0.6 + t * 0.0009) * Math.PI * 0.6 +
    Math.cos((x - y) * s * 0.4 + t * 0.0006) * Math.PI * 0.4
  );
}

interface FlowFieldProps {
  className?: string;
  density?: Density;
  /** Motion multiplier. 1 = original pace; lower = slower, calmer blooming. */
  speed?: number;
}

export function FlowField({ className, density = "medium", speed = 1 }: FlowFieldProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const count = PARTICLE_COUNTS[density];
    const dpr = window.devicePixelRatio ?? 1;

    let width = 0;
    let height = 0;
    let animId = 0;
    let time = 0;
    let particles: Particle[] = [];

    const spawnParticle = (): Particle => {
      const maxLife = 200 + Math.floor(Math.random() * 300);
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        speed: 1.1 + Math.random() * 1.8,
        hue: HUE_START + Math.random() * HUE_RANGE,
        life: Math.floor(Math.random() * maxLife),
        maxLife,
      };
    };

    const resize = () => {
      const rect = container.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      if (width === 0 || height === 0) return;

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      ctx.fillStyle = `rgb(${BG})`;
      ctx.fillRect(0, 0, width, height);

      particles = Array.from({ length: count }, spawnParticle);
    };

    const render = () => {
      time += speed;

      // Fade the previous frame — dots persist a few frames, forming soft trails.
      ctx.fillStyle = `rgba(${BG}, ${TRAIL_ALPHA})`;
      ctx.fillRect(0, 0, width, height);

      for (const p of particles) {
        const angle = fieldAngle(p.x, p.y, time);

        p.x += Math.cos(angle) * p.speed * speed;
        p.y += Math.sin(angle) * p.speed * speed;
        p.life++;

        if (p.life > p.maxLife) {
          p.x = Math.random() * width;
          p.y = Math.random() * height;
          p.life = 0;
          p.hue = HUE_START + Math.random() * HUE_RANGE;
          continue;
        }

        if (p.x < 0) p.x += width;
        else if (p.x > width) p.x -= width;
        if (p.y < 0) p.y += height;
        else if (p.y > height) p.y -= height;

        const progress = p.life / p.maxLife;
        const fadeIn = Math.min(progress * 8, 1);
        const fadeOut = Math.min((1 - progress) * 6, 1);
        const alpha = fadeIn * fadeOut * 0.9;

        // Tiny hue shimmer along the flow, clamped to the turquoise→cyan band.
        const hueMod = (p.hue + Math.sin(angle) * 6 + 360) % 360;

        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.3, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${hueMod}, ${SATURATION}%, ${LIGHTNESS}%, ${alpha})`;
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    resize();
    // ResizeObserver catches content-driven size changes; the window listener
    // is a reliable fallback for viewport resizes.
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    window.addEventListener("resize", resize);
    render();

    return () => {
      cancelAnimationFrame(animId);
      observer.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, [density, speed]);

  return (
    <div
      ref={containerRef}
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* Radial vignette + edge fades so the field melts into the navy section */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 70% 65% at 50% 50%, transparent 25%, rgba(${BG}, 0.95) 100%)`,
        }}
      />
      <div
        className="absolute inset-x-0 top-0 h-32"
        style={{ background: `linear-gradient(to bottom, rgb(${BG}), transparent)` }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-32"
        style={{ background: `linear-gradient(to top, rgb(${BG}), transparent)` }}
      />
    </div>
  );
}
