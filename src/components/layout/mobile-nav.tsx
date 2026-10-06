"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type RefObject } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { PRIMARY_NAV } from "@/lib/nav";
import { useScrollNav } from "@/lib/ui/use-scroll-nav";

/** Text-first phone navigation that makes room for the page while scrolling. */

/** What the create pill offers: the two things a trader starts from the desk. */
export const CREATE = [
  { label: "Log trade", hint: "Add to the journal", href: "/journal/new" },
  { label: "New analysis", hint: "Plan before the session", href: "/analysis/new" },
] as const;

/**
 * Pages that live under a tab without having one of their own. The Trading
 * pages are opened from the Dashboard hub, so the Home tab stays lit while you
 * are in them rather than leaving no tab selected at all.
 */
const ALSO_UNDER: Record<string, string[]> = {
  "/dashboard": ["/journal", "/analysis", "/analytics", "/accounts", "/preview/dashboard"],
};

export const isActive = (pathname: string, href: string) =>
  pathname === href ||
  pathname.startsWith(href + "/") ||
  (ALSO_UNDER[href] ?? []).some((p) => pathname === p || pathname.startsWith(p + "/"));

function TabLabel({ tab, active }: { tab: (typeof PRIMARY_NAV)[number]; active: boolean }) {
  return (
    <Link
      href={tab.href}
      aria-label={tab.label}
      aria-current={active ? "page" : undefined}
      className={cn("mobile-tab relative flex h-full min-w-0 items-center justify-center px-1 text-center text-[11px] font-semibold leading-tight tracking-tight transition-colors", active ? "text-foreground" : "text-foreground/55")}
    >
      <span className="relative z-10">{tab.short ?? tab.label}</span>
      <span aria-hidden className={cn("absolute inset-x-3 bottom-1 h-0.5 rounded-full bg-primary transition-opacity duration-200", active ? "opacity-100" : "opacity-0")} />
    </Link>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const [createOpen, setCreateOpen] = useState(false);
  const { visible, show } = useScrollNav(createOpen);
  const [first, second, ...rest] = PRIMARY_NAV;

  return (
    <nav
      aria-label="Primary"
      onFocusCapture={show}
      className={cn("fixed inset-x-0 bottom-0 z-40 border-t border-sidebar-border/60 transition-[transform,opacity] duration-200 ease-[var(--ease-out-strong)] motion-reduce:transition-opacity lg:hidden", !visible && "pointer-events-none translate-y-full opacity-0 motion-reduce:translate-y-0")}
      style={{
        background: "var(--nav-bg)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="mx-auto grid h-14 max-w-md grid-cols-5 items-stretch px-2">
        {[first, second].map((tab) => <TabLabel key={tab.href} tab={tab} active={isActive(pathname, tab.href)} />)}
        <DropdownMenu open={createOpen} onOpenChange={setCreateOpen}>
          <DropdownMenuTrigger
            aria-label="Create"
            className="group/create mobile-tab mobile-tab-create flex items-center justify-center text-[11px] font-semibold text-primary outline-none"
          >
            <span className="rounded-full border border-primary/35 bg-primary/10 px-2.5 py-1.5">Create</span>
          </DropdownMenuTrigger>
          {/* Opens upward out of the pill: two large rows, thumb-sized. */}
          <DropdownMenuContent side="top" align="center" sideOffset={14} className="w-64 rounded-2xl border border-border/60 p-1.5 shadow-[0_20px_50px_rgba(0,0,0,.45)]">
            {CREATE.map((item) => (
              <DropdownMenuItem key={item.href} render={<Link href={item.href} />} className="flex items-center gap-3 rounded-xl px-2.5 py-2.5">
                <span className="min-w-0">
                  <span className="block text-[15px] font-semibold leading-tight text-foreground">{item.label}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{item.hint}</span>
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        {rest.map((tab) => <TabLabel key={tab.href} tab={tab} active={isActive(pathname, tab.href)} />)}
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
 * extra bottom padding: the strip is fixed, so it can't push content itself.
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
  const { visible, show } = useScrollNav();
  const picked = useRef(false);
  // The strip is portalled to <body>. The page it belongs to is rendered inside
  // the route transition's motion wrapper, and a `transform` there: even the
  // 4px lift of the page fade-in: would make this `fixed` element resolve
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
  // up every scrollable ancestor, and this strip is fixed over the page, so
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
      onFocusCapture={show}
      className={cn("fixed inset-x-0 z-40 border-t border-sidebar-border/70 transition-[transform,opacity] duration-200 ease-[var(--ease-out-strong)] motion-reduce:transition-opacity lg:hidden", !visible && "pointer-events-none translate-y-full opacity-0 motion-reduce:translate-y-0")}
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
                      background: "linear-gradient(150deg, var(--primary), color-mix(in oklch, var(--primary) 82%, black) 90%)",
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
