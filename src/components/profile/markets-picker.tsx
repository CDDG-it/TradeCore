"use client";

import { useMemo, useState } from "react";
import { Check, Plus, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  ASSET_CLASSES, findInstrument, normalizeSymbol, searchInstruments, type AssetClass,
} from "@/lib/instruments";
import { cn } from "@/lib/utils";

type Mode = "one" | "several";

/**
 * "Markets you trade": the instruments the trade and analysis forms offer.
 * One market for a trader who only trades, say, NQ (it is then filled in on
 * every new trade); several for a basket of pairs or contracts.
 */
export function MarketsPicker({ value, onChange }: { value: string[]; onChange: (next: string[]) => void }) {
  const [mode, setMode] = useState<Mode>(value.length > 1 ? "several" : "one");
  const [tab, setTab] = useState<AssetClass>(() => findInstrument(value[0] ?? "")?.assetClass ?? "futures");
  const [query, setQuery] = useState("");

  const searching = query.trim().length > 0;
  const options = useMemo(
    () => (searching ? searchInstruments(query) : searchInstruments("", tab)),
    [searching, query, tab]
  );
  const typed = normalizeSymbol(query);
  const canAddCustom = typed.length >= 2 && !options.some((o) => o.symbol === typed) && !value.includes(typed);

  function switchMode(next: Mode) {
    setMode(next);
    // Going to one market keeps the first choice rather than wiping the list.
    if (next === "one" && value.length > 1) onChange(value.slice(0, 1));
  }

  function toggle(symbol: string) {
    const s = normalizeSymbol(symbol);
    if (mode === "one") onChange(value[0] === s ? [] : [s]);
    else onChange(value.includes(s) ? value.filter((v) => v !== s) : [...value, s]);
  }

  function addCustom() {
    if (!typed) return;
    onChange(mode === "one" ? [typed] : [...value, typed]);
    setQuery("");
  }

  return (
    <div className="space-y-4">
      {/* Mode */}
      <div className="grid grid-cols-2 gap-2">
        {([
          { id: "one", title: "One market", sub: "Filled in on every new trade" },
          { id: "several", title: "Several markets", sub: "Pick from your list when logging" },
        ] as const).map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => switchMode(m.id)}
            aria-pressed={mode === m.id}
            className={cn(
              "rounded-xl border px-3 py-2.5 text-left transition-colors",
              mode === m.id ? "border-primary/60 bg-primary/10" : "border-border/50 hover:bg-muted/40"
            )}
          >
            <span className="block text-sm font-semibold">{m.title}</span>
            <span className="block text-[11px] text-muted-foreground">{m.sub}</span>
          </button>
        ))}
      </div>

      {/* Current selection */}
      <div className="min-h-9 rounded-xl border border-border/50 bg-background/40 p-2">
        {value.length === 0 ? (
          <p className="px-1 py-1 text-xs text-muted-foreground">
            Nothing selected yet. Until you choose, the forms offer a default mix of futures, forex and CFDs.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {value.map((s) => (
              <span key={s} className="inline-flex items-center gap-1.5 rounded-lg bg-primary/15 py-1 pl-2.5 pr-1 text-xs">
                <span className="font-mono font-semibold">{s}</span>
                <span className="text-muted-foreground">{findInstrument(s)?.name ?? "Custom"}</span>
                <button
                  type="button"
                  aria-label={`Remove ${s}`}
                  onClick={() => onChange(value.filter((v) => v !== s))}
                  className="rounded p-0.5 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Catalogue */}
      <div className="space-y-2.5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className={cn("flex gap-1 overflow-x-auto", searching && "opacity-40")}>
            {ASSET_CLASSES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => { setTab(c.id); setQuery(""); }}
                className={cn(
                  "shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  tab === c.id && !searching ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div className="relative sm:ml-auto sm:w-56">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (options[0]) toggle(options[0].symbol);
                  else if (canAddCustom) addCustom();
                }
              }}
              placeholder="Search symbol or market"
              className="h-8 pl-8 text-sm bg-background/50"
            />
          </div>
        </div>

        <div className="grid max-h-64 grid-cols-2 gap-1.5 overflow-y-auto sm:grid-cols-3 lg:grid-cols-4">
          {options.map((o) => {
            const on = value.includes(o.symbol);
            return (
              <button
                key={o.symbol}
                type="button"
                onClick={() => toggle(o.symbol)}
                aria-pressed={on}
                className={cn(
                  "flex items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-left transition-colors",
                  on ? "border-primary/60 bg-primary/10" : "border-border/40 hover:border-border hover:bg-muted/30"
                )}
              >
                <span className="min-w-0">
                  <span className="block font-mono text-xs font-semibold">{o.symbol}</span>
                  <span className="block truncate text-[10px] text-muted-foreground">{o.name}</span>
                </span>
                {on && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
              </button>
            );
          })}
          {canAddCustom && (
            <button
              type="button"
              onClick={addCustom}
              className="flex items-center gap-1.5 rounded-lg border border-dashed border-primary/50 px-2.5 py-1.5 text-left text-xs text-primary hover:bg-primary/10"
            >
              <Plus className="h-3.5 w-3.5" /> Add “{typed}”
            </button>
          )}
          {options.length === 0 && !canAddCustom && (
            <p className="col-span-full py-3 text-center text-xs text-muted-foreground">No match.</p>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground">
          Not listed? Type the symbol your broker or prop firm uses and add it.
        </p>
      </div>
    </div>
  );
}
