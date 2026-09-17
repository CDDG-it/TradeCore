"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Expand } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

// Captured from the current app UI in an isolated local build with example data.
// No authenticated user data is present in these images.
const screens = [
  { label: "Dashboard", image: "dashboard.png", width: 1600, height: 1000, kicker: "The daily view", title: "Begin with the full picture.", body: "Capital, habits, win rate and this week's trades share one screen.", href: "/dashboard" },
  { label: "Journal", image: "journal.png", width: 1600, height: 1000, kicker: "Every trade in context", title: "See more than the result.", body: "Review trades on the calendar alongside execution quality and monthly patterns.", href: "/journal" },
  { label: "Analysis", image: "analysis.png", width: 1100, height: 760, kicker: "Plan the session", title: "Write the scenario before it unfolds.", body: "Keep your bias, thesis and both trade scenarios together in a structured analysis.", href: "/analysis" },
  { label: "Analytics", image: "analytics.png", width: 1600, height: 1000, kicker: "Performance", title: "Find your actual edge.", body: "Filter sessions and directions to see win rate, R multiples and execution trends.", href: "/analytics" },
  { label: "Accounts", image: "accounts.png", width: 1200, height: 760, kicker: "Risk and payouts", title: "Keep every account in view.", body: "Track active capital, account phases, costs and payout history from one place.", href: "/accounts" },
  { label: "My Edge", image: "psychological-edge.png", width: 1600, height: 760, kicker: "Mindset and routine", title: "Build the habits behind the numbers.", body: "Connect consistency, goals, your rules and your Mindscore.", href: "/psychological-edge" },
  { label: "Trade Therapist", image: "trade-therapist.png", width: 1600, height: 1000, kicker: "Session review", title: "Turn a session into a lesson.", body: "Review your best trades, pre-market exercises and commitments in one flow.", href: "/trade-therapist" },
  { label: "Global Markets", image: "news-city.png", width: 1600, height: 1000, kicker: "Market context", title: "Read the wider market.", body: "Move between futures, charts and cross-asset context in the market desk.", href: "/news-city" },
] as const;

export function InteractiveShowcase() {
  const [selected, setSelected] = useState(0);
  const [open, setOpen] = useState(false);
  const screen = screens[selected];
  const src = `/screenshots-current/${screen.image}`;

  function step(direction: number) {
    setSelected((current) => (current + direction + screens.length) % screens.length);
  }

  function onTabKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const next = (index + (event.key === "ArrowRight" ? 1 : -1) + screens.length) % screens.length;
    setSelected(next);
    document.getElementById(`showcase-tab-${next}`)?.focus();
  }

  return (
    <section id="products" aria-label="Explore TradingMC screens" className="scroll-mt-28">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 font-body text-xs font-bold uppercase tracking-[0.2em] text-[#14B8A6]">Inside the platform</p>
          <h2 className="font-heading text-2xl font-extrabold tracking-tight sm:text-3xl">The workspace, screen by screen.</h2>
        </div>
        <p className="font-body text-sm text-[#8FA2B8]">Current interface · Example account data</p>
      </div>

      <div className="overflow-hidden rounded-[22px] border border-white/[0.11] bg-[#111A2B] shadow-[0_36px_100px_rgba(0,0,0,0.35)]">
        <div role="tablist" aria-label="Product screens" className="flex gap-1 overflow-x-auto border-b border-white/[0.08] bg-[#131E30] p-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-2 sm:p-3">
          {screens.map((item, index) => (
            <button
              key={item.label}
              id={`showcase-tab-${index}`}
              type="button"
              role="tab"
              aria-selected={selected === index}
              aria-controls="showcase-panel"
              tabIndex={selected === index ? 0 : -1}
              onClick={() => setSelected(index)}
              onKeyDown={(event) => onTabKeyDown(event, index)}
              className={`shrink-0 rounded-lg px-3 py-2 font-heading text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6] sm:px-4 sm:text-sm ${selected === index ? "bg-[#14B8A6] text-[#08121D]" : "text-[#9EAEC1] hover:bg-white/[0.06] hover:text-white"}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div id="showcase-panel" role="tabpanel" aria-labelledby={`showcase-tab-${selected}`} className="grid lg:grid-cols-[minmax(0,1fr)_310px]">
          <div className="relative min-w-0 overflow-hidden bg-[#0B1120]">
            <button type="button" onClick={() => setOpen(true)} aria-label={`Enlarge ${screen.label} screenshot`} className="group relative block w-full cursor-zoom-in text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#14B8A6]">
              <Image key={src} src={src} alt={`Current TradingMC ${screen.label} interface with example data`} width={screen.width} height={screen.height} priority={selected === 0} className="aspect-[16/9] w-full object-contain object-center sm:aspect-[1.95/1] lg:aspect-[1.65/1] xl:aspect-[1.85/1]" sizes="(max-width: 1023px) 100vw, 75vw" />
              <span className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-lg border border-white/20 bg-[#0B1120]/90 px-3 py-2 font-body text-xs font-semibold text-white shadow-lg transition-colors group-hover:bg-[#14B8A6] group-hover:text-[#0B1120]"><Expand aria-hidden="true" className="h-3.5 w-3.5" /> Enlarge</span>
            </button>
          </div>

          <div className="flex flex-col justify-between border-t border-white/[0.08] p-6 sm:p-8 lg:border-l lg:border-t-0">
            <div>
              <p className="font-body text-xs font-bold uppercase tracking-[0.18em] text-[#14B8A6]">{String(selected + 1).padStart(2, "0")} / {String(screens.length).padStart(2, "0")} · {screen.kicker}</p>
              <h3 className="mt-6 font-heading text-[clamp(1.65rem,2.4vw,2.3rem)] font-extrabold leading-[1.12] tracking-tight text-balance">{screen.title}</h3>
              <p className="mt-4 font-body text-sm leading-[1.7] text-[#A9B8C9]">{screen.body}</p>
              <Link href={screen.href} className="mt-6 inline-flex items-center gap-2 font-heading text-sm font-bold text-[#5FE2D4] transition-colors hover:text-white focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]">Open {screen.label} <ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
            </div>
            <div className="mt-8 flex items-center gap-2">
              <button type="button" onClick={() => step(-1)} aria-label="Previous screen" className="grid h-10 w-10 place-items-center rounded-full border border-white/15 text-white transition-colors hover:border-[#14B8A6] hover:text-[#14B8A6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]"><ChevronLeft aria-hidden="true" className="h-5 w-5" /></button>
              <button type="button" onClick={() => step(1)} aria-label="Next screen" className="grid h-10 w-10 place-items-center rounded-full border border-white/15 text-white transition-colors hover:border-[#14B8A6] hover:text-[#14B8A6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]"><ChevronRight aria-hidden="true" className="h-5 w-5" /></button>
              <span className="ml-auto font-body text-xs text-[#8FA2B8]">Click image to inspect</span>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent showCloseButton className="flex h-[min(92dvh,1000px)] w-[min(96vw,1800px)] max-w-none flex-col gap-0 overflow-hidden border border-white/15 bg-[#0B1120] p-0 text-white sm:max-w-none">
          <div className="flex shrink-0 items-center justify-between gap-4 border-b border-white/10 px-5 py-4 pr-16">
            <div>
              <DialogTitle className="font-heading text-base font-bold">{screen.label}</DialogTitle>
              <DialogDescription className="font-body text-xs text-[#9EADC0]">Current app interface with example account data. Scroll to inspect details.</DialogDescription>
            </div>
            <span className="font-body text-xs text-[#8FA2B8]">{selected + 1} / {screens.length}</span>
          </div>
          <div className="flex min-h-0 flex-1 items-center overflow-auto p-3 sm:p-6">
            <Image src={src} alt={`Enlarged TradingMC ${screen.label} screen with example data`} width={screen.width} height={screen.height} className="m-auto h-auto min-w-[1000px] max-w-none xl:min-w-0 xl:max-w-full" sizes="96vw" />
          </div>
          <div className="flex shrink-0 items-center justify-between border-t border-white/10 px-4 py-3">
            <button type="button" onClick={() => step(-1)} className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-body text-sm text-[#CED9E5] hover:text-[#14B8A6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]"><ChevronLeft aria-hidden="true" className="h-4 w-4" /> Previous</button>
            <button type="button" onClick={() => step(1)} className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-body text-sm text-[#CED9E5] hover:text-[#14B8A6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]">Next <ChevronRight aria-hidden="true" className="h-4 w-4" /></button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
