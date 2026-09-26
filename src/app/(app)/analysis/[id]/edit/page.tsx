"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { getAnalysisById, updateAnalysis } from "@/lib/supabase/queries";
import { ChartTab } from "@/components/analysis/chart-tab";
import type { PreTradeAnalysis } from "@/lib/types";
import type { Bias } from "@/lib/types";
import { cn } from "@/lib/utils";

const INSTRUMENTS = ["NQ", "ES", "GOLD"];
const BIASES: Bias[] = ["bullish", "bearish", "choppy"];

export default function EditAnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [analysis, setAnalysis] = useState<PreTradeAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"htf" | "ltf">("htf");

  const [form, setFormState] = useState({
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

  useEffect(() => {
    getAnalysisById(id).then((a) => {
      if (!a) { setNotFound(true); setLoading(false); return; }
      setAnalysis(a);
      const existingHtf = a.screenshot_groups?.find((g) => g.label.startsWith("HTF"));
      const existingLtf = a.screenshot_groups?.find((g) => g.label.startsWith("LTF"));
      setFormState({
        date: a.date,
        instrument: a.instrument,
        bias: a.bias as Bias,
        thesis: a.thesis,
        long_scenario: a.long_scenario ?? "",
        short_scenario: a.short_scenario ?? "",
      });
      setHtfTF(() => {
        if (!existingHtf) return "4H / Daily";
        const parts = existingHtf.label.split(" · ");
        return parts.length > 1 ? parts.slice(1).join(" · ") : "4H / Daily";
      });
      setLtfTF(() => {
        if (!existingLtf) return "15m / 5m";
        const parts = existingLtf.label.split(" · ");
        return parts.length > 1 ? parts.slice(1).join(" · ") : "15m / 5m";
      });
      setHtfUrls(existingHtf?.urls ?? []);
      setLtfUrls(existingLtf?.urls ?? []);
      setLoading(false);
    });
  }, [id]);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setFormState((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!analysis) return;
    setSaving(true);
    try {
      await updateAnalysis(id, {
        ...form,
        title: `${form.instrument}: ${form.date}`,
        market: analysis.market,
        session: analysis.session,
        notes: "",
        used_for_trade: analysis.used_for_trade,
        screenshot_groups: [
          { label: `HTF${htfTF ? ` · ${htfTF}` : ""}`, urls: htfUrls },
          { label: `LTF${ltfTF ? ` · ${ltfTF}` : ""}`, urls: ltfUrls },
        ],
      });
      router.push(`/analysis/${id}`);
    } catch (err) {
      console.error("Failed to save analysis:", err);
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
      <p className="text-muted-foreground text-sm">Analysis not found.</p>
      <Link href="/analysis" className="text-primary text-sm hover:underline mt-2 inline-block">← Back</Link>
    </div>
  );

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href={`/analysis/${id}`} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Analysis
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Edit Analysis</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{form.instrument} · {form.date}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card className="shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Basics</CardTitle></CardHeader>
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
                {!INSTRUMENTS.includes(form.instrument) && (
                  <Input value={form.instrument} onChange={(e) => set("instrument", e.target.value.toUpperCase())}
                    className="h-8 text-sm mt-1" placeholder="Custom instrument" />
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Date</Label>
                <Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} className="h-9 text-sm" required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Bias</Label>
              <div className="flex gap-1.5">
                {BIASES.map((b) => (
                  <button key={b} type="button" onClick={() => set("bias", b)}
                    className={cn("flex-1 py-1.5 rounded-lg text-xs font-medium transition-all capitalize",
                      form.bias === b
                        ? b === "bullish" ? "bg-success text-success-foreground"
                          : b === "bearish" ? "bg-destructive text-white"
                          : "bg-warning text-warning-foreground"
                        : "bg-muted text-muted-foreground hover:text-foreground")}>
                    {b}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Analysis</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Thesis *</Label>
              <Textarea value={form.thesis} onChange={(e) => set("thesis", e.target.value)}
                className="text-sm min-h-24 resize-none" required />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Long Scenario <span className="ml-1 text-success text-[10px] font-semibold uppercase">↑</span></Label>
                <Textarea value={form.long_scenario} onChange={(e) => set("long_scenario", e.target.value)}
                  className="text-sm min-h-28 resize-none border-success/25 focus-visible:ring-success/30" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Short Scenario <span className="ml-1 text-destructive text-[10px] font-semibold uppercase">↓</span></Label>
                <Textarea value={form.short_scenario} onChange={(e) => set("short_scenario", e.target.value)}
                  className="text-sm min-h-28 resize-none border-destructive/25 focus-visible:ring-destructive/30" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Charts</CardTitle>
              <div className="flex gap-1">
                {(["htf", "ltf"] as const).map((tab) => (
                  <button key={tab} type="button" onClick={() => setActiveTab(tab)}
                    className={cn("px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wide transition-all",
                      activeTab === tab ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:text-foreground")}>
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
              <ChartTab label="HTF" timeframe={htfTF} onTimeframeChange={setHtfTF}
                urls={htfUrls} onUrlsChange={setHtfUrls} placeholder="e.g. 4H / Daily"
                target={{ entityType: "analyses", entityId: id }} />
            ) : (
              <ChartTab label="LTF" timeframe={ltfTF} onTimeframeChange={setLtfTF}
                urls={ltfUrls} onUrlsChange={setLtfUrls} placeholder="e.g. 15m / 5m"
                target={{ entityType: "analyses", entityId: id }} />
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Link href={`/analysis/${id}`}><Button type="button" variant="outline">Cancel</Button></Link>
          <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save changes"}</Button>
        </div>
      </form>
    </div>
  );
}
