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
    <div className="space-y-4 rounded-2xl border border-border/60 bg-card p-5">
      <div className="flex items-start justify-between gap-3 border-b border-border/40 pb-4">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary/80">Setups</p>
          <h2 className="mt-1 text-base font-semibold tracking-tight">Confluences</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Your saved confluence library. These are the quick-select chips when logging a trade.
          </p>
        </div>
        {!loading && items.length > 0 && (
          <span className="shrink-0 rounded-full border border-border/60 px-2 py-0.5 text-[11px] font-bold tabular-nums text-muted-foreground">
            {items.length}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 bg-muted/10 px-4 py-8 text-center">
              <p className="text-xs font-medium text-muted-foreground">No confluences yet</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground/70">Add your own or tap a suggestion below.</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {items.map((c, idx) =>
                editingIdx === idx ? (
                  <div key={idx} className="inline-flex items-center gap-1 rounded-lg border border-primary/40 bg-background py-1 pl-2 pr-1">
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
                    className="group inline-flex items-center gap-1 rounded-lg border border-border/60 bg-gradient-to-b from-muted/30 to-muted/5 py-1.5 pl-3 pr-1.5 text-sm transition-colors hover:border-primary/30"
                  >
                    <button
                      type="button"
                      onClick={() => startEdit(idx)}
                      className="max-w-full truncate text-left transition-colors hover:text-primary"
                      title="Edit confluence"
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

          {/* Add new — inline composer */}
          <div className="flex items-center gap-1.5 rounded-xl border border-border/60 bg-secondary/40 p-1.5 transition-colors focus-within:border-primary/40">
            <input
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addNew(); } }}
              placeholder="Add a confluence…"
              className="flex-1 bg-transparent px-2.5 py-1.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/50"
            />
            <button
              type="button"
              onClick={addNew}
              disabled={!newItem.trim()}
              className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-all disabled:opacity-40"
              style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
            >
              <Plus className="h-3.5 w-3.5" /> Add
            </button>
          </div>

          {/* Preset suggestions */}
          {suggestions.length > 0 && (
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Suggestions</p>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => add(c)}
                    className="inline-flex items-center gap-1 rounded-lg border border-dashed border-border/60 bg-background/40 px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                  >
                    <Plus className="h-3 w-3" /> {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Save row */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="text-xs">
              {saveState === "saved" && (
                <span className="flex items-center gap-1.5 text-success"><CheckCircle2 className="w-3.5 h-3.5" /> Saved</span>
              )}
              {saveState === "error" && (
                <span className="flex items-center gap-1.5 text-destructive"><AlertCircle className="w-3.5 h-3.5" /> Failed to save</span>
              )}
              {saveState !== "saved" && saveState !== "error" && dirty && (
                <span className="text-muted-foreground">Unsaved changes</span>
              )}
            </div>
            <button
              type="button"
              onClick={persist}
              disabled={!dirty || saveState === "saving"}
              className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all disabled:opacity-40"
              style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
            >
              {saveState === "saving" ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</> : "Save confluences"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
