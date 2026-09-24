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
import { cn } from "@/lib/utils";
import { SESSIONS, sessionState } from "@/lib/gmi/sessions";
import { Ticks, Label } from "@/components/gmi/pane";
import { MobileSubnav } from "@/components/layout/mobile-nav";
import { SectionNav } from "@/components/layout/section-nav";

type Tab = "briefing" | "markets" | "positioning";

const TABS: { key: Tab; label: string; note: string }[] = [
  { key: "briefing", label: "Briefing", note: "news, prints and the week ahead" },
  { key: "markets", label: "Markets", note: "futures, yields and cross-asset context" },
  { key: "positioning", label: "Positioning", note: "CFTC participation and crowding" },
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
    <div className="flex items-center gap-4">
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
    <div className="fill-phone relative flex flex-col gap-0 lg:h-[calc(100dvh-7.5rem)] lg:overflow-hidden">
      <div
        className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[26px] border border-border/60 shadow-[0_28px_80px_-42px_rgba(0,0,0,.95),0_0_42px_-32px_color-mix(in_oklch,var(--primary)_55%,transparent)]"
        style={{ backgroundColor: TERMINAL_BG }}
      >
        {/* A terminal reads as an instrument: a hairline of the desk's own
            colour across the very top, flat dark ground, no decorative grid. */}
        <span aria-hidden className="absolute inset-x-0 top-0 z-10 h-[2px]" style={{ background: "linear-gradient(90deg, var(--primary), var(--ice) 55%, transparent)" }} />
        <Ticks />

        {/* ── Masthead ─────────────────────────────────────────────────── */}
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-border/60 px-4 py-3 lg:px-5" style={{ background: MAST_BG }}>
          <div className="flex items-center gap-3">
            <span aria-hidden className="h-4 w-[3px] rounded-full" style={{ background: "var(--primary)" }} />
            <h1 className="font-heading text-[15px] font-black uppercase leading-none tracking-[0.08em] text-foreground md:text-[17px]">
              Global Markets
            </h1>
            <span className="hidden text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/55 sm:inline">
              research desk
            </span>
          </div>
          <VenueClocks />
        </header>

        {/* ── Index ────────────────────────────────────────────────────────
            The same section rail the rest of the app uses, docked in the desk
            frame so the terminal still reads as one held-still screen. */}
        <div className="hidden shrink-0 items-center justify-between gap-4 border-b border-border/50 bg-background/15 px-3 py-2 lg:flex">
          <SectionNav id="markets" items={TABS} value={tab} onChange={setTab} />
          {/* What the live section is for, spelled out once: clarity without a tooltip. */}
          <span className="hidden shrink-0 items-center px-2 xl:flex">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground/65">{active.note}</span>
          </span>
        </div>

        {/* Phone: the same index, docked above the bottom tab bar. */}
        <MobileSubnav items={TABS} value={tab} onChange={setTab} label="Global Markets sections" scrollRef={deskRef} />

        {/* ── Working area ─────────────────────────────────────────────── */}
        {/* On a laptop the working area holds still and each pane scrolls
            itself. A phone has no room for that: the area scrolls as one and
            the panes take their natural height. */}
        <div
          ref={deskRef}
          className="min-h-0 flex-1 overscroll-contain overflow-y-auto p-1.5 sm:p-2 lg:overflow-hidden lg:p-2.5"
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
  );
}

/** A flat, deep terminal ground: darker than the surrounding page, no grid, so
 *  the numbers and hairlines carry all the structure. Theme-aware via tokens. */
const TERMINAL_BG = "color-mix(in oklch, var(--card) 60%, var(--background))";
/** The masthead sits a shade above the ground, like a terminal's status bar. */
const MAST_BG = "color-mix(in oklch, var(--card) 82%, var(--background))";
