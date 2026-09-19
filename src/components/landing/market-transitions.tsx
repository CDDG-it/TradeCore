"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";

/** Decorative, scroll-led bridges. The reference frames and chart geometry are local assets. */
export function MarketTransition({ direction }: { direction: "into-light" | "into-dark" }) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: sceneRef, offset: ["start end", "end start"] });
  const artworkY = useTransform(scrollYProgress, [0, 1], [36, -36]);
  const candlesY = useTransform(scrollYProgress, [0, 0.5, 1], [26, 0, -22]);
  const chartY = useTransform(scrollYProgress, [0, 1], [-15, 18]);
  const lineLength = useTransform(scrollYProgress, [0.05, 0.75], [0.15, 1]);
  const artworkOpacity = useTransform(scrollYProgress, [0, 0.35, 0.72, 1], [0.45, 1, 1, 0.55]);
  const enteringLight = direction === "into-light";

  return (
    <div
      ref={sceneRef}
      aria-hidden="true"
      className={`marketing-transition ${enteringLight ? "marketing-transition--light" : "marketing-transition--dark"}`}
    >
      <motion.div
        className={`marketing-transition-art ${enteringLight ? "marketing-transition-art--candles" : "marketing-transition-art--tunnel"}`}
        style={reduceMotion ? undefined : { y: artworkY, opacity: artworkOpacity }}
      >
        <div className="marketing-transition-reference" />
        {enteringLight ? (
          <svg className="marketing-transition-overlay" viewBox="0 0 502 502" fill="none" focusable="false">
            <defs>
              <linearGradient id="landing-candle-light" x1="0" y1="0" x2="1" y2="1">
                <stop stopColor="#b8fff1" />
                <stop offset="0.48" stopColor="#14b8a6" />
                <stop offset="1" stopColor="#075a72" />
              </linearGradient>
              <filter id="landing-candle-glow" x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation="5" />
              </filter>
            </defs>
            <motion.g style={reduceMotion ? undefined : { y: candlesY }}>
              {[
                { x: 91, y: 222, body: 120, wick: 185, width: 26 },
                { x: 176, y: 116, body: 61, wick: 112, width: 25 },
                { x: 246, y: 156, body: 43, wick: 99, width: 23 },
                { x: 305, y: 186, body: 142, wick: 205, width: 26 },
                { x: 362, y: 254, body: 38, wick: 119, width: 22 },
                { x: 406, y: 170, body: 79, wick: 123, width: 25 },
              ].map((candle) => (
                <g key={candle.x}>
                  <line x1={candle.x} x2={candle.x} y1={candle.y - 24} y2={candle.y - 24 + candle.wick} stroke="#a3efe5" strokeOpacity=".85" strokeWidth="1.5" />
                  <rect x={candle.x - candle.width / 2} y={candle.y} width={candle.width} height={candle.body} rx="3" fill="#14b8a6" opacity=".48" filter="url(#landing-candle-glow)" />
                  <rect x={candle.x - candle.width / 2} y={candle.y} width={candle.width} height={candle.body} rx="2" fill="url(#landing-candle-light)" fillOpacity=".83" stroke="#a1f3e8" strokeOpacity=".7" />
                  <path d={`M ${candle.x - candle.width / 2} ${candle.y + candle.body} l 6 5 h ${candle.width - 6} l -6 -5`} fill="#b8fff1" fillOpacity=".6" />
                </g>
              ))}
            </motion.g>
            <motion.path
              d="M 40 369 C 122 362, 154 242, 218 235 S 307 319, 358 283 S 408 222, 469 211"
              stroke="#61e5d8" strokeWidth="1.6" strokeOpacity=".75" strokeLinecap="round"
              style={reduceMotion ? undefined : { pathLength: lineLength }}
            />
          </svg>
        ) : (
          <svg className="marketing-transition-overlay" viewBox="0 0 502 282" fill="none" focusable="false">
            <defs>
              <linearGradient id="landing-tunnel-bar" x1="0" y1="0" x2="1" y2="0">
                <stop stopColor="#f2fffc" />
                <stop offset="1" stopColor="#81d9dc" />
              </linearGradient>
            </defs>
            <motion.g style={reduceMotion ? undefined : { y: chartY }}>
              {[
                { x: 19, top: 154, h: 74, w: 10 }, { x: 43, top: 114, h: 82, w: 10 },
                { x: 70, top: 82, h: 108, w: 11 }, { x: 98, top: 125, h: 48, w: 8 },
                { x: 136, top: 29, h: 78, w: 10 }, { x: 166, top: 57, h: 64, w: 9 },
                { x: 187, top: 82, h: 54, w: 8 }, { x: 222, top: 108, h: 42, w: 7 },
                { x: 246, top: 85, h: 40, w: 7 }, { x: 262, top: 70, h: 31, w: 5 },
              ].map((bar) => (
                <g key={bar.x}>
                  <line x1={bar.x + bar.w / 2} x2={bar.x + bar.w / 2} y1={bar.top - 20} y2={bar.top + bar.h + 21} stroke="#b9f8f3" strokeOpacity=".65" />
                  <rect x={bar.x} y={bar.top} width={bar.w} height={bar.h} fill="url(#landing-tunnel-bar)" fillOpacity=".8" />
                </g>
              ))}
            </motion.g>
            <motion.path d="M 0 194 L 56 180 L 102 173 L 151 163 L 202 158 L 255 145 L 301 141 L 356 137 L 501 135" stroke="#06b6d4" strokeWidth="2" strokeOpacity=".85" style={reduceMotion ? undefined : { pathLength: lineLength }} />
            <motion.path d="M 0 214 L 70 203 L 143 192 L 214 182 L 278 168 L 336 161 L 501 149" stroke="#70d8d0" strokeWidth="1" strokeOpacity=".55" style={reduceMotion ? undefined : { pathLength: lineLength }} />
          </svg>
        )}
      </motion.div>
    </div>
  );
}
