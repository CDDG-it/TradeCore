"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import Link from "next/link";
import { Check, CircleHelp, ExternalLink, Loader2 } from "lucide-react";
import { AccentPanel } from "@/components/ui/accent-panel";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getRPotentialAnalyses, saveRPotentialAnalysis } from "@/lib/supabase/queries";
import { instrumentName, tradeR } from "@/lib/journal/weeks";
import type { RPotentialAnalysis, TradeJournalEntry } from "@/lib/types";

const THRESHOLDS = [1.5, 1.75, 2, 2.5, 3];
type Draft = { planned: string; mfe: string; stopMfe: string; note: string };

function numberOrNull(value: string): number | null {
  if (value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function draftFrom(row?: RPotentialAnalysis): Draft {
  return {
    planned: row?.planned_take_profit_r?.toString() ?? "",
    mfe: row?.mfe_r?.toString() ?? "",
    stopMfe: row?.stop_hit_mfe_r?.toString() ?? "",
    note: row?.note ?? "",
  };
}

function RPotentialCard({ trade, initial, onChange, onRegisterFlush, onSaved, compact = false }: {
  trade: TradeJournalEntry;
  initial?: RPotentialAnalysis;
  onChange: (tradeId: string, draft: Draft) => void;
  onRegisterFlush?: (tradeId: string, flush: (() => Promise<void>) | null) => void;
  onSaved?: (record: RPotentialAnalysis) => void;
  compact?: boolean;
}) {
  const [draft, setDraft] = useState<Draft>(() => draftFrom(initial));
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef<Draft>(draft);
  const changed = useRef(false);
  const queued = useRef(Promise.resolve());

  function persist(value: Draft): Promise<void> {
    const planned = numberOrNull(value.planned);
    const mfe = numberOrNull(value.mfe);
    const stopMfe = numberOrNull(value.stopMfe);
    if ((planned !== null && planned <= 0) || (mfe !== null && mfe < 0) || (stopMfe !== null && stopMfe < 0)) {
      setStatus("error");
      return Promise.reject(new Error("Invalid R value"));
    }
    setStatus("saving");
    queued.current = queued.current.catch(() => {}).then(async () => {
      const saved = await saveRPotentialAnalysis({
        trade_id: trade.id,
        planned_take_profit_r: planned,
        mfe_r: mfe,
        stop_hit_mfe_r: stopMfe,
        note: value.note.trim(),
      });
      onSaved?.(saved);
    });
    queued.current.then(() => {
      if (latest.current === value) setStatus("saved");
    }).catch(() => setStatus("error"));
    return queued.current;
  }

  function update(partial: Partial<Draft>) {
    const next = { ...latest.current, ...partial };
    latest.current = next;
    changed.current = true;
    setDraft(next);
    setStatus("idle");
    onChange(trade.id, next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { timer.current = null; changed.current = false; void persist(next).catch(() => {}); }, 700);
  }

  async function flush() {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
      changed.current = false;
      await persist(latest.current);
    } else await queued.current;
  }

  const flushRef = useRef(flush);
  useEffect(() => { flushRef.current = flush; });
  useEffect(() => {
    onRegisterFlush?.(trade.id, () => flushRef.current());
    return () => onRegisterFlush?.(trade.id, null);
  }, [trade.id, onRegisterFlush]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
    if (changed.current) {
      const value = latest.current;
      const planned = numberOrNull(value.planned);
      const mfe = numberOrNull(value.mfe);
      const stopMfe = numberOrNull(value.stopMfe);
      if ((planned === null || planned > 0) && (mfe === null || mfe >= 0) && (stopMfe === null || stopMfe >= 0)) {
        void queued.current.catch(() => {}).then(() => saveRPotentialAnalysis({
          trade_id: trade.id, planned_take_profit_r: planned, mfe_r: mfe,
          stop_hit_mfe_r: stopMfe, note: value.note.trim(),
        })).catch(() => {});
      }
    }
  }, [trade.id]);

  const mfe = numberOrNull(draft.mfe);
  const fieldClass = "h-9 w-full rounded-lg border border-border/60 bg-background/40 px-3 text-sm tabular-nums outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10";

  return (
    <div className="rounded-xl border border-border/60 bg-background/30 p-3 sm:p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">{instrumentName(trade.instrument)} <span className="ml-1 text-xs font-normal capitalize text-muted-foreground">{trade.direction}</span></p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Realised <span className="font-semibold tabular-nums text-foreground">+{tradeR(trade).toFixed(2)}R</span> · Journal result</p>
        </div>
        <Link href={`/journal/${trade.id}?from=trade-therapist`} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">View trade <ExternalLink className="h-3 w-3" /></Link>
      </div>

      <div className={`mt-3 grid grid-cols-3 gap-2 ${compact ? "" : "max-sm:grid-cols-1"}`}>
        <label className="text-[11px] font-medium text-muted-foreground">Planned take-profit R
          <input type="number" min="0.01" step="0.01" inputMode="decimal" value={draft.planned} onChange={(e) => update({ planned: e.target.value })} onBlur={() => { void flush().catch(() => {}); }} placeholder="Optional" className={`mt-1 ${fieldClass}`} />
        </label>
        <label className="text-[11px] font-medium text-muted-foreground">Maximum R reached (MFE)
          <input type="number" min="0" step="0.01" inputMode="decimal" value={draft.mfe} onChange={(e) => update({ mfe: e.target.value })} onBlur={() => { void flush().catch(() => {}); }} placeholder="e.g. 2.32" className={`mt-1 ${fieldClass}`} />
        </label>
        <label className="text-[11px] font-medium text-muted-foreground">Max R before original stop was hit
          <input type="number" min="0" step="0.01" inputMode="decimal" value={draft.stopMfe} onChange={(e) => update({ stopMfe: e.target.value })} onBlur={() => { void flush().catch(() => {}); }} placeholder="If observed" className={`mt-1 ${fieldClass}`} />
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5" aria-label="R targets reached, derived from maximum favorable excursion">
        <span className="mr-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Reached</span>
        {THRESHOLDS.map((threshold) => {
          const reached = mfe !== null && mfe >= threshold;
          return <span key={threshold} className={`rounded-md border px-2 py-1 text-[11px] font-semibold tabular-nums ${reached ? "border-primary/35 bg-primary/10 text-primary" : "border-border/60 text-muted-foreground/60"}`} aria-label={`${threshold}R ${reached ? "reached" : "not reached"}`}>
            {reached && <Check className="mr-1 inline h-3 w-3" />}{threshold}R
          </span>;
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input aria-label={`Optional note for ${instrumentName(trade.instrument)} trade`} value={draft.note} onChange={(e) => update({ note: e.target.value })} onBlur={() => { void flush().catch(() => {}); }} placeholder="Optional short note" className="h-9 min-w-0 flex-1 rounded-lg border border-border/60 bg-background/40 px-3 text-xs outline-none focus:border-primary/50" />
        <span className="min-w-14 text-right text-[11px] text-muted-foreground" role="status">
          {status === "saving" ? <><Loader2 className="mr-1 inline h-3 w-3 animate-spin" />Saving</> : status === "saved" ? <><Check className="mr-1 inline h-3 w-3 text-success" />Saved</> : status === "error" ? <span className="text-destructive">Save failed</span> : null}
        </span>
      </div>
    </div>
  );
}

export function RPotentialAnalysisSection({ trades, flushRef, onSaved, compact = false }: { trades: TradeJournalEntry[]; flushRef?: MutableRefObject<(() => Promise<void>) | null>; onSaved?: (record: RPotentialAnalysis) => void; compact?: boolean }) {
  const winners = useMemo(() => trades.filter((trade) => trade.result === "win"), [trades]);
  const [records, setRecords] = useState<Record<string, RPotentialAnalysis>>({});
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const ids = winners.map((trade) => trade.id).join(",");
  const flushers = useRef(new Map<string, () => Promise<void>>());
  const registerFlush = useCallback((tradeId: string, flush: (() => Promise<void>) | null) => {
    if (flush) flushers.current.set(tradeId, flush);
    else flushers.current.delete(tradeId);
  }, []);
  useEffect(() => {
    if (!flushRef) return;
    flushRef.current = async () => {
      if (loading) return;
      if (error) throw new Error("R Potential Analysis is not ready");
      await Promise.all([...flushers.current.values()].map((flush) => flush()));
    };
    return () => { flushRef.current = null; };
  }, [flushRef, loading, error]);

  useEffect(() => {
    if (!ids) return;
    getRPotentialAnalyses(ids.split(","))
      .then((rows) => { setRecords(Object.fromEntries(rows.map((row) => [row.trade_id, row]))); setError(false); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [ids]);

  if (winners.length === 0) return <div className="rounded-xl border border-border/60 bg-card/60 px-4 py-5 text-sm text-muted-foreground">No winning trades to analyse today.</div>;
  if (loading) return <div className="py-5 text-center text-muted-foreground"><Loader2 className="mx-auto h-4 w-4 animate-spin" /></div>;
  if (error) return <p className="rounded-xl border border-destructive/30 p-4 text-xs text-destructive">Could not load R Potential Analysis. Please refresh and try again.</p>;

  const included = winners.flatMap((trade) => {
    const mfe = numberOrNull(drafts[trade.id]?.mfe ?? draftFrom(records[trade.id]).mfe);
    return mfe === null ? [] : [{ trade, mfe }];
  });
  const average = (values: number[]) => (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2);

  const content = <>
      <div className={`${compact ? "mt-0" : "mt-2"} flex items-start gap-1.5 text-[11px] leading-relaxed text-muted-foreground`}>
        <span>Maximum Favorable Excursion (MFE) is the maximum profit, measured in R, that the trade reached before the original trade idea was invalidated.</span>
        <TooltipProvider><Tooltip><TooltipTrigger aria-label="About MFE" className="shrink-0"><CircleHelp className="h-3.5 w-3.5" /></TooltipTrigger><TooltipContent>Measure from the original entry and stop-loss, using the highest favorable price before invalidation.</TooltipContent></Tooltip></TooltipProvider>
      </div>
      <div className={`${compact ? "mt-2" : "mt-4"} space-y-2`}>
        {winners.map((trade) => <RPotentialCard key={trade.id} trade={trade} initial={records[trade.id]} compact={compact} onChange={(id, draft) => setDrafts((prev) => ({ ...prev, [id]: draft }))} onRegisterFlush={registerFlush} onSaved={onSaved} />)}
      </div>
      {!compact && included.length > 0 && <div className="mt-4 border-t border-border/60 pt-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Exit Analysis · {included.length} reviewed winner{included.length !== 1 ? "s" : ""}</p>
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
          <div><p className="text-muted-foreground">Actual average winner</p><p className="mt-0.5 font-semibold tabular-nums">{average(included.map(({ trade }) => tradeR(trade)))}R</p></div>
          <div><p className="text-muted-foreground">Average MFE</p><p className="mt-0.5 font-semibold tabular-nums">{average(included.map(({ mfe }) => mfe))}R</p></div>
          {[2, 2.5].map((target) => <div key={target}><p className="text-muted-foreground">Trades reaching {target}R</p><p className="mt-0.5 font-semibold tabular-nums">{included.filter(({ mfe }) => mfe >= target).length} / {included.length}</p></div>)}
        </div>
      </div>}
    </>;
  if (compact) return content;
  return <AccentPanel accent="cyan" eyebrow="Post Market" title="R Potential Analysis" subtitle="Record the path of each winning trade to compare exit targets over time.">{content}</AccentPanel>;
}
