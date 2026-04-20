"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, X, Check } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createTrade, getAnalyses, computeDisciplineScore } from "@/lib/mock/store";
import { ScreenshotUpload } from "@/components/screenshot-upload";
import type { TradeJournalEntryInput, Direction, TradeResult, Market, Session, TradeDiscipline, TradeMarketContext, Bias, MarketRegime, VolatilityLevel } from "@/lib/types";
import { cn } from "@/lib/utils";

const SESSIONS: Session[] = ["London", "New York", "Asia"];
const MARKETS: Market[] = ["futures", "commodities"];
const TIMEFRAMES = ["1m", "5m", "15m", "1H", "4H", "Daily"];

const INSTRUMENTS: Record<Market, string[]> = {
  futures: ["NQ", "ES", "YM", "RTY"],
  commodities: ["Gold", "Silver", "Crude Oil", "Natural Gas"],
};

const DISCIPLINE_CHECKS: { key: keyof TradeDiscipline; label: string }[] = [
  { key: "followed_plan",        label: "Followed my trading plan" },
  { key: "traded_in_session",    label: "Traded in my allowed session" },
  { key: "respected_risk",       label: "Respected risk rules (size, %, stop)" },
  { key: "respected_max_trades", label: "Respected max trades for today" },
  { key: "matched_a_plus",       label: "Setup matched A+ criteria" },
  { key: "no_impulsive_entry",   label: "No impulsive entry (waited for confirmation)" },
  { key: "no_revenge_trade",     label: "This was NOT a revenge trade" },
  { key: "respected_stop_loss",  label: "Respected the stop loss" },
  { key: "journal_completed",    label: "Journal entry fully completed" },
];

const DEFAULT_DISCIPLINE_CHECKS = {
  followed_plan: false, traded_in_session: true, respected_risk: true,
  respected_max_trades: true, matched_a_plus: false, no_impulsive_entry: true,
  no_revenge_trade: true, respected_stop_loss: true, journal_completed: true,
};

const DEFAULT_DISCIPLINE: TradeDiscipline = {
  ...DEFAULT_DISCIPLINE_CHECKS,
  score: computeDisciplineScore(DEFAULT_DISCIPLINE_CHECKS),
  notes: "",
};

const DEFAULT_CONTEXT: TradeMarketContext = {
  regime: "trending", volatility: "medium", news_day: false,
  major_event: false, htf_bias: "bullish", confidence: 3, notes: "",
};

export default function NewTradePage() {
  const router = useRouter();
  const analyses = getAnalyses();
  const [saving, setSaving] = useState(false);
  const [confluenceInput, setConfluenceInput] = useState("");
  const [showDiscipline, setShowDiscipline] = useState(true);
  const [showContext, setShowContext] = useState(true);

  const [form, setForm] = useState<TradeJournalEntryInput>({
    date_time: new Date().toISOString().split("T")[0],
    instrument: "",
    market: "futures",
    session: "New York",
    timeframe: "",
    direction: "long",
    confluences: [],
    rr: 2,
    result: "win",
    screenshot_groups: [],
    execution_notes: "",
    psychology_notes: "",
    mistakes: "",
    lessons: "",
    linked_analysis_id: undefined,
    discipline: { ...DEFAULT_DISCIPLINE },
    market_context: { ...DEFAULT_CONTEXT },
  });

  function set<K extends keyof TradeJournalEntryInput>(key: K, value: TradeJournalEntryInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setDiscipline(key: keyof TradeDiscipline, value: boolean | string) {
    setForm((prev) => {
      const updated = { ...(prev.discipline ?? DEFAULT_DISCIPLINE), [key]: value };
      if (key !== "score" && key !== "notes") {
        updated.score = computeDisciplineScore(updated);
      }
      return { ...prev, discipline: updated };
    });
  }

  function setContext(key: keyof TradeMarketContext, value: unknown) {
    setForm((prev) => ({
      ...prev,
      market_context: { ...(prev.market_context ?? DEFAULT_CONTEXT), [key as string]: value },
    }));
  }

  function addConfluence() {
    const t = confluenceInput.trim();
    if (t && !form.confluences.includes(t)) {
      set("confluences", [...form.confluences, t]);
      setConfluenceInput("");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.instrument) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 300));
    const created = createTrade(form);
    router.push(`/journal/${created.id}`);
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/journal" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Journal
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Log Trade</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Record a completed trade</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card className="bg-card border-border/50 shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Trade Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Market *</Label>
                <div className="flex gap-1.5">
                  {MARKETS.map((m) => (
                    <button key={m} type="button"
                      onClick={() => { set("market", m); set("instrument", ""); }}
                      className={cn("flex-1 py-1.5 rounded-lg text-xs font-medium transition-all capitalize",
                        form.market === m ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:text-foreground")}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="date" className="text-xs">Date *</Label>
                <Input id="date" type="date" value={form.date_time}
                  onChange={(e) => set("date_time", e.target.value)}
                  className="h-9 text-sm bg-background/50" required />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Instrument *</Label>
              <div className="flex flex-wrap gap-1.5">
                {INSTRUMENTS[form.market].map((inst) => (
                  <button key={inst} type="button" onClick={() => set("instrument", inst)}
                    className={cn("px-3 py-1.5 rounded-lg text-sm font-medium transition-all font-mono",
                      form.instrument === inst ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:text-foreground")}>
                    {inst}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Direction</Label>
                <div className="flex gap-1.5">
                  {(["long", "short"] as Direction[]).map((d) => (
                    <button key={d} type="button" onClick={() => set("direction", d)}
                      className={cn("flex-1 py-1.5 rounded-lg text-xs font-medium transition-all capitalize",
                        form.direction === d
                          ? d === "long" ? "bg-success text-success-foreground shadow-sm" : "bg-destructive text-white shadow-sm"
                          : "bg-muted text-muted-foreground hover:text-foreground")}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Result</Label>
                <div className="flex gap-1">
                  {(["win", "loss", "break-even"] as TradeResult[]).map((r) => (
                    <button key={r} type="button" onClick={() => set("result", r)}
                      className={cn("flex-1 py-1.5 rounded-lg text-xs font-medium transition-all",
                        form.result === r
                          ? r === "win" ? "bg-success text-success-foreground shadow-sm"
                            : r === "loss" ? "bg-destructive text-white shadow-sm"
                            : "bg-warning text-warning-foreground shadow-sm"
                          : "bg-muted text-muted-foreground hover:text-foreground")}>
                      {r === "break-even" ? "B/E" : r}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Session</Label>
                <div className="flex flex-wrap gap-1.5">
                  {SESSIONS.map((s) => (
                    <button key={s} type="button" onClick={() => set("session", s)}
                      className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                        form.session === s ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:text-foreground")}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Timeframe</Label>
                <div className="flex flex-wrap gap-1.5">
                  {TIMEFRAMES.map((tf) => (
                    <button key={tf} type="button"
                      onClick={() => {
                        // Toggle: if already selected in the string, remove; otherwise add
                        const parts = form.timeframe ? form.timeframe.split(" / ").filter(Boolean) : [];
                        const idx = parts.indexOf(tf);
                        const next = idx >= 0 ? parts.filter((p) => p !== tf) : [...parts, tf];
                        set("timeframe", next.join(" / "));
                      }}
                      className={cn("px-2.5 py-1 rounded-lg text-xs font-medium transition-all font-mono",
                        form.timeframe?.split(" / ").includes(tf)
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-muted text-muted-foreground hover:text-foreground")}>
                      {tf}
                    </button>
                  ))}
                  <Input
                    value={form.timeframe?.split(" / ").filter(t => !TIMEFRAMES.includes(t)).join(" / ") ?? ""}
                    onChange={(e) => {
                      const presets = form.timeframe?.split(" / ").filter(t => TIMEFRAMES.includes(t)) ?? [];
                      const custom = e.target.value.trim();
                      set("timeframe", [...presets, ...(custom ? [custom] : [])].join(" / "));
                    }}
                    placeholder="Custom..."
                    className="h-7 text-xs bg-background/50 w-24 font-mono" />
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="rr" className="text-xs">R:R *</Label>
                <Input id="rr" type="number" step="0.1" min="0" value={form.rr}
                  onChange={(e) => set("rr", parseFloat(e.target.value) || 0)}
                  className="h-9 text-sm bg-background/50 font-mono" required />
              </div>
              {analyses.length > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Link to Analysis</Label>
                  <div className="flex flex-wrap gap-1.5">
                    <button type="button" onClick={() => set("linked_analysis_id", undefined)}
                      className={cn("px-3 py-1 rounded-lg text-xs font-medium transition-all",
                        !form.linked_analysis_id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}>
                      None
                    </button>
                    {analyses.slice(0, 3).map((a) => (
                      <button key={a.id} type="button" onClick={() => set("linked_analysis_id", a.id)}
                        className={cn("px-3 py-1 rounded-lg text-xs font-medium transition-all max-w-48 truncate",
                          form.linked_analysis_id === a.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}>
                        {a.instrument} · {a.title.slice(0, 20)}…
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50 shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Confluences</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-3">
              <Input value={confluenceInput} onChange={(e) => setConfluenceInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addConfluence())}
                placeholder="e.g. Demand zone, Session momentum, Structure break..."
                className="h-9 text-sm bg-background/50" />
              <Button type="button" variant="outline" size="sm" onClick={addConfluence} className="shrink-0">
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
            {form.confluences.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {form.confluences.map((c) => (
                  <span key={c} className="inline-flex items-center gap-1 text-xs bg-secondary text-secondary-foreground px-2.5 py-1 rounded-lg border border-border/50">
                    {c}
                    <button type="button" onClick={() => set("confluences", form.confluences.filter((x) => x !== c))}
                      className="hover:text-destructive transition-colors ml-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50 shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Post-Trade Review</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: "execution_notes" as const, label: "Execution Notes", placeholder: "How was the execution? Did you follow the plan?" },
              { key: "psychology_notes" as const, label: "Psychology", placeholder: "How were you feeling? Calm, anxious, reactive?" },
              { key: "mistakes" as const, label: "Mistakes", placeholder: "What went wrong, if anything?" },
              { key: "lessons" as const, label: "Lessons", placeholder: "What did you learn from this trade?" },
            ].map(({ key, label, placeholder }) => (
              <div key={key} className="space-y-1.5">
                <Label htmlFor={key} className="text-xs">{label}</Label>
                <Textarea id={key} value={form[key] as string} onChange={(e) => set(key, e.target.value)}
                  placeholder={placeholder} className="text-sm bg-background/50 min-h-16 resize-none" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* ── Market Context ─────────────────────────────────── */}
        <Card className="bg-card border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Market Context</CardTitle>
              <button type="button" onClick={() => setShowContext(!showContext)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                {showContext ? "Collapse" : "Expand"}
              </button>
            </div>
          </CardHeader>
          {showContext && (
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Market Regime</Label>
                  <div className="flex flex-col gap-1">
                    {(["trending", "ranging"] as MarketRegime[]).map((r) => (
                      <button key={r} type="button" onClick={() => setContext("regime", r)}
                        className={cn("py-1.5 rounded-lg text-xs font-medium capitalize transition-all",
                          form.market_context?.regime === r ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Volatility</Label>
                  <div className="flex flex-col gap-1">
                    {(["low", "medium", "high", "extreme"] as VolatilityLevel[]).map((v) => (
                      <button key={v} type="button" onClick={() => setContext("volatility", v)}
                        className={cn("py-1.5 rounded-lg text-xs font-medium capitalize transition-all",
                          form.market_context?.volatility === v ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}>
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">HTF Bias</Label>
                    <div className="flex gap-1">
                      {(["bullish", "bearish", "neutral"] as Bias[]).map((b) => (
                        <button key={b} type="button" onClick={() => setContext("htf_bias", b)}
                          className={cn("flex-1 py-1.5 rounded-lg text-xs font-medium capitalize transition-all",
                            form.market_context?.htf_bias === b
                              ? b === "bullish" ? "bg-success text-success-foreground"
                                : b === "bearish" ? "bg-destructive text-white"
                                : "bg-muted text-foreground"
                              : "bg-muted text-muted-foreground hover:text-foreground")}>
                          {b === "bullish" ? "↑" : b === "bearish" ? "↓" : "—"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    {[
                      { key: "news_day" as const, label: "News day" },
                      { key: "major_event" as const, label: "Major event" },
                    ].map(({ key, label }) => (
                      <label key={key} className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" checked={!!form.market_context?.[key]} onChange={(e) => setContext(key, e.target.checked)}
                          className="w-3.5 h-3.5 rounded" />
                        <span className="text-xs text-muted-foreground">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Context Notes</Label>
                <Input value={form.market_context?.notes ?? ""} onChange={(e) => setContext("notes", e.target.value)}
                  placeholder="Any notes on the market conditions..." className="h-9 text-sm bg-background/50" />
              </div>
            </CardContent>
          )}
        </Card>

        {/* ── Discipline Check ────────────────────────────────── */}
        <Card className="bg-card border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <CardTitle className="text-sm font-semibold shrink-0">Discipline Check</CardTitle>
                {form.discipline && (
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden max-w-28" style={{ background: "oklch(0.18 0.005 28)" }}>
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${form.discipline.score}%`,
                          background: form.discipline.score >= 80
                            ? "oklch(0.58 0.17 145)"
                            : form.discipline.score >= 60
                            ? "oklch(0.70 0.16 72)"
                            : "oklch(0.58 0.22 25)",
                        }}
                      />
                    </div>
                    <span
                      className="text-xs font-bold tabular-nums shrink-0"
                      style={{
                        color: form.discipline.score >= 80
                          ? "oklch(0.58 0.17 145)"
                          : form.discipline.score >= 60
                          ? "oklch(0.70 0.16 72)"
                          : "oklch(0.58 0.22 25)",
                      }}
                    >
                      {form.discipline.score}%
                    </span>
                  </div>
                )}
              </div>
              <button type="button" onClick={() => setShowDiscipline(!showDiscipline)} className="text-xs text-muted-foreground hover:text-foreground transition-colors ml-3 shrink-0">
                {showDiscipline ? "Collapse" : "Expand"}
              </button>
            </div>
          </CardHeader>
          {showDiscipline && (
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                {DISCIPLINE_CHECKS.map(({ key, label }) => {
                  const checked = !!(form.discipline?.[key]);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setDiscipline(key, !checked)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left"
                      style={{
                        background: checked ? "oklch(0.58 0.17 145 / 0.08)" : "oklch(0.08 0.003 28)",
                        border: `1px solid ${checked ? "oklch(0.58 0.17 145 / 0.25)" : "oklch(0.18 0.005 28)"}`,
                      }}
                    >
                      <div
                        className="w-5 h-5 rounded-md shrink-0 flex items-center justify-center transition-all"
                        style={
                          checked
                            ? { background: "oklch(0.58 0.17 145)" }
                            : { background: "transparent", border: "1.5px solid oklch(0.35 0.005 28)" }
                        }
                      >
                        {checked && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span
                        className="text-sm transition-colors"
                        style={{ color: checked ? "oklch(0.90 0.003 28)" : "oklch(0.65 0.005 28)" }}
                      >
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Discipline Notes</Label>
                <Input value={form.discipline?.notes ?? ""} onChange={(e) => setDiscipline("notes", e.target.value)}
                  placeholder="Any notes on your process or mindset..." className="h-9 text-sm bg-background/50" />
              </div>
            </CardContent>
          )}
        </Card>

        <Card className="bg-card border-border/50 shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Screenshots</CardTitle></CardHeader>
          <CardContent>
            <ScreenshotUpload groups={form.screenshot_groups} onChange={(g) => set("screenshot_groups", g)} />
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3 pt-1">
          <Link href="/journal"><Button type="button" variant="outline">Cancel</Button></Link>
          <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Log trade"}</Button>
        </div>
      </form>
    </div>
  );
}
