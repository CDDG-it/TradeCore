import { eachDayOfInterval, endOfDay, format, isSameDay } from "date-fns";
import { computeMindScore, type MindInputs, type MindPeriod, type MindScore } from "./mind-score";

export interface MindTrendPoint {
  date: string;
  value: number | null;
}

/** Reconstruct the score known by each day from the data currently available. */
export function computeMindScoreTrend(input: MindInputs, period: MindPeriod, current: MindScore): MindTrendPoint[] {
  const now = input.now ?? new Date();
  const days = eachDayOfInterval({ start: current.rangeStart, end: now });
  // Full history can span years. Keep both endpoints and at most 60 readings.
  const sampled = period === "all" && days.length > 60
    ? Array.from({ length: 60 }, (_, index) => days[Math.round(index * (days.length - 1) / 59)])
    : days;

  return sampled.map((day) => {
    const key = format(day, "yyyy-MM-dd");
    if (isSameDay(day, now)) return { date: key, value: current.pending ? null : current.total };
    const cutoff = endOfDay(day).getTime();
    const occurred = (date: string) => date.slice(0, 10) <= key;
    const recorded = (stamp: string) => new Date(stamp).getTime() <= cutoff;
    const historical: MindInputs = {
      now: day,
      trades: input.trades.filter((item) => occurred(item.date_time) && recorded(item.created_at)),
      habits: input.habits.filter((item) => recorded(item.created_at)),
      completions: input.completions.filter((item) => occurred(item.date)),
      psychSessions: input.psychSessions.filter((item) => occurred(item.date) && recorded(item.created_at)),
      bestTrades: input.bestTrades.filter((item) => occurred(item.date) && recorded(item.created_at)),
      weeklyReviews: input.weeklyReviews.filter((item) => recorded(item.created_at)),
      analyses: input.analyses.filter((item) => occurred(item.date) && recorded(item.created_at)),
      adherenceLogs: (input.adherenceLogs ?? []).filter((item) => occurred(item.date) && recorded(item.created_at)),
      goals: (input.goals ?? []).filter((item) => recorded(item.created_at)).map((item) => ({
        ...item, archived_at: item.archived_at && recorded(item.archived_at) ? item.archived_at : null,
      })),
    };
    const hasActivity = historical.trades.length > 0 ||
      historical.completions.some((item) => item.completed) ||
      historical.psychSessions.length > 0 || historical.bestTrades.length > 0 ||
      historical.weeklyReviews.length > 0 || historical.analyses.length > 0 ||
      (historical.adherenceLogs?.length ?? 0) > 0;
    if (!hasActivity) return { date: key, value: null };
    const score = computeMindScore(historical, period);
    return { date: key, value: score.pending ? null : score.total };
  });
}
