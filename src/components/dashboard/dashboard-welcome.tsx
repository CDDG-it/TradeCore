"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

/** Fullscreen startup welcome, shown on each entry into the signed-in app. */
export function DashboardWelcome({ firstName, exiting = false }: { firstName: string | null; exiting?: boolean }) {
  return (
    <div className={`dashboard-welcome fixed inset-0 z-[100] flex items-center justify-center overflow-hidden px-6 ${exiting ? "dashboard-welcome-exiting" : ""}`} role="status" aria-live="polite">
      <div className="dashboard-welcome-scene" aria-hidden="true">
        <span className="dashboard-welcome-glow dashboard-welcome-glow-one animate-drift-a" />
        <span className="dashboard-welcome-glow dashboard-welcome-glow-two animate-drift-b" />
        <span className="dashboard-welcome-glow dashboard-welcome-glow-three animate-drift-c" />
      </div>
      <div className="dashboard-welcome-content relative z-10 flex w-full max-w-[1100px] flex-col items-center text-center">
        <div className="dashboard-welcome-mark mb-9 sm:mb-12">
          <Image src="/tradingmc-logo.png" alt="" width={979} height={500} priority className="h-14 w-auto sm:h-20" />
        </div>
        <h1 className="font-heading text-[clamp(3.5rem,8.5vw,8.25rem)] font-semibold leading-[.9] tracking-[-.065em] text-[#f8fafc]">
          <span className="block">Welcome back{firstName ? "," : ""}</span>
          {firstName && <span className="dashboard-welcome-name mt-2 block sm:mt-3">{firstName}</span>}
        </h1>
        <div className="dashboard-welcome-loader mt-12 sm:mt-16" aria-hidden="true">
          <span className="dashboard-welcome-loader-segment" />
          <span className="dashboard-welcome-loader-segment" />
          <span className="dashboard-welcome-loader-segment" />
          <span className="dashboard-welcome-loader-segment" />
        </div>
      </div>
    </div>
  );
}

export function AppWelcome({ firstName, children }: { firstName: string | null; children: React.ReactNode }) {
  const [phase, setPhase] = useState<"welcome" | "exit" | "app">("welcome");

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hold = window.setTimeout(() => setPhase("exit"), reduceMotion ? 550 : 1350);
    const reveal = window.setTimeout(() => setPhase("app"), reduceMotion ? 730 : 1610);
    return () => {
      window.clearTimeout(hold);
      window.clearTimeout(reveal);
    };
  }, []);

  if (phase === "app") return children;

  // Only one screen is mounted at a time. The dashboard appears after the intro exits.
  return (
    <div className="min-h-screen bg-[#0b1120]">
      <DashboardWelcome firstName={firstName} exiting={phase === "exit"} />
    </div>
  );
}
