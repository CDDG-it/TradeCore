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
import { getTradeById, updateTrade, getAnalyses } from "@/lib/mock/store";
import { ScreenshotUpload } from "@/components/screenshot-upload";
import type { Direction, TradeResult, Market, Session } from "@/lib/types";
import { cn } from "@/lib/utils";

const SESSIONS: Session[] = ["London", "New York", "Asia"];
const MARKETS: Market[] = ["futures", "commodities"];

export default function EditTradePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const trade = getTradeById(id);
  const analyses = getAnalyses();
  const [saving, setSaving] = useState(false);
  const [confluenceInput, setConfluenceInput] = useState("");

  if (!trade) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground text-sm">Trade not found.</p>
        <Link href="/journal" className="text-primary text-sm hover:underline mt-2 inline-block">← Back to journal</Link>
      </div>
    );
  }

  const [form, setForm] = useState({
    date_time: trade.date_time.slice(0, 10),
    instrument: trade.instrument,
    market: trade.market,
    session: trade.session,
    direction: trade.direction,
    confluences: [...trade.confluences],
    rr: trade.rr,
    result: trade.result,
    screenshot_groups: trade.screenshot_groups ?? [],
    execution_notes: trade.execution_notes,
    psychology_notes: trade.psychology_notes,
    mistakes: trade.mistakes,
    lessons: trade.lessons,
    linked_analysis_id: trade.linked_analysis_id,
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
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
    setSaving(true);
    await new Promise((r) => setTimeout(r, 300));
    updateTrade(id, form);
    router.push(`/journal/${id}`);
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href={`/journal/${id}`} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Trade
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Edit Trade</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{trade.instrument} · {trade.session} session</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card className="shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Trade Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Instrument</Label>
                <Input value={form.instrument} onChange={(e) => set("instrument", e.target.value.toUpperCase())} className="h-9 text-sm" required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Date</Label>
                <Input type="date" value={form.date_time} onChange={(e) => set("date_time", e.target.value)} className="h-9 text-sm" required />
              </div>
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
                <Label className="text-xs">Direction</Label>
                <div className="flex gap-1.5">
                  {(["long", "short"] as Direction[]).map((d) => (
                    <button key={d} type="button" onClick={() => set("direction", d)}
                      className={cn("flex-1 py-1.5 rounded-lg text-xs font-medium transition-all capitalize",
                        form.direction === d
                          ? d === "long" ? "bg-success text-success-foreground" : "bg-destructive text-white"
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
                          ? r === "win" ? "bg-success text-success-foreground"
                            : r === "loss" ? "bg-destructive text-white"
                            : "bg-warning text-warning-foreground"
                          : "bg-muted text-muted-foreground hover:text-foreground")}>
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
                    className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                      form.session === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">R:R</Label>
                <Input type="number" step="0.1" min="0" value={form.rr}
                  onChange={(e) => set("rr", parseFloat(e.target.value) || 0)} className="h-9 text-sm font-mono" required />
              </div>
              {analyses.length > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Link to Analysis</Label>
                  <div className="flex flex-wrap gap-1.5">
                    <button type="button" onClick={() => set("linked_analysis_id", undefined)}
                      className={cn("px-3 py-1 rounded-lg text-xs font-medium transition-all",
                        !form.linked_analysis_id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}>
                      None
                    </button>
                    {analyses.slice(0, 3).map((a) => (
                      <button key={a.id} type="button" onClick={() => set("linked_analysis_id", a.id)}
                        className={cn("px-3 py-1 rounded-lg text-xs font-medium transition-all max-w-48 truncate",
                          form.linked_analysis_id === a.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}>
                        {a.instrument} · {a.title.slice(0, 20)}…
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Confluences</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-3">
              <Input value={confluenceInput} onChange={(e) => setConfluenceInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addConfluence())}
                placeholder="Add confluence..." className="h-9 text-sm" />
              <Button type="button" variant="outline" size="sm" onClick={addConfluence}><Plus className="w-3.5 h-3.5" /></Button>
            </div>
            {form.confluences.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {form.confluences.map((c) => (
                  <span key={c} className="inline-flex items-center gap-1 text-xs bg-secondary text-secondary-foreground px-2.5 py-1 rounded-lg border border-border/50">
                    {c}
                    <button type="button" onClick={() => set("confluences", form.confluences.filter((x) => x !== c))}
                      className="hover:text-destructive transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Post-Trade Review</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {([
              { key: "execution_notes" as const, label: "Execution Notes" },
              { key: "psychology_notes" as const, label: "Psychology" },
              { key: "mistakes" as const, label: "Mistakes" },
              { key: "lessons" as const, label: "Lessons" },
            ] as const).map(({ key, label }) => (
              <div key={key} className="space-y-1.5">
                <Label className="text-xs">{label}</Label>
                <Textarea value={form[key] as string} onChange={(e) => set(key, e.target.value)} className="text-sm min-h-16 resize-none" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Screenshots</CardTitle></CardHeader>
          <CardContent>
            <ScreenshotUpload groups={form.screenshot_groups} onChange={(g) => set("screenshot_groups", g)} />
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Link href={`/journal/${id}`}><Button type="button" variant="outline">Cancel</Button></Link>
          <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save changes"}</Button>
        </div>
      </form>
    </div>
  );
}
