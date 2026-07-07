import type { CentralBank, Commodity, MacroForce } from "@/lib/news-city/types";

export type CitySelection =
  | { kind: "bank"; id: CentralBank["id"] }
  | { kind: "commodity"; id: Commodity["id"] }
  | { kind: "macro"; id: MacroForce["id"] }
  | { kind: "hq" };

export function selectionKey(sel: CitySelection | null): string | null {
  if (!sel) return null;
  return sel.kind === "hq" ? "hq" : `${sel.kind}:${sel.id}`;
}
