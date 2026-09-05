"use client";

/**
 * Card signatures — the face of each landing card.
 *
 * Rather than an abstract glow, the front of a card shows the thing the product
 * actually puts on screen: the win-rate ring and the week strip for the
 * dashboard, the Mindscore meter for My Edge, the review calendar for the
 * Therapist, the desk's clocks and index for Global Markets. Same shapes, same
 * colour vocabulary, drawn small — so the card is a look at the product, not a
 * decoration next to a claim about it.
 *
 * Everything here is static and presentational: illustrative numbers, no state,
 * no animation. The real, interactive versions live further up the page in the
 * product explorer.
 */

const TURQUOISE = "#14B8A6";
const CYAN = "#06B6D4";
const GREEN = "#22C55E";
const RED = "#EF4444";
const AMBER = "#F59E0B";

const a = (c: string, pct: number) => `color-mix(in srgb, ${c} ${pct}%, transparent)`;

/* ── Shared furniture ──────────────────────────────────────────────────── */

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/45">{children}</span>
  );
}

/** The period pill the dashboard widgets carry in their corner. */
function Pill({ children, color = TURQUOISE }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      className="rounded-md px-1.5 py-[3px] text-[8px] font-bold uppercase tracking-wider text-white"
      style={{ background: color }}
    >
      {children}
    </span>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-between gap-2">{children}</div>;
}

/* ── 01 · Dashboard — the win-rate ring over this week's journal ────────── */

const WEEK = [
  { d: "M", n: 31, bands: [GREEN] },
  { d: "T", n: 1, bands: [RED] },
  { d: "W", n: 2, bands: [GREEN, AMBER] },
  { d: "T", n: 3, bands: [] },
  { d: "F", n: 4, bands: [GREEN, GREEN] },
];

export function DashboardSignature() {
  // Win / break-even / loss as fractions of the ring, in the dashboard's order.
  const segs = [
    { v: 0.58, c: GREEN },
    { v: 0.12, c: AMBER },
    { v: 0.3, c: RED },
  ];
  const R = 46;
  const C = 2 * Math.PI * R;
  let acc = 0;

  return (
    <div className="flex h-full flex-col gap-3">
      <Row>
        <Label>Win rate</Label>
        <Pill color={CYAN}>Month</Pill>
      </Row>

      <div className="flex flex-1 items-center justify-center">
        <div className="relative aspect-square w-[112px]">
          <svg viewBox="0 0 116 116" className="block h-full w-full">
            <circle cx={58} cy={58} r={R} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth={11} />
            {segs.map((s, i) => {
              const dash = s.v * C;
              const rot = acc * 360 - 90;
              acc += s.v;
              return (
                <circle
                  key={i}
                  cx={58}
                  cy={58}
                  r={R}
                  fill="none"
                  stroke={s.c}
                  strokeWidth={11}
                  strokeLinecap="round"
                  strokeDasharray={`${dash} ${C - dash}`}
                  transform={`rotate(${rot} 58 58)`}
                  style={{ filter: `drop-shadow(0 0 4px ${a(s.c, 40)})` }}
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[24px] font-black leading-none tabular-nums" style={{ color: CYAN }}>
              58%
            </span>
            <span className="mt-1 text-[8px] font-semibold uppercase tracking-wider text-white/45">
              24 trades
            </span>
          </div>
        </div>
      </div>

      {/* This week, the way the journal widget bands a day per trade. */}
      <div className="grid grid-cols-5 gap-1.5">
        {WEEK.map(({ d, n, bands }) => (
          <div
            key={n}
            className="relative flex flex-col items-center overflow-hidden rounded-md border border-white/10 pb-1.5 pt-2"
            style={bands.length ? { background: a(bands[0], 8) } : undefined}
          >
            {bands.length > 0 && (
              <span className="absolute inset-x-0 top-0 flex h-[2px]">
                {bands.map((c, i) => (
                  <span key={i} className="flex-1" style={{ background: c }} />
                ))}
              </span>
            )}
            <span className="text-[8px] font-semibold uppercase text-white/40">{d}</span>
            <span className="mt-0.5 text-[12px] font-bold leading-none tabular-nums text-white/85">{n}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── 02 · My Edge — the Mindscore meter and what feeds it ──────────────── */

const METER_BARS = 20;
const INPUTS = [
  { label: "Rules", value: 84, accent: TURQUOISE },
  { label: "Habits", value: 72, accent: CYAN },
  { label: "Objectives", value: 60, accent: TURQUOISE },
];

export function EdgeSignature() {
  const filled = 16;

  return (
    <div className="flex h-full flex-col gap-3">
      <Row>
        <Label>MC mind score</Label>
        <Pill>Month</Pill>
      </Row>

      <div className="flex flex-1 items-end gap-3">
        <div className="shrink-0">
          <p className="text-[38px] font-black leading-none tabular-nums" style={{ color: TURQUOISE }}>
            78
          </p>
          <p className="mt-1 text-[10px] font-medium" style={{ color: TURQUOISE }}>
            Sharp
          </p>
        </div>
        {/* The rising signal meter the widget uses for the blended score. */}
        <div className="flex h-full max-h-[92px] min-h-[54px] flex-1 items-end gap-[3px] pb-0.5" aria-hidden>
          {Array.from({ length: METER_BARS }).map((_, i) => {
            const on = i < filled;
            const h = 30 + (i / (METER_BARS - 1)) * 70;
            return (
              <div
                key={i}
                className="flex-1 rounded-[2px]"
                style={{
                  height: `${h}%`,
                  background: on ? TURQUOISE : "rgba(255,255,255,0.10)",
                  boxShadow: on ? `0 0 6px ${a(TURQUOISE, 35)}` : undefined,
                }}
              />
            );
          })}
        </div>
      </div>

      <div className="space-y-[7px]">
        {INPUTS.map(({ label, value, accent }) => (
          <div key={label} className="flex items-center gap-2">
            <span className="w-[54px] shrink-0 text-[10px] text-white/45">{label}</span>
            <span className="relative h-[5px] flex-1 overflow-hidden rounded-full bg-white/10">
              <span
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ width: `${value}%`, background: accent, boxShadow: `0 0 8px ${a(accent, 30)}` }}
              />
            </span>
            <span className="w-7 shrink-0 text-right text-[10px] font-bold tabular-nums" style={{ color: accent }}>
              {value}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── 03 · Trade Therapist — the week you review, and the weeks you kept ── */

const REVIEW_WEEK = [
  { d: "Mon", r: "+2.0R", c: GREEN },
  { d: "Tue", r: "-1.0R", c: RED },
  { d: "Wed", r: "0.0R", c: AMBER },
  { d: "Thu", r: "+1.5R", c: GREEN },
];
// Twelve weeks, oldest first: written, missed, or still trading.
const KEPT = [0, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 2];

export function TherapistSignature() {
  return (
    <div className="flex h-full flex-col gap-3">
      <Row>
        <Label>Best trades</Label>
        <span className="text-[9px] tabular-nums text-white/35">Aug 31 – Sep 6</span>
      </Row>

      <div className="space-y-1.5">
        {REVIEW_WEEK.map(({ d, r, c }) => (
          <div
            key={d}
            className="flex items-center gap-2.5 rounded-lg border-l-2 bg-white/[0.03] py-[7px] pl-2.5 pr-2.5"
            style={{ borderColor: c }}
          >
            <span className="w-8 shrink-0 text-[10px] font-semibold uppercase tracking-wider text-white/45">{d}</span>
            <span className="h-[3px] flex-1 rounded-full" style={{ background: a(c, 45) }} />
            <span className="shrink-0 text-[11px] font-black tabular-nums" style={{ color: c }}>
              {r}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-auto">
        <Row>
          <Label>Reviews kept</Label>
          <span className="text-[10px] font-bold tabular-nums text-white/70">
            9<span className="text-white/30">/12</span>
          </span>
        </Row>
        <div className="mt-2 flex items-end gap-[3px]">
          {KEPT.map((state, i) => (
            <span
              key={i}
              className="h-7 flex-1 rounded-[3px] border"
              style={
                state === 1
                  ? { background: TURQUOISE, borderColor: "transparent", boxShadow: `0 0 10px ${a(TURQUOISE, 35)}` }
                  : state === 2
                    ? { borderColor: a(TURQUOISE, 50), borderStyle: "dashed", background: a(TURQUOISE, 5) }
                    : { borderColor: "rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.04)" }
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── 04 · Global Markets — the desk: clocks, index, the wire ───────────── */

const VENUES = [
  { code: "TYO", time: "21:55", live: false },
  { code: "LDN", time: "13:55", live: true },
  { code: "NYC", time: "08:55", live: true },
];
const SECTIONS = [
  { n: "01", name: "Overview" },
  { n: "02", name: "Markets" },
  { n: "03", name: "Futures" },
];
const PRINTS = [
  { label: "Nonfarm Payrolls", delta: "+162k", value: "159,1M", up: true },
  { label: "Core CPI", delta: "+0,7", value: "336,8", up: true },
  { label: "Retail Sales", delta: "$-4,5B", value: "$763,6B", up: false },
  { label: "Unemployment", delta: "0bp", value: "4.1%", up: true },
];

export function MarketsSignature() {
  return (
    <div
      className="flex h-full flex-col gap-3 rounded-lg border border-white/[0.08] p-3"
      style={{
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px)," +
          "linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
        backgroundSize: "22px 22px",
      }}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {VENUES.map(({ code, time, live }) => (
          <span key={code} className="flex items-baseline gap-1.5">
            <span
              className="relative top-[-1px] inline-block h-1.5 w-1.5 rounded-full"
              style={{
                background: live ? GREEN : "rgba(255,255,255,0.3)",
                boxShadow: live ? `0 0 8px ${a(GREEN, 60)}` : undefined,
              }}
            />
            <span className="font-mono text-[9px] tracking-[0.16em] text-white/50">{code}</span>
            <span className="text-[11px] font-bold tabular-nums text-white/85">{time}</span>
          </span>
        ))}
      </div>

      {/* The numbered index — words and numerals, the way the desk navigates. */}
      <div className="flex border-y border-white/[0.08]">
        {SECTIONS.map(({ n, name }, i) => (
          <span
            key={n}
            className="flex items-baseline gap-1.5 border-r border-white/[0.06] px-2 py-1.5 last:border-r-0"
            style={i === 0 ? { background: a(TURQUOISE, 8) } : undefined}
          >
            <span className="text-[9px] tabular-nums" style={{ color: i === 0 ? TURQUOISE : "rgba(255,255,255,0.4)" }}>
              {n}
            </span>
            <span
              className="font-heading text-[10px] font-bold uppercase tracking-[0.08em]"
              style={{ color: i === 0 ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.5)" }}
            >
              {name}
            </span>
          </span>
        ))}
      </div>

      <div className="flex-1">
        <Label>Latest prints</Label>
        <div className="mt-1.5 space-y-0">
          {PRINTS.map(({ label, delta, value, up }) => (
            <div key={label} className="flex items-baseline gap-2 border-b border-white/[0.06] py-[6px] last:border-b-0">
              <span className="min-w-0 flex-1 truncate text-[11px] text-white/70">{label}</span>
              <span className="shrink-0 text-[10px] tabular-nums" style={{ color: up ? GREEN : RED }}>
                {delta}
              </span>
              <span className="shrink-0 text-[11px] font-bold tabular-nums text-white/90">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
