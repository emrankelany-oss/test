# lenis.dev — animation patterns reverse-engineered

Devtools-level study of [lenis.dev](https://www.lenis.dev/) — what makes the page feel filmic, how the 3D hand moves with scroll, and how the kinetic typography is driven. Every pattern below is portable, not specific to this site.

## Tech stack identified

| Layer | Library / version |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Smooth scroll | **Lenis** — exposed on `window.lenis`, autoRaf disabled (they drive the RAF themselves) |
| 3D | **THREE.js r182** via **React Three Fiber** — single fullscreen `<canvas data-engine="three.js r182">` |
| Loader | `GLTFLoader` (used for two model files: `/models/arm.glb` + `/models/arm2.glb`) |
| Dev panel | **leva** — every material/light/transform param is tweakable (`@leva-ui/react`) |
| Scroll-React glue | A `useScroll` hook (callback form: `useScroll(({ scroll }) => { ... })`) — most likely from `@darkroom-engineering/hamo` (the studio behind Lenis) |
| Font | `panchang` from Fontshare |

## Page structure (35,106 px tall, ~39 viewports)

| Section | Scroll range | Effect |
|---|---|---|
| Hero | 0 → 900 | Blackletter "LENIS" wordmark + pink aurora particles (THREE shader points) + starfield |
| Why | 1,220 → 3,427 | Single sticky scene with text — has `data-lenis-scroll-snap-align="start"` |
| Rethink | 4,067 → 8,429 | Horizontal card scroll (cards 01–04) over the wireframe-pink **3D arm** model |
| Solution | 8,829 → 17,829 (10 viewports!) | Type-zoom — text scales 1→4×, second headline zooms in from 0→8.5×, white wipe transitions out. Driven by `--progress1` and `--progress2` |
| Featuring | 17,829 → 33,349 (17 viewports!) | Solid silver/metallic hand renders; feature cards stack in 3D as you scroll |
| In-use | 33,349 → 34,206 | Different hand pose (`arm2.glb` — fingers curling, pointing down); case-study list |

## The smooth-scroll foundation

```js
new Lenis({
  smoothWheel: true,
  syncTouch: true,
  syncTouchLerp: 0.075,
  touchInertiaExponent: 1.7,
  lerp: 0.1,                  // primary smoothing factor
  autoRaf: false,             // they drive the raf themselves
  anchors: false,
  // … defaults for the rest
})
```

Key: `autoRaf: false` means they pump Lenis from a single RAF that's shared with React Three Fiber's `useFrame` ticker — one clock for both, no drift.

Lenis instance is exposed at `window.lenis` (handy for debugging — `window.lenis.scrollTo(0)` works in the console).

## Pattern 1 — scroll-snap built into Lenis

```html
<section data-lenis-scroll-snap-align="start">…</section>
```

Lenis supports CSS-style scroll snap natively. Add `data-lenis-scroll-snap-align="start"` (or `center`/`end`) to any section and Lenis will snap to it after the user stops scrolling. No JS needed beyond initializing Lenis. The "Why" section uses this.

## Pattern 2 — CSS variable as a scroll progress driver

The "Solution" section is **9,000 px tall** (10 viewports). As you scroll through it, JS writes two custom properties inline on the `<section>`:

```html
<section class="solution" style="--progress1: 0.59; --progress2: 0">
```

Then CSS does everything else — no JS-side transforms:

```css
.solution .zoom {
  transform: scale(calc(1 + var(--progress1) * 3));         /* 1× → 4× */
}
.solution .first {
  transform: translateY(calc(var(--progress1) * -100%));    /* exits up */
}
.solution .enter {
  transform: translate(-50%, -50%) scale(calc(var(--progress1) * 8.5));
  transform-origin: 50% calc(50% - var(--progress1) * 25%);
  opacity: calc(var(--progress1) * 2);                       /* enters huge */
}
.solution .inner::after {
  transform: translateX(-50%) scaleX(var(--progress2));      /* wipe bar */
  background-color: currentColor;
}
```

Result: the first headline scales up + translates off-top while the second one zooms in from microscopic to viewport-filling. Then a horizontal wipe bar fills the section transitioning to the next section.

**Why this pattern is elegant**: animation values live in CSS, not JS. The JS only updates two numbers (`--progress1`, `--progress2`) per frame. Every CSS rule that needs the scroll value reads it via `var()` — zero React re-renders, zero layout thrash.

### How `--progress1/2` are computed

Section height = 10 × viewport. Lenis fires `useScroll(({ scroll }) => …)` each frame. Inside, JS computes:

```js
const sectionTop = section.offsetTop;
const sectionH   = section.offsetHeight;
const localScroll = scroll - sectionTop;            // 0 at section start
const t = localScroll / sectionH;                   // 0..1 across section
const progress1 = clamp01(remap(t, 0.00, 0.55));    // ramps over first 55%
const progress2 = clamp01(remap(t, 0.55, 1.00));    // ramps over remaining 45%
section.style.setProperty('--progress1', progress1);
section.style.setProperty('--progress2', progress2);
```

(They likely use Studio Freight's `remap` utility — same as the `mapRange` function in `@darkroom-engineering/utils`.)

## Pattern 3 — fullscreen R3F canvas, persistent across sections

The 3D scene is **one fullscreen `<canvas>`** (`position: fixed; inset: 0; z-index: 1` behind all DOM content). It's mounted once and persists through the entire page. Different sections position content over it.

```jsx
// page.jsx (roughly)
<>
  <Canvas style={{ position: 'fixed', inset: 0 }}>
    <Scene />
  </Canvas>
  <main>
    <HeroSection />
    <WhySection />
    <RethinkSection />
    <SolutionSection />
    <FeaturingSection />
    <InUseSection />
  </main>
</>
```

This means the hand isn't "in" a section — it's a 3D mesh in a global scene whose transform changes based on scroll. Same for the starfield. Same for the wireframe arm.

## Pattern 4 — the hand: two GLB models, swapped + transformed by scroll

Two files: `/models/arm.glb` and `/models/arm2.glb` (different poses — first one OK-sign, second one pointing-down).

```jsx
function Hand() {
  const { scene: arm  } = useGLTF('/models/arm.glb');
  const { scene: arm2 } = useGLTF('/models/arm2.glb');
  const [activeIdx, setActiveIdx] = useState(1);

  // Leva debug panel — let designers tweak in-browser
  const { color, roughness, metalness, wireframe } = useControls('material', {
    color: '#FF98A2',
    metalness: 1,
    roughness: 0.4,
    wireframe: true,
  });
  const { scale, position, rotation } = useControls('model', { scale: [...], position: [...], rotation: [...] });

  // Scene background flips at a threshold scroll value
  useScroll(({ scroll }) => {
    scene.background = new Color(scroll >= threshold['light-start'] ? '#efefef' : '#000000');
  });

  return activeIdx === 1 ? <primitive object={arm}  scale={…} … /> :
                            <primitive object={arm2} scale={…} … />;
}
```

The material is **wireframe `MeshStandardMaterial`** with the agency's pink (`#FF98A2`), `metalness: 1`, `roughness: 0.4`. That's what gives the abstract "neon-pink particle wisp" look in the Rethink section. In the Featuring section the material flips to solid (wireframe: false), revealing the polished metallic hand.

## Pattern 5 — `useScroll` hook to update shader uniforms

```jsx
// inside a shader-material'd <points> or <mesh>
const matRef = useRef();
useFrame((state) => { matRef.current.uTime.value = state.elapsedTime; });
useScroll(({ scroll }) => { matRef.current.uScroll.value = scroll; });
```

The starfield is a `<points>` mesh with a custom `ShaderMaterial` that reads:

```glsl
uniform float uTime;
uniform float uScroll;
uniform vec3  uColor;
uniform vec2  uResolution;
```

In the vertex shader, particle Y is offset by `uScroll * speed`, where `speed` varies per particle — that's how stars appear to drift past as you scroll, creating depth.

In the fragment shader, `uColor` controls the particle tint (pink `rgb(255, 207, 206)` by default).

## Pattern 6 — scene background switches at scroll thresholds

```js
const thresholds = { 'light-start': 17800 }; // in scroll px

useScroll(({ scroll }) => {
  scene.background.set(scroll >= thresholds['light-start'] ? '#efefef' : '#000000');
});
```

Plus DOM-level theme attribute:

```html
<body data-theme="dark">
<section data-theme="light"> <!-- featuring + in-use -->
```

Sections set their own theme via `data-theme`; the WebGL scene's background follows via a scroll threshold. CSS uses `[data-theme="light"]` selectors to flip text/border colors.

## Pattern 7 — horizontal-cards inside a sticky pinned section

In the Rethink section (4,362 px tall, ~4.8 viewports):

```css
.rethink-pin {
  position: sticky;
  top: 0;
  height: 100vh;
  overflow: hidden;
}
.rethink-track {
  display: flex;
  transform: translateX(calc(var(--progress) * -200vw)); /* or similar */
}
```

As you scroll vertically, `--progress` ramps from 0→1, the `.rethink-track` translates LEFT, and cards scroll horizontally through the viewport. The wireframe hand sits in the background, visible between cards.

## Pattern 8 — feature cards stacking in 3D

The Featuring section is **15,520 px tall** (~17 viewports). Inside, four feature cards (`01–04`) translate upward as you scroll, stacking on top of each other with slight rotation/offset, glass-morphism so the hand is visible through them.

Pattern:

```css
.feat-card {
  position: sticky;
  top: 80px;
  transform: translateY(calc((1 - var(--progress)) * 100vh));
}
```

Each card has its own `--progress` driven by its own slice of section scroll. Cards arrive sequentially.

## Pattern 9 — Lenis ticker shared with R3F

```js
// One frame loop drives Lenis + R3F + custom callbacks
const lenis = new Lenis({ autoRaf: false });
gsap.ticker.add((time) => lenis.raf(time * 1000));
// or, when using R3F's invalidate:
useFrame((state) => { lenis.raf(state.clock.elapsedTime * 1000); });
```

Why: without sharing the ticker, you'd have two RAFs running (Lenis + R3F), risking visible drift.

## Pattern 10 — the page-load animation (hero "LENIS" wordmark)

The blackletter "LENIS" appears with letters arriving from offscreen on initial load — likely a GSAP timeline or CSS keyframe triggered after font + GLB load. Wasn't measurable via static inspection.

## Asset inventory

| URL | Purpose |
|---|---|
| `/models/arm.glb` | Hand model — OK gesture |
| `/models/arm2.glb` | Hand model — pointing-down |
| `e20f2784f3f93682.css` | Page CSS with all the `var(--progress*)` rules |
| `2d4774e2fcf363fa.js` | Main app bundle (952 KB) — contains R3F scene + materials |
| Fontshare `panchang` | Display typeface |

## What I'd reuse on a project

1. **CSS-variable scroll driver** (Pattern 2) — single biggest gain. Move animation values out of JS and into CSS. JS writes one number, CSS does the math.
2. **Lenis + R3F ticker sharing** (Pattern 9) — eliminates frame drift between smooth scroll and 3D updates.
3. **`useScroll(({ scroll }) => uniform.value = scroll)`** (Pattern 5) — for any custom shader that needs scroll-reactive uniforms. Bypasses React entirely on the hot path.
4. **Persistent fullscreen R3F canvas** (Pattern 3) — better than mounting/unmounting canvases per section. The scene transforms; the canvas stays.
5. **Scene background + DOM theme flip at scroll threshold** (Pattern 6) — clean way to coordinate WebGL and DOM theming.
6. **`data-lenis-scroll-snap-align`** (Pattern 1) — free section snapping with zero JS.
7. **leva debug panel** — wrap every material property in `useControls` during dev. Designers can iterate without redeploys.

## Mental model

The whole site is **one fullscreen WebGL canvas** + **scrollable DOM content layered above it** + **one CSS variable that ramps with scroll, consumed by every animated rule**. Every animation is a function of one number: scroll position.

That's the entire trick.
