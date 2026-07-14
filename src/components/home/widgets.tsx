"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight, X, TrendingUp, TrendingDown,
  ScrollText, Loader2, GripVertical, ChevronLeft, ChevronRight,
  SlidersHorizontal, Check, Circle, Crosshair, Radar, FileText, Maximize2,
} from "lucide-react";
import {
  format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval,
  eachDayOfInterval, getDay, addMonths, subMonths, isToday,
} from "date-fns";
import {
  getTrades, getAccounts, getHabits, getHabitCompletions, getHabitStreak, getProfile,
  toggleHabitCompletion, getAnalyses,
} from "@/lib/supabase/queries";
import { NEWS_CITY_DATA } from "@/lib/news-city/data";
import { SENTIMENT_META, RISK_META } from "@/lib/news-city/ui";
import { computeDiscipline } from "@/lib/discipline";
import { tradeR } from "@/lib/journal/weeks";
import { usePrivacy, mask } from "@/lib/use-privacy";
import { cn } from "@/lib/utils";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuGroup, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  WIDGET_MAP, WIDGET_CONTROLS, DEFAULT_WIDGET_OPTIONS, WIDGET_SIZE_LABEL, WIDGET_SIZE_CARD_CLASSES,
  type WidgetId, type WidgetOptions, type WidgetScope, type WidgetSessionFilter, type WidgetSize,
} from "@/lib/home/widgets";
import type { TradeJournalEntry, Habit, HabitCompletion, PreTradeAnalysis } from "@/lib/types";

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

/** Options menu shown on every widget: size, plus scope / session / row count /
 *  a "Show details" toggle for the widgets that declare those extra controls. */
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            title="Widget options"
            className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 shrink-0 w-6 h-6 rounded-md flex items-center justify-center border transition-all"
            style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--muted-foreground)" }}
          />
        }
      >
        <SlidersHorizontal className="w-3.5 h-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Size</DropdownMenuLabel>
          {(["small", "wide", "tall"] as WidgetSize[]).map((size) => (
            <DropdownMenuItem key={size} onClick={() => onChange(id, { ...options, size })}>
              {options.size === size && <Check className="w-3.5 h-3.5" />}
              <span className={cn(options.size !== size && "pl-[22px]")}>{WIDGET_SIZE_LABEL[size]}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        {controls?.scope && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>Period</DropdownMenuLabel>
              {(["week", "month", "all"] as WidgetScope[]).map((scope) => (
                <DropdownMenuItem key={scope} onClick={() => onChange(id, { ...options, scope })}>
                  {options.scope === scope && <Check className="w-3.5 h-3.5" />}
                  <span className={cn(options.scope !== scope && "pl-[22px]")}>{SCOPE_LABEL[scope]}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </>
        )}
        {controls?.session && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>Session</DropdownMenuLabel>
              {(["all", "London", "New York", "Asia"] as WidgetSessionFilter[]).map((session) => (
                <DropdownMenuItem key={session} onClick={() => onChange(id, { ...options, session })}>
                  {options.session === session && <Check className="w-3.5 h-3.5" />}
                  <span className={cn(options.session !== session && "pl-[22px]")}>{SESSION_LABEL[session]}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </>
        )}
        {controls?.counts && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>Show</DropdownMenuLabel>
              {controls.counts.map((count) => (
                <DropdownMenuItem key={count} onClick={() => onChange(id, { ...options, count })}>
                  {options.count === count && <Check className="w-3.5 h-3.5" />}
                  <span className={cn(options.count !== count && "pl-[22px]")}>{count} {controls.countsLabel ?? "trades"}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </>
        )}
        {controls?.details && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={options.details ?? false}
              closeOnClick={false}
              onCheckedChange={(details) => onChange(id, { ...options, details })}
            >
              Show details
            </DropdownMenuCheckboxItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Shared shell for every widget. Only the header (source label, title, arrow)
 * is a navigable `<Link>` to the widget's full page — the body renders as a
 * plain sibling `<div>` so widgets are free to hold their own interactive
 * elements (checkboxes, per-row links) without nesting them inside an anchor,
 * which is invalid HTML and makes click handling unreliable.
 */
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
  const sizeClasses = WIDGET_SIZE_CARD_CLASSES[options.size ?? "small"];
  return (
    <div
      className={cn(
        "relative group h-full flex flex-col rounded-xl card-hover",
        // While editing, let the remove/move controls sit just outside the card
        // without being clipped; otherwise clip content to the rounded corners.
        editing ? "overflow-visible" : "overflow-hidden",
        sizeClasses
      )}
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
    >
      <Link
        href={meta.href}
        draggable={false}
        onClick={editing ? (e) => e.preventDefault() : undefined}
        className={cn("flex items-center justify-between mb-3 gap-2", editing && "cursor-move select-none")}
      >
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">{meta.source}</p>
          <h3 className="text-sm font-semibold truncate">{meta.title}</h3>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {/* Reserve space so the title never runs under the options button,
              which is an independent sibling (see absolute div below) so its
              click handling never interferes with this Link's own. */}
          {!editing && <span className="w-6 h-6" aria-hidden />}
          {editing ? (
            <GripVertical className="w-4 h-4 shrink-0 text-muted-foreground/50" />
          ) : (
            <ArrowRight className="w-3.5 h-3.5 shrink-0 text-muted-foreground/40 transition-all group-hover:text-primary group-hover:translate-x-0.5" />
          )}
        </div>
      </Link>

      <div className="flex-1 min-h-0">{children}</div>

      {!editing && (
        <div className="absolute top-4 right-9 z-10">
          <WidgetOptionsMenu id={id} options={options} onChange={onOptionsChange} />
        </div>
      )}

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

/** Row cap for list widgets that expose a "count" control: a tall card always
 *  shows everything, otherwise the chosen count (falling back to `fallback`). */
function listCap(options: WidgetOptions, total: number, fallback: number): number {
  if (options.size === "tall") return total;
  return options.count ?? fallback;
}

// ── Weekly R (net R for the configured scope/session) ────────────────
function WeeklyRWidget({ options }: { options: WidgetOptions }) {
  const [trades, setTrades] = useState<TradeJournalEntry[] | null>(null);
  useEffect(() => { getTrades().then(setTrades); }, []);
  if (!trades) return <Loading />;
  const inScope = scopeTrades(trades, options);
  const r = inScope.reduce((s, t) => s + tradeR(t), 0);
  const color = r > 0 ? "oklch(0.58 0.17 145)" : r < 0 ? "oklch(0.58 0.22 25)" : "var(--muted-foreground)";
  const wins = inScope.filter((t) => t.result === "win").length;
  const losses = inScope.filter((t) => t.result === "loss").length;
  const avg = inScope.length ? r / inScope.length : 0;
  return (
    <div>
      <p className="text-3xl font-black tabular-nums" style={{ color }}>{r > 0 ? "+" : ""}{r.toFixed(1)}R</p>
      <p className="text-xs text-muted-foreground mt-1">{inScope.length} trade{inScope.length !== 1 ? "s" : ""} · {scopeSubtitle(options, "")}</p>
      {options.details && inScope.length > 0 && (
        <div className="mt-2 pt-2 border-t border-border/50 text-xs text-muted-foreground space-y-0.5">
          <p>{wins}W · {losses}L · {inScope.length - wins - losses}BE</p>
          <p>avg {avg > 0 ? "+" : ""}{avg.toFixed(2)}R per trade</p>
        </div>
      )}
    </div>
  );
}

// ── Win rate ──────────────────────────────────────────────────────────
function WinRateWidget({ options }: { options: WidgetOptions }) {
  const [trades, setTrades] = useState<TradeJournalEntry[] | null>(null);
  useEffect(() => { getTrades().then(setTrades); }, []);
  if (!trades) return <Loading />;
  const inScope = scopeTrades(trades, options);
  const wins = inScope.filter((t) => t.result === "win").length;
  const losses = inScope.filter((t) => t.result === "loss").length;
  const pct = inScope.length ? Math.round((wins / inScope.length) * 100) : 0;
  return (
    <div>
      <p className="text-3xl font-black tabular-nums" style={{ color: "oklch(0.72 0.14 220)" }}>{pct}%</p>
      <p className="text-xs text-muted-foreground mt-1">{inScope.length} trade{inScope.length !== 1 ? "s" : ""} · {scopeSubtitle(options, "")}</p>
      {options.details && inScope.length > 0 && (
        <div className="mt-2 pt-2 border-t border-border/50 text-xs text-muted-foreground space-y-0.5">
          <p>{wins}W · {losses}L · {inScope.length - wins - losses}BE</p>
        </div>
      )}
    </div>
  );
}

// ── Avg R:R (reward on winning trades) ───────────────────────────────
function AvgRRWidget({ options }: { options: WidgetOptions }) {
  const [trades, setTrades] = useState<TradeJournalEntry[] | null>(null);
  useEffect(() => { getTrades().then(setTrades); }, []);
  if (!trades) return <Loading />;
  const inScope = scopeTrades(trades, options);
  const wins = inScope.filter((t) => t.result === "win");
  const avg = wins.length ? wins.reduce((s, t) => s + t.rr, 0) / wins.length : 0;
  const best = wins.reduce((m, t) => Math.max(m, t.rr), 0);
  return (
    <div>
      <p className="text-3xl font-black tabular-nums" style={{ color: "oklch(0.70 0.12 183)" }}>{avg.toFixed(1)}R</p>
      <p className="text-xs text-muted-foreground mt-1">{wins.length} win{wins.length !== 1 ? "s" : ""} · {scopeSubtitle(options, "")}</p>
      {options.details && wins.length > 0 && (
        <div className="mt-2 pt-2 border-t border-border/50 text-xs text-muted-foreground space-y-0.5">
          <p>Best +{best}R · winning trades only</p>
        </div>
      )}
    </div>
  );
}

// ── Execution (how cleanly trades were run) ──────────────────────────
function ExecutionWidget({ options }: { options: WidgetOptions }) {
  const [trades, setTrades] = useState<TradeJournalEntry[] | null>(null);
  useEffect(() => { getTrades().then(setTrades); }, []);
  if (!trades) return <Loading />;
  const inScope = scopeTrades(trades, options);
  const rated = inScope.filter((t) => t.execution_quality === "good" || t.execution_quality === "bad");
  const good = rated.filter((t) => t.execution_quality === "good").length;
  const bad = rated.length - good;
  const pct = rated.length ? Math.round((good / rated.length) * 100) : null;
  const color = pct === null ? "var(--muted-foreground)" : scoreColor(pct);
  return (
    <div>
      <p className="text-3xl font-black tabular-nums" style={{ color }}>{pct === null ? "—" : `${pct}%`}</p>
      <p className="text-xs text-muted-foreground mt-1">
        {rated.length ? `${good} of ${rated.length} well executed` : "no rated trades"} · {scopeSubtitle(options, "")}
      </p>
      {options.details && rated.length > 0 && (
        <div className="mt-2 pt-2 border-t border-border/50 space-y-1.5">
          <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-border/60">
            <div className="h-full" style={{ width: `${(good / rated.length) * 100}%`, background: "oklch(0.58 0.17 145)" }} />
            <div className="h-full" style={{ width: `${(bad / rated.length) * 100}%`, background: "oklch(0.58 0.22 25)" }} />
          </div>
          <p className="text-xs text-muted-foreground">
            <span style={{ color: "oklch(0.58 0.17 145)" }}>{good} good</span> · <span style={{ color: "oklch(0.58 0.22 25)" }}>{bad} bad</span>
          </p>
        </div>
      )}
    </div>
  );
}

// ── Pre-Market Analysis (latest pre-trade prep) ──────────────────────
const BIAS_COLOR: Record<string, string> = {
  bullish: "oklch(0.58 0.17 145)", bearish: "oklch(0.58 0.22 25)", choppy: "oklch(0.70 0.16 72)",
};
function PreMarketAnalysisWidget({ options }: { options: WidgetOptions }) {
  const [analyses, setAnalyses] = useState<PreTradeAnalysis[] | null>(null);
  useEffect(() => { getAnalyses().then(setAnalyses); }, []);
  if (!analyses) return <Loading />;
  if (analyses.length === 0)
    return <p className="text-xs text-muted-foreground">No analyses yet. Prep one in Analysis.</p>;
  const visible = analyses.slice(0, listCap(options, analyses.length, 3));
  return (
    <div className="space-y-1 overflow-y-auto">
      {visible.map((a) => (
        <Link
          key={a.id}
          href={`/analysis/${a.id}`}
          className="block rounded-lg px-1.5 py-1 -mx-1.5 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2 text-xs">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: BIAS_COLOR[a.bias] ?? "var(--muted-foreground)" }} />
            <span className="font-semibold truncate flex-1">{a.title || a.instrument}</span>
            <span className="text-muted-foreground shrink-0 tabular-nums">{format(new Date(a.date + "T12:00:00"), "MMM d")}</span>
          </div>
          {options.details && (
            <p className="text-[10px] text-muted-foreground/70 pl-[14px] mt-0.5 truncate capitalize">
              {a.instrument} · {a.bias}{a.session ? ` · ${a.session}` : ""}
            </p>
          )}
        </Link>
      ))}
    </div>
  );
}

// ── Market Intelligence (live regime snapshot) ───────────────────────
function MarketIntelWidget() {
  const o = NEWS_CITY_DATA.overview;
  const sent = SENTIMENT_META[o.sentiment];
  const risk = RISK_META[o.riskLevel];
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2">
        <Radar className="w-4 h-4 text-primary" />
        <span className={cn("text-xs font-bold rounded-md border px-1.5 py-0.5", sent.className)}>{sent.label}</span>
        <span className={cn("text-xs font-bold rounded-md border px-1.5 py-0.5", risk.className)}>Risk {risk.label}</span>
      </div>
      <p className="mt-2.5 text-sm font-semibold text-foreground leading-snug">{o.latestEvent}</p>
      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
        <span className="font-medium text-foreground/70">Driver:</span> {o.mainDriver}
      </p>
      <p className="mt-auto pt-2 text-[11px] text-muted-foreground/70">Volatility {o.volatility}</p>
    </div>
  );
}

// ── Discipline ────────────────────────────────────────────────────────
function DisciplineWidget({ options }: { options: WidgetOptions }) {
  const [breakdown, setBreakdown] = useState<ReturnType<typeof computeDiscipline> | undefined>(undefined);
  useEffect(() => {
    Promise.all([getTrades(), getHabits(), getHabitCompletions()]).then(([t, h, c]) => {
      const scope = options.scope ?? "week";
      const now = new Date();
      // "All-time" begins at your earliest real data point (first habit created
      // or first trade), never an arbitrary epoch — otherwise the expected
      // count balloons across empty decades (e.g. "14/29070").
      const allStart = () => {
        const times = [
          ...h.map((hb) => new Date(hb.created_at).getTime()),
          ...t.map((tr) => new Date(tr.date_time.slice(0, 10) + "T00:00:00").getTime()),
        ].filter((n) => Number.isFinite(n));
        return times.length ? new Date(Math.min(...times)) : now;
      };
      const start = scope === "all" ? allStart() : scope === "week" ? startOfWeek(now, { weekStartsOn: 1 }) : startOfMonth(now);
      const end = scope === "all" ? now : scope === "week" ? endOfWeek(now, { weekStartsOn: 1 }) : endOfMonth(now);
      setBreakdown(computeDiscipline(t, h, c, start, end));
    });
  }, [options.scope]);
  if (breakdown === undefined) return <Loading />;
  const score = breakdown.total;
  const color = score === null ? "var(--muted-foreground)" : scoreColor(score);
  const { tradeRules, habits, tradeCount, habitCompleted, habitExpected } = breakdown;
  const scopeWord = SCOPE_LABEL[options.scope ?? "week"].toLowerCase();

  // Plain-language read of where the score comes from.
  const label = score === null ? "No data yet" : score >= 80 ? "Locked in" : score >= 60 ? "Holding the line" : "Slipping — tighten up";

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-baseline gap-2">
        <p className="text-3xl font-black tabular-nums" style={{ color }}>{score === null ? "—" : `${score}%`}</p>
        <p className="text-xs font-semibold" style={{ color }}>{label}</p>
      </div>
      <p className="text-xs text-muted-foreground mt-0.5">Discipline · {scopeWord}</p>

      {/* Contribution breakdown — how much each side is pulling the score */}
      <div className="mt-3 space-y-2.5">
        <ContributionRow
          label="Trading rules"
          weight="70%"
          score={tradeRules}
          detail={tradeRules === null ? "no scored trades" : `across ${tradeCount} scored trade${tradeCount !== 1 ? "s" : ""}`}
          color="oklch(0.72 0.14 220)"
        />
        <ContributionRow
          label="Habits"
          weight="30%"
          score={habits}
          detail={habitExpected === 0 ? "no habits due" : `${habitCompleted}/${habitExpected} check-ins done`}
          color="oklch(0.70 0.12 183)"
        />
      </div>

      {options.details && (
        <p className="mt-3 pt-2.5 border-t border-border/50 text-[11px] leading-relaxed text-muted-foreground">
          Your discipline score blends how well you followed your <span className="text-foreground/80 font-medium">trading rules at the screen</span> (weighted 70%) with your <span className="text-foreground/80 font-medium">habit consistency away from the charts</span> (30%). Trade rules dominate on purpose — habits should nudge the score, never overpower the actual process.
        </p>
      )}
    </div>
  );
}

/** One line of the discipline breakdown: label, weight, a mini bar, and the raw
 *  numbers behind it so the score never feels like a black box. */
function ContributionRow({
  label, weight, score, detail, color,
}: {
  label: string;
  weight: string;
  score: number | null;
  detail: string;
  color: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="font-medium text-foreground/85">{label}</span>
          <span className="text-[10px] font-semibold text-muted-foreground/60 tabular-nums">{weight}</span>
        </span>
        <span className="font-bold tabular-nums" style={{ color: score === null ? "var(--muted-foreground)" : color }}>
          {score === null ? "—" : `${score}%`}
        </span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-border/60">
        <div className="h-full rounded-full transition-all" style={{ width: `${score ?? 0}%`, background: color }} />
      </div>
      <p className="mt-1 text-[10px] text-muted-foreground/70">{detail}</p>
    </div>
  );
}

// ── Habits streak — with an inline checklist so today's habits can be ─
// ── checked off without leaving Home. ──────────────────────────────────
function HabitsStreakWidget({ options }: { options: WidgetOptions }) {
  const [habits, setHabits] = useState<Habit[] | null>(null);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [streaks, setStreaks] = useState<Record<string, number>>({});
  const [pending, setPending] = useState<string | null>(null);

  const refresh = async () => {
    const [h, c] = await Promise.all([getHabits(), getHabitCompletions()]);
    setHabits(h);
    setCompletions(c);
    const entries = await Promise.all(h.map(async (habit) => [habit.id, await getHabitStreak(habit.id)] as const));
    setStreaks(Object.fromEntries(entries));
  };

  useEffect(() => { refresh(); }, []);

  async function handleToggle(habitId: string) {
    setPending(habitId);
    await toggleHabitCompletion(habitId, TODAY);
    const c = await getHabitCompletions();
    setCompletions(c);
    setPending(null);
  }

  if (!habits) return <Loading />;

  const doneToday = new Set(completions.filter((c) => c.date === TODAY && c.completed).map((c) => c.habit_id));
  const longestStreak = Object.values(streaks).reduce((m, s) => Math.max(m, s), 0);
  const visible = habits.slice(0, listCap(options, habits.length, 2));

  return (
    <div className="flex flex-col h-full">
      <div className="mb-3">
        <p className="text-2xl font-black tabular-nums leading-none text-primary">{longestStreak}d</p>
        <p className="text-xs text-muted-foreground mt-0.5">{doneToday.size}/{habits.length} done today</p>
      </div>

      {habits.length === 0 ? (
        <p className="text-xs text-muted-foreground">No habits yet. Add some in Habits.</p>
      ) : (
        <div className="space-y-1 overflow-y-auto">
          {visible.map((habit) => {
            const done = doneToday.has(habit.id);
            return (
              <button
                key={habit.id}
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleToggle(habit.id); }}
                disabled={pending === habit.id}
                className={cn(
                  "w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors",
                  done ? "bg-success/8" : "hover:bg-muted/50"
                )}
              >
                {done ? (
                  <Check className="w-3.5 h-3.5 shrink-0" style={{ color: habit.color }} />
                ) : (
                  <Circle className="w-3.5 h-3.5 shrink-0 text-muted-foreground/40" />
                )}
                <span className={cn("text-xs truncate flex-1", done ? "text-foreground" : "text-muted-foreground")}>
                  {habit.name}
                </span>
                {options.details && (streaks[habit.id] ?? 0) > 0 && (
                  <span className="text-[10px] font-bold tabular-nums shrink-0 text-muted-foreground/70">
                    {streaks[habit.id]}d
                  </span>
                )}
              </button>
            );
          })}
          {visible.length < habits.length && (
            <p className="text-[11px] text-muted-foreground/60 pl-2 pt-0.5">+{habits.length - visible.length} more, resize to see all</p>
          )}
        </div>
      )}
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
    <div className="space-y-1 overflow-y-auto">
      {shown.map((t) => {
        const color = t.result === "win" ? "oklch(0.58 0.17 145)" : t.result === "loss" ? "oklch(0.58 0.22 25)" : "oklch(0.70 0.16 72)";
        return (
          <Link
            key={t.id}
            href={`/journal/${t.id}`}
            className="block rounded-lg px-1.5 py-1 -mx-1.5 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2 text-xs">
              <ResultDot t={t} />
              <span className="font-semibold">{t.instrument}</span>
              <span className="text-muted-foreground truncate flex-1">{format(new Date(t.date_time.slice(0, 10) + "T12:00:00"), "MMM d")}</span>
              <span className="font-bold tabular-nums shrink-0" style={{ color }}>
                {t.result === "win" ? `+${t.rr}R` : t.result === "loss" ? "-1R" : "0R"}
              </span>
            </div>
            {options.details && (
              <p className="text-[10px] text-muted-foreground/70 pl-[22px] mt-0.5 truncate">
                {t.session} session{t.timeframe ? ` · ${t.timeframe}` : ""}{t.confluences.length ? ` · ${t.confluences.join(", ")}` : ""}
              </p>
            )}
          </Link>
        );
      })}
    </div>
  );
}

// ── Active accounts — lists individual accounts once there's room ────
function ActiveAccountsWidget({ options }: { options: WidgetOptions }) {
  const { hidden } = usePrivacy();
  const [accounts, setAccounts] = useState<import("@/lib/types").FundedAccount[] | null>(null);
  useEffect(() => { getAccounts().then(setAccounts); }, []);
  if (!accounts) return <Loading />;

  const active = accounts.filter((a) => a.status === "active");
  const capital = active.reduce((s, a) => s + a.current_balance, 0);

  if ((options.size === "small" && !options.details) || active.length === 0) {
    return (
      <div className="min-w-0">
        <p className="text-2xl font-black tabular-nums truncate" style={{ color: "oklch(0.58 0.17 145)" }}>
          {capital > 0 ? mask(`$${capital.toLocaleString()}`, hidden) : "—"}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{active.length} active account{active.length !== 1 ? "s" : ""}</p>
      </div>
    );
  }

  const visible = active.slice(0, listCap(options, active.length, 3));
  return (
    <div className="flex flex-col h-full">
      <p className="text-xl font-black tabular-nums mb-2" style={{ color: "oklch(0.58 0.17 145)" }}>
        {capital > 0 ? mask(`$${capital.toLocaleString()}`, hidden) : "—"}
      </p>
      <div className="space-y-1 overflow-y-auto">
        {visible.map((a) => (
          <Link
            key={a.id}
            href={`/accounts/${a.id}`}
            className="block rounded-lg px-1.5 py-1 -mx-1.5 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="truncate">{a.account_name || a.firm_name}</span>
              <span className="font-bold tabular-nums shrink-0" style={{ color: "oklch(0.58 0.17 145)" }}>
                {mask(`$${a.current_balance.toLocaleString()}`, hidden)}
              </span>
            </div>
            {options.details && (
              <p className="text-[10px] text-muted-foreground/70 mt-0.5 truncate capitalize">
                {a.phase} · {mask(`${a.drawdown_used.toLocaleString()} drawdown used`, hidden)}
              </p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

// ── Trading rules ─────────────────────────────────────────────────────
function TradingRulesWidget({ options }: { options: WidgetOptions }) {
  const [rules, setRules] = useState<string[] | null>(null);
  useEffect(() => {
    getProfile().then((p) => {
      setRules(p?.discipline_rules ? p.discipline_rules.split("\n").map((l) => l.trim()).filter(Boolean) : []);
    });
  }, []);
  if (!rules) return <Loading />;
  if (rules.length === 0)
    return <p className="text-xs text-muted-foreground">No rules yet. Add them in Trading Behaviour.</p>;
  const visible = rules.slice(0, listCap(options, rules.length, 2));
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <ScrollText className="w-4 h-4" style={{ color: "oklch(0.72 0.14 220)" }} />
        <span className="text-2xl font-black tabular-nums">{rules.length}</span>
        <span className="text-xs text-muted-foreground">rules</span>
      </div>
      <ul className="space-y-1 overflow-y-auto">
        {visible.map((r, i) => (
          <li
            key={i}
            className={cn("flex gap-1.5 text-xs text-muted-foreground", !options.details && "truncate")}
          >
            <span className="text-primary/60">·</span>
            <span className={cn("min-w-0", options.details ? "leading-relaxed" : "truncate")}>{r}</span>
          </li>
        ))}
        {visible.length < rules.length && (
          <li className="text-[11px] text-muted-foreground/60 pt-0.5">+{rules.length - visible.length} more</li>
        )}
      </ul>
    </div>
  );
}

// ── Journal calendar — a month at a glance, opens the full journal ────
function JournalCalendarWidget() {
  const [trades, setTrades] = useState<TradeJournalEntry[] | null>(null);
  const [cursor, setCursor] = useState(new Date());
  useEffect(() => { getTrades().then(setTrades); }, []);
  if (!trades) return <Loading />;

  // Net R per day → dot colour.
  const dayR = new Map<string, number>();
  for (const t of trades) {
    const k = t.date_time.slice(0, 10);
    dayR.set(k, (dayR.get(k) ?? 0) + tradeR(t));
  }
  const dotColor = (r: number) =>
    r > 0 ? "oklch(0.58 0.17 145)" : r < 0 ? "oklch(0.58 0.22 25)" : "oklch(0.70 0.16 72)";

  const monthStart = startOfMonth(cursor);
  const days = eachDayOfInterval({ start: monthStart, end: endOfMonth(cursor) });
  const pad = (getDay(monthStart) + 6) % 7; // Monday-first

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1">
          <button type="button" onClick={(e) => { e.preventDefault(); setCursor(subMonths(cursor, 1)); }}
            className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-sm font-semibold tabular-nums w-24 text-center">{format(cursor, "MMM yyyy")}</span>
          <button type="button" onClick={(e) => { e.preventDefault(); setCursor(addMonths(cursor, 1)); }}
            className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <Link href="/journal" title="Open full journal"
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline">
          <Maximize2 className="w-3 h-3" /> Open
        </Link>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <span key={i} className="text-[9px] font-semibold uppercase text-muted-foreground/50">{d}</span>
        ))}
        {Array.from({ length: pad }).map((_, i) => <span key={`p${i}`} />)}
        {days.map((d) => {
          const k = format(d, "yyyy-MM-dd");
          const r = dayR.get(k);
          const has = r !== undefined;
          const today = isToday(d);
          return (
            <Link
              key={k}
              href="/journal"
              className={cn(
                "relative aspect-square rounded-md flex flex-col items-center justify-center text-[11px] tabular-nums transition-colors",
                today ? "font-bold text-primary" : "text-foreground/70",
                has ? "hover:bg-muted/60" : "hover:bg-muted/40"
              )}
              style={has ? { background: `${dotColor(r!)}1a` } : undefined}
            >
              {format(d, "d")}
              {has && <span className="absolute bottom-1 h-1 w-1 rounded-full" style={{ background: dotColor(r!) }} />}
            </Link>
          );
        })}
      </div>

      <div className="mt-auto pt-2 flex items-center gap-3 text-[10px] text-muted-foreground/70">
        <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full" style={{ background: "oklch(0.58 0.17 145)" }} /> Win</span>
        <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full" style={{ background: "oklch(0.58 0.22 25)" }} /> Loss</span>
        <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full" style={{ background: "oklch(0.70 0.16 72)" }} /> B/E</span>
      </div>
    </div>
  );
}

const COMPONENTS: Record<WidgetId, React.ComponentType<{ options: WidgetOptions }>> = {
  "journal-calendar": JournalCalendarWidget,
  "weekly-r": WeeklyRWidget,
  "win-rate": WinRateWidget,
  "avg-rr": AvgRRWidget,
  execution: ExecutionWidget,
  discipline: DisciplineWidget,
  "habits-streak": HabitsStreakWidget,
  "recent-trades": RecentTradesWidget,
  "active-accounts": ActiveAccountsWidget,
  "trading-rules": TradingRulesWidget,
  "premarket-analysis": PreMarketAnalysisWidget,
  "market-intel": MarketIntelWidget,
};

/** Renders a single widget by id inside the shared shell. */
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
