"use client";

import { useState } from "react";

type Scene = {
  prompt: string;
  premise: string;
  choices: [
    { label: string; observation: string; next: string },
    { label: string; observation: string; next: string },
  ];
};

const scenes: Record<string, Scene> = {
  dashboard: {
    prompt: "What does this day actually say?",
    premise: "A day is more than its closing balance.",
    choices: [
      { label: "Prepared session", observation: "The plan was written, the setup was valid, and the routine was completed.", next: "Review the decision that made the process repeatable." },
      { label: "Reactive session", observation: "The result was positive, but the second entry broke the planned risk.", next: "Look at what changed between the first and second trade." },
    ],
  },
  journal: {
    prompt: "Which trade would you repeat?",
    premise: "Result and execution can tell different stories.",
    choices: [
      { label: "A planned loss", observation: "The setup met your conditions. The stop was respected.", next: "Keep the process; review the setup over a larger sample." },
      { label: "An impulsive win", observation: "The trade paid, but the entry came before confirmation.", next: "Write down the trigger that made waiting feel difficult." },
    ],
  },
  analysis: {
    prompt: "What happens when the level is tested?",
    premise: "An advance plan gives both outcomes a place.",
    choices: [
      { label: "Level holds", observation: "Price returns above the level after a clean test.", next: "Wait for the confirmation your long scenario requires." },
      { label: "Level fails", observation: "Price accepts below the level and the original bias weakens.", next: "Stand aside or use the alternative scenario you wrote before the open." },
    ],
  },
  analytics: {
    prompt: "Which pattern deserves attention?",
    premise: "The same history can be read through different lenses.",
    choices: [
      { label: "Results", observation: "The week was profitable, carried by two large winners.", next: "Check whether the gains came from setups you can identify and repeat." },
      { label: "Execution", observation: "Four of seven entries followed the written setup. The rest came late.", next: "Examine late entries before changing the strategy itself." },
    ],
  },
  accounts: {
    prompt: "What does the account allow today?",
    premise: "Risk needs context before a position is opened.",
    choices: [
      { label: "Evaluation account", observation: "The remaining drawdown is narrow after two losing sessions.", next: "Size the next idea against the limit, not against the payout target." },
      { label: "Funded account", observation: "The account has room, but a payout window is close.", next: "Keep the written risk rule visible before increasing exposure." },
    ],
  },
  habits: {
    prompt: "What changes when the routine changes?",
    premise: "Preparation is a behavior you can observe.",
    choices: [
      { label: "Routine kept", observation: "The market read and pre-session pause were completed.", next: "Notice whether the first entry matched the plan you prepared." },
      { label: "Routine skipped", observation: "The first entry arrived before a market read was written.", next: "Ask what made the routine easy to skip today." },
    ],
  },
  "news-city": {
    prompt: "What belongs in the plan?",
    premise: "Illustrative events, not live market data.",
    choices: [
      { label: "Inflation release", observation: "A scheduled data release can quickly change rate expectations.", next: "Mark the release window and decide when your setup is still valid." },
      { label: "Rate decision", observation: "The announcement and press conference can create separate volatility windows.", next: "Define in advance when you will stand aside." },
    ],
  },
  "psychological-edge": {
    prompt: "Is the rule useful under pressure?",
    premise: "A personal edge needs a definition you can check.",
    choices: [
      { label: "Rule kept", observation: "You waited for confirmation even after missing the first move.", next: "Keep this condition in the playbook and review its longer-term sample." },
      { label: "Rule bent", observation: "You entered early because the move felt like it was leaving.", next: "Name the pressure point and make the confirmation rule more explicit." },
    ],
  },
  "trade-therapist": {
    prompt: "Which moment deserves a closer look?",
    premise: "A useful exercise starts from a specific decision.",
    choices: [
      { label: "After a loss", observation: "The next position was opened faster and at a larger size.", next: "What were you trying to recover: the setup or the feeling of being wrong?" },
      { label: "At the exit", observation: "The stop was moved after price came close to it.", next: "What information changed, and what discomfort were you trying to avoid?" },
    ],
  },
};

export function FeatureScene({ slug }: { slug: string }) {
  const [selected, setSelected] = useState(0);
  const scene = scenes[slug];
  if (!scene) return null;
  const active = scene.choices[selected];

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#101D2C] text-white shadow-[0_28px_80px_rgba(0,0,0,0.22)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-6 py-4">
        <span className="font-body text-xs font-bold uppercase tracking-[0.2em] text-[#5FE2D4]">Explore a scenario</span>
        <span className="font-body text-xs text-[#90A9B8]">Illustrative example</span>
      </div>
      <div className="grid md:grid-cols-[0.45fr_0.55fr]">
        <div className="border-b border-white/10 p-6 sm:p-9 md:border-b-0 md:border-r">
          <p className="font-heading text-[clamp(1.7rem,3vw,2.8rem)] font-black leading-tight tracking-tight">{scene.prompt}</p>
          <p className="mt-3 font-body text-sm leading-relaxed text-[#AABCCB]">{scene.premise}</p>
          <div className="mt-9 flex flex-wrap gap-2" role="group" aria-label={scene.prompt}>
            {scene.choices.map((item, index) => (
              <button key={item.label} type="button" aria-pressed={selected === index} onClick={() => setSelected(index)} className={`min-h-11 rounded-lg border px-4 py-2.5 text-left font-heading text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6] ${selected === index ? "border-[#14B8A6] bg-[#14B8A6]/15 text-white" : "border-white/15 text-[#AFC0CD] hover:border-white/40 hover:text-white"}`}>{item.label}</button>
            ))}
          </div>
        </div>
        <div aria-live="polite" className="flex min-h-[280px] flex-col justify-between p-6 sm:p-9">
          <div>
            <p className="font-body text-xs font-bold uppercase tracking-[0.2em] text-[#87A6B9]">What stands out</p>
            <p className="mt-4 max-w-lg font-heading text-[clamp(1.5rem,2.7vw,2.3rem)] font-extrabold leading-tight">{active.observation}</p>
          </div>
          <div className="mt-9 border-l-2 border-[#14B8A6] pl-5">
            <p className="font-body text-xs font-bold uppercase tracking-[0.2em] text-[#5FE2D4]">The next question</p>
            <p className="mt-2 max-w-lg font-body text-sm leading-relaxed text-[#B9C9D4]">{active.next}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
