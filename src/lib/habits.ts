import type { Habit, HabitCategory } from "@/lib/types";

/**
 * The accent each category is drawn in, from the product palette (no orange).
 * The first six keep the colours they always had, so existing habits look the
 * same; the newer ones take the remaining trait hues.
 */
export const CATEGORY_ACCENT: Record<HabitCategory, string> = {
  mindset: "var(--primary)",
  routine: "var(--ice)",
  research: "var(--win)",
  review: "var(--be)",
  risk: "var(--trait-a)",
  focus: "var(--trait-o)",
  learning: "var(--trait-n)",
  health: "var(--loss)",
  other: "var(--muted-foreground)",
};

/** Every category, in picker order, with its name and what it is for. */
export const HABIT_CATEGORIES: { key: HabitCategory; label: string; hint: string }[] = [
  { key: "mindset", label: "Mindset", hint: "State before the session" },
  { key: "routine", label: "Routine", hint: "The same start every day" },
  { key: "research", label: "Research", hint: "Levels, news, the plan" },
  { key: "review", label: "Review", hint: "Journal and look back" },
  { key: "risk", label: "Risk", hint: "Size, stops, limits" },
  { key: "focus", label: "Focus", hint: "Fewer distractions" },
  { key: "learning", label: "Learning", hint: "Study and practice" },
  { key: "health", label: "Health", hint: "Sleep, food, movement" },
  { key: "other", label: "Other", hint: "Anything else" },
];

/**
 * The colours a habit can be given, independent of its category. Stored by key
 * in `habits.color` and drawn through the theme tokens, so the light theme's
 * darker set applies. Legacy rows hold a literal there; those fall back to
 * the category, as they always have.
 */
export const HABIT_COLORS: { key: string; label: string; value: string }[] = [
  { key: "turquoise", label: "Turquoise", value: "var(--primary)" },
  { key: "cyan", label: "Cyan", value: "var(--ice)" },
  { key: "green", label: "Green", value: "var(--win)" },
  { key: "blue", label: "Blue", value: "var(--trait-n)" },
  { key: "violet", label: "Violet", value: "var(--trait-o)" },
  { key: "pink", label: "Pink", value: "var(--trait-a)" },
  { key: "amber", label: "Amber", value: "var(--be)" },
  { key: "red", label: "Red", value: "var(--loss)" },
  { key: "slate", label: "Slate", value: "var(--muted-foreground)" },
];
const COLOR_VALUE: Record<string, string> = Object.fromEntries(HABIT_COLORS.map((c) => [c.key, c.value]));

/** The palette key a category is drawn in by default. */
export const CATEGORY_COLOR_KEY: Record<HabitCategory, string> = {
  mindset: "turquoise", routine: "cyan", research: "green", review: "amber", risk: "pink",
  focus: "violet", learning: "blue", health: "red", other: "slate",
};

/** The colour a habit is drawn in: its own palette colour if it has one, else its category's. */
export function habitAccent(habit: Pick<Habit, "category"> & Partial<Pick<Habit, "color">>): string {
  return (habit.color && COLOR_VALUE[habit.color]) || CATEGORY_ACCENT[habit.category] || CATEGORY_ACCENT.other;
}

/** Whether a habit's frequency expects it on a given weekday (0=Sun ... 6=Sat). */
export function frequencyApplies(freq: Habit["frequency"], weekday: number): boolean {
  if (freq === "weekdays") return weekday >= 1 && weekday <= 5;
  if (freq === "weekends") return weekday === 0 || weekday === 6;
  return true; // "daily"
}
