"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { eachDayOfInterval, endOfWeek, format, startOfWeek } from "date-fns";
import { DashboardDesk } from "@/components/dashboard/dashboard-desk";
import { ActiveCapitalCard, GoalsCard, HabitsCard, MindScoreOrb, WeekStrip, WinRateCard } from "@/components/dashboard/dashboard-cards";
import { computeMindScore } from "@/lib/mind-score/mind-score";
import { computeGoalProgress } from "@/lib/goals/goals";
import { tradeR } from "@/lib/journal/weeks";
import { PRIMARY_NAV } from "@/lib/nav";
import { sampleDashboardData } from "@/lib/dashboard/sample";

const sampleNow = new Date("2026-09-17T12:00:00");
const { trades, habits, completions, goals } = sampleDashboardData(sampleNow);
const mindScore = computeMindScore({
  now: sampleNow, trades, habits, completions, goals,
  psychSessions: [], bestTrades: [], weeklyReviews: [], analyses: [], adherenceLogs: [],
}, "week");
const goalProgress = goals.map((goal) => ({ goal, p: computeGoalProgress(goal, { trades, habits, completions, now: sampleNow }) }));
const weekDays = eachDayOfInterval({ start: startOfWeek(sampleNow, { weekStartsOn: 1 }), end: endOfWeek(sampleNow, { weekStartsOn: 1 }) }).map((date) => {
  const dayTrades = trades.filter((trade) => trade.date_time === format(date, "yyyy-MM-dd"));
  return { date, trades: dayTrades, r: dayTrades.reduce((sum, trade) => sum + tradeR(trade), 0) };
});

/* What the visitor should notice, in reading order. Each callout rings the card
   it explains while its caption reads below the frame. */
const callouts = [
  { title: "MC Mindscore 74", body: "one explainable score from five parts of your process." },
  { title: "This week +4.5R", body: "three of four trades followed the written plan." },
  { title: "Habits 3/3", body: "plan written, last trade reviewed, pause kept." },
] as const;

function calloutStyle(index: number) {
  return { "--callout-index": index } as CSSProperties & Record<"--callout-index", number>;
}

/** Wraps a desk card so its ring is drawn on the card's own box: it fits at every size. */
function Ringed({ index, className, children }: { index: number; className?: string; children: ReactNode }) {
  return (
    <div className={`relative ${className ?? ""}`}>
      {children}
      <span aria-hidden="true" className="marketing-callout pointer-events-none absolute inset-0 rounded-2xl border-2 border-[#14b8a6] shadow-[0_0_0_5px_rgba(20,184,166,.16),inset_0_0_0_1px_rgba(20,184,166,.25)]" style={calloutStyle(index)} />
    </div>
  );
}

export function DashboardScreenshot() {
  const screenRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number | null>(null);

  useEffect(() => {
    const screen = screenRef.current;
    if (!screen) return;
    const measure = () => setScale(screen.clientWidth / 980);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(screen);
    return () => observer.disconnect();
  }, []);

  return (
    <figure className="marketing-screen mx-auto w-full min-w-0 max-w-[1020px]" aria-label="The TradingMC dashboard layout with local illustrative data">
      <div className="marketing-screen-frame rounded-[22px] border border-white/10 bg-[#0b1120] p-1.5 sm:rounded-[26px] sm:p-2">
        <div ref={screenRef} className="marketing-dashboard relative aspect-[980/650] overflow-hidden rounded-[16px] bg-[#0b1120] sm:rounded-[18px]">
        <div inert className="marketing-dashboard-inner absolute left-0 top-0 h-[650px] w-[980px] overflow-hidden" style={{ transform: `scale(${scale ?? 1})`, transformOrigin: "top left", visibility: scale === null ? "hidden" : "visible" }}>
          <div className="flex h-12 items-center justify-between border-b border-white/10 bg-[#0b1120] px-4">
            {/* Match the icon used by the authenticated top navigation. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/tradingmc-app-dark.svg" alt="" width={28} height={28} className="h-7 w-7" />
            <div className="flex gap-1">{PRIMARY_NAV.map((item) => <span key={item.href} className={`rounded-md px-2 py-1 text-[10px] font-semibold ${item.href === "/dashboard" ? "bg-[#1d4c52] text-white" : "text-[#7b91a0]"}`}>{item.label}</span>)}</div>
            <span className="grid h-6 w-6 place-items-center rounded-full bg-[#173b43] text-[9px] font-semibold text-white">AL</span>
          </div>
          <div className="marketing-dashboard-stage flex h-[calc(100%-3rem)] flex-col p-3">
            <p className="mb-3 text-base font-bold text-white">Good morning, Alex</p>
            <DashboardDesk
              preview
              capital={<><ActiveCapitalCard capital={52840} count={2} hidden={false} onToggle={() => {}} compactNumbers /><Ringed index={2} className="min-h-0 flex-1"><HabitsCard habits={habits} doneToday={new Set(["plan", "review", "pause"])} pendingHabit={null} onToggle={() => {}} className="h-full" /></Ringed></>}
              winRate={<WinRateCard winRate={75} wins={3} losses={1} be={0} total={4} netR={4.5} goodExec={3} badExec={1} period="week" onPeriodChange={() => {}} compactNumbers className="h-full" />}
              journal={<Ringed index={1} className="h-full"><WeekStrip days={weekDays} compactNumbers /></Ringed>}
              mindScore={<Ringed index={0} className="shrink-0"><MindScoreOrb score={mindScore} period="week" onPeriodChange={() => {}} compactNumbers /></Ringed>}
              goals={<GoalsCard goals={goals} progress={goalProgress} compactNumbers className="min-h-0 flex-1" />}
              news={<div className="rounded-2xl border border-white/10 bg-[#131b2e] p-4 text-[11px] text-white"><p className="font-semibold uppercase tracking-wider text-[#8198a7]">This week&apos;s news</p><p className="mt-3 font-semibold">US macro releases</p><p className="mt-1 text-[#9eb1bd]">Check the calendar before the open.</p></div>}
            />
          </div>
        </div>
        </div>
      </div>
      <figcaption className="relative mx-auto mt-7 h-12 max-w-[560px] text-center text-sm leading-relaxed text-[#b8ccd0] sm:h-6">
        {callouts.map((callout, index) => (
          <span key={callout.title} className="marketing-callout absolute inset-x-0 top-0 flex items-start justify-center gap-2.5" style={calloutStyle(index)}>
            <span aria-hidden="true" className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#14b8a6]" />
            <span><span className="font-semibold text-white">{callout.title}</span> <span aria-hidden="true">·</span> {callout.body}</span>
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
