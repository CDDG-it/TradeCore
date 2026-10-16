import type { ReactNode } from "react";

/**
 * The same desk arrangement is used by the signed-in dashboard and the public sample.
 *
 * Three columns on a fixed screen: the readiness pair (mind score over active
 * capital) top-left, win rate top-centre and the week's journal beneath them
 * across two columns; the right column is the day's to-do, habits then goals,
 * with the week ahead anchored at the bottom. On phones it is one column in
 * reading order: how ready, what is at stake, how it went, what to do.
 */
export function DashboardDesk({ mindScore, capital, winRate, journal, habits, goals, news, preview = false }: {
  mindScore: ReactNode;
  capital: ReactNode;
  winRate: ReactNode;
  journal: ReactNode;
  habits: ReactNode;
  goals: ReactNode;
  news: ReactNode;
  preview?: boolean;
}) {
  // `preview` is the landing page's laptop frame: always the desktop grid,
  // whatever the visitor's own screen width is. Classes are written out in
  // full so Tailwind can see them.
  const at = (desk: string, site: string) => (preview ? desk : site);
  return (
    <div className={`grid min-h-0 flex-1 gap-3 short:gap-2 ${at("grid-cols-3 grid-rows-[minmax(0,1fr)_minmax(0,1.2fr)]", "md:grid-cols-3 md:grid-rows-[minmax(0,1fr)_minmax(0,1.2fr)]")}`}>
      <div className={`flex min-h-0 flex-col gap-3 short:gap-2 ${at("col-start-1 row-start-1", "md:col-start-1 md:row-start-1")}`}>
        {mindScore}{capital}
      </div>
      <div className={`min-h-0 ${at("col-start-2 row-start-1", "md:col-start-2 md:row-start-1")}`}>{winRate}</div>
      <div className={`min-h-0 ${at("col-span-2 col-start-1 row-start-2", "md:col-span-2 md:col-start-1 md:row-start-2")}`}>{journal}</div>
      <div className={`flex min-h-0 flex-col gap-3 short:gap-2 ${at("col-start-3 row-span-2 row-start-1", "md:col-start-3 md:row-span-2 md:row-start-1")}`}>
        {habits}{goals}{news}
      </div>
    </div>
  );
}
