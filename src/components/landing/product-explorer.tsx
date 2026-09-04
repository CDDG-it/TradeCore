"use client";

/**
 * Product explorer — the stretch between the hero and the flip cards.
 *
 * Each instrument gets its own block that reveals as you scroll, with a mock of
 * the real card it renders in the app: the same chrome (accent hairline, radial
 * glow, corner sheen), the same labels and the same figures treatment, so the
 * landing page shows the actual product rather than an abstract illustration.
 * The mocks stay interactive — the controls are the real ones, wired to
 * illustrative data, and every block says so.
 */

import { useRef, useState } from "react";
import Link from "next/link";
import { motion, useScroll, useSpring, useReducedMotion } from "motion/react";
import { ArrowRight, Check, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

const TURQUOISE = "#14B8A6";
const CYAN = "#06B6D4";
const GREEN = "#22c55e";
const RED = "#ef4444";
const AMBER = "#f59e0b";

/** Matches the app's own alpha helper so the mock chrome is identical. */
const alpha = (c: string, pct: number) => `color-mix(in oklch, ${c} ${pct}%, transparent)`;

/* ── Shared card chrome, lifted from the dashboard ───────────────────────── */

function CardFx({ accent }: { accent: string }) {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-500 group-hover/card:opacity-100"
        style={{ background: `radial-gradient(115% 85% at 0% 0%, ${alpha(accent, 9)}, transparent 55%)`, opacity: 0.85 }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${alpha(accent, 55)}, transparent)` }}
      />
      <div
        className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover/card:opacity-100"
        style={{ background: `radial-gradient(circle, ${alpha(accent, 25)}, transparent 70%)` }}
      />
      <div
        className="pointer-events-none absolute inset-x-6 bottom-0 h-px origin-left scale-x-0 transition-transform duration-500 ease-out group-hover/card:scale-x-100"
        style={{ background: `linear-gradient(90deg, ${alpha(accent, 65)}, transparent)` }}
      />
    </>
  );
}

function MockCard({
  accent,
  className,
  children,
}: {
  accent: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "group/card relative overflow-hidden rounded-2xl border border-border/60 bg-card p-4",
        "shadow-[0_4px_20px_-10px_rgba(0,0,0,0.25)] transition-[box-shadow,border-color] duration-300",
        "hover:border-border/90 hover:shadow-[0_10px_36px_-14px_rgba(0,0,0,0.45)]",
        className
      )}
    >
      <CardFx accent={accent} />
      <div className="relative">{children}</div>
    </div>
  );
}

/** The app's small uppercase card label. */
function CardLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{children}</p>
  );
}

/** The app's week / month segmented toggle. */
function PeriodToggle<T extends string>({
  options,
  value,
  onChange,
  accent,
}: {
  options: T[];
  value: T;
  onChange: (v: T) => void;
  accent: string;
}) {
  return (
    <div className="flex overflow-hidden rounded-lg border border-border/60">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          className={cn(
            "px-2 py-0.5 text-[10px] font-semibold capitalize transition-colors",
            value === o ? "text-background" : "text-muted-foreground hover:text-foreground"
          )}
          style={value === o ? { background: accent } : undefined}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

/* ── Instrument copy ─────────────────────────────────────────────────────── */

interface Instrument {
  key: string;
  label: string;
  name: string;
  tagline: string;
  points: string[];
  href: string;
  accent: string;
  visual: React.ReactNode;
}

/* ── 1. Dashboard — the real win-rate card ───────────────────────────────── */

const WR_DATA = {
  week: { wins: 7, losses: 4, be: 1, netR: 6.4 },
  month: { wins: 26, losses: 19, be: 3, netR: 18.2 },
};

function WinRateMock() {
  const [period, setPeriod] = useState<"week" | "month">("month");
  const d = WR_DATA[period];
  const total = d.wins + d.losses + d.be;
  // Same formula as the real card: break-even is charted but not rated.
  const wr = Math.round((d.wins / (d.wins + d.losses)) * 100);

  const R = 46;
  const SW = 11;
  const C = 2 * Math.PI * R;
  const segs = [
    { v: d.wins, c: GREEN },
    { v: d.be, c: AMBER },
    { v: d.losses, c: RED },
  ];
  let acc = 0;

  return (
    <MockCard accent={CYAN} className="flex flex-col">
      <div className="flex items-center justify-between">
        <CardLabel>Win rate</CardLabel>
        <PeriodToggle options={["week", "month"]} value={period} onChange={setPeriod} accent={CYAN} />
      </div>

      <div className="flex flex-1 items-center justify-center py-3">
        <div className="relative aspect-square w-[132px]">
          <svg viewBox="0 0 116 116" className="block h-full w-full">
            <circle cx={58} cy={58} r={R} fill="none" stroke={alpha("var(--muted-foreground)", 14)} strokeWidth={SW} />
            {segs.map((s, i) => {
              if (s.v === 0) return null;
              const frac = s.v / total;
              const dash = frac * C;
              const rot = acc * 360 - 90;
              acc += frac;
              return (
                <circle
                  key={i}
                  cx={58}
                  cy={58}
                  r={R}
                  fill="none"
                  stroke={s.c}
                  strokeWidth={SW}
                  strokeLinecap="round"
                  strokeDasharray={`${dash} ${C - dash}`}
                  transform={`rotate(${rot} 58 58)`}
                  style={{ filter: `drop-shadow(0 0 4px ${alpha(s.c, 40)})`, transition: "stroke-dasharray 400ms cubic-bezier(0.16,1,0.3,1)" }}
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-[30px] font-black leading-none tabular-nums" style={{ color: CYAN }}>
              {wr}%
            </p>
            <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
              {total} trades
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Win", value: d.wins, color: GREEN },
          { label: "Loss", value: d.losses, color: RED },
          { label: "B/E", value: d.be, color: AMBER },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-border/50 bg-muted/20 px-2 py-1 text-center">
            <p className="text-base font-black leading-none tabular-nums" style={{ color: s.color }}>
              {s.value}
            </p>
            <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
    </MockCard>
  );
}

/* ── 2. Mind Edge — the real Mindscore breakdown ─────────────────────────── */

const MS_DATA = {
  week: { total: 82, rules: 90, habits: 74, objectives: 80, band: "Locked in" },
  month: { total: 71, rules: 78, habits: 66, objectives: 69, band: "Holding" },
  all: { total: 64, rules: 70, habits: 58, objectives: 62, band: "Holding" },
};
const MS_PARTS = [
  { key: "rules", title: "Following your rules", sub: "Sticking to your plan on every trade", accent: TURQUOISE },
  { key: "habits", title: "Daily habits", sub: "The routines you keep away from the charts", accent: CYAN },
  { key: "objectives", title: "Doing the work", sub: "Reviews, prep and logging your best trade", accent: TURQUOISE },
] as const;

function MindscoreMock() {
  const [period, setPeriod] = useState<"week" | "month" | "all">("month");
  const d = MS_DATA[period];
  const c = d.total >= 80 ? GREEN : d.total >= 55 ? TURQUOISE : RED;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {(["week", "month", "all"] as const).map((p) => {
          const on = period === p;
          const pc = MS_DATA[p].total >= 80 ? GREEN : MS_DATA[p].total >= 55 ? TURQUOISE : RED;
          return (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={cn(
                "flex items-baseline justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-left transition-colors",
                on ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/30"
              )}
            >
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {p === "all" ? "All time" : `This ${p}`}
              </span>
              <span className="text-lg font-black leading-none tabular-nums" style={{ color: pc }}>
                {MS_DATA[p].total}
              </span>
            </button>
          );
        })}
      </div>

      <div
        className="rounded-xl border p-3.5"
        style={{ borderColor: alpha(c, 30), background: alpha(c, 6) }}
      >
        <div className="flex items-center gap-3.5">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border"
            style={{ borderColor: alpha(c, 40), background: alpha(c, 12) }}
          >
            <span className="text-2xl font-black leading-none tabular-nums" style={{ color: c }}>
              {d.total}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold" style={{ color: c }}>{d.band}</p>
            <p className="text-[11px] leading-snug text-muted-foreground">
              Built from your rules, habits and process work — not how the session felt.
            </p>
            <div className="mt-2">
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted-foreground/12">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${d.total}%`, background: c, transition: "width 500ms cubic-bezier(0.16,1,0.3,1)" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {MS_PARTS.map((p) => {
          const v = d[p.key];
          return (
            <div key={p.key} className="rounded-lg border border-border bg-card px-3 py-2">
              <div className="flex items-baseline justify-between gap-2">
                <p className="truncate text-xs font-semibold">{p.title}</p>
                <span className="shrink-0 text-xs font-black tabular-nums" style={{ color: p.accent }}>
                  {v}%
                </span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted-foreground/12">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${v}%`, background: p.accent, transition: "width 500ms cubic-bezier(0.16,1,0.3,1)" }}
                />
              </div>
              <p className="mt-1 text-[10px] leading-snug text-muted-foreground">{p.sub}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── 3. Trade Therapist — the real pre-market review card ────────────────── */

const REVIEWS = [
  {
    id: "nq",
    instrument: "Nasdaq 100",
    session: "New York",
    dir: "short" as const,
    r: "-1R",
    takeaways: [
      { label: "Mistake", text: "Entered before the level was confirmed — chased the breakdown." },
      { label: "Mindset", text: "Frustrated after missing the first move of the session." },
    ],
    plan: "No market order on the first break. Mark the level, wait for the retest to close, then enter.",
  },
  {
    id: "es",
    instrument: "S&P 500",
    session: "London",
    dir: "long" as const,
    r: "-1R",
    takeaways: [
      { label: "Mistake", text: "Sized up to 2R after two winners in a row." },
      { label: "Mindset", text: "Overconfident — felt the read was obvious." },
    ],
    plan: "Position size is set before the open and does not move, win or lose.",
  },
];

function TherapistMock() {
  const [id, setId] = useState(REVIEWS[0].id);
  const r = REVIEWS.find((x) => x.id === id)!;

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-border/60 p-5 pl-6"
      style={{
        background: `linear-gradient(160deg, color-mix(in oklch, var(--card) 96%, ${RED} 4%), var(--card) 55%)`,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 12px 32px -18px rgba(0,0,0,0.8)",
      }}
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1"
        style={{ background: `linear-gradient(180deg, ${RED}, ${alpha(RED, 12)})` }}
      />

      <p className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: alpha(RED, 75) }}>
        Prevent these losses
      </p>

      <div className="mt-3 space-y-1.5">
        {REVIEWS.map((x) => {
          const on = x.id === id;
          return (
            <button
              key={x.id}
              type="button"
              onClick={() => setId(x.id)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition-colors",
                on ? "border-primary/50 bg-muted/30" : "border-border/60 hover:border-primary/30 hover:bg-muted/20"
              )}
            >
              {x.dir === "long" ? (
                <TrendingUp className="h-4 w-4 shrink-0" style={{ color: GREEN }} />
              ) : (
                <TrendingDown className="h-4 w-4 shrink-0" style={{ color: RED }} />
              )}
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-bold leading-none">{x.instrument}</span>
                <span className="mt-1 block text-[10px] leading-none text-muted-foreground">{x.session} session</span>
              </span>
              <span className="shrink-0 text-xs font-bold tabular-nums" style={{ color: RED }}>{x.r}</span>
              <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
            </button>
          );
        })}
      </div>

      <div className="mt-3 space-y-2">
        {r.takeaways.map((t) => (
          <div key={t.label} className="flex gap-2">
            <span
              className="mt-px shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
              style={{ background: alpha(RED, 12), color: RED }}
            >
              {t.label}
            </span>
            <p className="text-[12px] leading-snug text-foreground/80">{t.text}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 border-t border-border/40 pt-3.5">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80">
          How I&apos;ll prevent this today
        </p>
        <p className="rounded-lg border border-border/60 bg-background/40 px-3.5 py-3 text-sm leading-relaxed text-foreground/90">
          {r.plan}
        </p>
      </div>
    </div>
  );
}

/* ── Strategy half — the real rulebook editor ───────────────────────────── */

const RULES = [
  "No trade without a completed pre-market analysis",
  "Maximum 1R risk per trade — no exceptions",
  "Stop trading for the day after two consecutive losses",
  "Never move a stop away from price",
];

function StrategyMock() {
  const [off, setOff] = useState<number[]>([]);
  const active = RULES.filter((_, i) => !off.includes(i));

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-border/60 p-5 pl-6"
      style={{
        background: `linear-gradient(160deg, color-mix(in oklch, var(--card) 96%, ${TURQUOISE} 4%), var(--card) 55%)`,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 12px 32px -18px rgba(0,0,0,0.8)",
      }}
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1"
        style={{ background: `linear-gradient(180deg, ${TURQUOISE}, ${alpha(TURQUOISE, 12)})` }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -top-5 right-3 select-none text-[92px] font-black leading-none tracking-tighter"
        style={{ color: alpha(TURQUOISE, 7) }}
      >
        {active.length}
      </span>

      <div className="relative">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: alpha(TURQUOISE, 70) }}>
          Discipline
        </p>
        <h4 className="mt-1.5 font-heading text-xl font-bold tracking-tight">Trading Rules</h4>
        <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-muted-foreground">
          Your non-negotiables. These surface as the pre-trade checklist every time you log a trade.
        </p>
      </div>

      <ol className="mt-5 divide-y divide-border/40 border-y border-border/40">
        {RULES.map((rule, idx) => {
          const on = !off.includes(idx);
          return (
            <li key={rule}>
              <button
                type="button"
                onClick={() => setOff((p) => (on ? [...p, idx] : p.filter((x) => x !== idx)))}
                className="group -mx-2 flex w-full items-center gap-3 rounded-lg px-2 py-3 text-left transition-colors hover:bg-primary/[0.05]"
              >
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-[11px] font-bold tabular-nums transition-colors"
                  style={{
                    borderColor: on ? alpha(TURQUOISE, 20) : "var(--border)",
                    background: on ? alpha(TURQUOISE, 10) : "transparent",
                    color: on ? TURQUOISE : "var(--muted-foreground)",
                  }}
                >
                  {idx + 1}
                </span>
                <span
                  className={cn(
                    "min-w-0 flex-1 text-sm leading-snug transition-colors",
                    on ? "text-foreground" : "text-muted-foreground/50 line-through"
                  )}
                >
                  {rule}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <p className="mt-4 text-[11px] text-muted-foreground">
        {active.length === RULES.length
          ? "Every rule active — this is the checklist you trade against."
          : `${RULES.length - active.length} rule${RULES.length - active.length !== 1 ? "s" : ""} switched off. Tap to bring back.`}
      </p>
    </div>
  );
}

/* ── My Edge — both halves behind the app's own split control ────────────── */

function MyEdgeMock() {
  const [half, setHalf] = useState<"mind" | "strategy">("mind");
  const halves = [
    { key: "mind" as const, label: "Mind Edge", accent: TURQUOISE },
    { key: "strategy" as const, label: "Strategy", accent: CYAN },
  ];

  return (
    <div className="space-y-3">
      {/* The same divided control the page itself uses */}
      <div
        className="flex w-fit items-stretch rounded-xl border border-border/50 p-1"
        style={{
          background: "color-mix(in oklch, var(--card) 70%, transparent)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        {halves.map((h, i) => {
          const on = half === h.key;
          return (
            <div key={h.key} className={cn("px-1", i > 0 && "ml-2 border-l border-border/50 pl-3")}>
              <button
                type="button"
                onClick={() => setHalf(h.key)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                  on ? "text-background" : "text-muted-foreground hover:text-foreground"
                )}
                style={on ? { background: h.accent } : undefined}
              >
                {h.label}
              </button>
            </div>
          );
        })}
      </div>

      {half === "mind" ? <MindscoreMock /> : <StrategyMock />}
    </div>
  );
}

/* ── 5. News Dashboard — the real Global Markets subtabs ─────────────────── */

const GM_TABS = ["Overview", "Markets", "News"] as const;
const GM_ROWS: Record<(typeof GM_TABS)[number], { a: string; b: string; v: string; dir: number }[]> = {
  Overview: [
    { a: "US 10Y", b: "Treasury", v: "4.28%", dir: 1 },
    { a: "DXY", b: "Dollar index", v: "104.6", dir: -1 },
    { a: "VIX", b: "Volatility", v: "14.2", dir: -1 },
  ],
  Markets: [
    { a: "Nasdaq 100", b: "Index future", v: "+0.84%", dir: 1 },
    { a: "Gold", b: "Metal", v: "-0.31%", dir: -1 },
    { a: "Crude WTI", b: "Energy", v: "+1.12%", dir: 1 },
  ],
  News: [
    { a: "FOMC minutes released", b: "Central banks", v: "High", dir: 1 },
    { a: "Crude inventories build", b: "Commodities", v: "High", dir: -1 },
    { a: "Jobless claims in line", b: "Macro", v: "Low", dir: 0 },
  ],
};

function MarketsMock() {
  const [tab, setTab] = useState<(typeof GM_TABS)[number]>("Overview");

  return (
    <MockCard accent={CYAN}>
      <div className="flex items-center justify-between gap-3">
        <p className="font-heading text-sm font-bold uppercase tracking-tight">Global Markets</p>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70">Objective research</span>
      </div>

      <nav className="mt-3 flex gap-1">
        {GM_TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
              tab === t ? "text-background" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
            style={tab === t ? { background: TURQUOISE } : undefined}
          >
            {t}
          </button>
        ))}
      </nav>

      <ul className="mt-3 divide-y divide-border/40 border-y border-border/40">
        {GM_ROWS[tab].map((r) => (
          <li key={r.a} className="flex items-center gap-3 py-2.5">
            <span
              aria-hidden
              className="h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ background: r.dir > 0 ? GREEN : r.dir < 0 ? RED : "var(--muted-foreground)" }}
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm text-foreground/90">{r.a}</span>
              <span className="block text-[10px] text-muted-foreground">{r.b}</span>
            </span>
            <span
              className="shrink-0 text-xs font-bold tabular-nums"
              style={{ color: r.dir > 0 ? GREEN : r.dir < 0 ? RED : "var(--muted-foreground)" }}
            >
              {r.v}
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-[10px] text-muted-foreground/70">Provider-labelled · nothing here predicts.</p>
    </MockCard>
  );
}

/* ── The section ─────────────────────────────────────────────────────────── */

const INSTRUMENTS: Instrument[] = [
  {
    key: "dashboard",
    label: "Overview",
    name: "Dashboard",
    tagline: "Your whole trading day on one screen.",
    points: [
      "Every account, trade and metric in a single command center.",
      "Running profit and loss as the session unfolds.",
      "The one thing to work on today, kept front and center.",
    ],
    href: "/features/dashboard",
    accent: CYAN,
    visual: <WinRateMock />,
  },
  {
    key: "my-edge",
    label: "Mindset · Strategy",
    name: "My Edge",
    tagline: "Your rules, your habits, and one number for how ready you are.",
    points: [
      "Strategy: the setups and rules that qualify a trade, written down.",
      "Mind Edge: the habits you keep, and a Mindscore built from them.",
      "Pressure-test the whole thing before risking a live evaluation.",
    ],
    href: "/features/psychological-edge",
    accent: TURQUOISE,
    visual: <MyEdgeMock />,
  },
  {
    key: "therapist",
    label: "Mindset",
    name: "MC Trade Therapist",
    tagline: "A coach that talks back, built from your own trades.",
    points: [
      "Your journal and discipline feed a structured session.",
      "Each prompt names the trade you overheld or the rule you skipped.",
      "What you promise is saved and resurfaced on later trades.",
    ],
    href: "/features/trade-therapist",
    accent: RED,
    visual: <TherapistMock />,
  },
  {
    key: "markets",
    label: "Markets",
    name: "MC News Dashboard",
    tagline: "See what is actually moving the market.",
    points: [
      "Central banks, macro, commodities and earnings in one hub.",
      "Signals scored by impact, direction and confidence.",
      "Narrow to what moves your instrument.",
    ],
    href: "/features/news-city",
    accent: CYAN,
    visual: <MarketsMock />,
  },
];

export function ProductExplorer() {
  const trackRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start 0.85", "end 0.4"],
  });
  const fill = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 });

  return (
    <section id="features" className="relative bg-background px-6 py-24 md:px-10 md:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-3xl">
          <p className="font-body text-[13px] font-semibold text-primary">Inside the platform</p>
          <h2
            className="mt-5 font-heading font-black tracking-tight text-foreground"
            style={{ fontSize: "clamp(2rem,4.6vw,3.25rem)", lineHeight: 1.05 }}
          >
            Four instruments for the operator behind the trades.
          </h2>
          <p className="mt-5 max-w-xl font-body text-[0.95rem] leading-relaxed text-muted-foreground">
            Every panel below is the real card, running on illustrative numbers.
            Try the controls — they behave exactly as they do inside the product.
          </p>
        </div>

        {/* Scroll track: a rail that fills as you move through the instruments */}
        <div ref={trackRef} className="relative mt-20 md:mt-28">
          <div
            aria-hidden
            className="pointer-events-none absolute left-0 top-0 hidden h-full w-px bg-border/60 lg:block"
          >
            <motion.div
              className="absolute inset-x-0 top-0 origin-top"
              style={{
                height: "100%",
                scaleY: reduce ? 1 : fill,
                background: `linear-gradient(180deg, ${TURQUOISE}, ${CYAN})`,
              }}
            />
          </div>

          <div className="flex flex-col gap-28 md:gap-40 lg:pl-14">
            {INSTRUMENTS.map((inst, i) => (
              <InstrumentBlock key={inst.key} inst={inst} flip={i % 2 === 1} reduce={!!reduce} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function InstrumentBlock({
  inst,
  flip,
  reduce,
}: {
  inst: Instrument;
  flip: boolean;
  reduce: boolean;
}) {
  return (
    <article className="relative grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
      {/* Node on the rail */}
      <span
        aria-hidden
        className="absolute -left-14 top-2 hidden h-2.5 w-2.5 -translate-x-1/2 rounded-full ring-4 ring-background lg:block"
        style={{ background: inst.accent }}
      />

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-12%" }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={cn(flip && "lg:order-2")}
      >
        <p className="font-body text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
          {inst.label}
        </p>
        <h3 className="mt-3 font-heading text-3xl font-black tracking-tight text-foreground md:text-4xl">
          {inst.name}
        </h3>
        <p className="mt-4 font-body text-lg leading-snug text-foreground/80">{inst.tagline}</p>

        <ul className="mt-6 space-y-2.5">
          {inst.points.map((p) => (
            <li key={p} className="flex gap-2.5">
              <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: inst.accent }} strokeWidth={3} />
              <span className="font-body text-sm leading-relaxed text-muted-foreground">{p}</span>
            </li>
          ))}
        </ul>

        <Link
          href={inst.href}
          className="group mt-7 inline-flex items-center gap-1.5 font-body text-sm font-semibold text-primary transition-colors hover:text-foreground"
        >
          Explore {inst.name}
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      </motion.div>

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 34, scale: 0.985 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
        className={cn("min-w-0", flip && "lg:order-1")}
      >
        {inst.visual}
        <p className="mt-3 text-center font-body text-[11px] text-muted-foreground/60">
          Illustrative figures — the product runs this on your own trades.
        </p>
      </motion.div>
    </article>
  );
}
