"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { CityGround } from "./scene/CityGround";
import { CentralBankDistrict } from "./scene/CentralBankDistrict";
import { CommodityHarbor } from "./scene/CommodityHarbor";
import { MacroBattlefield } from "./scene/MacroBattlefield";
import { NasdaqHQ } from "./scene/NasdaqHQ";
import type { NewsCityData } from "@/lib/news-city/types";
import type { CitySelection } from "./selection";

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
      {/* Bright studio backdrop — an abstract holographic space, not a sky. */}
      <color attach="background" args={["#f2f5f9"]} />
      <fog attach="fog" args={["#f2f5f9", 26, 46]} />

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
