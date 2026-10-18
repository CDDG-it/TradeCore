"use client";

import { GlassFold } from "@/components/ui/glass-fold";
import { useTheme } from "@/lib/theme-context";

/**
 * The app's backdrop: slow folds of glass in the brand palette, fixed behind
 * every screen. Navy ground, deep teal panes, cyan light on the edges; a navy
 * veil on top keeps it a backdrop, so cards and text stay the loudest thing.
 *
 * Dark theme only. The shader screens light onto its ground, so on the light
 * theme's near-white it would wash out to nothing; light keeps its plain ground.
 */
export function AppBackground() {
  const { theme } = useTheme();
  if (theme === "light") return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
      <GlassFold color1="#0F766E" color2="#0B1120" color3="#06B6D4" speed={0.25} scale={0.9} noise={0.1} maxDpr={1} className="absolute inset-0" />
      <div className="absolute inset-0 bg-background/55" />
    </div>
  );
}
