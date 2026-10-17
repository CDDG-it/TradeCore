"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";

/** Fullscreen startup welcome, shown once per signed-in browser tab. */
export function DashboardWelcome({ firstName, preview = false }: { firstName: string | null; preview?: boolean }) {
  const [visible, setVisible] = useState(preview);
  const started = useRef(false);

  useEffect(() => {
    if (preview) {
      setVisible(true);
      return;
    }
    if (started.current) return;
    started.current = true;
    const key = "tradecore:dashboard-welcome-seen";
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // If storage is unavailable, still show the welcome once for this mount.
    }

    setVisible(true);
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 650 : 1600;
    const timeout = window.setTimeout(() => setVisible(false), duration);
    return () => window.clearTimeout(timeout);
  }, [preview]);

  if (!visible) return null;

  return (
    <div className={`dashboard-welcome fixed inset-0 z-[100] flex items-center justify-center bg-background px-6 ${preview ? "dashboard-welcome-preview" : ""}`} role="status" aria-live="polite">
      <div className="dashboard-welcome-content flex flex-col items-center text-center">
        <div className="dashboard-welcome-mark mb-9 flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-card shadow-[0_0_52px_color-mix(in_oklch,var(--primary)_12%,transparent)]">
          <Image src="/tradingmc-logo.png" alt="" width={979} height={500} priority className="h-7 w-auto" />
        </div>
        <p className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[.28em] text-ice">TradingMC · Secure workspace</p>
        <h1 className="font-heading text-3xl font-semibold tracking-[-.045em] text-foreground sm:text-5xl">
          Welcome back{firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="mt-4 text-xs tracking-wide text-muted-foreground">Preparing your trading desk</p>
        <div className="dashboard-welcome-track mt-9 h-px w-48 overflow-hidden bg-border sm:w-64" aria-hidden="true">
          <div className="dashboard-welcome-progress h-full w-full origin-left bg-primary" />
        </div>
        <span className="mt-3 font-mono text-[9px] uppercase tracking-[.2em] text-muted-foreground">Workspace ready</span>
      </div>
    </div>
  );
}

/** Wait for the existing session bootstrap so the intro uses the signed-in name. */
export function AppWelcome() {
  const { user, isLoading } = useAuth();
  if (isLoading || !user) return null;
  const name = user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "";
  return <DashboardWelcome firstName={name.trim().split(/\s+/)[0] || null} />;
}
