"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, CalendarDays, Pencil, Trash2, TrendingDown, TrendingUp } from "lucide-react";
import { AnalysisChartBoard } from "@/components/analysis/analysis-chart-board";
import { deleteAnalysis } from "@/lib/supabase/queries";
import type { PreTradeAnalysis, TradeJournalEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

export function AnalysisReview({ analysis, linkedTrade, preview = false }: { analysis: PreTradeAnalysis; linkedTrade: TradeJournalEntry | null; preview?: boolean }) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(false);

  async function remove() {
    setDeleting(true);
    setDeleteError(false);
    try {
      await deleteAnalysis(analysis.id);
      router.push("/analysis");
    } catch {
      setDeleting(false);
      setDeleteError(true);
    }
  }

  const bias = analysis.bias === "bullish" ? "Bullish" : analysis.bias === "bearish" ? "Bearish" : "Choppy";
  const biasTone = analysis.bias === "bullish" ? "text-success border-success/25 bg-success/10" : analysis.bias === "bearish" ? "text-destructive border-destructive/25 bg-destructive/10" : "text-warning border-warning/25 bg-warning/10";

  return (
    <div className="flex flex-col gap-3 lg:h-[calc(100dvh-7.25rem)] lg:min-h-[38rem] lg:overflow-hidden">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link href={preview ? "/preview/analysis" : "/analysis"} aria-label="Back to analyses" className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/70 text-muted-foreground transition-colors hover:text-foreground"><ArrowLeft className="size-4" /></Link>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2"><h1 className="font-heading text-xl font-bold leading-tight tracking-tight text-foreground">{analysis.instrument} analysis</h1><span className={cn("rounded-full border px-2.5 py-1 text-[11px] font-semibold", biasTone)}>{bias}</span></div>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarDays className="size-3" /> {format(new Date(`${analysis.date}T12:00:00`), "d MMMM yyyy")} · {analysis.market}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={preview ? "/preview/analysis" : `/analysis/${analysis.id}/edit`} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:border-primary/40"><Pencil className="size-3.5" /> Edit</Link>
          {!preview && (!confirmDelete ? <button type="button" onClick={() => setConfirmDelete(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/25 px-3 py-2 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/10"><Trash2 className="size-3.5" /> Delete</button>
            : <div className="flex items-center gap-1.5"><button type="button" onClick={() => setConfirmDelete(false)} className="rounded-lg border border-border px-2.5 py-2 text-xs text-muted-foreground">Cancel</button><button type="button" onClick={() => void remove()} disabled={deleting} className="rounded-lg bg-destructive px-2.5 py-2 text-xs font-semibold text-white disabled:opacity-50">{deleting ? "Deleting..." : "Confirm delete"}</button></div>)}
        </div>
      </header>
      {deleteError && <p role="alert" className="rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2 text-xs text-destructive">Could not delete this analysis. Try again.</p>}

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(22rem,0.9fr)_minmax(0,1.1fr)]">
        <section className="min-h-0 overflow-y-auto rounded-2xl border border-border/70 bg-card/75 p-4 sm:p-5">
          <div className="mb-5"><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-primary">Market plan</p><h2 className="mt-1.5 text-lg font-semibold tracking-tight">Your read, in one place</h2></div>
          <div className="space-y-4">
            <article className="rounded-xl border border-border/70 bg-background/45 p-4"><h3 className="text-xs font-semibold uppercase tracking-[.12em] text-muted-foreground">Thesis</h3><p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{analysis.thesis}</p></article>
            <article className="rounded-xl border border-success/20 bg-success/[.04] p-4"><h3 className="flex items-center gap-2 text-sm font-semibold text-success"><TrendingUp className="size-4" /> Long scenario</h3><p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">{analysis.long_scenario || "No long scenario recorded."}</p></article>
            <article className="rounded-xl border border-destructive/20 bg-destructive/[.04] p-4"><h3 className="flex items-center gap-2 text-sm font-semibold text-destructive"><TrendingDown className="size-4" /> Short scenario</h3><p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">{analysis.short_scenario || "No short scenario recorded."}</p></article>
            {analysis.notes && <article className="rounded-xl border border-border/70 bg-background/45 p-4"><h3 className="text-xs font-semibold uppercase tracking-[.12em] text-muted-foreground">Notes</h3><p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">{analysis.notes}</p></article>}
            {linkedTrade && <Link href={`/journal/${linkedTrade.id}`} className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/[.05] p-4 text-xs transition-colors hover:bg-primary/10"><span><strong className="block text-foreground">Linked trade</strong><span className="mt-1 block text-muted-foreground">{linkedTrade.result} · {linkedTrade.rr}R</span></span><span className="font-semibold text-primary">View trade →</span></Link>}
          </div>
        </section>
        <section className="min-h-[35rem] rounded-2xl border border-border/70 bg-card/75 p-4 sm:p-5 lg:min-h-0"><AnalysisChartBoard groups={analysis.screenshot_groups ?? []} target={null} readOnly /></section>
      </div>
    </div>
  );
}
