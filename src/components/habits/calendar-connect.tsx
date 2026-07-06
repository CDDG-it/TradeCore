"use client";

import { useState, useEffect, useCallback } from "react";
import { format, isToday, isTomorrow } from "date-fns";
import { CalendarPlus, RefreshCw, Loader2, Info, CalendarClock, Check, Pencil, Unlink } from "lucide-react";
import { cn } from "@/lib/utils";

const LS_KEY = "mc_ical_url";

type Ev = { summary: string; start: string; allDay: boolean };

/**
 * Connect your own Google or Apple calendar by pasting its iCal (.ics) address.
 * The feed is fetched server-side (see /api/ical) and the next two weeks of
 * events are shown alongside your habits. The URL is stored locally.
 *
 * The connect/disconnect flow is deliberately safe: changing the address is an
 * explicit edit-then-save action, and disconnecting requires a confirmation so
 * a stray click can't wipe a configured calendar.
 */
export function CalendarConnect() {
  const [url, setUrl] = useState<string>("");
  const [input, setInput] = useState("");
  const [events, setEvents] = useState<Ev[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const load = useCallback(async (u: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/ical?url=${encodeURIComponent(u)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not load calendar.");
        setEvents([]);
      } else {
        setEvents(data.events || []);
      }
    } catch {
      setError("Could not load calendar.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(LS_KEY) : null;
    if (saved) {
      setUrl(saved);
      load(saved);
    }
  }, [load]);

  function save() {
    const u = input.trim();
    if (!u) return;
    localStorage.setItem(LS_KEY, u);
    setUrl(u);
    setInput("");
    setEditing(false);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2500);
    load(u);
  }

  function disconnect() {
    localStorage.removeItem(LS_KEY);
    setUrl("");
    setEvents([]);
    setError(null);
    setConfirmDisconnect(false);
  }

  function startEdit() {
    setInput(url);
    setEditing(true);
    setConfirmDisconnect(false);
  }

  function hostOf(u: string) {
    try { return new URL(u.replace(/^webcal:\/\//i, "https://")).hostname; } catch { return u; }
  }

  function dayLabel(d: Date) {
    if (isToday(d)) return "Today";
    if (isTomorrow(d)) return "Tomorrow";
    return format(d, "EEE MMM d");
  }

  const showForm = !url || editing;

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <CalendarClock className="w-4 h-4 text-primary" />
          Calendar
        </h2>
        {url && !editing ? (
          <div className="flex items-center gap-1">
            <button onClick={() => load(url)} title="Refresh"
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors">
              <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            </button>
            <button onClick={startEdit} title="Change address"
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors">
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button onClick={() => setShowHelp((v) => !v)} title="How to connect"
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-colors">
            <Info className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Connected status */}
      {url && !editing && (
        <div className="flex items-center justify-between gap-2 rounded-lg px-3 py-2" style={{ background: "var(--secondary)" }}>
          <span className="flex items-center gap-2 min-w-0 text-xs">
            <Check className="w-3.5 h-3.5 text-success shrink-0" />
            <span className="text-muted-foreground shrink-0">Connected ·</span>
            <span className="truncate font-medium">{hostOf(url)}</span>
          </span>
          {confirmDisconnect ? (
            <span className="flex items-center gap-1.5 shrink-0">
              <button onClick={disconnect}
                className="text-xs px-2 py-0.5 rounded-md font-medium transition-colors"
                style={{ background: "oklch(0.58 0.22 25 / 0.15)", color: "oklch(0.58 0.22 25)" }}>
                Disconnect
              </button>
              <button onClick={() => setConfirmDisconnect(false)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Cancel
              </button>
            </span>
          ) : (
            <button onClick={() => setConfirmDisconnect(true)} title="Disconnect calendar"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors shrink-0">
              <Unlink className="w-3.5 h-3.5" /> Disconnect
            </button>
          )}
        </div>
      )}

      {justSaved && (
        <p className="flex items-center gap-1.5 text-xs text-success">
          <Check className="w-3.5 h-3.5" /> Calendar address saved.
        </p>
      )}

      {showForm && (
        <>
          {!url && (
            <p className="text-xs text-muted-foreground leading-relaxed">
              Add your Google or Apple calendar to see your events next to your habits.
            </p>
          )}
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && save()}
              placeholder="Paste your iCal (.ics) address"
              className="flex-1 rounded-lg px-3 py-2 text-xs outline-none"
              style={{ background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--foreground)" }}
            />
            <button onClick={save} disabled={!input.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold shrink-0 transition-all disabled:opacity-40"
              style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
              <CalendarPlus className="w-3.5 h-3.5" /> {url ? "Save" : "Add"}
            </button>
            {editing && (
              <button onClick={() => { setEditing(false); setInput(""); }}
                className="text-xs px-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors shrink-0">
                Cancel
              </button>
            )}
          </div>
          {showHelp && (
            <div className="rounded-lg p-3 text-[11px] leading-relaxed text-muted-foreground space-y-2" style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
              <p><span className="font-semibold text-foreground">Google Calendar:</span> Settings → your calendar → Integrate calendar → copy the &quot;Secret address in iCal format&quot;.</p>
              <p><span className="font-semibold text-foreground">Apple / iCloud:</span> On iCloud.com open Calendar → share a calendar → make it Public → copy the link (paste it here, we convert webcal:// automatically).</p>
              <p>The address is private, so only paste your own. It stays in this browser.</p>
            </div>
          )}
        </>
      )}

      {url && !editing && (
        <div className="space-y-2">
          {loading && events.length === 0 ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading events…
            </div>
          ) : error ? (
            <p className="text-xs text-destructive">{error}</p>
          ) : events.length === 0 ? (
            <p className="text-xs text-muted-foreground py-1">No events in the next two weeks.</p>
          ) : (
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {events.map((e, i) => {
                const d = new Date(e.start);
                return (
                  <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-2" style={{ background: "var(--secondary)" }}>
                    <div className="w-14 shrink-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-primary leading-none">{dayLabel(d)}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-none">{e.allDay ? "All day" : format(d, "HH:mm")}</p>
                    </div>
                    <p className="flex-1 text-xs truncate">{e.summary}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
