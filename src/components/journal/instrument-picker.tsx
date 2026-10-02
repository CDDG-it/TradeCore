"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DEFAULT_PICKS, findInstrument, normalizeSymbol, searchInstruments,
} from "@/lib/instruments";
import { cn } from "@/lib/utils";

/**
 * Instrument choice for the trade and analysis forms.
 *
 * Offers the markets the trader set on their profile (or a sensible default
 * set when they have not), plus "Other" to search the whole catalogue or type
 * any symbol. A trader with exactly one market gets it filled in for them.
 * The current value is always shown, even when it is no longer in the list,
 * so editing an older entry never silently drops its instrument.
 */
export function InstrumentPicker({
  value,
  onChange,
  preferred,
  autoFill = true,
}: {
  value: string;
  onChange: (symbol: string) => void;
  /** The trader's markets from their profile; empty when not set. */
  preferred: string[];
  /** Fill in a single-market trader's market. Off on edit forms, where the entry already has one. */
  autoFill?: boolean;
}) {
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");

  // One market: there is nothing to choose, so choose it.
  const single = autoFill && preferred.length === 1 ? preferred[0] : null;
  useEffect(() => {
    if (single && !value) onChange(single);
  }, [single, value, onChange]);

  const options = useMemo(() => {
    const base = preferred.length ? preferred : DEFAULT_PICKS;
    const current = normalizeSymbol(value);
    return current && !base.includes(current) ? [...base, current] : base;
  }, [preferred, value]);

  const results = useMemo(() => searchInstruments(query).slice(0, 24), [query]);
  const typed = normalizeSymbol(query);
  const typedIsNew = typed.length >= 2 && !results.some((r) => r.symbol === typed);

  function pick(symbol: string) {
    onChange(normalizeSymbol(symbol));
    setSearching(false);
    setQuery("");
  }

  const chip = (active: boolean) =>
    cn(
      "min-w-[4.25rem] flex-1 rounded-lg px-2.5 py-1.5 text-sm font-medium font-mono transition-all",
      active ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:text-foreground"
    );

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1.5">
        {options.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => pick(s)}
            title={findInstrument(s)?.name ?? s}
            className={chip(normalizeSymbol(value) === s)}
          >
            {s}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setSearching((o) => !o)}
          aria-expanded={searching}
          className={cn(chip(false), "flex-none font-sans text-xs", searching && "text-foreground ring-1 ring-primary/50")}
        >
          {searching ? "Close" : "Other"}
        </button>
      </div>

      {searching && (
        <div className="space-y-2 rounded-xl border border-border/60 bg-muted/10 p-2.5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (results[0]) pick(results[0].symbol);
                  else if (typed) pick(typed);
                }
              }}
              placeholder="Search: MNQ, EURUSD, US100, gold…"
              className="h-8 pl-8 text-sm"
            />
            {query && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
            {results.map((r) => (
              <button
                key={r.symbol}
                type="button"
                onClick={() => pick(r.symbol)}
                className="rounded-md border border-border/50 bg-background/60 px-2 py-1 text-left transition-colors hover:border-primary/60"
              >
                <span className="font-mono text-xs font-semibold">{r.symbol}</span>
                <span className="ml-1.5 text-[10px] text-muted-foreground">{r.name}</span>
              </button>
            ))}
            {typedIsNew && (
              <button
                type="button"
                onClick={() => pick(typed)}
                className="rounded-md border border-dashed border-primary/50 px-2 py-1 text-xs text-primary hover:bg-primary/10"
              >
                Use “{typed}”
              </button>
            )}
          </div>
        </div>
      )}

      {preferred.length === 0 && (
        <p className="text-[11px] text-muted-foreground">
          Trade other markets?{" "}
          <Link href="/profile" className="font-medium text-primary hover:underline">Set your markets in Profile</Link>.
        </p>
      )}
    </div>
  );
}
