import type { CentralBank, Commodity, MacroForce } from "@/lib/news-city/types";

export type CitySelection =
  | { kind: "bank"; id: CentralBank["id"] }
  | { kind: "commodity"; id: Commodity["id"] }
  | { kind: "macro"; id: MacroForce["id"] }
  | { kind: "hq" }
  | { kind: "core" };

export function selectionKey(sel: CitySelection | null): string | null {
  if (!sel) return null;
  return sel.kind === "hq" || sel.kind === "core" ? sel.kind : `${sel.kind}:${sel.id}`;
}
