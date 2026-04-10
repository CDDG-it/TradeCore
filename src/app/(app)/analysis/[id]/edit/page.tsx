"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, X } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { getAnalysisById, updateAnalysis } from "@/lib/mock/store";
import { ScreenshotUpload } from "@/components/screenshot-upload";
import type { Bias, Market, Session } from "@/lib/types";
import { cn } from "@/lib/utils";

const SESSIONS: Session[] = ["London", "New York", "Asia"];
const MARKETS: Market[] = ["futures", "commodities"];
const BIASES: Bias[] = ["bullish", "bearish", "neutral"];

export default function EditAnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const analysis = getAnalysisById(id);
  const [saving, setSaving] = useState(false);
  const [confluenceInput, setConfluenceInput] = useState("");
  const [keyLevelInput, setKeyLevelInput] = useState("");

  if (!analysis) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground text-sm">Analysis not found.</p>
        <Link href="/analysis" className="text-primary text-sm hover:underline mt-2 inline-block">← Back</Link>
      </div>
    );
  }

  const [form, setForm] = useState({
    title: analysis.title,
    date: analysis.date,
    instrument: analysis.instrument,
    market: analysis.market,
    session: analysis.session,
    bias: analysis.bias,
    thesis: analysis.thesis,
    key_levels: [...analysis.key_levels],
    planned_setup: analysis.planned_setup,
    confluences: [...analysis.confluences],
    invalidation: analysis.invalidation,
    notes: analysis.notes,
    screenshot_groups: analysis.screenshot_groups ?? [],
    used_for_trade: analysis.used_for_trade,
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function addConfluence() {
    const t = confluenceInput.trim();
    if (t && !form.confluences.includes(t)) { set("confluences", [...form.confluences, t]); setConfluenceInput(""); }
  }
  function addKeyLevel() {
    const t = keyLevelInput.trim();
    if (t && !form.key_levels.includes(t)) { set("key_levels", [...form.key_levels, t]); setKeyLevelInput(""); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await new Promise((r) => setTimeout(r, 300));
    updateAnalysis(id, form);
    router.push(`/analysis/${id}`);
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href={`/analysis/${id}`} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Analysis
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Edit Analysis</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{analysis.instrument} · {analysis.title}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card className="shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Basics</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Instrument</Label>
                <Input value={form.instrument} onChange={(e) => set("instrument", e.target.value.toUpperCase())} className="h-9 text-sm" required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Date</Label>
                <Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} className="h-9 text-sm" required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Title</Label>
              <Input value={form.title} onChange={(e) => set("title", e.target.value)} className="h-9 text-sm" required />
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Market</Label>
                <div className="flex gap-1.5">
                  {MARKETS.map((m) => (
                    <button key={m} type="button" onClick={() => set("market", m)}
                      className={cn("flex-1 py-1.5 rounded-lg text-xs font-medium transition-all capitalize",
                        form.market === m ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Session</Label>
                <div className="flex flex-wrap gap-1">
                  {SESSIONS.map((s) => (
                    <button key={s} type="button" onClick={() => set("session", s)}
                      className={cn("px-2.5 py-1 rounded-lg text-xs font-medium transition-all",
                        form.session === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Bias</Label>
                <div className="flex gap-1">
                  {BIASES.map((b) => (
                    <button key={b} type="button" onClick={() => set("bias", b)}
                      className={cn("flex-1 py-1 rounded-lg text-xs font-medium transition-all capitalize",
                        form.bias === b
                          ? b === "bullish" ? "bg-success text-success-foreground"
                            : b === "bearish" ? "bg-destructive text-white"
                            : "bg-muted text-foreground"
                          : "bg-muted text-muted-foreground hover:text-foreground")}>
                      {b}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Analysis</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Thesis</Label>
              <Textarea value={form.thesis} onChange={(e) => set("thesis", e.target.value)} className="text-sm min-h-24 resize-none" required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Planned Setup</Label>
              <Input value={form.planned_setup} onChange={(e) => set("planned_setup", e.target.value)} className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Key Levels <span className="text-muted-foreground/60 font-normal">(optional)</span></Label>
              <div className="flex gap-2">
                <Input value={keyLevelInput} onChange={(e) => setKeyLevelInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addKeyLevel())}
                  placeholder="e.g. 3328.5" className="h-9 text-sm font-mono" />
                <Button type="button" variant="outline" size="sm" onClick={addKeyLevel}><Plus className="w-3.5 h-3.5" /></Button>
              </div>
              {form.key_levels.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.key_levels.map((l) => (
                    <span key={l} className="inline-flex items-center gap-1 text-xs font-mono bg-secondary text-secondary-foreground px-2.5 py-1 rounded-lg border border-border/50">
                      {l}
                      <button type="button" onClick={() => set("key_levels", form.key_levels.filter((x) => x !== l))}
                        className="hover:text-destructive transition-colors"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Confluences</Label>
              <div className="flex gap-2">
                <Input value={confluenceInput} onChange={(e) => setConfluenceInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addConfluence())}
                  placeholder="Add confluence..." className="h-9 text-sm" />
                <Button type="button" variant="outline" size="sm" onClick={addConfluence}><Plus className="w-3.5 h-3.5" /></Button>
              </div>
              {form.confluences.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.confluences.map((c) => (
                    <span key={c} className="inline-flex items-center gap-1 text-xs bg-secondary text-secondary-foreground px-2.5 py-1 rounded-lg border border-border/50">
                      {c}
                      <button type="button" onClick={() => set("confluences", form.confluences.filter((x) => x !== c))}
                        className="hover:text-destructive transition-colors"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Invalidation</Label>
              <Input value={form.invalidation} onChange={(e) => set("invalidation", e.target.value)} className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Notes</Label>
              <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} className="text-sm min-h-20 resize-none" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Screenshots</CardTitle></CardHeader>
          <CardContent>
            <ScreenshotUpload groups={form.screenshot_groups} onChange={(g) => set("screenshot_groups", g)} />
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
