/**
 * Deterministic sample journal for the dev-only analytics preview: four months
 * of trades with times, sessions, confluences, execution ratings and rule
 * checks, shaped so every pane on the desk has something real to say (London
 * mornings pay, the third trade of the day does not, breaking "Wait for the
 * close" costs).
 */
import { addDays, format, getDay, parseISO } from "date-fns";
import type { Direction, Session, TradeJournalEntry, TradeResult, TradeRuleCheck } from "@/lib/types";

/** Small seeded PRNG (mulberry32), so the preview looks the same every load. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CONFLUENCES = ["HTF bias", "Liquidity sweep", "FVG", "Order block", "VWAP reclaim", "Opening range", "SMT divergence", "News catalyst"];
const RULES = ["Wait for the candle close", "Max 3 trades a day", "No entries in the first 5 minutes", "Risk max 1% per trade", "Stop after two losses"];
const INSTRUMENTS = ["MNQ", "NQ", "MES", "GC", "CL", "EURUSD"];

const SESSION_HOURS: Record<Session, [number, number]> = {
  Asia: [1, 4],
  London: [8, 11],
  "New York": [14, 17],
};

export function sampleAnalyticsData(today: Date): { trades: TradeJournalEntry[]; ruleChecks: TradeRuleCheck[] } {
  const rand = rng(20261016);
  const pick = <T,>(xs: T[]) => xs[Math.floor(rand() * xs.length)];
  const trades: TradeJournalEntry[] = [];
  const ruleChecks: TradeRuleCheck[] = [];
  const start = addDays(today, -120);

  for (let d = 0; d <= 120; d++) {
    const day = addDays(start, d);
    const dow = getDay(day);
    if (dow === 0 || dow === 6 || rand() < 0.22) continue;
    const date = format(day, "yyyy-MM-dd");
    const count = 1 + Math.floor(rand() * 3) + (rand() < 0.12 ? 1 : 0);

    for (let n = 0; n < count; n++) {
      const session: Session = rand() < 0.45 ? "London" : rand() < 0.75 ? "New York" : "Asia";
      const [h0, h1] = SESSION_HOURS[session];
      const hour = h0 + Math.floor(rand() * (h1 - h0)) + Math.min(n, 1);
      const minute = Math.floor(rand() * 60);
      const hold = 3 + Math.floor(rand() * 85);
      const endMin = hour * 60 + minute + hold;
      const direction: Direction = rand() < 0.55 ? "long" : "short";
      const confluences = [...new Set(Array.from({ length: Math.floor(rand() * 4) }, () => pick(CONFLUENCES)))];
      const instrument = pick(INSTRUMENTS);

      // Edge structure: what the sample "trader" is good and bad at.
      let p = 0.42;
      if (session === "London") p += 0.12;
      if (session === "Asia") p -= 0.1;
      if (dow === 5) p -= 0.08;
      if (n >= 2) p -= 0.14;
      if (confluences.includes("Liquidity sweep")) p += 0.1;
      if (confluences.includes("News catalyst")) p -= 0.12;
      if (confluences.length >= 3) p += 0.06;
      if (direction === "short") p -= 0.04;

      const brokeClose = rand() < 0.28;
      const brokeCount = n >= 3;
      const brokeEarly = rand() < 0.15;
      const brokeRisk = rand() < 0.07;
      if (brokeClose) p -= 0.15;
      if (brokeEarly) p -= 0.08;

      const roll = rand();
      const result: TradeResult = roll < 0.08 ? "break-even" : roll < 0.08 + Math.max(0.05, p) ? "win" : "loss";
      const rr = Math.round((1.2 + rand() * 2.3) * 10) / 10;
      const quality = rand() < 0.15 ? undefined : (result === "win" ? rand() < 0.78 : rand() < 0.38) ? "good" : "bad";

      const id = `sample-${date}-${n}`;
      const stamp = `${date}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;
      trades.push({
        id,
        user_id: "sample",
        date_time: date,
        instrument,
        market: instrument === "EURUSD" ? "forex" : "futures",
        session,
        timeframe: "5m",
        direction,
        confluences,
        rr,
        result,
        screenshot_groups: [],
        execution_notes: "",
        psychology_notes: "",
        mistakes: "",
        lessons: "",
        execution_time: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
        execution_end_time: `${String(Math.floor(endMin / 60) % 24).padStart(2, "0")}:${String(endMin % 60).padStart(2, "0")}`,
        execution_quality: quality as "good" | "bad" | undefined,
        created_at: stamp,
        updated_at: stamp,
      });

      // Three days in four carry rule checks, like a trader who mostly fills them in.
      if (rand() < 0.75) {
        const broken = [brokeClose, brokeCount, brokeEarly, brokeRisk, false];
        RULES.forEach((rule, i) => {
          const status = i === 4 && n < 2 ? "not_applicable" : broken[i] ? "broken" : "kept";
          ruleChecks.push({
            id: `${id}-r${i}`,
            user_id: "sample",
            trade_id: id,
            source_type: "standing_rule",
            source_id: `rule-${i}`,
            source_text_snapshot: rule,
            status,
            note: "",
            created_at: stamp,
            updated_at: stamp,
          });
        });
      }
    }
  }
  return { trades: trades.sort((a, b) => parseISO(b.date_time).getTime() - parseISO(a.date_time).getTime()), ruleChecks };
}
