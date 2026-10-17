"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft, TrendingUp, TrendingDown, Calendar, Clock,
  Brain, AlertCircle, Lightbulb, CheckCircle2,
  LinkIcon, Pencil, Trash2, Check,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AnalysisChartBoard } from "@/components/analysis/analysis-chart-board";
import {
  getTradeById,
  getAnalysisById,
  deleteTrade,
  updateTrade,
  getTradeRuleChecks,
  saveTradeRuleChecks,
  type RuleCheckDraft,
} from "@/lib/supabase/queries";
import { RuleChecksEditor } from "@/components/journal/rule-checks-editor";
import { cn } from "@/lib/utils";
import type { TradeDiscipline, TradeJournalEntry, PreTradeAnalysis } from "@/lib/types";

export function TradeDetail({ id, previewTrade, previewRuleChecks = [], previewAnalysis = null }: {
  id: string;
  previewTrade?: TradeJournalEntry;
  previewRuleChecks?: RuleCheckDraft[];
  previewAnalysis?: PreTradeAnalysis | null;
}) {
  const preview = Boolean(previewTrade);
  const router = useRouter();
  // Where the back arrow points. Trades opened from the Trade Therapist's Best
  // trades tab (via `?from=trade-therapist`) go back there; everything else
  // returns to the journal. Read from the URL after mount, matching how the
  // therapist page reads its own deep-link, so the prerendered markup agrees.
  const [back, setBack] = useState({ href: preview ? "/preview/trade" : "/journal", label: preview ? "Back to Log Trade preview" : "Back to Journal" });
  const [trade, setTrade] = useState<TradeJournalEntry | null>(previewTrade ?? null);
  const [linkedAnalysis, setLinkedAnalysis] = useState<PreTradeAnalysis | null>(previewAnalysis);
  const [loading, setLoading] = useState(!preview);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [discipline, setDisciplineState] = useState<TradeDiscipline | undefined>(previewTrade?.discipline);
  const [ruleChecks, setRuleChecks] = useState<RuleCheckDraft[]>(previewRuleChecks);

  useEffect(() => {
    if (!preview && new URLSearchParams(window.location.search).get("from") === "trade-therapist") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot sync from the URL, not a render loop
      setBack({ href: "/trade-therapist?tab=daily", label: "Back to Post Market" });
    }
  }, [preview]);

  useEffect(() => {
    if (preview) return;
    getTradeById(id).then(async (t) => {
      setTrade(t);
      setDisciplineState(t?.discipline as TradeDiscipline | undefined);
      if (t?.linked_analysis_id) {
        const a = await getAnalysisById(t.linked_analysis_id);
        setLinkedAnalysis(a);
      }
      setRuleChecks(await getTradeRuleChecks(id).catch(() => []));
      setLoading(false);
    });
  }, [id, preview]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );

  if (!trade) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground text-sm">Trade not found.</p>
        <Link href={back.href} className="text-primary text-sm hover:underline mt-2 inline-block">← {back.label}</Link>
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
    if (!preview) await updateTrade(id, { discipline: updated });
  }

  /**
   * Rule adherence is stored per trade in trade_rule_checks, not on the trade
   * row, so the wording of a rule is frozen at the moment it was judged. The
   * card below writes straight through, the same as the legacy checkboxes did.
   */
  async function saveRuleChecks(next: RuleCheckDraft[]) {
    setRuleChecks(next);
    if (!preview) await saveTradeRuleChecks(id, next);
  }

  const groups = trade.screenshot_groups ?? [];
  const customChecks = discipline?.custom_checks ?? [];
  const hasCustomChecks = customChecks.length > 0;

  // Rule checks are the current source of truth; the legacy checkbox list is
  // kept for trades logged before the rule engine existed.
  const hasRuleChecks = ruleChecks.length > 0;
  const judged = ruleChecks.filter((check) => check.status !== "not_applicable");
  const ruleScore = judged.length > 0
    ? Math.round((judged.filter((check) => check.status === "kept").length / judged.length) * 100)
    : 0;

  const disciplineScore = hasRuleChecks ? ruleScore : discipline?.score ?? 0;
  const scoreColor = disciplineScore >= 80
    ? "oklch(0.72 0.17 145)"
    : disciplineScore >= 60
    ? "var(--be)"
    : "oklch(0.65 0.22 25)";

  return (
    <div className="trade-static-scroll mx-auto w-full max-w-[1500px] space-y-3">
      <div>
        <Link href={back.href} className="mb-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="w-3.5 h-3.5" /> {back.label}
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-3">
              <span className="text-2xl font-bold text-primary">{trade.instrument}</span>
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
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {format(new Date(trade.date_time.slice(0, 10) + "T12:00:00"), "EEEE, MMMM d, yyyy")}
              </span>
              {(trade.execution_time || trade.execution_end_time) && (
                <span className="flex items-center gap-1.5 tabular-nums">
                  <Clock className="w-3.5 h-3.5" />
                  {trade.execution_time || "-"}
                  {trade.execution_end_time ? ` → ${trade.execution_end_time}` : ""}
                </span>
              )}
              <span>{trade.session} session{trade.timeframe ? ` · ${trade.timeframe}` : ""}</span>
            </div>
          </div>

          <div className={cn("shrink-0 rounded-xl border px-4 py-2", res.bg)}>
            <p className={cn("text-xl font-bold text-center", res.color)}>
              {trade.result === "win" ? `+${trade.rr}R` : trade.result === "loss" ? "-1R" : "0R"}
            </p>
            <p className={cn("text-xs font-medium text-center mt-0.5", res.color)}>{res.label}</p>
          </div>
        </div>

        {!preview && <div className="mt-2 flex items-center gap-2">
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
        </div>}
      </div>

      {/* The same chart navigation as Log Trade, with setup and notes alongside it. */}
      <div className="grid gap-3 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
        <div className="min-w-0 space-y-3">
          <Card className="border-border/50 bg-card shadow-sm">
            <CardContent className="h-[min(23rem,50dvh)] min-h-0 p-3">
              <AnalysisChartBoard groups={groups} target={preview ? null : { entityType: "trades", entityId: id }} readOnly />
            </CardContent>
          </Card>

          {linkedAnalysis && (
            <Card className="bg-primary/5 border-primary/20 shadow-sm">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <LinkIcon className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold text-primary">Linked Analysis</span>
                  </div>
                  <Link href={`/analysis/${linkedAnalysis.id}`} className="text-xs text-primary hover:text-primary/70 transition-colors">
                    View analysis →
                  </Link>
                </div>
                <p className="mt-1 text-sm text-foreground/80">{linkedAnalysis.title}</p>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{linkedAnalysis.thesis}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="min-w-0 space-y-3">
          <Card className="border-border/50 bg-card shadow-sm">
            <CardContent className="grid gap-3 p-3 sm:grid-cols-[minmax(0,.7fr)_minmax(0,1.3fr)]">
              <div className="min-w-0">
                <h2 className="text-xs font-semibold text-foreground/85">Confluences</h2>
                {trade.confluences.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {trade.confluences.map((c) => (
                      <span key={c} className="rounded-lg border border-primary/20 bg-primary/[.08] px-2.5 py-1 text-xs font-medium text-foreground/85">
                        {c}
                      </span>
                    ))}
                  </div>
                ) : <p className="mt-1.5 text-xs text-muted-foreground">No confluences logged.</p>}
              </div>
              <div className="min-w-0 border-t border-border/60 pt-3 sm:border-l sm:border-t-0 sm:py-0 sm:pl-3">
                <div className="mb-2 flex items-center gap-2">
                  <h2 className="text-xs font-semibold text-foreground/85">Discipline check</h2>
                <span className="ml-auto text-sm font-bold" style={{ color: scoreColor }}>
                  {hasRuleChecks ? (judged.length > 0 ? `${disciplineScore}%` : "N/A") : hasCustomChecks ? `${disciplineScore}%` : "-"}
                </span>
                </div>
              {hasRuleChecks ? (
                <RuleChecksEditor
                  checks={ruleChecks}
                  onChange={saveRuleChecks}
                  showScore={false}
                  compact
                />
              ) : hasCustomChecks ? (
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
                  No rules were active on this trade&apos;s date.{" "}
                  <Link href="/psychological-edge" className="text-primary hover:underline">Set your trading rules</Link> to check them here.
                </p>
              )}
              {discipline?.notes && (
                <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border leading-relaxed">
                  {discipline.notes}
                </p>
              )}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2">
            <Card className="shadow-sm">
              <CardHeader className="pb-1.5">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" /> Execution Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs leading-relaxed text-foreground/80">{trade.execution_notes || "-"}</p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader className="pb-1.5">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Brain className="w-4 h-4 text-gold" /> Psychology
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs leading-relaxed text-foreground/80">{trade.psychology_notes || "-"}</p>
              </CardContent>
            </Card>
            <Card className="bg-destructive/5 border-destructive/20 shadow-sm">
              <CardHeader className="pb-1.5">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-destructive">
                  <AlertCircle className="w-4 h-4" /> Mistakes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs leading-relaxed text-foreground/80">{trade.mistakes && trade.mistakes !== "None" ? trade.mistakes : "-"}</p>
              </CardContent>
            </Card>
            <Card className="bg-gold/5 border-gold/20 shadow-sm">
              <CardHeader className="pb-1.5">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-gold">
                  <Lightbulb className="w-4 h-4" /> Lessons
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs leading-relaxed text-foreground/80">{trade.lessons || "-"}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
