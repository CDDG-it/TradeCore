"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

/**
 * "Fluid field", the Aura UI simplex-noise fluid shader, drawn as a backdrop.
 *
 * The original ships as an iframe that pulls three.js and Tailwind from CDNs;
 * this is the same fragment shader on one fullscreen triangle in a plain WebGL1
 * context, no libraries. The beams run in the TradingMC palette instead of the
 * original blue→violet: turquoise #14B8A6 drifting into cyan #06B6D4 over the
 * navy #0B1120 ground. The grain and the fine diagonal grid sit on top as CSS.
 *
 * The loop pauses while the tab is hidden or the canvas is off screen, and
 * draws a single still frame when `animated` is off or for reduced motion.
 */

const VERTEX = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform float u_time;
uniform vec2 u_resolution;
uniform float u_intensity;

const vec3 NAVY = vec3(0.043, 0.067, 0.125);       // #0B1120
const vec3 TURQUOISE = vec3(0.078, 0.722, 0.651);  // #14B8A6
const vec3 CYAN = vec3(0.024, 0.714, 0.831);       // #06B6D4

// Compact 2D simplex noise.
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  uv.x *= u_resolution.x / u_resolution.y;

  vec2 st = uv * 0.7;
  st += vec2(snoise(st + u_time * 0.05), snoise(st - u_time * 0.05)) * 0.3;

  float beam = smoothstep(0.1, 0.8, snoise(vec2(st.x + st.y * 1.5 - u_time * 0.15, u_time * 0.02)));
  vec3 glow = mix(TURQUOISE, CYAN, snoise(uv * 1.5 + u_time * 0.1) * 0.5 + 0.5);

  gl_FragColor = vec4(NAVY + glow * beam * u_intensity, 1.0);
}
`;

const MAX_DPR = 2;

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
}

/** Fine 45° hatch from the original, at 3% white. */
const GRID: CSSProperties = {
  backgroundImage: "repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 12px)",
};

/** Fractal-noise grain, overlay-blended. */
const GRAIN: CSSProperties = {
  mixBlendMode: "overlay",
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
};

export type FluidFieldBackgroundProps = {
  /** Strength of the turquoise/cyan beams over the navy, 0–1. */
  intensity?: number;
  /** Let the beams flow; off draws one still frame. */
  animated?: boolean;
  /** Seconds-per-second of the flow; 1 is the original pace. */
  speed?: number;
  /** Draw the grain and diagonal grid textures on top. */
  texture?: boolean;
  className?: string;
  style?: CSSProperties;
};

export function FluidFieldBackground({ intensity = 0.6, animated = true, speed = 1, texture = true, className, style }: FluidFieldBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false, premultipliedAlpha: false });
    if (!gl) return;

    const program = gl.createProgram()!;
    const vs = compile(gl, gl.VERTEX_SHADER, VERTEX);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      if (process.env.NODE_ENV !== "production") console.error("FluidFieldBackground:", gl.getShaderInfoLog(fs) || gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);

    // One triangle that covers the whole clip space.
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(program, "u_time");
    const uResolution = gl.getUniformLocation(program, "u_resolution");
    gl.uniform1f(gl.getUniformLocation(program, "u_intensity"), Math.min(1, Math.max(0, intensity)));

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, w, h);
    };

    // Time only advances while drawing, so a pause resumes where it stopped.
    // It starts a little way in so the first frame already has beams on it.
    let seconds = 12;
    let last: number | null = null;
    const draw = (now: number) => {
      if (last !== null) seconds += Math.min((now - last) / 1000, 0.1) * speed;
      last = now;
      resize();
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform1f(uTime, seconds);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const still = !animated || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let onScreen = true;
    const loop = (now: number) => {
      draw(now);
      frame = requestAnimationFrame(loop);
    };
    const sync = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      last = null;
      if (still) draw(performance.now());
      else if (onScreen && !document.hidden) frame = requestAnimationFrame(loop);
    };

    const io = new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting;
      sync();
    });
    io.observe(canvas);
    const ro = new ResizeObserver(() => {
      if (still) draw(performance.now());
    });
    ro.observe(canvas);
    document.addEventListener("visibilitychange", sync);
    sync();

    return () => {
      cancelAnimationFrame(frame);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", sync);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, [intensity, animated, speed]);

  return (
    <div aria-hidden="true" className={cn("pointer-events-none relative overflow-hidden bg-[#0b1120]", className)} style={style}>
      <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" />
      {texture && (
        <>
          <div className="absolute inset-0 opacity-[0.08]" style={GRAIN} />
          <div className="absolute inset-0 opacity-20" style={GRID} />
        </>
      )}
    </div>
  );
}

export default FluidFieldBackground;
