"use client";

import { useState, useEffect } from "react";
import { Plus, Check, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { getProfile, upsertProfile } from "@/lib/supabase/queries";
import { DEFAULT_CONFLUENCES } from "@/lib/journal/confluences";

/**
 * Confluences editor. This is the trader's saved confluence library — the
 * exact list that shows up as quick-select chips when logging a trade. Only
 * confluences created and saved here appear in the Journal (the trader can
 * still type a one-off directly on a trade, but the reusable library is this).
 *
 * Persisted in `profiles.confluence_options` (one per line), the same field the
 * Journal reads, so existing saved confluences are preserved.
 */
export function ConfluencesEditor() {
  const [items, setItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState("");
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    getProfile()
      .then((p) => {
        if (p?.confluence_options) {
          setItems(p.confluence_options.split("\n").map((l) => l.trim()).filter(Boolean));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const lower = new Set(items.map((c) => c.toLowerCase()));
  const suggestions = DEFAULT_CONFLUENCES.filter((c) => !lower.has(c.toLowerCase()));

  function mutate(next: string[]) {
    setItems(next);
    setDirty(true);
    setSaveState("idle");
  }

  function add(value: string) {
    const t = value.trim();
    if (!t || lower.has(t.toLowerCase())) return;
    mutate([...items, t]);
  }

  function addNew() {
    add(newItem);
    setNewItem("");
  }

  function remove(idx: number) {
    mutate(items.filter((_, i) => i !== idx));
  }

  function startEdit(idx: number) {
    setEditingIdx(idx);
    setEditText(items[idx]);
  }

  function saveEdit(idx: number) {
    const t = editText.trim();
    if (!t) { setEditingIdx(null); return; }
    mutate(items.map((c, i) => (i === idx ? t : c)));
    setEditingIdx(null);
  }

  async function persist() {
    setSaveState("saving");
    try {
      await upsertProfile({ confluence_options: items.join("\n") });
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
        background: "linear-gradient(160deg, color-mix(in oklch, var(--card) 96%, #06B6D4 4%), var(--card) 55%)",
        boxShadow: "0 1px 0 rgba(255,255,255,0.04) inset, 0 12px 32px -18px rgba(0,0,0,0.8)",
      }}
    >
      {/* Accent spine */}
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1"
        style={{ background: "linear-gradient(180deg, #06B6D4, rgba(6,182,212,0.12))" }}
      />
      {/* Oversized ghost count */}
      {!loading && items.length > 0 && (
        <span
          aria-hidden
          className="pointer-events-none absolute -top-5 right-3 select-none text-[92px] font-black leading-none tracking-tighter"
          style={{ color: "rgba(6,182,212,0.07)" }}
        >
          {items.length}
        </span>
      )}

      <div className="relative">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: "rgba(6,182,212,0.75)" }}>Setups</p>
        <h2 className="mt-1.5 font-heading text-xl font-bold tracking-tight">Confluences</h2>
        <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-muted-foreground">
          Your reusable setup library. These become the quick-select chips when logging a trade.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {items.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-border/60 px-4 py-10 text-center">
              <p className="text-sm font-medium text-muted-foreground">No confluences yet</p>
              <p className="mt-1 text-xs text-muted-foreground/70">Add your own or pick from the suggestions below.</p>
            </div>
          ) : (
            <div className="mt-5 flex flex-wrap gap-2 border-y border-border/40 py-4">
              {items.map((c, idx) =>
                editingIdx === idx ? (
                  <div
                    key={idx}
                    className="inline-flex items-center gap-1 rounded-lg border bg-background py-1.5 pl-2.5 pr-1.5"
                    style={{ borderColor: "rgba(6,182,212,0.5)" }}
                  >
                    <input
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit(idx);
                        if (e.key === "Escape") setEditingIdx(null);
                      }}
                      autoFocus
                      size={Math.max(editText.length, 6)}
                      className="bg-transparent px-1 text-sm text-foreground outline-none"
                    />
                    <button type="button" onClick={() => saveEdit(idx)} aria-label="Save" className="flex h-6 w-6 items-center justify-center rounded text-success transition-opacity hover:opacity-80">
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" onClick={() => setEditingIdx(null)} aria-label="Cancel" className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors hover:text-foreground">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <span
                    key={idx}
                    className="group inline-flex items-center gap-1.5 rounded-lg border border-border/60 py-2 pl-3.5 pr-2 text-sm transition-all hover:-translate-y-px"
                    style={{ background: "linear-gradient(180deg, rgba(6,182,212,0.10), rgba(6,182,212,0.03))" }}
                  >
                    <button
                      type="button"
                      onClick={() => startEdit(idx)}
                      title="Edit confluence"
                      className="max-w-full truncate text-left font-medium transition-colors group-hover:text-foreground"
                    >
                      {c}
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(idx)}
                      aria-label={`Remove ${c}`}
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground/50 transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                )
              )}
            </div>
          )}

          {/* Composer */}
          <div
            className="mt-4 flex items-center gap-2 rounded-xl border border-border/60 bg-background/40 p-2 transition-all focus-within:ring-2"
            style={{ ["--tw-ring-color" as string]: "rgba(6,182,212,0.12)" }}
          >
            <input
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addNew(); } }}
              placeholder="Add a confluence…"
              className="min-w-0 flex-1 bg-transparent px-2.5 py-1.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/50"
            />
            <button
              type="button"
              onClick={addNew}
              disabled={!newItem.trim()}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-4 text-xs font-bold text-white transition-all hover:-translate-y-px disabled:opacity-40 disabled:hover:translate-y-0"
              style={{ background: "#06B6D4" }}
            >
              <Plus className="h-3.5 w-3.5" /> Add
            </button>
          </div>

          {/* Preset suggestions */}
          {suggestions.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">Suggestions</p>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => add(c)}
                    className="inline-flex items-center gap-1 rounded-lg border border-dashed border-border/60 bg-background/30 px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-border hover:text-foreground"
                  >
                    <Plus className="h-3 w-3" /> {c}
                  </button>
                ))}
              </div>
            </div>
          )}

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
              className="inline-flex items-center gap-1.5 rounded-lg px-5 py-2 text-sm font-semibold text-white transition-all hover:-translate-y-px disabled:opacity-40 disabled:hover:translate-y-0"
              style={{ background: "#06B6D4" }}
            >
              {saveState === "saving" ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</> : "Save confluences"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
