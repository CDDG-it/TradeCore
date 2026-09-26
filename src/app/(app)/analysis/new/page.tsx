"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createAnalysis } from "@/lib/supabase/queries";
import { ChartTab } from "@/components/analysis/chart-tab";
import type { Bias } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useFormDraft } from "@/lib/drafts";
import { DraftBanner } from "@/components/ui/draft-banner";

const INSTRUMENTS = ["NQ", "ES", "GOLD"];
const BIASES: Bias[] = ["bullish", "bearish", "choppy"];

export default function NewAnalysisPage() {
  const router = useRouter();
  /* Charts upload to Storage under the analysis's own id, so that id has to
     exist before the first one is dropped. It is minted here and handed to
     `createAnalysis` on save, the same way the new-trade screen does it. */
  const [analysisId] = useState(() => crypto.randomUUID());
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"htf" | "ltf">("htf");

  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    instrument: "",
    bias: "bullish" as Bias,
    thesis: "",
    long_scenario: "",
    short_scenario: "",
  });

  const [htfTF, setHtfTF] = useState("4H / Daily");
  const [ltfTF, setLtfTF] = useState("15m / 5m");
  const [htfUrls, setHtfUrls] = useState<string[]>([]);
  const [ltfUrls, setLtfUrls] = useState<string[]>([]);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // Auto-save / restore the whole analysis (fields + chart tabs) as one draft.
  const draftValue = useMemo(
    () => ({ form, htfTF, ltfTF, htfUrls, ltfUrls }),
    [form, htfTF, ltfTF, htfUrls, ltfUrls]
  );
  const applyDraft = useCallback((d: typeof draftValue) => {
    setForm(d.form);
    setHtfTF(d.htfTF);
    setLtfTF(d.ltfTF);
    setHtfUrls(d.htfUrls);
    setLtfUrls(d.ltfUrls);
  }, []);
  const { restored, clear: clearDraft, dismiss } = useFormDraft<typeof draftValue>({
    key: "analysis:new",
    value: draftValue,
    apply: applyDraft,
    shouldPersist: (d) =>
      !!d.form.instrument ||
      !!d.form.thesis ||
      !!d.form.long_scenario ||
      !!d.form.short_scenario ||
      d.htfUrls.length > 0 ||
      d.ltfUrls.length > 0,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.instrument || !form.thesis) return;
    setSaving(true);
    try {
      const created = await createAnalysis({
        ...form,
        title: `${form.instrument}: ${form.date}`,
        market: "futures",
        session: "New York",
        notes: "",
        used_for_trade: false,
        screenshot_groups: [
          { label: `HTF${htfTF ? ` · ${htfTF}` : ""}`, urls: htfUrls },
          { label: `LTF${ltfTF ? ` · ${ltfTF}` : ""}`, urls: ltfUrls },
        ],
        // The row takes the id the charts were already filed under, so the
        // storage folder and the analysis it belongs to stay the same thing.
      }, analysisId);
      clearDraft(); // saved for real: drop the draft
      router.push(`/analysis/${created.id}`);
    } catch (err) {
      console.error("Failed to save analysis:", err);
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Compact header: actions stay in view so the form needs no scroll to submit */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/analysis" aria-label="Back to Analysis"
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-border/60 text-muted-foreground hover:text-foreground transition-colors shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-xl font-bold tracking-tight leading-none">New Analysis</h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/analysis"><Button type="button" variant="outline" size="sm">Cancel</Button></Link>
          <Button type="submit" form="analysis-form" size="sm" disabled={saving}>{saving ? "Saving..." : "Save analysis"}</Button>
        </div>
      </div>

      {restored && <DraftBanner onDismiss={dismiss} />}

      <form id="analysis-form" onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-2 gap-4 items-start">
        {/* ── LEFT: setup & thesis ─────────────────────────────────── */}
        <div className="space-y-4 min-w-0">
        <Card className="bg-card border-border/50 shadow-sm">
          <CardHeader className="pb-2.5"><CardTitle className="text-sm font-semibold">Basics</CardTitle></CardHeader>
          <CardContent className="space-y-4">
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
                <Label htmlFor="date" className="text-xs">Date *</Label>
                <Input id="date" type="date" value={form.date}
                  onChange={(e) => set("date", e.target.value)} className="h-9 text-sm bg-background/50" required />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Bias</Label>
              <div className="flex gap-1.5">
                {BIASES.map((b) => (
                  <button key={b} type="button" onClick={() => set("bias", b)}
                    className={cn("flex-1 py-1.5 rounded-lg text-xs font-medium transition-all capitalize",
                      form.bias === b
                        ? b === "bullish" ? "bg-success text-success-foreground shadow-sm"
                          : b === "bearish" ? "bg-destructive text-white shadow-sm"
                          : "bg-warning text-warning-foreground shadow-sm"
                        : "bg-muted text-muted-foreground hover:text-foreground")}>
                    {b}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50 shadow-sm">
          <CardHeader className="pb-2.5"><CardTitle className="text-sm font-semibold">Analysis</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="thesis" className="text-xs">Thesis *</Label>
              <Textarea id="thesis" value={form.thesis} onChange={(e) => set("thesis", e.target.value)}
                placeholder="What is your read on this market? What is the overall context?"
                className="text-sm bg-background/50 min-h-24 resize-none" required />
            </div>
            <div className="grid gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="long_scenario" className="text-xs">
                  Long Scenario
                  <span className="ml-1.5 text-success text-[10px] font-semibold uppercase tracking-wide">↑</span>
                </Label>
                <Textarea id="long_scenario" value={form.long_scenario}
                  onChange={(e) => set("long_scenario", e.target.value)}
                  placeholder="What triggers a long? Entry conditions, levels, targets..."
                  className="text-sm bg-background/50 min-h-28 resize-none border-success/25 focus-visible:ring-success/30" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="short_scenario" className="text-xs">
                  Short Scenario
                  <span className="ml-1.5 text-destructive text-[10px] font-semibold uppercase tracking-wide">↓</span>
                </Label>
                <Textarea id="short_scenario" value={form.short_scenario}
                  onChange={(e) => set("short_scenario", e.target.value)}
                  placeholder="What triggers a short? Entry conditions, levels, targets..."
                  className="text-sm bg-background/50 min-h-28 resize-none border-destructive/25 focus-visible:ring-destructive/30" />
              </div>
            </div>
          </CardContent>
        </Card>
        </div>

        {/* ── RIGHT: charts ────────────────────────────────────────── */}
        <div className="space-y-4 min-w-0">
        {/* Charts: HTF / LTF */}
        <Card className="bg-card border-border/50 shadow-sm">
          <CardHeader className="pb-2.5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Charts</CardTitle>
              <div className="flex gap-1">
                {(["htf", "ltf"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wide transition-all",
                      activeTab === tab
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {tab}
                    {(tab === "htf" ? htfUrls : ltfUrls).length > 0 && (
                      <span className={cn("ml-1.5 text-[10px]", activeTab === tab ? "opacity-70" : "opacity-50")}>
                        {(tab === "htf" ? htfUrls : ltfUrls).length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {activeTab === "htf" ? (
              <ChartTab
                label="HTF"
                timeframe={htfTF}
                onTimeframeChange={setHtfTF}
                urls={htfUrls}
                onUrlsChange={setHtfUrls}
                placeholder="e.g. 4H / Daily"
                target={{ entityType: "analyses", entityId: analysisId }}
              />
            ) : (
              <ChartTab
                label="LTF"
                timeframe={ltfTF}
                onTimeframeChange={setLtfTF}
                urls={ltfUrls}
                onUrlsChange={setLtfUrls}
                placeholder="e.g. 15m / 5m"
                target={{ entityType: "analyses", entityId: analysisId }}
              />
            )}
          </CardContent>
        </Card>
        </div>
        </div>
      </form>
    </div>
  );
}
