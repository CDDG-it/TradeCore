"use client";

/**
 * GLOBAL MARKETS — the desk.
 *
 * One screen, held still: a masthead with the venue clocks, a numbered index
 * of sections, and a framed working area that fills the viewport. Nothing here
 * scrolls the page — a section that outgrows its slot scrolls inside its own
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
import { cn } from "@/lib/utils";
import { SESSIONS, sessionState } from "@/lib/gmi/sessions";
import { Ticks, Label, gridBackground } from "@/components/gmi/pane";
import { MobileSubnav } from "@/components/layout/mobile-nav";

type Tab = "overview" | "markets" | "futures" | "news" | "calendar" | "flow";

const TABS: { key: Tab; num: string; label: string; note: string }[] = [
  { key: "overview", num: "01", label: "Overview", note: "the day so far" },
  { key: "markets", num: "02", label: "Markets", note: "yields, curve, dollar" },
  { key: "futures", num: "03", label: "Futures", note: "charts & co-movement" },
  { key: "news", num: "04", label: "News", note: "the wire" },
  { key: "calendar", num: "05", label: "Calendar", note: "release schedule" },
  { key: "flow", num: "06", label: "Positioning", note: "who holds what" },
];

/** Old ?tab= values that should still land somewhere sensible. */
const TAB_ALIASES: Record<string, Tab> = { "option-flow": "flow", options: "flow" };

const tabLoading = () => (
  <div className="flex h-full items-center justify-center">
    <Label>Loading</Label>
  </div>
);

// Code-split each section so the first paint stays light (three.js and recharts
// only arrive with the section that draws them).
const OverviewTab = dynamic(() => import("@/components/gmi/tabs/overview-tab").then((m) => m.OverviewTab), { loading: tabLoading });
const MarketsTab = dynamic(() => import("@/components/gmi/tabs/markets-tab").then((m) => m.MarketsTab), { loading: tabLoading });
const FuturesTab = dynamic(() => import("@/components/gmi/tabs/futures-tab").then((m) => m.FuturesTab), { loading: tabLoading });
const NewsTab = dynamic(() => import("@/components/gmi/tabs/news-tab").then((m) => m.NewsTab), { loading: tabLoading });
const CalendarTab = dynamic(() => import("@/components/gmi/tabs/calendar-tab").then((m) => m.CalendarTab), { loading: tabLoading });
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
  const [tab, setTab] = useState<Tab>("overview");
  const deskRef = useRef<HTMLDivElement>(null);

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
      case "overview": return <OverviewTab />;
      case "markets": return <MarketsTab />;
      case "futures": return <FuturesTab />;
      case "news": return <NewsTab />;
      case "calendar": return <CalendarTab />;
      case "flow": return <FlowOptionsTab />;
    }
  }, [tab]);

  return (
    // The desk fills the viewport at every size: `fill-phone` (globals.css)
    // measures out what the phone chrome leaves, and 7.5rem — the top nav plus
    // the page gutter above and below it — does the same on laptops and up.
    <div className="fill-phone relative flex flex-col gap-0 lg:h-[calc(100dvh-7.5rem)] lg:overflow-hidden">
      <div
        className="relative flex min-h-0 flex-1 flex-col border border-border/60"
        style={{ ...gridBackground, backgroundColor: a_bg }}
      >
        <Ticks />

        {/* ── Masthead ─────────────────────────────────────────────────── */}
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-border/50 px-4 py-2.5 lg:px-5">
          <div className="flex items-baseline gap-3">
            <h1 className="font-heading text-[15px] font-black uppercase leading-none tracking-[0.06em] text-foreground md:text-[17px]">
              Global Markets
            </h1>
            <span className="hidden text-[11px] font-semibold uppercase tracking-wider text-foreground/65 sm:inline">
              objective research
            </span>
          </div>
          <VenueClocks />
        </header>

        {/* ── Index ────────────────────────────────────────────────────────
            Words and numbers, no icons: the section you are in is the one
            whose number is lit and whose name is underscored. */}
        <nav className="scrollbar-none hidden shrink-0 items-stretch overflow-x-auto border-b border-border/50 lg:flex">
          {TABS.map((t) => {
            const on = t.key === tab;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "group relative flex shrink-0 items-baseline gap-2 border-r border-border/40 px-4 py-2 text-left transition-colors",
                  on ? "bg-primary/[0.07]" : "hover:bg-muted/20"
                )}
              >
                <span className={cn("text-[11px] tabular-nums transition-colors", on ? "text-primary" : "text-foreground/65")}>
                  {t.num}
                </span>
                <span
                  className={cn(
                    "font-heading text-[13px] font-bold uppercase tracking-[0.1em] transition-colors",
                    on ? "text-foreground" : "text-foreground/75 group-hover:text-foreground/80"
                  )}
                >
                  {t.label}
                </span>
                {on && <span aria-hidden className="absolute inset-x-0 -bottom-px h-[2px] bg-primary" />}
              </button>
            );
          })}
          {/* What the live section is for, spelled out once — clarity without a tooltip. */}
          <span className="ml-auto hidden shrink-0 items-center px-4 xl:flex">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground/65">{active.note}</span>
          </span>
        </nav>

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
          {content}
        </div>
      </div>
    </div>
  );
}

/** The desk sits a shade below the page ground, so its frame reads as an object. */
const a_bg = "color-mix(in oklch, var(--card) 55%, transparent)";
