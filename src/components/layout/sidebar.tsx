"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  LineChart,
  BarChart2,
  Wallet,
  Radar,
  ScrollText,
  Flame,
  Building2,
  Settings,
  User,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { APP_TABS } from "@/lib/nav";

// Icons + the "highlight" treatment are sidebar-only presentation; the labels,
// hrefs and grouping themselves come from APP_TABS so the landing page's
// Features dropdown and footer Platform column can never say something
// different from what's actually in the nav.
const ICONS: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  "/dashboard": LayoutDashboard,
  "/journal": BookOpen,
  "/analysis": LineChart,
  "/analytics": BarChart2,
  "/accounts": Wallet,
  "/habits": Flame,
  "/trading-behaviour": ScrollText,
  "/option-flow": Radar,
  "/news-city": Building2,
};

const navGroups = (() => {
  const order: (string | null)[] = [];
  const byGroup = new Map<string | null, typeof APP_TABS>();
  for (const tab of APP_TABS) {
    if (!byGroup.has(tab.group)) {
      byGroup.set(tab.group, []);
      order.push(tab.group);
    }
    byGroup.get(tab.group)!.push(tab);
  }
  return order.map((label) => ({
    label,
    items: byGroup.get(label)!.map((tab) => ({
      href: tab.href,
      label: tab.label,
      icon: ICONS[tab.href],
      highlight: tab.href === "/dashboard",
    })),
  }));
})();

const bottomItems = [
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/profile", label: "Profile", icon: User },
];

function NavItem({
  href,
  label,
  icon: Icon,
  isActive,
  highlight,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  isActive: boolean;
  highlight?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "font-body flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 relative group/nav",
        isActive
          ? "bg-sidebar-accent text-sidebar-foreground"
          : "text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent/60 hover:scale-[1.03] hover:shadow-sm"
      )}
    >
      {isActive && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[2.5px] h-4 rounded-r-full"
          style={{ background: "#14B8A6" }}
        />
      )}
      <Icon
        className={cn("w-[15px] h-[15px] shrink-0 transition-colors", !isActive && "group-hover/nav:text-[#14B8A6]")}
        style={
          isActive
            ? { color: "#14B8A6" }
            : highlight
            ? { color: "rgba(20,184,166,0.55)" }
            : undefined
        }
      />
      <span className={cn(isActive ? "text-sidebar-foreground" : "", !isActive && "group-hover/nav:text-[#14B8A6]")}>{label}</span>
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const displayName: string = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Trader";
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-60 flex flex-col z-40 bg-sidebar border-r border-sidebar-border"
    >
      {/* Logo */}
      <div className="h-14 flex items-center px-5 shrink-0 border-b border-sidebar-border">
        <Link href="/"
          className="font-black text-base tracking-tight leading-none hover:opacity-80 transition-opacity"
          style={{ fontFamily: "var(--font-nunito), system-ui, sans-serif" }}>
          <span className="text-sidebar-foreground">Trading</span>
          <span style={{ background: "linear-gradient(90deg,#14B8A6,#06B6D4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>MC</span>
        </Link>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
        {navGroups.map((group) => (
          <div key={group.label ?? "primary"}>
            {group.label && (
              <p className="font-body text-[9px] font-semibold uppercase tracking-[0.14em] px-3 mb-2 text-sidebar-foreground/30">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href || pathname.startsWith(item.href + "/");
                const highlight = "highlight" in item ? item.highlight : false;
                return (
                  <NavItem
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    icon={item.icon}
                    isActive={isActive}
                    highlight={highlight}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom nav + user */}
      <div className="px-3 pb-3 space-y-0.5 pt-3 shrink-0 border-t border-sidebar-border">
        {bottomItems.map(({ href, label, icon }) => {
          const isActive = pathname === href;
          return (
            <NavItem key={href} href={href} label={label} icon={icon} isActive={isActive} />
          );
        })}

        <div className="pt-2 mt-1 border-t border-sidebar-border">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl group hover:bg-sidebar-accent/60 transition-colors">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
              style={{ background: "rgba(20,184,166,0.15)" }}
            >
              <span className="font-body text-[11px] font-bold" style={{ color: "#14B8A6" }}>
                {initials}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-body text-xs font-medium text-sidebar-foreground/75 truncate">
                {displayName}
              </p>
              <p className="font-body text-[11px] text-sidebar-foreground/35 truncate">
                {user?.email || ""}
              </p>
            </div>
            <button
              onClick={signOut}
              className="transition-all opacity-0 group-hover:opacity-60 hover:!opacity-100 text-sidebar-foreground/50"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
