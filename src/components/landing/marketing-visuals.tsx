/** Read-only product compositions for the public page. All content is illustrative. */

import { DrawLine, DrawPath, GrowBar, MarketingReveal, PinReveal, WriteIn } from "@/components/landing/marketing-motion";

const processDetails = [
  { title: "Commitment", meta: "IF / THEN", value: "After a loss, wait for fresh confirmation." },
  { title: "Habits", meta: "REPEAT", value: "Plan · Review · Reset" },
  { title: "Goal", meta: "MEASURE", value: "Execution 75% → 85%" },
] as const;

const processTrack = [["Plan", "Written"], ["Commit", "Specific"], ["Repeat", "Tracked"], ["Measure", "Visible"]] as const;

export function ProcessCanvas() {
  return (
    <div className="group relative overflow-hidden rounded-[36px] bg-[#0b2430] p-3 text-white shadow-[0_34px_90px_rgba(13,59,68,.2)] sm:p-4" aria-label="A trading plan connected to a commitment, habits and a goal">
      <div aria-hidden className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[#38c9ba]/10 blur-[90px]" />
      <div className="relative grid grid-flow-dense gap-3 lg:grid-cols-12">
        <MarketingReveal className="relative flex min-h-[480px] flex-col justify-between overflow-hidden rounded-[28px] border border-white/10 bg-[#102f3c] p-7 transition-transform duration-700 ease-out group-hover:scale-[1.006] sm:p-10 lg:col-span-7 lg:p-12">
          <div aria-hidden className="absolute inset-x-0 bottom-0 h-[58%] opacity-70">
            <svg viewBox="0 0 700 250" className="h-full w-full" preserveAspectRatio="none">
              <defs><linearGradient id="edge-area" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#65d4c8" stopOpacity=".22" /><stop offset="1" stopColor="#65d4c8" stopOpacity="0" /></linearGradient></defs>
              <path d="M0 205 C80 185 120 215 190 170 S315 100 375 145 S500 195 700 60 L700 250 L0 250 Z" fill="url(#edge-area)" />
              <DrawPath d="M0 205 C80 185 120 215 190 170 S315 100 375 145 S500 195 700 60" stroke="#65d4c8" strokeWidth={2} duration={1.8} delay={0.25} />
              <DrawPath d="M0 132 H700" stroke="#8de0d5" strokeWidth={1} className="[stroke-dasharray:7_8]" duration={1.2} delay={0.55} />
            </svg>
            <PinReveal delay={1.3} className="absolute right-[8%] top-[19%]"><span className="block h-3 w-3 rounded-full bg-[#65d4c8] shadow-[0_0_0_8px_rgba(101,212,200,.12),0_0_24px_rgba(101,212,200,.7)]" /></PinReveal>
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between gap-4"><p className="text-sm font-medium text-[#8de0d5]">Your session plan</p><span className="text-[10px] font-semibold uppercase tracking-[.18em] text-[#75949c]">Before entry</span></div>
            <p className="font-display mt-8 max-w-3xl text-balance text-[clamp(2.4rem,4.3vw,4.8rem)] font-semibold leading-[.98] tracking-[-.055em]">Turn a clear plan into consistent execution.</p>
          </div>
          <div className="relative z-10 mt-24 grid max-w-2xl grid-cols-2 gap-2 text-sm sm:grid-cols-3">
            {[['Setup', 'Planned pullback'], ['Risk', 'Defined first'], ['Trigger', 'Fresh confirmation']].map(([label, value]) => <div key={label} className="rounded-2xl border border-white/10 bg-[#0b2430]/75 p-3 backdrop-blur-md"><span className="block text-[10px] uppercase tracking-[.14em] text-[#75949c]">{label}</span><span className="mt-1 block font-medium text-[#e7f5f4]">{value}</span></div>)}
          </div>
        </MarketingReveal>

        <div className="grid gap-3 lg:col-span-5 lg:grid-rows-3">
          {processDetails.map((step, index) => (
            <MarketingReveal key={step.title} delay={0.12 + index * 0.1} distance={20} className="group/edge relative overflow-hidden rounded-[24px] border border-white/10 bg-[#143541] p-6 transition-[transform,border-color,background-color] duration-500 ease-out hover:-translate-x-1 hover:border-[#65d4c8]/35 hover:bg-[#173e4a] sm:p-7">
              <div className="flex items-center justify-between gap-4"><p className="text-sm font-medium text-[#8de0d5]">{step.title}</p><p className="text-[10px] font-semibold tracking-[.16em] text-[#719098]">{step.meta}</p></div>
              <p className="font-display mt-3 max-w-md text-balance text-[clamp(1.3rem,2vw,2rem)] font-medium leading-[1.1] tracking-[-.035em]">{step.value}</p>
              <span aria-hidden className="absolute inset-x-6 bottom-0 h-px bg-white/10"><GrowBar axis="x" delay={0.5 + index * 0.12} className="block h-px origin-left bg-[#65d4c8]" style={{ width: `${72 + index * 11}%` }} /></span>
            </MarketingReveal>
          ))}
        </div>
      </div>

      <div className="relative mt-3 grid grid-cols-4 overflow-hidden rounded-[24px] bg-[#dff2ef] px-4 py-5 text-center text-[11px] font-semibold text-[#365a63] sm:px-8 sm:text-xs">
        <DrawLine axis="x" delay={0.15} duration={1.2} className="absolute left-[12.5%] right-[12.5%] top-[25px] block h-px bg-[#84bdb8]" />
        {processTrack.map(([label, state], index) => <MarketingReveal key={label} delay={0.2 + index * 0.14} distance={7} className="relative"><span aria-hidden className="relative mx-auto mb-3 block h-3 w-3 rounded-full border-2 border-[#dff2ef] bg-[#148f87] ring-1 ring-[#148f87]" /><span className="block text-[#153b46]">{label}</span><span className="mt-1 block font-normal text-[#638087]">{state}</span></MarketingReveal>)}
      </div>
    </div>
  );
}

export const reviewSteps = [
  { label: "Pattern seen", meta: "Journal" },
  { label: "Best trade of the day", meta: "Verdict" },
  { label: "Next response", meta: "Commitment" },
] as const;

/* Illustrative candles as [open, high, low, close] on a 0-100 price scale. */
type Candle = readonly [number, number, number, number];

const takenCandles: readonly Candle[] = [
  [52, 58, 50, 56], [56, 60, 54, 58], [58, 62, 55, 57], [57, 59, 48, 50], [50, 54, 47, 53], [53, 57, 51, 55], [55, 57, 49, 50],
  [50, 52, 45, 46], [46, 48, 41, 43], [43, 47, 40, 45], [45, 49, 43, 48], [48, 51, 46, 50], [50, 54, 48, 53], [53, 58, 52, 57],
];
const bestCandles: readonly Candle[] = [
  [60, 63, 56, 58], [58, 60, 52, 54], [54, 56, 48, 50], [50, 52, 44, 46], [46, 48, 40, 42], [42, 45, 39, 41], [41, 48, 40, 47],
  [47, 52, 45, 51], [51, 56, 50, 55], [55, 58, 52, 54], [54, 62, 53, 61], [61, 68, 60, 67], [67, 74, 65, 72], [72, 80, 70, 78],
];

const UP = "#22c55e";
const DOWN = "#ef4444";

/** Maps a price to a vertical percentage so each chart fills its box, with room above and below for labels. */
function priceScale(candles: readonly Candle[]) {
  const low = Math.min(...candles.map((candle) => candle[2]));
  const high = Math.max(...candles.map((candle) => candle[1]));
  return (price: number) => 12 + ((high - price) / (high - low)) * 60;
}

function CandleChart({ candles, delay, toY }: { candles: readonly Candle[]; delay: number; toY: (price: number) => number }) {
  return (
    <div className="absolute inset-0 flex items-stretch gap-[3px] sm:gap-1" aria-hidden="true">
      {candles.map(([open, high, low, close], index) => {
        const up = close >= open;
        const color = up ? UP : DOWN;
        const bodyTop = toY(Math.max(open, close));
        const bodyHeight = Math.max(toY(Math.min(open, close)) - bodyTop, 1.5);
        return (
          <div key={index} className="relative flex-1">
            {/* Each candle pops from its own body, so the chart prints left to right. */}
            <PinReveal delay={delay + index * 0.07} origin={`center ${toY((open + close) / 2)}%`} className="absolute inset-0">
              <span className="absolute left-1/2 w-px -translate-x-1/2" style={{ top: `${toY(high)}%`, height: `${toY(low) - toY(high)}%`, backgroundColor: color, opacity: 0.8 }} />
              <span className="absolute left-[16%] right-[16%] rounded-[2px]" style={{ top: `${bodyTop}%`, height: `${bodyHeight}%`, backgroundColor: color }} />
            </PinReveal>
          </div>
        );
      })}
    </div>
  );
}

/** A horizontal price line with a label at the right edge. `price` is on the same 0-100 scale as the candles. */
function PriceLine({ y, color, label, delay, dashed = true }: { y: number; color: string; label: string; delay: number; dashed?: boolean }) {
  return (
    <div className="absolute inset-x-0 flex items-center" style={{ top: `${y}%` }} aria-hidden="true">
      <DrawLine axis="x" delay={delay} duration={0.6} className="block h-px flex-1" style={{ background: dashed ? `repeating-linear-gradient(90deg, ${color}bf 0 5px, transparent 5px 10px)` : `${color}bf` }} />
      <PinReveal delay={delay + 0.35} origin="left center" className="ml-2 shrink-0">
        <span className="block max-w-[3.5rem] rounded-md px-1.5 py-0.5 text-[9px] font-semibold leading-tight tracking-[0.08em] sm:max-w-[4rem]" style={{ backgroundColor: `${color}22`, color }}>{label}</span>
      </PinReveal>
    </div>
  );
}

/** A marker pinned to a candle, with its note above or below. `index` is the candle position. */
function TradeMarker({ index, count, y, color, title, note, delay, side }: {
  index: number; count: number; y: number; color: string; title: string; note: string; delay: number; side: "above" | "below";
}) {
  const left = `${((index + 0.5) / count) * 100}%`;
  return (
    <PinReveal delay={delay} origin={side === "above" ? "center bottom" : "center top"} className={`absolute -translate-x-1/2 ${side === "above" ? "-translate-y-full" : ""}`} style={{ left, top: `${y}%`, marginTop: side === "above" ? "-6px" : "6px" }}>
      {side === "below" && <span className="mx-auto mb-1.5 block h-2.5 w-2.5 rounded-full border-2 border-[#0d1c29]" style={{ backgroundColor: color, boxShadow: `0 0 0 2px ${color}66` }} />}
      <div className="whitespace-nowrap rounded-lg border bg-[#102332] px-2.5 py-1.5 text-left shadow-[0_10px_26px_rgba(0,0,0,.4)]" style={{ borderColor: `${color}59` }}>
        <span className="block text-[9px] font-semibold tracking-[0.12em] sm:text-[10px]" style={{ color }}>{title}</span>
        <span className="mt-0.5 block text-[11px] font-medium text-white sm:text-xs">{note}</span>
      </div>
      {side === "above" && <span className="mx-auto mt-1.5 block h-2.5 w-2.5 rounded-full border-2 border-[#0d1c29]" style={{ backgroundColor: color, boxShadow: `0 0 0 2px ${color}66` }} />}
    </PinReveal>
  );
}

const takenY = priceScale(takenCandles);
const bestY = priceScale(bestCandles);

export function ReviewCanvas() {
  return (
    <div className="overflow-hidden rounded-[32px] border border-[#193c48] bg-[#102332] text-white shadow-[0_30px_80px_rgba(18,62,71,.18)]" aria-label="A session review: the trade taken, the best trade that was on offer, and the response for the next session">
      <MarketingReveal distance={12} className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-6 py-4 text-xs sm:px-8">
        <span className="flex items-center gap-3"><span className="font-semibold tracking-[0.14em] text-[#8aa5ab]">SESSION REVIEW</span><span className="text-[#65d4c8]">Tue 16 Sep</span></span>
        <span className="text-[#829da3]">2 trades taken · 1 better trade on offer</span>
      </MarketingReveal>

      <div className="grid gap-3 p-4 sm:p-5 lg:grid-cols-2">
        {/* The trade that was taken: entered early, stopped out. */}
        <MarketingReveal distance={16} className="rounded-[24px] border border-white/10 bg-[#0d1c29] p-5 sm:p-6">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-[10px] font-semibold tracking-[0.14em] text-[#f08c8c]">THE TRADE YOU TOOK</p>
            <p className="text-xs text-[#829da3]">09:42 · <span className="font-semibold tabular-nums text-[#f08c8c]">-1R</span></p>
          </div>
          <div className="relative mt-5 h-56 pr-14 sm:pr-16" aria-label="Candlestick chart of the trade taken: entered early after a loss and stopped out">
            <div className="relative h-full">
              <CandleChart candles={takenCandles} delay={0.2} toY={takenY} />
              <PriceLine y={takenY(55)} color="#c9dadd" label="ENTRY" delay={0.75} />
              <PriceLine y={takenY(44)} color={DOWN} label="STOP · -1R" delay={1.0} dashed={false} />
              <TradeMarker index={5} count={takenCandles.length} y={takenY(57)} color="#f08c8c" title="ENTERED EARLY · 09:42" note="Right after a loss, no retest" delay={0.9} side="above" />
              <TradeMarker index={8} count={takenCandles.length} y={takenY(41)} color={DOWN} title="STOPPED OUT · 10:05" note="The level was never retested" delay={1.25} side="below" />
            </div>
          </div>
          <p className="mt-6 text-xs leading-relaxed text-[#9db6bb] sm:text-sm">Entered on the first bounce after a loss. The level had not been retested yet.</p>
        </MarketingReveal>

        {/* The best trade on offer: waited for the level, confirmed, ran to target. */}
        <MarketingReveal delay={0.15} distance={16} className="rounded-[24px] border border-[#14b8a6]/25 bg-[#0d1c29] p-5 sm:p-6">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-[10px] font-semibold tracking-[0.14em] text-[#7ee0a4]">BEST TRADE OF THE DAY</p>
            <p className="text-xs text-[#829da3]">10:35 · <span className="font-semibold tabular-nums text-[#7ee0a4]">+2.4R</span></p>
          </div>
          <div className="relative mt-5 h-56 pr-14 sm:pr-16" aria-label="Candlestick chart of the best trade on offer: entered at the planned level after confirmation and ran to target">
            <div className="relative h-full">
              <CandleChart candles={bestCandles} delay={0.45} toY={bestY} />
              <PriceLine y={bestY(40)} color="#8de0d5" label="PLANNED LEVEL" delay={0.9} />
              <PriceLine y={bestY(78)} color={UP} label="TARGET · +2.4R" delay={1.7} />
              <TradeMarker index={6} count={bestCandles.length} y={bestY(40)} color={UP} title="ENTERED · 10:35" note="Level held, then confirmed" delay={1.35} side="below" />
            </div>
          </div>
          <p className="mt-6 text-xs leading-relaxed text-[#9db6bb] sm:text-sm">Price came back to the planned level, held, and confirmed. The trade in the plan.</p>
        </MarketingReveal>
      </div>

      <div className="grid gap-3 px-4 pb-4 sm:grid-cols-[1.1fr_0.9fr] sm:px-5 sm:pb-5">
        <MarketingReveal delay={1.9} distance={16} className="rounded-[24px] border border-white/10 bg-[#0d1c29] p-6 sm:p-7">
          <p className="text-[10px] font-semibold tracking-[0.14em] text-[#8de0d5]">VERDICT</p>
          <p className="font-display mt-3 text-xl font-semibold tracking-[-0.035em] sm:text-2xl">Was your trade the best trade?</p>
          <div className="mt-5 space-y-2 text-sm">
            <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 px-4 py-3 text-[#8aa5ab]"><span>Yes, I took the best available trade</span><span aria-hidden="true" className="h-4 w-4 rounded-full border border-white/20" /></div>
            <MarketingReveal delay={2.3} distance={6} className="flex items-center justify-between gap-4 rounded-xl border border-[#14b8a6]/60 bg-[#14b8a6]/10 px-4 py-3 font-medium text-white">
              <span>No, a better trade was on offer</span>
              <span aria-hidden="true" className="grid h-4 w-4 place-items-center rounded-full bg-[#14b8a6] text-[10px] font-bold text-[#081721]">✓</span>
            </MarketingReveal>
          </div>
          <p className="mt-5 text-xs leading-relaxed text-[#9db6bb] sm:text-sm"><span className="font-semibold text-[#c6dcdf]">Why it was better:</span> the level was retested, confirmation came first, and there was room to the target.</p>
        </MarketingReveal>

        <MarketingReveal delay={2.1} distance={16} className="flex flex-col justify-between rounded-[24px] bg-[#173849] p-6 sm:p-7">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.14em] text-[#8de0d5]">NEXT RESPONSE</p>
            <p className="font-display mt-3 text-balance text-[clamp(1.5rem,2.4vw,2.2rem)] font-medium leading-[1.12] tracking-[-0.04em]">Wait for my level and confirmation.</p>
          </div>
          <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-4 text-sm"><span className="text-[#91aeb4]">Next session</span><span className="font-medium text-[#8de0d5]">Committed</span></div>
        </MarketingReveal>
      </div>
    </div>
  );
}

export const therapistCadence = [
  { label: "Before the market", meta: "Pre-market" },
  { label: "After the market", meta: "Session" },
  { label: "Weekly review", meta: "5 days" },
  { label: "Monthly rollup", meta: "Persistent" },
] as const;

export function TherapistVisual() {
  return (
    <div className="grid gap-4 sm:grid-cols-2" aria-label="Trade Therapist reflection cadence">
      <MarketingReveal className="relative overflow-hidden rounded-[28px] bg-[#102332] bg-[radial-gradient(circle_at_15%_12%,#1b5b5c,transparent_62%)] p-6 text-white shadow-[0_34px_90px_rgba(13,59,68,.20)] sm:col-span-2 sm:p-8">
        <div className="flex items-baseline justify-between gap-4"><p className="text-sm font-medium text-[#8de0d5]">Before the market</p><span className="text-xs text-[#78959c]">PRE-MARKET EXERCISES</span></div>
        <p className="font-display mt-5 max-w-[560px] text-balance text-[clamp(1.7rem,2.6vw,2.6rem)] font-medium leading-[1.1] tracking-[-0.04em]">Look back at two losses and two wins, then write today&apos;s plan.</p>

        {/* Intention: the one line the rest of the drill feeds. */}
        <div className="mt-7 rounded-2xl border border-[#14b8a6]/30 bg-[#0e2531]/75 p-4 sm:p-5">
          <p className="text-[10px] font-semibold tracking-[0.18em] text-[#8de0d5]">INTENTION · TODAY&apos;S ONE FOCUS</p>
          <p className="mt-2 text-sm font-medium sm:text-base"><WriteIn delay={0.35} duration={1.3}>No entry without a confirmed level. Wait for the retest.</WriteIn></p>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <MarketingReveal delay={0.5} distance={14} className="rounded-2xl border border-white/10 bg-[#0d1c29]/80 p-4 sm:p-5">
            <p className="text-[10px] font-semibold tracking-[0.16em] text-[#f08c8c]">PREVENT THIS LOSS</p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs"><span className="rounded-md bg-white/10 px-2 py-1 font-semibold">ES</span><span className="text-[#9db6bb]">Tue 15 Sep</span><span className="rounded-md bg-[#ef4444]/15 px-2 py-1 font-semibold tabular-nums text-[#f08c8c]">-1R</span></div>
            <p className="mt-3 text-sm font-medium">Entered before confirmation.</p>
            <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#78959c]">How I&apos;ll prevent this today</p>
            <p className="mt-1.5 border-l-2 border-[#ef4444]/50 pl-3 text-sm text-[#d6e4e6]"><WriteIn delay={1.6} duration={1.0}>Wait for the retest to hold, then enter.</WriteIn></p>
          </MarketingReveal>

          <MarketingReveal delay={0.65} distance={14} className="rounded-2xl border border-white/10 bg-[#0d1c29]/80 p-4 sm:p-5">
            <p className="text-[10px] font-semibold tracking-[0.16em] text-[#7ee0a4]">REPEAT THIS WIN</p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs"><span className="rounded-md bg-white/10 px-2 py-1 font-semibold">ES</span><span className="text-[#9db6bb]">Wed 16 Sep</span><span className="rounded-md bg-[#22c55e]/15 px-2 py-1 font-semibold tabular-nums text-[#7ee0a4]">+2.3R</span></div>
            <p className="mt-3 text-sm font-medium">Waited for the pullback into the level.</p>
            <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#78959c]">How I&apos;ll repeat this today</p>
            <p className="mt-1.5 border-l-2 border-[#22c55e]/50 pl-3 text-sm text-[#d6e4e6]"><WriteIn delay={2.5} duration={1.0}>Same patience: level first, then confirmation.</WriteIn></p>
          </MarketingReveal>
        </div>

        <MarketingReveal delay={3.4} distance={8} className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="flex items-center gap-2 text-[#7ee0a4]"><span aria-hidden="true" className="grid h-4 w-4 place-items-center rounded-full bg-[#22c55e]/20 text-[10px] font-bold">✓</span>Plan saved for Sep 17</span>
          <span className="rounded-lg bg-[#14b8a6] px-3 py-1.5 font-semibold text-[#081721]">Saved</span>
        </MarketingReveal>
      </MarketingReveal>

      {/* After the market: the session read back as decisions, not a chart. */}
      <MarketingReveal delay={0.08} className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#173849] bg-[radial-gradient(circle_at_85%_0%,#1f6a68,transparent_58%)] p-6 text-white shadow-[inset_0_1px_0_rgba(255,255,255,.08),0_24px_60px_rgba(13,59,68,.16)] sm:p-8">
        <CardEyebrow label="After the market" meta="Session" />
        <p className="font-display mt-4 text-2xl font-semibold tracking-[-0.035em]">Examine the decisions.</p>
        <ol className="mt-6" aria-label="The session's trades and their verdicts">
          {sessionLedger.map((row, index) => (
            <li key={row.time} className="relative">
              <MarketingReveal delay={0.3 + index * 0.08} distance={8} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 py-3 text-sm">
                <span className="w-11 shrink-0 tabular-nums text-[#9db6bb]">{row.time}</span>
                <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[11px] font-semibold">ES</span>
                <span className={`w-12 shrink-0 font-semibold tabular-nums ${row.r < 0 ? "text-[#f08c8c]" : "text-[#7ee0a4]"}`}>{row.r > 0 ? "+" : ""}{row.r}R</span>
                <span className="order-last basis-full text-[13px] leading-snug text-[#d6e4e6] sm:order-none sm:min-w-0 sm:flex-1 sm:basis-auto">{row.note}</span>
                <span className={`ml-auto shrink-0 rounded-md px-2 py-1 text-[10px] font-semibold tracking-[0.1em] ${row.onPlan ? "bg-[#22c55e]/15 text-[#7ee0a4]" : "bg-[#ef4444]/15 text-[#f08c8c]"}`}>{row.onPlan ? "ON PLAN" : "EARLY"}</span>
              </MarketingReveal>
              <DrawLine delay={0.36 + index * 0.08} className="block h-px w-full bg-white/10" />
            </li>
          ))}
        </ol>
        <MarketingReveal delay={0.7} distance={8} className="mt-4 flex items-center gap-2 text-xs text-[#7ee0a4]">
          <span aria-hidden="true" className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-[#22c55e]/20 text-[10px] font-bold">✓</span>
          <span>Best trade of the day: 10:42, the retest you waited for.</span>
        </MarketingReveal>
      </MarketingReveal>

      {/* Weekly review: the week's days, then the lesson in the trader's own words. */}
      <MarketingReveal delay={0.16} className="relative overflow-hidden rounded-[28px] border border-[#bfdcd7] bg-[#dcefeb] bg-[radial-gradient(circle_at_85%_0%,#ffffff,transparent_55%)] p-6 text-[#153743] shadow-[inset_0_1px_0_rgba(255,255,255,.7),0_24px_60px_rgba(13,59,68,.10)] sm:p-8">
        <CardEyebrow label="Weekly review" meta="5 days" light />
        <p className="font-display mt-4 text-2xl font-semibold tracking-[-0.035em]">Write the lesson down.</p>
        <div aria-hidden="true" className="mt-6 grid grid-cols-5 gap-2">
          {reviewWeek.map((day, index) => (
            <MarketingReveal key={day.day} delay={0.3 + index * 0.06} distance={10} className={`rounded-xl border px-2 py-2.5 text-center ${day.missed ? "border-dashed border-[#9fc4bf] bg-white/30" : "border-[#9fd0c9] bg-[#b9e3dd]/80"}`}>
              <span className="block text-[10px] font-semibold tracking-[0.12em] text-[#4f7a7f]">{day.day}</span>
              <span className={`mt-1 block text-sm font-semibold tabular-nums ${day.missed ? "text-[#8aa5ab]" : day.r < 0 ? "text-[#c0392b]" : "text-[#157a4b]"}`}>{day.missed ? "–" : `${day.r > 0 ? "+" : ""}${day.r}R`}</span>
              <svg viewBox="0 0 16 16" className="mx-auto mt-1.5 h-4 w-4">
                {!day.missed && <DrawPath d="M3 8.5 L6.5 12 L13 4.5" stroke="#167c79" strokeWidth={2} delay={0.55 + index * 0.08} duration={0.5} />}
              </svg>
            </MarketingReveal>
          ))}
        </div>
        <div className="mt-6 border-l-2 border-[#167c79]/60 pl-4">
          <p className="text-[10px] font-semibold tracking-[0.16em] text-[#167c79]">LESSON · WEEK 38</p>
          <p className="mt-1.5 text-sm font-medium"><WriteIn delay={0.9} duration={1.1}>Both losses came from entering before the retest.</WriteIn></p>
          <p className="mt-3 text-[10px] font-semibold tracking-[0.16em] text-[#167c79]">FOCUS FOR NEXT WEEK</p>
          <p className="mt-1.5 text-sm font-medium"><WriteIn delay={1.9} duration={0.9}>Level first, then confirmation.</WriteIn></p>
        </div>
      </MarketingReveal>

      {/* Monthly rollup: which patterns keep coming back, week by week. */}
      <MarketingReveal delay={0.24} className="relative grid gap-6 overflow-hidden rounded-[28px] border border-white/10 bg-[#0d1c29] bg-[radial-gradient(circle_at_0%_100%,#173849,transparent_55%)] p-6 text-white shadow-[inset_0_1px_0_rgba(255,255,255,.06),0_24px_60px_rgba(13,59,68,.16)] sm:col-span-2 sm:grid-cols-[0.36fr_0.64fr] sm:items-center sm:p-8">
        <div>
          <CardEyebrow label="Monthly rollup" meta="Persistent" />
          <p className="font-display mt-4 text-2xl font-semibold tracking-[-0.035em]">See what persists.</p>
          <p className="mt-3 max-w-[300px] text-sm leading-relaxed text-[#9db6bb]">Weekly lessons roll up into one view, so a pattern that survives the month is named, not sensed.</p>
        </div>
        <div className="min-w-0" aria-label="Patterns by week">
          <div className="grid grid-cols-[minmax(0,1fr)_repeat(4,2rem)_auto] items-center gap-x-2 text-[10px] font-semibold tracking-[0.12em] text-[#78959c] sm:grid-cols-[minmax(0,1fr)_repeat(4,2.5rem)_auto]">
            <span />
            {["W1", "W2", "W3", "W4"].map((w) => <span key={w} className="text-center">{w}</span>)}
            <span className="w-16" />
          </div>
          {persistence.map((row, rowIndex) => {
            const hits = row.weeks.filter(Boolean).length;
            const persists = hits >= 3;
            return (
              <div key={row.label} className="relative grid grid-cols-[minmax(0,1fr)_repeat(4,2rem)_auto] items-center gap-x-2 border-t border-white/10 py-3 sm:grid-cols-[minmax(0,1fr)_repeat(4,2.5rem)_auto]">
                <span className={`truncate text-sm ${persists ? "font-medium text-white" : "text-[#9db6bb]"}`}>{row.label}</span>
                {row.weeks.map((hit, weekIndex) => (
                  <span key={weekIndex} className="relative flex h-6 items-center justify-center">
                    {persists && weekIndex > 0 && row.weeks[weekIndex - 1] && hit && (
                      <DrawLine delay={0.9 + weekIndex * 0.1} duration={0.4} className="absolute right-1/2 top-1/2 h-px w-[calc(100%+0.5rem)] -translate-y-1/2 bg-[#59c9be]/60" />
                    )}
                    <MarketingReveal delay={0.45 + rowIndex * 0.12 + weekIndex * 0.06} distance={6} className={`relative h-2.5 w-2.5 rounded-full ${hit ? (persists ? "bg-[#59c9be] shadow-[0_0_10px_rgba(89,201,190,.6)]" : "bg-[#59c9be]/45") : "border border-white/15"}`}>
                      <span className="sr-only">{hit ? "seen" : "clear"}</span>
                    </MarketingReveal>
                  </span>
                ))}
                <MarketingReveal delay={1.1 + rowIndex * 0.1} distance={4} className={`w-16 rounded-md px-2 py-1 text-center text-[10px] font-semibold tabular-nums ${persists ? "bg-[#14b8a6]/15 text-[#8de0d5]" : "bg-white/5 text-[#78959c]"}`}>
                  {hits} of 4
                </MarketingReveal>
              </div>
            );
          })}
        </div>
      </MarketingReveal>
    </div>
  );
}

/** Eyebrow row shared by the cadence cards: label, chapter index, meta chip. */
function CardEyebrow({ label, meta, light = false }: { label: string; meta: string; light?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="flex items-baseline gap-2.5">
        <span className={`text-sm font-medium ${light ? "text-[#167c79]" : "text-[#8de0d5]"}`}>{label}</span>
      </span>
      <span className={`rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${light ? "bg-[#167c79]/10 text-[#4f7a7f]" : "bg-white/10 text-[#9db6bb]"}`}>{meta}</span>
    </div>
  );
}

/* One session read back as decisions: time, result, what happened, verdict. */
const sessionLedger = [
  { time: "10:04", r: -1, note: "Entered before confirmation", onPlan: false },
  { time: "10:42", r: 2.3, note: "Waited for the retest to hold", onPlan: true },
  { time: "13:15", r: 0.6, note: "Planned level, took partials", onPlan: true },
] as const;

/* The reviewed week, Monday to Friday. */
const reviewWeek = [
  { day: "MON", r: 1.8, missed: false },
  { day: "TUE", r: -1, missed: false },
  { day: "WED", r: 0, missed: true },
  { day: "THU", r: 2.3, missed: false },
  { day: "FRI", r: 0.6, missed: false },
] as const;

/* Which patterns showed up in which week of the month. */
const persistence = [
  { label: "Early entry", weeks: [true, true, false, true] },
  { label: "Size up after a loss", weeks: [true, false, false, false] },
  { label: "Skipped the plan", weeks: [false, true, false, false] },
] as const;

/* The week's releases on a Monday-to-Friday track. `at` is the position along the week in percent. */
const marketEvents = [
  { at: 27, day: "Tue", time: "08:30", event: "CPI", note: "No entry before the print", impact: "high" },
  { at: 52, day: "Wed", time: "14:00", event: "Rate decision", note: "Half size into the close", impact: "high" },
  { at: 71, day: "Thu", time: "08:30", event: "Jobless claims", note: "Wait for structure", impact: "medium" },
] as const;

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri"] as const;

/* COT positioning for the illustrative contract, as a share of open interest. */
const positioning = [
  { group: "Large speculators", side: "Net long", share: 62, color: "#14b8a6" },
  { group: "Commercials", side: "Net short", share: 48, color: "#06b6d4" },
  { group: "Small traders", side: "Net long", share: 21, color: "#91dfd5" },
] as const;

const marketTiles = [
  { label: "US 10Y", value: "4.21%", change: "+3 bp", up: true },
  { label: "2s10s", value: "+14 bp", change: "steeper", up: true },
  { label: "Dollar", value: "103.4", change: "-0.3%", up: false },
] as const;

export const marketTabs = [
  { label: "Calendar", meta: "Release schedule" },
  { label: "Positioning", meta: "Who holds what" },
  { label: "Markets", meta: "Yields, curve, dollar" },
  { label: "Your plan", meta: "Unchanged" },
] as const;

export function MarketContextVisual() {
  return (
    <div className="grid gap-4 lg:grid-cols-3" aria-label="Illustrative Global Markets view: the week's releases, futures positioning and rates beside the trading plan">
      {/* Calendar: the week as a track, releases pinned where they land. */}
      <MarketingReveal className="rounded-[28px] border border-[#193c48] bg-[#102332] p-6 text-white shadow-[0_30px_80px_rgba(18,62,71,.16)] sm:p-8 lg:col-span-2">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <p className="text-sm font-medium text-[#8de0d5]">Calendar</p>
          <p className="text-xs text-[#78959c]">THIS WEEK · <span className="text-[#65d4c8]">3 releases that matter</span></p>
        </div>
        <p className="font-display mt-4 max-w-[520px] text-balance text-[clamp(1.7rem,2.6vw,2.6rem)] font-medium leading-[1.1] tracking-[-0.04em]">Know the event before it knows you.</p>

        <div className="relative mt-10 h-40 sm:h-44" aria-hidden="true">
          <div className="absolute inset-x-0 top-[62%] flex items-center">
            <DrawLine axis="x" delay={0.2} duration={1.2} className="block h-px flex-1 bg-white/15" />
          </div>
          <div className="absolute inset-x-0 top-[62%] mt-4 grid grid-cols-5 text-[10px] font-semibold tracking-[0.14em] text-[#719098] sm:text-[11px]">
            {weekDays.map((day, index) => <MarketingReveal key={day} delay={0.3 + index * 0.06} distance={6} className="text-center uppercase">{day}</MarketingReveal>)}
          </div>
          {marketEvents.map((item, index) => (
            <PinReveal key={item.event} delay={0.6 + index * 0.22} origin="center bottom" className="absolute -translate-x-1/2" style={{ left: `${item.at}%`, top: 0, height: "62%" }}>
              <div className="flex h-full flex-col items-center justify-end">
                <div className={`mb-3 whitespace-nowrap rounded-xl border bg-[#0d1c29] px-3 py-2 text-center shadow-[0_12px_30px_rgba(0,0,0,.35)] ${item.impact === "high" ? "border-[#14b8a6]/45" : "border-white/15"}`}>
                  <span className="block text-[10px] font-semibold tracking-[0.12em] text-[#8de0d5]">{item.day.toUpperCase()} · {item.time}</span>
                  <span className="mt-0.5 block text-xs font-semibold sm:text-sm">{item.event}</span>
                  <span className="mt-0.5 hidden text-[11px] text-[#9db6bb] sm:block">{item.note}</span>
                </div>
                <span className="block h-4 w-px bg-[#14b8a6]/60" />
                <span className={`block h-3 w-3 rounded-full border-2 border-[#102332] ${item.impact === "high" ? "bg-[#14b8a6] ring-2 ring-[#14b8a6]/40" : "bg-[#7ea6ab] ring-2 ring-white/15"}`} />
              </div>
            </PinReveal>
          ))}
        </div>
      </MarketingReveal>

      {/* Positioning: who holds what, from the weekly CFTC report. */}
      <MarketingReveal delay={0.12} className="rounded-[28px] bg-[#173849] p-6 text-white shadow-[0_24px_60px_rgba(13,59,68,.16)] sm:p-8">
        <div className="flex items-baseline justify-between gap-4"><p className="text-sm font-medium text-[#8de0d5]">Positioning</p><span className="text-xs text-[#78959c]">ES · COT</span></div>
        <p className="font-display mt-4 text-2xl font-semibold tracking-[-0.035em]">Who holds what.</p>
        <ul className="mt-7 space-y-5">
          {positioning.map((row, index) => (
            <li key={row.group}>
              <div className="flex items-baseline justify-between gap-3 text-xs"><span className="font-medium text-[#d6e4e6]">{row.group}</span><span className="tabular-nums text-[#9db6bb]">{row.side} · {row.share}%</span></div>
              <span aria-hidden="true" className="mt-2 block h-1.5 overflow-hidden rounded-full bg-white/10">
                <GrowBar axis="x" delay={0.4 + index * 0.1} className="block h-full rounded-full" style={{ width: `${row.share}%`, backgroundColor: row.color }} />
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-7 text-xs leading-relaxed text-[#9db6bb]">Updated every Friday from the CFTC report.</p>
      </MarketingReveal>

      {/* Markets: the rates backdrop in three numbers. */}
      <MarketingReveal delay={0.2} className="rounded-[28px] border border-[#bfdcd7] bg-[#dcefeb] p-6 text-[#153743] sm:p-8">
        <div className="flex items-baseline justify-between gap-4"><p className="text-sm font-medium text-[#167c79]">Markets</p><span className="text-xs text-[#6b858b]">YIELDS · CURVE · DOLLAR</span></div>
        <p className="font-display mt-4 text-2xl font-semibold tracking-[-0.035em]">The backdrop, in three numbers.</p>
        <div className="mt-7 grid grid-cols-3 gap-2 sm:gap-3">
          {marketTiles.map((tile, index) => (
            <MarketingReveal key={tile.label} delay={0.45 + index * 0.08} distance={10} className="rounded-2xl border border-[#b7d4d1] bg-white/60 p-3 sm:p-4">
              <span className="block text-[10px] font-semibold tracking-[0.12em] text-[#6b858b]">{tile.label.toUpperCase()}</span>
              <span className="font-display mt-2 block text-lg font-semibold tabular-nums tracking-[-0.04em] sm:text-xl">{tile.value}</span>
              <span className={`mt-1 block text-[11px] font-medium ${tile.up ? "text-[#15803d]" : "text-[#b91c1c]"}`}>{tile.change}</span>
            </MarketingReveal>
          ))}
        </div>
      </MarketingReveal>

      {/* The plan sits beside all of it and does not move. */}
      <MarketingReveal delay={0.28} className="flex flex-col justify-between rounded-[28px] border border-white/10 bg-[#0d1c29] p-6 text-white sm:p-8 lg:col-span-2 lg:flex-row lg:items-center lg:gap-10">
        <div>
          <p className="text-sm font-medium text-[#8de0d5]">Your plan</p>
          <p className="font-display mt-3 max-w-[460px] text-balance text-[clamp(1.5rem,2.4vw,2.2rem)] font-medium leading-[1.12] tracking-[-0.04em]">Wait for price to hit my level of interest.</p>
        </div>
        <dl className="mt-6 grid shrink-0 grid-cols-2 gap-3 text-sm lg:mt-0 lg:min-w-[300px]">
          <div className="rounded-2xl bg-[#173849] px-4 py-3"><dt className="text-[10px] font-semibold tracking-[0.12em] text-[#8aa9ae]">PLAN STATUS</dt><dd className="mt-1 font-medium text-[#8de0d5]">Unchanged</dd></div>
          <div className="rounded-2xl bg-[#173849] px-4 py-3"><dt className="text-[10px] font-semibold tracking-[0.12em] text-[#8aa9ae]">RISK ON WED</dt><dd className="mt-1 font-medium text-white">Half size</dd></div>
        </dl>
      </MarketingReveal>
    </div>
  );
}
