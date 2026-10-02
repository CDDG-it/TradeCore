/**
 * The headline cards at the top of /analytics: the few things in the journal
 * worth acting on, written as sentences.
 *
 * Deterministic and conservative. A finding only fires on groups that clear
 * the minimum sample, and every card carries the numbers behind it, so the
 * trader can check the claim against the tables below it.
 */
import { extremes, formatR, type EdgeBucket } from "@/lib/journal/edge";
import { SESSIONS, WEEKDAYS, type WeekdaySessionGrid } from "@/lib/journal/time-stats";
import type { ConfluenceStat } from "@/lib/journal/confluence-stats";
import type { CleanVsBroken, RuleStat } from "@/lib/journal/rule-stats";

export interface Finding {
  id: string;
  tone: "good" | "bad";
  /** Small caps label, e.g. "Best time to trade". */
  eyebrow: string;
  /** The subject: a window, a setup, a rule. */
  headline: string;
  /** The number that matters, already formatted. */
  value: string;
  /** One sentence putting the number in context. */
  detail: string;
}

export interface FindingInputs {
  baseline: EdgeBucket;
  hours: EdgeBucket[];
  grid: WeekdaySessionGrid;
  order: EdgeBucket[];
  confluences: ConfluenceStat[];
  rules: RuleStat[];
  clean: CleanVsBroken;
}

const ORDER_HEADLINE: Record<string, string> = {
  "2": "Second trade of the day",
  "3": "Third trade of the day",
  "4": "Fourth trade onwards",
};

const tradesLabel = (n: number) => `${n} trade${n === 1 ? "" : "s"}`;

export function buildFindings(
  { baseline, hours, grid, order, confluences, rules, clean }: FindingInputs,
  limit = 4
): Finding[] {
  const out: Finding[] = [];
  const vsBase = `vs ${formatR(baseline.expectancy)} on your average trade`;

  const hourEx = extremes(hours);
  if (hourEx.best && hourEx.best.expectancy > baseline.expectancy) {
    out.push({
      id: "best-hour",
      tone: "good",
      eyebrow: "Best time to trade",
      headline: hourEx.best.label,
      value: formatR(hourEx.best.expectancy),
      detail: `Per trade over ${tradesLabel(hourEx.best.trades)} entered in this window, ${vsBase}.`,
    });
  } else {
    // No timed sample yet: fall back to the strongest weekday x session cell.
    const cells = WEEKDAYS.flatMap((d) =>
      SESSIONS.map((s) => ({ day: d.long, session: s, b: grid.cells[d.key][s] }))
    ).filter((c) => !c.b.thin);
    const top = cells.sort((a, b) => b.b.expectancy - a.b.expectancy)[0];
    if (top && top.b.expectancy > baseline.expectancy) {
      out.push({
        id: "best-slot",
        tone: "good",
        eyebrow: "Best time to trade",
        headline: `${top.day} · ${top.session}`,
        value: formatR(top.b.expectancy),
        detail: `Per trade over ${tradesLabel(top.b.trades)}, ${vsBase}.`,
      });
    }
  }

  if (hourEx.worst && hourEx.worst.expectancy < Math.min(0, baseline.expectancy)) {
    out.push({
      id: "worst-hour",
      tone: "bad",
      eyebrow: "Time that costs you",
      headline: hourEx.worst.label,
      value: formatR(hourEx.worst.expectancy),
      detail: `Per trade over ${tradesLabel(hourEx.worst.trades)}. Sitting this window out would have saved ${Math.abs(hourEx.worst.totalR).toFixed(1)}R.`,
    });
  }

  const topConfluence = confluences.find((c) => !c.thin && c.expectancy > 0);
  if (topConfluence) {
    out.push({
      id: "best-confluence",
      tone: "good",
      eyebrow: "Setup that pays most",
      headline: topConfluence.name,
      value: formatR(topConfluence.expectancy),
      detail: `Per trade over ${tradesLabel(topConfluence.trades)} with this confluence, ${vsBase}.`,
    });
  }

  const costliest = rules.find((r) => !r.thin && r.totalCost !== null && r.totalCost > 0);
  if (costliest) {
    out.push({
      id: "costliest-rule",
      tone: "bad",
      eyebrow: "Rule that costs most",
      headline: costliest.label,
      value: `${formatR(-(costliest.totalCost ?? 0), 1)} total`,
      detail: `Broken ${costliest.broken} of ${costliest.evaluated} times, ${formatR(-(costliest.cost ?? 0))} each time against keeping it.`,
    });
  } else if (clean.gap !== null && clean.gap > 0) {
    out.push({
      id: "clean-gap",
      tone: "good",
      eyebrow: "Worth of your rules",
      headline: "Trading clean",
      value: formatR(clean.gap),
      detail: `Per trade: what a trade with every rule kept earns over one with a rule broken (${tradesLabel(clean.clean.trades)} vs ${tradesLabel(clean.broken.trades)}).`,
    });
  }

  // Overtrading: later trades in the day clearly worse than the first.
  const first = order.find((b) => b.key === "1");
  const later = order.filter((b) => b.key !== "1" && !b.thin).sort((a, b) => a.expectancy - b.expectancy)[0];
  if (first && later && !first.thin && first.expectancy - later.expectancy >= 0.25) {
    out.push({
      id: "overtrading",
      tone: "bad",
      eyebrow: "Diminishing returns",
      headline: ORDER_HEADLINE[later.key] ?? later.label,
      value: formatR(later.expectancy),
      detail: `Per trade, against ${formatR(first.expectancy)} on your first trade of the day, over ${tradesLabel(later.trades)}.`,
    });
  }

  return out.slice(0, limit);
}
