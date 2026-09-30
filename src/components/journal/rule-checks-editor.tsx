"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import type { RuleCheckDraft } from "@/lib/supabase/queries";
import type { RuleCheckStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * The trade log's discipline checklist. A row starts neutral and untouched,
 * tick it for a rule you kept, tick again to mark it broken — the same gesture
 * as the old checkbox list. The X sets a rule aside when it could not apply to
 * this trade, so it stays out of the score instead of counting against it.
 *
 * The day's pre-market commitment sits on its own tab: it is a single promise
 * made this morning, not a standing rule, and it deserves the room. The score
 * above the tabs covers both, so nothing hides behind the tab you are not on.
 *
 * Statuses are stored per trade in trade_rule_checks, so the wording of a rule
 * is frozen at the moment it was judged.
 */
export function RuleChecksEditor({ checks, onChange, showScore = true }: { checks: RuleCheckDraft[]; onChange: (checks: RuleCheckDraft[]) => void; showScore?: boolean }) {
  function setStatus(sourceId: string, status: RuleCheckStatus) {
    onChange(checks.map((row) => row.source_id === sourceId ? { ...row, status } : row));
  }

  const scored = checks.filter((check) => check.status !== "not_applicable");
  const kept = scored.filter((check) => check.status === "kept").length;
  const score = scored.length > 0 ? Math.round((kept / scored.length) * 100) : 0;
  const scoreColor = score >= 80 ? "oklch(0.58 0.17 145)" : score >= 60 ? "var(--be)" : "oklch(0.58 0.22 25)";

  const commitments = checks.filter((check) => check.source_type === "commitment");
  const rules = checks.filter((check) => check.source_type === "standing_rule");
  const [tab, setTab] = useState<"commitment" | "standing_rule">(commitments.length > 0 ? "commitment" : "standing_rule");
  const shown = tab === "commitment" ? commitments : rules;

  if (checks.length === 0) {
    return <p className="py-2 text-center text-xs text-muted-foreground/60">
      No rules active for this date. Set them under{" "}
      <a href="/psychological-edge" className="text-primary hover:underline">Trading rules</a>.
    </p>;
  }

  // A broken rule on the tab you are not looking at still needs to announce
  // itself, so each tab carries a dot when something under it was marked broken.
  const TABS = [
    { key: "commitment" as const, label: "Commitment", group: commitments },
    { key: "standing_rule" as const, label: "Standing rules", group: rules },
  ].map((item) => ({ ...item, count: item.group.length, broken: item.group.some((check) => check.status === "broken") }));

  return <div className="space-y-3">
    {showScore && scored.length > 0 && <div className="flex items-center gap-2">
      <div className="h-1.5 max-w-28 flex-1 overflow-hidden rounded-full" style={{ background: "oklch(0.18 0.005 28)" }}>
        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${score}%`, background: scoreColor }} />
      </div>
      <span className="shrink-0 text-xs font-bold tabular-nums" style={{ color: scoreColor }}>{score}%</span>
      <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">{kept} of {scored.length} kept</span>
    </div>}

    <div className="flex items-center gap-1 rounded-lg bg-secondary p-1">
      {TABS.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => setTab(item.key)}
          aria-pressed={tab === item.key}
          className={cn(
            "press flex-1 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors",
            tab === item.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {item.label}
          <span className={cn("ml-1.5 tabular-nums", tab === item.key ? "text-primary-foreground/70" : "text-muted-foreground/60")}>
            {item.count}
          </span>
          {item.broken && <span className="ml-1 inline-block size-1.5 rounded-full bg-destructive align-middle" aria-label="has a broken rule" />}
        </button>
      ))}
    </div>

    {shown.length === 0 ? (
      <p className="py-3 text-center text-xs text-muted-foreground/60">
        {tab === "commitment"
          ? "No completed pre-market commitment for this date."
          : "No standing rules active for this date."}
      </p>
    ) : <div className="space-y-1.5">
      {shown.map((check) => {
        const passed = check.status === "kept";
        const setAside = check.status === "not_applicable";
        return <div key={`${check.source_type}:${check.source_id}`} className="group/check flex items-center gap-2">
          <button
            type="button"
            onClick={() => setStatus(check.source_id, passed ? "broken" : "kept")}
            className={cn(
              "flex flex-1 items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-all",
              passed ? "border-success/25 bg-success/8"
                : setAside ? "border-border bg-secondary hover:border-primary/30 hover:bg-muted"
                : "border-destructive/25 bg-destructive/5 hover:border-destructive/40"
            )}
          >
            <span className={cn(
              "flex size-5 shrink-0 items-center justify-center rounded-md border-2 transition-all",
              passed ? "border-success bg-success" : "border-muted-foreground/30 bg-transparent"
            )}>
              {passed && <Check className="size-3 text-white" />}
            </span>
            <span className={cn("min-w-0 flex-1 text-sm transition-colors", passed ? "text-foreground" : setAside ? "text-muted-foreground/70" : "text-muted-foreground")}>
              {check.source_text_snapshot}
            </span>
          </button>
          {!setAside && <button
            type="button"
            onClick={() => setStatus(check.source_id, "not_applicable")}
            title="Did not apply to this trade"
            className="shrink-0 rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover/check:opacity-100"
          >
            <X className="size-3.5" />
          </button>}
        </div>;
      })}
    </div>}
  </div>;
}
