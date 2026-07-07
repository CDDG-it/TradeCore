"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, ContactShadows } from "@react-three/drei";
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
      camera={{ position: [0, 11, 16], fov: 42 }}
      className="!touch-none"
      dpr={[1, 1.75]}
    >
      <color attach="background" args={["#ffffff"]} />
      <fog attach="fog" args={["#ffffff", 22, 38]} />

      <ambientLight intensity={0.9} color="#ffffff" />
      <hemisphereLight args={["#ffffff", "#d8ccb8", 0.6]} />
      <directionalLight
        position={[8, 14, 6]}
        intensity={1.5}
        color="#fff3e0"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-14}
        shadow-camera-right={14}
        shadow-camera-top={14}
        shadow-camera-bottom={-14}
      />
      <pointLight position={[0, 6, 0]} intensity={0.3} color="#f97316" distance={12} />

      <Suspense fallback={null}>
        <CityGround />
        <CentralBankDistrict banks={data.centralBanks} selected={selected} onSelect={(id) => onSelect({ kind: "bank", id })} />
        <CommodityHarbor commodities={data.commodities} selected={selected} onSelect={(id) => onSelect({ kind: "commodity", id })} />
        <MacroBattlefield forces={data.macroForces} selected={selected} onSelect={(id) => onSelect({ kind: "macro", id })} />
        <NasdaqHQ hq={data.marketHQ} selected={selected} onSelect={() => onSelect({ kind: "hq" })} />
        <ContactShadows position={[0, 0, 0]} opacity={0.35} scale={40} blur={2.4} far={10} color="#000000" />
      </Suspense>

      <OrbitControls
        enablePan={false}
        minDistance={9}
        maxDistance={24}
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
