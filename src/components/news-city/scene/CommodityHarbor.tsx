"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { Ship } from "./Ship";
import { WaterPlane } from "./WaterPlane";
import { TREND_META } from "@/lib/news-city/ui";
import type { Commodity } from "@/lib/news-city/types";
import type { CitySelection } from "../selection";

const CENTER: [number, number] = [6.5, -6.2];

const ROUTES: Record<Commodity["id"], { center: [number, number]; rx: number; rz: number; speed: number; phase: number; color: string }> = {
  oil: { center: [5.9, -7.0], rx: 0.55, rz: 0.4, speed: 0.1, phase: 0, color: "#2b3440" },
  gold: { center: [7.5, -5.4], rx: 0.45, rz: 0.55, speed: 0.085, phase: 2.4, color: "#b8923f" },
};

/** Slowly sails a vessel around a small elliptical route, bow first. */
function Drift({
  center,
  rx,
  rz,
  speed,
  phase,
  children,
}: {
  center: [number, number];
  rx: number;
  rz: number;
  speed: number;
  phase: number;
  children: React.ReactNode;
}) {
  const ref = useRef<Group>(null);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime * speed + phase;
    ref.current.position.set(center[0] + Math.cos(t) * rx, 0, center[1] + Math.sin(t) * rz);
    // Face the direction of travel (hull points +X).
    const dx = -Math.sin(t) * rx;
    const dz = Math.cos(t) * rz;
    ref.current.rotation.y = Math.atan2(-dz, dx);
  });

  return <group ref={ref}>{children}</group>;
}

/** A slim container crane on the quay — futuristic port infrastructure. */
function Crane({ position, rotationY = 0 }: { position: [number, number, number]; rotationY?: number }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.6, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.06, 1.2, 12]} />
        <meshStandardMaterial color="#c2ccd6" roughness={0.45} metalness={0.3} />
      </mesh>
      {/* Jib reaching over the water */}
      <mesh position={[0.5, 1.16, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 1.15, 10]} />
        <meshStandardMaterial color="#c2ccd6" roughness={0.45} metalness={0.3} />
      </mesh>
      {/* Hoist cable + hook light */}
      <mesh position={[0.92, 0.92, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 0.46, 6]} />
        <meshStandardMaterial color="#8b96a2" roughness={0.5} />
      </mesh>
      <mesh position={[0.92, 0.66, 0]}>
        <sphereGeometry args={[0.035, 10, 10]} />
        <meshBasicMaterial color="#f97316" toneMapped={false} />
      </mesh>
    </group>
  );
}

export function CommodityHarbor({
  commodities,
  selected,
  onSelect,
}: {
  commodities: Commodity[];
  selected: CitySelection | null;
  onSelect: (id: Commodity["id"]) => void;
}) {
  return (
    <group>
      {/* Liquid basin with a glowing rim — the commodity reservoir. */}
      <WaterPlane position={[CENTER[0], 0.008, CENTER[1]]} size={5.4} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[CENTER[0], 0.02, CENTER[1]]}>
        <ringGeometry args={[2.72, 2.8, 64]} />
        <meshBasicMaterial color="#2b93b4" transparent opacity={0.65} toneMapped={false} depthWrite={false} />
      </mesh>

      {/* Quay platform + cranes on the shore side */}
      <mesh position={[3.8, 0.05, -6.2]} castShadow receiveShadow>
        <cylinderGeometry args={[0.55, 0.62, 0.1, 6]} />
        <meshStandardMaterial color="#cdd5dd" roughness={0.45} metalness={0.25} />
      </mesh>
      <Crane position={[4.05, 0, -7.5]} rotationY={0.5} />
      <Crane position={[4.05, 0, -4.9]} rotationY={-0.4} />

      {commodities.map((c) => {
        const route = ROUTES[c.id];
        const meta = TREND_META[c.direction];
        const active = selected?.kind === "commodity" && selected.id === c.id;
        return (
          <Drift key={c.id} center={route.center} rx={route.rx} rz={route.rz} speed={route.speed} phase={route.phase}>
            <Ship
              position={[0, 0, 0]}
              color={route.color}
              accentColor={meta.hex}
              label={c.name}
              sublabel={`${c.price} · ${meta.label}`}
              active={active}
              onSelect={() => onSelect(c.id)}
            />
          </Drift>
        );
      })}
    </group>
  );
}
