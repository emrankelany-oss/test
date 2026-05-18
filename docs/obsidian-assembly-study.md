# Study: obsidianassembly.com — 3D / WebGL, Animation & Motion Architecture

> Source-code level teardown of **The Obsidian Assembly** (https://obsidianassembly.com/),
> built by Fiddle.Digital. Captured 2026-05-19 from the live, un-obfuscated (only minified)
> Nuxt 3 build. All shader source and tuning constants below are verbatim from the shipped JS.

---

## 1. Tech stack (fingerprinted from the bundle)

| Layer | What they actually use |
|---|---|
| Framework | **Nuxt 3 / Vue 3** (SSR + hydration; `_nuxt/entry.*.js`, `__NUXT__`, `useNuxtApp`) |
| Routing | Nuxt file routes (`index`, `places`, `objects`) — code-split per page chunk |
| 3D / hero FX | **Hand-written raw WebGL 1.0** — *no* three.js, no R3F, no OGL, no PixiJS |
| Scroll | **Custom lerp-based smooth scroll** (no Lenis, no Locomotive) — 59+ `lerp` calls, `onScroll`/`onScrollMeasure`, own RAF loop |
| Text/Reveal FX | **Custom in-house engine** exposed as `$stringTune` (a Nuxt plugin / event bus) |
| Animation | Mostly **CSS transitions + class toggles** driven by JS (`.-inview`, `.-loaded`, `--l-delay`) + a little JS tweening; ScrollTrigger string appears but the heavy lifting is custom |
| Assets | `.webp` everywhere, `.svg` masks, custom `.woff` fonts (Voyage, Switzer, OT Jubilee) |
| Images | Lazy-loaded with blurred placeholders (`*-blured.webp` → `blob:` swap) |

**Key takeaway #1:** the "wow" is *not* a heavy 3D library. It is one ~600-line raw-WebGL
class plus disciplined CSS-class choreography. Total JS for the home experience is ~330 KB
(entry) + ~60 KB (home chunk) — tiny for the perceived richness.

---

## 2. The "3D image" — what it really is

There is **no 3D model** (no `.glb`/`.gltf`/`.hdr`/`.draco`, no camera, no mesh).
The hero centerpiece is a single 2D photo, **`/images/home/stone.webp`** (a glossy black
obsidian rock), composited over a marble plate, with an SVG arch mask (`stone-mask.svg`).
The `stone.b614bd04.js` "module" is literally one line — it just exports that image URL.

The genuinely impressive piece is the **full-page background canvas** behind everything:
a class the code calls `DynamicReliefLampEffect`, mounted by a Vue component
`<ReliefBackground>` (DOM: `div.relief-bg > canvas`). It turns a flat stone/marble photo
(`/images/home/stone-wall.webp`) into an **interactive carved relief that lights up under
the cursor like a lamp dragged across engraved obsidian.** (Verified live: sweeping the
mouse over the near-black Places section reveals glinting marble veins along the cursor path.)

### 2.1 Architecture: a 2-pass GPU height-field simulation

It is a classic **ping-pong framebuffer simulation** + a **lighting/relief render pass**,
on a single fullscreen quad. WebGL context is created lean:

```js
canvas.getContext("webgl", { alpha:false, depth:false, antialias:false, premultipliedAlpha:false })
```

**Pass 1 — Simulation (`progUpdate`)** writes a 1-channel height field into a low-res
framebuffer (`simScale: 0.4` → sim runs at **40 % of screen resolution** for speed):

```glsl
precision mediump float;
varying vec2 v_uv;
uniform sampler2D u_prev;   // previous frame's height (ping-pong)
uniform sampler2D u_tex;    // the stone photo
uniform vec2 u_simRes, u_resolution, u_imgRes, u_repeat;
uniform float u_scrollY;
uniform vec2 u_mouse;
uniform float u_radius, u_rise, u_decay, u_spread;
uniform float u_texBrightnessPower, u_texBrightnessMin, u_texBrightnessMax;

float H(vec2 uv){ return texture2D(u_prev, uv).r; }
float lum(vec3 c){ return dot(c, vec3(0.299,0.587,0.114)); }

void main(){
  vec2 st = v_uv * u_simRes;
  float h = H(v_uv);
  // 4-neighbour blur = diffusion / "spread" of the ripple
  vec2 texel = 1.0/u_simRes;
  float avg = (H(v_uv+vec2(-texel.x,0.))+H(v_uv+vec2(texel.x,0.))
             + H(v_uv+vec2(0.,-texel.y))+H(v_uv+vec2(0.,texel.y)))*0.25;
  h = mix(h, avg, clamp(u_spread,0.,1.));
  h = max(h - u_decay, 0.0);                 // ripple fades over time
  float dist = distance(st, u_mouse);
  if (dist < u_radius){
    // sample the photo in PAGE space (scroll-locked) -> relief follows the carving
    vec2 screenPos = v_uv*u_resolution;
    float pageY = (u_resolution.y - screenPos.y) + u_scrollY;
    vec2 texUV = fract((vec2(screenPos.x,pageY)/u_imgRes)*u_repeat);
    float b = pow(lum(texture2D(u_tex,texUV).rgb), u_texBrightnessPower);
    float t = 1.0 - smoothstep(0.0, u_radius, dist); t = t*t*t; // soft falloff
    h = clamp(h + u_rise*t*mix(u_texBrightnessMin,u_texBrightnessMax,b), 0.0, 1.0);
  }
  gl_FragColor = vec4(h, 0.0, 0.0, 1.0);
}
```

So the cursor *adds* height (only where the underlying photo is bright → the relief
"obeys" the engraving), neighbours bleed it outward (`spread`), and every frame it
decays. Result: a soft, self-fading trail that hugs the carved detail.

**Pass 2 — Render / relief lighting (`progRender`)** reads that height field and the photo
and does **per-pixel normal mapping + Phong lighting** with two lights:

- A **fixed key light** `const vec3 L = vec3(0.4472,0.5367,0.7155)` → the always-on emboss.
- A **mouse "lamp"**: a 3D point light at `(mouse.x, mouse.y, u_mouseLightHeight)` with
  distance attenuation, diffuse + specular, and a cheap height-based **self-shadow**.

Normals are derived two ways and blended: from the **photo's luminance gradient**
(`calcNormal` → emboss the carving itself) and from the **simulated height gradient**
(`calcHeightNormal`). A `u_parallax` term offsets the UV along the normal for fake depth.
Color lerps `u_lowColor → u_highColor` by height; alpha fades to `u_minAlpha` on flat
areas so the dark page shows through (the effect is *additive-feeling* without real
blending). Full Pass-2 source is in the appendix.

### 2.2 The tuned constants (verbatim defaults)

These are the art-directed magic numbers — worth stealing as starting points:

```js
{
  radius: 280, riseSpeed: .25, decaySpeed: .015, spread: .32,
  simScale: .4,                                  // sim @ 40% res
  lowColor:[.07,.07,.07], highColor:[.95,.07,.07], // black → blood-red peaks
  backgroundColor:[.07,.07,.07,1],
  reliefIntensity: 18, parallax: 8,
  baseAmbient: .08, activeAmbient: .25,
  diffuse: 2.2, specular: 1.8, shininess: 32,
  textureBrightnessPower:.8, textureBrightnessMin:.3, textureBrightnessMax:1,
  minAlpha:.35,
  mouseLightHeight:400, mouseLightRadius:600, mouseLightIntensity:1.5,
  shadowStrength:.4, repeatX:3, repeatY:3, autoResize:true
}
```

### 2.3 Why it feels so smooth (the engineering, not the art)

This is the part most relevant to our portfolio work:

1. **Decoupled simulation resolution** — physics at 40 % res, lighting at full res. The
   expensive feedback loop is cheap; the pretty pass is sharp.
2. **Single fullscreen triangle/quad**, no geometry, no depth buffer, no AA, no alpha
   buffer — minimal GPU state.
3. **Ping-pong textures** (`heightTex[2]/heightFbo[2]`, `ping^=1`) — zero CPU readback;
   the entire ripple state lives on the GPU.
4. **One coalesced RAF loop** (`loopTick → loop()`); a single `raf` handle, never stacked.
5. **`IntersectionObserver` pause/resume** — when `.relief-bg` scrolls off-screen the
   whole loop is `cancelAnimationFrame`'d (`pause()`); back on-screen → `resume()`.
   Zero GPU cost when not visible.
6. **`ResizeObserver`** (debounced through one RAF) instead of resize spam.
7. **All listeners `{passive:true}`** (`mousemove/mouseleave/touchmove/touchend/resize`)
   — never blocks the scroller.
8. **Idle vs. active scroll factor** — the component feeds scroll into the shader at
   `scrollFactorActive: .5` while actively scrolling vs `scrollFactorIdle: .25` when
   settled (`Math.abs(delta) <= 1`), and *accumulates* a smoothed scroll value
   (`n += (x-o)*factor`) rather than passing raw `scrollY`. This is the "weight"/lag
   that makes the parallax feel heavy and premium.
9. **Full teardown** on unmount (`destroy()` deletes every texture, FBO, buffer, program
   and removes every listener) — no leaks across SPA route changes.
10. **Mouse → sim-space remap** accounts for DPR and the sim/screen ratio every frame
    (`mouse.x*dpr*(simW/width)`), so it stays correct on retina + resize.

---

## 3. The text / reveal engine (`$stringTune`)

A custom Nuxt plugin drives almost all non-WebGL motion through **HTML attributes +
CSS classes**, not per-element JS animation. Elements declare intent declaratively:

| Attribute | Meaning (observed) |
|---|---|
| `string="split"` `string-split="char[random(0,10)]"` | Split into chars, animate each in with randomized 0–10 (frame/stagger) order — the scramble/“decode” headline effect |
| `string-split="char[center]"` | Split + reveal outward from the center |
| `string="progress"` `string-id="welcome"` | Emits a normalized **scroll-progress 0→1** on an event bus for that section |
| `string-copy-from="welcome"` | Slave one element’s animation to another’s progress |
| `string="spotlight"` | Cursor/scroll spotlight reveal on a block |
| `string="lazy"` | Lazy image: blurred `.webp` → decoded `blob:` swap, then `.-loaded` |
| `string="cursor"` | Custom cursor element |
| `string-enter-vp="top"`, `string-self-disable` | Viewport trigger config / one-shot |
| `.-inview`, `--l-delay:0.6` | Class + CSS custom-prop **stagger delay** added when in view |

The engine is an **event bus**: a section with `string="progress" string-id="welcome"`
publishes `object:progress:welcome` (a 0→1 float). Other components subscribe:

```js
$stringTune.on("object:progress:welcome", v => { /* drive an SVG path morph */ });
$stringTune.on("screen:mobile", isMobile => …);
```

### 3.1 Example: the hero arch reveal (real shipped code, de-minified)

The hero `<Welcome>` morphs an SVG `clipPath` (a quadratic Bézier "arch") as you scroll,
driven entirely by the progress bus — *not* by listening to scroll itself:

```js
const EPS = 0.001;
const pathFor = b => `M 0 1 L 0 0.75 Q 0.5 ${0 - b*0.75} 1 0.75 L 1 1 Z`;
let rafId = 0, pending = null, last = 0;
const apply = () => {
  rafId = 0; if (pending === null) return;
  const b = pending; pending = null;
  if (Math.abs(b - last) < EPS) return;          // skip sub-threshold writes
  archPath.value.setAttribute("d", pathFor(b));   // one DOM write per frame
  last = b;
};
const onProgress = b => {
  if (!Number.isFinite(b)) return;
  pending = b;
  if (!rafId) rafId = requestAnimationFrame(apply); // coalesce to 1 write/frame
};
$stringTune.on("object:progress:welcome", onProgress);
// onUnmounted: off() + cancelAnimationFrame + null out
```

Patterns worth copying verbatim:
- **rAF write-coalescing** (only ever one scheduled frame; latest value wins).
- **Epsilon gate** — never touch the DOM/attribute for changes < 0.001.
- **Subscribe to a progress signal, not to `scroll`** — one scroll owner, many consumers.
- **Strict teardown** in `onUnmounted` (`off`, `cancelAnimationFrame`, `pending=null`).

---

## 4. Smoothness & performance playbook (everything they do)

- Single global smooth-scroll owner; lerp/accumulate, broadcast progress events.
- One RAF per animator, coalesced; epsilon gates on DOM writes; `translate3d`,
  `will-change`, `cubic-bezier` for compositor-only animation.
- `IntersectionObserver` to pause anything expensive off-screen (the whole WebGL loop).
- `ResizeObserver` (RAF-debounced) over `resize` listeners; all listeners `passive`.
- `matchMedia` used heavily (~25×) — responsive breakpoints **and**
  `prefers-reduced-motion` is respected.
- Lazy images with blurred LQIP → `blob:` full-res swap; everything `.webp`.
- Per-route code splitting (`places`/`objects` chunks load on demand).
- WebGL kept cheap by construction: low-res sim, no depth/AA/alpha, GPU-only state,
  full resource teardown on unmount.
- The "premium weight" is deliberate **lag**: smoothed/accumulated scroll with distinct
  active vs idle gain, not 1:1 mapping.

---

## 5. What we should take into our portfolio (`portfolio-vN`) work

1. **A relief/lamp WebGL background is reproducible without three.js.** The whole effect
   is ~2 small shaders + a ping-pong loop. We could do an obsidian/“motion” variant:
   logo or showreel poster as the height source, cursor lamp reveal, scroll-locked.
2. **Adopt the progress-bus pattern.** One scroll owner emitting `progress:section`
   events; sections subscribe. Decouples our pin/scrub logic from GSAP internals and
   makes reduced-motion a single switch.
3. **Steal the smoothness checklist** (Section 4) as a hard gate before merging any
   animation branch — especially IntersectionObserver-pause for any canvas, and the
   rAF-coalesce + epsilon-gate idiom for any scroll-driven DOM write.
4. **Declarative reveal attributes** (`string-split`, `--l-delay` stagger) are cleaner
   than per-component GSAP timelines for text — consider a small directive.
5. **Deliberate lag = luxury.** Our parallax should accumulate/lerp with an
   active-vs-idle gain, not track scroll 1:1.
6. **Art direction:** near-black base, single saturated accent at relief peaks
   (`[.95,.07,.07]`), one editorial serif + one grotesk, blurred-LQIP everywhere.

---

## Appendix A — Pass 2 (relief lighting) full source

```glsl
precision mediump float;
varying vec2 v_uv;
uniform sampler2D u_height, u_tex;
uniform vec2 u_resolution, u_simRes, u_imgRes; uniform float u_scrollY; uniform vec2 u_repeat;
uniform vec3 u_lowColor, u_highColor; uniform float u_minAlpha;
uniform float u_reliefIntensity, u_parallax;
uniform float u_baseAmbient, u_activeAmbient, u_diffuse, u_specular, u_shininess;
uniform vec2 u_mouse;
uniform float u_mouseLightHeight, u_mouseLightRadius, u_mouseLightIntensity, u_shadowStrength;
uniform int u_hasImage;
float lum(vec3 c){ return dot(c, vec3(0.299,0.587,0.114)); }
vec3 calcNormal(vec2 uv, vec2 res, float intensity, float centerLum){
  vec2 t = 1.0/res;
  float cx = lum(texture2D(u_tex,uv+vec2(t.x,0.)).rgb)-centerLum;
  float cy = lum(texture2D(u_tex,uv+vec2(0.,t.y)).rgb)-centerLum;
  return normalize(vec3(-cx*intensity,-cy*intensity,1.0));
}
vec3 calcHeightNormal(vec2 uv, vec2 res, float ch){
  vec2 t = 1.0/res;
  float cx = texture2D(u_height,uv+vec2(t.x,0.)).r-ch;
  float cy = texture2D(u_height,uv+vec2(0.,t.y)).r-ch;
  return normalize(vec3(-cx*20.0,-cy*20.0,1.0));
}
void main(){
  if(u_hasImage==0){ gl_FragColor=vec4(0.,0.,0.,1.); return; }
  float heightValue = texture2D(u_height,v_uv).r;
  float pageY = (u_resolution.y - gl_FragCoord.y) + u_scrollY;
  vec2 texUV = fract((vec2(gl_FragCoord.x,pageY)/u_imgRes)*u_repeat);
  vec3 baseSample = texture2D(u_tex,texUV).rgb;
  float texHeight = lum(baseSample);
  float combinedHeight = heightValue*texHeight;
  float heightT = clamp(combinedHeight,0.,1.);
  vec3 albedo = mix(u_lowColor,u_highColor,heightT);
  vec3 nTex = calcNormal(texUV,u_imgRes,u_reliefIntensity*combinedHeight,texHeight);
  vec3 nHeight = calcHeightNormal(v_uv,u_simRes,heightValue);
  vec3 combinedNormal = normalize(vec3(nTex.xy+nHeight.xy*combinedHeight,1.0));
  vec2 parallaxUV = fract(texUV + combinedNormal.xy*(u_parallax/u_imgRes)*combinedHeight);
  float parallaxLum = lum(texture2D(u_tex,parallaxUV).rgb);
  vec3 finalNormal = calcNormal(parallaxUV,u_imgRes,u_reliefIntensity*combinedHeight,parallaxLum);
  finalNormal = normalize(vec3(finalNormal.xy+nHeight.xy*combinedHeight,1.0));
  const vec3 L = vec3(0.4472,0.5367,0.7155);
  const vec3 V = vec3(0.0,0.0,1.0);
  float fixedDiff = max(dot(finalNormal,L),0.0);
  vec3 fixedR = reflect(-L,finalNormal);
  float fixedSpec = pow(max(dot(V,fixedR),0.0),u_shininess);
  vec3 fixedLighting = combinedHeight*(u_diffuse*fixedDiff+u_specular*fixedSpec)*albedo;
  vec3 mouseLighting = vec3(0.0);
  if(u_mouse.x > -9000.0){
    vec3 mousePos3D = vec3(u_mouse.x,u_mouse.y,u_mouseLightHeight);
    vec3 surfacePos = vec3(gl_FragCoord.xy, combinedHeight*u_reliefIntensity);
    vec3 toMouse = mousePos3D-surfacePos;
    float mouseDist = length(toMouse);
    vec3 mouseDir = normalize(toMouse);
    float att = 1.0 - smoothstep(0.0,u_mouseLightRadius,mouseDist);
    float ndl = max(dot(finalNormal,mouseDir),0.0);
    float shadow = 1.0;
    if(combinedHeight>0.05){
      float ang = max(0.0,-mouseDir.z);
      shadow = clamp(1.0 - combinedHeight*ang*u_shadowStrength*att, 0.2, 1.0);
    }
    float md = ndl*u_diffuse*att*u_mouseLightIntensity*shadow;
    vec3 mr = reflect(-mouseDir,finalNormal);
    float ms = pow(max(dot(V,mr),0.0),u_shininess*0.8)*u_specular*att*u_mouseLightIntensity*shadow;
    mouseLighting = (md+ms)*albedo;
  }
  float ambient = mix(u_baseAmbient,u_activeAmbient,combinedHeight);
  vec3 lit = albedo*ambient + fixedLighting + mouseLighting;
  vec3 color = mix(albedo,lit,combinedHeight);
  float alpha = mix(u_minAlpha,1.0,smoothstep(0.0,0.05,heightValue));
  gl_FragColor = vec4(color,alpha);
}
```

## Appendix B — Page structure

8 sections, ~18 k px scroll height: `c-welcome` (hero, arch reveal) → `c-places`
(7-item carousel "Lower Hall / Silent Room… 1/7") → `c-places-after` → `c-objects`
→ `c-connection` → `c-updates` → `c-people` → `c-admission` (form) → footer
(SVG mask + path). The relief canvas spans the whole page behind content;
section background photos (`offices/*`, `objects-init/*`) lazy-load on enter.
