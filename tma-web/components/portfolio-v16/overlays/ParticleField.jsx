"use client";
import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { EXPLOSION_RANGE } from "../engine/frameSequence.js";

const COUNT = 1800;
const [BAND_LO, BAND_HI] = EXPLOSION_RANGE;

function Debris({ progressRef }) {
  const pointsRef = useRef(null);
  const lastPushRef = useRef(null);

  // Rest-state spherical distribution. This stays the reference the per-frame
  // push scales from; positions.slice() below gives the geometry its own buffer.
  const positions = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      const r = 1.2 + Math.random() * 5.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    return positions;
  }, []);

  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions.slice(), 3));
    return g;
  }, [positions]);

  // r3f@9 does not auto-dispose a geometry passed via the `geometry` prop
  // (only reconciler-owned JSX nodes are disposed). Dispose it explicitly.
  useEffect(() => () => geom.dispose(), [geom]);

  useFrame((_state, delta) => {
    const pts = pointsRef.current;
    if (!pts) return;
    const p = progressRef.current || 0; // || 0 also coerces a stray NaN to 0
    // explosion band → 0..1 push factor (ramps in, decays out)
    const band =
      p <= BAND_LO || p >= BAND_HI
        ? 0
        : 1 - Math.abs((p - (BAND_LO + BAND_HI) / 2) / ((BAND_HI - BAND_LO) / 2));
    const push = 1 + band * 0.9;

    pts.rotation.y += delta * 0.04;
    // pointsMaterial scalar fields (opacity/size) are re-uploaded by three on
    // each rendered frame for a single-material scene; no needsUpdate required.
    const mat = pts.material;
    mat.opacity = 0.18 + p * 0.22 + band * 0.5;
    mat.size = 0.018 + band * 0.03;

    // Positions only move when push changes — skip the full rewrite + VBO
    // re-upload while the hero is idle/pinned (push stays 1).
    if (push === lastPushRef.current) return;
    lastPushRef.current = push;
    const arr = pts.geometry.attributes.position.array;
    for (let i = 0; i < COUNT; i++) {
      arr[i * 3] = positions[i * 3] * push;
      arr[i * 3 + 1] = positions[i * 3 + 1] * push;
      arr[i * 3 + 2] = positions[i * 3 + 2] * push;
    }
    pts.geometry.attributes.position.needsUpdate = true;
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
        gl={{ alpha: true, antialias: false }}
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 9], fov: 55 }}
        style={{ background: "transparent" }}
      >
        <Debris progressRef={progressRef} />
      </Canvas>
    </div>
  );
}
