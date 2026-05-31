"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { PageHeader } from "@/components/ui/page-header";
import { PageWrapper } from "@/components/ui/page-wrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, Plus, Check, Pencil, Trash2, X, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getHabits, createHabit, updateHabit, deleteHabit,
  getHabitCompletions,
} from "@/lib/mock/store";
import type { Habit, HabitCompletion } from "@/lib/types";
import { cn } from "@/lib/utils";

const TODAY = format(new Date(), "yyyy-MM-dd");

export default function CommandCenterPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newHabitName, setNewHabitName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setHabits(getHabits());
    setCompletions(getHabitCompletions());
  }, []);

  const todayDone = completions
    .filter((c) => c.date === TODAY && c.completed)
    .map((c) => c.habit_id);

  function toggleHabit(habitId: string) {
    const isDone = todayDone.includes(habitId);
    if (isDone) {
      setCompletions((prev) =>
        prev.filter((c) => !(c.habit_id === habitId && c.date === TODAY && c.completed))
      );
    } else {
      const newC: HabitCompletion = {
        id: `hc_${Date.now()}`,
        habit_id: habitId,
        date: TODAY,
        completed: true,
      };
      setCompletions((prev) => [...prev, newC]);
    }
  }

  function handleAddHabit(e: React.FormEvent) {
    e.preventDefault();
    const name = newHabitName.trim();
    if (!name) return;
    const created = createHabit({ name, description: "", category: "routine", frequency: "daily", target_days: 7, color: "#F97316", icon: "" });
    setHabits(getHabits());
    setNewHabitName("");
    setShowAdd(false);
    // Auto-mark done today
    const newC: HabitCompletion = {
      id: `hc_${Date.now()}`,
      habit_id: created.id,
      date: TODAY,
      completed: false,
    };
    void newC;
  }

  function handleStartEdit(habit: Habit) {
    setEditingId(habit.id);
    setEditName(habit.name);
  }

  function handleSaveEdit(id: string) {
    const name = editName.trim();
    if (!name) return;
    updateHabit(id, { name });
    setHabits(getHabits());
    setEditingId(null);
  }

  function handleDelete(id: string) {
    deleteHabit(id);
    setHabits(getHabits());
    setCompletions((prev) => prev.filter((c) => c.habit_id !== id));
  }

  const doneCount = todayDone.length;
  const totalCount = habits.length;
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  // Weekly history: last 7 days
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return format(d, "yyyy-MM-dd");
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        badge="Daily"
        title="Command Center"
        subtitle={format(new Date(), "EEEE, MMMM d")}
      />
      <PageWrapper>
        {/* Habit tracker card */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Flame className="w-4 h-4" style={{ color: "#F97316" }} />
                Habits
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs tabular-nums">
                  {doneCount}/{totalCount}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs h-7 px-2"
                  onClick={() => { setShowAdd(!showAdd); setEditingId(null); }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </Button>
              </div>
            </div>

            {/* Progress bar */}
            {totalCount > 0 && (
              <div className="mt-3">
                <div className="h-1.5 rounded-full bg-border overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: pct === 100 ? "oklch(0.68 0.20 130)" : "#F97316" }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">{pct}% complete today</p>
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-1.5">
            {/* Add habit form */}
            {showAdd && (
              <form
                onSubmit={handleAddHabit}
                className="flex gap-2 mb-3 pb-3 border-b border-border/50"
              >
                <Input
                  autoFocus
                  value={newHabitName}
                  onChange={(e) => setNewHabitName(e.target.value)}
                  placeholder="Habit name..."
                  className="h-8 text-sm"
                />
                <Button type="submit" size="sm" className="h-8 shrink-0">Save</Button>
                <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0" onClick={() => setShowAdd(false)}>
                  <X className="w-3.5 h-3.5" />
                </Button>
              </form>
            )}

            {habits.length === 0 ? (
              <div className="py-8 text-center">
                <Flame className="w-8 h-8 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No habits yet.</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Click "Add" to create your first habit.</p>
              </div>
            ) : (
              habits.map((habit) => {
                const done = todayDone.includes(habit.id);
                const isEditing = editingId === habit.id;

                return (
                  <div
                    key={habit.id}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group",
                      done ? "bg-primary/5 border border-primary/15" : "hover:bg-muted/50"
                    )}
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleHabit(habit.id)}
                      className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center border-2 transition-all"
                      style={{
                        borderColor: done ? "#F97316" : "var(--border)",
                        background: done ? "#F97316" : "transparent",
                      }}
                    >
                      {done && <Check className="w-3 h-3 text-white" />}
                    </button>

                    {/* Name / edit field */}
                    {isEditing ? (
                      <form
                        onSubmit={(e) => { e.preventDefault(); handleSaveEdit(habit.id); }}
                        className="flex-1 flex gap-2"
                      >
                        <Input
                          autoFocus
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-7 text-sm py-0"
                        />
                        <Button type="submit" size="sm" className="h-7 text-xs px-2">Save</Button>
                        <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setEditingId(null)}>
                          <X className="w-3 h-3" />
                        </Button>
                      </form>
                    ) : (
                      <>
                        <span className={cn("flex-1 text-sm font-medium transition-colors", done ? "text-foreground/50 line-through" : "text-foreground")}>
                          {habit.name}
                        </span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleStartEdit(habit)} className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button onClick={() => handleDelete(habit.id)} className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Weekly overview */}
        {habits.length > 0 && (
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <button
                className="flex items-center justify-between w-full text-left"
                onClick={() => setExpanded(!expanded)}
              >
                <CardTitle className="text-sm font-semibold">Week overzicht</CardTitle>
                {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </button>
            </CardHeader>
            {expanded && (
              <CardContent>
                <div className="grid grid-cols-7 gap-1">
                  {weekDays.map((day) => {
                    const dayLabel = format(new Date(day + "T12:00:00"), "EEE");
                    const isToday = day === TODAY;
                    const dayDone = completions.filter((c) => c.date === day && c.completed).length;
                    const dayPct = habits.length > 0 ? dayDone / habits.length : 0;
                    return (
                      <div key={day} className="flex flex-col items-center gap-1.5">
                        <span className={cn("text-[10px] font-medium", isToday ? "text-primary" : "text-muted-foreground")}>
                          {dayLabel}
                        </span>
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                          style={{
                            background: dayPct === 1
                              ? "oklch(0.68 0.20 130 / 0.15)"
                              : dayPct > 0
                              ? "oklch(0.72 0.22 45 / 0.12)"
                              : "var(--muted)",
                            color: dayPct === 1
                              ? "oklch(0.68 0.20 130)"
                              : dayPct > 0
                              ? "#F97316"
                              : "var(--muted-foreground)",
                            border: isToday ? "1.5px solid #F97316" : "1px solid transparent",
                          }}
                        >
                          {dayDone}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-[10px] text-muted-foreground mt-3">Aantal habits voltooid per dag</p>
              </CardContent>
            )}
          </Card>
        )}
      </PageWrapper>
    </div>
  );
}
