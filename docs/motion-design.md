# Cinematic motion patterns

A small collection of premium scroll/hover motion patterns. Each one is framework-agnostic in spirit (React snippets shown, but the ideas are the recipe — vanilla, Vue, Svelte all work the same way). Pair them with the **smooth-scroll foundation** below for a Linear / Vercel / award-site feel.

## Stack assumed by every pattern

| Library | Role |
|---|---|
| `gsap` + `ScrollTrigger` | Scroll-linked timelines, pinning, scrub, matchMedia breakpoints |
| `lenis` | Smoothed scroll position that ScrollTrigger reads from |
| `lottie-react` | Hand-authored Lottie JSON for tiny accent motion (optional but cheap) |

No tilt libraries, no parallax libraries, no Framer Motion required. Everything else is CSS + RAF.

---

## 0 — Smooth-scroll foundation

The bridge that makes every other ScrollTrigger pattern feel filmic instead of computery. Mount once near the top of a page.

```jsx
// SmoothScroll.jsx — headless, client-only
"use client";
import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

export default function SmoothScroll() {
  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      smoothTouch: false, // keep native momentum on phones
    });

    const onScroll = () => ScrollTrigger.update();
    lenis.on("scroll", onScroll);

    const tick = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.off("scroll", onScroll);
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);
  return null;
}
```

**Why these choices**
- `duration: 1.1` — long enough to feel luxurious, short enough to stay responsive. 0.8 = snappier, 1.5 = languid.
- One frame loop drives both Lenis and GSAP (`gsap.ticker.add`) → no clock drift.
- `lagSmoothing(0)` — heavy frames don't time-warp the animations.
- `smoothTouch: false` — Lenis on mobile usually feels worse than native; leave touch alone.
- Reduced-motion early-bails entirely. The page reverts to native scroll.

---

## 1 — Pinned scroll narrative

A section that pins for several viewport heights of scroll. While pinned, "scenes" stack on top of each other and crossfade. Each scene gets its own parallax + tint.

### Markup shape

```
.story (outer — gives scroll length)
  └── .story-pin (the pinned element, 100vh)
        ├── .story-bg (radial-gradient — animated per scene)
        ├── .story-progress (counter + scaleX bar)
        └── .story-stage (perspective container)
              └── .story-scene × N (absolute-positioned, stacked)
                    ├── .scene-image
                    │     └── .scene-image-inner (parallax target)
                    └── .scene-content
                          ├── .scene-meta (parallax target)
                          ├── .scene-title (parallax target)
                          └── .scene-foot
```

### CSS scaffolding

```css
.story-pin { position: relative; width: 100%; height: 100vh; overflow: hidden; isolation: isolate; }
.story-stage { position: relative; width: 100%; height: 100%; }
.story-scene { will-change: transform, opacity; }
.scene-image-inner,
.scene-title,
.scene-meta { will-change: transform; }
```

### Master timeline + per-scene parallax

```jsx
const ctx = gsap.context(() => {
  const mm = gsap.matchMedia();

  mm.add("(min-width: 901px)", () => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      scenes.forEach((s) => gsap.set(s, { opacity: 1, scale: 1 }));
      return;
    }

    // Stack scenes; first one visible.
    scenes.forEach((s, i) => {
      gsap.set(s, {
        position: "absolute",
        inset: 0,
        opacity: i === 0 ? 1 : 0,
        scale: i === 0 ? 1 : 1.04,
      });
    });

    // Master timeline — drives the crossfade
    const master = gsap.timeline({
      scrollTrigger: {
        trigger: wrap,
        start: "top top",
        end: `+=${scenes.length * 100}%`, // 1 viewport per scene
        pin: pin,
        scrub: 1,                          // 1s lag = buttery
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          progressFill.style.transform = `scaleX(${self.progress})`;
          progressLabel.textContent =
            String(Math.floor(self.progress * scenes.length) + 1).padStart(2, "0");
        },
      },
    });

    master.to({}, { duration: 1 }); // hold scene 1
    scenes.forEach((scene, i) => {
      if (i === 0) return;
      master
        .to(scenes[i - 1], { opacity: 0, scale: 0.92, duration: 0.6, ease: "power2.inOut" })
        .fromTo(scene, { opacity: 0, scale: 1.04 },
                       { opacity: 1, scale: 1, duration: 0.6 }, "<")
        .to({}, { duration: 0.6 }); // hold each scene
    });

    // Per-scene parallax — three layers moving at different speeds
    scenes.forEach((scene, i) => {
      const img   = scene.querySelector(".scene-image-inner");
      const title = scene.querySelector(".scene-title");
      const meta  = scene.querySelector(".scene-meta");

      const segment = {
        trigger: wrap,
        start: () => `top+=${i * innerHeight} top`,
        end:   () => `top+=${(i + 1) * innerHeight} top`,
        scrub: true,
        invalidateOnRefresh: true,
      };

      img   && gsap.fromTo(img,   { yPercent: 6, scale: 1.05 },
                                  { yPercent: -8, scale: 1, ease: "none", scrollTrigger: segment });
      title && gsap.fromTo(title, { yPercent: 4 }, { yPercent: -6, ease: "none", scrollTrigger: segment });
      meta  && gsap.fromTo(meta,  { yPercent: 8 }, { yPercent: -4, ease: "none", scrollTrigger: segment });
    });
  });

  // Mobile fallback — no pin, simple stacked reveal
  mm.add("(max-width: 900px)", () => {
    scenes.forEach((scene) => {
      gsap.set(scene, { opacity: 1, scale: 1, position: "relative" });
      gsap.fromTo(
        scene.querySelectorAll(".scene-image, .scene-content"),
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.9, ease: "power2.out", stagger: 0.08,
          scrollTrigger: { trigger: scene, start: "top 80%" } }
      );
    });
  });
}, wrap);
return () => ctx.revert();
```

### Background tint crossfade

Store a tint per scene; tween the BG element on scroll into each segment:

```jsx
const tints = [
  "radial-gradient(ellipse 80% 60% at 30% 40%, rgba(78,0,142,0.35), transparent 60%), #050505",
  "radial-gradient(ellipse 70% 50% at 70% 30%, rgba(116,209,234,0.22), transparent 60%), #050505",
  // …one per scene
];
scenes.forEach((_, i) => {
  gsap.to(bgRef.current, {
    background: tints[i],
    ease: "none",
    scrollTrigger: {
      trigger: wrap,
      start: () => `top+=${Math.max(0, i * innerHeight - innerHeight * 0.4)} top`,
      end:   () => `top+=${i * innerHeight} top`,
      scrub: true,
    },
  });
});
```

### Tuning knobs

| Want | Change |
|---|---|
| Longer pin | `end: "+="` on master ScrollTrigger |
| Snappier transitions | Lower the crossfade `duration` (0.6 → 0.4) |
| More dramatic parallax | Wider yPercent ranges on per-scene tweens |
| Earlier tint shift | Increase the `0.4` offset in tint segment start |

### Gotchas
- Set `anticipatePin: 1` to avoid a jump at the pin handoff.
- Always `invalidateOnRefresh: true` if you use `() => innerHeight` math; ScrollTrigger needs to re-measure on resize.
- Wrap in `gsap.context(...)` so `ctx.revert()` cleans up listeners on unmount/route-change.

---

## 2 — Atmospheric background

Three drifting gradient orbs + cinematic noise + vignette. Adds depth without distracting.

```jsx
<section className="atmo-section">
  <div className="atmo" aria-hidden>
    <div className="atmo-orb atmo-orb--a" />
    <div className="atmo-orb atmo-orb--b" />
    <div className="atmo-orb atmo-orb--c" />
    <div className="atmo-noise" />
    <div className="atmo-vignette" />
  </div>
  <div className="container">{/* content */}</div>
</section>
```

```css
.atmo-section { position: relative; isolation: isolate; overflow: hidden; }
.atmo-section > .container { position: relative; z-index: 2; }
.atmo { position: absolute; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; }

.atmo-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(110px);
  mix-blend-mode: screen;
  opacity: 0.55;
  will-change: transform;
}
.atmo-orb--a {
  top: -10%; left: -8%;
  width: 50vw; height: 50vw; max-width: 720px; max-height: 720px;
  background: radial-gradient(closest-side, rgba(120,200,255,0.55), transparent 70%);
  animation: orbA 38s ease-in-out infinite alternate;
}
.atmo-orb--b {
  top: 30%; right: -12%;
  width: 55vw; height: 55vw; max-width: 780px; max-height: 780px;
  background: radial-gradient(closest-side, rgba(120,40,200,0.55), transparent 72%);
  animation: orbB 46s ease-in-out infinite alternate;
}
.atmo-orb--c {
  bottom: -10%; left: 30%;
  width: 40vw; height: 40vw; max-width: 560px; max-height: 560px;
  background: radial-gradient(closest-side, rgba(255,130,80,0.30), transparent 70%);
  opacity: 0.4;
  animation: orbC 52s ease-in-out infinite alternate;
}
@keyframes orbA { 0% { transform: translate3d(0,0,0) scale(1); } 100% { transform: translate3d(6%,4%,0) scale(1.08); } }
@keyframes orbB { 0% { transform: translate3d(0,0,0) scale(1); } 100% { transform: translate3d(-5%,-3%,0) scale(1.06); } }
@keyframes orbC { 0% { transform: translate3d(0,0,0) scale(1); } 100% { transform: translate3d(4%,-5%,0) scale(1.10); } }

.atmo-noise {
  position: absolute; inset: 0;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.4 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
  opacity: 0.05;
  mix-blend-mode: overlay;
}
.atmo-vignette {
  position: absolute; inset: 0;
  background: radial-gradient(ellipse 80% 60% at 50% 50%, transparent 50%, rgba(0,0,0,0.55) 100%);
}

@media (prefers-reduced-motion: reduce) {
  .atmo-orb { animation: none !important; }
}
```

### Why it looks luxurious
- **3 orbs, different periods** (38s / 46s / 52s). Periods are mutually coprime-ish so they never visibly sync. Brain reads it as "alive" but can't pattern-match.
- **`mix-blend-mode: screen`** stacks light additively, not flatly. Requires `isolation: isolate` on the parent so the blend doesn't escape.
- **`filter: blur(110px)`** is GPU-composited on its own layer — no layout reflow even on resize.
- **Noise** prevents banding in the gradients and adds film grain.
- **Vignette** focuses attention. Without it, edges feel cheap.

### Tuning knobs
- More energy → drop blur (110px → 80px), bump opacity, shorten drift periods.
- More restraint → fewer orbs (2), gentler colors, longer periods (60s+).

---

## 3 — 3D mouse-tracked card tilt

Each card rotates a few degrees toward the cursor. RAF + lerp = smooth, transform-only.

### CSS

```css
.card-grid { perspective: 1200px; }      /* depth on the grid container */
.card {
  position: relative;
  transform-style: preserve-3d;
  will-change: transform;
  transition: transform 0.5s cubic-bezier(.2,.7,.2,1);
}
.card-3d {
  transform-style: preserve-3d;
  transform: rotateX(0) rotateY(0);
  will-change: transform;
}
.card:hover { transform: translateY(-6px); }
.card.is-hovered .card-image { transform: translateZ(20px) scale(1.07); }
```

### JS (one component per card)

```jsx
const TILT_MAX = 6;      // degrees
const TILT_LERP = 0.18;  // 0..1, higher = snappier

function Card({ children }) {
  const cardRef = useRef(null);
  const innerRef = useRef(null);
  const target = useRef({ rx: 0, ry: 0 });
  const current = useRef({ rx: 0, ry: 0 });
  const rafRef = useRef(0);

  const tick = useCallback(() => {
    const t = target.current, c = current.current;
    c.rx += (t.rx - c.rx) * TILT_LERP;
    c.ry += (t.ry - c.ry) * TILT_LERP;
    if (innerRef.current) {
      innerRef.current.style.transform = `rotateX(${c.rx}deg) rotateY(${c.ry}deg)`;
    }
    // Auto-stop when settled (saves idle CPU)
    if (Math.abs(t.rx - c.rx) > 0.01 || Math.abs(t.ry - c.ry) > 0.01) {
      rafRef.current = requestAnimationFrame(tick);
    } else {
      rafRef.current = 0;
    }
  }, []);

  const startRaf = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };

  const onMove = (e) => {
    const r = cardRef.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top)  / r.height - 0.5;
    target.current.ry = px * TILT_MAX * 2;
    target.current.rx = -py * TILT_MAX * 2;
    startRaf();
  };

  const onLeave = () => { target.current = { rx: 0, ry: 0 }; startRaf(); };

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  return (
    <article ref={cardRef} className="card" onMouseMove={onMove} onMouseLeave={onLeave}>
      <div ref={innerRef} className="card-3d">{children}</div>
    </article>
  );
}
```

### Why this version is fast
- Each card runs **its own** RAF and **auto-stops** when `target ≈ current`. Idle CPU is ~0 even with 50+ cards on screen.
- Mouse coords go to a `target` ref; the RAF reads `target` and lerps. This decouples mousemove rate from render rate.
- All writes are to `style.transform` — single property, GPU-accelerated, no layout.
- No third-party tilt library required.

### Tuning knobs
- `TILT_MAX` — degrees of rotation (try 4 for subtle, 10 for bold)
- `TILT_LERP` — easing factor (0.1 = soft, 0.4 = arcadey)
- Z-zoom on hover: `translateZ(Npx)` inside `.is-hovered .card-image`

---

## 4 — GSAP staggered scroll reveal

Standard cinematic entry for any grid or list. Re-fires when content changes.

```jsx
useEffect(() => {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const ctx = gsap.context(() => {
    const items = gridRef.current.querySelectorAll(".reveal-item");
    gsap.killTweensOf(items);                // prevent stacked tweens on re-runs
    gsap.fromTo(items,
      { y: 28, opacity: 0, scale: 0.985 },
      {
        y: 0, opacity: 1, scale: 1,
        duration: 0.9,
        ease: "power3.out",
        stagger: { each: 0.045, from: "start" },
        scrollTrigger: { trigger: gridRef.current, start: "top 85%", once: true },
      }
    );
  }, gridRef);
  return () => ctx.revert();
}, [dataset]); // re-run when underlying data changes (e.g. filter)
```

### Cinematic stagger feel
| Stagger `each` | Reads as |
|---|---|
| 0.02 | Fast / utilitarian |
| 0.045 | Cinematic / restrained |
| 0.08 | Theatrical / paragraph-paced |

### Triggers cheat-sheet
| Start string | Behavior |
|---|---|
| `"top 85%"` | Begins when top of trigger reaches 85% down viewport (most common) |
| `"top center"` | Centered on viewport |
| `"top top"` | Begins when trigger touches the top |

Always set `once: true` for reveals — re-triggering on scroll-back feels jittery.

---

## 5 — Lottie accent animations

Use Lottie *only* for tiny accents — active states, hover sparks, transition badges. For anything bigger, prefer CSS/SVG/Canvas. The two patterns below cover most "premium accent" needs and stay below ~1.5KB per JSON.

### A) Pulse ring — for active states

Place inside an active toggle / filter / nav item. 90 frames at 60fps = 1.5s loop.

```jsx
import Lottie from "lottie-react";

// data/lottie.js
export const pulseRingLottie = {
  v: "5.7.4", fr: 60, ip: 0, op: 90, w: 100, h: 100, nm: "pulse-ring",
  ddd: 0, assets: [],
  layers: [
    /* Layer 1: stroked circle, scale 30% → 200%, opacity 70 → 0 */
    /* Layer 2: small filled circle (static core dot) */
  ],
  markers: [],
};

<Lottie animationData={pulseRingLottie} loop autoplay style={{ width: 20, height: 20 }} />
```

Wrap in a parent that's `opacity: 0; transform: scale(0.7)` by default and `opacity: 1; scale: 1` when active. The Lottie keeps mounted; CSS controls the entrance/exit of the wrapper.

### B) Corner spark — for hover energy

Mount **only on the currently hovered element**. 75 frames. Two crossing strokes "draw" into an L-bracket then fade and loop.

```jsx
const [hoveredKey, setHoveredKey] = useState(null);

<article onMouseEnter={() => setHoveredKey(key)} onMouseLeave={() => setHoveredKey(null)}>
  <div className="corner-accent">
    {hoveredKey === key && (
      <Lottie animationData={cornerSparkLottie} loop autoplay style={{ width: 36, height: 36 }} />
    )}
  </div>
</article>
```

**Key rule**: only one card-corner Lottie animates at a time. The `hoveredKey` state is shared across cards (lifted to the parent), so the moment the cursor moves away or to a new card, the old Lottie unmounts.

### Hand-authoring minimal Lottie JSON

The Bodymovin schema in plain English:
- `v` = version (use `"5.7.4"`)
- `fr` = framerate (60 = silky)
- `ip` / `op` = start frame / end frame
- `w` / `h` = viewport (you'll scale via CSS anyway)
- `layers[]` = each shape lives in a layer of type `4`
- A layer has `ks` (transforms: position, scale, opacity, rotation) and `shapes[]`
- A shape can be an ellipse (`ty: "el"`), rectangle (`ty: "rc"`), path (`ty: "sh"`) wrapped in a group (`ty: "gr"`)
- Color values are normalized RGB: `[R/255, G/255, B/255, A]`

For 2-layer pulse + 2-layer L-bracket, the JSON ends up ~150 lines total. Keep it inline as a JS export so you don't ship a separate fetch.

### Lottie performance gotchas
- Cap **concurrent** instances. 1–2 active = imperceptible. 30+ = jank.
- Use `loop` only when you intend infinite playback; otherwise `loop={false}` and trigger plays on event.
- Lottie's SVG renderer is the default. For very dense animations, consider `renderer: "canvas"` — but for tiny accents, SVG is fine.

---

## 6 — Cross-cutting: responsive + accessibility

Every motion module above should obey three guards:

### Reduced motion
```js
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
if (reduced) return; // bail before mounting Lenis, ScrollTriggers, RAFs
```
And the CSS safety net:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
  }
  /* but keep Lottie if it's decorative */
}
```

### Mobile fallback for pinned sections
Use `gsap.matchMedia()` so the breakpoint logic lives inside GSAP (it auto-cleans up when the query no longer matches):
```js
const mm = gsap.matchMedia();
mm.add("(min-width: 901px)", () => { /* pinned cinematic version */ });
mm.add("(max-width: 900px)", () => { /* simple stacked fade-in */ });
```

### Performance contract for hover/scroll motion
- **Transform + opacity only.** Never animate `width`, `height`, `top`, `left`, `padding`.
- Set `will-change` on the moving element — but **only** while it's actively moving (overuse pins layers in memory).
- Throttle nothing — let RAF naturally cap at 60/120Hz. Adding throttles makes motion feel laggy.
- Compose layers with `transform: translateZ(0)` if a browser refuses to GPU-promote a stubborn element.

---

## 7 — Recommended composition for a "premium" page

Build any page that needs Linear/Vercel-style motion as:

```
<SmoothScroll />                    ← pattern 0
<Nav />
<Hero />                            ← static, just typography
<TrustBar />                        ← logo marquee, slow scroll
<PinnedNarrative />                 ← pattern 1 (showcase work)
<DeepDive />                        ← static or one parallax block
<AtmosphericGrid />                 ← patterns 2 + 3 + 4 + 5 (gallery)
<BigCTA />                          ← static
<Footer />
```

Rule of thumb: **one heavy motion section per scroll**, with quiet sections between them. If everything moves, nothing reads as moving. Linear's brilliance is restraint.

---

## 8 — Tech debt to keep tabs on

- Lenis + browser native smooth-scroll API can conflict — disable `scroll-behavior: smooth` on `html` when Lenis is active.
- `position: fixed` children inside a pinned ScrollTrigger element get weird; use `position: absolute` and let the pin own positioning.
- `gsap.context()` is required for clean React unmounts. Without it, ScrollTriggers leak across route changes.
- `lenis.destroy()` doesn't undo `gsap.ticker.add` — remove the ticker function explicitly in your cleanup.
- iOS Safari's `100vh` lies during URL bar collapse — for full-bleed pinned sections, use `100dvh` if you need precision.

---

## 9 — Mental model

The whole stack is one idea applied four ways:
1. **Lenis** smooths the scroll signal.
2. **ScrollTrigger** turns scroll signal into animation progress.
3. **GSAP** turns animation progress into property values.
4. **CSS transforms + Lottie** turn property values into pixels on a GPU.

Every pattern in this doc is just a different shape of step 3.
