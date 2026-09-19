/** Read-only product compositions for the public page. All content is illustrative. */

import { MarketingReveal } from "@/components/landing/marketing-motion";

const processDetails = [
  { title: "Commitment", meta: "IF / THEN", value: "After a loss, wait for fresh confirmation." },
  { title: "Habits", meta: "REPEAT", value: "Plan · Review · Reset" },
  { title: "Goal", meta: "MEASURE", value: "Execution 75% → 85%" },
] as const;

export function ProcessCanvas() {
  return (
    <div className="relative overflow-hidden rounded-[36px] bg-[#102b37] text-white shadow-[0_34px_90px_rgba(13,59,68,.18)]" aria-label="A trading plan connected to a commitment, habits and a goal">
      <div aria-hidden="true" className="absolute -left-28 bottom-[-170px] h-[440px] w-[440px] rounded-full border border-[#55c7bd]/20 shadow-[0_0_0_46px_rgba(85,199,189,.035),0_0_0_96px_rgba(85,199,189,.025)]" />
      <div className="relative grid lg:grid-cols-[1.08fr_0.92fr]">
        <MarketingReveal className="flex min-h-[430px] flex-col justify-between border-b border-white/10 p-8 sm:p-12 lg:border-b-0 lg:border-r lg:p-14">
          <div>
            <p className="text-sm font-medium text-[#80d9cf]">The trading plan</p>
            <p className="font-display mt-9 max-w-[690px] text-balance text-[clamp(2.7rem,5vw,5.8rem)] font-semibold leading-[1.02] tracking-[-0.055em]">Wait for price to hit my level of interest.</p>
          </div>
          <div className="mt-12 grid max-w-xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 text-sm">
            <div className="bg-[#102b37]/90 p-4"><span className="block text-[#7e9ea5]">Setup</span><span className="mt-1 block font-medium">Planned pullback</span></div>
            <div className="bg-[#102b37]/90 p-4"><span className="block text-[#7e9ea5]">Risk</span><span className="mt-1 block font-medium">Defined before entry</span></div>
          </div>
        </MarketingReveal>

        <div className="relative p-8 sm:p-12 lg:p-14">
          <div aria-hidden="true" className="absolute bottom-16 left-[3.65rem] top-16 w-px bg-gradient-to-b from-[#59d2c6]/10 via-[#59d2c6]/65 to-[#59d2c6]/10" />
          <div className="space-y-7">
            {processDetails.map((step, index) => (
              <MarketingReveal key={step.title} delay={0.08 + index * 0.1} className="relative grid grid-cols-[42px_1fr] gap-5">
                <span aria-hidden="true" className="relative mt-1 grid h-9 w-9 place-items-center rounded-full border border-[#65d4c8]/45 bg-[#173b47] shadow-[0_0_0_7px_#102b37]"><span className="h-2 w-2 rounded-full bg-[#65d4c8]" /></span>
                <div className="border-b border-white/10 pb-7">
                  <div className="flex flex-wrap items-baseline justify-between gap-3"><p className="text-sm font-medium text-[#8de0d5]">{step.title}</p><p className="text-[10px] font-semibold tracking-[0.16em] text-[#719098]">{step.meta}</p></div>
                  <p className="font-display mt-4 max-w-md text-balance text-[clamp(1.45rem,2.2vw,2.25rem)] font-medium leading-[1.15] tracking-[-0.035em]">{step.value}</p>
                </div>
              </MarketingReveal>
            ))}
          </div>
        </div>
      </div>

      <div className="relative grid grid-cols-4 border-t border-white/10 bg-[#dff2ef] px-5 py-6 text-center text-[11px] font-semibold text-[#365a63] sm:px-10 sm:text-xs">
        {[
          ["Plan", "Written"], ["Commit", "Specific"], ["Repeat", "Tracked"], ["Measure", "Visible"],
        ].map(([label, state], index) => (
          <div key={label} className="relative">
            {index < 3 && <span aria-hidden="true" className="absolute left-[60%] right-[-40%] top-[6px] h-px bg-[#84bdb8]" />}
            <span aria-hidden="true" className="relative mx-auto mb-3 block h-3 w-3 rounded-full border-2 border-[#dff2ef] bg-[#148f87] ring-1 ring-[#148f87]" />
            <span className="block text-[#153b46]">{label}</span><span className="mt-1 block font-normal text-[#638087]">{state}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ReviewActionVisual() {
  return (
    <div className="relative" aria-label="An example reflection becoming a commitment for the next session">
      <MarketingReveal className="relative mr-5 rounded-[28px] border border-[#b7d4d1] bg-[#e9f5f3] p-7 sm:mr-14 sm:p-10">
        <p className="text-xs font-semibold tracking-[0.12em] text-[#4e7b82]">PATTERN SEEN</p>
        <blockquote className="font-display mt-7 text-balance text-[clamp(2rem,3.4vw,3.7rem)] font-medium leading-[1.08] tracking-[-0.045em] text-[#102b37]">“I entered early after a loss.”</blockquote>
        <div aria-hidden="true" className="mt-9 flex items-center gap-3"><span className="h-px flex-1 bg-[#a8cbc8]" /><span className="h-2 w-2 rounded-full bg-[#14b8a6]" /></div>
      </MarketingReveal>
      <div aria-hidden="true" className="ml-auto mr-12 h-12 w-px bg-[#14b8a6] sm:mr-24 sm:h-16" />
      <MarketingReveal delay={0.14} className="relative ml-5 rounded-[28px] bg-[#102d3c] p-7 text-white shadow-[0_25px_60px_rgba(13,59,68,.18)] sm:ml-14 sm:p-10">
        <p className="text-xs font-semibold tracking-[0.12em] text-[#8de0d5]">NEXT RESPONSE</p>
        <p className="font-display mt-6 text-balance text-[clamp(1.75rem,3vw,3.25rem)] font-medium leading-[1.12] tracking-[-0.04em]">Wait for my level and confirmation.</p>
        <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-5 text-sm"><span className="text-[#91aeb4]">Next session</span><span className="font-medium text-[#8de0d5]">Committed</span></div>
      </MarketingReveal>
    </div>
  );
}

export function TherapistVisual() {
  return (
    <div className="overflow-hidden rounded-[36px] bg-[#102332] p-3 text-white shadow-[0_34px_90px_rgba(13,59,68,.20)] sm:p-4" aria-label="Trade Therapist reflection cadence">
      <div className="grid gap-3 lg:grid-cols-12 lg:grid-rows-2">
        <MarketingReveal className="relative min-h-[470px] overflow-hidden rounded-[26px] bg-[radial-gradient(circle_at_15%_12%,#1b5b5c,transparent_62%)] p-8 sm:p-11 lg:col-span-7 lg:row-span-2">
          <p className="text-sm font-medium text-[#8de0d5]">Before the market</p>
          <p className="font-display mt-8 max-w-[560px] text-balance text-[clamp(2.2rem,3.6vw,4.2rem)] font-medium leading-[1.08] tracking-[-0.05em]">What will you repeat? What will you interrupt?</p>
          <div className="absolute bottom-8 left-8 right-8 rounded-[22px] border border-white/10 bg-[#0e2531]/75 p-5 backdrop-blur-sm sm:bottom-11 sm:left-11 sm:right-11 sm:p-6">
            <div className="flex items-center justify-between text-xs"><span className="text-[#8aa9ae]">Today&apos;s focus</span><span className="text-[#8de0d5]">Saved</span></div>
            <div className="mt-5 space-y-3"><span className="block h-2 w-[88%] rounded-full bg-white/15" /><span className="block h-2 w-[62%] rounded-full bg-white/10" /></div>
          </div>
        </MarketingReveal>

        <MarketingReveal delay={0.08} className="rounded-[26px] bg-[#173849] p-7 sm:p-9 lg:col-span-5">
          <div className="flex items-baseline justify-between gap-4"><p className="text-sm font-medium text-[#8de0d5]">After the market</p><span className="text-xs text-[#78959c]">SESSION</span></div>
          <p className="font-display mt-5 text-2xl font-semibold tracking-[-0.035em]">Examine the decisions.</p>
          <div aria-hidden="true" className="mt-8 flex h-20 items-end gap-2">
            {[38, 68, 48, 82, 62, 92].map((height, index) => <span key={height} className="flex-1 rounded-t-sm bg-[#61d0c5]" style={{ height: `${height}%`, opacity: 0.28 + index * 0.1 }} />)}
          </div>
        </MarketingReveal>

        <MarketingReveal delay={0.16} className="rounded-[26px] bg-[#dcefeb] p-7 text-[#153743] sm:p-9 lg:col-span-5">
          <div className="flex items-baseline justify-between gap-4"><p className="text-sm font-medium text-[#167c79]">Weekly review</p><span className="text-xs text-[#6b858b]">5 DAYS</span></div>
          <p className="font-display mt-5 text-2xl font-semibold tracking-[-0.035em]">Write the lesson down.</p>
          <div aria-hidden="true" className="mt-8 grid grid-cols-5 gap-2">
            {[true, true, false, true, true].map((complete, index) => <span key={index} className={`h-11 rounded-lg border ${complete ? "border-[#78c4bd] bg-[#b9e3dd]" : "border-[#bdd3d0] bg-white/35"}`} />)}
          </div>
        </MarketingReveal>
      </div>

      <div className="mt-3 grid gap-5 rounded-[26px] border border-white/10 bg-[#0d1c29] px-7 py-7 sm:grid-cols-[0.35fr_0.65fr] sm:items-center sm:px-10">
        <div><p className="text-sm font-medium text-[#8de0d5]">Monthly rollup</p><p className="font-display mt-2 text-xl font-semibold tracking-[-0.035em]">See what persists.</p></div>
        <div aria-hidden="true" className="grid grid-cols-4 gap-3">
          {[72, 46, 84, 58].map((width, index) => <div key={width} className="rounded-xl border border-white/10 p-3"><span className="text-[10px] text-[#78959c]">W{index + 1}</span><span className="mt-3 block h-1.5 rounded-full bg-white/10"><span className="block h-full rounded-full bg-[#59c9be]" style={{ width: `${width}%` }} /></span></div>)}
        </div>
      </div>
    </div>
  );
}

const marketEvents = [
  { day: "TUE", time: "08:30", event: "CPI release", note: "No entry before data" },
  { day: "WED", time: "14:00", event: "Rate decision", note: "Reduce exposure" },
  { day: "THU", time: "08:30", event: "Jobless claims", note: "Wait for structure" },
] as const;

export function MarketContextVisual() {
  return (
    <div className="overflow-hidden rounded-[34px] border border-[#193c48] bg-[#102332] text-white shadow-[0_30px_80px_rgba(18,62,71,.16)]" aria-label="Illustrative market event planning view">
      <div className="grid lg:grid-cols-[0.42fr_0.58fr]">
        <div className="relative overflow-hidden border-b border-white/10 p-8 sm:p-11 lg:border-b-0 lg:border-r lg:p-12">
          <div aria-hidden="true" className="absolute -bottom-24 -right-20 h-64 w-64 rounded-full bg-[#14b8a6]/10 blur-3xl" />
          <p className="text-sm font-medium text-[#8de0d5]">Market context</p>
          <p className="font-display relative mt-7 max-w-md text-balance text-[clamp(2.2rem,4vw,4.6rem)] font-semibold leading-[1.04] tracking-[-0.05em]">Know the event. Keep your plan.</p>
          <div className="relative mt-10 max-w-sm border-l-2 border-[#14b8a6] pl-5 text-sm leading-relaxed text-[#aac2c7]">Important releases sit beside the plan you already wrote.</div>
        </div>
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="flex items-center justify-between px-4 pb-5 pt-2 text-xs"><span className="font-semibold tracking-[0.14em] text-[#8aa5ab]">THIS WEEK</span><span className="text-[#65d4c8]">3 events</span></div>
          <div className="divide-y divide-white/10 border-y border-white/10">
            {marketEvents.map((item, index) => (
              <MarketingReveal key={item.event} delay={index * 0.08} className="grid grid-cols-[52px_64px_1fr] items-center gap-3 px-4 py-5 sm:grid-cols-[64px_78px_1fr] sm:gap-5">
                <span className="text-xs font-semibold tracking-[0.12em] text-[#719098]">{item.day}</span>
                <span className="font-display text-lg font-semibold tabular-nums text-[#8de0d5]">{item.time}</span>
                <span className="min-w-0"><span className="block font-medium">{item.event}</span><span className="mt-1 block text-xs text-[#829da3]">{item.note}</span></span>
              </MarketingReveal>
            ))}
          </div>
          <div className="mx-4 mt-5 flex items-center justify-between rounded-2xl bg-[#173849] px-5 py-4 text-sm"><span className="text-[#a9c0c5]">Plan status</span><span className="font-medium text-[#8de0d5]">Unchanged</span></div>
        </div>
      </div>
    </div>
  );
}
