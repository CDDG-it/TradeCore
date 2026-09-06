"use client";

import Link from "next/link";
import { ArrowDown } from "lucide-react";
import { motion, useScroll, useMotionValueEvent } from "motion/react";
import { useState } from "react";

const NUNITO = "var(--font-nunito), system-ui, sans-serif";

/**
 * Top-of-hero navigation: brand at the left, one Features button in the middle
 * that takes you down to the product cards, then Sign in and Make account.
 *
 * The Features menu used to be a hover dropdown. A menu that only ever pointed
 * at four anchors on the same page was a lid over a door: the cards say what
 * the product is far better than a list of names, so the button just opens
 * them.
 *
 * Two details the bar carries: it sits transparent over the hero and only takes
 * on its glass and border once you have scrolled past it, and it draws a
 * hairline of reading progress along its bottom edge.
 */
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
      className="sticky top-0 z-30 px-4 py-4 transition-[background-color,border-color,backdrop-filter] duration-300 sm:px-6"
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

      <div className="mx-auto grid max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4">
        {/* Brand — logo + wordmark, same font family as the hero heading, much smaller */}
        <Link href="/" className="flex items-center gap-2.5 justify-self-start transition-opacity hover:opacity-80">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/tradingmc-app-dark.svg" alt="" width={44} height={44} className="h-9 w-9 shrink-0 sm:h-11 sm:w-11" />
          <span className="text-base font-black leading-none tracking-tight" style={{ fontFamily: NUNITO }}>
            <span style={{ color: "rgba(248,250,252,0.92)" }}>Trading</span>
            <span style={{ background: "linear-gradient(90deg,#14B8A6,#0D9488)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>MC</span>
          </span>
        </Link>

        {/* Centre — one way into the product: the cards. */}
        <nav className="col-start-2 flex items-center justify-center" style={{ fontFamily: NUNITO }}>
          <a
            href="#products"
            className="group inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-[rgba(248,250,252,0.60)] transition-colors duration-200 hover:text-[rgba(248,250,252,0.92)]"
          >
            Features
            <ArrowDown className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-y-0.5" />
          </a>
        </nav>

        {/* Right nav — account actions, pushed to the far right */}
        <nav className="col-start-3 flex items-center justify-end gap-1 sm:gap-2" style={{ fontFamily: NUNITO }}>
          <Link
            href="/login"
            className="rounded-full px-3 py-1.5 text-sm font-semibold text-[rgba(248,250,252,0.60)] transition-colors duration-200 hover:text-[rgba(248,250,252,0.92)]"
          >
            Sign in
          </Link>

          <Link
            href="/signup"
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
            style={{
              background: "linear-gradient(135deg,#14B8A6 0%,#0D9488 100%)",
              boxShadow: "0 2px 14px rgba(20,184,166,0.35), 0 1px 2px rgba(0,0,0,0.30)",
            }}
          >
            Make account
          </Link>
        </nav>
      </div>
    </header>
  );
}
