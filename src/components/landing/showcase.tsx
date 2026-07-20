"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import {
  ArrowRight, LayoutDashboard, BookOpen, LineChart, BarChart3, Wallet,
  CalendarCheck, Globe, Brain, MessageSquareHeart, Target, Activity,
} from "lucide-react";
import { FEATURES } from "@/lib/landing/features";

const NUNITO = "var(--font-nunito), system-ui, sans-serif";
const TURQ = "#14B8A6";
const CYAN = "#06B6D4";
const GREEN = "#22c55e";
const RED = "#ef4444";
const AMBER = "#f59e0b";

const byId = Object.fromEntries(FEATURES.map((f) => [f.slug, f]));

type Item = {
  key: string;
  name: string;
  tagline: string;
  section: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  // Either a screenshot or an interactive mock preview.
  screenshot?: string;
  aspect?: string;
  mock?: React.ReactNode;
};

// Every tool in the platform, in the order they appear in the app.
const ITEMS: Item[] = [
  { key: "dashboard", name: byId.dashboard.name, tagline: byId.dashboard.tagline, section: "Daily", href: "/features/dashboard", icon: LayoutDashboard, screenshot: byId.dashboard.screenshot, aspect: byId.dashboard.aspect },
  { key: "journal", name: byId.journal.name, tagline: byId.journal.tagline, section: "Trading", href: "/features/journal", icon: BookOpen, screenshot: byId.journal.screenshot, aspect: byId.journal.aspect },
  { key: "analysis", name: byId.analysis.name, tagline: byId.analysis.tagline, section: "Trading", href: "/features/analysis", icon: LineChart, screenshot: byId.analysis.screenshot, aspect: byId.analysis.aspect },
  { key: "analytics", name: byId.analytics.name, tagline: byId.analytics.tagline, section: "Trading", href: "/features/analytics", icon: BarChart3, screenshot: byId.analytics.screenshot, aspect: byId.analytics.aspect },
  { key: "accounts", name: byId.accounts.name, tagline: byId.accounts.tagline, section: "Trading", href: "/features/accounts", icon: Wallet, screenshot: byId.accounts.screenshot, aspect: byId.accounts.aspect },
  { key: "habits", name: byId.habits.name, tagline: byId.habits.tagline, section: "Daily", href: "/features/habits", icon: CalendarCheck, screenshot: byId.habits.screenshot, aspect: byId.habits.aspect },
  { key: "news-city", name: byId["news-city"].name, tagline: byId["news-city"].tagline, section: "Trading", href: "/features/news-city", icon: Globe, screenshot: byId["news-city"].screenshot, aspect: byId["news-city"].aspect },
  // The MC Mindset formula tools have no static screenshot — they come alive as
  // interactive mock-data widgets instead.
  { key: "mind-edge", name: "MC Mind Edge", tagline: "One number for how ready you are to trade your edge.", section: "Mindset", href: "/psychological-edge", icon: Brain, mock: <MindscoreMock /> },
  { key: "therapist", name: "MC Trade Therapist", tagline: "A deterministic coach that talks back, built on your own trades.", section: "Mindset", href: "/trade-therapist", icon: MessageSquareHeart, mock: <TherapistMock /> },
  { key: "strategy", name: "My Strategy", tagline: "Pressure-test your edge before you risk a cent on it.", section: "Mindset", href: "/strategy", icon: Target, mock: <StrategyMock /> },
  { key: "option-flow", name: "Option Flow", tagline: "See where the size is really positioned, strike by strike.", section: "Trading", href: "/option-flow", icon: Activity, mock: <OptionFlowMock /> },
];

export function Showcase() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const item = ITEMS[active];

  // Gentle auto-advance so the section feels alive; pauses on interaction.
  useEffect(() => {
    if (paused) return;
    const t = setTimeout(() => setActive((i) => (i + 1) % ITEMS.length), 6000);
    return () => clearTimeout(t);
  }, [active, paused]);

  return (
    <section id="product" className="scroll-mt-14" style={{ background: "#0B1120" }}>
      <div className="h-px w-full" style={{ background: "rgba(248,250,252,0.08)" }} />

      <div className="mx-auto w-full max-w-7xl px-6 sm:px-10 py-20 sm:py-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className="text-center mb-12"
        >
          <p style={{ fontFamily: NUNITO, fontSize: "0.625rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.22em", color: "rgba(248,250,252,0.45)" }}>
            The workspace
          </p>
          <h2 className="mt-3 font-black tracking-tight leading-[0.95]" style={{ fontFamily: NUNITO, fontSize: "clamp(2rem,5vw,3.2rem)", color: "rgba(248,250,252,0.94)" }}>
            Every tool, one platform.
          </h2>
          <p className="mt-4 mx-auto max-w-md leading-relaxed" style={{ fontFamily: NUNITO, fontSize: "0.95rem", color: "rgba(248,250,252,0.55)" }}>
            Click through the whole platform. Real screenshots where it counts, live mock data where it moves.
          </p>
        </motion.div>

        <div
          className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)] items-start"
          onMouseEnter={() => setPaused(true)}
          onFocusCapture={() => setPaused(true)}
        >
          {/* Feature list */}
          <div className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {ITEMS.map((it, i) => {
              const on = i === active;
              const Icon = it.icon;
              return (
                <button
                  key={it.key}
                  onClick={() => setActive(i)}
                  className="relative shrink-0 lg:shrink text-left rounded-xl px-3.5 py-3 transition-colors"
                  style={{ minWidth: 200 }}
                >
                  {on && (
                    <motion.span
                      layoutId="showcase-active"
                      className="absolute inset-0 rounded-xl overflow-hidden"
                      style={{
                        background: "linear-gradient(150deg, rgba(20,184,166,0.22), rgba(6,182,212,0.08))",
                        border: "1px solid rgba(20,184,166,0.40)",
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.14), 0 4px 18px rgba(20,184,166,0.16)",
                        backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
                      }}
                      transition={{ type: "spring", stiffness: 460, damping: 36 }}
                    >
                      <motion.span aria-hidden className="absolute inset-y-0 -left-1/3 w-1/2"
                        style={{ background: "linear-gradient(105deg, transparent, rgba(255,255,255,0.22), transparent)" }}
                        animate={{ x: ["-40%", "260%"] }} transition={{ duration: 2.6, ease: "easeInOut", repeat: Infinity, repeatDelay: 1.6 }} />
                    </motion.span>
                  )}
                  <span className="relative z-10 flex items-center gap-2.5">
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="min-w-0">
                      <span className="block text-sm font-bold leading-tight truncate" style={{ fontFamily: NUNITO, color: on ? "rgba(248,250,252,0.96)" : "rgba(248,250,252,0.66)" }}>{it.name}</span>
                      <span className="block text-[10px] font-semibold uppercase tracking-wider" style={{ color: on ? TURQ : "rgba(248,250,252,0.32)" }}>{it.section}</span>
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Preview stage */}
          <div>
            <div
              className="relative w-full overflow-hidden rounded-2xl"
              style={{ boxShadow: "0 0 0 1.5px rgba(20,184,166,0.24), 0 0 30px rgba(20,184,166,0.10), 0 20px 60px rgba(0,0,0,0.5)", background: "#0d1526" }}
            >
              {/* App window titlebar */}
              <div className="flex items-center gap-2 px-4 h-9 border-b" style={{ borderColor: "rgba(248,250,252,0.08)", background: "rgba(255,255,255,0.02)" }}>
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: RED, opacity: 0.7 }} />
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: AMBER, opacity: 0.7 }} />
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: GREEN, opacity: 0.7 }} />
                <span className="mx-auto flex items-center gap-1.5 rounded-md px-3 py-1 text-[11px] font-medium" style={{ fontFamily: NUNITO, background: "rgba(248,250,252,0.05)", color: "rgba(248,250,252,0.5)" }}>
                  tradingmc.app{item.href.startsWith("/features/") ? item.href.replace("/features", "") : item.href}
                </span>
              </div>

              <div className="relative">
                {/* Keyed fade — remounts on switch, so it can never deadlock the
                    way AnimatePresence mode="wait" can when switches pile up. */}
                <motion.div
                  key={item.key}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                >
                  {item.screenshot ? (
                    <div className="relative w-full" style={{ aspectRatio: "16 / 9" }}>
                      <Image src={item.screenshot} alt={`${item.name} screenshot`} fill sizes="(max-width:1024px) 100vw, 65vw" quality={90} className="object-cover object-top" priority={active === 0} />
                    </div>
                  ) : (
                    <div className="w-full" style={{ aspectRatio: "16 / 9" }}>{item.mock}</div>
                  )}
                </motion.div>
              </div>
            </div>

            {/* Caption + CTA */}
            <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
              <div className="min-w-0">
                <h3 className="font-black tracking-tight" style={{ fontFamily: NUNITO, fontSize: "clamp(1.4rem,3vw,2rem)", color: "rgba(248,250,252,0.94)" }}>{item.name}</h3>
                <p className="mt-1 max-w-md leading-relaxed" style={{ fontFamily: NUNITO, fontSize: "0.95rem", color: "rgba(248,250,252,0.6)" }}>{item.tagline}</p>
              </div>
              <Link href={item.href} className="shrink-0 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
                style={{ fontFamily: NUNITO, background: "linear-gradient(135deg,#14B8A6 0%,#0D9488 100%)", boxShadow: "0 4px 22px rgba(20,184,166,0.32)" }}>
                {item.screenshot ? "Learn more" : "Open it"} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ══ Interactive mock widgets (mock data, real interaction) ══════════════ */

function MockShell({ children }: { children: React.ReactNode }) {
  return <div className="h-full w-full p-5 sm:p-7 overflow-hidden" style={{ fontFamily: NUNITO }}>{children}</div>;
}

function MindscoreMock() {
  const periods = [
    { label: "Week", total: 72 },
    { label: "Month", total: 78 },
    { label: "All", total: 69 },
  ];
  const [p, setP] = useState(1);
  const total = periods[p].total;
  const comps = [
    { label: "Rule adherence", v: 84, c: TURQ },
    { label: "Habit consistency", v: 71, c: CYAN },
    { label: "Commitment adherence", v: 66, c: GREEN },
  ];
  const R = 52, C = 2 * Math.PI * R;
  return (
    <MockShell>
      <div className="flex h-full items-center gap-6 sm:gap-10">
        <div className="relative shrink-0" style={{ width: 140, height: 140 }}>
          <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
            <circle cx="70" cy="70" r={R} fill="none" stroke="rgba(248,250,252,0.10)" strokeWidth="10" />
            <motion.circle cx="70" cy="70" r={R} fill="none" stroke={TURQ} strokeWidth="10" strokeLinecap="round"
              strokeDasharray={C} animate={{ strokeDashoffset: C - (total / 100) * C }} transition={{ type: "spring", stiffness: 90, damping: 18 }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span key={total} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-black tabular-nums" style={{ color: "rgba(248,250,252,0.95)" }}>{total}</motion.span>
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: TURQ }}>Mindscore</span>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex gap-1.5 mb-4">
            {periods.map((pd, i) => (
              <button key={pd.label} onClick={() => setP(i)} className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
                style={i === p ? { background: "rgba(20,184,166,0.18)", color: "rgba(248,250,252,0.95)", border: "1px solid rgba(20,184,166,0.4)" } : { color: "rgba(248,250,252,0.5)", border: "1px solid rgba(248,250,252,0.12)" }}>
                {pd.label}
              </button>
            ))}
          </div>
          <div className="space-y-3">
            {comps.map((cmp) => (
              <div key={cmp.label}>
                <div className="flex items-center justify-between text-xs mb-1" style={{ color: "rgba(248,250,252,0.7)" }}>
                  <span>{cmp.label}</span><span className="tabular-nums font-semibold">{cmp.v}%</span>
                </div>
                <div className="h-1.5 rounded-full" style={{ background: "rgba(248,250,252,0.1)" }}>
                  <motion.div className="h-full rounded-full" style={{ background: cmp.c }} initial={{ width: 0 }} whileInView={{ width: `${cmp.v}%` }} viewport={{ once: true }} transition={{ duration: 0.8, ease: "easeOut" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MockShell>
  );
}

function TherapistMock() {
  const tags = ["Calm", "Anxious", "Frustrated", "Rushed"];
  const [picked, setPicked] = useState<string | null>(null);
  return (
    <MockShell>
      <div className="flex h-full flex-col justify-center gap-3 max-w-xl mx-auto">
        <Bubble side="left">You re-entered 8 min after a −1.0R loss on NQ, and the R target ran above your average. Does that read true for this trade?</Bubble>
        {picked && <Bubble side="right">{picked}</Bubble>}
        {!picked ? (
          <div className="flex flex-wrap gap-1.5 pl-9">
            {tags.map((t) => (
              <button key={t} onClick={() => setPicked(t)} className="rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
                style={{ color: "rgba(248,250,252,0.7)", border: "1px solid rgba(248,250,252,0.14)", background: "rgba(248,250,252,0.04)" }}>
                {t}
              </button>
            ))}
          </div>
        ) : (
          <Bubble side="left">That pattern has cost you <b style={{ color: RED }}>−7.0R</b> across 5 trades. Seeing the run laid out like that, what is the one thing you keep repeating?</Bubble>
        )}
      </div>
    </MockShell>
  );
}

function Bubble({ side, children }: { side: "left" | "right"; children: React.ReactNode }) {
  const left = side === "left";
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
      className={left ? "flex gap-2.5" : "flex justify-end"}>
      {left && <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full" style={{ background: "rgba(20,184,166,0.16)" }}><Brain className="h-3.5 w-3.5" style={{ color: TURQ }} /></span>}
      <span className="inline-block rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed max-w-[42ch]"
        style={left ? { background: "rgba(248,250,252,0.06)", color: "rgba(248,250,252,0.9)", borderTopLeftRadius: 4 } : { background: TURQ, color: "#04241f", borderTopRightRadius: 4, fontWeight: 600 }}>
        {children}
      </span>
    </motion.div>
  );
}

function StrategyMock() {
  const scenarios = [
    { key: "base", label: "Current edge", win: 0.52, path: equity(0.52) },
    { key: "plus", label: "+1 rule", win: 0.58, path: equity(0.58) },
  ];
  const [s, setS] = useState(0);
  const sc = scenarios[s];
  return (
    <MockShell>
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "rgba(248,250,252,0.5)" }}>Monte Carlo · 200 runs</p>
            <p className="text-sm mt-0.5" style={{ color: "rgba(248,250,252,0.8)" }}>Win rate <b style={{ color: TURQ }}>{Math.round(sc.win * 100)}%</b></p>
          </div>
          <div className="flex gap-1.5">
            {scenarios.map((x, i) => (
              <button key={x.key} onClick={() => setS(i)} className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
                style={i === s ? { background: "rgba(20,184,166,0.18)", color: "rgba(248,250,252,0.95)", border: "1px solid rgba(20,184,166,0.4)" } : { color: "rgba(248,250,252,0.5)", border: "1px solid rgba(248,250,252,0.12)" }}>
                {x.label}
              </button>
            ))}
          </div>
        </div>
        <div className="relative flex-1">
          <svg viewBox="0 0 400 160" preserveAspectRatio="none" className="h-full w-full">
            <line x1="0" y1="120" x2="400" y2="120" stroke="rgba(248,250,252,0.12)" strokeDasharray="3 4" />
            <motion.path key={sc.key} d={sc.path} fill="none" stroke={sc.win >= 0.55 ? GREEN : CYAN} strokeWidth="2.5"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9, ease: "easeOut" }} />
          </svg>
        </div>
      </div>
    </MockShell>
  );
}

// A gently rising, jagged equity path seeded by win rate.
function equity(win: number): string {
  let y = 130;
  const pts: string[] = [`M 0 ${y}`];
  for (let i = 1; i <= 20; i++) {
    y -= (win - 0.5) * 24 + (Math.sin(i * 1.7) * 6);
    y = Math.max(18, Math.min(150, y));
    pts.push(`L ${i * 20} ${y.toFixed(1)}`);
  }
  return pts.join(" ");
}

function OptionFlowMock() {
  const data: Record<string, { strike: string; call: number; put: number }[]> = {
    NQ: [
      { strike: "20800", call: 34, put: 12 }, { strike: "20900", call: 58, put: 20 },
      { strike: "21000", call: 82, put: 41 }, { strike: "21100", call: 47, put: 63 }, { strike: "21200", call: 22, put: 78 },
    ],
    GC: [
      { strike: "2680", call: 41, put: 18 }, { strike: "2700", call: 66, put: 29 },
      { strike: "2720", call: 88, put: 44 }, { strike: "2740", call: 39, put: 71 }, { strike: "2760", call: 19, put: 84 },
    ],
  };
  const [inst, setInst] = useState<"NQ" | "GC">("NQ");
  const rows = data[inst];
  const max = Math.max(...rows.flatMap((r) => [r.call, r.put]));
  return (
    <MockShell>
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "rgba(248,250,252,0.5)" }}>Dealer positioning</p>
          <div className="flex gap-1.5">
            {(["NQ", "GC"] as const).map((x) => (
              <button key={x} onClick={() => setInst(x)} className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
                style={inst === x ? { background: "rgba(20,184,166,0.18)", color: "rgba(248,250,252,0.95)", border: "1px solid rgba(20,184,166,0.4)" } : { color: "rgba(248,250,252,0.5)", border: "1px solid rgba(248,250,252,0.12)" }}>
                {x}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 flex flex-col justify-center gap-2">
          {rows.map((r) => (
            <div key={r.strike} className="grid grid-cols-[1fr_48px_1fr] items-center gap-2 text-[11px]">
              <div className="flex justify-end">
                <motion.div className="h-3.5 rounded-l-sm" style={{ background: "rgba(34,197,94,0.75)" }}
                  initial={{ width: 0 }} animate={{ width: `${(r.call / max) * 100}%` }} transition={{ duration: 0.5 }} />
              </div>
              <span className="text-center tabular-nums font-semibold" style={{ color: "rgba(248,250,252,0.65)" }}>{r.strike}</span>
              <div className="flex justify-start">
                <motion.div className="h-3.5 rounded-r-sm" style={{ background: "rgba(239,68,68,0.72)" }}
                  initial={{ width: 0 }} animate={{ width: `${(r.put / max) * 100}%` }} transition={{ duration: 0.5 }} />
              </div>
            </div>
          ))}
          <div className="grid grid-cols-[1fr_48px_1fr] text-[10px] font-bold uppercase tracking-wider mt-1" style={{ color: "rgba(248,250,252,0.4)" }}>
            <span className="text-right pr-1" style={{ color: GREEN }}>Calls</span><span />
            <span className="pl-1" style={{ color: RED }}>Puts</span>
          </div>
        </div>
      </div>
    </MockShell>
  );
}
