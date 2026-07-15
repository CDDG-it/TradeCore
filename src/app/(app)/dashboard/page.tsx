"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday,
  addMonths, subMonths, isWithinInterval,
} from "date-fns";
import { motion } from "motion/react";
import { Loader2 } from "lucide-react";
import { PageWrapper } from "@/components/ui/page-wrapper";
import {
  getTrades, getAccounts, getHabits, getHabitCompletions, getProfile, toggleHabitCompletion,
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
const TODAY = format(new Date(), "yyyy-MM-dd");

function scoreColor(pct: number) {
  return pct >= 80 ? TURQUOISE : pct >= 60 ? AMBER : RED;
}

const SHORTCUTS: { href: string; title: string; desc: string; accent: string }[] = [
  { href: "/journal", title: "Journal", desc: "Log & review trades", accent: TURQUOISE },
  { href: "/analysis", title: "Analysis", desc: "Pre-trade plans", accent: CYAN },
  { href: "/analytics", title: "Analytics", desc: "Edge & performance", accent: GREEN },
  { href: "/accounts", title: "Accounts", desc: "Balances & risk", accent: "oklch(0.71 0.13 200)" },
];

export default function DashboardPage() {
  const { hidden, toggle } = usePrivacy();
  const [greeting, setGreeting] = useState("");
  const [firstName, setFirstName] = useState<string | null>(null);

  const [trades, setTrades] = useState<TradeJournalEntry[] | null>(null);
  const [accounts, setAccounts] = useState<FundedAccount[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [pendingHabit, setPendingHabit] = useState<string | null>(null);

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening");
    Promise.all([getTrades(), getAccounts(), getHabits(), getHabitCompletions(), getProfile()])
      .then(([t, a, hb, c, p]) => {
        setTrades(t);
        setAccounts(a);
        setHabits(hb);
        setCompletions(c);
        if (p?.full_name) setFirstName(p.full_name.split(" ")[0]);
      });
  }, []);

  async function handleToggleHabit(habitId: string) {
    setPendingHabit(habitId);
    await toggleHabitCompletion(habitId, TODAY);
    setCompletions(await getHabitCompletions());
    setPendingHabit(null);
  }

  const now = new Date();

  const activeCapital = useMemo(
    () => accounts.filter((a) => a.status === "active").reduce((s, a) => s + a.current_balance, 0),
    [accounts]
  );
  const activeCount = accounts.filter((a) => a.status === "active").length;

  const monthTrades = useMemo(() => {
    if (!trades) return [];
    return trades.filter((t) =>
      isWithinInterval(new Date(t.date_time.slice(0, 10) + "T12:00:00"), { start: startOfMonth(now), end: endOfMonth(now) })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trades]);

  const wins = monthTrades.filter((t) => t.result === "win").length;
  const winRate = monthTrades.length ? Math.round((wins / monthTrades.length) * 100) : null;

  // MC mind score — trading rules (70%) blended with habit consistency (30%), this month.
  const mcMindScore = useMemo(() => {
    if (!trades) return null;
    return computeDiscipline(trades, habits, completions, startOfMonth(now), endOfMonth(now)).total;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trades, habits, completions]);

  const doneToday = new Set(completions.filter((c) => c.date === TODAY && c.completed).map((c) => c.habit_id));
  const loading = trades === null;

  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-wrap items-end justify-between gap-3"
      >
        <div>
          <p className="font-body text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-1.5">
            {format(now, "EEEE, MMMM d")}
          </p>
          <h1 className="font-heading font-black text-2xl md:text-3xl text-foreground tracking-tight leading-[0.95]">
            {greeting ? `${greeting}${firstName ? `, ${firstName}` : ""}` : "Dashboard"}
          </h1>
        </div>
        <Link
          href="/journal/new"
          className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all hover:-translate-y-px"
          style={{ background: "#14B8A6", boxShadow: "0 2px 14px rgba(20,184,166,0.30)" }}
        >
          Log Trade
        </Link>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <PageWrapper className="space-y-4">
          {/* Row 1 — mind score, live prices, capital + win rate */}
          <div className="grid gap-3 lg:grid-cols-3">
            <MindScoreGauge score={mcMindScore} />
            <PricesBox />
            <div className="grid grid-rows-2 gap-3">
              {/* Active capital */}
              <div className="relative rounded-2xl border border-border bg-card p-4 overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${TURQUOISE}66, transparent)` }} />
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Active capital</p>
                  <button type="button" onClick={toggle} aria-pressed={hidden}
                    className="text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors">
                    {hidden ? "Show" : "Hide"}
                  </button>
                </div>
                <p className="text-[22px] font-black tabular-nums leading-none mt-2" style={{ color: TURQUOISE }}>
                  {activeCapital > 0 ? mask(`$${activeCapital.toLocaleString()}`, hidden) : "—"}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1.5">{activeCount} active account{activeCount !== 1 ? "s" : ""}</p>
              </div>
              {/* Win rate */}
              <Link href="/analytics" className="relative rounded-2xl border border-border bg-card p-4 overflow-hidden block transition-all hover:-translate-y-0.5 hover:border-border/80">
                <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${CYAN}66, transparent)` }} />
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Win rate</p>
                <p className="text-[22px] font-black tabular-nums leading-none mt-2" style={{ color: CYAN }}>
                  {winRate === null ? "—" : `${winRate}%`}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  {monthTrades.length ? `${wins}W of ${monthTrades.length} · this month` : "no trades this month"}
                </p>
              </Link>
            </div>
          </div>

          {/* Row 2 — full journal calendar + today's habits */}
          <div className="grid gap-3 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <MonthCalendar trades={trades ?? []} />
            </div>

            {/* Today's habits */}
            <div className="rounded-2xl border border-border bg-card p-4 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold">Today&apos;s habits</p>
                <span className="text-[11px] font-semibold tabular-nums text-muted-foreground">{doneToday.size}/{habits.length}</span>
              </div>
              {habits.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
                  <p className="text-xs text-muted-foreground mb-2">No habits yet.</p>
                  <Link href="/habits" className="text-xs font-semibold text-primary hover:underline">Add habits</Link>
                </div>
              ) : (
                <div className="space-y-1 flex-1 overflow-y-auto max-h-[19rem] pr-0.5">
                  {habits.map((habit) => {
                    const done = doneToday.has(habit.id);
                    return (
                      <button key={habit.id} type="button" onClick={() => handleToggleHabit(habit.id)} disabled={pendingHabit === habit.id}
                        className={cn("w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors disabled:opacity-60",
                          done ? "bg-success/8" : "hover:bg-muted/50")}>
                        <span className="h-4 w-4 shrink-0 rounded-full border-2 transition-colors"
                          style={done ? { background: habit.color, borderColor: habit.color } : { borderColor: "var(--border)" }} />
                        <span className={cn("text-sm truncate flex-1", done ? "text-foreground" : "text-muted-foreground")}>{habit.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
              {habits.length > 0 && (
                <Link href="/habits" className="mt-3 pt-3 border-t border-border/40 text-[11px] font-semibold text-primary hover:underline">
                  Manage habits
                </Link>
              )}
            </div>
          </div>

          {/* Row 3 — aesthetic shortcuts to the rest of the platform */}
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            {SHORTCUTS.map((s) => (
              <Link key={s.href} href={s.href}
                className="group relative rounded-2xl border border-border bg-card p-4 overflow-hidden transition-all hover:-translate-y-0.5 hover:border-border/80">
                <div className="absolute -right-6 -top-6 h-16 w-16 rounded-full blur-2xl transition-opacity opacity-60 group-hover:opacity-100"
                  style={{ background: `radial-gradient(circle, ${s.accent}40, transparent 70%)` }} />
                <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${s.accent}80, transparent)` }} />
                <p className="text-base font-bold text-foreground leading-tight">{s.title}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{s.desc}</p>
                <span className="mt-3 inline-block text-[11px] font-semibold transition-colors" style={{ color: s.accent }}>
                  Open →
                </span>
              </Link>
            ))}
          </div>
        </PageWrapper>
      )}
    </div>
  );
}

/* ── MC mind score — animated radial gauge that intensifies with the score ── */
function MindScoreGauge({ score }: { score: number | null }) {
  const target = score ?? 0;
  const [display, setDisplay] = useState(0);
  const [progress, setProgress] = useState(0); // 0..1 of the arc actually drawn
  const rafRef = useRef<number>(0);

  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    const start = performance.now();
    const dur = 1200;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(target * eased));
      setProgress(eased * (target / 100));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target]);

  const color = score === null ? "var(--muted-foreground)" : scoreColor(target);
  const R = 54;
  const C = 2 * Math.PI * R;
  const offset = C * (1 - progress);
  const glow = score === null ? 0 : 3 + (target / 100) * 18; // stronger halo as the score climbs
  const label = score === null ? "No data yet" : target >= 80 ? "Locked in" : target >= 60 ? "Holding the line" : "Slipping — tighten up";

  return (
    <div className="relative rounded-2xl border border-border bg-card p-4 overflow-hidden flex flex-col">
      <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${color}66, transparent)` }} />
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">MC mind score</p>

      <div className="flex-1 flex items-center justify-center py-3">
        <div className="relative h-[150px] w-[150px] flex items-center justify-center">
          {/* Rotating shimmer — only kicks in at high scores, for the "prettier as it rises" feel */}
          {score !== null && target >= 80 && (
            <div
              className="absolute inset-1 rounded-full animate-[spin_6s_linear_infinite]"
              style={{
                background: `conic-gradient(from 0deg, transparent, ${color}66, transparent 45%)`,
                filter: "blur(7px)",
                opacity: 0.35 + (target - 80) / 100,
              }}
            />
          )}
          <svg width="150" height="150" viewBox="0 0 130 130" className="relative -rotate-90">
            <circle cx="65" cy="65" r={R} fill="none" stroke="var(--border)" strokeWidth="9" />
            <circle
              cx="65" cy="65" r={R} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round"
              strokeDasharray={C} strokeDashoffset={offset}
              style={{ filter: `drop-shadow(0 0 ${glow}px ${color})`, transition: "stroke 0.4s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[34px] font-black tabular-nums leading-none" style={{ color }}>
              {score === null ? "—" : `${display}%`}
            </span>
          </div>
        </div>
      </div>

      <p className="text-center text-xs font-semibold" style={{ color }}>{label}</p>
      <p className="text-center text-[10px] text-muted-foreground mt-0.5">rules + habits · this month</p>
    </div>
  );
}

/* ── Full journal month calendar ──────────────────────────────────────── */
function MonthCalendar({ trades }: { trades: TradeJournalEntry[] }) {
  const [cursor, setCursor] = useState(new Date());

  const dayR = useMemo(() => {
    const m = new Map<string, { r: number; n: number }>();
    for (const t of trades) {
      const k = t.date_time.slice(0, 10);
      const cur = m.get(k) ?? { r: 0, n: 0 };
      m.set(k, { r: cur.r + tradeR(t), n: cur.n + 1 });
    }
    return m;
  }, [trades]);

  const dotColor = (r: number) => (r > 0 ? GREEN : r < 0 ? RED : AMBER);
  const monthStart = startOfMonth(cursor);
  const days = eachDayOfInterval({ start: monthStart, end: endOfMonth(cursor) });
  const pad = (getDay(monthStart) + 6) % 7; // Monday-first

  return (
    <div className="rounded-2xl border border-border bg-card p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setCursor(subMonths(cursor, 1))} aria-label="Previous month"
            className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">‹</button>
          <span className="text-sm font-semibold tabular-nums w-28 text-center">{format(cursor, "MMMM yyyy")}</span>
          <button type="button" onClick={() => setCursor(addMonths(cursor, 1))} aria-label="Next month"
            className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">›</button>
        </div>
        <Link href="/journal" className="text-[11px] font-semibold text-primary hover:underline">Open journal</Link>
      </div>

      <div className="grid grid-cols-7 gap-1.5 text-center flex-1">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <span key={i} className="text-[10px] font-semibold uppercase text-muted-foreground/50 pb-1">{d}</span>
        ))}
        {Array.from({ length: pad }).map((_, i) => <span key={`p${i}`} />)}
        {days.map((d) => {
          const k = format(d, "yyyy-MM-dd");
          const hit = dayR.get(k);
          const has = hit !== undefined;
          const today = isToday(d);
          const color = has ? dotColor(hit!.r) : "transparent";
          return (
            <Link key={k} href="/journal"
              className={cn(
                "relative flex flex-col items-center justify-center rounded-lg border py-2 text-[12px] tabular-nums transition-all hover:-translate-y-0.5",
                today ? "border-primary/50" : "border-transparent hover:border-border/60",
                today ? "font-bold text-primary" : "text-foreground/70"
              )}
              style={has ? { background: `${color}1f` } : undefined}
            >
              <span>{format(d, "d")}</span>
              {has && (
                <span className="mt-0.5 text-[9px] font-bold" style={{ color }}>
                  {hit!.r > 0 ? "+" : ""}{hit!.r.toFixed(1)}R
                </span>
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

/* ── Live prices box (ES / NQ / GOLD) + Add analysis ──────────────────── */
type PriceQuote = { symbol: string; label: string; price: number; change: number; changePct: number };

function PricesBox() {
  const [prices, setPrices] = useState<PriceQuote[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const res = await fetch("/api/prices");
        const json = await res.json();
        if (!alive) return;
        if (json.prices?.length) setPrices(json.prices);
        else setFailed(true);
      } catch {
        if (alive) setFailed(true);
      }
    }
    load();
    const id = setInterval(load, 30_000); // refresh every 30s
    return () => { alive = false; clearInterval(id); };
  }, []);

  return (
    <div className="relative rounded-2xl border border-border bg-card p-4 overflow-hidden flex flex-col">
      <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${CYAN}66, transparent)` }} />
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Live prices</p>
        <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground/70">
          <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: prices ? GREEN : "var(--muted-foreground)" }} />
          {prices ? "live" : failed ? "—" : "…"}
        </span>
      </div>

      <div className="space-y-2 flex-1">
        {(prices ?? [{ symbol: "ES" }, { symbol: "NQ" }, { symbol: "GOLD" }] as PriceQuote[]).map((q) => {
          const up = (q.change ?? 0) >= 0;
          return (
            <div key={q.symbol} className="flex items-center justify-between">
              <span className="text-sm font-bold font-mono">{q.symbol}</span>
              {prices ? (
                <span className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold tabular-nums">{q.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  <span className="text-[11px] font-semibold tabular-nums w-14 text-right" style={{ color: up ? GREEN : RED }}>
                    {up ? "+" : ""}{q.changePct.toFixed(2)}%
                  </span>
                </span>
              ) : (
                <span className="text-xs text-muted-foreground/50">{failed ? "unavailable" : "loading…"}</span>
              )}
            </div>
          );
        })}
      </div>

      <Link href="/analysis"
        className="mt-3 inline-flex items-center justify-center rounded-lg px-3 py-2 text-xs font-semibold text-white transition-all hover:-translate-y-px"
        style={{ background: "#14B8A6", boxShadow: "0 2px 12px rgba(20,184,166,0.28)" }}>
        Add analysis
      </Link>
    </div>
  );
}
