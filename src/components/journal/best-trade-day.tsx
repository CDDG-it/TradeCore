"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Target, Loader2, Trash2, Check, Trophy } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { ScreenshotUpload } from "@/components/screenshot-upload";
import { cn } from "@/lib/utils";
import { getBestTradeOfDay, saveBestTradeOfDay, deleteBestTradeOfDay } from "@/lib/supabase/queries";
import type { BestTradeOfDay, ScreenshotGroup } from "@/lib/types";

/**
 * Best trade of the day — a per-day reflection that lives in the Journal for
 * every calendar day, traded or not. The trader drops screenshots of the best
 * trade that was on offer that day and notes why it was the better play (or why
 * it was takeable), or flags that the trade they actually took was already the
 * best one available.
 */
export function BestTradeDayDialog({
  date,
  userId,
  open,
  onOpenChange,
  onSaved,
}: {
  date: string; // yyyy-MM-dd
  userId: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved?: (entry: BestTradeOfDay | null) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existed, setExisted] = useState(false);

  const [takenWasBest, setTakenWasBest] = useState(false);
  const [notes, setNotes] = useState("");
  const [groups, setGroups] = useState<ScreenshotGroup[]>([]);

  // Load the day's entry each time the dialog opens for a date.
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    getBestTradeOfDay(date)
      .then((entry) => {
        setExisted(entry !== null);
        setTakenWasBest(entry?.taken_was_best ?? false);
        setNotes(entry?.notes ?? "");
        setGroups(entry?.screenshot_groups ?? []);
      })
      .finally(() => setLoading(false));
  }, [open, date]);

  const hasContent = takenWasBest || notes.trim().length > 0 || groups.some((g) => g.urls.length > 0);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const saved = await saveBestTradeOfDay({
        date,
        taken_was_best: takenWasBest,
        notes: notes.trim(),
        screenshot_groups: groups,
      });
      onSaved?.(saved);
      onOpenChange(false);
    } catch {
      setError("Could not save. Run the best_trade_of_day migration in Supabase.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    setSaving(true);
    setError(null);
    try {
      await deleteBestTradeOfDay(date);
      onSaved?.(null);
      onOpenChange(false);
    } catch {
      setError("Could not delete.");
    } finally {
      setSaving(false);
    }
  }

  const prettyDate = format(new Date(date + "T12:00:00"), "EEEE, MMMM d");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/10 shrink-0">
              <Target className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-body text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Best trade of the day
              </p>
              <DialogTitle className="font-heading text-lg">{prettyDate}</DialogTitle>
            </div>
          </div>
          <DialogDescription className="sr-only">Log the best trade available on {prettyDate}</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-14">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-5">
            {/* Taken-was-best toggle */}
            <button
              type="button"
              onClick={() => setTakenWasBest((v) => !v)}
              className={cn(
                "w-full flex items-center gap-3 rounded-xl border p-3.5 text-left transition-colors",
                takenWasBest ? "border-success/40 bg-success/10" : "border-border hover:bg-muted/40"
              )}
            >
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                takenWasBest ? "bg-success/20" : "bg-muted")}>
                <Trophy className={cn("w-5 h-5", takenWasBest ? "text-success" : "text-muted-foreground")} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">My taken trade was already the best of the day</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Tick this when the trade you actually took was the highest-quality play available.
                </p>
              </div>
              <Switch checked={takenWasBest} onCheckedChange={setTakenWasBest} className="pointer-events-none" />
            </button>

            {/* Divider hint */}
            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-border/60" />
              <span className="text-[11px] font-medium text-muted-foreground/70">
                {takenWasBest ? "Optional — add context anyway" : "Or capture the trade you could have taken"}
              </span>
              <span className="h-px flex-1 bg-border/60" />
            </div>

            {/* Screenshots */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Screenshots
              </p>
              <ScreenshotUpload
                groups={groups}
                onChange={setGroups}
                storageConfig={userId ? { userId, entityType: "best-trade", entityId: date } : undefined}
              />
              {!userId && (
                <p className="text-[11px] text-muted-foreground/70 mt-1.5">Loading your account…</p>
              )}
            </div>

            {/* Notes */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Why was this the better trade?
              </p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What made this the highest-quality setup that day, and why you could have taken it — the confluence, the level, the timing you'd want to repeat."
                rows={4}
                className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/40 focus:border-primary/50 focus:ring-2 focus:ring-primary/15 resize-none"
              />
            </div>

            {error && <p className="text-xs text-destructive">{error}</p>}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              {existed && (
                <button
                  type="button"
                  onClick={remove}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear
                </button>
              )}
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="ml-auto rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                disabled={saving || !hasContent}
                className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all disabled:opacity-50"
                style={{ background: "#14B8A6", boxShadow: "0 2px 12px rgba(20,184,166,0.26)" }}
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Save
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
