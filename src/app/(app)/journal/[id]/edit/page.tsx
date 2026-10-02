"use client";

import { use, useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, X, Check } from "lucide-react";
import { DateField, TimeField, RRField } from "@/components/journal/field-inputs";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getTradeById, updateTrade, getAnalyses, getProfile, getAccounts, getTradeRuleChecks, getRuleSourcesForDate, saveTradeRuleChecks, type AnalysisListRow, type RuleCheckDraft } from "@/lib/supabase/queries";
import { invalidateReads } from "@/lib/supabase/cache";
import { ScreenshotUpload } from "@/components/screenshot-upload";
import type { Direction, TradeResult, Session, TradeDiscipline, TradeJournalEntry, FundedAccount } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AnalysisPicker } from "@/components/journal/analysis-picker";
import { TIMEFRAMES, normalizeTimeframe } from "@/lib/timeframes";
import { useFormDraft } from "@/lib/drafts";
import { DraftBanner } from "@/components/ui/draft-banner";
import { InstrumentPicker } from "@/components/journal/instrument-picker";
import { marketOf, tradedInstruments } from "@/lib/instruments";

const SESSIONS: Session[] = ["London", "New York", "Asia"];

import type { Market } from "@/lib/types";
import { ExecutionQualityField } from "@/components/journal/execution-quality-field";
import { RuleChecksEditor } from "@/components/journal/rule-checks-editor";
import { useAccess } from "@/components/access/access-provider";

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
  funded_account_id: null as string | null,
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
  const { entitlements } = useAccess();
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confluenceInput, setConfluenceInput] = useState("");
  const [ruleChecks, setRuleChecks] = useState<RuleCheckDraft[]>([]);
  const [allAnalyses, setAllAnalyses] = useState<AnalysisListRow[]>([]);
  const [accounts, setAccounts] = useState<FundedAccount[]>([]);
  const [markets, setMarkets] = useState<string[]>([]);
  const [customTF, setCustomTF] = useState("");
  const [showCustomTF, setShowCustomTF] = useState(false);
  const [tradeInfo, setTradeInfo] = useState<{ instrument: string; session: string }>({ instrument: "", session: "" });
  const [savedConfluences, setSavedConfluences] = useState<string[]>([]);
  const [recordUpdatedAt, setRecordUpdatedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ruleDateRef = useRef<string | null>(null);

  const [form, setForm] = useState(DEFAULT_FORM);
  // Snapshot of the saved trade: a draft only persists once the form diverges
  // from this, so an unchanged edit never shows a spurious "draft restored".
  const baselineRef = useRef<typeof DEFAULT_FORM | null>(null);

  useEffect(() => {
    invalidateReads("analyses", "profile");
    Promise.all([getTradeById(id), getAnalyses(), getProfile(), getTradeRuleChecks(id), getAccounts()]).then(async ([trade, analyses, profile, savedChecks, accountRows]) => {
      setAllAnalyses(analyses);
      setAccounts(accountRows);
      // Quick-select confluences are the saved library from Trading Behaviour.
      setMarkets(tradedInstruments(profile));
      if (profile?.confluence_options) {
        setSavedConfluences(
          profile.confluence_options.split("\n").map((l) => l.trim()).filter(Boolean)
        );
      }
      if (!trade) { setNotFound(true); setLoading(false); return; }
      const tradeDate = trade.date_time.slice(0, 10);
      setRuleChecks(savedChecks.length ? savedChecks : await getRuleSourcesForDate(tradeDate));
      ruleDateRef.current = tradeDate;
      setTradeInfo({ instrument: trade.instrument, session: trade.session });

      const existingDiscipline = trade.discipline as TradeDiscipline | undefined;
      const discipline: TradeDiscipline = existingDiscipline ?? DEFAULT_FORM.discipline;

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
        funded_account_id: trade.funded_account_id ?? null,
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

  useEffect(() => {
    if (loading) return;
    // Keep every existing snapshot untouched while the date is unchanged. If
    // the trade moves to another day, only unresolved checks are refreshed;
    // an assessment already made remains part of the trade's audit trail.
    if (ruleDateRef.current === form.date_time) return;
    getRuleSourcesForDate(form.date_time).then((sources) => setRuleChecks((current) => {
      const resolved = current.filter((check) => check.status !== "not_applicable");
      ruleDateRef.current = form.date_time;
      return [...resolved, ...sources.filter((source) => !resolved.some((check) => check.source_type === source.source_type && check.source_id === source.source_id))];
    })).catch(() => {});
  }, [form.date_time, loading]);

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

  // The market follows from the instrument (futures, forex, CFD, crypto).
  const pickInstrument = useCallback((symbol: string) => {
    setForm((prev) => ({ ...prev, instrument: symbol, market: marketOf(symbol) }));
  }, []);

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
    // A win is worth exactly its R:R, so that one cannot be left blank. A loss
    // and a scratch are fixed at -1R and 0R, and are saved without it.
    if (form.result === "win" && !(form.rr > 0)) {
      setError("Enter the R:R this winning trade returned.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await updateTrade(id, form);
      await saveTradeRuleChecks(id, ruleChecks);
      clearDraft(); // saved for real: drop the draft
      router.push(`/journal/${id}`);
    } catch (err) {
      console.error("Failed to save trade:", err);
      setSaving(false);
    }
  }

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
    <div className="space-y-4">
      {/* Same compact header as Log Trade: actions in view, no scroll to submit. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link href={`/journal/${id}`} aria-label="Back to Trade"
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-border/60 text-muted-foreground hover:text-foreground transition-colors shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight leading-none">Edit Trade</h1>
            <p className="truncate text-xs text-muted-foreground mt-1">{tradeInfo.instrument} · {tradeInfo.session} session</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href={`/journal/${id}`}><Button type="button" variant="outline" size="sm">Cancel</Button></Link>
          <Button type="submit" form="edit-trade-form" size="sm" disabled={saving}>{saving ? "Saving..." : "Save changes"}</Button>
        </div>
      </div>

      {restored && <DraftBanner onDismiss={dismiss} label="Draft restored: you have unsaved edits from before." />}

      {error && (
        <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
          {error}
        </div>
      )}

      <form id="edit-trade-form" onSubmit={handleSubmit}>
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
                <InstrumentPicker value={form.instrument} onChange={pickInstrument} preferred={markets} autoFill={false} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Date *</Label>
                <DateField
                  value={form.date_time}
                  onChange={(v) => { set("date_time", v); set("linked_analysis_id", undefined); }}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Account</Label>
                <select value={form.funded_account_id ?? ""} onChange={(event) => set("funded_account_id", event.target.value || null)} className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm">
                  <option value="">No account selected</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.firm_name} · {account.account_name}</option>)}
                </select>
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

            {/* Execution quality: the "i" explains what the two answers mean. */}
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
                {/* Only a win is scored off R:R: a loss is -1R and a scratch 0R
                    whatever is typed here, so it is asked for, not demanded. */}
                <Label htmlFor="rr" className="text-xs">R:R{form.result === "win" ? " *" : ""}</Label>
                <RRField id="rr" value={form.rr > 0 ? form.rr : null} onChange={(v) => set("rr", v ?? 0)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Entry Time</Label>
                <TimeField
                  value={form.execution_time ?? ""}
                  onChange={(v) => set("execution_time", v)}
                  placeholder="e.g. 09:32"
                  label="Entry time"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Exit Time</Label>
                <TimeField
                  value={form.execution_end_time ?? ""}
                  onChange={(v) => set("execution_end_time", v)}
                  placeholder="e.g. 10:14"
                  label="Exit time"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes: execution, psychology, mistakes & lessons in one compact block */}
        <Card className="bg-card border-border/50 shadow-sm">
          <CardHeader className="pb-2.5"><CardTitle className="text-sm font-semibold">Notes</CardTitle></CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Execution</Label>
              <Textarea
                value={form.execution_notes}
                onChange={(e) => set("execution_notes", e.target.value)}
                placeholder="Entry timing, management, exit..."
                className="min-h-[68px] text-sm bg-background/50 resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Psychology</Label>
              <Textarea
                value={form.psychology_notes}
                onChange={(e) => set("psychology_notes", e.target.value)}
                placeholder="Emotions, mindset, discipline..."
                className="min-h-[68px] text-sm bg-background/50 resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Mistakes</Label>
              <Textarea
                value={form.mistakes}
                onChange={(e) => set("mistakes", e.target.value)}
                placeholder="What could have been better?"
                className="min-h-[68px] text-sm bg-background/50 resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Lessons</Label>
              <Textarea
                value={form.lessons}
                onChange={(e) => set("lessons", e.target.value)}
                placeholder="What did you learn?"
                className="min-h-[68px] text-sm bg-background/50 resize-none"
              />
            </div>
          </CardContent>
        </Card>
        </div>

        {/* ── RIGHT: analysis, confluences, discipline & screenshots ── */}
        <div className="space-y-4 min-w-0">
        {/* Link to Analysis */}
        <Card className="bg-card border-border/50 shadow-sm">
          <CardHeader className="pb-2.5">
            <CardTitle className="text-sm font-semibold">Link analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <AnalysisPicker
              analyses={allAnalyses}
              date={form.date_time}
              value={form.linked_analysis_id}
              onChange={(id) => set("linked_analysis_id", id)}
            />
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

        {/* Discipline checklist: the day's commitment and the standing rules */}
        <Card className="bg-card border-border/50 shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Discipline Check</CardTitle></CardHeader>
          <CardContent><RuleChecksEditor checks={ruleChecks} onChange={setRuleChecks} /></CardContent>
        </Card>

        {/* Screenshots */}
        {entitlements.screenshots ? <Card className="bg-card border-border/50 shadow-sm">
          <CardHeader className="pb-2.5"><CardTitle className="text-sm font-semibold">Screenshots</CardTitle></CardHeader>
          <CardContent>
            <ScreenshotUpload
              groups={form.screenshot_groups}
              onChange={(g) => set("screenshot_groups", g)}
              storageConfig={{ entityType: "trades", entityId: id }}
            />
          </CardContent>
        </Card> : <Card className="border-border/50 bg-card"><CardContent className="flex items-center justify-between gap-4 p-4"><div><p className="text-sm font-semibold">Trade screenshots</p><p className="mt-0.5 text-xs text-muted-foreground">Plus unlocks screenshots and advanced analytics.</p></div><Link href="/pricing" className="shrink-0 text-xs font-semibold text-primary hover:underline">Compare plans</Link></CardContent></Card>}
        </div>
        </div>
      </form>
    </div>
  );
}
