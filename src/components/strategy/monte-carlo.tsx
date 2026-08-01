"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine,
  BarChart, Bar, Cell,
} from "recharts";
import { Check, Loader2, Save, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { runMonteCarlo, type MonteCarloInputs, type DrawdownMode } from "@/lib/strategy/monte-carlo";
import { getTrades, getMonteCarloSettings, saveMonteCarloSettings } from "@/lib/supabase/queries";

const GREEN = "#22c55e";
const RED = "#ef4444";
const AMBER = "#f59e0b";
const CYAN = "#06B6D4";

/** Representative prop-firm setups. Numbers are typical, round starting points —
 *  every field stays editable, so a trader dials in their own firm's exact rules. */
interface Preset extends Omit<MonteCarloInputs, "winRate" | "rewardRisk" | "tradesPerDay" | "simulations" | "sampleCurves"> {
  key: string;
  label: string;
}

const PRESETS: Preset[] = [
  { key: "eval-50", label: "50K Eval", accountSize: 50000, profitTarget: 3000, maxDrawdown: 2000, drawdownMode: "trailing", dailyLossLimit: 1000, riskPerTrade: 300, maxDays: 20 },
  { key: "eval-100", label: "100K Eval", accountSize: 100000, profitTarget: 6000, maxDrawdown: 3000, drawdownMode: "trailing", dailyLossLimit: 2000, riskPerTrade: 500, maxDays: 20 },
  { key: "eval-150", label: "150K Eval", accountSize: 150000, profitTarget: 9000, maxDrawdown: 4500, drawdownMode: "trailing", dailyLossLimit: 3000, riskPerTrade: 750, maxDays: 20 },
];

const DEFAULTS: MonteCarloInputs = {
  ...PRESETS[0],
  winRate: 0.45,
  rewardRisk: 2,
  tradesPerDay: 3,
  simulations: 3000,
  sampleCurves: 14,
};

function pct(n: number) {
  return `${(n * 100).toFixed(1)}%`;
}

function money(n: number) {
  return `$${Math.round(n).toLocaleString()}`;
}

/** Downsample a curve to at most `max` points so the chart stays crisp. */
function thin<T>(arr: T[], max: number): T[] {
  if (arr.length <= max) return arr;
  const step = arr.length / max;
  const out: T[] = [];
  for (let i = 0; i < max; i++) out.push(arr[Math.floor(i * step)]);
  out.push(arr[arr.length - 1]);
  return out;
}

/** Win rate + reward:risk pulled from the trader's real journal — the same
 *  figures the Analytics page reports, measured over decisive (win/loss) trades. */
interface RealStats { winRate: number; avgRR: number; decisive: number; total: number }

export function MonteCarloSimulator() {
  const [input, setInput] = useState<MonteCarloInputs>(DEFAULTS);
  const [activePreset, setActivePreset] = useState<string>(PRESETS[0].key);
  const [realStats, setRealStats] = useState<RealStats | null>(null);
  const [appliedStats, setAppliedStats] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  // Load any saved setup and compute the trader's real edge from their journal.
  useEffect(() => {
    let active = true;
    (async () => {
      const [saved, trades] = await Promise.all([getMonteCarloSettings(), getTrades()]);
      if (!active) return;
      if (saved) setInput((prev) => ({ ...prev, ...saved }));
      const wins = trades.filter((t) => t.result === "win");
      const losses = trades.filter((t) => t.result === "loss");
      const decisive = wins.length + losses.length;
      if (decisive > 0) {
        const avgRR = wins.length > 0 ? Math.round((wins.reduce((s, t) => s + t.rr, 0) / wins.length) * 100) / 100 : 0;
        setRealStats({ winRate: wins.length / decisive, avgRR, decisive, total: trades.length });
      }
    })();
    return () => { active = false; };
  }, []);

  const result = useMemo(() => runMonteCarlo(input), [input]);

  function set<K extends keyof MonteCarloInputs>(key: K, value: MonteCarloInputs[K]) {
    setInput((prev) => ({ ...prev, [key]: value }));
    setSaveState("idle");
    if (key === "winRate" || key === "rewardRisk") setAppliedStats(false);
  }

  /** Fill win rate + reward:risk from the real journal stats. */
  function applyRealStats() {
    if (!realStats) return;
    setInput((prev) => ({
      ...prev,
      winRate: Math.min(0.9, Math.max(0.1, realStats.winRate)),
      rewardRisk: realStats.avgRR > 0 ? realStats.avgRR : prev.rewardRisk,
    }));
    setAppliedStats(true);
    setSaveState("idle");
  }

  async function save() {
    setSaveState("saving");
    try {
      await saveMonteCarloSettings(input);
      setSaveState("saved");
      setTimeout(() => setSaveState((s) => (s === "saved" ? "idle" : s)), 2500);
    } catch {
      setSaveState("error");
    }
  }

  function applyPreset(p: Preset) {
    setActivePreset(p.key);
    setSaveState("idle");
    setInput((prev) => ({
      ...prev,
      accountSize: p.accountSize,
      profitTarget: p.profitTarget,
      maxDrawdown: p.maxDrawdown,
      drawdownMode: p.drawdownMode,
      dailyLossLimit: p.dailyLossLimit,
      riskPerTrade: p.riskPerTrade,
      maxDays: p.maxDays,
    }));
  }

  function reset() {
    setInput(DEFAULTS);
    setActivePreset(PRESETS[0].key);
    setSaveState("idle");
    setAppliedStats(false);
  }

  // Build aligned chart data for the sample equity curves.
  const curveData = useMemo(() => {
    const thinned = result.curves.map((c) => ({ outcome: c.outcome, balance: thin(c.balance, 120) }));
    const maxLen = thinned.reduce((m, c) => Math.max(m, c.balance.length), 0);
    const rows: Record<string, number | null>[] = [];
    for (let i = 0; i < maxLen; i++) {
      const row: Record<string, number | null> = { t: i };
      thinned.forEach((c, idx) => { row[`c${idx}`] = i < c.balance.length ? c.balance[i] : null; });
      rows.push(row);
    }
    return { rows, meta: thinned.map((c) => c.outcome) };
  }, [result.curves]);

  const target = input.accountSize + input.profitTarget;
  const floor = input.accountSize - input.maxDrawdown;
  const edgePositive = result.expectancyR > 0;

  return (
    <div className="space-y-5">
      {/* Header + data controls: pull your real edge, save your setup */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">MC Pass Simulation</h2>

        <div className="flex flex-wrap items-center gap-2">
          {/* Use your real win rate / R:R from Analytics */}
          <button
            type="button"
            onClick={applyRealStats}
            disabled={!realStats}
            title={realStats ? "Fill win rate & reward:risk from your journal" : "No decisive trades logged yet"}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-40",
              appliedStats
                ? "border-primary/50 bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
            )}
          >
            <Wand2 className="w-3.5 h-3.5" />
            {realStats
              ? <>Use my stats · <span className="tabular-nums text-foreground">{pct(realStats.winRate)}</span>{realStats.avgRR > 0 && <> · <span className="tabular-nums text-foreground">{realStats.avgRR}R</span></>}</>
              : "Use my stats"}
          </button>

          {/* Save this setup */}
          <button
            type="button"
            onClick={save}
            disabled={saveState === "saving"}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60",
              saveState === "saved" ? "border-success/50 bg-success/10 text-success"
                : saveState === "error" ? "border-destructive/50 bg-destructive/10 text-destructive"
                : "border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
            )}
          >
            {saveState === "saving" ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : saveState === "saved" ? <Check className="w-3.5 h-3.5" />
              : <Save className="w-3.5 h-3.5" />}
            {saveState === "saving" ? "Saving" : saveState === "saved" ? "Saved" : saveState === "error" ? "Run the SQL" : "Save setup"}
          </button>
        </div>
      </div>

      {realStats && (
        <p className="-mt-2 text-[11px] text-muted-foreground">
          {appliedStats
            ? <>Using your real edge — <span className="tabular-nums">{pct(realStats.winRate)}</span> win rate and <span className="tabular-nums">{realStats.avgRR || "—"}R</span> avg reward:risk over {realStats.decisive} decisive trade{realStats.decisive === 1 ? "" : "s"}.</>
            : <>Your journal shows <span className="tabular-nums text-foreground/80">{pct(realStats.winRate)}</span> win rate and <span className="tabular-nums text-foreground/80">{realStats.avgRR || "—"}R</span> avg reward:risk over {realStats.decisive} decisive trade{realStats.decisive === 1 ? "" : "s"}.</>}
        </p>
      )}

      {saveState === "error" && (
        <p className="-mt-2 text-[11px] text-destructive">
          Couldn&apos;t save — run <span className="font-mono">monte_carlo_settings.sql</span> in the Supabase SQL editor, then try again.
        </p>
      )}

      {/* Presets */}
      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => applyPreset(p)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
              activePreset === p.key
                ? "border-primary/50 bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
            )}
          >
            {p.label}
          </button>
        ))}
        <button
          type="button"
          onClick={reset}
          className="ml-auto rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Reset
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] items-start">
        {/* ── Controls ─────────────────────────────────────────── */}
        <div className="space-y-4 rounded-xl border border-border bg-card p-4">
          <FieldGroup title="Your edge">
            <SliderField label="Win rate" value={input.winRate * 100} min={10} max={90} step={1} unit="%"
              onChange={(v) => set("winRate", v / 100)} />
            <SliderField label="Reward : risk" value={input.rewardRisk} min={0.5} max={5} step={0.1} unit="R"
              onChange={(v) => set("rewardRisk", v)} />
            <div className="flex items-center justify-between text-xs pt-0.5">
              <span className="text-muted-foreground">Per-trade expectancy</span>
              <span className={cn("font-semibold tabular-nums", edgePositive ? "text-success" : "text-destructive")}>
                {result.expectancyR >= 0 ? "+" : ""}{result.expectancyR.toFixed(2)}R · {money(result.expectancyMoney)}
              </span>
            </div>
          </FieldGroup>

          <FieldGroup title="Risk & pace">
            <NumberField label="Risk per trade" value={input.riskPerTrade} unit="$" step={50}
              onChange={(v) => set("riskPerTrade", v)} />
            <NumberField label="Trades per day" value={input.tradesPerDay} step={1}
              onChange={(v) => set("tradesPerDay", Math.max(1, Math.round(v)))} />
          </FieldGroup>

          <FieldGroup title="Account rules">
            <NumberField label="Account size" value={input.accountSize} unit="$" step={5000}
              onChange={(v) => set("accountSize", v)} />
            <NumberField label="Profit target" value={input.profitTarget} unit="$" step={500}
              onChange={(v) => set("profitTarget", v)} />
            <NumberField label="Max drawdown" value={input.maxDrawdown} unit="$" step={250}
              onChange={(v) => set("maxDrawdown", v)} />
            <div className="space-y-1.5">
              <span className="text-xs text-muted-foreground">Drawdown type</span>
              <div className="flex rounded-lg border border-border overflow-hidden">
                {(["trailing", "static"] as DrawdownMode[]).map((m) => (
                  <button key={m} type="button" onClick={() => set("drawdownMode", m)}
                    className={cn("flex-1 px-3 py-1.5 text-xs font-semibold capitalize transition-colors",
                      input.drawdownMode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <NumberField label="Daily loss limit" value={input.dailyLossLimit} unit="$" step={250} hint="0 = off"
              onChange={(v) => set("dailyLossLimit", Math.max(0, v))} />
            <NumberField label="Deadline (days)" value={input.maxDays} step={1} hint="0 = no limit"
              onChange={(v) => set("maxDays", Math.max(0, Math.round(v)))} />
          </FieldGroup>

          <FieldGroup title="Simulation">
            <SliderField label="Runs" value={input.simulations} min={500} max={10000} step={500}
              onChange={(v) => set("simulations", Math.round(v))} />
          </FieldGroup>
        </div>

        {/* ── Results ──────────────────────────────────────────── */}
        <div className="space-y-4 min-w-0">
          {/* Headline read on the odds */}
          <div className="rounded-xl border border-primary/25 bg-primary/[0.06] px-4 py-3">
            <p className="text-sm leading-relaxed">
              Out of <span className="font-semibold tabular-nums">{input.simulations.toLocaleString()}</span> simulated attempts,
              you passed <span className="font-bold" style={{ color: GREEN }}>{pct(result.passRate)}</span> of the time.
              {result.medianDaysToPass !== null && <> Typical passing run took <span className="font-semibold tabular-nums">{result.medianDaysToPass} days</span>.</>}
              {" "}Think of it as roughly <span className="font-semibold tabular-nums">{Math.round(result.passRate * 100)} out of 100</span> tries clearing this evaluation.
            </p>
          </div>

          {/* Outcome cards */}
          <div className="grid grid-cols-3 gap-3">
            <OutcomeCard label="Pass rate" value={pct(result.passRate)} color={GREEN}
              hint="Reached the profit target" />
            <OutcomeCard label="Fail rate" value={pct(result.failRate)} color={RED}
              hint="Hit the drawdown / loss limit first" />
            <OutcomeCard label="Timed out" value={pct(result.timeoutRate)} color={AMBER}
              hint={input.maxDays > 0 ? `No result within ${input.maxDays} days` : "Neither target nor floor hit"} />
          </div>

          {/* Outcome bar */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-2">
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-border/60">
              <div className="h-full transition-all" style={{ width: pct(result.passRate), background: GREEN }} />
              <div className="h-full transition-all" style={{ width: pct(result.timeoutRate), background: AMBER }} />
              <div className="h-full transition-all" style={{ width: pct(result.failRate), background: RED }} />
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-medium">
              <span className="flex items-center gap-1.5"><Dot c={GREEN} /> Pass {pct(result.passRate)}</span>
              <span className="flex items-center gap-1.5"><Dot c={AMBER} /> Timeout {pct(result.timeoutRate)}</span>
              <span className="flex items-center gap-1.5"><Dot c={RED} /> Fail {pct(result.failRate)}</span>
              {result.medianDaysToPass !== null && (
                <span className="ml-auto text-muted-foreground">
                  Median pass in {result.medianDaysToPass} days
                </span>
              )}
            </div>
          </div>

          {!edgePositive && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-xs text-destructive">
              Negative expectancy — this edge loses money over a large sample.
            </div>
          )}

          {/* Equity curves */}
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="mb-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Sample equity paths · {curveData.meta.length} of {input.simulations.toLocaleString()} runs
              </p>
              <p className="text-[11px] text-muted-foreground/80 mt-1 leading-snug">
                Each line is one simulated attempt — same edge, a different order of wins and losses.
                <span style={{ color: GREEN }}> Green</span> hit the target,
                <span style={{ color: RED }}> red</span> breached the floor,
                <span style={{ color: AMBER }}> amber</span> ran out of time. The spread between them is your luck-of-the-draw risk.
              </p>
            </div>
            <div className="h-56 -ml-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={curveData.rows} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.01 252 / 0.3)" vertical={false} />
                  <XAxis dataKey="t" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false}
                    label={{ value: "trades", position: "insideBottomRight", offset: -2, fontSize: 9, fill: "var(--muted-foreground)" }} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false}
                    domain={["dataMin", "dataMax"]} width={52}
                    tickFormatter={(v: number) => `${Math.round(v / 1000)}k`} />
                  <ReferenceLine y={target} stroke={GREEN} strokeDasharray="4 3" strokeWidth={1.5} />
                  <ReferenceLine y={floor} stroke={RED} strokeDasharray="4 3" strokeWidth={1.5} />
                  <ReferenceLine y={input.accountSize} stroke="var(--border)" strokeDasharray="2 2" />
                  {curveData.meta.map((outcome, idx) => (
                    <Line key={idx} type="monotone" dataKey={`c${idx}`} dot={false} isAnimationActive={false}
                      connectNulls={false} strokeWidth={1.1}
                      stroke={outcome === "pass" ? GREEN : outcome === "fail" ? RED : AMBER}
                      strokeOpacity={0.55} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-4 text-[10px] text-muted-foreground mt-1">
              <span className="flex items-center gap-1"><span className="w-3 h-px" style={{ background: GREEN }} /> Target {money(target)}</span>
              <span className="flex items-center gap-1"><span className="w-3 h-px" style={{ background: RED }} /> Floor {money(floor)}</span>
            </div>
          </div>

          {/* Ending balance distribution */}
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Ending balance distribution
              </p>
              <div className="flex items-center gap-3 text-[11px] tabular-nums">
                <span className="text-muted-foreground">Median <span className="font-semibold text-foreground">{money(result.medianEndBalance)}</span></span>
                <span className="text-success">Best {money(result.bestEndBalance)}</span>
                <span className="text-destructive">Worst {money(result.worstEndBalance)}</span>
              </div>
            </div>
            <div className="h-40 -ml-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={result.histogram} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.01 252 / 0.3)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false}
                    interval={2} tickFormatter={(v: string) => `${Math.round(Number(v) / 1000)}k`} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} width={30} />
                  <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                    {result.histogram.map((h, i) => {
                      const mid = (h.from + h.to) / 2;
                      const c = mid >= target ? GREEN : mid <= floor ? RED : CYAN;
                      return <Cell key={i} fill={c} fillOpacity={0.85} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5 leading-snug">
              Where every run finished. Taller bars = more likely landing spots. The wider this spread, the more
              variance in your results — a tall stack near the target is a consistent edge.
              <span style={{ color: GREEN }}> Green</span> cleared the target,
              <span style={{ color: RED }}> red</span> fell below the drawdown floor.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Small building blocks ─────────────────────────────────────── */

function Dot({ c }: { c: string }) {
  return <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c }} />;
}

function FieldGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">{title}</p>
      {children}
    </div>
  );
}

function NumberField({
  label, value, onChange, unit, step = 1, hint,
}: {
  label: string; value: number; onChange: (v: number) => void; unit?: string; step?: number; hint?: string;
}) {
  return (
    <label className="flex items-center justify-between gap-3">
      <span className="text-xs text-muted-foreground min-w-0">
        {label}
        {hint && <span className="text-muted-foreground/50 ml-1">({hint})</span>}
      </span>
      <span className="relative shrink-0">
        {unit && <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/60 pointer-events-none">{unit}</span>}
        <input
          type="number"
          value={value}
          step={step}
          onChange={(e) => onChange(Number(e.target.value))}
          className={cn(
            "w-28 rounded-lg border border-border bg-input py-1.5 text-sm text-foreground text-right outline-none transition-colors tabular-nums",
            "focus:border-primary/50 focus:ring-2 focus:ring-primary/15",
            unit ? "pl-6 pr-2.5" : "px-2.5"
          )}
        />
      </span>
    </label>
  );
}

function SliderField({
  label, value, min, max, step, unit, onChange,
}: {
  label: string; value: number; min: number; max: number; step: number; unit?: string; onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-sm font-semibold tabular-nums text-foreground">
          {step < 1 ? value.toFixed(step < 0.1 ? 2 : 1) : value.toLocaleString()}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mc-range w-full"
      />
    </div>
  );
}

function OutcomeCard({
  label, value, color, hint,
}: {
  label: string; value: string; color: string; hint: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3.5 relative overflow-hidden">
      <div className="absolute -right-3 -top-3 w-14 h-14 rounded-full blur-2xl opacity-20" style={{ background: color }} />
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <p className="text-2xl font-black tabular-nums leading-none mt-1.5" style={{ color }}>{value}</p>
      <p className="text-[10px] text-muted-foreground mt-1">{hint}</p>
    </div>
  );
}
