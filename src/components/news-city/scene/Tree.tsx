"use client";

/** A simple low-poly tree: a trunk plus two stacked foliage cones. Cheap
 *  enough to scatter dozens across the parks between districts. */
export function Tree({
  position,
  scale = 1,
  tone = "#4f8f4a",
}: {
  position: [number, number, number];
  scale?: number;
  tone?: string;
}) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.22, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 0.44, 6]} />
        <meshStandardMaterial color="#6b4d2f" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.62, 0]} castShadow>
        <coneGeometry args={[0.34, 0.6, 8]} />
        <meshStandardMaterial color={tone} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.98, 0]} castShadow>
        <coneGeometry args={[0.24, 0.44, 8]} />
        <meshStandardMaterial color={tone} roughness={0.8} />
      </mesh>
    </group>
  );
}
