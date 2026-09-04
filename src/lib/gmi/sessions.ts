/**
 * Trading-session clock — objective exchange hours, nothing more.
 *
 * The three sessions the journal already speaks in (Asia, London, New York),
 * expressed in each venue's own local time and resolved through the IANA
 * database, so daylight saving is handled by the platform rather than guessed.
 * Cash-session hours only; weekends are closed.
 */
export interface SessionWindow {
  key: "asia" | "london" | "newYork";
  /** Matches the journal's Session labels. */
  label: string;
  timeZone: string;
  /** Local open/close in minutes from midnight. */
  openMin: number;
  closeMin: number;
  hours: string;
}

export const SESSIONS: SessionWindow[] = [
  { key: "asia", label: "Asia", timeZone: "Asia/Tokyo", openMin: 9 * 60, closeMin: 15 * 60, hours: "09:00–15:00 JST" },
  { key: "london", label: "London", timeZone: "Europe/London", openMin: 8 * 60, closeMin: 16 * 60 + 30, hours: "08:00–16:30 UK" },
  { key: "newYork", label: "New York", timeZone: "America/New_York", openMin: 9 * 60 + 30, closeMin: 16 * 60, hours: "09:30–16:00 ET" },
];

export interface SessionState {
  window: SessionWindow;
  /** Local wall-clock time at the venue, "HH:mm". */
  localTime: string;
  weekend: boolean;
  open: boolean;
  /** 0–1 through the session; 0 before the open, 1 after the close. */
  progress: number;
  /** Minutes to the close when open, or to the next open when closed. */
  minutesToEdge: number;
  /** Venue-local weekday of the next open, e.g. "Mon" — null when it is today. */
  nextOpenDay: string | null;
}

/** Venue-local parts of an instant, via the IANA database (DST-correct). */
function localParts(at: Date, timeZone: string): { minutes: number; weekday: string; time: string } {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone, hour: "2-digit", minute: "2-digit", weekday: "short", hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(at).map((p) => [p.type, p.value]));
  const hour = Number(parts.hour ?? 0);
  const minute = Number(parts.minute ?? 0);
  return {
    minutes: hour * 60 + minute,
    weekday: String(parts.weekday ?? ""),
    time: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
  };
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function sessionState(w: SessionWindow, at: Date = new Date()): SessionState {
  const { minutes, weekday, time } = localParts(at, w.timeZone);
  const dayIdx = Math.max(0, WEEKDAYS.indexOf(weekday));
  const weekend = weekday === "Sat" || weekday === "Sun";
  const open = !weekend && minutes >= w.openMin && minutes < w.closeMin;
  const span = w.closeMin - w.openMin;
  const progress = weekend ? 0 : Math.min(1, Math.max(0, (minutes - w.openMin) / span));

  if (open) {
    return { window: w, localTime: time, weekend, open, progress, minutesToEdge: w.closeMin - minutes, nextOpenDay: null };
  }

  // Walk forward to the next weekday that actually has a session — a Friday
  // evening in London opens again on Monday, not tomorrow.
  let offset = minutes < w.openMin ? 0 : 1;
  while (true) {
    const d = WEEKDAYS[(dayIdx + offset) % 7];
    if (d !== "Sat" && d !== "Sun") break;
    offset++;
  }
  return {
    window: w,
    localTime: time,
    weekend,
    open,
    progress,
    minutesToEdge: offset * 24 * 60 + w.openMin - minutes,
    nextOpenDay: offset === 0 ? null : WEEKDAYS[(dayIdx + offset) % 7],
  };
}

/** "3h 20m", "45m" — for the countdown to the next open/close. */
export function fmtDuration(mins: number | null): string {
  if (mins == null || !Number.isFinite(mins)) return "—";
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
