"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Pencil, Check, X, CheckCircle2, AlertCircle, Loader2, GripVertical } from "lucide-react";
import { getProfile, upsertProfile } from "@/lib/supabase/queries";
import { cn } from "@/lib/utils";

/** Move an item to another index, without mutating the original array. */
function moveItem<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/**
 * Trading Rules editor. These are the trader's personal, non-negotiable rules
 * that appear as the pre-trade discipline checklist when logging a trade.
 * They are persisted in `profiles.discipline_rules` (one rule per line) — the
 * same field the Journal reads — so existing rules and journal behaviour are
 * preserved. This used to be edited on the Profile page; it now lives here in
 * the discipline environment.
 *
 * The order is the order: the list can be dragged into the sequence you want to
 * be reminded of them in, and that is exactly the order the pre-trade checklist
 * shows. Dragging runs on pointer events rather than HTML5 drag-and-drop, so it
 * works the same with a mouse, a pen and a finger; the grip also takes arrow
 * keys for anyone not dragging at all.
 */
export function TradingRulesEditor() {
  const [rules, setRules] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRule, setNewRule] = useState("");
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  // Tracks whether the in-memory rules diverge from what's stored, so we can
  // show a clear "unsaved changes" state and avoid silently losing edits.
  const [dirty, setDirty] = useState(false);
  // Index currently being dragged, and the order it started from — so a drag
  // that ends where it began does not mark the list unsaved.
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const dragStart = useRef<string[] | null>(null);
  const listRef = useRef<HTMLOListElement>(null);
  // Which grip to put focus back on after a keyboard move, applied once React
  // has actually committed the new order.
  const focusAfterMove = useRef<number | null>(null);

  useEffect(() => {
    getProfile()
      .then((p) => {
        if (p?.discipline_rules) {
          setRules(p.discipline_rules.split("\n").map((l) => l.trim()).filter(Boolean));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  // Focus follows the rule you moved, so repeated arrow presses keep moving the
  // same one instead of walking down the list.
  useEffect(() => {
    const i = focusAfterMove.current;
    if (i == null) return;
    focusAfterMove.current = null;
    listRef.current?.querySelector<HTMLButtonElement>(`li[data-idx="${i}"] button[data-grip]`)?.focus();
  }, [rules]);

  function mutate(next: string[]) {
    setRules(next);
    setDirty(true);
    setSaveState("idle");
  }

  function addRule() {
    const t = newRule.trim();
    if (!t) return;
    mutate([...rules, t]);
    setNewRule("");
  }

  function removeRule(idx: number) {
    mutate(rules.filter((_, i) => i !== idx));
  }

  function startEdit(idx: number) {
    setEditingIdx(idx);
    setEditText(rules[idx]);
  }

  function saveEdit(idx: number) {
    const t = editText.trim();
    if (!t) { setEditingIdx(null); return; }
    mutate(rules.map((r, i) => (i === idx ? t : r)));
    setEditingIdx(null);
  }

  /** Pick a rule up. Pointer capture keeps the moves coming even if the cursor
   *  outruns the row. */
  function startDrag(idx: number, e: React.PointerEvent<HTMLButtonElement>) {
    if (editingIdx !== null) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStart.current = rules;
    setDragIdx(idx);
  }

  /** Rows reorder as you pass them, so the list you see is the list you get. */
  function onDragMove(e: React.PointerEvent) {
    if (dragIdx === null || !listRef.current) return;
    const rows = Array.from(listRef.current.querySelectorAll<HTMLLIElement>("li[data-idx]"));
    const over = rows.find((row) => {
      const r = row.getBoundingClientRect();
      return e.clientY >= r.top && e.clientY <= r.bottom;
    });
    if (!over) return;
    const to = Number(over.dataset.idx);
    if (Number.isNaN(to) || to === dragIdx) return;
    setRules((prev) => moveItem(prev, dragIdx, to));
    setDragIdx(to);
  }

  function endDrag() {
    if (dragIdx === null) return;
    const before = dragStart.current;
    setDragIdx(null);
    dragStart.current = null;
    if (before && before.join("\n") !== rules.join("\n")) {
      setDirty(true);
      setSaveState("idle");
    }
  }

  /** Arrow keys on the grip move a rule too — dragging is not the only way. */
  function nudge(idx: number, delta: number) {
    const to = idx + delta;
    if (to < 0 || to >= rules.length) return;
    focusAfterMove.current = to;
    mutate(moveItem(rules, idx, to));
  }

  async function persist() {
    setSaveState("saving");
    try {
      await upsertProfile({ discipline_rules: rules.join("\n") });
      setSaveState("saved");
      setDirty(false);
      setTimeout(() => setSaveState((s) => (s === "saved" ? "idle" : s)), 2500);
    } catch {
      setSaveState("error");
    }
  }


  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-border/60 p-6 pl-7"
      style={{
        background: "linear-gradient(160deg, color-mix(in oklch, var(--card) 96%, #14B8A6 4%), var(--card) 55%)",
        boxShadow: "0 1px 0 rgba(255,255,255,0.04) inset, 0 12px 32px -18px rgba(0,0,0,0.8)",
      }}
    >
      {/* Accent spine */}
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1"
        style={{ background: "linear-gradient(180deg, #14B8A6, rgba(20,184,166,0.12))" }}
      />
      {/* Oversized ghost count */}
      {!loading && rules.length > 0 && (
        <span
          aria-hidden
          className="pointer-events-none absolute -top-5 right-3 select-none text-[92px] font-black leading-none tracking-tighter text-primary/[0.07]"
        >
          {rules.length}
        </span>
      )}

      <div className="relative">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/70">Discipline</p>
        <h2 className="mt-1.5 font-heading text-xl font-bold tracking-tight">Trading Rules</h2>
        <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-muted-foreground">
          Your non-negotiables. These surface as the pre-trade checklist every time you log a trade — drag them into
          the order you want to read them in.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {rules.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-border/60 px-4 py-10 text-center">
              <p className="text-sm font-medium text-muted-foreground">No rules yet</p>
              <p className="mt-1 text-xs text-muted-foreground/70">Write your first non-negotiable below.</p>
            </div>
          ) : (
            <ol
              ref={listRef}
              onPointerMove={onDragMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              className="mt-5 divide-y divide-border/40 border-y border-border/40"
            >
              {rules.map((rule, idx) => (
                <li
                  // Keyed by position, not by text: a live reorder swaps the
                  // content of stable rows, so the row you are holding — and
                  // its pointer capture — survives the move.
                  key={idx}
                  data-idx={idx}
                  className={cn(
                    "group relative -mx-2 flex select-none items-center gap-2.5 rounded-lg px-2 py-3 transition-colors",
                    dragIdx === idx
                      ? "z-10 bg-primary/[0.09] shadow-[0_8px_24px_-14px_rgba(0,0,0,0.8)] ring-1 ring-primary/30"
                      : "hover:bg-primary/[0.05]"
                  )}
                >
                  {editingIdx === idx ? (
                    <>
                      <span aria-hidden className="w-4 shrink-0" />
                      <span className="w-7 shrink-0 text-right text-lg font-black leading-none tabular-nums text-primary/40">
                        {idx + 1}
                      </span>
                      <input
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit(idx);
                          if (e.key === "Escape") setEditingIdx(null);
                        }}
                        autoFocus
                        className="min-w-0 flex-1 rounded-md border border-primary/40 bg-background px-2.5 py-1.5 text-[15px] text-foreground outline-none"
                      />
                      <button type="button" onClick={() => saveEdit(idx)} aria-label="Save" className="shrink-0 text-success transition-opacity hover:opacity-80">
                        <Check className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => setEditingIdx(null)} aria-label="Cancel" className="shrink-0 text-muted-foreground transition-colors hover:text-foreground">
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      {/* Grab here to reorder — or focus it and use the arrows. */}
                      <button
                        type="button"
                        data-grip
                        aria-label={`Reorder rule ${idx + 1}: ${rule}`}
                        onPointerDown={(e) => startDrag(idx, e)}
                        onKeyDown={(e) => {
                          if (e.key === "ArrowUp") { e.preventDefault(); nudge(idx, -1); }
                          if (e.key === "ArrowDown") { e.preventDefault(); nudge(idx, 1); }
                        }}
                        className={cn(
                          "-ml-1 flex h-7 w-4 shrink-0 cursor-grab touch-none items-center justify-center rounded text-muted-foreground/50 transition-opacity",
                          "hover:text-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50",
                          dragIdx === idx ? "cursor-grabbing text-primary opacity-100" : "opacity-0 group-hover:opacity-100"
                        )}
                      >
                        <GripVertical className="h-4 w-4" />
                      </button>
                      <span className="w-7 shrink-0 text-right text-lg font-black leading-none tabular-nums text-primary/35 transition-colors group-hover:text-primary/80">
                        {idx + 1}
                      </span>
                      <span className="min-w-0 flex-1 select-none text-[15px] leading-snug">{rule}</span>
                      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => startEdit(idx)}
                          aria-label="Edit rule"
                          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeRule(idx)}
                          aria-label="Delete rule"
                          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ol>
          )}

          {/* Composer */}
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-border/60 bg-background/40 p-2 transition-all focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10">
            <input
              value={newRule}
              onChange={(e) => setNewRule(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addRule(); } }}
              placeholder="Add a trading rule…"
              className="min-w-0 flex-1 bg-transparent px-2.5 py-1.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/50"
            />
            <button
              type="button"
              onClick={addRule}
              disabled={!newRule.trim()}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-4 text-xs font-bold transition-all hover:-translate-y-px disabled:opacity-40 disabled:hover:translate-y-0"
              style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
            >
              <Plus className="h-3.5 w-3.5" /> Add
            </button>
          </div>

          {/* Save row */}
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/40 pt-4">
            <div className="text-xs">
              {saveState === "saved" && (
                <span className="flex items-center gap-1.5 text-success"><CheckCircle2 className="h-3.5 w-3.5" /> Saved</span>
              )}
              {saveState === "error" && (
                <span className="flex items-center gap-1.5 text-destructive"><AlertCircle className="h-3.5 w-3.5" /> Failed to save</span>
              )}
              {saveState !== "saved" && saveState !== "error" && dirty && (
                <span className="text-muted-foreground">Unsaved changes</span>
              )}
            </div>
            <button
              type="button"
              onClick={persist}
              disabled={!dirty || saveState === "saving"}
              className="inline-flex items-center gap-1.5 rounded-lg px-5 py-2 text-sm font-semibold transition-all hover:-translate-y-px disabled:opacity-40 disabled:hover:translate-y-0"
              style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
            >
              {saveState === "saving" ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</> : "Save rules"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
