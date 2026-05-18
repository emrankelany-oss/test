"use client";
import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { EXPLOSION_RANGE } from "../engine/frameSequence.js";

const COUNT = 1800;
const [BAND_LO, BAND_HI] = EXPLOSION_RANGE;

function Debris({ progressRef }) {
  const pointsRef = useRef(null);

  const { positions, radii } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const radii = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      const r = 1.2 + Math.random() * 5.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      radii[i] = r;
    }
    return { positions, radii };
  }, []);

  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions.slice(), 3));
    return g;
  }, [positions]);

  useFrame((_state, delta) => {
    const pts = pointsRef.current;
    if (!pts) return;
    const p = progressRef.current || 0;
    // explosion band → 0..1 push factor (ramps in, decays out)
    const band =
      p <= BAND_LO || p >= BAND_HI
        ? 0
        : 1 - Math.abs((p - (BAND_LO + BAND_HI) / 2) / ((BAND_HI - BAND_LO) / 2));
    const push = 1 + band * 0.9;
    const arr = pts.geometry.attributes.position.array;
    for (let i = 0; i < COUNT; i++) {
      const baseR = radii[i];
      const k = (baseR * push) / baseR;
      arr[i * 3] = positions[i * 3] * k;
      arr[i * 3 + 1] = positions[i * 3 + 1] * k;
      arr[i * 3 + 2] = positions[i * 3 + 2] * k;
    }
    pts.geometry.attributes.position.needsUpdate = true;
    pts.rotation.y += delta * 0.04;
    const mat = pts.material;
    mat.opacity = 0.18 + p * 0.22 + band * 0.5;
    mat.size = 0.018 + band * 0.03;
  });

  return (
    <points ref={pointsRef} geometry={geom}>
      <pointsMaterial
        color={"#5aa6ff"}
        size={0.02}
        sizeAttenuation
        transparent
        opacity={0.2}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// Transparent r3f overlay. progressRef is the live scroll progress (0..1).
export default function ParticleField({ progressRef }) {
  return (
    <div
      aria-hidden
      data-v16-particles
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
    >
      <Canvas
        gl={{ alpha: true, antialias: true }}
        camera={{ position: [0, 0, 9], fov: 55 }}
        style={{ background: "transparent" }}
      >
        <Debris progressRef={progressRef} />
      </Canvas>
    </div>
  );
}
