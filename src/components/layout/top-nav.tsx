"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, NotebookPen, Crosshair, BarChart3, Wallet, Flame, ScrollText,
  Brain, Waves, Globe, Plus, Menu, X, Settings, User as UserIcon, LogOut,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { APP_TABS } from "@/lib/nav";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

const TURQUOISE = "#14B8A6";

// Icon + compact label per route. Labels shorten the long group items so all
// ten sections fit on one horizontal bar; the full sidebar wording lives in
// APP_TABS and shows as the hover tooltip.
const META: Record<string, { icon: LucideIcon; short: string }> = {
  "/dashboard": { icon: Home, short: "Home" },
  "/journal": { icon: NotebookPen, short: "Journal" },
  "/analysis": { icon: Crosshair, short: "Analysis" },
  "/analytics": { icon: BarChart3, short: "Analytics" },
  "/accounts": { icon: Wallet, short: "Accounts" },
  "/habits": { icon: Flame, short: "Habits" },
  "/trading-behaviour": { icon: ScrollText, short: "Behaviour" },
  "/psychological-edge": { icon: Brain, short: "Edge" },
  "/option-flow": { icon: Waves, short: "Flow" },
  "/news-city": { icon: Globe, short: "News" },
};

const isActive = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(href + "/");

// Grouped for the mobile overlay (keeps the original section wording).
const groups = (() => {
  const order: (string | null)[] = [];
  const byGroup = new Map<string | null, typeof APP_TABS>();
  for (const tab of APP_TABS) {
    if (!byGroup.has(tab.group)) { byGroup.set(tab.group, []); order.push(tab.group); }
    byGroup.get(tab.group)!.push(tab);
  }
  return order.map((label) => ({ label, items: byGroup.get(label)! }));
})();

function DesktopItem({ href, label, active }: { href: string; label: string; active: boolean }) {
  const meta = META[href];
  const Icon = meta?.icon ?? Home;
  return (
    <Link
      href={href}
      title={label}
      className={cn(
        "group relative flex items-center gap-2 rounded-lg px-3 h-9 text-[13px] font-semibold whitespace-nowrap transition-colors",
        active ? "text-white" : "text-sidebar-foreground/55 hover:text-sidebar-foreground"
      )}
      style={active ? { background: "rgba(20,184,166,0.14)" } : undefined}
    >
      <Icon className={cn("w-4 h-4 shrink-0 transition-colors", active ? "text-[#14B8A6]" : "text-sidebar-foreground/40 group-hover:text-[#14B8A6]")} />
      {meta?.short ?? label}
    </Link>
  );
}

export function TopNav() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Trader";
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <>
    <header
      className="sticky top-0 z-40 border-b border-sidebar-border"
      style={{ background: "color-mix(in oklch, var(--sidebar) 82%, transparent)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
    >
      <div className="flex h-14 items-center gap-3 px-4 lg:px-6">
        {/* Logo */}
        <Link href="/dashboard" aria-label="TradingMC" className="shrink-0 hover:opacity-80 transition-opacity">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/tradingmc-app-dark.svg" alt="TradingMC" width={38} height={38} className="h-9 w-9" />
        </Link>

        {/* Desktop nav — every section, grouped with thin dividers */}
        <nav className="hidden lg:flex items-center gap-0.5 flex-1 min-w-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {groups.map((group, gi) => (
            <div key={gi} className="flex items-center gap-0.5">
              {gi > 0 && <span className="mx-1.5 h-5 w-px bg-sidebar-border shrink-0" />}
              {group.items.map((tab) => (
                <DesktopItem key={tab.href} href={tab.href} label={tab.label} active={isActive(pathname, tab.href)} />
              ))}
            </div>
          ))}
        </nav>

        {/* Desktop right actions */}
        <div className="hidden lg:flex items-center gap-2 shrink-0">
          <Link
            href="/journal/new"
            className="inline-flex items-center gap-1.5 rounded-lg px-3.5 h-9 text-[13px] font-semibold text-white transition-all hover:-translate-y-px"
            style={{ background: TURQUOISE, boxShadow: "0 2px 14px rgba(20,184,166,0.30)" }}
          >
            <Plus className="w-4 h-4" /> Log Trade
          </Link>
          <UserMenu displayName={displayName} email={user?.email ?? ""} initials={initials} onSignOut={signOut} />
        </div>

        {/* Mobile right actions */}
        <div className="flex lg:hidden items-center gap-2 ml-auto">
          <Link
            href="/journal/new"
            aria-label="Log trade"
            className="inline-flex items-center justify-center rounded-lg h-9 w-9 text-white"
            style={{ background: TURQUOISE }}
          >
            <Plus className="w-4 h-4" />
          </Link>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="inline-flex items-center justify-center rounded-lg h-9 w-9 border border-sidebar-border text-sidebar-foreground/70"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>

      {/* Mobile full-screen overlay menu — a sibling of the (backdrop-filtered)
          header so `fixed` is relative to the viewport, not the bar. */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col" style={{ background: "var(--sidebar)" }}>
          <div className="flex h-14 items-center justify-between px-4 border-b border-sidebar-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/tradingmc-app-dark.svg" alt="TradingMC" width={38} height={38} className="h-9 w-9" />
            <button type="button" onClick={() => setOpen(false)} aria-label="Close menu"
              className="inline-flex items-center justify-center rounded-lg h-9 w-9 border border-sidebar-border text-sidebar-foreground/70">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
            {groups.map((group, gi) => (
              <div key={gi}>
                {group.label && (
                  <p className="mb-2 px-1 text-[10px] font-extrabold uppercase tracking-[0.16em]" style={{ color: "rgba(20,184,166,0.8)" }}>
                    {group.label}
                  </p>
                )}
                <div className="grid grid-cols-2 gap-2">
                  {group.items.map((tab) => {
                    const meta = META[tab.href];
                    const Icon = meta?.icon ?? Home;
                    const active = isActive(pathname, tab.href);
                    return (
                      <Link
                        key={tab.href}
                        href={tab.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-2.5 rounded-xl border px-3 py-3 text-sm font-semibold transition-colors",
                          active ? "text-white border-transparent" : "text-sidebar-foreground/70 border-sidebar-border"
                        )}
                        style={active ? { background: "rgba(20,184,166,0.14)" } : undefined}
                      >
                        <Icon className="w-4 h-4 shrink-0" style={{ color: active ? TURQUOISE : undefined }} />
                        <span className="truncate">{tab.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-sidebar-border p-4 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(20,184,166,0.15)" }}>
                <span className="text-xs font-bold" style={{ color: TURQUOISE }}>{initials}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-sidebar-foreground/85 truncate">{displayName}</p>
                <p className="text-xs text-sidebar-foreground/40 truncate">{user?.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1">
              <Link href="/settings" onClick={() => setOpen(false)} className="flex items-center justify-center gap-1.5 rounded-lg border border-sidebar-border py-2 text-xs font-medium text-sidebar-foreground/70">
                <Settings className="w-3.5 h-3.5" /> Settings
              </Link>
              <Link href="/profile" onClick={() => setOpen(false)} className="flex items-center justify-center gap-1.5 rounded-lg border border-sidebar-border py-2 text-xs font-medium text-sidebar-foreground/70">
                <UserIcon className="w-3.5 h-3.5" /> Profile
              </Link>
              <button onClick={signOut} className="flex items-center justify-center gap-1.5 rounded-lg border border-sidebar-border py-2 text-xs font-medium text-destructive">
                <LogOut className="w-3.5 h-3.5" /> Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function UserMenu({
  displayName, email, initials, onSignOut,
}: {
  displayName: string;
  email: string;
  initials: string;
  onSignOut: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label="Account menu"
            className="flex h-9 w-9 items-center justify-center rounded-full transition-transform hover:scale-105"
            style={{ background: "rgba(20,184,166,0.15)" }}
          />
        }
      >
        <span className="text-[11px] font-bold" style={{ color: TURQUOISE }}>{initials}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <p className="text-sm font-semibold truncate">{displayName}</p>
          <p className="text-xs font-normal text-muted-foreground truncate">{email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/settings" />}>
          <Settings className="w-4 h-4" /> Settings
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/profile" />}>
          <UserIcon className="w-4 h-4" /> Profile
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onSignOut} className="text-destructive">
          <LogOut className="w-4 h-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
