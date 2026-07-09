"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";


const navItems = [
  { href: "/command", label: "Command Center" },
  { href: "/dashboard", label: "Home" },
  { href: "/journal", label: "Journal" },
  { href: "/analysis", label: "Analysis" },
  { href: "/analytics", label: "Analytics" },
  { href: "/accounts", label: "Accounts" },
  { href: "/habits", label: "Habits" },
  { href: "/trading-behaviour", label: "Trading Behaviour" },
  { href: "/option-flow", label: "Option Flow" },
  { href: "/settings", label: "Settings" },
  { href: "/profile", label: "Profile" },
];

export function MobileHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const displayName: string = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Trader";
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <>
      {/* Header bar */}
      <header className="bg-sidebar border-b border-sidebar-border lg:hidden fixed top-0 left-0 right-0 h-14 flex items-center justify-between px-4 z-50">
        <Link href="/"
          className="font-black text-base tracking-tight leading-none hover:opacity-80 transition-opacity"
          style={{ fontFamily: "var(--font-nunito), system-ui, sans-serif" }}>
          <span className="text-sidebar-foreground">Trading</span>
          <span style={{ background: "linear-gradient(90deg,#14B8A6,#06B6D4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>MC</span>
        </Link>
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-lg transition-colors text-sidebar-foreground/60"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* Overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-50 backdrop-blur-sm bg-black/40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer panel */}
      <div
        className={cn(
          "lg:hidden fixed top-0 left-0 h-screen w-64 z-50 flex flex-col transition-transform duration-200 bg-sidebar border-r border-sidebar-border",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-14 flex items-center justify-between px-5 border-b border-sidebar-border">
          <Link href="/"
            className="font-black text-base tracking-tight leading-none hover:opacity-80 transition-opacity"
            style={{ fontFamily: "var(--font-nunito), system-ui, sans-serif" }}
            onClick={() => setOpen(false)}>
            <span className="text-sidebar-foreground">Trading</span>
            <span style={{ background: "linear-gradient(90deg,#14B8A6,#06B6D4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>MC</span>
          </Link>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg transition-colors text-sidebar-foreground/50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ href, label }) => {
            const isActive =
              pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center px-3 py-2.5 rounded-lg text-sm font-extrabold transition-colors relative",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-foreground"
                    : "text-sidebar-foreground/40 hover:text-sidebar-foreground/80 hover:bg-sidebar-accent/60"
                )}
              >
                {isActive && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                    style={{ background: "#14B8A6" }}
                  />
                )}
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 pb-4 pt-3 border-t border-sidebar-border">
          <div className="flex items-center gap-2.5 px-3 py-2.5">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: "oklch(0.72 0.14 220 / 18%)" }}
            >
              <span
                className="text-xs font-bold"
                style={{ color: "#14B8A6" }}
              >
                {initials}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-sidebar-foreground truncate">
                {displayName}
              </p>
              <p className="text-xs text-sidebar-foreground/35 truncate">
                {user?.email || ""}
              </p>
            </div>
            <button
              onClick={signOut}
              className="transition-colors text-sidebar-foreground/35"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
