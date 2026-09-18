"use client";

import { useState, useMemo, useCallback, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay,
  startOfMonth, endOfMonth, isWithinInterval,
} from "date-fns";
import { motion } from "motion/react";
import { toggleHabitCompletion } from "@/lib/supabase/queries";
import { computeMindScore } from "@/lib/mind-score/mind-score";
import { computeGoalProgress } from "@/lib/goals/goals";
import { useGmi } from "@/lib/gmi/client";
import type { CalendarMonth, CalendarEvent } from "@/lib/gmi/calendar";
import { holidaysByDate } from "@/lib/gmi/holidays";
import { fedEventsByDate } from "@/lib/gmi/fed-events";
import { alpha } from "@/lib/journal/colors";
import { tradeR, winRateOf } from "@/lib/journal/weeks";
import { usePrivacy } from "@/lib/use-privacy";
import { todayKey } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { HabitCompletion } from "@/lib/types";
import type { DashboardData } from "@/lib/dashboard/reads";
import {
  MindScoreOrb, GoalsCard, WinRateCard, ActiveCapitalCard, HabitsCard, WeekStrip, CARD_BASE, CardFx,
} from "@/components/dashboard/dashboard-cards";
import { DashboardDesk } from "@/components/dashboard/dashboard-desk";

const CYAN = "var(--ice)";
const RED = "var(--loss)";
const AMBER = "var(--be)";

/** The window a card reports on. Win rate and the mind score each keep their own. */
type Period = "week" | "month";

/** Remembers a card's week / month choice across reloads and navigation, so a
 *  switch to "week" stays put. Read through a store subscription rather than an
 *  effect: the server has no localStorage, so it renders the default and the
 *  client swaps in the stored value on its first paint: no extra render pass,
 *  no hydration mismatch. */
const periodListeners = new Set<() => void>();
function readPeriod(key: string): Period {
  try {
    const stored = localStorage.getItem(key);
    return stored === "week" || stored === "month" ? stored : "month";
  } catch {
    return "month";
  }
}

function usePersistedPeriod(key: string): [Period, (p: Period) => void] {
  const period = useSyncExternalStore(
    useCallback((onChange: () => void) => {
      periodListeners.add(onChange);
      return () => periodListeners.delete(onChange);
    }, []),
    useCallback(() => readPeriod(key), [key]),
    useCallback(() => "month" as Period, [])
  );

  const update = useCallback((p: Period) => {
    try {
      localStorage.setItem(key, p);
    } catch {
      /* ignore */
    }
    periodListeners.forEach((l) => l());
  }, [key]);

  return [period, update];
}

/** Today's key, on the browser's clock and kept current: a desk left open
 *  overnight rolls over to the new day rather than ticking habits into
 *  yesterday. The server rendered with its own clock, which can be a different
 *  day for a few hours around midnight; hydrating with the server's key and
 *  switching straight after is what keeps that from being a mismatch. */
function subscribeMinutely(onChange: () => void) {
  const id = setInterval(onChange, 60_000);
  return () => clearInterval(id);
}
function useToday(serverToday: string): string {
  return useSyncExternalStore(subscribeMinutely, todayKey, () => serverToday);
}

/** The hour decides the greeting; read after mount so the server, on its own
 *  clock, never argues with the browser about the time of day. */
function useGreeting(): string {
  return useSyncExternalStore(
    () => () => {},
    () => {
      const h = new Date().getHours();
      return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
    },
    () => ""
  );
}

export function DashboardClient({ data }: { data: DashboardData }) {
  const { hidden, toggle } = usePrivacy();
  const greeting = useGreeting();
  const today = useToday(data.today);
  const { trades, accounts, habits, analyses, bestTrades, weeklyReviews, adherenceLogs, goals, firstName } = data;

  // Habit ticks are the one thing the desk writes. The tick shows at once and
  // is put back if the write fails, so the row never sits behind a spinner.
  const [completions, setCompletions] = useState<HabitCompletion[]>(data.completions);
  const [pendingHabit, setPendingHabit] = useState<string | null>(null);
  const [habitError, setHabitError] = useState<string | null>(null);

  async function handleToggleHabit(habitId: string) {
    if (pendingHabit) return;
    const before = completions;
    const existing = before.find((c) => c.habit_id === habitId && c.date === today);
    const optimistic: HabitCompletion[] = existing
      ? before.map((c) => (c === existing ? { ...c, completed: !c.completed } : c))
      : [...before, { id: `pending-${habitId}`, habit_id: habitId, date: today, completed: true }];
    setPendingHabit(habitId);
    setHabitError(null);
    setCompletions(optimistic);
    try {
      const saved = await toggleHabitCompletion(habitId, today);
      setCompletions((cur) => cur.map((c) => (c.habit_id === habitId && c.date === today ? saved : c)));
    } catch {
      setCompletions(before);
      setHabitError("That tick did not save. Check your connection and try again.");
    } finally {
      setPendingHabit(null);
    }
  }

  // Every window on the desk is a whole day, so noon today stands in for the
  // clock: one stable object per day, and the memos below only rebuild when
  // the day does.
  const now = useMemo(() => new Date(today + "T12:00:00"), [today]);

  const activeAccounts = accounts.filter((a) => a.status === "active");
  const activeCapital = activeAccounts.reduce((s, a) => s + a.current_balance, 0);

  // Win rate and the mind score each report on their own window, remembered
  // per card so the choice survives a reload.
  const [wrPeriod, setWrPeriod] = usePersistedPeriod("tradecore:dash-winrate-period");
  const [mindPeriod, setMindPeriod] = usePersistedPeriod("tradecore:dash-mindscore-period");

  const periodTrades = useMemo(() => {
    const start = wrPeriod === "week" ? startOfWeek(now, { weekStartsOn: 1 }) : startOfMonth(now);
    const end = wrPeriod === "week" ? endOfWeek(now, { weekStartsOn: 1 }) : endOfMonth(now);
    return trades.filter((t) =>
      isWithinInterval(new Date(t.date_time.slice(0, 10) + "T12:00:00"), { start, end })
    );
  }, [trades, wrPeriod, now]);

  const wins = periodTrades.filter((t) => t.result === "win").length;
  const losses = periodTrades.filter((t) => t.result === "loss").length;
  const be = periodTrades.length - wins - losses;
  // Break-even trades are shown in the legend but excluded from the rate.
  const winRate = winRateOf(wins, losses);
  const periodR = periodTrades.reduce((s, t) => s + tradeR(t), 0);
  const goodExec = periodTrades.filter((t) => t.execution_quality === "good").length;
  const badExec = periodTrades.filter((t) => t.execution_quality === "bad").length;

  // Psych sessions only anchor the all-time window, which the desk never
  // shows, so they are not fetched for it.
  const mcMind = useMemo(
    () => computeMindScore(
      { now, trades, habits, completions, psychSessions: [], bestTrades, weeklyReviews, analyses, adherenceLogs, goals },
      mindPeriod
    ),
    [now, trades, habits, completions, bestTrades, weeklyReviews, analyses, adherenceLogs, goals, mindPeriod]
  );

  // Live goals with their standing, closest deadline first: the same reading
  // the Mind Edge goals tab gives, off data the desk already holds.
  const goalProgress = useMemo(() => {
    const input = { trades, habits, completions, now };
    return goals
      .filter((g) => !g.archived_at)
      .map((g) => ({ goal: g, p: computeGoalProgress(g, input) }))
      .sort((a, b) => {
        if (a.p.closed !== b.p.closed) return a.p.closed ? 1 : -1;
        return a.p.daysLeft - b.p.daysLeft;
      });
  }, [goals, trades, habits, completions, now]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(now, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end: endOfWeek(now, { weekStartsOn: 1 }) }).map((d) => {
      const dayTrades = trades.filter((t) => isSameDay(new Date(t.date_time.slice(0, 10) + "T12:00:00"), d));
      return { date: d, trades: dayTrades, r: dayTrades.reduce((s, t) => s + tradeR(t), 0) };
    });
  }, [trades, now]);

  const doneToday = new Set(completions.filter((c) => c.date === today && c.completed).map((c) => c.habit_id));

  return (
    // Fixed one-screen dashboard on desktop; on phones it flows and scrolls so
    // the stacked cards aren't squeezed into a single viewport height.
    // 7.5rem = the top nav (3.5rem) plus the page gutter above and below it:
    // anything less and the page keeps a stray scrollbar.
    <div className="flex flex-col gap-3 lg:h-[calc(100dvh-7.5rem)] lg:overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-wrap items-end justify-between gap-3 shrink-0"
      >
        <h1 className="font-heading font-bold text-lg md:text-xl text-foreground tracking-tight leading-none">
          {greeting ? `${greeting}${firstName ? `, ${firstName}` : ""}` : "Dashboard"}
        </h1>
      </motion.div>

      <DashboardDesk
        capital={<>
          <ActiveCapitalCard capital={activeCapital} count={activeAccounts.length} hidden={hidden} onToggle={toggle} />
          <HabitsCard
            habits={habits} doneToday={doneToday} pendingHabit={pendingHabit} onToggle={handleToggleHabit}
            error={habitError} className="max-h-[18rem] flex-1 md:max-h-none"
          />
        </>}
        winRate={<WinRateCard winRate={winRate} wins={wins} losses={losses} be={be} total={periodTrades.length} netR={periodR} goodExec={goodExec} badExec={badExec} period={wrPeriod} onPeriodChange={setWrPeriod} className="h-full" />}
        journal={<WeekStrip days={weekDays} today={today} />}
        mindScore={<MindScoreOrb score={mcMind} period={mindPeriod} onPeriodChange={setMindPeriod} className="shrink-0" />}
        goals={<GoalsCard goals={goals} progress={goalProgress} className="md:min-h-0 md:flex-1" />}
        news={<NewsHub today={today} className="md:min-h-0 md:flex-[1.7]" />}
      />
    </div>
  );
}

/* ── This week's news: the releases and Fed days that move the tape ───────
   What is still to come this week: US macro prints from FRED's own release
   calendar, the FOMC decisions and minutes from the Fed's published schedule,
   and any day the exchange is shut. Grouped by day and counting down as the
   week runs out: on Monday you see the whole week, by Thursday only Thursday
   to Sunday, because a print that has already landed is no longer news to plan
   around. A forthcoming print carries the appointment and nothing else: what a
   number will be is never guessed, and FRED publishes dates, not clock times. */
const NEWS_IMPORTANCE: Record<string, string> = { high: RED, medium: AMBER, low: "var(--muted-foreground)" };
const MAX_NEWS = 9;

type NewsItem = { key: string; date: string; label: string; tone: string; kind: "release" | "fed" | "closed" };

function NewsHub({ today, className }: { today: string; className?: string }) {
  // Keyed on the day, so the week's bounds are stable objects between renders
  // and the row list below is only rebuilt when something actually changed.
  const { weekStart, weekEnd } = useMemo(() => {
    const d = new Date(today + "T12:00:00");
    return { weekStart: startOfWeek(d, { weekStartsOn: 1 }), weekEnd: endOfWeek(d, { weekStartsOn: 1 }) };
  }, [today]);
  const thisMonth = format(weekStart, "yyyy-MM");
  const nextMonth = format(weekEnd, "yyyy-MM");

  // A week can straddle a month end, so the spill-over month is fetched too.
  const { env: a } = useGmi<CalendarMonth>(`/api/gmi/calendar?month=${thisMonth}`, 30 * 60_000);
  const { env: b } = useGmi<CalendarMonth>(
    nextMonth === thisMonth ? null : `/api/gmi/calendar?month=${nextMonth}`,
    30 * 60_000
  );

  // The window shrinks as the week runs down: from today, never from Monday.
  const from = today;
  const to = format(weekEnd, "yyyy-MM-dd");

  const { days, total } = useMemo(() => {
    // One line per release, not one per series: CPI and Core CPI land together
    // and would otherwise say the same thing twice. The headline print is the
    // one that moves the tape, so a "Core" variant never speaks for a release.
    const byRelease = new Map<string, CalendarEvent>();
    for (const e of [...(a?.data?.events ?? []), ...(b?.data?.events ?? [])]) {
      if (e.date < from || e.date > to) continue;
      const key = `${e.date}:${e.releaseName}`;
      const held = byRelease.get(key);
      const rank = (x: CalendarEvent) => (x.label.startsWith("Core") ? 1 : 0);
      if (!held || rank(e) < rank(held) || (rank(e) === rank(held) && e.label < held.label)) {
        byRelease.set(key, e);
      }
    }

    const items: NewsItem[] = [
      ...[...byRelease.values()].map((e) => ({
        key: e.id, date: e.date, label: e.label,
        tone: NEWS_IMPORTANCE[e.importance] ?? "var(--muted-foreground)", kind: "release" as const,
      })),
      ...[...fedEventsByDate(from, to).values()].flat().map((e) => ({
        key: `fed-${e.kind}-${e.date}`, date: e.date,
        label: e.kind === "fomc-decision" ? "FOMC rate decision" : "FOMC minutes",
        tone: CYAN, kind: "fed" as const,
      })),
      ...[...holidaysByDate(weekStart, weekEnd).values()].flat()
        .filter((h) => h.kind === "closed" && h.market === "US" && h.date >= from && h.date <= to)
        .map((h) => ({
          key: `holiday-${h.date}`, date: h.date, label: `${h.name}: US market closed`,
          tone: "var(--muted-foreground)", kind: "closed" as const,
        })),
    ];

    // Too many for the card? Trim the quiet tail, never a Fed day or a
    // high-impact print, then restore date order.
    const rank = (i: NewsItem) => (i.kind === "fed" ? 0 : i.tone === RED ? 1 : i.tone === AMBER ? 2 : 3);
    const trimmed = items.length <= MAX_NEWS
      ? items
      : [...items].sort((x, y) => rank(x) - rank(y)).slice(0, MAX_NEWS);
    trimmed.sort((x, y) => x.date.localeCompare(y.date) || rank(x) - rank(y));

    // Group into days, so the card reads as a countdown of the week ahead.
    const map = new Map<string, NewsItem[]>();
    for (const it of trimmed) (map.get(it.date) ?? map.set(it.date, []).get(it.date)!).push(it);
    const days = [...map.entries()].sort(([x], [y]) => x.localeCompare(y)).map(([date, list]) => ({ date, list }));
    return { days, total: items.length };
  }, [a, b, from, to, weekStart, weekEnd]);

  const unavailable = a?.status === "unavailable";

  return (
    <div className={cn(CARD_BASE, "flex flex-col", className)}>
      <CardFx accent={CYAN} />

      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">The week ahead</p>
        <Link href="/news-city?tab=calendar" className="shrink-0 whitespace-nowrap text-[11px] font-semibold text-primary hover:underline">
          Full calendar →
        </Link>
      </div>

      {days.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-1 py-3 text-center">
          <p className="text-sm text-muted-foreground">{unavailable ? "Calendar unavailable" : "Nothing left this week"}</p>
          <p className="text-xs text-muted-foreground/60">
            {unavailable ? "FRED is not answering right now." : "No more US macro releases scheduled."}
          </p>
        </div>
      ) : (
        <div className="mt-3 space-y-3 md:min-h-0 md:flex-1 md:overflow-y-auto pr-0.5">
          {days.map(({ date, list }) => {
            const day = new Date(date + "T12:00:00");
            const isTodayRow = date === today;
            return (
              <div key={date}>
                <p
                  className={cn(
                    "mb-1.5 text-[11px] font-bold uppercase tracking-wider tabular-nums",
                    isTodayRow ? "text-primary" : "text-muted-foreground/70"
                  )}
                >
                  {isTodayRow ? "Today" : format(day, "EEEE d")}
                </p>
                <ul className="space-y-1.5">
                  {list.map((r) => (
                    <li key={r.key} className="flex items-center gap-2.5">
                      {r.kind === "closed" ? (
                        <span aria-hidden className="h-2 w-2 shrink-0 rotate-45 border border-muted-foreground/60" />
                      ) : (
                        <span aria-hidden className="h-2 w-2 shrink-0 rounded-full" style={{ background: r.tone, boxShadow: `0 0 6px ${alpha(r.tone, 45)}` }} />
                      )}
                      <span className="min-w-0 flex-1 truncate text-[13px] text-foreground/90">{r.label}</span>
                      {r.kind === "fed" && (
                        <span className="shrink-0 rounded border px-1 text-[9px] font-bold uppercase tracking-wider" style={{ borderColor: alpha(CYAN, 45), color: CYAN }}>
                          Fed
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
          {total > MAX_NEWS && (
            <p className="text-[11px] text-muted-foreground/60">+{total - MAX_NEWS} more this week</p>
          )}
        </div>
      )}

      <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border/40 pt-2 text-[10px] text-muted-foreground/60">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ background: RED }} /> high impact
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ background: CYAN }} /> Fed
        </span>
        <span className="ml-auto">Times ET, dates only</span>
      </p>
    </div>
  );
}
