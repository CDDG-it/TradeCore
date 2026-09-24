"use client";

import { useId } from "react";
import { format, parseISO } from "date-fns";
import type { MindTrendPoint } from "@/lib/mind-score/trend";

/** A focused score chart: the vertical range follows this trader's readings. */
export function MindscoreTrend({ points, color = "var(--primary)", light = false }: {
  points: MindTrendPoint[];
  color?: string;
  light?: boolean;
}) {
  const gradientId = useId().replaceAll(":", "");
  const values = points.flatMap((point) => point.value === null ? [] : [point.value]);
  const low = values.length ? Math.min(...values) : 50;
  const high = values.length ? Math.max(...values) : 50;
  const padding = Math.max(5, (high - low) * 0.25);
  const domainMin = Math.max(0, Math.floor((low - padding) / 5) * 5);
  const domainMax = Math.min(100, Math.ceil((high + padding) / 5) * 5);
  const ticks = [domainMin, Math.round((domainMin + domainMax) / 2), domainMax];
  const left = 36, right = 620, top = 12, bottom = 188;
  const x = (index: number) => left + (points.length === 1 ? (right - left) / 2 : index / (points.length - 1) * (right - left));
  const y = (value: number) => bottom - (value - domainMin) / Math.max(1, domainMax - domainMin) * (bottom - top);
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
    <div className="w-full" role="img" aria-label={last ? `MC Mindscore from ${points[0]?.date} to ${points.at(-1)?.date}; latest available score ${last.value}. Chart range ${domainMin} to ${domainMax}.` : "No MC Mindscore readings yet for this period."}>
      <svg viewBox="0 0 640 220" className="block w-full" preserveAspectRatio="none" aria-hidden="true">
        <defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.25" /><stop offset="100%" stopColor={color} stopOpacity="0" /></linearGradient></defs>
        {values.length > 0 && ticks.map((value, index) => <g key={index}>
          <line x1={left} x2={right} y1={y(value)} y2={y(value)} stroke={gridColor} strokeWidth="1" opacity="0.6" />
          <text x="0" y={y(value) + 4} fill={labelColor} fontSize="12" fontWeight="600">{value}</text>
        </g>)}
        {runs.map((run, index) => <g key={index}>
          {run.length > 1 && <path d={`${pathFor(run)} L ${x(run.at(-1)!.index)} ${bottom} L ${x(run[0].index)} ${bottom} Z`} fill={`url(#${gradientId})`} />}
          <path d={pathFor(run)} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </g>)}
        {last && <circle cx={x(lastIndex)} cy={y(last.value!)} r="7" fill={color} stroke={light ? "#edf7f5" : "var(--card)"} strokeWidth="3" />}
      </svg>
      <div className="flex justify-between text-[10px] font-medium tabular-nums" style={{ color: labelColor }}>
        <span>{points[0] ? format(parseISO(points[0].date), "d MMM yyyy") : ""}</span>
        <span>{points.length > 1 ? format(parseISO(points[points.length - 1].date), "d MMM yyyy") : ""}</span>
      </div>
    </div>
  );
}
