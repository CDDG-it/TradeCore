/**
 * Home widget registry + persistence.
 *
 * The Home page is a modular dashboard: each widget is a small, self-contained
 * preview of one area of the app that links through to the full page. New
 * widgets only need an entry here plus a component in
 * `src/components/home/widgets.tsx` — nothing else in the page has to change.
 *
 * Which widgets are enabled (and in what order) is stored per-browser in
 * localStorage so the layout is personal and survives reloads without needing
 * a database migration.
 */

export type WidgetId =
  | "weekly-r"
  | "discipline"
  | "habits-streak"
  | "recent-trades"
  | "active-accounts"
  | "calendar"
  | "trading-rules"
  | "win-rate";

/** The page/area a widget belongs to — used to group the "Add widget" picker. */
export type WidgetSource =
  | "Journal"
  | "Habits"
  | "Analytics"
  | "Calendar"
  | "Trading Rules"
  | "Accounts";

export interface WidgetMeta {
  id: WidgetId;
  title: string;
  source: WidgetSource;
  href: string;
  description: string;
}

export const WIDGETS: WidgetMeta[] = [
  { id: "weekly-r", title: "Weekly R", source: "Journal", href: "/journal", description: "Your net R for the current week." },
  { id: "recent-trades", title: "Recent Trades", source: "Journal", href: "/journal", description: "Your latest logged trades." },
  { id: "win-rate", title: "Win Rate", source: "Analytics", href: "/analytics", description: "Win rate across all trades." },
  { id: "discipline", title: "Discipline Score", source: "Habits", href: "/discipline", description: "Trade-rule and habit consistency this week." },
  { id: "habits-streak", title: "Habits Streak", source: "Habits", href: "/habits", description: "Longest active streak and today's progress." },
  { id: "trading-rules", title: "Trading Rules", source: "Trading Rules", href: "/habits", description: "Your pre-trade checklist at a glance." },
  { id: "active-accounts", title: "Active Accounts", source: "Accounts", href: "/accounts", description: "Funded accounts and capital in play." },
  { id: "calendar", title: "Upcoming Events", source: "Calendar", href: "/habits", description: "The next items from your connected calendar." },
];

export const WIDGET_MAP: Record<WidgetId, WidgetMeta> = Object.fromEntries(
  WIDGETS.map((w) => [w.id, w])
) as Record<WidgetId, WidgetMeta>;

/** Widgets shown by default before the trader customises their Home. */
export const DEFAULT_WIDGETS: WidgetId[] = [
  "weekly-r",
  "discipline",
  "habits-streak",
  "recent-trades",
  "active-accounts",
  "calendar",
];

const LS_KEY = "home_widgets_v1";

const isWidgetId = (v: unknown): v is WidgetId =>
  typeof v === "string" && v in WIDGET_MAP;

export function loadWidgets(): WidgetId[] {
  if (typeof window === "undefined") return DEFAULT_WIDGETS;
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return DEFAULT_WIDGETS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_WIDGETS;
    // Keep only valid, known ids and drop duplicates.
    const seen = new Set<WidgetId>();
    const clean = parsed.filter(isWidgetId).filter((id) => (seen.has(id) ? false : (seen.add(id), true)));
    return clean;
  } catch {
    return DEFAULT_WIDGETS;
  }
}

export function saveWidgets(ids: WidgetId[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(ids));
  } catch {
    /* ignore quota / private-mode errors */
  }
}
