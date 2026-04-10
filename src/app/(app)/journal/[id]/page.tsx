"use client";

import { use } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  Brain,
  AlertCircle,
  Lightbulb,
  CheckCircle2,
  LinkIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getTradeById, getAnalysisById } from "@/lib/mock/store";
import { cn } from "@/lib/utils";

export default function TradeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const trade = getTradeById(id);

  if (!trade) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground text-sm">Trade not found.</p>
        <Link href="/journal" className="text-primary text-sm hover:underline mt-2 inline-block">
          ← Back to journal
        </Link>
      </div>
    );
  }

  const linkedAnalysis = trade.linked_analysis_id
    ? getAnalysisById(trade.linked_analysis_id)
    : undefined;

  const resultConfig = {
    win: { color: "text-success", bg: "bg-success/10", border: "border-success/20", label: "Win" },
    loss: { color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/20", label: "Loss" },
    "break-even": { color: "text-warning", bg: "bg-warning/10", border: "border-warning/20", label: "Break-Even" },
  };
  const res = resultConfig[trade.result];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back + header */}
      <div>
        <Link
          href="/journal"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Journal
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl font-bold">{trade.instrument}</span>
              <div className="flex items-center gap-1.5">
                {trade.direction === "long" ? (
                  <TrendingUp className="w-5 h-5 text-success" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-destructive" />
                )}
                <span
                  className={cn(
                    "text-sm font-semibold capitalize",
                    trade.direction === "long" ? "text-success" : "text-destructive"
                  )}
                >
                  {trade.direction}
                </span>
              </div>
              <Badge className="capitalize bg-muted text-muted-foreground border-border">
                {trade.market}
              </Badge>
            </div>
            <p className="text-base font-medium text-foreground/80">{trade.setup}</p>
          </div>

          <div className={cn("px-5 py-3 rounded-xl border shrink-0", res.bg, res.border)}>
            <p className={cn("text-2xl font-bold", res.color)}>
              {trade.pnl > 0 ? "+" : ""}${trade.pnl.toLocaleString()}
            </p>
            <p className={cn("text-xs font-medium text-center", res.color)}>{res.label}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            {format(new Date(trade.date_time), "EEEE, MMMM d, yyyy")}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {format(new Date(trade.date_time), "h:mm a")} · {trade.session}
          </span>
        </div>
      </div>

      {/* Trade metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "R:R", value: `${trade.rr}R` },
          { label: "Entry", value: trade.entry_price ? `$${trade.entry_price}` : "—" },
          { label: "Stop Loss", value: trade.stop_loss ? `$${trade.stop_loss}` : "—" },
          { label: "Take Profit", value: trade.take_profit ? `$${trade.take_profit}` : "—" },
        ].map(({ label, value }) => (
          <div key={label} className="bg-card border border-border/50 rounded-xl p-4 text-center">
            <p className="text-lg font-bold font-mono">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Confluences */}
      {trade.confluences.length > 0 && (
        <Card className="bg-card border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              Confluences
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {trade.confluences.map((c) => (
                <span
                  key={c}
                  className="text-sm bg-muted/60 text-foreground/80 px-3 py-1.5 rounded-lg"
                >
                  {c}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes sections */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="bg-card border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              Execution Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-foreground/80">
              {trade.execution_notes || "—"}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Brain className="w-4 h-4 text-chart-5" />
              Psychology
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-foreground/80">
              {trade.psychology_notes || "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {trade.mistakes && trade.mistakes !== "None" && (
          <Card className="bg-destructive/5 border-destructive/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-destructive">
                <AlertCircle className="w-4 h-4" />
                Mistakes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-foreground/80">{trade.mistakes}</p>
            </CardContent>
          </Card>
        )}

        {trade.lessons && (
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-primary">
                <Lightbulb className="w-4 h-4" />
                Lessons
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-foreground/80">{trade.lessons}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Linked analysis */}
      {linkedAnalysis && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-primary">Linked Analysis</span>
              </div>
              <Link
                href={`/analysis/${linkedAnalysis.id}`}
                className="text-xs text-primary hover:text-primary/80 transition-colors"
              >
                View analysis →
              </Link>
            </div>
            <p className="text-sm mt-2 text-foreground/80">{linkedAnalysis.title}</p>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {linkedAnalysis.thesis}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
