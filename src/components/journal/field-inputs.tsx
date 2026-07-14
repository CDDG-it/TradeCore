"use client";

import { Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

/**
 * Premium replacements for the raw <input type="date"/> and <input type="time"/>
 * controls in the trade form. The function is unchanged — a real native
 * date/time input still drives the value and opens the system picker — but it
 * sits invisibly over a formatted, on-brand display instead of showing the
 * browser's default grey control.
 */

function openPicker(e: React.MouseEvent<HTMLInputElement>) {
  const el = e.currentTarget as HTMLInputElement & { showPicker?: () => void };
  try {
    el.showPicker?.();
  } catch {
    /* older browsers fall back to native focus behaviour */
  }
}

const shell =
  "group relative flex items-center gap-3 rounded-xl border border-border bg-input/60 px-3.5 h-11 transition-colors hover:border-primary/30 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/15";

export function DateField({
  value,
  onChange,
  required,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  className?: string;
}) {
  const d = value ? new Date(value + "T12:00:00") : null;
  return (
    <div className={cn(shell, className)}>
      <Calendar className="w-4 h-4 shrink-0 text-primary/80" />
      <span className="flex-1 min-w-0 text-sm">
        {d ? (
          <span className="font-semibold text-foreground tabular-nums">{format(d, "MMM d, yyyy")}</span>
        ) : (
          <span className="text-muted-foreground/50">Select date</span>
        )}
      </span>
      {d && (
        <span className="shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
          style={{ background: "rgba(20,184,166,0.12)", color: "#14B8A6" }}>
          {format(d, "EEE")}
        </span>
      )}
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onClick={openPicker}
        required={required}
        aria-label="Date"
        className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
      />
    </div>
  );
}

export function TimeField({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <div className={cn(shell, className)}>
      <Clock className="w-4 h-4 shrink-0 text-primary/80" />
      <span className="flex-1 min-w-0 text-sm">
        {value ? (
          <span className="font-mono font-semibold text-foreground tabular-nums">{value}</span>
        ) : (
          <span className="text-muted-foreground/50">Set entry time</span>
        )}
      </span>
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onClick={openPicker}
        aria-label="Execution time"
        className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
      />
    </div>
  );
}
