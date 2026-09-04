"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format, subDays } from "date-fns";
import {
  Plus,
  Check,
  Pencil,
  Trash2,
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

/**
 * Fade any colour string to an alpha, whatever notation it arrives in.
 *
 * Habit colours are persisted on the row (`habits.color`), so the database
 * still holds the legacy `oklch(...)` strings written by older builds while new
 * habits are saved with the palette hex below. This handles both, plus CSS
 * variables — the old `color.replace(")", " / 0.2)")` trick silently produced
 * an opaque colour for anything that wasn't a bare `oklch()`.
 */
function fade(color: string, a: number): string {
  const c = color.trim();
  if (c.startsWith("#")) {
    const h = c.slice(1);
    const full = h.length === 3 ? h.split("").map((x) => x + x).join("") : h;
    const n = parseInt(full, 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
  }
  // Modern space-separated oklch()/rgb()/hsl() carrying no alpha — the only
  // shape that takes CSS relative-alpha syntax. Matched on the function name
  // rather than a trailing ")", so `var(--x)` does not land here and become the
  // invalid `var(--x / 0.2)`; comma forms are excluded too, since
  // `rgb(1,2,3 / 0.5)` mixes the legacy and modern grammars and is invalid.
  if (
    /^(?:oklch|oklab|rgb|hsl|lab|lch)\(/.test(c) &&
    !c.includes("/") &&
    !c.includes(",")
  ) {
    return c.replace(/\)$/, ` / ${a})`);
  }
  // var(--x), color-mix(), or a value that already carries an alpha.
  return `color-mix(in oklch, ${c} ${Math.round(a * 100)}%, transparent)`;
}

/** Category identity, drawn from the product palette (no orange anywhere). */
const CATEGORY_COLORS: Record<HabitCategory, { accent: string; bg: string; label: string; Icon: IconComponent }> = {
  mindset:  { accent: "#14B8A6", bg: "rgba(20,184,166,0.12)", label: "Mindset",  Icon: Brain },
  routine:  { accent: "#06B6D4", bg: "rgba(6,182,212,0.12)",  label: "Routine",  Icon: Coffee },
  research: { accent: "#22c55e", bg: "rgba(34,197,94,0.12)",  label: "Research", Icon: Search },
  health:   { accent: "#ef4444", bg: "rgba(239,68,68,0.12)",  label: "Health",   Icon: Dumbbell },
  review:   { accent: "#f59e0b", bg: "rgba(245,158,11,0.12)", label: "Review",   Icon: BookOpen },
  other:    { accent: "var(--muted-foreground)", bg: "rgba(100,116,139,0.12)", label: "Other", Icon: Circle },
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
                bg = fade(color, Number(a.toFixed(2)));
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
    <div className="flex items-center gap-1">
      {days.map((date) => {
        const isToday = date === today;
        const done = completedSet.has(date);
        return (
          <button
            key={date}
            onClick={() => onToggle(date)}
            title={format(new Date(date + "T12:00:00"), "EEE MMM d")}
            className={cn(
              "flex h-[22px] w-[22px] items-center justify-center rounded-md border text-[9px] font-bold transition-all duration-150",
              isToday && "ring-1",
              done
                ? "border-transparent"
                : "border-dashed hover:border-solid"
            )}
            style={
              done
                ? {
                    background: fade(habit.color, 0.2),
                    borderColor: habit.color,
                    color: habit.color,
                  }
                : {
                    background: "var(--muted)",
                    borderColor: isToday
                      ? habit.color
                      : "var(--border)",
                    color: "var(--muted-foreground)",
                  }
            }
          >
            {done ? (
              <Check className="h-3 w-3" strokeWidth={3} />
            ) : (
              <span className="tabular-nums">{format(new Date(date + "T12:00:00"), "d")}</span>
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

  // Today is the part that asks for an action, so it is measured on its own:
  // only the habits whose frequency actually applies today count here.
  const todayHabits = habits.filter((h) => frequencyApplies(h.frequency, new Date().getDay()));
  const doneTodaySet = new Set(completions.filter((c) => c.date === today && c.completed).map((c) => c.habit_id));
  const doneToday = todayHabits.filter((h) => doneTodaySet.has(h.id)).length;
  const todayPct = todayHabits.length ? Math.round((doneToday / todayHabits.length) * 100) : 0;

  return (
    <div className="space-y-3">
      {/* ── Today ──────────────────────────────────────────────────────────
          One question, answered at a glance and answerable in one click:
          what is still open today. Everything historical sits below. */}
      <AccentPanel
        accent="primary"
        eyebrow={format(new Date(), "EEEE d MMMM")}
        title="Today"
        headerRight={
          <div className="flex items-center gap-3">
            <Link
              href="/discipline"
              className="hidden text-[11px] font-semibold text-muted-foreground transition-colors hover:text-primary sm:inline"
            >
              How habits score
            </Link>
            <button
              onClick={() => setShowNewHabit(true)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-transform duration-200 hover:-translate-y-px"
              style={{ background: "#14B8A6", boxShadow: "0 2px 12px rgba(20,184,166,0.26)" }}
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.5} /> New habit
            </button>
          </div>
        }
      >
        {habits.length === 0 ? (
          <div className="mt-4 flex flex-col items-center gap-2 rounded-xl border border-dashed border-border/60 py-8 text-center">
            <p className="text-sm text-muted-foreground">No habits yet.</p>
            <p className="max-w-sm text-xs text-muted-foreground/70">
              Habits are the reps you do away from the chart. Add the ones you want to hold yourself to and they show up
              here every day.
            </p>
            <button
              onClick={() => setShowNewHabit(true)}
              className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold"
              style={{ color: "#14B8A6" }}
            >
              <Plus className="h-3.5 w-3.5" /> Create your first habit
            </button>
          </div>
        ) : (
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
            {/* The count, and the same count as a ring */}
            <div className="flex shrink-0 items-center gap-3">
              <div className="relative">
                <ProgressRing percent={todayPct} size={44} stroke={3.5} color="#14B8A6" />
                <span className="absolute inset-0 flex items-center justify-center text-[11px] font-black tabular-nums text-primary">
                  {todayPct}
                </span>
              </div>
              <div>
                <p className="text-xl font-black leading-none tabular-nums text-foreground">
                  {doneToday}
                  <span className="text-muted-foreground/50"> / {todayHabits.length}</span>
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground/70">
                  {todayHabits.length === 0
                    ? "nothing scheduled today"
                    : doneToday === todayHabits.length
                    ? "all done — that is the day won"
                    : `${todayHabits.length - doneToday} still open`}
                </p>
              </div>
            </div>

            {/* Tap a habit to tick it off */}
            <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
              {todayHabits.length === 0 ? (
                <p className="text-xs text-muted-foreground/60">
                  None of your habits run on a {format(new Date(), "EEEE")}.
                </p>
              ) : (
                todayHabits.map((habit) => {
                  const done = doneTodaySet.has(habit.id);
                  return (
                    <button
                      key={habit.id}
                      onClick={() => handleToggle(habit.id, today)}
                      className={cn(
                        "group/chip inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 transition-all duration-200 hover:-translate-y-px",
                        done ? "border-transparent" : "border-dashed border-border/70 hover:border-solid"
                      )}
                      style={done ? { background: fade(habit.color, 0.16), borderColor: fade(habit.color, 0.5) } : undefined}
                    >
                      <span
                        className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px]"
                        style={{ background: done ? habit.color : "transparent", border: done ? "none" : "1px solid var(--border)" }}
                      >
                        {done ? (
                          <Check className="h-3 w-3 text-background" strokeWidth={3.5} />
                        ) : (
                          <HabitGlyph icon={habit.icon} className="h-2.5 w-2.5" style={{ color: habit.color }} />
                        )}
                      </span>
                      <span className={cn("text-xs font-medium", done ? "text-foreground" : "text-muted-foreground")}>
                        {habit.name}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </AccentPanel>

      {/* ── The record ─────────────────────────────────────────────────────
          One line per habit rather than a grid of cards: the whole practice
          fits on a screen, and every habit is compared on the same axis. */}
      {habits.length > 0 && (
        <AccentPanel
          accent="cyan"
          eyebrow="The record"
          title="Consistency"
          headerRight={
            <div className="flex items-center gap-2.5">
              {RANGES.map((r) => (
                <button
                  key={r.key}
                  onClick={() => setRange(r.key)}
                  className={cn(
                    "border-b pb-px text-[11px] font-semibold uppercase tracking-wider transition-colors",
                    range === r.key ? "border-primary text-primary" : "border-transparent text-muted-foreground/50 hover:text-foreground"
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          }
        >
          {/* The three numbers worth stating outright, in a sentence rather than four cards */}
          <p className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[12px] text-muted-foreground/80">
            <span>
              <span className="text-base font-black tabular-nums text-primary">{rangeCompletion}%</span> of scheduled
              reps kept over the last {rangeDays} days
            </span>
            <span className="text-border">·</span>
            <span>
              longest streak <span className="font-bold tabular-nums text-foreground/85">{longestStreak}d</span>
            </span>
            <span className="text-border">·</span>
            <span>
              <span className="font-bold tabular-nums text-foreground/85">{rangeCompleted}</span> completions
            </span>
            <span className="text-border">·</span>
            <span>
              <span className="font-bold tabular-nums text-foreground/85">{totalHabits}</span> habits tracked
            </span>
          </p>

          <div className="mt-3 border-t border-border/40">
            {/* Column key, stated once */}
            <div className="grid grid-cols-[1.6rem_1fr_4.5rem_auto] items-center gap-x-3 border-b border-border/30 py-1.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/45 sm:grid-cols-[1.6rem_1fr_4.5rem_auto_5.5rem]">
              <span />
              <span>Habit</span>
              <span className="text-right">Streak</span>
              <span className="hidden text-center sm:block">Last 7 days</span>
              <span className="hidden text-right sm:block">Last {rangeDays}d</span>
            </div>

            {habits.map((habit) => {
              const streak = streaks[habit.id] ?? 0;
              const habitCompletions = completions.filter((c) => c.habit_id === habit.id);
              const completedToday = doneTodaySet.has(habit.id);
              const appliesToday = frequencyApplies(habit.frequency, new Date().getDay());
              const stat = habitRangeStat(habit, habitCompletions, rangeDays);
              const cat = CATEGORY_COLORS[habit.category];

              return (
                <div
                  key={habit.id}
                  className="group grid grid-cols-[1.6rem_1fr_4.5rem_auto] items-center gap-x-3 border-b border-border/20 py-2 transition-colors last:border-0 hover:bg-muted/15 sm:grid-cols-[1.6rem_1fr_4.5rem_auto_5.5rem]"
                >
                  {/* Tick today off, straight from the row */}
                  <button
                    onClick={() => handleToggle(habit.id, today)}
                    title={appliesToday ? (completedToday ? "Done today" : "Mark done today") : "Not scheduled today"}
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-md border transition-all",
                      !appliesToday && "opacity-35"
                    )}
                    style={{
                      background: completedToday ? fade(habit.color, 0.2) : "transparent",
                      borderColor: completedToday ? habit.color : "var(--border)",
                    }}
                  >
                    {completedToday
                      ? <Check className="h-3.5 w-3.5" strokeWidth={3} style={{ color: habit.color }} />
                      : <HabitGlyph icon={habit.icon} className="h-3 w-3" style={{ color: habit.color }} />}
                  </button>

                  {/* Name, category and — on hover — the edit controls */}
                  <div className="flex min-w-0 items-baseline gap-2">
                    <span className="truncate text-[13px] font-semibold text-foreground">{habit.name}</span>
                    <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider" style={{ color: cat.accent }}>
                      {cat.label}
                    </span>
                    {habit.description && (
                      <span className="hidden min-w-0 truncate text-[11px] text-muted-foreground/55 xl:inline">
                        {habit.description}
                      </span>
                    )}
                    {deletingHabit === habit.id ? (
                      <span className="ml-auto flex shrink-0 items-center gap-1.5 text-[11px]">
                        <span className="text-destructive">Delete?</span>
                        <button onClick={() => handleDeleteHabit(habit.id)} className="font-semibold text-destructive hover:underline">Yes</button>
                        <button onClick={() => setDeletingHabit(null)} className="text-muted-foreground hover:text-foreground">No</button>
                      </span>
                    ) : (
                      <span className="ml-auto flex shrink-0 items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                        <button onClick={() => openEdit(habit)} aria-label="Edit habit" className="text-muted-foreground hover:text-primary">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => setDeletingHabit(habit.id)} aria-label="Delete habit" className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    )}
                  </div>

                  {/* Streak */}
                  <span className="text-right text-[12px] font-bold tabular-nums" style={{ color: streak > 0 ? habit.color : "var(--muted-foreground)" }}>
                    {streak > 0 ? `${streak}d` : "—"}
                  </span>

                  {/* The week, still clickable — a missed day can be fixed here */}
                  <div className="hidden justify-center sm:flex">
                    <WeekGrid
                      habit={habit}
                      completions={habitCompletions}
                      onToggle={(date) => handleToggle(habit.id, date)}
                      today={today}
                    />
                  </div>

                  {/* Where the habit stands over the chosen window */}
                  <div className="hidden sm:block">
                    <div className="flex items-baseline justify-end gap-1.5">
                      <span className="text-[12px] font-bold tabular-nums" style={{ color: habit.color }}>{stat.pct}%</span>
                      <span className="text-[10px] tabular-nums text-muted-foreground/50">{stat.completed}/{stat.expected}</span>
                    </div>
                    <span className="mt-1 block h-[3px] w-full overflow-hidden rounded-full bg-border/60">
                      <span className="block h-full rounded-full" style={{ width: `${stat.pct}%`, background: habit.color }} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* The long view — only worth the space once the window is longer than the week strip above */}
          {rangeDays > 7 && (
            <div className="mt-4 space-y-2 border-t border-border/40 pt-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                Last {rangeDays} days, day by day
              </p>
              <div className="space-y-1.5 overflow-x-auto">
                {habits.map((habit) => (
                  <div key={habit.id} className="flex items-center gap-3">
                    <span className="w-28 shrink-0 truncate text-[11px] text-muted-foreground/70">{habit.name}</span>
                    <ActivityHeatmap
                      start={rangeStart}
                      end={rangeEnd}
                      cell={9}
                      color={habit.color}
                      intensityFor={(key, d) =>
                        frequencyApplies(habit.frequency, d.getDay()) &&
                        startOfDay(d).getTime() >= startOfDay(new Date(habit.created_at)).getTime()
                          ? (completedByKey.has(`${habit.id}|${key}`) ? 1 : 0)
                          : null
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </AccentPanel>
      )}

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
                        background: active ? "rgba(20,184,166,0.2)" : "var(--secondary)",
                        border: `1px solid ${active ? "rgba(20,184,166,0.5)" : "var(--border)"}`,
                      }}
                    >
                      <Icon className="w-4 h-4" style={{ color: active ? "#14B8A6" : "var(--muted-foreground)" }} />
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
                          ? { background: bg, color: accent, border: `1px solid ${fade(accent, 0.4)}` }
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
                            background: "rgba(20,184,166,0.15)",
                            color: "#14B8A6",
                            border: "1px solid rgba(20,184,166,0.4)",
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
                background: "linear-gradient(135deg, #14B8A6 0%, #06B6D4 100%)",
                color: "#F8FAFC",
                boxShadow: "0 4px 14px rgba(20,184,166,0.35)",
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
