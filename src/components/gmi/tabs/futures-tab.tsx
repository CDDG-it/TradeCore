"use client";

/**
 * FUTURES — equity-index and commodity futures research. A dense grid of session
 * stats; clicking an instrument opens a detail drawer with a timeframe chart.
 * All values are Yahoo delayed quotes, labelled as such. Descriptive only.
 */
import { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { fmtPrice, fmtPct, toneFor, useGmi } from "@/lib/gmi/client";
import type { DataEnvelope, Quote } from "@/lib/gmi/types";
import { Panel } from "../panel";
import { Sparkline } from "../sparkline";
import { DataStatus } from "../data-status";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";

const INDEX = ["NQ", "ES", "YM", "RTY"];
const COMMOD = ["GC", "SI", "CL", "NG"];

const TIMEFRAMES: { key: string; label: string; interval: string; range: string }[] = [
  { key: "1m", label: "1m", interval: "1m", range: "1d" },
  { key: "5m", label: "5m", interval: "5m", range: "5d" },
  { key: "15m", label: "15m", interval: "15m", range: "1mo" },
  { key: "1h", label: "1h", interval: "60m", range: "3mo" },
  { key: "1D", label: "1D", interval: "1d", range: "1y" },
];

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/40 py-1.5 last:border-0">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className="font-mono text-xs font-semibold tabular-nums text-foreground">{value}</span>
    </div>
  );
}

function InstrumentRow({ q, onOpen }: { q: Quote | undefined; onOpen: () => void }) {
  if (!q) return null;
  const tone = toneFor(q.changePct);
  return (
    <button
      onClick={onOpen}
      className="group flex w-full items-center gap-3 rounded-xl border border-border/50 bg-muted/10 px-3 py-2.5 text-left transition-colors hover:border-primary/40 hover:bg-muted/20"
    >
      <div className="w-14 shrink-0">
        <div className="font-mono text-sm font-bold text-foreground">{q.symbol}</div>
        <div className="truncate text-[10px] text-muted-foreground">{q.label}</div>
      </div>
      <div className="hidden sm:block">{q.spark?.length ? <Sparkline data={q.spark} width={90} height={26} /> : null}</div>
      <div className="ml-auto text-right">
        <div className="font-mono text-sm font-bold tabular-nums text-foreground">{fmtPrice(q.price, q.unit)}</div>
        <div className="font-mono text-[11px] font-semibold tabular-nums" style={{ color: tone }}>{fmtPct(q.changePct)}</div>
      </div>
    </button>
  );
}

function DetailChart({ symbol }: { symbol: string }) {
  const [tf, setTf] = useState(TIMEFRAMES[1]);
  const { env } = useGmi<Quote>(
    `/api/gmi/quotes?symbol=${symbol}&interval=${tf.interval}&range=${tf.range}`,
    60_000
  );
  const q = env?.data;
  const series = (q?.spark ?? []).map((v, i) => ({ i, v }));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex rounded-lg border border-border/60 overflow-hidden">
          {TIMEFRAMES.map((t) => (
            <button
              key={t.key}
              onClick={() => setTf(t)}
              className={`px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                tf.key === t.key ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <DataStatus env={env} showSource={false} />
      </div>
      <div className="h-52 w-full">
        {series.length > 1 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
              <XAxis dataKey="i" hide />
              <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} width={48} />
              <Tooltip
                contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                labelFormatter={() => ""}
                formatter={(v) => [fmtPrice(Number(v ?? 0), q?.unit), symbol]}
              />
              <Line type="monotone" dataKey="v" stroke="var(--chart-2)" strokeWidth={1.6} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No chart data at this timeframe.</div>
        )}
      </div>
      <div>
        <StatRow label="Price" value={fmtPrice(q?.price, q?.unit)} />
        <StatRow label="Previous close" value={fmtPrice(q?.prevClose, q?.unit)} />
        <StatRow label="Day high" value={fmtPrice(q?.dayHigh, q?.unit)} />
        <StatRow label="Day low" value={fmtPrice(q?.dayLow, q?.unit)} />
        <StatRow label="Volume" value={q?.volume != null ? q.volume.toLocaleString() : "—"} />
      </div>
      <p className="text-[10px] text-muted-foreground/70">
        Delayed quotes (Yahoo Finance). VWAP, overnight range and open interest are not available from this free source.
      </p>
    </div>
  );
}

export function FuturesTab({ quotesEnv }: { quotesEnv: DataEnvelope<Quote[]> | null }) {
  const bySymbol = new Map((quotesEnv?.data ?? []).map((q) => [q.symbol, q]));
  const [open, setOpen] = useState<string | null>(null);

  // Close drawer with Escape handled by Sheet; nothing else needed here.
  useEffect(() => {}, []);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Equity index futures" env={quotesEnv}>
          <div className="space-y-2">
            {INDEX.map((s) => (
              <InstrumentRow key={s} q={bySymbol.get(s)} onOpen={() => setOpen(s)} />
            ))}
          </div>
        </Panel>
        <Panel title="Commodities" env={quotesEnv}>
          <div className="space-y-2">
            {COMMOD.map((s) => (
              <InstrumentRow key={s} q={bySymbol.get(s)} onOpen={() => setOpen(s)} />
            ))}
          </div>
        </Panel>
      </div>

      <Sheet open={open !== null} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="font-mono">
              {open} · {bySymbol.get(open ?? "")?.label}
            </SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-6">{open && <DetailChart symbol={open} />}</div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
