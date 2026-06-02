"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowRight,
  Activity,
  BookOpen,
  BarChart2,
  Wallet,
  Flame,
  Brain,
  LineChart,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Color tokens (exact match with app) ─────────────────────────────────────
const C = {
  win:    "oklch(0.68 0.20 130)",
  loss:   "oklch(0.62 0.24 18)",
  be:     "oklch(0.70 0.16 72)",
  orange: "oklch(0.72 0.22 45)",
  copper: "oklch(0.84 0.18 80)",
  card:   "oklch(0.10 0.003 28)",
  bg:     "oklch(0.08 0.004 28)",
  border: "oklch(0.16 0.006 28)",
  muted:  "oklch(0.62 0.012 40)",
} as const;

// ── Mini preview: Dashboard ──────────────────────────────────────────────────
function DashboardMini() {
  const stats = [
    { label: "Win rate",   value: "73%",   color: C.win    },
    { label: "Avg R:R",    value: "2.1",   color: C.orange },
    { label: "Discipline", value: "84%",   color: C.copper },
  ];
  const trades = [
    { inst: "NQ", result: "win",  rr: "+2.4R", dir: "Long", session: "NY"     },
    { inst: "ES", result: "loss", rr: "−1R",   dir: "Short", session: "London" },
    { inst: "NQ", result: "win",  rr: "+1.8R", dir: "Long", session: "NY"     },
  ];
  return (
    <div className="p-3 space-y-2">
      <div className="grid grid-cols-3 gap-1.5">
        {stats.map(({ label, value, color }) => (
          <div key={label} className="rounded-lg p-2" style={{ background: C.card }}>
            <p className="text-[8px] uppercase tracking-wide mb-0.5" style={{ color: C.muted }}>{label}</p>
            <p className="text-sm font-black tabular-nums leading-none" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>
      <div className="space-y-1">
        {trades.map((t, i) => (
          <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded-md" style={{ background: C.card }}>
            <span className="text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-sm tabular-nums shrink-0"
              style={{ color: t.result === "win" ? C.win : C.loss, background: t.result === "win" ? "oklch(0.68 0.20 130 / 0.14)" : "oklch(0.62 0.24 18 / 0.14)" }}>
              {t.result === "win" ? "W" : "L"}
            </span>
            <span className="text-[9px] font-mono font-semibold w-7 shrink-0" style={{ color: "oklch(0.88 0.005 50)" }}>{t.inst}</span>
            <span className="text-[8px] shrink-0" style={{ color: C.muted }}>{t.session}</span>
            <span className="flex-1" />
            <span className="text-[9px] font-bold tabular-nums shrink-0" style={{ color: t.result === "win" ? C.win : C.loss }}>{t.rr}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Mini preview: Journal ────────────────────────────────────────────────────
function JournalMini() {
  const days = [
    { d: "Mo", key: "2026-06-02", trades: [{ r: "win" }, { r: "win" }] },
    { d: "Tu", key: "2026-06-03", trades: [] },
    { d: "We", key: "2026-06-04", trades: [{ r: "loss" }] },
    { d: "Th", key: "2026-06-05", trades: [{ r: "win" }, { r: "be" }] },
    { d: "Fr", key: "2026-06-06", trades: [{ r: "win" }] },
  ];
  const tradeList = [
    { inst: "NQ", result: "win",  rr: "+2.4R", tf: "15m",   exec: "good" },
    { inst: "NQ", result: "win",  rr: "+1.8R", tf: "1H",    exec: "good" },
    { inst: "ES", result: "loss", rr: "−1R",   tf: "15m",   exec: "bad"  },
  ];
  return (
    <div className="p-3 space-y-2">
      {/* Week grid */}
      <div className="grid grid-cols-5 gap-1">
        {days.map(({ d, trades }) => (
          <div key={d} className="rounded-lg p-1.5 flex flex-col items-center gap-1" style={{ background: C.card }}>
            <span className="text-[8px] font-medium" style={{ color: C.muted }}>{d}</span>
            <div className="flex flex-col gap-0.5 w-full">
              {trades.length === 0 ? (
                <div className="h-3 rounded-sm" style={{ background: C.border }} />
              ) : trades.map((t, i) => (
                <div key={i} className="h-2.5 rounded-sm w-full"
                  style={{ background: t.r === "win" ? "oklch(0.68 0.20 130 / 0.50)" : t.r === "loss" ? "oklch(0.62 0.24 18 / 0.50)" : "oklch(0.70 0.16 72 / 0.50)" }} />
              ))}
            </div>
          </div>
        ))}
      </div>
      {/* List */}
      <div className="space-y-1">
        {tradeList.map((t, i) => (
          <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded-md" style={{ background: C.card }}>
            <span className="text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-sm shrink-0"
              style={{ color: t.result === "win" ? C.win : C.loss, background: t.result === "win" ? "oklch(0.68 0.20 130 / 0.14)" : "oklch(0.62 0.24 18 / 0.14)" }}>
              {t.result === "win" ? "W" : "L"}
            </span>
            <span className="text-[9px] font-mono font-semibold w-7 shrink-0" style={{ color: "oklch(0.88 0.005 50)" }}>{t.inst}</span>
            <span className="text-[8px] font-mono shrink-0" style={{ color: C.muted }}>{t.tf}</span>
            <span className="flex-1" />
            <span className="text-[9px] font-semibold shrink-0" style={{ color: t.exec === "good" ? C.win : C.loss }}>{t.exec === "good" ? "✓" : "✗"}</span>
            <span className="text-[9px] font-bold tabular-nums shrink-0 ml-1" style={{ color: t.result === "win" ? C.win : C.loss }}>{t.rr}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Mini preview: Analysis ───────────────────────────────────────────────────
function AnalysisMini() {
  const analyses = [
    { inst: "NQ", bias: "Bullish", session: "New York", date: "Jun 2", has: true },
    { inst: "ES", bias: "Bearish", session: "London",   date: "Jun 1", has: true },
    { inst: "NQ", bias: "Bullish", session: "New York", date: "May 31", has: false },
  ];
  return (
    <div className="p-3 space-y-1.5">
      {analyses.map((a, i) => (
        <div key={i} className="rounded-lg px-2.5 py-2" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono font-black" style={{ color: C.copper }}>{a.inst}</span>
            <span className="text-[8px] font-semibold px-1.5 py-0.5 rounded-full"
              style={{ background: a.bias === "Bullish" ? "oklch(0.68 0.20 130 / 0.15)" : "oklch(0.62 0.24 18 / 0.15)", color: a.bias === "Bullish" ? C.win : C.loss }}>
              {a.bias}
            </span>
            <span className="flex-1" />
            <span className="text-[8px]" style={{ color: C.muted }}>{a.date}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[8px] font-medium px-1.5 py-0.5 rounded"
              style={{ background: "oklch(0.72 0.22 45 / 0.12)", color: C.orange }}>{a.session}</span>
            {a.has && <span className="text-[8px]" style={{ color: C.muted }}>Linked to trade</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Mini preview: Analytics ──────────────────────────────────────────────────
function AnalyticsMini() {
  const bars = [
    { label: "Win",   pct: 62, color: C.win,    value: "62%" },
    { label: "Loss",  pct: 29, color: C.loss,   value: "29%" },
    { label: "B/E",   pct: 9,  color: C.be,     value: "9%"  },
  ];
  const stats = [
    { label: "Best RR",    value: "+4.2R", color: C.win },
    { label: "Avg loss",   value: "−1R",   color: C.loss },
    { label: "Sessions",   value: "NY",    color: C.orange },
  ];
  return (
    <div className="p-3 space-y-2.5">
      {/* Bar chart */}
      <div className="space-y-1.5">
        {bars.map(({ label, pct, color, value }) => (
          <div key={label} className="flex items-center gap-2">
            <span className="text-[8px] font-medium w-6 shrink-0" style={{ color: C.muted }}>{label}</span>
            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: C.border }}>
              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
            </div>
            <span className="text-[9px] font-bold tabular-nums w-6 text-right shrink-0" style={{ color }}>{value}</span>
          </div>
        ))}
      </div>
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-1.5">
        {stats.map(({ label, value, color }) => (
          <div key={label} className="rounded-lg p-2" style={{ background: C.card }}>
            <p className="text-[7px] uppercase tracking-wide mb-0.5" style={{ color: C.muted }}>{label}</p>
            <p className="text-xs font-black tabular-nums leading-none" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Mini preview: Accounts ───────────────────────────────────────────────────
function AccountsMini() {
  const accounts = [
    { firm: "Apex Trader",  size: "$150k", phase: "Funded",   roi: "2.4x", status: "active",   payout: "$3,600" },
    { firm: "Topstep",      size: "$100k", phase: "Funded",   roi: "1.8x", status: "active",   payout: "$1,800" },
    { firm: "FTMO",         size: "$50k",  phase: "Eval",     roi: "—",    status: "eval",     payout: "—" },
  ];
  return (
    <div className="p-3 space-y-1.5">
      {accounts.map((a, i) => (
        <div key={i} className="rounded-lg px-2.5 py-2" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-semibold" style={{ color: "oklch(0.88 0.005 50)" }}>{a.firm}</span>
                <span className="text-[8px] font-medium px-1.5 py-0.5 rounded-full"
                  style={{ background: a.status === "active" ? "oklch(0.68 0.20 130 / 0.14)" : "oklch(0.72 0.22 45 / 0.12)", color: a.status === "active" ? C.win : C.orange }}>
                  {a.phase}
                </span>
              </div>
              <p className="text-[8px] mt-0.5" style={{ color: C.muted }}>Payout {a.payout}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[9px] font-mono font-semibold" style={{ color: C.copper }}>{a.size}</p>
              {a.roi !== "—" && (
                <p className="text-[9px] font-black" style={{ color: C.win }}>{a.roi}</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Mini preview: Habits ─────────────────────────────────────────────────────
function HabitsMini() {
  const habits = [
    { name: "Pre-market routine",  done: true  },
    { name: "Review setups",       done: true  },
    { name: "End-of-day journal",  done: true  },
    { name: "Exercise / movement", done: false },
    { name: "Screen discipline",   done: false },
  ];
  const done  = habits.filter((h) => h.done).length;
  const total = habits.length;
  const pct   = Math.round((done / total) * 100);

  return (
    <div className="p-3 space-y-2">
      {/* Progress */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: C.border }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: C.orange }} />
        </div>
        <span className="text-[9px] font-bold tabular-nums shrink-0" style={{ color: C.orange }}>{done}/{total}</span>
      </div>
      {/* List */}
      <div className="space-y-1">
        {habits.map(({ name, done }, i) => (
          <div key={i} className="flex items-center gap-2 px-2 py-1 rounded-md"
            style={{ background: done ? "oklch(0.72 0.22 45 / 0.06)" : C.card, border: done ? "1px solid oklch(0.72 0.22 45 / 0.15)" : "1px solid transparent" }}>
            <div className="w-3.5 h-3.5 rounded-full shrink-0 flex items-center justify-center border-2 transition-all"
              style={{ borderColor: done ? C.orange : C.border, background: done ? C.orange : "transparent" }}>
              {done && <Check className="w-2 h-2 text-white" strokeWidth={3} />}
            </div>
            <span className="text-[9px] font-medium leading-none" style={{ color: done ? "oklch(0.55 0.005 28)" : "oklch(0.75 0.006 40)" }}>{name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Mini preview: Self-Improvement ──────────────────────────────────────────
function SelfMini() {
  const scores = [
    { label: "Mood",       score: 8, color: C.win    },
    { label: "Focus",      score: 7, color: C.orange },
    { label: "Energy",     score: 6, color: C.copper },
    { label: "Confidence", score: 8, color: C.win    },
    { label: "Patience",   score: 7, color: C.copper },
  ];
  return (
    <div className="p-3 space-y-2.5">
      <div className="space-y-1.5">
        {scores.map(({ label, score, color }) => (
          <div key={label} className="flex items-center gap-2">
            <span className="text-[8px] font-medium w-16 shrink-0" style={{ color: C.muted }}>{label}</span>
            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: C.border }}>
              <div className="h-full rounded-full"
                style={{ width: `${(score / 10) * 100}%`, background: color }} />
            </div>
            <span className="text-[9px] font-bold tabular-nums w-4 text-right shrink-0" style={{ color }}>{score}</span>
          </div>
        ))}
      </div>
      {/* Sleep row */}
      <div className="flex items-center gap-2 rounded-lg px-2.5 py-2" style={{ background: C.card }}>
        <Brain className="w-3 h-3 shrink-0" style={{ color: C.copper }} />
        <span className="text-[8px] font-medium" style={{ color: "oklch(0.75 0.006 40)" }}>Sleep</span>
        <span className="text-[9px] font-bold tabular-nums ml-auto" style={{ color: C.copper }}>7.5h</span>
        <span className="text-[8px]" style={{ color: C.muted }}>Quality 8/10</span>
      </div>
    </div>
  );
}

// ── Card definitions ─────────────────────────────────────────────────────────
const CARDS = [
  {
    route:   "/dashboard",
    icon:    Activity,
    name:    "Dashboard",
    desc:    "Daily view of performance, habits and discipline. One place to see where you stand before and after the session.",
    cta:     "Open dashboard",
    accent:  C.orange,
    Preview: DashboardMini,
  },
  {
    route:   "/journal",
    icon:    BookOpen,
    name:    "Trade Journal",
    desc:    "Log every trade with setup, execution quality, R:R and session context. Review in list or calendar view.",
    cta:     "View journal",
    accent:  C.win,
    Preview: JournalMini,
  },
  {
    route:   "/analysis",
    icon:    LineChart,
    name:    "Pre-market Analysis",
    desc:    "Build daily analysis notes around bias, scenarios and key levels before the session opens.",
    cta:     "Review analyses",
    accent:  C.copper,
    Preview: AnalysisMini,
  },
  {
    route:   "/analytics",
    icon:    BarChart2,
    name:    "Performance Analytics",
    desc:    "Find patterns in your execution. Win rate, R multiples, session performance and discipline trends over time.",
    cta:     "See analytics",
    accent:  C.orange,
    Preview: AnalyticsMini,
  },
  {
    route:   "/accounts",
    icon:    Wallet,
    name:    "Funded Accounts",
    desc:    "Track all funded accounts in one place. Monitor payouts, ROI multiples, drawdown and account phases.",
    cta:     "Review accounts",
    accent:  "oklch(0.68 0.20 130)" as string,
    Preview: AccountsMini,
  },
  {
    route:   "/habits",
    icon:    Flame,
    name:    "Habit Tracker",
    desc:    "Define and track the daily habits that actually move the needle. Routine, research, health and mindset.",
    cta:     "Track habits",
    accent:  C.orange,
    Preview: HabitsMini,
  },
  {
    route:   "/self-improvement",
    icon:    Brain,
    name:    "Self-Improvement",
    desc:    "Daily mental state check-in, sleep tracking, personal standards and weekly performance reflection.",
    cta:     "Open check-in",
    accent:  C.copper,
    Preview: SelfMini,
  },
] as const;

// ── Single card ───────────────────────────────────────────────────────────────
function PreviewCard({ card, index }: { card: typeof CARDS[number]; index: number }) {
  const Icon  = card.icon;
  const { Preview } = card;
  const accent = card.accent;

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{
        duration: 0.60,
        ease: [0.16, 1, 0.3, 1],
        delay: (index % 3) * 0.07,
      }}
      className="h-full"
    >
      <Link href={card.route} className="group block h-full">
        <div
          className="h-full rounded-2xl overflow-hidden flex flex-col transition-all duration-300 relative"
          style={{
            background:    "oklch(0.105 0.004 28)",
            border:        "1px solid oklch(0.18 0.007 28)",
          }}
        >
          {/* Ambient top glow line — reveals on hover */}
          <div
            className="absolute inset-x-0 top-0 h-px pointer-events-none transition-opacity duration-300 opacity-0 group-hover:opacity-100"
            style={{ background: `linear-gradient(90deg, transparent 10%, ${accent} 50%, transparent 90%)` }}
          />

          {/* Glow border on hover */}
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-300 opacity-0 group-hover:opacity-100"
            style={{ boxShadow: `0 0 0 1px ${accent.replace(")", " / 0.28)")}`, inset: 0 }}
          />

          {/* Mini UI preview area */}
          <div
            className="relative shrink-0 overflow-hidden"
            style={{
              background:   "oklch(0.075 0.003 28)",
              borderBottom: "1px solid oklch(0.16 0.006 28)",
            }}
          >
            <Preview />
          </div>

          {/* Card body */}
          <div className="flex flex-col flex-1 p-4">
            {/* Icon + name */}
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                style={{ background: `${accent.replace(")", " / 0.12)")}` }}
              >
                <Icon className="w-3.5 h-3.5" style={{ color: accent }} />
              </div>
              <h3 className="text-sm font-bold" style={{ color: "oklch(0.93 0.005 50)" }}>
                {card.name}
              </h3>
            </div>

            {/* Description */}
            <p className="text-xs leading-relaxed flex-1" style={{ color: "oklch(0.58 0.010 40)" }}>
              {card.desc}
            </p>

            {/* CTA */}
            <div className="mt-3 pt-3" style={{ borderTop: "1px solid oklch(0.16 0.006 28)" }}>
              <span
                className="inline-flex items-center gap-1 text-xs font-semibold transition-all duration-200"
                style={{ color: accent }}
              >
                {card.cta}
                <ArrowRight className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-0.5" />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ── Section ───────────────────────────────────────────────────────────────────
export function ProductPreview() {
  return (
    <>
      {/* Transition: light hero → dark section */}
      <div
        aria-hidden
        style={{
          background: "linear-gradient(to bottom, oklch(0.98 0.003 45), oklch(0.07 0.004 28))",
          height: "6rem",
        }}
      />

      <section style={{ background: "oklch(0.07 0.004 28)" }}>
        <div className="px-5 pb-28 sm:px-8 max-w-6xl mx-auto">

          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="text-center mb-14"
          >
            <p
              className="mb-3"
              style={{
                fontFamily:    "var(--font-nunito), system-ui, sans-serif",
                fontSize:      "0.625rem",
                fontWeight:    600,
                textTransform: "uppercase",
                letterSpacing: "0.20em",
                color:         "oklch(0.45 0.010 40)",
              }}
            >
              The workspace
            </p>
            <h2
              className="font-black tracking-tight leading-tight"
              style={{
                fontFamily: "var(--font-nunito), system-ui, sans-serif",
                fontSize:   "clamp(1.8rem, 4vw, 2.75rem)",
                color:      "oklch(0.93 0.005 50)",
              }}
            >
              Every tool in one place.
            </h2>
            <p
              className="mt-3 mx-auto max-w-sm leading-relaxed"
              style={{
                fontFamily: "var(--font-nunito), system-ui, sans-serif",
                fontSize:   "0.9rem",
                color:      "oklch(0.52 0.010 40)",
              }}
            >
              From pre-market prep to post-session review. Built around the way funded traders actually work.
            </p>
          </motion.div>

          {/* Card grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CARDS.map((card, i) => (
              <PreviewCard key={card.route} card={card} index={i} />
            ))}
          </div>
        </div>

        {/* Footer strip */}
        <div
          className="border-t px-6 py-8"
          style={{ borderColor: "oklch(0.15 0.006 28)" }}
        >
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <span
              className="font-black tracking-tight text-sm"
              style={{ fontFamily: "var(--font-nunito), system-ui, sans-serif" }}
            >
              <span style={{ color: "oklch(0.88 0.005 50)" }}>Trade</span>
              <span style={{ background: "linear-gradient(90deg,#F97316,#d97706)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>CORE</span>
            </span>
            <p
              className="text-xs text-center sm:text-right"
              style={{ color: "oklch(0.38 0.008 36)" }}
            >
              Where self-improvement meets trading.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
