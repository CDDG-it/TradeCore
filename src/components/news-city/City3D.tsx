"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { CityGround } from "./scene/CityGround";
import { CentralBankDistrict } from "./scene/CentralBankDistrict";
import { CommodityHarbor } from "./scene/CommodityHarbor";
import { MacroBattlefield } from "./scene/MacroBattlefield";
import { NasdaqHQ } from "./scene/NasdaqHQ";
import { MarketCore } from "./scene/MarketCore";
import { FlowLink } from "./scene/FlowLink";
import type { NewsCityData } from "@/lib/news-city/types";
import type { CitySelection } from "./selection";

// District anchors on the platform — flows run between these points so
// influence visibly moves through the system: banks and macro feed the core,
// the core drives the exchange, and commodities feed the macro engines.
const CB: [number, number] = [-6.5, -6.5];
const HARBOR: [number, number] = [6.5, -6.2];
const MACRO: [number, number] = [-6.4, 6.2];
const NQ: [number, number] = [6.5, 6.2];
const CORE: [number, number] = [0, 0];

export function City3D({
  data,
  selected,
  onSelect,
}: {
  data: NewsCityData;
  selected: CitySelection | null;
  onSelect: (sel: CitySelection) => void;
}) {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 13, 21], fov: 38 }}
      className="!touch-none"
      dpr={[1, 1.75]}
    >
      {/* Bright open atmosphere — an abstract intelligence space, not a sky. */}
      <color attach="background" args={["#f2f5f9"]} />
      <fog attach="fog" args={["#f2f5f9", 26, 48]} />

      <ambientLight intensity={0.85} color="#ffffff" />
      <hemisphereLight args={["#ffffff", "#c4cdd8", 0.5]} />
      <directionalLight
        position={[10, 16, 8]}
        intensity={1.35}
        color="#ffffff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
      />

      <Suspense fallback={null}>
        <CityGround />

        {/* Information pathways: how influence moves through the market. */}
        <FlowLink from={CB} to={CORE} color="#d97a2e" lift={2.2} />
        <FlowLink from={HARBOR} to={MACRO} color="#2b93b4" lift={2.6} speed={0.12} />
        <FlowLink from={MACRO} to={CORE} color="#c9573a" lift={2.0} speed={0.14} />
        <FlowLink from={CORE} to={NQ} color="#f97316" lift={2.2} speed={0.2} pulses={3} />

        <MarketCore
          overview={data.overview}
          active={selected?.kind === "core"}
          onSelect={() => onSelect({ kind: "core" })}
        />
        <CentralBankDistrict banks={data.centralBanks} selected={selected} onSelect={(id) => onSelect({ kind: "bank", id })} />
        <CommodityHarbor commodities={data.commodities} selected={selected} onSelect={(id) => onSelect({ kind: "commodity", id })} />
        <MacroBattlefield forces={data.macroForces} selected={selected} onSelect={(id) => onSelect({ kind: "macro", id })} />
        <NasdaqHQ hq={data.marketHQ} selected={selected} onSelect={() => onSelect({ kind: "hq" })} />
      </Suspense>

      <OrbitControls
        enablePan={false}
        minDistance={11}
        maxDistance={30}
        minPolarAngle={0.35}
        maxPolarAngle={Math.PI / 2.15}
        target={[0, 1, 0]}
        rotateSpeed={0.35}
        zoomSpeed={0.6}
        enableDamping
        dampingFactor={0.08}
      />
    </Canvas>
  );
}
