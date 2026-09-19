/** Read-only product compositions for the public page. All content is illustrative. */

import { DrawLine, DrawPath, GrowBar, MarketingReveal, PinReveal } from "@/components/landing/marketing-motion";

const processDetails = [
  { title: "Commitment", meta: "IF / THEN", value: "After a loss, wait for fresh confirmation." },
  { title: "Habits", meta: "REPEAT", value: "Plan · Review · Reset" },
  { title: "Goal", meta: "MEASURE", value: "Execution 75% → 85%" },
] as const;

const processTrack = [["Plan", "Written"], ["Commit", "Specific"], ["Repeat", "Tracked"], ["Measure", "Visible"]] as const;

export function ProcessCanvas() {
  return (
    <div className="relative overflow-hidden rounded-[32px] bg-[#102b37] text-white shadow-[0_34px_90px_rgba(13,59,68,.18)]" aria-label="A trading plan connected to a commitment, habits and a goal">
      <div aria-hidden="true" className="absolute -left-28 bottom-[-170px] h-[440px] w-[440px] rounded-full border border-[#55c7bd]/20 shadow-[0_0_0_46px_rgba(85,199,189,.035),0_0_0_96px_rgba(85,199,189,.025)]" />
      <div className="relative grid lg:grid-cols-[1.08fr_0.92fr]">
        <MarketingReveal className="flex min-h-[430px] flex-col justify-between border-b border-white/10 p-8 sm:p-12 lg:border-b-0 lg:border-r lg:p-14">
          <div>
            <p className="text-sm font-medium text-[#80d9cf]">The trading plan</p>
            <p className="font-display mt-9 max-w-[690px] text-balance text-[clamp(2.5rem,4.8vw,5.4rem)] font-semibold leading-[1.02] tracking-[-0.055em]">Wait for price to hit my level of interest.</p>
          </div>
          <div className="mt-12 grid max-w-xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 text-sm">
            <div className="bg-[#102b37]/90 p-4"><span className="block text-[#7e9ea5]">Setup</span><span className="mt-1 block font-medium">Planned pullback</span></div>
            <div className="bg-[#102b37]/90 p-4"><span className="block text-[#7e9ea5]">Risk</span><span className="mt-1 block font-medium">Defined before entry</span></div>
          </div>
        </MarketingReveal>

        <div className="relative p-8 sm:p-12 lg:p-14">
          <DrawLine axis="y" delay={0.2} duration={1.1} className="absolute bottom-16 left-[3.65rem] top-16 block w-px bg-gradient-to-b from-[#59d2c6]/10 via-[#59d2c6]/65 to-[#59d2c6]/10" />
          <div className="space-y-7">
            {processDetails.map((step, index) => (
              <MarketingReveal key={step.title} delay={0.12 + index * 0.1} distance={18} className="relative grid grid-cols-[42px_1fr] gap-5">
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
        <DrawLine axis="x" delay={0.1} duration={1.2} className="absolute left-[12.5%] right-[12.5%] top-[30px] block h-px bg-[#84bdb8]" />
        {processTrack.map(([label, state], index) => (
          <MarketingReveal key={label} delay={0.15 + index * 0.18} distance={8} className="relative">
            <span aria-hidden="true" className="relative mx-auto mb-3 block h-3 w-3 rounded-full border-2 border-[#dff2ef] bg-[#148f87] ring-1 ring-[#148f87]" />
            <span className="block text-[#153b46]">{label}</span><span className="mt-1 block font-normal text-[#638087]">{state}</span>
          </MarketingReveal>
        ))}
      </div>
    </div>
  );
}

export const reviewSteps = [
  { label: "Pattern seen", meta: "Journal" },
  { label: "Best trade of the day", meta: "Verdict" },
  { label: "Next response", meta: "Commitment" },
] as const;

/* The session's price path, drawn in a 640x240 box. The trade that was taken
   enters early after a loss; the best trade on offer waits for the planned level. */
const sessionPath = "M0,118 L30,108 L60,120 L90,98 L110,104 L130,88 L150,112 L180,104 L200,128 L225,146 L250,138 L275,160 L300,150 L330,166 L360,158 L380,150 L400,140 L420,118 L450,126 L480,96 L510,104 L540,78 L570,86 L600,60 L640,48";
const takenPoint = { x: 180 / 6.4, y: 104 / 2.4 };
const bestPoint = { x: 380 / 6.4, y: 150 / 2.4 };

export function ReviewCanvas() {
  return (
    <div className="overflow-hidden rounded-[32px] border border-[#193c48] bg-[#102332] text-white shadow-[0_30px_80px_rgba(18,62,71,.18)]" aria-label="A session review: the trade taken, the best trade that was on offer, and the response for the next session">
      <MarketingReveal distance={12} className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-6 py-4 text-xs sm:px-8">
        <span className="flex items-center gap-3"><span className="font-semibold tracking-[0.14em] text-[#8aa5ab]">SESSION REVIEW</span><span className="text-[#65d4c8]">Tue 16 Sep</span></span>
        <span className="text-[#829da3]">2 trades taken · 1 better trade on offer</span>
      </MarketingReveal>

      <div className="relative px-4 pb-4 pt-8 sm:px-8 sm:pt-10">
        <div className="relative aspect-[16/10] w-full sm:aspect-[8/3]" aria-hidden="true">
          <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 640 240" preserveAspectRatio="none">
            <DrawPath d={sessionPath} stroke="#59d2c6" strokeWidth={2} delay={0.1} duration={1.5} className="[vector-effect:non-scaling-stroke]" />
          </svg>
          {/* The planned level, drawn once price has come back to it. */}
          <div className="absolute left-[39%] right-0 flex items-center" style={{ top: `${152 / 2.4}%` }}>
            <DrawLine axis="x" delay={0.7} duration={0.8} className="block h-px flex-1 bg-[repeating-linear-gradient(90deg,#8de0d5_0_6px,transparent_6px_12px)] opacity-70" />
          </div>
          <PinReveal delay={1.0} origin="right center" className="absolute right-0 -translate-y-1/2" style={{ top: `${152 / 2.4}%` }}>
            <span className="-mr-2 hidden rounded-md bg-[#173849] px-2 py-1 text-[10px] font-semibold tracking-[0.12em] text-[#8de0d5] sm:block">PLANNED LEVEL</span>
          </PinReveal>

          {/* The trade that was taken: early, after a loss. */}
          <PinReveal delay={0.55} origin="center bottom" className="absolute -translate-x-1/2 -translate-y-full" style={{ left: `${takenPoint.x}%`, top: `${takenPoint.y}%` }}>
            <div className="mb-2 whitespace-nowrap rounded-xl border border-[#ef4444]/35 bg-[#0d1c29] px-3 py-2 text-left shadow-[0_12px_30px_rgba(0,0,0,.35)]">
              <span className="block text-[10px] font-semibold tracking-[0.12em] text-[#f08c8c]">TAKEN · 09:42</span>
              <span className="mt-0.5 block text-xs font-medium sm:text-sm">Early, after a loss <span className="ml-1 tabular-nums text-[#f08c8c]">-1R</span></span>
            </div>
            <span className="mx-auto block h-3 w-3 rounded-full border-2 border-[#102332] bg-[#ef4444] ring-2 ring-[#ef4444]/40" />
          </PinReveal>

          {/* The best trade on offer: at the level, after confirmation. */}
          <PinReveal delay={1.35} origin="center top" className="absolute -translate-x-1/2" style={{ left: `${bestPoint.x}%`, top: `${bestPoint.y}%`, marginTop: "-6px" }}>
            <span className="mx-auto block h-3 w-3 rounded-full border-2 border-[#102332] bg-[#22c55e] ring-2 ring-[#22c55e]/40" />
            <div className="mt-2 whitespace-nowrap rounded-xl border border-[#22c55e]/35 bg-[#0d1c29] px-3 py-2 text-left shadow-[0_12px_30px_rgba(0,0,0,.35)]">
              <span className="block text-[10px] font-semibold tracking-[0.12em] text-[#7ee0a4]">BEST TRADE · 10:35</span>
              <span className="mt-0.5 block text-xs font-medium sm:text-sm">At the level, confirmed <span className="ml-1 tabular-nums text-[#7ee0a4]">+2.4R</span></span>
            </div>
          </PinReveal>
        </div>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-[1.1fr_0.9fr] sm:p-5">
        <MarketingReveal delay={1.5} distance={16} className="rounded-[24px] border border-white/10 bg-[#0d1c29] p-6 sm:p-7">
          <p className="text-[10px] font-semibold tracking-[0.14em] text-[#8de0d5]">BEST TRADE OF THE DAY</p>
          <p className="font-display mt-3 text-xl font-semibold tracking-[-0.035em] sm:text-2xl">Was your trade the best trade?</p>
          <div className="mt-5 space-y-2 text-sm">
            <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 px-4 py-3 text-[#8aa5ab]"><span>Yes, I took the best available trade</span><span aria-hidden="true" className="h-4 w-4 rounded-full border border-white/20" /></div>
            <MarketingReveal delay={1.9} distance={6} className="flex items-center justify-between gap-4 rounded-xl border border-[#14b8a6]/60 bg-[#14b8a6]/10 px-4 py-3 font-medium text-white">
              <span>No, a better trade was on offer</span>
              <span aria-hidden="true" className="grid h-4 w-4 place-items-center rounded-full bg-[#14b8a6] text-[10px] font-bold text-[#081721]">✓</span>
            </MarketingReveal>
          </div>
          <p className="mt-5 text-xs leading-relaxed text-[#9db6bb] sm:text-sm"><span className="font-semibold text-[#c6dcdf]">Why it was better:</span> the cleaner level, confirmation first, and room to the target.</p>
        </MarketingReveal>

        <MarketingReveal delay={1.7} distance={16} className="flex flex-col justify-between rounded-[24px] bg-[#173849] p-6 sm:p-7">
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
  { label: "Before the market", meta: "Daily" },
  { label: "After the market", meta: "Session" },
  { label: "Weekly review", meta: "5 days" },
  { label: "Monthly rollup", meta: "Persistent" },
] as const;

export function TherapistVisual() {
  return (
    <div className="grid gap-4 sm:grid-cols-2" aria-label="Trade Therapist reflection cadence">
      <MarketingReveal className="relative min-h-[440px] overflow-hidden rounded-[28px] bg-[#102332] bg-[radial-gradient(circle_at_15%_12%,#1b5b5c,transparent_62%)] p-8 text-white shadow-[0_34px_90px_rgba(13,59,68,.20)] sm:col-span-2 sm:p-11">
        <div className="flex items-baseline justify-between gap-4"><p className="text-sm font-medium text-[#8de0d5]">Before the market</p><span className="text-xs text-[#78959c]">DAILY</span></div>
        <p className="font-display mt-8 max-w-[560px] text-balance text-[clamp(2.2rem,3.6vw,4.2rem)] font-medium leading-[1.08] tracking-[-0.05em]">What will you repeat? What will you interrupt?</p>
        <div className="absolute bottom-8 left-8 right-8 rounded-[22px] border border-white/10 bg-[#0e2531]/75 p-5 backdrop-blur-sm sm:bottom-11 sm:left-11 sm:right-11 sm:p-6">
          <div className="flex items-center justify-between text-xs"><span className="text-[#8aa9ae]">Today&apos;s focus</span><span className="text-[#8de0d5]">Saved</span></div>
          <div className="mt-5 space-y-3">
            <GrowBar axis="x" delay={0.35} className="block h-2 w-[88%] rounded-full bg-white/15" />
            <GrowBar axis="x" delay={0.45} className="block h-2 w-[62%] rounded-full bg-white/10" />
          </div>
        </div>
      </MarketingReveal>

      <MarketingReveal delay={0.08} className="rounded-[28px] bg-[#173849] p-7 text-white shadow-[0_24px_60px_rgba(13,59,68,.16)] sm:p-9">
        <div className="flex items-baseline justify-between gap-4"><p className="text-sm font-medium text-[#8de0d5]">After the market</p><span className="text-xs text-[#78959c]">SESSION</span></div>
        <p className="font-display mt-5 text-2xl font-semibold tracking-[-0.035em]">Examine the decisions.</p>
        <div aria-hidden="true" className="mt-8 flex h-20 items-end gap-2">
          {[38, 68, 48, 82, 62, 92].map((height, index) => <span key={height} className="flex-1" style={{ height: `${height}%`, opacity: 0.28 + index * 0.1 }}><GrowBar delay={0.25 + index * 0.06} className="block h-full w-full rounded-t-sm bg-[#61d0c5]" /></span>)}
        </div>
      </MarketingReveal>

      <MarketingReveal delay={0.16} className="rounded-[28px] border border-[#bfdcd7] bg-[#dcefeb] p-7 text-[#153743] sm:p-9">
        <div className="flex items-baseline justify-between gap-4"><p className="text-sm font-medium text-[#167c79]">Weekly review</p><span className="text-xs text-[#6b858b]">5 DAYS</span></div>
        <p className="font-display mt-5 text-2xl font-semibold tracking-[-0.035em]">Write the lesson down.</p>
        <div aria-hidden="true" className="mt-8 grid grid-cols-5 gap-2">
          {[true, true, false, true, true].map((complete, index) => <MarketingReveal key={index} delay={0.3 + index * 0.06} distance={10} className={`h-11 rounded-lg border ${complete ? "border-[#78c4bd] bg-[#b9e3dd]" : "border-[#bdd3d0] bg-white/35"}`}><span className="sr-only">{complete ? "Reviewed" : "Missed"}</span></MarketingReveal>)}
        </div>
      </MarketingReveal>

      <MarketingReveal delay={0.24} className="grid gap-5 rounded-[28px] border border-white/10 bg-[#0d1c29] px-7 py-7 text-white sm:col-span-2 sm:grid-cols-[0.35fr_0.65fr] sm:items-center sm:px-10">
        <div><p className="text-sm font-medium text-[#8de0d5]">Monthly rollup</p><p className="font-display mt-2 text-xl font-semibold tracking-[-0.035em]">See what persists.</p></div>
        <div aria-hidden="true" className="grid grid-cols-4 gap-3">
          {[72, 46, 84, 58].map((width, index) => <div key={width} className="rounded-xl border border-white/10 p-3"><span className="text-[10px] text-[#78959c]">W{index + 1}</span><span className="mt-3 block h-1.5 overflow-hidden rounded-full bg-white/10"><GrowBar axis="x" delay={0.4 + index * 0.08} className="block h-full rounded-full bg-[#59c9be]" style={{ width: `${width}%` }} /></span></div>)}
        </div>
      </MarketingReveal>
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
    <div className="overflow-hidden rounded-[32px] border border-[#193c48] bg-[#102332] text-white shadow-[0_30px_80px_rgba(18,62,71,.16)]" aria-label="Illustrative market event planning view">
      <div className="grid lg:grid-cols-[0.42fr_0.58fr]">
        <MarketingReveal className="relative overflow-hidden border-b border-white/10 p-8 sm:p-11 lg:border-b-0 lg:border-r lg:p-12">
          <div aria-hidden="true" className="absolute -bottom-24 -right-20 h-64 w-64 rounded-full bg-[#14b8a6]/10 blur-3xl" />
          <p className="text-sm font-medium text-[#8de0d5]">Market context</p>
          <p className="font-display relative mt-7 max-w-md text-balance text-[clamp(2.2rem,4vw,4.6rem)] font-semibold leading-[1.04] tracking-[-0.05em]">Know the event. Keep your plan.</p>
          <div className="relative mt-10 max-w-sm border-l-2 border-[#14b8a6] pl-5 text-sm leading-relaxed text-[#aac2c7]">Important releases sit beside the plan you already wrote.</div>
        </MarketingReveal>
        <div className="p-4 sm:p-6 lg:p-8">
          <MarketingReveal delay={0.1} distance={10} className="flex items-center justify-between px-4 pb-5 pt-2 text-xs"><span className="font-semibold tracking-[0.14em] text-[#8aa5ab]">THIS WEEK</span><span className="text-[#65d4c8]">3 events</span></MarketingReveal>
          <div className="divide-y divide-white/10 border-y border-white/10">
            {marketEvents.map((item, index) => (
              <MarketingReveal key={item.event} delay={0.18 + index * 0.08} distance={14} className="grid grid-cols-[52px_64px_1fr] items-center gap-3 px-4 py-5 sm:grid-cols-[64px_78px_1fr] sm:gap-5">
                <span className="text-xs font-semibold tracking-[0.12em] text-[#719098]">{item.day}</span>
                <span className="font-display text-lg font-semibold tabular-nums text-[#8de0d5]">{item.time}</span>
                <span className="min-w-0"><span className="block font-medium">{item.event}</span><span className="mt-1 block text-xs text-[#829da3]">{item.note}</span></span>
              </MarketingReveal>
            ))}
          </div>
          <MarketingReveal delay={0.45} distance={10} className="mx-4 mt-5 flex items-center justify-between rounded-2xl bg-[#173849] px-5 py-4 text-sm"><span className="text-[#a9c0c5]">Plan status</span><span className="font-medium text-[#8de0d5]">Unchanged</span></MarketingReveal>
        </div>
      </div>
    </div>
  );
}
