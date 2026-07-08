/**
 * The full list of pages the product offers today, in the same order and
 * with the exact same wording as the app sidebar. This is the single source
 * of truth for anything outside the authenticated app shell that needs to
 * list "the current tabs" — the landing page's Features dropdown and the
 * footer's Platform column both read from here, so they stay in sync with
 * the real navigation instead of drifting into their own wording over time.
 */
export interface AppTab {
  label: string;
  href: string;
  group: string | null;
}

export const APP_TABS: AppTab[] = [
  { label: "Home", href: "/dashboard", group: null },
  { label: "Journal", href: "/journal", group: "Trading" },
  { label: "Analysis", href: "/analysis", group: "Trading" },
  { label: "Analytics", href: "/analytics", group: "Trading" },
  { label: "Accounts", href: "/accounts", group: "Trading" },
  { label: "Habits", href: "/habits", group: "MC Mindset formula" },
  { label: "Trading Behaviour", href: "/trading-behaviour", group: "MC Mindset formula" },
  { label: "Option Flow", href: "/option-flow", group: "MC Option Flow" },
  { label: "MC News Dashboard", href: "/news-city", group: "MC News Dashboard" },
];
