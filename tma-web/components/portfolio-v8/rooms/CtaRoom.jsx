"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { v8Brand } from "@/data/portfolio-v8";

/* Final scene: a kinetic TMA wordmark in 3D plus orbiting accent primitives.
 * The wordmark sits centered and slowly rotates; tiny "+" pieces orbit it.
 */
export default function CtaRoom({ progressRef, isOn }) {
  const group = useRef(null);
  const wordRef = useRef(null);

  const orbitItems = useMemo(() => {
    const list = [];
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2;
      const r = 3.4 + Math.sin(i) * 0.6;
      list.push({
        pos: [Math.cos(a) * r, Math.sin(i * 2.3) * 1.6, Math.sin(a) * r],
        rot: [Math.random() * Math.PI, Math.random() * Math.PI, 0],
        color: [v8Brand.accentCyan, v8Brand.accentMagenta, v8Brand.accentLime, "#ffffff"][i % 4],
        size: 0.12 + Math.random() * 0.18,
      });
    }
    return list;
  }, []);

  useFrame((_, dt) => {
    if (!group.current) return;
    const p = progressRef.current;
    const localP = THREE.MathUtils.clamp((p - 0.85) / 0.15, -0.4, 1.4);
    group.current.position.z = THREE.MathUtils.lerp(10, -1.6, localP);
    group.current.rotation.y += dt * 0.04;
    if (wordRef.current) wordRef.current.rotation.y += dt * 0.12;
    group.current.children.forEach((m, i) => {
      if (i === 0) return;
      m.rotation.x += dt * 0.4;
      m.rotation.y += dt * 0.7;
    });
    group.current.visible = isOn || p > 0.82;
  });

  return (
    <group ref={group}>
      <Text
        ref={wordRef}
        fontSize={1.6}
        color={"#ffffff"}
        anchorX="center"
        anchorY="middle"
        letterSpacing={-0.04}
        outlineWidth={0.014}
        outlineColor={"#0a0a0a"}
      >
        TMA
      </Text>
      {orbitItems.map((it, i) => (
        <mesh key={i} position={it.pos} rotation={it.rot} scale={it.size}>
          <octahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={it.color} emissive={it.color} emissiveIntensity={0.4} metalness={0.6} roughness={0.25} />
        </mesh>
      ))}
    </group>
  );
}
