interface LogoProps {
  variant?: "dark" | "light";
  size?: number;
}

const VIOLET = "#8B5CF6";
const CYAN   = "#22D3EE";

/** Futuristic diamond mark — violet frame + cyan breakout line */
export function LogoMark({ size = 32 }: LogoProps) {
  const w = size;
  const h = size;

  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Tradecore mark"
    >
      {/* Diamond outline */}
      <polygon
        points="20,2 38,20 20,38 2,20"
        fill="none"
        stroke={VIOLET}
        strokeWidth="1.8"
        strokeLinejoin="round"
        opacity="0.85"
      />
      {/* Ascending breakout line */}
      <polyline
        points="8,30 20,20 32,10"
        stroke={CYAN}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Peak dot */}
      <circle cx="32" cy="10" r="3" fill={VIOLET} />
    </svg>
  );
}

/** Horizontal lockup: mark + wordmark */
export function Logo({
  variant = "dark",
  size = 28,
  className = "",
}: LogoProps & { className?: string }) {
  const wordColor = variant === "dark" ? "#E8E8F8" : "#0F0A1E";
  const textSize = size <= 24 ? "text-sm" : size <= 32 ? "text-[15px]" : "text-lg";

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      <span className={`font-bold tracking-tight leading-none ${textSize}`}>
        <span style={{ color: wordColor }}>Trade</span>
        <span style={{ color: VIOLET }}>core</span>
      </span>
    </div>
  );
}

/** Stacked lockup for landing page hero */
export function LogoStacked({ variant = "dark", size = 72 }: LogoProps) {
  const wordColor = variant === "dark" ? "#E8E8F8" : "#0F0A1E";

  return (
    <div className="flex flex-col items-center gap-3">
      <LogoMark size={size} />
      <span className="text-3xl font-bold tracking-tight leading-none">
        <span style={{ color: wordColor }}>Trade</span>
        <span style={{ color: VIOLET }}>core</span>
      </span>
    </div>
  );
}
