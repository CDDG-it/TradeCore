import { notFound } from "next/navigation";
import { TradeEditor } from "@/components/journal/trade-editor";

export const dynamic = "force-dynamic";

function sampleChart(label: string, offset: number) {
  const candles = Array.from({ length: 27 }, (_, index) => {
    const x = 62 + index * 24;
    const baseline = 214 - index * 3.7 + Math.sin(index * 1.55 + offset) * 18;
    const up = (index + offset) % 4 !== 0;
    const open = baseline + (up ? 16 : -12);
    const close = baseline + (up ? -8 : 13);
    const color = up ? "#14b8a6" : "#ef4444";
    return `<line x1="${x}" y1="${Math.min(open, close) - 13}" x2="${x}" y2="${Math.max(open, close) + 13}" stroke="${color}" stroke-width="2"/><rect x="${x - 5}" y="${Math.min(open, close)}" width="10" height="${Math.max(4, Math.abs(close - open))}" rx="1" fill="${color}"/>`;
  }).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="760" height="410" viewBox="0 0 760 410"><rect width="760" height="410" fill="#0a1323"/><g stroke="#23364e" opacity=".5"><path d="M38 90H726M38 160H726M38 230H726M38 300H726M38 370H726"/></g><text x="40" y="48" fill="#eef4ff" font-family="Arial,sans-serif" font-size="17" font-weight="bold">NQ</text><text x="80" y="48" fill="#71859e" font-family="Arial,sans-serif" font-size="12">${label} · New York</text><text x="614" y="48" fill="#14b8a6" font-family="Arial,sans-serif" font-size="13">24,186.25</text><path d="M38 194H726" stroke="#06b6d4" stroke-dasharray="5 5" opacity=".55"/>${candles}<text x="42" y="386" fill="#52657e" font-family="Arial,sans-serif" font-size="10">Sample chart · design preview</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export default function PreviewTradePage() {
  if (process.env.NODE_ENV === "production") notFound();

  return <main className="min-h-screen bg-background px-3 py-5 sm:px-6 lg:px-10">
    <div className="mx-auto max-w-[1700px]">
      <div className="mb-4 text-xs font-semibold text-muted-foreground">Trade log design preview</div>
      <TradeEditor preview sampleCharts={[{ label: "15m", urls: [sampleChart("15m", 1)] }, { label: "4H", urls: [sampleChart("4H", 3)] }]} />
    </div>
  </main>;
}
