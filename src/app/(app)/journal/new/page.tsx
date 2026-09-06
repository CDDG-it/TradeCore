"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, X, Check } from "lucide-react";
import { DateField, TimeField } from "@/components/journal/field-inputs";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createTrade, getAnalyses, getProfile } from "@/lib/supabase/queries";
import type { PreTradeAnalysis } from "@/lib/types";
import { ScreenshotUpload } from "@/components/screenshot-upload";
import type { TradeJournalEntryInput, Direction, TradeResult, Session, TradeDiscipline, TradeJournalEntry } from "@/lib/types";
import { cn } from "@/lib/utils";
import { TIMEFRAMES, normalizeTimeframe } from "@/lib/timeframes";
import { useFormDraft } from "@/lib/drafts";
import { DraftBanner } from "@/components/ui/draft-banner";

// A draft is only worth keeping once the trader has entered something real —
// keeps pristine, untouched forms from persisting an empty draft.
function tradeDraftHasContent(f: TradeJournalEntryInput): boolean {
  return (
    !!f.instrument ||
    f.confluences.length > 0 ||
    !!f.execution_notes ||
    !!f.psychology_notes ||
    !!f.mistakes ||
    !!f.lessons ||
    !!f.execution_time ||
    !!f.execution_end_time ||
    (f.discipline?.custom_checks?.some((c) => c.passed) ?? false) ||
    (f.screenshot_groups?.some((g) => g.urls.length > 0) ?? false)
  );
}

const INSTRUMENTS = ["NQ", "ES", "GOLD"];
const SESSIONS: Session[] = ["London", "New York", "Asia"];

const EMPTY_DISCIPLINE: TradeDiscipline = {
  followed_plan: false,
  traded_in_session: false,
  respected_risk: false,
  respected_max_trades: false,
  matched_a_plus: false,
  no_impulsive_entry: false,
  no_revenge_trade: false,
  respected_stop_loss: false,
  journal_completed: false,
  score: 0,
  notes: "",
  custom_checks: [],
};

export default function NewTradePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confluenceInput, setConfluenceInput] = useState("");
  const [showDiscipline, setShowDiscipline] = useState(true);
  const [newCustomLabel, setNewCustomLabel] = useState("");
  const [allAnalyses, setAllAnalyses] = useState<PreTradeAnalysis[]>([]);
  const [customTF, setCustomTF] = useState("");
  const [showCustomTF, setShowCustomTF] = useState(false);
  const [savedConfluences, setSavedConfluences] = useState<string[]>([]);
  // Pre-generate entity ID so screenshots can be uploaded before the trade is saved
  const [entityId] = useState(() => crypto.randomUUID());
  const [userId, setUserId] = useState<string | null>(null);

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
    screenshot_groups: [
      { label: "Entry TF", urls: [] },
      { label: "HTF", urls: [] },
    ],
    execution_notes: "",
    psychology_notes: "",
    mistakes: "",
    lessons: "",
    linked_analysis_id: undefined,
    discipline: { ...EMPTY_DISCIPLINE },
    market_context: undefined,
    execution_time: "",
    execution_end_time: "",
    execution_quality: undefined as TradeJournalEntry["execution_quality"],
  });

  useEffect(() => {
    Promise.all([getAnalyses(), getProfile()]).then(([analyses, profile]) => {
      setAllAnalyses(analyses);
      if (profile?.id) setUserId(profile.id);
      // Quick-select confluences are the saved library from Trading Behaviour.
      if (profile?.confluence_options) {
        setSavedConfluences(
          profile.confluence_options.split("\n").map((l) => l.trim()).filter(Boolean)
        );
      }
      if (profile?.discipline_rules) {
        const checks = profile.discipline_rules
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean)
          .map((label) => ({ label, passed: false }));
        if (checks.length > 0) {
          const score = 0;
          setForm((prev) =>
            // Don't overwrite checks a restored draft already brought back.
            (prev.discipline?.custom_checks?.length ?? 0) > 0
              ? prev
              : { ...prev, discipline: { ...prev.discipline!, custom_checks: checks, score } }
          );
        }
      }
    });
  }, []);

  const analyses = allAnalyses.filter((a) => a.date === form.date_time);

  // Auto-save / restore unsaved input so an accidental "back" never loses work.
  const { restored, clear: clearDraft, dismiss } = useFormDraft<TradeJournalEntryInput>({
    key: "trade:new",
    value: form,
    apply: setForm,
    shouldPersist: tradeDraftHasContent,
  });

  function set<K extends keyof TradeJournalEntryInput>(key: K, value: TradeJournalEntryInput[K]) {
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
    if (!form.instrument) {
      setError("Select an instrument before logging the trade.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const created = await createTrade(form, entityId);
      clearDraft(); // saved for real — drop the draft so it can't resurrect
      router.push(`/journal/${created.id}`);
    } catch (err) {
      console.error("Failed to save trade:", err);
      setError(
        err instanceof Error ? err.message : "Something went wrong saving the trade. Please try again."
      );
      setSaving(false);
    }
  }

  const customChecks = form.discipline?.custom_checks ?? [];
  const disciplineScore = form.discipline?.score ?? 0;

  return (
    <div className="space-y-4">
      {/* Compact header — actions stay in view so the form needs no scroll to submit */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/journal" aria-label="Back to Journal"
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-border/60 text-muted-foreground hover:text-foreground transition-colors shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-xl font-bold tracking-tight leading-none">Log Trade</h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/journal"><Button type="button" variant="outline" size="sm">Cancel</Button></Link>
          <Button type="submit" form="trade-form" size="sm" disabled={saving}>{saving ? "Saving..." : "Log trade"}</Button>
        </div>
      </div>

      {restored && <DraftBanner onDismiss={dismiss} />}

      {error && (
        <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
          {error}
        </div>
      )}

      <form id="trade-form" onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-2 gap-4 items-start">
        {/* ── LEFT: trade details + notes ─────────────────────────── */}
        <div className="space-y-4 min-w-0">
        {/* Trade Details */}
        <Card className="bg-card border-border/50 shadow-sm">
          <CardHeader className="pb-2.5"><CardTitle className="text-sm font-semibold">Trade Details</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Instrument *</Label>
                <div className="flex gap-1.5">
                  {INSTRUMENTS.map((inst) => (
                    <button key={inst} type="button" onClick={() => set("instrument", inst)}
                      className={cn("flex-1 py-1.5 rounded-lg text-sm font-medium transition-all font-mono",
                        form.instrument === inst ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:text-foreground")}>
                      {inst}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Date *</Label>
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

            {/* Execution Quality */}
            <div className="space-y-1.5">
              <Label className="text-xs">Execution Quality</Label>
              <div className="flex gap-1.5">
                {(["good", "bad"] as const).map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => set("execution_quality", form.execution_quality === q ? undefined : q)}
                    className={cn(
                      "flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize",
                      form.execution_quality === q
                        ? q === "good"
                          ? "bg-success text-success-foreground shadow-sm"
                          : "bg-destructive text-white shadow-sm"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {q === "good" ? "✓ Good execution" : "✗ Bad execution"}
                  </button>
                ))}
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
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-muted text-muted-foreground hover:text-foreground")}>
                      {tf}
                    </button>
                  ))}
                  <button type="button" onClick={() => setShowCustomTF((v) => !v)}
                    className={cn("px-2.5 py-1 rounded-lg text-xs font-medium transition-all",
                      showCustomTF ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:text-foreground")}>
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
                <Label htmlFor="rr" className="text-xs">R:R *</Label>
                <Input id="rr" type="number" step="0.1" min="0" value={form.rr}
                  onChange={(e) => set("rr", parseFloat(e.target.value) || 0)}
                  className="h-9 text-sm bg-background/50 font-mono" required />
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

        {/* Notes — execution, psychology, mistakes & lessons in one compact block */}
        <Card className="bg-card border-border/50 shadow-sm">
          <CardHeader className="pb-2.5"><CardTitle className="text-sm font-semibold">Notes</CardTitle></CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Execution</Label>
              <Textarea
                value={form.execution_notes ?? ""}
                onChange={(e) => set("execution_notes", e.target.value)}
                placeholder="Entry timing, management, exit..."
                className="min-h-[68px] text-sm bg-background/50 resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Psychology</Label>
              <Textarea
                value={form.psychology_notes ?? ""}
                onChange={(e) => set("psychology_notes", e.target.value)}
                placeholder="Emotions, mindset, discipline..."
                className="min-h-[68px] text-sm bg-background/50 resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Mistakes</Label>
              <Textarea
                value={form.mistakes ?? ""}
                onChange={(e) => set("mistakes", e.target.value)}
                placeholder="What could have been better?"
                className="min-h-[68px] text-sm bg-background/50 resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Lessons</Label>
              <Textarea
                value={form.lessons ?? ""}
                onChange={(e) => set("lessons", e.target.value)}
                placeholder="What did you learn?"
                className="min-h-[68px] text-sm bg-background/50 resize-none"
              />
            </div>
          </CardContent>
        </Card>
        </div>

        {/* ── RIGHT: confluences, discipline, analysis & screenshots ── */}
        <div className="space-y-4 min-w-0">
        {/* Link to Analysis */}
        <Card className="bg-card border-border/50 shadow-sm">
          <CardHeader className="pb-2.5">
            <CardTitle className="text-sm font-semibold">
              Analysis — {form.date_time}
            </CardTitle>
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
        <Card className="bg-card border-border/50 shadow-sm">
          <CardHeader className="pb-2.5"><CardTitle className="text-sm font-semibold">Confluences</CardTitle></CardHeader>
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

        {/* Discipline Check */}
        <Card className="bg-card border-border/50 shadow-sm">
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
                          background: disciplineScore >= 80 ? "oklch(0.58 0.17 145)"
                            : disciplineScore >= 60 ? "#EAB308" : "oklch(0.58 0.22 25)",
                        }} />
                    </div>
                    <span className="text-xs font-bold tabular-nums shrink-0"
                      style={{
                        color: disciplineScore >= 80 ? "oklch(0.58 0.17 145)"
                          : disciplineScore >= 60 ? "#EAB308" : "oklch(0.58 0.22 25)",
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

        {/* Screenshots */}
        <Card className="bg-card border-border/50 shadow-sm">
          <CardHeader className="pb-2.5"><CardTitle className="text-sm font-semibold">Screenshots</CardTitle></CardHeader>
          <CardContent>
            <ScreenshotUpload
              groups={form.screenshot_groups}
              onChange={(g) => set("screenshot_groups", g)}
              storageConfig={userId ? { userId, entityType: "trades", entityId } : undefined}
            />
          </CardContent>
        </Card>
        </div>
        </div>
      </form>
    </div>
  );
}
