"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { Menu, X, Settings, User as UserIcon, LogOut, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { PRIMARY_NAV } from "@/lib/nav";

const TURQUOISE = "#14B8A6";

const isActive = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(href + "/");

function DesktopItem({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "relative flex items-center h-9 px-3.5 rounded-lg text-[13px] font-semibold whitespace-nowrap transition-colors",
        active ? "text-foreground" : "text-sidebar-foreground/55 hover:text-sidebar-foreground"
      )}
    >
      {active && (
        <motion.span
          layoutId="nav-active-pill"
          className="absolute inset-0 rounded-lg overflow-hidden"
          style={{
            background: "linear-gradient(160deg, rgba(20,184,166,0.28), rgba(6,182,212,0.12) 60%, rgba(20,184,166,0.06))",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            border: "1px solid rgba(20,184,166,0.38)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -8px 14px rgba(6,182,212,0.10), 0 4px 14px rgba(20,184,166,0.20)",
          }}
          transition={{ type: "spring", stiffness: 480, damping: 36 }}
        >
          {/* Moving glass sheen — a soft highlight that catches the light as the pill slides */}
          <motion.span
            aria-hidden
            className="absolute inset-y-0 -left-1/3 w-1/2"
            style={{ background: "linear-gradient(105deg, transparent, rgba(255,255,255,0.28), transparent)" }}
            animate={{ x: ["-40%", "260%"] }}
            transition={{ duration: 2.6, ease: "easeInOut", repeat: Infinity, repeatDelay: 1.4 }}
          />
        </motion.span>
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
        {/* Three balanced regions so the nav sits screen-centred: the left
            (logo) and right (actions) slots share equal flex width, keeping the
            centre nav horizontally centred regardless of their content. */}
        <div className="flex h-14 items-center gap-3 px-4 lg:px-6">
          {/* Left — logo */}
          <div className="flex-1 flex items-center min-w-0">
            <Link href="/" aria-label="TradingMC — home" className="shrink-0 hover:opacity-80 transition-opacity">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/tradingmc-app-dark.svg" alt="TradingMC" width={38} height={38} className="h-9 w-9" />
            </Link>
          </div>

          {/* Centre — desktop nav */}
          <nav className="hidden lg:flex items-center justify-center gap-1 min-w-0 max-w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {PRIMARY_NAV.map((tab) => (
              <DesktopItem key={tab.href} href={tab.href} label={tab.label} active={isActive(pathname, tab.href)} />
            ))}
          </nav>

          {/* Right — actions */}
          <div className="flex-1 flex items-center justify-end gap-2 min-w-0">
            <div className="hidden lg:flex items-center gap-2 shrink-0">
              <ProfileMenu displayName={displayName} email={user?.email ?? ""} initials={initials} onSignOut={signOut} />
            </div>
            <button type="button" onClick={() => setOpen(true)} aria-label="Open menu"
              className="inline-flex lg:hidden items-center justify-center rounded-lg h-9 w-9 border border-sidebar-border text-sidebar-foreground/70">
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

          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-1">
            {PRIMARY_NAV.map((tab) => {
              const active = isActive(pathname, tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center rounded-xl px-4 py-3 text-sm font-semibold transition-colors",
                    active ? "text-foreground" : "text-sidebar-foreground/70 hover:text-sidebar-foreground"
                  )}
                  style={active ? { background: "rgba(20,184,166,0.14)" } : undefined}
                >
                  {tab.label}
                </Link>
              );
            })}
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

/** Avatar chip — initials on a turquoise→cyan gradient ring, over the nav bg. */
function AvatarChip({ initials, size }: { initials: string; size: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full p-[1.5px]"
      style={{ width: size, height: size, background: "linear-gradient(135deg, #14B8A6 0%, #06B6D4 100%)" }}
    >
      <span
        className="flex h-full w-full items-center justify-center rounded-full"
        style={{ background: "var(--sidebar)" }}
      >
        <span className="font-bold text-sidebar-foreground" style={{ fontSize: size * 0.36 }}>
          {initials}
        </span>
      </span>
    </span>
  );
}

/** Click-to-open profile dropdown — a polished glass panel listing Profile,
 *  Settings and Sign out. Adapted from KokonutUI's Profile Dropdown (MIT,
 *  https://kokonutui.com), reworked to the TradingMC palette. */
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

  const links = [
    { label: "Profile", href: "/profile", icon: UserIcon },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg h-9 pl-1.5 pr-2.5 border border-transparent hover:border-sidebar-border transition-colors"
      >
        <AvatarChip initials={initials} size={28} />
        <span className="text-[13px] font-semibold text-sidebar-foreground/80 max-w-[120px] truncate">{displayName}</span>
        <ChevronDown className={cn("w-3.5 h-3.5 text-sidebar-foreground/40 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: -6, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
          className="absolute right-0 top-full mt-2 w-64 origin-top-right rounded-2xl border border-border p-2 shadow-xl z-50 backdrop-blur-sm"
          style={{ background: "color-mix(in oklch, var(--popover, var(--card)) 94%, transparent)" }}
        >
          {/* Header — avatar + identity */}
          <div className="flex items-center gap-3 px-2 py-2">
            <AvatarChip initials={initials} size={40} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-tight truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground leading-tight truncate">{email}</p>
            </div>
          </div>

          <div className="my-2 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

          {/* Profile / Settings */}
          <div className="space-y-1">
            {links.map(({ label, href, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="group flex items-center gap-2.5 rounded-xl border border-transparent p-2.5 text-sm font-medium text-foreground/85 transition-all hover:border-border/60 hover:bg-muted/70"
              >
                <Icon className="w-4 h-4 text-muted-foreground transition-colors group-hover:text-foreground" />
                <span className="transition-colors group-hover:text-foreground">{label}</span>
              </Link>
            ))}
          </div>

          <div className="my-2 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

          {/* Sign out */}
          <button
            onClick={() => { setOpen(false); onSignOut(); }}
            className="group flex w-full items-center gap-2.5 rounded-xl border border-transparent bg-destructive/10 p-2.5 text-sm font-medium text-destructive transition-all hover:border-destructive/30 hover:bg-destructive/20"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign out</span>
          </button>
        </motion.div>
      )}
    </div>
  );
}
