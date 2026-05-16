"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { v8Stats, v8Brand } from "@/data/portfolio-v8";

/* 4 oversized numerals in a slow vertical drift, lit by accent rim lights.
 * Visible in [0.20, 0.40] of global progress.
 */
const COLORS = [v8Brand.accentCyan, v8Brand.accentMagenta, v8Brand.accentLime, v8Brand.accentWhite];

export default function StatsRoom({ progressRef, isOn }) {
  const group = useRef(null);

  const items = useMemo(() => {
    return v8Stats.map((s, i) => ({
      ...s,
      color: COLORS[i % COLORS.length],
      pos: [
        -3.6 + i * 2.4 + (i % 2 === 0 ? -0.4 : 0.2),
        i % 2 === 0 ? 0.8 : -0.6,
        -2.4 + ((i % 2) === 0 ? -0.6 : 0.4),
      ],
      phase: i * 0.7,
    }));
  }, []);

  useFrame((_, dt) => {
    if (!group.current) return;
    const p = progressRef.current;
    const localP = THREE.MathUtils.clamp((p - 0.20) / 0.2, -0.4, 1.4);
    group.current.position.z = THREE.MathUtils.lerp(8, -6, localP);
    group.current.children.forEach((m, i) => {
      const it = items[i];
      if (!it) return;
      m.position.y = it.pos[1] + Math.sin(performance.now() * 0.0008 + it.phase) * 0.18;
      m.rotation.y += dt * 0.25;
    });
    group.current.visible = isOn || (p > 0.16 && p < 0.46);
  });

  return (
    <group ref={group}>
      {items.map((it, i) => (
        <group key={i} position={it.pos}>
          <Text
            fontSize={1.6}
            color={it.color}
            anchorX="center"
            anchorY="middle"
            letterSpacing={-0.04}
            outlineWidth={0.012}
            outlineColor="#0a0a0a"
          >
            {it.value}
          </Text>
          <Text
            position={[0, -1.0, 0]}
            fontSize={0.18}
            color="#fff"
            anchorX="center"
            anchorY="middle"
            letterSpacing={0.12}
          >
            {it.label.toUpperCase()}
          </Text>
        </group>
      ))}
    </group>
  );
}
