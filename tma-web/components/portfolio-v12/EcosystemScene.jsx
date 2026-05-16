"use client";

import { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Billboard } from "@react-three/drei/core/Billboard.js";
import { Html } from "@react-three/drei/web/Html.js";
import { services } from "@/data/portfolio-v12.js";

function Node({ angle, radius, label, desc, onPick }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * 0.15 + angle;
    ref.current.position.set(Math.cos(t) * radius, Math.sin(t * 0.6) * 1.2, Math.sin(t) * radius);
  });
  return (
    <group ref={ref}>
      <mesh onPointerOver={() => onPick({ label, desc })} onPointerOut={() => onPick(null)}>
        <sphereGeometry args={[0.16, 24, 24]} />
        <meshBasicMaterial color="#2e6bff" />
      </mesh>
      <Billboard>
        <Html
          center
          distanceFactor={6}
          style={{ pointerEvents: "none", whiteSpace: "nowrap" }}
        >
          <span
            style={{
              color: "#f4f5f7",
              fontSize: "12px",
              fontFamily: "system-ui, sans-serif",
              textShadow: "0 1px 4px rgba(0,0,0,0.8)",
              userSelect: "none",
            }}
          >
            {label}
          </span>
        </Html>
      </Billboard>
    </group>
  );
}

export default function EcosystemScene() {
  const [pick, setPick] = useState(null);
  return (
    <>
      <Canvas camera={{ position: [0, 0, 7], fov: 50 }} dpr={[1, 1.5]} frameloop="always">
        <ambientLight intensity={1} />
        <mesh>
          <sphereGeometry args={[0.5, 32, 32]} />
          <meshBasicMaterial color="#ff6a1a" />
        </mesh>
        {services.map((s, i) => (
          <Node
            key={s.name}
            angle={(i / services.length) * Math.PI * 2}
            radius={3.4}
            label={s.name}
            desc={s.desc}
            onPick={setPick}
          />
        ))}
      </Canvas>
      <div
        aria-live="polite"
        style={{
          position: "absolute", left: "6vw", bottom: "8vh", maxWidth: "34ch",
          color: "var(--v12-silver)", minHeight: "4.5rem",
        }}
      >
        {pick ? (
          <>
            <strong style={{ color: "var(--v12-white)" }}>{pick.label}</strong>
            <p style={{ margin: ".4rem 0 0" }}>{pick.desc}</p>
          </>
        ) : (
          <span>Hover a node to explore the ecosystem.</span>
        )}
      </div>
    </>
  );
}
