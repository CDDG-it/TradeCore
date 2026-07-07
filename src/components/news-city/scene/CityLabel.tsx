"use client";

import { Html } from "@react-three/drei";

export function CityLabel({
  y,
  label,
  sublabel,
  accent,
  emphasized,
}: {
  y: number;
  label: string;
  sublabel?: string;
  accent: string;
  emphasized: boolean;
}) {
  return (
    <Html position={[0, y, 0]} center distanceFactor={11} occlude={false} zIndexRange={[10, 0]}>
      <div
        className="pointer-events-none select-none whitespace-nowrap rounded-full border px-2.5 py-1 text-center backdrop-blur-sm transition-[opacity,transform] duration-150"
        style={{
          background: "rgba(17,12,8,0.78)",
          borderColor: emphasized ? accent : "rgba(255,255,255,0.14)",
          transform: emphasized ? "translateY(-2px)" : "none",
          boxShadow: emphasized ? `0 0 0 1px ${accent}55, 0 6px 18px rgba(0,0,0,0.35)` : "none",
        }}
      >
        <p className="font-body text-[10px] font-bold uppercase tracking-wider text-white leading-none">{label}</p>
        {sublabel && <p className="font-body text-[9px] text-white/60 mt-0.5 leading-none">{sublabel}</p>}
      </div>
    </Html>
  );
}
