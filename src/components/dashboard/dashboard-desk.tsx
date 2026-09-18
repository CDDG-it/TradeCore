import type { ReactNode } from "react";

/** The same desk arrangement is used by the signed-in dashboard and the public sample. */
export function DashboardDesk({ capital, winRate, journal, mindScore, goals, news, preview = false }: {
  capital: ReactNode;
  winRate: ReactNode;
  journal: ReactNode;
  mindScore: ReactNode;
  goals: ReactNode;
  news: ReactNode;
  preview?: boolean;
}) {
  return (
    <div className={`grid min-h-0 flex-1 gap-3 ${preview ? "grid-cols-3 grid-rows-[minmax(0,1fr)_minmax(0,1.35fr)]" : "grid-cols-2 md:grid-cols-3 md:grid-rows-[minmax(0,1fr)_minmax(0,1.35fr)]"}`}>
      <div className={`flex min-h-0 flex-col gap-3 ${preview ? "col-start-1 row-start-1" : "md:col-start-1 md:row-start-1"}`}>{capital}</div>
      <div className={`min-h-0 ${preview ? "col-start-2 row-start-1" : "md:col-start-2 md:row-start-1"}`}>{winRate}</div>
      <div className={`col-span-2 min-h-0 ${preview ? "col-start-1 row-start-2" : "md:col-start-1 md:row-start-2"}`}>{journal}</div>
      <div className={`flex min-h-0 flex-col gap-3 ${preview ? "col-start-3 row-span-2 row-start-1" : "col-span-2 md:col-span-1 md:col-start-3 md:row-span-2 md:row-start-1"}`}>
        {mindScore}{goals}{news}
      </div>
    </div>
  );
}
