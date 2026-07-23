"use client";

import { CardFlip } from "@/components/landing/card-flip";
import { BeamsBackground } from "@/components/landing/beams-background";

const NUNITO = "var(--font-nunito), system-ui, sans-serif";

// The five primary destinations, shown as liquid-glass cards that flip on hover
// to reveal what each one does. No screenshots, no icons beyond the flip hint.
const CARDS: React.ComponentProps<typeof CardFlip>[] = [
  {
    title: "Dashboard",
    subtitle: "Your whole trading day on one screen.",
    description: "Every account, trade and metric in a single command center.",
    features: ["Live P&L", "Account overview", "Daily focus", "Quick journal"],
    href: "/dashboard",
  },
  {
    title: "MC Mind Edge",
    subtitle: "One number for how ready you are to trade.",
    description: "A daily readiness score built from your state, sleep and discipline.",
    features: ["Readiness score", "Pre-trade mirror", "5R sessions", "Mindscore trend"],
    href: "/psychological-edge",
  },
  {
    title: "MC Trade Therapist",
    subtitle: "A coach that talks back, built from your own trades.",
    description: "Pattern detection and reflective prompts drawn from your history.",
    features: ["Pattern engine", "Post-trade 5R", "Bias alerts", "Session recaps"],
    href: "/trade-therapist",
  },
  {
    title: "My Strategy",
    subtitle: "Your playbook and rules, written down and in reach.",
    description: "Codify setups, confluences and rules so execution stays consistent.",
    features: ["Setup library", "Confluence rules", "Checklists", "Playbook"],
    href: "/strategy",
  },
  {
    title: "MC News Dashboard",
    subtitle: "See what is actually moving the market.",
    description: "A live read on the forces and headlines driving NQ and GC.",
    features: ["Live news feed", "Market forces", "Session structure", "Impact scan"],
    href: "/news-city",
  },
];

/**
 * Landing showcase — the five products as liquid-glass flip cards.
 */
export function LayoutShowcase() {
  return (
    <section id="features" className="relative overflow-hidden bg-background px-6 py-24 md:py-28">
      {/* Animated beams span the whole section — from the hero down to the
          footer — as one continuous backdrop. Landing only. */}
      <BeamsBackground className="inset-0" intensity="medium" />

      {/* Ambient turquoise glow so the glass has something to catch */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 h-[440px] w-[760px] -translate-x-1/2 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(20,184,166,0.12) 0%, transparent 70%)" }}
      />

      <div className="relative mx-auto max-w-6xl">
        <p
          className="text-center font-mono text-xs font-medium uppercase tracking-[0.24em] text-primary"
          style={{ fontFamily: NUNITO }}
        >
          One platform
        </p>
        <h2 className="mx-auto mt-4 max-w-2xl text-center font-heading text-3xl font-black tracking-tight text-foreground md:text-4xl">
          Everything the trader needs, in one place.
        </h2>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {CARDS.map((c) => (
            <CardFlip key={c.href} {...c} />
          ))}
        </div>
      </div>
    </section>
  );
}
