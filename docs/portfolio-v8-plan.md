# Portfolio V8 — Implementation Plan

Concept: Lusion-grade single-canvas storytelling for TMA. Five rooms, scroll-hijacked, full Three.js, dark cinematic.

---

## Locked brief (from clarifying round)

| Decision | Choice |
|---|---|
| Tech tier | Full Three.js + React Three Fiber (R3F) + drei |
| Scroll | Full hijack (Lusion-style virtual scroll, body = viewport height) |
| Hero motif | Abstract motion shapes — extruded arcs, plus-signs, orbiting dots |
| Rooms | 5 — Hero → Stats → Work → Services → CTA |
| Featured work | Foodics, Zid, Boundless, Ripple, Burger King, LG |
| Audio | Full layer (ambient stem per scene + hover/click/page SFX pools), header mute toggle, default **OFF** |
| Mood | Jet-black canvas, electric accents (cyan + magenta + lime + white) |
| Mobile | Static hero image + native scroll for the rest |
| CTA | "Let's build bold stories with strategic impact" → `mailto:info@themotionagency.net` |
| Build mode | Plan first → user approves → build |

---

## File plan (Next.js App Router under `tma-web/`)

```
tma-web/
├── app/portfolio-v8/
│   ├── page.jsx                    # entrypoint, dynamic import of <Experience>
│   └── layout.jsx                  # bg=#000, no scroll, font preloads
├── components/portfolio-v8/
│   ├── Experience.jsx              # client root: <Canvas> + <DOMOverlay> + scroll engine
│   ├── ScrollEngine.jsx            # virtual scroll provider — wheel/touch/key → progress 0..1
│   ├── Preloader.jsx               # 00→100 counter, gates the reveal
│   ├── DOMOverlay.jsx              # nav, cursor, scroll hint, footer in HTML over canvas
│   ├── Cursor.jsx                  # spring-follow cursor with data-cursor label swap
│   ├── AudioBus.jsx                # Howler/Web Audio wrapper, scene-aware crossfade
│   ├── rooms/
│   │   ├── HeroRoom.jsx            # extruded plus/arc/dot cluster with scroll physics
│   │   ├── StatsRoom.jsx           # 4 orbiting 3D numerals (178% / 30+ / 500+ / 29+)
│   │   ├── WorkRoom.jsx            # 6 depth-parallax floating cards
│   │   ├── ServicesRoom.jsx        # 8 service cards in a slow rotating ring
│   │   └── CtaRoom.jsx             # closing scene: brand mark + CTA + footer info
│   ├── shaders/
│   │   ├── depthParallax.glsl.js   # vertex displacement using depth map
│   │   └── flipText.glsl.js        # MSDF flip for project titles
│   └── primitives/
│       ├── PlusMesh.jsx            # parametric extruded "+"
│       ├── ArcMesh.jsx             # extruded arc
│       └── DotField.jsx            # instanced point cloud
├── data/portfolio-v8.js            # rooms config, project list, copy, asset paths
├── lib/usePortfolioScroll.js       # virtual-scroll hook (consumed by R3F + DOM)
├── public/assets/v8/
│   ├── work/{foodics,zid,boundless,ripple,bk,lg}/home.webp
│   ├── work/{...}/home_depth.webp           # generated (Depth-Anything or hand-painted)
│   ├── audio/ambient_{hero,stats,work,services,cta}.ogg
│   ├── audio/sfx_{hover_0,hover_1,click_0,page_0,page_1}.ogg
│   ├── hdr/studio_small.hdr        # tiny HDRI for env reflections
│   └── hero-mobile.webp            # static fallback render
```

**Net new dependencies** (one install):
- `three`, `@react-three/fiber`, `@react-three/drei`
- `gsap` (we already use simple transitions, but ScrollTrigger is overkill here since we hijack)
- `howler` (audio bus with crossfade + sprite pools)
- `leva` (dev-only, hidden in prod — for tuning scene params)

Total bundle add: ~140 KB gzipped for the v8 route only (dynamic-imported, doesn't touch other routes).

---

## Scroll engine (the heart)

```
ScrollEngine
├─ accumulate raw wheel/touch/key into `targetProgress` (0..1)
├─ smooth: currentProgress += (targetProgress - currentProgress) * 0.08
├─ publish `progress` via Context + a useRef for R3F (no re-renders)
├─ map progress → roomIndex via thresholds [0, .20, .40, .65, .85, 1]
└─ emit `roomEnter` / `roomLeave` events → AudioBus crossfade triggers
```

R3F components read progress from a ref (zero re-renders); DOM components read from context (re-render only when room changes).

---

## Per-room build sheet

### Hero (progress 0.00 → 0.20)
- 60-ish instanced plus/arc/dot meshes, dark concrete bg, env reflection from HDRI.
- `useFrame` rotates the cluster by progress * 4π and applies a scroll-velocity impulse for tumble.
- DOM headline: **"We turn bold strategy into motion that moves markets."** (TMA voice, deck-derived)
- Audio: `ambient_hero.ogg` fades in at 0.05.

### Stats (0.20 → 0.40)
- Camera dolly forward; cluster scatters off-screen.
- 4 large 3D numerals orbit (178%, 30+, 500+, 29+) with labels "GROWTH", "CLIENTS", "BUSINESS CREATED", "EXPERIENCE".
- Audio: `ambient_stats.ogg` crossfade, `page_0.ogg` SFX on enter.

### Work (0.40 → 0.65)
- Camera tracks past 6 floating tiles in a soft "S" curve through space.
- Each tile = plane with `home.webp` color + `home_depth.webp` displacement; hover bulges toward cursor.
- Per-character flipbook on project titles in DOM overlay.
- Audio: `ambient_work.ogg` + `hover_*.ogg` on tile hover.

### Services (0.65 → 0.85)
- 8 service cards in a slow horizontal-axis ring; progress rotates the ring + dim the trailing cards.
- Cards show service name + one-line description from deck.
- Audio: `ambient_services.ogg`.

### CTA (0.85 → 1.00)
- Final dolly into a wide-shot: large kinetic TMA wordmark in 3D + supporting orbit shapes settle.
- DOM headline: **"Let's build bold stories with strategic impact."**
- Big `mailto:info@themotionagency.net` button, secondary "View full portfolio" → `/portfolio`.
- Footer baked into the DOM overlay: Amman + Riyadh addresses, phones, socials.
- Audio: `ambient_cta.ogg` + `page_1.ogg` on enter.

---

## Asset prep (what the user owes us)

We can ship the scaffold with placeholder/derived assets, but for production polish we need:

1. **6 project hero images** — already in `public/assets/portfolio/`. ✅ available.
2. **6 depth maps** — I'll generate via Depth-Anything (free, deterministic) from the existing hero images. **No user action needed.**
3. **Ambient audio (5 stems)** — can use royalty-free placeholders (e.g., from Pixabay) until TMA sources branded tracks.
4. **SFX (5 files)** — same; placeholders ship, swap later.
5. **HDRI** — single 1KB equirect from polyhaven, free.

**Net: I can build the entire thing without waiting on TMA-sourced assets.** All placeholders are royalty-free and license-clean for swap-out.

---

## Build sequence (estimated)

| Step | Output | Time |
|---|---|---|
| 1. Install deps, set up route, dark layout | `/portfolio-v8` loads with empty canvas | 15 min |
| 2. Scroll engine + room threshold dispatcher | Console logs progress + roomIndex | 30 min |
| 3. Preloader counter + reveal animation | 00→100 then curtain pull | 20 min |
| 4. Hero room (plus/arc/dot primitives + cluster + physics-feel) | Hero looks Lusion-grade | 60 min |
| 5. Stats room (4 orbiting 3D numerals) | Stats reads cinematic | 30 min |
| 6. Work room (6 depth-parallax tiles) | Project grid hovers, parallaxes | 60 min |
| 7. Services room (rotating ring of 8 cards) | Services orbit | 30 min |
| 8. CTA room (wordmark + footer) | CTA closes the story | 30 min |
| 9. Custom cursor + per-word reveals + flipbook hover | Lusion micro-touches | 45 min |
| 10. AudioBus (ambient crossfade + SFX pools + mute toggle) | Sound is part of story | 45 min |
| 11. Mobile fallback (static hero + native-scroll content) | Mobile is usable | 30 min |
| 12. Smoke test in browser, fix jank, ship | Working build | 30 min |

**Total: ~6.5 hours of focused work.** I'll do it in one pass; if I hit a blocker I'll surface it.

---

## Things explicitly OUT of scope

- Per-project case-study pages (existing routes stay; V8 only links out to them).
- Newsletter signup form (not in TMA's current site).
- Admin/CMS — copy lives in `data/portfolio-v8.js` as a flat file.
- Server-rendered scene state (everything is client-only; SEO uses a static fallback meta).
- The labs.lusion.co-equivalent secondary site.
- AR/Vimeo reel embed — replaced with the depth-parallax grid for V8.

---

## What I want approval on before writing code

1. **The 5-room flow + per-room concept** (Hero motion shapes → Stats → Work → Services → CTA wordmark). OK?
2. **Hero headline:** "We turn bold strategy into motion that moves markets." — write your own line if you want; I'll use whatever you give me.
3. **CTA headline:** "Let's build bold stories with strategic impact." (deck verbatim). OK?
4. **The asset plan** — auto-generate depth maps, use royalty-free placeholder audio for now. OK?
5. **The 6 featured projects** in order: Foodics → Zid → Boundless → Ripple → BK → LG. OK to ship in that order?

Once approved, I'll execute steps 1–12 above and ship a working `/portfolio-v8`.
