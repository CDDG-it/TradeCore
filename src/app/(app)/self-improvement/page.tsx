"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { PageHeader } from "@/components/ui/page-header";
import { PageWrapper } from "@/components/ui/page-wrapper";
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Flame,
  Check,
  Minus,
  Plus,
  X,
  Activity,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { HabitGlyph } from "@/components/habit-glyph";
import {
  getDailyJournal,
  saveDailyJournal,
  getDailyStateCheck,
  getSleepRecovery,
  saveSleepRecovery,
  getDaySummary,
  getHabits,
  getHabitCompletions,
  toggleHabitCompletion,
  getHabitStreak,
} from "@/lib/supabase/queries";
import type {
  DailyJournalEntry,
  SleepRecovery,
  Habit,
  HabitCompletion,
} from "@/lib/types";

type DailyTask = { id: string; text: string; done: boolean };

function getDailyTasks(date: string): DailyTask[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(`dailyTasks_${date}`) ?? "[]"); }
  catch { return []; }
}
function saveDailyTasks(date: string, tasks: DailyTask[]) {
  localStorage.setItem(`dailyTasks_${date}`, JSON.stringify(tasks));
}

function toDate(d: Date) {
  return format(d, "yyyy-MM-dd");
}

// ── Reusable sub-components ──────────────────────────────────────────────────

function SectionCard({
  title,
  icon: Icon,
  accent,
  children,
  className,
}: {
  title: string;
  icon: React.ElementType;
  accent: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("rounded-xl overflow-hidden", className)}
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
      }}
    >
      <div
        className="flex items-center gap-2.5 px-5 py-3.5"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `${accent}1a` }}
        >
          <Icon className="w-3.5 h-3.5" style={{ color: accent }} />
        </div>
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SelfImprovementPage() {
  const today = toDate(new Date());
  const [selectedDate, setSelectedDate] = useState(today);

  // Journal state
  const [journal, setJournal] = useState<Partial<DailyJournalEntry>>({});
  const [journalDirty, setJournalDirty] = useState(false);

  // Tracker state
  const [hoursSlept, setHoursSlept] = useState(7);
  const [trackerDirty, setTrackerDirty] = useState(false);

  // Habit state
  const [habits, setHabits] = useState<Habit[]>([]);
  const [todayCompletions, setTodayCompletions] = useState<HabitCompletion[]>([]);
  const [habitStreaks, setHabitStreaks] = useState<Record<string, number>>({});

  // Daily tasks state
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([]);
  const [newTask, setNewTask] = useState("");

  // Load daily data when date changes
  useEffect(() => {
    (async () => {
      const [j, sl, completions, h, tasks] = await Promise.all([
        getDailyJournal(selectedDate),
        getSleepRecovery(selectedDate),
        getHabitCompletions(undefined, selectedDate),
        getHabits(),
        getDailyTasks(selectedDate),
      ]);
      setJournal(j || {});
      setJournalDirty(false);
      setHoursSlept(sl?.hours_slept ?? 7);
      setTrackerDirty(false);
      setTodayCompletions(completions);
      setHabits(h);
      setDailyTasks(tasks);
      const streakMap: Record<string, number> = {};
      await Promise.all(h.map(async (hab) => {
        streakMap[hab.id] = await getHabitStreak(hab.id);
      }));
      setHabitStreaks(streakMap);
    })();
  }, [selectedDate]);

  async function saveJournal() {
    await saveDailyJournal({
      date: selectedDate,
      mood_note: journal.mood_note || "",
      mental_state: journal.mental_state || "",
      what_went_well: journal.what_went_well || "",
      what_hurt_performance: journal.what_hurt_performance || "",
      improve_tomorrow: journal.improve_tomorrow || "",
    });
    setJournalDirty(false);
  }

  async function saveTracker() {
    await saveSleepRecovery({
      date: selectedDate,
      hours_slept: hoursSlept,
      sleep_quality: 7,
      training_movement: false,
      screen_discipline: 7,
      rest_quality: 7,
      notes: "",
    });
    setTrackerDirty(false);
  }

  async function handleToggleHabit(habitId: string) {
    await toggleHabitCompletion(habitId, selectedDate);
    const c = await getHabitCompletions(undefined, selectedDate);
    setTodayCompletions(c);
  }

  function prevDay() {
    const d = new Date(selectedDate + "T12:00:00");
    d.setDate(d.getDate() - 1);
    setSelectedDate(toDate(d));
  }
  function nextDay() {
    const d = new Date(selectedDate + "T12:00:00");
    d.setDate(d.getDate() + 1);
    setSelectedDate(toDate(d));
  }

  const isToday = selectedDate === today;

  return (
    <div className="space-y-10">
      <PageHeader badge="Mindset" title="Self-Improvement" subtitle="Daily tracker and habits" />
      <PageWrapper>
      {/* ── DAILY CHECK-IN ───────────────────────────── */}
      <section className="animate-fade-up space-y-5">
        <div
          className="flex items-center gap-3"
          style={{ borderBottom: "1px solid var(--muted)", paddingBottom: "12px" }}
        >
          <h2 className="text-base font-semibold">Daily Check-in</h2>
        </div>

        {/* Date Navigator */}
        <div
          className="flex items-center justify-between px-5 py-3 rounded-xl"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <button
            onClick={prevDay}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/5"
            style={{ color: "oklch(0.55 0.005 28)" }}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="text-center">
            <p className="text-sm font-semibold">
              {format(new Date(selectedDate + "T12:00:00"), "EEEE, MMMM d")}
            </p>
            {isToday && (
              <span className="text-xs font-medium" style={{ color: "oklch(0.72 0.22 45)" }}>
                Today
              </span>
            )}
          </div>
          <button
            onClick={nextDay}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/5"
            style={{ color: "oklch(0.55 0.005 28)" }}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <DaySummaryBadges date={selectedDate} />

        <div className="grid lg:grid-cols-2 gap-5">
          {/* Daily Journal */}
          <SectionCard title="Daily Journal" icon={BookOpen} accent="oklch(0.72 0.22 45)">
            <div className="space-y-4">
              {[
                {
                  key: "mood_note",
                  label: "How did you feel today?",
                  placeholder: "Mental state, emotions, overall energy...",
                },
                {
                  key: "what_went_well",
                  label: "What went well today?",
                  placeholder: "Wins, good decisions, moments of discipline...",
                },
                {
                  key: "what_hurt_performance",
                  label: "What hurt your performance?",
                  placeholder: "Mistakes, impulses, distractions...",
                },
                {
                  key: "improve_tomorrow",
                  label: "What will you improve tomorrow?",
                  placeholder: "One clear intention for tomorrow...",
                },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    {label}
                  </label>
                  <textarea
                    rows={2}
                    value={(journal as Record<string, string>)[key] || ""}
                    onChange={(e) => {
                      setJournal({ ...journal, [key]: e.target.value });
                      setJournalDirty(true);
                    }}
                    placeholder={placeholder}
                    className="w-full rounded-lg px-3 py-2.5 text-sm resize-none"
                    style={{
                      background: "var(--secondary)",
                      border: "1px solid var(--border)",
                      color: "oklch(0.94 0.002 28)",
                      outline: "none",
                    }}
                  />
                </div>
              ))}
              {journalDirty && (
                <button
                  onClick={saveJournal}
                  className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all hover:-translate-y-px"
                  style={{
                    background: "oklch(0.72 0.22 45)",
                    color: "oklch(0.07 0.003 28)",
                    boxShadow: "0 4px 14px oklch(0.72 0.22 45 / 0.30)",
                  }}
                >
                  Save Journal
                </button>
              )}
            </div>
          </SectionCard>

          {/* Daily Tracker */}
          <SectionCard title="Daily Tracker" icon={Activity} accent="oklch(0.72 0.22 45)">
            <div className="space-y-5">
              {/* Hours slept */}
              <div>
                <label className="text-xs text-muted-foreground block mb-2">Hours Slept</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => { setHoursSlept(Math.max(0, hoursSlept - 0.5)); setTrackerDirty(true); }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                    style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-lg font-bold tabular-nums w-10 text-center" style={{ color: "oklch(0.58 0.17 145)" }}>
                    {hoursSlept}h
                  </span>
                  <button
                    onClick={() => { setHoursSlept(Math.min(12, hoursSlept + 0.5)); setTrackerDirty(true); }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                    style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  {trackerDirty && (
                    <button
                      onClick={saveTracker}
                      className="ml-auto text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
                      style={{ background: "oklch(0.72 0.22 45 / 0.15)", color: "oklch(0.72 0.22 45)", border: "1px solid oklch(0.72 0.22 45 / 0.25)" }}
                    >
                      Save
                    </button>
                  )}
                </div>
              </div>

              {/* Habits */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">Habits</span>
                  <Link
                    href="/habits"
                    className="text-xs flex items-center gap-1 transition-opacity hover:opacity-70"
                    style={{ color: "oklch(0.72 0.22 45)" }}
                  >
                    Manage <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
                {habits.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No habits yet.</p>
                ) : (
                  <div className="space-y-0.5">
                    {habits.map((habit) => {
                      const done = todayCompletions.some((c) => c.habit_id === habit.id && c.completed);
                      const streak = habitStreaks[habit.id] ?? 0;
                      return (
                        <div key={habit.id} className="flex items-center gap-3 py-1.5">
                          <button
                            onClick={() => handleToggleHabit(habit.id)}
                            className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all hover:scale-110"
                            style={done
                              ? { background: habit.color }
                              : { background: "var(--secondary)", border: "1.5px solid var(--border)" }}
                          >
                            {done ? <Check className="w-3 h-3 text-white" /> : <HabitGlyph icon={habit.icon} className="w-3.5 h-3.5" style={{ color: "var(--muted-foreground)" }} />}
                          </button>
                          <span className="flex-1 text-sm truncate" style={{ color: done ? "oklch(0.90 0.003 28)" : "oklch(0.55 0.005 28)" }}>
                            {habit.name}
                          </span>
                          {streak > 0 && (
                            <div className="flex items-center gap-1 shrink-0">
                              <Flame className="w-3 h-3" style={{ color: "oklch(0.72 0.22 45)" }} />
                              <span className="text-xs font-semibold" style={{ color: "oklch(0.72 0.22 45)" }}>{streak}d</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Daily Tasks */}
              <div>
                <span className="text-xs text-muted-foreground block mb-2">Daily Tasks</span>
                <div className="space-y-0.5 mb-2">
                  {dailyTasks.map((task) => (
                    <div key={task.id} className="flex items-center gap-2.5 py-1 group">
                      <button
                        onClick={() => {
                          const updated = dailyTasks.map((t) => t.id === task.id ? { ...t, done: !t.done } : t);
                          setDailyTasks(updated);
                          saveDailyTasks(selectedDate, updated);
                        }}
                        className="w-4 h-4 rounded flex items-center justify-center shrink-0 transition-all"
                        style={task.done
                          ? { background: "oklch(0.58 0.17 145)", border: "none" }
                          : { background: "var(--secondary)", border: "1.5px solid var(--border)" }}
                      >
                        {task.done && <Check className="w-2.5 h-2.5 text-white" />}
                      </button>
                      <span className="flex-1 text-sm" style={{ color: task.done ? "oklch(0.45 0.005 28)" : "oklch(0.90 0.003 28)", textDecoration: task.done ? "line-through" : "none" }}>
                        {task.text}
                      </span>
                      <button
                        onClick={() => {
                          const updated = dailyTasks.filter((t) => t.id !== task.id);
                          setDailyTasks(updated);
                          saveDailyTasks(selectedDate, updated);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ color: "oklch(0.45 0.005 28)" }}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newTask.trim()) {
                        const updated = [...dailyTasks, { id: crypto.randomUUID(), text: newTask.trim(), done: false }];
                        setDailyTasks(updated);
                        saveDailyTasks(selectedDate, updated);
                        setNewTask("");
                      }
                    }}
                    placeholder="Add a task..."
                    className="flex-1 rounded-lg px-3 py-2 text-xs outline-none"
                    style={{ background: "var(--secondary)", border: "1px solid var(--border)", color: "oklch(0.94 0.002 28)" }}
                  />
                  <button
                    onClick={() => {
                      if (!newTask.trim()) return;
                      const updated = [...dailyTasks, { id: crypto.randomUUID(), text: newTask.trim(), done: false }];
                      setDailyTasks(updated);
                      saveDailyTasks(selectedDate, updated);
                      setNewTask("");
                    }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: "oklch(0.72 0.22 45 / 0.12)", color: "oklch(0.72 0.22 45)", border: "1px solid oklch(0.72 0.22 45 / 0.22)" }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      </section>

      </PageWrapper>
    </div>
  );
}

// ── Day Summary Badges ────────────────────────────────────────────────────────

import type { DaySummary } from "@/lib/supabase/queries";

function DaySummaryBadges({ date }: { date: string }) {
  const [summary, setSummary] = useState<DaySummary | null>(null);

  useEffect(() => {
    getDaySummary(date).then(setSummary);
  }, [date]);

  if (!summary) return null;

  const items = [
    {
      label: "Pre-Market",
      done: summary.hasAnalysis,
      detail: summary.hasAnalysis ? `${summary.analysisCount} analysis` : "Not done",
      color: "oklch(0.72 0.22 45)",
    },
    {
      label: "Habits",
      done: summary.habitCompleted > 0,
      detail: `${summary.habitCompleted}/${summary.habitCount} done`,
      color: "oklch(0.72 0.22 45)",
    },
    {
      label: "Trades",
      done: summary.tradeCount > 0,
      detail:
        summary.tradeCount > 0
          ? `${summary.tradeCount} trade${summary.tradeCount > 1 ? "s" : ""}, ${summary.tradeWins}W`
          : "No trades",
      color: "oklch(0.58 0.17 145)",
    },
    {
      label: "Journal",
      done: summary.hasJournal,
      detail: summary.hasJournal ? "Written" : "Not written",
      color: "oklch(0.72 0.22 45)",
    },
    {
      label: "Tracker",
      done: summary.hasStateCheck,
      detail:
        summary.hasStateCheck && summary.stateScore !== null
          ? `Avg: ${summary.stateScore}/10`
          : "Not logged",
      color: "oklch(0.72 0.22 45)",
    },
    {
      label: "Recovery",
      done: summary.hasSleep,
      detail: summary.hasSleep ? "Logged" : "Not logged",
      color: "oklch(0.58 0.17 145)",
    },
  ];

  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
      {items.map(({ label, done, detail, color }) => (
        <div
          key={label}
          className="rounded-xl p-3 text-center"
          style={{
            background: done ? `${color}0d` : "var(--card)",
            border: `1px solid ${done ? `${color}33` : "var(--border)"}`,
          }}
        >
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center mx-auto mb-1.5"
            style={{ background: done ? `${color}1a` : "var(--muted)" }}
          >
            {done ? (
              <Check className="w-3 h-3" style={{ color }} />
            ) : (
              <Minus className="w-3 h-3" style={{ color: "oklch(0.40 0.005 28)" }} />
            )}
          </div>
          <p
            className="text-xs font-semibold"
            style={{ color: done ? color : "oklch(0.55 0.005 28)" }}
          >
            {label}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{detail}</p>
        </div>
      ))}
    </div>
  );
}
