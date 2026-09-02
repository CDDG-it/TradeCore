"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Pencil, Check, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { getProfile, upsertProfile } from "@/lib/supabase/queries";

/**
 * Trading Rules editor. These are the trader's personal, non-negotiable rules
 * that appear as the pre-trade discipline checklist when logging a trade.
 * They are persisted in `profiles.discipline_rules` (one rule per line) — the
 * same field the Journal reads — so existing rules and journal behaviour are
 * preserved. This used to be edited on the Profile page; it now lives here in
 * the discipline environment.
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

  useEffect(() => {
    getProfile()
      .then((p) => {
        if (p?.discipline_rules) {
          setRules(p.discipline_rules.split("\n").map((l) => l.trim()).filter(Boolean));
        }
      })
      .finally(() => setLoading(false));
  }, []);

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
    <div className="space-y-4 rounded-2xl border border-border/60 bg-card p-5">
      <div className="flex items-start justify-between gap-3 border-b border-border/40 pb-4">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary/80">Discipline</p>
          <h2 className="mt-1 text-base font-semibold tracking-tight">Trading Rules</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Your pre-trade checklist. These appear when logging a trade.
          </p>
        </div>
        {!loading && rules.length > 0 && (
          <span className="shrink-0 rounded-full border border-border/60 px-2 py-0.5 text-[11px] font-bold tabular-nums text-muted-foreground">
            {rules.length}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {rules.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 bg-muted/10 px-4 py-8 text-center">
              <p className="text-xs font-medium text-muted-foreground">No rules yet</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground/70">Add your first non-negotiable below.</p>
            </div>
          ) : (
            <ol className="space-y-1.5">
              {rules.map((rule, idx) => (
                <li
                  key={idx}
                  className="group relative flex items-center gap-3 overflow-hidden rounded-xl border border-border/50 bg-gradient-to-b from-muted/20 to-transparent px-3 py-2.5 transition-all hover:border-primary/30"
                >
                  {/* Accent bar on hover */}
                  <span className="absolute inset-y-0 left-0 w-0.5 bg-primary opacity-0 transition-opacity group-hover:opacity-100" />
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
                        className="flex-1 rounded-md border border-primary/40 bg-background px-2 py-1 text-sm text-foreground outline-none"
                      />
                      <button type="button" onClick={() => saveEdit(idx)} className="shrink-0 text-success transition-opacity hover:opacity-80">
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" onClick={() => setEditingIdx(null)} className="shrink-0 text-muted-foreground transition-colors hover:text-foreground">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-[11px] font-bold tabular-nums text-primary">
                        {idx + 1}
                      </span>
                      <span className="min-w-0 flex-1 text-sm leading-snug">{rule}</span>
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

          {/* Add rule — inline composer */}
          <div className="flex items-center gap-1.5 rounded-xl border border-border/60 bg-secondary/40 p-1.5 transition-colors focus-within:border-primary/40">
            <input
              value={newRule}
              onChange={(e) => setNewRule(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addRule(); } }}
              placeholder="Add a trading rule…"
              className="flex-1 bg-transparent px-2.5 py-1.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/50"
            />
            <button
              type="button"
              onClick={addRule}
              disabled={!newRule.trim()}
              className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-all disabled:opacity-40"
              style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
            >
              <Plus className="h-3.5 w-3.5" /> Add
            </button>
          </div>

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
              {saveState === "saving" ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</> : "Save rules"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
