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
  /** Feature is announced but not yet live — shown with a "Soon" badge and not navigable. */
  soon?: boolean;
  /** Short label for the phone tab bar, where a full name would wrap. */
  short?: string;
}

export const APP_TABS: AppTab[] = [
  { label: "Dashboard", href: "/dashboard", group: null },
  { label: "Journal", href: "/journal", group: "Trading" },
  { label: "Analysis", href: "/analysis", group: "Trading" },
  { label: "Analytics", href: "/analytics", group: "Trading" },
  { label: "Accounts", href: "/accounts", group: "Trading" },
  // My Edge holds both halves: Mind Edge (habits, Mindscore) and Strategy
  // (rules & confluences, pass simulation). /strategy redirects into it.
  { label: "My Edge", href: "/psychological-edge", group: "MC Mindset formula" },
  { label: "MC Trade Therapist", href: "/trade-therapist", group: "MC Mindset formula" },
  // Option Flow is not listed here — it lives as a subtab of Global Markets.
  { label: "Global Markets", href: "/news-city", group: "MC News Dashboard" },
];

/**
 * The trimmed top-bar navigation. The Trading pages (Journal, Analysis,
 * Analytics, Accounts) are reached from the Dashboard hub instead, keeping the
 * bar itself down to the four primary destinations.
 *
 * On phones this same list becomes the fixed bottom tab bar, which is why every
 * entry carries a `short` label — "MC Trade Therapist" cannot survive a quarter
 * of a 375px screen.
 */
export const PRIMARY_NAV: AppTab[] = [
  { label: "Dashboard", href: "/dashboard", group: null, short: "Home" },
  { label: "My Edge", href: "/psychological-edge", group: null, short: "My Edge" },
  { label: "MC Trade Therapist", href: "/trade-therapist", group: null, short: "Therapist" },
  { label: "Global Markets", href: "/news-city", group: null, short: "Markets" },
];
