"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { CountUp } from "@/components/ui/count-up";
import { formatR } from "@/lib/journal/edge";
import { LOSS_COLOR, WIN_COLOR, alpha, netRColor } from "@/lib/journal/colors";
import type { Headline } from "@/lib/journal/analytics-filter";
import type { Finding } from "@/lib/journal/analytics-findings";
import { cn } from "@/lib/utils";
import { EASE, GLOSSARY, MetricInfo } from "./analytics-ui";

interface Kpi {
  key: string;
  label: string;
  value: number | null;
  format: (n: number) => string;
  tone?: string;
  info: string;
  /** Same metric over the whole period, shown when a drill-down is active. */
  base?: number | null;
}

function KpiTile({ k, index, drilled }: { k: Kpi; index: number; drilled: boolean }) {
  const reduce = useReducedMotion();
  const delta = drilled && k.value !== null && k.base != null ? k.value - k.base : null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: reduce ? 0 : index * 0.04, ease: EASE }}
      className="relative min-w-0 overflow-hidden rounded-2xl border border-white/[.07] bg-card/70 px-3.5 py-2.5"
    >
      <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {k.label}
        <MetricInfo>{k.info}</MetricInfo>
      </p>
      <p className="mt-1 text-2xl font-black leading-none tabular-nums" style={{ color: k.value === null ? undefined : k.tone }}>
        {k.value === null ? <span className="text-muted-foreground/50">–</span> : <CountUp value={k.value} format={k.format} />}
      </p>
      <AnimatePresence initial={false}>
        {delta !== null && (
          <motion.p
            key="delta"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: EASE }}
            className="mt-1 truncate text-[10px] tabular-nums text-muted-foreground"
          >
            <span style={{ color: delta > 0 ? WIN_COLOR : delta < 0 ? LOSS_COLOR : undefined }}>
              {delta > 0 ? "+" : delta < 0 ? "−" : "±"}{k.format(Math.abs(delta)).replace(/^[+−]/, "")}
            </span>{" "}
            vs period
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/** The few findings worth acting on, one at a time; hover holds the current one. */
function FindingsTicker({ findings, className }: { findings: Finding[]; className?: string }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();
  const n = findings.length;
  const current = n ? findings[i % n] : null;

  useEffect(() => {
    if (paused || n < 2 || reduce) return;
    const id = setInterval(() => setI((x) => (x + 1) % n), 6000);
    return () => clearInterval(id);
  }, [paused, n, reduce]);

  const color = current?.tone === "good" ? WIN_COLOR : LOSS_COLOR;
  const Icon = current?.tone === "good" ? TrendingUp : TrendingDown;

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className={cn("relative min-w-0 overflow-hidden rounded-2xl border border-white/[.07] bg-card/70 px-3.5 py-2.5", className)}
      style={current ? { backgroundImage: `linear-gradient(160deg, ${alpha(color, 10)}, transparent 60%)` } : undefined}
    >
      {current ? (
        <>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25, ease: EASE }}
            >
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <Icon className="h-3.5 w-3.5" style={{ color }} />
                {current.eyebrow}
              </p>
              <div className="mt-1 flex items-baseline justify-between gap-2">
                <p className="truncate text-sm font-semibold" title={current.headline}>{current.headline}</p>
                <p className="shrink-0 text-sm font-black tabular-nums" style={{ color }}>{current.value}</p>
              </div>
              <p className="mt-0.5 truncate text-[11px] text-muted-foreground" title={current.detail}>{current.detail}</p>
            </motion.div>
          </AnimatePresence>
          {n > 1 && (
            <div className="absolute right-3 top-3 flex gap-1">
              {findings.map((f, j) => (
                <button
                  key={f.id}
                  type="button"
                  aria-label={`Show finding ${j + 1}`}
                  onClick={() => setI(j)}
                  className={cn("h-1.5 rounded-full transition-all duration-300", j === i % n ? "w-4 bg-primary" : "w-1.5 bg-muted-foreground/40 hover:bg-muted-foreground")}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="flex h-full flex-col justify-center">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Findings</p>
          <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
            None yet: a finding needs 5+ trades behind it, so it reflects how you trade and not a streak.
          </p>
        </div>
      )}
    </div>
  );
}

export function KpiStrip({ now, base, findings, drilled }: { now: Headline; base: Headline; findings: Finding[]; drilled: boolean }) {
  const pct = (n: number) => `${Math.round(n)}%`;
  const kpis: Kpi[] = [
    { key: "trades", label: "Trades", value: now.trades, format: (n) => String(Math.round(n)), info: `Trades in this selection, ${now.breakEven} of them break-even.` },
    { key: "win", label: "Win rate", value: now.winRate, format: pct, info: GLOSSARY.winRate, base: base.winRate },
    { key: "exp", label: "Avg R", value: now.expectancy, format: (n) => formatR(n), tone: netRColor(now.expectancy), info: GLOSSARY.rPerTrade, base: base.expectancy },
    { key: "net", label: "Net R", value: now.netR, format: (n) => formatR(n, 1), tone: netRColor(now.netR), info: "Every trade's R added up.", base: undefined },
    { key: "pf", label: "Profit factor", value: now.profitFactor, format: (n) => n.toFixed(2), tone: now.profitFactor === null ? undefined : now.profitFactor >= 1 ? WIN_COLOR : LOSS_COLOR, info: GLOSSARY.profitFactor, base: base.profitFactor },
  ];
  return (
    <div className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-7 lg:gap-3">
      {kpis.map((k, i) => (
        <KpiTile key={k.key} k={k} index={i} drilled={drilled} />
      ))}
      <FindingsTicker findings={findings} className="col-span-2 sm:col-span-1 lg:col-span-2" />
    </div>
  );
}
