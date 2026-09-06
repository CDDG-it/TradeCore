"use client";

import { useEffect, useMemo, useState } from "react";
import {
  format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter,
} from "date-fns";
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
  { key: "week", label: "this week", range: (n: Date) => ({ start: startOfWeek(n, { weekStartsOn: 1 }), end: endOfWeek(n, { weekStartsOn: 1 }) }) },
  { key: "month", label: "this month", range: (n: Date) => ({ start: startOfMonth(n), end: endOfMonth(n) }) },
  { key: "quarter", label: "this quarter", range: (n: Date) => ({ start: startOfQuarter(n), end: endOfQuarter(n) }) },
  { key: "custom", label: "a window I pick", range: null },
] as const;

type WindowKey = (typeof WINDOWS)[number]["key"];

const STATE: Record<GoalProgress["state"], { color: string; word: string }> = {
  "achieved": { color: "var(--win)", word: "Achieved" },
  "on-track": { color: "var(--primary)", word: "On track" },
  "behind": { color: "var(--be)", word: "Behind pace" },
  "missed": { color: "var(--loss)", word: "Missed" },
  "no-data": { color: "var(--muted-foreground)", word: "Not started" },
};

/** Small-caps eyebrow, the one piece of chrome this page repeats. */
const EYEBROW = "text-[10px] font-semibold uppercase tracking-[0.18em]";

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

  const live = useMemo(() => (goals ?? []).filter((g) => !g.archived_at), [goals]);
  const archived = useMemo(() => (goals ?? []).filter((g) => g.archived_at), [goals]);
  const visible = showArchived ? archived : live;

  /** How the live goals are standing — the one summary worth printing. */
  const tally = useMemo(() => {
    if (!data) return null;
    const counts: Record<GoalProgress["state"], number> = {
      "achieved": 0, "on-track": 0, "behind": 0, "missed": 0, "no-data": 0,
    };
    for (const g of live) counts[computeGoalProgress(g, data).state] += 1;
    return counts;
  }, [live, data]);

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
      <p className={cn(EYEBROW, "py-16 text-center text-muted-foreground/60")}>Reading your journal…</p>
    );
  }

  return (
    <section className="mx-auto w-full max-w-4xl">
      {/* Masthead — a rule, a title, and the standing of the live goals. No
          panel chrome: the page is a statement, not a dashboard. */}
      <header className="border-b border-foreground/15 pb-3">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
          <div className="min-w-0">
            <p className={cn(EYEBROW, "text-muted-foreground/70")}>My Goals</p>
            <h2 className="mt-1.5 font-heading text-xl font-bold leading-none tracking-tight sm:text-2xl">
              {live.length === 0 ? "Nothing set" : `${live.length} live`}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {tally && live.length > 0 && (
              <p className="hidden text-[11px] tabular-nums text-muted-foreground sm:block">
                {[
                  tally["achieved"] && `${tally["achieved"]} achieved`,
                  tally["on-track"] && `${tally["on-track"]} on track`,
                  tally["behind"] && `${tally["behind"]} behind`,
                  tally["no-data"] && `${tally["no-data"]} not started`,
                ].filter(Boolean).join(" · ")}
              </p>
            )}
            {archived.length > 0 && (
              <button
                type="button"
                onClick={() => setShowArchived((v) => !v)}
                className={cn(EYEBROW, "text-muted-foreground/70 underline-offset-4 transition-colors hover:text-foreground hover:underline")}
              >
                {showArchived ? "Live" : `Archive (${archived.length})`}
              </button>
            )}
            <button
              type="button"
              onClick={() => setAdding((v) => !v)}
              className={cn(
                EYEBROW,
                "border-b-2 pb-0.5 transition-colors",
                adding
                  ? "border-transparent text-muted-foreground hover:text-foreground"
                  : "border-primary text-primary hover:border-foreground hover:text-foreground"
              )}
            >
              {adding ? "Cancel" : "New goal"}
            </button>
          </div>
        </div>
      </header>

      {adding && <GoalForm data={data} busy={busy === "new"} onSave={add} />}

      {visible.length === 0 && !adding ? (
        <Empty archived={showArchived} onStart={() => setAdding(true)} />
      ) : (
        <div>
          {visible.map((goal) => (
            <GoalRow
              key={goal.id}
              goal={goal}
              data={data}
              busy={busy === goal.id}
              onArchive={() => archive(goal)}
              onDelete={() => remove(goal)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function Empty({ archived, onStart }: { archived: boolean; onStart: () => void }) {
  if (archived) {
    return <p className="py-14 text-center text-[13px] text-muted-foreground">Nothing archived yet.</p>;
  }
  return (
    <div className="max-w-xl py-12">
      <p className="font-heading text-base font-semibold">Set something you can actually move.</p>
      <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
        Getting your execution from where it is now to where you want it. Stringing
        together days without a single trade you had to talk yourself into. Every
        number here is read straight out of your journal, so there is nothing to
        keep up to date afterwards — you either did it or you did not.
      </p>
      <button
        type="button"
        onClick={onStart}
        className="mt-4 border-b-2 border-primary pb-0.5 text-[13px] font-semibold text-primary transition-colors hover:border-foreground hover:text-foreground"
      >
        Set your first goal
      </button>
    </div>
  );
}

/* ── One goal ──────────────────────────────────────────────────────────── */

function GoalRow({
  goal, data, busy, onArchive, onDelete,
}: {
  goal: TradingGoal;
  data: GoalInputs;
  busy: boolean;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const p = useMemo(() => computeGoalProgress(goal, data), [goal, data]);
  const meta = METRIC_META[goal.metric];
  const tone = STATE[p.state];

  const start = new Date(goal.start_date + "T12:00:00");
  const end = new Date(goal.end_date + "T12:00:00");
  const floor = meta.accumulates ? 0 : (goal.baseline ?? 0);

  return (
    <article className="group border-b border-border/60 py-6">
      <div className="flex items-baseline justify-between gap-4">
        <span className={EYEBROW} style={{ color: tone.color }}>{meta.label}</span>
        <span className={cn(EYEBROW, "shrink-0 tabular-nums text-muted-foreground/75")}>
          {format(start, "d MMM")} – {format(end, "d MMM yyyy")}
          {!p.closed && ` · ${p.daysLeft}d left`}
        </span>
      </div>

      <div className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-[8rem_minmax(0,1fr)]">
        {/* The reading, as big as it deserves to be. */}
        <div className="flex items-baseline gap-2 sm:block">
          <p
            className="font-heading text-4xl font-black leading-none tracking-tight tabular-nums"
            style={{ color: tone.color }}
          >
            {formatGoalValue(goal.metric, p.current)}
          </p>
          <p className="text-[11px] tabular-nums text-muted-foreground sm:mt-1.5">
            of {formatGoalValue(goal.metric, goal.target)}
          </p>
        </div>

        <div className="min-w-0">
          <p className="text-[13px] font-semibold leading-snug text-foreground">
            {goal.title.trim() || describeGoal(goal)}
          </p>

          {/* The measure: a rule from the floor to the target, filled to where
              the number stands, with a tick showing where the calendar is. The
              gap between the two is the whole story. */}
          <div className="mt-3">
            <div className="relative h-3">
              <span aria-hidden className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-foreground/15" />
              <span
                aria-hidden
                className="absolute left-0 top-1/2 h-[3px] -translate-y-1/2 transition-[width] duration-700"
                style={{ width: `${Math.round(p.ratio * 100)}%`, background: tone.color }}
              />
              {!p.closed && (
                <span
                  aria-hidden
                  title="Where the calendar has got to"
                  className="absolute top-0 h-3 w-px bg-foreground/50"
                  style={{ left: `${Math.round(p.timeElapsed * 100)}%` }}
                />
              )}
            </div>
            <div className="mt-1.5 flex justify-between text-[10px] tabular-nums text-muted-foreground/75">
              <span>{formatGoalValue(goal.metric, floor)}</span>
              <span>{formatGoalValue(goal.metric, goal.target)}</span>
            </div>
          </div>

          <p className="mt-2.5 text-[12px] leading-snug">
            <span className="font-semibold" style={{ color: tone.color }}>{tone.word}</span>
            <span className="text-muted-foreground">
              {" — "}
              {p.current == null
                ? "nothing logged in this window yet"
                : `${Math.round(p.ratio * 100)}% of the way, ${Math.round(p.timeElapsed * 100)}% of the window gone`}
            </span>
          </p>

          <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">{meta.help}</p>

          {/* Last, and on a pointer device only once the row is reached for:
              archiving and deleting are the rarest thing anyone does here. */}
          <span className={cn(
            EYEBROW,
            "mt-2 flex items-center gap-3 text-muted-foreground/70",
            "sm:opacity-0 sm:transition-opacity sm:focus-within:opacity-100 sm:group-hover:opacity-100"
          )}>
            {busy ? (
              <span>Saving…</span>
            ) : confirming ? (
              <>
                <button type="button" onClick={onDelete} className="text-destructive underline underline-offset-4">
                  Delete for good
                </button>
                <button type="button" onClick={() => setConfirming(false)} className="hover:text-foreground">
                  Keep
                </button>
              </>
            ) : (
              <>
                <button type="button" onClick={onArchive} className="underline-offset-4 hover:text-foreground hover:underline">
                  {goal.archived_at ? "Restore" : "Archive"}
                </button>
                <button type="button" onClick={() => setConfirming(true)} className="underline-offset-4 hover:text-destructive hover:underline">
                  Delete
                </button>
              </>
            )}
          </span>
        </div>
      </div>
    </article>
  );
}

/* ── New goal ──────────────────────────────────────────────────────────── */

/** An inline blank in the sentence: underlined, sized to its content. */
const BLANK =
  "border-b-2 border-primary/60 bg-transparent pb-0.5 font-semibold text-foreground outline-none " +
  "transition-colors hover:border-primary focus:border-primary";

/**
 * A `<select>` sized to the option it is currently showing, not to the widest
 * one it could show — otherwise every blank in the sentence trails a stretch
 * of empty underline and the line stops reading as a sentence. An invisible
 * copy of the current label does the measuring; the real control sits on top
 * of it. The native picker is kept because it is what phones do best.
 */
function SelectBlank<T extends string>({
  value, onChange, options, label,
}: {
  value: T;
  onChange: (next: T) => void;
  options: { value: T; label: string }[];
  label: string;
}) {
  const current = options.find((o) => o.value === value)?.label ?? "";
  return (
    <span className={cn(BLANK, "relative inline-block cursor-pointer")}>
      <span aria-hidden className="invisible whitespace-pre">{current}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        aria-label={label}
        className="absolute inset-0 w-full cursor-pointer appearance-none bg-transparent text-inherit outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </span>
  );
}

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
      return { start: new Date(customStart + "T12:00:00"), end: new Date(customEnd + "T12:00:00") };
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
  const unit = METRIC_META[metric].unit;

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
    <div className="border-b border-border/60 py-6">
      {/* The form is the sentence you are about to commit to, with the parts
          you choose left blank. Nothing to scan, nothing to label. */}
      <p className="font-heading text-lg leading-relaxed tracking-tight sm:text-xl">
        <span className="text-muted-foreground">Get my</span>{" "}
        <SelectBlank
          value={metric}
          onChange={pickMetric}
          label="Which number"
          options={GOAL_METRICS.map((m) => ({ value: m.key, label: m.label.toLowerCase() }))}
        />{" "}
        <span className="text-muted-foreground">to</span>{" "}
        {/* The number and its unit share one blank, so "85%" reads as a value
            rather than a field with a stray symbol beside it. */}
        <span className={cn(BLANK, "inline-flex items-baseline")}>
          <input
            type="number"
            inputMode="decimal"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            aria-label="Target"
            className="w-[3.5ch] bg-transparent text-right tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
          />
          {unit !== "count" && <span>{unit === "percent" ? "%" : "R"}</span>}
        </span>{" "}
        <span className="text-muted-foreground">over</span>{" "}
        <SelectBlank
          value={windowKey}
          onChange={pickWindow}
          label="Which window"
          options={WINDOWS.map((w) => ({ value: w.key, label: w.label }))}
        />
        <span className="text-muted-foreground">.</span>
      </p>

      <p className="mt-2 max-w-2xl text-[12px] leading-relaxed text-muted-foreground">
        {METRIC_META[metric].help}
      </p>

      {windowKey === "custom" && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
          <span>From</span>
          <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)}
            className={cn(BLANK, "text-[12px]")} />
          <span>to</span>
          <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)}
            className={cn(BLANK, "text-[12px]")} />
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0 flex-1">
          <label className={cn(EYEBROW, "block text-muted-foreground/60")} htmlFor="goal-title">
            Call it something (optional)
          </label>
          <input
            id="goal-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Stop forcing the London open"
            className={cn(
              "mt-1.5 w-full max-w-sm border-b border-border bg-transparent pb-1 text-[13px] outline-none",
              "placeholder:text-muted-foreground/40 focus:border-primary"
            )}
          />
        </div>
        <button
          type="button"
          onClick={submit}
          disabled={busy}
          className={cn(
            EYEBROW,
            "shrink-0 border-b-2 border-primary pb-0.5 text-primary transition-colors",
            "hover:border-foreground hover:text-foreground disabled:opacity-50"
          )}
        >
          {busy ? "Setting…" : "Set goal"}
        </button>
      </div>

      <p className="mt-3 text-[12px] text-muted-foreground">
        {reading == null ? (
          <>Nothing logged in {format(range.start, "d MMM")} – {format(range.end, "d MMM")} yet — you start from zero.</>
        ) : accumulates ? (
          <>
            <span className="font-semibold text-foreground">{formatGoalValue(metric, reading)}</span>{" "}
            already banked in {format(range.start, "d MMM")} – {format(range.end, "d MMM")}, counting towards it.
          </>
        ) : (
          <>
            Starting from{" "}
            <span className="font-semibold text-foreground">{formatGoalValue(metric, reading)}</span>{" "}
            over {format(range.start, "d MMM")} – {format(range.end, "d MMM")}.
          </>
        )}
      </p>
    </div>
  );
}
