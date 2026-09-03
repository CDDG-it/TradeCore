"use client";

/**
 * Product explorer — the section between the hero and the flip cards.
 *
 * Rather than describing the five tools in prose, each one ships a small
 * working model of what it actually does: move the win rate and watch
 * expectancy flip negative, tick habits and watch a Mindscore climb, clear a
 * rule checklist before the gate opens. The numbers are illustrative and the
 * panel says so — nothing here is presented as a real trader's results.
 */

import { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const TURQUOISE = "#14B8A6";
const CYAN = "#06B6D4";
const GREEN = "#22c55e";
const RED = "#ef4444";

type ToolKey = "dashboard" | "mind-edge" | "therapist" | "strategy" | "markets";

interface Tool {
  key: ToolKey;
  name: string;
  label: string;
  tagline: string;
  href: string;
  /** What the reader should try in the panel. */
  invite: string;
}

const TOOLS: Tool[] = [
  {
    key: "dashboard",
    name: "Dashboard",
    label: "Overview",
    tagline: "Your whole trading day on one screen.",
    href: "/features/dashboard",
    invite: "Drag the win rate — watch where the edge turns.",
  },
  {
    key: "mind-edge",
    name: "MC Mind Edge",
    label: "Mindset",
    tagline: "One number for how ready you are to trade.",
    href: "/features/psychological-edge",
    invite: "Tick the routines you actually kept.",
  },
  {
    key: "therapist",
    name: "MC Trade Therapist",
    label: "Mindset",
    tagline: "A coach that talks back, built from your own trades.",
    href: "/features/trade-therapist",
    invite: "Pick the mistake and see what it asks you.",
  },
  {
    key: "strategy",
    name: "My Strategy",
    label: "Trading",
    tagline: "Your playbook and rules, written down and in reach.",
    href: "/features/strategy",
    invite: "Clear the checklist to open the gate.",
  },
  {
    key: "markets",
    name: "MC News Dashboard",
    label: "Markets",
    tagline: "See what is actually moving the market.",
    href: "/features/news-city",
    invite: "Filter down to what would move your instrument.",
  },
];

export function ProductExplorer() {
  const [active, setActive] = useState<ToolKey>("dashboard");
  const tool = TOOLS.find((t) => t.key === active)!;
  const reduce = useReducedMotion();

  return (
    <section id="features" className="relative bg-background px-6 py-24 md:px-10 md:py-32">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="max-w-3xl">
          <p className="font-body text-[13px] font-semibold text-primary">Inside the platform</p>
          <h2
            className="mt-5 font-heading font-black tracking-tight text-foreground"
            style={{ fontSize: "clamp(2rem,4.6vw,3.25rem)", lineHeight: 1.05 }}
          >
            Five instruments. Try them here.
          </h2>
          <p className="mt-5 max-w-xl font-body text-[0.95rem] leading-relaxed text-muted-foreground">
            Each panel below is a working model of the real thing. Move the
            controls and watch the numbers respond — the same logic runs inside
            the product, against your own history.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,17rem)_1fr] lg:gap-10">
          {/* Tool selector */}
          <nav
            aria-label="Choose a tool"
            className="-mx-6 flex gap-2 overflow-x-auto px-6 pb-2 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0"
          >
            {TOOLS.map((t) => {
              const on = t.key === active;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setActive(t.key)}
                  aria-pressed={on}
                  className={cn(
                    "group relative shrink-0 rounded-xl border px-4 py-3 text-left transition-colors lg:shrink",
                    on
                      ? "border-primary/50 bg-primary/[0.07]"
                      : "border-border/60 hover:border-border hover:bg-muted/20"
                  )}
                >
                  {on && (
                    <motion.span
                      layoutId="explorer-spine"
                      aria-hidden
                      className="absolute inset-y-2 left-0 w-0.5 rounded-full"
                      style={{ background: TURQUOISE }}
                      transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }}
                    />
                  )}
                  <span className="block font-body text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                    {t.label}
                  </span>
                  <span
                    className={cn(
                      "mt-1 block whitespace-nowrap font-heading text-[0.95rem] font-bold tracking-tight lg:whitespace-normal",
                      on ? "text-foreground" : "text-foreground/75"
                    )}
                  >
                    {t.name}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Active panel.
              Keyed on the tool so React remounts and the enter animation
              replays. Deliberately no AnimatePresence: an exit animation buys
              nothing here, and `mode="wait"` stalls the swap outright if an
              exit never resolves — which left the panel frozen on the previous
              tool while the nav already showed the new one selected. */}
          <div className="rounded-2xl border border-border/60 bg-card p-5 sm:p-7">
            <div>
              <motion.div
                key={active}
                initial={reduce ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: reduce ? 0 : 0.24, ease: [0.16, 1, 0.3, 1] }}
              >
                <h3 className="font-heading text-xl font-black tracking-tight text-foreground">{tool.name}</h3>
                <p className="mt-2 font-body text-[0.95rem] leading-relaxed text-foreground/70">{tool.tagline}</p>
                <p className="mt-4 font-body text-xs font-semibold text-primary">{tool.invite}</p>

                <div className="mt-6">
                  {active === "dashboard" && <EdgeDemo />}
                  {active === "mind-edge" && <MindscoreDemo />}
                  {active === "therapist" && <TherapistDemo />}
                  {active === "strategy" && <ChecklistDemo />}
                  {active === "markets" && <MarketsDemo />}
                </div>

                <div className="mt-7 flex items-center justify-between gap-4 border-t border-border/50 pt-5">
                  <p className="font-body text-[11px] text-muted-foreground/70">
                    Illustrative figures — the product runs this on your own trades.
                  </p>
                  <Link
                    href={tool.href}
                    className="group inline-flex shrink-0 items-center gap-1.5 font-body text-sm font-semibold text-primary transition-colors hover:text-foreground"
                  >
                    Explore
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Shared bits ─────────────────────────────────────────────────────────── */

function Readout({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-lg border border-border/50 bg-background/40 px-3 py-2.5">
      <p className="font-body text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{label}</p>
      <p
        className="mt-1 font-heading text-lg font-black tabular-nums leading-none"
        style={{ color: tone ?? "var(--foreground)" }}
      >
        {value}
      </p>
    </div>
  );
}

/* ── 1. Dashboard — where does the edge turn? ────────────────────────────── */

function EdgeDemo() {
  const [wr, setWr] = useState(45);
  const rr = 2;
  // Expectancy in R for a fixed 2R winner and a 1R loser.
  const expectancy = (wr / 100) * rr - (1 - wr / 100);
  const positive = expectancy > 0;
  const R = 42;
  const C = 2 * Math.PI * R;

  return (
    <div className="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
      <div className="relative mx-auto h-[132px] w-[132px] sm:mx-0">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r={R} fill="none" stroke="var(--border)" strokeWidth="9" />
          <circle
            cx="50"
            cy="50"
            r={R}
            fill="none"
            stroke={positive ? GREEN : RED}
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={`${(wr / 100) * C} ${C}`}
            style={{ transition: "stroke-dasharray 160ms linear, stroke 200ms ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-heading text-2xl font-black tabular-nums leading-none" style={{ color: CYAN }}>
            {wr}%
          </span>
          <span className="mt-1 font-body text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
            win rate
          </span>
        </div>
      </div>

      <div>
        <label className="block">
          <span className="font-body text-xs font-semibold text-muted-foreground">Win rate</span>
          <input
            type="range"
            min={10}
            max={90}
            value={wr}
            onChange={(e) => setWr(Number(e.target.value))}
            aria-label="Win rate"
            className="mc-range mt-2 w-full"
          />
        </label>

        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <Readout label="Reward : risk" value={`${rr}R`} />
          <Readout
            label="Per-trade edge"
            value={`${expectancy >= 0 ? "+" : ""}${expectancy.toFixed(2)}R`}
            tone={positive ? GREEN : RED}
          />
        </div>
        <p className="mt-3 font-body text-xs leading-relaxed text-muted-foreground">
          {positive
            ? `At ${wr}% with a ${rr}R target, every trade is worth +${expectancy.toFixed(2)}R on average.`
            : `At ${wr}% a ${rr}R target still loses ${Math.abs(expectancy).toFixed(2)}R per trade. The dashboard shows you this before the account does.`}
        </p>
      </div>
    </div>
  );
}

/* ── 2. Mind Edge — the score is built, not claimed ──────────────────────── */

const ROUTINES = [
  { id: "prep", label: "Pre-market prep", weight: 22 },
  { id: "sleep", label: "7h+ sleep", weight: 18 },
  { id: "journal", label: "Journalled every trade", weight: 24 },
  { id: "rules", label: "No rule broken", weight: 26 },
];

function MindscoreDemo() {
  const [on, setOn] = useState<string[]>(["prep", "journal"]);
  const score = 10 + ROUTINES.filter((r) => on.includes(r.id)).reduce((s, r) => s + r.weight, 0);
  const band = score >= 80 ? "Locked in" : score >= 55 ? "Holding" : "Slipping";
  const tone = score >= 80 ? GREEN : score >= 55 ? TURQUOISE : RED;

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="font-heading text-3xl font-black tabular-nums leading-none" style={{ color: tone }}>
            {score}
          </p>
          <p className="mt-1.5 font-body text-xs font-semibold" style={{ color: tone }}>
            {band}
          </p>
        </div>
        <p className="max-w-[16rem] text-right font-body text-[11px] leading-relaxed text-muted-foreground">
          Your Mindscore is the sum of what you actually did, not how you felt about it.
        </p>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted-foreground/12">
        <div
          className="h-full rounded-full"
          style={{ width: `${score}%`, background: tone, transition: "width 320ms cubic-bezier(0.16,1,0.3,1), background 220ms ease" }}
        />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {ROUTINES.map((r) => {
          const isOn = on.includes(r.id);
          return (
            <button
              key={r.id}
              type="button"
              aria-pressed={isOn}
              onClick={() => setOn((p) => (isOn ? p.filter((x) => x !== r.id) : [...p, r.id]))}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg border px-3 py-2 font-body text-xs font-semibold transition-colors",
                isOn
                  ? "border-primary/50 bg-primary/10 text-foreground"
                  : "border-border/60 text-muted-foreground hover:border-border hover:text-foreground"
              )}
            >
              <span
                className={cn(
                  "flex h-3.5 w-3.5 items-center justify-center rounded-[4px] border transition-colors",
                  isOn ? "border-primary bg-primary" : "border-border"
                )}
              >
                {isOn && <Check className="h-2.5 w-2.5 text-primary-foreground" strokeWidth={3.5} />}
              </span>
              {r.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── 3. Trade Therapist — the prompt is anchored to the mistake ──────────── */

const PATTERNS = [
  {
    id: "size",
    chip: "Sized up after two wins",
    prompt: "You added size on trade three of a green run, then gave back both winners. What told you the third setup deserved more risk than the first two?",
    commit: "Risk stays fixed for the whole session, win or lose.",
  },
  {
    id: "chase",
    chip: "Chased the breakout",
    prompt: "You entered 14 points above your own level because it left without you. What does waiting for the retest actually cost you across a month?",
    commit: "No entry until price comes back to the level.",
  },
  {
    id: "revenge",
    chip: "Re-entered within 90s of a loss",
    prompt: "The next trade came 90 seconds after a full stop-out. Was that the setup arriving, or the loss still talking?",
    commit: "Fifteen minutes away from the screen after any loss.",
  },
];

function TherapistDemo() {
  const [id, setId] = useState(PATTERNS[0].id);
  const p = PATTERNS.find((x) => x.id === id)!;

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {PATTERNS.map((x) => (
          <button
            key={x.id}
            type="button"
            aria-pressed={x.id === id}
            onClick={() => setId(x.id)}
            className={cn(
              "rounded-lg border px-3 py-2 font-body text-xs font-semibold transition-colors",
              x.id === id
                ? "border-destructive/50 bg-destructive/10 text-foreground"
                : "border-border/60 text-muted-foreground hover:border-border hover:text-foreground"
            )}
          >
            {x.chip}
          </button>
        ))}
      </div>

      <motion.div
        key={p.id}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="mt-5 rounded-xl border border-border/50 bg-background/40 p-4"
      >
        <p className="font-body text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
          It asks
        </p>
        <p className="mt-2 font-body text-[0.95rem] leading-relaxed text-foreground/90">{p.prompt}</p>

        <div className="mt-4 border-t border-border/40 pt-3">
          <p className="font-body text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            You commit to
          </p>
          <p className="mt-1.5 inline-flex items-center gap-2 font-body text-sm font-semibold text-primary">
            <Check className="h-3.5 w-3.5" strokeWidth={3} />
            {p.commit}
          </p>
        </div>
      </motion.div>
    </div>
  );
}

/* ── 4. My Strategy — the gate only opens when the rules are met ─────────── */

const RULES = [
  "Pre-market analysis written",
  "Level marked and confirmed",
  "Risk set to 1R",
  "Not inside a news window",
];

function ChecklistDemo() {
  const [done, setDone] = useState<number[]>([0]);
  const cleared = done.length === RULES.length;

  return (
    <div>
      <ul className="divide-y divide-border/40 border-y border-border/40">
        {RULES.map((r, i) => {
          const on = done.includes(i);
          return (
            <li key={r}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => setDone((p) => (on ? p.filter((x) => x !== i) : [...p, i]))}
                className="flex w-full items-center gap-3 py-3 text-left transition-colors hover:bg-muted/20"
              >
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                    on ? "border-primary bg-primary" : "border-border"
                  )}
                >
                  {on && <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3.5} />}
                </span>
                <span
                  className={cn(
                    "font-body text-sm transition-colors",
                    on ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {r}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div
        className="mt-5 flex items-center justify-between gap-4 rounded-xl border px-4 py-3 transition-colors"
        style={{
          borderColor: cleared ? "rgba(34,197,94,0.4)" : "var(--border)",
          background: cleared ? "rgba(34,197,94,0.08)" : "transparent",
        }}
      >
        <span
          className="font-heading text-sm font-bold"
          style={{ color: cleared ? GREEN : "var(--muted-foreground)" }}
        >
          {cleared ? "Cleared to trade" : `${RULES.length - done.length} to go`}
        </span>
        <span className="font-body text-[11px] text-muted-foreground">
          {cleared ? "Every rule met." : "The gate stays shut until the checklist is clean."}
        </span>
      </div>
    </div>
  );
}

/* ── 5. News Dashboard — filter to what moves your instrument ────────────── */

const SIGNALS = [
  { title: "FOMC minutes released", cat: "Central banks", impact: "High", dir: 1 },
  { title: "Crude inventories build", cat: "Commodities", impact: "High", dir: -1 },
  { title: "Regional PMI revision", cat: "Macro", impact: "Low", dir: 1 },
  { title: "Semiconductor earnings beat", cat: "Earnings", impact: "Medium", dir: 1 },
  { title: "Jobless claims in line", cat: "Macro", impact: "Low", dir: 0 },
];

function MarketsDemo() {
  const [onlyHigh, setOnlyHigh] = useState(false);
  const rows = onlyHigh ? SIGNALS.filter((s) => s.impact === "High") : SIGNALS;

  return (
    <div>
      <div className="flex items-center gap-2">
        {[
          { label: "Everything", v: false },
          { label: "High impact only", v: true },
        ].map((o) => (
          <button
            key={o.label}
            type="button"
            aria-pressed={onlyHigh === o.v}
            onClick={() => setOnlyHigh(o.v)}
            className={cn(
              "rounded-lg border px-3 py-1.5 font-body text-xs font-semibold transition-colors",
              onlyHigh === o.v
                ? "border-primary/50 bg-primary/10 text-foreground"
                : "border-border/60 text-muted-foreground hover:border-border hover:text-foreground"
            )}
          >
            {o.label}
          </button>
        ))}
        <span className="ml-auto font-body text-[11px] tabular-nums text-muted-foreground">
          {rows.length} of {SIGNALS.length}
        </span>
      </div>

      {/* Plain list: a nested AnimatePresence here could stall the panel swap
          above it, and the filter reads clearly without row exit animations. */}
      <ul className="mt-4 divide-y divide-border/40 border-y border-border/40">
          {rows.map((s) => (
            <li
              key={s.title}
              className="flex items-center gap-3 py-2.5"
            >
              <span
                aria-hidden
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: s.dir > 0 ? GREEN : s.dir < 0 ? RED : "var(--muted-foreground)" }}
              />
              <span className="min-w-0 flex-1 font-body text-sm text-foreground/90">{s.title}</span>
              <span className="hidden shrink-0 font-body text-[11px] text-muted-foreground sm:inline">{s.cat}</span>
              <span
                className={cn(
                  "shrink-0 rounded px-1.5 py-0.5 font-body text-[10px] font-bold",
                  s.impact === "High"
                    ? "bg-destructive/12 text-destructive"
                    : s.impact === "Medium"
                    ? "bg-warning/12 text-warning"
                    : "bg-muted/50 text-muted-foreground"
                )}
              >
                {s.impact}
              </span>
            </li>
          ))}
      </ul>
    </div>
  );
}
