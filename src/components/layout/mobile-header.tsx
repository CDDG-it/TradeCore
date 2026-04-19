"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  LayoutDashboard,
  BookOpen,
  LineChart,
  BarChart2,
  Wallet,
  Newspaper,
  Settings,
  User,
  LogOut,
  CheckSquare,
  Compass,
  Brain,
  BookMarked,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { Logo } from "@/components/logo";

const navItems = [
  { href: "/command", label: "Command Center", icon: Compass },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/journal", label: "Journal", icon: BookOpen },
  { href: "/analysis", label: "Analysis", icon: LineChart },
  { href: "/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/accounts", label: "Accounts", icon: Wallet },
  { href: "/habits", label: "Habits", icon: CheckSquare },
  { href: "/playbook", label: "Playbook", icon: BookMarked },
  { href: "/coaching", label: "Coaching", icon: Brain },
  { href: "/news", label: "News", icon: Newspaper },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/profile", label: "Profile", icon: User },
];

export function MobileHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const initials =
    user?.full_name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "DT";

  return (
    <>
      {/* Header bar */}
      <header
        className="liquid-glass-strong lg:hidden fixed top-0 left-0 right-0 h-14 flex items-center justify-between px-4 z-50 rounded-none"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <Logo variant="dark" size={24} />
        </Link>
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-lg transition-colors"
          style={{ color: "oklch(0.90 0.003 28 / 60%)" }}
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* Overlay */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-50 backdrop-blur-sm"
          style={{ background: "oklch(0 0 0 / 70%)" }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer panel */}
      <div
        className={cn(
          "lg:hidden fixed top-0 left-0 h-screen w-64 z-50 flex flex-col transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        style={{
          background: "oklch(0.055 0.002 28)",
          borderRight: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div
          className="h-14 flex items-center justify-between px-5"
          style={{ borderBottom: "1px solid oklch(1 0 0 / 5%)" }}
        >
          <Link
            href="/"
            className="hover:opacity-80 transition-opacity"
            onClick={() => setOpen(false)}
          >
            <Logo variant="dark" size={24} />
          </Link>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: "oklch(0.90 0.003 28 / 50%)" }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive =
              pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-foreground"
                    : "text-sidebar-foreground/40 hover:text-sidebar-foreground/80 hover:bg-sidebar-accent/60"
                )}
              >
                {isActive && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                    style={{ background: "oklch(0.72 0.22 45)" }}
                  />
                )}
                <Icon
                  className={cn(
                    "w-4 h-4 shrink-0",
                    isActive ? "text-sidebar-primary" : ""
                  )}
                />
                {label}
              </Link>
            );
          })}
        </nav>

        <div
          className="px-3 pb-4 pt-3"
          style={{ borderTop: "1px solid oklch(1 0 0 / 5%)" }}
        >
          <div className="flex items-center gap-2.5 px-3 py-2.5">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: "oklch(0.72 0.22 45 / 18%)" }}
            >
              <span
                className="text-xs font-bold"
                style={{ color: "oklch(0.72 0.22 45)" }}
              >
                {initials}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-sidebar-foreground truncate">
                {user?.full_name || "Demo Trader"}
              </p>
              <p
                className="text-xs truncate"
                style={{ color: "oklch(0.90 0.003 28 / 35%)" }}
              >
                {user?.email || "demo@tradinghub.app"}
              </p>
            </div>
            <button
              onClick={signOut}
              className="transition-colors"
              style={{ color: "oklch(0.90 0.003 28 / 35%)" }}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
