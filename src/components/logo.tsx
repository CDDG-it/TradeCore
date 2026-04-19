interface LogoProps {
  variant?: "dark" | "light";
  size?: number;
}

/** TradeCORE brand mark: white brain (left) + orange-yellow D-candlestick (right) */
export function LogoMark({ size = 32 }: LogoProps) {
  const w = size;
  const h = size;

  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="TradeCORE"
    >
      <defs>
        <linearGradient id="tcOG" x1="50" y1="95" x2="80" y2="5" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F97316" />
          <stop offset="100%" stopColor="#FBBF24" />
        </linearGradient>
      </defs>

      {/* ── Brain — white outline, left hemisphere ── */}
      <g stroke="white" strokeWidth="2.1" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {/* Main outer brain contour */}
        <path d="
          M34 10
          C26 8 17 12 12 20
          C7 27 6 36 9 45
          C5 51 4 60 8 68
          C11 74 17 79 24 81
          C21 87 22 93 28 97
          C34 101 43 100 49 96
          C53 101 61 102 67 98
          C74 93 75 85 72 77
          C79 72 82 63 78 54
          C83 48 83 37 77 30
          C73 23 64 18 56 20
          C53 13 45 8 36 10
          Z
        " />
        {/* Central sulcus */}
        <path d="M55 20 C51 33 47 47 46 62" />
        {/* Sylvian fissure */}
        <path d="M22 53 C33 49 45 46 57 43" />
        {/* Frontal fold */}
        <path d="M36 11 C33 22 31 34 34 46" />
        {/* Parietal fold */}
        <path d="M74 36 C70 47 63 55 53 60" />
        {/* Occipital-parietal */}
        <path d="M77 58 C69 68 57 73 46 74" />
        {/* Temporal fold */}
        <path d="M21 66 C28 71 37 73 46 72" />
        {/* Frontal lobe bump */}
        <path d="M36 11 C31 5 23 4 19 9 C15 14 16 22 21 27" />
        {/* Lower temporal lobe */}
        <path d="M48 96 C43 102 32 103 26 98 C20 93 20 84 26 79" />
      </g>

      {/* ── D shape — orange-yellow gradient ── */}
      <path
        d="M60 12 L60 88 Q100 88 100 50 Q100 12 60 12 Z"
        fill="url(#tcOG)"
      />

      {/* ── Candlestick 1: black body on D ── */}
      <rect x="69" y="32" width="11" height="28" rx="1.5" fill="black" opacity="0.70" />
      <line x1="74.5" y1="18" x2="74.5" y2="32" stroke="black" strokeWidth="2.5" opacity="0.70" />
      <line x1="74.5" y1="60" x2="74.5" y2="74" stroke="black" strokeWidth="2.5" opacity="0.70" />

      {/* ── Candlestick 2: yellow bar, extends above D ── */}
      <rect x="84" y="40" width="8" height="18" rx="1.5" fill="url(#tcOG)" />
      <line x1="88" y1="6" x2="88" y2="40" stroke="#FBBF24" strokeWidth="2.5" />
      <line x1="88" y1="58" x2="88" y2="78" stroke="#FBBF24" strokeWidth="2" />
    </svg>
  );
}

/** Horizontal lockup: mark + wordmark */
export function Logo({
  variant = "dark",
  size = 28,
  className = "",
}: LogoProps & { className?: string }) {
  const tradeColor = variant === "dark" ? "#FFFFFF" : "#111111";
  const sz = size <= 24 ? "text-sm" : size <= 32 ? "text-[15px]" : "text-lg";

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      <span className={`font-bold tracking-tight leading-none ${sz}`}>
        <span style={{ color: tradeColor }}>Trade</span>
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
  const tradeColor = variant === "dark" ? "#FFFFFF" : "#111111";

  return (
    <div className="flex flex-col items-center gap-3">
      <LogoMark size={size} />
      <span className="text-3xl font-bold tracking-tight leading-none">
        <span style={{ color: tradeColor }}>Trade</span>
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
