import type { NewsCategory } from "@/lib/news-city/types";

export type CitySelection =
  | { kind: "core" }
  | { kind: "category"; id: NewsCategory }
  | { kind: "event"; id: string };

export function selectionKey(sel: CitySelection | null): string | null {
  if (!sel) return null;
  if (sel.kind === "core") return "core";
  if (sel.kind === "category") return `category:${sel.id}`;
  return `event:${sel.id}`;
}
