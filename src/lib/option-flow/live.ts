/**
 * Live Option Flow data — free sources, no API key.
 *
 *   - Price + 1m/1d bars  → Yahoo Finance chart API (query1.finance.yahoo.com)
 *   - Session levels/VWAP → computed from 1m bars (port of data/session_levels.py)
 *   - Zones               → derived from session levels + prior-week H/L + round numbers
 *   - COT (weekly bias)   → CFTC Socrata public reporting API (port of analysis/cot_bias.py)
 *   - Macro drivers       → Yahoo daily momentum for DXY / Crude / Copper
 *
 * Runs server-side only (called from the /api/option-flow route handler).
 */

import type {
  InstrumentFlow,
  InstrumentKey,
  SessionLevels,
  Zone,
  Zones,
  Cot,
  WeeklyBias,
  MacroScore,
  BiasDirection,
  ZoneStatus,
  ZoneConfidence,
} from "./types";

// ── Instrument config (mirrors /option/config.py) ─────────────────────────────
const INST = {
  NQ: {
    label: "E-mini Nasdaq-100",
    yahoo: "NQ=F",
    cotMarket: "NASDAQ MINI",
    macro: { DXY: -0.4, CRUDE: 0.2, COPPER: 0.5 } as Record<MacroKey, number>,
    roundStep: 250,
  },
  GC: {
    label: "Gold (GC)",
    yahoo: "GC=F",
    cotMarket: "GOLD - COMMODITY EXCHANGE",
    macro: { DXY: -0.8, CRUDE: 0.4, COPPER: 0.4 } as Record<MacroKey, number>,
    roundStep: 50,
  },
} as const;

type MacroKey = "DXY" | "CRUDE" | "COPPER";
const MACRO_TICKERS: Record<MacroKey, string> = {
  DXY: "DX-Y.NYB",
  CRUDE: "CL=F",
  COPPER: "HG=F",
};

// ── Yahoo Finance ─────────────────────────────────────────────────────────────
interface Bar {
  t: number; // unix seconds
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}
interface ChartResult {
  price: number;
  prevClose: number | null;
  bars: Bar[];
}

async function yahooChart(symbol: string, interval: string, range: string): Promise<ChartResult> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    symbol
  )}?interval=${interval}&range=${range}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`Yahoo ${symbol} ${res.status}`);
  const json = await res.json();
  const r = json?.chart?.result?.[0];
  if (!r) throw new Error(`Yahoo ${symbol} empty`);
  const ts: number[] = r.timestamp ?? [];
  const q = r.indicators?.quote?.[0] ?? {};
  const bars: Bar[] = [];
  for (let i = 0; i < ts.length; i++) {
    const o = q.open?.[i],
      h = q.high?.[i],
      l = q.low?.[i],
      c = q.close?.[i],
      v = q.volume?.[i];
    if (o == null || h == null || l == null || c == null) continue;
    bars.push({ t: ts[i], o, h, l, c, v: v ?? 0 });
  }
  return {
    price: r.meta?.regularMarketPrice ?? bars.at(-1)?.c ?? 0,
    prevClose: r.meta?.chartPreviousClose ?? r.meta?.previousClose ?? null,
    bars,
  };
}

// ── Eastern-time helpers ──────────────────────────────────────────────────────
const ET_FMT = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** Returns {date:"YYYY-MM-DD", minutes:<since ET midnight>} for a unix-seconds timestamp. */
function etOf(tsSec: number): { date: string; minutes: number } {
  const parts = ET_FMT.formatToParts(new Date(tsSec * 1000));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    minutes: parseInt(get("hour"), 10) * 60 + parseInt(get("minute"), 10),
  };
}

/** Previous trading day (skips Sat/Sun) as "YYYY-MM-DD". */
function prevTradingDay(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  do {
    dt.setUTCDate(dt.getUTCDate() - 1);
  } while (dt.getUTCDay() === 0 || dt.getUTCDay() === 6);
  return dt.toISOString().slice(0, 10);
}

const rnd = (x: number, dec = 2) => Math.round(x * 10 ** dec) / 10 ** dec;

// ── Session levels (port of compute_session_levels) ───────────────────────────
type ETBar = Bar & { date: string; minutes: number };

function vwapBands(slice: ETBar[]): { vwap: number; std: number } | null {
  if (!slice.length) return null;
  let cv = 0,
    ctp = 0,
    ctp2 = 0;
  for (const b of slice) {
    const tp = (b.h + b.l + b.c) / 3;
    const vol = b.v || 1;
    cv += vol;
    ctp += tp * vol;
    ctp2 += tp * tp * vol;
  }
  if (cv === 0) return null;
  const vwap = ctp / cv;
  const variance = ctp2 / cv - vwap * vwap;
  return { vwap, std: Math.sqrt(Math.max(variance, 0)) };
}

const hi = (b: ETBar[]) => (b.length ? rnd(Math.max(...b.map((x) => x.h))) : null);
const lo = (b: ETBar[]) => (b.length ? rnd(Math.min(...b.map((x) => x.l))) : null);

function computeSessionLevels(bars1m: Bar[], instrument: InstrumentKey): SessionLevels {
  const empty: SessionLevels = {
    PDH: null, PDL: null, PDC: null, PDO: null, ONH: null, ONL: null,
    Asia_H: null, Asia_L: null, London_H: null, London_L: null,
    PreNY_H: null, PreNY_L: null, ORH: null, ORL: null, Sess_H: null, Sess_L: null,
    VWAP: null, "VWAP+1": null, "VWAP+2": null, "VWAP-1": null, "VWAP-2": null,
  };
  const ed: ETBar[] = bars1m.map((b) => ({ ...b, ...etOf(b.t) }));
  if (!ed.length) return empty;

  const now = ed[ed.length - 1];
  const today = now.date;
  const prev = prevTradingDay(today);

  const on = (d: string, a: number, z: number) =>
    ed.filter((b) => b.date === d && b.minutes >= a && b.minutes < z);

  // Prior day RTH 9:30–16:00
  const priorRTH = on(prev, 570, 960);
  const pdh = hi(priorRTH), pdl = lo(priorRTH);
  const pdc = priorRTH.length ? rnd(priorRTH[priorRTH.length - 1].c) : null;
  const pdo = priorRTH.length ? rnd(priorRTH[0].o) : null;

  // Overnight / Globex: prev 16:00 → today 9:30
  const onight = ed.filter(
    (b) =>
      (b.date === prev && b.minutes >= 960) || (b.date === today && b.minutes < 570)
  );
  // Asian 18:00 prev → 02:00 today
  const asia = ed.filter(
    (b) => (b.date === prev && b.minutes >= 1080) || (b.date === today && b.minutes < 120)
  );
  const london = on(today, 120, 480);
  const preny = on(today, 480, 570);
  const orange = on(today, 570, 585); // 9:30–9:45
  const sess = ed.filter((b) => b.date === today && b.minutes >= 570 && b.minutes <= now.minutes);

  // VWAP anchor: GC → 03:00 today; NQ → 18:00 prev (Globex)
  const vwapSlice =
    instrument === "GC"
      ? ed.filter((b) => b.date === today && b.minutes >= 180)
      : ed.filter((b) => (b.date === prev && b.minutes >= 1080) || b.date === today);
  const vb = vwapBands(vwapSlice);
  const v = vb ? rnd(vb.vwap) : null;
  const s = vb ? rnd(vb.std) : 0;

  return {
    PDH: pdh, PDL: pdl, PDC: pdc, PDO: pdo,
    ONH: hi(onight), ONL: lo(onight),
    Asia_H: hi(asia), Asia_L: lo(asia),
    London_H: hi(london), London_L: lo(london),
    PreNY_H: hi(preny), PreNY_L: lo(preny),
    ORH: hi(orange), ORL: lo(orange),
    Sess_H: hi(sess), Sess_L: lo(sess),
    VWAP: v,
    "VWAP+1": v && s ? rnd(v + s) : null,
    "VWAP+2": v && s ? rnd(v + 2 * s) : null,
    "VWAP-1": v && s ? rnd(v - s) : null,
    "VWAP-2": v && s ? rnd(v - 2 * s) : null,
  };
}

// ── Zone building ─────────────────────────────────────────────────────────────
interface RawLevel {
  price: number;
  source: string;
  strength: number;
}

const SESSION_DEFS: { key: keyof SessionLevels; label: string; strength: number }[] = [
  { key: "PDH", label: "Prior Day High", strength: 3 },
  { key: "PDL", label: "Prior Day Low", strength: 3 },
  { key: "PDC", label: "Prior Day Close", strength: 2 },
  { key: "PDO", label: "Prior Day Open", strength: 1 },
  { key: "ONH", label: "Overnight High", strength: 2 },
  { key: "ONL", label: "Overnight Low", strength: 2 },
  { key: "Asia_H", label: "Asian High", strength: 2 },
  { key: "Asia_L", label: "Asian Low", strength: 2 },
  { key: "London_H", label: "London High", strength: 2 },
  { key: "London_L", label: "London Low", strength: 2 },
  { key: "PreNY_H", label: "Pre-NY High", strength: 1 },
  { key: "PreNY_L", label: "Pre-NY Low", strength: 1 },
  { key: "ORH", label: "Opening Range High", strength: 3 },
  { key: "ORL", label: "Opening Range Low", strength: 3 },
  { key: "VWAP", label: "VWAP", strength: 3 },
  { key: "VWAP+1", label: "VWAP +1σ", strength: 3 },
  { key: "VWAP+2", label: "VWAP +2σ", strength: 2 },
  { key: "VWAP-1", label: "VWAP −1σ", strength: 3 },
  { key: "VWAP-2", label: "VWAP −2σ", strength: 2 },
];

/** Append round-number price magnets within ±rangePct of spot. */
function pushRoundNumbers(raw: RawLevel[], spot: number, step: number, rangePct: number, strength: number) {
  const base = Math.round(spot / step) * step;
  const span = Math.ceil((spot * rangePct) / step) + 1;
  for (let k = -span; k <= span; k++) {
    const p = base + k * step;
    if (p > 0 && Math.abs(p - spot) / spot <= rangePct && Math.abs(p - spot) > step * 0.1)
      raw.push({ price: p, source: "Round number", strength });
  }
}

function confFromStrength(strength: number, status: ZoneStatus): ZoneConfidence {
  if (status === "broken") return "BREAKING";
  if (strength >= 4) return "STRONG";
  if (strength >= 3) return "HIGH";
  if (strength >= 2) return "MEDIUM";
  return "LOW";
}

/** Cluster nearby raw levels into zones, merge sources, sum strength (capped 5). */
function clusterToZones(
  raw: RawLevel[],
  spot: number,
  todayBars: ETBar[],
  thresholdPct: number
): Zones {
  const sorted = [...raw].sort((a, b) => a.price - b.price);
  const clusters: RawLevel[][] = [];
  let grp: RawLevel[] = [];
  for (const lvl of sorted) {
    if (!grp.length) grp = [lvl];
    else if (Math.abs(lvl.price - grp[grp.length - 1].price) / grp[grp.length - 1].price < thresholdPct)
      grp.push(lvl);
    else {
      clusters.push(grp);
      grp = [lvl];
    }
  }
  if (grp.length) clusters.push(grp);

  const tickPct = 0.0006; // ~touch tolerance
  const resistance: Zone[] = [];
  const support: Zone[] = [];

  for (const c of clusters) {
    const price = rnd(c.reduce((s, x) => s + x.price, 0) / c.length);
    const sources = [...new Set(c.map((x) => x.source))];
    const strength = Math.min(c.reduce((s, x) => s + x.strength, 0) + (c.length - 1), 5);
    const isRes = price > spot;

    // Status from today's touch behaviour
    const tol = price * tickPct;
    const touched = todayBars.some((b) => b.l <= price + tol && b.h >= price - tol);
    let status: ZoneStatus;
    if (touched) status = "defended";
    else if (Math.abs(price - spot) / spot < 0.0015) status = "approaching";
    else status = "untested";

    const zone: Zone = { price, sources, strength, status, confidence: confFromStrength(strength, status) };
    (isRes ? resistance : support).push(zone);
  }

  // Keep the nearest 7 levels per side, then order for display (res ascending, sup descending).
  const nearest = (arr: Zone[]) =>
    [...arr].sort((a, b) => Math.abs(a.price - spot) - Math.abs(b.price - spot)).slice(0, 7);
  return {
    resistance: nearest(resistance).sort((a, b) => a.price - b.price),
    support: nearest(support).sort((a, b) => b.price - a.price),
  };
}

function applyCotBoost(zones: Zones, bias: BiasDirection, score: number) {
  const boost = Math.abs(score) >= 0.6 ? 2 : 1;
  const target = bias === "BULLISH" ? zones.support : bias === "BEARISH" ? zones.resistance : [];
  const label = bias === "BULLISH" ? "COT/Macro bullish" : "COT/Macro bearish";
  for (const z of target) {
    z.strength = Math.min(z.strength + boost, 5);
    if (!z.sources.includes(label)) z.sources.push(label);
    z.confidence = confFromStrength(z.strength, z.status);
  }
}

// ── COT (port of analysis/cot_bias.py) ────────────────────────────────────────
interface CotRow {
  date: string;
  net_spec: number;
  net_comm: number;
  oi: number;
}

async function fetchCot(marketLike: string): Promise<CotRow[]> {
  const select =
    "report_date_as_yyyy_mm_dd,noncomm_positions_long_all,noncomm_positions_short_all,comm_positions_long_all,comm_positions_short_all,open_interest_all";
  const where = `market_and_exchange_names like '${marketLike}%'`;
  const url =
    `https://publicreporting.cftc.gov/resource/6dca-aqww.json?` +
    `$select=${encodeURIComponent(select)}&$where=${encodeURIComponent(where)}` +
    `&$order=${encodeURIComponent("report_date_as_yyyy_mm_dd DESC")}&$limit=26`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`CFTC ${res.status}`);
  const rows = (await res.json()) as Record<string, string>[];
  return rows
    .map((r) => ({
      date: r.report_date_as_yyyy_mm_dd.slice(0, 10),
      net_spec: +r.noncomm_positions_long_all - +r.noncomm_positions_short_all,
      net_comm: +r.comm_positions_long_all - +r.comm_positions_short_all,
      oi: +r.open_interest_all,
    }))
    .reverse(); // ascending by date
}

function scoreCot(rows: CotRow[]): Cot | null {
  if (rows.length < 4) return null;
  const ns = rows.map((r) => r.net_spec);
  const latest = rows[rows.length - 1];
  const prev = rows[rows.length - 2];
  const net_spec = latest.net_spec;
  const chg = net_spec - prev.net_spec;
  const min = Math.min(...ns),
    max = Math.max(...ns);
  const rng = max - min;
  const normalized = rng !== 0 ? (net_spec - min) / rng : 0.5;
  const mom4 = ns[ns.length - 1] - ns[ns.length - 4];
  const momNorm = Math.tanh(mom4 / (rng * 0.1 + 1));
  let score = 0.6 * (normalized * 2 - 1) + 0.4 * momNorm;
  score = Math.max(-1, Math.min(1, score));
  const label = score > 0.25 ? "bullish" : score < -0.25 ? "bearish" : "neutral";
  return {
    score: rnd(score, 3),
    label,
    net_spec,
    net_spec_chg: chg,
    normalized_positioning: rnd(normalized, 3),
    momentum_4wk: rnd(momNorm, 3),
    net_comm: latest.net_comm,
    open_interest: latest.oi,
    history: rows.map((r) => ({ date: r.date, net_spec: r.net_spec })),
  };
}

// ── Macro momentum ────────────────────────────────────────────────────────────
async function macroScore(key: MacroKey): Promise<number> {
  try {
    const { bars } = await yahooChart(MACRO_TICKERS[key], "1d", "3mo");
    if (bars.length < 21) return 0;
    const last = bars[bars.length - 1].c;
    const ref = bars[bars.length - 21].c;
    const chg = (last - ref) / ref;
    return Math.tanh(chg * 10);
  } catch {
    return 0;
  }
}

function biasFrom(cotScore: number, macroContribution: number): WeeklyBias {
  // PCR unavailable from free source → renormalise COT (40%) + Macro (35%) to sum 1.
  const score = Math.max(-1, Math.min(1, (0.4 * cotScore + 0.35 * macroContribution) / 0.75));
  const bias: BiasDirection = score > 0.2 ? "BULLISH" : score < -0.2 ? "BEARISH" : "NEUTRAL";
  const c = Math.abs(score);
  const confidence = c > 0.6 ? "High" : c > 0.3 ? "Moderate" : "Low";
  return {
    bias,
    score: rnd(score, 3),
    confidence,
    components: { cot: rnd(cotScore, 3), macro: rnd(macroContribution, 3), pcr: 0 },
  };
}

// ── Orchestration ─────────────────────────────────────────────────────────────
async function buildInstrument(
  key: InstrumentKey,
  macroScores: Record<MacroKey, { score: number; label: MacroScore["label"] }>
): Promise<InstrumentFlow> {
  const cfg = INST[key];
  const [intraday, daily, cotRows] = await Promise.all([
    yahooChart(cfg.yahoo, "1m", "5d"),
    yahooChart(cfg.yahoo, "1d", "3mo"),
    fetchCot(cfg.cotMarket).catch(() => [] as CotRow[]),
  ]);

  const spot = rnd(intraday.price);
  const levels = computeSessionLevels(intraday.bars, key);

  const todayBars: ETBar[] = intraday.bars
    .map((b) => ({ ...b, ...etOf(b.t) }))
    .filter((b, _i, arr) => b.date === arr[arr.length - 1].date);

  // COT + macro → bias
  const cot = scoreCot(cotRows);
  const relTotal = Object.values(cfg.macro).reduce((s, v) => s + Math.abs(v), 0);
  const macroContribution = (Object.keys(cfg.macro) as MacroKey[]).reduce(
    (s, mk) => s + (cfg.macro[mk] / relTotal) * macroScores[mk].score,
    0
  );
  const bias = biasFrom(cot?.score ?? 0, macroContribution);

  // ── Intraday zones from session levels (+ round numbers as structural backstop) ──
  const intradayRaw: RawLevel[] = [];
  for (const def of SESSION_DEFS) {
    const p = levels[def.key];
    if (typeof p === "number" && p > 0) intradayRaw.push({ price: p, source: def.label, strength: def.strength });
  }
  // Round-number magnets near spot guarantee structure on both sides (e.g. after a gap).
  pushRoundNumbers(intradayRaw, spot, cfg.roundStep, 0.025, 1);
  const intradayZones = clusterToZones(intradayRaw, spot, todayBars, 0.0012);
  applyCotBoost(intradayZones, bias.bias, bias.score);

  // ── Weekly zones from prior-week H/L + round numbers + % bands ──
  const dBars = daily.bars;
  const weekHigh = dBars.length ? rnd(Math.max(...dBars.slice(-5).map((b) => b.h))) : null;
  const weekLow = dBars.length ? rnd(Math.min(...dBars.slice(-5).map((b) => b.l))) : null;
  const prevWeekHigh = dBars.length > 10 ? rnd(Math.max(...dBars.slice(-10, -5).map((b) => b.h))) : null;
  const prevWeekLow = dBars.length > 10 ? rnd(Math.min(...dBars.slice(-10, -5).map((b) => b.l))) : null;
  const weeklyRaw: RawLevel[] = [];
  if (weekHigh) weeklyRaw.push({ price: weekHigh, source: "5-day High", strength: 3 });
  if (weekLow) weeklyRaw.push({ price: weekLow, source: "5-day Low", strength: 3 });
  if (prevWeekHigh) weeklyRaw.push({ price: prevWeekHigh, source: "Prior Week High", strength: 2 });
  if (prevWeekLow) weeklyRaw.push({ price: prevWeekLow, source: "Prior Week Low", strength: 2 });
  // round-number magnets within ±4%
  pushRoundNumbers(weeklyRaw, spot, cfg.roundStep, 0.04, 2);
  // 1% / 2% structural bands
  for (const pct of [0.01, 0.02]) {
    weeklyRaw.push({ price: rnd(spot * (1 + pct)), source: `+${pct * 100}% band`, strength: 1 });
    weeklyRaw.push({ price: rnd(spot * (1 - pct)), source: `−${pct * 100}% band`, strength: 1 });
  }
  const weeklyZones = clusterToZones(weeklyRaw, spot, [], 0.004);
  applyCotBoost(weeklyZones, bias.bias, bias.score);

  const macro: MacroScore[] = (Object.keys(cfg.macro) as MacroKey[]).map((mk) => ({
    name: mk,
    score: rnd(macroScores[mk].score, 3),
    label: macroScores[mk].label,
    relationship: cfg.macro[mk],
  }));

  const fallbackCot: Cot = {
    score: 0, label: "neutral", net_spec: 0, net_spec_chg: 0,
    normalized_positioning: 0.5, momentum_4wk: 0, net_comm: 0, open_interest: 0, history: [],
  };

  return {
    key,
    label: cfg.label,
    spot,
    updatedAt: new Date().toISOString(),
    dataSource: "yahoo",
    live: true,
    note: "PCR / GEX / Max Pain require options data (not in free Yahoo feed) — bias uses COT + macro only.",
    bias,
    cot: cot ?? fallbackCot,
    macro,
    oi: { pcr: null, pcr_bias: "unavailable", max_pain: null, gex_flip: null },
    sessionLevels: levels,
    zones: { weekly: weeklyZones, intraday: intradayZones },
  };
}

export async function fetchLiveFlows(): Promise<InstrumentFlow[]> {
  // Macro scores shared across instruments
  const [dxy, crude, copper] = await Promise.all([
    macroScore("DXY"),
    macroScore("CRUDE"),
    macroScore("COPPER"),
  ]);
  const labelOf = (s: number): MacroScore["label"] =>
    s > 0.2 ? "bullish" : s < -0.2 ? "bearish" : "neutral";
  const macroScores: Record<MacroKey, { score: number; label: MacroScore["label"] }> = {
    DXY: { score: dxy, label: labelOf(dxy) },
    CRUDE: { score: crude, label: labelOf(crude) },
    COPPER: { score: copper, label: labelOf(copper) },
  };

  return Promise.all([buildInstrument("NQ", macroScores), buildInstrument("GC", macroScores)]);
}
