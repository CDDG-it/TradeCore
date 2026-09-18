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

export function TradeComparison() {
  return (
    <div className="grid gap-5 md:grid-cols-2" aria-label="Two profitable trades requiring different reviews">
      <article className="marketing-flip-card border border-[#cedce0] bg-white p-7 shadow-[0_20px_50px_rgba(10,35,45,.06)] sm:p-9">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#55717b]">A planned entry</p>
        <p className="mt-10 font-display text-6xl font-semibold tracking-[-0.05em] text-[#0b1120]">+1.8R</p>
        <div className="mt-10 border-t border-[#dce6e9] pt-5 text-sm leading-relaxed text-[#425864]"><p>Waited for confirmation.</p><p>Risk stayed inside the plan.</p></div>
        <p className="mt-8 text-sm font-semibold text-[#087d74]">A decision worth repeating.</p>
      </article>
      <article className="marketing-flip-card border border-[#b8d9d6] bg-[#e4f3f1] p-7 shadow-[0_20px_50px_rgba(10,35,45,.06)] sm:p-9">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#0d756e]">An impulsive entry</p>
        <p className="mt-10 font-display text-6xl font-semibold tracking-[-0.05em] text-[#0b1120]">+1.8R</p>
        <div className="mt-10 border-t border-[#b8d9d6] pt-5 text-sm leading-relaxed text-[#244c53]"><p>Entered before confirmation.</p><p>Increased risk after a loss.</p></div>
        <p className="mt-8 text-sm font-semibold text-[#0d625e]">A result that deserves a closer look.</p>
      </article>
    </div>
  );
}

const scoreParts = [
  { name: "Rule adherence", weight: 35, width: 82 },
  { name: "Execution", weight: 20, width: 75 },
  { name: "Habit consistency", weight: 20, width: 67 },
  { name: "Reflection work", weight: 15, width: 71 },
  { name: "Goal progress", weight: 10, width: 74 },
] as const;

export function MindscoreVisual() {
  return (
    <div className="border border-[#cbdde0] bg-white p-7 shadow-[20px_20px_0_#dcebea] sm:p-10" aria-label="MC Mindscore combines rules, execution, habits, reflection and goal progress">
      <div className="flex items-baseline justify-between gap-4 border-b border-[#d9e5e7] pb-6"><p className="text-sm font-semibold text-[#0b1120]">MC Mindscore</p><p className="text-xs text-[#55727a]">Five measurable parts</p></div>
      <div className="mt-7 space-y-5">{scoreParts.map((part) => <div key={part.name}><div className="flex justify-between gap-4 text-sm"><span className="font-medium text-[#152e37]">{part.name}</span><span className="tabular-nums text-[#537079]">{part.weight}% weight</span></div><div className="mt-2 h-1.5 bg-[#e2eded]"><div className="h-full bg-[#14b8a6]" style={{ width: `${part.width}%` }} /></div></div>)}</div>
      <p className="mt-8 border-t border-[#d9e5e7] pt-5 text-sm leading-relaxed text-[#526a72]">Each part comes from the work you log. The goal portion reflects progress against the time in each active goal window.</p>
    </div>
  );
}

const reviewCards = [
  { title: "Before the market", body: "Revisit recent wins and losses. Write what you will repeat, prevent and focus on today." },
  { title: "After the market", body: "Record the best available trade and analyse what the session actually offered." },
  { title: "At the end of the week", body: "Write a review of mistakes, lessons and the plan that will prevent a repeat." },
  { title: "Across the month", body: "Read the monthly rollup of your weekly reviews to see which patterns persisted." },
] as const;

export function TherapistVisual() {
  return (
    <div className="grid gap-3 sm:grid-cols-2" aria-label="Trade Therapist exercise and review sequence">
      {reviewCards.map((card, index) => <article key={card.title} className={`marketing-review-card min-h-44 border border-white/15 p-6 shadow-[0_18px_36px_rgba(0,0,0,.18)] ${index === 1 ? "bg-[#173645] sm:translate-y-8" : index === 2 ? "bg-[#153145]" : "bg-[#16263a]"}`}>
        <div className="mb-10 h-px w-12 bg-[#57d2c6]" />
        <h3 className="font-display text-xl font-semibold tracking-tight text-white">{card.title}</h3>
        <p className="mt-3 text-sm leading-relaxed text-[#adc3ce]">{card.body}</p>
      </article>)}
    </div>
  );
}

export function MarketContextVisual() {
  return (
    <div className="border-l-2 border-[#14b8a6] pl-6 sm:pl-8" aria-label="Illustrative market event planning prompt">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#4b737a]">Before the open</p>
      <p className="mt-5 font-display text-3xl font-semibold leading-tight tracking-[-0.04em] text-[#0b1120] sm:text-4xl">Know the event.<br />Keep your plan.</p>
      <p className="mt-5 max-w-md text-base leading-relaxed text-[#587079]">Important market releases appear alongside your trading desk, where you prepare for the session.</p>
    </div>
  );
}
