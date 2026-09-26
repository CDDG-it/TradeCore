"use client";

import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Check, Loader2, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { runMonteCarlo, type DrawdownMode, type MonteCarloInputs } from "@/lib/strategy/monte-carlo";
import { getMonteCarloSettings, getTrades, saveMonteCarloSettings } from "@/lib/supabase/queries";
import type { TradeJournalEntry } from "@/lib/types";

const PRIMARY = "var(--primary)";
const CYAN = "var(--ice)";
const SLATE = "var(--muted-foreground)";

const DEFAULTS: MonteCarloInputs = {
  accountSize: 50000, profitTarget: 3000, maxDrawdown: 2000, drawdownMode: "trailing",
  dailyLossLimit: 1000, riskPerTrade: 300, winRate: 0.45, rewardRisk: 2,
  tradesPerDay: 3, maxDays: 20, simulations: 3000, sampleCurves: 14,
};

type JournalStats = { winRate: number; avgRR: number; decisive: number; total: number; pace: number; activeDays: number };

function pct(value: number) { return `${(value * 100).toFixed(1)}%`; }
function money(value: number) { return `$${Math.round(value).toLocaleString()}`; }
function dayKey(trade: TradeJournalEntry) { return trade.date_time.slice(0, 10); }

function journalStats(trades: TradeJournalEntry[], from: string, to: string): JournalStats | null {
  const scoped = trades.filter((trade) => (!from || dayKey(trade) >= from) && (!to || dayKey(trade) <= to));
  const wins = scoped.filter((trade) => trade.result === "win");
  const losses = scoped.filter((trade) => trade.result === "loss");
  const decisive = wins.length + losses.length;
  if (scoped.length === 0 || decisive === 0) return null;
  const activeDays = new Set(scoped.map(dayKey)).size;
  return {
    winRate: wins.length / decisive,
    avgRR: wins.length ? wins.reduce((sum, trade) => sum + trade.rr, 0) / wins.length : 0,
    decisive,
    total: scoped.length,
    pace: activeDays ? scoped.length / activeDays : 0,
    activeDays,
  };
}

export function MonteCarloSimulator() {
  const [input, setInput] = useState<MonteCarloInputs>(DEFAULTS);
  const [trades, setTrades] = useState<TradeJournalEntry[]>([]);
  const [journalPeriod, setJournalPeriod] = useState("all");
  const [appliedStats, setAppliedStats] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    let alive = true;
    Promise.all([getMonteCarloSettings(), getTrades()]).then(([saved, journal]) => {
      if (!alive) return;
      if (saved) setInput((current) => ({ ...current, ...saved }));
      setTrades(journal);
    });
    return () => { alive = false; };
  }, []);

  const monthOptions = useMemo(() => [...new Set(trades.map((trade) => dayKey(trade).slice(0, 7)))].sort().reverse(), [trades]);
  const periodFrom = journalPeriod === "all" ? "" : `${journalPeriod}-01`;
  const periodTo = journalPeriod === "all" ? "" : `${journalPeriod}-31`;
  const stats = useMemo(() => journalStats(trades, periodFrom, periodTo), [trades, periodFrom, periodTo]);
  const result = useMemo(() => runMonteCarlo(input), [input]);
  const target = input.accountSize + input.profitTarget;
  const floor = input.accountSize - input.maxDrawdown;
  const chartFloor = Math.max(0, Math.floor((floor - Math.max(1000, input.maxDrawdown * 0.5)) / 1000) * 1000);
  const edgePositive = result.expectancyR >= 0;
  const envelopeData = useMemo(() => result.equityEnvelope
    .filter((point) => point.active > 0)
    .map((point) => ({
      ...point,
      outerBand: point.p90 - point.p10,
      innerBand: point.p75 - point.p25,
    })), [result.equityEnvelope]);

  function set<K extends keyof MonteCarloInputs>(key: K, value: MonteCarloInputs[K]) {
    setInput((current) => ({ ...current, [key]: value }));
    setAppliedStats(false);
    setSaveState("idle");
  }

  function applyJournalStats() {
    if (!stats) return;
    setInput((current) => ({
      ...current,
      winRate: Math.min(0.9, Math.max(0.1, stats.winRate)),
      rewardRisk: stats.avgRR > 0 ? Math.round(stats.avgRR * 100) / 100 : current.rewardRisk,
      tradesPerDay: Math.max(1, Math.round(stats.pace)),
    }));
    setAppliedStats(true);
  }

  async function save() {
    setSaveState("saving");
    try {
      await saveMonteCarloSettings(input);
      setSaveState("saved");
      window.setTimeout(() => setSaveState((current) => current === "saved" ? "idle" : current), 2500);
    } catch {
      setSaveState("error");
    }
  }

  function reset() {
    setInput(DEFAULTS);
    setAppliedStats(false);
    setSaveState("idle");
  }

  return (
    <div className="flex w-full max-w-full flex-col gap-2 overflow-x-hidden xl:h-[calc(100dvh-8.5rem)] xl:min-h-[680px] xl:overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-base font-semibold tracking-tight">Monte Carlo simulation</h2><p className="mt-0.5 text-xs text-muted-foreground">Pressure-test your current edge against your evaluation rules.</p></div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={reset} className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground">Reset</button>
          <button type="button" onClick={save} disabled={saveState === "saving"} className="inline-flex items-center gap-1.5 rounded-lg border border-primary/35 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/15 disabled:opacity-60">
            {saveState === "saving" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : saveState === "saved" ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
            {saveState === "saving" ? "Saving" : saveState === "saved" ? "Saved" : saveState === "error" ? "Save failed" : "Save setup"}
          </button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 items-start gap-2 xl:grid-cols-[252px_minmax(0,1fr)]">
        <aside className="space-y-1.5 rounded-2xl border border-border/60 bg-card p-2.5 xl:h-full">
          <FieldGroup title="Journal data">
            <select value={journalPeriod} onChange={(event) => { setJournalPeriod(event.target.value); setAppliedStats(false); }} className="h-8 w-full rounded-lg border border-border bg-input px-2 text-[11px] font-semibold text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/15">
              <option value="all">All-time stats</option>
              {monthOptions.map((month) => <option key={month} value={month}>{new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${month}-01T00:00:00Z`))}</option>)}
            </select>
            {stats ? <div className="grid grid-cols-4 gap-1 rounded-lg border border-border/60 bg-muted/20 p-1.5 text-[9px]">{[["Trades", stats.total], ["Win", pct(stats.winRate)], ["Avg R", `${stats.avgRR.toFixed(2)}R`], ["Pace", stats.pace.toFixed(1)]].map(([label, value]) => <div key={label} className="min-w-0"><p className="truncate text-muted-foreground">{label}</p><p className="truncate font-bold tabular-nums text-foreground">{value}</p></div>)}</div> : <p className="text-[10px] leading-snug text-muted-foreground">{trades.length === 0 ? "Log decisive trades to use journal stats." : "No decisive trades in this month."}</p>}
            <button type="button" disabled={!stats} onClick={applyJournalStats} className={cn("w-full rounded-lg border px-3 py-1 text-[10px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45", appliedStats ? "border-primary/45 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/35 hover:text-foreground")}>{appliedStats ? "Stats applied" : "Use these stats"}</button>
          </FieldGroup>

          <FieldGroup title="Your edge"><SliderField label="Win rate" value={input.winRate * 100} min={10} max={90} step={1} unit="%" onChange={(value) => set("winRate", value / 100)} /><SliderField label="Reward : risk" value={input.rewardRisk} min={0.5} max={5} step={0.1} unit="R" onChange={(value) => set("rewardRisk", value)} /><MetricLine label="Expectancy" value={`${result.expectancyR >= 0 ? "+" : ""}${result.expectancyR.toFixed(2)}R · ${money(result.expectancyMoney)}`} emphasis={edgePositive} /></FieldGroup>
          <FieldGroup title="Risk & pace"><NumberField label="Risk per trade" value={input.riskPerTrade} unit="$" step={50} onChange={(value) => set("riskPerTrade", value)} /><NumberField label="Trades per day" value={input.tradesPerDay} step={1} onChange={(value) => set("tradesPerDay", Math.max(1, Math.round(value)))} /></FieldGroup>
          <FieldGroup title="Account rules"><NumberField label="Account size" value={input.accountSize} unit="$" step={5000} onChange={(value) => set("accountSize", value)} /><NumberField label="Profit target" value={input.profitTarget} unit="$" step={500} onChange={(value) => set("profitTarget", value)} /><NumberField label="Max drawdown" value={input.maxDrawdown} unit="$" step={250} onChange={(value) => set("maxDrawdown", value)} /><ToggleField value={input.drawdownMode} onChange={(value) => set("drawdownMode", value)} /><NumberField label="Daily loss limit" value={input.dailyLossLimit} unit="$" step={250} hint="0 = off" onChange={(value) => set("dailyLossLimit", Math.max(0, value))} /><NumberField label="Deadline" value={input.maxDays} unit="days" step={1} hint="0 = no limit" onChange={(value) => set("maxDays", Math.max(0, Math.round(value)))} /></FieldGroup>
          <FieldGroup title="Simulation"><SliderField label="Runs" value={input.simulations} min={500} max={10000} step={500} onChange={(value) => set("simulations", Math.round(value))} /></FieldGroup>
        </aside>

        <section className="min-w-0 space-y-2 xl:grid xl:h-full xl:min-h-0 xl:grid-rows-[auto_minmax(260px,1fr)] xl:space-y-0 xl:gap-2">
          <div className="grid gap-2 lg:grid-cols-[minmax(0,1.45fr)_minmax(330px,.55fr)]">
            <div className="rounded-2xl border border-primary/25 bg-[radial-gradient(circle_at_82%_0%,color-mix(in_oklch,var(--ice)_14%,transparent),transparent_34%),color-mix(in_oklch,var(--primary)_6%,var(--card))] p-3">
              <div className="flex items-center justify-between gap-4"><div><p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Probability of passing</p><p className="mt-0.5 text-4xl font-black leading-none tracking-[-.06em] text-primary tabular-nums">{pct(result.passRate)}</p></div><div className="grid grid-cols-4 gap-4"><Stat label="Pass time" value={result.medianDaysToPass === null ? "—" : `${result.medianDaysToPass}d`} /><Stat label="Finish" value={money(result.medianEndBalance)} /><Stat label="Non-pass" value={pct(result.failRate + result.timeoutRate)} /><Stat label="Runs" value={input.simulations.toLocaleString()} /></div></div>
              <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-muted/50"><span style={{ width: pct(result.passRate), background: PRIMARY }} /><span style={{ width: pct(result.timeoutRate), background: CYAN, opacity: 0.8 }} /><span style={{ width: pct(result.failRate), background: SLATE, opacity: 0.45 }} /></div>
              <div className="mt-1 flex flex-wrap gap-x-3 text-[9px] text-muted-foreground"><span>Pass {pct(result.passRate)}</span><span>Timeout {pct(result.timeoutRate)}</span><span>Breach {pct(result.failRate)}</span></div>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card p-3"><div className="grid h-full grid-cols-3 items-center gap-3"><Insight label="Expected value" value={`${result.expectancyR >= 0 ? "+" : ""}${result.expectancyR.toFixed(2)}R`} detail={`${money(result.expectancyMoney)} / trade`} accent={edgePositive ? PRIMARY : CYAN} /><Insight label="Risk window" value={money(input.maxDrawdown)} detail={input.drawdownMode === "trailing" ? "Trailing" : "Static"} accent={CYAN} /><Insight label="Target" value={`${(input.profitTarget / input.riskPerTrade).toFixed(1)}R`} detail={money(input.profitTarget)} accent={PRIMARY} /></div></div>
          </div>

          <div className="flex min-h-0 flex-col rounded-2xl border border-border/60 bg-card p-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2"><div><h3 className="text-sm font-semibold">Projected equity range</h3><p className="mt-0.5 text-xs text-muted-foreground">The central line is the median attempt; bands show the spread across active simulations.</p></div><span className="text-xs font-semibold text-primary">{input.simulations.toLocaleString()} simulations</span></div>
            <div className="mt-2 h-52 min-h-0 w-full xl:h-auto xl:flex-1">
              <ResponsiveContainer width="100%" height="100%"><AreaChart data={envelopeData} margin={{ top: 10, right: 12, left: 4, bottom: 0 }}><defs><linearGradient id="mcOuter" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--ice)" stopOpacity=".18" /><stop offset="1" stopColor="var(--ice)" stopOpacity=".02" /></linearGradient><linearGradient id="mcInner" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--primary)" stopOpacity=".28" /><stop offset="1" stopColor="var(--primary)" stopOpacity=".06" /></linearGradient></defs><CartesianGrid stroke="color-mix(in oklch,var(--border) 65%,transparent)" strokeDasharray="3 4" vertical={false} /><XAxis dataKey="trade" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} tickFormatter={(value) => `T${value}`} /><YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} width={48} tickFormatter={(value) => `${Math.round(value / 1000)}k`} domain={[chartFloor, "dataMax"]} allowDataOverflow /><Tooltip content={<EnvelopeTooltip />} /><ReferenceLine y={target} stroke="var(--primary)" strokeDasharray="5 4" label={{ value: "Target", fill: "var(--primary)", fontSize: 10, position: "insideTopRight" }} /><ReferenceLine y={floor} stroke="var(--ice)" strokeOpacity={.7} strokeDasharray="5 4" label={{ value: "Drawdown", fill: "var(--ice)", fontSize: 10, position: "insideBottomRight" }} /><ReferenceLine y={input.accountSize} stroke="var(--muted-foreground)" strokeOpacity={.45} strokeDasharray="2 4" /><Area dataKey="p10" stackId="outer" stroke="none" fill="transparent" isAnimationActive={false} /><Area dataKey="outerBand" stackId="outer" stroke="none" fill="url(#mcOuter)" isAnimationActive={false} /><Area dataKey="p25" stackId="inner" stroke="none" fill="transparent" isAnimationActive={false} /><Area dataKey="innerBand" stackId="inner" stroke="none" fill="url(#mcInner)" isAnimationActive={false} /><Line type="monotone" dataKey="p50" stroke="var(--primary)" strokeWidth={2.5} dot={false} isAnimationActive={false} /></AreaChart></ResponsiveContainer>
            </div>
          </div>

        </section>
      </div>
    </div>
  );
}

function EnvelopeTooltip({ active, payload }: { active?: boolean; payload?: { payload: { trade: number; p10: number; p25: number; p50: number; p75: number; p90: number; active: number } }[] }) {
  if (!active || !payload?.[0]) return null;
  const point = payload[0].payload;
  return <div className="rounded-xl border border-border/70 bg-card/95 p-3 text-xs shadow-xl backdrop-blur"><p className="font-semibold text-foreground">Trade {point.trade}</p><div className="mt-2 grid grid-cols-2 gap-x-5 gap-y-1 text-muted-foreground"><span>Median</span><span className="text-right font-semibold text-foreground">{money(point.p50)}</span><span>P10 — P90</span><span className="text-right font-semibold text-foreground">{money(point.p10)} — {money(point.p90)}</span><span>Active paths</span><span className="text-right font-semibold text-foreground">{point.active.toLocaleString()}</span></div></div>;
}

function FieldGroup({ title, children }: { title: string; children: React.ReactNode }) { return <div className="space-y-1"><p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/70">{title}</p>{children}</div>; }
function MetricLine({ label, value, emphasis }: { label: string; value: string; emphasis: boolean }) { return <div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">{label}</span><span className={cn("font-semibold tabular-nums", emphasis ? "text-primary" : "text-foreground")}>{value}</span></div>; }
function Stat({ label, value }: { label: string; value: string }) { return <div><p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p><p className="mt-0.5 text-sm font-bold tabular-nums text-foreground">{value}</p></div>; }
function Insight({ label, value, detail, accent }: { label: string; value: string; detail: string; accent: string }) { return <div className="border-l-2 pl-3" style={{ borderColor: accent }}><p className="text-xs text-muted-foreground">{label}</p><p className="mt-0.5 text-xl font-black leading-none tabular-nums" style={{ color: accent }}>{value}</p><p className="mt-1 text-[11px] text-muted-foreground">{detail}</p></div>; }
function ToggleField({ value, onChange }: { value: DrawdownMode; onChange: (value: DrawdownMode) => void }) { return <div className="flex items-center justify-between gap-2"><span className="text-[10px] text-muted-foreground">Drawdown</span><div className="flex w-28 overflow-hidden rounded-md border border-border">{(["trailing", "static"] as DrawdownMode[]).map((option) => <button key={option} type="button" onClick={() => onChange(option)} className={cn("flex-1 px-1.5 py-1 text-[10px] font-semibold capitalize transition-colors", value === option ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>{option}</button>)}</div></div>; }
function NumberField({ label, value, onChange, unit, step = 1, hint }: { label: string; value: number; onChange: (value: number) => void; unit?: string; step?: number; hint?: string }) { return <label className="flex items-center justify-between gap-2"><span className="min-w-0 truncate text-[10px] text-muted-foreground" title={hint ? `${label} (${hint})` : label}>{label}{hint && <span className="ml-1 text-muted-foreground/50">({hint})</span>}</span><span className="relative shrink-0">{unit && <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[9px] text-muted-foreground/60">{unit === "days" ? "" : unit}</span>}<input type="number" value={value} step={step} onChange={(event) => onChange(Number(event.target.value))} className={cn("h-7 w-24 rounded-md border border-border bg-input text-right text-[11px] text-foreground outline-none transition-colors tabular-nums focus:border-primary/50 focus:ring-2 focus:ring-primary/15", unit === "$" ? "pl-5 pr-2" : "px-2")} /></span></label>; }
function SliderField({ label, value, min, max, step, unit = "", onChange }: { label: string; value: number; min: number; max: number; step: number; unit?: string; onChange: (value: number) => void }) { return <div className="space-y-0.5"><div className="flex items-center justify-between"><span className="text-[10px] text-muted-foreground">{label}</span><span className="text-[11px] font-semibold tabular-nums text-foreground">{step < 1 ? value.toFixed(1) : value.toLocaleString()}{unit}</span></div><input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} className="mc-range block w-full" /></div>; }
