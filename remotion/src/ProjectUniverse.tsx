import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { Suspense } from "react";
import * as THREE from "three";
import { ASSET_MANIFEST } from "./universe/assetManifest.js";
import { buildPanelField } from "./universe/panelLayout.js";
import { cameraForFrame } from "./universe/cameraArc.js";
import { useUniverseTexture } from "./universe/loadTexture.js";

const FIELD = buildPanelField(ASSET_MANIFEST);

function Panel({ panel, frame }: { panel: any; frame: number }) {
  const tex = useUniverseTexture(panel.file);
  const sway = Math.sin((frame + panel.position[2]) * 0.01) * panel.drift;
  const [x, y, z] = panel.position;
  if (panel.kind === "hero") {
    const h = 2.2 * panel.scale;
    const w = 3.9 * panel.scale;
    return (
      <mesh position={[x, y + sway, z]} rotation={panel.rotation}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={tex ?? undefined} toneMapped={false}
          color={tex ? "#ffffff" : "#1a1530"} />
      </mesh>
    );
  }
  // logo: dark brand card + logo plane just in front + faint rim glow
  const s = panel.scale;
  return (
    <group position={[x, y + sway, z]} rotation={panel.rotation}>
      <mesh position={[0, 0, -0.06]}>
        <planeGeometry args={[s * 2.1, s * 1.35]} />
        <meshStandardMaterial color="#120e1f" emissive="#3a1d5a"
          emissiveIntensity={0.35} roughness={0.7} metalness={0.1} />
      </mesh>
      <mesh>
        <planeGeometry args={[s * 1.7, s * 1.0]} />
        <meshBasicMaterial map={tex ?? undefined} transparent
          opacity={tex ? 1 : 0} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Particles() {
  const geo = new THREE.BufferGeometry();
  const N = 600;
  const pos = new Float32Array(N * 3);
  let s = 999983;
  const r = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < N; i++) {
    pos[i * 3] = (r() - 0.5) * 60;
    pos[i * 3 + 1] = (r() - 0.5) * 40;
    pos[i * 3 + 2] = 8 - r() * 75;
  }
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  return (
    <points geometry={geo}>
      <pointsMaterial size={0.06} color="#9a7bd0" transparent opacity={0.55} />
    </points>
  );
}

function Scene({ frame, duration }: { frame: number; duration: number }) {
  const cam = cameraForFrame(frame, duration);
  return (
    <>
      <perspectiveCamera
        position={cam.position as any}
        fov={cam.fov}
        onUpdate={(c: THREE.PerspectiveCamera) => {
          c.lookAt(cam.lookAt[0], cam.lookAt[1], cam.lookAt[2]);
          c.updateProjectionMatrix();
        }}
      />
      <ambientLight intensity={0.45} />
      <pointLight position={[12, 8, 6]} intensity={120} color="#ff5cae" />
      <pointLight position={[-12, -4, -10]} intensity={140} color="#3fd0ff" />
      <Particles />
      {FIELD.map((p) => (
        <Panel key={p.id} panel={p} frame={frame} />
      ))}
    </>
  );
}

export const ProjectUniverse = () => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 90% 80% at 50% 45%, rgba(120,60,170,0.30) 0%, rgba(30,12,45,0.55) 40%, #000 80%)",
        }}
      />
      <ThreeCanvas
        width={width}
        height={height}
        gl={{
          antialias: true,
          toneMapping: THREE.NeutralToneMapping,
          toneMappingExposure: 1.1,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
      >
        <Suspense fallback={null}>
          <Scene frame={frame} duration={durationInFrames} />
        </Suspense>
      </ThreeCanvas>
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, transparent 60%, rgba(0,0,0,0.55) 100%)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
