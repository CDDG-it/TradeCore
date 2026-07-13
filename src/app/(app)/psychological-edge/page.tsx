"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Brain, Loader2, RefreshCw, Target, Bell, Gauge, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { PageWrapper } from "@/components/ui/page-wrapper";
import { cn } from "@/lib/utils";
import { getTrades, getAnalyses, getPsychEdgeSessions, savePsychEdgeSession } from "@/lib/supabase/queries";
import { computeReflection, type PsychEdgeReflection } from "@/lib/psych-edge/engine";
import type { TradeJournalEntry, PreTradeAnalysis, PsychEdgeSession } from "@/lib/types";

const TODAY = format(new Date(), "yyyy-MM-dd");
const ACCENT = "oklch(0.70 0.12 183)"; // turquoise, matches the Mindset formula

export default function PsychologicalEdgePage() {
  const [trades, setTrades] = useState<TradeJournalEntry[] | null>(null);
  const [analyses, setAnalyses] = useState<PreTradeAnalysis[]>([]);
  const [sessions, setSessions] = useState<PsychEdgeSession[]>([]);
  const [saveError, setSaveError] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  async function load() {
    const [t, a, s] = await Promise.all([getTrades(), getAnalyses(), getPsychEdgeSessions()]);
    setTrades(t);
    setAnalyses(a);
    setSessions(s);
    return { t, a, s };
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sessions before today, newest-first — what the engine checks commitments against.
  const priorSessions = useMemo(() => sessions.filter((s) => s.date !== TODAY), [sessions]);
  const todaysSession = useMemo(() => sessions.find((s) => s.date === TODAY) ?? null, [sessions]);

  const live = useMemo(
    () => (trades ? computeReflection(trades, analyses, priorSessions) : null),
    [trades, analyses, priorSessions]
  );

  // Persist whenever the latest trade differs from what today's saved session
  // (if any) is based on — this is what "regenerates" the session as new
  // trades come in, with no button required on first load.
  useEffect(() => {
    if (!live) return;
    if (todaysSession && todaysSession.trade_id === live.tradeId) return;
    void persist(live);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live?.tradeId]);

  async function persist(r: PsychEdgeReflection) {
    setSaveError(false);
    try {
      const saved = await savePsychEdgeSession({
        date: TODAY,
        trade_id: r.tradeId,
        pattern_key: r.patternKey,
        recurring_pattern_label: r.recurringPatternLabel,
        narrative: r.narrative,
        primary_objective: r.primaryObjective,
        reminder: r.reminder,
        success_metric: r.successMetric,
      });
      setSessions((prev) => [saved, ...prev.filter((s) => s.date !== TODAY)]);
    } catch {
      setSaveError(true);
    }
  }

  async function regenerate() {
    if (!live) return;
    setRegenerating(true);
    await load();
    await persist(live);
    setRegenerating(false);
  }

  const displayed = todaysSession ?? (live
    ? {
        date: TODAY,
        narrative: live.narrative,
        primary_objective: live.primaryObjective,
        reminder: live.reminder,
        success_metric: live.successMetric,
        recurring_pattern_label: live.recurringPatternLabel,
      }
    : null);

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        badge="MC Mindset Formula"
        title="Psychological Edge"
        subtitle="The journal records what happened. This explains why — and what has to change before your next trade."
      />

      <PageWrapper className="space-y-6">
        {trades === null ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : trades.length === 0 ? (
          <EmptyState />
        ) : displayed ? (
          <>
            <Session
              session={displayed}
              tradesAnalyzed={live?.tradesAnalyzed ?? trades.length}
              onRegenerate={regenerate}
              regenerating={regenerating}
              saveError={saveError}
            />
            {priorSessions.length > 0 && <History sessions={priorSessions} />}
          </>
        ) : null}
      </PageWrapper>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-border p-10 text-center">
      <Brain className="w-8 h-8 mx-auto mb-3 text-muted-foreground/40" />
      <p className="text-sm text-muted-foreground mb-1">Nothing to analyze yet.</p>
      <p className="text-xs text-muted-foreground/70">Log a trade in the Journal and your first session appears here.</p>
    </div>
  );
}

interface DisplaySession {
  date: string;
  narrative: string[];
  primary_objective: string | null;
  reminder: string | null;
  success_metric: string | null;
  recurring_pattern_label: string | null;
}

function Session({
  session, tradesAnalyzed, onRegenerate, regenerating, saveError,
}: {
  session: DisplaySession;
  tradesAnalyzed: number;
  onRegenerate: () => void;
  regenerating: boolean;
  saveError: boolean;
}) {
  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" style={{ color: ACCENT }} />
          <p className="text-sm font-semibold">Today's session</p>
          <span className="text-xs text-muted-foreground/60 tabular-nums">· based on {tradesAnalyzed} trade{tradesAnalyzed !== 1 ? "s" : ""}</span>
        </div>
        <button
          onClick={onRegenerate}
          disabled={regenerating}
          title="Re-read the journal for new trades"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground hover:border-primary/30 disabled:opacity-50"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", regenerating && "animate-spin")} />
          Refresh
        </button>
      </div>

      {saveError && (
        <p className="text-xs text-destructive">Could not save this session. Run the latest SQL migration (psych_edge_sessions) in Supabase.</p>
      )}

      {/* Narrative */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        {session.narrative.map((p, i) => (
          <p
            key={i}
            className={cn(
              "leading-relaxed",
              i === 0 ? "text-[15px] font-semibold text-foreground" : "text-sm text-foreground/80"
            )}
          >
            {p}
          </p>
        ))}
      </div>

      {/* Action plan */}
      {session.primary_objective && (
        <div
          className="rounded-xl border p-5 space-y-3"
          style={{ borderColor: "oklch(0.70 0.12 183 / 0.4)", background: "oklch(0.70 0.12 183 / 0.06)" }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: ACCENT }}>Tomorrow&apos;s focus</p>

          <div className="flex items-start gap-2.5">
            <Target className="w-4 h-4 mt-0.5 shrink-0" style={{ color: ACCENT }} />
            <p className="text-sm font-semibold text-foreground">{session.primary_objective}</p>
          </div>

          {session.reminder && (
            <div className="flex items-start gap-2.5">
              <Bell className="w-3.5 h-3.5 mt-0.5 shrink-0 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">{session.reminder}</p>
            </div>
          )}

          {session.success_metric && (
            <div className="flex items-start gap-2.5">
              <Gauge className="w-3.5 h-3.5 mt-0.5 shrink-0 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground/70">Success metric — </span>
                {session.success_metric}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function History({ sessions }: { sessions: PsychEdgeSession[] }) {
  return (
    <div className="space-y-2 border-t border-border/50 pt-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Session history</p>
      <div className="space-y-1.5">
        {sessions.slice(0, 10).map((s, i, arr) => {
          const older = arr[i + 1]; // chronologically earlier session (list is newest-first)
          const carried = older && s.pattern_key && older.pattern_key === s.pattern_key;
          return (
            <div key={s.id} className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/20 px-3 py-2">
              <span className="text-xs text-muted-foreground tabular-nums w-16 shrink-0">
                {format(new Date(s.date + "T12:00:00"), "MMM d")}
              </span>
              <span className="text-xs text-foreground/80 flex-1 truncate">{s.primary_objective ?? "—"}</span>
              {carried && (
                <span className="text-[10px] font-semibold uppercase tracking-wide text-destructive shrink-0">Repeated</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
