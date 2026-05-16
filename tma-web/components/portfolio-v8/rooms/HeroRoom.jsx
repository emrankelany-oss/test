"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { v8Brand } from "@/data/portfolio-v8";

/* Cluster of extruded plus + arc + dot primitives, slowly tumbling.
 * Scroll velocity drives extra angular impulse; idle = slow spin.
 * Lusion-style: the world has weight.
 */
// Bright accents only — no near-black pieces (those just disappeared into the bg).
const COLORS = [v8Brand.accentWhite, v8Brand.accentCyan, v8Brand.accentMagenta, v8Brand.accentLime];

function makePlusShape() {
  const s = new THREE.Shape();
  const arm = 0.36, w = 0.13;
  s.moveTo(-w, -arm);
  s.lineTo(w, -arm);
  s.lineTo(w, -w);
  s.lineTo(arm, -w);
  s.lineTo(arm, w);
  s.lineTo(w, w);
  s.lineTo(w, arm);
  s.lineTo(-w, arm);
  s.lineTo(-w, w);
  s.lineTo(-arm, w);
  s.lineTo(-arm, -w);
  s.lineTo(-w, -w);
  s.lineTo(-w, -arm);
  return s;
}

function makeArcShape() {
  const s = new THREE.Shape();
  const r = 0.42, t = 0.13;
  s.absarc(0, 0, r, 0, Math.PI, false);
  s.lineTo(-r + t, 0);
  s.absarc(0, 0, r - t, Math.PI, 0, true);
  s.lineTo(r, 0);
  return s;
}

export default function HeroRoom({ progressRef, isOn }) {
  const group = useRef(null);
  const prevP = useRef(0);

  // 30 floating pieces, larger, brighter, kept tight in the camera frame.
  const pieces = useMemo(() => {
    const list = [];
    const RNG = mulberry32(7);
    const kinds = ["plus", "arc", "dot"];
    for (let i = 0; i < 30; i++) {
      const kind = kinds[Math.floor(RNG() * kinds.length)];
      list.push({
        kind,
        pos: [
          (RNG() - 0.5) * 5.0,
          (RNG() - 0.5) * 3.4,
          (RNG() - 0.5) * 3.0,
        ],
        rot: [RNG() * Math.PI, RNG() * Math.PI, RNG() * Math.PI],
        scale: 0.9 + RNG() * 1.1,
        color: COLORS[Math.floor(RNG() * COLORS.length)],
        spin: [
          (RNG() - 0.5) * 0.5,
          (RNG() - 0.5) * 0.5,
          (RNG() - 0.5) * 0.3,
        ],
        phase: RNG() * Math.PI * 2,
      });
    }
    return list;
  }, []);

  const plusGeom = useMemo(() => new THREE.ExtrudeGeometry(makePlusShape(), { depth: 0.16, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 2 }), []);
  const arcGeom  = useMemo(() => new THREE.ExtrudeGeometry(makeArcShape(),  { depth: 0.12, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 2 }), []);
  const dotGeom  = useMemo(() => new THREE.SphereGeometry(0.18, 24, 24), []);

  useFrame((_, dt) => {
    if (!group.current) return;
    const p = progressRef.current;            // 0..1 global progress
    const localP = THREE.MathUtils.clamp(p / 0.2, 0, 1);  // 0..1 inside hero room
    const v = (p - prevP.current) / Math.max(dt, 0.0001); // scroll velocity
    prevP.current = p;

    group.current.position.z = THREE.MathUtils.lerp(0, -8, localP);
    group.current.position.y = THREE.MathUtils.lerp(0, 1.4, localP);
    group.current.rotation.y += dt * 0.05 + v * 1.2;
    group.current.rotation.x += dt * 0.02 + v * 0.6;

    // bobbing per piece
    group.current.children.forEach((m, i) => {
      const piece = pieces[i];
      if (!piece) return;
      m.rotation.x += piece.spin[0] * dt + v * 2;
      m.rotation.y += piece.spin[1] * dt + v * 1.5;
      m.rotation.z += piece.spin[2] * dt;
      const t = performance.now() * 0.0006;
      m.position.y = piece.pos[1] + Math.sin(t + piece.phase) * 0.12;
    });

    // fade out as scroll exits hero room
    group.current.visible = localP < 1.05;
    group.current.scale.setScalar(1 - localP * 0.15);
  });

  return (
    <group ref={group}>
      {pieces.map((p, i) => {
        const geom = p.kind === "plus" ? plusGeom : p.kind === "arc" ? arcGeom : dotGeom;
        return (
          <mesh
            key={i}
            geometry={geom}
            position={p.pos}
            rotation={p.rot}
            scale={p.scale}
          >
            <meshStandardMaterial
              color={p.color}
              metalness={0.55}
              roughness={0.25}
              emissive={p.color}
              emissiveIntensity={0.18}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function mulberry32(seed) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
