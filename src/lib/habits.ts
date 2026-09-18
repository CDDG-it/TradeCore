import type { Habit, HabitCategory } from "@/lib/types";

/**
 * The accent each category is drawn in, from the product palette (no orange).
 * `habits.color` on the row is a legacy literal that predates the light theme;
 * the category has always been the real source of truth, so every surface
 * reads the colour from here rather than trusting the stored string.
 */
export const CATEGORY_ACCENT: Record<HabitCategory, string> = {
  mindset: "var(--primary)",
  routine: "var(--ice)",
  research: "var(--win)",
  health: "var(--loss)",
  review: "var(--be)",
  other: "var(--muted-foreground)",
};

/** The colour a habit is drawn in: a palette token, never the stored string. */
export function habitAccent(habit: Pick<Habit, "category">): string {
  return CATEGORY_ACCENT[habit.category] ?? CATEGORY_ACCENT.other;
}

/** Whether a habit's frequency expects it on a given weekday (0=Sun ... 6=Sat). */
export function frequencyApplies(freq: Habit["frequency"], weekday: number): boolean {
  if (freq === "weekdays") return weekday >= 1 && weekday <= 5;
  if (freq === "weekends") return weekday === 0 || weekday === 6;
  return true; // "daily"
}
