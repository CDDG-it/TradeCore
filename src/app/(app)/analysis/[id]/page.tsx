"use client";

import { use } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  MapPin,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  LinkIcon,
  Calendar,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAnalysisById, getTrades } from "@/lib/mock/store";
import { cn } from "@/lib/utils";

export default function AnalysisDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const analysis = getAnalysisById(id);

  if (!analysis) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground text-sm">Analysis not found.</p>
        <Link href="/analysis" className="text-primary text-sm hover:underline mt-2 inline-block">
          ← Back to analysis
        </Link>
      </div>
    );
  }

  // Find the linked trade (if any) — check trades that reference this analysis
  const linkedTrade = getTrades().find(
    (t) => t.linked_analysis_id === analysis.id
  );

  const biasConfig = {
    bullish: { icon: TrendingUp, color: "text-success", bg: "bg-success/10", label: "Bullish" },
    bearish: { icon: TrendingDown, color: "text-destructive", bg: "bg-destructive/10", label: "Bearish" },
    neutral: { icon: Minus, color: "text-muted-foreground", bg: "bg-muted", label: "Neutral" },
  };

  const bias = biasConfig[analysis.bias];
  const BiasIcon = bias.icon;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back + header */}
      <div>
        <Link
          href="/analysis"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Analysis
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl font-bold">{analysis.instrument}</span>
              <Badge className="capitalize bg-muted text-muted-foreground border-border">
                {analysis.market}
              </Badge>
              {analysis.used_for_trade && (
                <Badge className="bg-primary/10 text-primary border-primary/20">
                  <LinkIcon className="w-3 h-3 mr-1" />
                  Traded
                </Badge>
              )}
            </div>
            <h1 className="text-lg font-semibold text-foreground/90">{analysis.title}</h1>
          </div>
          <div
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl shrink-0",
              bias.bg
            )}
          >
            <BiasIcon className={cn("w-4 h-4", bias.color)} />
            <span className={cn("text-sm font-semibold", bias.color)}>{bias.label}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            {format(new Date(analysis.date), "EEEE, MMMM d, yyyy")}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {analysis.session} session
          </span>
          <span className="text-muted-foreground/40">
            Created {format(new Date(analysis.created_at), "MMM d 'at' h:mm a")}
          </span>
        </div>
      </div>

      {/* Thesis */}
      <Card className="bg-card border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            Thesis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-foreground/90">{analysis.thesis}</p>
        </CardContent>
      </Card>

      {/* Key levels + setup */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="bg-card border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <MapPin className="w-4 h-4 text-warning" />
              Key Levels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analysis.key_levels.map((level, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2 border-b border-border/30 last:border-0"
                >
                  <span className="text-xs text-muted-foreground">Level {i + 1}</span>
                  <span className="font-mono text-sm font-medium">{level}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Planned Setup</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground/90 mb-4">{analysis.planned_setup}</p>
            <div className="space-y-2">
              {analysis.confluences.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                  <span className="text-sm text-foreground/80">{c}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confluences (inline tags) */}

      {/* Invalidation */}
      <Card className="bg-destructive/5 border-destructive/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-destructive mb-1">Invalidation</p>
              <p className="text-sm text-foreground/90">{analysis.invalidation}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {analysis.notes && (
        <Card className="bg-card border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-foreground/80">{analysis.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Linked trade */}
      {linkedTrade && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-primary">Linked Trade</span>
              </div>
              <Link
                href={`/journal/${linkedTrade.id}`}
                className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
              >
                View trade →
              </Link>
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-sm">
              <span>
                <span className="text-muted-foreground text-xs">Result </span>
                <span
                  className={cn(
                    "font-semibold capitalize",
                    linkedTrade.result === "win"
                      ? "text-success"
                      : linkedTrade.result === "loss"
                      ? "text-destructive"
                      : "text-warning"
                  )}
                >
                  {linkedTrade.result}
                </span>
              </span>
              <span>
                <span className="text-muted-foreground text-xs">P&L </span>
                <span
                  className={cn(
                    "font-semibold",
                    linkedTrade.pnl > 0
                      ? "text-success"
                      : linkedTrade.pnl < 0
                      ? "text-destructive"
                      : "text-muted-foreground"
                  )}
                >
                  {linkedTrade.pnl > 0 ? "+" : ""}${linkedTrade.pnl}
                </span>
              </span>
              <span>
                <span className="text-muted-foreground text-xs">RR </span>
                <span className="font-semibold">{linkedTrade.rr}R</span>
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
