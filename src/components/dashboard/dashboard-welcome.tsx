"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

/** Fullscreen startup welcome, shown on each entry into the signed-in app. */
export function DashboardWelcome({ firstName, preview = false }: { firstName: string | null; preview?: boolean }) {
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (preview) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hold = window.setTimeout(() => setExiting(true), reduceMotion ? 550 : 1350);
    const remove = window.setTimeout(() => setVisible(false), reduceMotion ? 730 : 1610);
    return () => {
      window.clearTimeout(hold);
      window.clearTimeout(remove);
    };
  }, [preview]);

  if (!visible) return null;

  return (
    <div className={`dashboard-welcome fixed inset-0 z-[100] flex items-center justify-center bg-background px-6 ${exiting ? "dashboard-welcome-exiting" : ""}`} role="status" aria-live="polite">
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

export function AppWelcome({ firstName }: { firstName: string | null }) {
  return <DashboardWelcome firstName={firstName} />;
}
