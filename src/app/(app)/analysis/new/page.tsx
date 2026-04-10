"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, X } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { createAnalysis } from "@/lib/mock/store";
import type { PreTradeAnalysisInput, Bias, Market, Session } from "@/lib/types";
import { cn } from "@/lib/utils";

const SESSIONS: Session[] = ["London", "New York", "Asia", "Pre-market", "Post-market"];
const MARKETS: Market[] = ["futures", "commodities", "forex", "crypto"];
const BIASES: Bias[] = ["bullish", "bearish", "neutral"];

export default function NewAnalysisPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [confluenceInput, setConfluenceInput] = useState("");
  const [keyLevelInput, setKeyLevelInput] = useState("");

  const [form, setForm] = useState<PreTradeAnalysisInput>({
    title: "",
    date: new Date().toISOString().split("T")[0],
    instrument: "",
    market: "futures",
    session: "New York",
    bias: "bullish",
    thesis: "",
    key_levels: [],
    planned_setup: "",
    confluences: [],
    invalidation: "",
    notes: "",
    screenshot_urls: [],
    used_for_trade: false,
  });

  function set<K extends keyof PreTradeAnalysisInput>(
    key: K,
    value: PreTradeAnalysisInput[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function addConfluence() {
    const trimmed = confluenceInput.trim();
    if (trimmed && !form.confluences.includes(trimmed)) {
      set("confluences", [...form.confluences, trimmed]);
      setConfluenceInput("");
    }
  }

  function removeConfluence(c: string) {
    set("confluences", form.confluences.filter((x) => x !== c));
  }

  function addKeyLevel() {
    const trimmed = keyLevelInput.trim();
    if (trimmed && !form.key_levels.includes(trimmed)) {
      set("key_levels", [...form.key_levels, trimmed]);
      setKeyLevelInput("");
    }
  }

  function removeKeyLevel(l: string) {
    set("key_levels", form.key_levels.filter((x) => x !== l));
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
        <Link
          href="/analysis"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Analysis
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">New Analysis</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Pre-trade structured prep</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Basics */}
        <Card className="bg-card border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Basics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="instrument" className="text-xs">Instrument *</Label>
                <Input
                  id="instrument"
                  value={form.instrument}
                  onChange={(e) => set("instrument", e.target.value.toUpperCase())}
                  placeholder="GC, ES, NQ, CL..."
                  className="h-9 text-sm bg-background/50"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="date" className="text-xs">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={form.date}
                  onChange={(e) => set("date", e.target.value)}
                  className="h-9 text-sm bg-background/50"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-xs">Title *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="e.g. Gold London continuation setup"
                className="h-9 text-sm bg-background/50"
                required
              />
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Market</Label>
                <div className="flex flex-wrap gap-1.5">
                  {MARKETS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => set("market", m)}
                      className={cn(
                        "px-3 py-1 rounded-lg text-xs font-medium transition-colors capitalize",
                        form.market === m
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Session</Label>
                <div className="flex flex-wrap gap-1.5">
                  {SESSIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => set("session", s)}
                      className={cn(
                        "px-3 py-1 rounded-lg text-xs font-medium transition-colors",
                        form.session === s
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Bias</Label>
                <div className="flex gap-1.5">
                  {BIASES.map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => set("bias", b)}
                      className={cn(
                        "px-3 py-1 rounded-lg text-xs font-medium transition-colors capitalize",
                        form.bias === b
                          ? b === "bullish"
                            ? "bg-success text-success-foreground"
                            : b === "bearish"
                            ? "bg-destructive text-white"
                            : "bg-muted text-muted-foreground"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analysis content */}
        <Card className="bg-card border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="thesis" className="text-xs">Thesis *</Label>
              <Textarea
                id="thesis"
                value={form.thesis}
                onChange={(e) => set("thesis", e.target.value)}
                placeholder="What is your read on this market? Why are you looking at this trade?"
                className="text-sm bg-background/50 min-h-24 resize-none"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="setup" className="text-xs">Planned Setup</Label>
              <Input
                id="setup"
                value={form.planned_setup}
                onChange={(e) => set("planned_setup", e.target.value)}
                placeholder="e.g. Pullback continuation, failed breakout reversal..."
                className="h-9 text-sm bg-background/50"
              />
            </div>

            {/* Key Levels */}
            <div className="space-y-1.5">
              <Label className="text-xs">Key Levels</Label>
              <div className="flex gap-2">
                <Input
                  value={keyLevelInput}
                  onChange={(e) => setKeyLevelInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addKeyLevel())}
                  placeholder="e.g. 3328.5"
                  className="h-9 text-sm bg-background/50 font-mono"
                />
                <Button type="button" variant="outline" size="sm" onClick={addKeyLevel}>
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
              {form.key_levels.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.key_levels.map((l) => (
                    <span
                      key={l}
                      className="inline-flex items-center gap-1 text-xs font-mono bg-muted px-2.5 py-1 rounded-lg"
                    >
                      {l}
                      <button type="button" onClick={() => removeKeyLevel(l)}>
                        <X className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Confluences */}
            <div className="space-y-1.5">
              <Label className="text-xs">Confluences</Label>
              <div className="flex gap-2">
                <Input
                  value={confluenceInput}
                  onChange={(e) => setConfluenceInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addConfluence())
                  }
                  placeholder="e.g. Support reclaim, volume confirmation..."
                  className="h-9 text-sm bg-background/50"
                />
                <Button type="button" variant="outline" size="sm" onClick={addConfluence}>
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
              {form.confluences.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.confluences.map((c) => (
                    <span
                      key={c}
                      className="inline-flex items-center gap-1 text-xs bg-muted px-2.5 py-1 rounded-lg"
                    >
                      {c}
                      <button type="button" onClick={() => removeConfluence(c)}>
                        <X className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="invalidation" className="text-xs">Invalidation</Label>
              <Input
                id="invalidation"
                value={form.invalidation}
                onChange={(e) => set("invalidation", e.target.value)}
                placeholder="What would invalidate this setup?"
                className="h-9 text-sm bg-background/50"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-xs">Additional Notes</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                placeholder="Any other relevant observations..."
                className="text-sm bg-background/50 min-h-20 resize-none"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Link href="/analysis">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save analysis"}
          </Button>
        </div>
      </form>
    </div>
  );
}
