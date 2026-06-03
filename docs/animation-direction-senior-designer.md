# Animation direction — senior designer's read

Written after reverse-engineering both [lenis.dev](./lenis-dev-animation-study.md) and [gsap.com/scroll](./gsap-scroll-animation-study.md). The goal of this doc is to **decide what The Motion Agency site should actually do** — not catalog more techniques.

You already have `app/portfolio-v2/` scaffolded with components named after lenis.dev's sections (Hero, Why, HorizontalCards, KineticType, StackingCards, InUse, PersistentBG). That's a good starting frame; below is what to do with it.

## The honest comparison

| | **lenis.dev** | **gsap.com/scroll** |
|---|---|---|
| Hero device | 3D wireframe-pink hand (R3F + glb) | Static SVG + word reveal |
| Smooth scroll | Lenis, `lerp: 0.1` | ScrollSmoother, `smooth: 1.8` |
| Big "moment" | Type-zoom (1× → 8.5×) on 10-viewport pinned section | Pinned circle fountain (90 divs, staggered) |
| Parallax | CSS `var(--progress)` written by JS per frame | `data-speed` attribute, zero JS |
| WebGL | One persistent fullscreen R3F canvas | None |
| Page length | 39 viewports | 18 viewports |
| Feeling | Filmic, cold, weighty | Playful, technical, friendly |

**lenis.dev is a brand film.** gsap.com/scroll is a sales reel. They want different things from you.

Your agency is **The Motion Agency** — the brand promise is motion craft. You should sit closer to lenis.dev in feeling, but you don't have to pay lenis.dev's WebGL tax on every page. The right move is **lenis-style choreography on portfolio + case pages**, **gsap-style efficiency on everywhere else**.

## What to do — concretely

### 1. Don't ship a 3D hand. Ship a 2D signature reveal.

The 3D hand on lenis.dev is great branding for *lenis.dev* (the hand says "this is the engine you scroll with"). On a motion-agency site it's a non-sequitur — and an R3F build, glb pipeline, and Leva debug panel is a lot of complexity for one decorative element.

Replace `V2PersistentBG` (currently scaffolded for a hand canvas) with a **simpler persistent canvas** OR drop it entirely:

- **Option A (recommended)**: a fixed-position SVG or `<canvas>` running a low-cost 2D effect — drifting noise gradient, slow color wash, or a subtle grain shader. Reads "motion" without committing to a 3D model. Cost: ~50 lines.
- **Option B**: kill `V2PersistentBG` and let the kinetic type carry the wow factor. Cheapest.
- **Option C** (only if you have 2+ weeks): commission one custom 3D piece (your own asset, not a hand) that becomes the brand. Don't do this unless it's bookable to a client deliverable.

### 2. Build ONE signature reveal and reuse it everywhere.

The single most copyable thing from gsap.com/scroll is the **brace subtitle** (used 13× on one page). Pick your own equivalent — a brand-flavored micro-reveal — and use it on every section title in V2. Examples that would fit "motion agency":

- A short underline that draws left-to-right then fades on scroll-out
- A monospaced label that types in one letter at a time (SplitText-style)
- An offset duplicate that slides into register (chromatic-aberration → focus)

The point is **rhythm**. Variety per section = noise. Repetition = signature.

### 3. Adopt the CSS-variable scroll driver. Don't use both Lenis + GSAP timelines.

The most under-rated lenis.dev pattern is Pattern 2 from [the lenis study](./lenis-dev-animation-study.md#pattern-2--css-variable-as-a-scroll-progress-driver) — JS writes `--progress` per frame, CSS does the math. This is **strictly faster** than chaining `ScrollTrigger` instances per element because:

- One handler updates one number per section
- Every animated CSS rule reads via `var()` — no React re-renders, no Object.assign loops
- Designers can tune values in CSS without touching JS

ScrollTrigger is great as a coordinator (pin, snap, scrub) but **don't tween individual properties through it on hot sections**. Use it for the structural moves (pin a section, scrub one master timeline) and let CSS variables do per-element animation inside the pinned stage.

Concrete shape for `V2KineticType.jsx`:

```js
// One ScrollTrigger drives one progress variable on the section
useEffect(() => {
  const el = sectionRef.current;
  const st = ScrollTrigger.create({
    trigger: el,
    start: 'top top',
    end: '+=900%',          // 10 viewports — match lenis.dev
    pin: el.querySelector('.stage'),
    scrub: 1,
    onUpdate: ({ progress }) => {
      el.style.setProperty('--p1', clamp01(remap(progress, 0, 0.55)));
      el.style.setProperty('--p2', clamp01(remap(progress, 0.55, 1)));
    },
  });
  return () => st.kill();
}, []);
```

CSS:
```css
.stage .first  { transform: scale(calc(1 + var(--p1) * 3)) translateY(calc(var(--p1) * -50%)); }
.stage .second { transform: translate(-50%, -50%) scale(calc(var(--p1) * 8.5)); opacity: calc(var(--p1) * 2); }
.stage .wipe   { transform: scaleX(var(--p2)); }
```

### 4. Settle on ONE smoothing approach.

Right now `tma-web/components/portfolio/SmoothScroll.jsx` exists (Lenis-flavored, going by the name). Don't also pull in ScrollSmoother — they fight over the scroll source.

- If you stay on Lenis: keep what you have, but make sure ScrollTrigger picks up Lenis's scroll position by calling `lenis.on('scroll', ScrollTrigger.update)` and using `ScrollTrigger.scrollerProxy(document.documentElement, { … })`. There is one canonical snippet for this; copy it from GSAP's Lenis + ScrollTrigger docs and don't deviate.
- If you switch to ScrollSmoother: drop Lenis entirely. ScrollSmoother gives you free `data-speed` parallax, which is a real win.

**Recommendation: stay on Lenis** because (a) you already have it, (b) it's free + open-source vs. ScrollSmoother (Club Greensock), and (c) the agency brand-name parallel ("Motion ↔ Lenis") is a tasteful coincidence worth keeping.

### 5. Pick a scrub vocabulary and stick to it.

Three values, three feelings — pick them and use them like font weights:

| Use case | Scrub | What it feels like |
|---|---|---|
| Pinned stage with type-zoom or hand transforms | `1` | Locked to finger |
| Parallax background / drifting elements | `2.5–3` | Floaty, ambient |
| Reveal-on-enter (one-shot) | not scrubbed; `toggleActions: 'play'` | Lands once and stays |

Anything else is noise.

### 6. Don't make every section a stage.

Pin-and-scrub is expensive (visually and computationally). lenis.dev pins ONE section big (the 10-viewport Solution). gsap.com/scroll pins ONE section big (the effects pin). Everything else is regular scrolling with on-enter reveals.

For V2: **one type-zoom stage**, **one stacking-cards stage**, everything else flows normally. Three pinned stages is already too many.

### 7. Performance ceiling — don't break under your own weight.

The two things that crater scroll FPS:

1. **Layout-triggering properties in scrubbed tweens**: never animate `width`, `height`, `top`, `left`, `margin` in a scrubbed timeline. Always `transform` + `opacity`. (Yes, even `width: calc(var(--p) * 100%)`. Use `transform: scaleX(var(--p))` and absolute-positioned parent.)
2. **Mounting/unmounting React subtrees during scroll**: keep sections mounted. If a section is offscreen, hide via `visibility: hidden` or `content-visibility: auto` — don't conditionally render.

Both lenis.dev and gsap.com/scroll mount every section once and keep them mounted. Follow that.

## Concrete next step — order of operations

1. **Decide V2PersistentBG fate** (drop it, simplify it, or commit to one custom 3D asset). Block all other work on this.
2. **Choose your signature subtitle reveal** (one shape, used on every section header).
3. **Wire the CSS-variable scroll driver into `V2KineticType`** as the type-zoom centerpiece. This is the "wow moment" — it has to be the best-executed thing on the site.
4. **Audit V2HorizontalCards / V2StackingCards** — make sure only one of them is a pinned stage (probably stacking; horizontal can be a regular CSS scroll-snap row at smaller scale).
5. **Add `[data-lenis-scroll-snap-align="start"]`** to 2–3 section breakpoints — free snapping, zero JS, immediately raises the polish ceiling.
6. **One pass on easings** — replace any default `ease-out` exits with `back.in(1.7)` where shapes shrink/disappear. Free tactility.

## What I'd push back on

- **Don't copy the entire lenis.dev page length (39 viewports)**. A portfolio page should be 12–18 viewports. Lenis can demo their scroll engine forever; a motion agency demoing themselves loses people after viewport 20.
- **Don't introduce GSAP Club plugins (DrawSVG, MotionPath, SplitText) unless you're sure**. They're great, but they're paid and lock you into Greensock's licensing. Most equivalent effects are doable with `stroke-dasharray` + manual offsets + JS string splitting.
- **Don't ship a Leva debug panel in production**. Lenis.dev does (you can see it), and it's a power move because they're shipping a dev tool — but on an agency site it screams "unfinished".

## TL;DR — the senior take

> "Lenis.dev's choreography, gsap.com/scroll's efficiency, your own brand-grade signature reveal, and exactly one pinned stage as the centerpiece. No 3D hand."

That's the brief. Now tell me which of those calls you want to push back on and we'll start cutting code.
