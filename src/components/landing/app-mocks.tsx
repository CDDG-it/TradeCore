"use client";

/**
 * Landing-page app mockups — "new screenshots", built as on-brand React screens
 * with mock data. Each fills a 16:9 card and reads like a capture of the real
 * TradingMC UI: navy surface, turquoise/cyan accents, Nunito. No real data, no
 * auth needed. Used as the feature-card media in the redesigned features section.
 */
import { LayoutDashboard, BookOpen, Brain, MessageSquareHeart, Globe, Activity, TrendingUp } from "lucide-react";

const NUNITO = "var(--font-nunito), system-ui, sans-serif";
const TURQ = "#14B8A6";
const CYAN = "#06B6D4";
const GREEN = "#22c55e";
const RED = "#ef4444";
const AMBER = "#f59e0b";
const INK = "#0b1220";
const PANEL = "#0f1a2e";
const LINE = "rgba(248,250,252,0.08)";
const T1 = "rgba(248,250,252,0.92)";
const T2 = "rgba(248,250,252,0.60)";
const T3 = "rgba(248,250,252,0.38)";

function Chrome({ title, icon: Icon, children }: { title: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; children: React.ReactNode }) {
  return (
    <div className="h-full w-full flex flex-col overflow-hidden" style={{ background: INK, fontFamily: NUNITO }}>
      <div className="flex items-center gap-2 px-3 h-7 shrink-0 border-b" style={{ borderColor: LINE, background: "rgba(255,255,255,0.02)" }}>
        <span className="h-2 w-2 rounded-full" style={{ background: RED, opacity: 0.65 }} />
        <span className="h-2 w-2 rounded-full" style={{ background: AMBER, opacity: 0.65 }} />
        <span className="h-2 w-2 rounded-full" style={{ background: GREEN, opacity: 0.65 }} />
        <span className="mx-auto flex items-center gap-1.5 text-[10px] font-semibold" style={{ color: T3 }}>
          <Icon className="h-3 w-3" style={{ color: TURQ }} /> {title}
        </span>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}

const card = { background: PANEL, border: `1px solid ${LINE}`, borderRadius: 10 } as const;

/* ── Dashboard ──────────────────────────────────────────────────────────── */
export function DashboardMock() {
  const kpis = [
    { label: "Win rate", value: "58%", tone: GREEN },
    { label: "Net R (mo)", value: "+24.6R", tone: GREEN },
    { label: "Accounts", value: "5", tone: T1 },
    { label: "Mindscore", value: "78", tone: TURQ },
  ];
  // A month grid with per-day status dots.
  const days = Array.from({ length: 35 }, (_, i) => {
    const r = (i * 7) % 5;
    const state = i < 2 || i > 32 ? "off" : ["win", "win", "loss", "be", "habit"][r];
    return state;
  });
  const stateColor: Record<string, string> = { win: GREEN, loss: RED, be: AMBER, habit: CYAN, off: "rgba(248,250,252,0.06)" };
  return (
    <Chrome title="Dashboard" icon={LayoutDashboard}>
      <div className="h-full p-3 grid grid-cols-[1.3fr_1fr] gap-3">
        <div className="flex flex-col gap-3 min-h-0">
          <div className="grid grid-cols-4 gap-2">
            {kpis.map((k) => (
              <div key={k.label} style={card} className="px-2 py-2">
                <p className="text-[8px] font-bold uppercase tracking-wider" style={{ color: T3 }}>{k.label}</p>
                <p className="text-[15px] font-black tabular-nums leading-tight" style={{ color: k.tone }}>{k.value}</p>
              </div>
            ))}
          </div>
          <div style={card} className="p-2.5 flex-1 min-h-0">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] font-bold" style={{ color: T1 }}>July</p>
              <div className="flex gap-2 text-[8px]" style={{ color: T3 }}>
                <span className="flex items-center gap-1"><i className="h-1.5 w-1.5 rounded-full inline-block" style={{ background: GREEN }} />Win</span>
                <span className="flex items-center gap-1"><i className="h-1.5 w-1.5 rounded-full inline-block" style={{ background: RED }} />Loss</span>
                <span className="flex items-center gap-1"><i className="h-1.5 w-1.5 rounded-full inline-block" style={{ background: CYAN }} />Habits</span>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {days.map((s, i) => (
                <div key={i} className="rounded-[3px] flex items-end justify-end p-0.5" style={{ aspectRatio: "1", background: "rgba(255,255,255,0.02)", border: `1px solid ${LINE}` }}>
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: stateColor[s] }} />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3 min-h-0">
          <div style={card} className="p-2.5">
            <p className="text-[9px] font-bold uppercase tracking-wider mb-1.5" style={{ color: T3 }}>Equity · this month</p>
            <Spark />
          </div>
          <div style={card} className="p-2.5 flex-1">
            <p className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color: T3 }}>MC Mindscore</p>
            {[["Rules", 84, TURQ], ["Habits", 71, CYAN], ["Commitment", 66, GREEN]].map(([l, v, c]) => (
              <div key={l as string} className="mb-2">
                <div className="flex justify-between text-[9px] mb-0.5" style={{ color: T2 }}><span>{l}</span><span className="tabular-nums">{v}%</span></div>
                <div className="h-1 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}><div className="h-full rounded-full" style={{ width: `${v}%`, background: c as string }} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Chrome>
  );
}

function Spark() {
  const pts = "0,34 12,30 24,32 36,24 48,26 60,18 72,20 84,12 96,14 108,6";
  return (
    <svg viewBox="0 0 108 40" className="w-full" style={{ height: 44 }} preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={GREEN} strokeWidth="1.5" />
      <polygon points={`${pts} 108,40 0,40`} fill="rgba(34,197,94,0.12)" />
    </svg>
  );
}

/* ── Journal ────────────────────────────────────────────────────────────── */
export function JournalMock() {
  const rows = [
    { i: "NQ", d: "Long", s: "New York", r: "+2.4R", tone: GREEN, ex: "good" },
    { i: "GC", d: "Short", s: "London", r: "-1.0R", tone: RED, ex: "bad" },
    { i: "ES", d: "Long", s: "New York", r: "+1.6R", tone: GREEN, ex: "good" },
    { i: "CL", d: "Short", s: "New York", r: "0.0R", tone: AMBER, ex: "good" },
    { i: "NQ", d: "Long", s: "London", r: "+3.1R", tone: GREEN, ex: "good" },
    { i: "GC", d: "Long", s: "Asia", r: "-1.0R", tone: RED, ex: "bad" },
  ];
  return (
    <Chrome title="Journal" icon={BookOpen}>
      <div className="h-full p-3 flex flex-col">
        <div className="grid grid-cols-[1fr_1fr_1.2fr_0.8fr_0.9fr] gap-2 px-2 pb-1.5 text-[8px] font-bold uppercase tracking-wider" style={{ color: T3 }}>
          <span>Instr</span><span>Dir</span><span>Session</span><span>Exec</span><span className="text-right">R</span>
        </div>
        <div className="flex-1 flex flex-col gap-1.5 min-h-0">
          {rows.map((r, i) => (
            <div key={i} style={card} className="grid grid-cols-[1fr_1fr_1.2fr_0.8fr_0.9fr] gap-2 items-center px-2 py-1.5 text-[10px]">
              <span className="font-black font-mono" style={{ color: T1 }}>{r.i}</span>
              <span style={{ color: T2 }}>{r.d}</span>
              <span style={{ color: T2 }}>{r.s}</span>
              <span className="font-semibold" style={{ color: r.ex === "bad" ? RED : GREEN }}>{r.ex}</span>
              <span className="text-right font-black tabular-nums" style={{ color: r.tone }}>{r.r}</span>
            </div>
          ))}
        </div>
      </div>
    </Chrome>
  );
}

/* ── MC Mind Edge ───────────────────────────────────────────────────────── */
export function MindEdgeMock() {
  const R = 30, C = 2 * Math.PI * R;
  const total = 78;
  const heat = Array.from({ length: 42 }, (_, i) => (i * 3) % 4);
  const heatColor = ["rgba(255,255,255,0.06)", "rgba(20,184,166,0.35)", "rgba(20,184,166,0.6)", TURQ];
  return (
    <Chrome title="MC Mind Edge" icon={Brain}>
      <div className="h-full p-3 grid grid-cols-[1fr_1.2fr] gap-3">
        <div style={card} className="p-3 flex flex-col items-center justify-center">
          <div className="relative" style={{ width: 78, height: 78 }}>
            <svg viewBox="0 0 78 78" className="-rotate-90 h-full w-full">
              <circle cx="39" cy="39" r={R} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="7" />
              <circle cx="39" cy="39" r={R} fill="none" stroke={TURQ} strokeWidth="7" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C - (total / 100) * C} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-black tabular-nums" style={{ color: T1 }}>{total}</span>
            </div>
          </div>
          <p className="text-[9px] font-bold uppercase tracking-wider mt-1.5" style={{ color: TURQ }}>Mindscore · Solid</p>
        </div>
        <div className="flex flex-col gap-2.5 min-h-0">
          <div style={card} className="p-2.5">
            {[["Rule adherence", 84, TURQ], ["Habit consistency", 71, CYAN], ["Commitment adherence", 66, GREEN]].map(([l, v, c]) => (
              <div key={l as string} className="mb-1.5 last:mb-0">
                <div className="flex justify-between text-[9px] mb-0.5" style={{ color: T2 }}><span>{l}</span><span className="tabular-nums font-semibold">{v}%</span></div>
                <div className="h-1 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}><div className="h-full rounded-full" style={{ width: `${v}%`, background: c as string }} /></div>
              </div>
            ))}
          </div>
          <div style={card} className="p-2.5 flex-1">
            <p className="text-[9px] font-bold uppercase tracking-wider mb-1.5" style={{ color: T3 }}>Habit streak</p>
            <div className="grid grid-cols-7 gap-1">
              {heat.map((h, i) => <div key={i} className="rounded-[2px]" style={{ aspectRatio: "1", background: heatColor[h] }} />)}
            </div>
          </div>
        </div>
      </div>
    </Chrome>
  );
}

/* ── MC Trade Therapist ─────────────────────────────────────────────────── */
export function TherapistMock() {
  return (
    <Chrome title="MC Trade Therapist" icon={MessageSquareHeart}>
      <div className="h-full p-3.5 flex flex-col justify-center gap-2.5">
        <Bubble side="left">You re-entered 8 min after a −1.0R loss on NQ, and the R target ran above your average. Does that read true?</Bubble>
        <Bubble side="right">Frustrated</Bubble>
        <Bubble side="left"><span>That pattern has cost you </span><b style={{ color: RED }}>−7.0R</b><span> across 5 trades. What do you keep repeating each time?</span></Bubble>
      </div>
    </Chrome>
  );
}

function Bubble({ side, children }: { side: "left" | "right"; children: React.ReactNode }) {
  const left = side === "left";
  return (
    <div className={left ? "flex gap-2" : "flex justify-end"}>
      {left && <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full" style={{ background: "rgba(20,184,166,0.16)" }}><Brain className="h-3 w-3" style={{ color: TURQ }} /></span>}
      <span className="inline-block rounded-xl px-2.5 py-1.5 text-[10px] leading-snug max-w-[78%]"
        style={left ? { background: "rgba(255,255,255,0.06)", color: T1, borderTopLeftRadius: 3 } : { background: TURQ, color: "#04241f", borderTopRightRadius: 3, fontWeight: 700 }}>
        {children}
      </span>
    </div>
  );
}

/* ── Market Intelligence ────────────────────────────────────────────────── */
export function IntelligenceMock() {
  const signals = [
    { c: "Central bank", t: "FOMC minutes hawkish", dir: "down", conf: 82, tone: RED },
    { c: "Macro", t: "US CPI beats estimate", dir: "down", conf: 74, tone: RED },
    { c: "Commodity", t: "Crude inventories draw", dir: "up", conf: 61, tone: GREEN },
    { c: "Earnings", t: "Semis guide higher", dir: "up", conf: 68, tone: GREEN },
  ];
  return (
    <Chrome title="Market Intelligence" icon={Globe}>
      <div className="h-full p-3 grid grid-cols-[0.9fr_1.4fr] gap-3">
        <div style={card} className="relative flex items-center justify-center overflow-hidden">
          {/* radial hub sketch */}
          <div className="absolute h-16 w-16 rounded-full" style={{ background: "radial-gradient(circle, rgba(20,184,166,0.35), transparent 70%)" }} />
          <svg viewBox="0 0 120 120" className="h-full w-full p-3">
            {[0, 1, 2, 3, 4].map((i) => {
              const a = -Math.PI / 2 + i * ((2 * Math.PI) / 5);
              const x = 60 + Math.cos(a) * 38, y = 60 + Math.sin(a) * 38;
              return <g key={i}><line x1="60" y1="60" x2={x} y2={y} stroke="rgba(20,184,166,0.4)" strokeWidth="1" /><circle cx={x} cy={y} r="5" fill={CYAN} /></g>;
            })}
            <circle cx="60" cy="60" r="9" fill={TURQ} />
          </svg>
        </div>
        <div className="flex flex-col gap-1.5 min-h-0">
          {signals.map((s, i) => (
            <div key={i} style={card} className="px-2 py-1.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[8px] font-bold uppercase tracking-wider" style={{ color: CYAN }}>{s.c}</span>
                <TrendingUp className="h-2.5 w-2.5 ml-auto" style={{ color: s.tone, transform: s.dir === "down" ? "scaleY(-1)" : undefined }} />
                <span className="text-[8px] tabular-nums font-semibold" style={{ color: T3 }}>{s.conf}%</span>
              </div>
              <p className="text-[10px] leading-tight mt-0.5" style={{ color: T1 }}>{s.t}</p>
            </div>
          ))}
        </div>
      </div>
    </Chrome>
  );
}

/* ── Option Flow ────────────────────────────────────────────────────────── */
export function OptionFlowMock() {
  const rows = [
    { strike: "20800", call: 34, put: 12 }, { strike: "20900", call: 58, put: 20 },
    { strike: "21000", call: 82, put: 41 }, { strike: "21100", call: 47, put: 63 },
    { strike: "21200", call: 22, put: 78 }, { strike: "21300", call: 14, put: 54 },
  ];
  const max = Math.max(...rows.flatMap((r) => [r.call, r.put]));
  return (
    <Chrome title="Option Flow" icon={Activity}>
      <div className="h-full p-3 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: T3 }}>Dealer positioning · NQ</p>
          <div className="flex gap-2 text-[8px] font-bold uppercase tracking-wider">
            <span style={{ color: GREEN }}>Calls</span><span style={{ color: RED }}>Puts</span>
          </div>
        </div>
        <div className="flex-1 flex flex-col justify-center gap-1.5">
          {rows.map((r) => (
            <div key={r.strike} className="grid grid-cols-[1fr_44px_1fr] items-center gap-1.5 text-[9px]">
              <div className="flex justify-end"><div className="h-3 rounded-l-sm" style={{ width: `${(r.call / max) * 100}%`, background: "rgba(34,197,94,0.75)" }} /></div>
              <span className="text-center tabular-nums font-bold" style={{ color: T2 }}>{r.strike}</span>
              <div className="flex justify-start"><div className="h-3 rounded-r-sm" style={{ width: `${(r.put / max) * 100}%`, background: "rgba(239,68,68,0.72)" }} /></div>
            </div>
          ))}
        </div>
      </div>
    </Chrome>
  );
}
