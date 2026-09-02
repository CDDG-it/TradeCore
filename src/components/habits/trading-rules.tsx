"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Pencil, Check, X, CheckCircle2, AlertCircle, Loader2, ScrollText } from "lucide-react";
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
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/10">
          <ScrollText className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold">Trading Rules</h2>
            {!loading && rules.length > 0 && (
              <span className="rounded-full bg-muted/60 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-muted-foreground">
                {rules.length}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Your pre-trade checklist. These appear when logging a trade.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {rules.length === 0 && (
            <p className="text-xs text-muted-foreground py-1">
              No rules yet. Add your first trading rule below.
            </p>
          )}

          <div className="space-y-1.5">
            {rules.map((rule, idx) => (
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
                    <span className="text-xs font-mono text-muted-foreground/60 shrink-0 w-5 text-right">{idx + 1}.</span>
                    <span className="text-sm flex-1 min-w-0">{rule}</span>
                    <button
                      type="button"
                      onClick={() => startEdit(idx)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-all shrink-0"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeRule(idx)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Add rule */}
          <div className="flex gap-2">
            <input
              value={newRule}
              onChange={(e) => setNewRule(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addRule(); } }}
              placeholder="Add a trading rule…"
              className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
              style={{ background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--foreground)" }}
            />
            <button
              type="button"
              onClick={addRule}
              disabled={!newRule.trim()}
              className="inline-flex items-center justify-center rounded-lg px-3 shrink-0 transition-all disabled:opacity-40"
              style={{ background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--foreground)" }}
            >
              <Plus className="w-4 h-4" />
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
