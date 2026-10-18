"use client";

import { useMemo, useState } from "react";
import { getWeekGroup } from "@/lib/journal/weeks";
import { buildDayRecaps } from "@/lib/reviews/day-recap";
import { WeeklyDayTimeline } from "@/components/trade-therapist/weekly-day-timeline";
import type { TradeJournalEntry } from "@/lib/types";
import type { BestTradeListRow } from "@/lib/supabase/queries";

const weekStart = "2026-10-12";
const timestamp = "2026-10-18T12:00:00";

function trade(id: string, date: string, result: TradeJournalEntry["result"], rr: number, direction: TradeJournalEntry["direction"], execution_quality: "good" | "bad", mistakes: string, lessons: string): TradeJournalEntry {
  return {
    id, user_id: "preview", date_time: date, instrument: "NQ", market: "futures", session: "New York",
    timeframe: "5m", direction, confluences: ["Liquidity sweep", "Fair value gap"], rr, result,
    screenshot_groups: [], execution_notes: "", psychology_notes: "", mistakes, lessons,
    execution_time: "15:42", execution_quality, created_at: timestamp, updated_at: timestamp,
  };
}

const trades: TradeJournalEntry[] = [
  trade("sample-tue", "2026-10-13", "loss", 1, "long", "bad", "Entered before confirmation and moved the stop.", "Wait for the planned confirmation before entering."),
  trade("sample-wed", "2026-10-14", "loss", 1, "short", "bad", "Took a second setup outside the plan.", "One planned setup is enough. Skip the next impulse."),
  trade("sample-thu", "2026-10-15", "break-even", 0, "long", "good", "", "Protected risk and followed the exit plan."),
];

function best(date: string, taken_was_best: boolean, notes: string, post_market_analysis: string): BestTradeListRow {
  return {
    id: `sample-${date}`, user_id: "preview", date, taken_was_best, notes, post_market_analysis,
    review_step: "complete", created_at: timestamp, updated_at: timestamp,
  };
}

const bestByDay: Record<string, BestTradeListRow> = {
  "2026-10-12": best("2026-10-12", true, "No valid setup appeared. Staying out protected the plan.", ""),
  "2026-10-13": best("2026-10-13", false, "A later short setup met every entry rule and reached target.", "The first move failed; the cleaner setup arrived after the sweep."),
  "2026-10-14": best("2026-10-14", false, "The planned long after the NY open was the better opportunity.", "The extra short was outside the plan."),
  "2026-10-15": best("2026-10-15", true, "This was the planned trade. Break-even was a valid outcome.", ""),
  "2026-10-16": best("2026-10-16", true, "No trade met the entry criteria.", ""),
};

export function PreviewWeeklyReview() {
  const { group, recaps } = useMemo(() => {
    const group = getWeekGroup(trades, weekStart);
    return { group, recaps: buildDayRecaps(group.days, new Map(trades.map((item) => [item.id, item])), bestByDay) };
  }, []);
  const [showPrevious, setShowPrevious] = useState(false);

  return (
    <main className="min-h-screen bg-background px-3 py-5 text-foreground sm:px-6 sm:py-7">
      <div className="mx-auto max-w-[1200px] space-y-4">
        <div className="rounded-xl border border-primary/25 bg-primary/10 px-4 py-2.5 text-xs text-primary">
          Local preview · Example trades only. Nothing here is saved or published.
        </div>
        <div>
          <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-widest text-primary">Week {group.weekNum} · {group.year}</span>
          <h1 className="mt-2 font-heading text-xl font-black tracking-tight">Weekly review</h1>
          <p className="text-sm text-muted-foreground">{group.rangeLabel}</p>
        </div>
        <WeeklyDayTimeline days={group.days} recaps={recaps} bestByDay={bestByDay} execRate={group.execRate} goodExec={group.goodExec} badExec={group.badExec} totalR={group.totalR} />
        <section className="weekly-day-card weekly-day-card--quiet rounded-2xl p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">Your reflection</h2>
            <button type="button" onClick={() => setShowPrevious(!showPrevious)} className="rounded-lg px-2 py-1 text-xs text-muted-foreground hover:bg-muted/40">Last week&apos;s notes {showPrevious ? "⌃" : "⌄"}</button>
          </div>
          {showPrevious && <p className="mt-3 rounded-xl border border-border/50 bg-background/40 p-3 text-xs text-muted-foreground">Focus set: Wait for confirmation before the first entry.</p>}
          <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
            {[
              { label: "The problem", placeholder: "The one mistake to fix...", tone: "bg-destructive" },
              { label: "What worked", placeholder: "One thing done well...", tone: "bg-success" },
              { label: "Focus next week", placeholder: "One rule to hold...", tone: "bg-primary" },
            ].map((field) => <label key={field.label} className="rounded-xl border border-border/50 bg-background/40 p-2.5 focus-within:border-primary/40">
              <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground"><span className={`size-1.5 rounded-full ${field.tone}`} />{field.label}</span>
              <textarea rows={3} placeholder={field.placeholder} className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground/40" />
            </label>)}
          </div>
          <div className="mt-3 flex justify-end"><button type="button" disabled className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white opacity-40">Complete review</button></div>
        </section>
      </div>
    </main>
  );
}
