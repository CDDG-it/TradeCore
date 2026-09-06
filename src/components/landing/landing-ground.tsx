"use client";

/**
 * One ground for the whole opening stretch of the landing page — hero, product
 * explorer and the product cards.
 *
 * Those three sections each used to paint their own flat fill, so scrolling
 * crossed two visible seams. This is a single layer behind all of them: a faint
 * plotting grid, the same one the Global Markets desk is ruled with, lit by a
 * few slow turquoise and cyan glows and darkened toward the fold at each end.
 * Purely decorative and entirely static — no animation to repaint on a surface
 * this tall.
 */

const GRID = "rgba(148,163,184,0.045)";

export function LandingGround() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* The plotting grid. Held back a little under the hero's candles and
          faded out entirely at the bottom, where the footer takes over. */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            `linear-gradient(${GRID} 1px, transparent 1px),` +
            `linear-gradient(90deg, ${GRID} 1px, transparent 1px)`,
          backgroundSize: "44px 44px",
          maskImage:
            "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, #000 6%, #000 92%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, #000 6%, #000 92%, transparent 100%)",
        }}
      />

      {/* Light spread down the page, so the grid never reads as flat wallpaper.
          Percentages rather than pixels: the stretch is several screens tall and
          the glows should stay distributed however long it gets. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(60rem 40rem at 12% 8%, rgba(20,184,166,0.10), transparent 60%)," +
            "radial-gradient(55rem 38rem at 88% 34%, rgba(6,182,212,0.075), transparent 62%)," +
            "radial-gradient(70rem 46rem at 22% 66%, rgba(20,184,166,0.065), transparent 62%)," +
            "radial-gradient(50rem 34rem at 78% 92%, rgba(6,182,212,0.06), transparent 60%)",
        }}
      />

      {/* A slow vertical shade — the page sinks a little as you go down, which
          keeps the cards reading as the end of the stretch. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(11,17,32,0.55) 0%, transparent 18%, transparent 74%, rgba(8,13,25,0.75) 100%)",
        }}
      />
    </div>
  );
}
