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
  { label: "Dashboard", href: "/dashboard", group: null },
  { label: "Journal", href: "/journal", group: "Trading" },
  { label: "Analysis", href: "/analysis", group: "Trading" },
  { label: "Analytics", href: "/analytics", group: "Trading" },
  { label: "Accounts", href: "/accounts", group: "Trading" },
  { label: "MC Mind Edge", href: "/psychological-edge", group: "MC Mindset formula" },
  { label: "MC Trade Therapist", href: "/trade-therapist", group: "MC Mindset formula" },
  { label: "My Strategy", href: "/strategy", group: "MC Mindset formula" },
  { label: "Option Flow", href: "/option-flow", group: "MC Option Flow" },
  { label: "MC News Dashboard", href: "/news-city", group: "MC News Dashboard" },
];

/**
 * The trimmed top-bar navigation. The Trading pages (Journal, Analysis,
 * Analytics, Accounts) are reached from the Dashboard hub instead, keeping the
 * bar itself down to the four primary destinations.
 */
export const PRIMARY_NAV: AppTab[] = [
  { label: "Dashboard", href: "/dashboard", group: null },
  { label: "MC Mind Edge", href: "/psychological-edge", group: null },
  { label: "MC Trade Therapist", href: "/trade-therapist", group: null },
  { label: "My Strategy", href: "/strategy", group: null },
  { label: "Option Flow", href: "/option-flow", group: null },
  { label: "MC News Dashboard", href: "/news-city", group: null },
];
