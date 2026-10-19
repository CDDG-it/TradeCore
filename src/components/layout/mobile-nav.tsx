"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { PRIMARY_NAV } from "@/lib/nav";
import { NAV_ICON_ASSETS } from "@/lib/nav-icons";

/** Phone navigation, always available at the workspace edge: the product's own icons over short labels. */

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

function TabLabel({ tab, active, instant }: { tab: (typeof PRIMARY_NAV)[number]; active: boolean; instant: boolean }) {
  const icon = NAV_ICON_ASSETS[tab.href];
  return (
    <Link
      href={tab.href}
      aria-label={tab.label}
      aria-current={active ? "page" : undefined}
      className={cn("mobile-tab relative flex h-full min-w-0 flex-col items-center justify-center gap-0.5 px-1 text-center text-[10px] font-semibold leading-tight tracking-tight transition-colors", active ? "text-foreground" : "text-foreground/55")}
    >
      {/* One indicator for the whole bar, sliding to the current tab. */}
      {active && (
        <motion.span
          layoutId="mobile-tab-indicator"
          aria-hidden
          className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-primary shadow-[0_0_10px_rgba(20,184,166,.7)]"
          transition={instant ? { duration: 0 } : { type: "spring", stiffness: 480, damping: 38 }}
        />
      )}
      {icon && (
        <motion.span
          className="relative z-10 grid size-6 place-items-center"
          animate={{ transform: active ? "translateY(-1px) scale(1.1)" : "scale(1)" }}
          transition={instant ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 22 }}
        >
          <Image src={icon} alt="" width={48} height={48} sizes="24px" loading="eager"
            className={cn("size-6 object-contain transition-[filter,opacity] duration-200", active ? "opacity-100 drop-shadow-[0_2px_8px_rgba(20,184,166,.45)]" : "opacity-55 saturate-[.6]")} />
        </motion.span>
      )}
      <span className="relative z-10">{tab.short ?? tab.label}</span>
    </Link>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const reduce = useReducedMotion();
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
      <div className="mx-auto grid h-16 max-w-md grid-cols-5 items-stretch px-2">
        {[first, second].map((tab) => <TabLabel key={tab.href} tab={tab} active={isActive(pathname, tab.href)} instant={!!reduce} />)}
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
        {rest.map((tab) => <TabLabel key={tab.href} tab={tab} active={isActive(pathname, tab.href)} instant={!!reduce} />)}
      </div>
    </nav>
  );
}
