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
import { createAnalysis, getPlaybook, savePlaybook } from "@/lib/mock/store";
import { ScreenshotUpload } from "@/components/screenshot-upload";
import type { PreTradeAnalysisInput, Bias, Market, Session, TraderPlaybook } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Plus, X, Shield, CheckSquare, Target } from "lucide-react";

const SESSIONS: Session[] = ["London", "New York", "Asia"];
const MARKETS: Market[] = ["futures", "commodities"];
const BIASES: Bias[] = ["bullish", "bearish", "neutral"];

const INSTRUMENTS: Record<Market, string[]> = {
  futures: ["NQ", "ES", "YM", "RTY"],
  commodities: ["Gold", "Silver", "Crude Oil", "Natural Gas"],
};

export default function NewAnalysisPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [playbook, setPlaybook] = useState<TraderPlaybook>(() => getPlaybook());
  const [playbookDirty, setPlaybookDirty] = useState(false);
  const [playbookSaved, setPlaybookSaved] = useState(false);
  const [newRule, setNewRule] = useState("");
  const [newRoutineStep, setNewRoutineStep] = useState("");

  function savePlaybookData() {
    savePlaybook(playbook);
    setPlaybookDirty(false);
    setPlaybookSaved(true);
    setTimeout(() => setPlaybookSaved(false), 2500);
  }

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
                <Label className="text-xs">Market *</Label>
                <div className="flex gap-1.5">
                  {MARKETS.map((m) => (
                    <button key={m} type="button"
                      onClick={() => { set("market", m); set("instrument", ""); }}
                      className={cn("flex-1 py-1.5 rounded-lg text-xs font-medium transition-all capitalize",
                        form.market === m ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:text-foreground")}>
                      {m}
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
              <Label className="text-xs">Instrument *</Label>
              <div className="flex flex-wrap gap-1.5">
                {INSTRUMENTS[form.market].map((inst) => (
                  <button key={inst} type="button" onClick={() => set("instrument", inst)}
                    className={cn("px-3 py-1.5 rounded-lg text-sm font-medium transition-all font-mono",
                      form.instrument === inst ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:text-foreground")}>
                    {inst}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-xs">Title *</Label>
              <Input id="title" value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="e.g. Gold London continuation setup" className="h-9 text-sm bg-background/50" required />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
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

        {/* ── Playbook Reference ──────────────────────────────── */}
        <Card className="bg-card border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Pre-Trade Checklist</CardTitle>
              {playbookSaved && !playbookDirty && (
                <span className="text-xs font-medium" style={{ color: "oklch(0.58 0.17 145)" }}>Saved</span>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Non-Negotiable Rules */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 shrink-0" style={{ color: "oklch(0.58 0.22 25)" }} />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "oklch(0.58 0.22 25)" }}>
                  Non-Negotiable Rules
                </span>
              </div>
              <div className="space-y-0.5">
                {(playbook.non_negotiable_rules ?? []).map((rule, i) => (
                  <div key={i} className="flex items-center gap-2 group py-1">
                    <span className="text-xs tabular-nums w-4 shrink-0 text-muted-foreground">{i + 1}.</span>
                    <span className="text-sm flex-1">{rule}</span>
                    <button type="button"
                      onClick={() => {
                        const rules = [...(playbook.non_negotiable_rules ?? [])];
                        rules.splice(i, 1);
                        setPlaybook({ ...playbook, non_negotiable_rules: rules });
                        setPlaybookDirty(true);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input type="text" value={newRule} onChange={(e) => setNewRule(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newRule.trim()) {
                      setPlaybook({ ...playbook, non_negotiable_rules: [...(playbook.non_negotiable_rules ?? []), newRule.trim()] });
                      setNewRule(""); setPlaybookDirty(true);
                    }
                  }}
                  placeholder="Add a rule..."
                  className="flex-1 rounded-lg px-3 py-2 text-xs outline-none"
                  style={{ background: "oklch(0.08 0.003 28)", border: "1px solid oklch(0.18 0.005 28)", color: "oklch(0.94 0.002 28)" }} />
                <button type="button"
                  onClick={() => {
                    if (!newRule.trim()) return;
                    setPlaybook({ ...playbook, non_negotiable_rules: [...(playbook.non_negotiable_rules ?? []), newRule.trim()] });
                    setNewRule(""); setPlaybookDirty(true);
                  }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "oklch(0.58 0.22 25 / 0.12)", color: "oklch(0.58 0.22 25)", border: "1px solid oklch(0.58 0.22 25 / 0.20)" }}>
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div style={{ borderTop: "1px solid oklch(0.15 0.004 28)" }} />

            {/* Pre-Trade Routine */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-3.5 h-3.5 shrink-0" style={{ color: "oklch(0.72 0.22 45)" }} />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "oklch(0.72 0.22 45)" }}>
                  Pre-Trade Routine
                </span>
              </div>
              <div className="space-y-0.5">
                {(playbook.pre_trade_routine ?? []).map((step, i) => (
                  <div key={i} className="flex items-center gap-2 group py-1">
                    <span className="text-xs tabular-nums w-4 shrink-0" style={{ color: "oklch(0.72 0.22 45 / 0.6)" }}>{i + 1}.</span>
                    <span className="text-sm flex-1">{step}</span>
                    <button type="button"
                      onClick={() => {
                        const steps = [...(playbook.pre_trade_routine ?? [])];
                        steps.splice(i, 1);
                        setPlaybook({ ...playbook, pre_trade_routine: steps });
                        setPlaybookDirty(true);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input type="text" value={newRoutineStep} onChange={(e) => setNewRoutineStep(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newRoutineStep.trim()) {
                      setPlaybook({ ...playbook, pre_trade_routine: [...(playbook.pre_trade_routine ?? []), newRoutineStep.trim()] });
                      setNewRoutineStep(""); setPlaybookDirty(true);
                    }
                  }}
                  placeholder="Add a step..."
                  className="flex-1 rounded-lg px-3 py-2 text-xs outline-none"
                  style={{ background: "oklch(0.08 0.003 28)", border: "1px solid oklch(0.18 0.005 28)", color: "oklch(0.94 0.002 28)" }} />
                <button type="button"
                  onClick={() => {
                    if (!newRoutineStep.trim()) return;
                    setPlaybook({ ...playbook, pre_trade_routine: [...(playbook.pre_trade_routine ?? []), newRoutineStep.trim()] });
                    setNewRoutineStep(""); setPlaybookDirty(true);
                  }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "oklch(0.72 0.22 45 / 0.12)", color: "oklch(0.72 0.22 45)", border: "1px solid oklch(0.72 0.22 45 / 0.20)" }}>
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div style={{ borderTop: "1px solid oklch(0.15 0.004 28)" }} />

            {/* A+ Criteria */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Target className="w-3.5 h-3.5 shrink-0" style={{ color: "oklch(0.58 0.17 145)" }} />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "oklch(0.58 0.17 145)" }}>
                  A+ Trade Criteria
                </span>
              </div>
              <textarea rows={6} value={playbook.a_plus_criteria || ""}
                onChange={(e) => { setPlaybook({ ...playbook, a_plus_criteria: e.target.value }); setPlaybookDirty(true); }}
                placeholder="Describe your ideal A+ setup — what must be true for you to take the trade..."
                className="w-full rounded-lg px-3 py-2.5 text-sm resize-none"
                style={{ background: "oklch(0.08 0.003 28)", border: "1px solid oklch(0.18 0.005 28)", color: "oklch(0.94 0.002 28)", outline: "none" }} />
            </div>

            {playbookDirty && (
              <button type="button" onClick={savePlaybookData}
                className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
                style={{ background: "oklch(0.72 0.22 45 / 0.15)", color: "oklch(0.72 0.22 45)", border: "1px solid oklch(0.72 0.22 45 / 0.25)" }}>
                Save Checklist
              </button>
            )}
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
