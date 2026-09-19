"use client";

import { useMemo, useState } from "react";
import { addDays, format, startOfWeek, subWeeks } from "date-fns";
import { cn } from "@/lib/utils";
import { ReviewsPanel } from "@/components/trade-therapist/reviews-panel";
import { CommitmentsPanel } from "@/components/trade-therapist/commitments-panel";
import { GoalsView } from "@/components/goals/goals-view";
import { sampleDashboardData } from "@/lib/dashboard/sample";
import type { Commitment, CommitmentAdherenceLog, TradeJournalEntry, TradingGoal, WeeklyTradeReview } from "@/lib/types";

type Tab = "reviews" | "commitments" | "goals";

/** Twelve weeks of sample history: a trade a week, most weeks reviewed. */
function useSeed() {
  return useMemo(() => {
    const now = new Date();
    const base = sampleDashboardData(now);
    const monday = startOfWeek(now, { weekStartsOn: 1 });
    const stamp = (d: Date) => format(d, "yyyy-MM-dd") + "T12:00:00";

    const trades: TradeJournalEntry[] = [...base.trades];
    const reviews: WeeklyTradeReview[] = [];
    const reviewed = [1, 2, 3, 5, 6, 7, 8, 10, 11]; // week 4 and 9 missed, week 0 open
    for (let i = 1; i <= 11; i++) {
      const wk = subWeeks(monday, i);
      const ws = format(wk, "yyyy-MM-dd");
      const t = base.trades[i % base.trades.length];
      trades.push({ ...t, id: `hist-${i}`, date_time: format(addDays(wk, 2), "yyyy-MM-dd"), created_at: stamp(wk), updated_at: stamp(wk) });
      if (reviewed.includes(i)) {
        reviews.push({
          id: `rev-${i}`, user_id: "sample", week_start: ws,
          mistakes: i % 3 === 0 ? "Sized up after the first loss on Tuesday." : "",
          lessons: "The planned level held every time I waited for it.",
          prevention_plan: i % 2 ? "No entry in the first fifteen minutes after a loss." : "",
          best_trade_days: {}, created_at: stamp(wk), updated_at: stamp(wk),
        });
      }
    }

    const commitments: Commitment[] = [
      { id: "c1", user_id: "sample", trade_id: null, pattern_type: "revenge", trigger_text: "I take a full stop-out", action_text: "I step away for fifteen minutes", active: true, created_at: stamp(subWeeks(monday, 6)), updated_at: stamp(monday) },
      { id: "c2", user_id: "sample", trade_id: null, pattern_type: "size-escalation", trigger_text: "I am down two in a row", action_text: "the next trade is half size or nothing", active: true, created_at: stamp(subWeeks(monday, 4)), updated_at: stamp(monday) },
      { id: "c3", user_id: "sample", trade_id: null, pattern_type: null, trigger_text: "the plan says no trade before the print", action_text: "the chart stays closed until the print", active: true, created_at: stamp(subWeeks(monday, 2)), updated_at: stamp(monday) },
    ];
    const logs: CommitmentAdherenceLog[] = [
      ...[5, 4, 3, 2].map((w, i) => ({ id: `l1-${i}`, user_id: "sample", commitment_id: "c1", trade_id: `hist-${w}`, date: format(subWeeks(monday, w), "yyyy-MM-dd"), matched: true, followed: i !== 1, created_at: stamp(monday) })),
      { id: "l1-open", user_id: "sample", commitment_id: "c1", trade_id: base.trades[1].id, date: base.trades[1].date_time, matched: true, followed: null, created_at: stamp(monday) },
      ...[3, 2, 1].map((w, i) => ({ id: `l2-${i}`, user_id: "sample", commitment_id: "c2", trade_id: `hist-${w}`, date: format(subWeeks(monday, w), "yyyy-MM-dd"), matched: true, followed: i === 0, created_at: stamp(monday) })),
      { id: "l2-open", user_id: "sample", commitment_id: "c2", trade_id: base.trades[3].id, date: base.trades[3].date_time, matched: true, followed: null, created_at: stamp(monday) },
    ];

    const goals: TradingGoal[] = [
      ...base.goals,
      { id: "g2", user_id: "sample", title: "Fifteen clean days", metric: "clean_days", target: 15, baseline: null, start_date: format(addDays(monday, -14), "yyyy-MM-dd"), end_date: format(addDays(monday, 16), "yyyy-MM-dd"), created_at: stamp(monday), updated_at: stamp(monday) },
      { id: "g3", user_id: "sample", title: "", metric: "net_r", target: 10, baseline: null, start_date: format(addDays(monday, -28), "yyyy-MM-dd"), end_date: format(addDays(monday, -1), "yyyy-MM-dd"), created_at: stamp(monday), updated_at: stamp(monday) },
    ];

    return {
      reviews: { trades, reviews },
      commitments: { commitments, logs, trades, analyses: [] },
      goals: { goals, data: { trades, habits: base.habits, completions: base.completions } },
    };
  }, []);
}

export function PreviewEdge() {
  const [tab, setTab] = useState<Tab>("reviews");
  const seed = useSeed();
  return (
    <div className="flex flex-col gap-4 lg:h-[calc(100dvh-7.5rem)] lg:overflow-hidden">
      <div className="flex shrink-0 items-center justify-between gap-4">
        <h1 className="font-heading text-lg font-bold tracking-tight md:text-xl">Preview: edge surfaces</h1>
        <div className="flex gap-1 rounded-xl border border-border/50 p-1">
          {(["reviews", "commitments", "goals"] as Tab[]).map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)} className={cn("press rounded-lg px-4 py-2 text-sm font-semibold capitalize", tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="min-h-0 flex-1">
        {tab === "reviews" && <ReviewsPanel seed={seed.reviews} />}
        {tab === "commitments" && <CommitmentsPanel seed={seed.commitments} />}
        {tab === "goals" && <GoalsView seed={seed.goals} />}
      </div>
    </div>
  );
}
