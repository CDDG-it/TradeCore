interface LogoProps {
  variant?: "dark" | "light";
  size?: number;
}

export function LogoMark({ size = 32 }: LogoProps) {
  return (
    <svg
      width={size}
      height={Math.round(size * 0.88)}
      viewBox="0 0 210 185"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="TradeCORE"
    >
      <defs>
        <linearGradient id="gD" x1="100" y1="180" x2="100" y2="5" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F97316" />
          <stop offset="100%" stopColor="#FBBF24" />
        </linearGradient>
        <linearGradient id="gC" x1="168" y1="175" x2="168" y2="5" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F97316" />
          <stop offset="100%" stopColor="#FBBF24" />
        </linearGradient>
      </defs>

      {/* ─────────────────────────────────────────────
          BRAIN — white fill + thick black strokes
          Side-view (lateral) left hemisphere
          ───────────────────────────────────────────── */}
      {/* White brain fill */}
      <path
        fill="white"
        d="
          M 48 12
          C 38 8 24 12 16 23
          C 8 33 9 47 16 57
          C 9 66 7 79 13 91
          C 18 102 32 109 44 108
          C 41 118 43 130 54 132
          C 64 134 73 128 75 119
          C 80 129 88 134 97 132
          C 106 130 109 120 107 111
          C 116 104 120 92 115 80
          C 121 73 121 59 115 50
          C 109 40 97 35 88 37
          C 83 27 73 18 62 15
          C 58 12 53 11 48 12 Z
        "
      />
      {/* Brain outer border */}
      <path
        fill="none"
        stroke="#0c0501"
        strokeWidth="6.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="
          M 48 12
          C 38 8 24 12 16 23
          C 8 33 9 47 16 57
          C 9 66 7 79 13 91
          C 18 102 32 109 44 108
          C 41 118 43 130 54 132
          C 64 134 73 128 75 119
          C 80 129 88 134 97 132
          C 106 130 109 120 107 111
          C 116 104 120 92 115 80
          C 121 73 121 59 115 50
          C 109 40 97 35 88 37
          C 83 27 73 18 62 15
          C 58 12 53 11 48 12 Z
        "
      />
      {/* Central sulcus */}
      <path fill="none" stroke="#0c0501" strokeWidth="6" strokeLinecap="round"
        d="M 64 15 C 59 33 56 54 57 75" />
      {/* Sylvian fissure (lateral fissure) */}
      <path fill="none" stroke="#0c0501" strokeWidth="6" strokeLinecap="round"
        d="M 14 68 C 30 63 48 61 63 63" />
      {/* Superior frontal sulcus */}
      <path fill="none" stroke="#0c0501" strokeWidth="6" strokeLinecap="round"
        d="M 41 13 C 36 28 33 44 37 60" />
      {/* Inferior frontal region */}
      <path fill="none" stroke="#0c0501" strokeWidth="6" strokeLinecap="round"
        d="M 17 42 C 29 38 44 37 55 41" />
      {/* Parietal sulcus */}
      <path fill="none" stroke="#0c0501" strokeWidth="6" strokeLinecap="round"
        d="M 114 55 C 107 68 98 78 86 83" />
      {/* Occipito-parietal */}
      <path fill="none" stroke="#0c0501" strokeWidth="6" strokeLinecap="round"
        d="M 116 76 C 107 88 95 95 82 93" />
      {/* Superior temporal */}
      <path fill="none" stroke="#0c0501" strokeWidth="6" strokeLinecap="round"
        d="M 17 83 C 31 88 47 90 60 87" />
      {/* Inferior temporal */}
      <path fill="none" stroke="#0c0501" strokeWidth="6" strokeLinecap="round"
        d="M 43 106 C 53 112 64 113 74 110" />

      {/* ─────────────────────────────────────────────
          BOLD LETTER D — orange→yellow gradient
          Flat left edge aligned with brain right side
          ───────────────────────────────────────────── */}
      <path
        fill="url(#gD)"
        d="M 87 7 L 87 178 Q 162 178 162 92.5 Q 162 7 87 7 Z"
      />

      {/* ─────────────────────────────────────────────
          CANDLESTICK 1 — dark silhouette, on D (shorter)
          ───────────────────────────────────────────── */}
      <line x1="108" y1="35" x2="108" y2="56" stroke="#130600" strokeWidth="5.5" strokeLinecap="round" opacity="0.92"/>
      <rect x="100" y="56" width="16" height="46" rx="3" fill="#130600" opacity="0.92"/>
      <line x1="108" y1="102" x2="108" y2="125" stroke="#130600" strokeWidth="5.5" strokeLinecap="round" opacity="0.92"/>

      {/* ─────────────────────────────────────────────
          CANDLESTICK 2 — dark silhouette, on D (taller)
          ───────────────────────────────────────────── */}
      <line x1="130" y1="22" x2="130" y2="47" stroke="#130600" strokeWidth="5.5" strokeLinecap="round" opacity="0.92"/>
      <rect x="122" y="47" width="16" height="56" rx="3" fill="#130600" opacity="0.92"/>
      <line x1="130" y1="103" x2="130" y2="130" stroke="#130600" strokeWidth="5.5" strokeLinecap="round" opacity="0.92"/>

      {/* ─────────────────────────────────────────────
          CANDLESTICK 3 — gradient, outside D (right)
          ───────────────────────────────────────────── */}
      <line x1="168" y1="8" x2="168" y2="38" stroke="url(#gC)" strokeWidth="5.5" strokeLinecap="round"/>
      <rect x="159" y="38" width="18" height="62" rx="3" fill="url(#gC)"/>
      <line x1="168" y1="100" x2="168" y2="138" stroke="url(#gC)" strokeWidth="5.5" strokeLinecap="round"/>
    </svg>
  );
}

export function Logo({
  variant = "dark",
  size = 28,
  className = "",
}: LogoProps & { className?: string }) {
  const tradeColor = variant === "dark" ? "#FFFFFF" : "#111111";
  const textSize = size <= 24 ? "text-sm" : size <= 32 ? "text-base" : "text-lg";

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <LogoMark size={size} />
      <span
        className={`font-black tracking-tight leading-none ${textSize}`}
        style={{ fontFamily: "var(--font-nunito), system-ui, sans-serif" }}
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
