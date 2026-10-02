/**
 * The instrument catalogue: every market a funded trader is likely to log.
 *
 * Funded traders split into two camps. Futures prop firms (Topstep, Apex, ...)
 * trade CME contracts, usually the micro and mini of the same index. Forex/CFD
 * prop firms (FTMO, FundedNext, ...) trade currency pairs plus CFDs on indices,
 * metals, energy and crypto. One catalogue serves both, and `group` ties the
 * different wrappers of one underlying together (NQ, MNQ and US100 are all
 * "Nasdaq"), so anything that groups by market reads them as one.
 *
 * Symbols are stored on trades as typed here, upper case. Anything outside the
 * catalogue is still a valid instrument: it simply shows as its own symbol.
 */
import type { Market } from "@/lib/types";

export type AssetClass = "futures" | "forex" | "indices" | "metals" | "energy" | "crypto";

export interface InstrumentDef {
  symbol: string;
  /** Contract or pair name, e.g. "Micro E-mini Nasdaq-100". */
  name: string;
  assetClass: AssetClass;
  /** The underlying market, shared by every wrapper of it. */
  group: string;
  venue: "futures" | "cfd";
}

const fut = (symbol: string, name: string, group: string): InstrumentDef => ({
  symbol, name, group, assetClass: "futures", venue: "futures",
});
const cfd = (symbol: string, name: string, group: string, assetClass: Exclude<AssetClass, "futures">): InstrumentDef => ({
  symbol, name, group, assetClass, venue: "cfd",
});
const pair = (symbol: string): InstrumentDef =>
  cfd(symbol, `${symbol.slice(0, 3)}/${symbol.slice(3)}`, `${symbol.slice(0, 3)}/${symbol.slice(3)}`, "forex");

export const INSTRUMENTS: InstrumentDef[] = [
  // ── Futures: equity indices ──
  fut("ES", "E-mini S&P 500", "S&P 500"),
  fut("MES", "Micro E-mini S&P 500", "S&P 500"),
  fut("NQ", "E-mini Nasdaq-100", "Nasdaq"),
  fut("MNQ", "Micro E-mini Nasdaq-100", "Nasdaq"),
  fut("YM", "E-mini Dow", "Dow"),
  fut("MYM", "Micro E-mini Dow", "Dow"),
  fut("RTY", "E-mini Russell 2000", "Russell 2000"),
  fut("M2K", "Micro E-mini Russell 2000", "Russell 2000"),
  // ── Futures: energy, metals ──
  fut("CL", "Crude Oil", "Crude Oil"),
  fut("MCL", "Micro Crude Oil", "Crude Oil"),
  fut("NG", "Natural Gas", "Natural Gas"),
  fut("GC", "Gold", "Gold"),
  fut("MGC", "Micro Gold", "Gold"),
  fut("SI", "Silver", "Silver"),
  fut("SIL", "Micro Silver", "Silver"),
  fut("HG", "Copper", "Copper"),
  // ── Futures: rates, currencies, crypto ──
  fut("ZB", "30-Year T-Bond", "T-Bond"),
  fut("ZN", "10-Year T-Note", "T-Note"),
  fut("6E", "Euro FX", "EUR/USD"),
  fut("M6E", "Micro Euro FX", "EUR/USD"),
  fut("6B", "British Pound", "GBP/USD"),
  fut("6J", "Japanese Yen", "USD/JPY"),
  fut("6A", "Australian Dollar", "AUD/USD"),
  fut("BTC", "Bitcoin", "Bitcoin"),
  fut("MBT", "Micro Bitcoin", "Bitcoin"),
  fut("ETH", "Ether", "Ether"),
  fut("MET", "Micro Ether", "Ether"),

  // ── Forex: majors, then the common crosses ──
  ...["EURUSD", "GBPUSD", "USDJPY", "USDCHF", "AUDUSD", "USDCAD", "NZDUSD"].map(pair),
  ...["EURJPY", "GBPJPY", "EURGBP", "AUDJPY", "EURAUD", "GBPAUD", "CADJPY", "CHFJPY", "EURCHF", "GBPCAD", "AUDCAD", "NZDJPY"].map(pair),

  // ── CFDs ──
  cfd("US100", "US Tech 100", "Nasdaq", "indices"),
  cfd("US30", "US 30", "Dow", "indices"),
  cfd("US500", "US 500", "S&P 500", "indices"),
  cfd("GER40", "Germany 40", "DAX", "indices"),
  cfd("UK100", "UK 100", "FTSE 100", "indices"),
  cfd("JP225", "Japan 225", "Nikkei", "indices"),
  cfd("XAUUSD", "Gold spot", "Gold", "metals"),
  cfd("XAGUSD", "Silver spot", "Silver", "metals"),
  cfd("USOIL", "WTI Crude", "Crude Oil", "energy"),
  cfd("UKOIL", "Brent Crude", "Brent", "energy"),
  cfd("BTCUSD", "Bitcoin", "Bitcoin", "crypto"),
  cfd("ETHUSD", "Ether", "Ether", "crypto"),
];

/** Older symbols and broker spellings that map onto a catalogue entry. */
const ALIASES: Record<string, string> = {
  // "GOLD" was the gold button when the app was futures-only.
  GOLD: "GC",
  SILVER: "XAGUSD",
  NAS100: "US100",
  USTEC: "US100",
  SPX500: "US500",
  US30CASH: "US30",
  DJ30: "US30",
  DE40: "GER40",
  GER30: "GER40",
  WTI: "USOIL",
  BRENT: "UKOIL",
};

const BY_SYMBOL = new Map(INSTRUMENTS.map((i) => [i.symbol, i]));

export const ASSET_CLASSES: { id: AssetClass; label: string }[] = [
  { id: "futures", label: "Futures" },
  { id: "forex", label: "Forex" },
  { id: "indices", label: "Indices" },
  { id: "metals", label: "Metals" },
  { id: "energy", label: "Energy" },
  { id: "crypto", label: "Crypto" },
];

/** Offered when the trader has not set their markets yet: one sensible pick per camp. */
export const DEFAULT_PICKS = ["NQ", "ES", "GC", "EURUSD", "US100", "XAUUSD"];

/** Normalise what a trader typed into a stored symbol. */
export const normalizeSymbol = (s: string) => (s ?? "").trim().toUpperCase().replace(/[\s/]/g, "");

export function findInstrument(symbol: string): InstrumentDef | undefined {
  const s = normalizeSymbol(symbol);
  return BY_SYMBOL.get(s) ?? BY_SYMBOL.get(ALIASES[s] ?? "");
}

/** The name traders recognise at a glance: the underlying market ("Nasdaq", "EUR/USD"). */
export function instrumentName(symbol: string): string {
  return findInstrument(symbol)?.group ?? symbol;
}

/** The `market` stored on a trade, derived from its instrument. */
export function marketOf(symbol: string): Market {
  const def = findInstrument(symbol);
  if (!def) return "futures";
  if (def.venue === "futures") return "futures";
  if (def.assetClass === "forex") return "forex";
  if (def.assetClass === "crypto") return "crypto";
  return "cfd";
}

/** Catalogue search for pickers: symbol, contract name or underlying. */
export function searchInstruments(query: string, assetClass?: AssetClass): InstrumentDef[] {
  const q = query.trim().toLowerCase();
  return INSTRUMENTS.filter(
    (i) =>
      (!assetClass || i.assetClass === assetClass) &&
      (!q || i.symbol.toLowerCase().includes(q) || i.name.toLowerCase().includes(q) || i.group.toLowerCase().includes(q))
  );
}

/**
 * The trader's markets from their profile. Falls back to the older single
 * `preferred_instrument` so a profile saved before the list existed still
 * gets its one market. Read defensively: the column may not exist yet.
 */
export function tradedInstruments(
  profile: { traded_instruments?: string[] | null; preferred_instrument?: string | null } | null | undefined
): string[] {
  // Catalogue spelling where there is one ("GOLD" → "GC"); custom symbols as typed.
  const canonical = (s: string) => findInstrument(s)?.symbol ?? normalizeSymbol(s);
  const list = (profile?.traded_instruments ?? []).map(canonical).filter(Boolean);
  if (list.length) return [...new Set(list)];
  const single = normalizeSymbol(profile?.preferred_instrument ?? "");
  return single && single !== "OTHER" ? [canonical(single)] : [];
}
