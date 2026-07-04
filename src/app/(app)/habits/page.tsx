"use client";

import { useState, useEffect } from "react";
import { format, subDays } from "date-fns";
import { PageHeader } from "@/components/ui/page-header";
import { PageWrapper } from "@/components/ui/page-wrapper";
import {
  Plus,
  Flame,
  Check,
  Trash2,
  X,
  Target,
  Zap,
  HelpCircle,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { computeHabitScore, DISCIPLINE_WEIGHTS } from "@/lib/discipline";
import { startOfDay } from "date-fns";
import {
  getHabits,
  getHabitCompletions,
  toggleHabitCompletion,
  createHabit,
  deleteHabit,
  getHabitStreak,
  getDailyTasks,
  createDailyTask,
  updateDailyTask,
  deleteDailyTask,
} from "@/lib/supabase/queries";
import type { Habit, HabitCompletion, DailyTask, HabitCategory } from "@/lib/types";

const CATEGORY_COLORS: Record<HabitCategory, { accent: string; bg: string; label: string }> = {
  mindset:  { accent: "oklch(0.72 0.22 45)",  bg: "oklch(0.72 0.22 45 / 0.12)",  label: "Mindset"  },
  routine:  { accent: "oklch(0.72 0.22 45)", bg: "oklch(0.72 0.22 45 / 0.12)", label: "Routine"  },
  research: { accent: "oklch(0.58 0.17 145)", bg: "oklch(0.58 0.17 145 / 0.12)", label: "Research" },
  health:   { accent: "oklch(0.58 0.22 25)",  bg: "oklch(0.58 0.22 25 / 0.12)",  label: "Health"   },
  review:   { accent: "oklch(0.70 0.16 72)",  bg: "oklch(0.70 0.16 72 / 0.12)",  label: "Review"   },
  other:    { accent: "oklch(0.55 0.005 28)",  bg: "oklch(0.55 0.005 28 / 0.12)", label: "Other"    },
};

const PRESET_ICONS = ["✍️", "📊", "🔍", "💪", "🧘", "📚", "💤", "🏃", "🎯", "📈", "🧠", "💧"];

// How far back the insights look. Lets you see beyond just today/this week.
const RANGES = [
  { key: "week", label: "7d", days: 7 },
  { key: "month", label: "30d", days: 30 },
  { key: "quarter", label: "90d", days: 90 },
] as const;
type RangeKey = (typeof RANGES)[number]["key"];

// Whether a habit's frequency expects it on a given weekday (0=Sun … 6=Sat).
function frequencyApplies(freq: Habit["frequency"], weekday: number): boolean {
  if (freq === "weekdays") return weekday >= 1 && weekday <= 5;
  if (freq === "weekends") return weekday === 0 || weekday === 6;
  return true;
}

/** Applicable-day completion for one habit over the last `days` days. */
function habitRangeStat(habit: Habit, completions: HabitCompletion[], days: number) {
  const done = new Set(completions.filter((c) => c.completed).map((c) => c.date));
  let expected = 0;
  let completed = 0;
  for (let i = 0; i < days; i++) {
    const d = subDays(new Date(), i);
    if (!frequencyApplies(habit.frequency, d.getDay())) continue;
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
        stroke="oklch(0.18 0.005 28)"
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
                    background: "oklch(0.14 0.004 28)",
                    borderColor: isToday
                      ? habit.color
                      : "oklch(0.22 0.005 28)",
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

export default function HabitsPage() {
  const today = format(new Date(), "yyyy-MM-dd");
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"high" | "medium" | "low">("medium");
  const [showNewHabit, setShowNewHabit] = useState(false);
  const [deletingHabit, setDeletingHabit] = useState<string | null>(null);
  const [newHabit, setNewHabit] = useState<NewHabitForm>({
    name: "",
    description: "",
    category: "routine",
    frequency: "daily",
    icon: "🎯",
  });

  const [streaks, setStreaks] = useState<Record<string, number>>({});
  const [range, setRange] = useState<RangeKey>("month");
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  const rangeDays = RANGES.find((r) => r.key === range)!.days;

  const refresh = async () => {
    const [h, c, t] = await Promise.all([getHabits(), getHabitCompletions(), getDailyTasks(today)]);
    setHabits(h);
    setCompletions(c);
    setTasks(t);
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
    if (!newHabit.name.trim()) return;
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
    setNewHabit({ name: "", description: "", category: "routine", frequency: "daily", icon: "🎯" });
    setShowNewHabit(false);
  }

  async function handleDeleteHabit(id: string) {
    await deleteHabit(id);
    await refresh();
    setDeletingHabit(null);
  }

  async function handleAddTask() {
    if (!newTaskText.trim()) return;
    await createDailyTask({ date: today, text: newTaskText.trim(), completed: false, priority: newTaskPriority });
    const t = await getDailyTasks(today);
    setTasks(t);
    setNewTaskText("");
  }

  async function handleToggleTask(id: string, completed: boolean) {
    await updateDailyTask(id, { completed: !completed });
    const t = await getDailyTasks(today);
    setTasks(t);
  }

  async function handleDeleteTask(id: string) {
    await deleteDailyTask(id);
    const t = await getDailyTasks(today);
    setTasks(t);
  }

  // Stats
  const totalHabits = habits.length;
  const longestStreak = Object.values(streaks).reduce((max, s) => Math.max(max, s), 0);

  // Range-aware insights — same completion engine as the discipline score.
  const rangeStart = startOfDay(subDays(new Date(), rangeDays - 1));
  const rangeEnd = startOfDay(new Date());
  const rangeCompletion = computeHabitScore(habits, completions, rangeStart, rangeEnd) ?? 0;
  const rangeCompleted = completions.filter((c) => {
    if (!c.completed) return false;
    const d = new Date(c.date + "T12:00:00");
    return d >= rangeStart && d <= rangeEnd;
  }).length;

  const PRIORITY_CONFIG = {
    high:   { label: "High",   style: { color: "oklch(0.58 0.22 25)",  bg: "oklch(0.58 0.22 25 / 0.12)"  } },
    medium: { label: "Medium", style: { color: "oklch(0.70 0.16 72)",  bg: "oklch(0.70 0.16 72 / 0.12)"  } },
    low:    { label: "Low",    style: { color: "oklch(0.55 0.005 28)", bg: "oklch(0.55 0.005 28 / 0.12)" } },
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <PageHeader
        badge="Mindset"
        title="Habits"
        subtitle="Daily habit tracker"
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHowItWorks(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:border-border shrink-0"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="hidden sm:inline">How it works</span>
            </button>
            <button
              onClick={() => setShowNewHabit(true)}
              className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all hover:-translate-y-px shrink-0"
              style={{
                background: "oklch(0.72 0.22 45)",
                color: "oklch(0.07 0.003 28)",
                boxShadow: "0 4px 14px oklch(0.72 0.22 45 / 0.30)",
              }}
            >
              <Plus className="w-4 h-4" />
              New habit
            </button>
          </div>
        }
      />
      <PageWrapper>
      {/* Insights header + range toggle — look beyond just today */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4" style={{ color: "oklch(0.72 0.22 45)" }} />
          <h2 className="text-sm font-semibold">Insights</h2>
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

      {/* Summary stats — range-aware */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Completion Rate",
            value: `${rangeCompletion}%`,
            sub: `last ${rangeDays} days`,
            icon: Target,
            accent: "oklch(0.72 0.22 45)",
            accentBg: "oklch(0.72 0.22 45 / 0.10)",
            ring: rangeCompletion,
          },
          {
            label: "Longest Streak",
            value: `${longestStreak}d`,
            sub: "consecutive days",
            icon: Flame,
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
            accent: "oklch(0.72 0.22 45)",
            accentBg: "oklch(0.72 0.22 45 / 0.10)",
            ring: null,
          },
        ].map(({ label, value, sub, icon: Icon, accent, accentBg, ring }, i) => (
          <div
            key={label}
            className="animate-fade-up rounded-xl p-5 relative overflow-hidden"
            style={{
              background: "oklch(0.10 0.003 28)",
              border: "1px solid oklch(0.18 0.005 28)",
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

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Habits list */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-sm font-semibold animate-fade-up" style={{ animationDelay: "200ms" }}>
            Daily Habits
          </h2>

          {habits.length === 0 && (
            <div
              className="rounded-xl p-10 text-center animate-fade-up"
              style={{
                background: "oklch(0.10 0.003 28)",
                border: "1px solid oklch(0.18 0.005 28 / 0.5)",
                borderStyle: "dashed",
              }}
            >
              <p className="text-sm text-muted-foreground mb-3">No habits yet.</p>
              <button
                onClick={() => setShowNewHabit(true)}
                className="text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
                style={{ color: "oklch(0.72 0.22 45)" }}
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
                  background: "oklch(0.10 0.003 28)",
                  border: `1px solid ${completedToday ? habit.color.replace(")", " / 0.25)") : "oklch(0.18 0.005 28)"}`,
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
                  {/* Emoji + completion ring */}
                  <div className="relative shrink-0">
                    <button
                      onClick={() => handleToggle(habit.id, today)}
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-xl transition-all hover:scale-105"
                      style={{
                        background: completedToday
                          ? habit.color.replace(")", " / 0.20)")
                          : "oklch(0.13 0.004 28)",
                        border: `2px solid ${completedToday ? habit.color : "oklch(0.22 0.005 28)"}`,
                      }}
                    >
                      {completedToday ? <Check className="w-5 h-5" style={{ color: habit.color }} /> : habit.icon}
                    </button>
                  </div>

                  <div className="flex-1 min-w-0 pr-8">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold">{habit.name}</span>
                      {streak > 0 && (
                        <span
                          className="inline-flex items-center gap-0.5 text-xs font-bold px-1.5 py-0.5 rounded-full"
                          style={{
                            background: "oklch(0.58 0.22 25 / 0.15)",
                            color: "oklch(0.70 0.16 72)",
                          }}
                        >
                          <Flame className="w-2.5 h-2.5" />
                          {streak}
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
              </div>
            );
          })}
        </div>

        {/* Daily task planner */}
        <div className="space-y-3 animate-fade-up" style={{ animationDelay: "300ms" }}>
          <h2 className="text-sm font-semibold">Daily Planner</h2>

          {/* Add task */}
          <div
            className="rounded-xl p-4"
            style={{
              background: "oklch(0.10 0.003 28)",
              border: "1px solid oklch(0.18 0.005 28)",
            }}
          >
            <input
              type="text"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
              placeholder="Add a task for today..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/50 mb-3"
            />
            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                {(["high", "medium", "low"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setNewTaskPriority(p)}
                    className="px-2 py-0.5 rounded-md text-xs font-medium capitalize transition-all"
                    style={
                      newTaskPriority === p
                        ? {
                            background: PRIORITY_CONFIG[p].style.bg,
                            color: PRIORITY_CONFIG[p].style.color,
                          }
                        : { color: "oklch(0.40 0.005 28)" }
                    }
                  >
                    {p}
                  </button>
                ))}
              </div>
              <button
                onClick={handleAddTask}
                disabled={!newTaskText.trim()}
                className="text-xs px-3 py-1 rounded-lg font-semibold transition-all disabled:opacity-30"
                style={{
                  background: "oklch(0.72 0.22 45)",
                  color: "oklch(0.07 0.003 28)",
                }}
              >
                Add
              </button>
            </div>
          </div>

          {/* Task list */}
          <div className="space-y-2">
            {tasks.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-6">
                No tasks for today. Add one above.
              </p>
            )}
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-start gap-3 rounded-xl px-4 py-3 group transition-all"
                style={{
                  background: task.completed
                    ? "oklch(0.10 0.003 28)"
                    : "oklch(0.10 0.003 28)",
                  border: `1px solid ${task.completed ? "oklch(0.18 0.005 28)" : "oklch(0.18 0.005 28)"}`,
                }}
              >
                <button
                  onClick={() => handleToggleTask(task.id, task.completed)}
                  className="w-4 h-4 rounded shrink-0 mt-0.5 flex items-center justify-center transition-all border"
                  style={
                    task.completed
                      ? {
                          background: "oklch(0.58 0.17 145 / 0.20)",
                          borderColor: "oklch(0.58 0.17 145)",
                        }
                      : {
                          background: "transparent",
                          borderColor: "oklch(0.30 0.005 28)",
                        }
                  }
                >
                  {task.completed && (
                    <Check className="w-2.5 h-2.5" style={{ color: "oklch(0.58 0.17 145)" }} />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p
                    className={cn("text-sm leading-snug", task.completed && "line-through")}
                    style={{ color: task.completed ? "oklch(0.40 0.005 28)" : "oklch(0.90 0.003 28)" }}
                  >
                    {task.text}
                  </p>
                  <span
                    className="text-xs font-medium capitalize"
                    style={{ color: PRIORITY_CONFIG[task.priority].style.color }}
                  >
                    {task.priority}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Task summary */}
          {tasks.length > 0 && (
            <div
              className="rounded-xl px-4 py-3 flex items-center justify-between"
              style={{
                background: "oklch(0.10 0.003 28)",
                border: "1px solid oklch(0.18 0.005 28)",
              }}
            >
              <span className="text-xs text-muted-foreground">
                {tasks.filter((t) => t.completed).length}/{tasks.length} done
              </span>
              <div className="flex items-center gap-1">
                {tasks.map((t) => (
                  <div
                    key={t.id}
                    className="w-2 h-2 rounded-full"
                    style={{
                      background: t.completed
                        ? "oklch(0.58 0.17 145)"
                        : PRIORITY_CONFIG[t.priority].style.color,
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      </PageWrapper>

      {/* How it works modal — explains the discipline calc + why habits matter */}
      {showHowItWorks && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "oklch(0 0 0 / 70%)", backdropFilter: "blur(6px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowHowItWorks(false); }}
        >
          <div
            className="w-full max-w-lg rounded-2xl p-6 animate-fade-up max-h-[85vh] overflow-y-auto"
            style={{
              background: "oklch(0.13 0.004 28)",
              border: "1px solid oklch(0.25 0.005 28)",
              boxShadow: "0 24px 64px oklch(0 0 0 / 0.5)",
            }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold flex items-center gap-2">
                <Target className="w-4 h-4" style={{ color: "oklch(0.72 0.22 45)" }} />
                How your Discipline Score works
              </h2>
              <button onClick={() => setShowHowItWorks(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-5 text-sm leading-relaxed text-muted-foreground">
              <p>
                Discipline isn&apos;t only what happens at the screen — it&apos;s the whole routine around your trading.
                Your score blends the two things you actually control:
              </p>

              {/* The weighting */}
              <div className="space-y-2">
                {[
                  { label: "Trade rules", w: Math.round(DISCIPLINE_WEIGHTS.tradeRules * 100), desc: "Your per-trade discipline checklist, averaged over the period." },
                  { label: "Habits", w: Math.round(DISCIPLINE_WEIGHTS.habits * 100), desc: "How consistently you complete your habits across the period." },
                ].map(({ label, w, desc }) => (
                  <div key={label} className="rounded-xl p-3" style={{ background: "oklch(0.10 0.003 28)", border: "1px solid oklch(0.18 0.005 28)" }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-foreground">{label}</span>
                      <span className="text-xs font-bold tabular-nums" style={{ color: "oklch(0.72 0.22 45)" }}>{w}%</span>
                    </div>
                    <p className="text-xs">{desc}</p>
                  </div>
                ))}
                <p className="text-xs text-center pt-1">
                  Total&nbsp;=&nbsp;{Math.round(DISCIPLINE_WEIGHTS.tradeRules * 100)}% × trade-rule adherence&nbsp;+&nbsp;{Math.round(DISCIPLINE_WEIGHTS.habits * 100)}% × habit completion
                </p>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs">
                  Habit completion is measured across <span className="text-foreground font-medium">every applicable day</span> in the
                  period (respecting each habit&apos;s daily / weekday / weekend schedule), so showing up consistently scores higher than
                  cramming everything into one day. If one side has no data yet — no habits set, or no scored trades — the other stands alone.
                </p>
              </div>

              {/* Why it matters */}
              <div className="rounded-xl p-4" style={{ background: "oklch(0.72 0.22 45 / 0.06)", border: "1px solid oklch(0.72 0.22 45 / 0.20)" }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "oklch(0.72 0.22 45)" }}>
                  Why habits make you a better trader
                </p>
                <p className="text-xs">
                  Sleep, preparation, journaling and review habits are what keep your decisions stable. A rested, prepared trader
                  takes fewer impulsive entries, respects risk, and sticks to the plan when it matters. The discipline you build
                  away from the charts is exactly what shows up on them — that&apos;s why habits are part of the score, not a separate box.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowHowItWorks(false)}
              className="mt-6 w-full py-2.5 rounded-xl text-sm font-bold transition-all"
              style={{
                background: "linear-gradient(135deg, oklch(0.72 0.22 45) 0%, oklch(0.82 0.16 82) 100%)",
                color: "oklch(0.07 0.003 28)",
                boxShadow: "0 4px 14px oklch(0.72 0.22 45 / 0.35)",
              }}
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* New habit modal */}
      {showNewHabit && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "oklch(0 0 0 / 70%)", backdropFilter: "blur(6px)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowNewHabit(false);
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6 animate-fade-up"
            style={{
              background: "oklch(0.13 0.004 28)",
              border: "1px solid oklch(0.25 0.005 28)",
              boxShadow: "0 24px 64px oklch(0 0 0 / 0.5)",
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-bold">New Habit</h2>
              <button
                onClick={() => setShowNewHabit(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Habit name *</label>
                <input
                  type="text"
                  value={newHabit.name}
                  onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                  placeholder="e.g. Morning journaling"
                  className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-colors"
                  style={{
                    background: "oklch(0.08 0.003 28)",
                    border: "1px solid oklch(0.26 0.005 28)",
                    color: "oklch(0.94 0.002 28)",
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
                    background: "oklch(0.08 0.003 28)",
                    border: "1px solid oklch(0.26 0.005 28)",
                    color: "oklch(0.94 0.002 28)",
                  }}
                />
              </div>

              {/* Icon selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_ICONS.map((icon) => (
                    <button
                      key={icon}
                      onClick={() => setNewHabit({ ...newHabit, icon })}
                      className="w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all"
                      style={{
                        background:
                          newHabit.icon === icon
                            ? "oklch(0.72 0.22 45 / 0.20)"
                            : "oklch(0.08 0.003 28)",
                        border: `1px solid ${newHabit.icon === icon ? "oklch(0.72 0.22 45 / 0.50)" : "oklch(0.18 0.005 28)"}`,
                      }}
                    >
                      {icon}
                    </button>
                  ))}
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
                        onClick={() => setNewHabit({ ...newHabit, category: cat })}
                        className="px-3 py-1 rounded-lg text-xs font-semibold transition-all"
                        style={
                          active
                            ? { background: bg, color: accent, border: `1px solid ${accent.replace(")", " / 0.40)")}` }
                            : { background: "oklch(0.08 0.003 28)", color: "oklch(0.50 0.005 28)", border: "1px solid oklch(0.18 0.005 28)" }
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
                      onClick={() => setNewHabit({ ...newHabit, frequency: freq })}
                      className="flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-all"
                      style={
                        newHabit.frequency === freq
                          ? {
                              background: "oklch(0.72 0.22 45 / 0.15)",
                              color: "oklch(0.72 0.22 45)",
                              border: "1px solid oklch(0.72 0.22 45 / 0.40)",
                            }
                          : {
                              background: "oklch(0.08 0.003 28)",
                              color: "oklch(0.50 0.005 28)",
                              border: "1px solid oklch(0.18 0.005 28)",
                            }
                      }
                    >
                      {freq}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNewHabit(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors"
                style={{
                  background: "oklch(0.08 0.003 28)",
                  color: "oklch(0.55 0.005 28)",
                  border: "1px solid oklch(0.18 0.005 28)",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateHabit}
                disabled={!newHabit.name.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
                style={{
                  background: "linear-gradient(135deg, oklch(0.72 0.22 45) 0%, oklch(0.82 0.16 82) 100%)",
                  color: "oklch(0.07 0.003 28)",
                  boxShadow: "0 4px 14px oklch(0.72 0.22 45 / 0.35)",
                }}
              >
                Create habit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
