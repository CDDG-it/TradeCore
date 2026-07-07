"use client";

import * as THREE from "three";
import { shaderMaterial } from "@react-three/drei";
import { extend, type ThreeElement } from "@react-three/fiber";

/** Gentle animated water: vertex ripple + a light/dark colour mix and a soft
 *  sun-glint band, so the harbor reads as water instead of a flat blue plane. */
export const WaterMaterial = shaderMaterial(
  {
    uTime: 0,
    uColorDeep: new THREE.Color("#0a3242"),
    uColorShallow: new THREE.Color("#1e6d86"),
  },
  /* vertex */ `
    uniform float uTime;
    varying float vWave;
    varying vec2 vUv;
    void main() {
      vUv = uv;
      vec3 pos = position;
      // Two crossing wave trains for a less regular, more sea-like surface.
      float wave = sin(pos.x * 1.6 + uTime * 1.1) * 0.045
                 + sin(pos.y * 2.4 - uTime * 0.9) * 0.03
                 + sin((pos.x + pos.y) * 3.1 + uTime * 1.7) * 0.02;
      pos.z += wave;
      vWave = wave;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  /* fragment */ `
    uniform float uTime;
    uniform vec3 uColorDeep;
    uniform vec3 uColorShallow;
    varying float vWave;
    varying vec2 vUv;
    void main() {
      float mixAmt = smoothstep(-0.06, 0.07, vWave);
      vec3 color = mix(uColorDeep, uColorShallow, mixAmt);
      // Moving sparkle highlights that drift across the surface.
      float sparkle = sin(vUv.x * 60.0 + uTime * 2.2) * sin(vUv.y * 48.0 - uTime * 1.8);
      color += smoothstep(0.86, 1.0, sparkle) * 0.5;
      // Crest foam on the tallest wave peaks.
      color = mix(color, vec3(0.92, 0.97, 1.0), smoothstep(0.055, 0.08, vWave) * 0.6);
      gl_FragColor = vec4(color, 0.92);
    }
  `
);

extend({ WaterMaterial });

declare module "@react-three/fiber" {
  interface ThreeElements {
    waterMaterial: ThreeElement<typeof WaterMaterial>;
  }
}
