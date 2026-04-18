interface LogoProps {
  variant?: "dark" | "light";
  size?: number;
}

const GOLD = "#C8982A";
const ICE  = "#7EC8E3";

/** Minimal breakout mark — ice blue spark line with gold peak dot */
export function LogoMark({ size = 32 }: LogoProps) {
  const w = size;
  const h = Math.round(size * 0.75);

  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 40 30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Tradecore mark"
    >
      {/* Spark line: dips then breaks upward */}
      <polyline
        points="2,18 14,24 32,4"
        stroke={ICE}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Gold dot at the breakout peak */}
      <circle cx="32" cy="4" r="4" fill={GOLD} />
    </svg>
  );
}

/** Horizontal lockup: mark + wordmark */
export function Logo({
  variant = "dark",
  size = 28,
  className = "",
}: LogoProps & { className?: string }) {
  const wordColor = variant === "dark" ? "#E8E8F0" : "#1A1B2E";
  const textSize = size <= 24 ? "text-sm" : size <= 32 ? "text-[15px]" : "text-lg";

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      <span className={`font-bold tracking-tight leading-none ${textSize}`}>
        <span style={{ color: wordColor }}>Trade</span>
        <span style={{ color: GOLD }}>core</span>
      </span>
    </div>
  );
}

/** Stacked lockup for landing page hero */
export function LogoStacked({ variant = "dark", size = 72 }: LogoProps) {
  const wordColor = variant === "dark" ? "#E8E8F0" : "#1A1B2E";

  return (
    <div className="flex flex-col items-center gap-3">
      <LogoMark size={size} />
      <span className="text-3xl font-bold tracking-tight leading-none">
        <span style={{ color: wordColor }}>Trade</span>
        <span style={{ color: GOLD }}>core</span>
      </span>
    </div>
  );
}
