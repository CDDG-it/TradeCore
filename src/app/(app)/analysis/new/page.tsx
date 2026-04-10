"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createAnalysis } from "@/lib/mock/store";
import { ScreenshotUpload } from "@/components/screenshot-upload";
import type { PreTradeAnalysisInput, Bias, Market, Session } from "@/lib/types";
import { cn } from "@/lib/utils";

const SESSIONS: Session[] = ["London", "New York", "Asia"];
const MARKETS: Market[] = ["futures", "commodities"];
const BIASES: Bias[] = ["bullish", "bearish", "neutral"];

export default function NewAnalysisPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<PreTradeAnalysisInput>({
    title: "",
    date: new Date().toISOString().split("T")[0],
    instrument: "",
    market: "futures",
    session: "New York",
    bias: "bullish",
    thesis: "",
    long_scenario: "",
    short_scenario: "",
    notes: "",
    screenshot_groups: [],
    used_for_trade: false,
  });

  function set<K extends keyof PreTradeAnalysisInput>(key: K, value: PreTradeAnalysisInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.instrument || !form.title || !form.thesis) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 300));
    const created = createAnalysis(form);
    router.push(`/analysis/${created.id}`);
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href="/analysis" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Analysis
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">New Analysis</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Pre-trade structured preparation</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card className="bg-card border-border/50 shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Basics</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="instrument" className="text-xs">Instrument *</Label>
                <Input id="instrument" value={form.instrument}
                  onChange={(e) => set("instrument", e.target.value.toUpperCase())}
                  placeholder="GC, ES, NQ, CL, ZC..." className="h-9 text-sm bg-background/50" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="date" className="text-xs">Date *</Label>
                <Input id="date" type="date" value={form.date}
                  onChange={(e) => set("date", e.target.value)} className="h-9 text-sm bg-background/50" required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-xs">Title *</Label>
              <Input id="title" value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="e.g. Gold London continuation setup" className="h-9 text-sm bg-background/50" required />
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Market</Label>
                <div className="flex gap-1.5">
                  {MARKETS.map((m) => (
                    <button key={m} type="button" onClick={() => set("market", m)}
                      className={cn("flex-1 py-1.5 rounded-lg text-xs font-medium transition-all capitalize",
                        form.market === m ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:text-foreground")}>
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
                        form.session === s ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:text-foreground")}>
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
                      className={cn("flex-1 py-1.5 rounded-lg text-xs font-medium transition-all capitalize",
                        form.bias === b
                          ? b === "bullish" ? "bg-success text-success-foreground shadow-sm"
                            : b === "bearish" ? "bg-destructive text-white shadow-sm"
                            : "bg-muted text-foreground shadow-sm"
                          : "bg-muted text-muted-foreground hover:text-foreground")}>
                      {b}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50 shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Analysis</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="thesis" className="text-xs">Thesis *</Label>
              <Textarea id="thesis" value={form.thesis} onChange={(e) => set("thesis", e.target.value)}
                placeholder="What is your read on this market? What is the overall context?"
                className="text-sm bg-background/50 min-h-24 resize-none" required />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
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
            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-xs">Notes <span className="text-muted-foreground/60 font-normal">(optional)</span></Label>
              <Textarea id="notes" value={form.notes} onChange={(e) => set("notes", e.target.value)}
                placeholder="Any other context, reminders, or observations..."
                className="text-sm bg-background/50 min-h-20 resize-none" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50 shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Screenshots</CardTitle></CardHeader>
          <CardContent>
            <ScreenshotUpload groups={form.screenshot_groups} onChange={(g) => set("screenshot_groups", g)} />
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Link href="/analysis"><Button type="button" variant="outline">Cancel</Button></Link>
          <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save analysis"}</Button>
        </div>
      </form>
    </div>
  );
}
