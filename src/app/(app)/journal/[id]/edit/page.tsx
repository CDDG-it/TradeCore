"use client";

import { use, useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, X, Check } from "lucide-react";
import { DateField, TimeField } from "@/components/journal/field-inputs";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getTradeById, updateTrade, getAnalyses, getProfile } from "@/lib/supabase/queries";
import type { PreTradeAnalysis } from "@/lib/types";
import { ScreenshotUpload } from "@/components/screenshot-upload";
import type { Direction, TradeResult, Session, TradeDiscipline, TradeJournalEntry } from "@/lib/types";
import { cn } from "@/lib/utils";
import { TIMEFRAMES, normalizeTimeframe } from "@/lib/timeframes";
import { useFormDraft } from "@/lib/drafts";
import { DraftBanner } from "@/components/ui/draft-banner";

const INSTRUMENTS = ["NQ", "ES", "GOLD"];
const SESSIONS: Session[] = ["London", "New York", "Asia"];

import type { Market } from "@/lib/types";
import { ExecutionQualityField } from "@/components/journal/execution-quality-field";

const DEFAULT_FORM = {
  date_time: new Date().toISOString().split("T")[0],
  instrument: "",
  market: "futures" as Market,
  session: "New York" as Session,
  timeframe: "",
  direction: "long" as Direction,
  confluences: [] as string[],
  rr: 2,
  result: "win" as TradeResult,
  screenshot_groups: [{ label: "Entry TF", urls: [] as string[] }, { label: "HTF", urls: [] as string[] }],
  execution_notes: "",
  psychology_notes: "",
  mistakes: "",
  lessons: "",
  linked_analysis_id: undefined as string | undefined,
  discipline: {
    followed_plan: false, traded_in_session: false, respected_risk: false,
    respected_max_trades: false, matched_a_plus: false, no_impulsive_entry: false,
    no_revenge_trade: false, respected_stop_loss: false, journal_completed: false,
    score: 0, notes: "", custom_checks: [],
  } as TradeDiscipline,
  execution_time: "" as string | undefined,
  execution_end_time: "" as string | undefined,
  execution_quality: undefined as TradeJournalEntry["execution_quality"],
};

export default function EditTradePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confluenceInput, setConfluenceInput] = useState("");
  const [showDiscipline, setShowDiscipline] = useState(true);
  const [newCustomLabel, setNewCustomLabel] = useState("");
  const [allAnalyses, setAllAnalyses] = useState<PreTradeAnalysis[]>([]);
  const [customTF, setCustomTF] = useState("");
  const [showCustomTF, setShowCustomTF] = useState(false);
  const [tradeInfo, setTradeInfo] = useState<{ instrument: string; session: string }>({ instrument: "", session: "" });
  const [userId, setUserId] = useState<string | null>(null);
  const [savedConfluences, setSavedConfluences] = useState<string[]>([]);
  const [recordUpdatedAt, setRecordUpdatedAt] = useState<string | null>(null);

  const [form, setForm] = useState(DEFAULT_FORM);
  // Snapshot of the saved trade — a draft only persists once the form diverges
  // from this, so an unchanged edit never shows a spurious "draft restored".
  const baselineRef = useRef<typeof DEFAULT_FORM | null>(null);

  useEffect(() => {
    Promise.all([getTradeById(id), getAnalyses(), getProfile()]).then(([trade, analyses, profile]) => {
      setAllAnalyses(analyses);
      if (profile?.id) setUserId(profile.id);
      // Quick-select confluences are the saved library from Trading Behaviour.
      if (profile?.confluence_options) {
        setSavedConfluences(
          profile.confluence_options.split("\n").map((l) => l.trim()).filter(Boolean)
        );
      }
      if (!trade) { setNotFound(true); setLoading(false); return; }
      setTradeInfo({ instrument: trade.instrument, session: trade.session });

      const existingDiscipline = trade.discipline as TradeDiscipline | undefined;
      const hasExistingChecks = (existingDiscipline?.custom_checks?.length ?? 0) > 0;

      let discipline: TradeDiscipline = existingDiscipline ?? DEFAULT_FORM.discipline;

      // Pre-load from profile only when the trade has no custom checks yet
      if (!hasExistingChecks && profile?.discipline_rules) {
        const checks = profile.discipline_rules
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean)
          .map((label) => ({ label, passed: false }));
        if (checks.length > 0) {
          discipline = { ...discipline, custom_checks: checks, score: 0 };
        }
      }

      const loaded: typeof DEFAULT_FORM = {
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
        execution_notes: trade.execution_notes ?? "",
        psychology_notes: trade.psychology_notes ?? "",
        mistakes: trade.mistakes ?? "",
        lessons: trade.lessons ?? "",
        linked_analysis_id: trade.linked_analysis_id,
        discipline,
        execution_time: trade.execution_time ?? "",
        execution_end_time: trade.execution_end_time ?? "",
        execution_quality: (trade as TradeJournalEntry).execution_quality,
      };
      baselineRef.current = loaded;
      setRecordUpdatedAt(trade.updated_at);
      setForm(loaded);
      setLoading(false);
    });
  }, [id]);

  // Auto-save / restore unsaved edits. `ready` waits for the trade to load, and
  // `recordUpdatedAt` discards any draft older than the last saved version.
  const shouldPersist = useCallback(
    (v: typeof DEFAULT_FORM) =>
      baselineRef.current != null && JSON.stringify(v) !== JSON.stringify(baselineRef.current),
    []
  );
  const { restored, clear: clearDraft, dismiss } = useFormDraft<typeof DEFAULT_FORM>({
    key: `trade:edit:${id}`,
    value: form,
    apply: setForm,
    ready: !loading,
    shouldPersist,
    recordUpdatedAt,
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function calcScore(custom: { label: string; passed: boolean }[]): number {
    if (custom.length === 0) return 0;
    return Math.round((custom.filter((c) => c.passed).length / custom.length) * 100);
  }

  function toggleCustomCheck(idx: number) {
    setForm((prev) => {
      const custom = [...(prev.discipline?.custom_checks ?? [])];
      custom[idx] = { ...custom[idx], passed: !custom[idx].passed };
      const score = calcScore(custom);
      return { ...prev, discipline: { ...prev.discipline!, custom_checks: custom, score } };
    });
  }

  function addCustomCheck() {
    const label = newCustomLabel.trim();
    if (!label) return;
    setForm((prev) => {
      const custom = [...(prev.discipline?.custom_checks ?? []), { label, passed: false }];
      const score = calcScore(custom);
      return { ...prev, discipline: { ...prev.discipline!, custom_checks: custom, score } };
    });
    setNewCustomLabel("");
  }

  function removeCustomCheck(idx: number) {
    setForm((prev) => {
      const custom = (prev.discipline?.custom_checks ?? []).filter((_, i) => i !== idx);
      const score = calcScore(custom);
      return { ...prev, discipline: { ...prev.discipline!, custom_checks: custom, score } };
    });
  }

  function addConfluence() {
    const t = confluenceInput.trim();
    if (t && !form.confluences.includes(t)) {
      set("confluences", [...form.confluences, t]);
      setConfluenceInput("");
    }
  }

  function toggleConfluence(c: string) {
    set(
      "confluences",
      form.confluences.includes(c)
        ? form.confluences.filter((x) => x !== c)
        : [...form.confluences, c]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateTrade(id, form);
      clearDraft(); // saved for real — drop the draft
      router.push(`/journal/${id}`);
    } catch (err) {
      console.error("Failed to save trade:", err);
      setSaving(false);
    }
  }

  const customChecks = form.discipline?.custom_checks ?? [];
  const disciplineScore = form.discipline?.score ?? 0;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );

  if (notFound) return (
    <div className="text-center py-20">
      <p className="text-muted-foreground text-sm">Trade not found.</p>
      <Link href="/journal" className="text-primary text-sm hover:underline mt-2 inline-block">← Back to journal</Link>
    </div>
  );

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href={`/journal/${id}`} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Trade
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Edit Trade</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{tradeInfo.instrument} · {tradeInfo.session} session</p>
      </div>

      {restored && <DraftBanner onDismiss={dismiss} label="Draft restored — you have unsaved edits from before." />}

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
                <DateField
                  value={form.date_time}
                  onChange={(v) => { set("date_time", v); set("linked_analysis_id", undefined); }}
                  required
                />
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

            {/* Execution quality — the "i" explains what the two answers mean. */}
            <ExecutionQualityField
              value={form.execution_quality}
              onChange={(next) => set("execution_quality", next)}
            />

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
                  <button type="button" onClick={() => setShowCustomTF((v) => !v)}
                    className={cn("px-2.5 py-1 rounded-lg text-xs font-medium transition-all",
                      showCustomTF ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}>
                    Custom
                  </button>
                </div>
                {showCustomTF && (
                  <div className="flex gap-2 mt-1.5">
                    <Input value={customTF} onChange={(e) => setCustomTF(e.target.value)}
                      placeholder="e.g. 15s, 2H" className="h-8 text-xs font-mono max-w-32"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const v = normalizeTimeframe(customTF);
                          if (v) { const parts = form.timeframe ? form.timeframe.split(" / ").filter(Boolean) : []; if (!parts.includes(v)) set("timeframe", [...parts, v].join(" / ")); setCustomTF(""); setShowCustomTF(false); }
                        }
                      }} />
                    <Button type="button" size="sm" variant="outline" className="h-8 px-3 text-xs"
                      onClick={() => { const v = normalizeTimeframe(customTF); if (v) { const parts = form.timeframe ? form.timeframe.split(" / ").filter(Boolean) : []; if (!parts.includes(v)) set("timeframe", [...parts, v].join(" / ")); setCustomTF(""); setShowCustomTF(false); } }}>
                      Add
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">R:R</Label>
                <Input type="number" step="0.1" min="0" value={form.rr}
                  onChange={(e) => set("rr", parseFloat(e.target.value) || 0)}
                  className="h-11 text-sm font-mono" required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Entry Time</Label>
                <TimeField value={form.execution_time ?? ""} onChange={(v) => set("execution_time", v)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Exit Time</Label>
                <TimeField value={form.execution_end_time ?? ""} onChange={(v) => set("execution_end_time", v)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Link to Analysis */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Analysis — {form.date_time}</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const analyses = allAnalyses.filter((a) => a.date === form.date_time);
              return analyses.length === 0 ? (
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
              );
            })()}
          </CardContent>
        </Card>

        {/* Confluences */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Confluences</CardTitle></CardHeader>
          <CardContent>
            {savedConfluences.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-muted-foreground mb-2">Quick select</p>
                <div className="flex flex-wrap gap-1.5">
                  {savedConfluences.map((c) => {
                    const active = form.confluences.includes(c);
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => toggleConfluence(c)}
                        className={cn(
                          "inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border transition-colors",
                          active
                            ? "bg-primary/15 text-primary border-primary/40"
                            : "bg-background/50 text-muted-foreground border-border/50 hover:text-foreground hover:border-border"
                        )}
                      >
                        {active && <Check className="w-3 h-3" />}
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
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
                {customChecks.length > 0 && (
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden max-w-28" style={{ background: "oklch(0.18 0.005 28)" }}>
                      <div className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${disciplineScore}%`,
                          background: disciplineScore >= 80 ? "var(--win)"
                            : disciplineScore >= 60 ? "var(--be)" : "var(--loss)",
                        }} />
                    </div>
                    <span className="text-xs font-bold tabular-nums shrink-0"
                      style={{
                        color: disciplineScore >= 80 ? "var(--win)"
                          : disciplineScore >= 60 ? "var(--be)" : "var(--loss)",
                      }}>
                      {disciplineScore}%
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
              {customChecks.length === 0 && (
                <p className="text-xs text-muted-foreground/60 text-center py-2">
                  No rules yet — add your personal discipline rules below.
                </p>
              )}
              <div className="space-y-1.5">
                {customChecks.map((item, idx) => (
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
              </div>

              <div className="flex gap-2 pt-1">
                <Input value={newCustomLabel} onChange={(e) => setNewCustomLabel(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomCheck())}
                  placeholder="Add discipline rule..."
                  className="h-8 text-xs" />
                <Button type="button" variant="outline" size="sm" onClick={addCustomCheck} className="h-8 shrink-0">
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Execution & Psychology */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Execution Notes</CardTitle></CardHeader>
          <CardContent>
            <Textarea
              value={form.execution_notes}
              onChange={(e) => set("execution_notes", e.target.value)}
              placeholder="How did you execute the trade? Entry timing, management, exit..."
              className="min-h-24 text-sm resize-none"
            />
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Psychology</CardTitle></CardHeader>
          <CardContent>
            <Textarea
              value={form.psychology_notes}
              onChange={(e) => set("psychology_notes", e.target.value)}
              placeholder="How did you feel? Emotions, mindset, discipline during this trade..."
              className="min-h-24 text-sm resize-none"
            />
          </CardContent>
        </Card>

        <div className="grid sm:grid-cols-2 gap-5">
          <Card className="shadow-sm">
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Mistakes</CardTitle></CardHeader>
            <CardContent>
              <Textarea
                value={form.mistakes}
                onChange={(e) => set("mistakes", e.target.value)}
                placeholder="What went wrong or could have been better?"
                className="min-h-20 text-sm resize-none"
              />
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Lessons</CardTitle></CardHeader>
            <CardContent>
              <Textarea
                value={form.lessons}
                onChange={(e) => set("lessons", e.target.value)}
                placeholder="What did you learn from this trade?"
                className="min-h-20 text-sm resize-none"
              />
            </CardContent>
          </Card>
        </div>

        {/* Screenshots */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Screenshots</CardTitle></CardHeader>
          <CardContent>
            <ScreenshotUpload
              groups={form.screenshot_groups}
              onChange={(g) => set("screenshot_groups", g)}
              storageConfig={userId ? { userId, entityType: "trades", entityId: id } : undefined}
            />
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
