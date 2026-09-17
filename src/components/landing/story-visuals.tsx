"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Check, RotateCcw } from "lucide-react";

const choice = "min-h-11 rounded-lg border px-4 py-2.5 text-left font-heading text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]";

export function StoryReveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? false : { y: 16 }}
      whileInView={reduced ? undefined : { y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

const trades = [
  {
    label: "Trade A",
    action: "Waited for the level. Sized to the plan. Exited at the target.",
    reading: "A repeatable decision",
    question: "What condition made this entry valid, and would you take it again?",
    accent: "text-[#5FE2D4]",
  },
  {
    label: "Trade B",
    action: "Entered early after a loss. Added size. Got lucky on the reversal.",
    reading: "A costly pattern in disguise",
    question: "What did you feel after the loss, and which rule did you override?",
    accent: "text-[#FCA5A5]",
  },
] as const;

export function TradeLens() {
  const [selected, setSelected] = useState(0);
  const trade = trades[selected];
  const path = selected === 0
    ? [{ label: "Plan", note: "Defined", sound: true }, { label: "Entry", note: "Confirmed", sound: true }, { label: "Risk", note: "Respected", sound: true }]
    : [{ label: "Plan", note: "Abandoned", sound: false }, { label: "Entry", note: "Early", sound: false }, { label: "Risk", note: "Increased", sound: false }];
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111D2C] shadow-[0_28px_80px_rgba(0,0,0,0.22)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4 sm:px-7">
        <span className="font-body text-xs font-bold uppercase tracking-[0.22em] text-[#8DA7BA]">One result. Two stories.</span>
        <span className="font-body text-xs text-[#8DA7BA]">Illustrative trades</span>
      </div>
      <div className="grid lg:grid-cols-[0.38fr_0.62fr]">
        <div className="flex flex-col justify-between gap-8 border-b border-white/10 p-6 sm:p-8 lg:border-b-0 lg:border-r">
          <div>
            <p className="font-body text-sm text-[#9BB0C2]">The journal entry</p>
            <p className="mt-4 font-heading text-[clamp(3.5rem,8vw,6rem)] font-black leading-none tracking-[-0.06em] text-white">+$420</p>
            <p className="mt-3 font-body text-sm text-[#A5B7C7]">Same instrument. Same profit.</p>
            <ol aria-label="Decision path" className="mt-8 grid grid-cols-3 gap-2 border-t border-white/10 pt-5">
              {path.map((step, index) => (
                <li key={step.label}>
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full border font-heading text-xs font-black ${step.sound ? "border-[#14B8A6] bg-[#14B8A6]/15 text-[#5FE2D4]" : "border-[#FCA5A5]/60 bg-[#FCA5A5]/10 text-[#FCA5A5]"}`}>{index + 1}</span>
                  <span className="mt-2 block font-heading text-xs font-extrabold text-white">{step.label}</span>
                  <span className="block font-body text-[11px] text-[#9CB0C0]">{step.note}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="flex gap-2" role="group" aria-label="Compare two trades">
            {trades.map((item, index) => (
              <button key={item.label} type="button" aria-pressed={selected === index} onClick={() => setSelected(index)} className={`${choice} flex-1 ${selected === index ? "border-[#14B8A6] bg-[#14B8A6]/15 text-white" : "border-white/15 text-[#A9BBCB] hover:border-white/40 hover:text-white"}`}>{item.label}</button>
            ))}
          </div>
        </div>
        <div aria-live="polite" className="flex min-h-[355px] flex-col justify-between p-6 sm:p-8">
          <div>
            <p className="font-body text-xs font-bold uppercase tracking-[0.2em] text-[#8DA7BA]">What the number leaves out</p>
            <p className="mt-5 max-w-lg font-heading text-[clamp(1.6rem,3vw,2.6rem)] font-extrabold leading-tight tracking-tight text-white">{trade.action}</p>
          </div>
          <div className="mt-8 border-t border-white/10 pt-6">
            <p className={`font-heading text-base font-extrabold ${trade.accent}`}>{trade.reading}</p>
            <p className="mt-2 max-w-lg font-body text-sm leading-relaxed text-[#B7C6D2]">{trade.question}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const sessions = [
  { day: "Mon", signal: "Plan followed", note: "Waited for confirmation. The loss was part of the plan.", mark: "•" },
  { day: "Tue", signal: "Early entry", note: "Took the first move before the setup completed.", mark: "↗" },
  { day: "Wed", signal: "Size increased", note: "Tried to recover Tuesday's miss with a larger position.", mark: "↗" },
  { day: "Thu", signal: "Rule rewritten", note: "A pre-entry pause now sits between the trigger and the click.", mark: "✓" },
] as const;

export function PatternTrace() {
  const [selected, setSelected] = useState(2);
  return (
    <div className="grid overflow-hidden rounded-2xl border border-white/10 bg-[#111D2C] md:grid-cols-[0.55fr_0.45fr]">
      <div className="p-5 sm:p-8">
        <p className="font-body text-xs font-bold uppercase tracking-[0.22em] text-[#91A9BB]">An illustrative week, in decisions</p>
        <div className="mt-7 space-y-2" role="group" aria-label="Explore the session pattern">
          {sessions.map((session, index) => (
            <button key={session.day} type="button" aria-pressed={selected === index} onClick={() => setSelected(index)} className={`grid min-h-16 w-full grid-cols-[52px_1fr_32px] items-center gap-3 rounded-xl border px-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6] ${selected === index ? "border-[#14B8A6]/60 bg-[#14B8A6]/10" : "border-white/10 hover:border-white/25"}`}>
              <span className="font-body text-xs font-bold uppercase tracking-widest text-[#80A4B6]">{session.day}</span>
              <span className="font-heading text-sm font-bold text-white">{session.signal}</span>
              <span aria-hidden="true" className="font-heading text-xl text-[#14B8A6]">{session.mark}</span>
            </button>
          ))}
        </div>
      </div>
      <div aria-live="polite" className="flex flex-col justify-between border-t border-white/10 bg-[#0D1726] p-6 sm:p-9 md:border-l md:border-t-0">
        <span className="font-heading text-7xl font-black tracking-[-0.08em] text-[#14B8A6]/25">0{selected + 1}</span>
        <div className="mt-12">
          <p className="font-body text-xs font-bold uppercase tracking-[0.22em] text-[#7DB1B0]">The detail that matters</p>
          <p className="mt-4 font-heading text-2xl font-extrabold leading-tight text-white">{sessions[selected].note}</p>
          <p className="mt-5 font-body text-sm leading-relaxed text-[#A8B9C9]">A result on its own cannot show you where a decision began to drift.</p>
        </div>
      </div>
    </div>
  );
}

const triggers = [
  { label: "I felt rushed", prompt: "What made the entry feel urgent, and what would have happened if you waited one candle?", response: "Pause when urgency appears. Recheck the setup before entering." },
  { label: "I wanted it back", prompt: "Was the next trade in your plan, or was it a response to the previous result?", response: "After a loss, reset before considering another position." },
  { label: "I doubted the plan", prompt: "Which condition had changed, and which part of the plan was still valid?", response: "Name the changed condition before adjusting the plan." },
] as const;

export function ReflectionExercise() {
  const [selected, setSelected] = useState<number | null>(null);
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111D2C]">
      <div className="grid lg:grid-cols-[0.42fr_0.58fr]">
        <div className="border-b border-white/10 p-6 sm:p-9 lg:border-b-0 lg:border-r">
          <p className="font-body text-xs font-bold uppercase tracking-[0.22em] text-[#7DB1B0]">A short reflection</p>
          <h3 className="mt-5 font-heading text-2xl font-extrabold leading-tight text-white">What changed just before the trade?</h3>
          <div className="mt-8 flex flex-col gap-2" role="group" aria-label="Choose what changed before the trade">
            {triggers.map((item, index) => (
              <button key={item.label} type="button" aria-pressed={selected === index} onClick={() => setSelected(index)} className={`${choice} ${selected === index ? "border-[#14B8A6] bg-[#14B8A6]/15 text-white" : "border-white/15 text-[#B3C2CF] hover:border-white/40 hover:text-white"}`}>{item.label}</button>
            ))}
          </div>
        </div>
        <div aria-live="polite" className="flex min-h-[330px] flex-col justify-between p-6 sm:p-9">
          <div>
            <p className="font-body text-xs font-bold uppercase tracking-[0.22em] text-[#8DA7BA]">A better next question</p>
            <p className="mt-8 max-w-xl font-heading text-[clamp(1.7rem,3.6vw,3rem)] font-black leading-[1.12] tracking-tight text-white">{selected === null ? "Start with the moment, not the P&L." : triggers[selected].prompt}</p>
          </div>
          <p className="mt-8 border-t border-white/10 pt-5 font-body text-sm leading-relaxed text-[#9EB2C3]">{selected === null ? "Select a moment to see how a useful reflection begins." : `A possible next-session guideline: ${triggers[selected].response}`}</p>
        </div>
      </div>
    </div>
  );
}

export function GuidelineBuilder() {
  const [minutes, setMinutes] = useState(5);
  const [armed, setArmed] = useState(false);
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111D2C] p-6 sm:p-9">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-body text-xs font-bold uppercase tracking-[0.22em] text-[#7DB1B0]">Draft a personal guideline</p>
          <h3 className="mt-4 font-heading text-2xl font-extrabold text-white">Give the impulse a boundary.</h3>
        </div>
        <button type="button" onClick={() => { setMinutes(5); setArmed(false); }} className="inline-flex min-h-10 items-center gap-2 text-sm text-[#A9BAC9] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]"><RotateCcw aria-hidden="true" className="h-4 w-4" /> Reset example</button>
      </div>
      <div className="mt-9 grid gap-8 lg:grid-cols-[0.42fr_0.58fr] lg:gap-12">
        <div>
          <p className="font-body text-sm text-[#AFC1CF]">After a loss, wait at least</p>
          <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Choose a pause after a loss">
            {[2, 5, 10].map((value) => (
              <button key={value} type="button" aria-pressed={minutes === value} onClick={() => setMinutes(value)} className={`${choice} min-w-20 text-center ${minutes === value ? "border-[#14B8A6] bg-[#14B8A6]/15 text-white" : "border-white/15 text-[#B3C2CF] hover:border-white/40"}`}>{value} min</button>
            ))}
          </div>
          <button type="button" aria-pressed={armed} onClick={() => setArmed((value) => !value)} className="mt-6 inline-flex min-h-11 items-center gap-3 text-left font-body text-sm text-[#B9C8D3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]">
            <span aria-hidden="true" className={`grid h-5 w-5 place-items-center rounded border ${armed ? "border-[#14B8A6] bg-[#14B8A6] text-[#0B1120]" : "border-white/35"}`}>{armed && <Check className="h-3.5 w-3.5" />}</span>
            Put this into the example next session
          </button>
        </div>
        <div aria-live="polite" className="border-l-2 border-[#14B8A6] pl-6 sm:pl-8">
          <p className="font-body text-xs font-bold uppercase tracking-[0.22em] text-[#7DB1B0]">Your next-session note</p>
          <p className="mt-5 font-heading text-[clamp(1.5rem,3vw,2.6rem)] font-extrabold leading-tight text-white">“After a loss, I step away for {minutes} minutes before looking for another setup.”</p>
          <p className="mt-7 font-body text-sm leading-relaxed text-[#A8BBC9]">{armed ? "Added to this example session. Your choice stays on this page only." : "Make it specific enough to follow when the market gets loud."}</p>
        </div>
      </div>
    </div>
  );
}

const events = [
  { label: "Inflation release", cue: "A scheduled release can change rate expectations in seconds.", plan: "Mark the release window. Decide whether your setup is valid before and after it." },
  { label: "Rate decision", cue: "The statement and press conference can shift the market's read of policy.", plan: "Check the announcement time. Define which conditions would make you stand aside." },
  { label: "Energy inventory", cue: "Inventory data can move energy futures and spill into broader risk sentiment.", plan: "Know the release time before entering an energy-related position." },
] as const;

export function MarketLens() {
  const [selected, setSelected] = useState(0);
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111D2C]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-6 py-4">
        <p className="font-body text-xs font-bold uppercase tracking-[0.22em] text-[#8DA7BA]">Context before conviction</p>
        <p className="font-body text-xs text-[#8DA7BA]">Illustrative events, not live data</p>
      </div>
      <div className="grid lg:grid-cols-[0.42fr_0.58fr]">
        <div className="flex flex-col gap-2 border-b border-white/10 p-6 sm:p-8 lg:border-b-0 lg:border-r" role="group" aria-label="Choose a market event">
          {events.map((event, index) => (
            <button key={event.label} type="button" aria-pressed={selected === index} onClick={() => setSelected(index)} className={`${choice} ${selected === index ? "border-[#14B8A6] bg-[#14B8A6]/15 text-white" : "border-white/15 text-[#B3C2CF] hover:border-white/40"}`}>{event.label}</button>
          ))}
        </div>
        <div aria-live="polite" className="flex min-h-[300px] flex-col justify-between p-6 sm:p-8">
          <div>
            <p className="font-body text-xs font-bold uppercase tracking-[0.22em] text-[#7DB1B0]">Why it might matter</p>
            <p className="mt-5 font-heading text-2xl font-extrabold leading-tight text-white">{events[selected].cue}</p>
          </div>
          <div className="mt-8 border-t border-white/10 pt-5">
            <p className="font-body text-xs font-bold uppercase tracking-[0.22em] text-[#8DA7BA]">A question for your plan</p>
            <p className="mt-2 font-body text-sm leading-relaxed text-[#B5C5D0]">{events[selected].plan}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function JumpToStory() {
  return <a href="#the-problem" className="inline-flex min-h-12 items-center gap-2 font-heading text-sm font-extrabold text-[#E7F1F3] transition-colors hover:text-[#5FE2D4] focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]">See why <ArrowRight aria-hidden="true" className="h-4 w-4" /></a>;
}
