"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars, Grid } from "@react-three/drei";
import * as THREE from "three";

/* =========================================================
   FLIGHT PATH — 5 beats:
   1. Boost down from sky
   2. Land on Stand A
   3. Lift off + tilt horizontal + traverse
   4. Tilt vertical again + descend
   5. Land on Stand B
   ========================================================= */
const STAND_A = [-4.5, 0, 0];
const STAND_B = [4.5, 0, 0];
const PAD_HEIGHT = 0.3;
const ROCKET_HALF = 2.2; // distance from rocket center to engine bell tip

// (t, position[3], rotationZ in radians). Y rotation kept at 0; X kept at 0.
const WAYPOINTS = [
  { t: 0.00, pos: [STAND_A[0] - 1.5, 11, 0], rotZ: 0.18 },          // high & slightly tilted
  { t: 0.10, pos: [STAND_A[0] - 0.4, 7,  0], rotZ: 0.06 },          // straightening
  { t: 0.20, pos: [STAND_A[0],        3.0, 0], rotZ: 0 },           // final approach A
  { t: 0.24, pos: [STAND_A[0],        PAD_HEIGHT + ROCKET_HALF, 0], rotZ: 0 }, // touchdown A
  { t: 0.34, pos: [STAND_A[0],        PAD_HEIGHT + ROCKET_HALF, 0], rotZ: 0 }, // idle on A
  { t: 0.42, pos: [STAND_A[0],        4.5, 0], rotZ: 0 },           // liftoff vertical
  { t: 0.50, pos: [STAND_A[0] + 1.5,  5.5, 0], rotZ: -Math.PI / 2 },// tilted horizontal
  { t: 0.58, pos: [STAND_B[0] - 1.5,  5.5, 0], rotZ: -Math.PI / 2 },// traverse complete
  { t: 0.66, pos: [STAND_B[0],        4.5, 0], rotZ: 0 },           // upright again
  { t: 0.78, pos: [STAND_B[0],        3.0, 0], rotZ: 0 },           // approach B
  { t: 0.88, pos: [STAND_B[0],        PAD_HEIGHT + ROCKET_HALF, 0], rotZ: 0 }, // touchdown B
  { t: 1.00, pos: [STAND_B[0],        PAD_HEIGHT + ROCKET_HALF, 0], rotZ: 0 }, // settled
];

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function sampleWaypoints(t) {
  t = Math.max(0, Math.min(1, t));
  let i = 0;
  for (; i < WAYPOINTS.length - 1; i++) {
    if (t <= WAYPOINTS[i + 1].t) break;
  }
  const a = WAYPOINTS[Math.min(i, WAYPOINTS.length - 1)];
  const b = WAYPOINTS[Math.min(i + 1, WAYPOINTS.length - 1)];
  const span = (b.t - a.t) || 1;
  const local = easeInOut(Math.max(0, Math.min(1, (t - a.t) / span)));
  return {
    pos: [
      a.pos[0] + (b.pos[0] - a.pos[0]) * local,
      a.pos[1] + (b.pos[1] - a.pos[1]) * local,
      a.pos[2] + (b.pos[2] - a.pos[2]) * local,
    ],
    rotZ: a.rotZ + (b.rotZ - a.rotZ) * local,
  };
}

/* =========================================================
   ROCKET — procedural sleek Starship silhouette
   ========================================================= */
function Rocket({ progressRef }) {
  const group = useRef();
  const flameOuter = useRef();
  const flameInner = useRef();
  const enginePlume = useRef();
  const lastProgress = useRef(0);
  const thrust = useRef(0);
  const flicker = useRef(0);

  useFrame((_, dt) => {
    const p = progressRef.current || 0;
    const dp = p - lastProgress.current;
    lastProgress.current = p;
    const clampedDt = Math.max(0.001, Math.min(0.06, dt));

    // velocity in "progress units per second"
    const v = Math.abs(dp / clampedDt);
    // scroll → thrust mapping (saturates fast, decays smoothly)
    const target = Math.min(1, v * 2.6);
    const attack = 14;
    const release = 5;
    const k = target > thrust.current ? attack : release;
    thrust.current += (target - thrust.current) * Math.min(1, clampedDt * k);

    flicker.current += clampedDt * (8 + thrust.current * 22);
    const flickerScale = 1 + Math.sin(flicker.current) * 0.08 * thrust.current;

    // apply transform
    const { pos, rotZ } = sampleWaypoints(p);
    if (group.current) {
      group.current.position.set(pos[0], pos[1], pos[2]);
      group.current.rotation.set(0, 0, rotZ);
    }

    // flames
    const tCurr = thrust.current;
    if (flameOuter.current) {
      flameOuter.current.scale.set(
        0.6 + tCurr * 0.8,
        (0.001 + tCurr * 1.4) * flickerScale,
        0.6 + tCurr * 0.8,
      );
      flameOuter.current.material.opacity = tCurr * 0.85;
    }
    if (flameInner.current) {
      flameInner.current.scale.set(
        0.5 + tCurr * 0.6,
        (0.001 + tCurr * 0.9) * flickerScale,
        0.5 + tCurr * 0.6,
      );
      flameInner.current.material.opacity = tCurr * 1;
    }
    if (enginePlume.current) {
      enginePlume.current.material.opacity = 0.25 + tCurr * 0.75;
      enginePlume.current.material.color.lerpColors(
        new THREE.Color("#ff8a44"),
        new THREE.Color("#9ed8ff"),
        Math.max(0, Math.min(1, tCurr - 0.2)),
      );
    }
  });

  return (
    <group ref={group}>
      {/* Main hull cylinder */}
      <mesh castShadow>
        <cylinderGeometry args={[0.5, 0.5, 3.6, 36]} />
        <meshStandardMaterial
          color="#dadce0"
          metalness={0.95}
          roughness={0.22}
          envMapIntensity={1.4}
        />
      </mesh>

      {/* Nose cone */}
      <mesh position={[0, 2.35, 0]} castShadow>
        <coneGeometry args={[0.5, 1.4, 36]} />
        <meshStandardMaterial
          color="#dadce0"
          metalness={0.95}
          roughness={0.22}
          envMapIntensity={1.4}
        />
      </mesh>

      {/* Nose tip cap (slightly darker for visual interest) */}
      <mesh position={[0, 3.08, 0]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#9aa0a8" metalness={0.9} roughness={0.3} />
      </mesh>

      {/* Window band — emissive */}
      <mesh position={[0, 1.55, 0]}>
        <cylinderGeometry args={[0.508, 0.508, 0.16, 36]} />
        <meshStandardMaterial
          color="#1a1d24"
          emissive="#6ad9ff"
          emissiveIntensity={1.6}
          metalness={0.4}
          roughness={0.5}
          toneMapped={false}
        />
      </mesh>

      {/* Lower hull ring (greeble line) */}
      <mesh position={[0, -1.0, 0]}>
        <cylinderGeometry args={[0.508, 0.508, 0.06, 36]} />
        <meshStandardMaterial color="#7a7d83" metalness={0.85} roughness={0.35} />
      </mesh>

      {/* Aft flaps (2 — port/starboard) */}
      {[1, -1].map((s) => (
        <mesh
          key={`aft-${s}`}
          position={[0.55 * s, -1.35, 0]}
          rotation={[0, 0, (Math.PI / 9) * -s]}
          castShadow
        >
          <boxGeometry args={[0.55, 0.85, 0.06]} />
          <meshStandardMaterial color="#a8abb0" metalness={0.85} roughness={0.3} />
        </mesh>
      ))}

      {/* Forward fins (2 — port/starboard) */}
      {[1, -1].map((s) => (
        <mesh
          key={`fwd-${s}`}
          position={[0.55 * s, 1.55, 0]}
          rotation={[0, 0, (Math.PI / 14) * s]}
          castShadow
        >
          <boxGeometry args={[0.4, 0.55, 0.05]} />
          <meshStandardMaterial color="#a8abb0" metalness={0.85} roughness={0.3} />
        </mesh>
      ))}

      {/* Engine bells (3 across) */}
      {[-0.24, 0, 0.24].map((x, i) => (
        <mesh key={`eng-${i}`} position={[x, -1.95, 0]} rotation={[Math.PI, 0, 0]}>
          <cylinderGeometry args={[0.15, 0.19, 0.32, 18]} />
          <meshStandardMaterial color="#22262c" metalness={0.7} roughness={0.4} />
        </mesh>
      ))}

      {/* Engine plume base — always present, very dim when idle */}
      <mesh ref={enginePlume} position={[0, -2.18, 0]}>
        <sphereGeometry args={[0.32, 18, 18]} />
        <meshBasicMaterial
          color="#ff8a44"
          transparent
          opacity={0.25}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Outer flame cone (orange) */}
      <mesh ref={flameOuter} position={[0, -2.95, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.42, 1.6, 24, 1, true]} />
        <meshBasicMaterial
          color="#ff7a32"
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Inner flame cone (hot core) */}
      <mesh ref={flameInner} position={[0, -2.65, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.22, 1.0, 18, 1, true]} />
        <meshBasicMaterial
          color="#dbeeff"
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

/* =========================================================
   STAND — futuristic dock with double light ring + support arms
   ========================================================= */
function Stand({ position, accent = "#6ad9ff", rim = "#b48bff" }) {
  return (
    <group position={position}>
      {/* base disc */}
      <mesh position={[0, 0.12, 0]} receiveShadow>
        <cylinderGeometry args={[1.7, 1.9, 0.24, 56]} />
        <meshStandardMaterial color="#15181f" metalness={0.65} roughness={0.55} />
      </mesh>

      {/* top deck */}
      <mesh position={[0, 0.25, 0]} receiveShadow>
        <cylinderGeometry args={[1.55, 1.65, 0.06, 56]} />
        <meshStandardMaterial color="#1f242c" metalness={0.8} roughness={0.35} />
      </mesh>

      {/* inner accent ring */}
      <mesh position={[0, 0.29, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.25, 0.04, 16, 80]} />
        <meshStandardMaterial
          color={accent}
          emissive={accent}
          emissiveIntensity={2.6}
          toneMapped={false}
        />
      </mesh>

      {/* outer rim ring */}
      <mesh position={[0, 0.27, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.62, 0.025, 16, 80]} />
        <meshStandardMaterial
          color={rim}
          emissive={rim}
          emissiveIntensity={1.9}
          toneMapped={false}
        />
      </mesh>

      {/* 4 support arms */}
      {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((a, i) => (
        <mesh key={i} position={[Math.cos(a) * 1.45, 0.6, Math.sin(a) * 1.45]}>
          <boxGeometry args={[0.1, 1.0, 0.1]} />
          <meshStandardMaterial color="#3a3d44" metalness={0.85} roughness={0.4} />
        </mesh>
      ))}

      {/* status lights on arms */}
      {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((a, i) => (
        <mesh
          key={`led-${i}`}
          position={[Math.cos(a) * 1.45, 1.05, Math.sin(a) * 1.45]}
        >
          <sphereGeometry args={[0.05, 10, 10]} />
          <meshBasicMaterial color={i % 2 ? "#21d07a" : accent} toneMapped={false} />
        </mesh>
      ))}

      {/* pulsing glow plate beneath */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.4, 48]} />
        <meshBasicMaterial
          color={accent}
          transparent
          opacity={0.18}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

/* =========================================================
   DISTANT PLANET — backdrop motif, parallaxes subtly
   ========================================================= */
function Planet() {
  return (
    <group position={[-28, -8, -48]}>
      <mesh>
        <sphereGeometry args={[14, 48, 48]} />
        <meshStandardMaterial
          color="#3a4e72"
          emissive="#0e1830"
          emissiveIntensity={0.7}
          metalness={0.05}
          roughness={0.85}
        />
      </mesh>
      {/* atmosphere halo */}
      <mesh>
        <sphereGeometry args={[14.6, 48, 48]} />
        <meshBasicMaterial
          color="#7aa8ff"
          transparent
          opacity={0.12}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

/* =========================================================
   CAMERA RIG — gentle horizontal tracking + cinematic sway
   ========================================================= */
function CameraRig({ progressRef }) {
  const swayRef = useRef(0);
  useFrame((state, dt) => {
    const p = progressRef.current || 0;
    const { pos } = sampleWaypoints(p);
    swayRef.current += dt;

    const targetX = pos[0] * 0.55;
    const targetY = 3.6 + pos[1] * 0.12 + Math.sin(swayRef.current * 0.6) * 0.1;
    state.camera.position.x += (targetX - state.camera.position.x) * 0.05;
    state.camera.position.y += (targetY - state.camera.position.y) * 0.05;
    state.camera.lookAt(pos[0] * 0.45, Math.max(1.8, pos[1] * 0.55 + 1.5), 0);
  });
  return null;
}

/* =========================================================
   SCENE root
   ========================================================= */
export default function Scene({ progressRef }) {
  const standA = useMemo(() => STAND_A, []);
  const standB = useMemo(() => STAND_B, []);

  return (
    <Canvas
      shadows
      camera={{ position: [0, 4, 14], fov: 50, near: 0.1, far: 200 }}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      dpr={[1, 1.75]}
    >
      <color attach="background" args={["#04060a"]} />
      <fog attach="fog" args={["#04060a", 22, 80]} />

      {/* lighting */}
      <ambientLight intensity={0.28} color="#9bb4ff" />
      <directionalLight
        position={[6, 12, 6]}
        intensity={1.35}
        color="#b9d2ff"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.5}
        shadow-camera-far={50}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
      />
      <pointLight position={[-6, 3, 6]} intensity={1.0} color="#b48bff" distance={28} />
      <pointLight position={[8, 3, 6]} intensity={1.0} color="#6ad9ff" distance={28} />
      <pointLight position={[0, 8, 4]} intensity={0.45} color="#ffd6a8" distance={18} />

      {/* deep space backdrop */}
      <Stars
        radius={140}
        depth={70}
        count={4500}
        factor={4.2}
        saturation={0}
        fade
        speed={0.35}
      />
      <Planet />

      {/* holographic grid floor (futuristic touch) */}
      <Grid
        position={[0, 0, 0]}
        args={[60, 60]}
        cellSize={0.5}
        cellThickness={0.55}
        cellColor="#1a3050"
        sectionSize={3}
        sectionThickness={1.2}
        sectionColor="#6ad9ff"
        fadeDistance={32}
        fadeStrength={1.1}
        followCamera={false}
        infiniteGrid
      />

      {/* dual stands */}
      <Stand position={standA} accent="#6ad9ff" rim="#b48bff" />
      <Stand position={standB} accent="#b48bff" rim="#6ad9ff" />

      {/* the booster */}
      <Rocket progressRef={progressRef} />

      <CameraRig progressRef={progressRef} />
    </Canvas>
  );
}
