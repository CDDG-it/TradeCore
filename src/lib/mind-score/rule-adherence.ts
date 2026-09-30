import type { RuleCheckStatus } from "@/lib/types";

export function ruleAdherenceScore(checks: readonly { status: RuleCheckStatus }[]): number | null {
  const applicable = checks.filter((check) => check.status !== "not_applicable");
  if (applicable.length === 0) return null;
  return Math.round((applicable.filter((check) => check.status === "kept").length / applicable.length) * 100);
}

export function redistributeWeights<T extends { value: number | null; weight: number }>(components: readonly T[]) {
  const applicableWeight = components.reduce((sum, component) => component.value == null ? sum : sum + component.weight, 0);
  return components.map((component) => {
    const applicable = component.value != null;
    const effectiveWeight = applicable && applicableWeight > 0 ? (component.weight / applicableWeight) * 100 : 0;
    return { ...component, applicable, effectiveWeight, contribution: applicable ? component.value! * effectiveWeight / 100 : 0 };
  });
}
