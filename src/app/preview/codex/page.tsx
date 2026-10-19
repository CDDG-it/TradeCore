"use client";

import { useState } from "react";
import { PostMarketDayPicker } from "@/components/trade-therapist/post-market-day-picker";
import { ExerciseIcon } from "@/components/trade-therapist/exercise-icons";
import { WinRateCard } from "@/components/dashboard/dashboard-cards";
import { PRE_MARKET_EXERCISES } from "@/lib/pre-market/exercises";
import type { TradeJournalEntry } from "@/lib/types";
import type { BestTradeListRow } from "@/lib/supabase/queries";

const trade = (result: "win" | "loss" | "breakeven", rr = 1.5) => ({ result, rr } as TradeJournalEntry);
const tradesByDay: Record<string, TradeJournalEntry[]> = {
  "2026-10-02": [trade("win")],
  "2026-10-05": [trade("win", 2.1)],
  "2026-10-06": [trade("loss")],
  "2026-10-08": [trade("win"), trade("loss")],
  "2026-10-09": [trade("win")],
  "2026-10-12": [trade("loss")],
  "2026-10-14": [trade("loss")],
  "2026-10-15": [trade("breakeven")],
  "2026-10-16": [trade("win")],
};
const reviewed = { review_step: "complete", taken_was_best: true, notes: "", post_market_analysis: "" } as BestTradeListRow;
const reviews: Record<string, BestTradeListRow> = { "2026-10-06": reviewed, "2026-10-08": reviewed, "2026-10-14": reviewed, "2026-10-16": reviewed };

export default function CodexPreviewPage() {
  const [date, setDate] = useState("2026-10-19");
  const [period, setPeriod] = useState<"week" | "month">("month");
  return <main className="min-h-screen bg-background px-6 py-10 text-foreground">
    <div className="mx-auto max-w-6xl space-y-8">
      <h1 className="font-heading text-2xl font-bold">TradingMC design preview</h1>
      <section className="rounded-2xl border border-border/60 bg-card/60 p-6">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-primary">01 · Post Market</p>
        <div className="flex items-center justify-between gap-4">
          <div><p className="text-[10px] font-semibold uppercase tracking-wider text-primary">Post Market · Not reviewed</p><h2 className="mt-1 font-heading text-2xl font-bold">Monday 19 October 2026</h2></div>
          <PostMarketDayPicker date={date} tradesByDay={tradesByDay} reviews={reviews} onSelect={async (next) => { setDate(next); return true; }} />
        </div>
      </section>
      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-2xl border border-border/60 bg-card/60 p-6">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-primary">02 · Exercise icons</p>
          <div className="grid grid-cols-2 gap-2">
            {PRE_MARKET_EXERCISES.map((exercise) => <div key={exercise.id} className="flex items-center gap-3 rounded-xl border border-border/70 bg-card p-3"><span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><ExerciseIcon id={exercise.id} size={21} /></span><span className="text-sm font-semibold">{exercise.title}</span></div>)}
          </div>
        </section>
        <section>
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-primary">03 · Win rate</p>
          <div className="h-[360px]"><WinRateCard winRate={38} wins={3} losses={5} be={2} total={10} netR={-0.4} goodExec={6} badExec={4} period={period} onPeriodChange={setPeriod} className="h-full" /></div>
        </section>
      </div>
    </div>
  </main>;
}
