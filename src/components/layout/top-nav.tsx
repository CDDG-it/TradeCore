"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { Menu, X, Settings, User as UserIcon, LogOut, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { APP_TABS } from "@/lib/nav";

const TURQUOISE = "#14B8A6";

const isActive = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(href + "/");

// Grouped for both the desktop dividers and the mobile overlay.
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
  return (
    <Link
      href={href}
      className={cn(
        "relative flex items-center h-9 px-3.5 rounded-lg text-[13px] font-semibold whitespace-nowrap transition-colors",
        active ? "text-white" : "text-sidebar-foreground/55 hover:text-sidebar-foreground"
      )}
    >
      {active && (
        <motion.span
          layoutId="nav-active-pill"
          className="absolute inset-0 rounded-lg"
          style={{ background: "rgba(20,184,166,0.16)" }}
          transition={{ type: "spring", stiffness: 500, damping: 34 }}
        />
      )}
      <span className="relative z-10">{label}</span>
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
        style={{ background: "var(--nav-bg)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
      >
        <div className="flex h-14 items-center gap-3 px-4 lg:px-6">
          {/* Logo */}
          <Link href="/" aria-label="TradingMC — home" className="shrink-0 hover:opacity-80 transition-opacity">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/tradingmc-app-dark.svg" alt="TradingMC" width={38} height={38} className="h-9 w-9" />
          </Link>

          {/* Desktop nav — text only, grouped with thin dividers */}
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
            <ProfileMenu displayName={displayName} email={user?.email ?? ""} initials={initials} onSignOut={signOut} />
          </div>

          {/* Mobile right actions */}
          <div className="flex lg:hidden items-center gap-2 ml-auto">
            <button type="button" onClick={() => setOpen(true)} aria-label="Open menu"
              className="inline-flex items-center justify-center rounded-lg h-9 w-9 border border-sidebar-border text-sidebar-foreground/70">
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile full-screen overlay — sibling of the backdrop-filtered header */}
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
                <div className="space-y-1">
                  {group.items.map((tab) => {
                    const active = isActive(pathname, tab.href);
                    return (
                      <Link
                        key={tab.href}
                        href={tab.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center rounded-xl px-4 py-3 text-sm font-semibold transition-colors",
                          active ? "text-white" : "text-sidebar-foreground/70 hover:text-sidebar-foreground"
                        )}
                        style={active ? { background: "rgba(20,184,166,0.14)" } : undefined}
                      >
                        {tab.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-sidebar-border p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(20,184,166,0.15)" }}>
                <span className="text-xs font-bold" style={{ color: TURQUOISE }}>{initials}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-sidebar-foreground/85 truncate">{displayName}</p>
                <p className="text-xs text-sidebar-foreground/40 truncate">{user?.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Link href="/profile" onClick={() => setOpen(false)} className="flex items-center justify-center gap-1.5 rounded-lg border border-sidebar-border py-2 text-xs font-medium text-sidebar-foreground/70">
                <UserIcon className="w-3.5 h-3.5" /> Profile
              </Link>
              <Link href="/settings" onClick={() => setOpen(false)} className="flex items-center justify-center gap-1.5 rounded-lg border border-sidebar-border py-2 text-xs font-medium text-sidebar-foreground/70">
                <Settings className="w-3.5 h-3.5" /> Settings
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

/** Lightweight click-to-open profile menu showing the name, linking to the
 *  existing Profile and Settings pages. */
function ProfileMenu({
  displayName, email, initials, onSignOut,
}: {
  displayName: string;
  email: string;
  initials: string;
  onSignOut: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDocClick); document.removeEventListener("keydown", onKey); };
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg h-9 pl-1.5 pr-2.5 border border-transparent hover:border-sidebar-border transition-colors"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full shrink-0" style={{ background: "rgba(20,184,166,0.15)" }}>
          <span className="text-[11px] font-bold" style={{ color: TURQUOISE }}>{initials}</span>
        </span>
        <span className="text-[13px] font-semibold text-sidebar-foreground/80 max-w-[120px] truncate">{displayName}</span>
        <ChevronDown className={cn("w-3.5 h-3.5 text-sidebar-foreground/40 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border p-1.5 shadow-xl z-50"
          style={{ background: "var(--popover, var(--card))" }}
        >
          <div className="px-2.5 py-2">
            <p className="text-sm font-semibold truncate">{displayName}</p>
            <p className="text-xs text-muted-foreground truncate">{email}</p>
          </div>
          <div className="h-px bg-border my-1" />
          <Link href="/profile" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-foreground/85 hover:bg-muted transition-colors">
            <UserIcon className="w-4 h-4" /> Profile
          </Link>
          <Link href="/settings" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-foreground/85 hover:bg-muted transition-colors">
            <Settings className="w-4 h-4" /> Settings
          </Link>
          <div className="h-px bg-border my-1" />
          <button onClick={() => { setOpen(false); onSignOut(); }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors">
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
