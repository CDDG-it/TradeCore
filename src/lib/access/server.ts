import "server-only";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PLANS, type EntitlementDecision, type EntitlementKey, type Entitlements, type GlobalMarketsAccess, type PlanId } from "@/lib/plans";

export type ResolvedAccess = { storedPlan: PlanId; effectivePlan: PlanId; entitlements: Entitlements; launchOverride: boolean };

/**
 * Launch-free is the running state of the product while it is in testing:
 * every signed-in account gets the full Pro feature set. It is opt-out, so a
 * missing or half-applied entitlement migration can never quietly demote
 * testers to Basic. Set LAUNCH_FREE_ENABLED=false (and, optionally,
 * BILLING_EFFECTIVE_AT) to switch paid plans on.
 */
export function launchFreeAccess(storedPlan: PlanId, now = new Date()): ResolvedAccess | null {
  if (process.env.LAUNCH_FREE_ENABLED === "false") return null;
  const billingEffectiveAt = process.env.BILLING_EFFECTIVE_AT ?? null;
  if (billingEffectiveAt && now >= new Date(billingEffectiveAt)) return null;
  return { storedPlan, effectivePlan: "pro", entitlements: PLANS.pro.entitlements, launchOverride: storedPlan !== "pro" };
}

export async function resolveAccess(): Promise<ResolvedAccess> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  // While launch-free runs there is nothing to look up: everyone is Pro.
  const launchFree = launchFreeAccess("basic");
  if (launchFree) return launchFree;
  const [{ data: row }, { data: effective, error }] = await Promise.all([
    supabase.from("user_access").select("plan_id").eq("user_id", user.id).maybeSingle(),
    supabase.rpc("effective_entitlements", { for_user: user.id }),
  ]);
  const storedPlan = (row?.plan_id ?? "basic") as PlanId;
  if (error || !effective) {
    // Entitlement migration not installed yet: fall back to the stored plan.
    return { storedPlan, effectivePlan: storedPlan, entitlements: PLANS[storedPlan].entitlements, launchOverride: false };
  }
  const raw = effective as Record<string, unknown>;
  const effectivePlan = (raw.planId ?? storedPlan) as PlanId;
  const snapshot = { ...raw };
  delete snapshot.planId;
  return { storedPlan, effectivePlan, entitlements: snapshot as Entitlements, launchOverride: effectivePlan === "pro" && storedPlan !== "pro" };
}

export function entitlementDecision(access: ResolvedAccess, feature: EntitlementKey): EntitlementDecision {
  const value = access.entitlements[feature];
  const allowed = value === true || value === "unlimited" || value === "full" || value === "markets" || value === "calendar" || typeof value === "number";
  if (allowed) return { allowed: true };
  const order: PlanId[] = ["basic", "plus", "pro"];
  const requiredPlan = order.find((plan) => {
    const candidate = PLANS[plan].entitlements[feature];
    return candidate === true || candidate === "unlimited" || candidate === "full" || candidate === "markets" || candidate === "calendar" || typeof candidate === "number";
  });
  return { allowed: false, requiredPlan, reason: `${feature} is available on ${requiredPlan ? PLANS[requiredPlan].name : "a higher plan"}.` };
}

export async function requireGlobalMarkets(required: GlobalMarketsAccess): Promise<NextResponse | null> {
  try {
    const access = await resolveAccess();
    const order: GlobalMarketsAccess[] = ["calendar", "markets", "full"];
    if (order.indexOf(access.entitlements.globalMarkets) >= order.indexOf(required)) return null;
    const requiredPlan: PlanId = required === "full" ? "pro" : "plus";
    return NextResponse.json({ error: `${PLANS[requiredPlan].name} unlocks this Global Markets view.`, requiredPlan }, { status: 403, headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Not signed in" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }
}
