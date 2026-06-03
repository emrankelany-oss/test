import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { Suspense } from "react";
import * as THREE from "three";

/**
 * The 'M' monolith — cinematic 3D sculpture for the TMA portfolio hero.
 * 180 frames @ 30fps = one full 360° rotation.
 *
 * Lighting strategy: Environment preset (sunset) provides physically-based
 * IBL that makes metallic materials read instantly; explicit point lights
 * add pink + cyan rim accents matching TMA's brand.
 */

function MLetter({ rotation }: { rotation: number }) {
  const stroke = 0.7;
  const height = 4.5;
  const halfW = 1.6;
  // depth >= stroke so the M reads as a chunky 3D sculpture from any angle,
  // including edge-on. Previously 0.7 → looked like a flat sign that
  // disappeared at 90° rotations.
  const depth = 2.0;
  const diagLen = Math.hypot(halfW, height) * 0.65;
  const diagAngle = Math.atan2(halfW, height * 0.65);

  // No envmap (we removed drei's Environment because its CDN-loaded HDR
  // wasn't ready by frame 1). Lean on direct lights only.
  const material = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#e8e4dc"),
    metalness: 0.55,
    roughness: 0.32,
    clearcoat: 0.4,
    clearcoatRoughness: 0.3,
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
      {/* Studio 5-light setup. No Environment IBL (would async-load HDR and
          empty the first frames). All lighting is direct + immediate. */}

      {/* Soft fill so shadows aren't black */}
      <ambientLight intensity={0.85} color="#5a4870" />
      <hemisphereLight args={["#ffd1c8", "#1a0f24", 1.1]} />

      {/* KEY — bright front-right white, strong */}
      <directionalLight
        position={[4, 5, 6]}
        intensity={3.6}
        color="#ffffff"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />

      {/* Pink kicker — front-left, TMA accent */}
      <directionalLight
        position={[-5, 3, 4]}
        intensity={2.4}
        color="#FF98A2"
      />

      {/* Cyan rim — back-left to create the metallic-edge sheen */}
      <directionalLight
        position={[-3, 4, -6]}
        intensity={2.6}
        color="#74D1EA"
      />

      {/* Warm top kicker — keeps the top of the M lit */}
      <directionalLight
        position={[0, 8, 0]}
        intensity={1.4}
        color="#ffd1a8"
      />

      {/* Subtle bottom bounce for separation from floor */}
      <directionalLight
        position={[0, -3, 4]}
        intensity={0.6}
        color="#6080a0"
      />

      <MLetter rotation={rotation} />

      {/* Floor — soft reflective catcher */}
      <mesh position={[0, -2.9, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#0a0a0a" metalness={0.3} roughness={0.5} />
      </mesh>

      <fog attach="fog" args={["#000000", 10, 28]} />
    </>
  );
}

export const MMonument: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();

  // Start at a 3/4 view (already cinematic), do one full turn so user sees
  // every facet.
  const rotation = interpolate(
    frame,
    [0, durationInFrames],
    [Math.PI / 6, Math.PI / 6 + Math.PI * 2]
  );
  const camY = interpolate(
    frame,
    [0, durationInFrames / 2, durationInFrames],
    [1.4, 1.9, 1.4]
  );

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {/* Background — moody purple haze behind the subject */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 80% 70% at 50% 50%, rgba(140,70,180,0.35) 0%, rgba(40,15,55,0.55) 35%, rgba(8,4,12,0.85) 75%, #000 100%)",
        }}
      />

      <ThreeCanvas
        width={width}
        height={height}
        camera={{ position: [0, 1.6, 8.5], fov: 35 }}
        shadows
        gl={{
          antialias: true,
          toneMapping: THREE.NeutralToneMapping,
          toneMappingExposure: 1.15,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
      >
        <Suspense fallback={null}>
          <Scene rotation={rotation} />
        </Suspense>
      </ThreeCanvas>

      {/* Subtle film-grain overlay */}
      <AbsoluteFill
        style={{
          backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.4 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`,
          opacity: 0.07,
          mixBlendMode: "overlay",
          pointerEvents: "none",
        }}
      />

      {/* Bottom vignette */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, transparent 55%, rgba(0,0,0,0.6) 100%)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
