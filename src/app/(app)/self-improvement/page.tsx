"use client";

import { useState, useEffect } from "react";
import { format, startOfWeek, addDays, subDays } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Flame,
  Brain,
  Moon,
  Target,
  BarChart2,
  BookOpen,
  Plus,
  Check,
  Trash2,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getDailyJournal,
  saveDailyJournal,
  getDailyStateCheck,
  saveDailyStateCheck,
  getSleepRecovery,
  saveSleepRecovery,
  getPersonalStandards,
  createPersonalStandard,
  deletePersonalStandard,
  getStandardScores,
  toggleStandardScore,
  getWeeklyReflection,
  saveWeeklyReflection,
  getHabits,
  getHabitCompletions,
  getTrades,
  getAnalyses,
  getDaySummary,
} from "@/lib/mock/store";
import type {
  DailyJournalEntry,
  DailyStateCheck,
  SleepRecovery,
  PersonalStandard,
  WeeklyReflection,
} from "@/lib/types";

// ── Helpers ──────────────────────────────────────────────────────────────────

function toDate(d: Date) {
  return format(d, "yyyy-MM-dd");
}

function getMonday(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

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
        <span
          className="text-xs font-bold tabular-nums w-6 text-right"
          style={{ color }}
        >
          {value}
        </span>
      </div>
      <div className="flex gap-1">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
          const active = n <= value;
          const isGood = invert ? n <= 3 : n >= 7;
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
              style={{
                background: active
                  ? activeColor
                  : "oklch(0.22 0.025 252)",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

// ── Section Card wrapper ──────────────────────────────────────────────────────
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
  const [activeTab, setActiveTab] = useState<"daily" | "weekly" | "insights">("daily");

  // Journal state
  const [journal, setJournal] = useState<Partial<DailyJournalEntry>>({});
  const [journalDirty, setJournalDirty] = useState(false);

  // State check
  const [stateCheck, setStateCheck] = useState<Partial<DailyStateCheck>>({
    mood: 5, energy: 5, focus: 5, stress: 5, confidence: 5,
    emotional_stability: 5, patience: 5, impulsiveness: 5,
  });
  const [stateDirty, setStateDirty] = useState(false);

  // Sleep/Recovery
  const [sleep, setSleep] = useState<Partial<SleepRecovery>>({
    hours_slept: 7, sleep_quality: 7, training_movement: false,
    screen_discipline: 7, rest_quality: 7, notes: "",
  });
  const [sleepDirty, setSleepDirty] = useState(false);

  // Standards
  const [standards, setStandards] = useState<PersonalStandard[]>([]);
  const [standardScores, setStandardScores] = useState<ReturnType<typeof getStandardScores>>([]);
  const [newStandardText, setNewStandardText] = useState("");

  // Weekly reflection
  const weekStart = toDate(getMonday(new Date(selectedDate + "T12:00:00")));
  const [weeklyRefl, setWeeklyRefl] = useState<Partial<WeeklyReflection>>({});
  const [weeklyDirty, setWeeklyDirty] = useState(false);

  // Load data when date changes
  useEffect(() => {
    const j = getDailyJournal(selectedDate);
    setJournal(j || {});
    setJournalDirty(false);

    const sc = getDailyStateCheck(selectedDate);
    setStateCheck(sc || { mood: 5, energy: 5, focus: 5, stress: 5, confidence: 5, emotional_stability: 5, patience: 5, impulsiveness: 5 });
    setStateDirty(false);

    const sl = getSleepRecovery(selectedDate);
    setSleep(sl || { hours_slept: 7, sleep_quality: 7, training_movement: false, screen_discipline: 7, rest_quality: 7, notes: "" });
    setSleepDirty(false);

    setStandards(getPersonalStandards());
    setStandardScores(getStandardScores(selectedDate));
  }, [selectedDate]);

  useEffect(() => {
    const wr = getWeeklyReflection(weekStart);
    setWeeklyRefl(wr || {});
    setWeeklyDirty(false);
  }, [weekStart]);

  // Save handlers
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

  function saveState() {
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
    setStateDirty(false);
  }

  function saveSleep() {
    saveSleepRecovery({
      date: selectedDate,
      hours_slept: sleep.hours_slept ?? 7,
      sleep_quality: sleep.sleep_quality ?? 7,
      training_movement: sleep.training_movement ?? false,
      screen_discipline: sleep.screen_discipline ?? 7,
      rest_quality: sleep.rest_quality ?? 7,
      notes: sleep.notes || "",
    });
    setSleepDirty(false);
  }

  function saveWeekly() {
    saveWeeklyReflection({
      week_start: weekStart,
      best_habits: weeklyRefl.best_habits || "",
      biggest_weakness: weeklyRefl.biggest_weakness || "",
      emotional_patterns: weeklyRefl.emotional_patterns || "",
      what_improved: weeklyRefl.what_improved || "",
      what_hurt_performance: weeklyRefl.what_hurt_performance || "",
      focus_next_week: weeklyRefl.focus_next_week || "",
    });
    setWeeklyDirty(false);
  }

  function handleToggleStandard(id: string) {
    toggleStandardScore(id, selectedDate);
    setStandardScores(getStandardScores(selectedDate));
  }

  function handleAddStandard() {
    if (!newStandardText.trim()) return;
    createPersonalStandard(newStandardText.trim());
    setStandards(getPersonalStandards());
    setNewStandardText("");
  }

  function handleDeleteStandard(id: string) {
    deletePersonalStandard(id);
    setStandards(getPersonalStandards());
  }

  // Navigation
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

  // Insights data
  const trades = getTrades();
  const habits = getHabits();
  const allCompletions = getHabitCompletions();
  const allStateChecks: DailyStateCheck[] = [];
  // Build state check data across all dates for correlation
  const tradeDates = [...new Set(trades.map((t) => t.date_time.slice(0, 10)))];
  tradeDates.forEach((d) => {
    const sc = getDailyStateCheck(d);
    if (sc) allStateChecks.push(sc);
  });

  const isToday = selectedDate === today;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="animate-fade-up flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Self-Improvement</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Trader self-mastery — where your mindset shapes your results
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="animate-fade-up flex gap-1 p-1 rounded-xl"
        style={{ background: "oklch(0.12 0.018 252)", border: "1px solid oklch(0.22 0.025 252)" }}
      >
        {(["daily", "weekly", "insights"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all"
            style={
              activeTab === tab
                ? {
                    background: "oklch(0.18 0.022 252)",
                    color: "oklch(0.93 0.008 252)",
                    boxShadow: "0 1px 3px oklch(0 0 0 / 0.3)",
                  }
                : { color: "oklch(0.55 0.04 252)" }
            }
          >
            {tab === "daily" ? "Daily Check-In" : tab === "weekly" ? "Weekly Review" : "Growth Insights"}
          </button>
        ))}
      </div>

      {/* DAILY TAB */}
      {activeTab === "daily" && (
        <div className="space-y-5 animate-fade-up">
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
                <span
                  className="text-xs font-medium"
                  style={{ color: "oklch(0.72 0.14 220)" }}
                >
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

          {/* Day Summary Badges */}
          <DaySummaryBadges date={selectedDate} />

          <div className="grid lg:grid-cols-2 gap-5">
            {/* A. Daily Journal */}
            <SectionCard title="Daily Journal" icon={BookOpen} accent="oklch(0.72 0.14 220)">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    How did you feel today?
                  </label>
                  <textarea
                    rows={2}
                    value={journal.mood_note || ""}
                    onChange={(e) => { setJournal({ ...journal, mood_note: e.target.value }); setJournalDirty(true); }}
                    placeholder="Mental state, emotions, overall energy..."
                    className="w-full rounded-lg px-3 py-2.5 text-sm resize-none transition-colors"
                    style={{
                      background: "oklch(0.09 0.014 252)",
                      border: "1px solid oklch(0.22 0.025 252)",
                      color: "oklch(0.93 0.008 252)",
                      outline: "none",
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Focus / discipline / mental state
                  </label>
                  <textarea
                    rows={2}
                    value={journal.mental_state || ""}
                    onChange={(e) => { setJournal({ ...journal, mental_state: e.target.value }); setJournalDirty(true); }}
                    placeholder="Confidence level, focus quality, stress signals..."
                    className="w-full rounded-lg px-3 py-2.5 text-sm resize-none transition-colors"
                    style={{
                      background: "oklch(0.09 0.014 252)",
                      border: "1px solid oklch(0.22 0.025 252)",
                      color: "oklch(0.93 0.008 252)",
                      outline: "none",
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    What went well today?
                  </label>
                  <textarea
                    rows={2}
                    value={journal.what_went_well || ""}
                    onChange={(e) => { setJournal({ ...journal, what_went_well: e.target.value }); setJournalDirty(true); }}
                    placeholder="Wins, good decisions, moments of discipline..."
                    className="w-full rounded-lg px-3 py-2.5 text-sm resize-none transition-colors"
                    style={{
                      background: "oklch(0.09 0.014 252)",
                      border: "1px solid oklch(0.22 0.025 252)",
                      color: "oklch(0.93 0.008 252)",
                      outline: "none",
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    What hurt your performance?
                  </label>
                  <textarea
                    rows={2}
                    value={journal.what_hurt_performance || ""}
                    onChange={(e) => { setJournal({ ...journal, what_hurt_performance: e.target.value }); setJournalDirty(true); }}
                    placeholder="Mistakes, impulses, distractions, emotional trades..."
                    className="w-full rounded-lg px-3 py-2.5 text-sm resize-none transition-colors"
                    style={{
                      background: "oklch(0.09 0.014 252)",
                      border: "1px solid oklch(0.22 0.025 252)",
                      color: "oklch(0.93 0.008 252)",
                      outline: "none",
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    What will you improve tomorrow?
                  </label>
                  <textarea
                    rows={2}
                    value={journal.improve_tomorrow || ""}
                    onChange={(e) => { setJournal({ ...journal, improve_tomorrow: e.target.value }); setJournalDirty(true); }}
                    placeholder="One clear intention for tomorrow..."
                    className="w-full rounded-lg px-3 py-2.5 text-sm resize-none transition-colors"
                    style={{
                      background: "oklch(0.09 0.014 252)",
                      border: "1px solid oklch(0.22 0.025 252)",
                      color: "oklch(0.93 0.008 252)",
                      outline: "none",
                    }}
                  />
                </div>
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

            {/* C. Mood / State Tracking */}
            <SectionCard title="Mental State Check" icon={Brain} accent="oklch(0.74 0.13 82)">
              <div className="space-y-4">
                <ScoreBar
                  label="Mood"
                  value={stateCheck.mood ?? 5}
                  onChange={(v) => { setStateCheck({ ...stateCheck, mood: v }); setStateDirty(true); }}
                  color="oklch(0.74 0.13 82)"
                />
                <ScoreBar
                  label="Energy"
                  value={stateCheck.energy ?? 5}
                  onChange={(v) => { setStateCheck({ ...stateCheck, energy: v }); setStateDirty(true); }}
                  color="oklch(0.72 0.14 220)"
                />
                <ScoreBar
                  label="Focus"
                  value={stateCheck.focus ?? 5}
                  onChange={(v) => { setStateCheck({ ...stateCheck, focus: v }); setStateDirty(true); }}
                  color="oklch(0.72 0.14 220)"
                />
                <ScoreBar
                  label="Stress (1=low)"
                  value={stateCheck.stress ?? 5}
                  onChange={(v) => { setStateCheck({ ...stateCheck, stress: v }); setStateDirty(true); }}
                  color="oklch(0.58 0.22 25)"
                  invert
                />
                <ScoreBar
                  label="Confidence"
                  value={stateCheck.confidence ?? 5}
                  onChange={(v) => { setStateCheck({ ...stateCheck, confidence: v }); setStateDirty(true); }}
                  color="oklch(0.58 0.17 145)"
                />
                <ScoreBar
                  label="Emotional Stability"
                  value={stateCheck.emotional_stability ?? 5}
                  onChange={(v) => { setStateCheck({ ...stateCheck, emotional_stability: v }); setStateDirty(true); }}
                  color="oklch(0.58 0.17 145)"
                />
                <ScoreBar
                  label="Patience"
                  value={stateCheck.patience ?? 5}
                  onChange={(v) => { setStateCheck({ ...stateCheck, patience: v }); setStateDirty(true); }}
                  color="oklch(0.72 0.14 220)"
                />
                <ScoreBar
                  label="Impulsiveness (1=low)"
                  value={stateCheck.impulsiveness ?? 5}
                  onChange={(v) => { setStateCheck({ ...stateCheck, impulsiveness: v }); setStateDirty(true); }}
                  color="oklch(0.58 0.22 25)"
                  invert
                />
                {stateDirty && (
                  <button
                    onClick={saveState}
                    className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all hover:-translate-y-px mt-2"
                    style={{
                      background: "oklch(0.74 0.13 82)",
                      color: "oklch(0.08 0.014 252)",
                      boxShadow: "0 4px 14px oklch(0.74 0.13 82 / 0.30)",
                    }}
                  >
                    Save State Check
                  </button>
                )}
              </div>
            </SectionCard>

            {/* D. Sleep / Recovery */}
            <SectionCard title="Sleep & Recovery" icon={Moon} accent="oklch(0.58 0.17 145)">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground block mb-1.5">Hours Slept</label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setSleep({ ...sleep, hours_slept: Math.max(0, (sleep.hours_slept ?? 7) - 0.5) }); setSleepDirty(true); }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                        style={{ background: "oklch(0.09 0.014 252)", border: "1px solid oklch(0.22 0.025 252)" }}
                      >
                        −
                      </button>
                      <span className="text-lg font-bold tabular-nums w-10 text-center" style={{ color: "oklch(0.58 0.17 145)" }}>
                        {sleep.hours_slept ?? 7}h
                      </span>
                      <button
                        onClick={() => { setSleep({ ...sleep, hours_slept: Math.min(12, (sleep.hours_slept ?? 7) + 0.5) }); setSleepDirty(true); }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                        style={{ background: "oklch(0.09 0.014 252)", border: "1px solid oklch(0.22 0.025 252)" }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground block mb-1.5">Movement Today</label>
                    <button
                      onClick={() => { setSleep({ ...sleep, training_movement: !sleep.training_movement }); setSleepDirty(true); }}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                      style={
                        sleep.training_movement
                          ? { background: "oklch(0.58 0.17 145 / 0.15)", color: "oklch(0.58 0.17 145)", border: "1px solid oklch(0.58 0.17 145 / 0.30)" }
                          : { background: "oklch(0.09 0.014 252)", color: "oklch(0.55 0.04 252)", border: "1px solid oklch(0.22 0.025 252)" }
                      }
                    >
                      {sleep.training_movement ? <Check className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                      {sleep.training_movement ? "Done" : "Not done"}
                    </button>
                  </div>
                </div>
                <ScoreBar
                  label="Sleep Quality"
                  value={sleep.sleep_quality ?? 7}
                  onChange={(v) => { setSleep({ ...sleep, sleep_quality: v }); setSleepDirty(true); }}
                  color="oklch(0.58 0.17 145)"
                />
                <ScoreBar
                  label="Screen Discipline"
                  value={sleep.screen_discipline ?? 7}
                  onChange={(v) => { setSleep({ ...sleep, screen_discipline: v }); setSleepDirty(true); }}
                  color="oklch(0.72 0.14 220)"
                />
                <ScoreBar
                  label="Rest / Recovery Quality"
                  value={sleep.rest_quality ?? 7}
                  onChange={(v) => { setSleep({ ...sleep, rest_quality: v }); setSleepDirty(true); }}
                  color="oklch(0.58 0.17 145)"
                />
                <div>
                  <label className="text-xs text-muted-foreground block mb-1.5">Notes</label>
                  <textarea
                    rows={2}
                    value={sleep.notes || ""}
                    onChange={(e) => { setSleep({ ...sleep, notes: e.target.value }); setSleepDirty(true); }}
                    placeholder="Anything affecting recovery..."
                    className="w-full rounded-lg px-3 py-2.5 text-sm resize-none"
                    style={{
                      background: "oklch(0.09 0.014 252)",
                      border: "1px solid oklch(0.22 0.025 252)",
                      color: "oklch(0.93 0.008 252)",
                      outline: "none",
                    }}
                  />
                </div>
                {sleepDirty && (
                  <button
                    onClick={saveSleep}
                    className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all hover:-translate-y-px"
                    style={{
                      background: "oklch(0.58 0.17 145)",
                      color: "oklch(0.08 0.014 252)",
                      boxShadow: "0 4px 14px oklch(0.58 0.17 145 / 0.30)",
                    }}
                  >
                    Save Recovery Data
                  </button>
                )}
              </div>
            </SectionCard>

            {/* E. Personal Standards */}
            <SectionCard title="Personal Standards" icon={Target} accent="oklch(0.70 0.16 72)">
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Did you live up to your identity today? Check each standard you honoured.
                </p>
                <div className="space-y-2">
                  {standards.map((standard) => {
                    const score = standardScores.find((s) => s.standard_id === standard.id);
                    const lived = score?.lived ?? false;
                    return (
                      <div
                        key={standard.id}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg group"
                        style={{ background: "oklch(0.09 0.014 252)", border: "1px solid oklch(0.22 0.025 252)" }}
                      >
                        <button
                          onClick={() => handleToggleStandard(standard.id)}
                          className="w-5 h-5 rounded-md shrink-0 flex items-center justify-center transition-all"
                          style={
                            lived
                              ? { background: "oklch(0.58 0.17 145)", border: "none" }
                              : { background: "transparent", border: "1.5px solid oklch(0.35 0.03 252)" }
                          }
                        >
                          {lived && <Check className="w-3 h-3 text-white" />}
                        </button>
                        <span className="text-sm flex-1" style={{ color: lived ? "oklch(0.93 0.008 252)" : "oklch(0.55 0.04 252)" }}>
                          {standard.text}
                        </span>
                        <button
                          onClick={() => handleDeleteStandard(standard.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newStandardText}
                    onChange={(e) => setNewStandardText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddStandard()}
                    placeholder="Add a personal standard..."
                    className="flex-1 rounded-lg px-3 py-2 text-sm"
                    style={{
                      background: "oklch(0.09 0.014 252)",
                      border: "1px solid oklch(0.22 0.025 252)",
                      color: "oklch(0.93 0.008 252)",
                      outline: "none",
                    }}
                  />
                  <button
                    onClick={handleAddStandard}
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-all hover:-translate-y-px"
                    style={{
                      background: "oklch(0.70 0.16 72 / 0.15)",
                      color: "oklch(0.70 0.16 72)",
                      border: "1px solid oklch(0.70 0.16 72 / 0.25)",
                    }}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </SectionCard>
          </div>
        </div>
      )}

      {/* WEEKLY TAB */}
      {activeTab === "weekly" && (
        <div className="space-y-5 animate-fade-up">
          <div
            className="flex items-center gap-3 px-5 py-3 rounded-xl"
            style={{ background: "oklch(0.12 0.018 252)", border: "1px solid oklch(0.22 0.025 252)" }}
          >
            <div className="w-2 h-2 rounded-full" style={{ background: "oklch(0.74 0.13 82)" }} />
            <p className="text-sm font-medium">
              Week of{" "}
              {format(new Date(weekStart + "T12:00:00"), "MMMM d")} –{" "}
              {format(addDays(new Date(weekStart + "T12:00:00"), 6), "MMMM d, yyyy")}
            </p>
          </div>

          <WeekHabitGrid weekStart={weekStart} />

          <div
            className="rounded-xl overflow-hidden"
            style={{ background: "oklch(0.12 0.018 252)", border: "1px solid oklch(0.22 0.025 252)" }}
          >
            <div
              className="flex items-center gap-2.5 px-5 py-3.5"
              style={{ borderBottom: "1px solid oklch(0.22 0.025 252)" }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "oklch(0.74 0.13 82 / 0.15)" }}
              >
                <BookOpen className="w-3.5 h-3.5" style={{ color: "oklch(0.74 0.13 82)" }} />
              </div>
              <h2 className="text-sm font-semibold">Weekly Reflection</h2>
            </div>
            <div className="p-5 grid lg:grid-cols-2 gap-4">
              {[
                { key: "best_habits", label: "Best habits this week", placeholder: "What routines worked best for you?" },
                { key: "biggest_weakness", label: "Biggest weakness this week", placeholder: "Where did you fall short?" },
                { key: "emotional_patterns", label: "Emotional patterns noticed", placeholder: "Fear, overconfidence, impatience, discipline..." },
                { key: "what_improved", label: "What improved vs. last week?", placeholder: "Progress in any area..." },
                { key: "what_hurt_performance", label: "What hurt your trading this week?", placeholder: "Execution, mindset, preparation..." },
                { key: "focus_next_week", label: "Main focus for next week", placeholder: "One clear priority to work on..." },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</label>
                  <textarea
                    rows={3}
                    value={(weeklyRefl as Record<string, string>)[key] || ""}
                    onChange={(e) => {
                      setWeeklyRefl({ ...weeklyRefl, [key]: e.target.value });
                      setWeeklyDirty(true);
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
              {weeklyDirty && (
                <div className="lg:col-span-2">
                  <button
                    onClick={saveWeekly}
                    className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all hover:-translate-y-px"
                    style={{
                      background: "oklch(0.74 0.13 82)",
                      color: "oklch(0.08 0.014 252)",
                      boxShadow: "0 4px 14px oklch(0.74 0.13 82 / 0.30)",
                    }}
                  >
                    Save Weekly Reflection
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* INSIGHTS TAB */}
      {activeTab === "insights" && (
        <div className="space-y-5 animate-fade-up">
          <GrowthInsights />
        </div>
      )}
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
      detail: summary.tradeCount > 0 ? `${summary.tradeCount} trade${summary.tradeCount > 1 ? "s" : ""}, ${summary.tradeWins}W` : "No trades",
      color: "oklch(0.58 0.17 145)",
    },
    {
      label: "Journal",
      done: summary.hasJournal,
      detail: summary.hasJournal ? "Written" : "Not written",
      color: "oklch(0.72 0.14 220)",
    },
    {
      label: "State Check",
      done: summary.hasStateCheck,
      detail: summary.hasStateCheck && summary.stateScore !== null ? `Avg: ${summary.stateScore}/10` : "Not logged",
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
            style={{
              background: done ? `${color}1a` : "oklch(0.18 0.022 252)",
            }}
          >
            {done ? (
              <Check className="w-3 h-3" style={{ color }} />
            ) : (
              <Minus className="w-3 h-3" style={{ color: "oklch(0.40 0.03 252)" }} />
            )}
          </div>
          <p className="text-xs font-semibold" style={{ color: done ? color : "oklch(0.55 0.04 252)" }}>
            {label}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{detail}</p>
        </div>
      ))}
    </div>
  );
}

// ── Week Habit Grid ───────────────────────────────────────────────────────────
function WeekHabitGrid({ weekStart }: { weekStart: string }) {
  const habits = getHabits();
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(new Date(weekStart + "T12:00:00"), i);
    return toDate(d);
  });

  if (habits.length === 0) return null;

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: "oklch(0.12 0.018 252)", border: "1px solid oklch(0.22 0.025 252)" }}
    >
      <div
        className="flex items-center justify-between px-5 py-3.5"
        style={{ borderBottom: "1px solid oklch(0.22 0.025 252)" }}
      >
        <h2 className="text-sm font-semibold">Weekly Habit Overview</h2>
        <span className="text-xs text-muted-foreground">7-day grid</span>
      </div>
      <div className="p-5 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="text-left text-muted-foreground font-medium pb-3 pr-4 w-40">Habit</th>
              {weekDays.map((d) => (
                <th key={d} className="text-center text-muted-foreground font-medium pb-3 px-1 w-10">
                  <div>{format(new Date(d + "T12:00:00"), "EEE")}</div>
                  <div className="font-normal">{format(new Date(d + "T12:00:00"), "d")}</div>
                </th>
              ))}
              <th className="text-center text-muted-foreground font-medium pb-3 pl-3 w-14">Rate</th>
            </tr>
          </thead>
          <tbody>
            {habits.map((habit) => {
              const completions = getHabitCompletions(habit.id);
              const weekCompletions = weekDays.filter((d) =>
                completions.some((c) => c.date === d && c.completed)
              ).length;
              const rate = Math.round((weekCompletions / 7) * 100);
              return (
                <tr key={habit.id} style={{ borderTop: "1px solid oklch(0.22 0.025 252 / 0.5)" }}>
                  <td className="py-2.5 pr-4">
                    <div className="flex items-center gap-2">
                      <span>{habit.icon}</span>
                      <span className="text-foreground font-medium truncate max-w-24">{habit.name}</span>
                    </div>
                  </td>
                  {weekDays.map((d) => {
                    const done = completions.some((c) => c.date === d && c.completed);
                    return (
                      <td key={d} className="text-center py-2.5 px-1">
                        <div
                          className="w-6 h-6 rounded-md mx-auto flex items-center justify-center"
                          style={{
                            background: done ? `${habit.color}22` : "oklch(0.09 0.014 252)",
                            border: `1px solid ${done ? `${habit.color}44` : "oklch(0.22 0.025 252)"}`,
                          }}
                        >
                          {done && <Check className="w-3 h-3" style={{ color: habit.color }} />}
                        </div>
                      </td>
                    );
                  })}
                  <td className="text-center py-2.5 pl-3">
                    <span
                      className="font-bold"
                      style={{
                        color: rate >= 70 ? "oklch(0.58 0.17 145)" : rate >= 40 ? "oklch(0.70 0.16 72)" : "oklch(0.58 0.22 25)",
                      }}
                    >
                      {rate}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Growth Insights ───────────────────────────────────────────────────────────
function GrowthInsights() {
  const trades = getTrades();
  const habits = getHabits();
  const today = format(new Date(), "yyyy-MM-dd");

  // Build last 30 days data
  const last30: Array<{
    date: string;
    habitRate: number;
    stateScore: number | null;
    sleepHours: number | null;
    sleepQuality: number | null;
    tradeCount: number;
    winRate: number | null;
  }> = [];

  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const date = format(d, "yyyy-MM-dd");
    const dayTrades = trades.filter((t) => t.date_time.slice(0, 10) === date);
    const dayCompletions = getHabitCompletions(undefined, date).filter((c) => c.completed);
    const sc = getDailyStateCheck(date);
    const sl = getSleepRecovery(date);

    last30.push({
      date,
      habitRate: habits.length > 0 ? dayCompletions.length / habits.length : 0,
      stateScore: sc ? (sc.mood + sc.energy + sc.focus) / 3 : null,
      sleepHours: sl?.hours_slept ?? null,
      sleepQuality: sl?.sleep_quality ?? null,
      tradeCount: dayTrades.length,
      winRate: dayTrades.length > 0 ? dayTrades.filter((t) => t.result === "win").length / dayTrades.length : null,
    });
  }

  // Compute correlations
  const tradingDays = last30.filter((d) => d.tradeCount > 0 && d.winRate !== null);

  const highHabitDays = tradingDays.filter((d) => d.habitRate >= 0.7);
  const lowHabitDays = tradingDays.filter((d) => d.habitRate < 0.4);
  const highHabitWR = highHabitDays.length > 0
    ? Math.round(highHabitDays.reduce((s, d) => s + (d.winRate ?? 0), 0) / highHabitDays.length * 100)
    : null;
  const lowHabitWR = lowHabitDays.length > 0
    ? Math.round(lowHabitDays.reduce((s, d) => s + (d.winRate ?? 0), 0) / lowHabitDays.length * 100)
    : null;

  const highStateDays = tradingDays.filter((d) => d.stateScore !== null && d.stateScore >= 7);
  const lowStateDays = tradingDays.filter((d) => d.stateScore !== null && d.stateScore < 5);
  const highStateWR = highStateDays.length > 0
    ? Math.round(highStateDays.reduce((s, d) => s + (d.winRate ?? 0), 0) / highStateDays.length * 100)
    : null;
  const lowStateWR = lowStateDays.length > 0
    ? Math.round(lowStateDays.reduce((s, d) => s + (d.winRate ?? 0), 0) / lowStateDays.length * 100)
    : null;

  const goodSleepDays = tradingDays.filter((d) => d.sleepHours !== null && d.sleepHours >= 7.5);
  const poorSleepDays = tradingDays.filter((d) => d.sleepHours !== null && d.sleepHours < 6);
  const goodSleepWR = goodSleepDays.length > 0
    ? Math.round(goodSleepDays.reduce((s, d) => s + (d.winRate ?? 0), 0) / goodSleepDays.length * 100)
    : null;
  const poorSleepWR = poorSleepDays.length > 0
    ? Math.round(poorSleepDays.reduce((s, d) => s + (d.winRate ?? 0), 0) / poorSleepDays.length * 100)
    : null;

  const hasEnoughData = tradingDays.length >= 3;

  const insights = [
    {
      title: "Habit Consistency → Win Rate",
      color: "oklch(0.72 0.14 220)",
      icon: TrendingUp,
      available: highHabitDays.length >= 2 && lowHabitDays.length >= 2,
      positive: (highHabitWR ?? 0) > (lowHabitWR ?? 0),
      description: highHabitDays.length >= 2 && lowHabitDays.length >= 2
        ? `High habit days: ${highHabitWR}% win rate vs ${lowHabitWR}% on low habit days. Your preparation compound.`
        : "Log habits and trades on the same days to see this correlation.",
      data: highHabitDays.length >= 2 && lowHabitDays.length >= 2
        ? [
            { label: "High habits (70%+)", value: `${highHabitWR}%`, color: "oklch(0.58 0.17 145)" },
            { label: "Low habits (<40%)", value: `${lowHabitWR}%`, color: "oklch(0.58 0.22 25)" },
          ]
        : [],
    },
    {
      title: "Mental State → Execution",
      color: "oklch(0.74 0.13 82)",
      icon: Brain,
      available: highStateDays.length >= 2 && lowStateDays.length >= 2,
      positive: (highStateWR ?? 0) > (lowStateWR ?? 0),
      description: highStateDays.length >= 2 && lowStateDays.length >= 2
        ? `High mental state days show ${highStateWR}% win rate vs ${lowStateWR}% when mental state is low. Your mindset is your edge.`
        : "Complete daily state checks before trading days to unlock this insight.",
      data: highStateDays.length >= 2 && lowStateDays.length >= 2
        ? [
            { label: "High state (7+/10)", value: `${highStateWR}%`, color: "oklch(0.58 0.17 145)" },
            { label: "Low state (<5/10)", value: `${lowStateWR}%`, color: "oklch(0.58 0.22 25)" },
          ]
        : [],
    },
    {
      title: "Sleep Quality → Trading Performance",
      color: "oklch(0.58 0.17 145)",
      icon: Moon,
      available: goodSleepDays.length >= 2 && poorSleepDays.length >= 2,
      positive: (goodSleepWR ?? 0) > (poorSleepWR ?? 0),
      description: goodSleepDays.length >= 2 && poorSleepDays.length >= 2
        ? `7.5h+ sleep: ${goodSleepWR}% win rate vs ${poorSleepWR}% under 6 hours. Recovery directly affects decision quality.`
        : "Log sleep data consistently to see how rest affects your trading.",
      data: goodSleepDays.length >= 2 && poorSleepDays.length >= 2
        ? [
            { label: "7.5h+ sleep", value: `${goodSleepWR}%`, color: "oklch(0.58 0.17 145)" },
            { label: "<6h sleep", value: `${poorSleepWR}%`, color: "oklch(0.58 0.22 25)" },
          ]
        : [],
    },
  ];

  return (
    <div className="space-y-5">
      <div
        className="rounded-xl p-4"
        style={{
          background: "oklch(0.12 0.018 252)",
          border: "1px solid oklch(0.74 0.13 82 / 0.25)",
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
            style={{ background: "oklch(0.74 0.13 82 / 0.15)" }}
          >
            <BarChart2 className="w-4 h-4" style={{ color: "oklch(0.74 0.13 82)" }} />
          </div>
          <div>
            <p className="text-sm font-semibold mb-1">Personal Growth Correlation Engine</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Tradecore analyses the relationship between your habits, mental state, sleep, and trading results.
              The more you log, the more precise these correlations become.
              {!hasEnoughData && " Continue logging daily check-ins and trades to unlock insights."}
            </p>
          </div>
        </div>
      </div>

      {insights.map(({ title, color, icon: Icon, available, positive, description, data }) => (
        <div
          key={title}
          className="rounded-xl overflow-hidden"
          style={{
            background: "oklch(0.12 0.018 252)",
            border: `1px solid ${available ? `${color}33` : "oklch(0.22 0.025 252)"}`,
          }}
        >
          <div
            className="flex items-center gap-2.5 px-5 py-3.5"
            style={{ borderBottom: "1px solid oklch(0.22 0.025 252)" }}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: `${color}1a` }}
            >
              <Icon className="w-3.5 h-3.5" style={{ color }} />
            </div>
            <h3 className="text-sm font-semibold">{title}</h3>
            {available && (
              <div
                className="ml-auto flex items-center gap-1 text-xs font-medium"
                style={{ color: positive ? "oklch(0.58 0.17 145)" : "oklch(0.58 0.22 25)" }}
              >
                {positive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {positive ? "Positive correlation" : "Negative correlation"}
              </div>
            )}
          </div>
          <div className="p-5">
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">{description}</p>
            {data.length > 0 && (
              <div className="flex gap-4">
                {data.map(({ label, value, color: c }) => (
                  <div key={label} className="flex-1 rounded-lg p-3 text-center" style={{ background: "oklch(0.09 0.014 252)", border: "1px solid oklch(0.22 0.025 252)" }}>
                    <p className="text-lg font-black tabular-nums" style={{ color: c }}>{value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
