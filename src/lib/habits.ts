import type { Habit } from "@/lib/types";

/** Whether a habit's frequency expects it on a given weekday (0=Sun … 6=Sat). */
export function frequencyApplies(freq: Habit["frequency"], weekday: number): boolean {
  if (freq === "weekdays") return weekday >= 1 && weekday <= 5;
  if (freq === "weekends") return weekday === 0 || weekday === 6;
  return true; // "daily"
}
