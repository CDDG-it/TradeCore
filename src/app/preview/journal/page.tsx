import { notFound } from "next/navigation";
import { JournalWorkspace } from "@/components/journal/journal-workspace";
import type { TradeJournalEntry, TradeResult } from "@/lib/types";

export const dynamic = "force-dynamic";

function sampleChart(label: string) {
  const candles = Array.from({ length: 22 }, (_, index) => {
    const x = 42 + index * 20;
    const y = 118 - index * 2.4 + Math.sin(index * 1.7) * 14;
    const up = index % 4 !== 0;
    return `<line x1="${x}" y1="${y - 12}" x2="${x}" y2="${y + 15}" stroke="${up ? "#14b8a6" : "#ef4444"}" stroke-width="1.4"/><rect x="${x - 4}" y="${up ? y - 3 : y + 1}" width="8" height="${up ? 12 : 9}" fill="${up ? "#14b8a6" : "#ef4444"}"/>`;
  }).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="220" viewBox="0 0 500 220"><rect width="500" height="220" fill="#091525"/><g stroke="#253449" opacity=".5"><path d="M24 55H480M24 105H480M24 155H480M24 205H480"/></g><text x="22" y="28" fill="#dce9f5" font-family="Arial" font-weight="bold" font-size="15">${label}</text><path d="M24 122H480" stroke="#06b6d4" stroke-dasharray="4 4" opacity=".55"/>${candles}</svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const chart = sampleChart("NQ · New York");

function trade(id: string, day: number, result: TradeResult, rr: number, quality?: "good" | "bad", withChart = false): TradeJournalEntry {
  const date = `2026-10-${String(day).padStart(2, "0")}`;
  return {
    id, user_id: "preview", date_time: date, instrument: "NQ", market: "futures", session: "New York",
    timeframe: "15m", direction: "long", confluences: [], rr, result,
    screenshot_groups: withChart ? [{ label: "15m", urls: [chart] }] : [],
    execution_notes: "", psychology_notes: "", mistakes: "", lessons: "", execution_quality: quality,
    created_at: `${date}T13:00:00.000Z`, updated_at: `${date}T13:00:00.000Z`,
  };
}

const samples = [
  trade("oct-01-a", 1, "loss", 0, "bad", true),
  trade("oct-01-b", 1, "loss", 0, "good"),
  trade("oct-02", 2, "win", 1.5, "good", true),
  trade("oct-05", 5, "win", 1.5, "good"),
  trade("oct-08-a", 8, "win", 1.6, "good", true),
  trade("oct-08-b", 8, "break-even", 0, "good"),
  trade("oct-09", 9, "loss", 0, "bad"),
  trade("oct-13", 13, "loss", 0, "bad", true),
  trade("oct-14", 14, "loss", 0, "bad"),
  trade("oct-15", 15, "break-even", 0, "good"),
];

export default function PreviewJournalPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return <main className="min-h-screen bg-background px-3 py-5 sm:px-6 lg:px-10">
    <div className="mx-auto max-w-[1700px]">
      <p className="mb-5 text-xs font-semibold text-muted-foreground">Journal design preview</p>
      <JournalWorkspace preview sampleTrades={samples} sampleMonth={new Date(2026, 9, 17, 12)} />
    </div>
  </main>;
}
