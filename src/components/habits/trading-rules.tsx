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
          Your non-negotiables. These surface as the pre-trade checklist every time you log a trade.
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
            <ol className="mt-5 divide-y divide-border/40 border-y border-border/40">
              {rules.map((rule, idx) => (
                <li
                  key={idx}
                  className="group relative -mx-2 flex items-center gap-4 rounded-lg px-2 py-3 transition-colors hover:bg-primary/[0.05]"
                >
                  {editingIdx === idx ? (
                    <>
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
                      <span className="w-7 shrink-0 text-right text-lg font-black leading-none tabular-nums text-primary/35 transition-colors group-hover:text-primary/80">
                        {idx + 1}
                      </span>
                      <span className="min-w-0 flex-1 text-[15px] leading-snug">{rule}</span>
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
