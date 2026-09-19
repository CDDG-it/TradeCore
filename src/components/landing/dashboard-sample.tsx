"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { eachDayOfInterval, endOfWeek, format, startOfWeek } from "date-fns";
import { DashboardDesk } from "@/components/dashboard/dashboard-desk";
import { ActiveCapitalCard, GoalsCard, HabitsCard, MindScoreOrb, WeekStrip, WinRateCard } from "@/components/dashboard/dashboard-cards";
import { computeMindScore } from "@/lib/mind-score/mind-score";
import { computeGoalProgress } from "@/lib/goals/goals";
import { tradeR } from "@/lib/journal/weeks";
import { PRIMARY_NAV } from "@/lib/nav";
import type { Habit, HabitCompletion, TradeJournalEntry, TradingGoal } from "@/lib/types";

const sampleNow = new Date("2026-09-17T12:00:00");
const stamp = "2026-09-17T12:00:00";
const discipline = {
  followed_plan: true, traded_in_session: true, respected_risk: true,
  respected_max_trades: true, matched_a_plus: true, no_impulsive_entry: true,
  no_revenge_trade: true, respected_stop_loss: true, journal_completed: true,
  score: 89, notes: "Waited for the planned level.",
};

function sampleTrade(id: string, day: string, result: TradeJournalEntry["result"], rr: number, quality: "good" | "bad"): TradeJournalEntry {
  return {
    id, user_id: "sample", date_time: day, instrument: "ES", market: "futures", session: "New York",
    timeframe: "15m", direction: "long", confluences: ["Planned level"], rr, result,
    screenshot_groups: [], execution_notes: "Sample journal entry", psychology_notes: "", mistakes: "", lessons: "",
    execution_quality: quality, discipline: { ...discipline, score: quality === "good" ? 89 : 61 },
    created_at: stamp, updated_at: stamp,
  };
}

const trades = [
  sampleTrade("sample-mon", "2026-09-14", "win", 1.8, "good"),
  sampleTrade("sample-tue", "2026-09-15", "loss", 1, "bad"),
  sampleTrade("sample-wed", "2026-09-16", "win", 2.3, "good"),
  sampleTrade("sample-thu", "2026-09-17", "win", 1.4, "good"),
];
const habits: Habit[] = [
  { id: "plan", user_id: "sample", name: "Write the session plan", category: "routine", frequency: "weekdays", target_days: 5, color: "#14b8a6", icon: "", created_at: "2026-09-01T12:00:00", updated_at: stamp },
  { id: "review", user_id: "sample", name: "Review the last trade", category: "review", frequency: "weekdays", target_days: 5, color: "#06b6d4", icon: "", created_at: "2026-09-01T12:00:00", updated_at: stamp },
  { id: "pause", user_id: "sample", name: "Pause after a loss", category: "mindset", frequency: "weekdays", target_days: 5, color: "#14b8a6", icon: "", created_at: "2026-09-01T12:00:00", updated_at: stamp },
];
const completions: HabitCompletion[] = [
  ...["14", "15", "16", "17"].map((day) => ({ id: `plan-${day}`, habit_id: "plan", date: `2026-09-${day}`, completed: true })),
  ...["14", "16", "17"].map((day) => ({ id: `review-${day}`, habit_id: "review", date: `2026-09-${day}`, completed: true })),
  ...["15", "17"].map((day) => ({ id: `pause-${day}`, habit_id: "pause", date: `2026-09-${day}`, completed: true })),
];
const goals: TradingGoal[] = [{
  id: "sample-goal", user_id: "sample", title: "Follow the entry plan", metric: "execution_rate",
  baseline: 50, target: 85, start_date: "2026-09-01", end_date: "2026-09-30",
  created_at: stamp, updated_at: stamp,
}];
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
   it explains (percentages of the screen) while its caption reads below the laptop. */
const callouts = [
  { title: "MC Mindscore 74", body: "one explainable score from five parts of your process.", ring: { left: "65%", top: "13.5%", width: "34%", height: "29.5%" } },
  { title: "This week +4.5R", body: "three of four trades followed the written plan.", ring: { left: "0.5%", top: "49.5%", width: "65%", height: "48.5%" } },
  { title: "Habits 3/3", body: "plan written, last trade reviewed, pause kept.", ring: { left: "1%", top: "31%", width: "32%", height: "19%" } },
] as const;

function calloutStyle(index: number, extra: CSSProperties = {}) {
  return { ...extra, "--callout-index": index } as CSSProperties & Record<"--callout-index", number>;
}

export function LaptopDashboard() {
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
    <figure className="marketing-laptop mx-auto w-full min-w-0 max-w-[900px]" aria-label="The TradingMC dashboard layout with local illustrative data">
      <div className="rounded-t-[20px] border-[8px] border-[#263646] bg-[#263646] shadow-[0_36px_100px_rgba(0,0,0,.6)] sm:border-[10px]">
        <div ref={screenRef} className="marketing-laptop-screen marketing-dashboard relative aspect-[980/650] overflow-hidden rounded-t-[10px] bg-[#0b1120]">
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
              capital={<><ActiveCapitalCard capital={52840} count={2} hidden={false} onToggle={() => {}} compactNumbers /><HabitsCard habits={habits} doneToday={new Set(["plan", "review", "pause"])} pendingHabit={null} onToggle={() => {}} className="min-h-0 flex-1" /></>}
              winRate={<WinRateCard winRate={75} wins={3} losses={1} be={0} total={4} netR={4.5} goodExec={3} badExec={1} period="week" onPeriodChange={() => {}} compactNumbers className="h-full" />}
              journal={<WeekStrip days={weekDays} compactNumbers />}
              mindScore={<MindScoreOrb score={mindScore} period="week" onPeriodChange={() => {}} compactNumbers className="shrink-0" />}
              goals={<GoalsCard goals={goals} progress={goalProgress} compactNumbers className="min-h-0 flex-1" />}
              news={<div className="rounded-2xl border border-white/10 bg-[#131b2e] p-4 text-[11px] text-white"><p className="font-semibold uppercase tracking-wider text-[#8198a7]">This week&apos;s news</p><p className="mt-3 font-semibold">US macro releases</p><p className="mt-1 text-[#9eb1bd]">Check the calendar before the open.</p></div>}
            />
          </div>
        </div>
        {callouts.map((callout, index) => (
          <span key={callout.title} aria-hidden="true" className="marketing-callout pointer-events-none absolute rounded-[14px] border-2 border-[#14b8a6] shadow-[0_0_0_5px_rgba(20,184,166,.16),inset_0_0_0_1px_rgba(20,184,166,.25)]" style={calloutStyle(index, callout.ring)} />
        ))}
        </div>
      </div>
      <div className="relative mx-auto h-3 w-[108%] -translate-x-[4%] rounded-b-[50%] bg-gradient-to-b from-[#758391] via-[#3a4652] to-[#19232f] shadow-[0_25px_42px_rgba(0,0,0,.4)]" />
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
