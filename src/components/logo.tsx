/**
 * Tradecore logo components — dark luxury edition.
 * LogoMark  — standalone icon (M zigzag + gold arrow)
 * Logo      — icon + "Tradecore" wordmark side by side
 * LogoStacked — stacked version for landing page hero
 */

interface LogoProps {
  /** "dark" = on dark background (default) → white/light mark + gold arrow
   *  "light" = on light background → charcoal mark + gold arrow */
  variant?: "dark" | "light";
  size?: number;
}

/** The standalone icon mark */
export function LogoMark({ variant = "dark", size = 32 }: LogoProps) {
  const markColor = variant === "dark" ? "#E8E8F0" : "#1A1B2E";
  const goldColor = "#C8982A";
  const iceColor = "#7EC8E3";

  return (
    <svg
      width={size}
      height={Math.round(size * 0.88)}
      viewBox="0 0 100 88"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Tradecore logo mark"
    >
      {/* ── Mark / zigzag chart line ──────────────── */}
      <polyline
        points="6,82 28,38 46,58 68,16"
        stroke={markColor}
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
      />

      {/* ── Gold upward arrow shaft ───────────────── */}
      <line
        x1="22"
        y1="82"
        x2="80"
        y2="12"
        stroke={goldColor}
        strokeWidth="8"
        strokeLinecap="round"
      />
      {/* Arrowhead */}
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
  variant = "dark",
  size = 28,
  className = "",
}: LogoProps & { className?: string }) {
  const wordmarkColor = variant === "dark" ? "#E8E8F0" : "#1A1B2E";
  const textSize =
    size <= 24 ? "text-sm" : size <= 32 ? "text-[15px]" : "text-lg";

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark variant={variant} size={size} />
      <span className={`font-bold tracking-tight leading-none ${textSize}`}>
        <span style={{ color: wordmarkColor }}>Trade</span>
        <span style={{ color: "#C8982A" }}>core</span>
      </span>
    </div>
  );
}

/** Stacked lockup: icon above wordmark (landing page hero) */
export function LogoStacked({ variant = "dark", size = 72 }: LogoProps) {
  const wordmarkColor = variant === "dark" ? "#E8E8F0" : "#1A1B2E";

  return (
    <div className="flex flex-col items-center gap-3">
      <LogoMark variant={variant} size={size} />
      <span className="text-3xl font-bold tracking-tight leading-none">
        <span style={{ color: wordmarkColor }}>Trade</span>
        <span style={{ color: "#C8982A" }}>core</span>
      </span>
    </div>
  );
}
