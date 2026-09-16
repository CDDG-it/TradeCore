interface LogoProps {
  variant?: "dark" | "light";
  size?: number;
}

/** A calm, continuous mind outline paired with a deliberate market movement. */
export function LogoMark({ size = 32 }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="TradingMC">
      <rect x="1" y="1" width="62" height="62" rx="18" fill="#102A32" stroke="#28736E" />
      <path d="M31 15c-7-5-16 0-15 8-6 4-6 13 0 17-1 8 8 13 15 8V15Z" stroke="#5EEAD4" strokeWidth="3" strokeLinejoin="round" />
      <path d="M23 24c5 0 8 3 8 7m-13 6c5-3 9-2 13 2m5-24c7-3 14 3 12 10" stroke="#5EEAD4" strokeWidth="3" strokeLinecap="round" />
      <path d="m37 44 6-9 5 3 7-12m-7 0h7v7" stroke="#67E8F9" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ variant = "dark", size = 28, className = "" }: LogoProps & { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      <span className={`${size <= 24 ? "text-sm" : size <= 32 ? "text-base" : "text-lg"} font-bold tracking-tight leading-none`}>
        <span style={{ color: variant === "dark" ? "#F1F5F9" : "#0B1120" }}>Trading</span><span style={{ color: variant === "dark" ? "#5EEAD4" : "#0F766E" }}>MC</span>
      </span>
    </div>
  );
}
