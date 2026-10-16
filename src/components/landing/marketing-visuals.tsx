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

/** A quiet comparison of the decision made and the opportunity that followed. */
export function ReviewCanvas() {
  return (
    <div className="overflow-hidden rounded-[32px] border border-[#193c48] bg-[#102332] text-white shadow-[0_30px_80px_rgba(18,62,71,.18)]" aria-label="A session review comparing an early entry with a patient entry">
      <div className="border-b border-white/10 px-6 py-5 sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8aa5ab]">Session review</p>
      </div>

      <div className="grid gap-3 p-4 sm:p-5 lg:grid-cols-2">
        <MarketingReveal distance={16} className="rounded-[24px] border border-white/10 bg-[#0d1c29] p-6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-white">Trade taken</p>
            <span className="rounded-full bg-[#ef4444]/10 px-3 py-1 text-xs font-medium text-[#f08c8c]">Entered early</span>
          </div>
          <div className="mt-7 overflow-hidden rounded-2xl bg-[#11283a] px-4 py-5" role="img" aria-label="Price fell after an entry made before confirmation">
            <svg viewBox="0 0 320 150" className="h-36 w-full" preserveAspectRatio="none" aria-hidden="true">
              <path d="M0 92 H320" stroke="#9db6bb" strokeOpacity=".22" strokeDasharray="5 7" />
              <path d="M0 66 C32 54 55 68 78 48 S116 41 138 82 S175 71 190 99 S235 126 263 117 S291 107 320 119 L320 150 H0 Z" fill="#ef4444" fillOpacity=".08" />
              <DrawPath d="M0 66 C32 54 55 68 78 48 S116 41 138 82 S175 71 190 99 S235 126 263 117 S291 107 320 119" stroke="#f08c8c" strokeWidth={3} delay={0.2} duration={1.3} />
              <circle cx="101" cy="45" r="5" fill="#f08c8c" />
            </svg>
          </div>
          <p className="mt-5 text-sm leading-relaxed text-[#b8ccd0]">The entry came before the level held.</p>
        </MarketingReveal>

        <MarketingReveal delay={0.14} distance={16} className="rounded-[24px] border border-[#14b8a6]/30 bg-[#0d1c29] p-6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-white">Best trade on offer</p>
            <span className="rounded-full bg-[#14b8a6]/10 px-3 py-1 text-xs font-medium text-[#8de0d5]">Waited for the level</span>
          </div>
          <div className="mt-7 overflow-hidden rounded-2xl bg-[#11283a] px-4 py-5" role="img" aria-label="Price rose after the planned level held and the entry was confirmed">
            <svg viewBox="0 0 320 150" className="h-36 w-full" preserveAspectRatio="none" aria-hidden="true">
              <path d="M0 92 H320" stroke="#9db6bb" strokeOpacity=".22" strokeDasharray="5 7" />
              <path d="M0 57 C35 72 54 100 83 108 S121 116 146 91 S187 89 215 63 S260 52 320 20 L320 150 H0 Z" fill="#14b8a6" fillOpacity=".1" />
              <DrawPath d="M0 57 C35 72 54 100 83 108 S121 116 146 91 S187 89 215 63 S260 52 320 20" stroke="#65d4c8" strokeWidth={3} delay={0.4} duration={1.3} />
              <circle cx="127" cy="107" r="5" fill="#65d4c8" />
            </svg>
          </div>
          <p className="mt-5 text-sm leading-relaxed text-[#b8ccd0]">The level held. Confirmation came first.</p>
        </MarketingReveal>
      </div>

      <MarketingReveal delay={0.35} distance={8} className="flex flex-wrap items-baseline justify-between gap-3 border-t border-white/10 px-6 py-5 sm:px-8">
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
  { day: "Tue", event: "CPI", time: "08:30", tone: "text-[#8de0d5]" },
  { day: "Wed", event: "Rate decision", time: "14:00", tone: "text-[#8de0d5]" },
  { day: "Thu", event: "Jobless claims", time: "08:30", tone: "text-[#b8ccd0]" },
] as const;

const marketBackdrop = [
  { label: "10Y yield", value: "4.21%" },
  { label: "Yield curve", value: "+14 bp" },
  { label: "Dollar", value: "103.4" },
] as const;

export function MarketContextVisual() {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]" aria-label="Example Global Markets view with events, positioning, rates and the trading plan">
      <MarketingReveal className="flex flex-col rounded-[28px] border border-[#193c48] bg-[#102332] p-6 text-white shadow-[0_30px_80px_rgba(18,62,71,.16)] sm:p-8 lg:row-span-2">
        <p className="text-sm font-medium text-[#8de0d5]">Event watch</p>
        <p className="font-display mt-4 max-w-md text-balance text-[clamp(1.8rem,2.8vw,2.8rem)] font-medium leading-[1.08] tracking-[-0.04em]">Know what is ahead.</p>
        <div className="mt-8 divide-y divide-white/10 border-y border-white/10">
          {marketEvents.map((item, index) => (
            <MarketingReveal key={item.event} delay={0.1 + index * 0.1} distance={8} className="grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-center gap-4 py-5">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#78959c]">{item.day}</span>
              <span className={`font-medium ${item.tone}`}>{item.event}</span>
              <span className="text-sm tabular-nums text-[#9db6bb]">{item.time}</span>
            </MarketingReveal>
          ))}
        </div>
        <div className="mt-auto flex items-center gap-3 pt-8 text-sm text-[#b8ccd0]"><span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-[#14b8a6]" />Check the release before entering.</div>
      </MarketingReveal>

      <MarketingReveal delay={0.12} className="rounded-[28px] border border-white/10 bg-[#14243a] p-6 text-white shadow-[0_24px_60px_rgba(0,0,0,.18)] sm:p-8">
        <div className="flex items-center justify-between gap-4"><p className="text-sm font-medium text-[#8de0d5]">Positioning</p><span className="text-xs text-[#78959c]">ES · COT</span></div>
        <p className="font-display mt-5 text-2xl font-semibold tracking-[-0.035em]">Large traders lean long.</p>
        <div className="mt-7 flex items-center justify-between gap-4 text-sm"><span className="text-[#b8ccd0]">Large speculators</span><span className="font-medium tabular-nums text-[#8de0d5]">62% long</span></div>
        <span aria-hidden="true" className="mt-3 block h-1.5 overflow-hidden rounded-full bg-white/10"><GrowBar axis="x" delay={0.45} className="block h-full rounded-full bg-[#14b8a6]" style={{ width: "62%" }} /></span>
      </MarketingReveal>

      <MarketingReveal delay={0.2} className="rounded-[28px] border border-white/10 bg-[#111f33] p-6 text-white sm:p-8">
        <p className="text-sm font-medium text-[#8de0d5]">Market backdrop</p>
        <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-white/10 pt-5">
          {marketBackdrop.map((item) => (
            <div key={item.label} className="min-w-0"><dt className="text-xs text-[#9db6bb]">{item.label}</dt><dd className="font-display mt-2 text-lg font-semibold tabular-nums tracking-[-0.04em] sm:text-xl">{item.value}</dd></div>
          ))}
        </dl>
      </MarketingReveal>

      <MarketingReveal delay={0.28} className="flex flex-wrap items-center justify-between gap-5 rounded-[28px] border border-[#65d4c8]/20 bg-[#0d1c29] p-6 text-white sm:p-8 lg:col-span-2">
        <div><p className="text-sm font-medium text-[#8de0d5]">Your plan</p><p className="font-display mt-2 text-xl font-medium tracking-[-0.03em] sm:text-2xl">Wait for price to reach your level.</p></div>
        <span className="rounded-full border border-[#65d4c8]/30 px-4 py-2 text-sm font-medium text-[#8de0d5]">Unchanged</span>
      </MarketingReveal>
    </div>
  );
}
