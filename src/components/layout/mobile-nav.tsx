"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { PRIMARY_NAV } from "@/lib/nav";

/** Text-first phone navigation, always available at the workspace edge. */

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
  const [first, second, ...rest] = PRIMARY_NAV;

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-sidebar-border/60 lg:hidden"
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
