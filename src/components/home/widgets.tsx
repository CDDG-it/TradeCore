"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight, X, TrendingUp, TrendingDown, Flame, Target,
  Wallet, ScrollText, CalendarClock, Loader2, GripVertical, ChevronLeft, ChevronRight,
  SlidersHorizontal, Check,
} from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import {
  getTrades, getAccounts, getHabits, getHabitCompletions, getHabitStreak, getProfile,
} from "@/lib/supabase/queries";
import { computeDiscipline } from "@/lib/discipline";
import { tradeR } from "@/lib/journal/weeks";
import { usePrivacy, mask } from "@/lib/use-privacy";
import { cn } from "@/lib/utils";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  WIDGET_MAP, WIDGET_CONTROLS, DEFAULT_WIDGET_OPTIONS,
  type WidgetId, type WidgetOptions, type WidgetScope, type WidgetSessionFilter,
} from "@/lib/home/widgets";
import type { TradeJournalEntry } from "@/lib/types";

const TODAY = format(new Date(), "yyyy-MM-dd");

const SCOPE_LABEL: Record<WidgetScope, string> = { all: "All-time", month: "This month", week: "This week" };
const SESSION_LABEL: Record<WidgetSessionFilter, string> = { all: "All sessions", London: "London", "New York": "New York", Asia: "Asia" };

/** Trades within a widget's configured scope + session. */
function scopeTrades(trades: TradeJournalEntry[], options: WidgetOptions): TradeJournalEntry[] {
  const scope = options.scope ?? "week";
  const session = options.session ?? "all";
  let list = trades;
  if (scope !== "all") {
    const now = new Date();
    const start = scope === "week" ? startOfWeek(now, { weekStartsOn: 1 }) : startOfMonth(now);
    const end = scope === "week" ? endOfWeek(now, { weekStartsOn: 1 }) : endOfMonth(now);
    list = list.filter((t) => isWithinInterval(new Date(t.date_time.slice(0, 10) + "T12:00:00"), { start, end }));
  }
  if (session !== "all") list = list.filter((t) => t.session === session);
  return list;
}

/** Options menu shown on configurable widgets: scope / session / row count. */
function WidgetOptionsMenu({
  id,
  options,
  onChange,
}: {
  id: WidgetId;
  options: WidgetOptions;
  onChange: (id: WidgetId, next: WidgetOptions) => void;
}) {
  const controls = WIDGET_CONTROLS[id];
  if (!controls) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            title="Widget options"
            className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all"
          />
        }
      >
        <SlidersHorizontal className="w-3.5 h-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        {controls.scope && (
          <>
            <DropdownMenuLabel>Period</DropdownMenuLabel>
            {(["week", "month", "all"] as WidgetScope[]).map((scope) => (
              <DropdownMenuItem key={scope} onClick={() => onChange(id, { ...options, scope })}>
                {options.scope === scope && <Check className="w-3.5 h-3.5" />}
                <span className={cn(options.scope !== scope && "pl-[22px]")}>{SCOPE_LABEL[scope]}</span>
              </DropdownMenuItem>
            ))}
          </>
        )}
        {controls.session && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Session</DropdownMenuLabel>
            {(["all", "London", "New York", "Asia"] as WidgetSessionFilter[]).map((session) => (
              <DropdownMenuItem key={session} onClick={() => onChange(id, { ...options, session })}>
                {options.session === session && <Check className="w-3.5 h-3.5" />}
                <span className={cn(options.session !== session && "pl-[22px]")}>{SESSION_LABEL[session]}</span>
              </DropdownMenuItem>
            ))}
          </>
        )}
        {controls.counts && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Show</DropdownMenuLabel>
            {controls.counts.map((count) => (
              <DropdownMenuItem key={count} onClick={() => onChange(id, { ...options, count })}>
                {options.count === count && <Check className="w-3.5 h-3.5" />}
                <span className={cn(options.count !== count && "pl-[22px]")}>{count} trades</span>
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Shared shell: a clickable card linking to the full page. While the Home is
 *  in edit mode it stops navigating and exposes drag + move/remove controls so
 *  widgets can be rearranged. Configurable widgets also get an options menu. */
function WidgetShell({
  id,
  editing,
  options,
  onOptionsChange,
  onRemove,
  onMove,
  canMoveBack,
  canMoveForward,
  children,
}: {
  id: WidgetId;
  editing: boolean;
  options: WidgetOptions;
  onOptionsChange: (id: WidgetId, next: WidgetOptions) => void;
  onRemove: (id: WidgetId) => void;
  onMove?: (id: WidgetId, dir: -1 | 1) => void;
  canMoveBack?: boolean;
  canMoveForward?: boolean;
  children: React.ReactNode;
}) {
  const meta = WIDGET_MAP[id];
  return (
    <div className="relative group h-full">
      <Link
        href={meta.href}
        draggable={false}
        onClick={editing ? (e) => e.preventDefault() : undefined}
        className={cn(
          "card-hover flex h-full flex-col rounded-xl p-5 overflow-hidden",
          editing && "cursor-move select-none"
        )}
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center justify-between mb-3 gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">{meta.source}</p>
            <h3 className="text-sm font-semibold truncate">{meta.title}</h3>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {!editing && <WidgetOptionsMenu id={id} options={options} onChange={onOptionsChange} />}
            {editing ? (
              <GripVertical className="w-4 h-4 shrink-0 text-muted-foreground/50" />
            ) : (
              <ArrowRight className="w-3.5 h-3.5 shrink-0 text-muted-foreground/40 transition-all group-hover:text-primary group-hover:translate-x-0.5" />
            )}
          </div>
        </div>
        <div className="flex-1">{children}</div>
      </Link>

      {editing && (
        <>
          {/* Move controls (also work on touch, where native drag doesn't) */}
          <div className="absolute bottom-2 right-2 z-10 flex items-center gap-1">
            <button
              type="button"
              onClick={() => onMove?.(id, -1)}
              disabled={!canMoveBack}
              title="Move earlier"
              className="w-6 h-6 rounded-md flex items-center justify-center border transition-colors disabled:opacity-30 hover:bg-muted"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onMove?.(id, 1)}
              disabled={!canMoveForward}
              title="Move later"
              className="w-6 h-6 rounded-md flex items-center justify-center border transition-colors disabled:opacity-30 hover:bg-muted"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => onRemove(id)}
            title="Remove widget"
            className="absolute -top-2 -right-2 z-10 w-6 h-6 rounded-full flex items-center justify-center shadow-sm transition-transform hover:scale-110"
            style={{ background: "var(--destructive)", color: "#fff" }}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </>
      )}
    </div>
  );
}

function Loading() {
  return (
    <div className="flex items-center h-12 text-muted-foreground/40">
      <Loader2 className="w-4 h-4 animate-spin" />
    </div>
  );
}

const scoreColor = (v: number) =>
  v >= 80 ? "oklch(0.58 0.17 145)" : v >= 60 ? "oklch(0.70 0.16 72)" : "oklch(0.58 0.22 25)";

function scopeSubtitle(options: WidgetOptions, suffix: string): string {
  const scope = options.scope ?? "week";
  const session = options.session ?? "all";
  const base = scope === "all" ? `all-time ${suffix}` : scope === "week" ? `this week` : `this month`;
  return session === "all" ? base : `${base} · ${session}`;
}

// ── Weekly R (net R for the configured scope/session) ────────────────
function WeeklyRWidget({ options }: { options: WidgetOptions }) {
  const [trades, setTrades] = useState<TradeJournalEntry[] | null>(null);
  useEffect(() => { getTrades().then(setTrades); }, []);
  if (!trades) return <Loading />;
  const inScope = scopeTrades(trades, options);
  const r = inScope.reduce((s, t) => s + tradeR(t), 0);
  const color = r > 0 ? "oklch(0.58 0.17 145)" : r < 0 ? "oklch(0.58 0.22 25)" : "var(--muted-foreground)";
  return (
    <div>
      <p className="text-3xl font-black tabular-nums" style={{ color }}>{r > 0 ? "+" : ""}{r.toFixed(1)}R</p>
      <p className="text-xs text-muted-foreground mt-1">{inScope.length} trade{inScope.length !== 1 ? "s" : ""} · {scopeSubtitle(options, "")}</p>
    </div>
  );
}

// ── Win rate ──────────────────────────────────────────────────────────
function WinRateWidget({ options }: { options: WidgetOptions }) {
  const [trades, setTrades] = useState<TradeJournalEntry[] | null>(null);
  useEffect(() => { getTrades().then(setTrades); }, []);
  if (!trades) return <Loading />;
  const inScope = scopeTrades(trades, options);
  const pct = inScope.length ? Math.round((inScope.filter((t) => t.result === "win").length / inScope.length) * 100) : 0;
  return (
    <div>
      <p className="text-3xl font-black tabular-nums" style={{ color: "oklch(0.72 0.14 220)" }}>{pct}%</p>
      <p className="text-xs text-muted-foreground mt-1">{inScope.length} trade{inScope.length !== 1 ? "s" : ""} · {scopeSubtitle(options, "")}</p>
    </div>
  );
}

// ── Discipline ────────────────────────────────────────────────────────
function DisciplineWidget({ options }: { options: WidgetOptions }) {
  const [score, setScore] = useState<number | null | undefined>(undefined);
  useEffect(() => {
    Promise.all([getTrades(), getHabits(), getHabitCompletions()]).then(([t, h, c]) => {
      const scope = options.scope ?? "week";
      const now = new Date();
      const start = scope === "all" ? new Date(2000, 0, 1) : scope === "week" ? startOfWeek(now, { weekStartsOn: 1 }) : startOfMonth(now);
      const end = scope === "all" ? now : scope === "week" ? endOfWeek(now, { weekStartsOn: 1 }) : endOfMonth(now);
      setScore(computeDiscipline(t, h, c, start, end).total);
    });
  }, [options.scope]);
  if (score === undefined) return <Loading />;
  const color = score === null ? "var(--muted-foreground)" : scoreColor(score);
  return (
    <div className="flex items-center gap-3">
      <Target className="w-8 h-8 shrink-0" style={{ color }} />
      <div>
        <p className="text-3xl font-black tabular-nums" style={{ color }}>{score === null ? "—" : `${score}%`}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{SCOPE_LABEL[options.scope ?? "week"].toLowerCase()}</p>
      </div>
    </div>
  );
}

// ── Habits streak ─────────────────────────────────────────────────────
function HabitsStreakWidget() {
  const [data, setData] = useState<{ streak: number; done: number; total: number } | null>(null);
  useEffect(() => {
    Promise.all([getHabits(), getHabitCompletions()]).then(async ([habits, comps]) => {
      const streaks = await Promise.all(habits.map((h) => getHabitStreak(h.id)));
      const longest = streaks.reduce((m, s) => Math.max(m, s), 0);
      const done = comps.filter((c) => c.date === TODAY && c.completed).length;
      setData({ streak: longest, done, total: habits.length });
    });
  }, []);
  if (!data) return <Loading />;
  return (
    <div className="flex items-center gap-3">
      <Flame className="w-8 h-8 shrink-0" style={{ color: "oklch(0.58 0.22 25)" }} />
      <div>
        <p className="text-3xl font-black tabular-nums" style={{ color: "oklch(0.58 0.22 25)" }}>{data.streak}d</p>
        <p className="text-xs text-muted-foreground mt-0.5">{data.done}/{data.total} done today</p>
      </div>
    </div>
  );
}

// ── Recent trades ─────────────────────────────────────────────────────
function ResultDot({ t }: { t: TradeJournalEntry }) {
  const color = t.result === "win" ? "oklch(0.58 0.17 145)" : t.result === "loss" ? "oklch(0.58 0.22 25)" : "oklch(0.70 0.16 72)";
  return (
    <span className="inline-flex items-center gap-1 shrink-0" style={{ color }}>
      {t.direction === "long" ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
    </span>
  );
}
function RecentTradesWidget({ options }: { options: WidgetOptions }) {
  const [trades, setTrades] = useState<TradeJournalEntry[] | null>(null);
  useEffect(() => { getTrades().then(setTrades); }, []);
  if (!trades) return <Loading />;
  const session = options.session ?? "all";
  const filtered = session === "all" ? trades : trades.filter((t) => t.session === session);
  const shown = filtered.slice(0, options.count ?? 3);
  if (shown.length === 0)
    return <p className="text-xs text-muted-foreground">No trades logged yet.</p>;
  return (
    <div className="space-y-1.5">
      {shown.map((t) => {
        const color = t.result === "win" ? "oklch(0.58 0.17 145)" : t.result === "loss" ? "oklch(0.58 0.22 25)" : "oklch(0.70 0.16 72)";
        return (
          <div key={t.id} className="flex items-center gap-2 text-xs">
            <ResultDot t={t} />
            <span className="font-semibold">{t.instrument}</span>
            <span className="text-muted-foreground truncate flex-1">{format(new Date(t.date_time.slice(0, 10) + "T12:00:00"), "MMM d")}</span>
            <span className="font-bold tabular-nums shrink-0" style={{ color }}>
              {t.result === "win" ? `+${t.rr}R` : t.result === "loss" ? "-1R" : "0R"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Active accounts ───────────────────────────────────────────────────
function ActiveAccountsWidget() {
  const { hidden } = usePrivacy();
  const [data, setData] = useState<{ count: number; capital: number } | null>(null);
  useEffect(() => {
    getAccounts().then((accts) => {
      const active = accts.filter((a) => a.status === "active");
      setData({ count: active.length, capital: active.reduce((s, a) => s + a.current_balance, 0) });
    });
  }, []);
  if (!data) return <Loading />;
  return (
    <div className="flex items-center gap-3">
      <Wallet className="w-8 h-8 shrink-0" style={{ color: "oklch(0.58 0.17 145)" }} />
      <div className="min-w-0">
        <p className="text-2xl font-black tabular-nums truncate" style={{ color: "oklch(0.58 0.17 145)" }}>
          {data.capital > 0 ? mask(`$${data.capital.toLocaleString()}`, hidden) : "—"}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{data.count} active account{data.count !== 1 ? "s" : ""}</p>
      </div>
    </div>
  );
}

// ── Trading rules ─────────────────────────────────────────────────────
function TradingRulesWidget() {
  const [rules, setRules] = useState<string[] | null>(null);
  useEffect(() => {
    getProfile().then((p) => {
      setRules(p?.discipline_rules ? p.discipline_rules.split("\n").map((l) => l.trim()).filter(Boolean) : []);
    });
  }, []);
  if (!rules) return <Loading />;
  if (rules.length === 0)
    return <p className="text-xs text-muted-foreground">No rules yet. Add them in Trading Behaviour.</p>;
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <ScrollText className="w-4 h-4" style={{ color: "oklch(0.72 0.14 220)" }} />
        <span className="text-2xl font-black tabular-nums">{rules.length}</span>
        <span className="text-xs text-muted-foreground">rules</span>
      </div>
      <ul className="space-y-0.5">
        {rules.slice(0, 2).map((r, i) => (
          <li key={i} className="text-xs text-muted-foreground truncate">· {r}</li>
        ))}
      </ul>
    </div>
  );
}

// ── Calendar ──────────────────────────────────────────────────────────
type Ev = { summary: string; start: string; allDay: boolean };
function CalendarWidget() {
  const [events, setEvents] = useState<Ev[] | null>(null);
  const [connected, setConnected] = useState(true);
  useEffect(() => {
    const url = typeof window !== "undefined" ? localStorage.getItem("mc_ical_url") : null;
    if (!url) { setConnected(false); setEvents([]); return; }
    fetch(`/api/ical?url=${encodeURIComponent(url)}`)
      .then((r) => r.json())
      .then((d) => setEvents(d.events || []))
      .catch(() => setEvents([]));
  }, []);
  if (events === null) return <Loading />;
  if (!connected)
    return <p className="text-xs text-muted-foreground">Connect a calendar in Habits to see events.</p>;
  if (events.length === 0)
    return <p className="text-xs text-muted-foreground">No events in the next two weeks.</p>;
  return (
    <div className="space-y-1.5">
      {events.slice(0, 3).map((e, i) => {
        const d = new Date(e.start);
        return (
          <div key={i} className="flex items-center gap-2 text-xs">
            <CalendarClock className="w-3.5 h-3.5 shrink-0 text-primary" />
            <span className="text-muted-foreground shrink-0 w-16">{format(d, "EEE HH:mm")}</span>
            <span className="truncate flex-1">{e.summary}</span>
          </div>
        );
      })}
    </div>
  );
}

const COMPONENTS: Record<WidgetId, React.ComponentType<{ options: WidgetOptions }>> = {
  "weekly-r": WeeklyRWidget,
  "win-rate": WinRateWidget,
  discipline: DisciplineWidget,
  "habits-streak": HabitsStreakWidget,
  "recent-trades": RecentTradesWidget,
  "active-accounts": ActiveAccountsWidget,
  "trading-rules": TradingRulesWidget,
  calendar: CalendarWidget,
};

/** Renders a single widget by id inside the shared clickable shell. */
export function HomeWidget({
  id,
  editing,
  options,
  onOptionsChange,
  onRemove,
  onMove,
  canMoveBack,
  canMoveForward,
}: {
  id: WidgetId;
  editing: boolean;
  options?: WidgetOptions;
  onOptionsChange: (id: WidgetId, next: WidgetOptions) => void;
  onRemove: (id: WidgetId) => void;
  onMove?: (id: WidgetId, dir: -1 | 1) => void;
  canMoveBack?: boolean;
  canMoveForward?: boolean;
}) {
  const resolved = { ...DEFAULT_WIDGET_OPTIONS, ...options };
  const Body = COMPONENTS[id];
  return (
    <WidgetShell
      id={id}
      editing={editing}
      options={resolved}
      onOptionsChange={onOptionsChange}
      onRemove={onRemove}
      onMove={onMove}
      canMoveBack={canMoveBack}
      canMoveForward={canMoveForward}
    >
      <Body options={resolved} />
    </WidgetShell>
  );
}
