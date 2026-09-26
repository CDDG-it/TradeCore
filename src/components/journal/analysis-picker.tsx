"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { AnalysisListRow } from "@/lib/supabase/queries";

/**
 * Picks the pre-trade analysis a journal entry belongs to.
 *
 * Shows the analyses written for the trade's own date, and nothing else. It
 * used to list every other date underneath as well, which after a year of
 * preparation is a wall of a hundred chips to scroll past for the one that is
 * almost always right there at the top.
 *
 * The other dates are still reachable, folded away behind a link, because a
 * trade does occasionally belong to a plan written the evening before. The fold
 * stays shut even when nothing was prepared for this date: that is the very
 * case where the old list was at its worst, offering a hundred chips from every
 * other day precisely when none of them is likely to be the right one.
 *
 * One thing does show without asking: an entry already linked to an analysis
 * from another date shows that analysis next to the day's own. Hiding it would
 * leave the trader unable to see what their trade hangs on, and able to unlink
 * it without noticing.
 */
export function AnalysisPicker({
  analyses,
  date,
  value,
  onChange,
}: {
  analyses: AnalysisListRow[];
  /** The trade's own date, `yyyy-MM-dd`. */
  date: string;
  value: string | undefined;
  onChange: (id: string | undefined) => void;
}) {
  const [showOthers, setShowOthers] = useState(false);

  if (analyses.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No analyses yet. Create one before your next session, then link it here.
      </p>
    );
  }

  const forDate = analyses.filter((a) => a.date === date);
  const others = analyses.filter((a) => a.date !== date);
  // A link that points somewhere other than this date is shown alongside the
  // day's own, so the entry never hides what it is attached to.
  const linkedElsewhere = value ? others.find((a) => a.id === value) : undefined;

  /* "None" has to answer to every way of saying nothing. The column is
     nullable, a cleared form leaves an empty string, and an entry can still
     point at an analysis that has since been deleted. All three mean the trade
     is linked to nothing, so all three light up None rather than leaving the
     row with no selection showing at all. */
  const linkedToSomething = Boolean(linkedElsewhere) || forDate.some((a) => a.id === value);

  const primary = linkedElsewhere ? [...forDate, linkedElsewhere] : forDate;
  const rest = linkedElsewhere ? others.filter((a) => a.id !== linkedElsewhere.id) : others;
  const chip = (id: string | undefined) =>
    cn(
      "max-w-xs truncate rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
      (id === undefined ? !linkedToSomething : value === id)
        ? "bg-primary text-primary-foreground"
        : "bg-muted text-muted-foreground hover:text-foreground"
    );

  const label = (a: AnalysisListRow, withDate: boolean, max: number) =>
    `${withDate ? `${a.date} · ` : ""}${a.instrument} · ${
      a.title.length > max ? `${a.title.slice(0, max)}...` : a.title
    }`;

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        {forDate.length > 0
          ? `Analyses prepared for ${date}.`
          : `Nothing was prepared for ${date}.`}
      </p>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => onChange(undefined)} className={chip(undefined)}>
          None
        </button>
        {primary.map((a) => (
          <button key={a.id} type="button" onClick={() => onChange(a.id)} className={chip(a.id)}>
            {label(a, a.date !== date, 30)}
          </button>
        ))}
      </div>

      {rest.length > 0 && !showOthers && (
        <button
          type="button"
          onClick={() => setShowOthers(true)}
          className="text-xs font-medium text-primary underline underline-offset-2 transition-opacity hover:opacity-75"
        >
          Link one from another date
        </button>
      )}

      {rest.length > 0 && showOthers && (
        <div className="flex flex-wrap gap-2 border-t border-border/50 pt-3">
          {rest.map((a) => (
            <button key={a.id} type="button" onClick={() => onChange(a.id)} className={chip(a.id)}>
              {label(a, true, 24)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
