/** Read-only product compositions for the public page. All content is illustrative. */

const steps = [
  { title: "The plan", detail: "Name your setup, risk and conditions before the market tests them.", value: "Wait for the planned ES level" },
  { title: "The commitment", detail: "Turn a recurring mistake into a specific if/then response.", value: "If I take a loss, I wait for a fresh confirmation." },
  { title: "The habits", detail: "Check whether the routine around trading actually happens.", value: "Pre-market plan · Review · Reset" },
  { title: "The goal", detail: "Set a target against the data you already collect.", value: "Execution rate · 75% toward 85%" },
] as const;

export function ProcessStack() {
  return (
    <div className="marketing-stack relative mx-auto w-full max-w-[590px] pb-10 pt-6" aria-label="A sample trading plan, commitment, habits and goal">
      {steps.map((step, index) => (
        <article key={step.title} className={`marketing-stack-card relative border border-white/15 bg-[#162337] p-6 shadow-[0_22px_48px_rgba(0,0,0,.26)] sm:p-7 ${index === 0 ? "rotate-[-3deg]" : index === 1 ? "ml-5 -mt-2 rotate-[2deg] sm:ml-10" : index === 2 ? "ml-2 -mt-2 rotate-[-1deg] sm:ml-5" : "ml-8 -mt-2 rotate-[2deg] sm:ml-16"}`} style={{ zIndex: index + 1 }}>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#66d6ca]">{step.title}</p>
          <p className="mt-3 text-lg font-semibold tracking-tight text-white sm:text-xl">{step.value}</p>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-[#a9bbc5]">{step.detail}</p>
        </article>
      ))}
    </div>
  );
}

const scoreParts = [
  { name: "Rule adherence", weight: 35, color: "bg-[#174657]" },
  { name: "Execution", weight: 20, color: "bg-[#0d817c]" },
  { name: "Habit consistency", weight: 20, color: "bg-[#14b8a6]" },
  { name: "Reflection work", weight: 15, color: "bg-[#06b6d4]" },
  { name: "Goal progress", weight: 10, color: "bg-[#91dfd5]" },
] as const;

export function MindscoreVisual() {
  return (
    <div className="relative overflow-hidden rounded-[32px] border border-[#cbdedf] bg-white p-7 shadow-[0_30px_75px_rgba(24,81,86,.10)] sm:p-10" aria-label="MC Mindscore weighting: rule adherence 35 percent, execution 20 percent, habit consistency 20 percent, reflection work 15 percent, goal progress 10 percent">
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#c5f5ec]/50 blur-3xl" />
      <div className="relative flex flex-wrap items-center justify-between gap-3 border-b border-[#dce9e8] pb-6"><p className="font-display text-2xl font-semibold tracking-[-0.04em] text-[#0b1120]">MC Mindscore</p><p className="text-sm text-[#527078]">How the score is built</p></div>
      <div className="relative grid items-center gap-9 py-9 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] sm:gap-5">
        <div className="marketing-score-wheel mx-auto grid h-48 w-48 place-items-center rounded-full sm:h-52 sm:w-52" aria-hidden="true"><div className="grid h-[72%] w-[72%] place-items-center rounded-full bg-white text-center shadow-[0_5px_20px_rgba(19,80,87,.08)]"><span className="font-display text-3xl font-semibold leading-none tracking-[-0.06em] text-[#102a37]">MC<span className="block mt-2 text-sm font-medium tracking-normal text-[#617983]">Mindscore</span></span></div></div>
        <dl className="space-y-4">{scoreParts.map((part) => <div key={part.name} className="flex items-center gap-3"><span aria-hidden="true" className={`h-2.5 w-2.5 shrink-0 rounded-full ${part.color}`} /><dt className="min-w-0 flex-1 text-sm font-medium text-[#253e48]">{part.name}</dt><dd className="font-display text-xl font-semibold tabular-nums tracking-[-0.04em] text-[#122e39]">{part.weight}%</dd></div>)}</dl>
      </div>
      <p className="relative border-t border-[#dce9e8] pt-5 text-sm leading-relaxed text-[#536e77]">Active goals are measured against their timeline. If a part has no measurable data, its weight is shared across the others.</p>
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
