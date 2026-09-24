"use client";

import { useState } from "react";
import { OverviewTab } from "./overview-tab";
import { NewsTab } from "./news-tab";
import { CalendarTab } from "./calendar-tab";

type BriefingView = "desk" | "news" | "calendar";

const VIEWS: { key: BriefingView; label: string; note: string }[] = [
  { key: "desk", label: "Daily desk", note: "wire, latest prints and the week ahead" },
  { key: "news", label: "Full news", note: "search and filter the complete feed" },
  { key: "calendar", label: "Calendar", note: "monthly releases, Fed dates and closures" },
];

export function BriefingTab() {
  const [view, setView] = useState<BriefingView>("desk");
  const active = VIEWS.find((item) => item.key === view) ?? VIEWS[0];
  return (
    <div className="flex min-h-full flex-col gap-2 lg:h-full lg:min-h-0">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 rounded-2xl border border-border/50 bg-card/45 p-1.5 pl-3">
        <p className="hidden text-[11px] font-semibold uppercase tracking-[.14em] text-foreground/55 md:block">{active.note}</p>
        <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-xl bg-background/35 p-1" role="group" aria-label="Briefing view">
          {VIEWS.map((item) => <button key={item.key} type="button" aria-pressed={view === item.key} onClick={() => setView(item.key)} className={`press shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-semibold ${view === item.key ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground/60 hover:text-foreground"}`}>{item.label}</button>)}
        </div>
      </div>
      <div className="min-h-0 flex-1">{view === "desk" ? <OverviewTab /> : view === "news" ? <NewsTab /> : <CalendarTab />}</div>
    </div>
  );
}
