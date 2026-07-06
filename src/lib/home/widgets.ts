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

// ── Per-widget view options ──────────────────────────────────────────
// A few widgets summarise trades, so it's useful to scope them the same way
// the Journal/Analytics already let you filter: by period and by session.
// Only the widgets that make sense to scope declare which controls they use;
// the rest just render their fixed view.

export type WidgetScope = "all" | "month" | "week";
export type WidgetSessionFilter = "all" | "London" | "New York" | "Asia";

export interface WidgetOptions {
  scope?: WidgetScope;
  session?: WidgetSessionFilter;
  /** How many rows to show, for list-style widgets like Recent Trades. */
  count?: number;
}

export interface WidgetControlConfig {
  scope?: boolean;
  session?: boolean;
  counts?: number[];
}

/** Which controls each widget exposes in its options menu. Widgets absent
 *  here have no configurable options. */
export const WIDGET_CONTROLS: Partial<Record<WidgetId, WidgetControlConfig>> = {
  "win-rate": { scope: true, session: true },
  "weekly-r": { scope: true, session: true },
  discipline: { scope: true },
  "recent-trades": { session: true, counts: [3, 5, 10] },
};

export const DEFAULT_WIDGET_OPTIONS: WidgetOptions = { scope: "week", session: "all", count: 3 };

const OPTIONS_LS_KEY = "home_widget_options_v1";

function isWidgetOptions(v: unknown): v is WidgetOptions {
  return typeof v === "object" && v !== null;
}

export function loadWidgetOptions(): Partial<Record<WidgetId, WidgetOptions>> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(OPTIONS_LS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return {};
    const clean: Partial<Record<WidgetId, WidgetOptions>> = {};
    for (const [id, opts] of Object.entries(parsed)) {
      if (isWidgetId(id) && isWidgetOptions(opts)) clean[id] = opts as WidgetOptions;
    }
    return clean;
  } catch {
    return {};
  }
}

export function saveWidgetOptions(options: Partial<Record<WidgetId, WidgetOptions>>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(OPTIONS_LS_KEY, JSON.stringify(options));
  } catch {
    /* ignore quota / private-mode errors */
  }
}

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
