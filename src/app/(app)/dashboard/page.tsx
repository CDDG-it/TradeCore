"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import {
  format, startOfWeek, endOfWeek, eachDayOfInterval, isToday, isSameDay,
  startOfMonth, endOfMonth, isWithinInterval,
} from "date-fns";
import { motion } from "motion/react";
import { Loader2 } from "lucide-react";
import { PageWrapper } from "@/components/ui/page-wrapper";
import {
  getTrades, getAccounts, getHabits, getHabitCompletions, getProfile,
} from "@/lib/supabase/queries";
import { computeDiscipline } from "@/lib/discipline";
import { tradeR } from "@/lib/journal/weeks";
import { usePrivacy, mask } from "@/lib/use-privacy";
import { cn } from "@/lib/utils";
import type { TradeJournalEntry, FundedAccount, Habit, HabitCompletion } from "@/lib/types";

const TURQUOISE = "oklch(0.70 0.13 183)";
const CYAN = "oklch(0.72 0.14 220)";
const GREEN = "oklch(0.58 0.17 145)";
const RED = "oklch(0.58 0.22 25)";
const AMBER = "oklch(0.70 0.16 72)";
const VIOLET = "oklch(0.68 0.14 290)";
const TODAY = format(new Date(), "yyyy-MM-dd");

function scoreColor(pct: number) {
  return pct >= 80 ? TURQUOISE : pct >= 60 ? AMBER : RED;
}

/** Alpha-blend a colour toward transparent — works for oklch() strings, unlike
 *  the 8-digit-hex suffix trick which is hex-only. `pct` is 0–100. */
const alpha = (c: string, pct: number) => `color-mix(in oklch, ${c} ${pct}%, transparent)`;

const CARD_BASE =
  "relative rounded-2xl border border-border/60 bg-card p-4 overflow-hidden " +
  "shadow-[0_4px_20px_-10px_rgba(0,0,0,0.25)]";

/** Shared aesthetic layer: a soft accent glow from the top-left + a top hairline. */
function CardFx({ accent }: { accent: string }) {
  return (
    <>
      <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(115% 85% at 0% 0%, ${alpha(accent, 9)}, transparent 55%)` }} />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${alpha(accent, 55)}, transparent)` }} />
    </>
  );
}

export default function DashboardPage() {
  const { hidden, toggle } = usePrivacy();
  const [greeting, setGreeting] = useState("");
  const [firstName, setFirstName] = useState<string | null>(null);

  const [trades, setTrades] = useState<TradeJournalEntry[] | null>(null);
  const [accounts, setAccounts] = useState<FundedAccount[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");
    Promise.all([getTrades(), getAccounts(), getHabits(), getHabitCompletions(), getProfile()])
      .then(([t, a, hb, c, p]) => {
        setTrades(t); setAccounts(a); setHabits(hb); setCompletions(c);
        if (p?.full_name) setFirstName(p.full_name.split(" ")[0]);
      });
  }, []);

  const now = new Date();

  const activeAccounts = accounts.filter((a) => a.status === "active");
  const activeCapital = activeAccounts.reduce((s, a) => s + a.current_balance, 0);

  const monthTrades = useMemo(() => {
    if (!trades) return [];
    return trades.filter((t) =>
      isWithinInterval(new Date(t.date_time.slice(0, 10) + "T12:00:00"), { start: startOfMonth(now), end: endOfMonth(now) })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trades]);

  const wins = monthTrades.filter((t) => t.result === "win").length;
  const losses = monthTrades.filter((t) => t.result === "loss").length;
  const be = monthTrades.length - wins - losses;
  const winRate = monthTrades.length ? Math.round((wins / monthTrades.length) * 100) : null;

  const mcMindScore = useMemo(() => {
    if (!trades) return null;
    return computeDiscipline(trades, habits, completions, startOfMonth(now), endOfMonth(now)).total;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trades, habits, completions]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(now, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end: endOfWeek(now, { weekStartsOn: 1 }) }).map((d) => {
      const dayTrades = (trades ?? []).filter((t) => isSameDay(new Date(t.date_time.slice(0, 10) + "T12:00:00"), d));
      return { date: d, trades: dayTrades, r: dayTrades.reduce((s, t) => s + tradeR(t), 0) };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trades]);

  const doneTodayCount = completions.filter((c) => c.date === TODAY && c.completed).length;
  const loading = trades === null;

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-wrap items-end justify-between gap-3"
      >
        <div>
          <p className="font-body text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-1">
            {format(now, "EEEE, MMMM d")}
          </p>
          <h1 className="font-heading font-black text-2xl md:text-3xl text-foreground tracking-tight leading-[0.95]">
            {greeting ? `${greeting}${firstName ? `, ${firstName}` : ""}` : "Dashboard"}
          </h1>
        </div>
        <Link href="/journal/new"
          className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all hover:-translate-y-px"
          style={{ background: "#14B8A6", boxShadow: "0 2px 14px rgba(20,184,166,0.30)" }}>
          Log Trade
        </Link>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <PageWrapper className="space-y-3">
          {/* Row 1 — three hero widgets */}
          <div className="grid gap-3 md:grid-cols-3">
            <MindScoreOrb score={mcMindScore} />
            <WinRateCard winRate={winRate} wins={wins} losses={losses} be={be} total={monthTrades.length} />
            <PricesWidget />
          </div>

          {/* Row 2 — journal week + (compact capital, habits shortcut) */}
          <div className="grid gap-3 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <WeekStrip days={weekDays} />
            </div>
            <div className="grid grid-rows-2 gap-3">
              <ActiveCapitalCard capital={activeCapital} count={activeAccounts.length} hidden={hidden} onToggle={toggle} />
              <HabitsShortcut done={doneTodayCount} total={habits.length} />
            </div>
          </div>
        </PageWrapper>
      )}
    </div>
  );
}

/* ── MC mind score — creative liquid-fill orb ─────────────────────────── */
function MindScoreOrb({ score }: { score: number | null }) {
  const target = score ?? 0;
  const [fill, setFill] = useState(0);
  const [display, setDisplay] = useState(0);
  const raf = useRef(0);

  useEffect(() => {
    cancelAnimationFrame(raf.current);
    const start = performance.now();
    const dur = 1400;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      setFill(e * target);
      setDisplay(Math.round(e * target));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target]);

  const color = score === null ? "var(--muted-foreground)" : scoreColor(target);
  const label = score === null ? "No data yet" : target >= 80 ? "Locked in" : target >= 60 ? "Holding the line" : "Slipping";
  const glow = score === null ? 0 : 5 + (target / 100) * 22;
  const SIZE = 84;

  return (
    <div className={cn(CARD_BASE, "flex flex-col items-center")}>
      <CardFx accent={color} />
      <p className="self-start text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">MC mind score</p>

      <div className="relative my-1.5 rounded-full overflow-hidden shrink-0"
        style={{ width: SIZE, height: SIZE, border: `2px solid ${alpha(color, 40)}`, boxShadow: `0 0 ${glow}px ${alpha(color, 40)}` }}>
        <div className="absolute inset-x-0 bottom-0" style={{ height: `${fill}%` }}>
          <div className="absolute -top-2 left-0 h-3 w-[200%]" style={{ animation: "mc-wave 2.6s linear infinite" }}>
            <svg viewBox="0 0 200 20" preserveAspectRatio="none" className="h-full w-full">
              <path d="M0 12 Q 25 2 50 12 T 100 12 T 150 12 T 200 12 V20 H0 Z" fill={color} opacity="0.9" />
            </svg>
          </div>
          <div className="absolute inset-x-0 top-1 bottom-0" style={{ background: color, opacity: 0.9 }} />
          <div className="absolute -top-1.5 left-0 h-3 w-[200%]" style={{ animation: "mc-wave 4s linear infinite reverse" }}>
            <svg viewBox="0 0 200 20" preserveAspectRatio="none" className="h-full w-full">
              <path d="M0 12 Q 25 4 50 12 T 100 12 T 150 12 T 200 12 V20 H0 Z" fill={color} opacity="0.5" />
            </svg>
          </div>
        </div>
        <div className="absolute inset-0 rounded-full pointer-events-none" style={{ boxShadow: "inset 0 2px 8px rgba(255,255,255,0.16)" }} />
      </div>

      <p className="text-2xl font-black tabular-nums leading-none" style={{ color }}>{score === null ? "—" : `${display}%`}</p>
      <p className="text-[11px] font-semibold mt-1" style={{ color }}>{label}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">rules + habits · this month</p>
    </div>
  );
}

/* ── Win rate — proportion bar + breakdown + link to Analytics ────────── */
function WinRateCard({ winRate, wins, losses, be, total }: {
  winRate: number | null; wins: number; losses: number; be: number; total: number;
}) {
  const seg = (n: number) => (total ? (n / total) * 100 : 0);
  return (
    <div className={cn(CARD_BASE, "flex flex-col")}>
      <CardFx accent={CYAN} />
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Win rate</p>

      <div className="flex items-baseline gap-1.5 mt-1.5">
        <span className="text-4xl font-black tabular-nums leading-none" style={{ color: CYAN }}>
          {winRate === null ? "—" : `${winRate}%`}
        </span>
        <span className="text-[11px] text-muted-foreground">this month</span>
      </div>

      <div className="mt-3.5 flex h-2 w-full overflow-hidden rounded-full bg-border/60">
        <div className="h-full" style={{ width: `${seg(wins)}%`, background: GREEN }} />
        <div className="h-full" style={{ width: `${seg(be)}%`, background: AMBER }} />
        <div className="h-full" style={{ width: `${seg(losses)}%`, background: RED }} />
      </div>
      <div className="mt-2 flex items-center gap-3 text-[11px] tabular-nums font-semibold">
        <span style={{ color: GREEN }}>{wins}W</span>
        <span style={{ color: RED }}>{losses}L</span>
        <span style={{ color: AMBER }}>{be}BE</span>
        <span className="text-muted-foreground/70 ml-auto font-normal">{total} trades</span>
      </div>

      <Link href="/analytics" className="mt-auto pt-3 text-[11px] font-semibold text-primary hover:underline">
        View full analytics →
      </Link>
    </div>
  );
}

/* ── Active capital — compact + link to Accounts ──────────────────────── */
function ActiveCapitalCard({ capital, count, hidden, onToggle }: {
  capital: number; count: number; hidden: boolean; onToggle: () => void;
}) {
  return (
    <div className={cn(CARD_BASE, "flex flex-col justify-center py-3")}>
      <CardFx accent={TURQUOISE} />
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Active capital</p>
        <button type="button" onClick={onToggle} aria-pressed={hidden}
          className="text-[10px] font-semibold text-muted-foreground hover:text-foreground transition-colors">
          {hidden ? "Show" : "Hide"}
        </button>
      </div>
      <p className="text-xl font-black tabular-nums leading-none mt-1.5" style={{ color: TURQUOISE }}>
        {capital > 0 ? mask(`$${capital.toLocaleString()}`, hidden) : "—"}
      </p>
      <div className="mt-1.5 flex items-center justify-between">
        <p className="text-[11px] text-muted-foreground">{count} active account{count !== 1 ? "s" : ""}</p>
        <Link href="/accounts" className="text-[11px] font-semibold text-primary hover:underline">View →</Link>
      </div>
    </div>
  );
}

/* ── Habits — shortcut to the Habits page ─────────────────────────────── */
function HabitsShortcut({ done, total }: { done: number; total: number }) {
  return (
    <Link href="/habits" className={cn(CARD_BASE, "group flex flex-col justify-center py-3 transition-[transform,border-color] hover:-translate-y-0.5 hover:border-border")}>
      <CardFx accent={VIOLET} />
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Habits</p>
        <span className="text-[11px] font-semibold tabular-nums" style={{ color: VIOLET }}>{done}/{total}</span>
      </div>
      <p className="text-sm font-semibold text-foreground mt-1.5">
        {total === 0 ? "Set up your routine" : `${done} of ${total} done today`}
      </p>
      <span className="mt-1.5 inline-block text-[11px] font-semibold text-primary group-hover:underline">
        Open habits →
      </span>
    </Link>
  );
}

/* ── Live prices — interactive sparkline widget ───────────────────────── */
type PriceQuote = { symbol: string; label: string; price: number; change: number; changePct: number; spark: number[] };

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (!data || data.length < 2) return <div className="h-9" />;
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const w = 100, h = 34;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${(h - 2) - ((v - min) / range) * (h - 4)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-9">
      <polygon points={`${pts} ${w},${h} 0,${h}`} fill={color} opacity="0.12" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
}

function PricesWidget() {
  const [prices, setPrices] = useState<PriceQuote[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [active, setActive] = useState("ES");

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const res = await fetch("/api/prices");
        const json = await res.json();
        if (!alive) return;
        if (json.prices?.length) { setPrices(json.prices); setFailed(false); }
        else setFailed(true);
      } catch { if (alive) setFailed(true); }
    }
    load();
    const id = setInterval(load, 30_000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  const symbols = ["ES", "NQ", "GOLD"];
  const sel = prices?.find((p) => p.symbol === active) ?? null;
  const up = (sel?.change ?? 0) >= 0;
  const c = up ? GREEN : RED;

  return (
    <div className={cn(CARD_BASE, "flex flex-col")}>
      <CardFx accent={CYAN} />
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Live prices</p>
        <span className="flex items-center gap-1 text-[10px] text-muted-foreground/70">
          <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: prices ? GREEN : "var(--muted-foreground)" }} />
          {prices ? "live" : failed ? "off" : "…"}
        </span>
      </div>

      <div className="mt-2 flex gap-1 rounded-lg bg-muted/50 p-0.5">
        {symbols.map((s) => (
          <button key={s} type="button" onClick={() => setActive(s)}
            className={cn("flex-1 rounded-md px-1 py-1 text-[11px] font-bold transition-colors",
              active === s ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
            {s}
          </button>
        ))}
      </div>

      <div className="mt-2">
        {sel ? <Sparkline data={sel.spark} color={c} /> : <div className="h-9 flex items-center text-[11px] text-muted-foreground/50">{failed ? "unavailable" : "loading…"}</div>}
      </div>

      <div className="flex items-baseline justify-between">
        <span className="text-lg font-black tabular-nums" style={{ color: sel ? "var(--foreground)" : "var(--muted-foreground)" }}>
          {sel ? sel.price.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"}
        </span>
        {sel && (
          <span className="text-[11px] font-bold tabular-nums" style={{ color: c }}>
            {up ? "+" : ""}{sel.changePct.toFixed(2)}%
          </span>
        )}
      </div>

      <Link href="/analysis" className="mt-auto pt-2 text-[11px] font-semibold text-primary hover:underline">
        Add analysis →
      </Link>
    </div>
  );
}

/* ── Journal — this week ──────────────────────────────────────────────── */
function WeekStrip({ days }: { days: { date: Date; trades: TradeJournalEntry[]; r: number }[] }) {
  return (
    <div className={cn(CARD_BASE, "h-full flex flex-col")}>
      <CardFx accent={TURQUOISE} />
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold">This week</p>
          <span className="text-[11px] text-muted-foreground/70 tabular-nums">
            {format(days[0].date, "MMM d")} – {format(days[6].date, "MMM d")}
          </span>
        </div>
        <Link href="/journal" className="text-[11px] font-semibold text-primary hover:underline">Open journal →</Link>
      </div>

      <div className="grid grid-cols-7 gap-2 flex-1">
        {days.map(({ date, trades: dt, r }) => {
          const has = dt.length > 0;
          const color = r > 0 ? GREEN : r < 0 ? RED : AMBER;
          const today = isToday(date);
          return (
            <Link key={date.toISOString()} href="/journal"
              className={cn("group flex flex-col items-center justify-center rounded-xl border px-1 py-3 transition-all hover:-translate-y-0.5",
                today ? "border-primary/50" : "border-border/60 hover:border-border")}
              style={has ? { background: alpha(color, 9) } : undefined}>
              <span className={cn("text-[10px] font-semibold uppercase tracking-wide", today ? "text-primary" : "text-muted-foreground/60")}>{format(date, "EEE")}</span>
              <span className={cn("text-base font-bold tabular-nums mt-0.5", today ? "text-primary" : "text-foreground/85")}>{format(date, "d")}</span>
              {has ? (
                <span className="mt-1.5 text-[11px] font-bold tabular-nums" style={{ color }}>{r > 0 ? "+" : ""}{r.toFixed(1)}R</span>
              ) : (
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-border" />
              )}
            </Link>
          );
        })}
      </div>

      <div className="mt-3 pt-3 border-t border-border/40 flex items-center gap-4 text-[10px] text-muted-foreground/70">
        <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full" style={{ background: GREEN }} /> Win</span>
        <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full" style={{ background: RED }} /> Loss</span>
        <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full" style={{ background: AMBER }} /> B/E</span>
      </div>
    </div>
  );
}
