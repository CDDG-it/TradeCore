"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight, ArrowDown } from "lucide-react";
import { motion, useScroll, useTransform, useMotionValue, useSpring } from "motion/react";
import { animate, splitText, stagger } from "animejs";
import { CandlesCanvas } from "@/components/landing/candles-canvas";
import { LandingGround } from "@/components/landing/landing-ground";
import { LayoutShowcase } from "@/components/landing/layout-showcase";
import { ProductExplorer } from "@/components/landing/product-explorer";
import { LandingFooter } from "@/components/landing/footer";
import { LandingNav } from "@/components/landing/landing-nav";

const NUNITO = "var(--font-nunito), system-ui, sans-serif";

// ── Page ─────────────────────────────────────────────────────────────────────
export default function HomePage() {
  // Scroll-driven parallax: the hero content drifts down and fades as you scroll
  // into the product section, so the two layers feel like they have depth.
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 110]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  // Pointer-driven 3D tilt: the hero content leans toward the cursor. Values are
  // normalized to [-0.5, 0.5] across the hero and spring-smoothed so it glides.
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const springTilt = { stiffness: 70, damping: 18, mass: 0.4 };
  const smoothX = useSpring(pointerX, springTilt);
  const smoothY = useSpring(pointerY, springTilt);
  const tiltY = useTransform(smoothX, [-0.5, 0.5], [-6, 6]);
  const tiltX = useTransform(smoothY, [-0.5, 0.5], [6, -6]);

  const handleHeroPointer = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    pointerX.set((e.clientX - rect.left) / rect.width - 0.5);
    pointerY.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const resetHeroPointer = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  // Split-text reveal for the headline + subtext (anime.js). Each character
  // rises into a clipped mask, staggered, so the copy "typesets" on load.
  const headingRef = useRef<HTMLHeadingElement>(null);
  const paraRef = useRef<HTMLParagraphElement>(null);
  const revealed = useRef(false);

  useEffect(() => {
    if (revealed.current || !headingRef.current || !paraRef.current) return;
    revealed.current = true;

    const { chars: headingChars } = splitText(headingRef.current, {
      chars: { wrap: "clip" },
    });
    const { chars: paraChars } = splitText(paraRef.current, {
      chars: { wrap: "clip" },
    });

    // splitText rewraps each glyph, which breaks the gradient's
    // background-clip on the "MC" span — reapply it to those two chars so the
    // turquoise→cyan fill survives. (MC are the last two characters.)
    for (const el of headingChars.slice(-2) as HTMLElement[]) {
      el.style.background = "linear-gradient(135deg,#14B8A6 0%,#06B6D4 100%)";
      el.style.webkitBackgroundClip = "text";
      el.style.backgroundClip = "text";
      el.style.webkitTextFillColor = "transparent";
    }

    // Reveal the containers now that the text is split (avoids a flash of the
    // un-split copy before the effect runs).
    headingRef.current.style.opacity = "1";
    paraRef.current.style.opacity = "1";

    animate(headingChars, {
      y: [{ to: ["100%", "0%"] }],
      duration: 480,
      ease: "out(3)",
      delay: stagger(28),
    });
    animate(paraChars, {
      y: [{ to: ["100%", "0%"] }],
      duration: 420,
      ease: "out(3)",
      delay: stagger(6, { start: 220 }),
    });
  }, []);

  return (
    // No overflow class here: overflow-x-hidden disables the sticky header and
    // overflow-x-clip kills page scrolling entirely. Sections that animate
    // horizontally contain their own overflow instead.
    <div style={{ background: "#0B1120" }}>

      {/* ── Top navigation: Features dropdown, Coming soon, Sign in, Make account ── */}
      <LandingNav />

      {/* One background carries the hero, the explorer and the cards, so the
          opening stretch reads as a single surface instead of three fills
          stacked on top of each other. */}
      <div className="relative">
        <LandingGround />

      {/* ── Hero — dark navy background, turquoise + neutral candle visuals ── */}
      {/* 53px = header height (py-4 + text-base logo + 1px border).
          overflow-hidden clips the decorative 520px glow and the candle canvas
          to the section — without it the glow sticks ~110px past the viewport on
          a phone and the whole page scrolls sideways. Scoped to the section, so
          it does not disable the sticky header or page scrolling the way an
          overflow rule on the page wrapper would. */}
      <section
        ref={heroRef}
        onMouseMove={handleHeroPointer}
        onMouseLeave={resetHeroPointer}
        className="relative flex flex-col overflow-hidden"
        style={{ minHeight: "calc(100svh - 53px)" }}
      >

        {/* Candlestick background */}
        <CandlesCanvas />

        {/* Ambient drifting glow — adds depth behind the headline */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(20,184,166,0.16) 0%, transparent 65%)" }}
          animate={{ scale: [1, 1.18, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 9, ease: "easeInOut", repeat: Infinity }}
        />

        {/* Content — parallax + fade on scroll */}
        <motion.div
          style={{
            y: contentY,
            opacity: contentOpacity,
            rotateX: tiltX,
            rotateY: tiltY,
            transformPerspective: 1200,
          }}
          className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 text-center py-20">

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <motion.img
            src="/tradingmc-app-dark.svg"
            alt="TradingMC"
            width={104}
            height={104}
            initial={{ opacity: 0, y: 18, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            className="mb-8 h-24 w-24 sm:h-28 sm:w-28"
            style={{ filter: "drop-shadow(0 8px 30px rgba(20,184,166,0.22))" }}
          />

          <h1
            ref={headingRef}
            className="font-black tracking-tight leading-[1.06] mb-6 pb-[0.08em]"
            style={{
              fontFamily: NUNITO,
              fontSize: "clamp(2.5rem,8vw,6rem)",
              color: "rgba(248,250,252,0.94)",
              opacity: 0,
            }}
          >
            Trading
            <span style={{
              background: "linear-gradient(135deg,#14B8A6 0%,#06B6D4 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              MC
            </span>
          </h1>

          <p
            ref={paraRef}
            className="mb-10 max-w-xl leading-relaxed"
            style={{
              fontFamily: NUNITO,
              fontSize: "clamp(1rem,2.4vw,1.2rem)",
              fontWeight: 400,
              letterSpacing: "0.01em",
              color: "rgba(248,250,252,0.60)",
              opacity: 0,
            }}
          >
            Great traders are built beyond the charts. Capture every trade,
            analyze your performance, and develop the habits that drive
            long-term consistency.
          </p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay: 0.34 }}
            className="flex flex-wrap items-center justify-center gap-3"
          >
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2.5 rounded-full px-8 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
              style={{
                fontFamily: NUNITO,
                background: "linear-gradient(135deg,#14B8A6 0%,#0D9488 100%)",
                boxShadow: "0 4px 28px rgba(20,184,166,0.40), 0 1px 3px rgba(0,0,0,0.35)",
              }}
            >
              Open dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 rounded-full border px-7 py-3.5 text-sm font-semibold text-[rgba(248,250,252,0.65)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[rgba(20,184,166,0.45)] hover:text-[rgba(248,250,252,0.92)] active:translate-y-0"
              style={{
                fontFamily: NUNITO,
                borderColor: "rgba(248,250,252,0.14)",
                background: "rgba(248,250,252,0.06)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
              }}
            >
              See the platform
              <ArrowDown className="w-3.5 h-3.5" />
            </a>
          </motion.div>
        </motion.div>

      </section>

        <ProductExplorer />

        <LayoutShowcase />
      </div>

      <LandingFooter />
    </div>
  );
}
