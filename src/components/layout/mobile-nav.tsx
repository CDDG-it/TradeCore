"use client";

import { useEffect, useRef, useSyncExternalStore, type RefObject } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Brain, HeartPulse, Globe, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRIMARY_NAV } from "@/lib/nav";

/**
 * Phone navigation, built the way every app on the home screen does it:
 * a fixed tab bar pinned to the bottom of the viewport, thumb-height, with the
 * profile living top-right in the header instead of behind a hamburger.
 *
 * Desktop is untouched — everything here is `lg:hidden`.
 */

const ICONS: Record<string, LucideIcon> = {
  "/dashboard": Home,
  "/psychological-edge": Brain,
  "/trade-therapist": HeartPulse,
  "/news-city": Globe,
};

/**
 * Pages that live under a tab without having one of their own. The Trading
 * pages are opened from the Dashboard hub, so the Home tab stays lit while you
 * are in them rather than leaving no tab selected at all.
 */
const ALSO_UNDER: Record<string, string[]> = {
  "/dashboard": ["/journal", "/analysis", "/analytics", "/accounts"],
};

const isActive = (pathname: string, href: string) =>
  pathname === href ||
  pathname.startsWith(href + "/") ||
  (ALSO_UNDER[href] ?? []).some((p) => pathname === p || pathname.startsWith(p + "/"));

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 lg:hidden border-t border-sidebar-border"
      style={{
        background: "var(--nav-bg)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="grid h-14 grid-cols-4">
        {PRIMARY_NAV.map((tab) => {
          const Icon = ICONS[tab.href] ?? Home;
          const active = isActive(pathname, tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 transition-colors",
                active ? "text-primary" : "text-sidebar-foreground/50"
              )}
            >
              {active && (
                <span
                  aria-hidden
                  className="absolute inset-x-5 top-0 h-0.5 rounded-full"
                  style={{ background: "linear-gradient(90deg, #14B8A6, #06B6D4)" }}
                />
              )}
              <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.4 : 1.9} />
              <span className="text-[10px] font-semibold leading-none tracking-tight">
                {tab.short ?? tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/**
 * A page's own tabs, docked just above the bottom bar on phones so both levels
 * of navigation sit under the thumb. Pages keep rendering their desktop tab
 * strip and simply hide it below `lg`.
 *
 * Mounting sets `data-subnav` on <html>, which globals.css reads to reserve the
 * extra bottom padding — the strip is fixed, so it can't push content itself.
 */
let mounted = 0;
const noSubscribe = () => () => {};

export function MobileSubnav<T extends string>({
  items,
  value,
  onChange,
  label = "Sections",
  scrollRef,
}: {
  items: { key: T; label: string; short?: string }[];
  value: T;
  onChange: (key: T) => void;
  label?: string;
  /** The element the section scrolls in, when it isn't the page itself. */
  scrollRef?: RefObject<HTMLElement | null>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const picked = useRef(false);
  // The strip is portalled to <body>. The page it belongs to is rendered inside
  // the route transition's motion wrapper, and a `transform` there — even the
  // 4px lift of the page fade-in — would make this `fixed` element resolve
  // against that wrapper instead of the viewport, so it would slide with the
  // page rather than staying docked to the bottom of the screen.
  // `document.body` only exists on the client, hence the hydration gate.
  const onClient = useSyncExternalStore(noSubscribe, () => true, () => false);

  // Counted rather than set/unset: a page transition can hold the outgoing and
  // incoming page on screen at once, and a plain cleanup would then clear the
  // flag the page that is arriving just set.
  useEffect(() => {
    mounted += 1;
    document.documentElement.dataset.subnav = "1";
    return () => {
      mounted -= 1;
      if (mounted === 0) delete document.documentElement.dataset.subnav;
    };
  }, []);

  // Keep the selected pill in view when the strip is wider than the screen.
  // The strip is moved directly rather than with `scrollIntoView`, which walks
  // up every scrollable ancestor — and this strip is fixed over the page, so
  // that would drag the page under it as a side effect.
  useEffect(() => {
    const strip = ref.current;
    const active = strip?.querySelector<HTMLElement>('[data-active="true"]');
    if (!strip || !active) return;
    const left = active.offsetLeft - (strip.clientWidth - active.clientWidth) / 2;
    // Glide only when the reader tapped a pill; a tab restored from the URL
    // should already be in place on the first paint.
    strip.scrollTo({ left: Math.max(0, left), behavior: picked.current ? "smooth" : "instant" });
    picked.current = false;
  }, [value]);

  // Switching section is a content swap, not a navigation: start the new one at
  // its top instead of wherever the previous section happened to be scrolled.
  // Instant, because the old content is already gone by the time it would land.
  function select(key: T) {
    picked.current = true;
    if (key !== value) {
      scrollRef?.current?.scrollTo({ top: 0, behavior: "instant" });
      window.scrollTo({ top: 0, behavior: "instant" });
    }
    onChange(key);
  }

  if (!onClient) return null;

  return createPortal(
    <div
      aria-label={label}
      className="fixed inset-x-0 z-40 lg:hidden border-t border-sidebar-border/70"
      style={{
        bottom: "calc(3.5rem + env(safe-area-inset-bottom))",
        background: "var(--nav-bg)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      <div
        ref={ref}
        className="flex gap-1.5 overflow-x-auto px-3 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item) => {
          const active = item.key === value;
          return (
            <button
              key={item.key}
              type="button"
              data-active={active}
              onClick={() => select(item.key)}
              className={cn(
                "shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-colors",
                active
                  ? "text-primary-foreground"
                  : "border border-border/60 text-muted-foreground"
              )}
              style={
                active
                  ? {
                      background: "linear-gradient(150deg, #14B8A6, #0D9488 90%)",
                      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2)",
                    }
                  : undefined
              }
            >
              {item.short ?? item.label}
            </button>
          );
        })}
      </div>
    </div>,
    document.body
  );
}
