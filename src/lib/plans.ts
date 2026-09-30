export type PlanId = "basic" | "plus" | "pro";
export type PlanLimit = number | "unlimited";
export type MindscoreAccess = "score" | "full";
export type GlobalMarketsAccess = "calendar" | "markets" | "full";

export type Entitlements = {
  accounts: PlanLimit;
  journal: true;
  preMarketExercises: true;
  sessionReview: true;
  historyRetentionDays: number | null;
  mindscore: MindscoreAccess;
  habits: true;
  goals: boolean;
  standingRules: boolean;
  advancedAnalytics: boolean;
  screenshots: boolean;
  bestTrade: boolean;
  weeklyReviews: boolean;
  monthlyReviews: boolean;
  propRuleTracking: PlanLimit;
  monteCarlo: boolean;
  globalMarkets: GlobalMarketsAccess;
  prioritySupport: boolean;
};

export type PlanDefinition = {
  id: PlanId;
  name: "Basic" | "Plus" | "Pro";
  monthlyPrice: number;
  annualPrice: number;
  description: string;
  popular?: boolean;
  entitlements: Entitlements;
};

export const PLANS: Record<PlanId, PlanDefinition> = {
  basic: {
    id: "basic", name: "Basic", monthlyPrice: 9, annualPrice: 90,
    description: "Build the daily practice with one account and a focused 90-day history.",
    entitlements: { accounts: 1, journal: true, preMarketExercises: true, sessionReview: true, historyRetentionDays: 90, mindscore: "score", habits: true, goals: false, standingRules: false, advancedAnalytics: false, screenshots: false, bestTrade: false, weeklyReviews: false, monthlyReviews: false, propRuleTracking: 1, monteCarlo: false, globalMarkets: "calendar", prioritySupport: false },
  },
  plus: {
    id: "plus", name: "Plus", monthlyPrice: 19, annualPrice: 190, popular: true,
    description: "Measure your complete edge across up to five trading accounts.",
    entitlements: { accounts: 5, journal: true, preMarketExercises: true, sessionReview: true, historyRetentionDays: null, mindscore: "full", habits: true, goals: true, standingRules: true, advancedAnalytics: true, screenshots: true, bestTrade: true, weeklyReviews: true, monthlyReviews: false, propRuleTracking: 5, monteCarlo: false, globalMarkets: "markets", prioritySupport: false },
  },
  pro: {
    id: "pro", name: "Pro", monthlyPrice: 29, annualPrice: 290,
    description: "Run the full performance system without account or history limits.",
    entitlements: { accounts: "unlimited", journal: true, preMarketExercises: true, sessionReview: true, historyRetentionDays: null, mindscore: "full", habits: true, goals: true, standingRules: true, advancedAnalytics: true, screenshots: true, bestTrade: true, weeklyReviews: true, monthlyReviews: true, propRuleTracking: "unlimited", monteCarlo: true, globalMarkets: "full", prioritySupport: true },
  },
};

export type EntitlementKey = keyof Entitlements;
export type EntitlementDecision = { allowed: boolean; limit?: number; used?: number; requiredPlan?: PlanId; reason?: string };

const ORDER: PlanId[] = ["basic", "plus", "pro"];

export function minimumPlanFor(feature: EntitlementKey): PlanId | undefined {
  return ORDER.find((id) => {
    const value = PLANS[id].entitlements[feature];
    return value === true || value === "full" || value === "markets" || value === "unlimited" || (typeof value === "number" && value > 0);
  });
}

export function decideLimit(plan: PlanId, feature: "accounts" | "propRuleTracking", used: number): EntitlementDecision {
  const limit = PLANS[plan].entitlements[feature];
  if (limit === "unlimited" || used < limit) return { allowed: true, used, ...(limit === "unlimited" ? {} : { limit }) };
  const requiredPlan = ORDER.find((id) => {
    const next = PLANS[id].entitlements[feature];
    return next === "unlimited" || next > used;
  });
  return { allowed: false, used, limit, requiredPlan, reason: `${PLANS[plan].name} allows ${limit} ${feature === "accounts" ? "account" : "tracked account"}${limit === 1 ? "" : "s"}.` };
}

export function resolveEffectivePlan(plan: PlanId, settings: { launchFreeEnabled: boolean; billingEffectiveAt: string | null }, now = new Date()): PlanId {
  const beforeBilling = !settings.billingEffectiveAt || now < new Date(settings.billingEffectiveAt);
  return settings.launchFreeEnabled && beforeBilling ? "pro" : plan;
}
