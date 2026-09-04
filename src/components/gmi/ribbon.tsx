"use client";

/**
 * MARKET RIBBON — the tape that stays with you.
 *
 * One row of the instruments a futures desk keeps an eye on, pinned under the
 * page title so the tape is readable from every subtab. Values only: last
 * price, the day's change, and a hairline sparkline. No interpretation.
 */
import { fmtPrice, fmtPct, toneFor } from "@/lib/gmi/client";
import type { DataEnvelope, Quote } from "@/lib/gmi/types";
import { Sparkline } from "./sparkline";
import { a } from "./panel";

const RIBBON = ["ES", "NQ", "YM", "RTY", "VIX", "DXY", "US10Y", "GC", "CL", "BTC"];

export function MarketRibbon({ env }: { env: DataEnvelope<Quote[]> | null }) {
  const bySymbol = new Map((env?.data ?? []).map((q) => [q.symbol, q]));

  return (
    <div className="relative -mx-4 sm:-mx-6">
      {/* Edge fades, so a scrolled tape never looks clipped */}
      <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-background to-transparent sm:w-8" />
      <span aria-hidden className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-background to-transparent sm:w-8" />

      <div className="scrollbar-none flex gap-1.5 overflow-x-auto px-4 py-0.5 sm:px-6">
        {RIBBON.map((s) => {
          const q = bySymbol.get(s);
          const tone = toneFor(q?.changePct);
          const loading = !env;
          return (
            <div
              key={s}
              className="group/tick relative flex shrink-0 items-center gap-2.5 rounded-xl border border-border/50 bg-card/70 px-2.5 py-1.5 transition-colors hover:border-border"
              title={q?.label ?? s}
            >
              <span
                aria-hidden
                className="absolute inset-y-1.5 left-0 w-px rounded-full"
                style={{ background: q?.changePct ? tone : "var(--border)" }}
              />
              <div className="min-w-0">
                <div className="font-mono text-[10px] font-bold uppercase leading-none tracking-wider text-muted-foreground">{s}</div>
                <div className="mt-1 font-mono text-xs font-bold leading-none tabular-nums text-foreground">
                  {loading ? <span className="inline-block h-3 w-10 animate-pulse rounded bg-muted/50" /> : fmtPrice(q?.price, q?.unit)}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="font-mono text-[10px] font-bold leading-none tabular-nums" style={{ color: tone }}>
                  {q ? fmtPct(q.changePct) : "—"}
                </span>
                <span className="opacity-70">
                  {q?.spark?.length ? <Sparkline data={q.spark} width={44} height={12} strokeWidth={1.2} /> : <span className="block h-3 w-11" />}
                </span>
              </div>
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover/tick:opacity-100"
                style={{ background: `radial-gradient(120% 90% at 50% 120%, ${a(tone, 14)}, transparent 70%)` }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
