"use client";

import { CardFlip } from "@/components/landing/card-flip";
import { FlowField } from "@/components/landing/flow-field";

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
    <section className="relative overflow-hidden px-6 py-24 md:px-10 md:py-32" style={{ background: "#0B1120" }}>
      {/* Slowed flow-field particle stream, held to the lower half so it reads as
          depth behind the cards rather than a haze across the type. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          maskImage: "linear-gradient(to bottom, transparent 0%, #000 28%)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, #000 28%)",
        }}
      >
        <FlowField className="inset-0" density="medium" speed={0.3} />
      </div>

      <div className="relative mx-auto max-w-[1700px]">
        {/* Header sits left and shares the baseline with a supporting line, so
            the section opens like a spread rather than another centred stack. */}
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="font-body text-[13px] font-semibold text-primary" style={{ fontFamily: NUNITO }}>
              One platform
            </p>
            <h2
              className="mt-4 font-heading font-black tracking-tight text-foreground"
              style={{ fontSize: "clamp(2rem,4.4vw,3rem)", lineHeight: 1.05 }}
            >
              Everything the trader needs, in one place.
            </h2>
          </div>
          <p className="max-w-sm font-body text-sm leading-relaxed text-[rgba(248,250,252,0.55)]">
            Five surfaces, one account. Hover any card to see what it holds.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {CARDS.map((c) => (
            <CardFlip key={c.href} {...c} />
          ))}
        </div>
      </div>
    </section>
  );
}
