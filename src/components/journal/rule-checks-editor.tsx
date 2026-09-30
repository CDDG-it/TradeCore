"use client";

import type { RuleCheckDraft } from "@/lib/supabase/queries";
import type { RuleCheckStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const OPTIONS: { value: RuleCheckStatus; label: string }[] = [
  { value: "kept", label: "Kept" },
  { value: "broken", label: "Broken" },
  { value: "not_applicable", label: "N/A" },
];

export function RuleChecksEditor({ checks, onChange }: { checks: RuleCheckDraft[]; onChange: (checks: RuleCheckDraft[]) => void }) {
  const groups = [
    { type: "commitment" as const, title: "Today's commitment" },
    { type: "standing_rule" as const, title: "Standing rules" },
  ];
  return <div className="space-y-4">
    {groups.map((group) => {
      const rows = checks.filter((check) => check.source_type === group.type);
      return <section key={group.type}>
        <div className="mb-2 flex items-center justify-between"><h3 className="text-xs font-semibold">{group.title}</h3><span className="text-[10px] text-muted-foreground">Defaults to N/A</span></div>
        {rows.length === 0 ? <p className="rounded-lg border border-dashed border-border/60 px-3 py-3 text-xs text-muted-foreground">{group.type === "commitment" ? "No completed pre-market commitment for this date." : "No standing rules active for this date."}</p> : <div className="space-y-2">{rows.map((check) => <div key={`${check.source_type}:${check.source_id}`} className="rounded-xl border border-border/60 bg-background/35 p-3">
          <p className="text-sm leading-snug">{check.source_text_snapshot}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">{OPTIONS.map((option) => <button key={option.value} type="button" onClick={() => onChange(checks.map((row) => row.source_id === check.source_id ? { ...row, status: option.value } : row))} className={cn("rounded-md border px-2.5 py-1 text-[11px] font-semibold", check.status === option.value ? option.value === "kept" ? "border-success/40 bg-success/10 text-success" : option.value === "broken" ? "border-destructive/40 bg-destructive/10 text-destructive" : "border-primary/40 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground")}>{option.label}</button>)}</div>
          <input value={check.note} onChange={(event) => onChange(checks.map((row) => row.source_id === check.source_id ? { ...row, note: event.target.value } : row))} placeholder="Optional short note" maxLength={240} className="mt-2 h-8 w-full rounded-lg border border-border/60 bg-background px-2.5 text-xs outline-none focus:border-primary/50" />
        </div>)}</div>}
      </section>;
    })}
  </div>;
}
