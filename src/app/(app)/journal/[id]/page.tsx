"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft, TrendingUp, TrendingDown, Calendar, Clock,
  Brain, AlertCircle, Lightbulb, CheckCircle2,
  LinkIcon, Pencil, Trash2, Target, Check,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScreenshotUpload } from "@/components/screenshot-upload";
import {
  getTradeById,
  getAnalysisById,
  deleteTrade,
  updateTrade,
} from "@/lib/supabase/queries";
import { cn } from "@/lib/utils";
import type { TradeDiscipline, TradeMarketContext, TradeJournalEntry, PreTradeAnalysis } from "@/lib/types";

export default function TradeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [trade, setTrade] = useState<TradeJournalEntry | null>(null);
  const [linkedAnalysis, setLinkedAnalysis] = useState<PreTradeAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [discipline, setDisciplineState] = useState<TradeDiscipline | undefined>(undefined);

  useEffect(() => {
    getTradeById(id).then(async (t) => {
      setTrade(t);
      setDisciplineState(t?.discipline as TradeDiscipline | undefined);
      if (t?.linked_analysis_id) {
        const a = await getAnalysisById(t.linked_analysis_id);
        setLinkedAnalysis(a);
      }
      setLoading(false);
    });
  }, [id]);

  const context = trade?.market_context as TradeMarketContext | undefined;
  void context;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );

  if (!trade) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground text-sm">Trade not found.</p>
        <Link href="/journal" className="text-primary text-sm hover:underline mt-2 inline-block">← Back to journal</Link>
      </div>
    );
  }

  const resultConfig = {
    win: { color: "text-success", bg: "bg-success/8 border-success/20", label: "Win" },
    loss: { color: "text-destructive", bg: "bg-destructive/8 border-destructive/20", label: "Loss" },
    "break-even": { color: "text-warning", bg: "bg-warning/8 border-warning/20", label: "Break-Even" },
  };
  const res = resultConfig[trade.result];

  async function handleDelete() {
    setDeleting(true);
    await deleteTrade(id);
    router.push("/journal");
  }

  async function toggleCustomCheck(idx: number) {
    if (!discipline) return;
    const custom = [...(discipline.custom_checks ?? [])];
    custom[idx] = { ...custom[idx], passed: !custom[idx].passed };
    const total = custom.length;
    const score = total > 0 ? Math.round((custom.filter((c) => c.passed).length / total) * 100) : 0;
    const updated = { ...discipline, custom_checks: custom, score };
    setDisciplineState(updated);
    await updateTrade(id, { discipline: updated });
  }

  const groups = trade.screenshot_groups ?? [];
  const customChecks = discipline?.custom_checks ?? [];
  const hasCustomChecks = customChecks.length > 0;

  const disciplineScore = discipline?.score ?? 0;
  const scoreColor = disciplineScore >= 80
    ? "oklch(0.72 0.17 145)"
    : disciplineScore >= 60
    ? "var(--be)"
    : "oklch(0.65 0.22 25)";

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <Link href="/journal" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Journal
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl font-bold text-primary">{trade.instrument}</span>
              <div className="flex items-center gap-1.5">
                {trade.direction === "long"
                  ? <TrendingUp className="w-5 h-5 text-success" />
                  : <TrendingDown className="w-5 h-5 text-destructive" />}
                <span className={cn("text-sm font-semibold capitalize",
                  trade.direction === "long" ? "text-success" : "text-destructive")}>
                  {trade.direction}
                </span>
              </div>
              <Badge className="capitalize bg-secondary text-secondary-foreground border-border text-xs">
                {trade.market}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {format(new Date(trade.date_time.slice(0, 10) + "T12:00:00"), "EEEE, MMMM d, yyyy")}
              </span>
              {(trade.execution_time || trade.execution_end_time) && (
                <span className="flex items-center gap-1.5 tabular-nums">
                  <Clock className="w-3.5 h-3.5" />
                  {trade.execution_time || "—"}
                  {trade.execution_end_time ? ` → ${trade.execution_end_time}` : ""}
                </span>
              )}
              <span>{trade.session} session{trade.timeframe ? ` · ${trade.timeframe}` : ""}</span>
            </div>
          </div>

          <div className={cn("px-5 py-3 rounded-xl border shrink-0", res.bg)}>
            <p className={cn("text-2xl font-bold text-center", res.color)}>
              {trade.result === "win" ? `+${trade.rr}R` : trade.result === "loss" ? "-1R" : "0R"}
            </p>
            <p className={cn("text-xs font-medium text-center mt-0.5", res.color)}>{res.label}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4">
          <Link href={`/journal/${id}/edit`}>
            <Button variant="outline" size="sm" className="gap-1.5 transition-all hover:-translate-y-px">
              <Pencil className="w-3.5 h-3.5" /> Edit
            </Button>
          </Link>
          {!confirmDelete ? (
            <Button variant="outline" size="sm"
              className="gap-1.5 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5 transition-all"
              onClick={() => setConfirmDelete(true)}>
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </Button>
          ) : (
            <div className="flex items-center gap-2 animate-fade-in">
              <span className="text-xs text-destructive font-medium">Delete this trade?</span>
              <Button variant="outline" size="sm"
                className="bg-destructive text-white hover:bg-destructive/90 border-destructive"
                onClick={handleDelete} disabled={deleting}>
                {deleting ? "Deleting..." : "Yes, delete"}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setConfirmDelete(false)}>Cancel</Button>
            </div>
          )}
        </div>
      </div>

      {/* Discipline Check */}
      {discipline && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Target className="w-4 h-4" style={{ color: "var(--primary)" }} />
              Discipline Check
              <span className="ml-auto text-sm font-bold" style={{ color: scoreColor }}>
                {hasCustomChecks ? `${disciplineScore}%` : "—"}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasCustomChecks ? (
              <div className="space-y-1.5">
                {customChecks.map((check, idx) => (
                  <button
                    key={`custom-${idx}`}
                    onClick={() => toggleCustomCheck(idx)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-xs transition-all text-left",
                      check.passed
                        ? "bg-success/8 border-success/25 hover:bg-success/12"
                        : "bg-secondary border-border hover:border-primary/30 hover:bg-muted"
                    )}
                  >
                    <span className={cn(
                      "w-5 h-5 rounded-md shrink-0 flex items-center justify-center transition-all border-2",
                      check.passed
                        ? "bg-success border-success"
                        : "bg-transparent border-muted-foreground/30"
                    )}>
                      {check.passed && <Check className="w-3 h-3 text-white" />}
                    </span>
                    <span className={cn(
                      "flex-1 transition-colors",
                      check.passed ? "text-foreground/80" : "text-muted-foreground"
                    )}>
                      {check.label}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground/60 text-center py-3">
                No discipline rules on this trade.{" "}
                <Link href={`/journal/${id}/edit`} className="text-primary hover:underline">Edit</Link> to add rules.
              </p>
            )}
            {discipline.notes && (
              <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border leading-relaxed">
                {discipline.notes}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Confluences */}
      {trade.confluences.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" /> Confluences
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {trade.confluences.map((c) => (
                <span key={c} className="text-sm bg-secondary text-secondary-foreground px-3 py-1.5 rounded-lg border border-border">
                  {c}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Screenshots */}
      {groups.some((g) => g.urls.length > 0) && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Screenshots</CardTitle>
          </CardHeader>
          <CardContent>
            <ScreenshotUpload groups={groups} onChange={() => {}} readOnly />
          </CardContent>
        </Card>
      )}

      {/* Execution + Psychology */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" /> Execution Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-foreground/80">{trade.execution_notes || "—"}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Brain className="w-4 h-4 text-gold" /> Psychology
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-foreground/80">{trade.psychology_notes || "—"}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {trade.mistakes && trade.mistakes !== "None" && (
          <Card className="bg-destructive/5 border-destructive/20 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-destructive">
                <AlertCircle className="w-4 h-4" /> Mistakes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-foreground/80">{trade.mistakes}</p>
            </CardContent>
          </Card>
        )}
        {trade.lessons && (
          <Card className="bg-gold/5 border-gold/20 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-gold">
                <Lightbulb className="w-4 h-4" /> Lessons
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-foreground/80">{trade.lessons}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {linkedAnalysis && (
        <Card className="bg-primary/5 border-primary/20 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-primary">Linked Analysis</span>
              </div>
              <Link href={`/analysis/${linkedAnalysis.id}`} className="text-xs text-primary hover:text-primary/70 transition-colors">
                View analysis →
              </Link>
            </div>
            <p className="text-sm mt-2 text-foreground/80">{linkedAnalysis.title}</p>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{linkedAnalysis.thesis}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
