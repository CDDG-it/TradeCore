"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format, subDays } from "date-fns";
import {
  Plus,
  Repeat,
  Check,
  Pencil,
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
import { LiquidGlassCard } from "@/components/ui/liquid-glass-card";
import { AccentPanel } from "@/components/ui/accent-panel";
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
  updateHabit,
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

export function HabitsView() {
  const today = format(new Date(), "yyyy-MM-dd");
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [showNewHabit, setShowNewHabit] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingHabit, setDeletingHabit] = useState<string | null>(null);
  const [newHabit, setNewHabit] = useState<NewHabitForm>(EMPTY_NEW_HABIT);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [streaks, setStreaks] = useState<Record<string, number>>({});
  const [range, setRange] = useState<RangeKey>("week");

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

  function openEdit(habit: Habit) {
    setEditingId(habit.id);
    setCreateError(null);
    setNewHabit({
      name: habit.name,
      description: habit.description ?? "",
      category: habit.category,
      frequency: habit.frequency === "weekdays" || habit.frequency === "weekends" ? habit.frequency : "daily",
      icon: habit.icon,
    });
    setShowNewHabit(true);
  }

  async function handleSaveHabit() {
    if (!newHabit.name.trim() || creating) return;
    setCreating(true);
    setCreateError(null);
    try {
      const cat = CATEGORY_COLORS[newHabit.category];
      const payload = {
        name: newHabit.name.trim(),
        description: newHabit.description.trim(),
        category: newHabit.category,
        frequency: newHabit.frequency,
        target_days: newHabit.frequency === "daily" ? 7 : newHabit.frequency === "weekdays" ? 5 : 2,
        color: cat.accent,
        icon: newHabit.icon,
      };
      if (editingId) {
        await updateHabit(editingId, payload);
      } else {
        await createHabit(payload);
      }
      await refresh();
      setNewHabit(EMPTY_NEW_HABIT);
      setEditingId(null);
      setShowNewHabit(false);
    } catch (err) {
      console.error("Failed to save habit:", err);
      setCreateError(`Could not ${editingId ? "update" : "create"} habit. Please try again.`);
    } finally {
      setCreating(false);
    }
  }

  function closeNewHabit() {
    if (creating) return;
    setShowNewHabit(false);
    setEditingId(null);
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

  // Fast lookup for the per-habit range heatmaps (shown for 30d / 90d).
  const completedByKey = new Set(
    completions.filter((c) => c.completed).map((c) => `${c.habit_id}|${c.date}`)
  );

  return (
    <div className="space-y-3">
      {/* Compact toolbar: range · how it works · new habit */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg border border-border/50 overflow-hidden">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={cn(
                "px-2.5 py-1.5 text-xs font-medium transition-colors",
                range === r.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>

        <Link
          href="/discipline"
          className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all hover:-translate-y-px"
          style={{
            background: "oklch(0.70 0.12 183 / 0.12)",
            borderColor: "oklch(0.70 0.12 183 / 0.40)",
            color: "oklch(0.70 0.12 183)",
          }}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          How it works
        </Link>

        <button
          onClick={() => setShowNewHabit(true)}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-all hover:-translate-y-px shrink-0"
          style={{
            background: "oklch(0.70 0.12 183)",
            color: "oklch(0.07 0.003 28)",
            boxShadow: "0 4px 14px oklch(0.70 0.12 183 / 0.30)",
          }}
        >
          <Plus className="w-4 h-4" />
          New habit
        </button>
      </div>

      {/* Compact stat strip — one line each, no tall cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {[
          { label: "Completion", value: `${rangeCompletion}%`, sub: `last ${rangeDays}d`, icon: CheckCircle2, accent: "oklch(0.70 0.12 183)", ring: rangeCompletion },
          { label: "Longest streak", value: `${longestStreak}d`, sub: "in a row", icon: Repeat, accent: "oklch(0.58 0.22 25)", ring: null },
          { label: "Completed", value: rangeCompleted.toString(), sub: `last ${rangeDays}d`, icon: TrendingUp, accent: "oklch(0.58 0.17 145)", ring: null },
          { label: "Active", value: totalHabits.toString(), sub: "tracked", icon: Zap, accent: "oklch(0.70 0.12 183)", ring: null },
        ].map(({ label, value, sub, icon: Icon, accent, ring }) => (
          <LiquidGlassCard key={label} className="flex items-center gap-2.5 px-3 py-2">
            {ring !== null ? (
              <div className="relative shrink-0">
                <ProgressRing percent={ring} size={30} stroke={3} color={accent} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Icon className="w-3 h-3" style={{ color: accent }} />
                </div>
              </div>
            ) : (
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: accent.replace(")", " / 0.12)") }}>
                <Icon className="w-3.5 h-3.5" style={{ color: accent }} />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-lg font-black leading-none tabular-nums" style={{ color: accent }}>{value}</p>
              <p className="text-[10px] text-muted-foreground truncate">{label} · {sub}</p>
            </div>
          </LiquidGlassCard>
        ))}
      </div>

      {/* Habits grid — two columns on wide screens keeps everything above the fold */}
      <AccentPanel
        accent="primary"
        eyebrow="Daily reps"
        title="Daily Habits"
        headerRight={
          habits.length > 0 ? (
            <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
              {(Object.keys(CATEGORY_COLORS) as HabitCategory[]).map((cat) => {
                const { accent, bg, label, Icon } = CATEGORY_COLORS[cat];
                return (
                  <span key={cat} className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                    <span className="flex h-3.5 w-3.5 items-center justify-center rounded" style={{ background: bg }}>
                      <Icon className="w-2 h-2" style={{ color: accent }} />
                    </span>
                    {label}
                  </span>
                );
              })}
            </div>
          ) : undefined
        }
      >
        <div className="mt-4 space-y-2.5">

          {habits.length === 0 && (
            <LiquidGlassCard className="p-8 text-center animate-fade-up border-dashed">
              <p className="text-sm text-muted-foreground mb-3">No habits yet.</p>
              <button
                onClick={() => setShowNewHabit(true)}
                className="text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
                style={{ color: "oklch(0.70 0.12 183)" }}
              >
                <Plus className="w-3.5 h-3.5" /> Create your first habit
              </button>
            </LiquidGlassCard>
          )}

          <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {habits.map((habit, i) => {
            const streak = streaks[habit.id] ?? 0;
            const habitCompletions = completions.filter((c) => c.habit_id === habit.id);
            const completedToday = habitCompletions.some(
              (c) => c.date === today && c.completed
            );
            const rangeStat = habitRangeStat(habit, habitCompletions, rangeDays);
            const catConfig = CATEGORY_COLORS[habit.category];

            return (
              <LiquidGlassCard
                key={habit.id}
                className="group animate-fade-up p-3.5"
                style={{
                  animationDelay: `${220 + i * 50}ms`,
                  ...(completedToday
                    ? { borderColor: habit.color.replace(")", " / 0.35)") }
                    : {}),
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
                  <div className="absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(habit)}
                      aria-label="Edit habit"
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingHabit(habit.id)}
                      aria-label="Delete habit"
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div className="flex items-start gap-3 mb-3">
                  {/* Figure + completion ring */}
                  <div className="relative shrink-0">
                    <button
                      onClick={() => handleToggle(habit.id, today)}
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all hover:scale-105"
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

                  <div className="flex-1 min-w-0 pr-12">
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
              </LiquidGlassCard>
            );
          })}
          </div>
        </div>
      </AccentPanel>

      {/* New habit dialog */}
      <Dialog open={showNewHabit} onOpenChange={(o) => (o ? setShowNewHabit(true) : closeNewHabit())}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Habit" : "New Habit"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Habit name *</label>
              <input
                type="text"
                value={newHabit.name}
                onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSaveHabit(); } }}
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
              onClick={handleSaveHabit}
              disabled={!newHabit.name.trim() || creating}
              className="inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
              style={{
                background: "linear-gradient(135deg, oklch(0.70 0.12 183) 0%, oklch(0.71 0.13 215) 100%)",
                color: "oklch(0.07 0.003 28)",
                boxShadow: "0 4px 14px oklch(0.70 0.12 183 / 0.35)",
              }}
            >
              {creating
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {editingId ? "Saving…" : "Creating…"}</>
                : editingId ? "Save changes" : "Create habit"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
