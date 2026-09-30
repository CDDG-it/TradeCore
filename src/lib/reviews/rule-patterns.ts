import { format, startOfISOWeek } from "date-fns";
import type { TradeRuleCheck } from "@/lib/types";

export type RuleCheckWithDate = Pick<TradeRuleCheck, "source_text_snapshot" | "status"> & { date: string };

export function mostBrokenItem(checks: readonly RuleCheckWithDate[]): { text: string; count: number } | null {
  const counts = new Map<string, number>();
  checks.filter((check) => check.status === "broken").forEach((check) => counts.set(check.source_text_snapshot, (counts.get(check.source_text_snapshot) ?? 0) + 1));
  const first = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
  return first ? { text: first[0], count: first[1] } : null;
}

export function persistentBrokenPatterns(checks: readonly RuleCheckWithDate[], minimumWeeks = 3): { text: string; weeks: number }[] {
  const weeksByText = new Map<string, Set<string>>();
  for (const check of checks) {
    if (check.status !== "broken") continue;
    const week = format(startOfISOWeek(new Date(`${check.date.slice(0, 10)}T12:00:00`)), "yyyy-MM-dd");
    const weeks = weeksByText.get(check.source_text_snapshot) ?? new Set<string>();
    weeks.add(week); weeksByText.set(check.source_text_snapshot, weeks);
  }
  return [...weeksByText.entries()].filter(([, weeks]) => weeks.size >= minimumWeeks).map(([text, weeks]) => ({ text, weeks: weeks.size })).sort((a, b) => b.weeks - a.weeks || a.text.localeCompare(b.text));
}
