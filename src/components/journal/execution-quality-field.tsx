"use client";

import { useState } from "react";
import { Info, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { TradeJournalEntry } from "@/lib/types";

type Quality = TradeJournalEntry["execution_quality"];

/**
 * The one place a trader rates a trade on execution — and therefore the one
 * place the word needs explaining. The definition sits behind an "i" so it is
 * there the first few times and out of the way after that.
 *
 * Shared by the new-trade and edit-trade forms so the wording can never drift
 * between them.
 */
export function ExecutionQualityField({
  value,
  onChange,
}: {
  value: Quality;
  onChange: (next: Quality) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <Label className="text-xs">Execution Quality</Label>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="What counts as good and bad execution"
          className={cn(
            // Small circle, generous tap target.
            "relative inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
            "before:absolute before:-inset-2.5 before:content-['']",
            open
              ? "border-primary bg-primary text-primary-foreground"
              : "border-primary/45 bg-primary/12 text-primary hover:border-primary hover:bg-primary/20"
          )}
        >
          <Info className="h-3 w-3" />
        </button>
      </div>

      {open && (
        <div className="relative rounded-xl border border-primary/25 bg-primary/[0.05] p-3.5 pr-9">
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="absolute right-2.5 top-2.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            Execution is whether you held to your plan and your edge — not whether the
            trade made money.
          </p>
          <ul className="mt-2 space-y-1.5 text-[13px] leading-relaxed text-muted-foreground">
            <li>
              <span className="font-semibold text-success">Good execution</span> — the
              setup was your setup, at your level, at your size, entered and exited the
              way you had written it down. It stays good execution when it loses.
            </li>
            <li>
              <span className="font-semibold text-destructive">Bad execution</span> — you
              chased it, sized up, moved your stop, cut a runner early or took a trade
              your plan never called for. It stays bad execution when it pays.
            </li>
          </ul>
          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
            Leave it unset if you genuinely can&apos;t call it — an unrated trade is left
            out of the maths rather than counted against you. What you set here is summed
            up in every weekly review and is one of the four inputs to your MC Mindscore.
          </p>
        </div>
      )}

      <div className="flex gap-1.5">
        {(["good", "bad"] as const).map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => onChange(value === q ? undefined : q)}
            className={cn(
              "flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize",
              value === q
                ? q === "good"
                  ? "bg-success text-success-foreground shadow-sm"
                  : "bg-destructive text-white shadow-sm"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            {q === "good" ? "✓ Good execution" : "✗ Bad execution"}
          </button>
        ))}
      </div>
    </div>
  );
}
