import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { Suspense } from "react";
import * as THREE from "three";

/**
 * Dark-bg variant of the M monolith — for the /portfolio-v3 hero
 * which sits on a black (#000) page matching V1, V2, and the home
 * hero. Background is transparent so we composite over the page; the
 * material is luminous off-white so the M reads bright against black.
 * Brand pink + cyan rim lights ride the edges for chromatic sheen.
 *
 * 180 frames @ 30fps = one full 360° rotation, scroll-scrubbable.
 */

function MLetter({ rotation }: { rotation: number }) {
  const stroke = 0.7;
  const height = 4.5;
  const halfW = 1.6;
  const depth = 2.0;
  const diagLen = Math.hypot(halfW, height) * 0.65;
  const diagAngle = Math.atan2(halfW, height * 0.65);

  const material = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#e8e4dc"),
    metalness: 0.55,
    roughness: 0.30,
    clearcoat: 0.4,
    clearcoatRoughness: 0.28,
    envMapIntensity: 0,
  });

  return (
    <group rotation={[0, rotation, 0]} position={[0, 0, 0]}>
      <mesh position={[-halfW, 0, 0]} material={material} castShadow receiveShadow>
        <boxGeometry args={[stroke, height, depth]} />
      </mesh>
      <mesh position={[halfW, 0, 0]} material={material} castShadow receiveShadow>
        <boxGeometry args={[stroke, height, depth]} />
      </mesh>
      <mesh
        position={[-halfW * 0.5, 0, 0]}
        rotation={[0, 0, diagAngle]}
        material={material}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[stroke, diagLen, depth]} />
      </mesh>
      <mesh
        position={[halfW * 0.5, 0, 0]}
        rotation={[0, 0, -diagAngle]}
        material={material}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[stroke, diagLen, depth]} />
      </mesh>
    </group>
  );
}

function Scene({ rotation }: { rotation: number }) {
  return (
    <>
      {/* Soft warm fill so shadows don't crush to pure black */}
      <ambientLight intensity={0.7} color="#5a4870" />
      <hemisphereLight args={["#ffd1c8", "#1a0f24", 0.95]} />

      {/* KEY — bright white from upper-right, strong */}
      <directionalLight
        position={[4, 5, 6]}
        intensity={3.4}
        color="#ffffff"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />

      {/* TMA pink kicker — front-left chromatic sheen */}
      <directionalLight position={[-5, 3, 4]} intensity={2.3} color="#FF98A2" />

      {/* TMA cyan rim — back-left, sapphire glint along the edges */}
      <directionalLight position={[-3, 4, -6]} intensity={2.5} color="#74D1EA" />

      {/* Warm top — keeps the apex lit */}
      <directionalLight position={[0, 8, 0]} intensity={1.3} color="#ffd1a8" />

      {/* Subtle bottom bounce */}
      <directionalLight position={[0, -3, 4]} intensity={0.55} color="#6080a0" />

      <MLetter rotation={rotation} />
    </>
  );
}

export const MMonumentDark: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();

  const rotation = interpolate(
    frame,
    [0, durationInFrames],
    [Math.PI / 6, Math.PI / 6 + Math.PI * 2]
  );

  return (
    <AbsoluteFill style={{ background: "transparent" }}>
      <ThreeCanvas
        width={width}
        height={height}
        camera={{ position: [0, 1.6, 8.5], fov: 35 }}
        shadows
        gl={{
          antialias: true,
          alpha: true,
          toneMapping: THREE.NeutralToneMapping,
          toneMappingExposure: 1.15,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
      >
        <Suspense fallback={null}>
          <Scene rotation={rotation} />
        </Suspense>
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
