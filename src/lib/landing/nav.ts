import { FEATURE_BY_SLUG, type Feature } from "@/lib/landing/features";

/**
 * The public site's navigation. Products link to the feature pages that
 * already exist; trader levels point at the landing sections that speak to
 * each stage. Keep both lists short: a menu is a map, not the catalogue.
 */
export type ProductGroup = { title: string; features: Feature[] };

function pick(...slugs: string[]): Feature[] {
  return slugs.map((slug) => FEATURE_BY_SLUG[slug]).filter(Boolean);
}

export const PRODUCT_GROUPS: ProductGroup[] = [
  { title: "MC Mindset formula", features: pick("trade-therapist", "psychological-edge", "habits") },
  { title: "Trading", features: pick("journal", "analysis", "analytics", "accounts") },
  { title: "Context", features: pick("news-city", "dashboard") },
];

export const TRADER_LEVELS = [
  { label: "Starting out", body: "Build the routine before the results: a written plan, one focus per day, habits that hold.", href: "/#the-approach" },
  { label: "Developing", body: "You have a setup. Execute it consistently and let MC Mindscore show the work.", href: "/#mindscore" },
  { label: "Profitable", body: "Protect the edge. Weekly reviews and the best-trade verdict catch drift before it costs.", href: "/#review" },
  { label: "Prop firm traders", body: "Evaluations, drawdown and payout windows tracked beside the plan you wrote.", href: "/features/accounts" },
] as const;
