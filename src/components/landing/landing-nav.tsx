"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ChevronDown, ArrowRight } from "lucide-react";
import { FEATURES } from "@/lib/landing/features";
import { APP_TABS } from "@/lib/nav";

const NUNITO = "var(--font-nunito), system-ui, sans-serif";

// The dropdown always lists every current app tab, written exactly as in the
// sidebar. Tabs with a deep marketing page (FEATURES) link there and reuse
// its tagline; the rest link straight into the app with a short description.
const FEATURE_BY_HREF = new Map(FEATURES.map((f) => [`/${f.slug}`, f]));
const TAB_FALLBACK_TAGLINE: Record<string, string> = {
  "/habits": "Track daily habits and discipline, in one streak.",
  "/trading-behaviour": "Your trading rules and confluence library, in one place.",
  "/option-flow": "Dealer positioning and session structure for NQ and GC.",
  "/news-city": "Scan the market news feed and explore the forces in a live city.",
};
const NAV_ITEMS = APP_TABS.map((tab) => {
  const feature = FEATURE_BY_HREF.get(tab.href);
  return {
    label: tab.label,
    href: feature ? `/features/${feature.slug}` : tab.href,
    tagline: feature?.tagline ?? TAB_FALLBACK_TAGLINE[tab.href] ?? "",
  };
});

/* Top-of-hero navigation: brand, a Features dropdown listing every product page,
   a Coming soon link, then Sign in and a Make account button. */
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
      className="sticky top-0 z-30 px-6 py-4"
      style={{
        background: "rgba(11,17,32,0.88)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(248,250,252,0.09)",
      }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        {/* Brand — logo + wordmark, same font family as the hero heading, much smaller */}
        <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/tradingmc-app-dark.svg" alt="" width={44} height={44} className="h-11 w-11 shrink-0" />
          <span
            className="font-black tracking-tight text-base leading-none"
            style={{ fontFamily: NUNITO }}
          >
            <span style={{ color: "rgba(248,250,252,0.92)" }}>Trading</span>
            <span style={{ background: "linear-gradient(90deg,#14B8A6,#0D9488)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>MC</span>
          </span>
        </Link>

        {/* Center / right nav */}
        <nav className="flex items-center gap-1 sm:gap-2" style={{ fontFamily: NUNITO }}>
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
                className="absolute left-1/2 top-full z-40 mt-2 w-[300px] max-h-[70vh] -translate-x-1/2 overflow-y-auto rounded-2xl p-1.5"
                style={{
                  background: "rgba(19,27,46,0.97)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  border: "1px solid rgba(248,250,252,0.10)",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.25), 0 18px 50px rgba(0,0,0,0.45)",
                }}
              >
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="group flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors duration-200 hover:bg-[rgba(20,184,166,0.07)]"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-sm font-bold"
                          style={{ color: "rgba(248,250,252,0.90)" }}
                        >
                          {item.label}
                        </span>
                      </div>
                      <p
                        className="mt-0.5 text-xs leading-snug"
                        style={{ color: "rgba(248,250,252,0.55)" }}
                      >
                        {item.tagline}
                      </p>
                    </div>
                    <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 -translate-x-1 text-[#14B8A6] opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Coming soon */}
          <Link
            href="/coming-soon"
            className="rounded-full px-3 py-1.5 text-sm font-semibold text-[rgba(248,250,252,0.60)] transition-colors duration-200 hover:text-[rgba(248,250,252,0.92)]"
          >
            Coming soon
          </Link>

          {/* Divider */}
          <span className="mx-1 hidden h-4 w-px bg-[rgba(248,250,252,0.12)] sm:block" />

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
