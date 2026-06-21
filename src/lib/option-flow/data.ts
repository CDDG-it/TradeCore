/**
 * Option Flow mock data.
 *
 * Snapshots are hand-built to mirror the live Python engine output for NQ and
 * GC. Swap `getInstrumentFlow` / `getAllFlows` for a real fetch (Python service
 * or Supabase cache) later — the consuming page only depends on the types.
 */

import type { InstrumentFlow, InstrumentKey } from "./types";

/** Build a 26-week net-spec history walking back from a current value. */
function buildCotHistory(current: number, weeklyDrift: number, jitter: number): { date: string; net_spec: number }[] {
  const out: { date: string; net_spec: number }[] = [];
  const start = new Date("2026-06-16T00:00:00Z"); // most recent Tuesday (COT report day)
  let value = current - weeklyDrift * 25;
  for (let i = 25; i >= 0; i--) {
    const d = new Date(start);
    d.setUTCDate(d.getUTCDate() - i * 7);
    // deterministic pseudo-jitter so the chart looks organic but stable
    const wobble = Math.sin(i * 1.7) * jitter;
    out.push({ date: d.toISOString().slice(0, 10), net_spec: Math.round(value + wobble) });
    value += weeklyDrift;
  }
  return out;
}

const FLOWS: Record<InstrumentKey, InstrumentFlow> = {
  NQ: {
    key: "NQ",
    label: "E-mini Nasdaq-100",
    spot: 22148.5,
    updatedAt: "2026-06-21T13:42:00Z",
    dataSource: "tastytrade",
    bias: {
      bias: "BULLISH",
      score: 0.41,
      confidence: "Moderate",
      components: { cot: 0.38, macro: 0.22, pcr: 0.5 },
    },
    cot: {
      score: 0.38,
      label: "bullish",
      net_spec: 18420,
      net_spec_chg: 2140,
      normalized_positioning: 0.71,
      momentum_4wk: 0.33,
      net_comm: -21340,
      open_interest: 256800,
      history: buildCotHistory(18420, 520, 1400),
    },
    macro: [
      { name: "DXY", score: -0.28, label: "bearish", relationship: -0.4 },
      { name: "CRUDE", score: 0.12, label: "neutral", relationship: 0.2 },
      { name: "COPPER", score: 0.34, label: "bullish", relationship: 0.5 },
    ],
    oi: { pcr: 0.78, pcr_bias: "bullish", max_pain: 22000, gex_flip: 21950 },
    sessionLevels: {
      PDH: 22210,
      PDL: 21980,
      PDC: 22165,
      PDO: 22040,
      ONH: 22188,
      ONL: 22075,
      Asia_H: 22150,
      Asia_L: 22090,
      London_H: 22180,
      London_L: 22095,
      PreNY_H: 22195,
      PreNY_L: 22120,
      ORH: 22175,
      ORL: 22128,
      Sess_H: 22182,
      Sess_L: 22118,
      VWAP: 22141,
      "VWAP+1": 22176,
      "VWAP+2": 22211,
      "VWAP-1": 22106,
      "VWAP-2": 22071,
    },
    zones: {
      weekly: {
        resistance: [
          { price: 22420, sources: ["OI call wall", "Implied move +2σ"], strength: 4, status: "untested", confidence: "STRONG" },
          { price: 22310, sources: ["Greeks GEX wall", "Prior week high"], strength: 3, status: "untested", confidence: "HIGH" },
          { price: 22210, sources: ["Prior Day High", "COT/Macro bearish"], strength: 2, status: "approaching", confidence: "MEDIUM" },
        ],
        support: [
          { price: 21950, sources: ["GEX Flip", "Max pain", "COT/Macro bullish"], strength: 5, status: "untested", confidence: "STRONG" },
          { price: 21780, sources: ["OI put wall", "COT/Macro bullish"], strength: 4, status: "untested", confidence: "HIGH" },
          { price: 21540, sources: ["Implied move -2σ"], strength: 2, status: "untested", confidence: "MEDIUM" },
        ],
      },
      intraday: {
        resistance: [
          { price: 22211, sources: ["VWAP +2σ", "Prior Day High"], strength: 4, status: "approaching", confidence: "HIGH" },
          { price: 22188, sources: ["Overnight High", "Pre-NY High"], strength: 3, status: "defended", confidence: "MEDIUM" },
          { price: 22176, sources: ["VWAP +1σ", "OR High"], strength: 3, status: "approaching", confidence: "STRONG" },
        ],
        support: [
          { price: 22106, sources: ["VWAP -1σ", "OR Low"], strength: 3, status: "defended", confidence: "STRONG" },
          { price: 22075, sources: ["Overnight Low", "POC (prior day)"], strength: 4, status: "untested", confidence: "HIGH" },
          { price: 21980, sources: ["Prior Day Low", "Whale absorption"], strength: 3, status: "untested", confidence: "MEDIUM" },
        ],
      },
    },
  },
  GC: {
    key: "GC",
    label: "Gold (GC)",
    spot: 3384.6,
    updatedAt: "2026-06-21T13:42:00Z",
    dataSource: "tastytrade",
    bias: {
      bias: "BEARISH",
      score: -0.31,
      confidence: "Moderate",
      components: { cot: -0.18, macro: -0.44, pcr: -0.5 },
    },
    cot: {
      score: -0.18,
      label: "bearish",
      net_spec: 192400,
      net_spec_chg: -8600,
      normalized_positioning: 0.42,
      momentum_4wk: -0.27,
      net_comm: -214500,
      open_interest: 478200,
      history: buildCotHistory(192400, -1800, 9000),
    },
    macro: [
      { name: "DXY", score: 0.41, label: "bullish", relationship: -0.8 },
      { name: "CRUDE", score: -0.09, label: "neutral", relationship: 0.4 },
      { name: "COPPER", score: 0.05, label: "neutral", relationship: 0.4 },
    ],
    oi: { pcr: 1.24, pcr_bias: "bearish", max_pain: 3400, gex_flip: 3410 },
    sessionLevels: {
      PDH: 3398,
      PDL: 3362,
      PDC: 3389,
      PDO: 3371,
      ONH: 3392,
      ONL: 3368,
      Asia_H: 3386,
      Asia_L: 3370,
      London_H: 3394,
      London_L: 3372,
      PreNY_H: 3390,
      PreNY_L: 3378,
      ORH: 3388,
      ORL: 3376,
      Sess_H: 3391,
      Sess_L: 3379,
      VWAP: 3383,
      "VWAP+1": 3390,
      "VWAP+2": 3397,
      "VWAP-1": 3376,
      "VWAP-2": 3369,
    },
    zones: {
      weekly: {
        resistance: [
          { price: 3438, sources: ["OI call wall", "Implied move +2σ", "COT/Macro bearish"], strength: 5, status: "untested", confidence: "STRONG" },
          { price: 3410, sources: ["GEX Flip", "COT/Macro bearish"], strength: 4, status: "approaching", confidence: "HIGH" },
          { price: 3398, sources: ["Prior Day High"], strength: 2, status: "approaching", confidence: "MEDIUM" },
        ],
        support: [
          { price: 3340, sources: ["OI put wall", "Max pain"], strength: 4, status: "untested", confidence: "HIGH" },
          { price: 3300, sources: ["Implied move -2σ", "Round number"], strength: 3, status: "untested", confidence: "MEDIUM" },
          { price: 3262, sources: ["Prior week low"], strength: 2, status: "untested", confidence: "LOW" },
        ],
      },
      intraday: {
        resistance: [
          { price: 3397, sources: ["VWAP +2σ", "London High"], strength: 3, status: "approaching", confidence: "HIGH" },
          { price: 3392, sources: ["Overnight High"], strength: 2, status: "defended", confidence: "BREAKING" },
          { price: 3390, sources: ["VWAP +1σ", "Pre-NY High"], strength: 3, status: "approaching", confidence: "STRONG" },
        ],
        support: [
          { price: 3376, sources: ["VWAP -1σ", "OR Low"], strength: 3, status: "defended", confidence: "STRONG" },
          { price: 3368, sources: ["Overnight Low", "London Fix Price"], strength: 4, status: "untested", confidence: "HIGH" },
          { price: 3362, sources: ["Prior Day Low", "POC (prior day)"], strength: 3, status: "untested", confidence: "MEDIUM" },
        ],
      },
    },
  },
};

export function getAllFlows(): InstrumentFlow[] {
  return Object.values(FLOWS);
}

export function getInstrumentFlow(key: InstrumentKey): InstrumentFlow {
  return FLOWS[key];
}

export const INSTRUMENT_KEYS: InstrumentKey[] = ["NQ", "GC"];
