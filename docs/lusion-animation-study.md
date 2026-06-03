# Lusion.co — Animation & Transition Study

Source: live inspection of https://lusion.co/ via Playwright + devtools (2026-05-14). Captured screenshots and network traffic stored alongside under [.playwright-mcp/](../.playwright-mcp/) and the lusion-*.png files at repo root.

This document is the reference for the **portfolio-v8** build that ports Lusion's storytelling system to TMA's brand.

---

## 1. Architecture at a glance

| Aspect | What Lusion does | Implication for V8 |
|---|---|---|
| Page model | **Single WebGL2 canvas, 100vh × 100vw**, full bleed. DOM is mostly invisible scaffolding. | We can either go full-WebGL (Three.js / R3F) or fake it with a fixed `<canvas>` + pinned scroll trigger. |
| Scroll | **No native scroll** — `documentHeight === viewportHeight`. `wheel` events feed a normalized progress `t ∈ [0, 1]` into the scene. | Either lock body scroll and listen to wheel/touch/keys, or use GSAP ScrollTrigger pin + virtual scrubber on top of native scroll. |
| Build | Astro + a single hoisted JS bundle (`hoisted.CJiXW_YI.js`). No React/Next runtime. | We're on Next.js — that's fine; ship as a single client component with `dynamic(..., { ssr: false })`. |
| Asset format | Custom `.buf` binary geometry, `.exr`/`.jpg` matcaps, ARM-packed WebP textures (`*_arm.webp`), SMAA LUTs, sprite atlases. | Use glTF + Draco for V8 (matches Three.js ecosystem) + ARM-packed PBR textures. Mirror the LOD pattern with `_ld` + `_hd` GLBs. |
| Audio | Web Audio with **variation pools** (`hover_0/1/2.ogg`, `click_0/1.ogg`, `page_0/1.ogg`) + cinematic ambient stems per scene. | Add a mute toggle in the header, default OFF, opt-in. |
| Preloader | Counter 00→100 gates the experience. Everything (models, textures, audio, reel mp4) preloaded before scenes start. | Match this — feels premium and removes mid-scroll jank. |

---

## 2. The 3-act story (room-by-room)

Lusion's homepage is **one continuous 3D set with rooms strung together**. The viewer is the camera. Scroll = travel.

### Act 1 — Hero: "We create 3D visual storytelling…"
- **Scene:** swirling cluster of "+/cross" 3D primitives in white/electric-blue/black/lavender, dark background, subtle dot-grid.
- **Behavior:** scroll-tied **rigid-body physics**. Small scroll deltas rotate/tumble the cluster in place; larger deltas compress the cluster and "punch through" into Act 2.
- **Type:** headline locked top-left, per-word reveal on initial load (each word is its own DOM node for stagger). "SCROLL TO EXPLORE" anchor bottom-center.
- **Camera:** fixed dolly position; only the geometry moves.

### Act 2 — Mirror chamber / Featured work
- **Scene:** chrome-glass tunnel, refractive mirrors on every face, emerald light fragments, a 3D astronaut suspended in the void. Pre-baked vertex animation (`astronaut_in_animation.buf`) plays the figure into place.
- **Transition into Act 2:** glass-shatter (`broken_glass.buf` + `glass_broken.ogg`) — the hero scene literally breaks open.
- **Featured work grid:** project cards float **inside** this 3D space (not in a DOM grid). Each card uses `home.webp` + `home_depth.webp` for **2.5D depth-map parallax on hover** — the thumbnail bulges toward the cursor.
- **Type:** project titles are split per-character with each character duplicated **4x** in the DOM → flipbook frames revealed on hover via `flip_texture.png` (MSDF flip animation).

### Act 3 — Astronaut CTA: "Let's work together!"
- **Scene:** the astronaut is now front-and-center, surrounded by 3D sticker emojis (heart, lips, banana, ghost, mushroom, smiley…) — all from a single `stickers.png` sprite atlas.
- **Behavior:** stickers drift with mouse parallax, light bobbing idle animation.
- **CTA copy:** "Is Your Big Idea Ready to Go Wild?" → playful inversion of the hero promise ("stand out" → "go wild").
- **Footer baked in:** address, socials, newsletter live inside the scene — no separate DOM footer.

**Story arc:** Promise → Proof → Invitation. Three rooms, one space.

---

## 3. The animation primitives (catalog)

These are the reusable pieces. V8 will pick a subset and brand them.

### 3.1 Preloader counter
- Numeric 00 → 100, large bottom-left.
- Drives a real asset-load progress promise, not a fake timer.
- Reveals the scene with a clip-mask / curtain pull at 100.

### 3.2 Scroll-as-timeline (virtual scroll)
- `wheel` event listener accumulates `deltaY` into a `targetProgress` value, smoothed to `currentProgress` via Lerp (`current += (target - current) * 0.08` each frame).
- The single `progress` value drives **every** animation: camera dolly, scene crossfade, text reveal, physics impulse. No IntersectionObserver, no per-section triggers.
- Touch: `touchmove` is wired the same way (one finger = wheel equivalent).

### 3.3 Scroll-tied rigid-body physics
- Each "+" mesh has a tiny physics body. Scroll velocity injects angular + linear impulse.
- When the user stops scrolling, damping returns them toward a "rest" configuration via spring (slight overshoot).
- Visually reads as "the world has weight" — biggest contributor to the premium feel.

### 3.4 Per-word headline reveal
- Headlines split into `<span>` per word.
- Two copies of each word stacked, one masked, one visible — a clip-path slides up on stagger.
- Stagger: ~40ms per word, ease `cubic-bezier(0.22, 1, 0.36, 1)` (gentle "back" easing).

### 3.5 Per-character flipbook hover (project titles)
- Each character rendered 4× in the DOM.
- On hover, the row cycles through the 4 frames at ~80ms each → glitchy "type-machine" effect.
- Lusion uses MSDF + a flip texture. For V8 a simple `<span>` flip animation works.

### 3.6 Scene-to-scene transitions
- **Shatter** (Act 1 → Act 2): pre-baked vertex animation of broken-glass shards expanding outward + `glass_broken.ogg`. Camera punches forward.
- **Crossfade + camera dolly** (Act 2 → Act 3): the mirror-chamber camera tracks back, astronaut grows in scale, stickers fade in around them.
- Each transition has a matching `page_*.ogg` SFX so audio carries the cut.

### 3.7 Depth-map parallax on thumbnails
- Two assets per project: `home.webp` (color) + `home_depth.webp` (grayscale depth).
- On hover, a shader displaces vertices of a plane based on depth and offsets UV by mouse position → fake 3D photo.
- Subtle (max ~6° tilt) but the difference vs. flat thumbs is the entire reason the grid feels premium.

### 3.8 Audio variation pools
- 2–3 variants per interaction (hover, click, focus, page-turn).
- Random pick each trigger.
- The difference between "premium feel" and "ringtone fatigue" is having ≥2 variants.

### 3.9 Custom cursor
- Lusion's cursor is a small dot that scales up + shows a label on interactive targets ("VIEW", "DRAG", "PLAY REEL").
- Implementation: fixed-position div + spring follow + `data-cursor="..."` attributes on hoverables to swap the label.

### 3.10 Quality auto-scaling
- They ship `_ld.buf` + `_hd.buf` for heavy models.
- First-second FPS measurement → pick LD or HD; toggle SMAA accordingly.
- For V8: check `navigator.hardwareConcurrency` + `devicePixelRatio` to pick a tier.

---

## 4. Asset & loading discipline (what makes it fast despite the weight)

- **Custom binary geometry** — third the size of glTF for the same mesh.
- **ARM channel-packed PBR maps** — A/R/M into the R/G/B of a single texture file. One fetch instead of three.
- **WebP everywhere** — no PNGs except where alpha precision matters.
- **Sprite atlases** for any "many small things" (stickers).
- **Audio in OGG** — better compression than MP3 at the same quality.
- **Vimeo embed** only for the heaviest video (reel) — they don't self-host it.
- **One hoisted JS bundle** — no waterfalls of code-split chunks.

---

## 5. Type & color system

- **Type:** Aeonik (3 weights: regular, medium, italic) + IBM Plex Mono for small UI labels + a custom display variant (`LusionMono`).
- **Color:** off-white background `#F0F1FA`, dark canvas background `#0A0A0A`. Accents: electric blue, mint, white, jet black. Restrained palette so the 3D carries the personality.

For TMA: pick a palette + display face during the clarifying-question round below.

---

## 6. What we'll port for V8 (default plan, pending answers)

The minimum-viable Lusion-grade port:

1. Preloader with a real-progress counter.
2. Single fixed `<canvas>` driven by a virtual scroll progress (GSAP ScrollTrigger pin + Lenis fallback, no full-page hijack).
3. Three scenes:
   - **Hero** — physics cluster of TMA mark / chosen 3D motif.
   - **Featured Work** — depth-map parallax grid of Foodics, Zid, Boundless, Ripple, +2 more.
   - **CTA** — closing scene with brand mark + "Let's build bold stories with strategic impact" (deck line).
2. Per-word headline reveals + per-character flipbook hover on project titles.
4. Custom cursor with `data-cursor` labels.
5. Audio toggle (default OFF) with one ambient stem + hover/click/page SFX pools.
6. Mobile: skip the WebGL physics scene, replace with a tasteful native-scroll version (image hero + the same depth-parallax grid).

Everything else (HDR matcaps, custom .buf format, vertex-animated transitions) is gravy — only worth doing if the user wants the full art-piece tier.

---

## 7. Open decisions (the clarifying questions)

See conversation — gated on 10 questions before scaffolding starts.
