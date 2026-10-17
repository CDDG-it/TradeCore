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
    <div className={`dashboard-welcome fixed inset-0 z-[100] flex items-center justify-center overflow-hidden px-6 ${exiting ? "dashboard-welcome-exiting" : ""}`} role="status" aria-live="polite">
      <div className="dashboard-welcome-scene" aria-hidden="true">
        <span className="dashboard-welcome-glow dashboard-welcome-glow-one animate-drift-a" />
        <span className="dashboard-welcome-glow dashboard-welcome-glow-two animate-drift-b" />
        <span className="dashboard-welcome-glow dashboard-welcome-glow-three animate-drift-c" />
        <span className="dashboard-welcome-grid" />
      </div>
      <div className="dashboard-welcome-content relative z-10 flex w-full max-w-[1100px] flex-col items-center text-center">
        <div className="dashboard-welcome-mark mb-9 sm:mb-12">
          <Image src="/tradingmc-logo.png" alt="" width={979} height={500} priority className="h-14 w-auto sm:h-20" />
        </div>
        <h1 className="font-heading text-[clamp(3.5rem,8.5vw,8.25rem)] font-semibold leading-[.9] tracking-[-.065em] text-[#f8fafc]">
          <span className="block">Welcome back{firstName ? "," : ""}</span>
          {firstName && <span className="dashboard-welcome-name mt-2 block sm:mt-3">{firstName}</span>}
        </h1>
        <div className="dashboard-welcome-track mt-12 h-px w-48 overflow-hidden bg-white/15 sm:mt-16 sm:w-80" aria-hidden="true">
          <div className="dashboard-welcome-progress h-full w-full origin-left bg-primary" />
        </div>
      </div>
    </div>
  );
}

export function AppWelcome({ firstName }: { firstName: string | null }) {
  return <DashboardWelcome firstName={firstName} />;
}
