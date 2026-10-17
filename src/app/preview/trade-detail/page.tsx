import { notFound } from "next/navigation";
import { TradeDetail } from "@/components/journal/trade-detail";
import type { TradeJournalEntry } from "@/lib/types";
import type { RuleCheckDraft } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

function sampleChart(label: string, offset: number) {
  const candles = Array.from({ length: 32 }, (_, index) => {
    const x = 48 + index * 21;
    const baseline = 245 - index * 3.5 + Math.sin(index * 1.4 + offset) * 20;
    const up = (index + offset) % 4 !== 0;
    const open = baseline + (up ? 12 : -10);
    const close = baseline + (up ? -9 : 13);
    const color = up ? "#14b8a6" : "#ef4444";
    return `<line x1="${x}" y1="${Math.min(open, close) - 14}" x2="${x}" y2="${Math.max(open, close) + 14}" stroke="${color}" stroke-width="2"/><rect x="${x - 5}" y="${Math.min(open, close)}" width="10" height="${Math.max(4, Math.abs(close - open))}" rx="1" fill="${color}"/>`;
  }).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="760" height="410" viewBox="0 0 760 410"><rect width="760" height="410" fill="#0a1323"/><g stroke="#23364e" opacity=".55"><path d="M38 90H726M38 160H726M38 230H726M38 300H726M38 370H726"/></g><text x="40" y="48" fill="#eef4ff" font-family="Arial,sans-serif" font-size="17" font-weight="bold">NQ</text><text x="80" y="48" fill="#71859e" font-family="Arial,sans-serif" font-size="12">${label} · New York</text><path d="M38 194H726" stroke="#06b6d4" stroke-dasharray="5 5" opacity=".55"/>${candles}<text x="42" y="386" fill="#52657e" font-family="Arial,sans-serif" font-size="10">Sample chart · design preview</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const sampleTrade: TradeJournalEntry = {
  id: "preview", user_id: "preview", date_time: "2026-10-15", instrument: "NQ", market: "futures",
  session: "New York", timeframe: "30s", direction: "long", confluences: ["Liquidity sweep", "Fair value gap", "IFVG"],
  rr: 0, result: "break-even",
  screenshot_groups: [{ label: "Entry TF", urls: [sampleChart("30s · entry", 1), sampleChart("30s · management", 3)] }, { label: "HTF", urls: [sampleChart("4H · context", 5)] }],
  execution_notes: "Waited for the sweep, then entered on the retest. Managed the stop according to plan.",
  psychology_notes: "Patient and focused before the entry.", mistakes: "Moved to break-even slightly early.",
  lessons: "Let the setup complete before managing aggressively.", execution_time: "16:01", execution_end_time: "16:05",
  discipline: { followed_plan: true, traded_in_session: true, respected_risk: true, respected_max_trades: true,
    matched_a_plus: true, no_impulsive_entry: true, no_revenge_trade: true, respected_stop_loss: true,
    journal_completed: true, score: 100, notes: "", custom_checks: [] },
  created_at: "2026-10-15T16:05:00Z", updated_at: "2026-10-15T16:05:00Z",
};

const sampleChecks: RuleCheckDraft[] = [
  { source_type: "commitment", source_id: "commitment", source_text_snapshot: "Wait for confirmation at the planned level", status: "kept", note: "" },
  { source_type: "standing_rule", source_id: "risk", source_text_snapshot: "According to risk plan", status: "kept", note: "" },
  { source_type: "standing_rule", source_id: "stop", source_text_snapshot: "Protected stop loss", status: "kept", note: "" },
  { source_type: "standing_rule", source_id: "target", source_text_snapshot: "Targeting external liquidity", status: "kept", note: "" },
];

export default function PreviewTradeDetailPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <main className="min-h-screen bg-background px-3 py-5 sm:px-6 lg:px-10">
    <div className="mx-auto max-w-[1500px]">
      <p className="mb-4 text-xs font-semibold text-muted-foreground">Trade detail design preview</p>
      <TradeDetail id="preview" previewTrade={sampleTrade} previewRuleChecks={sampleChecks} />
    </div>
  </main>;
}
