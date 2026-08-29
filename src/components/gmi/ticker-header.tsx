"use client";

/**
 * Persistent ticker strip for the Global Markets page. Compact, terminal-style
 * quotes that stay visible across every subtab. Values are delayed (Yahoo) and
 * labelled as such — never presented as realtime.
 */
import { cn } from "@/lib/utils";
import { fmtPrice, fmtPct, toneFor } from "@/lib/gmi/client";
import { DataStatus } from "./data-status";
import type { DataEnvelope, Quote } from "@/lib/gmi/types";

// The header line-up, in the spec's order.
const HEADER_SYMBOLS = ["NQ", "ES", "YM", "RTY", "VIX", "DXY", "US10Y", "GC", "CL"];

export function TickerHeader({ env }: { env: DataEnvelope<Quote[]> | null }) {
  const bySymbol = new Map((env?.data ?? []).map((q) => [q.symbol, q]));

  return (
    <div className="rounded-xl border border-border/60 bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="flex items-center gap-1 overflow-x-auto px-2 py-2 scrollbar-none">
        {HEADER_SYMBOLS.map((sym) => {
          const q = bySymbol.get(sym);
          const isVolOrRate = sym === "VIX" || sym === "DXY" || sym === "US10Y";
          const tone = toneFor(q?.changePct);
          return (
            <div
              key={sym}
              className="flex shrink-0 items-baseline gap-2 rounded-lg px-2.5 py-1 font-mono"
              title={q?.label ?? sym}
            >
              <span className="text-[11px] font-bold tracking-wide text-foreground">{sym}</span>
              <span className="text-[12px] tabular-nums text-foreground/90">
                {q ? fmtPrice(q.price, q.unit) : "—"}
              </span>
              {!isVolOrRate && (
                <span className="text-[11px] font-semibold tabular-nums" style={{ color: tone }}>
                  {q ? fmtPct(q.changePct) : ""}
                </span>
              )}
              {isVolOrRate && q && (
                <span className="text-[10px] tabular-nums" style={{ color: tone }}>
                  {fmtPct(q.changePct)}
                </span>
              )}
            </div>
          );
        })}
        <div className="ml-auto shrink-0 pl-3 pr-1">
          <DataStatus env={env} showSource={false} />
        </div>
      </div>
    </div>
  );
}

/** A single compact price cell with sparkline slot, reused by pulse/grids. */
export function QuoteBadge({ q, className }: { q: Quote | undefined; className?: string }) {
  const tone = toneFor(q?.changePct);
  return (
    <div className={cn("font-mono", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-bold text-foreground">{q?.symbol ?? "—"}</span>
        <span className="text-xs tabular-nums" style={{ color: tone }}>
          {q ? fmtPct(q.changePct) : "—"}
        </span>
      </div>
      <div className="mt-0.5 text-sm font-semibold tabular-nums text-foreground/90">
        {q ? fmtPrice(q.price, q.unit) : "—"}
      </div>
    </div>
  );
}
