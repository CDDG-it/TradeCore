"use client";

import { History, X } from "lucide-react";

/**
 * Subtle "we restored your unsaved draft" notice. Premium and quiet — a soft
 * orange-tinted bar that the user can dismiss without deleting anything.
 */
export function DraftBanner({
  onDismiss,
  label = "Draft restored — we kept your unsaved changes.",
}: {
  onDismiss: () => void;
  label?: string;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-primary/25 bg-primary/8 px-3.5 py-2.5 text-xs text-foreground/85">
      <History className="w-3.5 h-3.5 shrink-0 text-primary" />
      <span className="flex-1 leading-snug">{label}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="shrink-0 rounded-md p-0.5 text-muted-foreground transition-colors hover:text-foreground"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
