/**
 * TradeOn logo components.
 * LogoMark  — just the icon (M zigzag + gold arrow)
 * Logo      — icon + "TradeOn" wordmark side by side
 * LogoFull  — stacked: icon above wordmark (for landing page hero)
 */

interface LogoProps {
  /** "dark" = rendered on a dark (navy) background → white mark + gold arrow
   *  "light" = rendered on a light (white) background → navy mark + gold arrow */
  variant?: "dark" | "light";
  size?: number;
}

/** The standalone icon mark */
export function LogoMark({ variant = "light", size = 32 }: LogoProps) {
  const markColor = variant === "dark" ? "#FFFFFF" : "#1E3461";
  const goldColor = "#C4952A";

  // ViewBox: 100 × 90
  // Navy/white zigzag: 4 points forming an M/price-chart shape
  // Gold arrow: diagonal shaft + open arrowhead (two lines)
  // They share the same diagonal trajectory but are offset so they interleave.

  return (
    <svg
      width={size}
      height={Math.round(size * 0.88)}
      viewBox="0 0 100 88"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="TradeOn logo mark"
    >
      {/* ── Navy / white M zigzag ──────────────────────────── */}
      {/* From bottom-left → first peak → valley → second peak */}
      <polyline
        points="6,82 28,38 46,58 68,16"
        stroke={markColor}
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* ── Gold upward arrow ─────────────────────────────── */}
      {/* Shaft — starts slightly right of the M start, ends upper-right */}
      <line
        x1="22"
        y1="82"
        x2="80"
        y2="12"
        stroke={goldColor}
        strokeWidth="8"
        strokeLinecap="round"
      />
      {/* Arrowhead — two lines forming an open ">" at the tip */}
      <polyline
        points="60,8 80,12 75,32"
        stroke={goldColor}
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

/** Horizontal lockup: icon + wordmark */
export function Logo({
  variant = "light",
  size = 28,
  className = "",
}: LogoProps & { className?: string }) {
  const wordmarkNavy = variant === "dark" ? "text-white" : "text-[#1E3461]";

  const textSize =
    size <= 24 ? "text-sm" : size <= 32 ? "text-[15px]" : "text-lg";

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark variant={variant} size={size} />
      <span className={`font-bold tracking-tight leading-none ${textSize}`}>
        <span className={wordmarkNavy}>Trade</span>
        <span style={{ color: "#C4952A" }}>On</span>
      </span>
    </div>
  );
}

/** Stacked lockup: icon above wordmark (landing page hero) */
export function LogoStacked({ variant = "light", size = 72 }: LogoProps) {
  const wordmarkNavy = variant === "dark" ? "text-white" : "text-[#1E3461]";

  return (
    <div className="flex flex-col items-center gap-3">
      <LogoMark variant={variant} size={size} />
      <span className="text-3xl font-bold tracking-tight leading-none">
        <span className={wordmarkNavy}>Trade</span>
        <span style={{ color: "#C4952A" }}>On</span>
      </span>
    </div>
  );
}
