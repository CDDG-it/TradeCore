/** Marketing-only product compositions. All numbers and events are sample data. */

const week = [
  { day: "MON", height: 38, label: "+1.2R" },
  { day: "TUE", height: 60, label: "+2.1R" },
  { day: "WED", height: 25, label: "−0.5R" },
  { day: "THU", height: 72, label: "+2.8R" },
  { day: "FRI", height: 47, label: "+1.4R" },
] as const;

function MiniCard({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={`min-w-0 rounded-[7px] border border-white/[0.08] bg-[#151f32] p-3 ${className}`}><p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#91a2b8]">{label}</p>{children}</div>;
}

export function LaptopDashboard() {
  return (
    <figure className="marketing-laptop mx-auto w-full max-w-[740px]" aria-label="Illustrative TradingMC dashboard showing capital, habits, win rate, a journal week, mind score, goals and news using sample data">
      <div className="marketing-laptop-screen overflow-hidden rounded-t-[17px] border-[7px] border-[#253244] bg-[#0b1120] shadow-[0_32px_90px_rgba(0,0,0,.6)] sm:border-[10px]">
        <div className="flex min-h-[310px] text-[#edf5f6] sm:min-h-[410px]">
          <div className="hidden w-[98px] shrink-0 border-r border-white/[0.07] bg-[#0a1220] p-3 sm:block">
            <p className="mb-7 text-[10px] font-bold tracking-[-0.04em]">Trading<span className="text-[#14b8a6]">MC</span></p>
            <div className="space-y-3 text-[8px] text-[#8295a8]">
              <p className="border-l-2 border-[#14b8a6] pl-2 font-semibold text-white">Dashboard</p>
              <p className="pl-2">Journal</p><p className="pl-2">Analysis</p><p className="pl-2">Mind Edge</p><p className="pl-2">News</p>
            </div>
          </div>
          <div className="min-w-0 flex-1 px-3 pb-3 pt-3 sm:px-4 sm:pt-4">
            <div className="mb-3 flex items-end justify-between border-b border-white/[0.07] pb-3">
              <div><p className="text-[8px] uppercase tracking-[0.15em] text-[#6d8396]">Your trading desk</p><p className="mt-1 text-[15px] font-semibold tracking-[-0.04em] sm:text-[18px]">Good morning, Alex</p></div>
              <p className="text-[8px] text-[#8095a6]">SEPTEMBER 2026</p>
            </div>
            <div className="grid grid-cols-[1fr_1fr_0.95fr] gap-2">
              <div className="space-y-2">
                <MiniCard label="Active capital"><p className="mt-2 text-[15px] font-semibold tabular-nums sm:text-[21px]">$52,840<span className="text-[#14b8a6]">.65</span></p><p className="mt-1 text-[8px] text-[#8fa3b5]">2 active accounts</p></MiniCard>
                <MiniCard label="Habits today"><div className="mt-2 space-y-1.5 text-[8px]"><p className="flex justify-between"><span>Pre-market plan</span><span className="text-[#14b8a6]">Done</span></p><p className="flex justify-between"><span>Review trades</span><span className="text-[#14b8a6]">Done</span></p><p className="flex justify-between"><span>Stop after limit</span><span className="text-[#8396a8]">Open</span></p></div></MiniCard>
              </div>
              <MiniCard label="Win rate · month"><div className="mx-auto mt-3 grid aspect-square w-[72px] place-items-center rounded-full sm:w-[93px]" style={{ background: "conic-gradient(#14b8a6 0 63%, #334155 63% 100%)" }}><div className="grid h-[54px] w-[54px] place-items-center rounded-full bg-[#151f32] text-[17px] font-semibold tabular-nums sm:h-[70px] sm:w-[70px] sm:text-[21px]">63%</div></div><p className="mt-3 text-center text-[8px] text-[#92a4b2]">12 wins / 7 losses</p></MiniCard>
              <div className="space-y-2">
                <MiniCard label="MC mind score"><p className="mt-2 text-[22px] font-semibold leading-none tabular-nums text-[#14b8a6] sm:text-[30px]">78</p><div className="mt-2 flex h-8 items-end gap-[2px]">{[3,4,5,4,6,6,8,7,9,8,10,9].map((h,i)=><span key={i} className="flex-1 bg-[#14b8a6]" style={{height:`${h*10}%`,opacity:i>8?0.35:1}} />)}</div></MiniCard>
                <MiniCard label="Goals"><p className="mt-2 text-[8px]">Follow entry plan <span className="float-right text-[#14b8a6]">72%</span></p><div className="mt-1.5 h-1 bg-[#354357]"><div className="h-full w-[72%] bg-[#14b8a6]" /></div></MiniCard>
              </div>
              <MiniCard label="Journal week" className="col-span-2"><div className="mt-3 flex h-12 items-end justify-between gap-2 sm:h-16">{week.map((d)=><div key={d.day} className="flex h-full flex-1 flex-col items-center justify-end gap-1"><div className={`w-full max-w-9 rounded-t-[2px] ${d.day === "WED" ? "bg-[#a95467]" : "bg-[#14b8a6]"}`} style={{height:`${d.height}%`}} /><span className="text-[7px] text-[#8296a8]">{d.day}</span></div>)}</div></MiniCard>
              <MiniCard label="Next event"><p className="mt-2 text-[9px] font-medium">US inflation report</p><p className="mt-1 text-[8px] text-[#91a6b6]">Wed · 08:30 ET</p><p className="mt-3 border-t border-white/[0.08] pt-2 text-[8px] text-[#14b8a6]">Review your plan</p></MiniCard>
            </div>
          </div>
        </div>
      </div>
      <div className="relative mx-auto h-3 w-[108%] -translate-x-[4%] rounded-b-[50%] bg-gradient-to-b from-[#697784] via-[#3b4652] to-[#19232f] shadow-[0_24px_38px_rgba(0,0,0,.36)]"><div className="mx-auto h-[3px] w-[15%] rounded-b-full bg-[#1c2633]" /></div>
      <figcaption className="mt-6 text-center text-[11px] tracking-[0.08em] text-[#8fa8ad]">TRADINGMC DASHBOARD · ILLUSTRATIVE DATA</figcaption>
    </figure>
  );
}

const stages = [
  { number: "01", title: "Record the trade", detail: "The setup, result and conditions stay together.", small: "ES / LONG / +$420", accent: "#14b8a6" },
  { number: "02", title: "Examine the decision", detail: "Review the choice while the reason is still clear.", small: "ENTRY BEFORE CONFIRMATION", accent: "#06b6d4" },
  { number: "03", title: "Set the next boundary", detail: "Write a rule you can actually return to.", small: "WAIT FOR THE LEVEL", accent: "#8bd9d1" },
] as const;

export function ProcessStack() {
  return (
    <div className="marketing-stack relative mx-auto w-full max-w-[570px] pb-20 pt-10" aria-label="Three stacked sample cards: record the trade, examine the decision, set the next boundary">
      {stages.map((stage, index) => (
        <div key={stage.number} className={`marketing-stack-card relative border border-white/10 bg-[#172336] p-6 shadow-[0_28px_50px_rgba(0,0,0,.25)] sm:p-8 ${index === 0 ? "rotate-[-5deg]" : index === 1 ? "mt-1 ml-5 rotate-[2deg] sm:ml-10" : "mt-1 ml-10 rotate-[-2deg] sm:ml-20"}`} style={{zIndex:index+1}}>
          <div className="flex items-start justify-between gap-6 border-b border-white/10 pb-5"><span className="font-mono text-xs" style={{color:stage.accent}}>{stage.number} / 03</span><span className="font-mono text-[10px] tracking-wider text-[#748b9d]">{stage.small}</span></div>
          <h3 className="mt-6 text-xl font-semibold tracking-[-0.04em] text-white sm:text-2xl">{stage.title}</h3>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#acbac8]">{stage.detail}</p>
        </div>
      ))}
    </div>
  );
}

export function TradeComparison() {
  return (
    <div className="grid gap-5 md:grid-cols-2" aria-label="Two trades with the same profit, but different decision quality">
      <article className="marketing-flip-card border border-[#d1dde1] bg-white p-7 shadow-[0_20px_50px_rgba(10,35,45,.06)] sm:p-9"><p className="font-mono text-[11px] tracking-[0.12em] text-[#55717b]">TRADE 01 / THE NUMBER</p><p className="mt-12 text-5xl font-semibold tracking-[-0.07em] text-[#0b1120]">+$420</p><div className="mt-10 border-t border-[#dce6e9] pt-5 text-sm text-[#425864]"><p>Instrument: ES futures</p><p className="mt-1">Outcome: profit</p></div><p className="mt-8 text-sm leading-relaxed text-[#5e737c]">A conventional entry stops here.</p></article>
      <article className="marketing-flip-card border border-[#b8d9d6] bg-[#e4f3f1] p-7 shadow-[0_20px_50px_rgba(10,35,45,.06)] sm:p-9"><p className="font-mono text-[11px] tracking-[0.12em] text-[#0d756e]">TRADE 01 / THE DECISION</p><p className="mt-12 text-5xl font-semibold tracking-[-0.07em] text-[#0b1120]">+$420</p><div className="mt-10 border-t border-[#b8d9d6] pt-5 text-sm text-[#244c53]"><p>Entry: before confirmation</p><p className="mt-1">Risk: increased after a loss</p></div><p className="mt-8 max-w-sm text-sm font-medium leading-relaxed text-[#0d625e]">Same result. A different lesson for the next session.</p></article>
    </div>
  );
}

export function MarketContextVisual() {
  return (
    <div className="overflow-hidden border border-[#c4d6d8] bg-white shadow-[0_24px_50px_rgba(10,35,45,.07)]" aria-label="Illustrative market event timeline">
      <div className="flex items-center justify-between border-b border-[#dce7e9] px-6 py-4"><p className="text-sm font-semibold text-[#10242f]">Wednesday / market context</p><span className="font-mono text-[10px] text-[#657b83]">SAMPLE EVENTS</span></div>
      <div className="grid grid-cols-[65px_1fr] gap-x-4 px-6 py-7 sm:grid-cols-[90px_1fr]">
        <p className="font-mono text-xs text-[#67818a]">08:30</p><div className="border-l-2 border-[#14b8a6] pl-5"><p className="font-semibold text-[#0b1120]">US inflation report</p><p className="mt-1 text-sm text-[#526871]">A scheduled release can change the conditions around an ES setup.</p></div>
        <p className="mt-8 font-mono text-xs text-[#67818a]">10:00</p><div className="mt-8 border-l-2 border-[#c7d7d9] pl-5"><p className="font-semibold text-[#0b1120]">Consumer sentiment</p><p className="mt-1 text-sm text-[#526871]">Keep the session plan in view as the market reacts.</p></div>
      </div>
      <div className="border-t border-[#dce7e9] bg-[#f0f7f7] px-6 py-4 text-sm text-[#22545a]">Know what may change before you decide what to do.</div>
    </div>
  );
}
