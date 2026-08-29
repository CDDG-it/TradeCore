"use client";

/**
 * WORLD — the existing interactive globe as the centrepiece, with a panel of the
 * major economies. Selecting one shows the live data we can source objectively
 * (its currency cross, and for the US the live rate ladder), the local index and
 * central bank, and states plainly where a per-country event feed is not yet
 * wired. No interpretation, no bias.
 */
import dynamic from "next/dynamic";
import { useState } from "react";
import { fmtPrice, fmtPct, toneFor, useGmi } from "@/lib/gmi/client";
import type { DataEnvelope, Quote, MacroSeries } from "@/lib/gmi/types";
import { Panel } from "../panel";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const WorldMap3D = dynamic(
  () => import("@/components/news-city/WorldMap3D").then((m) => m.WorldMap3D),
  { ssr: false, loading: () => <div className="flex h-full items-center justify-center text-sm text-muted-foreground animate-pulse">Spinning up the globe…</div> }
);

interface Economy {
  id: string;
  name: string;
  flag: string;
  centralBank: string;
  index: string;
  fxSymbol: string | null; // symbol in our quotes universe
}

const ECONOMIES: Economy[] = [
  { id: "us", name: "United States", flag: "🇺🇸", centralBank: "Federal Reserve", index: "S&P 500 / Nasdaq 100", fxSymbol: "DXY" },
  { id: "ea", name: "Euro Area", flag: "🇪🇺", centralBank: "European Central Bank", index: "Euro Stoxx 50", fxSymbol: "EURUSD" },
  { id: "cn", name: "China", flag: "🇨🇳", centralBank: "People's Bank of China", index: "CSI 300", fxSymbol: "USDCNH" },
  { id: "jp", name: "Japan", flag: "🇯🇵", centralBank: "Bank of Japan", index: "Nikkei 225", fxSymbol: "USDJPY" },
  { id: "uk", name: "United Kingdom", flag: "🇬🇧", centralBank: "Bank of England", index: "FTSE 100", fxSymbol: "GBPUSD" },
  { id: "ca", name: "Canada", flag: "🇨🇦", centralBank: "Bank of Canada", index: "TSX", fxSymbol: "USDCAD" },
  { id: "au", name: "Australia", flag: "🇦🇺", centralBank: "Reserve Bank of Australia", index: "ASX 200", fxSymbol: "AUDUSD" },
  { id: "ch", name: "Switzerland", flag: "🇨🇭", centralBank: "Swiss National Bank", index: "SMI", fxSymbol: "USDCHF" },
];

export function WorldTab({ quotesEnv }: { quotesEnv: DataEnvelope<Quote[]> | null }) {
  const [sel, setSel] = useState<Economy | null>(null);
  const { env: macroEnv } = useGmi<MacroSeries[]>("/api/gmi/macro", 10 * 60_000);
  const q = new Map((quotesEnv?.data ?? []).map((x) => [x.symbol, x]));
  const rates = (macroEnv?.data ?? []).filter((s) => ["DGS2", "DGS10", "EFFR"].includes(s.id));

  return (
    <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
      <Panel title="Interactive globe">
        <div className="relative w-full overflow-hidden rounded-xl" style={{ height: "clamp(360px, 60vh, 640px)", background: "#0b1120" }}>
          <WorldMap3D />
          <p className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-2 text-center text-[10px] text-muted-foreground">
            Drag to spin · scroll to zoom · select an economy on the right for detail
          </p>
        </div>
      </Panel>

      <Panel title="Major economies">
        <div className="grid grid-cols-2 gap-2">
          {ECONOMIES.map((e) => {
            const fx = e.fxSymbol ? q.get(e.fxSymbol) : undefined;
            return (
              <button
                key={e.id}
                onClick={() => setSel(e)}
                className="flex flex-col rounded-xl border border-border/50 bg-muted/10 p-3 text-left transition-colors hover:border-primary/40 hover:bg-muted/20"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base leading-none">{e.flag}</span>
                  <span className="text-xs font-semibold text-foreground">{e.name}</span>
                </div>
                <span className="mt-1 truncate text-[10px] text-muted-foreground">{e.centralBank}</span>
                {fx && (
                  <span className="mt-1 font-mono text-[11px] tabular-nums" style={{ color: toneFor(fx.changePct) }}>
                    {e.fxSymbol} {fmtPct(fx.changePct)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </Panel>

      <Sheet open={sel !== null} onOpenChange={(o) => !o && setSel(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <span>{sel?.flag}</span> {sel?.name}
            </SheetTitle>
          </SheetHeader>
          {sel && (
            <div className="space-y-4 px-4 pb-6 text-sm">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Central bank</p>
                <p className="font-medium text-foreground">{sel.centralBank}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Local index</p>
                <p className="font-medium text-foreground">{sel.index}</p>
              </div>
              {sel.fxSymbol && q.get(sel.fxSymbol) && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Currency (live · delayed)</p>
                  <p className="font-mono text-base font-bold tabular-nums text-foreground">
                    {sel.fxSymbol} {fmtPrice(q.get(sel.fxSymbol)!.price)}
                    <span className="ml-2 text-xs" style={{ color: toneFor(q.get(sel.fxSymbol)!.changePct) }}>
                      {fmtPct(q.get(sel.fxSymbol)!.changePct)}
                    </span>
                  </p>
                </div>
              )}
              {sel.id === "us" && rates.length > 0 && (
                <div>
                  <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Key US rates (FRED · daily)</p>
                  {rates.map((r) => (
                    <div key={r.id} className="flex justify-between border-b border-border/40 py-1.5 last:border-0">
                      <span className="text-xs text-muted-foreground">{r.label}</span>
                      <span className="font-mono text-xs font-semibold text-foreground">{r.value != null ? `${r.value.toFixed(2)}%` : "—"}</span>
                    </div>
                  ))}
                </div>
              )}
              <p className="rounded-lg border border-dashed border-border/60 bg-muted/10 p-2.5 text-[11px] text-muted-foreground/80">
                Per-country economic events, central-bank decisions and local news require an economic-calendar provider,
                which is not wired on the current data sources. Live currency (all) and US rates (FRED) are shown above.
              </p>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
