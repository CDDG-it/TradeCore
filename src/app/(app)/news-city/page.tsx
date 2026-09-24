"use client";

/**
 * GLOBAL MARKETS: the desk.
 *
 * One screen, held still: a masthead with the venue clocks, a numbered index
 * of sections, and a framed working area that fills the viewport. Nothing here
 * scrolls the page: a section that outgrows its slot scrolls inside its own
 * pane, so the frame, the clocks and the index never move out from under you.
 *
 * Every dataset states its cadence, source and age in the corner of its pane;
 * nothing interprets, recommends or predicts, and no panel claims a price is
 * live when the provider only offers delayed data.
 *
 * (Route kept as /news-city to preserve existing links; the page is retitled.)
 */
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { motion, useReducedMotion } from "motion/react";
import { ChartNoAxesCombined, Newspaper, Users } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils";
import { SESSIONS, sessionState } from "@/lib/gmi/sessions";
import { Ticks, Label } from "@/components/gmi/pane";
import { MobileSubnav } from "@/components/layout/mobile-nav";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type Tab = "briefing" | "markets" | "positioning";

const TABS = [
  { key: "briefing" as const, label: "Briefing", note: "News, prints and the week ahead", icon: Newspaper },
  { key: "markets" as const, label: "Markets", note: "Futures, yields and cross-asset context", icon: ChartNoAxesCombined },
  { key: "positioning" as const, label: "Positioning", note: "CFTC participation and crowding", icon: Users },
];

/** Old ?tab= values that should still land somewhere sensible. */
const TAB_ALIASES: Record<string, Tab> = {
  overview: "briefing", news: "briefing", calendar: "briefing",
  futures: "markets",
  flow: "positioning", "option-flow": "positioning", options: "positioning",
};

const tabLoading = () => (
  <div className="flex h-full items-center justify-center">
    <Label>Loading</Label>
  </div>
);

// Code-split each section so the first paint stays light (three.js and recharts
// only arrive with the section that draws them).
const BriefingTab = dynamic(() => import("@/components/gmi/tabs/briefing-tab").then((m) => m.BriefingTab), { loading: tabLoading });
const CombinedMarketsTab = dynamic(() => import("@/components/gmi/tabs/combined-markets-tab").then((m) => m.CombinedMarketsTab), { loading: tabLoading });
const FlowOptionsTab = dynamic(() => import("@/components/gmi/tabs/flow-options-tab").then((m) => m.FlowOptionsTab), { loading: tabLoading });

/* ── Venue clocks ──────────────────────────────────────────────────────────
   Pinned in the masthead rather than buried in a section: whether Tokyo,
   London or New York is trading changes how you read everything below. */

function subscribeClock(onChange: () => void) {
  const id = setInterval(onChange, 30_000);
  return () => clearInterval(id);
}

function useClock(): Date | null {
  const bucket = useSyncExternalStore(
    subscribeClock,
    () => Math.floor(Date.now() / 30_000),
    () => null
  );
  return bucket == null ? null : new Date(bucket * 30_000);
}

const VENUE_CODE: Record<string, string> = { asia: "TYO", london: "LDN", newYork: "NYC" };

function VenueClocks() {
  const now = useClock();
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
      {SESSIONS.map((w) => {
        const st = now ? sessionState(w, now) : null;
        const live = st?.open ?? false;
        return (
          <span key={w.key} className="flex items-baseline gap-1.5" title={`${w.label} · ${w.hours}`}>
            <span
              className={cn("relative top-[-1px] inline-block h-1.5 w-1.5 rounded-full", live && "animate-pulse")}
              style={{
                background: live ? "var(--success)" : "var(--muted-foreground)",
                opacity: live ? 1 : 0.35,
                boxShadow: live ? "0 0 8px color-mix(in oklch, var(--success) 70%, transparent)" : undefined,
              }}
            />
            <span className="font-mono text-[11px] tracking-[0.18em] text-foreground/80">{VENUE_CODE[w.key]}</span>
            <span className={cn("text-[13px] font-bold tabular-nums", live ? "text-foreground" : "text-foreground/75")}>
              {st?.localTime ?? "--:--"}
            </span>
          </span>
        );
      })}
    </div>
  );
}

export default function GlobalMarketsPage() {
  const [tab, setTab] = useState<Tab>("briefing");
  const deskRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  // Deep-linking, e.g. the /option-flow route redirects in here. Read after
  // mount rather than during render: the page is prerendered, so seeding state
  // from the URL up front would make the server and client markup disagree.
  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get("tab");
    if (!raw) return;
    const t = TAB_ALIASES[raw] ?? raw;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot sync from the URL, not a render loop
    if (TABS.some((x) => x.key === t)) setTab(t as Tab);
  }, []);

  const active = TABS.find((t) => t.key === tab) ?? TABS[0];

  useGSAP(() => {
    const frame = requestAnimationFrame(() => {
      const panes = deskRef.current?.querySelectorAll(".gmi-pane");
      if (!panes?.length) return;
      gsap.fromTo(panes, { opacity: 0.35, scale: 0.975, y: 12 }, {
        opacity: 1, scale: 1, y: 0, duration: 0.48, stagger: 0.045, ease: "power3.out", clearProps: "transform,opacity",
      });
      ScrollTrigger.matchMedia({
        "(max-width: 1023px) and (prefers-reduced-motion: no-preference)": () => {
          panes.forEach((pane, index) => gsap.fromTo(pane, { scale: 0.94, opacity: 0.55 }, {
            scale: 1, opacity: 1, ease: "none",
            scrollTrigger: { trigger: pane, scroller: deskRef.current, start: "top 92%", end: "top 58%", scrub: true },
            zIndex: index + 1,
          }));
        },
      });
    });
    return () => cancelAnimationFrame(frame);
  }, { scope: deskRef, dependencies: [tab], revertOnUpdate: true });

  const content = useMemo(() => {
    switch (tab) {
      case "briefing": return <BriefingTab />;
      case "markets": return <CombinedMarketsTab />;
      case "positioning": return <FlowOptionsTab />;
    }
  }, [tab]);

  return (
    // The desk fills the viewport at every size: `fill-phone` (globals.css)
    // measures out what the phone chrome leaves, and 7.5rem (the top nav plus
    // the page gutter above and below it) does the same on laptops and up.
    <main className="fill-phone relative flex w-full max-w-full flex-col gap-0 overflow-x-hidden lg:h-[calc(100dvh-7.5rem)] lg:overflow-hidden">
      <div
        className="relative grid min-h-0 flex-1 overflow-hidden rounded-[30px] border border-white/[.08] shadow-[0_36px_100px_-52px_rgba(0,0,0,.98),0_0_60px_-42px_color-mix(in_oklch,var(--primary)_58%,transparent)] lg:grid-cols-[224px_minmax(0,1fr)]"
        style={{ backgroundColor: TERMINAL_BG }}
      >
        {/* A terminal reads as an instrument: a hairline of the desk's own
            colour across the very top, flat dark ground, no decorative grid. */}
        <span aria-hidden className="absolute inset-x-0 top-0 z-10 h-[2px]" style={{ background: "linear-gradient(90deg, var(--primary), var(--ice) 55%, transparent)" }} />
        <Ticks />

        <aside className="relative hidden min-h-0 flex-col border-r border-white/[.07] bg-[linear-gradient(180deg,color-mix(in_oklch,var(--card)_90%,transparent),color-mix(in_oklch,var(--background)_84%,transparent))] p-4 lg:flex">
          <div className="px-2 pb-8 pt-3">
            <p className="font-heading text-[20px] font-black tracking-[-.035em] text-foreground">Global<br /><span className="text-primary">Markets</span></p>
            <p className="mt-3 text-[11px] leading-relaxed text-foreground/48">Objective context for the session ahead.</p>
          </div>
          <nav aria-label="Global Markets sections" className="space-y-2">
            {TABS.map((item) => {
              const Icon = item.icon;
              const selected = item.key === tab;
              return <button key={item.key} type="button" onClick={() => setTab(item.key)} aria-current={selected ? "page" : undefined} className={`press group relative w-full overflow-hidden rounded-2xl border p-3 text-left ${selected ? "border-primary/30 bg-primary/[.09]" : "border-transparent text-foreground/55 hover:border-white/[.07] hover:bg-white/[.035] hover:text-foreground"}`}>
                {selected && <motion.span layoutId="gmi-side-active" className="absolute inset-y-3 left-0 w-[3px] rounded-r-full bg-primary" transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 460, damping: 38 }} />}
                <span className="flex items-center gap-2.5"><Icon className={`size-4 ${selected ? "text-primary" : "text-foreground/35 group-hover:text-foreground/60"}`} /><span className="text-[13px] font-bold">{item.label}</span></span>
                <span className="mt-1.5 block pl-[26px] text-[10px] leading-relaxed text-foreground/40">{item.note}</span>
              </button>;
            })}
          </nav>
          <div className="mt-auto space-y-3 rounded-2xl border border-white/[.06] bg-black/10 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-foreground/38">Venue status</p>
            <VenueClocks />
          </div>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-col">
          <header className="relative shrink-0 overflow-hidden border-b border-white/[.07] px-4 py-4 sm:px-6 lg:px-7 lg:py-5" style={{ background: MAST_BG }}>
            <div aria-hidden className="pointer-events-none absolute -right-20 -top-28 h-64 w-64 rounded-full bg-primary/10 blur-[80px]" />
            <div className="relative flex flex-wrap items-end justify-between gap-4">
              <div className="max-w-4xl">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[.2em] text-primary lg:hidden">Global Markets</p>
                <h1 className="font-heading text-[clamp(1.35rem,2.3vw,2.15rem)] font-black leading-[1.05] tracking-[-.045em] text-foreground">Read the market before<br className="hidden sm:block" /> it reads your position.</h1>
              </div>
              <div className="lg:hidden"><VenueClocks /></div>
              <p className="hidden max-w-xs text-right text-[11px] leading-relaxed text-foreground/48 xl:block">{active.note}. Sources and update cadence remain visible inside every dataset.</p>
            </div>
          </header>

          <div className="gmi-marquee shrink-0 overflow-hidden border-b border-white/[.06] bg-black/10 py-1.5" aria-hidden>
            <div className="gmi-marquee-track flex w-max items-center gap-8 whitespace-nowrap text-[10px] font-semibold uppercase tracking-[.16em] text-foreground/38">
              {[0, 1].map((copy) => <span key={copy} className="flex items-center gap-8"><span>Macro releases</span><span className="text-primary/70">Futures structure</span><span>Global yields</span><span className="text-primary/70">CFTC positioning</span><span>Cross-asset context</span></span>)}
            </div>
          </div>

        {/* Phone: the same index, docked above the bottom tab bar. */}
        <MobileSubnav items={TABS} value={tab} onChange={setTab} label="Global Markets sections" scrollRef={deskRef} />

        {/* ── Working area ─────────────────────────────────────────────── */}
        {/* On a laptop the working area holds still and each pane scrolls
            itself. A phone has no room for that: the area scrolls as one and
            the panes take their natural height. */}
        <div
          ref={deskRef}
          className="min-h-0 flex-1 overscroll-contain overflow-y-auto p-2.5 sm:p-3 lg:overflow-hidden lg:p-3.5"
        >
          <motion.div
            key={tab}
            className="h-full min-h-0"
            initial={{ opacity: 0, y: reduceMotion ? 0 : 3 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0.08 : 0.16, ease: [0.23, 1, 0.32, 1] }}
          >
            {content}
          </motion.div>
        </div>
        </div>
      </div>
    </main>
  );
}

/** A flat, deep terminal ground: darker than the surrounding page, no grid, so
 *  the numbers and hairlines carry all the structure. Theme-aware via tokens. */
const TERMINAL_BG = "color-mix(in oklch, var(--card) 60%, var(--background))";
/** The masthead sits a shade above the ground, like a terminal's status bar. */
const MAST_BG = "color-mix(in oklch, var(--card) 82%, var(--background))";
