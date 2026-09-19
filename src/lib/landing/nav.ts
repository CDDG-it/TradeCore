/**
 * The public site's navigation. Products scroll to the landing section that
 * shows them; trader levels open their own page. Keep both lists short: a menu
 * is a map, not the catalogue.
 */
export type Product = {
  name: string;
  tagline: string;
  /** Anchor on the landing page. */
  href: string;
  /** Key for the icon map in the nav component. */
  icon: "dashboard" | "edge" | "therapist" | "markets";
};

export const PRODUCTS: Product[] = [
  { name: "All in one dashboard", tagline: "Your whole trading day on one screen.", href: "/#dashboard", icon: "dashboard" },
  { name: "My Edge", tagline: "Your plan, commitments, habits and one score for how ready you are.", href: "/#the-approach", icon: "edge" },
  { name: "MC Trade Therapist", tagline: "Pre-market exercises, session reviews and the best trade of the day.", href: "/#trade-therapist", icon: "therapist" },
  { name: "Global Markets dashboard", tagline: "Releases, positioning and the rates backdrop beside your plan.", href: "/#market-context", icon: "markets" },
];

export type TraderLevelSlug = "starting-out" | "developing" | "profitable" | "prop-firm";

export const TRADER_LEVELS: { slug: TraderLevelSlug; label: string; body: string; href: string }[] = [
  { slug: "starting-out", label: "Starting out", body: "Build the routine before the results: a written plan, one focus per day, habits that hold.", href: "/traders/starting-out" },
  { slug: "developing", label: "Developing", body: "You have a setup. Execute it consistently and let MC Mindscore show the work.", href: "/traders/developing" },
  { slug: "profitable", label: "Profitable", body: "Protect the edge. Weekly reviews and the best-trade verdict catch drift before it costs.", href: "/traders/profitable" },
  { slug: "prop-firm", label: "Prop firm traders", body: "Evaluations, drawdown and payout windows tracked beside the plan you wrote.", href: "/traders/prop-firm" },
];
