"use client";
import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { GALAXY_STOPS } from "./data";

// Raw sRGB bytes → vec3 (Canvas runs `linear` so these render literally).
const toVec = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return new THREE.Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
};

const VERT = /* glsl */ `
  out vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision highp float;
  out vec4 fragColor;
  in vec2 vUv;
  uniform float uTime, uScroll, uVel, uAspect;
  uniform vec3 uColors[12];

  // 4x4 ordered (Bayer) dither — kills banding on the dark fade.
  const float BAYER[16] = float[16](
    0.0, 8.0, 2.0, 10.0,  12.0, 4.0, 14.0, 6.0,
    3.0, 11.0, 1.0, 9.0,  15.0, 7.0, 13.0, 5.0
  );
  float dither(vec2 c) {
    int i = int(mod(c.x, 4.0)) + int(mod(c.y, 4.0)) * 4;
    return BAYER[i] / 16.0 - 0.5;
  }

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x),
               mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.0; a *= 0.5; }
    return v;
  }

  // 12-stop brand spectrum sampled smoothly.
  vec3 palette(float t) {
    t = clamp(t, 0.0, 1.0) * 11.0;
    float idx = floor(t);
    float f = smoothstep(0.0, 1.0, fract(t));
    int a = int(idx);
    int b = a < 11 ? a + 1 : 11;
    return mix(uColors[a], uColors[b], f);
  }

  void main() {
    vec2 uv = vUv;
    vec2 p = vec2(uv.x * uAspect, uv.y);
    float t = uTime * 0.05;

    // flowing organic distortion of the spectrum sweep
    float n  = fbm(p * 2.2 + vec2(t, -t * 0.6) + uScroll * 0.6);
    float n2 = fbm(p * 1.3 - vec2(t * 0.4, t * 0.2));

    // left = warm (wine/red), right = cool (blue) → reverse the stop order across x
    float sweep = 1.0 - uv.x;
    float tt = sweep + (n - 0.5) * 0.55 + (n2 - 0.5) * 0.22 + uScroll * 0.12;
    vec3 col = palette(tt);

    // hot white-yellow core behind the centre of the composition
    vec2 core = vec2(0.5 * uAspect, 0.6);
    float d = distance(p, core);
    float glow = smoothstep(0.6, 0.0, d) * (0.55 + 0.12 * sin(uTime * 0.4));
    col += vec3(1.0, 0.95, 0.72) * glow * 0.55;

    // luminance shaping: bright on the left, deep black on the right
    float fadeRight = smoothstep(1.04, 0.34, uv.x);
    float vign = smoothstep(1.3, 0.18, distance(uv, vec2(0.4, 0.5)));
    float bright = mix(0.06, 1.0, fadeRight) * mix(0.55, 1.0, vign);
    bright *= 0.7 + 0.5 * fbm(p * 3.0 + t);
    col *= bright;

    // scroll velocity blooms the field a touch
    col += col * clamp(uVel, 0.0, 3.0) * 0.14;

    col += dither(gl_FragCoord.xy) / 255.0;
    fragColor = vec4(max(col, 0.0), 1.0);
  }
`;

function SpectrumPlane({ reduce }) {
  const mat = useRef(null);
  const target = useRef(0);
  const lastY = useRef(0);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uScroll: { value: 0 },
      uVel: { value: 0 },
      uAspect: { value: 1 },
      uColors: { value: GALAXY_STOPS.map(toVec) },
    }),
    []
  );

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      target.current = max > 0 ? window.scrollY / max : 0;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useFrame((state, dt) => {
    const m = mat.current;
    if (!m) return;
    const u = m.uniforms;
    u.uAspect.value = state.size.width / state.size.height;
    if (reduce) {
      u.uScroll.value = target.current;
      return;
    }
    if (document.hidden) return; // free CPU/GPU off-tab
    u.uTime.value += dt;
    // weighted lerp toward scroll target + decaying velocity impulse
    const prev = u.uScroll.value;
    u.uScroll.value += (target.current - prev) * Math.min(1, dt * 4);
    const y = window.scrollY;
    u.uVel.value = u.uVel.value * 0.9 + Math.abs(y - lastY.current) * 0.02;
    lastY.current = y;
  });

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={mat}
        uniforms={uniforms}
        vertexShader={VERT}
        fragmentShader={FRAG}
        glslVersion={THREE.GLSL3}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
}

export default function V24SpectrumField() {
  const reduce =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return (
    <div className="v24-spectrum-field" aria-hidden="true">
      <Canvas
        flat
        linear
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        camera={{ position: [0, 0, 1] }}
        frameloop={reduce ? "demand" : "always"}
      >
        <color attach="background" args={["#000000"]} />
        <SpectrumPlane reduce={reduce} />
      </Canvas>
    </div>
  );
}
