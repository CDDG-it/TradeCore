"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Pencil, Check, X, CheckCircle2, AlertCircle, Loader2, Layers } from "lucide-react";
import { getProfile, upsertProfile } from "@/lib/supabase/queries";
import { DEFAULT_CONFLUENCES } from "@/lib/journal/confluences";
import { ConfluenceInfo } from "@/components/journal/confluence-info";

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
    <div className="rounded-xl p-5 space-y-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="flex items-center gap-2">
        <Layers className="w-4 h-4 text-primary" />
        <div>
          <h2 className="text-sm font-semibold">Confluences</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Your saved confluence library. These are the quick-select chips when logging a trade.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {items.length === 0 && (
            <p className="text-xs text-muted-foreground py-1">
              No confluences yet. Add your own or pick from the suggestions below.
            </p>
          )}

          <div className="space-y-1.5">
            {items.map((c, idx) => (
              <div key={idx} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/40 group">
                {editingIdx === idx ? (
                  <>
                    <input
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit(idx);
                        if (e.key === "Escape") setEditingIdx(null);
                      }}
                      autoFocus
                      className="flex-1 rounded-md px-2 py-1 text-sm outline-none"
                      style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                    />
                    <button type="button" onClick={() => saveEdit(idx)} className="text-success hover:opacity-80 shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" onClick={() => setEditingIdx(null)} className="text-muted-foreground hover:text-foreground shrink-0">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-sm flex-1 min-w-0">{c}</span>
                    <ConfluenceInfo label={c} />
                    <button
                      type="button"
                      onClick={() => startEdit(idx)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-all shrink-0"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(idx)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Add new */}
          <div className="flex gap-2">
            <input
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addNew(); } }}
              placeholder="Add a confluence…"
              className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
              style={{ background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--foreground)" }}
            />
            <button
              type="button"
              onClick={addNew}
              disabled={!newItem.trim()}
              className="inline-flex items-center justify-center rounded-lg px-3 shrink-0 transition-all disabled:opacity-40"
              style={{ background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--foreground)" }}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Preset suggestions */}
          {suggestions.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Suggestions</p>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((c) => (
                  <div
                    key={c}
                    className="inline-flex items-center gap-1 text-xs rounded-lg border transition-colors bg-background/50 text-muted-foreground border-border/50 hover:text-foreground hover:border-border"
                  >
                    <button
                      type="button"
                      onClick={() => add(c)}
                      className="inline-flex items-center gap-1 pl-2.5 py-1"
                    >
                      <Plus className="w-3 h-3" /> {c}
                    </button>
                    <span className="pr-2 flex items-center">
                      <ConfluenceInfo label={c} />
                    </span>
                  </div>
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
