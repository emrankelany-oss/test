import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { Suspense } from "react";
import * as THREE from "three";

/**
 * Paper-friendly variant of the M monolith — for the /portfolio-v3 hero
 * which sits on a #f4f4f1 paper background. Background is transparent
 * (canvas alpha) so the M composites cleanly over the page. Material is
 * dark graphite so it has contrast against paper; brand pink + cyan rim
 * lights still ride the edges for chromatic sheen.
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
    color: new THREE.Color("#7e8290"),
    metalness: 0.45,
    roughness: 0.32,
    clearcoat: 0.5,
    clearcoatRoughness: 0.25,
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
      {/* Bright neutral ambient — lifts the dark side without flattening */}
      <ambientLight intensity={1.0} color="#c8ccd6" />
      <hemisphereLight args={["#ffffff", "#272b34", 1.4]} />

      {/* KEY — strong white from upper-right kicks the form */}
      <directionalLight
        position={[5, 6, 6]}
        intensity={4.6}
        color="#ffffff"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />

      {/* TMA pink kicker — front-left chromatic sheen */}
      <directionalLight position={[-5, 3, 4]} intensity={3.4} color="#FF98A2" />

      {/* TMA cyan rim — back-left, sapphire glint along the edges */}
      <directionalLight position={[-3, 4, -6]} intensity={3.6} color="#74D1EA" />

      {/* Warm top — gives metal warmth on the apex */}
      <directionalLight position={[0, 8, 0]} intensity={1.8} color="#ffd1a8" />

      {/* Bottom bounce — cool, for separation */}
      <directionalLight position={[0, -3, 4]} intensity={0.9} color="#7a93b5" />

      <MLetter rotation={rotation} />
    </>
  );
}

export const MMonumentPaper: React.FC = () => {
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
          toneMappingExposure: 1.1,
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
