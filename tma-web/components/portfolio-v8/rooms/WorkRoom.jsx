"use client";

import { useMemo, useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { v8Projects } from "@/data/portfolio-v8";

/* 6 floating tiles arranged in a soft S-curve through space, drifting past the camera
 * as the user scrolls. Each tile is a textured plane with subtle hover/tilt — we don't
 * have depth maps yet, so the parallax is approximated via shader rim + tilt-toward-cursor.
 */
const POSITIONS = [
  [-2.6, +0.9, -1.0],
  [+2.5, +0.4, -2.2],
  [-2.0, -0.9, -3.5],
  [+2.2, +1.1, -4.6],
  [-2.4, +0.0, -5.8],
  [+2.7, -0.8, -7.1],
];

function Tile({ project, index, progressRef }) {
  const mesh = useRef(null);
  const matRef = useRef(null);
  const tex = useLoader(THREE.TextureLoader, project.image);

  useMemo(() => {
    if (tex) {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
    }
  }, [tex]);

  useFrame((state, dt) => {
    if (!mesh.current) return;
    const p = progressRef.current;
    // localP is [0..1] across the work room (0.40 → 0.65)
    const localP = THREE.MathUtils.clamp((p - 0.40) / 0.25, -0.4, 1.4);
    const base = POSITIONS[index];
    // pieces slide from far-Z toward camera with stagger
    const stagger = index * 0.12;
    const offset = (localP - stagger) * 8.0;
    mesh.current.position.set(base[0], base[1], base[2] + offset);

    // tilt toward mouse
    const mx = state.mouse.x;
    const my = state.mouse.y;
    mesh.current.rotation.y = THREE.MathUtils.lerp(mesh.current.rotation.y, mx * 0.18, 0.06);
    mesh.current.rotation.x = THREE.MathUtils.lerp(mesh.current.rotation.x, -my * 0.18, 0.06);

    // visibility envelope
    const visible = p > 0.36 && p < 0.7;
    mesh.current.visible = visible;
  });

  return (
    <mesh ref={mesh} visible={false}>
      <planeGeometry args={[2.6, 1.5, 1, 1]} />
      <meshStandardMaterial
        ref={matRef}
        map={tex}
        roughness={0.55}
        metalness={0.05}
        emissive={new THREE.Color(project.accent)}
        emissiveIntensity={0.08}
      />
    </mesh>
  );
}

export default function WorkRoom({ progressRef, isOn }) {
  const group = useRef(null);

  useFrame(() => {
    if (!group.current) return;
    const p = progressRef.current;
    group.current.visible = isOn || (p > 0.36 && p < 0.7);
  });

  return (
    <group ref={group}>
      {v8Projects.map((proj, i) => (
        <Tile key={proj.slug} project={proj} index={i} progressRef={progressRef} />
      ))}
    </group>
  );
}
