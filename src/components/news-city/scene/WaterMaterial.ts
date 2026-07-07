"use client";

import * as THREE from "three";
import { shaderMaterial } from "@react-three/drei";
import { extend, type ThreeElement } from "@react-three/fiber";

/** Gentle animated water: vertex ripple + a light/dark colour mix and a soft
 *  sun-glint band, so the harbor reads as water instead of a flat blue plane. */
export const WaterMaterial = shaderMaterial(
  {
    uTime: 0,
    uColorDeep: new THREE.Color("#3a92ad"),
    uColorShallow: new THREE.Color("#9fe0ec"),
  },
  /* vertex */ `
    uniform float uTime;
    varying float vWave;
    void main() {
      vec3 pos = position;
      float wave = sin(pos.x * 1.5 + uTime * 1.1) * 0.045
                 + sin(pos.y * 2.3 - uTime * 0.9) * 0.03;
      pos.z += wave;
      vWave = wave;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  /* fragment */ `
    uniform vec3 uColorDeep;
    uniform vec3 uColorShallow;
    varying float vWave;
    void main() {
      float mixAmt = smoothstep(-0.05, 0.06, vWave);
      vec3 color = mix(uColorDeep, uColorShallow, mixAmt);
      float glint = smoothstep(0.035, 0.06, vWave);
      color += glint * 0.35;
      gl_FragColor = vec4(color, 0.9);
    }
  `
);

extend({ WaterMaterial });

declare module "@react-three/fiber" {
  interface ThreeElements {
    waterMaterial: ThreeElement<typeof WaterMaterial>;
  }
}
