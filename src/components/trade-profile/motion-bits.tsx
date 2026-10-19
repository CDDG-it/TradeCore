"use client";

import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { EASE_OUT } from "@/lib/motion";
import { DOMAINS, type DomainCode } from "@/lib/trade-profile/types";
import { traitColor } from "@/components/trade-profile/primitives";
import { useProfileNav } from "@/components/trade-profile/nav";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * A small image set into a line of type: a pill that carries the five trait
 * colours (or one trait's score) so a heading shows what it is about instead
 * of only naming it. Decorative: the words around it say the same thing.
 */
export function InlinePill({ code, value, className }: { code?: DomainCode; value?: number; className?: string }) {
  const reduce = useReducedMotion();
  const colors = code ? [traitColor[code]] : DOMAINS.map((d) => traitColor[d]);
  const fill = value === undefined ? 1 : Math.max(0.06, Math.min(1, value / 100));
  return (
    <span aria-hidden className={cn("relative mx-2 inline-block h-[0.82em] w-[2.4em] translate-y-[0.06em] overflow-hidden rounded-full border border-white/10 bg-muted/50 align-baseline", className)}>
      <motion.span
        className="absolute inset-0 rounded-full"
        style={{ background: colors.length > 1 ? `linear-gradient(90deg, ${colors.join(", ")})` : colors[0] }}
        initial={{ transform: "translateX(-100%)" }}
        animate={{ transform: `translateX(${(fill - 1) * 100}%)` }}
        transition={{ duration: reduce ? 0 : 0.9, delay: 0.25, ease: EASE_OUT }}
      />
      {/* A slow sheen across the pill, once, as it lands. */}
      {!reduce && (
        <motion.span
          className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/35 to-transparent"
          initial={{ transform: "translateX(-120%)" }}
          animate={{ transform: "translateX(260%)" }}
          transition={{ duration: 1.1, delay: 1, ease: EASE_OUT }}
        />
      )}
    </span>
  );
}

/**
 * An endless band of words, for the front door only (a page seen once or twice,
 * where a little ambient motion is welcome). Two copies slide by half their
 * width, so the loop has no seam. It pauses under the pointer and stands still
 * under reduced motion (see .tp-marquee in globals.css).
 */
export function Marquee({ items, className }: { items: string[]; className?: string }) {
  const row = (hidden: boolean) => (
    <ul aria-hidden={hidden || undefined} className="flex shrink-0 items-center">
      {items.map((item) => (
        <li key={item} className="flex items-center whitespace-nowrap px-5">
          {item}
          <span aria-hidden className="ml-10 size-1 rounded-full bg-primary/50" />
        </li>
      ))}
    </ul>
  );
  return (
    <div className={cn("tp-marquee-mask overflow-hidden", className)}>
      <div className="tp-marquee flex w-max">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}

/**
 * A paragraph that reads itself in as it scrolls up: every word starts faint
 * and comes up to full as the paragraph passes through the frame, tied to the
 * scroll position rather than a clock, so it goes at the reader's pace and
 * runs backwards when they scroll back. Reduced motion shows it whole.
 */
export function ScrubText({ text, className }: { text: string; className?: string }) {
  const nav = useProfileNav();
  const root = useRef<HTMLParagraphElement>(null);
  useGSAP(() => {
    const scroller = nav.scroller;
    if (!root.current || !scroller) return;
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.fromTo(root.current!.querySelectorAll("[data-word]"), { opacity: 0.14 }, {
        opacity: 1,
        stagger: 0.05,
        ease: "none",
        scrollTrigger: { trigger: root.current, scroller, start: "top 88%", end: "bottom 45%", scrub: 0.6 },
      });
    });
    return () => mm.revert();
  }, { scope: root, dependencies: [text, nav.scroller] });

  return (
    <p ref={root} className={className} aria-label={text}>
      {text.split(" ").map((word, i) => (
        <span key={`${word}-${i}`} data-word aria-hidden className="inline-block whitespace-pre">
          {word}{" "}
        </span>
      ))}
    </p>
  );
}

/**
 * A two-column layout whose left column holds still while the right one
 * scrolls past it, on wide screens only. Pinned with ScrollTrigger against the
 * section's own scroll frame; on a phone (one column) it is an ordinary stack.
 */
export function PinnedSplit({ left, right, className, deps = [] }: { left: ReactNode; right: ReactNode; className?: string; deps?: unknown[] }) {
  const nav = useProfileNav();
  const root = useRef<HTMLDivElement>(null);
  const pinned = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    const scroller = nav.scroller;
    if (!root.current || !pinned.current || !scroller) return;
    const mm = gsap.matchMedia();
    mm.add("(min-width: 1024px)", () => {
      // Only worth pinning when the right column is the taller one.
      const st = ScrollTrigger.create({
        trigger: root.current,
        scroller,
        start: "top top+=72",
        end: () => `+=${Math.max(0, root.current!.offsetHeight - pinned.current!.offsetHeight)}`,
        pin: pinned.current,
        pinSpacing: false,
        invalidateOnRefresh: true,
      });
      return () => st.kill();
    });
    return () => mm.revert();
  }, { scope: root, dependencies: [nav.scroller, ...deps] });

  return (
    <div ref={root} className={cn("grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-start lg:gap-6", className)}>
      <div className="min-w-0">
        <div ref={pinned}>{left}</div>
      </div>
      <div className="min-w-0">{right}</div>
    </div>
  );
}

export interface CarouselSlide {
  key: string;
  quote: string;
  name: string;
  detail: ReactNode;
  color: string;
}

/**
 * One quiet statement at a time, with the speaker beside it: here the speaker
 * is a trait, drawn as an overlapping stack of colour discs with the current
 * one in front. Subtle arrows and the discs themselves step through it.
 */
export function TraitCarousel({ slides, title, className }: { slides: CarouselSlide[]; title: string; className?: string }) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const slide = slides[index];
  if (!slide) return null;
  function step(by: number) {
    setDirection(by);
    setIndex((i) => (i + by + slides.length) % slides.length);
  }
  function jump(i: number) {
    if (i === index) return;
    setDirection(i > index ? 1 : -1);
    setIndex(i);
  }

  return (
    <section className={cn("rounded-2xl border border-border/60 bg-card p-5 sm:p-6", className)} aria-roledescription="carousel" aria-label={title}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-heading text-sm font-bold tracking-tight">{title}</h3>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => step(-1)} aria-label="Previous trait" className="press grid size-8 place-items-center rounded-full border border-border/60 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground">
            <ChevronLeft className="size-4" />
          </button>
          <button type="button" onClick={() => step(1)} aria-label="Next trait" className="press grid size-8 place-items-center rounded-full border border-border/60 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground">
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div className="relative mt-5 min-h-[9.5rem] overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          <motion.blockquote
            key={slide.key}
            custom={direction}
            initial={{ opacity: 0, transform: `translateX(${direction * 28}px)` }}
            animate={{ opacity: 1, transform: "translateX(0px)" }}
            exit={{ opacity: 0, transform: `translateX(${direction * -28}px)`, transition: { duration: 0.14 } }}
            transition={{ duration: 0.26, ease: EASE_OUT }}
          >
            <p className="max-w-[56ch] text-[17px] leading-relaxed text-foreground/90 [text-wrap:pretty]">{slide.quote}</p>
          </motion.blockquote>
        </AnimatePresence>
      </div>

      <div className="mt-4 flex items-center gap-4 border-t border-border/50 pt-4">
        {/* The speakers: overlapping discs, the current one in front and ringed. */}
        <div className="flex -space-x-2" role="tablist" aria-label="Traits">
          {slides.map((s, i) => (
            <button
              key={s.key}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={s.name}
              onClick={() => jump(i)}
              className="relative grid size-8 place-items-center rounded-full border-2 border-card transition-transform duration-200 hover:-translate-y-0.5"
              style={{ background: s.color, zIndex: i === index ? 10 : slides.length - i, opacity: i === index ? 1 : 0.45 } as CSSProperties}
            >
              {i === index && <motion.span layoutId="trait-carousel-ring" className="absolute -inset-[5px] rounded-full border border-foreground/40" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={slide.key} className="min-w-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.14 }}>
            <p className="truncate text-sm font-semibold">{slide.name}</p>
            <p className="text-xs text-muted-foreground">{slide.detail}</p>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
