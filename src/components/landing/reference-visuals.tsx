"use client";

import { useState } from "react";
import { ArrowDown, ArrowUpRight, BookOpenText, CalendarDays, Crosshair, NotebookPen, ShieldCheck, Sparkles } from "lucide-react";

const heroStates = [
  {
    label: "Plan followed",
    title: "A trade worth repeating.",
    note: "The setup was defined before the entry.",
    next: "Keep the conditions. Study the sample.",
    checks: [true, true, true, true, true, true],
  },
  {
    label: "Rule bent",
    title: "A win worth questioning.",
    note: "The entry came early and the risk changed.",
    next: "Find the moment the plan was left behind.",
    checks: [true, true, false, false, true, false],
  },
] as const;

const checkLabels = ["Read", "Level", "Entry", "Risk", "Exit", "Review"] as const;

export function HeroProcessVisual() {
  const [selected, setSelected] = useState(0);
  const current = heroStates[selected];

  return (
    <div className="relative mx-auto flex min-h-[430px] w-full max-w-[640px] items-center justify-center py-12 lg:min-h-[560px]" aria-label="Interactive example of a trade review">
      <div aria-hidden="true" className="pointer-events-none absolute inset-8 rounded-full bg-[#14B8A6]/25 blur-[100px]" />
      <div className="absolute left-0 top-5 z-20 rounded-xl border border-[#14B8A6]/35 bg-[#101C26]/95 px-4 py-3 shadow-[0_20px_50px_rgba(0,0,0,0.4)] sm:left-1 sm:top-12 lg:-left-7">
        <p className="font-body text-[10px] font-bold uppercase tracking-[0.16em] text-[#73CFC6]">Trade recorded</p>
        <p className="mt-1 font-heading text-lg font-black text-white">+$420 <span className="font-body text-xs font-medium text-[#A6B7C3]">example</span></p>
      </div>

      <div className="relative w-full max-w-[550px] rounded-2xl border border-[#5FE2D4]/45 bg-[#111B26] p-5 shadow-[0_0_0_1px_rgba(20,184,166,0.08),0_35px_95px_rgba(0,0,0,0.52),0_0_75px_rgba(20,184,166,0.14)] sm:p-7 lg:rotate-[-3deg] lg:transition-transform lg:duration-500 lg:hover:rotate-0 lg:focus-within:rotate-0">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
          <span className="font-body text-[10px] font-bold uppercase tracking-[0.22em] text-[#70CFC5]">Decision review</span>
          <span className="rounded-full border border-white/12 px-2 py-1 font-body text-[10px] text-[#B4C3CD]">Illustrative</span>
        </div>
        <div aria-live="polite">
          <p className="mt-6 font-heading text-[clamp(1.5rem,2.6vw,2.25rem)] font-black leading-tight text-white">{current.title}</p>
          <p className="mt-2 max-w-sm font-body text-sm leading-relaxed text-[#ACBEC9]">{current.note}</p>
          <div className="mt-7 grid grid-cols-3 gap-2 border-t border-white/10 pt-5 sm:grid-cols-6" aria-label="Six example decision checks">
            {current.checks.map((kept, index) => (
              <div key={checkLabels[index]} className="flex flex-col items-center gap-2">
                <span aria-label={`${checkLabels[index]} ${kept ? "followed" : "missed"}`} className={`grid h-10 w-full place-items-center rounded-md border font-heading text-sm font-black ${kept ? "border-[#14B8A6]/40 bg-[#14B8A6]/20 text-[#66D8CB]" : "border-[#E89A9A]/35 bg-[#E89A9A]/10 text-[#E9A9A9]"}`}>{kept ? "✓" : "×"}</span>
                <span className="font-body text-[10px] text-[#8FA5B3]">{checkLabels[index]}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Change the example trade">
          {heroStates.map((state, index) => (
            <button key={state.label} type="button" aria-pressed={selected === index} onClick={() => setSelected(index)} className={`min-h-10 rounded-lg border px-3 py-2 font-heading text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6] ${selected === index ? "border-[#14B8A6] bg-[#14B8A6] text-[#061319]" : "border-white/15 text-[#B8C8D1] hover:border-white/40 hover:text-white"}`}>{state.label}</button>
          ))}
        </div>
      </div>

      <div className="absolute -bottom-1 right-0 z-20 max-w-[250px] rounded-xl border border-[#14B8A6]/30 bg-[#13232A]/95 px-4 py-3 shadow-[0_20px_50px_rgba(0,0,0,0.42)] sm:bottom-3 lg:-right-4" aria-live="polite">
        <p className="font-body text-[10px] font-bold uppercase tracking-[0.16em] text-[#70CFC5]">What changes next</p>
        <p className="mt-1 font-body text-xs leading-relaxed text-white">{current.next}</p>
      </div>
    </div>
  );
}

const bridgeCases = [
  { label: "A profitable trade", result: "+$420", context: "The entry came before confirmation after a frustrating loss.", question: "What made waiting feel harder than usual?" },
  { label: "A losing trade", result: "−$165", context: "The setup was valid and the planned stop was respected.", question: "Would the same setup still deserve a place in your plan?" },
] as const;

export function DecisionBridge() {
  const [selected, setSelected] = useState(0);
  const current = bridgeCases[selected];
  return (
    <div className="w-full max-w-[520px]">
      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Choose a trade outcome">
        {bridgeCases.map((item, index) => (
          <button key={item.label} type="button" aria-pressed={selected === index} onClick={() => setSelected(index)} className={`min-h-10 rounded-full border px-4 py-2 font-heading text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6] ${selected === index ? "border-[#14B8A6] bg-[#14B8A6]/15 text-white" : "border-white/15 text-[#AABBC6] hover:border-white/40 hover:text-white"}`}>{item.label}</button>
        ))}
      </div>
      <div aria-live="polite" className="space-y-2">
        <div className="rounded-xl border border-white/10 bg-[#2A343D] p-5 sm:p-6">
          <p className="font-body text-xs font-bold uppercase tracking-[0.18em] text-[#A9BAC6]">A conventional journal</p>
          <p className="mt-3 font-heading text-2xl font-black text-white">{current.result}</p>
          <p className="mt-1 font-body text-xs text-[#A8B9C5]">Date. Instrument. Outcome. End of entry.</p>
        </div>
        <div className="flex justify-center py-1 text-[#5FE2D4]"><ArrowDown aria-hidden="true" className="h-5 w-5" /></div>
        <div className="rounded-xl border border-[#14B8A6]/40 bg-[#133029] p-5 shadow-[0_0_45px_rgba(20,184,166,0.10)] sm:p-6">
          <p className="font-body text-xs font-bold uppercase tracking-[0.18em] text-[#65D9CB]">The fuller TradingMC review</p>
          <p className="mt-3 font-heading text-base font-extrabold leading-relaxed text-white">{current.context}</p>
          <p className="mt-3 border-t border-white/10 pt-3 font-body text-sm leading-relaxed text-[#C2D2D3]">{current.question}</p>
        </div>
      </div>
    </div>
  );
}

const moments = [
  { label: "Before the open", icon: CalendarDays, cue: "Decide what deserves your attention before the first candle.", detail: "A pre-trade read gives a valid setup a clear shape before urgency enters the room.", pattern: [2, 5, 3, 6] },
  { label: "At the entry", icon: Crosshair, cue: "Know whether this is your setup or just a moving market.", detail: "A written condition can separate the trade you planned from the one you chased.", pattern: [6, 3, 5, 2] },
  { label: "After the exit", icon: NotebookPen, cue: "Capture the decision while the moment is still clear.", detail: "The result belongs beside execution notes, psychology and the lesson you would otherwise forget.", pattern: [2, 4, 4, 6] },
  { label: "Across the week", icon: BookOpenText, cue: "Notice which compromises repeat, even when P&L looks fine.", detail: "Patterns become easier to confront when trades and routines are reviewed together.", pattern: [3, 4, 2, 6] },
  { label: "Under pressure", icon: ShieldCheck, cue: "Give your rules a form you can actually follow.", detail: "Specific commitments turn a vague intention into a response you can review later.", pattern: [6, 5, 3, 4] },
  { label: "When context shifts", icon: Sparkles, cue: "Know which events could change the conditions of your plan.", detail: "The market calendar and wider data help you prepare without promising a prediction.", pattern: [3, 6, 4, 5] },
] as const;

export function MomentsGrid() {
  const [selected, setSelected] = useState(0);
  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" role="group" aria-label="Explore moments in the trading process">
        {moments.map((moment, index) => {
          const Icon = moment.icon;
          return (
            <button key={moment.label} type="button" aria-pressed={selected === index} onClick={() => setSelected(index)} className={`group flex min-h-[235px] flex-col rounded-xl border p-5 text-left transition-[border-color,background-color,transform] duration-200 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6] ${selected === index ? "border-[#14B8A6]/65 bg-[#1D302F]" : "border-white/10 bg-[#1B242E] hover:border-[#14B8A6]/35"}`}>
              <div className="flex h-[90px] items-start justify-between border-b border-white/10">
                <span className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-[#0B1720] text-[#6FD7CB]"><Icon aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} /></span>
                <span aria-hidden="true" className="flex h-16 items-end gap-1.5">
                  {moment.pattern.map((value, bar) => <span key={bar} className={`w-4 rounded-sm ${selected === index ? "bg-[#14B8A6]" : "bg-[#3B7777] group-hover:bg-[#14B8A6]"}`} style={{ height: `${value * 9}px` }} />)}
                </span>
              </div>
              <span className="mt-5 font-heading text-lg font-extrabold text-white">{moment.label}</span>
              <span className="mt-2 font-body text-sm leading-relaxed text-[#AABDC9]">{moment.cue}</span>
            </button>
          );
        })}
      </div>
      <div aria-live="polite" className="mt-5 flex flex-col gap-2 border-l-2 border-[#14B8A6] bg-[#13232A] px-5 py-4 sm:flex-row sm:items-baseline sm:gap-6">
        <span className="shrink-0 font-heading text-sm font-extrabold text-[#73DCCE]">{moments[selected].label} <ArrowUpRight aria-hidden="true" className="ml-1 inline h-3.5 w-3.5" /></span>
        <span className="font-body text-sm leading-relaxed text-[#CBD7D9]">{moments[selected].detail}</span>
      </div>
    </div>
  );
}
