"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { v8Services, v8Brand } from "@/data/portfolio-v8";

/* Eight service cards arranged in a ring rotating around Y.
 * Scroll progress rotates the ring; the card closest to the camera highlights.
 */
export default function ServicesRoom({ progressRef, isOn }) {
  const group = useRef(null);

  const radius = 4.2;
  const items = useMemo(() => {
    return v8Services.map((s, i) => ({
      ...s,
      angle: (i / v8Services.length) * Math.PI * 2,
    }));
  }, []);

  useFrame((_, dt) => {
    if (!group.current) return;
    const p = progressRef.current;
    const localP = THREE.MathUtils.clamp((p - 0.65) / 0.2, -0.4, 1.4);

    group.current.position.z = THREE.MathUtils.lerp(8, -2, localP);
    group.current.rotation.y += dt * 0.08 + localP * 0.02;
    // base rotation tied to progress
    const baseRot = localP * Math.PI * 1.6;
    group.current.rotation.y = baseRot + performance.now() * 0.00006;

    group.current.visible = isOn || (p > 0.62 && p < 0.88);
  });

  return (
    <group ref={group}>
      {items.map((it, i) => (
        <group
          key={it.n}
          position={[Math.sin(it.angle) * radius, (i % 2 === 0 ? 0.4 : -0.4), Math.cos(it.angle) * radius]}
          rotation={[0, it.angle + Math.PI, 0]}
        >
          {/* card backplate */}
          <mesh>
            <planeGeometry args={[2.6, 1.5]} />
            <meshStandardMaterial color="#0c0c0c" roughness={0.7} metalness={0.1} side={THREE.DoubleSide} />
          </mesh>
          {/* number */}
          <Text
            position={[-1.0, 0.4, 0.01]}
            fontSize={0.32}
            color={v8Brand.accentCyan}
            anchorX="left"
            anchorY="middle"
            letterSpacing={0.1}
          >
            {it.n}
          </Text>
          {/* title */}
          <Text
            position={[-1.0, 0.05, 0.01]}
            fontSize={0.20}
            color="#ffffff"
            anchorX="left"
            anchorY="middle"
            maxWidth={2.3}
            lineHeight={1.05}
            letterSpacing={-0.01}
            fontWeight={500}
          >
            {it.title}
          </Text>
          {/* divider */}
          <mesh position={[0, -0.18, 0.01]}>
            <planeGeometry args={[2.2, 0.005]} />
            <meshBasicMaterial color="#333" />
          </mesh>
          {/* line copy */}
          <Text
            position={[-1.0, -0.42, 0.01]}
            fontSize={0.10}
            color="#9b9b9b"
            anchorX="left"
            anchorY="middle"
            maxWidth={2.3}
            lineHeight={1.4}
            letterSpacing={0.01}
          >
            {it.line}
          </Text>
        </group>
      ))}
    </group>
  );
}
