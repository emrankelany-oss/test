# Obsidian Hero (Relief-Lamp) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a reusable, OA-fidelity WebGL relief-lamp signature hero for `tma-web` whose centerpiece is a black-obsidian rocket booster engine with a glowing blue gem core.

**Architecture:** A framework-agnostic raw-WebGL class (verbatim port of Obsidian Assembly's `DynamicReliefLampEffect` 2-pass ping-pong relief pipeline) wrapped by a thin `"use client"` React module. The codebase's existing `SmoothScroll` component owns Lenis; the hero only reads the already-smoothed `window.scrollY` and feeds it to the engine and to a ported parallax transform. GSAP drives a per-character "decode" headline. Full `prefers-reduced-motion` static fallback.

**Tech Stack:** Next 16 (App Router) · React 19 · raw WebGL1 · `lenis` (via existing `SmoothScroll`) · `gsap` · `sharp` (asset prep) · Playwright + node:test.

**Spec:** `docs/superpowers/specs/2026-05-19-obsidian-hero-relief-lamp-design.md`
**Reference (shaders/formulas verbatim):** `docs/obsidian-assembly-study.md`, `docs/obsidian-assembly-parallax-section2.md`

---

## Conventions (read before starting)

- Working dir for all commands: `tma-web/` (i.e. `cd tma-web` first). Repo root is one level up.
- Branch is already `feat/obsidian-hero`.
- Page pattern (proven v12–v17): server `page.jsx` with `metadata` renders a `"use client"` experience; import via `@/...` alias. No `dynamic(ssr:false)` — client components guard `typeof window`.
- Unit tests: `test/*.test.mjs`, run with `npm test` (`node --test test/**/*.test.mjs`).
- E2E: `playwright/tests/*.spec.js`, run with `PLAYWRIGHT_BASE_URL=http://localhost:3000 npm run test:e2e -- <file>`. Dev server: `npm run dev`.
- Commit after every task. Do not sign-skip hooks. Commit message footer:
  `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>`
- AGENTS.md warns Next 16 differs from training data — follow the existing portfolio-vN page pattern exactly; do not invent new routing/config.

## File Structure

| File | Responsibility |
|---|---|
| `components/obsidian-hero/relief/parallax.js` | Pure parallax math (ported OA formula) — no DOM, unit-tested |
| `components/obsidian-hero/relief/shaders.js` | The 3 GLSL sources (vertex, sim, lighting) verbatim |
| `components/obsidian-hero/relief/ReliefLampEngine.js` | Raw-WebGL class: programs, ping-pong FBOs, RAF loop, lifecycle |
| `components/obsidian-hero/usePrefersReducedMotion.js` | Reduced-motion hook (module-local copy, matches v16 pattern) |
| `components/obsidian-hero/useReliefLamp.js` | Engine React lifecycle: create/destroy, RO/IO, listeners |
| `components/obsidian-hero/useScrollProgress.js` | Reads smoothed `window.scrollY` → progress + parallax transform + engine scroll |
| `components/obsidian-hero/DecodeHeadline.jsx` | GSAP per-char scramble-in headline |
| `components/obsidian-hero/ObsidianHero.jsx` | `"use client"` composition root |
| `components/obsidian-hero/obsidian-hero.css` | Scoped layout/type/scroll-cue styles |
| `app/obsidian-hero/page.jsx` | Demo/verification route (`/obsidian-hero`) |
| `public/assets/obsidian-engine.webp` | Web-optimized shader source texture (generated) |
| `public/assets/obsidian-engine-lqip.webp` | Tiny blurred fallback / reduced-motion still (generated) |
| `scripts/prep-obsidian-asset.mjs` | One-shot sharp script that produces the two webp files |
| `test/obsidian-parallax.test.mjs` | Unit tests for `parallax.js` |
| `playwright/tests/obsidian-hero.spec.js` | E2E: mount, parallax numeric, reduced-motion, teardown |

---

## Task 1: Asset preparation (web-optimized texture + LQIP)

**Files:**
- Create: `tma-web/scripts/prep-obsidian-asset.mjs`
- Input (already present): `tma-web/public/assets/obsidian-engine.jpg` (~7.5 MB master)
- Output: `tma-web/public/assets/obsidian-engine.webp`, `tma-web/public/assets/obsidian-engine-lqip.webp`

- [ ] **Step 1: Write the prep script**

Create `tma-web/scripts/prep-obsidian-asset.mjs`:

```js
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(root, "../public/assets/obsidian-engine.jpg");
const OUT = path.join(root, "../public/assets");

await sharp(SRC)
  .resize({ width: 2560, withoutEnlargement: true })
  .webp({ quality: 82 })
  .toFile(path.join(OUT, "obsidian-engine.webp"));

await sharp(SRC)
  .resize({ width: 24 })
  .blur(8)
  .webp({ quality: 50 })
  .toFile(path.join(OUT, "obsidian-engine-lqip.webp"));

console.log("obsidian asset prep: done");
```

- [ ] **Step 2: Run it**

Run: `cd tma-web && node scripts/prep-obsidian-asset.mjs`
Expected: prints `obsidian asset prep: done`; both webp files exist.

- [ ] **Step 3: Verify outputs**

Run: `cd tma-web && node -e "import('sharp').then(s=>Promise.all(['obsidian-engine.webp','obsidian-engine-lqip.webp'].map(f=>s.default('public/assets/'+f).metadata().then(m=>console.log(f,m.width+'x'+m.height,m.format)))))"`
Expected: `obsidian-engine.webp 2560x... webp` and `obsidian-engine-lqip.webp 24x... webp`.

- [ ] **Step 4: Commit**

```bash
cd tma-web && git add scripts/prep-obsidian-asset.mjs public/assets/obsidian-engine.webp public/assets/obsidian-engine-lqip.webp && git commit -m "chore(obsidian-hero): web-optimized engine texture + LQIP

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

Note: do NOT commit the 7.5 MB `obsidian-engine.jpg` master in this task; leave it untracked (it stays as the local regeneration master).

---

## Task 2: Parallax pure function (TDD)

The ported, verified OA formula: `a = sign · factor · vh · (progress − 0.5)`, clamped, disabled at viewport width ≤ 1024.

**Files:**
- Create: `tma-web/components/obsidian-hero/relief/parallax.js`
- Test: `tma-web/test/obsidian-parallax.test.mjs`

- [ ] **Step 1: Write the failing test**

Create `tma-web/test/obsidian-parallax.test.mjs`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { parallaxOffset, clamp01 } from "../components/obsidian-hero/relief/parallax.js";

test("clamp01 clamps to [0,1]", () => {
  assert.equal(clamp01(-0.3), 0);
  assert.equal(clamp01(0.42), 0.42);
  assert.equal(clamp01(1.7), 1);
});

test("zero at progress 0.5 (centered)", () => {
  assert.equal(parallaxOffset({ progress: 0.5, factor: 0.1, vh: 678, sign: 1 }), 0);
});

test("matches OA verified number: factor 0.1, vh 678 saturates at 33.9px", () => {
  assert.equal(
    Math.round(parallaxOffset({ progress: 1, factor: 0.1, vh: 678, sign: 1 }) * 10) / 10,
    33.9
  );
  assert.equal(
    Math.round(parallaxOffset({ progress: 0, factor: 0.1, vh: 678, sign: 1 }) * 10) / 10,
    -33.9
  );
});

test("progress is clamped (no overshoot past 1)", () => {
  const at1 = parallaxOffset({ progress: 1, factor: 0.1, vh: 678, sign: 1 });
  const past = parallaxOffset({ progress: 3.2, factor: 0.1, vh: 678, sign: 1 });
  assert.equal(at1, past);
});

test("sign flips direction", () => {
  const pos = parallaxOffset({ progress: 1, factor: 0.1, vh: 678, sign: 1 });
  const neg = parallaxOffset({ progress: 1, factor: 0.1, vh: 678, sign: -1 });
  assert.equal(pos, -neg);
});

test("disabled (returns 0) when viewport width <= 1024", () => {
  assert.equal(
    parallaxOffset({ progress: 1, factor: 0.1, vh: 678, sign: 1, viewportWidth: 1024 }),
    0
  );
  assert.notEqual(
    parallaxOffset({ progress: 1, factor: 0.1, vh: 678, sign: 1, viewportWidth: 1280 }),
    0
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd tma-web && node --test test/obsidian-parallax.test.mjs`
Expected: FAIL — cannot find module `parallax.js`.

- [ ] **Step 3: Write minimal implementation**

Create `tma-web/components/obsidian-hero/relief/parallax.js`:

```js
// Ported from Obsidian Assembly (docs/obsidian-assembly-parallax-section2.md).
// Desktop: a = sign * factor * vh * (progress - 0.5), progress clamped to [0,1].
// Disabled at viewport width <= 1024 (OA parity).

export function clamp01(x) {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

export function parallaxOffset({ progress, factor, vh, sign = 1, viewportWidth = 1280 }) {
  if (viewportWidth <= 1024) return 0;
  const p = clamp01(progress);
  return sign * factor * vh * (p - 0.5);
}

export function transform3d(px) {
  return `translate3d(0, ${px}px, 0)`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd tma-web && node --test test/obsidian-parallax.test.mjs`
Expected: PASS — all 6 tests.

- [ ] **Step 5: Commit**

```bash
cd tma-web && git add components/obsidian-hero/relief/parallax.js test/obsidian-parallax.test.mjs && git commit -m "feat(obsidian-hero): ported OA parallax math + unit tests

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Shader sources (verbatim from study)

**Files:**
- Create: `tma-web/components/obsidian-hero/relief/shaders.js`

- [ ] **Step 1: Create the shaders module**

Create `tma-web/components/obsidian-hero/relief/shaders.js`. Copy the three GLSL sources EXACTLY as documented in `docs/obsidian-assembly-study.md` (§2.1 Pass 1, Appendix A Pass 2) — do not modify the GLSL:

```js
// Verbatim from docs/obsidian-assembly-study.md. Do not edit the GLSL bodies.

export const VERT = `
  attribute vec2 a_position;
  varying vec2 v_uv;
  void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

export const SIM_FRAG = `
  precision mediump float;
  varying vec2 v_uv;
  uniform sampler2D u_prev;
  uniform sampler2D u_tex;
  uniform vec2 u_simRes;
  uniform vec2 u_resolution;
  uniform vec2 u_imgRes;
  uniform vec2 u_repeat;
  uniform float u_scrollY;
  uniform vec2 u_mouse;
  uniform float u_radius;
  uniform float u_rise;
  uniform float u_decay;
  uniform float u_spread;
  uniform float u_texBrightnessPower;
  uniform float u_texBrightnessMin;
  uniform float u_texBrightnessMax;
  float H(vec2 uv) { return texture2D(u_prev, uv).r; }
  float lum(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
  void main() {
    vec2 st = v_uv * u_simRes;
    float h = H(v_uv);
    vec2 texel = 1.0 / u_simRes;
    float hL = H(v_uv + vec2(-texel.x, 0.0));
    float hR = H(v_uv + vec2( texel.x, 0.0));
    float hU = H(v_uv + vec2(0.0, -texel.y));
    float hD = H(v_uv + vec2(0.0,  texel.y));
    float avg = (hL + hR + hU + hD) * 0.25;
    h = mix(h, avg, clamp(u_spread, 0.0, 1.0));
    h = max(h - u_decay, 0.0);
    float dist = distance(st, u_mouse);
    if (dist < u_radius) {
      vec2 screenPos = v_uv * u_resolution;
      float pageY = (u_resolution.y - screenPos.y) + u_scrollY;
      vec2 texUV = vec2(screenPos.x, pageY) / u_imgRes;
      texUV *= u_repeat;
      texUV = fract(texUV);
      vec3 texSample = texture2D(u_tex, texUV).rgb;
      float texBrightness = lum(texSample);
      texBrightness = pow(texBrightness, u_texBrightnessPower);
      float t = 1.0 - smoothstep(0.0, u_radius, dist);
      t = t * t * t;
      float texInfluence = mix(u_texBrightnessMin, u_texBrightnessMax, texBrightness);
      float riseAmount = u_rise * t * texInfluence;
      h = clamp(h + riseAmount, 0.0, 1.0);
    }
    gl_FragColor = vec4(h, 0.0, 0.0, 1.0);
  }
`;

export const LIGHT_FRAG = `
  precision mediump float;
  varying vec2 v_uv;
  uniform sampler2D u_height;
  uniform sampler2D u_tex;
  uniform vec2  u_resolution;
  uniform vec2  u_simRes;
  uniform vec2  u_imgRes;
  uniform float u_scrollY;
  uniform vec2  u_repeat;
  uniform vec3  u_lowColor;
  uniform vec3  u_highColor;
  uniform float u_minAlpha;
  uniform float u_reliefIntensity;
  uniform float u_parallax;
  uniform float u_baseAmbient;
  uniform float u_activeAmbient;
  uniform float u_diffuse;
  uniform float u_specular;
  uniform float u_shininess;
  uniform vec2 u_mouse;
  uniform float u_mouseLightHeight;
  uniform float u_mouseLightRadius;
  uniform float u_mouseLightIntensity;
  uniform float u_shadowStrength;
  uniform int u_hasImage;
  float lum(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
  vec3 calcNormal(vec2 uv, vec2 res, float intensity, float centerLum) {
    vec2 texel = 1.0 / res;
    float cx = lum(texture2D(u_tex, uv + vec2(texel.x, 0.0)).rgb) - centerLum;
    float cy = lum(texture2D(u_tex, uv + vec2(0.0, texel.y)).rgb) - centerLum;
    return normalize(vec3(-cx * intensity, -cy * intensity, 1.0));
  }
  vec3 calcHeightNormal(vec2 uv, vec2 res, float centerHeight) {
    vec2 texel = 1.0 / res;
    float cx = texture2D(u_height, uv + vec2(texel.x, 0.0)).r - centerHeight;
    float cy = texture2D(u_height, uv + vec2(0.0, texel.y)).r - centerHeight;
    return normalize(vec3(-cx * 20.0, -cy * 20.0, 1.0));
  }
  void main() {
    if (u_hasImage == 0) { gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); return; }
    float heightValue = texture2D(u_height, v_uv).r;
    float pageY = (u_resolution.y - gl_FragCoord.y) + u_scrollY;
    vec2 texUV = vec2(gl_FragCoord.x, pageY) / u_imgRes;
    texUV *= u_repeat;
    texUV = fract(texUV);
    vec3 baseSample = texture2D(u_tex, texUV).rgb;
    float texHeight = lum(baseSample);
    float combinedHeight = heightValue * texHeight;
    float heightT = clamp(combinedHeight, 0.0, 1.0);
    vec3 albedo = mix(u_lowColor, u_highColor, heightT);
    vec3 nTex = calcNormal(texUV, u_imgRes, u_reliefIntensity * combinedHeight, texHeight);
    vec3 nHeight = calcHeightNormal(v_uv, u_simRes, heightValue);
    vec3 combinedNormal = normalize(vec3(nTex.xy + nHeight.xy * combinedHeight, 1.0));
    vec2 parallaxUV = texUV + (combinedNormal.xy * (u_parallax / u_imgRes) * combinedHeight);
    parallaxUV = fract(parallaxUV);
    float parallaxLum = lum(texture2D(u_tex, parallaxUV).rgb);
    vec3 finalNormal = calcNormal(parallaxUV, u_imgRes, u_reliefIntensity * combinedHeight, parallaxLum);
    finalNormal = normalize(vec3(finalNormal.xy + nHeight.xy * combinedHeight, 1.0));
    const vec3 L = vec3(0.4472, 0.5367, 0.7155);
    const vec3 V = vec3(0.0, 0.0, 1.0);
    float fixedDiff = max(dot(finalNormal, L), 0.0);
    vec3 fixedR = reflect(-L, finalNormal);
    float fixedSpec = pow(max(dot(V, fixedR), 0.0), u_shininess);
    vec3 fixedLighting = combinedHeight * (u_diffuse * fixedDiff + u_specular * fixedSpec) * albedo;
    vec3 mouseLighting = vec3(0.0);
    if (u_mouse.x > -9000.0) {
      vec2 screenPos = gl_FragCoord.xy;
      vec3 mousePos3D = vec3(u_mouse.x, u_mouse.y, u_mouseLightHeight);
      vec3 surfacePos = vec3(screenPos, combinedHeight * u_reliefIntensity);
      vec3 toMouse = mousePos3D - surfacePos;
      float mouseDist = length(toMouse);
      vec3 mouseDir = normalize(toMouse);
      float mouseLightAttenuation = 1.0 - smoothstep(0.0, u_mouseLightRadius, mouseDist);
      float mouseLightNdotL = max(dot(finalNormal, mouseDir), 0.0);
      float shadow = 1.0;
      if (combinedHeight > 0.05) {
        float angleToLight = max(0.0, -mouseDir.z);
        float shadowAmount = combinedHeight * angleToLight * u_shadowStrength;
        shadow = 1.0 - (shadowAmount * mouseLightAttenuation);
        shadow = clamp(shadow, 0.2, 1.0);
      }
      float mouseDiff = mouseLightNdotL * u_diffuse * mouseLightAttenuation * u_mouseLightIntensity * shadow;
      vec3 mouseR = reflect(-mouseDir, finalNormal);
      float mouseSpec = pow(max(dot(V, mouseR), 0.0), u_shininess * 0.8) * u_specular * mouseLightAttenuation * u_mouseLightIntensity * shadow;
      mouseLighting = (mouseDiff + mouseSpec) * albedo;
    }
    float ambient = mix(u_baseAmbient, u_activeAmbient, combinedHeight);
    vec3 lit = albedo * ambient + fixedLighting + mouseLighting;
    vec3 color = mix(albedo, lit, combinedHeight);
    float alpha = mix(u_minAlpha, 1.0, smoothstep(0.0, 0.05, heightValue));
    gl_FragColor = vec4(color, alpha);
  }
`;
```

- [ ] **Step 2: Sanity check the module parses**

Run: `cd tma-web && node -e "import('./components/obsidian-hero/relief/shaders.js').then(m=>console.log('vert',m.VERT.length,'sim',m.SIM_FRAG.length,'light',m.LIGHT_FRAG.length))"`
Expected: three positive lengths printed (no syntax error).

- [ ] **Step 3: Commit**

```bash
cd tma-web && git add components/obsidian-hero/relief/shaders.js && git commit -m "feat(obsidian-hero): verbatim OA relief GLSL (vertex/sim/lighting)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: ReliefLampEngine (raw-WebGL class)

Verbatim-behavior port of the documented `DynamicReliefLampEffect`. Tuned for a single non-tiled image with a tight blue lamp.

**Files:**
- Create: `tma-web/components/obsidian-hero/relief/ReliefLampEngine.js`

- [ ] **Step 1: Write the engine class**

Create `tma-web/components/obsidian-hero/relief/ReliefLampEngine.js`:

```js
import { VERT, SIM_FRAG, LIGHT_FRAG } from "./shaders.js";

// Tuned defaults: single image (no tiling), tight intense blue lamp, near-black base.
const DEFAULTS = {
  radius: 240, riseSpeed: 0.25, decaySpeed: 0.015, spread: 0.32, simScale: 0.4,
  lowColor: [0.05, 0.06, 0.08], highColor: [0.45, 0.78, 0.95],
  backgroundColor: [0.03, 0.04, 0.05, 1],
  reliefIntensity: 28, parallax: 12, baseAmbient: 0.06, activeAmbient: 0.28,
  diffuse: 3.0, specular: 2.6, shininess: 28,
  textureBrightnessPower: 0.8, textureBrightnessMin: 0.3, textureBrightnessMax: 1,
  minAlpha: 0.0, mouseLightHeight: 140, mouseLightRadius: 220,
  mouseLightIntensity: 1.6, shadowStrength: 0.4,
  repeatX: 1, repeatY: 1, dprCap: 2,
};

export class ReliefLampEngine {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.options = { ...DEFAULTS, ...options };
    this.mouse = { x: -9999, y: -9999 };
    this.scrollY = 0;
    this.width = 0; this.height = 0;
    this.simW = 0; this.simH = 0;
    this.dpr = Math.min(window.devicePixelRatio || 1, this.options.dprCap);
    this.ping = 0;
    this.heightTex = []; this.heightFbo = [];
    this.imageTexture = null; this.imgRes = [1, 1]; this.hasImage = false;
    this.raf = 0; this.isPaused = false;
    this.loopTick = () => this.loop();

    const gl = canvas.getContext("webgl", {
      alpha: false, depth: false, antialias: false, premultipliedAlpha: false,
    });
    if (!gl) throw new Error("WebGL not supported");
    this.gl = gl;
    this.initGL();
  }

  compileShader(type, src) {
    const gl = this.gl;
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(s);
      gl.deleteShader(s);
      throw new Error("Shader compile failed: " + log);
    }
    return s;
  }

  linkProgram(vsSrc, fsSrc) {
    const gl = this.gl;
    const vs = this.compileShader(gl.VERTEX_SHADER, vsSrc);
    const fs = this.compileShader(gl.FRAGMENT_SHADER, fsSrc);
    const p = gl.createProgram();
    gl.attachShader(p, vs);
    gl.attachShader(p, fs);
    gl.bindAttribLocation(p, 0, "a_position");
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      const log = gl.getProgramInfoLog(p);
      gl.deleteProgram(p);
      throw new Error("Program link failed: " + log);
    }
    gl.deleteShader(vs); gl.deleteShader(fs);
    return p;
  }

  initGL() {
    const gl = this.gl;
    this.progUpdate = this.linkProgram(VERT, SIM_FRAG);
    this.progRender = this.linkProgram(VERT, LIGHT_FRAG);

    this.vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

    const u = (prog, name) => gl.getUniformLocation(prog, name);
    this.uUpdate = {
      prev: u(this.progUpdate, "u_prev"), tex: u(this.progUpdate, "u_tex"),
      simRes: u(this.progUpdate, "u_simRes"), resolution: u(this.progUpdate, "u_resolution"),
      imgRes: u(this.progUpdate, "u_imgRes"), repeat: u(this.progUpdate, "u_repeat"),
      scrollY: u(this.progUpdate, "u_scrollY"), mouse: u(this.progUpdate, "u_mouse"),
      radius: u(this.progUpdate, "u_radius"), rise: u(this.progUpdate, "u_rise"),
      decay: u(this.progUpdate, "u_decay"), spread: u(this.progUpdate, "u_spread"),
      tbp: u(this.progUpdate, "u_texBrightnessPower"),
      tbmin: u(this.progUpdate, "u_texBrightnessMin"),
      tbmax: u(this.progUpdate, "u_texBrightnessMax"),
    };
    this.uRender = {
      height: u(this.progRender, "u_height"), tex: u(this.progRender, "u_tex"),
      resolution: u(this.progRender, "u_resolution"), simRes: u(this.progRender, "u_simRes"),
      imgRes: u(this.progRender, "u_imgRes"), scrollY: u(this.progRender, "u_scrollY"),
      repeat: u(this.progRender, "u_repeat"),
      lowColor: u(this.progRender, "u_lowColor"), highColor: u(this.progRender, "u_highColor"),
      minAlpha: u(this.progRender, "u_minAlpha"),
      reliefIntensity: u(this.progRender, "u_reliefIntensity"),
      parallax: u(this.progRender, "u_parallax"),
      baseAmbient: u(this.progRender, "u_baseAmbient"),
      activeAmbient: u(this.progRender, "u_activeAmbient"),
      diffuse: u(this.progRender, "u_diffuse"), specular: u(this.progRender, "u_specular"),
      shininess: u(this.progRender, "u_shininess"), mouse: u(this.progRender, "u_mouse"),
      mlh: u(this.progRender, "u_mouseLightHeight"),
      mlr: u(this.progRender, "u_mouseLightRadius"),
      mli: u(this.progRender, "u_mouseLightIntensity"),
      shadow: u(this.progRender, "u_shadowStrength"),
      hasImage: u(this.progRender, "u_hasImage"),
    };

    const [r, g, b, a] = this.options.backgroundColor;
    gl.clearColor(r, g, b, a);
    gl.disable(gl.DEPTH_TEST);
  }

  createHeightTarget(w, h) {
    const gl = this.gl;
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    return { tex, fbo };
  }

  allocTargets() {
    const gl = this.gl;
    for (const t of this.heightTex) gl.deleteTexture(t);
    for (const f of this.heightFbo) gl.deleteFramebuffer(f);
    this.heightTex = []; this.heightFbo = [];
    this.simW = Math.max(2, Math.floor(this.width * this.options.simScale));
    this.simH = Math.max(2, Math.floor(this.height * this.options.simScale));
    for (let i = 0; i < 2; i++) {
      const { tex, fbo } = this.createHeightTarget(this.simW, this.simH);
      this.heightTex.push(tex); this.heightFbo.push(fbo);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  resize(cssW, cssH) {
    const w = Math.max(1, Math.floor(cssW));
    const h = Math.max(1, Math.floor(cssH));
    this.width = Math.floor(w * this.dpr);
    this.height = Math.floor(h * this.dpr);
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.canvas.style.width = w + "px";
    this.canvas.style.height = h + "px";
    this.allocTargets();
  }

  setImage(url) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => {
      const gl = this.gl;
      if (this.imageTexture) gl.deleteTexture(this.imageTexture);
      this.imageTexture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.imageTexture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      this.imgRes = [img.naturalWidth, img.naturalHeight];
      this.hasImage = true;
    };
    img.onerror = () => { this.hasImage = false; };
    img.src = url;
  }

  setScroll(y) { this.scrollY = y; }
  setMouse(x, y) { this.mouse.x = x; this.mouse.y = y; }
  clearMouse() { this.mouse.x = -9999; this.mouse.y = -9999; }

  start() { if (!this.raf) this.raf = requestAnimationFrame(this.loopTick); }
  pause() { this.isPaused = true; if (this.raf) { cancelAnimationFrame(this.raf); this.raf = 0; } }
  resume() { if (this.isPaused) { this.isPaused = false; if (!this.raf) this.raf = requestAnimationFrame(this.loopTick); } }

  loop() {
    this.raf = 0;
    if (this.isPaused) return;
    const gl = this.gl;
    const o = this.options;
    const i = this.ping, t = 1 - this.ping;

    // --- Sim pass ---
    gl.useProgram(this.progUpdate);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.heightFbo[t]);
    gl.viewport(0, 0, this.simW, this.simH);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.heightTex[i]);
    gl.uniform1i(this.uUpdate.prev, 0);
    if (this.hasImage) {
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.imageTexture);
      gl.uniform1i(this.uUpdate.tex, 1);
    }
    const mx = this.mouse.x * this.dpr * (this.simW / this.width);
    const my = (this.height - this.mouse.y * this.dpr) * (this.simH / this.height);
    gl.uniform2f(this.uUpdate.simRes, this.simW, this.simH);
    gl.uniform2f(this.uUpdate.resolution, this.width, this.height);
    gl.uniform2f(this.uUpdate.imgRes, this.imgRes[0], this.imgRes[1]);
    gl.uniform2f(this.uUpdate.repeat, o.repeatX, o.repeatY);
    gl.uniform1f(this.uUpdate.scrollY, this.scrollY * this.dpr);
    gl.uniform2f(this.uUpdate.mouse, mx, my);
    gl.uniform1f(this.uUpdate.radius, o.radius * this.options.simScale);
    gl.uniform1f(this.uUpdate.rise, o.riseSpeed);
    gl.uniform1f(this.uUpdate.decay, o.decaySpeed);
    gl.uniform1f(this.uUpdate.spread, o.spread);
    gl.uniform1f(this.uUpdate.tbp, o.textureBrightnessPower);
    gl.uniform1f(this.uUpdate.tbmin, o.textureBrightnessMin);
    gl.uniform1f(this.uUpdate.tbmax, o.textureBrightnessMax);
    this.drawQuad(this.progUpdate);

    // --- Lighting pass ---
    gl.useProgram(this.progRender);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.width, this.height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.heightTex[t]);
    gl.uniform1i(this.uRender.height, 0);
    if (this.hasImage) {
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.imageTexture);
      gl.uniform1i(this.uRender.tex, 1);
    }
    gl.uniform2f(this.uRender.resolution, this.width, this.height);
    gl.uniform2f(this.uRender.simRes, this.simW, this.simH);
    gl.uniform2f(this.uRender.imgRes, this.imgRes[0], this.imgRes[1]);
    gl.uniform1f(this.uRender.scrollY, this.scrollY * this.dpr);
    gl.uniform2f(this.uRender.repeat, o.repeatX, o.repeatY);
    gl.uniform3fv(this.uRender.lowColor, o.lowColor);
    gl.uniform3fv(this.uRender.highColor, o.highColor);
    gl.uniform1f(this.uRender.minAlpha, o.minAlpha);
    gl.uniform1f(this.uRender.reliefIntensity, o.reliefIntensity);
    gl.uniform1f(this.uRender.parallax, o.parallax);
    gl.uniform1f(this.uRender.baseAmbient, o.baseAmbient);
    gl.uniform1f(this.uRender.activeAmbient, o.activeAmbient);
    gl.uniform1f(this.uRender.diffuse, o.diffuse);
    gl.uniform1f(this.uRender.specular, o.specular);
    gl.uniform1f(this.uRender.shininess, o.shininess);
    gl.uniform2f(this.uRender.mouse, this.mouse.x * this.dpr, this.height - this.mouse.y * this.dpr);
    gl.uniform1f(this.uRender.mlh, o.mouseLightHeight);
    gl.uniform1f(this.uRender.mlr, o.mouseLightRadius);
    gl.uniform1f(this.uRender.mli, o.mouseLightIntensity);
    gl.uniform1f(this.uRender.shadow, o.shadowStrength);
    gl.uniform1i(this.uRender.hasImage, this.hasImage ? 1 : 0);
    this.drawQuad(this.progRender);

    this.ping = t;
    this.raf = requestAnimationFrame(this.loopTick);
  }

  drawQuad(prog) {
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    const loc = gl.getAttribLocation(prog, "a_position");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  destroy() {
    this.pause();
    const gl = this.gl;
    if (this.imageTexture) gl.deleteTexture(this.imageTexture);
    for (const t of this.heightTex) gl.deleteTexture(t);
    for (const f of this.heightFbo) gl.deleteFramebuffer(f);
    if (this.vbo) gl.deleteBuffer(this.vbo);
    if (this.progUpdate) gl.deleteProgram(this.progUpdate);
    if (this.progRender) gl.deleteProgram(this.progRender);
    const ext = gl.getExtension("WEBGL_lose_context");
    if (ext) ext.loseContext();
  }
}
```

- [ ] **Step 2: Smoke-test construction in a browser context**

This class needs WebGL; defer behavioral verification to the Playwright task (Task 10). Here only static-check it imports:

Run: `cd tma-web && node -e "import('./components/obsidian-hero/relief/ReliefLampEngine.js').then(()=>console.log('engine module ok'))"`
Expected: prints `engine module ok` (module parses; constructor not called server-side).

- [ ] **Step 3: Commit**

```bash
cd tma-web && git add components/obsidian-hero/relief/ReliefLampEngine.js && git commit -m "feat(obsidian-hero): raw-WebGL ReliefLampEngine (ported OA pipeline)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Reduced-motion hook + engine React lifecycle hook

**Files:**
- Create: `tma-web/components/obsidian-hero/usePrefersReducedMotion.js`
- Create: `tma-web/components/obsidian-hero/useReliefLamp.js`

- [ ] **Step 1: Create the reduced-motion hook**

Create `tma-web/components/obsidian-hero/usePrefersReducedMotion.js` (same contract as `components/portfolio-v16/usePrefersReducedMotion.js`):

```js
"use client";
import { useEffect, useState } from "react";

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}
```

- [ ] **Step 2: Create the engine lifecycle hook**

Create `tma-web/components/obsidian-hero/useReliefLamp.js`:

```js
"use client";
import { useEffect, useRef } from "react";
import { ReliefLampEngine } from "./relief/ReliefLampEngine.js";

// Owns the engine for the lifetime of the canvas. No-ops entirely when disabled
// (reduced motion / failure). Returns a ref to attach to a <canvas>.
export function useReliefLamp({ imageSrc, disabled, onFail }) {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);

  useEffect(() => {
    if (disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    let engine;
    try {
      engine = new ReliefLampEngine(canvas);
    } catch (e) {
      console.warn("[ObsidianHero] WebGL unavailable:", e.message);
      onFail && onFail();
      return;
    }
    engineRef.current = engine;

    const wrap = canvas.parentElement || canvas;
    const measure = () => {
      const r = wrap.getBoundingClientRect();
      engine.resize(Math.max(1, r.width), Math.max(1, r.height));
    };
    measure();
    engine.setImage(imageSrc);
    engine.start();

    let roRaf = 0;
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(roRaf);
      roRaf = requestAnimationFrame(measure);
    });
    ro.observe(wrap);

    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (e && e.isIntersecting && e.intersectionRatio > 0) engine.resume();
        else engine.pause();
      },
      { threshold: [0, 0.01] }
    );
    io.observe(wrap);

    const onMove = (ev) => engine.setMouse(ev.clientX, ev.clientY);
    const onLeave = () => engine.clearMouse();
    const onTouch = (ev) => {
      if (ev.touches && ev.touches.length) engine.setMouse(ev.touches[0].clientX, ev.touches[0].clientY);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseleave", onLeave, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });
    window.addEventListener("touchend", onLeave, { passive: true });

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("touchend", onLeave);
      io.disconnect();
      ro.disconnect();
      cancelAnimationFrame(roRaf);
      engine.destroy();
      engineRef.current = null;
    };
  }, [imageSrc, disabled, onFail]);

  return { canvasRef, engineRef };
}
```

- [ ] **Step 3: Static check both modules import**

Run: `cd tma-web && node -e "Promise.all([import('./components/obsidian-hero/usePrefersReducedMotion.js'),import('./components/obsidian-hero/useReliefLamp.js')]).then(()=>console.log('hooks ok'))"`
Expected: prints `hooks ok`.

- [ ] **Step 4: Commit**

```bash
cd tma-web && git add components/obsidian-hero/usePrefersReducedMotion.js components/obsidian-hero/useReliefLamp.js && git commit -m "feat(obsidian-hero): reduced-motion + engine lifecycle hooks

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: useScrollProgress (smoothed scroll → progress + parallax + engine)

Reads the already-Lenis-smoothed `window.scrollY` in one RAF, computes element progress, applies the parallax transform to a target element, and forwards scroll to the engine. No Lenis ownership (the page's `SmoothScroll` owns it).

**Files:**
- Create: `tma-web/components/obsidian-hero/useScrollProgress.js`

- [ ] **Step 1: Write the hook**

Create `tma-web/components/obsidian-hero/useScrollProgress.js`:

```js
"use client";
import { useEffect } from "react";
import { parallaxOffset, transform3d } from "./relief/parallax.js";

// One RAF owner. sectionRef = the hero section (defines progress range:
// progress 0 when its top hits viewport bottom, 1 when its bottom hits viewport top).
// captionRef = element that receives the parallax transform.
// onScroll(y) = forward smoothed scroll to the engine.
export function useScrollProgress({ sectionRef, captionRef, onScroll, factor = 0.1, disabled }) {
  useEffect(() => {
    if (disabled) return;
    let raf = 0;
    let lastY = -1;
    let lastT = "";

    const frame = () => {
      const y = window.scrollY || 0;
      if (y !== lastY) {
        lastY = y;
        if (onScroll) onScroll(y);
        const section = sectionRef.current;
        const cap = captionRef.current;
        if (section && cap) {
          const r = section.getBoundingClientRect();
          const vh = window.innerHeight || 1;
          // progress: 0 when section top at viewport bottom, 1 when section bottom at top
          const total = r.height + vh;
          const progress = (vh - r.top) / total;
          const px = parallaxOffset({
            progress, factor, vh, sign: 1, viewportWidth: window.innerWidth || 1280,
          });
          const tf = transform3d(Math.round(px * 100) / 100);
          if (tf !== lastT) { cap.style.transform = tf; lastT = tf; } // epsilon dedupe
        }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [sectionRef, captionRef, onScroll, factor, disabled]);
}
```

- [ ] **Step 2: Static check**

Run: `cd tma-web && node -e "import('./components/obsidian-hero/useScrollProgress.js').then(()=>console.log('scroll hook ok'))"`
Expected: prints `scroll hook ok`.

- [ ] **Step 3: Commit**

```bash
cd tma-web && git add components/obsidian-hero/useScrollProgress.js && git commit -m "feat(obsidian-hero): smoothed-scroll progress + ported parallax application

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: DecodeHeadline (GSAP per-char scramble-in)

**Files:**
- Create: `tma-web/components/obsidian-hero/DecodeHeadline.jsx`

- [ ] **Step 1: Write the component**

Create `tma-web/components/obsidian-hero/DecodeHeadline.jsx`:

```jsx
"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&*+/<>";

export default function DecodeHeadline({ text, className = "", reducedMotion = false }) {
  const rootRef = useRef(null);

  useEffect(() => {
    if (reducedMotion) return;
    const root = rootRef.current;
    if (!root) return;
    const spans = Array.from(root.querySelectorAll("[data-ch]"));
    const ctx = gsap.context(() => {
      spans.forEach((span) => {
        const finalCh = span.dataset.ch;
        if (finalCh === " ") return;
        const delay = Math.random() * 0.5;
        const scrambleEnd = delay + 0.35 + Math.random() * 0.35;
        const obj = { t: 0 };
        gsap.to(obj, {
          t: 1,
          duration: scrambleEnd,
          delay,
          ease: "none",
          onUpdate: () => {
            span.textContent =
              obj.t >= 1 ? finalCh : GLYPHS[(Math.random() * GLYPHS.length) | 0];
          },
          onComplete: () => { span.textContent = finalCh; },
        });
      });
    }, root);
    return () => ctx.revert();
  }, [text, reducedMotion]);

  return (
    <h1 ref={rootRef} className={className} aria-label={text}>
      {text.split("").map((ch, i) => (
        <span key={i} data-ch={ch} aria-hidden="true">
          {reducedMotion ? ch : ch === " " ? " " : ch}
        </span>
      ))}
    </h1>
  );
}
```

- [ ] **Step 2: Static check**

Run: `cd tma-web && node -e "import('./components/obsidian-hero/DecodeHeadline.jsx').then(()=>console.log('headline ok')).catch(e=>{console.log('expected jsx parse note:',e.code||e.message)})"`
Expected: either `headline ok` or a JSX-loader note (Node can't parse JSX directly — acceptable; Next/Babel compiles it). The real check is the build in Task 9.

- [ ] **Step 3: Commit**

```bash
cd tma-web && git add components/obsidian-hero/DecodeHeadline.jsx && git commit -m "feat(obsidian-hero): GSAP per-char decode headline

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: ObsidianHero composition + CSS

**Files:**
- Create: `tma-web/components/obsidian-hero/obsidian-hero.css`
- Create: `tma-web/components/obsidian-hero/ObsidianHero.jsx`

- [ ] **Step 1: Write the CSS**

Create `tma-web/components/obsidian-hero/obsidian-hero.css`:

```css
.oh-root { position: relative; min-height: 100vh; background: #060708; color: #f4f4f1; overflow: hidden; }
.oh-canvas-wrap { position: absolute; inset: 0; z-index: 0; }
.oh-canvas-wrap canvas { display: block; width: 100%; height: 100%; }
.oh-fallback { position: absolute; inset: 0; z-index: 0; width: 100%; height: 100%; object-fit: cover; }
.oh-content { position: relative; z-index: 1; min-height: 100vh; display: flex; flex-direction: column; justify-content: space-between; padding: clamp(20px, 4vw, 64px); pointer-events: none; }
.oh-eyebrow { font-family: var(--mono, ui-monospace, monospace); font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; opacity: 0.7; }
.oh-headline { font-family: var(--display, "Inter Tight", serif); font-size: clamp(48px, 11vw, 168px); line-height: 0.92; font-weight: 500; letter-spacing: -0.02em; margin: 0; }
.oh-headline span { display: inline-block; white-space: pre; }
.oh-footer { display: flex; justify-content: space-between; align-items: flex-end; gap: 24px; }
.oh-caption { font-family: var(--mono, ui-monospace, monospace); font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; opacity: 0.75; will-change: transform; }
.oh-cue { font-family: var(--mono, ui-monospace, monospace); font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; opacity: 0.6; transition: opacity 0.4s ease; }
.oh-root[data-scrolled="true"] .oh-cue { opacity: 0; }
@media (prefers-reduced-motion: reduce) { .oh-caption { transform: none !important; } }
```

- [ ] **Step 2: Write the composition root**

Create `tma-web/components/obsidian-hero/ObsidianHero.jsx`:

```jsx
"use client";
import "./obsidian-hero.css";
import { useCallback, useRef, useState } from "react";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion.js";
import { useReliefLamp } from "./useReliefLamp.js";
import { useScrollProgress } from "./useScrollProgress.js";
import DecodeHeadline from "./DecodeHeadline.jsx";

export default function ObsidianHero({
  headline = "Motion in every frame",
  caption = "The Motion Agency — Reel 2026",
  eyebrow = "The Motion Agency",
  imageSrc = "/assets/obsidian-engine.webp",
  fallbackSrc = "/assets/obsidian-engine-lqip.webp",
  parallaxFactor = 0.1,
  className = "",
}) {
  const reduced = usePrefersReducedMotion();
  const [failed, setFailed] = useState(false);
  const onFail = useCallback(() => setFailed(true), []);
  const disabled = reduced || failed;

  const sectionRef = useRef(null);
  const captionRef = useRef(null);
  const { canvasRef, engineRef } = useReliefLamp({ imageSrc, disabled, onFail });

  const onScroll = useCallback(
    (y) => {
      if (engineRef.current) engineRef.current.setScroll(y);
      if (sectionRef.current) {
        sectionRef.current.dataset.scrolled = y > 40 ? "true" : "false";
      }
    },
    [engineRef]
  );

  useScrollProgress({ sectionRef, captionRef, onScroll, factor: parallaxFactor, disabled });

  return (
    <section ref={sectionRef} className={`oh-root ${className}`} data-scrolled="false">
      {disabled ? (
        <img className="oh-fallback" src={imageSrc} alt="" aria-hidden="true" />
      ) : (
        <div className="oh-canvas-wrap">
          <canvas ref={canvasRef} />
        </div>
      )}
      <div className="oh-content">
        <p className="oh-eyebrow">{eyebrow}</p>
        <div>
          <DecodeHeadline text={headline} className="oh-headline" reducedMotion={disabled} />
          <div className="oh-footer">
            <p ref={captionRef} className="oh-caption">{caption}</p>
            <p className="oh-cue">Scroll to enter</p>
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Commit**

```bash
cd tma-web && git add components/obsidian-hero/obsidian-hero.css components/obsidian-hero/ObsidianHero.jsx && git commit -m "feat(obsidian-hero): composition root + scoped styles + fallback

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: Demo route + build verification

**Files:**
- Create: `tma-web/app/obsidian-hero/page.jsx`

- [ ] **Step 1: Create the route (follows the v16 page pattern exactly)**

Create `tma-web/app/obsidian-hero/page.jsx`:

```jsx
import ObsidianHero from "@/components/obsidian-hero/ObsidianHero";

export const metadata = {
  title: "Obsidian Hero — The Motion Agency",
  description:
    "WebGL relief-lamp signature hero: an obsidian booster engine with a blue gem core, lit by the cursor.",
};

export default function ObsidianHeroPage() {
  return (
    <main>
      <ObsidianHero />
      <section style={{ height: "120vh", background: "#060708" }} aria-hidden="true" />
    </main>
  );
}
```

(The trailing spacer section gives scroll range so the parallax/engine scroll are verifiable. `SmoothScroll` is not added here — the hero reads native/smoothed `window.scrollY` and works with or without it; hosts that want inertial scroll add their own `<SmoothScroll/>`.)

- [ ] **Step 2: Build to verify the whole module compiles under Next 16**

Run: `cd tma-web && npm run build`
Expected: build succeeds; output lists the `/obsidian-hero` route. If the build complains about Next 16 specifics, consult `node_modules/next/dist/docs/` (per AGENTS.md) and fix without changing the module's public API.

- [ ] **Step 3: Manual visual check**

Run: `cd tma-web && npm run dev` then open `http://localhost:3000/obsidian-hero`.
Expected: near-black canvas; moving the cursor wipes the obsidian engine + blue gem out of the dark (relief lamp); headline scrambles in on load; scrolling drifts the caption and the relief tracks scroll; the "Scroll to enter" cue fades after scrolling.

- [ ] **Step 4: Commit**

```bash
cd tma-web && git add app/obsidian-hero/page.jsx && git commit -m "feat(obsidian-hero): /obsidian-hero demo route

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 10: E2E tests (mount, parallax numeric, reduced-motion, teardown)

**Files:**
- Create: `tma-web/playwright/tests/obsidian-hero.spec.js`

- [ ] **Step 1: Write the spec**

Create `tma-web/playwright/tests/obsidian-hero.spec.js`:

```js
import { test, expect } from "@playwright/test";

const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
const URL = BASE.replace(/\/$/, "") + "/obsidian-hero";

test("canvas mounts and acquires a WebGL context", async ({ page }) => {
  await page.goto(URL);
  const canvas = page.locator(".oh-canvas-wrap canvas");
  await expect(canvas).toBeVisible();
  const hasGL = await canvas.evaluate((c) => {
    const gl = c.getContext("webgl");
    return !!gl;
  });
  expect(hasGL).toBe(true);
});

test("parallax matches a = factor*vh*(progress-0.5), clamped", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(URL);
  const cap = page.locator(".oh-caption");
  await expect(cap).toBeVisible();

  const readY = async () =>
    cap.evaluate((el) => {
      const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
      return Math.round(m.m42 * 10) / 10;
    });

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(120);
  const yTop = await readY();

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(200);
  const yBottom = await readY();

  // factor 0.1, vh 900 → saturates at ±0.1*900*0.5 = ±45px. Direction: + at bottom.
  expect(yBottom).toBeGreaterThan(yTop);
  expect(Math.abs(yBottom)).toBeLessThanOrEqual(45 + 0.5);
});

test("reduced-motion: static image, no canvas", async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.goto(URL);
  await expect(page.locator(".oh-fallback")).toBeVisible();
  await expect(page.locator(".oh-canvas-wrap canvas")).toHaveCount(0);
  await ctx.close();
});

test("unmount leaves no WebGL context leak (navigation away)", async ({ page }) => {
  await page.goto(URL);
  await expect(page.locator(".oh-canvas-wrap canvas")).toBeVisible();
  await page.goto(BASE.replace(/\/$/, "") + "/");
  await expect(page.locator(".oh-canvas-wrap canvas")).toHaveCount(0);
});
```

- [ ] **Step 2: Run the e2e suite against local dev**

In one shell: `cd tma-web && npm run dev`
In another: `cd tma-web && PLAYWRIGHT_BASE_URL=http://localhost:3000 npm run test:e2e -- obsidian-hero.spec.js`
Expected: 4 tests PASS. (If the parallax sign is inverted vs. expectation, flip `sign` in `ObsidianHero`'s `useScrollProgress` call — do not change `parallax.js`.)

- [ ] **Step 3: Commit**

```bash
cd tma-web && git add playwright/tests/obsidian-hero.spec.js && git commit -m "test(obsidian-hero): e2e mount/parallax/reduced-motion/teardown

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 11: Final verification & docs pointer

- [ ] **Step 1: Full unit suite**

Run: `cd tma-web && npm test`
Expected: all tests pass, including `obsidian-parallax.test.mjs`.

- [ ] **Step 2: Production build**

Run: `cd tma-web && npm run build`
Expected: success, `/obsidian-hero` listed.

- [ ] **Step 3: Add a usage note to the spec**

Append to `docs/superpowers/specs/2026-05-19-obsidian-hero-relief-lamp-design.md`:

```markdown

## Implemented

Module at `tma-web/components/obsidian-hero/`. Usage:
`import ObsidianHero from "@/components/obsidian-hero/ObsidianHero"` then
`<ObsidianHero headline="…" caption="…" />`. Demo: `/obsidian-hero`.
For inertial scroll, render `<SmoothScroll/>` (from `@/components/portfolio/SmoothScroll`) on the host page.
```

- [ ] **Step 4: Commit**

```bash
cd .. && git add docs/superpowers/specs/2026-05-19-obsidian-hero-relief-lamp-design.md && git commit -m "docs(obsidian-hero): implemented usage note

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Self-Review (completed by plan author)

**Spec coverage:** §5 architecture → Tasks 3–9 (every file mapped). §6 components/interfaces → Tasks 4–8 (engine API, props, hooks all implemented as specified). §7 data flow → Tasks 5,6,8 (one scroll value → engine + caption; IO pause; passive mouse). §8 fallback → Task 8 (`failed`/`reduced` → static image) + Task 10 (reduced-motion e2e). §9 asset prep → Task 1. §10 risks: Lenis ownership resolved (Task 6 reads `window.scrollY`, owns no Lenis; Task 9 note) ; ping-pong WebGL1 RGBA8 setup explicit (Task 4 `createHeightTarget`); Next 16 client pattern follows v16 (Tasks 8,9); LQIP/dpr cap (Tasks 1,4). §11 testing → Tasks 2 (unit) + 10 (e2e). All spec sections have tasks.

**Placeholder scan:** No TBD/TODO; every code step contains full code; commands have expected output. The only deferred decision (parallax sign) has an explicit conditional instruction in Task 10 Step 2.

**Type consistency:** Engine API consistent across tasks — `setScroll`, `setMouse`, `clearMouse`, `resize`, `start`, `pause`, `resume`, `destroy` defined in Task 4 and called with those exact names in Tasks 5,8. `parallaxOffset`/`transform3d`/`clamp01` defined in Task 2, imported in Task 6. `useReliefLamp` returns `{canvasRef, engineRef}` (Task 5) consumed identically in Task 8. `usePrefersReducedMotion` named export used in Task 8. Props defaults in Task 8 match spec §6.
