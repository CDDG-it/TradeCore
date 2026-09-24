import { format, parseISO } from "date-fns";
import type { MindTrendPoint } from "@/lib/mind-score/trend";

/** A quiet, responsive SVG chart. Null readings break the curve rather than inventing zeroes. */
export function MindscoreTrend({ points, color = "var(--primary)", light = false }: {
  points: MindTrendPoint[];
  color?: string;
  light?: boolean;
}) {
  const left = 30, right = 620, top = 12, bottom = 150;
  const x = (index: number) => left + (points.length === 1 ? (right - left) / 2 : index / (points.length - 1) * (right - left));
  const y = (value: number) => bottom - value / 100 * (bottom - top);
  const runs: { index: number; value: number }[][] = [];
  points.forEach((point, index) => {
    if (point.value === null) return;
    if (index === 0 || points[index - 1].value === null) runs.push([]);
    runs[runs.length - 1].push({ index, value: point.value });
  });
  const pathFor = (run: { index: number; value: number }[]) => run.map((point, i) => {
    if (i === 0) return `M ${x(point.index)} ${y(point.value)}`;
    const previous = run[i - 1];
    const middle = (x(previous.index) + x(point.index)) / 2;
    return `C ${middle} ${y(previous.value)}, ${middle} ${y(point.value)}, ${x(point.index)} ${y(point.value)}`;
  }).join(" ");
  const last = [...points].reverse().find((point) => point.value !== null);
  const lastIndex = last ? points.indexOf(last) : -1;
  const labelColor = light ? "#68848b" : "var(--muted-foreground)";
  const gridColor = light ? "#c2dcda" : "var(--border)";

  return (
    <div className="w-full" role="img" aria-label={last ? `MC Mindscore trend from ${points[0]?.date} to ${points.at(-1)?.date}; latest available score ${last.value} out of 100.` : "No MC Mindscore readings yet for this period."}>
      <svg viewBox="0 0 640 178" className="block w-full" preserveAspectRatio="none" aria-hidden="true">
        {[0, 50, 100].map((value) => <g key={value}>
          <line x1={left} x2={right} y1={y(value)} y2={y(value)} stroke={gridColor} strokeWidth="1" opacity="0.65" />
          <text x="0" y={y(value) + 4} fill={labelColor} fontSize="10" fontWeight="600">{value}</text>
        </g>)}
        {runs.map((run, index) => <path key={index} d={pathFor(run)} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />)}
        {last && <><circle cx={x(lastIndex)} cy={y(last.value!)} r="6" fill={color} stroke={light ? "#edf7f5" : "var(--card)"} strokeWidth="3" /></>}
      </svg>
      <div className="flex justify-between text-[10px] font-medium tabular-nums" style={{ color: labelColor }}>
        <span>{points[0] ? format(parseISO(points[0].date), "d MMM yyyy") : ""}</span>
        <span>{points.length > 1 ? format(parseISO(points[points.length - 1].date), "d MMM yyyy") : ""}</span>
      </div>
    </div>
  );
}
