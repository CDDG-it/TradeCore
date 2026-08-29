"use client";

/**
 * Sparkline — a dependency-free inline SVG trend line. Coloured by net
 * direction over the window (conventional green/red), purely descriptive.
 */
import { useId } from "react";

export function Sparkline({
  data,
  width = 72,
  height = 24,
  strokeWidth = 1.5,
  className,
}: {
  data: number[];
  width?: number;
  height?: number;
  strokeWidth?: number;
  className?: string;
}) {
  const id = useId();
  if (!data || data.length < 2) {
    return <svg width={width} height={height} className={className} aria-hidden />;
  }
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const stepX = width / (data.length - 1);
  const y = (v: number) => height - ((v - min) / span) * (height - strokeWidth * 2) - strokeWidth;
  const points = data.map((v, i) => `${(i * stepX).toFixed(2)},${y(v).toFixed(2)}`);
  const up = data[data.length - 1] >= data[0];
  const color = up ? "var(--success)" : "var(--destructive)";
  const areaPath = `M0,${height} L${points.join(" L")} L${width},${height} Z`;

  return (
    <svg width={width} height={height} className={className} aria-hidden>
      <defs>
        <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#spark-${id})`} />
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
