# Portfolio V14 — ProjectUniverse Intro Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Remotion Three.js composition that flies a camera through a universe of real TMA project panels (2 case key-visuals + 24 client logos), settling on the Foodics hero, render it to a 180-frame WebP sequence, and wire it as the `/portfolio-v14` film-scene source through SP-0's existing `getUrl` engine path.

**Architecture:** Panel-field placement and camera-arc are pure deterministic `.js` modules unit-tested with `node:test` (the SP-0 pattern). The `ProjectUniverse.tsx` composition consumes those plus a `delayRender`-gated texture loader, following the existing `MMonument.tsx` `ThreeCanvas` conventions. A render script cloned from `render-frames.mjs` produces `tma-web/public/assets/v14/intro/frame-NNN.webp`. The film scene swaps its procedural source for a URL source; the procedural source stays reachable via `?frames=procedural` so SP-0's kernel spec keeps passing.

**Tech Stack:** Remotion 4 + `@remotion/three` + `@react-three/fiber` + three 0.169, `@remotion/bundler`/`@remotion/renderer`, `sharp`, Next.js 16/React 19 (SP-0 engine), `node:test`, Playwright.

**Spec:** `docs/superpowers/specs/2026-05-17-portfolio-v14-project-universe-design.md`
**Branch:** `feat/portfolio-v14` (continues from completed SP-0).

---

## File Structure

Pure cores (unit-tested with `node:test` from `tma-web`):
- `remotion/src/universe/assetManifest.js` — the deterministic ordered list of the 26 source asset files + panel kind
- `remotion/src/universe/panelLayout.js` — `buildPanelField(manifest)` → deterministic seeded panel transforms
- `remotion/src/universe/cameraArc.js` — `cameraForFrame(frame, duration)` → camera position + lookAt

Remotion glue (verified by the actual render):
- `remotion/src/universe/loadTexture.js` — `delayRender`-gated Three.js texture loader helper
- `remotion/src/ProjectUniverse.tsx` — the composition
- `remotion/src/Root.tsx` — MODIFY: register the composition
- `remotion/render-universe.mjs` — render script
- `remotion/package.json` — MODIFY: add `render-universe` script
- `remotion/public/universe/` — copied source textures (asset prep)

Engine wiring (verified by Playwright):
- `tma-web/components/portfolio-v14/scenes/IntroFilmScene.jsx` — replaces `PlaceholderFilmScene.jsx`
- `tma-web/components/portfolio-v14/V14Experience.jsx` — MODIFY: use IntroFilmScene
- `tma-web/playwright/tests/v14-kernel.spec.js` — MODIFY: point at `?frames=procedural`
- `tma-web/playwright/tests/v14-universe.spec.js` — new e2e
- `tma-web/test/v14-universe-layout.test.mjs`, `v14-universe-camera.test.mjs`, `v14-universe-frames.test.mjs` — node:test

Tests run from `c:/Users/Pc/Downloads/the-motion-agency-web-main/tma-web` (`npm test`, `npm run test:e2e`). Git from repo root. Remotion commands from `c:/Users/Pc/Downloads/the-motion-agency-web-main/remotion`.

---

## Task 1: Asset manifest (pure) + copy textures into Remotion public

**Files:**
- Create: `remotion/src/universe/assetManifest.js`
- Create: `remotion/public/universe/` (populated by copy)
- Test: `tma-web/test/v14-universe-manifest.test.mjs`

- [ ] **Step 1: Write the failing test**

Create `tma-web/test/v14-universe-manifest.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { ASSET_MANIFEST } from "../../remotion/src/universe/assetManifest.js";

test("manifest has 2 heroes then 24 logos = 26 entries", () => {
  assert.equal(ASSET_MANIFEST.length, 26);
  const heroes = ASSET_MANIFEST.filter((a) => a.kind === "hero");
  const logos = ASSET_MANIFEST.filter((a) => a.kind === "logo");
  assert.equal(heroes.length, 2);
  assert.equal(logos.length, 24);
});

test("foodics is the first hero (final-settle target)", () => {
  assert.equal(ASSET_MANIFEST[0].kind, "hero");
  assert.equal(ASSET_MANIFEST[0].id, "foodics-hero");
  assert.equal(ASSET_MANIFEST[0].file, "universe/foodics-hero.webp");
});

test("every entry has unique id and a universe/ file path", () => {
  const ids = new Set(ASSET_MANIFEST.map((a) => a.id));
  assert.equal(ids.size, 26);
  for (const a of ASSET_MANIFEST) {
    assert.match(a.file, /^universe\/[a-z0-9-]+\.webp$/);
  }
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd tma-web && npm test`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the manifest**

Create `remotion/src/universe/assetManifest.js`:

```js
// Deterministic ordered list of universe panels.
// index 0 is the Foodics hero — the camera-arc's final settle target.
// `file` is the path relative to remotion/public (used with staticFile()).
const LOGOS = [
  "abu-kass", "alissar", "arab-bank", "aramco", "bank-of-jordan",
  "buffalo-wild-wings", "burger-king", "cairo-amman-bank", "cyberx",
  "electrolux", "flex", "foodics", "invoiceq", "jadwa", "lsc",
  "ministry-economy", "reflect", "salasa", "shaker-group", "sol",
  "webook", "western-union", "zaintech", "zid",
];

export const ASSET_MANIFEST = [
  { id: "foodics-hero", kind: "hero", file: "universe/foodics-hero.webp" },
  { id: "zid-hero", kind: "hero", file: "universe/zid-hero.webp" },
  ...LOGOS.map((name) => ({
    id: `logo-${name}`,
    kind: "logo",
    file: `universe/logo-${name}.webp`,
  })),
];
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd tma-web && npm test`
Expected: PASS (3 new manifest tests; pre-existing 25 still green).

- [ ] **Step 5: Copy + convert the real source assets into `remotion/public/universe/`**

These are binary asset files (not committed via the test). Run from repo root using `sharp` (already a remotion devDependency) to normalize every source to web WebP at a sane size so the Remotion bundle stays small. Create and run a one-shot script `remotion/prep-universe-assets.mjs`:

```js
import sharp from "sharp";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(__dirname, "../tma-web/public/assets");
const OUT = path.resolve(__dirname, "public/universe");

const jobs = [
  ["case-foodics-boundless.png", "foodics-hero.webp", 1280],
  ["case-zid-ripple.png", "zid-hero.webp", 1280],
];
const logos = [
  "abu-kass","alissar","arab-bank","aramco","bank-of-jordan",
  "buffalo-wild-wings","burger-king","cairo-amman-bank","cyberx",
  "electrolux","flex","foodics","invoiceq","jadwa","lsc",
  "ministry-economy","reflect","salasa","shaker-group","sol",
  "webook","western-union","zaintech","zid",
];
for (const n of logos) jobs.push([`logos/${n}.png`, `logo-${n}.webp`, 512]);

await mkdir(OUT, { recursive: true });
for (const [src, out, w] of jobs) {
  const buf = await readFile(path.join(SRC, src));
  await sharp(buf).resize(w, null, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 }).toFile(path.join(OUT, out));
  console.log("wrote", out);
}
```

Run: `cd remotion && node prep-universe-assets.mjs`
Expected: prints `wrote foodics-hero.webp` … 26 files total in `remotion/public/universe/`. Verify: `ls remotion/public/universe | wc -l` → 26.

- [ ] **Step 6: Commit**

```bash
git add remotion/src/universe/assetManifest.js tma-web/test/v14-universe-manifest.test.mjs remotion/prep-universe-assets.mjs remotion/public/universe
git commit -m "feat(v14): universe asset manifest + prepped WebP textures"
```

---

## Task 2: Panel field layout (pure, deterministic)

**Files:**
- Create: `remotion/src/universe/panelLayout.js`
- Test: `tma-web/test/v14-universe-layout.test.mjs`

- [ ] **Step 1: Write the failing test**

Create `tma-web/test/v14-universe-layout.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildPanelField } from "../../remotion/src/universe/panelLayout.js";
import { ASSET_MANIFEST } from "../../remotion/src/universe/assetManifest.js";

test("produces one panel per manifest entry, deterministically", () => {
  const a = buildPanelField(ASSET_MANIFEST);
  const b = buildPanelField(ASSET_MANIFEST);
  assert.equal(a.length, ASSET_MANIFEST.length);
  assert.deepEqual(a, b); // deterministic — no Math.random at render time
});

test("hero panels are larger and on/near the camera path centerline", () => {
  const field = buildPanelField(ASSET_MANIFEST);
  const heroes = field.filter((p) => p.kind === "hero");
  const logos = field.filter((p) => p.kind === "logo");
  assert.equal(heroes.length, 2);
  for (const h of heroes) {
    assert.ok(h.scale >= 3, "hero scale >= 3");
    assert.ok(Math.abs(h.position[0]) <= 1.5 && Math.abs(h.position[1]) <= 1.5,
      "hero near centerline");
  }
  for (const l of logos) assert.ok(l.scale <= 2, "logo scale <= 2");
});

test("foodics hero is the deepest panel (final settle target, most negative Z)", () => {
  const field = buildPanelField(ASSET_MANIFEST);
  const foodics = field.find((p) => p.id === "foodics-hero");
  const minZ = Math.min(...field.map((p) => p.position[2]));
  assert.equal(foodics.position[2], minZ);
});

test("panels span a deep Z corridor and varied X/Y", () => {
  const field = buildPanelField(ASSET_MANIFEST);
  const zs = field.map((p) => p.position[2]);
  assert.ok(Math.max(...zs) - Math.min(...zs) >= 60, "deep corridor");
  const xs = field.map((p) => p.position[0]);
  assert.ok(Math.max(...xs) - Math.min(...xs) >= 8, "spread in X");
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd tma-web && npm test`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the layout**

Create `remotion/src/universe/panelLayout.js`:

```js
// Deterministic panel placement. A seeded LCG (no Math.random) keeps every
// render byte-identical. Camera flies along -Z from z≈8 toward z≈ -60.
function lcg(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296; // [0,1)
  };
}

export function buildPanelField(manifest) {
  const rnd = lcg(0x5eed1234);
  const heroes = manifest.filter((m) => m.kind === "hero");
  const logos = manifest.filter((m) => m.kind === "logo");

  const panels = [];

  // Logos: scattered through the corridor, off the centerline, varied depth.
  logos.forEach((m, i) => {
    const t = i / Math.max(1, logos.length - 1); // 0..1 along corridor
    const z = 2 - t * 56 + (rnd() - 0.5) * 6; // ~+2 .. ~-56, jittered
    const side = i % 2 === 0 ? 1 : -1;
    const x = side * (2.5 + rnd() * 5.5);
    const y = (rnd() - 0.5) * 7;
    panels.push({
      id: m.id, kind: "logo", file: m.file,
      position: [round(x), round(y), round(z)],
      rotation: [round((rnd() - 0.5) * 0.5), round((rnd() - 0.5) * 0.7), 0],
      scale: round(1.1 + rnd() * 0.8),
      drift: round(0.2 + rnd() * 0.5),
    });
  });

  // Heroes: near centerline, the camera's late focal targets.
  // zid-hero mid-corridor; foodics-hero deepest (final settle).
  const heroZ = { "zid-hero": -34, "foodics-hero": -60 };
  heroes.forEach((m) => {
    panels.push({
      id: m.id, kind: "hero", file: m.file,
      position: [round((rnd() - 0.5) * 1.6), round((rnd() - 0.5) * 1.2),
        heroZ[m.id] ?? -50],
      rotation: [0, round((rnd() - 0.5) * 0.18), 0],
      scale: m.id === "foodics-hero" ? 4.4 : 3.4,
      drift: 0.15,
    });
  });

  return panels;
}

function round(n) {
  return Math.round(n * 1000) / 1000;
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd tma-web && npm test`
Expected: PASS (4 new layout tests; manifest + SP-0 tests still green).

- [ ] **Step 5: Commit**

```bash
git add remotion/src/universe/panelLayout.js tma-web/test/v14-universe-layout.test.mjs
git commit -m "feat(v14): deterministic seeded panel-field layout"
```

---

## Task 3: Camera arc (pure)

**Files:**
- Create: `remotion/src/universe/cameraArc.js`
- Test: `tma-web/test/v14-universe-camera.test.mjs`

- [ ] **Step 1: Write the failing test**

Create `tma-web/test/v14-universe-camera.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { cameraForFrame } from "../../remotion/src/universe/cameraArc.js";

const DUR = 180;

test("starts in the void near z~8, drifting slowly (frames 0..40)", () => {
  const c0 = cameraForFrame(0, DUR);
  const c40 = cameraForFrame(40, DUR);
  assert.ok(c0.position[2] > 5, "starts pulled back");
  assert.ok(c0.position[2] - c40.position[2] < 6, "slow drift in void");
});

test("pushes forward monotonically (z strictly decreases 0->160)", () => {
  let prev = Infinity;
  for (let f = 0; f <= 160; f += 8) {
    const z = cameraForFrame(f, DUR).position[2];
    assert.ok(z <= prev + 1e-6, `z non-increasing at ${f} (${z} <= ${prev})`);
    prev = z;
  }
});

test("settles: frames 160..179 are static (no movement)", () => {
  const a = cameraForFrame(160, DUR);
  const b = cameraForFrame(170, DUR);
  const c = cameraForFrame(179, DUR);
  assert.deepEqual(a, b);
  assert.deepEqual(b, c);
});

test("final frame looks at the foodics hero focal point (z ~ -60)", () => {
  const end = cameraForFrame(179, DUR);
  assert.ok(end.lookAt[2] < -40, "looking deep down-corridor");
  assert.ok(end.position[2] < -45, "camera arrived near the hero");
  assert.ok(Math.abs(end.lookAt[0]) < 2 && Math.abs(end.lookAt[1]) < 2,
    "looking at centerline");
});

test("clamps out-of-range frames", () => {
  assert.deepEqual(cameraForFrame(-5, DUR), cameraForFrame(0, DUR));
  assert.deepEqual(cameraForFrame(999, DUR), cameraForFrame(179, DUR));
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd tma-web && npm test`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the camera arc**

Create `remotion/src/universe/cameraArc.js`:

```js
// Pure camera path. frame -> { position:[x,y,z], lookAt:[x,y,z], fov }.
// Arc: 0-40 void drift · 40-130 accelerating push · 130-160 decelerate ·
// 160-179 static settle on the foodics hero (z ≈ -60).
const START_Z = 8;
const SETTLE_Z = -52;     // camera stops just in front of foodics hero (-60)
const FOCAL = [0, 0, -60]; // foodics hero focal point

function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }
function easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
function round(n) { return Math.round(n * 1000) / 1000; }

export function cameraForFrame(frame, duration) {
  const last = duration - 1;
  const f = clamp(frame, 0, last);

  let z;
  if (f <= 40) {
    // slow void drift: small portion of the journey
    z = lerp(START_Z, START_Z - 4, easeInOut(f / 40));
  } else if (f <= 160) {
    // main push + decelerate folded into one eased segment
    z = lerp(START_Z - 4, SETTLE_Z, easeInOut((f - 40) / 120));
  } else {
    z = SETTLE_Z; // static settle
  }

  // gentle handheld sway, frozen during the settle so the end is dead still
  const swayT = f <= 160 ? f : 160;
  const x = round(Math.sin(swayT * 0.04) * 0.6);
  const y = round(1.2 + Math.cos(swayT * 0.03) * 0.35);

  // look target eases from straight-ahead toward the foodics focal point
  const lookT = easeInOut(clamp(f / 160, 0, 1));
  const lookAt = [
    round(lerp(x, FOCAL[0], lookT)),
    round(lerp(y, FOCAL[1], lookT)),
    round(lerp(z - 20, FOCAL[2], lookT)),
  ];

  return { position: [x, y, round(z)], lookAt, fov: 38 };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd tma-web && npm test`
Expected: PASS (5 new camera tests; all prior green).

- [ ] **Step 5: Commit**

```bash
git add remotion/src/universe/cameraArc.js tma-web/test/v14-universe-camera.test.mjs
git commit -m "feat(v14): pure camera-arc (void drift → push → settle on hero)"
```

---

## Task 4: delayRender-gated texture loader helper

**Files:**
- Create: `remotion/src/universe/loadTexture.js`

(No node:test — it depends on three + Remotion runtime; exercised by the render in Task 7.)

- [ ] **Step 1: Implement the helper**

Create `remotion/src/universe/loadTexture.js`:

```js
import { useEffect, useState } from "react";
import { delayRender, continueRender, staticFile } from "remotion";
import * as THREE from "three";

/**
 * Loads a texture from remotion/public via staticFile, holding the Remotion
 * render until the bitmap is decoded (MMonument's lesson: assets MUST be ready
 * before the frame is captured, or early frames render blank).
 * Returns the THREE.Texture or null while loading.
 */
export function useUniverseTexture(file) {
  const [tex, setTex] = useState(null);
  useEffect(() => {
    const handle = delayRender(`tex:${file}`);
    const loader = new THREE.TextureLoader();
    loader.load(
      staticFile(file),
      (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 8;
        setTex(t);
        continueRender(handle);
      },
      undefined,
      (err) => {
        // Never hang the render on a bad asset — continue with no texture.
        console.warn("[universe] texture failed", file, err);
        continueRender(handle);
      }
    );
    return () => t?.dispose?.();
    function t() {}
  }, [file]);
  return tex;
}
```

Note: the cleanup must dispose the loaded texture. Replace the broken trailing
`return () => t?.dispose?.(); function t() {}` with a correct closure:

```js
  }, [file]);
  return tex;
}
```

and change the effect body to capture the texture for disposal:

```js
  useEffect(() => {
    const handle = delayRender(`tex:${file}`);
    let loaded;
    const loader = new THREE.TextureLoader();
    loader.load(
      staticFile(file),
      (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 8;
        loaded = t;
        setTex(t);
        continueRender(handle);
      },
      undefined,
      (err) => {
        console.warn("[universe] texture failed", file, err);
        continueRender(handle);
      }
    );
    return () => loaded?.dispose?.();
  }, [file]);
```

Final file content must be exactly:

```js
import { useEffect, useState } from "react";
import { delayRender, continueRender, staticFile } from "remotion";
import * as THREE from "three";

/**
 * Loads a texture from remotion/public via staticFile, holding the Remotion
 * render until the bitmap is decoded so no frame captures a blank panel.
 * Returns the THREE.Texture, or null while loading / on failure.
 */
export function useUniverseTexture(file) {
  const [tex, setTex] = useState(null);
  useEffect(() => {
    const handle = delayRender(`tex:${file}`);
    let loaded;
    new THREE.TextureLoader().load(
      staticFile(file),
      (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 8;
        loaded = t;
        setTex(t);
        continueRender(handle);
      },
      undefined,
      (err) => {
        console.warn("[universe] texture failed", file, err);
        continueRender(handle);
      }
    );
    return () => loaded?.dispose?.();
  }, [file]);
  return tex;
}
```

- [ ] **Step 2: Syntax check**

Run: `cd remotion && node --check src/universe/loadTexture.js`
Expected: exits 0 (parses; JSX-free, imports resolved at bundle time).

- [ ] **Step 3: Commit**

```bash
git add remotion/src/universe/loadTexture.js
git commit -m "feat(v14): delayRender-gated universe texture loader"
```

---

## Task 5: ProjectUniverse composition

**Files:**
- Create: `remotion/src/ProjectUniverse.tsx`

(No node:test — Three/Remotion component; verified by the render in Task 7 and the Playwright spec in Task 10.)

- [ ] **Step 1: Implement the composition**

Create `remotion/src/ProjectUniverse.tsx`:

```tsx
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
```

- [ ] **Step 2: Type/syntax sanity**

Run: `cd remotion && npx tsc --noEmit -p tsconfig.json 2>&1 | grep -i "ProjectUniverse\|universe/" | head -20`
Expected: no type errors referencing `ProjectUniverse.tsx` or `src/universe/*` (the project's pre-existing tsc output elsewhere is not in scope). If `tsc` is not configured for noEmit cleanly, instead rely on the Task 7 render (Remotion bundles with its own webpack/babel and will fail loudly on a real syntax error). Report what you ran.

- [ ] **Step 3: Commit**

```bash
git add remotion/src/ProjectUniverse.tsx
git commit -m "feat(v14): ProjectUniverse Three.js composition"
```

---

## Task 6: Register the composition in Root.tsx

**Files:**
- Modify: `remotion/src/Root.tsx`

- [ ] **Step 1: Add the composition registration**

In `remotion/src/Root.tsx`, add the import after the existing imports:

```tsx
import { ProjectUniverse } from "./ProjectUniverse";
```

And add this `<Composition>` as the FIRST child inside the `<>` fragment (before `MMonument`), so the existing compositions are untouched:

```tsx
      <Composition
        id="ProjectUniverse"
        component={ProjectUniverse}
        durationInFrames={180}
        fps={30}
        width={1600}
        height={1000}
      />
```

- [ ] **Step 2: Verify registration**

Run: `cd remotion && npx remotion compositions src/index.ts 2>&1 | tail -20`
Expected: the listed composition IDs include `ProjectUniverse` alongside `MMonument`, `MMonumentPaper`, `MMonumentDark`. Report the actual list.

- [ ] **Step 3: Commit**

```bash
git add remotion/src/Root.tsx
git commit -m "feat(v14): register ProjectUniverse composition"
```

---

## Task 7: Render script + produce the frame sequence

**Files:**
- Create: `remotion/render-universe.mjs`
- Modify: `remotion/package.json`
- Create (artifact): `tma-web/public/assets/v14/intro/frame-001.webp` … `frame-180.webp`
- Test: `tma-web/test/v14-universe-frames.test.mjs`

- [ ] **Step 1: Write the failing frame-output test**

Create `tma-web/test/v14-universe-frames.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../public/assets/v14/intro"
);

test("exactly 180 sequential non-empty webp frames exist", async () => {
  const files = (await readdir(dir)).filter((f) => f.endsWith(".webp")).sort();
  assert.equal(files.length, 180);
  for (let i = 0; i < 180; i++) {
    const expected = `frame-${String(i + 1).padStart(3, "0")}.webp`;
    assert.equal(files[i], expected);
    const s = await stat(path.join(dir, files[i]));
    assert.ok(s.size > 1000, `${files[i]} should be a real image`);
  }
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd tma-web && npm test`
Expected: FAIL — directory does not exist / no frames yet.

- [ ] **Step 3: Create the render script**

Create `remotion/render-universe.mjs` (cloned from `render-frames.mjs`, only the marked constants changed):

```js
/**
 * Render the ProjectUniverse composition to a WebP frame sequence at
 * tma-web/public/assets/v14/intro/frame-NNN.webp (1-based, zero-padded 3).
 */
import { bundle } from "@remotion/bundler";
import { renderFrames, selectComposition } from "@remotion/renderer";
import sharp from "sharp";
import { mkdir, readdir, rm, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENTRY = path.resolve(__dirname, "src/index.ts");
const TMP_DIR = path.resolve(__dirname, "out/universe-raw");
const FINAL_DIR = path.resolve(__dirname, "../tma-web/public/assets/v14/intro");
const COMP_ID = "ProjectUniverse";
const TARGET_WIDTH = 1280;

const log = (...a) => console.log("[universe]", ...a);

async function main() {
  log("Bundling…");
  const bundleLocation = await bundle({ entryPoint: ENTRY, webpackOverride: (c) => c });

  log("Selecting composition…");
  const comp = await selectComposition({ serveUrl: bundleLocation, id: COMP_ID });
  log(`${comp.id}: ${comp.durationInFrames}f @ ${comp.fps}fps, ${comp.width}x${comp.height}`);

  await rm(TMP_DIR, { recursive: true, force: true });
  await mkdir(TMP_DIR, { recursive: true });

  log("Rendering frames (Three.js + textures — may take several minutes)…");
  const t0 = Date.now();
  await renderFrames({
    composition: comp,
    serveUrl: bundleLocation,
    outputDir: TMP_DIR,
    imageFormat: "jpeg",
    jpegQuality: 92,
    concurrency: 4,
    onFrameUpdate: (r, t) => {
      if (r % 20 === 0 || r === t) log(`  ${r}/${t} (${Math.round((r / t) * 100)}%)`);
    },
    onStart: () => log("  render started…"),
  });
  log(`Rendered in ${((Date.now() - t0) / 1000).toFixed(1)}s`);

  log("Converting → WebP…");
  await mkdir(FINAL_DIR, { recursive: true });
  for (const f of await readdir(FINAL_DIR).catch(() => [])) {
    if (f.startsWith("frame-")) await rm(path.join(FINAL_DIR, f));
  }
  const frames = (await readdir(TMP_DIR)).filter((f) => /\.(jpe?g|png)$/i.test(f)).sort();
  let totalOut = 0;
  for (let i = 0; i < frames.length; i++) {
    const inBuf = await readFile(path.join(TMP_DIR, frames[i]));
    const outName = `frame-${String(i + 1).padStart(3, "0")}.webp`;
    const outPath = path.join(FINAL_DIR, outName);
    await sharp(inBuf)
      .resize(TARGET_WIDTH, null, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 78, effort: 4 })
      .toFile(outPath);
    totalOut += (await readFile(outPath)).length;
    if ((i + 1) % 20 === 0 || i === frames.length - 1)
      log(`  ${i + 1}/${frames.length} → ${outName}`);
  }
  log(`Done: ${frames.length} frames → ${FINAL_DIR} (${(totalOut / 1048576).toFixed(1)} MB)`);
}

main().catch((e) => { console.error("[universe] FAILED:", e); process.exit(1); });
```

- [ ] **Step 4: Add the npm script**

In `remotion/package.json` `"scripts"`, add after `"render-v3-frames"`:

```json
    "render-universe": "node render-universe.mjs",
```

- [ ] **Step 5: Run the render**

Run: `cd remotion && npm run render-universe`
Expected: logs bundle → select (`ProjectUniverse: 180f @ 30fps, 1600x1000`) → render progress → 180 WebP written to `tma-web/public/assets/v14/intro/`. This may take several minutes; let it finish. If it fails on a composition/texture error, STOP and report BLOCKED with the error (do not hand-edit frames or fake outputs).

- [ ] **Step 6: Run the frame test to verify it passes**

Run: `cd tma-web && npm test`
Expected: PASS — `v14-universe-frames` confirms 180 sequential non-empty webp; all prior tests still green.

- [ ] **Step 7: Commit (includes the rendered artifact)**

```bash
git add remotion/render-universe.mjs remotion/package.json tma-web/test/v14-universe-frames.test.mjs tma-web/public/assets/v14/intro
git commit -m "feat(v14): render ProjectUniverse to committed WebP frame sequence"
```

---

## Task 8: Swap the film scene to the rendered sequence (keep procedural via ?frames=procedural)

**Files:**
- Create: `tma-web/components/portfolio-v14/scenes/IntroFilmScene.jsx`
- Delete: `tma-web/components/portfolio-v14/scenes/PlaceholderFilmScene.jsx`
- Modify: `tma-web/components/portfolio-v14/V14Experience.jsx`

- [ ] **Step 1: Create `IntroFilmScene.jsx`**

```jsx
"use client";
import { useMemo } from "react";
import { useScene } from "@/components/portfolio-v14/engine/useScene";
import { useFrameSequence } from "@/components/portfolio-v14/engine/useFrameSequence";
import { createProceduralSource } from "@/components/portfolio-v14/dev/proceduralFrames";

const FRAME_COUNT = 180;

export default function IntroFilmScene() {
  const source = useMemo(() => {
    const useProcedural =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("frames") === "procedural";
    if (useProcedural) return createProceduralSource(FRAME_COUNT);
    return {
      count: FRAME_COUNT,
      getUrl: (i) =>
        `/assets/v14/intro/frame-${String(i + 1).padStart(3, "0")}.webp`,
    };
  }, []);
  const { canvasRef, setProgress } = useFrameSequence(source);
  const ref = useScene({
    id: "film",
    order: 20,
    viewports: 8,
    onProgress: (p) => setProgress(p),
  });
  return (
    <section ref={ref} data-scene="film" style={{ height: "100vh", background: "#000" }}>
      <canvas ref={canvasRef} data-v14-canvas style={{ display: "block", width: "100%", height: "100%" }} />
    </section>
  );
}
```

- [ ] **Step 2: Delete the placeholder scene**

Run: `git rm tma-web/components/portfolio-v14/scenes/PlaceholderFilmScene.jsx`

- [ ] **Step 3: Update `V14Experience.jsx`**

Replace the `PlaceholderFilmScene` import line and its usage:

```jsx
"use client";
import SmoothScroll from "@/components/portfolio/SmoothScroll";
import { SceneControllerProvider } from "@/components/portfolio-v14/engine/SceneController";
import ProbeSceneA from "@/components/portfolio-v14/scenes/ProbeSceneA";
import IntroFilmScene from "@/components/portfolio-v14/scenes/IntroFilmScene";
import ProbeSceneB from "@/components/portfolio-v14/scenes/ProbeSceneB";

export default function V14Experience() {
  return (
    <SceneControllerProvider>
      <SmoothScroll />
      <ProbeSceneA />
      <IntroFilmScene />
      <ProbeSceneB />
    </SceneControllerProvider>
  );
}
```

- [ ] **Step 4: Build sanity**

Run: `cd tma-web && npx next build 2>&1 | tail -8`
Expected: compiles successfully, `/portfolio-v14` in the route list, no error referencing IntroFilmScene/V14Experience.

- [ ] **Step 5: Commit**

```bash
# Step 2's `git rm` already staged the PlaceholderFilmScene deletion.
git add tma-web/components/portfolio-v14/scenes/IntroFilmScene.jsx tma-web/components/portfolio-v14/V14Experience.jsx
git commit -m "feat(v14): film scene plays the rendered universe (procedural via ?frames=procedural)"
```

---

## Task 9: Keep SP-0 kernel spec valid against the procedural source

**Files:**
- Modify: `tma-web/playwright/tests/v14-kernel.spec.js`

- [ ] **Step 1: Point the kernel tests at the procedural source**

In `tma-web/playwright/tests/v14-kernel.spec.js`, every `page.goto("/portfolio-v14")` MUST become `page.goto("/portfolio-v14?frames=procedural")`. There are three occurrences (the smoke test, the monotonic/throttle test, the fps test). Change only those navigation calls; do not alter any assertion or threshold. Example:

```js
await page.goto("/portfolio-v14?frames=procedural");
```

Rationale: the kernel spec's monotonic/`drawCount <= count+5` assertions require the deterministic, network-free procedural counter; the default route now streams real WebP frames over HTTP.

- [ ] **Step 2: Run the kernel spec**

Run: from `tma-web`, start `npm run dev` (background), warm `http://localhost:3000/portfolio-v14?frames=procedural`, then
`PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test playwright/tests/v14-kernel.spec.js --project=laptop-1440`
Expected: 3/3 PASS (unchanged thresholds). Stop the dev server.

- [ ] **Step 3: Commit**

```bash
git add tma-web/playwright/tests/v14-kernel.spec.js
git commit -m "test(v14): kernel spec uses ?frames=procedural after universe swap"
```

---

## Task 10: Playwright universe verification

**Files:**
- Create: `tma-web/playwright/tests/v14-universe.spec.js`

- [ ] **Step 1: Write the spec**

Create `tma-web/playwright/tests/v14-universe.spec.js`:

```js
import { test, expect } from "@playwright/test";

test("universe frames stream, advance with scroll, no errors", async ({ page }) => {
  const errors = [];
  const failed = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("response", (r) => {
    if (r.url().includes("/assets/v14/intro/") && r.status() >= 400)
      failed.push(`${r.status()} ${r.url()}`);
  });
  await page.goto("/portfolio-v14");
  await page.locator('[data-v14-canvas]').waitFor();

  const samples = [];
  for (let y = 0; y <= 12000; y += 1500) {
    await page.evaluate((sy) => window.scrollTo(0, sy), y);
    await page.waitForTimeout(300);
    samples.push(await page.evaluate(() => ({ ...window.__v14Debug })));
  }
  const idx = samples.map((s) => s.frameIndex);
  for (let i = 1; i < idx.length; i++) expect(idx[i]).toBeGreaterThanOrEqual(idx[i - 1]);
  expect(idx[idx.length - 1]).toBeGreaterThan(idx[0]);
  expect(samples[samples.length - 1].count).toBe(180);
  expect(failed).toEqual([]);
  expect(errors).toEqual([]);
});

test("reduced motion rests on the final settled frame, scrollable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto("/portfolio-v14");
  await page.locator('[data-v14-canvas]').waitFor();
  await page.waitForTimeout(500);
  const dbg = await page.evaluate(() => ({ ...window.__v14Debug }));
  expect(dbg.frameIndex).toBe(179); // engine resolved to the last (settled) frame
  await page.locator('[data-scene="probe-b"]').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-scene="probe-b"]')).toBeInViewport();
  expect(errors).toEqual([]);
});
```

- [ ] **Step 2: Run it**

Run: from `tma-web`, dev server running + route warmed (`curl -s -o /dev/null http://localhost:3000/portfolio-v14`), then
`PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test playwright/tests/v14-universe.spec.js --project=laptop-1440`
Expected: 2/2 PASS. If reduced-motion frameIndex isn't 179, investigate the real cause (engine maps progress 1 → `frameIndexFor(1,180)=179`); do not weaken the assertion. Report actual values. Stop the dev server.

- [ ] **Step 3: Commit**

```bash
git add tma-web/playwright/tests/v14-universe.spec.js
git commit -m "test(v14): e2e — universe frames stream + reduced-motion settles on final frame"
```

---

## Task 11: Full regression + status memory

- [ ] **Step 1: Full unit suite**

Run: `cd tma-web && npm test`
Expected: all green — SP-0's 25 + new `v14-universe-manifest` (3) + `v14-universe-layout` (4) + `v14-universe-camera` (5) + `v14-universe-frames` (1). Report totals.

- [ ] **Step 2: Full v14 e2e suite**

Run: from `tma-web`, dev server running + both routes warmed, then
`PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test playwright/tests/v14-kernel.spec.js playwright/tests/v14-reduced-motion.spec.js playwright/tests/v14-universe.spec.js --project=laptop-1440`
Expected: all PASS (kernel 3 via procedural, reduced-motion 1, universe 2). Stop the dev server. Report the summary.

- [ ] **Step 3: Update status memory**

Edit `C:\Users\Pc\.claude\projects\c--Users-Pc-Downloads-the-motion-agency-web-main\memory\v14-scene-engine-status.md`: change the status to note SP-1 (ProjectUniverse) is **built & verified** — Three.js universe of real brand panels rendered to `tma-web/public/assets/v14/intro/` (180 WebP), film scene now plays it, procedural source preserved behind `?frames=procedural`. Keep the rest of the file.

- [ ] **Step 4: Final commit (no blanket `git add -A` — pre-existing unrelated changes exist)**

```bash
git add docs/superpowers/plans/2026-05-17-portfolio-v14-project-universe.md
git commit -m "chore(v14): ProjectUniverse complete — unit + e2e green" || echo "nothing extra to commit"
```

---

## Self-Review

**Spec coverage:**
- §1 scope (composition + render + wiring; MMonument kept; probes kept) → Tasks 5/6/7/8.
- §2 real brand panels, fly-through→Foodics, @remotion/three, 180f@30fps/1600×1000 → Tasks 1/2/3/5/6.
- §3 composition (ThreeCanvas conventions, deterministic seeded panels, hero/logo treatment, lights, particles, sRGB) → Tasks 2/5.
- §4 camera arc frame ranges → Task 3 (pure, tested) + consumed in Task 5.
- §5 render pipeline (cloned render-frames, COMP_ID, dirs, naming, sharp settings, npm script, committed artifact) → Task 7.
- §6 engine wiring (URL source via getUrl, rename Placeholder→Intro, V14Experience, ?frames=procedural dev path) → Task 8.
- §7 reduced-motion (resolves to frame 179) + error handling (SP-0 engine already; missing dir degrades) → covered by SP-0; asserted Task 10.
- §8 verification (180-frame assertion, playwright universe + no 404s + monotonic + reduced-motion-final, SP-0 regression via procedural, unit green) → Tasks 7/9/10/11.
- §9 out-of-scope respected (no other beats, no MMonument deletion, no SP-2–4).
- Texture loading across packages (assets outside remotion) — addressed by Task 1's prep into `remotion/public/universe/` + Task 4's `delayRender` loader (directly mitigates MMonument's "blank early frames" failure).

**Placeholder scan:** no TBD/TODO; every code step has complete code; every run step has an expected result. Task 4 intentionally shows the final exact file content after explaining the disposal-closure fix (the engineer writes the final block).

**Type/name consistency:** `ASSET_MANIFEST` (Task 1) consumed in Tasks 2/5; `buildPanelField` (Task 2) → `FIELD` in Task 5; `cameraForFrame(frame,duration)` (Task 3) → Task 5 Scene; panel object shape `{id,kind,file,position,rotation,scale,drift}` produced in Task 2, consumed in Task 5; `useUniverseTexture(file)` (Task 4) → Task 5; source shape `{count,getUrl}` / `createProceduralSource` (Task 8) matches SP-0 engine + `window.__v14Debug` `{drawCount,frameIndex,count}` asserted Tasks 9/10; frame naming `frame-${pad3(i+1)}.webp` identical in Task 7 render, Task 7 test, Task 8 getUrl.
