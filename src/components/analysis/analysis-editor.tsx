"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Save, TrendingDown, TrendingUp } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { AnalysisChartBoard } from "@/components/analysis/analysis-chart-board";
import { AnalysisNewsBrief } from "@/components/analysis/analysis-news-brief";
import { InstrumentPicker } from "@/components/journal/instrument-picker";
import { DraftBanner } from "@/components/ui/draft-banner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useFormDraft } from "@/lib/drafts";
import { marketOf, tradedInstruments } from "@/lib/instruments";
import { createAnalysis, getProfile, updateAnalysis } from "@/lib/supabase/queries";
import type { Bias, PreTradeAnalysis, ScreenshotGroup } from "@/lib/types";
import { cn } from "@/lib/utils";

type AnalysisForm = Pick<PreTradeAnalysis, "date" | "instrument" | "bias" | "thesis" | "long_scenario" | "short_scenario">;
const DEFAULT_GROUPS: ScreenshotGroup[] = [{ label: "4H", urls: [] }, { label: "15m", urls: [] }];
const BIASES: { value: Bias; label: string; className: string }[] = [
  { value: "bullish", label: "Bullish", className: "border-success/35 bg-success/10 text-success" },
  { value: "bearish", label: "Bearish", className: "border-destructive/35 bg-destructive/10 text-destructive" },
  { value: "choppy", label: "Choppy", className: "border-warning/35 bg-warning/10 text-warning" },
];

export function AnalysisEditor({ mode, analysisId, initial, preview = false }: {
  mode: "new" | "edit";
  analysisId: string;
  initial?: PreTradeAnalysis;
  preview?: boolean;
}) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [step, setStep] = useState<"context" | "scenarios">("context");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [markets, setMarkets] = useState<string[]>([]);
  const [form, setForm] = useState<AnalysisForm>(() => ({
    date: initial?.date ?? new Date().toISOString().split("T")[0],
    instrument: initial?.instrument ?? "",
    bias: initial?.bias ?? "bullish",
    thesis: initial?.thesis ?? "",
    long_scenario: initial?.long_scenario ?? "",
    short_scenario: initial?.short_scenario ?? "",
  }));
  const [groups, setGroups] = useState<ScreenshotGroup[]>(() => initial?.screenshot_groups?.length ? initial.screenshot_groups : DEFAULT_GROUPS);
  const target = useMemo(() => preview ? null : ({ entityType: "analyses" as const, entityId: analysisId }), [preview, analysisId]);

  useEffect(() => {
    if (preview) return;
    getProfile().then((profile) => setMarkets(tradedInstruments(profile))).catch(() => {});
  }, [preview]);
  const pickInstrument = useCallback((instrument: string) => setForm((value) => ({ ...value, instrument })), []);
  function set<K extends keyof AnalysisForm>(key: K, value: AnalysisForm[K]) { setForm((prev) => ({ ...prev, [key]: value })); }

  const draftValue = useMemo(() => ({ form, groups }), [form, groups]);
  const applyDraft = useCallback((data: typeof draftValue) => {
    if (!data?.form || typeof data.form !== "object") return;
    setForm((previous) => ({ ...previous, ...data.form }));
    if (Array.isArray(data.groups)) setGroups(data.groups);
    else {
      // Existing new-analysis drafts used one combined HTF and LTF group.
      const legacy = data as typeof data & { htfTF?: string; ltfTF?: string; htfUrls?: string[]; ltfUrls?: string[] };
      setGroups([
        { label: legacy.htfTF || "4H", urls: legacy.htfUrls ?? [] },
        { label: legacy.ltfTF || "15m", urls: legacy.ltfUrls ?? [] },
      ]);
    }
  }, []);
  const { restored, clear, dismiss } = useFormDraft({
    key: preview ? "analysis:preview-design" : mode === "new" ? "analysis:new" : `analysis:edit:${analysisId}`,
    value: draftValue,
    apply: applyDraft,
    recordUpdatedAt: initial?.updated_at,
    shouldPersist: (value) => !preview && !!value?.form && (
      !!value.form.thesis || !!value.form.long_scenario || !!value.form.short_scenario ||
      (Array.isArray(value.groups) && value.groups.some((group) => group.urls.length > 0)) ||
      (Array.isArray((value as typeof value & { htfUrls?: string[] }).htfUrls) && (value as typeof value & { htfUrls?: string[] }).htfUrls!.length > 0)
    ),
  });

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (preview || saving || uploading) return;
    if (!form.instrument || !form.date || !form.thesis.trim()) {
      setStep("context");
      setSaveError(!form.instrument ? "Choose an instrument before saving." : !form.date ? "Choose an analysis date before saving." : "Write your thesis before saving.");
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      const input = {
        ...form,
        title: `${form.instrument}: ${form.date}`,
        market: initial && form.instrument === initial.instrument ? initial.market : marketOf(form.instrument),
        session: initial?.session ?? "New York" as const,
        notes: initial?.notes ?? "",
        used_for_trade: initial?.used_for_trade ?? false,
        screenshot_groups: groups,
      };
      if (mode === "new") {
        const created = await createAnalysis(input, analysisId);
        clear();
        router.push(`/analysis/${created.id}`);
      } else {
        await updateAnalysis(analysisId, input);
        clear();
        router.push(`/analysis/${analysisId}`);
      }
    } catch {
      setSaveError("Could not save this analysis. Check your connection and try again.");
      setSaving(false);
    }
  }

  const cancelHref = preview ? "/preview/analysis" : mode === "edit" ? `/analysis/${analysisId}` : "/analysis";
  return (
    <div className="flex flex-col gap-3 lg:h-[calc(100dvh-7.25rem)] lg:min-h-[38rem] lg:overflow-hidden">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link href={cancelHref} aria-label="Back to analyses" className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/70 text-muted-foreground transition-colors hover:text-foreground"><ArrowLeft className="size-4" /></Link>
          <div className="min-w-0">
            <h1 className="font-heading text-xl font-bold leading-tight tracking-tight text-foreground">{mode === "new" ? "New analysis" : "Edit analysis"}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={cancelHref} className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground">Cancel</Link>
          <button type="submit" form="analysis-workspace-form" disabled={preview || saving || uploading}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-85 disabled:opacity-50">
            <Save className="size-3.5" /> {saving ? "Saving..." : uploading ? "Uploading..." : preview ? "Design preview" : mode === "new" ? "Save analysis" : "Save changes"}
          </button>
        </div>
      </header>
      {restored && <DraftBanner onDismiss={dismiss} />}
      {saveError && <p role="alert" className="rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2 text-xs text-destructive">{saveError}</p>}

      <form id="analysis-workspace-form" onSubmit={save} noValidate className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(22rem,0.9fr)_minmax(0,1.1fr)]">
        <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/75">
          <div className="shrink-0 border-b border-border/60 p-3 sm:p-4">
            <div role="tablist" aria-label="Analysis sections" className="grid grid-cols-2 gap-1 rounded-xl border border-border/50 bg-background/55 p-1">
              {(["context", "scenarios"] as const).map((item) => <button key={item} type="button" role="tab" aria-selected={step === item} onClick={() => setStep(item)}
                className={cn("rounded-lg px-3 py-2 text-xs font-semibold transition-[background-color,color,box-shadow]", step === item ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                {item === "context" ? "Market context" : "Trade scenarios"}
              </button>)}
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
            <AnimatePresence mode="wait" initial={false}>
              {step === "context" ? <motion.div key="context" role="tabpanel" className="flex min-h-full flex-col gap-4"
                initial={{ opacity: 0, transform: reduce ? "none" : "translateY(8px)" }} animate={{ opacity: 1, transform: "translateY(0)" }} exit={{ opacity: 0 }} transition={{ duration: .18, ease: [.23, 1, .32, 1] }}>
                <div className="space-y-2"><Label className="text-xs font-semibold">Instrument <span className="text-primary">*</span></Label><InstrumentPicker value={form.instrument} onChange={pickInstrument} preferred={markets} autoFill={!initial && !preview} compact /></div>
                <div className="space-y-2"><Label htmlFor="analysis-date" className="text-xs font-semibold">Analysis date</Label><Input id="analysis-date" type="date" value={form.date} onChange={(event) => set("date", event.target.value)} required className="h-10 bg-background/60" /></div>
                <div className="space-y-2"><Label className="text-xs font-semibold">Current bias</Label><div className="grid grid-cols-3 gap-2">{BIASES.map((bias) => <button key={bias.value} type="button" onClick={() => set("bias", bias.value)} aria-pressed={form.bias === bias.value}
                  className={cn("rounded-xl border px-2 py-2.5 text-xs font-semibold transition-[background-color,border-color,color]", form.bias === bias.value ? bias.className : "border-border/70 bg-background/50 text-muted-foreground hover:text-foreground")}>{bias.label}</button>)}</div></div>
                <div className="flex min-h-56 flex-1 flex-col gap-2"><Label htmlFor="analysis-thesis" className="text-xs font-semibold">Thesis <span className="text-primary">*</span></Label><p className="text-[11px] leading-relaxed text-muted-foreground">What is price doing, which levels matter and what would change your read?</p><Textarea id="analysis-thesis" value={form.thesis} onChange={(event) => set("thesis", event.target.value)} required placeholder="Market structure, key level, catalyst and the reason this matters..." className="min-h-44 flex-1 resize-y bg-background/60 text-sm leading-relaxed lg:resize-none" /></div>
                <AnalysisNewsBrief date={form.date} preview={preview} />
                <button type="button" onClick={() => setStep("scenarios")} className="inline-flex items-center gap-2 text-xs font-semibold text-primary transition-opacity hover:opacity-75">Continue to scenarios <ArrowRight className="size-3.5" /></button>
              </motion.div> : <motion.div key="scenarios" role="tabpanel" className="flex min-h-full flex-col gap-4"
                initial={{ opacity: 0, transform: reduce ? "none" : "translateY(8px)" }} animate={{ opacity: 1, transform: "translateY(0)" }} exit={{ opacity: 0 }} transition={{ duration: .18, ease: [.23, 1, .32, 1] }}>
                <div><h2 className="text-lg font-semibold tracking-tight">Plan both sides before price moves</h2><p className="mt-1 text-xs leading-relaxed text-muted-foreground">A scenario is conditional. Write what must happen, where the idea fails and what you will do next.</p></div>
                <div className="flex min-h-56 flex-1 flex-col rounded-xl border border-success/20 bg-success/[.04] p-3.5 sm:p-4">
                  <div className="flex items-center gap-2 text-success"><TrendingUp className="size-4" /><Label htmlFor="analysis-long" className="text-sm font-semibold">Long scenario</Label></div>
                  <Textarea id="analysis-long" value={form.long_scenario} onChange={(event) => set("long_scenario", event.target.value)} placeholder="If price holds above... I look for... The idea is wrong below..." className="mt-3 min-h-40 flex-1 resize-y border-success/20 bg-background/60 text-sm leading-relaxed focus-visible:ring-success/30 lg:resize-none" />
                </div>
                <div className="flex min-h-56 flex-1 flex-col rounded-xl border border-destructive/20 bg-destructive/[.04] p-3.5 sm:p-4">
                  <div className="flex items-center gap-2 text-destructive"><TrendingDown className="size-4" /><Label htmlFor="analysis-short" className="text-sm font-semibold">Short scenario</Label></div>
                  <Textarea id="analysis-short" value={form.short_scenario} onChange={(event) => set("short_scenario", event.target.value)} placeholder="If price fails at... I look for... The idea is wrong above..." className="mt-3 min-h-40 flex-1 resize-y border-destructive/20 bg-background/60 text-sm leading-relaxed focus-visible:ring-destructive/30 lg:resize-none" />
                </div>
              </motion.div>}
            </AnimatePresence>
          </div>
        </section>
        <section className="min-h-[35rem] rounded-2xl border border-border/70 bg-card/75 p-4 sm:p-5 lg:min-h-0">
          <AnalysisChartBoard groups={groups} onChange={setGroups} target={target} demo={preview} onUploadingChange={setUploading} />
        </section>
      </form>
    </div>
  );
}
