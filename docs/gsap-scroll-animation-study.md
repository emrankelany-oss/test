# gsap.com/scroll — animation patterns reverse-engineered

Devtools-level study of [gsap.com/scroll](https://gsap.com/scroll/) — the official GreenSock page that showcases ScrollTrigger, ScrollSmoother, and Observer. Every pattern below is what GSAP themselves consider canonical scroll choreography. Companion to [lenis-dev-animation-study.md](./lenis-dev-animation-study.md).

## Tech stack identified

| Layer | Library / version |
|---|---|
| Animation core | **GSAP 3.14.2** |
| Scroll choreographer | **ScrollTrigger 3.14.2** |
| Smooth scroll | **ScrollSmoother** — `smooth: 1.8s` lag (NOT Lenis) |
| Rendering | Pure DOM + SVG. **Zero canvases.** |
| Smooth-scroll body class | `.has-smooth-scroll` (signals smoother is active) |

Notable contrast vs lenis.dev: this page has **no WebGL, no 3D models, no shaders**. Every effect is achievable with vanilla DOM/SVG + GSAP. That's a deliberate "look how far you can go without WebGL" demonstration.

## Page structure (16,766 px tall, ~18.6 viewports)

| Section | Top px | Effect |
|---|---|---|
| `scroll-hero` | 0 | Headline word reveal |
| `scroll-plugins` | 1,020 | Plugin cards reveal-on-enter (`toggleActions: play`) |
| `scroll-trigger-ready` | 2,474 | "Worm" tracer SVG: stroke-dashoffset scrubs path drawing |
| `scroll-trigger-pin` | 3,751 | **Pinned windmill** — `rotateZ: 900` (2.5 turns) scrubbed |
| `scroll-trigger-size` | 5,503 | Subtitle reveal |
| `scroll-smooth-breeze` | 6,509 | Long-scrub plane glides across screen, multiple SVG paths animate |
| `scroll-smooth-effortless` | 7,523 | Ball travels along motion path (`y` to 800 / 4s ease none) |
| `scroll-smooth-butter` | 8,433 | Two IMG side-by-side parallax (`scrub: 1`, `power1.inOut`) |
| `scroll-smooth-effects` | 9,247 | **Pinned section** + circle fountain (90 circles, `y: -900`, `stagger: 0.008`) + parallax flair using `data-speed` |
| `scroll-seamless` | 11,047 | SVG masks scale to 0 with `back.in(1.7)` ease |
| `scroll-observer` | 12,069 | Observer demo (no scroll-bound animation — gesture-driven) |
| Plugins grid + showcase | 12,930+ | Card reveals on enter |

## Pattern 1 — ScrollSmoother (one-liner config)

```js
ScrollSmoother.create({
  smooth: 1.8,         // seconds of "lag" — bigger = silkier, slower-feeling
  effects: true,       // enables data-speed / data-lag parallax (free)
  normalizeScroll: true,
});
```

That's it. They set `smooth: 1.8` which is unusually high (most sites sit at 0.8–1.2) — it gives the page that languid, drifty feeling. The trade-off is that fast scroll wheels feel less responsive; works because the page is content-first, not click-first.

`<body class="has-smooth-scroll">` is added by ScrollSmoother automatically — useful as a CSS hook for hover effects that misbehave under smooth scroll.

## Pattern 2 — `data-speed` / `data-lag` parallax (zero JS per element)

```html
<div class="flair" data-speed="0.8" data-lag="0">…</div>
<div class="flair" data-speed="2.0" data-lag="0">…</div>
<div class="flair" data-speed="1.2" data-lag="0">…</div>
```

Once `ScrollSmoother.create({ effects: true })` is set, ANY element with `data-speed` or `data-lag` becomes parallax-driven, free. No tween code per element.

- `data-speed="1"` → moves at scroll speed (default)
- `data-speed="0.5"` → scrolls half as fast (background-y feel)
- `data-speed="2.0"` → scrolls twice as fast (foreground-rushing feel)
- `data-speed="auto"` → ScrollSmoother computes from height so it traverses one viewport exactly while in view
- `data-lag="0.5"` → element trails scroll by 0.5s (rubber-band feel)

This is gsap.com's parallel to lenis.dev's `--progress` CSS variables — both bypass per-element JS. ScrollSmoother does it via attribute; lenis.dev does it via inline custom property.

## Pattern 3 — pinned scroll-scrubbed rotation (windmill)

```js
gsap.timeline({
  scrollTrigger: {
    trigger: '.scroll-trigger-pin',
    pin: true,                 // pin section while scrolling through
    scrub: 1,                  // 1s lerp between scroll value and target — silky
    start: '50% 50%',          // begin scrubbing when section center hits viewport center
    end: 'bottom 50%',         // end at section bottom passes viewport center
  },
})
.to('.scroll-trigger-pin__windmill', { autoAlpha: 1, duration: 0 })
.to('.scroll-trigger-pin__windmill-svg', {
  rotateZ: 900,              // 2.5 full rotations
  ease: 'power1.inOut',
  duration: 0.6,
});
```

Key choices:
- `rotateZ: 900` not `rotation: 360 * 2.5` — explicit degrees, no normalisation surprises
- `ease: 'power1.inOut'` even on a scrub — easing on scrub still applies, it just remaps the scroll-to-progress curve (slow at the edges, fast in the middle)
- `start: '50% 50%'` — center-to-center alignment, not top-to-top. Reads more cinematic.

## Pattern 4 — scrub-as-inertia (the magic number is the scrub value)

Different effects use different scrub values. Each is a deliberate feeling:

| Section | Scrub | Effect |
|---|---|---|
| Worm tracer | `1` | Tight, snappy stroke-draw |
| Windmill | `1` | Locked-to-finger rotation |
| Plane glide | `3` | Languid, drifty — plane finishes long after you stop |
| Butter parallax | `1` | Standard parallax |
| Seamless masks | `1.5` | Slightly delayed, "weight" |

**Rule of thumb gsap.com is teaching**: `scrub: 1` for direct manipulation, `scrub: 2–3` for ambient/dreamy. Never `scrub: true` (instant — looks janky in conjunction with ScrollSmoother).

## Pattern 5 — "brace" subtitle reveal (kinetic typography micro-pattern)

Every section header has this micro-animation:

```html
<h3 class="subtitle">
  <div class="subtitle__brace">{</div>
  <p class="subtitle__label">ScrollTrigger</p>
  <div class="subtitle__brace">}</div>
</h3>
```

```js
const tl = gsap.timeline({
  scrollTrigger: { trigger: subtitleEl, start: 'top 90%', toggleActions: 'play' }
});
tl.from('.subtitle__brace:first-child', { opacity: 0, xPercent: 100, duration: 0.3, ease: 'power3.out' })  // { slides in from right
  .from('.subtitle__brace:last-child',  { opacity: 0, xPercent: -100, duration: 0.3, ease: 'power3.out' }, '<')  // } slides in from left
  .from('.subtitle__label',             { opacity: 0, duration: 0.7, ease: 'power3.out' }, '-=0.2');
```

The braces fly in from opposite sides and "clamp around" the label. Tiny detail. Used **13 times** on the page (every subtitle). That repetition is what creates the signature feel — one micro-animation, used everywhere, never noticed individually but felt collectively.

Translation for your site: pick ONE signature reveal and reuse it for every section header. Don't surprise the user with a new reveal per section.

## Pattern 6 — the "circle fountain" (cheap-to-render, expensive-looking)

In `scroll-smooth-effects` they spawn ~90 small circle divs (NOT canvas) and animate them upward with a tight stagger:

```js
gsap.to('.scroll-smooth-effects__circle', {
  y: -900,
  ease: 'power2.inOut',
  stagger: 0.008,          // 8ms apart — feels continuous
  duration: 1,
  scrollTrigger: {
    trigger: '.scroll-smooth-effects__wrapper',
    scrub: 1,
    start: 'top 90%',
    end: 'bottom bottom',
  },
});
gsap.to('.scroll-smooth-effects__circle', {
  opacity: 0,
  stagger: 0.008,
  duration: 0.5,
  scrollTrigger: { /* same */ },
});
```

Why this works without WebGL: 90 transformed divs on a single composite layer (`transform: translateY(...)` is GPU-accelerated). The 8ms stagger is below human perception of discrete events — it reads as continuous flow.

Mental model: **stagger + transform-only properties + reasonable count (<200) = looks like particles, costs almost nothing**.

## Pattern 7 — pinned section as a "stage"

The `scroll-smooth-effects` section is the canonical pinned-scrub stage:

```js
ScrollTrigger.create({
  trigger: '.scroll-smooth-effects',
  pin: '.scroll-smooth-effects__container',  // pin a CHILD, not the section — keeps spacing intact
  scrub: 1,
  start: 'top top',
  end: 'bottom bottom',
});
```

The section is taller than the viewport (1800 px). The CHILD `__container` is `100vh` and gets pinned. As you scroll the section's extra height, the container stays put and inner timelines progress. This is the exact same shape as lenis.dev's "Solution" section — but lenis uses CSS variables while gsap uses GSAP timelines pinned to the container.

## Pattern 8 — scale-to-zero with `back.in(1.7)` (the squish exit)

```js
gsap.to('.shape-mask', {
  scale: 0,
  ease: 'back.in(1.7)',     // overshoots slightly BEFORE collapsing
  duration: 3,
  scrollTrigger: { scrub: 1.5, start: 'top 50%', end: 'bottom 40%' },
});
```

`back.in` is rarely seen as an exit ease — most devs reach for `power3.in`. `back.in(1.7)` first **scales the shape UP slightly** before collapsing to zero. Visually: the shape "winds up" then disappears. Tiny choice, big tactility.

## Pattern 9 — `toggleActions: "play"` for on-enter reveals

For one-shot reveals (not scroll-scrubbed), they use `toggleActions: 'play'`:

```js
ScrollTrigger.create({
  trigger: '.card',
  start: 'top 90%',          // when card top is 90% down the viewport
  toggleActions: 'play',     // play on enter, do nothing on leave/re-enter
  animation: revealTl,
});
```

This is the simplest possible reveal — runs once, never resets. Used for plugin cards, showcase items, every subtitle.

The 4-string `toggleActions` format (`'play pause resume reset'`) is GSAP's idiom for: onEnter / onLeave / onEnterBack / onLeaveBack. They only use the simplest variant on this page.

## Pattern 10 — ScrollSmoother + ScrollTrigger play together (no manual ticker)

Unlike lenis.dev where you must share the RAF between Lenis and R3F manually, GSAP's pieces share a ticker by default:

```js
ScrollSmoother.create({ smooth: 1.8, effects: true });
// ScrollTrigger automatically picks up ScrollSmoother's scroll value
gsap.registerPlugin(ScrollTrigger, ScrollSmoother);
```

Zero glue code. Every ScrollTrigger on the page reads from the smoothed scroll automatically once ScrollSmoother is initialized.

## Pattern 11 — content path animation (the "plane" sequence)

The breeze section animates a plane along an SVG path while drawing the path itself:

```js
const tl = gsap.timeline({
  scrollTrigger: { trigger: section, scrub: 3, start: 'top 75%', end: 'bottom 25%' },
});
tl.to('.plane', { motionPath: { path: '#breeze-path', align: '#breeze-path' }, ease: 'power3.out', duration: 3 })
  .from('.breeze-path-1', { drawSVG: 0, duration: 1.85 }, 0)
  .from('.breeze-path-2', { drawSVG: 0, duration: 2 }, 0.3)
  .from('.breeze-path-3', { drawSVG: 0, duration: 2 }, 0.6);
```

Two plugins co-opted here: **MotionPathPlugin** (path follow) and **DrawSVGPlugin** (animated stroke). Both are GSAP Club Greensock plugins (paid). On a free stack you'd replicate with `stroke-dasharray` + `stroke-dashoffset` for the path and manual offset math for the plane.

Translation: **path-along-line is a high-impact, low-frequency move**. Use it once, prominently. Don't spam it.

## Asset inventory

| URL | Purpose |
|---|---|
| GSAP 3.14.2 + ScrollTrigger 3.14.2 + ScrollSmoother | Core stack |
| (probable: MotionPath, DrawSVG, SplitText) | Member-only plugins for path + stroke + text reveals |
| No models, no shaders, no canvases | Notable absence — proves how much you can do without WebGL |

## What I'd reuse on a project

1. **ScrollSmoother with `effects: true`** — flip a flag, get free parallax via `data-speed` attributes on any element. Zero per-element code.
2. **The "brace reveal" subtitle pattern** — one micro-animation, reused for every section header. Builds rhythm.
3. **Scrub values as a vocabulary**: `scrub: 1` for snappy, `scrub: 3` for ambient. Treat the number like a tempo marking.
4. **Pin a CHILD, not the section** — keeps document flow simple and avoids pin-spacer surprises.
5. **`back.in(1.7)` for exits** — counter-intuitive ease, gives shapes physicality on disappear.
6. **Stagger 0.008 on transform-only properties** — fake particles cheaply. <200 divs, no canvas needed.
7. **`toggleActions: 'play'` on `top 90%`** — the standard "reveal me when I'm 10% in view" pattern. Use this 80% of the time.

## Mental model

gsap.com/scroll is **one scrollable DOM tree** + **ScrollSmoother as the global scroll source** + **a vocabulary of scrub values per effect** + **a handful of pinned stages where the choreography happens**. Most "magic" effects are 3–5 lines of GSAP each. The hard part is choosing which effect goes where — not implementing them.

That's the entire trick.
