"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter,
} from "date-fns";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { CountUp, EASE_OUT } from "@/components/ui/count-up";
import {
  getTradingGoals, createTradingGoal, updateTradingGoal, deleteTradingGoal,
  getTrades, getHabits, getHabitCompletions,
} from "@/lib/supabase/queries";
import {
  GOAL_METRICS, METRIC_META, computeGoalProgress, formatGoalValue,
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

const STATE: Record<GoalProgress["state"], { color: string; word: string; short: string }> = {
  "achieved": { color: "var(--win)", word: "Achieved", short: "achieved" },
  "on-track": { color: "var(--primary)", word: "On track", short: "on track" },
  "behind": { color: "var(--be)", word: "Behind pace", short: "behind" },
  "missed": { color: "var(--loss)", word: "Missed", short: "missed" },
  "no-data": { color: "var(--muted-foreground)", word: "Not started", short: "not started" },
};

/** Small-caps eyebrow, the one piece of chrome this page repeats. */
const EYEBROW = "text-[10px] font-semibold uppercase tracking-[0.18em]";

const alpha = (c: string, pct: number) => `color-mix(in oklch, ${c} ${pct}%, transparent)`;
const indexed = (i: number) => ({ "--i": i }) as CSSProperties;

/** Everything the view would otherwise read from Supabase, for the dev preview. */
export type GoalsSeed = { goals: TradingGoal[]; data: GoalInputs };

/**
 * The window, written the way a person would say it: one month name when both
 * ends share it, and the year only when it is not this one.
 */
function windowLabel(start: Date, end: Date, now: Date): string {
  const year = start.getFullYear() === now.getFullYear() ? "" : ` ${format(start, "yyyy")}`;
  if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
    return `${format(start, "d")}-${format(end, "d MMM")}${year}`;
  }
  return `${format(start, "d MMM")} - ${format(end, "d MMM")}${year}`;
}

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

export function GoalsView({ seed }: { seed?: GoalsSeed } = {}) {
  const [goals, setGoals] = useState<TradingGoal[] | null>(seed?.goals ?? null);
  const [data, setData] = useState<GoalInputs | null>(seed?.data ?? null);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (seed) return;
    Promise.all([getTradingGoals(), getTrades(), getHabits(), getHabitCompletions()])
      .then(([g, trades, habits, completions]) => {
        setGoals(g);
        setData({ trades, habits, completions });
      })
      .catch(() => {
        setGoals([]);
        setData({ trades: [], habits: [], completions: [] });
      });
  }, [seed]);

  const live = useMemo(() => (goals ?? []).filter((g) => !g.archived_at), [goals]);
  const archived = useMemo(() => (goals ?? []).filter((g) => g.archived_at), [goals]);

  /**
   * Deadline order: whatever runs out first is read first, and goals whose
   * window has already closed drop below the ones still in play.
   */
  const visible = useMemo(() => {
    const list = showArchived ? archived : live;
    if (!data) return list;
    return [...list].sort((a, b) => {
      const pa = computeGoalProgress(a, data);
      const pb = computeGoalProgress(b, data);
      if (pa.closed !== pb.closed) return pa.closed ? 1 : -1;
      if (pa.closed) return b.end_date.localeCompare(a.end_date);
      return pa.daysLeft - pb.daysLeft;
    });
  }, [showArchived, archived, live, data]);

  /** How the live goals are standing: one chip per state that has a goal in it. */
  const tally = useMemo(() => {
    if (!data || live.length === 0) return [];
    const counts: Record<GoalProgress["state"], number> = {
      "achieved": 0, "on-track": 0, "behind": 0, "missed": 0, "no-data": 0,
    };
    for (const g of live) counts[computeGoalProgress(g, data).state] += 1;
    return (Object.keys(STATE) as GoalProgress["state"][])
      .filter((k) => counts[k] > 0)
      .map((k) => ({ key: k, n: counts[k], ...STATE[k] }));
  }, [live, data]);

  async function add(draft: Omit<TradingGoal, "id" | "user_id" | "created_at" | "updated_at">) {
    setBusy("new");
    try {
      const saved = seed
        ? { ...draft, id: `local-${Date.now()}`, user_id: "preview", created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
        : await createTradingGoal(draft);
      setGoals((prev) => [saved, ...(prev ?? [])]);
      setAdding(false);
    } finally {
      setBusy(null);
    }
  }

  async function archive(goal: TradingGoal) {
    setBusy(goal.id);
    try {
      const patch = { archived_at: goal.archived_at ? null : new Date().toISOString() };
      const saved = seed ? { ...goal, ...patch } : await updateTradingGoal(goal.id, patch);
      setGoals((prev) => (prev ?? []).map((g) => (g.id === goal.id ? saved : g)));
    } finally {
      setBusy(null);
    }
  }

  async function remove(goal: TradingGoal) {
    setBusy(goal.id);
    try {
      if (!seed) await deleteTradingGoal(goal.id);
      setGoals((prev) => (prev ?? []).filter((g) => g.id !== goal.id));
    } finally {
      setBusy(null);
    }
  }

  if (goals == null || data == null) {
    return (
      <p className={cn(EYEBROW, "py-16 text-center text-muted-foreground/60")}>Reading your journal...</p>
    );
  }

  return (
    <section className="mx-auto w-full max-w-5xl">
      {/* One line: where the goals stand, and the two things you can do. The
          tab above already says "My Goals", so the page does not say it twice. */}
      <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-foreground/15 pb-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <p className="font-heading text-[15px] font-semibold tracking-tight">
            {showArchived
              ? `${archived.length} archived`
              : live.length === 0 ? "No goals set" : `${live.length} live`}
          </p>
          {!showArchived && tally.map((t, i) => (
            <span
              key={t.key}
              style={indexed(i)}
              className="rise-in inline-flex items-center gap-1.5 rounded-full border border-border/60 px-2 py-0.5 text-[11px] text-muted-foreground"
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: t.color }} />
              <span className="font-semibold tabular-nums text-foreground">{t.n}</span> {t.short}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-4">
          {archived.length > 0 && (
            <button
              type="button"
              onClick={() => setShowArchived((v) => !v)}
              className={cn(EYEBROW, "press text-muted-foreground/75 underline-offset-4 hover:text-foreground hover:underline")}
            >
              {showArchived ? "Live" : `Archive (${archived.length})`}
            </button>
          )}
          <button
            type="button"
            onClick={() => setAdding((v) => !v)}
            className={cn(
              EYEBROW,
              "press border-b-2 pb-0.5",
              adding
                ? "border-transparent text-muted-foreground hover:text-foreground"
                : "border-primary text-primary hover:border-foreground hover:text-foreground"
            )}
          >
            {adding ? "Cancel" : "New goal"}
          </button>
        </div>
      </header>

      {/* The form opens like a drawer under the header: height is the one
          property with no transform equivalent here, so it is the exception. */}
      <AnimatePresence initial={false}>
        {adding && (
          <motion.div
            key="form"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.28, ease: EASE_OUT }}
            className="overflow-hidden"
          >
            <GoalForm data={data} busy={busy === "new"} onSave={add} />
          </motion.div>
        )}
      </AnimatePresence>

      {visible.length === 0 && !adding ? (
        <Empty archived={showArchived} onStart={() => setAdding(true)} />
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
          <AnimatePresence initial={false} mode="popLayout">
            {visible.map((goal, i) => (
              <GoalCard
                key={goal.id}
                index={i}
                goal={goal}
                data={data}
                busy={busy === goal.id}
                onArchive={() => archive(goal)}
                onDelete={() => remove(goal)}
              />
            ))}
          </AnimatePresence>
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
        keep up to date afterwards. You either did it or you did not.
      </p>
      <button
        type="button"
        onClick={onStart}
        className="press mt-4 border-b-2 border-primary pb-0.5 text-[13px] font-semibold text-primary hover:border-foreground hover:text-foreground"
      >
        Set your first goal
      </button>
    </div>
  );
}

/* ── One goal ──────────────────────────────────────────────────────────── */

/**
 * The verdict, written out rather than templated.
 *
 * The measure above it already shows the two percentages, so this says the
 * thing the bar cannot: whether the target is still in reach, and (the case
 * worth catching) whether the number has actually gone backwards from where
 * the trader started.
 */
function verdict(goal: TradingGoal, p: GoalProgress, slipped: boolean): string {
  const pct = Math.round(p.ratio * 100);
  const gone = Math.round(p.timeElapsed * 100);
  const short = formatGoalValue(goal.metric, goal.target - (p.current ?? 0));

  switch (p.state) {
    case "no-data":
      return "Nothing logged in this window yet.";
    case "achieved":
      return p.closed
        ? "The window closed past your target."
        : `Already past your target with ${p.daysLeft} ${p.daysLeft === 1 ? "day" : "days"} still to run.`;
    case "missed":
      return `The window closed ${short} short.`;
    case "behind":
      return slipped
        ? `Under the ${formatGoalValue(goal.metric, goal.baseline ?? 0)} you started from, with ${gone}% of the window gone.`
        : `${pct}% of the way, with ${gone}% of the window gone.`;
    case "on-track":
      return pct >= gone
        ? `${pct}% of the way, ahead of the calendar.`
        : `${pct}% of the way, with ${gone}% of the window gone.`;
  }
}

function GoalCard({
  goal, data, busy, index, onArchive, onDelete,
}: {
  goal: TradingGoal;
  data: GoalInputs;
  busy: boolean;
  index: number;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const p = useMemo(() => computeGoalProgress(goal, data), [goal, data]);
  const meta = METRIC_META[goal.metric];

  // A goal that has been put aside is not in a race any more: it keeps its
  // reading but loses the countdown, the pace tick and the live verdict, and
  // drops to a neutral colour so it cannot be mistaken for one still running.
  const parked = !!goal.archived_at;
  const tone = parked ? { color: "var(--muted-foreground)", word: "Archived" } : STATE[p.state];

  const start = new Date(goal.start_date + "T12:00:00");
  const end = new Date(goal.end_date + "T12:00:00");
  const floor = meta.accumulates ? 0 : (goal.baseline ?? 0);
  const slipped = !meta.accumulates && goal.baseline != null && p.current != null && p.current < goal.baseline;

  const ratio = Math.round(p.ratio * 100);
  const gone = Math.round(p.timeElapsed * 100);
  const shortfall = !parked && !p.closed && gone > ratio;
  const format_ = (n: number) => formatGoalValue(goal.metric, n);

  return (
    <motion.article
      layout
      initial={false}
      exit={{ opacity: 0, transform: "scale(0.97)" }}
      transition={{ duration: 0.2, ease: EASE_OUT }}
      style={indexed(index)}
      className="rise-in group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card p-4 sm:p-5"
    >
      {/* The state, as a wash in the top corner and a spine down the left. */}
      <span aria-hidden className="absolute inset-y-0 left-0 w-[3px]" style={{ background: tone.color }} />
      <span
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full blur-2xl"
        style={{ background: alpha(tone.color, 14) }}
      />

      {/* What is being measured, and how long is left to measure it. */}
      <div className="relative flex items-baseline justify-between gap-4 pl-1">
        <span className={cn(EYEBROW, "text-muted-foreground")} title={meta.help}>{meta.label}</span>
        <span className={cn(EYEBROW, "shrink-0 tabular-nums text-muted-foreground/70")}>
          {windowLabel(start, end, new Date())}
          {!parked && !p.closed && ` · ${p.daysLeft === 0 ? "last day" : `${p.daysLeft} ${p.daysLeft === 1 ? "day" : "days"} left`}`}
        </span>
      </div>

      {/* The reading runs up to its value; the target sits beside it, still. */}
      <div className="relative mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1 pl-1">
        <p className="font-heading text-[2.25rem] font-black leading-none tracking-tight tabular-nums sm:text-[2.5rem]">
          {p.current == null ? "-" : <CountUp value={p.current} format={format_} />}
        </p>
        <p className="text-[13px] tabular-nums text-muted-foreground">
          <span aria-hidden>→ </span>
          <span className="sr-only">target </span>
          {format_(goal.target)}
        </p>
      </div>
      {goal.title.trim() && (
        <p className="relative mt-1.5 pl-1 text-[13px] font-medium leading-snug text-foreground/85">{goal.title.trim()}</p>
      )}

      {/* The measure: a rule from where you started to where you are going.
          The filled part is the number (it draws in), the tick is the calendar,
          and the faint stretch between them is exactly how far behind you are. */}
      <div className="relative mt-4 h-2.5 pl-1">
        <span aria-hidden className="absolute inset-x-1 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-foreground/12" />
        {shortfall && (
          <span
            aria-hidden
            className="absolute top-1/2 h-[2px] -translate-y-1/2"
            style={{ left: `calc(0.25rem + ${ratio}%)`, width: `${gone - ratio}%`, background: alpha(tone.color, 25) }}
          />
        )}
        <span
          aria-hidden
          className="meter-fill absolute left-1 right-1 top-1/2 h-[2px] -translate-y-1/2 rounded-full"
          style={{ "--fill": ratio / 100, background: tone.color } as CSSProperties}
        />
        {/* A knob at the reading, so a goal sitting at zero still shows where
            it is rather than looking like an empty row. It rides the fill. */}
        <span aria-hidden className="meter-knob absolute inset-y-0 left-1 right-1" style={{ "--fill": ratio / 100 } as CSSProperties}>
          <span
            className="absolute left-0 top-1/2 h-[7px] w-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ background: tone.color, boxShadow: `0 0 0 3px ${alpha(tone.color, 18)}` }}
          />
        </span>
        {!parked && !p.closed && (
          <span
            aria-hidden
            title="Where the calendar has got to"
            className="absolute top-0 h-2.5 w-px bg-foreground/45"
            style={{ left: `calc(0.25rem + ${gone}%)` }}
          />
        )}
      </div>
      <p className="relative mt-1.5 pl-1 text-[10px] tabular-nums text-muted-foreground/70">
        from {format_(floor)}
      </p>

      <div className="relative mt-auto flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1.5 pl-1 pt-3">
        <p className="text-[12px] leading-snug">
          <span className="font-semibold" style={{ color: tone.color }}>{tone.word}.</span>{" "}
          <span className="text-muted-foreground">
            {parked
              ? `Put aside on ${format(new Date(goal.archived_at!), "d MMM")}.`
              : verdict(goal, p, !!slipped)}
          </span>
        </p>

        {/* On a pointer device these wait until the card is reached for:
            archiving and deleting are the rarest thing anyone does here. */}
        <span className={cn(
          EYEBROW,
          "flex shrink-0 items-center gap-3 text-muted-foreground/70",
          "sm:opacity-0 sm:transition-opacity sm:duration-150 sm:focus-within:opacity-100 sm:group-hover:opacity-100"
        )}>
          {busy ? (
            <span>Saving...</span>
          ) : confirming ? (
            <>
              <button type="button" onClick={onDelete} className="press text-destructive underline underline-offset-4">
                Delete for good
              </button>
              <button type="button" onClick={() => setConfirming(false)} className="press hover:text-foreground">
                Keep
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={onArchive} className="press underline-offset-4 hover:text-foreground hover:underline">
                {goal.archived_at ? "Restore" : "Archive"}
              </button>
              <button type="button" onClick={() => setConfirming(true)} className="press underline-offset-4 hover:text-destructive hover:underline">
                Delete
              </button>
            </>
          )}
        </span>
      </div>
    </motion.article>
  );
}

/* ── New goal ──────────────────────────────────────────────────────────── */

/** An inline blank in the sentence: underlined, sized to its content. */
const BLANK =
  "border-b-2 border-primary/60 bg-transparent pb-0.5 font-semibold text-foreground outline-none " +
  "transition-colors hover:border-primary focus:border-primary";

/**
 * A `<select>` sized to the option it is currently showing, not to the widest
 * one it could show. Otherwise every blank in the sentence trails a stretch
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
   * For a level metric this is the honest starting line, since "60 to 80%"
   * only means something if the 60% is real, so it is written into the sentence
   * and saved as the goal's baseline. For a metric that piles up inside the
   * window it is just the running total so far, so it is noted below the
   * sentence but never stored: those days are part of the target, not a line
   * to measure from.
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
          options={GOAL_METRICS.map((m) => ({ value: m.key, label: m.phrase }))}
        />{" "}
        {/* The starting line belongs in the sentence, not in a footnote under
            it: "from 67% to 85%" is the whole point of setting the goal. */}
        {!accumulates && reading != null && (
          <>
            <span className="text-muted-foreground">from</span>{" "}
            <span className="tabular-nums text-muted-foreground">{formatGoalValue(metric, reading)}</span>{" "}
          </>
        )}
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
            // Sized to what is typed, so the underline hugs the number instead
            // of trailing an empty stretch beside it.
            style={{ width: `${Math.max(1, target.length)}ch` }}
            className="bg-transparent tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
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

      {/* What that sentence will be measured on, plus what the window has
          already put in the bank for a metric that piles up. */}
      <p className="mt-2.5 max-w-2xl text-[12px] leading-relaxed text-muted-foreground">
        {METRIC_META[metric].help}
        {accumulates && reading != null && (
          <>
            {" "}
            <span className="font-semibold text-foreground">{formatGoalValue(metric, reading)}</span>{" "}
            already banked in {windowLabel(range.start, range.end, now)}, counting towards it.
          </>
        )}
        {reading == null && (
          <> Nothing logged in {windowLabel(range.start, range.end, now)} yet, so you start from zero.</>
        )}
      </p>

      <div className="mt-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <label className="min-w-0 flex-1 text-[13px] text-muted-foreground">
          Call it{" "}
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="something you will recognise"
            className={cn(
              "w-full max-w-xs border-b border-border bg-transparent pb-1 text-foreground outline-none",
              "placeholder:font-normal placeholder:text-muted-foreground/40 focus:border-primary"
            )}
          />
        </label>
        <button
          type="button"
          onClick={submit}
          disabled={busy}
          className={cn(
            EYEBROW,
            "press shrink-0 border-b-2 border-primary pb-0.5 text-primary",
            "hover:border-foreground hover:text-foreground disabled:opacity-50"
          )}
        >
          {busy ? "Setting..." : "Set goal"}
        </button>
      </div>
    </div>
  );
}
