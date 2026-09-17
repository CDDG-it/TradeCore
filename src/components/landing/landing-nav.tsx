"use client";

import Link from "next/link";
import { motion, useScroll, useMotionValueEvent } from "motion/react";
import { useState } from "react";

const NUNITO = "var(--font-nunito), system-ui, sans-serif";

/** The reading progress line and account actions stay available while scrolling. */
export function LandingNav() {
  const [lifted, setLifted] = useState(false);
  const { scrollYProgress, scrollY } = useScroll();

  // A plain boolean, flipped from a motion value: the bar re-renders twice in a
  // whole session instead of on every scroll frame.
  useMotionValueEvent(scrollY, "change", (y) => {
    setLifted((was) => (was ? y > 24 : y > 72));
  });

  return (
    <header
      className="sticky top-0 z-30 px-4 py-3 transition-[background-color,border-color,backdrop-filter] duration-300 sm:px-6 sm:py-4"
      style={{
        background: lifted ? "rgba(11,17,32,0.88)" : "rgba(11,17,32,0)",
        backdropFilter: lifted ? "blur(20px)" : "blur(0px)",
        WebkitBackdropFilter: lifted ? "blur(20px)" : "blur(0px)",
        borderBottom: `1px solid ${lifted ? "rgba(248,250,252,0.09)" : "rgba(248,250,252,0)"}`,
      }}
    >
      {/* Reading progress. Driven straight off the scroll motion value, so it
          never triggers a React render. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-[-1px] h-px origin-left"
        style={{
          scaleX: scrollYProgress,
          background: "linear-gradient(90deg,#14B8A6,#06B6D4)",
          opacity: lifted ? 1 : 0,
        }}
      />

      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-2 sm:gap-4">
        {/* Brand: logo + wordmark, same font family as the hero heading, much smaller */}
        <Link href="/" className="flex items-center gap-2.5 justify-self-start transition-opacity hover:opacity-80">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/tradingmc-app-dark.svg" alt="" width={44} height={44} className="h-9 w-9 shrink-0 sm:h-11 sm:w-11" />
          <span className="text-base font-black leading-none tracking-tight" style={{ fontFamily: NUNITO }}>
            <span style={{ color: "rgba(248,250,252,0.92)" }}>Trading</span>
            <span style={{ background: "linear-gradient(90deg,#14B8A6,#0D9488)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>MC</span>
          </span>
        </Link>

        <nav aria-label="Landing page sections" className="hidden items-center gap-7 font-heading text-xs font-bold text-[#B8C8D1] lg:flex">
          <a href="#the-problem" className="transition-colors hover:text-[#6BDBCE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]">The problem</a>
          <a href="#the-method" className="transition-colors hover:text-[#6BDBCE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]">How it works</a>
          <a href="#the-moments" className="transition-colors hover:text-[#6BDBCE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]">The process</a>
        </nav>

        {/* Right nav: account actions, pushed to the far right */}
        <nav className="flex shrink-0 items-center justify-end gap-1 sm:gap-2" style={{ fontFamily: NUNITO }}>
          <Link
            href="/login"
            className="whitespace-nowrap rounded-full px-2 py-1.5 text-xs font-semibold text-[rgba(248,250,252,0.60)] transition-colors duration-200 hover:text-[rgba(248,250,252,0.92)] sm:px-3 sm:text-sm"
          >
            Sign in
          </Link>

          <Link
            href="/signup"
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 text-xs font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 sm:px-4 sm:py-1.5 sm:text-sm"
            style={{
              background: "linear-gradient(135deg,#14B8A6 0%,#0D9488 100%)",
              boxShadow: "0 2px 14px rgba(20,184,166,0.35), 0 1px 2px rgba(0,0,0,0.30)",
            }}
          >
            Get started
          </Link>
        </nav>
      </div>
    </header>
  );
}
