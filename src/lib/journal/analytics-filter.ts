/**
 * The analytics desk's selection model: a period that sets the baseline, and a
 * drill-down built up by clicking segments (a heatmap cell, a confluence, a
 * rule verdict, ...). Every pane is computed on the same filtered set, so a
 * click anywhere narrows the whole desk.
 *
 * Pure on purpose: the desk is client state, the maths lives here and is tested.
 */
import { addDays, format, getDay, parseISO } from "date-fns";
import { bucketize, round2, scoreBucket, type EdgeBucket } from "@/lib/journal/edge";
import { inOrder } from "@/lib/journal/colors";
import { minutesOfDay, WEEKDAYS, type SlotSize } from "@/lib/journal/time-stats";
import { instrumentName, tradeR, winRateOf } from "@/lib/journal/weeks";
import type { ConfluencePair, ConfluenceStat } from "@/lib/journal/confluence-stats";
import type { Direction, Session, TradeJournalEntry } from "@/lib/types";

/** "all", a trailing window ("30d" / "90d"), or a calendar month ("yyyy-MM"). */
export type Period = string;

export interface Drill {
  /** Market name (instrumentName), so NQ and MNQ count as one market. */
  instrument?: string;
  direction?: Direction;
  session?: Session;
  /** date-fns getDay key: "1" (Mon) .. "5" (Fri). */
  weekday?: string;
  /** Entry window: start minute of the day and its width. */
  hourSlot?: { start: number; size: SlotSize };
  /** Lower-cased confluence keys; a trade must carry every one (one key, or a pair). */
  confluence?: string[];
  /** Lower-cased rule key and the verdict to keep. */
  rule?: { key: string; label: string; kept: boolean };
  quality?: "good" | "bad" | "unrated";
}

export type DrillKey = keyof Drill;

/** Verdicts per trade id, per rule key (see ruleVerdictsByTrade). */
export type Verdicts = Map<string, Map<string, boolean>>;

const dayKey = (t: Pick<TradeJournalEntry, "date_time">) => t.date_time.slice(0, 10);

/** Trades inside a period. `today` is "yyyy-MM-dd" so the result is stable in tests. */
export function inPeriod<T extends Pick<TradeJournalEntry, "date_time">>(trades: T[], period: Period, today: string): T[] {
  if (period === "all") return trades;
  const m = /^(\d+)d$/.exec(period);
  if (m) {
    const from = format(addDays(parseISO(today), -(Number(m[1]) - 1)), "yyyy-MM-dd");
    return trades.filter((t) => dayKey(t) >= from && dayKey(t) <= today);
  }
  return trades.filter((t) => t.date_time.slice(0, 7) === period);
}

const weekdayOf = (t: Pick<TradeJournalEntry, "date_time">) => String(getDay(parseISO(dayKey(t) + "T12:00:00")));

const confluenceKeys = (t: Pick<TradeJournalEntry, "confluences">) =>
  new Set((t.confluences ?? []).map((c) => (c ?? "").trim().toLowerCase()).filter(Boolean));

export const qualityOf = (t: Pick<TradeJournalEntry, "execution_quality">): "good" | "bad" | "unrated" =>
  t.execution_quality ?? "unrated";

/** Does one trade pass every active drill? */
export function matchesDrill(t: TradeJournalEntry, drill: Drill, verdicts: Verdicts): boolean {
  if (drill.instrument && instrumentName(t.instrument) !== drill.instrument) return false;
  if (drill.direction && t.direction !== drill.direction) return false;
  if (drill.session && t.session !== drill.session) return false;
  if (drill.weekday && weekdayOf(t) !== drill.weekday) return false;
  if (drill.quality && qualityOf(t) !== drill.quality) return false;
  if (drill.hourSlot) {
    const m = minutesOfDay(t.execution_time);
    if (m === null || Math.floor(m / drill.hourSlot.size) * drill.hourSlot.size !== drill.hourSlot.start) return false;
  }
  if (drill.confluence?.length) {
    const keys = confluenceKeys(t);
    if (!drill.confluence.every((k) => keys.has(k))) return false;
  }
  if (drill.rule && verdicts.get(t.id)?.get(drill.rule.key) !== drill.rule.kept) return false;
  return true;
}

export function applyDrill(trades: TradeJournalEntry[], drill: Drill, verdicts: Verdicts): TradeJournalEntry[] {
  return trades.filter((t) => matchesDrill(t, drill, verdicts));
}

const pad = (n: number) => String(n).padStart(2, "0");
const clock = (min: number) => `${pad(Math.floor(min / 60) % 24)}:${pad(min % 60)}`;

/** One readable chip per active drill, in a fixed order. */
export function drillChips(drill: Drill, confluenceLabel?: (key: string) => string): { key: DrillKey; label: string }[] {
  const out: { key: DrillKey; label: string }[] = [];
  if (drill.instrument) out.push({ key: "instrument", label: drill.instrument });
  if (drill.direction) out.push({ key: "direction", label: drill.direction === "long" ? "Long" : "Short" });
  if (drill.weekday) out.push({ key: "weekday", label: WEEKDAYS.find((d) => d.key === drill.weekday)?.long ?? drill.weekday });
  if (drill.session) out.push({ key: "session", label: drill.session });
  if (drill.hourSlot) {
    const { start, size } = drill.hourSlot;
    out.push({ key: "hourSlot", label: `${clock(start)}–${clock(start + size)}` });
  }
  if (drill.confluence?.length) {
    out.push({ key: "confluence", label: drill.confluence.map((k) => confluenceLabel?.(k) ?? k).join(" + ") });
  }
  if (drill.rule) out.push({ key: "rule", label: `${drill.rule.kept ? "Kept" : "Broke"}: ${drill.rule.label}` });
  if (drill.quality) {
    out.push({ key: "quality", label: drill.quality === "unrated" ? "Execution unrated" : `${drill.quality === "good" ? "Good" : "Bad"} execution` });
  }
  return out;
}

// ── Breakdowns the old page did not have ───────────────────────────────

export function computeDirectionStats(trades: TradeJournalEntry[]): EdgeBucket[] {
  return bucketize(trades, (t) => t.direction, [
    { key: "long", label: "Long" },
    { key: "short", label: "Short" },
  ]);
}

export function computeQualityStats(trades: TradeJournalEntry[]): EdgeBucket[] {
  return bucketize(trades, qualityOf, [
    { key: "good", label: "Good" },
    { key: "bad", label: "Bad" },
    { key: "unrated", label: "Unrated" },
  ]);
}

/** Per market (micro and mini of one index together), most traded first. */
export function computeInstrumentStats(trades: TradeJournalEntry[]): EdgeBucket[] {
  const counts = new Map<string, number>();
  for (const t of trades) {
    const k = instrumentName(t.instrument);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const order = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([key]) => ({ key, label: key }));
  return bucketize(trades, (t) => instrumentName(t.instrument), order);
}

export interface EquityPoint {
  i: number;
  date: string;
  r: number;
  cum: number;
}

/** Running R, trade by trade, in the order the trades were taken. */
export function computeEquityCurve(trades: TradeJournalEntry[]): EquityPoint[] {
  let cum = 0;
  return inOrder(trades).map((t, i) => {
    const r = tradeR(t);
    cum = round2(cum + r);
    return { i: i + 1, date: dayKey(t), r, cum };
  });
}

export interface Headline {
  trades: number;
  winRate: number | null;
  expectancy: number;
  netR: number;
  /** Gross won R / gross lost R; null without a loss. */
  profitFactor: number | null;
  breakEven: number;
}

export function computeHeadline(trades: TradeJournalEntry[]): Headline {
  const b = scoreBucket("all", "All", trades);
  const won = trades.filter((t) => t.result === "win").reduce((s, t) => s + tradeR(t), 0);
  const lost = trades.filter((t) => t.result === "loss").length;
  return {
    trades: b.trades,
    winRate: winRateOf(b.wins, b.losses),
    expectancy: b.expectancy,
    netR: b.totalR,
    profitFactor: lost > 0 ? round2(won / lost) : null,
    breakEven: trades.filter((t) => t.result === "break-even").length,
  };
}

// ── Setups ──────────────────────────────────────────────────────────────

/** A setup the trader can repeat or avoid: one confluence, or two taken together. */
export interface Setup {
  kind: "confluence" | "pair";
  label: string;
  /** Lower-cased confluence keys, ready to drill into. */
  keys: string[];
  trades: number;
  winRate: number | null;
  expectancy: number;
  totalR: number;
}

/** Same key, same order, so a selected setup can be recognised and toggled. */
export const sameKeys = (a?: string[], b?: string[]) =>
  !!a && !!b && a.length === b.length && [...a].sort().join("\u0000") === [...b].sort().join("\u0000");

/**
 * The setup that pays most and the one that costs most, from every confluence
 * and pair with a real sample. "Costs" only fires on a setup that loses money
 * or trails the average trade: the weakest of a strong set is not a problem.
 */
export function pickSetups(
  confluences: ConfluenceStat[],
  pairs: ConfluencePair[],
  baseline: number,
  minSample = 5
): { best: Setup | null; worst: Setup | null; candidates: number } {
  const all: Setup[] = [
    ...confluences
      .filter((c) => c.trades >= minSample)
      .map((c) => ({
        kind: "confluence" as const,
        label: c.name,
        keys: [c.name.toLowerCase()],
        trades: c.trades,
        winRate: c.wins + c.losses ? c.winRate : null,
        expectancy: c.expectancy,
        totalR: c.totalR,
      })),
    ...pairs
      .filter((p) => p.trades >= minSample)
      .map((p) => ({
        kind: "pair" as const,
        label: `${p.names[0]} + ${p.names[1]}`,
        keys: p.names.map((n) => n.toLowerCase()),
        trades: p.trades,
        winRate: p.winRate,
        expectancy: p.expectancy,
        totalR: p.totalR,
      })),
  ].sort((a, b) => b.expectancy - a.expectancy || b.trades - a.trades);

  if (all.length === 0) return { best: null, worst: null, candidates: 0 };
  const best = all[0].expectancy > 0 ? all[0] : null;
  const last = all[all.length - 1];
  const worst = last !== best && (last.expectancy < 0 || last.expectancy < baseline) ? last : null;
  return { best, worst, candidates: all.length };
}
