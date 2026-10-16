/** Read-only product compositions for the public page. All content is illustrative. */

import { DrawLine, DrawPath, GrowBar, MarketingReveal, PinReveal, WriteIn } from "@/components/landing/marketing-motion";

const processDetails = [
  { title: "Daily commitment", meta: "PRE-MARKET", value: "Max three trades. Wait for fresh confirmation after a loss." },
  { title: "Habits", meta: "REPEAT", value: "Plan · Review · Reset" },
  { title: "Goal", meta: "MEASURE", value: "Execution 75% → 85%" },
] as const;

const processTrack = [["Plan", "Written"], ["Commit", "Specific"], ["Repeat", "Tracked"], ["Measure", "Visible"]] as const;

export function ProcessCanvas() {
  return (
    <div className="group relative overflow-hidden rounded-[36px] border border-[#29435b] bg-[#0d1c29] p-3 text-white shadow-[0_34px_90px_rgba(0,0,0,.28)] sm:p-4" aria-label="A trading plan connected to a commitment, habits and a goal">
      <div aria-hidden className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[#0b67c9]/20 blur-[90px]" />
      <div className="relative grid grid-flow-dense gap-3 lg:grid-cols-12">
        <MarketingReveal className="relative flex min-h-[480px] flex-col justify-between overflow-hidden rounded-[28px] border border-white/10 bg-[#101f32] p-7 transition-transform duration-700 ease-out group-hover:scale-[1.006] sm:p-10 lg:col-span-7 lg:p-12">
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
            {[['Setup', 'Planned pullback'], ['Risk', 'Defined first'], ['Trigger', 'Fresh confirmation']].map(([label, value]) => <div key={label} className="rounded-2xl border border-white/10 bg-[#0b1728]/80 p-3 backdrop-blur-md"><span className="block text-[10px] uppercase tracking-[.14em] text-[#91aeb4]">{label}</span><span className="mt-1 block font-medium text-[#e7f5f4]">{value}</span></div>)}
          </div>
        </MarketingReveal>

        <div className="grid gap-3 lg:col-span-5 lg:grid-rows-3">
          {processDetails.map((step, index) => (
            <MarketingReveal key={step.title} delay={0.12 + index * 0.1} distance={20} className="group/edge relative overflow-hidden rounded-[24px] border border-white/10 bg-[#14243a] p-6 transition-[transform,border-color,background-color] duration-500 ease-out hover:-translate-x-1 hover:border-[#65d4c8]/35 hover:bg-[#1a304b] sm:p-7">
              <div className="flex items-center justify-between gap-4"><p className="text-sm font-medium text-[#8de0d5]">{step.title}</p><p className="text-[10px] font-semibold tracking-[.16em] text-[#719098]">{step.meta}</p></div>
              <p className="font-display mt-3 max-w-md text-balance text-[clamp(1.3rem,2vw,2rem)] font-medium leading-[1.1] tracking-[-.035em]">{step.value}</p>
              <span aria-hidden className="absolute inset-x-6 bottom-0 h-px bg-white/10"><GrowBar axis="x" delay={0.5 + index * 0.12} className="block h-px origin-left bg-[#65d4c8]" style={{ width: `${72 + index * 11}%` }} /></span>
            </MarketingReveal>
          ))}
        </div>
      </div>

      <div className="relative mt-3 grid grid-cols-4 overflow-hidden rounded-[24px] border border-white/10 bg-[#111f33] px-4 py-5 text-center text-[11px] font-semibold text-[#d6e4e6] sm:px-8 sm:text-xs">
        <DrawLine axis="x" delay={0.15} duration={1.2} className="absolute left-[12.5%] right-[12.5%] top-[25px] block h-px bg-[#84bdb8]" />
        {processTrack.map(([label, state], index) => <MarketingReveal key={label} delay={0.2 + index * 0.14} distance={7} className="relative"><span aria-hidden className="relative mx-auto mb-3 block h-3 w-3 rounded-full border-2 border-[#111f33] bg-[#14b8a6] ring-1 ring-[#14b8a6]" /><span className="block text-[#e7f5f4]">{label}</span><span className="mt-1 block font-normal text-[#91aeb4]">{state}</span></MarketingReveal>)}
      </div>
    </div>
  );
}

/** One setup, two decisions. Motion follows the moment of entry through to the outcome. */
export function ReviewCanvas() {
  return (
    <div className="overflow-hidden rounded-[32px] border border-[#28505a] bg-[#0d1c29] text-white shadow-[0_30px_80px_rgba(18,62,71,.18)]" aria-label="A session review comparing an early entry with a patient entry">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-white/10 px-6 py-6 sm:px-8">
        <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8de0d5]">Session review</p><p className="font-display mt-2 text-xl font-medium tracking-[-0.035em] sm:text-2xl">Same setup. Different timing.</p></div>
        <span className="text-xs text-[#90aeb5]">The decision changes the trade</span>
      </div>

      <div className="relative space-y-3 p-4 sm:p-5">
        <DrawLine axis="y" delay={0.2} duration={1} className="absolute bottom-12 left-[36px] top-12 z-10 w-px bg-[#65d4c8]/40 sm:left-[40px]" />
        <MarketingReveal distance={14} className="relative overflow-hidden rounded-[24px] border border-[#ef7777]/20 bg-[#122335] px-5 py-5 sm:px-7">
          <div className="grid gap-5 sm:grid-cols-[minmax(0,0.78fr)_minmax(0,1fr)] sm:items-center">
            <div className="relative z-20 pl-7">
              <span aria-hidden className="absolute left-[-19px] top-1.5 block size-3 rounded-full border-[3px] border-[#122335] bg-[#f08c8c] ring-1 ring-[#f08c8c]" />
              <p className="text-xs font-semibold uppercase tracking-[0.13em] text-[#f08c8c]">Trade taken</p>
              <p className="font-display mt-2 text-2xl font-medium tracking-[-0.04em]">Entered early</p>
              <MarketingReveal delay={0.65} distance={7}><p className="mt-3 max-w-[220px] text-sm leading-relaxed text-[#b8ccd0]">The entry came before the level held.</p></MarketingReveal>
            </div>
            <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#0d1c29] px-3 py-4" role="img" aria-label="Price fell after an entry made before confirmation">
              <span className="absolute right-4 top-3 text-[10px] uppercase tracking-[.13em] text-[#78959c]">Planned level</span>
              <svg viewBox="0 0 320 120" className="h-32 w-full" preserveAspectRatio="none" aria-hidden="true">
                <path d="M0 62 H320" stroke="#91aeb4" strokeOpacity=".3" strokeDasharray="4 6" />
                <path d="M0 58 C38 49 58 58 83 34 S115 42 139 64 S177 54 192 82 S238 101 263 91 S296 99 320 102 L320 120 H0 Z" fill="#ef4444" fillOpacity=".09" />
                <DrawPath d="M0 58 C38 49 58 58 83 34 S115 42 139 64 S177 54 192 82 S238 101 263 91 S296 99 320 102" stroke="#f08c8c" strokeWidth={2.5} delay={0.2} duration={1.5} />
              </svg>
              <PinReveal delay={0.65} className="absolute left-[34%] top-[30%]"><span className="block size-3 rounded-full border-[3px] border-[#0d1c29] bg-[#f08c8c] ring-1 ring-[#f08c8c]" /></PinReveal>
            </div>
          </div>
        </MarketingReveal>

        <MarketingReveal delay={0.22} distance={14} className="relative overflow-hidden rounded-[24px] border border-[#65d4c8]/35 bg-[#10303b] px-5 py-5 sm:px-7">
          <div className="grid gap-5 sm:grid-cols-[minmax(0,0.78fr)_minmax(0,1fr)] sm:items-center">
            <div className="relative z-20 pl-7">
              <span aria-hidden className="absolute left-[-19px] top-1.5 block size-3 rounded-full border-[3px] border-[#10303b] bg-[#65d4c8] ring-1 ring-[#65d4c8]" />
              <p className="text-xs font-semibold uppercase tracking-[0.13em] text-[#8de0d5]">Best trade on offer</p>
              <p className="font-display mt-2 text-2xl font-medium tracking-[-0.04em]">Waited for the level</p>
              <MarketingReveal delay={0.85} distance={7}><p className="mt-3 max-w-[220px] text-sm leading-relaxed text-[#b8ccd0]">The level held. Confirmation came first.</p></MarketingReveal>
            </div>
            <div className="relative overflow-hidden rounded-2xl border border-[#65d4c8]/10 bg-[#0d2530] px-3 py-4" role="img" aria-label="Price rose after the planned level held and the entry was confirmed">
              <span className="absolute right-4 top-3 text-[10px] uppercase tracking-[.13em] text-[#78959c]">Planned level</span>
              <svg viewBox="0 0 320 120" className="h-32 w-full" preserveAspectRatio="none" aria-hidden="true">
                <path d="M0 62 H320" stroke="#91aeb4" strokeOpacity=".3" strokeDasharray="4 6" />
                <path d="M0 38 C35 46 54 76 83 82 S119 87 145 62 S186 64 215 43 S263 35 320 12 L320 120 H0 Z" fill="#14b8a6" fillOpacity=".1" />
                <DrawPath d="M0 38 C35 46 54 76 83 82 S119 87 145 62 S186 64 215 43 S263 35 320 12" stroke="#65d4c8" strokeWidth={2.5} delay={0.5} duration={1.5} />
              </svg>
              <PinReveal delay={1.1} className="absolute left-[44%] top-[52%]"><span className="block size-3 rounded-full border-[3px] border-[#0d2530] bg-[#65d4c8] ring-1 ring-[#65d4c8]" /></PinReveal>
            </div>
          </div>
        </MarketingReveal>
      </div>

      <MarketingReveal delay={0.9} distance={8} className="flex flex-wrap items-baseline justify-between gap-3 border-t border-[#65d4c8]/20 bg-[#102b35] px-6 py-5 sm:px-8">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8de0d5]">The difference</span>
        <span className="font-display text-xl font-medium tracking-[-0.03em] text-white">Patience before entry.</span>
      </MarketingReveal>
    </div>
  );
}

/** Four moments of reflection, shown without a sample trade ledger. */
export function TherapistVisual() {
  return (
    <div className="grid gap-4 sm:grid-cols-2" aria-label="Trade Therapist routine from preparation to monthly reflection">
      <MarketingReveal className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#102332] bg-[radial-gradient(circle_at_15%_12%,#1a4068,transparent_62%)] p-6 text-white shadow-[0_34px_90px_rgba(0,0,0,.22)] sm:col-span-2 sm:p-8">
        <p className="text-sm font-medium text-[#8de0d5]">Before the market</p>
        <p className="font-display mt-4 max-w-[550px] text-balance text-[clamp(1.8rem,2.8vw,2.7rem)] font-medium leading-[1.1] tracking-[-0.04em]">Choose one thing to do well.</p>
        <div className="mt-7 rounded-2xl border border-[#14b8a6]/30 bg-[#0e2531]/75 p-5 sm:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8de0d5]">Today&apos;s focus</p>
          <p className="mt-3 max-w-[520px] text-lg font-medium leading-snug sm:text-xl"><WriteIn delay={0.3} duration={1.1}>Wait for the retest before entering.</WriteIn></p>
        </div>
        <div className="mt-5 flex flex-wrap gap-x-7 gap-y-2 text-sm text-[#b8ccd0]">
          <span><span className="font-medium text-[#f08c8c]">Avoid</span> early entries</span>
          <span><span className="font-medium text-[#8de0d5]">Repeat</span> patient entries</span>
        </div>
      </MarketingReveal>

      <MarketingReveal delay={0.1} className="rounded-[28px] border border-white/10 bg-[#14243a] p-6 text-white shadow-[0_24px_60px_rgba(0,0,0,.18)] sm:p-8">
        <p className="text-sm font-medium text-[#8de0d5]">After the market</p>
        <p className="font-display mt-4 text-2xl font-semibold tracking-[-0.035em]">Review the decision.</p>
        <div className="mt-7 border-l-2 border-[#65d4c8] pl-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9db6bb]">What worked</p>
          <p className="mt-2 text-base font-medium leading-snug">Waited for confirmation.</p>
        </div>
      </MarketingReveal>

      <MarketingReveal delay={0.18} className="rounded-[28px] border border-white/10 bg-[#14243a] p-6 text-white shadow-[0_24px_60px_rgba(0,0,0,.18)] sm:p-8">
        <p className="text-sm font-medium text-[#8de0d5]">Weekly review</p>
        <p className="font-display mt-4 text-2xl font-semibold tracking-[-0.035em]">Name the pattern.</p>
        <div className="mt-7 border-l-2 border-[#65d4c8] pl-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9db6bb]">This week&apos;s lesson</p>
          <p className="mt-2 text-base font-medium leading-snug">Rushed entries followed losses.</p>
        </div>
      </MarketingReveal>

      <MarketingReveal delay={0.26} className="flex flex-wrap items-center justify-between gap-5 rounded-[28px] border border-white/10 bg-[#0d1c29] p-6 text-white shadow-[0_24px_60px_rgba(0,0,0,.18)] sm:col-span-2 sm:p-8">
        <div>
          <p className="text-sm font-medium text-[#8de0d5]">Monthly rollup</p>
          <p className="font-display mt-3 text-2xl font-semibold tracking-[-0.035em]">See what persists.</p>
        </div>
        <div className="rounded-2xl border border-[#65d4c8]/25 bg-[#14243a] px-5 py-4 text-sm font-medium text-[#e7f5f4]">Recurring pattern <span className="ml-3 text-[#8de0d5]">Early entries</span></div>
      </MarketingReveal>
    </div>
  );
}

const marketEvents = [
  { day: "Tue", event: "CPI", time: "08:30" },
  { day: "Wed", event: "Rate decision", time: "14:00" },
  { day: "Thu", event: "Jobless claims", time: "08:30" },
] as const;

const marketBackdrop = [
  { label: "10Y yield", value: "4.21%" },
  { label: "Yield curve", value: "+14 bp" },
  { label: "Dollar", value: "103.4" },
] as const;

export function MarketContextVisual() {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]" aria-label="Example Global Markets view with events, positioning, rates and the trading plan">
      <MarketingReveal className="relative flex flex-col overflow-hidden rounded-[28px] border border-[#26515a] bg-[#102332] p-6 text-white shadow-[0_30px_80px_rgba(18,62,71,.16)] sm:p-8 lg:row-span-2">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-[#0b67c9]/10 blur-[65px]" />
        <div className="relative flex items-start justify-between gap-4"><div><p className="text-sm font-medium text-[#8de0d5]">Event watch</p><p className="font-display mt-4 max-w-md text-balance text-[clamp(1.8rem,2.8vw,2.8rem)] font-medium leading-[1.08] tracking-[-0.04em]">Know what is ahead.</p></div><span className="rounded-full border border-[#65d4c8]/25 px-3 py-1 text-[10px] font-semibold uppercase tracking-[.12em] text-[#8de0d5]">This week</span></div>

        <div className="relative mt-12 grid grid-cols-3 gap-2 pb-2">
          <DrawLine axis="x" delay={0.2} duration={1.1} className="absolute left-[16.7%] right-[16.7%] top-2.5 h-px bg-[#65d4c8]/65" />
          {marketEvents.map((item, index) => (
            <MarketingReveal key={item.event} delay={0.26 + index * 0.18} distance={9} className="relative min-w-0 text-center">
              <span aria-hidden className={`relative z-10 mx-auto block size-5 rounded-full border-[5px] border-[#102332] ring-1 ${index === 0 ? "bg-[#65d4c8] ring-[#65d4c8] shadow-[0_0_20px_rgba(101,212,200,.5)]" : "bg-[#7b9ba4] ring-[#7b9ba4]"}`} />
              <span className="mt-6 block text-[10px] font-semibold uppercase tracking-[.14em] text-[#78959c]">{item.day} · {item.time}</span>
              <span className={`mt-2 block text-sm font-medium leading-tight sm:text-base ${index === 0 ? "text-[#8de0d5]" : "text-white"}`}>{item.event}</span>
            </MarketingReveal>
          ))}
        </div>
        <MarketingReveal delay={0.9} distance={8} className="mt-auto flex items-center gap-3 border-t border-white/10 pt-7 text-sm text-[#b8ccd0]"><span aria-hidden className="size-2 shrink-0 rounded-full bg-[#14b8a6]" />Check the release before entering.</MarketingReveal>
      </MarketingReveal>

      <MarketingReveal delay={0.12} className="flex items-center justify-between gap-5 rounded-[28px] border border-white/10 bg-[#14243a] p-6 text-white shadow-[0_24px_60px_rgba(0,0,0,.18)] sm:p-8">
        <div className="min-w-0"><div className="flex flex-wrap items-center gap-x-3 gap-y-1"><p className="text-sm font-medium text-[#8de0d5]">Positioning</p><span className="text-xs text-[#78959c]">ES · COT</span></div><p className="font-display mt-5 max-w-[210px] text-2xl font-semibold leading-tight tracking-[-0.035em]">Large traders lean long.</p><p className="mt-3 text-xs text-[#9db6bb]">Large speculators</p></div>
        <div className="relative size-28 shrink-0 sm:size-32" role="img" aria-label="Large speculators are 62 percent long">
          <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden="true"><circle cx="60" cy="60" r="48" fill="none" stroke="#29435b" strokeWidth="9" /><DrawPath d="M60 12 A48 48 0 1 1 27 95" stroke="#65d4c8" strokeWidth={9} delay={0.4} duration={1.2} /></svg>
          <span className="absolute inset-0 flex flex-col items-center justify-center"><span className="font-display text-3xl font-semibold tabular-nums tracking-[-.06em]">62<span className="text-lg">%</span></span><span className="text-[10px] uppercase tracking-[.14em] text-[#8de0d5]">Long</span></span>
        </div>
      </MarketingReveal>

      <MarketingReveal delay={0.2} className="overflow-hidden rounded-[28px] border border-white/10 bg-[#111f33] p-6 text-white sm:p-8">
        <div className="flex items-center justify-between gap-4"><p className="text-sm font-medium text-[#8de0d5]">Market backdrop</p><span aria-hidden className="flex items-end gap-1"><span className="h-2 w-1 rounded-full bg-[#65d4c8]/30" /><span className="h-4 w-1 rounded-full bg-[#65d4c8]/60" /><span className="h-3 w-1 rounded-full bg-[#65d4c8]" /></span></div>
        <dl className="mt-6 grid grid-cols-3 divide-x divide-white/10 border-t border-white/10 pt-5">
          {marketBackdrop.map((item, index) => (
            <MarketingReveal key={item.label} delay={0.3 + index * 0.1} distance={8} className={`min-w-0 ${index === 0 ? "pr-2" : "px-3 sm:px-4"}`}><dt className="text-[11px] text-[#9db6bb]">{item.label}</dt><dd className="font-display mt-2 text-lg font-semibold tabular-nums tracking-[-0.04em] sm:text-xl">{item.value}</dd></MarketingReveal>
          ))}
        </dl>
      </MarketingReveal>

      <MarketingReveal delay={0.28} className="relative flex flex-wrap items-center justify-between gap-5 overflow-hidden rounded-[28px] border border-[#65d4c8]/25 bg-[#0d2530] p-6 text-white sm:p-8 lg:col-span-2">
        <DrawLine axis="x" delay={0.6} duration={1} className="absolute inset-x-0 top-0 h-px bg-[#65d4c8]" />
        <div><p className="text-sm font-medium text-[#8de0d5]">Your plan</p><p className="font-display mt-2 text-xl font-medium tracking-[-0.03em] sm:text-2xl">Wait for price to reach your level.</p></div>
        <span className="flex items-center gap-2 rounded-full border border-[#65d4c8]/30 px-4 py-2 text-sm font-medium text-[#8de0d5]"><span aria-hidden className="size-1.5 rounded-full bg-[#65d4c8]" />Unchanged</span>
      </MarketingReveal>
    </div>
  );
}
