/** Formatting shared by the news readings and the calendar's day panel. */
export function releaseValue(value: number | null, unit: string): string {
  if (value == null) return "Not available";
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value)}${unit === "%" ? "%" : ""}`;
}
export function releaseUnit(unit: string): string {
  const units: Record<string, string> = { index: "Index", kpersons: "Thousands of persons", count: "Count", "$B": "Billions of dollars", "$M": "Millions of dollars", "%": "Percent" };
  return units[unit] ?? unit;
}
