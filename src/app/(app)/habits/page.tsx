"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format, subDays } from "date-fns";
import { PageHeader } from "@/components/ui/page-header";
import { PageWrapper } from "@/components/ui/page-wrapper";
import {
  Plus,
  Repeat,
  Check,
  Trash2,
  CheckCircle2,
  Zap,
  HelpCircle,
  TrendingUp,
  Search,
  Dumbbell,
  Brain,
  BookOpen,
  Coffee,
  Circle,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { computeHabitScore } from "@/lib/discipline";
import { frequencyApplies } from "@/lib/habits";
import { HABIT_ICONS, HabitGlyph } from "@/components/habit-glyph";
import { HabitCalendar } from "@/components/habits/habit-calendar";
import { CalendarDays, LayoutGrid } from "lucide-react";
import { startOfDay, startOfWeek, eachDayOfInterval } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  getHabits,
  getHabitCompletions,
  toggleHabitCompletion,
  createHabit,
  deleteHabit,
  getHabitStreak,
} from "@/lib/supabase/queries";
import type { Habit, HabitCompletion, HabitCategory } from "@/lib/types";

type IconComponent = React.ComponentType<{ className?: string; style?: React.CSSProperties }>;

const CATEGORY_COLORS: Record<HabitCategory, { accent: string; bg: string; label: string; Icon: IconComponent }> = {
  mindset:  { accent: "oklch(0.70 0.12 183)",  bg: "oklch(0.70 0.12 183 / 0.12)",  label: "Mindset",  Icon: Brain },
  routine:  { accent: "oklch(0.71 0.13 215)",  bg: "oklch(0.71 0.13 215 / 0.12)",  label: "Routine",  Icon: Coffee },
  research: { accent: "oklch(0.58 0.17 145)", bg: "oklch(0.58 0.17 145 / 0.12)", label: "Research", Icon: Search },
  health:   { accent: "oklch(0.58 0.22 25)",  bg: "oklch(0.58 0.22 25 / 0.12)",  label: "Health",   Icon: Dumbbell },
  review:   { accent: "oklch(0.80 0.16 86)",  bg: "oklch(0.80 0.16 86 / 0.12)",  label: "Review",   Icon: BookOpen },
  other:    { accent: "var(--muted-foreground)", bg: "oklch(0.62 0.012 40 / 0.12)", label: "Other",  Icon: Circle },
};


// How far back the insights look. Lets you see beyond just today/this week.
const RANGES = [
  { key: "week", label: "7d", days: 7 },
  { key: "month", label: "30d", days: 30 },
  { key: "quarter", label: "90d", days: 90 },
] as const;
type RangeKey = (typeof RANGES)[number]["key"];

/**
 * GitHub-style history grid: weekday rows × week columns over [start, end].
 * `intensityFor` returns 0–1 for a day (color strength), or null when the day
 * doesn't apply (rendered dim) - so you can actually see earlier weeks/months.
 */
function ActivityHeatmap({
  start,
  end,
  intensityFor,
  color,
  cell = 12,
}: {
  start: Date;
  end: Date;
  intensityFor: (dateKey: string, date: Date) => number | null;
  color: string;
  cell?: number;
}) {
  const firstMonday = startOfWeek(start, { weekStartsOn: 1 });
  const rangeStart = startOfDay(start);
  const days = eachDayOfInterval({ start: firstMonday, end });
  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  return (
    <div className="flex gap-[3px] overflow-x-auto pb-1">
      {weeks.map((wk, ci) => (
        <div key={ci} className="flex flex-col gap-[3px]">
          {wk.map((d) => {
            const key = format(d, "yyyy-MM-dd");
            const inRange = d >= rangeStart && d <= end;
            let bg = "transparent";
            let title = "";
            if (inRange) {
              const intensity = intensityFor(key, d);
              if (intensity === null) {
                bg = "var(--muted)";
              } else if (intensity <= 0) {
                bg = "var(--secondary)";
                title = `${format(d, "EEE MMM d")} · missed`;
              } else {
                const a = 0.3 + Math.min(1, intensity) * 0.6;
                bg = color.replace(")", ` / ${a.toFixed(2)})`);
                title = `${format(d, "EEE MMM d")} · ${Math.round(intensity * 100)}%`;
              }
            }
            return (
              <div key={key} title={title}
                style={{ width: cell, height: cell, borderRadius: 3, background: bg }} />
            );
          })}
        </div>
      ))}
    </div>
  );
}

/** Applicable-day completion for one habit over the last `days` days, counting
 *  only from the day the habit was created (no penalty for pre-existence). */
function habitRangeStat(habit: Habit, completions: HabitCompletion[], days: number) {
  const done = new Set(completions.filter((c) => c.completed).map((c) => c.date));
  const createdOn = startOfDay(new Date(habit.created_at)).getTime();
  let expected = 0;
  let completed = 0;
  for (let i = 0; i < days; i++) {
    const d = subDays(new Date(), i);
    if (!frequencyApplies(habit.frequency, d.getDay())) continue;
    if (startOfDay(d).getTime() < createdOn) continue;
    expected += 1;
    if (done.has(format(d, "yyyy-MM-dd"))) completed += 1;
  }
  return { expected, completed, pct: expected > 0 ? Math.round((completed / expected) * 100) : 0 };
}

function ProgressRing({
  percent,
  size = 48,
  stroke = 4,
  color,
}: {
  percent: number;
  size?: number;
  stroke?: number;
  color: string;
}) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(1, percent / 100));
  return (
    <svg width={size} height={size} className="progress-ring">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--border)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.5s ease" }}
      />
    </svg>
  );
}

function WeekGrid({
  habit,
  completions,
  onToggle,
  today,
}: {
  habit: Habit;
  completions: HabitCompletion[];
  onToggle: (date: string) => void;
  today: string;
}) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(today + "T12:00:00"), 6 - i);
    return format(d, "yyyy-MM-dd");
  });
  const completedSet = new Set(
    completions.filter((c) => c.completed).map((c) => c.date)
  );

  return (
    <div className="flex gap-1.5 items-center">
      {days.map((date) => {
        const isToday = date === today;
        const done = completedSet.has(date);
        return (
          <button
            key={date}
            onClick={() => onToggle(date)}
            title={format(new Date(date + "T12:00:00"), "EEE MMM d")}
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150 text-xs font-bold border",
              isToday && "ring-1",
              done
                ? "border-transparent"
                : "border-dashed hover:border-solid"
            )}
            style={
              done
                ? {
                    background: `${habit.color.replace(")", " / 0.20)")}`,
                    borderColor: habit.color,
                    color: habit.color,
                  }
                : {
                    background: "var(--muted)",
                    borderColor: isToday
                      ? habit.color
                      : "var(--border)",
                    color: "oklch(0.38 0.005 28)",
                  }
            }
          >
            {done ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <span style={{ fontSize: "9px" }}>
                {format(new Date(date + "T12:00:00"), "d")}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

interface NewHabitForm {
  name: string;
  description: string;
  category: HabitCategory;
  frequency: "daily" | "weekdays" | "weekends";
  icon: string;
}

const EMPTY_NEW_HABIT: NewHabitForm = {
  name: "",
  description: "",
  category: "routine",
  frequency: "daily",
  icon: "checklist",
};

export default function HabitsPage() {
  const today = format(new Date(), "yyyy-MM-dd");
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [showNewHabit, setShowNewHabit] = useState(false);
  const [deletingHabit, setDeletingHabit] = useState<string | null>(null);
  const [newHabit, setNewHabit] = useState<NewHabitForm>(EMPTY_NEW_HABIT);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [streaks, setStreaks] = useState<Record<string, number>>({});
  const [range, setRange] = useState<RangeKey>("month");
  const [view, setView] = useState<"overview" | "calendar">("overview");

  const rangeDays = RANGES.find((r) => r.key === range)!.days;

  const refresh = async () => {
    const [h, c] = await Promise.all([getHabits(), getHabitCompletions()]);
    setHabits(h);
    setCompletions(c);
    const streakMap: Record<string, number> = {};
    await Promise.all(h.map(async (habit) => {
      streakMap[habit.id] = await getHabitStreak(habit.id);
    }));
    setStreaks(streakMap);
  };

  useEffect(() => { refresh(); }, [today]);

  async function handleToggle(habitId: string, date: string) {
    await toggleHabitCompletion(habitId, date);
    const c = await getHabitCompletions();
    setCompletions(c);
  }

  async function handleCreateHabit() {
    if (!newHabit.name.trim() || creating) return;
    setCreating(true);
    setCreateError(null);
    try {
      const cat = CATEGORY_COLORS[newHabit.category];
      await createHabit({
        name: newHabit.name.trim(),
        description: newHabit.description.trim(),
        category: newHabit.category,
        frequency: newHabit.frequency,
        target_days: newHabit.frequency === "daily" ? 7 : newHabit.frequency === "weekdays" ? 5 : 2,
        color: cat.accent,
        icon: newHabit.icon,
      });
      await refresh();
      setNewHabit(EMPTY_NEW_HABIT);
      setShowNewHabit(false);
    } catch (err) {
      console.error("Failed to create habit:", err);
      setCreateError("Could not create habit. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  function closeNewHabit() {
    if (creating) return;
    setShowNewHabit(false);
    setCreateError(null);
    setNewHabit(EMPTY_NEW_HABIT);
  }

  async function handleDeleteHabit(id: string) {
    await deleteHabit(id);
    await refresh();
    setDeletingHabit(null);
  }

  // Stats
  const totalHabits = habits.length;
  const longestStreak = Object.values(streaks).reduce((max, s) => Math.max(max, s), 0);

  // Range-aware insights - same completion engine as the discipline score.
  const rangeStart = startOfDay(subDays(new Date(), rangeDays - 1));
  const rangeEnd = startOfDay(new Date());
  const rangeCompletion = computeHabitScore(habits, completions, rangeStart, rangeEnd) ?? 0;
  const rangeCompleted = completions.filter((c) => {
    if (!c.completed) return false;
    const d = new Date(c.date + "T12:00:00");
    return d >= rangeStart && d <= rangeEnd;
  }).length;

  // Fast lookup for the heatmaps + a per-day overall completion rate.
  const completedByKey = new Set(
    completions.filter((c) => c.completed).map((c) => `${c.habit_id}|${c.date}`)
  );
  const overallIntensity = (key: string, d: Date): number | null => {
    const wd = d.getDay();
    const dayTime = startOfDay(d).getTime();
    let exp = 0;
    let done = 0;
    for (const h of habits) {
      if (!frequencyApplies(h.frequency, wd)) continue;
      if (dayTime < startOfDay(new Date(h.created_at)).getTime()) continue;
      exp += 1;
      if (completedByKey.has(`${h.id}|${key}`)) done += 1;
    }
    return exp > 0 ? done / exp : null;
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <PageHeader
        badge="MC Mindset Formula"
        title="Habits"
        subtitle="Daily habits & discipline tracking"
        action={
          <button
            onClick={() => setShowNewHabit(true)}
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all hover:-translate-y-px shrink-0"
            style={{
              background: "oklch(0.70 0.12 183)",
              color: "oklch(0.07 0.003 28)",
              boxShadow: "0 4px 14px oklch(0.70 0.12 183 / 0.30)",
            }}
          >
            <Plus className="w-4 h-4" />
            New habit
          </button>
        }
      />
      <PageWrapper>
      {/* View toggle: overview vs a navigable calendar of earlier weeks/months */}
      <div className="flex w-fit rounded-lg border border-border/60 overflow-hidden">
        <button onClick={() => setView("overview")}
          className={cn("inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium transition-colors",
            view === "overview" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}>
          <LayoutGrid className="w-3.5 h-3.5" /> Overview
        </button>
        <button onClick={() => setView("calendar")}
          className={cn("inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium transition-colors",
            view === "calendar" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}>
          <CalendarDays className="w-3.5 h-3.5" /> Calendar
        </button>
      </div>

      {view === "calendar" ? (
        <HabitCalendar habits={habits} completions={completions} onToggle={handleToggle} />
      ) : (
      <>
      {/* Insights header + range toggle - look beyond just today */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" style={{ color: "oklch(0.70 0.12 183)" }} />
            <h2 className="text-sm font-semibold">Insights</h2>
          </div>
          <Link
            href="/discipline"
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-sm transition-all hover:-translate-y-px"
            style={{
              background: "oklch(0.70 0.12 183 / 0.12)",
              borderColor: "oklch(0.70 0.12 183 / 0.40)",
              color: "oklch(0.70 0.12 183)",
            }}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            How it works
          </Link>
        </div>
        <div className="flex rounded-lg border border-border/50 overflow-hidden">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium transition-colors",
                range === r.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary stats - range-aware */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Completion Rate",
            value: `${rangeCompletion}%`,
            sub: `last ${rangeDays} days`,
            icon: CheckCircle2,
            accent: "oklch(0.70 0.12 183)",
            accentBg: "oklch(0.70 0.12 183 / 0.10)",
            ring: rangeCompletion,
          },
          {
            label: "Longest Streak",
            value: `${longestStreak}d`,
            sub: "consecutive days",
            icon: Repeat,
            accent: "oklch(0.58 0.22 25)",
            accentBg: "oklch(0.58 0.22 25 / 0.10)",
            ring: null,
          },
          {
            label: "Completed",
            value: rangeCompleted.toString(),
            sub: `in last ${rangeDays} days`,
            icon: TrendingUp,
            accent: "oklch(0.58 0.17 145)",
            accentBg: "oklch(0.58 0.17 145 / 0.10)",
            ring: null,
          },
          {
            label: "Active Habits",
            value: totalHabits.toString(),
            sub: "being tracked",
            icon: Zap,
            accent: "oklch(0.70 0.12 183)",
            accentBg: "oklch(0.70 0.12 183 / 0.10)",
            ring: null,
          },
        ].map(({ label, value, sub, icon: Icon, accent, accentBg, ring }, i) => (
          <div
            key={label}
            className="animate-fade-up rounded-xl p-5 relative overflow-hidden"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              animationDelay: `${i * 60}ms`,
            }}
          >
            <div
              className="absolute inset-x-0 top-0 h-px"
              style={{
                background: `linear-gradient(90deg, transparent, ${accent.replace(")", " / 0.40)")}, transparent)`,
              }}
            />
            <div className="flex items-start justify-between mb-4">
              <p
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: "oklch(0.45 0.005 28)" }}
              >
                {label}
              </p>
              {ring !== null ? (
                <div className="relative">
                  <ProgressRing percent={ring} size={36} stroke={3} color={accent} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span style={{ fontSize: "8px", fontWeight: 800, color: accent }}>
                      {ring}%
                    </span>
                  </div>
                </div>
              ) : (
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: accentBg }}
                >
                  <Icon className="w-3.5 h-3.5" style={{ color: accent }} />
                </div>
              )}
            </div>
            <p
              className="text-3xl font-black tracking-tight mb-1 tabular-nums"
              style={{ color: accent }}
            >
              {value}
            </p>
            <p className="text-xs text-muted-foreground">{sub}</p>
          </div>
        ))}
      </div>

      {/* Activity history - see completion across earlier weeks / months */}
      {habits.length > 0 && (
        <div
          className="rounded-xl p-5"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-sm font-semibold">Activity</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Daily completion over the last {rangeDays} days
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground shrink-0">
              <span>Less</span>
              {[0.19, 0.4, 0.65, 0.9].map((a) => (
                <span key={a} style={{ width: 11, height: 11, borderRadius: 3, background: a === 0.19 ? "var(--secondary)" : `oklch(0.70 0.12 183 / ${a})` }} />
              ))}
              <span>More</span>
            </div>
          </div>
          <ActivityHeatmap start={rangeStart} end={rangeEnd} intensityFor={overallIntensity} color="oklch(0.70 0.12 183)" />
        </div>
      )}

      <div className="grid gap-6">
        {/* Habits list */}
        <div className="space-y-3">
          <div className="animate-fade-up space-y-2" style={{ animationDelay: "200ms" }}>
            <h2 className="text-sm font-semibold">Daily Habits</h2>
            {/* Category legend - little figures so each type is recognisable at a glance */}
            <div className="flex flex-wrap gap-x-3 gap-y-1.5">
              {(Object.keys(CATEGORY_COLORS) as HabitCategory[]).map((cat) => {
                const { accent, bg, label, Icon } = CATEGORY_COLORS[cat];
                return (
                  <span key={cat} className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span className="flex h-4 w-4 items-center justify-center rounded" style={{ background: bg }}>
                      <Icon className="w-2.5 h-2.5" style={{ color: accent }} />
                    </span>
                    {label}
                  </span>
                );
              })}
            </div>
          </div>

          {habits.length === 0 && (
            <div
              className="rounded-xl p-10 text-center animate-fade-up"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderStyle: "dashed",
              }}
            >
              <p className="text-sm text-muted-foreground mb-3">No habits yet.</p>
              <button
                onClick={() => setShowNewHabit(true)}
                className="text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
                style={{ color: "oklch(0.70 0.12 183)" }}
              >
                <Plus className="w-3.5 h-3.5" /> Create your first habit
              </button>
            </div>
          )}

          {habits.map((habit, i) => {
            const streak = streaks[habit.id] ?? 0;
            const habitCompletions = completions.filter((c) => c.habit_id === habit.id);
            const completedToday = habitCompletions.some(
              (c) => c.date === today && c.completed
            );
            const rangeStat = habitRangeStat(habit, habitCompletions, rangeDays);
            const catConfig = CATEGORY_COLORS[habit.category];

            return (
              <div
                key={habit.id}
                className="animate-fade-up rounded-xl p-4 transition-all relative group"
                style={{
                  background: "var(--card)",
                  border: `1px solid ${completedToday ? habit.color.replace(")", " / 0.25)") : "var(--border)"}`,
                  animationDelay: `${220 + i * 50}ms`,
                }}
              >
                {/* Delete button */}
                {deletingHabit === habit.id ? (
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <span className="text-xs text-destructive font-medium">Delete?</span>
                    <button
                      onClick={() => handleDeleteHabit(habit.id)}
                      className="text-xs px-2 py-0.5 rounded-md font-medium transition-colors"
                      style={{ background: "oklch(0.58 0.22 25 / 0.15)", color: "oklch(0.58 0.22 25)" }}
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setDeletingHabit(null)}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeletingHabit(habit.id)}
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}

                <div className="flex items-start gap-3 mb-4">
                  {/* Figure + completion ring */}
                  <div className="relative shrink-0">
                    <button
                      onClick={() => handleToggle(habit.id, today)}
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-xl transition-all hover:scale-105"
                      style={{
                        background: completedToday
                          ? habit.color.replace(")", " / 0.20)")
                          : "var(--popover)",
                        border: `2px solid ${completedToday ? habit.color : "var(--border)"}`,
                      }}
                    >
                      {completedToday ? <Check className="w-5 h-5" style={{ color: habit.color }} /> : <HabitGlyph icon={habit.icon} className="w-5 h-5" style={{ color: habit.color }} />}
                    </button>
                  </div>

                  <div className="flex-1 min-w-0 pr-8">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold">{habit.name}</span>
                      {streak > 0 && (
                        <span className="text-xs font-medium text-muted-foreground tabular-nums">
                          {streak}d streak
                        </span>
                      )}
                      <span
                        className="text-xs px-1.5 py-0.5 rounded-md font-medium"
                        style={{ background: catConfig.bg, color: catConfig.accent }}
                      >
                        {catConfig.label}
                      </span>
                    </div>
                    {habit.description && (
                      <p className="text-xs text-muted-foreground">{habit.description}</p>
                    )}
                  </div>
                </div>

                {/* Week grid */}
                <div className="flex items-center justify-between">
                  <WeekGrid
                    habit={habit}
                    completions={habitCompletions}
                    onToggle={(date) => handleToggle(habit.id, date)}
                    today={today}
                  />
                  <div className="text-right ml-3">
                    <p
                      className="text-xs font-bold tabular-nums"
                      style={{ color: habit.color }}
                    >
                      {rangeStat.completed}/{rangeStat.expected}
                    </p>
                    <p className="text-xs text-muted-foreground">last {rangeDays}d · {rangeStat.pct}%</p>
                  </div>
                </div>

                {/* Range history - visible for 30d / 90d so earlier data shows */}
                {rangeDays > 7 && (
                  <div className="mt-3 pt-3 border-t border-border/30">
                    <ActivityHeatmap
                      start={rangeStart}
                      end={rangeEnd}
                      cell={10}
                      color={habit.color}
                      intensityFor={(key, d) =>
                        frequencyApplies(habit.frequency, d.getDay()) &&
                        startOfDay(d).getTime() >= startOfDay(new Date(habit.created_at)).getTime()
                          ? (completedByKey.has(`${habit.id}|${key}`) ? 1 : 0)
                          : null
                      }
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      </>
      )}

      </PageWrapper>

      {/* New habit dialog */}
      <Dialog open={showNewHabit} onOpenChange={(o) => (o ? setShowNewHabit(true) : closeNewHabit())}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Habit</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Habit name *</label>
              <input
                type="text"
                value={newHabit.name}
                onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleCreateHabit(); } }}
                placeholder="e.g. Morning journaling"
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-colors"
                style={{
                  background: "var(--secondary)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                }}
                autoFocus
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Description</label>
              <input
                type="text"
                value={newHabit.description}
                onChange={(e) => setNewHabit({ ...newHabit, description: e.target.value })}
                placeholder="Optional description..."
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-colors"
                style={{
                  background: "var(--secondary)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                }}
              />
            </div>

            {/* Icon selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Icon</label>
              <div className="flex flex-wrap gap-2">
                {HABIT_ICONS.map(({ key, Icon }) => {
                  const active = newHabit.icon === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      title={key}
                      onClick={() => setNewHabit({ ...newHabit, icon: key })}
                      className="w-9 h-9 rounded-lg flex items-center justify-center transition-all"
                      style={{
                        background: active ? "oklch(0.70 0.12 183 / 0.20)" : "var(--secondary)",
                        border: `1px solid ${active ? "oklch(0.70 0.12 183 / 0.50)" : "var(--border)"}`,
                      }}
                    >
                      <Icon className="w-4 h-4" style={{ color: active ? "oklch(0.70 0.12 183)" : "var(--muted-foreground)" }} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Category</label>
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(CATEGORY_COLORS) as HabitCategory[]).map((cat) => {
                  const { accent, bg, label } = CATEGORY_COLORS[cat];
                  const active = newHabit.category === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setNewHabit({ ...newHabit, category: cat })}
                      className="px-3 py-1 rounded-lg text-xs font-semibold transition-all"
                      style={
                        active
                          ? { background: bg, color: accent, border: `1px solid ${accent.replace(")", " / 0.40)")}` }
                          : { background: "var(--secondary)", color: "var(--muted-foreground)", border: "1px solid var(--border)" }
                      }
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Frequency */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Frequency</label>
              <div className="flex gap-2">
                {(["daily", "weekdays", "weekends"] as const).map((freq) => (
                  <button
                    key={freq}
                    type="button"
                    onClick={() => setNewHabit({ ...newHabit, frequency: freq })}
                    className="flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-all"
                    style={
                      newHabit.frequency === freq
                        ? {
                            background: "oklch(0.70 0.12 183 / 0.15)",
                            color: "oklch(0.70 0.12 183)",
                            border: "1px solid oklch(0.70 0.12 183 / 0.40)",
                          }
                        : {
                            background: "var(--secondary)",
                            color: "var(--muted-foreground)",
                            border: "1px solid var(--border)",
                          }
                    }
                  >
                    {freq}
                  </button>
                ))}
              </div>
            </div>

            {createError && (
              <p className="flex items-center gap-1.5 text-xs text-destructive">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {createError}
              </p>
            )}
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={closeNewHabit}
              disabled={creating}
              className="py-2.5 px-4 rounded-xl text-sm font-medium transition-colors disabled:opacity-40"
              style={{
                background: "var(--secondary)",
                color: "var(--muted-foreground)",
                border: "1px solid var(--border)",
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateHabit}
              disabled={!newHabit.name.trim() || creating}
              className="inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
              style={{
                background: "linear-gradient(135deg, oklch(0.70 0.12 183) 0%, oklch(0.71 0.13 215) 100%)",
                color: "oklch(0.07 0.003 28)",
                boxShadow: "0 4px 14px oklch(0.70 0.12 183 / 0.35)",
              }}
            >
              {creating ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Creating…</> : "Create habit"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
