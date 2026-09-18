/**
 * Coaching insights and discipline scoring: pure computation over the
 * trader's own data. Lifted out of the retired localStorage mock store so the
 * app bundle no longer carries that module along with every Supabase query.
 */
import type {
  TradeJournalEntry,
  Habit,
  HabitCompletion,
  TraderPlaybook,
  TradeDiscipline,
  CoachingInsight,
} from "@/lib/types";

// ── Discipline Score Utility ─────────────────────────────────────────
const DISCIPLINE_FIELDS: (keyof TradeDiscipline)[] = [
  "followed_plan",
  "traded_in_session",
  "respected_risk",
  "respected_max_trades",
  "matched_a_plus",
  "no_impulsive_entry",
  "no_revenge_trade",
  "respected_stop_loss",
  "journal_completed",
];

export function computeDisciplineScore(d: Partial<TradeDiscipline>): number {
  const defaultTrue = DISCIPLINE_FIELDS.filter((f) => d[f] === true).length;
  const customChecks = d.custom_checks ?? [];
  const customTrue = customChecks.filter((c) => c.passed).length;
  const total = DISCIPLINE_FIELDS.length + customChecks.length;
  if (total === 0) return 0;
  return Math.round(((defaultTrue + customTrue) / total) * 100);
}

export function getDisciplineFieldLabel(field: keyof TradeDiscipline): string {
  const labels: Partial<Record<keyof TradeDiscipline, string>> = {
    followed_plan: "Followed plan",
    traded_in_session: "Traded in allowed session",
    respected_risk: "Respected risk rules",
    respected_max_trades: "Respected max trades/day",
    matched_a_plus: "Matched A+ criteria",
    no_impulsive_entry: "No impulsive entry",
    no_revenge_trade: "No revenge trade",
    respected_stop_loss: "Respected stop loss",
    journal_completed: "Journal completed",
  };
  return labels[field] ?? field;
}

/** Returns average discipline score for a set of trades */
export function getAvgDisciplineScore(trades: TradeJournalEntry[]): number {
  const scored = trades.filter((t) => t.discipline);
  if (scored.length === 0) return 0;
  return Math.round(scored.reduce((s, t) => s + t.discipline!.score, 0) / scored.length);
}

// ── Coaching Insights Engine ─────────────────────────────────────────
export function generateCoachingInsights(
  trades: TradeJournalEntry[],
  habits: Habit[],
  completions: HabitCompletion[],
  playbook: TraderPlaybook | null
): CoachingInsight[] {
  const insights: CoachingInsight[] = [];

  if (trades.length < 3) {
    return [
      {
        id: "no-data",
        type: "suggestion",
        category: "performance",
        title: "Log more trades to unlock insights",
        description:
          "Add at least 5 trades to start seeing data-driven patterns. The coaching engine needs a sample to identify what's working and what isn't.",
        data_points: ["Currently: " + trades.length + " trade(s) logged", "Target: 5+ trades"],
        confidence: "high",
        timeframe: "all_time",
      },
    ];
  }

  // ── 1. Session performance ───────────────────────────────────────────
  // Rates below are wins / decisive trades: break-even never dilutes them.
  const sessionMap: Record<string, { wins: number; decisive: number; total: number }> = {};
  trades.forEach((t) => {
    if (!sessionMap[t.session]) sessionMap[t.session] = { wins: 0, decisive: 0, total: 0 };
    sessionMap[t.session].total++;
    if (t.result === "win") { sessionMap[t.session].wins++; sessionMap[t.session].decisive++; }
    else if (t.result === "loss") sessionMap[t.session].decisive++;
  });
  const sessionRates = Object.entries(sessionMap)
    .filter(([, d]) => d.decisive > 0)
    .map(([s, d]) => ({ session: s, rate: d.wins / d.decisive, total: d.total }))
    .sort((a, b) => b.rate - a.rate);

  if (sessionRates.length >= 2) {
    const best = sessionRates[0];
    const worst = sessionRates[sessionRates.length - 1];
    if (best.rate - worst.rate > 0.15 && best.total >= 2) {
      insights.push({
        id: "session-strength",
        type: "strength",
        category: "performance",
        title: `${best.session} is your strongest session`,
        description: `You win ${Math.round(best.rate * 100)}% of trades in ${best.session} vs ${Math.round(worst.rate * 100)}% in ${worst.session}. Prioritise your best setups here and be more selective elsewhere.`,
        data_points: sessionRates.map(
          (s) => `${s.session}: ${Math.round(s.rate * 100)}% win rate (${s.total} trades)`
        ),
        confidence: best.total >= 4 ? "high" : "medium",
        timeframe: "all_time",
      });
    }
  }

  // ── 2. Discipline ↔ results correlation ─────────────────────────────
  const withDisc = trades.filter((t) => t.discipline);
  if (withDisc.length >= 3) {
    const winScores = withDisc.filter((t) => t.result === "win").map((t) => t.discipline!.score);
    const lossScores = withDisc.filter((t) => t.result === "loss").map((t) => t.discipline!.score);
    const avg = (arr: number[]) =>
      arr.length > 0 ? arr.reduce((s, n) => s + n, 0) / arr.length : 0;
    const avgWin = avg(winScores);
    const avgLoss = avg(lossScores);

    if (lossScores.length >= 2 && avgWin - avgLoss > 12) {
      insights.push({
        id: "discipline-results-link",
        type: "pattern",
        category: "discipline",
        title: "Discipline score directly predicts your outcomes",
        description: `Winning trades average ${Math.round(avgWin)}% discipline vs ${Math.round(avgLoss)}% on losses: a ${Math.round(avgWin - avgLoss)} point gap. Your process quality is your edge.`,
        data_points: [
          `Wins avg discipline: ${Math.round(avgWin)}%`,
          `Losses avg discipline: ${Math.round(avgLoss)}%`,
          `Sample: ${withDisc.length} scored trades`,
        ],
        confidence: "high",
        timeframe: "all_time",
      });
    }

    // Most broken criteria
    const breaks: Partial<Record<keyof TradeDiscipline, number>> = {};
    withDisc.forEach((t) => {
      DISCIPLINE_FIELDS.forEach((f) => {
        if (!t.discipline![f as keyof TradeDiscipline]) {
          breaks[f as keyof TradeDiscipline] = (breaks[f as keyof TradeDiscipline] ?? 0) + 1;
        }
      });
    });
    const topBreak = Object.entries(breaks).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))[0];
    if (topBreak && (topBreak[1] ?? 0) >= 2) {
      insights.push({
        id: "top-discipline-break",
        type: "weakness",
        category: "discipline",
        title: `"${getDisciplineFieldLabel(topBreak[0] as keyof TradeDiscipline)}" is your most broken rule`,
        description: `This rule was broken in ${topBreak[1]} of ${withDisc.length} trades. Consistent rule-breaking here compounds losses over time.`,
        data_points: Object.entries(breaks)
          .filter(([, v]) => (v ?? 0) > 0)
          .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
          .slice(0, 5)
          .map(([k, v]) => `${getDisciplineFieldLabel(k as keyof TradeDiscipline)}: broken ${v}×`),
        confidence: "high",
        timeframe: "all_time",
      });
    }
  }

  // ── 3. Market regime performance ────────────────────────────────────
  const withCtx = trades.filter((t) => t.market_context?.regime);
  if (withCtx.length >= 3) {
    const regimeMap: Record<string, { wins: number; decisive: number; total: number }> = {};
    withCtx.forEach((t) => {
      const r = t.market_context!.regime!;
      if (!regimeMap[r]) regimeMap[r] = { wins: 0, decisive: 0, total: 0 };
      regimeMap[r].total++;
      if (t.result === "win") { regimeMap[r].wins++; regimeMap[r].decisive++; }
      else if (t.result === "loss") regimeMap[r].decisive++;
    });
    const regimes = Object.entries(regimeMap)
      .filter(([, d]) => d.total >= 2 && d.decisive > 0)
      .map(([regime, d]) => ({ regime, rate: d.wins / d.decisive, total: d.total }))
      .sort((a, b) => b.rate - a.rate);

    if (regimes.length >= 2) {
      const best = regimes[0];
      const worst = regimes[regimes.length - 1];
      if (best.rate - worst.rate > 0.15) {
        insights.push({
          id: "regime-performance",
          type: "pattern",
          category: "market",
          title: `You thrive in ${best.regime} markets, struggle in ${worst.regime}`,
          description: `${Math.round(best.rate * 100)}% win rate in ${best.regime} conditions vs ${Math.round(worst.rate * 100)}% when ${worst.regime}. Be more selective or reduce size in ${worst.regime} markets.`,
          data_points: regimes.map(
            (r) => `${r.regime}: ${Math.round(r.rate * 100)}% win rate (${r.total} trades)`
          ),
          confidence: best.total >= 3 ? "high" : "medium",
          timeframe: "all_time",
        });
      }
    }
  }

  // ── 4. Recent performance trend ──────────────────────────────────────
  const sorted = [...trades].sort(
    (a, b) =>
      new Date(b.date_time.slice(0, 10) + "T12:00:00").getTime() -
      new Date(a.date_time.slice(0, 10) + "T12:00:00").getTime()
  );
  const recent10 = sorted.slice(0, 10);
  const decisiveRate = (list: TradeJournalEntry[]) => {
    const wins = list.filter((t) => t.result === "win").length;
    const decisive = wins + list.filter((t) => t.result === "loss").length;
    return decisive > 0 ? wins / decisive : 0;
  };
  const allWR = decisiveRate(trades);
  const recWR = decisiveRate(recent10);

  if (recent10.length >= 5 && recWR > allWR + 0.1) {
    insights.push({
      id: "improving-trend",
      type: "strength",
      category: "performance",
      title: "Your recent form is above your historical average",
      description: `Last 10 trades: ${Math.round(recWR * 100)}% win rate vs ${Math.round(allWR * 100)}% all-time. You're in a strong phase: maintain the approach and protect your capital.`,
      data_points: [
        `Recent 10 trades: ${Math.round(recWR * 100)}% win rate`,
        `All-time: ${Math.round(allWR * 100)}% win rate`,
      ],
      confidence: "medium",
      timeframe: "recent",
    });
  } else if (recent10.length >= 5 && recWR < allWR - 0.1) {
    insights.push({
      id: "declining-trend",
      type: "blind_spot",
      category: "performance",
      title: "Recent performance is below your baseline",
      description: `Last 10 trades: ${Math.round(recWR * 100)}% win rate vs ${Math.round(allWR * 100)}% all-time. Step back and identify what changed before adding size.`,
      data_points: [
        `Recent 10 trades: ${Math.round(recWR * 100)}% win rate`,
        `All-time: ${Math.round(allWR * 100)}% win rate`,
      ],
      confidence: "medium",
      timeframe: "recent",
    });
  }

  // ── 5. Habit ↔ trading correlation ──────────────────────────────────
  if (habits.length > 0 && completions.length >= 5) {
    const tradeDates = [...new Set(trades.map((t) => t.date_time.slice(0, 10)))];
    const dayStats = tradeDates
      .map((date) => {
        const dayTrades = trades.filter((t) => t.date_time.slice(0, 10) === date);
        const dayCompletions = completions.filter((c) => c.date === date && c.completed);
        return {
          habitRate: dayCompletions.length / habits.length,
          winRate: decisiveRate(dayTrades),
          tradeCount: dayTrades.length,
        };
      })
      .filter((d) => d.tradeCount > 0);

    if (dayStats.length >= 4) {
      const highHabit = dayStats.filter((d) => d.habitRate >= 0.7);
      const lowHabit = dayStats.filter((d) => d.habitRate < 0.4);
      if (highHabit.length >= 2 && lowHabit.length >= 2) {
        const highWR = highHabit.reduce((s, d) => s + d.winRate, 0) / highHabit.length;
        const lowWR = lowHabit.reduce((s, d) => s + d.winRate, 0) / lowHabit.length;
        if (highWR > lowWR + 0.1) {
          insights.push({
            id: "habit-performance-link",
            type: "pattern",
            category: "habits",
            title: "Strong daily habits correlate with better results",
            description: `Days with 70%+ habit completion show ${Math.round(highWR * 100)}% win rate vs ${Math.round(lowWR * 100)}% on low-habit days. Your preparation matters.`,
            data_points: [
              `High-habit days (${highHabit.length}): ${Math.round(highWR * 100)}% win rate`,
              `Low-habit days (${lowHabit.length}): ${Math.round(lowWR * 100)}% win rate`,
            ],
            confidence: "medium",
            timeframe: "all_time",
          });
        }
      }
    }
  }

  // ── 6. Overtrading ───────────────────────────────────────────────────
  if (playbook && playbook.max_trades_per_day > 0) {
    const dailyCounts = trades.reduce<Record<string, number>>((acc, t) => {
      const d = t.date_time.slice(0, 10);
      acc[d] = (acc[d] ?? 0) + 1;
      return acc;
    }, {});
    const overtradingDays = Object.values(dailyCounts).filter(
      (c) => c > playbook.max_trades_per_day
    ).length;
    if (overtradingDays > 0) {
      insights.push({
        id: "overtrading",
        type: "weakness",
        category: "discipline",
        title: `Overtrading detected on ${overtradingDays} day${overtradingDays > 1 ? "s" : ""}`,
        description: `You exceeded your ${playbook.max_trades_per_day} trade/day limit. Overtrading is a primary cause of compounding losses: quality always beats quantity.`,
        data_points: [
          `Your limit: ${playbook.max_trades_per_day} trades/day`,
          `Days exceeded: ${overtradingDays}`,
        ],
        confidence: "high",
        timeframe: "all_time",
      });
    }
  }

  // ── 7. R:R quality ───────────────────────────────────────────────────
  const lowRR = trades.filter((t) => t.rr < 1.5).length;
  const highRR = trades.filter((t) => t.rr >= 2.5).length;
  if (lowRR >= 3 && lowRR > highRR) {
    insights.push({
      id: "rr-quality",
      type: "suggestion",
      category: "performance",
      title: "Raise your minimum R:R threshold",
      description: `${lowRR} trades were taken below 1.5R: more than your high-quality trades. Only entering at 2R+ significantly improves your mathematical expectancy.`,
      data_points: [
        `Trades below 1.5R: ${lowRR}`,
        `Trades above 2.5R: ${highRR}`,
        "Aim for 2R+ as your minimum entry criterion",
      ],
      confidence: "medium",
      timeframe: "all_time",
    });
  }

  // ── 8. Prompt to enable discipline scoring ───────────────────────────
  if (withDisc.length === 0 && trades.length >= 3) {
    insights.push({
      id: "enable-discipline",
      type: "suggestion",
      category: "discipline",
      title: "Enable Discipline Scoring for deeper insights",
      description:
        "None of your trades have process data yet. Score your discipline on each trade to unlock powerful correlation analysis between behavior and results.",
      data_points: [
        "Takes 30 seconds per trade",
        "Unlocks 3+ additional insight types",
        "Shows exactly which rules drive your P&L",
      ],
      confidence: "high",
      timeframe: "all_time",
    });
  }

  return insights.slice(0, 9);
}
