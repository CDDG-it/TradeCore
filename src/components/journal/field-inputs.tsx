"use client";

import { useState } from "react";
import { Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

/**
 * Premium replacements for the raw <input type="date"/>, <input type="time"/>
 * and numeric controls in the trade form: on-brand, and typed rather than
 * fought with.
 *
 * The date still hands off to the native picker, but the time and the R:R are
 * plain text fields the trader can simply type into. Both used to be native
 * controls that opened a picker or a spinner on click, which made entering
 * "09:32" or "1.7" slower than writing it by hand.
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
          style={{ background: "color-mix(in oklch, var(--primary) 12%, transparent)", color: "var(--primary)" }}>
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

/* ── Time ─────────────────────────────────────────────────────────────── */

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * What the field shows mid-keystroke. A colon the trader typed is kept where
 * they put it, so "9:3" stays "9:3"; without one the separator only appears at
 * four digits, so "932" is never shown back as the nonsense "93:2".
 */
function maskTime(raw: string): string {
  if (raw.includes(":")) {
    const [h = "", m = ""] = raw.split(":");
    return `${h.replace(/\D/g, "").slice(0, 2)}:${m.replace(/\D/g, "").slice(0, 2)}`;
  }
  const d = raw.replace(/\D/g, "").slice(0, 4);
  return d.length === 4 ? `${d.slice(0, 2)}:${d.slice(2)}` : d;
}

/** True once the text reads as a whole time rather than a half-typed one. */
const COMPLETE = /^(\d{1,2}:\d{2}|\d{4})$/;

/**
 * A typed string as a real "HH:mm", or "" when there is nothing usable yet.
 * Without a colon, one or two digits are read as an hour ("9" is 09:00) and
 * three as h:mm ("930" is 09:30). Out-of-range parts are clamped rather than
 * rejected, so a stray key never silently throws the whole entry away.
 */
function parseTime(raw: string): string {
  const clamp = (h: number, m: number) => `${pad(Math.min(h, 23))}:${pad(Math.min(m, 59))}`;
  if (raw.includes(":")) {
    const [hs = "", ms = ""] = raw.split(":").map((x) => x.replace(/\D/g, ""));
    if (!hs) return "";
    return clamp(Number(hs), Number(ms || 0));
  }
  const d = raw.replace(/\D/g, "");
  if (d.length === 0) return "";
  if (d.length <= 2) return clamp(Number(d), 0);
  if (d.length === 3) return clamp(Number(d.slice(0, 1)), Number(d.slice(1)));
  return clamp(Number(d.slice(0, 2)), Number(d.slice(2)));
}

export function TimeField({
  value,
  onChange,
  placeholder = "Set entry time",
  label = "Execution time",
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  /** Shown when the field is empty. */
  placeholder?: string;
  /** Accessible name for the input and its picker. */
  label?: string;
  className?: string;
}) {
  // While the trader is typing, the field shows their half-finished keystrokes
  // ("09:"); the rest of the time it simply mirrors the stored value, so a
  // restored draft or a loaded trade needs no syncing. What leaves is always a
  // complete "HH:mm" or "".
  const [draft, setDraft] = useState<string | null>(null);
  const text = draft ?? value;

  function type(raw: string) {
    const masked = maskTime(raw);
    setDraft(masked);
    // Nothing is stored until the text reads as a whole time; a half-typed
    // "09:" would otherwise land in the trade as 09:00.
    onChange(COMPLETE.test(masked) ? parseTime(masked) : "");
  }

  function commit() {
    setDraft(null);
    onChange(parseTime(text));
  }

  return (
    <div className={cn(shell, className)}>
      <Clock className="w-4 h-4 shrink-0 text-primary/80" />
      <input
        type="text"
        inputMode="numeric"
        value={text}
        onChange={(e) => type(e.target.value)}
        onFocus={() => setDraft(value)}
        onBlur={commit}
        placeholder={placeholder}
        aria-label={label}
        maxLength={5}
        className="min-w-0 flex-1 bg-transparent font-mono text-sm font-semibold tabular-nums text-foreground outline-none placeholder:font-sans placeholder:font-normal placeholder:text-muted-foreground/50"
      />
      {/* The picker stays available for anyone who would rather tap than type. */}
      <span className="relative shrink-0">
        <Clock className="h-4 w-4 text-muted-foreground/40 transition-colors group-focus-within:text-primary/60" aria-hidden />
        <input
          type="time"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onClick={openPicker}
          tabIndex={-1}
          aria-label={`${label} picker`}
          className="absolute -inset-2 cursor-pointer opacity-0"
        />
      </span>
    </div>
  );
}

/* ── R:R ──────────────────────────────────────────────────────────────── */

/**
 * Reward-to-risk, typed freely. A number input fought back here: it snapped
 * "1." to 1 mid-keystroke, so a decimal could not be typed left to right, and
 * it started on a value the trader had to clear before entering their own.
 */
export function RRField({
  value,
  onChange,
  id,
  className,
}: {
  /** null while the field is empty, so nothing is assumed on the trader's behalf. */
  value: number | null;
  onChange: (v: number | null) => void;
  id?: string;
  className?: string;
}) {
  const stored = value == null ? "" : String(value);
  // Same as the time field: local only while it is being typed, so "1." can be
  // held on screen without the stored number snapping it back to "1".
  const [draft, setDraft] = useState<string | null>(null);
  const text = draft ?? stored;

  function type(raw: string) {
    // Digits and a single decimal separator, comma included: a European
    // keyboard puts a comma where the decimal point belongs.
    const cleaned = raw.replace(",", ".").replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1");
    setDraft(cleaned);
    const n = parseFloat(cleaned);
    onChange(Number.isFinite(n) ? n : null);
  }

  return (
    <div className={cn(shell, "px-3.5", className)}>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        value={text}
        onChange={(e) => type(e.target.value)}
        onFocus={() => setDraft(stored)}
        onBlur={() => setDraft(null)}
        placeholder="e.g. 1.8"
        aria-label="Reward to risk"
        className="min-w-0 flex-1 bg-transparent font-mono text-sm font-semibold tabular-nums text-foreground outline-none placeholder:font-sans placeholder:font-normal placeholder:text-muted-foreground/50"
      />
      <span className="shrink-0 text-sm font-bold text-primary/70">R</span>
    </div>
  );
}
