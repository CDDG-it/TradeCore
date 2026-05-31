"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, X, Check } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { getTradeById, updateTrade, getAnalyses, computeDisciplineScore } from "@/lib/mock/store";
import { ScreenshotUpload } from "@/components/screenshot-upload";
import type { Direction, TradeResult, Session, TradeDiscipline } from "@/lib/types";
import { cn } from "@/lib/utils";

const INSTRUMENTS = ["NQ", "ES", "GOLD"];
const SESSIONS: Session[] = ["London", "New York", "Asia"];
const TIMEFRAMES = ["1m", "5m", "15m", "1H", "4H", "Daily"];

const DISCIPLINE_LABELS: { key: keyof Omit<TradeDiscipline, "score" | "notes" | "custom_checks">; label: string }[] = [
  { key: "followed_plan", label: "Followed my trading plan" },
  { key: "traded_in_session", label: "Traded in my allowed session" },
  { key: "respected_risk", label: "Respected risk rules" },
  { key: "respected_max_trades", label: "Respected max trades for today" },
  { key: "matched_a_plus", label: "Setup matched A+ criteria" },
  { key: "no_impulsive_entry", label: "No impulsive entry" },
  { key: "no_revenge_trade", label: "Not a revenge trade" },
  { key: "respected_stop_loss", label: "Respected the stop loss" },
  { key: "journal_completed", label: "Journal entry fully completed" },
];

export default function EditTradePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const trade = getTradeById(id);
  const [saving, setSaving] = useState(false);
  const [confluenceInput, setConfluenceInput] = useState("");
  const [showDiscipline, setShowDiscipline] = useState(true);
  const [newCustomLabel, setNewCustomLabel] = useState("");
  const [removedBuiltinKeys, setRemovedBuiltinKeys] = useState<string[]>([]);

  if (!trade) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground text-sm">Trade not found.</p>
        <Link href="/journal" className="text-primary text-sm hover:underline mt-2 inline-block">← Back to journal</Link>
      </div>
    );
  }

  const [form, setForm] = useState({
    date_time: trade.date_time.slice(0, 10),
    instrument: trade.instrument,
    market: trade.market,
    session: trade.session as Session,
    timeframe: trade.timeframe ?? "",
    direction: trade.direction as Direction,
    confluences: [...trade.confluences],
    rr: trade.rr,
    result: trade.result as TradeResult,
    screenshot_groups: trade.screenshot_groups?.length
      ? trade.screenshot_groups
      : [{ label: "Entry TF", urls: [] }, { label: "HTF", urls: [] }],
    execution_notes: trade.execution_notes,
    psychology_notes: trade.psychology_notes,
    mistakes: trade.mistakes,
    lessons: trade.lessons,
    linked_analysis_id: trade.linked_analysis_id,
    discipline: trade.discipline ?? {
      followed_plan: false, traded_in_session: true, respected_risk: true,
      respected_max_trades: true, matched_a_plus: false, no_impulsive_entry: true,
      no_revenge_trade: true, respected_stop_loss: true, journal_completed: true,
      score: 78, notes: "", custom_checks: [],
    },
  });

  const analyses = getAnalyses().filter((a) => a.date === form.date_time);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function calcVisibleScore(d: typeof form.discipline, removed: string[]): number {
    if (!d) return 0;
    const active = DISCIPLINE_LABELS.filter((item) => !removed.includes(item.key));
    const builtinPassed = active.filter((item) => (d as unknown as Record<string, unknown>)[item.key] as boolean).length;
    const custom = d.custom_checks ?? [];
    const customPassed = custom.filter((c) => c.passed).length;
    const total = active.length + custom.length;
    return total > 0 ? Math.round(((builtinPassed + customPassed) / total) * 100) : 0;
  }

  function setDiscipline(key: keyof Omit<TradeDiscipline, "score" | "notes" | "custom_checks">, value: boolean) {
    setForm((prev) => {
      const updated = { ...(prev.discipline!), [key]: value };
      updated.score = calcVisibleScore(updated, removedBuiltinKeys);
      return { ...prev, discipline: updated };
    });
  }

  function removeBuiltinCheck(key: string) {
    const next = [...removedBuiltinKeys, key];
    setRemovedBuiltinKeys(next);
    setForm((prev) => {
      const updated = { ...prev.discipline!, [key]: false };
      updated.score = calcVisibleScore(updated, next);
      return { ...prev, discipline: updated };
    });
  }

  function toggleCustomCheck(idx: number) {
    setForm((prev) => {
      const custom = [...(prev.discipline?.custom_checks ?? [])];
      custom[idx] = { ...custom[idx], passed: !custom[idx].passed };
      const updated = { ...prev.discipline!, custom_checks: custom };
      updated.score = calcVisibleScore(updated, removedBuiltinKeys);
      return { ...prev, discipline: updated };
    });
  }

  function addCustomCheck() {
    const label = newCustomLabel.trim();
    if (!label) return;
    setForm((prev) => {
      const custom = [...(prev.discipline?.custom_checks ?? []), { label, passed: false }];
      const updated = { ...prev.discipline!, custom_checks: custom };
      updated.score = calcVisibleScore(updated, removedBuiltinKeys);
      return { ...prev, discipline: updated };
    });
    setNewCustomLabel("");
  }

  function removeCustomCheck(idx: number) {
    setForm((prev) => {
      const custom = (prev.discipline?.custom_checks ?? []).filter((_, i) => i !== idx);
      const updated = { ...prev.discipline!, custom_checks: custom };
      updated.score = calcVisibleScore(updated, removedBuiltinKeys);
      return { ...prev, discipline: updated };
    });
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
    setSaving(true);
    await new Promise((r) => setTimeout(r, 300));
    updateTrade(id, form);
    router.push(`/journal/${id}`);
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href={`/journal/${id}`} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Trade
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Edit Trade</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{trade.instrument} · {trade.session} session</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card className="shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Trade Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Instrument *</Label>
                <div className="flex gap-1.5">
                  {INSTRUMENTS.map((inst) => (
                    <button key={inst} type="button" onClick={() => set("instrument", inst)}
                      className={cn("flex-1 py-1.5 rounded-lg text-sm font-medium transition-all font-mono",
                        form.instrument === inst ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}>
                      {inst}
                    </button>
                  ))}
                </div>
                {!INSTRUMENTS.includes(form.instrument) && (
                  <Input value={form.instrument} onChange={(e) => set("instrument", e.target.value.toUpperCase())}
                    className="h-8 text-sm mt-1" placeholder="Custom instrument" />
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Date</Label>
                <Input type="date" value={form.date_time}
                  onChange={(e) => { set("date_time", e.target.value); set("linked_analysis_id", undefined); }}
                  className="h-9 text-sm" required />
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
                          ? d === "long" ? "bg-success text-success-foreground" : "bg-destructive text-white"
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
                          ? r === "win" ? "bg-success text-success-foreground"
                            : r === "loss" ? "bg-destructive text-white"
                            : "bg-warning text-warning-foreground"
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
                        form.session === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Entry Timeframe</Label>
                <div className="flex flex-wrap gap-1.5">
                  {TIMEFRAMES.map((tf) => (
                    <button key={tf} type="button"
                      onClick={() => {
                        const parts = form.timeframe ? form.timeframe.split(" / ").filter(Boolean) : [];
                        const idx = parts.indexOf(tf);
                        const next = idx >= 0 ? parts.filter((p) => p !== tf) : [...parts, tf];
                        set("timeframe", next.join(" / "));
                      }}
                      className={cn("px-2.5 py-1 rounded-lg text-xs font-medium transition-all font-mono",
                        form.timeframe?.split(" / ").includes(tf)
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:text-foreground")}>
                      {tf}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">R:R</Label>
              <Input type="number" step="0.1" min="0" value={form.rr}
                onChange={(e) => set("rr", parseFloat(e.target.value) || 0)}
                className="h-9 text-sm font-mono max-w-32" required />
            </div>
          </CardContent>
        </Card>

        {/* Link to Analysis */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Analysis — {form.date_time}</CardTitle>
          </CardHeader>
          <CardContent>
            {analyses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No analysis found for this date.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => set("linked_analysis_id", undefined)}
                  className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    !form.linked_analysis_id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}>
                  None
                </button>
                {analyses.map((a) => (
                  <button key={a.id} type="button" onClick={() => set("linked_analysis_id", a.id)}
                    className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all max-w-xs truncate",
                      form.linked_analysis_id === a.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}>
                    {a.instrument} · {a.title.length > 30 ? `${a.title.slice(0, 30)}…` : a.title}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Confluences */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Confluences</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-3">
              <Input value={confluenceInput} onChange={(e) => setConfluenceInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addConfluence())}
                placeholder="Add confluence..." className="h-9 text-sm" />
              <Button type="button" variant="outline" size="sm" onClick={addConfluence}><Plus className="w-3.5 h-3.5" /></Button>
            </div>
            {form.confluences.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {form.confluences.map((c) => (
                  <span key={c} className="inline-flex items-center gap-1 text-xs bg-secondary text-secondary-foreground px-2.5 py-1 rounded-lg border border-border/50">
                    {c}
                    <button type="button" onClick={() => set("confluences", form.confluences.filter((x) => x !== c))}
                      className="hover:text-destructive transition-colors"><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Discipline Check */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <CardTitle className="text-sm font-semibold shrink-0">Discipline Check</CardTitle>
                {form.discipline && (
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden max-w-28" style={{ background: "oklch(0.18 0.005 28)" }}>
                      <div className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${form.discipline.score}%`,
                          background: form.discipline.score >= 80 ? "oklch(0.58 0.17 145)"
                            : form.discipline.score >= 60 ? "oklch(0.70 0.16 72)" : "oklch(0.58 0.22 25)",
                        }} />
                    </div>
                    <span className="text-xs font-bold tabular-nums shrink-0"
                      style={{
                        color: form.discipline.score >= 80 ? "oklch(0.58 0.17 145)"
                          : form.discipline.score >= 60 ? "oklch(0.70 0.16 72)" : "oklch(0.58 0.22 25)",
                      }}>
                      {form.discipline.score}%
                    </span>
                  </div>
                )}
              </div>
              <button type="button" onClick={() => setShowDiscipline(!showDiscipline)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors ml-3 shrink-0">
                {showDiscipline ? "Collapse" : "Expand"}
              </button>
            </div>
          </CardHeader>
          {showDiscipline && (
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                {DISCIPLINE_LABELS.filter(({ key }) => !removedBuiltinKeys.includes(key)).map(({ key, label }) => {
                  const checked = !!(form.discipline?.[key as keyof typeof form.discipline]);
                  return (
                    <div key={key} className="flex items-center gap-2 group/check">
                      <button type="button" onClick={() => setDiscipline(key, !checked)}
                        className={cn("flex-1 flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left border",
                          checked
                            ? "bg-success/8 border-success/25"
                            : "bg-secondary border-border hover:border-primary/30 hover:bg-muted"
                        )}>
                        <div className={cn("w-5 h-5 rounded-md shrink-0 flex items-center justify-center transition-all border-2",
                          checked ? "bg-success border-success" : "bg-transparent border-muted-foreground/30"
                        )}>
                          {checked && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className={cn("text-sm transition-colors",
                          checked ? "text-foreground" : "text-muted-foreground")}>
                          {label}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => removeBuiltinCheck(key)}
                        className="opacity-0 group-hover/check:opacity-100 transition-opacity p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}

                {(form.discipline?.custom_checks ?? []).map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 group/check">
                    <button type="button" onClick={() => toggleCustomCheck(idx)}
                      className={cn("flex-1 flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left border",
                        item.passed
                          ? "bg-success/8 border-success/25"
                          : "bg-secondary border-border hover:border-primary/30 hover:bg-muted"
                      )}>
                      <div className={cn("w-5 h-5 rounded-md shrink-0 flex items-center justify-center transition-all border-2",
                        item.passed ? "bg-success border-success" : "bg-transparent border-muted-foreground/30"
                      )}>
                        {item.passed && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className={cn("text-sm flex-1 text-left transition-colors",
                        item.passed ? "text-foreground" : "text-muted-foreground")}>
                        {item.label}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeCustomCheck(idx)}
                      className="opacity-0 group-hover/check:opacity-100 transition-opacity p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {removedBuiltinKeys.length > 0 && (
                  <div className="pt-1">
                    <p className="text-[10px] text-muted-foreground/50 mb-1.5">Removed checks</p>
                    <div className="flex flex-wrap gap-1.5">
                      {DISCIPLINE_LABELS.filter(({ key }) => removedBuiltinKeys.includes(key)).map(({ key, label }) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setRemovedBuiltinKeys((prev) => prev.filter((k) => k !== key))}
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground/50 hover:text-foreground border border-dashed border-border/50 hover:border-border px-2 py-1 rounded-lg transition-colors"
                        >
                          <Plus className="w-3 h-3" /> {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <Input value={newCustomLabel} onChange={(e) => setNewCustomLabel(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomCheck())}
                  placeholder="Add custom rule..."
                  className="h-8 text-xs" />
                <Button type="button" variant="outline" size="sm" onClick={addCustomCheck} className="h-8 shrink-0">
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Screenshots */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Screenshots</CardTitle></CardHeader>
          <CardContent>
            <ScreenshotUpload groups={form.screenshot_groups} onChange={(g) => set("screenshot_groups", g)} />
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Link href={`/journal/${id}`}><Button type="button" variant="outline">Cancel</Button></Link>
          <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save changes"}</Button>
        </div>
      </form>
    </div>
  );
}
