import Link from "next/link";
import { notFound } from "next/navigation";
import { AnalysisEditor } from "@/components/analysis/analysis-editor";
import { AnalysisReview } from "@/components/analysis/analysis-review";
import type { PreTradeAnalysis } from "@/lib/types";

export const dynamic = "force-dynamic";

function sampleChart(timeframe: string, offset: number) {
  const closes = [310, 294, 303, 270, 285, 251, 263, 240, 256, 232, 247, 218, 226, 208, 231, 214, 198, 207, 181, 194, 173, 185, 163, 178, 150, 164, 140, 155, 130, 146, 118, 134, 109, 122, 98, 111];
  const candles = closes.map((close, index) => {
    const x = 72 + index * 22;
    const previous = index ? closes[index - 1] : close + 16;
    const open = previous + ((index + offset) % 5 - 2) * 7;
    const up = close < open;
    const colour = up ? "#14b8a6" : "#ef4444";
    const top = Math.min(open, close) + 58;
    const body = Math.max(4, Math.abs(open - close));
    return `<line x1="${x}" y1="${top - 13}" x2="${x}" y2="${top + body + 13}" stroke="${colour}" stroke-width="2"/><rect x="${x - 6}" y="${top}" width="12" height="${body}" rx="1.5" fill="${colour}"/>`;
  }).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540"><rect width="960" height="540" fill="#0b1120"/><g stroke="#29405a" stroke-opacity=".45"><path d="M0 105H960M0 185H960M0 265H960M0 345H960M0 425H960"/></g><text x="42" y="45" fill="#f8fafc" font-family="Arial,sans-serif" font-size="21" font-weight="bold">MNQ</text><text x="110" y="45" fill="#64748b" font-family="Arial,sans-serif" font-size="16">${timeframe} · Nasdaq 100 Futures</text><text x="836" y="45" fill="#14b8a6" font-family="Arial,sans-serif" font-size="19" font-weight="bold">24,186.25</text><path d="M42 210H916" stroke="#06b6d4" stroke-width="1.5" stroke-dasharray="7 7" opacity=".6"/><text x="820" y="203" fill="#06b6d4" font-family="Arial,sans-serif" font-size="12">KEY LEVEL</text>${candles}<path d="M40 450H916" stroke="#29405a"/><text x="42" y="487" fill="#64748b" font-family="Arial,sans-serif" font-size="13">Market structure · sample chart for design review</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export default async function PreviewAnalysisPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { view } = await searchParams;
  const today = new Date().toISOString().slice(0, 10);
  const sample: PreTradeAnalysis = {
    id: "preview-analysis", user_id: "preview", title: `MNQ: ${today}`, date: today,
    instrument: "MNQ", market: "futures", session: "New York", bias: "bullish",
    thesis: "Price is holding above the prior day high after a strong opening drive. The 4H trend remains constructive, but I want to see acceptance above the morning range before committing to continuation.",
    long_scenario: "If price retests the morning high and buyers defend it, I look for a 15m higher low. Entry on confirmation above the retest. The idea fails below the range midpoint. First target is the next 4H supply area.",
    short_scenario: "If price loses the morning range and rejects the underside on a retest, I wait for a lower high. The idea fails back above the range high. First target is yesterday's close.",
    notes: "", used_for_trade: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    screenshot_groups: [{ label: "4H", urls: [sampleChart("4H", 0)] }, { label: "15m", urls: [sampleChart("15m", 2)] }],
  };

  return <main className="min-h-screen bg-background px-3 py-5 sm:px-6 lg:px-10">
    <div className="mx-auto max-w-[1700px]">
      <nav aria-label="Design preview views" className="mb-4 flex items-center gap-2 text-xs">
        <span className="mr-2 font-semibold text-muted-foreground">Analysis design preview</span>
        <Link href="/preview/analysis" className={view !== "review" ? "rounded-lg bg-primary px-3 py-1.5 font-semibold text-primary-foreground" : "rounded-lg border border-border px-3 py-1.5 text-muted-foreground"}>Editor</Link>
        <Link href="/preview/analysis?view=review" className={view === "review" ? "rounded-lg bg-primary px-3 py-1.5 font-semibold text-primary-foreground" : "rounded-lg border border-border px-3 py-1.5 text-muted-foreground"}>Saved view</Link>
      </nav>
      {view === "review" ? <AnalysisReview analysis={sample} linkedTrade={null} preview /> : <AnalysisEditor mode="new" analysisId={sample.id} initial={sample} preview />}
    </div>
  </main>;
}
