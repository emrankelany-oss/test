"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * "Floating Motion Engine" — v2 of the cinematic R3F scene.
 *
 * Composition (clarity-focused rebuild):
 *   - Small dark-chrome energy core (punctuation, not focal)
 *   - 3 emissive timeline rings
 *   - 5 LARGE film-frame panels (the heroic element). Each frame is a
 *     smoked-glass plane with a runtime canvas-texture overlay drawing
 *     timeline scrubs, sprocket dots and a frame-index label so the
 *     plates read as actual cinematic frames.
 *   - 2 emissive motion-path curves
 *   - Atmospheric particles
 *
 * Motion:
 *   - Default: linear diagonal from top-right (hero) to bottom-left
 *     (end of work section). Engine never fades — opacity stays 1.
 *   - During work section: `motionState.workActive = true` and
 *     `motionState.rowSide` (−1 / +1) overrides the x target so the
 *     engine alternates sides per card row.
 *
 * The motionState object is exported so V3WorkAlternating can write
 * `workActive` and `rowSide` on scroll without going through React.
 */

export const motionState = {
  // 0 → 1 across (hero + work section + a bit of CTA)
  p: 0,
  raw: 0,
  // -1 = engine LEFT (cards on right), +1 = engine RIGHT (cards on left)
  rowSide: -1,
  // true once the work section is in view; overrides default diagonal x/y
  workActive: false,
  // true once we've scrolled past the work section; engine slides out
  past: false,
};

const clamp01 = (t) => Math.max(0, Math.min(1, t));
const lerp = (a, b, t) => a + (b - a) * t;

// ----- Canvas texture used as a "film frame" surface ----------------

function makeFrameTexture(index, total) {
  const W = 800;
  const H = 450;
  const canvas =
    typeof document !== "undefined" ? document.createElement("canvas") : null;
  if (!canvas) return null;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  // Smoked-glass base gradient
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "rgba(28, 22, 52, 0.78)");
  g.addColorStop(0.5, "rgba(16, 14, 32, 0.7)");
  g.addColorStop(1, "rgba(10, 8, 22, 0.85)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Subtle holographic shimmer band across the middle
  const shimmer = ctx.createLinearGradient(0, H * 0.38, 0, H * 0.62);
  shimmer.addColorStop(0, "rgba(116, 209, 234, 0)");
  shimmer.addColorStop(0.5, "rgba(169, 106, 255, 0.10)");
  shimmer.addColorStop(1, "rgba(116, 209, 234, 0)");
  ctx.fillStyle = shimmer;
  ctx.fillRect(0, H * 0.38, W, H * 0.24);

  // Outer emissive border
  ctx.strokeStyle = "rgba(169, 106, 255, 0.55)";
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, W - 2, H - 2);

  // Top-left frame index label
  ctx.fillStyle = "rgba(116, 209, 234, 0.95)";
  ctx.fillRect(22, 22, 56, 3);
  ctx.fillStyle = "rgba(255, 255, 255, 0.78)";
  ctx.font =
    "600 16px 'JetBrains Mono', ui-monospace, SFMono-Regular, monospace";
  ctx.fillText(
    `F.${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`,
    22,
    52
  );

  // Top-right tiny meta
  ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
  ctx.font =
    "500 12px 'JetBrains Mono', ui-monospace, SFMono-Regular, monospace";
  ctx.textAlign = "right";
  ctx.fillText("24 FPS / 35MM", W - 22, 38);
  ctx.textAlign = "start";

  // Sprocket dots (left + right edge)
  ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
  for (let i = 0; i < 6; i++) {
    const y = 90 + i * 50;
    ctx.beginPath();
    ctx.arc(14, y, 2.5, 0, Math.PI * 2);
    ctx.arc(W - 14, y, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Central play-triangle glyph (very faint)
  ctx.fillStyle = "rgba(116, 209, 234, 0.22)";
  ctx.beginPath();
  ctx.moveTo(W * 0.46, H * 0.42);
  ctx.lineTo(W * 0.46, H * 0.58);
  ctx.lineTo(W * 0.56, H * 0.5);
  ctx.closePath();
  ctx.fill();

  // Bottom timeline track
  const trackY = H - 36;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(22, trackY);
  ctx.lineTo(W - 22, trackY);
  ctx.stroke();

  // Tick marks
  ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
  for (let i = 0; i <= 10; i++) {
    const x = 22 + ((W - 44) * i) / 10;
    ctx.beginPath();
    ctx.moveTo(x, trackY - 4);
    ctx.lineTo(x, trackY + 4);
    ctx.stroke();
  }

  // Scrub indicator — position scales with frame index
  const scrubX = 22 + ((W - 44) * (index + 0.5)) / total;
  ctx.strokeStyle = "rgba(169, 106, 255, 1)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(scrubX, trackY - 12);
  ctx.lineTo(scrubX, trackY + 12);
  ctx.stroke();
  ctx.fillStyle = "rgba(169, 106, 255, 1)";
  ctx.beginPath();
  ctx.arc(scrubX, trackY, 5, 0, Math.PI * 2);
  ctx.fill();

  // Bottom-left timecode
  ctx.fillStyle = "rgba(116, 209, 234, 0.85)";
  ctx.font =
    "500 12px 'JetBrains Mono', ui-monospace, SFMono-Regular, monospace";
  const seconds = String(index * 4).padStart(2, "0");
  ctx.fillText(`00:00:${seconds}:12`, 22, H - 52);

  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = 4;
  return tex;
}

// ----- Inner scene pieces -------------------------------------------

function Core() {
  const meshRef = useRef(null);
  useFrame((state, dt) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    meshRef.current.rotation.y += dt * 0.15;
    meshRef.current.rotation.x = Math.sin(t * 0.22) * 0.13;
    const mat = meshRef.current.material;
    mat.emissiveIntensity = 0.85 + Math.sin(t * 1.3) * 0.22;
  });
  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[0.32, 2]} />
      <meshStandardMaterial
        color="#0d1020"
        metalness={0.95}
        roughness={0.18}
        emissive="#7a4eff"
        emissiveIntensity={0.85}
        toneMapped={false}
      />
    </mesh>
  );
}

function TimelineRings() {
  const r1 = useRef(null);
  const r2 = useRef(null);
  const r3 = useRef(null);
  const r4 = useRef(null);

  useFrame((state, dt) => {
    if (r1.current) r1.current.rotation.z += dt * 0.28;
    if (r2.current) r2.current.rotation.x += dt * 0.2;
    if (r3.current) r3.current.rotation.y += dt * 0.16;
    if (r4.current) r4.current.rotation.z -= dt * 0.06; // very slow containing ring
  });

  return (
    <group>
      <mesh ref={r1} rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[0.72, 0.008, 12, 120]} />
        <meshStandardMaterial
          color="#22273a"
          metalness={0.95}
          roughness={0.1}
          emissive="#74D1EA"
          emissiveIntensity={0.75}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={r2} rotation={[0, Math.PI / 5, Math.PI / 4]}>
        <torusGeometry args={[0.96, 0.006, 10, 120]} />
        <meshStandardMaterial
          color="#22273a"
          metalness={0.95}
          roughness={0.12}
          emissive="#a96aff"
          emissiveIntensity={0.65}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={r3} rotation={[Math.PI / 4, 0, Math.PI / 8]}>
        <torusGeometry args={[1.25, 0.005, 10, 120]} />
        <meshStandardMaterial
          color="#22273a"
          metalness={0.95}
          roughness={0.14}
          emissive="#74D1EA"
          emissiveIntensity={0.48}
          toneMapped={false}
        />
      </mesh>
      {/* Containing ring — much larger, very thin, very slow */}
      <mesh ref={r4} rotation={[Math.PI / 2.5, Math.PI / 7, 0]}>
        <torusGeometry args={[1.85, 0.0035, 8, 160]} />
        <meshStandardMaterial
          color="#22273a"
          metalness={0.95}
          roughness={0.18}
          emissive="#a96aff"
          emissiveIntensity={0.3}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function FilmFrames({ count = 5 }) {
  const groupRef = useRef(null);

  // Generate the canvas textures once
  const textures = useMemo(
    () => Array.from({ length: count }, (_, i) => makeFrameTexture(i, count)),
    [count]
  );

  useEffect(() => {
    return () => {
      textures.forEach((t) => t?.dispose());
    };
  }, [textures]);

  useFrame((state, dt) => {
    if (!groupRef.current) return;
    const p = motionState.p;
    const t = state.clock.elapsedTime;

    groupRef.current.rotation.y =
      -0.05 + Math.sin(t * 0.15) * 0.04 - p * 0.25;
    groupRef.current.rotation.x = Math.sin(t * 0.1) * 0.025;

    // Determine which frame is "active" — slowly cycles with scroll
    const activeIdx = p * (count - 1);

    groupRef.current.children.forEach((child, i) => {
      const dist = i - activeIdx;
      const absDist = Math.abs(dist);

      // Active frame sits forward (high z), siblings recede
      const targetZ = 0.55 - absDist * 0.42;
      child.position.z += (targetZ - child.position.z) * 0.08;

      // X spread grows with scroll
      const targetX = dist * (0.35 + p * 0.7);
      child.position.x += (targetX - child.position.x) * 0.08;

      // Subtle y float
      child.position.y =
        Math.sin(t * 0.45 + i * 0.7) * 0.07 + (i % 2 ? 1 : -1) * 0.03;

      // Active = bright; far = dimmer
      const targetOp = Math.max(0.25, 0.95 - absDist * 0.18);
      child.material.opacity += (targetOp - child.material.opacity) * 0.1;
    });
  });

  return (
    <group ref={groupRef}>
      {textures.map((tex, i) => (
        <mesh key={i} position={[0, 0, 0]} rotation={[0.04 * (i % 2 ? 1 : -1), 0.18 * (i % 2 ? 1 : -1), 0]}>
          <planeGeometry args={[1.6, 0.9]} />
          <meshBasicMaterial
            map={tex}
            transparent
            opacity={0.85}
            side={THREE.DoubleSide}
            toneMapped={false}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

function MotionPaths() {
  const ref1 = useRef(null);
  const ref2 = useRef(null);

  const curves = useMemo(() => {
    const c1 = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(-2.6, -0.6, -0.4),
        new THREE.Vector3(-1.2, 0.5, 0.3),
        new THREE.Vector3(0, 1.0, 0),
        new THREE.Vector3(1.2, -0.3, -0.2),
        new THREE.Vector3(2.6, 0.4, 0.4),
      ],
      false,
      "catmullrom",
      0.5
    );
    const c2 = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(-2.4, 0.7, 0.5),
        new THREE.Vector3(-0.8, -0.3, -0.2),
        new THREE.Vector3(0.4, -0.5, 0.3),
        new THREE.Vector3(1.6, 0.3, -0.1),
        new THREE.Vector3(2.6, -0.5, 0.3),
      ],
      false,
      "catmullrom",
      0.5
    );
    return { c1, c2 };
  }, []);

  useFrame((state) => {
    const p = motionState.p;
    const wa = motionState.workActive ? 1 : 0;
    const t = state.clock.elapsedTime;
    if (ref1.current) {
      const target = (p * 0.5 + wa * 0.45);
      ref1.current.material.opacity += (target - ref1.current.material.opacity) * 0.06;
      ref1.current.material.emissiveIntensity =
        0.6 + Math.sin(t * 1.6) * 0.2 + p * 0.3;
    }
    if (ref2.current) {
      const target = (p * 0.4 + wa * 0.35);
      ref2.current.material.opacity += (target - ref2.current.material.opacity) * 0.06;
      ref2.current.material.emissiveIntensity =
        0.55 + Math.cos(t * 1.3) * 0.18 + p * 0.25;
    }
  });

  return (
    <>
      <mesh ref={ref1}>
        <tubeGeometry args={[curves.c1, 200, 0.007, 8, false]} />
        <meshStandardMaterial
          color="#1a0d2a"
          emissive="#a96aff"
          emissiveIntensity={0.8}
          transparent
          opacity={0}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={ref2}>
        <tubeGeometry args={[curves.c2, 200, 0.006, 8, false]} />
        <meshStandardMaterial
          color="#072028"
          emissive="#74d1ea"
          emissiveIntensity={0.7}
          transparent
          opacity={0}
          toneMapped={false}
        />
      </mesh>
    </>
  );
}

function Particles({ count = 180 }) {
  const ref = useRef(null);

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 0] = (Math.random() - 0.5) * 9;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 5.5;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 4 - 1;
    }
    return arr;
  }, [count]);

  const speeds = useMemo(() => {
    const arr = new Float32Array(count);
    for (let i = 0; i < count; i++) arr[i] = 0.02 + Math.random() * 0.05;
    return arr;
  }, [count]);

  useFrame((state, dt) => {
    if (!ref.current) return;
    const pos = ref.current.geometry.attributes.position;
    const arr = pos.array;
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += dt * speeds[i] * 0.7;
      if (arr[i * 3 + 1] > 3.2) {
        arr[i * 3 + 1] = -3.2;
        arr[i * 3 + 0] = (Math.random() - 0.5) * 9;
      }
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={count}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#a96aff"
        size={0.014}
        transparent
        opacity={0.55}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  );
}

// ----- Stage: outer group that travels via scroll + per-row override -

function Stage() {
  const ref = useRef(null);

  // Smoothed targets (we lerp every frame to avoid snaps)
  const targetRef = useRef({ x: 1.7, y: 0.5, z: 0, op: 1 });

  useFrame((state, dt) => {
    if (!ref.current) return;
    const p = motionState.p;
    const t = state.clock.elapsedTime;

    let tx, ty;

    if (motionState.workActive) {
      // Inside the work section: alternate sides per row.
      // rowSide = -1 → engine LEFT, +1 → engine RIGHT
      tx = motionState.rowSide * 1.55;
      ty = 0.1 + Math.sin(t * 0.35) * 0.15;
    } else if (motionState.past) {
      // Past the work section: slide off-screen lower-left
      tx = -3.0;
      ty = -1.4;
    } else {
      // Hero phase: clean linear diagonal from top-right to center-left
      // p ramps 0..1 over hero (since workActive flips before deck)
      tx = lerp(1.9, -0.6, p);
      ty = lerp(0.55, -0.25, p) + Math.sin(t * 0.4) * 0.08;
    }

    const tg = targetRef.current;
    tg.x += (tx - tg.x) * 0.06;
    tg.y += (ty - tg.y) * 0.06;

    ref.current.position.x = tg.x;
    ref.current.position.y = tg.y;
    ref.current.position.z = -p * 0.25;

    // Subtle yaw
    ref.current.rotation.y =
      Math.sin(t * 0.2) * 0.04 - (motionState.workActive ? motionState.rowSide * 0.08 : p * 0.12);

    const sc = 1 + p * 0.08;
    ref.current.scale.set(sc, sc, sc);
  });

  return (
    <group ref={ref}>
      <Particles count={180} />
      <MotionPaths />
      <FilmFrames count={5} />
      <TimelineRings />
      <Core />
    </group>
  );
}

function CameraDolly() {
  useFrame((state) => {
    const p = motionState.p;
    const wa = motionState.workActive ? 1 : 0;
    const t = state.clock.elapsedTime;
    const cam = state.camera;
    // Camera dollies inward as you scroll into work, then back out at the end.
    // Range: 6.6 (hero start) → 5.8 (work) → 6.6 (after work).
    const dollyTarget =
      motionState.past ? 6.6 : wa ? 5.8 : 6.6 - p * 0.8;
    cam.position.z += (dollyTarget - cam.position.z) * 0.04;
    // Very subtle vertical pan with idle
    cam.position.y = Math.sin(t * 0.18) * 0.06;
    cam.lookAt(0, 0, 0);
  });
  return null;
}

function SceneLighting() {
  return (
    <>
      <fog attach="fog" args={["#04060b", 6, 14]} />
      <ambientLight intensity={0.18} color="#a08ad0" />
      <hemisphereLight args={["#6a5fbe", "#0c0816", 0.6]} />
      <directionalLight position={[5, 4, 3]} intensity={2.0} color="#cfd4e8" />
      <pointLight position={[-3, 2, -4]} intensity={5} color="#9067ff" distance={11} decay={1.8} />
      <pointLight position={[-4, -1, 2]} intensity={3.4} color="#74d1ea" distance={10} decay={1.8} />
      <pointLight position={[0, -3, 1]} intensity={2.6} color="#a05cff" distance={8} decay={2} />
    </>
  );
}

// ----- Wrapper component --------------------------------------------

export default function V3MotionEngine() {
  const wrapRef = useRef(null);
  const [enabled, setEnabled] = useState(true);
  const [frameloop, setFrameloop] = useState("always");

  // Pause render loop when tab is hidden
  useEffect(() => {
    if (typeof document === "undefined") return;
    const onVis = () => {
      setFrameloop(document.hidden ? "never" : "always");
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const isMobile = window.matchMedia("(max-width: 900px)").matches;
    if (prefersReducedMotion || isMobile) {
      setEnabled(false);
      return;
    }

    let raf = 0;
    const update = () => {
      const vh = window.innerHeight;
      const heroEnd = vh; // hero phase boundary
      const y = window.scrollY;

      motionState.raw = y;
      // p ramps 0..1 ONLY across hero (engine travels diagonal here).
      // After hero, workActive takes over and p doesn't drive motion.
      motionState.p = clamp01(y / heroEnd);

      // Container opacity ramps in slightly near top, stays at 1.
      const op = clamp01(y / 80) * 1;
      if (wrapRef.current) wrapRef.current.style.opacity = (0.4 + op * 0.6).toFixed(3);

      raf = 0;
    };
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", update);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  if (!enabled) return null;

  return (
    <div ref={wrapRef} className="v3-motion-engine" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 6.6], fov: 38 }}
        dpr={[1, 1.6]}
        frameloop={frameloop}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
      >
        <CameraDolly />
        <SceneLighting />
        <Stage />
      </Canvas>
    </div>
  );
}
