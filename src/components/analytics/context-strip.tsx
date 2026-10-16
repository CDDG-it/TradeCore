"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Maximize2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Sparkline } from "@/components/gmi/sparkline";
import { PRESS } from "@/components/trade-therapist/motion-button";
import { extremes, formatR, type EdgeBucket } from "@/lib/journal/edge";
import { netRColor } from "@/lib/journal/colors";
import { SESSIONS, WEEKDAYS, type WeekdaySessionGrid } from "@/lib/journal/time-stats";
import type { EquityPoint } from "@/lib/journal/analytics-filter";
import { cn } from "@/lib/utils";
import { EASE } from "./analytics-ui";

export type ContextKey = "hour" | "day" | "execution" | "direction" | "market" | "curve";

/** A pair of values side by side: good vs bad, long vs short. */
function Versus({ items }: { items: { label: string; b?: EdgeBucket }[] }) {
  return (
    <span className="flex items-baseline gap-3">
      {items.map(({ label, b }) => (
        <span key={label} className="flex items-baseline gap-1">
          <span className="text-[11px] text-muted-foreground">{label}</span>
          <span className="text-sm font-bold tabular-nums" style={b?.trades && !b.thin ? { color: netRColor(b.expectancy) } : undefined}>
            {b?.trades ? formatR(b.expectancy) : "–"}
          </span>
        </span>
      ))}
    </span>
  );
}

interface Tile {
  key: ContextKey;
  label: string;
  main: React.ReactNode;
  visual?: React.ReactNode;
}

export function ContextStrip({
  hours, grid, quality, direction, instruments, curve, panels,
}: {
  hours: EdgeBucket[];
  grid: WeekdaySessionGrid;
  quality: EdgeBucket[];
  direction: EdgeBucket[];
  instruments: EdgeBucket[];
  curve: EquityPoint[];
  /** The full pane each tile opens. */
  panels: Record<ContextKey, React.ReactNode>;
}) {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState<ContextKey | null>(null);

  const bestHour = extremes(hours).best;
  const cells = WEEKDAYS.flatMap((d) => SESSIONS.map((s) => ({ ...grid.cells[d.key][s], label: `${d.label} · ${s === "New York" ? "NY" : s}` })));
  const bestCell = extremes(cells).best;
  const bestMarket = extremes(instruments).best;
  const net = curve.length ? curve[curve.length - 1].cum : 0;

  const answer = (b: EdgeBucket | null, empty: string) =>
    b ? (
      <span className="flex min-w-0 items-baseline gap-2">
        <span className="truncate text-sm font-semibold">{b.label}</span>
        <span className="shrink-0 text-sm font-bold tabular-nums" style={{ color: netRColor(b.expectancy) }}>{formatR(b.expectancy)}</span>
      </span>
    ) : (
      <span className="text-xs text-muted-foreground">{empty}</span>
    );

  const tiles: Tile[] = [
    { key: "hour", label: "Best hour", main: answer(bestHour, "Not enough timed trades") },
    { key: "day", label: "Best day & session", main: answer(bestCell, "No slot with 5+ trades") },
    { key: "execution", label: "Execution", main: <Versus items={[{ label: "Good", b: quality.find((q) => q.key === "good") }, { label: "Bad", b: quality.find((q) => q.key === "bad") }]} /> },
    { key: "direction", label: "Long vs short", main: <Versus items={[{ label: "Long", b: direction[0] }, { label: "Short", b: direction[1] }]} /> },
    { key: "market", label: "Best market", main: answer(bestMarket, "No market with 5+ trades") },
    {
      key: "curve",
      label: "R curve",
      main: <span className="text-sm font-bold tabular-nums" style={{ color: netRColor(net) }}>{formatR(net, 1)}</span>,
      visual: <Sparkline data={curve.map((p) => p.cum)} width={84} height={24} />,
    },
  ];

  return (
    <>
      <div className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6 lg:gap-3">
        {tiles.map((t, i) => (
          <motion.button
            key={t.key}
            type="button"
            onClick={() => setOpen(t.key)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: reduce ? 0 : 0.3 + i * 0.04, ease: EASE }}
            whileHover={reduce ? undefined : { y: -2 }}
            whileTap={{ scale: 0.98, transition: PRESS }}
            className="group relative flex min-w-0 flex-col justify-between gap-2 rounded-2xl border border-white/[.07] bg-card/60 px-3.5 py-3 text-left transition-[border-color,background-color] duration-300 hover:border-white/[.14] hover:bg-card/80"
          >
            <span className="flex items-center justify-between gap-2">
              <span className="truncate text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t.label}</span>
              <Maximize2 className="h-3 w-3 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-primary" />
            </span>
            <span className={cn("flex min-w-0 items-end justify-between gap-2")}>
              <span className="min-w-0">{t.main}</span>
              {t.visual && <span className="shrink-0">{t.visual}</span>}
            </span>
          </motion.button>
        ))}
      </div>

      <Dialog open={open !== null} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="h-[min(80dvh,40rem)] w-full max-w-[calc(100%-2rem)] grid-rows-[minmax(0,1fr)] rounded-[22px] bg-background p-0 ring-1 ring-white/[.07] sm:max-w-3xl" showCloseButton={false}>
          <DialogTitle className="sr-only">{tiles.find((t) => t.key === open)?.label ?? "Details"}</DialogTitle>
          {open && <div className="flex min-h-0 [&>section]:flex-1">{panels[open]}</div>}
        </DialogContent>
      </Dialog>
    </>
  );
}
