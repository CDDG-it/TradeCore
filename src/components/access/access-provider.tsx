"use client";

import { createContext, useContext } from "react";
import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { PLANS, type EntitlementKey, type Entitlements, type PlanId } from "@/lib/plans";

type AccessValue = { storedPlan: PlanId; effectivePlan: PlanId; entitlements: Entitlements; launchOverride: boolean };
const AccessContext = createContext<AccessValue>({ storedPlan: "basic", effectivePlan: "pro", entitlements: PLANS.pro.entitlements, launchOverride: true });

export function AccessProvider({ value, children }: { value: AccessValue; children: React.ReactNode }) {
  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>;
}

export function useAccess() { return useContext(AccessContext); }

export function FeatureGate({ feature, children }: { feature: EntitlementKey; children: React.ReactNode }) {
  const access = useAccess();
  const value = access.entitlements[feature];
  const allowed = value === true || value === "unlimited" || value === "full" || value === "markets" || value === "calendar" || typeof value === "number";
  if (allowed) return children;
  const order: PlanId[] = ["basic", "plus", "pro"];
  const required = order.find((plan) => {
    const candidate = PLANS[plan].entitlements[feature];
    return candidate === true || candidate === "unlimited" || candidate === "full" || candidate === "markets" || candidate === "calendar" || typeof candidate === "number";
  }) ?? "pro";
  return <div className="flex min-h-64 items-center justify-center rounded-2xl border border-border/60 bg-card p-8 text-center"><div><LockKeyhole className="mx-auto h-6 w-6 text-primary" /><h2 className="mt-3 font-heading text-lg font-bold">Available on {PLANS[required].name}</h2><p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">Upgrade to unlock this feature and keep your existing data in one workflow.</p><Link href="/pricing" className="mt-4 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Compare plans</Link></div></div>;
}
