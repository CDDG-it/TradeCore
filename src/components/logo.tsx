interface LogoProps {
  variant?: "dark" | "light";
  size?: number;
}

const ORANGE = "#F97316";
const YELLOW = "#FBBF24";

/** Three ascending bars — trading performance mark */
export function LogoMark({ size = 32 }: LogoProps) {
  const w = size;
  const h = Math.round(size * (34 / 38));

  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 38 34"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Tradecore mark"
    >
      <defs>
        <linearGradient id="barGrad" x1="0" y1="1" x2="1" y2="0" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor={ORANGE} />
          <stop offset="100%" stopColor={YELLOW} />
        </linearGradient>
      </defs>
      {/* Three ascending bars */}
      <rect x="1"  y="22" width="9" height="11" rx="1.5" fill="url(#barGrad)" opacity="0.45" />
      <rect x="15" y="14" width="9" height="19" rx="1.5" fill="url(#barGrad)" opacity="0.72" />
      <rect x="29" y="5"  width="9" height="28" rx="1.5" fill="url(#barGrad)" />
      {/* Diagonal connecting line at tops */}
      <polyline
        points="5.5,22 19.5,14 33.5,5"
        stroke={YELLOW}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Peak dot */}
      <circle cx="33.5" cy="5" r="2.5" fill={YELLOW} />
    </svg>
  );
}

/** Horizontal lockup: mark + wordmark */
export function Logo({
  variant = "dark",
  size = 28,
  className = "",
}: LogoProps & { className?: string }) {
  const wordColor = variant === "dark" ? "#FFFFFF" : "#1A0E00";

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      <span className={`font-bold tracking-tight leading-none ${size <= 24 ? "text-sm" : size <= 32 ? "text-[15px]" : "text-lg"}`}>
        <span style={{ color: wordColor }}>Trade</span>
        <span style={{ color: ORANGE }}>core</span>
      </span>
    </div>
  );
}

/** Stacked lockup for landing page hero */
export function LogoStacked({ variant = "dark", size = 72 }: LogoProps) {
  const wordColor = variant === "dark" ? "#FFFFFF" : "#1A0E00";

  return (
    <div className="flex flex-col items-center gap-3">
      <LogoMark size={size} />
      <span className="text-3xl font-bold tracking-tight leading-none">
        <span style={{ color: wordColor }}>Trade</span>
        <span style={{ color: ORANGE }}>core</span>
      </span>
    </div>
  );
}
