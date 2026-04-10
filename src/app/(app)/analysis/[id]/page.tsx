"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

  Pencil,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAnalysisById, getTrades, deleteAnalysis } from "@/lib/mock/store";
import { ScreenshotUpload } from "@/components/screenshot-upload";
import { cn } from "@/lib/utils";

export default function AnalysisDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const linkedTrade = getTrades().find((t) => t.linked_analysis_id === analysis.id);

  const biasConfig = {
    bullish: { icon: TrendingUp, color: "text-success", bg: "bg-success/8 border-success/20", label: "Bullish" },
    bearish: { icon: TrendingDown, color: "text-destructive", bg: "bg-destructive/8 border-destructive/20", label: "Bearish" },
    neutral: { icon: Minus, color: "text-muted-foreground", bg: "bg-muted border-border", label: "Neutral" },
  };

  const bias = biasConfig[analysis.bias];
  const BiasIcon = bias.icon;

  async function handleDelete() {
    setDeleting(true);
    await new Promise((r) => setTimeout(r, 300));
    deleteAnalysis(id);
    router.push("/analysis");
  }

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
              <span className="text-3xl font-bold text-primary">{analysis.instrument}</span>
              <Badge className="capitalize bg-secondary text-secondary-foreground border-border">
                {analysis.market}
              </Badge>
              {analysis.used_for_trade && (
                <Badge className="bg-gold/10 text-gold border-gold/20">
                  <LinkIcon className="w-3 h-3 mr-1" />
                  Traded
                </Badge>
              )}
            </div>
            <h1 className="text-lg font-semibold text-foreground/90">{analysis.title}</h1>
          </div>
          <div className={cn("flex items-center gap-2 px-4 py-2 rounded-xl border shrink-0", bias.bg)}>
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
{analysis.session} session
          </span>
          <span className="text-muted-foreground/50">
            Created {format(new Date(analysis.created_at), "MMM d 'at' h:mm a")}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-4">
          <Link href={`/analysis/${id}/edit`}>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </Button>
          </Link>
          {!confirmDelete ? (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-destructive font-medium">Delete this analysis?</span>
              <Button
                variant="outline"
                size="sm"
                className="bg-destructive text-white hover:bg-destructive/90 border-destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Yes, delete"}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setConfirmDelete(false)}>
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Thesis */}
      <Card className="shadow-sm">
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

      {/* Screenshots */}
      {(analysis.screenshot_groups ?? []).some((g) => g.urls.length > 0) && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Screenshots</CardTitle>
          </CardHeader>
          <CardContent>
            <ScreenshotUpload groups={analysis.screenshot_groups ?? []} onChange={() => {}} readOnly />
          </CardContent>
        </Card>
      )}

      {/* Key levels + setup */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gold" />
              Key Levels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analysis.key_levels.length === 0 ? (
                <p className="text-sm text-muted-foreground">No key levels set.</p>
              ) : (
                analysis.key_levels.map((level, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                  >
                    <span className="text-xs text-muted-foreground">Level {i + 1}</span>
                    <span className="font-mono text-sm font-medium text-primary">{level}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Planned Setup</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground/90 mb-4">{analysis.planned_setup || "—"}</p>
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

      {/* Invalidation */}
      {analysis.invalidation && (
        <Card className="bg-destructive/5 border-destructive/20 shadow-sm">
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
      )}

      {/* Notes */}
      {analysis.notes && (
        <Card className="shadow-sm">
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
        <Card className="bg-gold/5 border-gold/20 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-gold" />
                <span className="text-sm font-semibold text-gold">Linked Trade</span>
              </div>
              <Link href={`/journal/${linkedTrade.id}`} className="text-xs text-gold hover:text-gold/70 transition-colors">
                View trade →
              </Link>
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-sm">
              <span>
                <span className="text-muted-foreground text-xs">Result </span>
                <span className={cn("font-semibold capitalize",
                  linkedTrade.result === "win" ? "text-success"
                    : linkedTrade.result === "loss" ? "text-destructive"
                    : "text-warning")}>
                  {linkedTrade.result}
                </span>
              </span>
              <span>
                <span className="text-muted-foreground text-xs">R:R </span>
                <span className="font-semibold">{linkedTrade.rr}R</span>
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
