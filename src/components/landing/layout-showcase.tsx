"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { createLayout, stagger } from "animejs";

const NUNITO = "var(--font-nunito), system-ui, sans-serif";

// The five primary destinations, shown as bare morphing tiles — no icons,
// no screenshots, no AI copy. Just the names, rearranging on a loop.
const CARDS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "MC Mind Edge", href: "/psychological-edge" },
  { label: "MC Trade Therapist", href: "/trade-therapist" },
  { label: "My Strategy", href: "/strategy" },
  { label: "MC News Dashboard", href: "/news-city" },
];

/**
 * Landing showcase — the five product tiles continuously re-flow between grid
 * arrangements using anime.js createLayout (FLIP). The container's data-grid
 * attribute drives the CSS column count; anime animates every tile between the
 * old and new positions/sizes each tick.
 */
export function LayoutShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current || !containerRef.current) return;
    started.current = true;

    const container = containerRef.current;
    const layout = createLayout(container);
    let i = 0;
    let running = false;
    let disposed = false;

    // One morph, chaining into the next while the loop is "running". Gated by
    // visibility so we don't thrash layout when the section is off-screen.
    function tick() {
      if (disposed || !running) return;
      layout.update(
        ({ root }) => {
          (root as HTMLElement).dataset.grid = String((++i % 4) + 1);
        },
        {
          duration: 1000,
          delay: stagger(150),
          onComplete: () => {
            if (running && !disposed) tick();
          },
        },
      );
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !running) {
          running = true;
          tick();
        } else if (!entry.isIntersecting) {
          running = false; // in-flight morph finishes, then the chain stops
        }
      },
      { threshold: 0.2 },
    );
    io.observe(container);

    return () => {
      disposed = true;
      running = false;
      io.disconnect();
      layout.revert();
    };
  }, []);

  return (
    <section id="features" className="bg-background px-6 py-24 md:py-28">
      <div className="mx-auto max-w-5xl">
        <p
          className="text-center font-mono text-xs font-medium uppercase tracking-[0.24em] text-primary"
          style={{ fontFamily: NUNITO }}
        >
          One platform
        </p>
        <h2
          className="mx-auto mt-4 max-w-2xl text-center font-heading text-3xl font-black tracking-tight text-foreground md:text-4xl"
        >
          Everything the trader needs, in one place.
        </h2>

        <div ref={containerRef} className="layout-container mt-14" data-grid="4">
          {CARDS.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="layout-card"
              style={{ fontFamily: NUNITO }}
            >
              {c.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
