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
      {/* Deep graphite backdrop — an abstract holographic environment, not a sky. */}
      <color attach="background" args={["#0a0d12"]} />
      <fog attach="fog" args={["#0a0d12", 26, 46]} />

      <ambientLight intensity={0.4} color="#cfd8e6" />
      <hemisphereLight args={["#3a4552", "#12151b", 0.55]} />
      <directionalLight
        position={[10, 16, 8]}
        intensity={1.15}
        color="#e8f1ff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
      />
      {/* Brand accent glow rising from the HQ core */}
      <pointLight position={[0, 7, 0]} intensity={0.22} color="#f97316" distance={14} decay={2} />

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
