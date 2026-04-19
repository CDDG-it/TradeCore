"use client";

import { useState, useEffect } from "react";
import { Plus, X, Save, BookMarked, Shield, AlertTriangle, Target, Zap, CheckSquare } from "lucide-react";
import { getPlaybook, savePlaybook } from "@/lib/mock/store";
import type { TraderPlaybook, TraderType } from "@/lib/types";
import { cn } from "@/lib/utils";

const TRADER_TYPES: { value: TraderType; label: string; desc: string }[] = [
  { value: "scalper",    label: "Scalper",     desc: "< 5 min holds, high frequency" },
  { value: "day_trader", label: "Day Trader",  desc: "Intraday, flat by close"       },
  { value: "swing",      label: "Swing",       desc: "Days to weeks"                 },
  { value: "position",   label: "Position",    desc: "Weeks to months"               },
  { value: "custom",     label: "Custom",      desc: "My own style"                  },
];

const ALL_SESSIONS = ["London", "New York", "Asia"];
const ALL_TIMEFRAMES = ["1m", "5m", "15m", "1H", "4H", "Daily", "Weekly"];
const ALL_MARKETS = ["futures", "commodities", "equities", "forex", "crypto"];

function TagInput({
  label,
  tags,
  onChange,
  placeholder,
}: {
  label: string;
  tags: string[];
  onChange: (t: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState("");
  function add() {
    const t = input.trim();
    if (t && !tags.includes(t)) onChange([...tags, t]);
    setInput("");
  }
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); }}}
          placeholder={placeholder ?? "Type and press Enter..."}
          className="flex-1 rounded-lg px-3 py-2 text-sm outline-none transition-colors"
          style={{ background: "oklch(0.08 0.018 278)", border: "1px solid oklch(0.26 0.025 252)", color: "oklch(0.94 0.006 280)" }}
        />
        <button
          type="button"
          onClick={add}
          className="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{ background: "oklch(0.20 0.025 252)", color: "oklch(0.65 0.04 278)" }}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-medium"
              style={{ background: "oklch(0.18 0.025 252)", color: "oklch(0.75 0.04 252)", border: "1px solid oklch(0.22 0.032 278)" }}
            >
              {t}
              <button
                type="button"
                onClick={() => onChange(tags.filter((x) => x !== t))}
                className="hover:text-destructive transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function ChecklistInput({
  label,
  items,
  onChange,
  placeholder,
}: {
  label: string;
  items: string[];
  onChange: (i: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState("");
  function add() {
    const t = input.trim();
    if (t) onChange([...items, t]);
    setInput("");
  }
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</label>
      {items.length > 0 && (
        <div className="space-y-1.5">
          {items.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 group"
              style={{ background: "oklch(0.10 0.014 252)", border: "1px solid oklch(0.18 0.030 278)" }}
            >
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{ background: "oklch(0.62 0.26 290 / 0.15)", color: "oklch(0.62 0.26 290)" }}
              >
                {i + 1}
              </span>
              <span className="flex-1 text-sm">{item}</span>
              <button
                type="button"
                onClick={() => onChange(items.filter((_, j) => j !== i))}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); }}}
          placeholder={placeholder ?? "Add step..."}
          className="flex-1 rounded-lg px-3 py-2 text-sm outline-none transition-colors"
          style={{ background: "oklch(0.08 0.018 278)", border: "1px solid oklch(0.26 0.025 252)", color: "oklch(0.94 0.006 280)" }}
        />
        <button type="button" onClick={add} className="px-3 py-2 rounded-lg text-sm font-medium transition-colors" style={{ background: "oklch(0.20 0.025 252)", color: "oklch(0.65 0.04 278)" }}>
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function MultiSelect({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (s: string[]) => void;
}) {
  function toggle(opt: string) {
    onChange(selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt]);
  }
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const active = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all"
              style={
                active
                  ? { background: "oklch(0.62 0.26 290 / 0.20)", color: "oklch(0.62 0.26 290)", border: "1px solid oklch(0.62 0.26 290 / 0.40)" }
                  : { background: "oklch(0.08 0.018 278)", color: "oklch(0.50 0.04 252)", border: "1px solid oklch(0.18 0.030 278)" }
              }
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  color,
  children,
}: {
  icon: React.ElementType;
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl p-6 space-y-5"
      style={{ background: "oklch(0.10 0.022 278)", border: "1px solid oklch(0.18 0.030 278)" }}
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color.replace(")", " / 0.15)")}` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <h2 className="text-sm font-bold">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default function PlaybookPage() {
  const [form, setForm] = useState<TraderPlaybook>(() => getPlaybook());
  const [saved, setSaved] = useState(false);

  function set<K extends keyof TraderPlaybook>(key: K, value: TraderPlaybook[K]) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  function handleSave() {
    savePlaybook(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 animate-fade-up">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Trader Playbook</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Your identity, rules, and trading system — in one place
          </p>
        </div>
        <button
          onClick={handleSave}
          className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all hover:-translate-y-px shrink-0"
          style={{
            background: saved ? "oklch(0.58 0.17 145)" : "oklch(0.62 0.26 290)",
            color: "oklch(0.07 0.022 275)",
            boxShadow: "0 4px 14px oklch(0.62 0.26 290 / 0.30)",
          }}
        >
          <Save className="w-4 h-4" />
          {saved ? "Saved!" : "Save playbook"}
        </button>
      </div>

      {/* Trader Type */}
      <Section icon={Target} title="Who are you as a trader?" color="oklch(0.78 0.16 198)">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Trader Type</label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {TRADER_TYPES.map(({ value, label, desc }) => (
              <button
                key={value}
                type="button"
                onClick={() => set("trader_type", value)}
                className={cn("p-3 rounded-xl text-left transition-all", form.trader_type === value ? "ring-2" : "")}
                style={
                  form.trader_type === value
                    ? { background: "oklch(0.78 0.16 198 / 0.15)", border: "1px solid oklch(0.78 0.16 198 / 0.50)", outline: "2px solid oklch(0.78 0.16 198 / 0.30)" }
                    : { background: "oklch(0.08 0.018 278)", border: "1px solid oklch(0.18 0.030 278)" }
                }
              >
                <p className={cn("text-xs font-bold mb-0.5", form.trader_type === value ? "text-ice" : "text-foreground")}>{label}</p>
                <p className="text-xs text-muted-foreground leading-tight">{desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Trading Style Description</label>
          <textarea
            value={form.trading_style}
            onChange={(e) => set("trading_style", e.target.value)}
            placeholder="Describe your approach in your own words — methods, philosophy, market structure..."
            rows={3}
            className="w-full rounded-lg px-3 py-2.5 text-sm outline-none resize-none leading-relaxed"
            style={{ background: "oklch(0.08 0.018 278)", border: "1px solid oklch(0.26 0.025 252)", color: "oklch(0.94 0.006 280)" }}
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <MultiSelect label="Markets" options={ALL_MARKETS} selected={form.markets} onChange={(v) => set("markets", v)} />
          <MultiSelect label="Sessions" options={ALL_SESSIONS} selected={form.preferred_sessions} onChange={(v) => set("preferred_sessions", v)} />
        </div>

        <MultiSelect label="Preferred Timeframes" options={ALL_TIMEFRAMES} selected={form.preferred_timeframes} onChange={(v) => set("preferred_timeframes", v)} />

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Max Trades / Day</label>
            <input
              type="number"
              min={1} max={20}
              value={form.max_trades_per_day}
              onChange={(e) => set("max_trades_per_day", parseInt(e.target.value) || 1)}
              className="w-full rounded-lg px-3 py-2.5 text-sm font-mono outline-none"
              style={{ background: "oklch(0.08 0.018 278)", border: "1px solid oklch(0.26 0.025 252)", color: "oklch(0.94 0.006 280)" }}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Max Daily Risk %</label>
            <input
              type="number"
              min={0.1} max={10} step={0.1}
              value={form.max_daily_risk_percent}
              onChange={(e) => set("max_daily_risk_percent", parseFloat(e.target.value) || 1)}
              className="w-full rounded-lg px-3 py-2.5 text-sm font-mono outline-none"
              style={{ background: "oklch(0.08 0.018 278)", border: "1px solid oklch(0.26 0.025 252)", color: "oklch(0.94 0.006 280)" }}
            />
          </div>
        </div>
      </Section>

      {/* Edge + Criteria */}
      <Section icon={Zap} title="Your edge and criteria" color="oklch(0.62 0.26 290)">
        <TagInput
          label="Preferred Setups"
          tags={form.preferred_setups}
          onChange={(v) => set("preferred_setups", v)}
          placeholder="e.g. Demand zone reclaim, Liquidity sweep..."
        />

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ideal Market Conditions</label>
          <textarea
            value={form.ideal_market_conditions}
            onChange={(e) => set("ideal_market_conditions", e.target.value)}
            placeholder="When do you perform at your best? What market conditions suit your style?"
            rows={3}
            className="w-full rounded-lg px-3 py-2.5 text-sm outline-none resize-none leading-relaxed"
            style={{ background: "oklch(0.08 0.018 278)", border: "1px solid oklch(0.26 0.025 252)", color: "oklch(0.94 0.006 280)" }}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">A+ Trade Criteria</label>
          <textarea
            value={form.a_plus_criteria}
            onChange={(e) => set("a_plus_criteria", e.target.value)}
            placeholder="What must be true for a trade to qualify as A+? Be specific — this is your standard."
            rows={4}
            className="w-full rounded-lg px-3 py-2.5 text-sm outline-none resize-none leading-relaxed"
            style={{ background: "oklch(0.08 0.018 278)", border: "1px solid oklch(0.26 0.025 252)", color: "oklch(0.94 0.006 280)" }}
          />
        </div>
      </Section>

      {/* Rules */}
      <Section icon={Shield} title="Non-negotiable rules" color="oklch(0.58 0.17 145)">
        <p className="text-xs text-muted-foreground -mt-2">
          Rules you never break, regardless of how good a setup looks. These protect your capital and your psychology.
        </p>
        <TagInput
          label="Rules"
          tags={form.non_negotiable_rules}
          onChange={(v) => set("non_negotiable_rules", v)}
          placeholder="e.g. Never risk more than 1% per trade..."
        />
      </Section>

      {/* Weaknesses */}
      <Section icon={AlertTriangle} title="Known weaknesses &amp; behavioral traps" color="oklch(0.58 0.22 25)">
        <p className="text-xs text-muted-foreground -mt-2">
          Patterns you know you fall into. Naming them makes them easier to catch in the moment.
        </p>
        <TagInput
          label="Weaknesses"
          tags={form.common_weaknesses}
          onChange={(v) => set("common_weaknesses", v)}
          placeholder="e.g. FOMO entries, overtrading on slow days..."
        />
      </Section>

      {/* Pre-trade routine */}
      <Section icon={CheckSquare} title="Pre-trade routine" color="oklch(0.70 0.16 72)">
        <p className="text-xs text-muted-foreground -mt-2">
          Your daily checklist before you start trading. These steps are used in the Command Center for daily accountability.
        </p>
        <ChecklistInput
          label="Routine Steps (in order)"
          items={form.pre_trade_routine}
          onChange={(v) => set("pre_trade_routine", v)}
          placeholder="e.g. Review HTF levels..."
        />
      </Section>

      {/* Save footer */}
      <div className="flex justify-end pb-4">
        <button
          onClick={handleSave}
          className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition-all hover:-translate-y-px"
          style={{
            background: saved ? "oklch(0.58 0.17 145)" : "linear-gradient(135deg, oklch(0.62 0.26 290) 0%, oklch(0.82 0.16 82) 100%)",
            color: "oklch(0.07 0.022 275)",
            boxShadow: "0 4px 20px oklch(0.62 0.26 290 / 0.35)",
          }}
        >
          <Save className="w-4 h-4" />
          {saved ? "Saved!" : "Save playbook"}
        </button>
      </div>
    </div>
  );
}
