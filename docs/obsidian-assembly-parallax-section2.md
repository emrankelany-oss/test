# Study II: Obsidian Assembly — Section 2 (Places) Transitions, Animation & Parallax

> Deep follow-up to `obsidian-assembly-study.md`, focused on the **second section after
> the hero** (`.c-places`, the "Explore Places" pinned sequence) and the engine that
> drives its transitions, animations and parallax. All formulas below are extracted
> verbatim from `entry.6ece3b7b.js` / `index.d0184b9b.js` and **numerically verified
> live**.

---

## 0. TL;DR — what section 2 actually is

The second section is **not a free carousel**. It is a **scroll-scrubbed, pinned image
sequence** built from declarative HTML attributes, all reading **one** smoothed scroll
value per frame:

- A bespoke **virtual smooth-scroll** (wheel hijacked, position lerped at `0.1`/`0.25`)
  produces a single `scroll.current`.
- A bespoke **ScrollTrigger-equivalent** turns each tracked element into an *Object*
  with a `progress` (0→1) computed from its enter/exit viewport anchors.
- That progress drives, in lockstep: the **parallax** of the caption, the **crossfade
  sequence** of the 7 office photos, the **WebGL relief** lighting, an **SVG path**, a
  **conic progress ring**, and `-inview` reveal classes.
- A 6 s **auto-advance** timer with a draining ring runs when idle, pauses on hover.
- Everything is computed in a **measure phase** and written in a **batched mutate
  phase** (FastDOM split) — the reason it never jank-scrolls.

---

## 1. The bespoke scroll engine (the "smoothness")

It's a Lenis/Locomotive-class engine, hand-built, structured as a **module system** with
a strict lifecycle the core broadcasts every frame:

```
onInit · onFrame · onScrollMeasure · onMouseMoveMeasure · onMutate · onScroll
onResize · onWheel · onDirectionChange · onScrollStart · onScrollStop · onAxisChange …
```

### 1.1 Scroll state model (verbatim defaults)

```js
scroll = {
  target:0, current:0, transformedCurrent:0, delta:0, lerped:0, displacement:0,
  isScrollingDown:false, topPosition:0, bottomPosition:0, direction:"vertical",
  mode:"smooth", modeMobile:"smooth", modeDesktop:"smooth",
  speed: 0.1,            // ← lerp coefficient at rest  (heavy / "premium")
  speedAccelerate: 0.25  // ← lerp coefficient while actively flicking
}
viewport = { windowWidth, windowHeight, contentWidth, contentHeight,
             scaleWidth:1, scaleHeight:1, transformScale:1, baseRem:16 }
cursor   = { targetX,targetY, smoothedX,smoothedY, stepX,stepY, velocityX,velocityY }
time     = { now, previous, delta, elapsed }   // frame-delta aware
```

### 1.2 How the smoothing works

- **Wheel is hijacked**: `onWheel` → `e.preventDefault(); wheelImpulse = e.deltaY` → fed
  into `scroll.delta`. The page is *not* natively scrolled in smooth mode; content is
  translated by `scroll.transformedCurrent` (`= current * viewport.transformScale`).
- Each `onFrame`, a `step()` integrates `(current, target, delta, speed,
  speedAccelerate, …)` → new `current`. Conceptually a **lerp toward target**:
  `current += (target − current) * speed`, with `speed` swapped to `speedAccelerate`
  while accelerating. `0.1` ≈ catches up over ~10+ frames → the heavy, weighted glide;
  `0.25` snappier when you flick.
- A **velocity threshold** ends the scroll (`absVelocity < velocityThreshold →
  onScrollStop`), plus a `scrollStopDelay = 120 ms` watchdog, plus an epsilon stop
  (`|lerped| < 0.1 → delta=0`).
- `onCalcUpdate` fires **only when `current` actually changed** (dedupe — no wasted
  recompute when settled).
- Native fallback mode exists (`onScroll`): `current = target = scrollTop` (1:1) when
  smooth mode is off / touch.

**Why it feels good:** there is exactly one authoritative `scroll.current` per frame.
Every effect (parallax, relief, sequence, reveals) reads *that*, so nothing can desync
or tear — the entire page moves as one rig with deliberate inertial lag.

---

## 2. Per-element progress — the ScrollTrigger equivalent

Every element carrying a `string-*` attribute becomes an **Object** (`class` with
`progress, progressRaw, startPosition, differencePosition, transformValue, lerp, glide,
mirrors, properties, htmlElement`). Attributes are read as `string-<key>` /
`data-string-<key>`.

`calculatePositions()` resolves a scrub range from **enter/exit anchors**
(`string-enter-vp`, `string-exit-vp`, optional `enter-el`/`exit-el`):

```
start-position      = c − scroll.topPosition          // where progress = 0
end-position        = h − scroll.topPosition           // where progress = 1
difference-position = h − c                            // scrub distance
inview-start/end    = start/end ± inview-top/bottom    // for the -inview class
```

`c`/`h` are derived from the element's measured rect (`getBoundingClientRect`), its
`size`, and `offset-top/bottom` padding, switched by the eight anchor combinations
(top/bottom × top/bottom, plus left/right for horizontal). Then per frame:

```
progress = clamp01( (scroll.current − start-position) / difference-position )
progress = easingFn ? easingFn(progress) : progress      // optional easing
emit("object:progress:<id>", progress)                   // e.g. :welcome, :sticky-container
```

**Mirrors** implement `string-copy-from`: a mirror Object copies the source's progress,
so many elements scrub off **one** trigger. In section 2 everything copies
`sticky-container`.

`show()/hide()` toggle `.-inview` (only removed again if `string-repeat`); CSS does the
actual entrance animation off that class + `--l-delay`, `--char-index`, etc.

---

## 3. THE PARALLAX — exact formula + live proof

The caption in section 2 is the textbook case:

```html
<span class="caption -h5 -m-h6" string="parallax" string-parallax="0.1">
  <span>Not</span><span>Everything</span><span>is Visible</span>
</span>
```

### 3.1 Setup (`initializeObject`)

```js
bias  = string-parallax-bias ?? 0          // 0 here
n     = Math.abs(string-parallax)          // 0.1
sign  = Math.sign(string-parallax)         // +1
parallax-position-start = -0.5 + 0.5*bias  // = -0.5
parallax-position-end   =  0.5 + 0.5*(1-bias) // = 1.0
offset-top = offset-bottom = n * windowHeight   // pads the trigger range by n·vh
```

### 3.2 Per-frame transform (`calculateDesktopParallax`)

```js
const s = obj.progress;                       // 0..1 from §2
const n = obj.parallax;                        // 0.1
const r = obj.parallaxPositionStart;           // -0.5
const i = obj.parallaxPositionEnd;             //  1.0
const o = obj.parallaxSign;                    // +1
const l = viewport.windowHeight / viewport.transformScale;   // ≈ 678
const a = o * n * ( l*r + s * l * i );         // px offset
emit("object:parallax", a);
return { transform: `translate3d(0, ${a}px, 0)` };
```

With the section-2 defaults (`r=-0.5, i=1, o=+1`) this **simplifies to**:

```
a = n · l · (progress − 0.5)
```

- Symmetric: **0 px when the element is mid-scroll** (`progress = 0.5`).
- Total travel = `n · l` (here `0.1 · 678 ≈ 67.8 px`), i.e. **±33.9 px**.
- `parallax-bias` skews the zero-crossing; **negative `string-parallax` flips direction**.
- **Mobile (`innerWidth ≤ 1024`): parallax is disabled** → `translate3d(0,0,0)`.

### 3.3 Live verification (measured on the running site)

| scrollY | caption `transform` (translateY) | implied progress |
|--------:|----------------------------------|------------------|
| 900     | `none` (before trigger)          | not yet in view  |
| 1500    | **30.0002 px**                   | ≈ 0.94           |
| 2100    | **33.9 px**                      | 1.0 (saturated)  |
| 2700    | **33.9 px**                      | clamped          |
| 3300    | **33.9 px**                      | clamped          |

`n·l·0.5 = 0.1 × 678 × 0.5 = 33.9 px` — the saturation value matches the formula to the
decimal. **Confirmed.** Note `transform:none` before the trigger (the module only writes
once the Object is active), and the value **clamps** (progress is `clamp01`), so parallax
never overshoots when you scroll far past.

### 3.4 Why this parallax is smooth

1. **`translate3d` only** → compositor-only, zero layout/paint.
2. Written in the **batched mutate phase** (`Se.run(() => …)`), never interleaved with
   reads → no forced reflow / layout thrash.
3. Driven by the **lerped** `scroll.current`, not raw `scrollY` → inherits the engine's
   inertial smoothness; the element eases because the *scroll* eases.
4. **Clamped + epsilon-gated + dedup'd** → no overshoot, no sub-pixel churn, no write
   when unchanged.
5. Applied to **connected/mirror** elements in the same pass → grouped layers stay
   pixel-locked together.

---

## 4. The section-2 transitions / animations (what you see)

### 4.1 The pinned sequence (the office photos)

```html
<div class="sticky-container" string="progress"
     string-enter-vp="top" string-exit-vp="bottom"
     string-self-disable string-id="sticky-container">
  <div class="sequence-controller" string-copy-from="progress-end" string="sequence"
       string-entering-duration="places-sequencer[50]"
       string-leaving-duration="places-sequencer[1500]"
       string-active-step="places-sequencer[3]"> … </div>
  <img class="i i-1" src="/images/offices/2.webp" string="sequence"
       string-copy-from="sticky-container" string-sequence-trigger="places-sequencer[1]">
  <img class="i i-2" … places-sequencer[2]> … (7 photos)
</div>
```

- `sticky-container` defines the scrub range (enter at viewport-top → exit at
  viewport-bottom). Note: it is **not CSS `position:sticky`** (measured `static`); the
  visual "hold" comes from the fixed/centered relief + photo layer while only their
  *content* changes with progress. The container just supplies the scroll distance.
- The **sequence module** (`string="sequence"`) crossfades steps: as mirrored progress
  advances, the active step changes; the **entering** photo fades in over **50 ms**, the
  **leaving** photo fades out over **1500 ms** → a long, luxurious cross-dissolve (never
  a hard cut). Default `sequence-duration` 600 ms otherwise. Starts on **step 3**
  ("Silent Room").
- `string-self-disable` = the trigger detaches after running once (no idle cost).

### 4.2 The auto-advance + draining progress ring

In the `Places` Vue component, a RAF state machine (`Ke = 6000` ms cycle, `Je = 450` ms
transition, `et = 0.001` epsilon):

```js
S(a) → o.value.style.setProperty("--slide-progress", `${clamp01(a)*360}deg`)  // ring
Y(a):                                       // RAF tick
  if (transitioning P)  L = c*(1 - clamp01((a-b)/Je))   // ring drains over 450ms
  else if (!hovered d)  L = clamp01((a - y)/Ke)         // ring fills over 6s
                        if (L>=1) D()                    // → nextBtn.click()
  S(L); raf(Y)
mouseenter/leave on slide+nav → pause/resume the timer (x/U)
sequence:active:places-sequencer event → set active place index, reset ring (n/se)
```

So the circular indicator I observed around "5/7" is a single CSS custom property
`--slide-progress` in **degrees** (a conic-gradient / SVG arc), epsilon-gated to one
write per meaningful change, and the carousel is **dual-driven**: scroll scrubs it;
when idle, a 6 s timer auto-advances and the ring fills; hover pauses it.

### 4.3 Supporting motion in the same section

- **Title** `"Explore / Places"`: `string="split" string-split="char[random(0,10)]"` —
  per-char split with randomized 0–10 stagger ("decode" reveal), with real **kerning**
  re-applied via `--kerning` per glyph. `--dx:0.25; --dy:-1` set the reveal direction.
- **Decorative SVG path** `.places-path`: a hand-drawn squiggle stroked with a vertical
  brown→transparent linear-gradient (`#7b5136`), `vector-effect="non-scaling-stroke"` —
  typically stroke-dashoffset-revealed against the section progress.
- **WebGL relief** in this section is re-tuned vs the hero (component-local options):
  `repeatX/Y:1` (single image, **not** tiled), `radius:600`, `reliefIntensity:35`
  (≈2× hero), `parallax:16` (2× hero), `diffuse:3.5`, `specular:2.8`,
  `mouseLightHeight:100`, `mouseLightRadius:100` (a **tight, intense hotspot** vs the
  hero's broad soft glow), colors `[X,X,X]→[3X,3X,3X]` where `X=0.0784` (near-black →
  dark grey, **monochrome**, no red). This is the "torch over carved obsidian" feel.

---

## 5. The transition/animation playbook (copyable rules)

1. **One scroll truth.** Hijack wheel → integrate into a virtual position → **lerp**
   (`0.1` rest / `0.25` active) → every effect reads that single value. Never let two
   systems read `window.scrollY` independently.
2. **Measure → Mutate split.** Read all rects/positions in one phase; write all
   `transform`s in a batched mutate phase. This single discipline is why it never janks.
3. **Parallax = `sign·factor·vh·(progress−0.5)` via `translate3d`**, clamped,
   epsilon-gated, applied to mirror group together, disabled < 1024 px.
4. **Declarative triggers.** Element attributes (`enter-vp`/`exit-vp`,
   `copy-from`, `parallax`, `sequence`, `split`) instead of bespoke per-component JS —
   one engine, many behaviors, consistent timing.
5. **Crossfades, never cuts.** Asymmetric enter/leave durations (50 ms in / 1500 ms out)
   read more expensive than they are.
6. **Self-disabling + dedupe + epsilon everywhere.** Triggers detach after firing;
   recompute only when `current` changed; skip writes below threshold.
7. **Re-tune the same shader per section** instead of new code — broad soft warm glow
   in the hero, tight harsh monochrome lamp in section 2, from the *same* class.

---

## 6. For our `portfolio-vN` work

- We currently lean on GSAP ScrollTrigger per component. The higher-fidelity model here
  is **one scroll rig → progress bus → declarative consumers** with a strict
  measure/mutate split. Worth prototyping a thin `data-progress`/`data-parallax`
  directive layer over our existing GSAP so timing is centralized and reduced-motion is
  one switch.
- The **`a = sign·factor·vh·(progress−0.5)`** parallax (zero at center, clamped, GPU
  translate, off on mobile) is a safe drop-in for our editorial sections — no pinning
  required, no overshoot.
- The **pinned scrubbed sequence with asymmetric crossfade** (long fade-out) is exactly
  the language for our Foodics/Zid case-study reveals in v14 — and it needs no real CSS
  pin, just a tall trigger range + a fixed/centered content layer.
- Keep the **active-vs-idle gain** idea everywhere motion meets scroll (engine `0.1`/
  `0.25`; relief `scrollFactorIdle .25`/`scrollFactorActive .5`) — it's the single
  biggest contributor to the "luxury weight".
