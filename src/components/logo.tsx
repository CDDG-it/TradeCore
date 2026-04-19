interface LogoProps {
  variant?: "dark" | "light";
  size?: number;
}

const AMBER  = "#F59E0B";
const COPPER = "#B45309";

/** Three ascending bars — trading performance mark */
export function LogoMark({ size = 32 }: LogoProps) {
  const scale = size / 38;
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
      {/* Three ascending bars */}
      <rect x="1"  y="22" width="9" height="11" rx="1.5" fill={AMBER} opacity="0.45" />
      <rect x="15" y="14" width="9" height="19" rx="1.5" fill={AMBER} opacity="0.72" />
      <rect x="29" y="5"  width="9" height="28" rx="1.5" fill={AMBER} />
      {/* Diagonal connecting line at tops */}
      <polyline
        points="5.5,22 19.5,14 33.5,5"
        stroke={COPPER}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Peak dot */}
      <circle cx="33.5" cy="5" r="2.5" fill={AMBER} />
    </svg>
  );
}

/** Horizontal lockup: mark + wordmark */
export function Logo({
  variant = "dark",
  size = 28,
  className = "",
}: LogoProps & { className?: string }) {
  const wordColor = variant === "dark" ? "#F5ECD7" : "#1A0E00";
  const textSize = size <= 24 ? "text-sm" : size <= 32 ? "text-[15px]" : "text-lg";

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      <span className={`font-bold tracking-tight leading-none ${textSize}`}>
        <span style={{ color: wordColor }}>Trade</span>
        <span style={{ color: AMBER }}>core</span>
      </span>
    </div>
  );
}

/** Stacked lockup for landing page hero */
export function LogoStacked({ variant = "dark", size = 72 }: LogoProps) {
  const wordColor = variant === "dark" ? "#F5ECD7" : "#1A0E00";

  return (
    <div className="flex flex-col items-center gap-3">
      <LogoMark size={size} />
      <span className="text-3xl font-bold tracking-tight leading-none">
        <span style={{ color: wordColor }}>Trade</span>
        <span style={{ color: AMBER }}>core</span>
      </span>
    </div>
  );
}
