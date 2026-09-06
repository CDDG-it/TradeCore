"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ChevronDown, ArrowDown } from "lucide-react";
import { FEATURES } from "@/lib/landing/features";
import { APP_TABS } from "@/lib/nav";

const NUNITO = "var(--font-nunito), system-ui, sans-serif";

/**
 * The Features menu is a map of the product, not a set of doors out of the page.
 * Every surface the app actually has is listed, grouped the way the app groups
 * them, and each row scrolls down to the card that shows it. Nothing here
 * navigates away: the cards are the answer to "what is in this thing", so the
 * menu takes you to them rather than to a separate marketing page.
 */
const FEATURE_BY_SLUG = new Map(FEATURES.map((f) => [f.slug, f]));

// The four cards on the showcase. A surface that lives inside one of them —
// the Journal sits under the Dashboard — points at its parent card.
const CARD_FOR: Record<string, string> = {
  "/dashboard": "card-dashboard",
  "/journal": "card-dashboard",
  "/analysis": "card-dashboard",
  "/analytics": "card-dashboard",
  "/accounts": "card-dashboard",
  "/psychological-edge": "card-psychological-edge",
  "/trade-therapist": "card-trade-therapist",
  "/news-city": "card-news-city",
};

// Headings for the groups APP_TABS already defines, so the menu and the app
// describe the product with the same words.
const GROUP_LABEL: Record<string, string> = {
  "": "Every day",
  Trading: "Trading",
  "MC Mindset formula": "MC Mindset formula",
  "MC News Dashboard": "MC News Dashboard",
};

const NAV_GROUPS = APP_TABS.reduce<{ heading: string; items: { label: string; anchor: string; tagline: string }[] }[]>(
  (groups, tab) => {
    const anchor = CARD_FOR[tab.href];
    if (!anchor) return groups;
    const heading = GROUP_LABEL[tab.group ?? ""] ?? tab.group ?? "";
    const item = {
      label: tab.label,
      anchor: `#${anchor}`,
      tagline: FEATURE_BY_SLUG.get(tab.href.slice(1))?.tagline ?? "",
    };
    const last = groups[groups.length - 1];
    if (last && last.heading === heading) last.items.push(item);
    else groups.push({ heading, items: [item] });
    return groups;
  },
  []
);

/* Top-of-hero navigation: brand at the left, a centered Features dropdown
   listing the five product pages, then Sign in and a Make account button. */
export function LandingNav() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close on outside click and on Escape, so the menu never gets stuck open.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  // Small hover-intent delay so the menu does not flicker between trigger and panel.
  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  return (
    <header
      className="sticky top-0 z-30 px-4 py-4 sm:px-6"
      style={{
        background: "rgba(11,17,32,0.88)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(248,250,252,0.09)",
      }}
    >
      <div className="mx-auto grid max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4">
        {/* Brand — logo + wordmark, same font family as the hero heading, much smaller */}
        <Link href="/" className="flex items-center gap-2.5 justify-self-start hover:opacity-80 transition-opacity">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/tradingmc-app-dark.svg" alt="" width={44} height={44} className="h-9 w-9 shrink-0 sm:h-11 sm:w-11" />
          <span
            className="font-black tracking-tight text-base leading-none"
            style={{ fontFamily: NUNITO }}
          >
            <span style={{ color: "rgba(248,250,252,0.92)" }}>Trading</span>
            <span style={{ background: "linear-gradient(90deg,#14B8A6,#0D9488)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>MC</span>
          </span>
        </Link>

        {/* Center nav — Features, centered in the bar. Hidden on phones: it is a
            hover dropdown (poor on touch) and the three columns together
            overflow a 390px viewport, which scrolled the whole page sideways.
            The same feature pages stay reachable from the product cards, the
            explorer and the footer. */}
        <nav className="col-start-2 hidden items-center justify-center gap-1 sm:flex sm:gap-2" style={{ fontFamily: NUNITO }}>
          {/* Features dropdown */}
          <div
            ref={wrapRef}
            className="relative"
            onMouseEnter={() => { cancelClose(); setOpen(true); }}
            onMouseLeave={scheduleClose}
          >
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold text-[rgba(248,250,252,0.60)] transition-colors duration-200 hover:text-[rgba(248,250,252,0.92)]"
            >
              Features
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
              />
            </button>

            {open && (
              <div
                onMouseEnter={cancelClose}
                onMouseLeave={scheduleClose}
                className="absolute left-1/2 top-full z-40 mt-2 max-h-[70vh] w-[340px] -translate-x-1/2 overflow-y-auto rounded-2xl p-1.5"
                style={{
                  background: "rgba(19,27,46,0.97)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  border: "1px solid rgba(248,250,252,0.10)",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.25), 0 18px 50px rgba(0,0,0,0.45)",
                }}
              >
                {NAV_GROUPS.map((group) => (
                  <div key={group.heading} className="pt-1 first:pt-0">
                    <p
                      className="px-3 pb-1 pt-2.5 text-[10px] font-bold uppercase tracking-[0.14em]"
                      style={{ color: "rgba(248,250,252,0.35)" }}
                    >
                      {group.heading}
                    </p>
                    {group.items.map((item) => (
                      <a
                        key={item.label}
                        href={item.anchor}
                        onClick={() => setOpen(false)}
                        className="group flex items-start gap-3 rounded-lg px-3 py-1.5 transition-colors duration-200 hover:bg-[rgba(20,184,166,0.07)]"
                      >
                        <div className="min-w-0 flex-1">
                          <span className="text-sm font-bold" style={{ color: "rgba(248,250,252,0.90)" }}>
                            {item.label}
                          </span>
                          {item.tagline && (
                            <p className="mt-0.5 text-[11px] leading-snug" style={{ color: "rgba(248,250,252,0.55)" }}>
                              {item.tagline}
                            </p>
                          )}
                        </div>
                        <ArrowDown className="mt-1 h-3.5 w-3.5 shrink-0 -translate-y-1 text-[#14B8A6] opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100" />
                      </a>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

        </nav>

        {/* Right nav — account actions, pushed to the far right */}
        <nav className="col-start-3 flex items-center justify-end gap-1 sm:gap-2" style={{ fontFamily: NUNITO }}>
          {/* Sign in */}
          <Link
            href="/login"
            className="rounded-full px-3 py-1.5 text-sm font-semibold text-[rgba(248,250,252,0.60)] transition-colors duration-200 hover:text-[rgba(248,250,252,0.92)]"
          >
            Sign in
          </Link>

          {/* Make account */}
          <Link
            href="/signup"
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
            style={{
              background: "linear-gradient(135deg,#14B8A6 0%,#0D9488 100%)",
              boxShadow: "0 2px 14px rgba(20,184,166,0.35), 0 1px 2px rgba(0,0,0,0.30)",
            }}
          >
            Make account
          </Link>
        </nav>
      </div>
    </header>
  );
}
