"use client";

import { useEffect, useMemo, useState } from "react";
import {
  format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter,
} from "date-fns";
import { Plus, Target, Trash2, Loader2, Check, X, Archive } from "lucide-react";
import { AccentPanel } from "@/components/ui/accent-panel";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  getTradingGoals, createTradingGoal, updateTradingGoal, deleteTradingGoal,
  getTrades, getHabits, getHabitCompletions,
} from "@/lib/supabase/queries";
import {
  GOAL_METRICS, METRIC_META, computeGoalProgress, describeGoal, formatGoalValue,
  measureMetric, type GoalInputs, type GoalProgress,
} from "@/lib/goals/goals";
import type { GoalMetric, TradingGoal } from "@/lib/types";

const iso = (d: Date) => format(d, "yyyy-MM-dd");

/** The windows a goal is usually set over, plus a free-form escape hatch. */
const WINDOWS = [
  { key: "week", label: "This week", range: (n: Date) => ({ start: startOfWeek(n, { weekStartsOn: 1 }), end: endOfWeek(n, { weekStartsOn: 1 }) }) },
  { key: "month", label: "This month", range: (n: Date) => ({ start: startOfMonth(n), end: endOfMonth(n) }) },
  { key: "quarter", label: "This quarter", range: (n: Date) => ({ start: startOfQuarter(n), end: endOfQuarter(n) }) },
  { key: "custom", label: "Custom", range: null },
] as const;

type WindowKey = (typeof WINDOWS)[number]["key"];

const STATE_STYLE: Record<GoalProgress["state"], { color: string; label: string }> = {
  "achieved": { color: "var(--win)", label: "Achieved" },
  "on-track": { color: "var(--primary)", label: "On track" },
  "behind": { color: "var(--be)", label: "Behind pace" },
  "missed": { color: "var(--loss)", label: "Missed" },
  "no-data": { color: "var(--muted-foreground)", label: "Nothing logged yet" },
};

/**
 * A target below where you already are is not a goal. When the metric is
 * picked (or the window changes) the suggestion is nudged past the current
 * reading: a round step up for percentages, a quarter more for counts and R.
 */
function suggestTarget(metric: GoalMetric, baseline: number | null): number {
  const { defaultTarget, unit } = METRIC_META[metric];
  if (baseline == null || baseline < defaultTarget) return defaultTarget;
  if (unit === "percent") return Math.min(100, Math.ceil((baseline + 5) / 5) * 5);
  if (unit === "R") return Math.ceil((baseline * 1.25) / 5) * 5;
  return Math.ceil(baseline * 1.25);
}

export function GoalsView() {
  const [goals, setGoals] = useState<TradingGoal[] | null>(null);
  const [data, setData] = useState<GoalInputs | null>(null);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    Promise.all([getTradingGoals(), getTrades(), getHabits(), getHabitCompletions()])
      .then(([g, trades, habits, completions]) => {
        setGoals(g);
        setData({ trades, habits, completions });
      })
      .catch(() => {
        setGoals([]);
        setData({ trades: [], habits: [], completions: [] });
      });
  }, []);

  const visible = useMemo(
    () => (goals ?? []).filter((g) => (showArchived ? g.archived_at : !g.archived_at)),
    [goals, showArchived]
  );
  const archivedCount = useMemo(() => (goals ?? []).filter((g) => g.archived_at).length, [goals]);

  async function add(draft: Omit<TradingGoal, "id" | "user_id" | "created_at" | "updated_at">) {
    setBusy("new");
    try {
      const saved = await createTradingGoal(draft);
      setGoals((prev) => [saved, ...(prev ?? [])]);
      setAdding(false);
    } finally {
      setBusy(null);
    }
  }

  async function archive(goal: TradingGoal) {
    setBusy(goal.id);
    try {
      const saved = await updateTradingGoal(goal.id, {
        archived_at: goal.archived_at ? null : new Date().toISOString(),
      });
      setGoals((prev) => (prev ?? []).map((g) => (g.id === goal.id ? saved : g)));
    } finally {
      setBusy(null);
    }
  }

  async function remove(goal: TradingGoal) {
    setBusy(goal.id);
    try {
      await deleteTradingGoal(goal.id);
      setGoals((prev) => (prev ?? []).filter((g) => g.id !== goal.id));
    } finally {
      setBusy(null);
    }
  }

  if (goals == null || data == null) {
    return (
      <div className="flex h-56 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <AccentPanel
        accent="primary"
        eyebrow="My Goals"
        title="What you are working towards"
        // On a phone the header is already three lines; the explanation is
        // worth keeping, but not at the cost of pushing every goal below the
        // fold.
        subtitle={
          <span className="hidden sm:inline">
            A goal here is a target on a number the journal already measures, so
            progress is read from your trades rather than self-reported.
          </span>
        }
        headerRight={
          <div className="flex items-center gap-2">
            {archivedCount > 0 && (
              <button
                type="button"
                onClick={() => setShowArchived((v) => !v)}
                className="rounded-lg border border-border/60 px-2.5 py-1.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                {showArchived ? "Active" : `Archived (${archivedCount})`}
              </button>
            )}
            <button
              type="button"
              onClick={() => setAdding((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all hover:-translate-y-px"
              style={{
                background: "var(--primary)",
                color: "var(--on-brand)",
                boxShadow: "0 2px 12px color-mix(in oklch, var(--primary) 26%, transparent)",
              }}
            >
              {adding ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
              {adding ? "Cancel" : "New goal"}
            </button>
          </div>
        }
      >
        <div className="mt-4 space-y-3">
          {adding && <GoalForm data={data} busy={busy === "new"} onSave={add} />}

          {visible.length === 0 && !adding ? (
            <EmptyState archived={showArchived} onStart={() => setAdding(true)} />
          ) : (
            visible.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                data={data}
                busy={busy === goal.id}
                onArchive={() => archive(goal)}
                onDelete={() => remove(goal)}
              />
            ))
          )}
        </div>
      </AccentPanel>
    </div>
  );
}

function EmptyState({ archived, onStart }: { archived: boolean; onStart: () => void }) {
  if (archived) {
    return <p className="py-8 text-center text-[13px] text-muted-foreground">Nothing archived yet.</p>;
  }
  return (
    <div className="rounded-xl border border-dashed border-border/70 px-4 py-8 text-center">
      <Target className="mx-auto h-5 w-5 text-muted-foreground/50" />
      <p className="mt-2 text-[13px] font-semibold text-foreground">No goals set</p>
      <p className="mx-auto mt-1 max-w-md text-[12px] leading-relaxed text-muted-foreground">
        Pick something you can actually move — getting execution from where it is
        now to where you want it, or stringing together clean days. The number is
        read straight from your journal, so there is nothing to keep up to date.
      </p>
      <button
        type="button"
        onClick={onStart}
        className="mt-3 text-[12px] font-semibold text-primary hover:underline"
      >
        Set your first goal →
      </button>
    </div>
  );
}

/* ── One goal ──────────────────────────────────────────────────────────── */

function GoalCard({
  goal, data, busy, onArchive, onDelete,
}: {
  goal: TradingGoal;
  data: GoalInputs;
  busy: boolean;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const p = useMemo(() => computeGoalProgress(goal, data), [goal, data]);
  const meta = METRIC_META[goal.metric];
  const tone = STATE_STYLE[p.state];
  const pct = Math.round(p.ratio * 100);

  return (
    <div
      className="relative overflow-hidden rounded-xl border border-border/70 bg-card/60 p-3.5"
      style={{ background: `color-mix(in oklch, ${tone.color} 4%, var(--card))` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-bold text-foreground">
            {goal.title.trim() || describeGoal(goal)}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {meta.label} · {format(new Date(goal.start_date + "T12:00:00"), "d MMM")} –{" "}
            {format(new Date(goal.end_date + "T12:00:00"), "d MMM yyyy")}
            {!p.closed && ` · ${p.daysLeft} ${p.daysLeft === 1 ? "day" : "days"} left`}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
            style={{ color: tone.color, background: `color-mix(in oklch, ${tone.color} 14%, transparent)` }}
          >
            {p.state === "achieved" && <Check className="mr-0.5 inline h-3 w-3" />}
            {tone.label}
          </span>
          {busy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
          ) : (
            <>
              <button
                type="button"
                onClick={onArchive}
                title={goal.archived_at ? "Restore" : "Archive"}
                className="rounded-md p-1 text-muted-foreground/70 transition-colors hover:bg-muted/50 hover:text-foreground"
              >
                <Archive className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={onDelete}
                title="Delete goal"
                className="rounded-md p-1 text-muted-foreground/70 transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Where the number stands, against where it started and where it is going */}
      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-black leading-none tabular-nums" style={{ color: tone.color }}>
            {formatGoalValue(goal.metric, p.current)}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {goal.baseline != null && `from ${formatGoalValue(goal.metric, goal.baseline)} · `}
            target {formatGoalValue(goal.metric, goal.target)}
          </span>
        </div>
        <span className="text-[11px] font-semibold tabular-nums text-muted-foreground">{pct}%</span>
      </div>

      {/* The bar carries two marks: how far the number has come, and how far the
          calendar has. A goal is behind when the pace marker is ahead of the fill. */}
      <div className="relative mt-2 h-2 w-full overflow-hidden rounded-full bg-muted-foreground/12">
        <div
          className="h-full rounded-full transition-[width] duration-700"
          style={{ width: `${pct}%`, background: tone.color }}
        />
        {!p.closed && (
          <span
            aria-hidden
            title="Where the calendar is"
            className="absolute inset-y-0 w-px bg-foreground/40"
            style={{ left: `${Math.round(p.timeElapsed * 100)}%` }}
          />
        )}
      </div>
      <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground/80">{meta.help}</p>
    </div>
  );
}

/* ── New goal ──────────────────────────────────────────────────────────── */

function GoalForm({
  data, busy, onSave,
}: {
  data: GoalInputs;
  busy: boolean;
  onSave: (draft: Omit<TradingGoal, "id" | "user_id" | "created_at" | "updated_at">) => void;
}) {
  const now = new Date();
  const [metric, setMetric] = useState<GoalMetric>("execution_rate");
  const [windowKey, setWindowKey] = useState<WindowKey>("month");
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState<string>(() =>
    String(
      suggestTarget(
        "execution_rate",
        measureMetric("execution_rate", data, startOfMonth(now), endOfMonth(now))
      )
    )
  );
  const [customStart, setCustomStart] = useState(iso(startOfMonth(now)));
  const [customEnd, setCustomEnd] = useState(iso(endOfMonth(now)));

  const range = useMemo(() => {
    const w = WINDOWS.find((x) => x.key === windowKey)!;
    if (!w.range) {
      return {
        start: new Date(customStart + "T12:00:00"),
        end: new Date(customEnd + "T12:00:00"),
      };
    }
    return w.range(now);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [windowKey, customStart, customEnd]);

  /**
   * Where the metric stands today.
   *
   * For a level metric this is the honest starting line — "60% → 80%" only
   * means something if the 60% is real — and it is saved as the goal's
   * baseline. For a metric that piles up inside the window it is just the
   * running total so far, so it is shown but never stored: those days are part
   * of the target, not a line to measure from.
   */
  const reading = useMemo(
    () => measureMetric(metric, data, range.start, range.end),
    [metric, data, range]
  );
  const accumulates = METRIC_META[metric].accumulates;

  function pickMetric(next: GoalMetric) {
    setMetric(next);
    setTarget(String(suggestTarget(next, measureMetric(next, data, range.start, range.end))));
  }

  function pickWindow(next: WindowKey) {
    setWindowKey(next);
    const w = WINDOWS.find((x) => x.key === next)!;
    if (!w.range) return; // Custom keeps whatever dates are already in the fields.
    const r = w.range(now);
    setTarget(String(suggestTarget(metric, measureMetric(metric, data, r.start, r.end))));
  }

  function submit() {
    const value = Number(target);
    if (!Number.isFinite(value)) return;
    onSave({
      title: title.trim(),
      metric,
      target: value,
      baseline: accumulates ? null : reading,
      start_date: iso(range.start),
      end_date: iso(range.end),
      archived_at: null,
    });
  }

  return (
    <div className="rounded-xl border border-primary/25 bg-primary/[0.04] p-3.5">
      <div className="space-y-3">
        <div>
          <Label className="text-[11px]">What are you aiming at?</Label>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {GOAL_METRICS.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => pickMetric(m.key)}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors",
                  metric === m.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">
            {METRIC_META[metric].help}
          </p>
        </div>

        <div>
          <Label className="text-[11px]">Over which window?</Label>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {WINDOWS.map((w) => (
              <button
                key={w.key}
                type="button"
                onClick={() => pickWindow(w.key)}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors",
                  windowKey === w.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {w.label}
              </button>
            ))}
          </div>
          {windowKey === "custom" && (
            <div className="mt-2 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2">
              <Input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="h-8 text-xs" />
              <Input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="h-8 text-xs" />
            </div>
          )}
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_120px] items-end gap-2">
          <div>
            <Label className="text-[11px]">Name it (optional)</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Stop forcing the London open"
              className="mt-1.5 h-8 text-xs"
            />
          </div>
          <div>
            <Label className="text-[11px]">
              Target {METRIC_META[metric].unit === "percent" ? "(%)" : METRIC_META[metric].unit === "R" ? "(R)" : ""}
            </Label>
            <Input
              type="number"
              inputMode="decimal"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="mt-1.5 h-8 text-xs tabular-nums"
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border/50 pt-3">
          <p className="text-[11px] text-muted-foreground">
            {reading == null ? (
              <>Nothing logged in this window yet — you will start from zero.</>
            ) : accumulates ? (
              <>
                <span className="font-semibold text-foreground">{formatGoalValue(metric, reading)}</span>{" "}
                already banked in {format(range.start, "d MMM")} – {format(range.end, "d MMM")}, and it
                counts towards the target.
              </>
            ) : (
              <>
                Starting from{" "}
                <span className="font-semibold text-foreground">{formatGoalValue(metric, reading)}</span>{" "}
                over {format(range.start, "d MMM")} – {format(range.end, "d MMM")}.
              </>
            )}
          </p>
          <button
            type="button"
            onClick={submit}
            disabled={busy}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all hover:-translate-y-px disabled:opacity-60"
            style={{ background: "var(--primary)", color: "var(--on-brand)" }}
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            Set goal
          </button>
        </div>
      </div>
    </div>
  );
}
