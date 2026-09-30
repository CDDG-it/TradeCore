"use client";

import { useEffect, useMemo, useState } from "react";
import { addMonths, addWeeks, eachDayOfInterval, endOfMonth, endOfWeek, format, isAfter, isSameDay, startOfDay, startOfMonth, startOfWeek, subMonths, subWeeks } from "date-fns";
import { AlertCircle, Brain, BookOpen, Check, ChevronLeft, ChevronRight, Circle, Coffee, Dumbbell, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { frequencyApplies, CATEGORY_ACCENT } from "@/lib/habits";
import { HABIT_ICONS, HabitGlyph } from "@/components/habit-glyph";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createHabit, deleteHabit, getHabitCompletions, getHabits, getHabitStreak, toggleHabitCompletion, updateHabit } from "@/lib/supabase/queries";
import type { Habit, HabitCategory, HabitCompletion } from "@/lib/types";

type IconComponent = React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
type CalendarRange = "week" | "month" | "all";

function fade(color: string, alpha: number): string {
  const value = color.trim();
  if (value.startsWith("#")) {
    const raw = value.slice(1);
    const hex = raw.length === 3 ? raw.split("").map((character) => character + character).join("") : raw;
    const number = Number.parseInt(hex, 16);
    return `rgba(${(number >> 16) & 255}, ${(number >> 8) & 255}, ${number & 255}, ${alpha})`;
  }
  if (/^(?:oklch|oklab|rgb|hsl|lab|lch)\(/.test(value) && !value.includes("/") && !value.includes(",")) return value.replace(/\)$/, ` / ${alpha})`);
  return `color-mix(in oklch, ${value} ${Math.round(alpha * 100)}%, transparent)`;
}

const CATEGORY_COLORS: Record<HabitCategory, { accent: string; bg: string; label: string; Icon: IconComponent }> = {
  mindset: { accent: CATEGORY_ACCENT.mindset, bg: fade(CATEGORY_ACCENT.mindset, 0.12), label: "Mindset", Icon: Brain },
  routine: { accent: CATEGORY_ACCENT.routine, bg: fade(CATEGORY_ACCENT.routine, 0.12), label: "Routine", Icon: Coffee },
  research: { accent: CATEGORY_ACCENT.research, bg: fade(CATEGORY_ACCENT.research, 0.12), label: "Research", Icon: Search },
  health: { accent: CATEGORY_ACCENT.health, bg: fade(CATEGORY_ACCENT.health, 0.12), label: "Health", Icon: Dumbbell },
  review: { accent: CATEGORY_ACCENT.review, bg: fade(CATEGORY_ACCENT.review, 0.12), label: "Review", Icon: BookOpen },
  other: { accent: CATEGORY_ACCENT.other, bg: fade(CATEGORY_ACCENT.other, 0.12), label: "Other", Icon: Circle },
};

function habitColor(habit: Pick<Habit, "category">) { return CATEGORY_COLORS[habit.category].accent; }
function appliesOn(habit: Habit, date: Date) {
  return frequencyApplies(habit.frequency, date.getDay()) && startOfDay(date).getTime() >= startOfDay(new Date(habit.created_at)).getTime();
}

interface NewHabitForm { name: string; description: string; category: HabitCategory; frequency: "daily" | "weekdays" | "weekends"; icon: string; }
const EMPTY_NEW_HABIT: NewHabitForm = { name: "", description: "", category: "routine", frequency: "daily", icon: "checklist" };

export function HabitsView() {
  const today = format(new Date(), "yyyy-MM-dd");
  const now = useMemo(() => new Date(`${today}T12:00:00`), [today]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [streaks, setStreaks] = useState<Record<string, number>>({});
  const [range, setRange] = useState<CalendarRange>("month");
  const [cursor, setCursor] = useState(now);
  const [selectedHabitId, setSelectedHabitId] = useState("all");
  const [selectedDate, setSelectedDate] = useState(today);
  const [showNewHabit, setShowNewHabit] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingHabit, setDeletingHabit] = useState<string | null>(null);
  const [newHabit, setNewHabit] = useState<NewHabitForm>(EMPTY_NEW_HABIT);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const refresh = async () => {
    const [nextHabits, nextCompletions] = await Promise.all([getHabits(), getHabitCompletions()]);
    setHabits(nextHabits); setCompletions(nextCompletions);
    const nextStreaks: Record<string, number> = {};
    await Promise.all(nextHabits.map(async (habit) => { nextStreaks[habit.id] = await getHabitStreak(habit.id); }));
    setStreaks(nextStreaks);
  };
  useEffect(() => { void refresh(); }, [today]);

  const doneSet = useMemo(() => new Set(completions.filter((item) => item.completed).map((item) => `${item.habit_id}|${item.date}`)), [completions]);
  const selectedHabits = selectedHabitId === "all" ? habits : habits.filter((habit) => habit.id === selectedHabitId);
  const todayHabits = habits.filter((habit) => appliesOn(habit, now));
  const doneToday = todayHabits.filter((habit) => doneSet.has(`${habit.id}|${today}`)).length;

  const visibleDays = useMemo(() => {
    if (range === "week") return eachDayOfInterval({ start: startOfWeek(cursor, { weekStartsOn: 1 }), end: endOfWeek(cursor, { weekStartsOn: 1 }) });
    if (range === "month") return eachDayOfInterval({ start: startOfMonth(cursor), end: endOfMonth(cursor) });
    const firstCreated = habits.length ? habits.reduce((earliest, habit) => Math.min(earliest, startOfDay(new Date(habit.created_at)).getTime()), startOfDay(now).getTime()) : startOfDay(now).getTime();
    return eachDayOfInterval({ start: new Date(firstCreated), end: startOfDay(now) });
  }, [cursor, habits, now, range]);

  function statsFor(day: Date, source = selectedHabits) {
    const dateKey = format(day, "yyyy-MM-dd");
    const applicable = source.filter((habit) => appliesOn(habit, day));
    const completed = applicable.filter((habit) => doneSet.has(`${habit.id}|${dateKey}`));
    return { expected: applicable.length, completed: completed.length, rate: applicable.length ? completed.length / applicable.length : 0 };
  }
  function periodStat(source = selectedHabits) {
    let expected = 0; let completed = 0;
    visibleDays.forEach((day) => { if (!isAfter(day, now)) { const stat = statsFor(day, source); expected += stat.expected; completed += stat.completed; } });
    return { expected, completed, rate: expected ? Math.round((completed / expected) * 100) : 0 };
  }

  const summary = periodStat();
  const selectedDay = new Date(`${selectedDate}T12:00:00`);
  const selectedDayHabits = habits.filter((habit) => appliesOn(habit, selectedDay));
  const title = range === "week" ? `${format(startOfWeek(cursor, { weekStartsOn: 1 }), "d MMM")} – ${format(endOfWeek(cursor, { weekStartsOn: 1 }), "d MMM yyyy")}` : range === "month" ? format(cursor, "MMMM yyyy") : "All time";

  function move(direction: -1 | 1) {
    if (range === "week") setCursor((current) => direction < 0 ? subWeeks(current, 1) : addWeeks(current, 1));
    if (range === "month") setCursor((current) => direction < 0 ? subMonths(current, 1) : addMonths(current, 1));
  }
  async function handleToggle(habitId: string, date: string) { await toggleHabitCompletion(habitId, date); setCompletions(await getHabitCompletions()); }
  function openEdit(habit: Habit) {
    setEditingId(habit.id); setCreateError(null);
    setNewHabit({ name: habit.name, description: habit.description ?? "", category: habit.category, frequency: habit.frequency, icon: habit.icon });
    setShowNewHabit(true);
  }
  function closeNewHabit() { if (creating) return; setShowNewHabit(false); setEditingId(null); setCreateError(null); setNewHabit(EMPTY_NEW_HABIT); }
  async function handleSaveHabit() {
    if (!newHabit.name.trim() || creating) return;
    setCreating(true); setCreateError(null);
    try {
      const payload = { name: newHabit.name.trim(), description: newHabit.description.trim(), category: newHabit.category, frequency: newHabit.frequency, target_days: newHabit.frequency === "daily" ? 7 : newHabit.frequency === "weekdays" ? 5 : 2, color: CATEGORY_COLORS[newHabit.category].accent, icon: newHabit.icon };
      if (editingId) await updateHabit(editingId, payload); else await createHabit(payload);
      await refresh();
      setShowNewHabit(false); setEditingId(null); setNewHabit(EMPTY_NEW_HABIT);
    } catch (error) { console.error("Failed to save habit:", error); setCreateError(`Could not ${editingId ? "update" : "create"} habit. Please try again.`); }
    finally { setCreating(false); }
  }
  async function handleDeleteHabit(id: string) { await deleteHabit(id); if (selectedHabitId === id) setSelectedHabitId("all"); await refresh(); setDeletingHabit(null); }

  return (
    <div className="flex h-[calc(100dvh-9.5rem)] min-h-[34rem] flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[var(--panel-shadow)]">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border/60 px-4 py-3 sm:px-5">
        <div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">{format(now, "EEEE, d MMMM")}</p><h2 className="mt-1 font-heading text-xl font-bold tracking-tight">Build the standard. Repeat it.</h2></div>
        <button onClick={() => setShowNewHabit(true)} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground shadow-[0_8px_24px_color-mix(in_oklch,var(--primary)_22%,transparent)] transition-transform hover:-translate-y-0.5 active:translate-y-0"><Plus className="h-3.5 w-3.5" strokeWidth={2.5} /> Add habit</button>
      </div>

      {habits.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center"><span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary"><Plus className="h-5 w-5" /></span><h3 className="mt-4 text-base font-bold">Your standard starts with one habit</h3><p className="mt-1 max-w-sm text-sm text-muted-foreground">Add the routine you want to make visible, then check it off here every day.</p><button onClick={() => setShowNewHabit(true)} className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">Create first habit</button></div>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-12">
          <aside className="flex min-h-0 flex-col border-b border-border/60 lg:col-span-4 lg:border-b-0 lg:border-r">
            <div className="shrink-0 border-b border-border/50 p-4">
              <div className="flex items-end justify-between gap-4"><div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Today</p><p className="mt-1 text-3xl font-black tabular-nums tracking-[-0.05em]">{doneToday}<span className="text-lg text-muted-foreground/45">/{todayHabits.length}</span></p></div><div className="w-24 text-right"><p className="text-xs font-semibold text-muted-foreground">{todayHabits.length === doneToday ? "Day complete" : `${todayHabits.length - doneToday} remaining`}</p><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary"><span className="block h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${todayHabits.length ? (doneToday / todayHabits.length) * 100 : 0}%` }} /></div></div></div>
              <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
                {todayHabits.map((habit) => { const done = doneSet.has(`${habit.id}|${today}`); return <button key={habit.id} onClick={() => handleToggle(habit.id, today)} className={cn("group flex min-w-0 items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-all", done ? "border-primary/25 bg-primary/[0.08]" : "border-border/60 bg-secondary/35 hover:border-primary/35")}><span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-md border", done && "border-transparent bg-primary text-primary-foreground")}>{done ? <Check className="h-3 w-3" strokeWidth={3} /> : <HabitGlyph icon={habit.icon} className="h-3 w-3" style={{ color: habitColor(habit) }} />}</span><span className={cn("truncate text-[11px] font-semibold", done ? "text-foreground" : "text-muted-foreground")}>{habit.name}</span></button>; })}
              </div>
            </div>
            <div className="flex shrink-0 items-center justify-between px-4 pb-2 pt-3"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Your habits</p><button onClick={() => setSelectedHabitId("all")} className={cn("text-[10px] font-bold transition-colors", selectedHabitId === "all" ? "text-primary" : "text-muted-foreground hover:text-foreground")}>Show all</button></div>
            <div className="min-h-0 flex-1 space-y-1 overflow-y-auto px-2 pb-3">
              {habits.map((habit) => {
                const active = selectedHabitId === habit.id; const stat = periodStat([habit]); const streak = streaks[habit.id] ?? 0;
                return <div key={habit.id} className={cn("group relative flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all", active ? "border-primary/30 bg-primary/[0.07]" : "border-transparent hover:border-border/60 hover:bg-secondary/35")}>
                  <button onClick={() => setSelectedHabitId(active ? "all" : habit.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: fade(habitColor(habit), 0.12), color: habitColor(habit) }}><HabitGlyph icon={habit.icon} className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="flex items-center gap-2"><span className="truncate text-xs font-semibold">{habit.name}</span>{streak > 0 && <span className="shrink-0 text-[9px] font-bold tabular-nums text-muted-foreground">{streak}d</span>}</span><span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-secondary"><span className="block h-full rounded-full" style={{ width: `${stat.rate}%`, background: habitColor(habit) }} /></span></span><span className="w-9 shrink-0 text-right text-xs font-black tabular-nums" style={{ color: habitColor(habit) }}>{stat.completed}</span></button>
                  {deletingHabit === habit.id ? <span className="absolute inset-y-1 right-1 flex items-center gap-1 rounded-lg bg-card px-2 text-[10px] shadow-lg"><button onClick={() => handleDeleteHabit(habit.id)} className="font-bold text-destructive">Delete</button><button onClick={() => setDeletingHabit(null)} className="text-muted-foreground">Cancel</button></span> : <span className="absolute right-2 flex items-center gap-1 rounded-md bg-card/95 p-1 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"><button onClick={() => openEdit(habit)} aria-label="Edit habit" className="rounded p-1 text-muted-foreground hover:text-primary"><Pencil className="h-3 w-3" /></button><button onClick={() => setDeletingHabit(habit.id)} aria-label="Delete habit" className="rounded p-1 text-muted-foreground hover:text-destructive"><Trash2 className="h-3 w-3" /></button></span>}
                </div>;
              })}
            </div>
          </aside>

          <section className="flex min-h-0 flex-col lg:col-span-8">
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border/50 px-4 py-3 sm:px-5">
              <div className="flex items-center gap-2">{range !== "all" && <button onClick={() => move(-1)} aria-label="Previous period" className="rounded-lg border border-border/60 p-1.5 text-muted-foreground hover:border-primary/30 hover:text-primary"><ChevronLeft className="h-4 w-4" /></button>}<div className="w-36 text-center"><p className="text-sm font-bold">{title}</p><p className="mt-0.5 truncate text-[10px] text-muted-foreground">{selectedHabitId === "all" ? "All habits" : habits.find((habit) => habit.id === selectedHabitId)?.name}</p></div>{range !== "all" && <button onClick={() => move(1)} aria-label="Next period" className="rounded-lg border border-border/60 p-1.5 text-muted-foreground hover:border-primary/30 hover:text-primary"><ChevronRight className="h-4 w-4" /></button>}</div>
              <div className="flex rounded-lg border border-border/60 bg-secondary/40 p-0.5">{(["week", "month", "all"] as CalendarRange[]).map((option) => <button key={option} onClick={() => setRange(option)} className={cn("rounded-md px-3 py-1.5 text-[10px] font-bold capitalize transition-all", range === option ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>{option === "all" ? "All time" : option}</button>)}</div>
            </div>
            <div className="grid shrink-0 grid-cols-3 border-b border-border/50"><div className="px-4 py-3"><p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Completed</p><p className="mt-0.5 text-xl font-black tabular-nums">{summary.completed}</p></div><div className="border-x border-border/50 px-4 py-3"><p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Scheduled</p><p className="mt-0.5 text-xl font-black tabular-nums">{summary.expected}</p></div><div className="px-4 py-3"><p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Consistency</p><p className="mt-0.5 text-xl font-black tabular-nums text-primary">{summary.rate}%</p></div></div>

            <div className="grid min-h-0 flex-1 grid-cols-1 xl:grid-cols-[minmax(0,1fr)_13rem]">
              <div className="flex min-h-0 flex-col p-4 sm:p-5">
                {range === "all" ? (
                  <div className="flex min-h-0 flex-1 flex-col justify-center"><div className="mb-3 flex items-center justify-between"><p className="text-xs font-semibold">Every day since you started</p><p className="text-[10px] text-muted-foreground">Less <span className="mx-1 inline-block h-2.5 w-2.5 rounded-sm bg-secondary align-middle" /> <span className="inline-block h-2.5 w-2.5 rounded-sm bg-primary align-middle" /> More</p></div><div className="grid grid-flow-col grid-rows-7 gap-1 overflow-hidden">{visibleDays.map((day) => { const stat = statsFor(day); return <button key={day.toISOString()} onClick={() => setSelectedDate(format(day, "yyyy-MM-dd"))} title={`${format(day, "d MMM yyyy")} · ${stat.completed}/${stat.expected}`} className={cn("aspect-square min-w-0 rounded-[3px] border transition-transform hover:scale-125", isSameDay(day, selectedDay) ? "border-primary" : "border-transparent")} style={{ background: stat.expected ? fade("var(--primary)", 0.12 + stat.rate * 0.82) : "var(--secondary)" }} />; })}</div></div>
                ) : (
                  <><div className="mb-2 grid grid-cols-7">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <span key={day} className="text-center text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/60">{day}</span>)}</div><div className={cn("grid min-h-0 flex-1 grid-cols-7", range === "week" ? "gap-2" : "gap-1.5")}>
                    {range === "month" && Array.from({ length: (startOfMonth(cursor).getDay() + 6) % 7 }, (_, index) => <span key={`month-pad-${index}`} aria-hidden />)}
                    {visibleDays.map((day) => { const stat = statsFor(day); const key = format(day, "yyyy-MM-dd"); const future = isAfter(startOfDay(day), startOfDay(now)); const selected = key === selectedDate; return <button key={key} onClick={() => setSelectedDate(key)} disabled={future} className={cn("group relative min-h-10 overflow-hidden rounded-lg border p-1.5 text-left transition-all", selected ? "border-primary ring-1 ring-primary/25" : "border-border/50 hover:border-primary/35", future && "cursor-default opacity-25", range === "week" && "flex flex-col justify-between p-3")} style={{ background: stat.expected && stat.completed ? `linear-gradient(145deg, ${fade("var(--primary)", 0.06 + stat.rate * 0.17)}, var(--card))` : "var(--card)" }}><span className={cn("relative z-10 text-[10px] font-bold tabular-nums", isSameDay(day, now) ? "text-primary" : "text-muted-foreground", range === "week" && "text-sm")}>{format(day, "d")}</span>{stat.expected > 0 && <><span className={cn("relative z-10 mt-1 block text-[9px] font-bold tabular-nums", range === "week" && "text-xs")}>{stat.completed}/{stat.expected}</span><span className="absolute inset-x-0 bottom-0 h-1 bg-secondary"><span className="block h-full bg-primary transition-[width]" style={{ width: `${stat.rate * 100}%` }} /></span></>}</button>; })}
                  </div></>
                )}
              </div>
              <div className="min-h-0 border-t border-border/50 p-4 xl:border-l xl:border-t-0"><div className="flex items-start justify-between gap-2"><div><p className="text-sm font-bold">{format(selectedDay, "EEEE")}</p><p className="text-[10px] text-muted-foreground">{format(selectedDay, "d MMMM yyyy")}</p></div><span className="text-xs font-black tabular-nums text-primary">{statsFor(selectedDay, selectedDayHabits).completed}/{selectedDayHabits.length}</span></div><div className="mt-3 max-h-[13rem] space-y-1.5 overflow-y-auto xl:max-h-[calc(100%-2.5rem)]">{selectedDayHabits.length === 0 ? <p className="text-xs text-muted-foreground">Nothing scheduled.</p> : selectedDayHabits.map((habit) => { const done = doneSet.has(`${habit.id}|${selectedDate}`); return <button key={habit.id} onClick={() => handleToggle(habit.id, selectedDate)} className={cn("flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors", done ? "border-primary/20 bg-primary/[0.07]" : "border-border/50 hover:border-primary/30")}><span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-md border", done && "border-transparent bg-primary text-primary-foreground")}>{done ? <Check className="h-3 w-3" strokeWidth={3} /> : <HabitGlyph icon={habit.icon} className="h-3 w-3" style={{ color: habitColor(habit) }} />}</span><span className="truncate text-[10px] font-semibold">{habit.name}</span></button>; })}</div></div>
            </div>
          </section>
        </div>
      )}

      <Dialog open={showNewHabit} onOpenChange={(open) => open ? setShowNewHabit(true) : closeNewHabit()}>
        <DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>{editingId ? "Edit habit" : "New habit"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5"><label className="text-xs font-medium text-muted-foreground">Habit name *</label><input type="text" value={newHabit.name} onChange={(event) => setNewHabit({ ...newHabit, name: event.target.value })} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void handleSaveHabit(); } }} placeholder="e.g. Morning journaling" className="w-full rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50" autoFocus /></div>
            <div className="space-y-1.5"><label className="text-xs font-medium text-muted-foreground">Description</label><input type="text" value={newHabit.description} onChange={(event) => setNewHabit({ ...newHabit, description: event.target.value })} placeholder="Optional description..." className="w-full rounded-lg border border-border bg-secondary px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50" /></div>
            <div className="space-y-1.5"><label className="text-xs font-medium text-muted-foreground">Icon</label><div className="flex flex-wrap gap-2">{HABIT_ICONS.map(({ key, Icon }) => { const active = newHabit.icon === key; return <button key={key} type="button" title={key} onClick={() => setNewHabit({ ...newHabit, icon: key })} className={cn("flex h-9 w-9 items-center justify-center rounded-lg border transition-all", active ? "border-primary/50 bg-primary/15 text-primary" : "border-border bg-secondary text-muted-foreground")}><Icon className="h-4 w-4" /></button>; })}</div></div>
            <div className="space-y-1.5"><label className="text-xs font-medium text-muted-foreground">Category</label><div className="flex flex-wrap gap-1.5">{(Object.keys(CATEGORY_COLORS) as HabitCategory[]).map((category) => { const item = CATEGORY_COLORS[category]; const active = newHabit.category === category; return <button key={category} type="button" onClick={() => setNewHabit({ ...newHabit, category })} className="rounded-lg border px-3 py-1 text-xs font-semibold transition-all" style={active ? { background: item.bg, color: item.accent, borderColor: fade(item.accent, 0.4) } : { background: "var(--secondary)", color: "var(--muted-foreground)", borderColor: "var(--border)" }}>{item.label}</button>; })}</div></div>
            <div className="space-y-1.5"><label className="text-xs font-medium text-muted-foreground">Frequency</label><div className="flex gap-2">{(["daily", "weekdays", "weekends"] as const).map((frequency) => <button key={frequency} type="button" onClick={() => setNewHabit({ ...newHabit, frequency })} className={cn("flex-1 rounded-lg border py-2 text-xs font-semibold capitalize transition-all", newHabit.frequency === frequency ? "border-primary/40 bg-primary/15 text-primary" : "border-border bg-secondary text-muted-foreground")}>{frequency}</button>)}</div></div>
            {createError && <p className="flex items-center gap-1.5 text-xs text-destructive"><AlertCircle className="h-3.5 w-3.5 shrink-0" />{createError}</p>}
          </div>
          <DialogFooter><button type="button" onClick={closeNewHabit} disabled={creating} className="rounded-xl border border-border bg-secondary px-4 py-2.5 text-sm font-medium text-muted-foreground disabled:opacity-40">Cancel</button><button type="button" onClick={() => void handleSaveHabit()} disabled={!newHabit.name.trim() || creating} className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-[0_4px_14px_color-mix(in_oklch,var(--primary)_28%,transparent)] disabled:opacity-40">{creating ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />{editingId ? "Saving..." : "Creating..."}</> : editingId ? "Save changes" : "Create habit"}</button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
