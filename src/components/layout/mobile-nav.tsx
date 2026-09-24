"use client";

import { useEffect, useRef, useSyncExternalStore, type RefObject } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Plus, TrendingUp } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { PRIMARY_NAV } from "@/lib/nav";
import { NAV_ICON_ASSETS } from "@/lib/nav-icons";
export { NAV_ICON_ASSETS } from "@/lib/nav-icons";

/**
 * Phone navigation, the way the apps next to it on the home screen do it: a
 * fixed bar of icons pinned to the bottom, no labels, a raised "create" pill in
 * the middle that logs a trade. Icons carry the meaning; the selected one is
 * drawn heavier and brighter with a dot beneath it, and the link's accessible
 * name carries the label a screen reader needs.
 *
 * Switching tabs happens dozens of times a day, so it does not animate: the
 * only motion is the press itself. Desktop is untouched: everything here is
 * `lg:hidden`.
 */

/** What the create pill offers: the two things a trader starts from the desk. */
export const CREATE = [
  { label: "Log trade", hint: "Add to the journal", href: "/journal/new", icon: TrendingUp },
  { label: "New analysis", hint: "Plan before the session", href: "/analysis/new", icon: Compass },
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

function TabIcon({ tab, active }: { tab: (typeof PRIMARY_NAV)[number]; active: boolean }) {
  const iconSrc = NAV_ICON_ASSETS[tab.href];
  return (
    <Link
      href={tab.href}
      aria-label={tab.label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "mobile-tab relative flex h-full flex-col items-center justify-center",
        active ? "text-foreground" : "text-foreground/55"
      )}
    >
      <span className={cn(
        "relative h-[30px] w-[30px] transition-[filter,opacity,transform] duration-150",
        active ? "scale-105 opacity-100" : "opacity-55 grayscale-[35%]"
      )}>
        <Image src={iconSrc} alt="" fill sizes="30px" className="object-contain" />
      </span>
      <span
        aria-hidden
        className={cn("mt-1.5 h-1 w-1 rounded-full bg-primary transition-opacity duration-150", active ? "opacity-100" : "opacity-0")}
      />
    </Link>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const [first, second, ...rest] = PRIMARY_NAV;

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 lg:hidden border-t border-sidebar-border/60"
      style={{
        background: "var(--nav-bg)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="mx-auto grid h-14 max-w-md grid-cols-5 items-stretch px-2">
        {[first, second].map((tab) => <TabIcon key={tab.href} tab={tab} active={isActive(pathname, tab.href)} />)}
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Create"
            className="group/create mobile-tab mobile-tab-create flex items-center justify-center outline-none"
          >
            <span
              aria-hidden
              className="grid h-8 w-12 place-items-center rounded-xl text-white"
              style={{
                background: "linear-gradient(135deg, var(--primary) 0%, var(--ice) 100%)",
                boxShadow: "0 6px 18px color-mix(in oklch, var(--primary) 35%, transparent), inset 0 1px 0 rgba(255,255,255,0.25)",
              }}
            >
              <Plus className="h-5 w-5 transition-transform duration-150 ease-out group-data-[popup-open]/create:rotate-45" strokeWidth={2.6} />
            </span>
          </DropdownMenuTrigger>
          {/* Opens upward out of the pill: two large rows, thumb-sized. */}
          <DropdownMenuContent side="top" align="center" sideOffset={14} className="w-64 rounded-2xl border border-border/60 p-1.5 shadow-[0_20px_50px_rgba(0,0,0,.45)]">
            {CREATE.map((item) => (
              <DropdownMenuItem key={item.href} render={<Link href={item.href} />} className="flex items-center gap-3 rounded-xl px-2.5 py-2.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/12 text-primary">
                  <item.icon className="size-[18px]" strokeWidth={2.1} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[15px] font-semibold leading-tight text-foreground">{item.label}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{item.hint}</span>
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        {rest.map((tab) => <TabIcon key={tab.href} tab={tab} active={isActive(pathname, tab.href)} />)}
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
