"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Brain,
  Flame,
  Check,
  Minus,
  Plus,
  X,
  ExternalLink,
  Activity,
  Shield,
  AlertTriangle,
  Target,
  CheckSquare,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  getDailyJournal,
  saveDailyJournal,
  getDailyStateCheck,
  saveDailyStateCheck,
  getSleepRecovery,
  saveSleepRecovery,
  getDaySummary,
  getHabits,
  getHabitCompletions,
  toggleHabitCompletion,
  getHabitStreak,
  getPlaybook,
  savePlaybook,
} from "@/lib/mock/store";
import type {
  DailyJournalEntry,
  DailyStateCheck,
  SleepRecovery,
  TraderPlaybook,
} from "@/lib/types";

function toDate(d: Date) {
  return format(d, "yyyy-MM-dd");
}

// ── Reusable sub-components ──────────────────────────────────────────────────

function ScoreBar({
  label,
  value,
  onChange,
  color = "oklch(0.72 0.14 220)",
  invert = false,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  color?: string;
  invert?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-xs font-bold tabular-nums w-6 text-right" style={{ color }}>
          {value}
        </span>
      </div>
      <div className="flex gap-1">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
          const active = n <= value;
          const activeColor = invert
            ? n <= 3
              ? "oklch(0.58 0.17 145)"
              : n <= 6
              ? "oklch(0.70 0.16 72)"
              : "oklch(0.58 0.22 25)"
            : n >= 7
            ? "oklch(0.58 0.17 145)"
            : n >= 4
            ? "oklch(0.70 0.16 72)"
            : "oklch(0.58 0.22 25)";
          return (
            <button
              key={n}
              onClick={() => onChange(n)}
              className="flex-1 h-2 rounded-full transition-all hover:opacity-80"
              style={{ background: active ? activeColor : "oklch(0.22 0.025 252)" }}
            />
          );
        })}
      </div>
    </div>
  );
}

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
        background: "oklch(0.12 0.018 252)",
        border: "1px solid oklch(0.22 0.025 252)",
      }}
    >
      <div
        className="flex items-center gap-2.5 px-5 py-3.5"
        style={{ borderBottom: "1px solid oklch(0.22 0.025 252)" }}
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

  // Combined tracker state (mental + sleep)
  const [stateCheck, setStateCheck] = useState<Partial<DailyStateCheck>>({
    mood: 5, energy: 5, focus: 5, stress: 5,
    confidence: 5, emotional_stability: 5, patience: 5, impulsiveness: 5,
  });
  const [sleep, setSleep] = useState<Partial<SleepRecovery>>({
    hours_slept: 7, sleep_quality: 7, training_movement: false,
    screen_discipline: 7, rest_quality: 7, notes: "",
  });
  const [trackerDirty, setTrackerDirty] = useState(false);

  // Habit state
  const [habits, setHabits] = useState(() => getHabits());
  const [todayCompletions, setTodayCompletions] = useState(() =>
    getHabitCompletions(undefined, toDate(new Date()))
  );

  // Playbook state
  const [playbook, setPlaybook] = useState<TraderPlaybook>(() => getPlaybook());
  const [playbookDirty, setPlaybookDirty] = useState(false);
  const [playbookSaved, setPlaybookSaved] = useState(false);
  const [newRule, setNewRule] = useState("");
  const [newWeakness, setNewWeakness] = useState("");
  const [newRoutineStep, setNewRoutineStep] = useState("");

  // Load daily data when date changes
  useEffect(() => {
    const j = getDailyJournal(selectedDate);
    setJournal(j || {});
    setJournalDirty(false);

    const sc = getDailyStateCheck(selectedDate);
    setStateCheck(sc || {
      mood: 5, energy: 5, focus: 5, stress: 5,
      confidence: 5, emotional_stability: 5, patience: 5, impulsiveness: 5,
    });

    const sl = getSleepRecovery(selectedDate);
    setSleep(sl || {
      hours_slept: 7, sleep_quality: 7, training_movement: false,
      screen_discipline: 7, rest_quality: 7, notes: "",
    });

    setTrackerDirty(false);
    setTodayCompletions(getHabitCompletions(undefined, selectedDate));
    setHabits(getHabits());
  }, [selectedDate]);

  function saveJournal() {
    saveDailyJournal({
      date: selectedDate,
      mood_note: journal.mood_note || "",
      mental_state: journal.mental_state || "",
      what_went_well: journal.what_went_well || "",
      what_hurt_performance: journal.what_hurt_performance || "",
      improve_tomorrow: journal.improve_tomorrow || "",
    });
    setJournalDirty(false);
  }

  function saveTracker() {
    saveDailyStateCheck({
      date: selectedDate,
      mood: stateCheck.mood ?? 5,
      energy: stateCheck.energy ?? 5,
      focus: stateCheck.focus ?? 5,
      stress: stateCheck.stress ?? 5,
      confidence: stateCheck.confidence ?? 5,
      emotional_stability: stateCheck.emotional_stability ?? 5,
      patience: stateCheck.patience ?? 5,
      impulsiveness: stateCheck.impulsiveness ?? 5,
    });
    saveSleepRecovery({
      date: selectedDate,
      hours_slept: sleep.hours_slept ?? 7,
      sleep_quality: sleep.sleep_quality ?? 7,
      training_movement: sleep.training_movement ?? false,
      screen_discipline: sleep.screen_discipline ?? 7,
      rest_quality: sleep.rest_quality ?? 7,
      notes: sleep.notes || "",
    });
    setTrackerDirty(false);
  }

  function savePlaybookData() {
    savePlaybook(playbook);
    setPlaybookDirty(false);
    setPlaybookSaved(true);
    setTimeout(() => setPlaybookSaved(false), 2500);
  }

  function handleToggleHabit(habitId: string) {
    toggleHabitCompletion(habitId, selectedDate);
    setTodayCompletions(getHabitCompletions(undefined, selectedDate));
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
  const doneCount = todayCompletions.filter((c) => c.completed).length;
  const habitProgress = habits.length > 0 ? Math.round((doneCount / habits.length) * 100) : 0;

  return (
    <div className="space-y-10">
      {/* Page Header */}
      <div className="animate-fade-up">
        <h1 className="text-2xl font-bold tracking-tight">Self-Improvement</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Mindset, habits, and playbook — unified in one place
        </p>
      </div>

      {/* ── DAILY CHECK-IN ───────────────────────────── */}
      <section className="animate-fade-up space-y-5">
        <div
          className="flex items-center gap-3"
          style={{ borderBottom: "1px solid oklch(0.18 0.022 252)", paddingBottom: "12px" }}
        >
          <h2 className="text-base font-semibold">Daily Check-in</h2>
        </div>

        {/* Date Navigator */}
        <div
          className="flex items-center justify-between px-5 py-3 rounded-xl"
          style={{ background: "oklch(0.12 0.018 252)", border: "1px solid oklch(0.22 0.025 252)" }}
        >
          <button
            onClick={prevDay}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/5"
            style={{ color: "oklch(0.55 0.04 252)" }}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="text-center">
            <p className="text-sm font-semibold">
              {format(new Date(selectedDate + "T12:00:00"), "EEEE, MMMM d")}
            </p>
            {isToday && (
              <span className="text-xs font-medium" style={{ color: "oklch(0.72 0.14 220)" }}>
                Today
              </span>
            )}
          </div>
          <button
            onClick={nextDay}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/5"
            style={{ color: "oklch(0.55 0.04 252)" }}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <DaySummaryBadges date={selectedDate} />

        <div className="grid lg:grid-cols-2 gap-5">
          {/* Daily Journal */}
          <SectionCard title="Daily Journal" icon={BookOpen} accent="oklch(0.72 0.14 220)">
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
                      background: "oklch(0.09 0.014 252)",
                      border: "1px solid oklch(0.22 0.025 252)",
                      color: "oklch(0.93 0.008 252)",
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
                    background: "oklch(0.72 0.14 220)",
                    color: "oklch(0.08 0.014 252)",
                    boxShadow: "0 4px 14px oklch(0.72 0.14 220 / 0.30)",
                  }}
                >
                  Save Journal
                </button>
              )}
            </div>
          </SectionCard>

          {/* Combined Daily Tracker */}
          <SectionCard title="Daily Tracker" icon={Activity} accent="oklch(0.74 0.13 82)">
            <div className="space-y-4">
              {/* Sleep row */}
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground block mb-1.5">Hours Slept</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSleep({ ...sleep, hours_slept: Math.max(0, (sleep.hours_slept ?? 7) - 0.5) });
                        setTrackerDirty(true);
                      }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                      style={{ background: "oklch(0.09 0.014 252)", border: "1px solid oklch(0.22 0.025 252)" }}
                    >
                      −
                    </button>
                    <span
                      className="text-lg font-bold tabular-nums w-10 text-center"
                      style={{ color: "oklch(0.58 0.17 145)" }}
                    >
                      {sleep.hours_slept ?? 7}h
                    </span>
                    <button
                      onClick={() => {
                        setSleep({ ...sleep, hours_slept: Math.min(12, (sleep.hours_slept ?? 7) + 0.5) });
                        setTrackerDirty(true);
                      }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                      style={{ background: "oklch(0.09 0.014 252)", border: "1px solid oklch(0.22 0.025 252)" }}
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground block mb-1.5">Movement</label>
                  <button
                    onClick={() => {
                      setSleep({ ...sleep, training_movement: !sleep.training_movement });
                      setTrackerDirty(true);
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                    style={
                      sleep.training_movement
                        ? {
                            background: "oklch(0.58 0.17 145 / 0.15)",
                            color: "oklch(0.58 0.17 145)",
                            border: "1px solid oklch(0.58 0.17 145 / 0.30)",
                          }
                        : {
                            background: "oklch(0.09 0.014 252)",
                            color: "oklch(0.55 0.04 252)",
                            border: "1px solid oklch(0.22 0.025 252)",
                          }
                    }
                  >
                    {sleep.training_movement ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Minus className="w-3.5 h-3.5" />
                    )}
                    {sleep.training_movement ? "Done" : "Not done"}
                  </button>
                </div>
              </div>

              <ScoreBar
                label="Mood"
                value={stateCheck.mood ?? 5}
                onChange={(v) => { setStateCheck({ ...stateCheck, mood: v }); setTrackerDirty(true); }}
                color="oklch(0.74 0.13 82)"
              />
              <ScoreBar
                label="Energy"
                value={stateCheck.energy ?? 5}
                onChange={(v) => { setStateCheck({ ...stateCheck, energy: v }); setTrackerDirty(true); }}
                color="oklch(0.72 0.14 220)"
              />
              <ScoreBar
                label="Focus"
                value={stateCheck.focus ?? 5}
                onChange={(v) => { setStateCheck({ ...stateCheck, focus: v }); setTrackerDirty(true); }}
                color="oklch(0.72 0.14 220)"
              />
              <ScoreBar
                label="Stress (1=low)"
                value={stateCheck.stress ?? 5}
                onChange={(v) => { setStateCheck({ ...stateCheck, stress: v }); setTrackerDirty(true); }}
                color="oklch(0.58 0.22 25)"
                invert
              />
              <ScoreBar
                label="Sleep Quality"
                value={sleep.sleep_quality ?? 7}
                onChange={(v) => { setSleep({ ...sleep, sleep_quality: v }); setTrackerDirty(true); }}
                color="oklch(0.58 0.17 145)"
              />

              {trackerDirty && (
                <button
                  onClick={saveTracker}
                  className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all hover:-translate-y-px mt-1"
                  style={{
                    background: "oklch(0.74 0.13 82)",
                    color: "oklch(0.08 0.014 252)",
                    boxShadow: "0 4px 14px oklch(0.74 0.13 82 / 0.30)",
                  }}
                >
                  Save Tracker
                </button>
              )}
            </div>
          </SectionCard>
        </div>
      </section>

      {/* ── HABIT TRACKER ────────────────────────────── */}
      <section className="animate-fade-up space-y-5">
        <div
          className="flex items-center justify-between"
          style={{ borderBottom: "1px solid oklch(0.18 0.022 252)", paddingBottom: "12px" }}
        >
          <h2 className="text-base font-semibold">Habit Tracker</h2>
          <Link
            href="/habits"
            className="text-xs font-medium flex items-center gap-1 transition-colors hover:opacity-80"
            style={{ color: "oklch(0.72 0.14 220)" }}
          >
            Manage habits
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        {/* Progress summary */}
        <div
          className="flex items-center gap-4 px-5 py-4 rounded-xl"
          style={{ background: "oklch(0.12 0.018 252)", border: "1px solid oklch(0.22 0.025 252)" }}
        >
          <div className="relative w-12 h-12 shrink-0">
            <svg viewBox="0 0 48 48" className="w-12 h-12 -rotate-90">
              <circle cx="24" cy="24" r="20" fill="none" stroke="oklch(0.22 0.025 252)" strokeWidth="4" />
              <circle
                cx="24" cy="24" r="20" fill="none"
                stroke="oklch(0.58 0.17 145)" strokeWidth="4"
                strokeDasharray={`${2 * Math.PI * 20}`}
                strokeDashoffset={`${2 * Math.PI * 20 * (1 - habitProgress / 100)}`}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 0.5s ease" }}
              />
            </svg>
            <span
              className="absolute inset-0 flex items-center justify-center text-xs font-bold"
              style={{ color: "oklch(0.58 0.17 145)" }}
            >
              {habitProgress}%
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold">
              {doneCount} of {habits.length} habits done
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {format(new Date(selectedDate + "T12:00:00"), "MMMM d")}
            </p>
          </div>
        </div>

        {habits.length === 0 ? (
          <div
            className="rounded-xl px-5 py-8 text-center"
            style={{ background: "oklch(0.12 0.018 252)", border: "1px solid oklch(0.22 0.025 252)" }}
          >
            <p className="text-sm text-muted-foreground">No habits set up yet.</p>
            <Link
              href="/habits"
              className="inline-flex items-center gap-1 mt-3 text-xs font-semibold"
              style={{ color: "oklch(0.72 0.14 220)" }}
            >
              Add habits <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        ) : (
          <div
            className="rounded-xl overflow-hidden"
            style={{ background: "oklch(0.12 0.018 252)", border: "1px solid oklch(0.22 0.025 252)" }}
          >
            {habits.map((habit, idx) => {
              const done = todayCompletions.some((c) => c.habit_id === habit.id && c.completed);
              const streak = getHabitStreak(habit.id);
              return (
                <div
                  key={habit.id}
                  className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-white/[0.02]"
                  style={idx > 0 ? { borderTop: "1px solid oklch(0.18 0.022 252)" } : undefined}
                >
                  <button
                    onClick={() => handleToggleHabit(habit.id)}
                    className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-all hover:scale-110"
                    style={
                      done
                        ? { background: habit.color }
                        : { background: "oklch(0.09 0.014 252)", border: "1.5px solid oklch(0.28 0.025 252)" }
                    }
                  >
                    {done ? (
                      <Check className="w-3.5 h-3.5 text-white" />
                    ) : (
                      <span className="text-base leading-none">{habit.icon}</span>
                    )}
                  </button>
                  <p
                    className="flex-1 text-sm font-medium truncate"
                    style={{ color: done ? "oklch(0.88 0.008 252)" : "oklch(0.65 0.04 252)" }}
                  >
                    {habit.name}
                  </p>
                  {streak > 0 && (
                    <div className="flex items-center gap-1 shrink-0">
                      <Flame className="w-3.5 h-3.5" style={{ color: "oklch(0.74 0.13 82)" }} />
                      <span className="text-xs font-semibold" style={{ color: "oklch(0.74 0.13 82)" }}>
                        {streak}d
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── PLAYBOOK ─────────────────────────────────── */}
      <section className="animate-fade-up space-y-5">
        <div
          className="flex items-center justify-between"
          style={{ borderBottom: "1px solid oklch(0.18 0.022 252)", paddingBottom: "12px" }}
        >
          <h2 className="text-base font-semibold">Playbook</h2>
          {(playbookSaved && !playbookDirty) && (
            <span className="text-xs font-medium flex items-center gap-1" style={{ color: "oklch(0.58 0.17 145)" }}>
              <Check className="w-3.5 h-3.5" /> Saved
            </span>
          )}
        </div>

        <div
          className="rounded-xl overflow-hidden"
          style={{ background: "oklch(0.12 0.018 252)", border: "1px solid oklch(0.22 0.025 252)" }}
        >
          {/* Rules + Routine */}
          <div className="grid lg:grid-cols-2" style={{ borderBottom: "1px solid oklch(0.18 0.022 252)" }}>
            {/* Non-Negotiable Rules */}
            <div className="p-5 space-y-3" style={{ borderRight: "1px solid oklch(0.18 0.022 252)" }}>
              <div className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 shrink-0" style={{ color: "oklch(0.58 0.22 25)" }} />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "oklch(0.58 0.22 25)" }}>
                  Non-Negotiable Rules
                </span>
              </div>
              <div className="space-y-1">
                {(playbook.non_negotiable_rules ?? []).map((rule, i) => (
                  <div key={i} className="flex items-center gap-2 group py-1">
                    <span className="text-xs tabular-nums w-4 shrink-0" style={{ color: "oklch(0.40 0.03 252)" }}>{i + 1}.</span>
                    <span className="text-sm flex-1">{rule}</span>
                    <button
                      onClick={() => {
                        const rules = [...(playbook.non_negotiable_rules ?? [])];
                        rules.splice(i, 1);
                        setPlaybook({ ...playbook, non_negotiable_rules: rules });
                        setPlaybookDirty(true);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: "oklch(0.55 0.04 252)" }}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={newRule}
                  onChange={(e) => setNewRule(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newRule.trim()) {
                      setPlaybook({ ...playbook, non_negotiable_rules: [...(playbook.non_negotiable_rules ?? []), newRule.trim()] });
                      setNewRule(""); setPlaybookDirty(true);
                    }
                  }}
                  placeholder="Add a rule..."
                  className="flex-1 rounded-lg px-3 py-2 text-xs outline-none"
                  style={{ background: "oklch(0.09 0.014 252)", border: "1px solid oklch(0.22 0.025 252)", color: "oklch(0.93 0.008 252)" }}
                />
                <button
                  onClick={() => {
                    if (!newRule.trim()) return;
                    setPlaybook({ ...playbook, non_negotiable_rules: [...(playbook.non_negotiable_rules ?? []), newRule.trim()] });
                    setNewRule(""); setPlaybookDirty(true);
                  }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "oklch(0.58 0.22 25 / 0.12)", color: "oklch(0.58 0.22 25)", border: "1px solid oklch(0.58 0.22 25 / 0.20)" }}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Pre-Trade Routine */}
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-3.5 h-3.5 shrink-0" style={{ color: "oklch(0.72 0.14 220)" }} />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "oklch(0.72 0.14 220)" }}>
                  Pre-Trade Routine
                </span>
              </div>
              <div className="space-y-1">
                {(playbook.pre_trade_routine ?? []).map((step, i) => (
                  <div key={i} className="flex items-center gap-2 group py-1">
                    <span className="text-xs tabular-nums w-4 shrink-0" style={{ color: "oklch(0.72 0.14 220 / 0.6)" }}>{i + 1}.</span>
                    <span className="text-sm flex-1">{step}</span>
                    <button
                      onClick={() => {
                        const steps = [...(playbook.pre_trade_routine ?? [])];
                        steps.splice(i, 1);
                        setPlaybook({ ...playbook, pre_trade_routine: steps });
                        setPlaybookDirty(true);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: "oklch(0.55 0.04 252)" }}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={newRoutineStep}
                  onChange={(e) => setNewRoutineStep(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newRoutineStep.trim()) {
                      setPlaybook({ ...playbook, pre_trade_routine: [...(playbook.pre_trade_routine ?? []), newRoutineStep.trim()] });
                      setNewRoutineStep(""); setPlaybookDirty(true);
                    }
                  }}
                  placeholder="Add a step..."
                  className="flex-1 rounded-lg px-3 py-2 text-xs outline-none"
                  style={{ background: "oklch(0.09 0.014 252)", border: "1px solid oklch(0.22 0.025 252)", color: "oklch(0.93 0.008 252)" }}
                />
                <button
                  onClick={() => {
                    if (!newRoutineStep.trim()) return;
                    setPlaybook({ ...playbook, pre_trade_routine: [...(playbook.pre_trade_routine ?? []), newRoutineStep.trim()] });
                    setNewRoutineStep(""); setPlaybookDirty(true);
                  }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "oklch(0.72 0.14 220 / 0.12)", color: "oklch(0.72 0.14 220)", border: "1px solid oklch(0.72 0.14 220 / 0.20)" }}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* A+ Criteria + Weaknesses */}
          <div className="grid lg:grid-cols-2">
            {/* A+ Criteria */}
            <div className="p-5 space-y-3" style={{ borderRight: "1px solid oklch(0.18 0.022 252)" }}>
              <div className="flex items-center gap-2">
                <Target className="w-3.5 h-3.5 shrink-0" style={{ color: "oklch(0.58 0.17 145)" }} />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "oklch(0.58 0.17 145)" }}>
                  A+ Trade Criteria
                </span>
              </div>
              <textarea
                rows={4}
                value={playbook.a_plus_criteria || ""}
                onChange={(e) => { setPlaybook({ ...playbook, a_plus_criteria: e.target.value }); setPlaybookDirty(true); }}
                placeholder="Describe your ideal A+ setup..."
                className="w-full rounded-lg px-3 py-2.5 text-sm resize-none"
                style={{ background: "oklch(0.09 0.014 252)", border: "1px solid oklch(0.22 0.025 252)", color: "oklch(0.93 0.008 252)", outline: "none" }}
              />
            </div>

            {/* Known Weaknesses */}
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" style={{ color: "oklch(0.70 0.16 72)" }} />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "oklch(0.70 0.16 72)" }}>
                  Known Weaknesses
                </span>
              </div>
              {(playbook.common_weaknesses ?? []).length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {(playbook.common_weaknesses ?? []).map((w) => (
                    <span
                      key={w}
                      className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-medium"
                      style={{ background: "oklch(0.70 0.16 72 / 0.12)", color: "oklch(0.70 0.16 72)", border: "1px solid oklch(0.70 0.16 72 / 0.22)" }}
                    >
                      {w}
                      <button
                        onClick={() => {
                          setPlaybook({ ...playbook, common_weaknesses: (playbook.common_weaknesses ?? []).filter((x: string) => x !== w) });
                          setPlaybookDirty(true);
                        }}
                        className="hover:opacity-60 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newWeakness}
                  onChange={(e) => setNewWeakness(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newWeakness.trim()) {
                      const w = newWeakness.trim();
                      if (!(playbook.common_weaknesses ?? []).includes(w)) {
                        setPlaybook({ ...playbook, common_weaknesses: [...(playbook.common_weaknesses ?? []), w] });
                      }
                      setNewWeakness(""); setPlaybookDirty(true);
                    }
                  }}
                  placeholder="Add a weakness..."
                  className="flex-1 rounded-lg px-3 py-2 text-xs outline-none"
                  style={{ background: "oklch(0.09 0.014 252)", border: "1px solid oklch(0.22 0.025 252)", color: "oklch(0.93 0.008 252)" }}
                />
                <button
                  onClick={() => {
                    const w = newWeakness.trim();
                    if (!w) return;
                    if (!(playbook.common_weaknesses ?? []).includes(w)) {
                      setPlaybook({ ...playbook, common_weaknesses: [...(playbook.common_weaknesses ?? []), w] });
                    }
                    setNewWeakness(""); setPlaybookDirty(true);
                  }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "oklch(0.70 0.16 72 / 0.12)", color: "oklch(0.70 0.16 72)", border: "1px solid oklch(0.70 0.16 72 / 0.22)" }}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Save bar */}
          {playbookDirty && (
            <div style={{ borderTop: "1px solid oklch(0.18 0.022 252)" }}>
              <button
                onClick={savePlaybookData}
                className="w-full py-3 text-sm font-semibold transition-all hover:opacity-90"
                style={{ background: "oklch(0.72 0.14 220 / 0.15)", color: "oklch(0.72 0.14 220)" }}
              >
                Save Playbook
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

// ── Day Summary Badges ────────────────────────────────────────────────────────

function DaySummaryBadges({ date }: { date: string }) {
  const summary = getDaySummary(date);

  const items = [
    {
      label: "Pre-Market",
      done: summary.hasAnalysis,
      detail: summary.hasAnalysis ? `${summary.analysisCount} analysis` : "Not done",
      color: "oklch(0.74 0.13 82)",
    },
    {
      label: "Habits",
      done: summary.habitCompleted > 0,
      detail: `${summary.habitCompleted}/${summary.habitCount} done`,
      color: "oklch(0.72 0.14 220)",
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
      color: "oklch(0.72 0.14 220)",
    },
    {
      label: "Tracker",
      done: summary.hasStateCheck,
      detail:
        summary.hasStateCheck && summary.stateScore !== null
          ? `Avg: ${summary.stateScore}/10`
          : "Not logged",
      color: "oklch(0.74 0.13 82)",
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
            background: done ? `${color}0d` : "oklch(0.12 0.018 252)",
            border: `1px solid ${done ? `${color}33` : "oklch(0.22 0.025 252)"}`,
          }}
        >
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center mx-auto mb-1.5"
            style={{ background: done ? `${color}1a` : "oklch(0.18 0.022 252)" }}
          >
            {done ? (
              <Check className="w-3 h-3" style={{ color }} />
            ) : (
              <Minus className="w-3 h-3" style={{ color: "oklch(0.40 0.03 252)" }} />
            )}
          </div>
          <p
            className="text-xs font-semibold"
            style={{ color: done ? color : "oklch(0.55 0.04 252)" }}
          >
            {label}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{detail}</p>
        </div>
      ))}
    </div>
  );
}
