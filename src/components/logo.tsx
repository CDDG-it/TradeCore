interface LogoProps {
  variant?: "dark" | "light";
  size?: number;
}

/** TradeCORE brand mark — white brain + gradient D + candlesticks */
export function LogoMark({ size = 32 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 185 125"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="TradeCORE mark"
    >
      <defs>
        <linearGradient id="og" x1="0" y1="1" x2="0" y2="0" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#F97316" />
          <stop offset="100%" stopColor="#FBBF24" />
        </linearGradient>
        <linearGradient id="ogV" x1="85" y1="115" x2="85" y2="8" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F97316" />
          <stop offset="100%" stopColor="#FBBF24" />
        </linearGradient>
        <linearGradient id="candleR" x1="148" y1="110" x2="148" y2="8" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F97316" />
          <stop offset="100%" stopColor="#FBBF24" />
        </linearGradient>
      </defs>

      {/* ── Brain: white fill, thick black outer stroke + sulci ── */}
      {/* White brain body */}
      <path
        fill="white"
        stroke="#0d0402"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="
          M 44 10
          C 34 5 20 10 13 21
          C 6 31 7 45 13 55
          C 6 63 4 77 11 88
          C 17 98 29 103 41 102
          C 37 111 40 121 51 122
          C 61 123 70 117 71 109
          Q 76 121 86 118
          C 95 115 96 102 89 95
          C 99 86 101 72 93 60
          C 100 51 98 35 89 27
          C 80 18 65 17 57 24
          C 52 14 48 7 44 10
          Z
        "
      />

      {/* Central sulcus */}
      <path stroke="#0d0402" strokeWidth="5" strokeLinecap="round" fill="none"
        d="M 55 24 C 50 39 46 56 46 73" />
      {/* Sylvian fissure (horizontal) */}
      <path stroke="#0d0402" strokeWidth="5" strokeLinecap="round" fill="none"
        d="M 16 62 C 30 57 45 54 58 51" />
      {/* Frontal gyrus */}
      <path stroke="#0d0402" strokeWidth="5" strokeLinecap="round" fill="none"
        d="M 37 11 C 32 26 29 41 33 56" />
      {/* Superior parietal */}
      <path stroke="#0d0402" strokeWidth="5" strokeLinecap="round" fill="none"
        d="M 90 33 C 83 46 74 56 62 61" />
      {/* Inferior parietal / occipital */}
      <path stroke="#0d0402" strokeWidth="5" strokeLinecap="round" fill="none"
        d="M 94 68 C 84 79 70 84 57 83" />
      {/* Temporal gyrus */}
      <path stroke="#0d0402" strokeWidth="5" strokeLinecap="round" fill="none"
        d="M 22 77 C 33 84 45 86 57 83" />

      {/* ── D shape: bold letter D, orange→yellow gradient ── */}
      <path
        fill="url(#ogV)"
        d="M 78 8 L 78 117 Q 148 117 148 62.5 Q 148 8 78 8 Z"
      />

      {/* ── Candle 1 on D (dark silhouette, shorter) ── */}
      <line x1="97" y1="26" x2="97" y2="43" stroke="#180800" strokeWidth="4.5" strokeLinecap="round" opacity="0.9" />
      <rect x="90" y="43" width="14" height="34" rx="2.5" fill="#180800" opacity="0.9" />
      <line x1="97" y1="77" x2="97" y2="94" stroke="#180800" strokeWidth="4.5" strokeLinecap="round" opacity="0.9" />

      {/* ── Candle 2 on D (dark silhouette, taller, right) ── */}
      <line x1="117" y1="18" x2="117" y2="37" stroke="#180800" strokeWidth="4.5" strokeLinecap="round" opacity="0.9" />
      <rect x="110" y="37" width="14" height="44" rx="2.5" fill="#180800" opacity="0.9" />
      <line x1="117" y1="81" x2="117" y2="100" stroke="#180800" strokeWidth="4.5" strokeLinecap="round" opacity="0.9" />

      {/* ── Right candle: gradient, outside D ── */}
      <line x1="148" y1="8" x2="148" y2="28" stroke="url(#candleR)" strokeWidth="4.5" strokeLinecap="round" />
      <rect x="140" y="28" width="16" height="50" rx="2.5" fill="url(#candleR)" />
      <line x1="148" y1="78" x2="148" y2="102" stroke="url(#candleR)" strokeWidth="4.5" strokeLinecap="round" />
    </svg>
  );
}

/** Horizontal lockup: mark + wordmark (round bold font via CSS var) */
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
      <span
        className={`font-bold tracking-tight leading-none ${sz}`}
        style={{ fontFamily: "var(--font-nunito), var(--font-barlow), system-ui, sans-serif" }}
      >
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
