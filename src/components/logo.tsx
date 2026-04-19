interface LogoProps {
  variant?: "dark" | "light";
  size?: number;
}

/** Brain + D-candlestick mark matching TradeCORE brand */
export function LogoMark({ size = 32 }: LogoProps) {
  const w = size;
  const h = Math.round(size * (105 / 130));

  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 130 105"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="TradeCORE mark"
    >
      <defs>
        <linearGradient id="tcGrad" x1="95" y1="97" x2="95" y2="8" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F97316" />
          <stop offset="100%" stopColor="#FBBF24" />
        </linearGradient>
      </defs>

      {/* ── Brain — white outline, left half ── */}
      <g stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {/* Outer brain shape */}
        <path d="
          M35 14
          C24 11, 12 19, 8 32
          C4 44, 8 57, 16 65
          C11 73, 13 82, 21 87
          C27 92, 37 93, 45 90
          C49 97, 57 98, 63 94
          C69 90, 72 82, 69 74
          C76 70, 79 60, 75 51
          C80 46, 80 35, 74 28
          C70 21, 61 17, 54 19
          C51 13, 44 9, 36 12
          Z
        " />
        {/* Brain folds */}
        <path d="M34 15 C31 25, 30 37, 33 48" />
        <path d="M46 12 C43 23, 42 36, 44 47" />
        <path d="M57 20 C56 31, 54 43, 49 53" />
        <path d="M69 32 C66 43, 59 52, 50 57" />
        <path d="M73 54 C65 65, 54 70, 43 72" />
        <path d="M32 55 C35 65, 42 72, 51 74" />
        {/* Bottom temporal lobe */}
        <path d="M44 90 C38 97, 27 98, 21 93 C15 88, 15 79, 21 74" />
      </g>

      {/* ── D shape — orange-yellow gradient ── */}
      <path
        d="M68 14 L68 96 Q126 96 126 55 Q126 14 68 14 Z"
        fill="url(#tcGrad)"
      />

      {/* ── Candlestick 1 — black body centered on D ── */}
      <rect x="77" y="38" width="12" height="30" rx="1" fill="black" opacity="0.72" />
      <line x1="83" y1="22" x2="83" y2="38" stroke="black" strokeWidth="2.5" opacity="0.72" />
      <line x1="83" y1="68" x2="83" y2="82" stroke="black" strokeWidth="2.5" opacity="0.72" />

      {/* ── Candlestick 2 — yellow, extends above D ── */}
      <rect x="97" y="46" width="9" height="20" rx="1" fill="url(#tcGrad)" />
      <line x1="101.5" y1="8" x2="101.5" y2="46" stroke="#FBBF24" strokeWidth="2.5" />
      <line x1="101.5" y1="66" x2="101.5" y2="86" stroke="#FBBF24" strokeWidth="2" />
    </svg>
  );
}

/** Horizontal lockup: mark + wordmark */
export function Logo({
  variant = "dark",
  size = 28,
  className = "",
}: LogoProps & { className?: string }) {
  const wordColor = variant === "dark" ? "#FFFFFF" : "#111111";
  const textSize = size <= 24 ? "text-sm" : size <= 32 ? "text-[15px]" : "text-lg";

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      <span className={`font-bold tracking-tight leading-none ${textSize}`}>
        <span style={{ color: wordColor }}>Trade</span>
        <span style={{
          background: "linear-gradient(90deg, #F97316 0%, #FBBF24 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}>CORE</span>
      </span>
    </div>
  );
}

/** Stacked lockup for landing page hero */
export function LogoStacked({ variant = "dark", size = 72 }: LogoProps) {
  const wordColor = variant === "dark" ? "#FFFFFF" : "#111111";

  return (
    <div className="flex flex-col items-center gap-3">
      <LogoMark size={size} />
      <span className="text-3xl font-bold tracking-tight leading-none">
        <span style={{ color: wordColor }}>Trade</span>
        <span style={{
          background: "linear-gradient(90deg, #F97316 0%, #FBBF24 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}>CORE</span>
      </span>
    </div>
  );
}
