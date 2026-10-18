"use client";

import { GlassFold } from "@/components/ui/glass-fold";
import { useTheme } from "@/lib/theme-context";

/**
 * The app's backdrop: slow folds of glass in the brand palette, fixed behind
 * every screen. Navy ground, deep teal panes, cyan light on the edges, under a
 * thin veil of the page colour so cards and text stay the loudest thing. Cards
 * are solid over it (see opaque-surfaces.css).
 *
 * The shader screens light onto a dark ground, which would wash out on white.
 * The light theme draws the same dark picture and inverts it with the hue
 * turned back, so the ground becomes pale and the lit edges dark teal.
 *
 * The veil's colour is an inline style on purpose: as a bg-background/N class
 * the opaque-surfaces sheet would turn it solid.
 */
export function AppBackground() {
  const { theme } = useTheme();
  const light = theme === "light";
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
      <GlassFold
        color1="#0F766E"
        color2="#0B1120"
        color3="#06B6D4"
        speed={0.25}
        scale={0.9}
        noise={0.1}
        maxDpr={1}
        className="absolute inset-0"
        style={light ? { filter: "invert(1) hue-rotate(180deg) saturate(0.8)" } : undefined}
      />
      <div className="absolute inset-0" style={{ background: `color-mix(in oklab, var(--background) ${light ? 45 : 32}%, transparent)` }} />
    </div>
  );
}
