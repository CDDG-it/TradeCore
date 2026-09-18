/** Read-only product compositions for the public page. All content is illustrative. */

import { MarketingReveal } from "@/components/landing/marketing-motion";

const processDetails = [
  { title: "Commitments", detail: "Turn a recurring mistake into a specific if/then response.", value: "After a loss, wait for fresh confirmation." },
  { title: "Habits", detail: "Check whether the routine around trading actually happens.", value: "Prepare · Review · Reset" },
  { title: "Goals", detail: "Set a target against the data you already collect.", value: "Execution rate · 75% toward 85%" },
] as const;

export function ProcessCanvas() {
  return (
    <div className="marketing-process-canvas relative overflow-hidden rounded-[32px] bg-[#102433] text-white shadow-[0_34px_90px_rgba(13,59,68,.16)]" aria-label="A trading plan with commitments, habits and goals">
      <div className="grid lg:grid-cols-[1.08fr_0.92fr]">
        <MarketingReveal className="relative flex min-h-[360px] flex-col justify-between overflow-hidden bg-[radial-gradient(circle_at_10%_10%,#1d5a5c,transparent_70%)] p-8 sm:p-12 lg:min-h-[460px] lg:p-14">
          <div aria-hidden="true" className="absolute -bottom-32 -right-24 h-80 w-80 rounded-full border border-[#75d0c5]/20 shadow-[0_0_0_42px_rgba(117,208,197,.04),0_0_0_88px_rgba(117,208,197,.03)]" />
          <p className="relative text-sm font-medium text-[#8de0d5]">The trading plan</p>
          <div className="relative mt-16">
            <p className="font-display max-w-[540px] text-balance text-[clamp(2.6rem,4.5vw,5.4rem)] font-semibold leading-[1.03] tracking-[-0.055em]">Wait for the planned ES level.</p>
            <p className="mt-7 max-w-md text-base leading-relaxed text-[#bdd3d4]">Name your setup, risk and conditions before the market tests them.</p>
          </div>
        </MarketingReveal>
        <div className="flex flex-col divide-y divide-white/10 border-t border-white/10 bg-[#172d3b] lg:border-l lg:border-t-0">
          {processDetails.map((step, index) => (
            <MarketingReveal key={step.title} delay={0.1 + index * 0.1} className="flex flex-1 flex-col justify-center px-8 py-8 sm:px-12 lg:py-6">
              <p className="text-sm font-medium text-[#8de0d5]">{step.title}</p>
              <p className="font-display mt-3 text-2xl font-semibold leading-tight tracking-[-0.035em] text-white sm:text-3xl">{step.value}</p>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-[#b0c9cc]">{step.detail}</p>
            </MarketingReveal>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ReviewActionVisual() {
  return (
    <div className="relative mx-auto max-w-[1120px]" aria-label="An example reflection leading to a commitment for the next session">
      <MarketingReveal className="max-w-[900px] border-l-2 border-[#14b8a6] pl-7 sm:pl-10">
        <blockquote className="font-display text-balance text-[clamp(2rem,4.1vw,4.6rem)] font-medium leading-[1.13] tracking-[-0.05em] text-[#102b37]">“I entered early after the first loss because I wanted the day back.”</blockquote>
      </MarketingReveal>
      <div aria-hidden="true" className="ml-7 h-16 w-px bg-[#14b8a6] sm:ml-10 sm:h-20" />
      <MarketingReveal delay={0.16} className="relative ml-7 max-w-[760px] rounded-[28px] bg-[#102d3c] p-8 text-white shadow-[0_25px_60px_rgba(13,59,68,.16)] sm:ml-auto sm:p-11">
        <p className="text-sm font-medium text-[#8de0d5]">The next session</p>
        <p className="font-display mt-4 text-balance text-[clamp(1.7rem,3vw,3.2rem)] font-medium leading-[1.2] tracking-[-0.035em]">If I take a loss, I wait for my level and confirmation before entering again.</p>
      </MarketingReveal>
    </div>
  );
}

export function TherapistVisual() {
  return (
    <div className="overflow-hidden rounded-[32px] bg-[#102332] text-white shadow-[0_34px_90px_rgba(13,59,68,.20)]" aria-label="Trade Therapist exercise and review sequence">
      <div className="grid lg:grid-cols-[1.18fr_0.82fr]">
        <div className="relative min-h-[360px] overflow-hidden bg-[radial-gradient(circle_at_20%_20%,#174f53,transparent_65%)] p-8 sm:p-12 lg:p-16">
          <div aria-hidden="true" className="absolute bottom-[-125px] right-[-100px] h-80 w-80 rounded-full border border-[#4caaa6]/25 shadow-[0_0_0_35px_rgba(73,170,166,.05),0_0_0_80px_rgba(73,170,166,.04)]" />
          <p className="text-sm font-medium text-[#85d9d0]">Before the market</p>
          <blockquote className="font-display relative mt-12 max-w-[590px] text-balance text-[clamp(2rem,3.4vw,3.5rem)] font-medium leading-[1.13] tracking-[-0.045em]">“What will I repeat from my best trade, and what will I interrupt from my worst?”</blockquote>
          <p className="relative mt-12 max-w-md border-l-2 border-[#60c9bf] pl-5 text-sm leading-relaxed text-[#b5cfd0]">Start the session with a specific focus instead of a vague intention to do better.</p>
        </div>
        <div className="flex flex-col divide-y divide-white/10 bg-[#142b3b]">
          <div className="flex-1 p-8 sm:p-10"><p className="text-sm font-medium text-[#85d9d0]">After the market</p><h3 className="font-display mt-5 text-2xl font-semibold tracking-[-0.035em]">Examine the session.</h3><p className="mt-3 max-w-sm text-sm leading-relaxed text-[#bed0d5]">Record the best available trade and analyse the decisions you actually made.</p></div>
          <div className="flex-1 p-8 sm:p-10"><p className="text-sm font-medium text-[#85d9d0]">At the end of the week</p><h3 className="font-display mt-5 text-2xl font-semibold tracking-[-0.035em]">Write the lesson down.</h3><p className="mt-3 max-w-sm text-sm leading-relaxed text-[#bed0d5]">Review mistakes, progress and the plan you will take into the next week.</p></div>
        </div>
      </div>
      <div className="flex flex-col gap-4 border-t border-white/10 bg-[#d9eeeb] px-8 py-8 text-[#173744] sm:flex-row sm:items-center sm:gap-10 sm:px-12"><p className="font-display shrink-0 text-xl font-semibold tracking-[-0.035em]">Across the month</p><p className="max-w-2xl text-sm leading-relaxed text-[#3d6068]">Your weekly reviews come together in a monthly overview, making recurring patterns easier to see. The overview is a summary, not another writing exercise.</p></div>
    </div>
  );
}

export function MarketContextVisual() {
  return (
    <div className="border-l-2 border-[#14b8a6] pl-6 sm:pl-8" aria-label="Illustrative market event planning prompt">
      <p className="font-display text-3xl font-semibold leading-tight tracking-[-0.04em] text-[#0b1120] sm:text-4xl">Know the event.<br />Keep your plan.</p>
      <p className="mt-5 max-w-md text-base leading-relaxed text-[#587079]">Important market releases appear alongside your trading desk, where you prepare for the session.</p>
    </div>
  );
}
