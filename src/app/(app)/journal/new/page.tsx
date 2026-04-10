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
import { createTrade, getAnalyses } from "@/lib/mock/store";
import type { TradeJournalEntryInput, Direction, TradeResult, Market, Session } from "@/lib/types";
import { cn } from "@/lib/utils";

const SESSIONS: Session[] = ["London", "New York", "Asia", "Pre-market", "Post-market"];
const MARKETS: Market[] = ["futures", "commodities", "forex", "crypto"];

export default function NewTradePage() {
  const router = useRouter();
  const analyses = getAnalyses();
  const [saving, setSaving] = useState(false);
  const [confluenceInput, setConfluenceInput] = useState("");

  const [form, setForm] = useState<TradeJournalEntryInput>({
    date_time: new Date().toISOString().slice(0, 16),
    instrument: "",
    market: "futures",
    session: "New York",
    direction: "long",
    setup: "",
    confluences: [],
    entry_price: undefined,
    stop_loss: undefined,
    take_profit: undefined,
    rr: 2,
    result: "win",
    pnl: 0,
    screenshot_urls: [],
    execution_notes: "",
    psychology_notes: "",
    mistakes: "",
    lessons: "",
    linked_analysis_id: undefined,
  });

  function set<K extends keyof TradeJournalEntryInput>(
    key: K,
    value: TradeJournalEntryInput[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function addConfluence() {
    const t = confluenceInput.trim();
    if (t && !form.confluences.includes(t)) {
      set("confluences", [...form.confluences, t]);
      setConfluenceInput("");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.instrument || !form.setup) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 300));
    const created = createTrade(form);
    router.push(`/journal/${created.id}`);
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link
          href="/journal"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Journal
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Log Trade</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Record a completed trade</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Basics */}
        <Card className="bg-card border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Trade Details</CardTitle>
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
                <Label htmlFor="datetime" className="text-xs">Date & Time *</Label>
                <Input
                  id="datetime"
                  type="datetime-local"
                  value={form.date_time}
                  onChange={(e) => set("date_time", e.target.value)}
                  className="h-9 text-sm bg-background/50"
                  required
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Market</Label>
                <div className="flex flex-wrap gap-1">
                  {MARKETS.map((m) => (
                    <button key={m} type="button" onClick={() => set("market", m)}
                      className={cn("px-3 py-1 rounded-lg text-xs font-medium transition-colors capitalize",
                        form.market === m ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                      )}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Direction</Label>
                <div className="flex gap-2">
                  {(["long", "short"] as Direction[]).map((d) => (
                    <button key={d} type="button" onClick={() => set("direction", d)}
                      className={cn("flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize",
                        form.direction === d
                          ? d === "long" ? "bg-success text-success-foreground" : "bg-destructive text-white"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      )}>
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
                      className={cn("flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors",
                        form.result === r
                          ? r === "win" ? "bg-success text-success-foreground"
                            : r === "loss" ? "bg-destructive text-white"
                            : "bg-warning text-warning-foreground"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      )}>
                      {r === "break-even" ? "B/E" : r}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Session</Label>
              <div className="flex flex-wrap gap-1.5">
                {SESSIONS.map((s) => (
                  <button key={s} type="button" onClick={() => set("session", s)}
                    className={cn("px-3 py-1 rounded-lg text-xs font-medium transition-colors",
                      form.session === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                    )}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Setup & prices */}
        <Card className="bg-card border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Setup & Prices</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="setup" className="text-xs">Setup *</Label>
              <Input id="setup" value={form.setup} onChange={(e) => set("setup", e.target.value)}
                placeholder="e.g. Pullback continuation, supply zone rejection..."
                className="h-9 text-sm bg-background/50" required />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Confluences</Label>
              <div className="flex gap-2">
                <Input value={confluenceInput} onChange={(e) => setConfluenceInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addConfluence())}
                  placeholder="Add confluence..." className="h-9 text-sm bg-background/50" />
                <Button type="button" variant="outline" size="sm" onClick={addConfluence}>
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
              {form.confluences.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.confluences.map((c) => (
                    <span key={c} className="inline-flex items-center gap-1 text-xs bg-muted px-2.5 py-1 rounded-lg">
                      {c}
                      <button type="button" onClick={() => set("confluences", form.confluences.filter((x) => x !== c))}>
                        <X className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="entry" className="text-xs">Entry Price</Label>
                <Input id="entry" type="number" step="0.01" value={form.entry_price ?? ""}
                  onChange={(e) => set("entry_price", e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="h-9 text-sm bg-background/50 font-mono" placeholder="0.00" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sl" className="text-xs">Stop Loss</Label>
                <Input id="sl" type="number" step="0.01" value={form.stop_loss ?? ""}
                  onChange={(e) => set("stop_loss", e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="h-9 text-sm bg-background/50 font-mono" placeholder="0.00" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tp" className="text-xs">Take Profit</Label>
                <Input id="tp" type="number" step="0.01" value={form.take_profit ?? ""}
                  onChange={(e) => set("take_profit", e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="h-9 text-sm bg-background/50 font-mono" placeholder="0.00" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rr" className="text-xs">R:R *</Label>
                <Input id="rr" type="number" step="0.1" value={form.rr}
                  onChange={(e) => set("rr", parseFloat(e.target.value))}
                  className="h-9 text-sm bg-background/50 font-mono" required />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pnl" className="text-xs">P&L ($) *</Label>
              <Input id="pnl" type="number" step="0.01" value={form.pnl}
                onChange={(e) => set("pnl", parseFloat(e.target.value))}
                className="h-9 text-sm bg-background/50 font-mono" required />
            </div>

            {/* Link analysis */}
            {analyses.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs">Link to Analysis (optional)</Label>
                <div className="flex flex-wrap gap-1.5">
                  <button type="button" onClick={() => set("linked_analysis_id", undefined)}
                    className={cn("px-3 py-1 rounded-lg text-xs font-medium transition-colors",
                      !form.linked_analysis_id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                    )}>
                    None
                  </button>
                  {analyses.slice(0, 4).map((a) => (
                    <button key={a.id} type="button" onClick={() => set("linked_analysis_id", a.id)}
                      className={cn("px-3 py-1 rounded-lg text-xs font-medium transition-colors max-w-48 truncate",
                        form.linked_analysis_id === a.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                      )}>
                      {a.instrument} · {a.title.slice(0, 24)}…
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card className="bg-card border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Post-Trade Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: "execution_notes" as const, label: "Execution Notes", placeholder: "How was the execution? Did you follow the plan?" },
              { key: "psychology_notes" as const, label: "Psychology", placeholder: "How were you feeling? Were you calm, anxious, reactive?" },
              { key: "mistakes" as const, label: "Mistakes", placeholder: "What went wrong, if anything?" },
              { key: "lessons" as const, label: "Lessons", placeholder: "What did you learn from this trade?" },
            ].map(({ key, label, placeholder }) => (
              <div key={key} className="space-y-1.5">
                <Label htmlFor={key} className="text-xs">{label}</Label>
                <Textarea id={key} value={form[key] as string}
                  onChange={(e) => set(key, e.target.value)}
                  placeholder={placeholder}
                  className="text-sm bg-background/50 min-h-16 resize-none" />
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Link href="/journal"><Button type="button" variant="outline">Cancel</Button></Link>
          <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Log trade"}</Button>
        </div>
      </form>
    </div>
  );
}
