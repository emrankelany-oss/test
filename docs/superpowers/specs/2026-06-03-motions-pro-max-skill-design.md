# motions-pro-max — Skill Design

**Date:** 2026-06-03
**Status:** Approved, building
**Author:** Emran Kelany (via Claude)

## Purpose

A single global skill that turns the entire V2–V23 portfolio animation body-of-work
**plus** the external animation study/teardown docs (Lusion, studioclim/Clim, Obsidian
Assembly, Lenis.dev, GSAP-scroll, motion-design principles) into a reusable, guided
motion engine for any future project. When invoked, it sets up dependencies, proposes an
animation plan from a complete catalog, and builds the chosen techniques into the target
project.

## Locked Decisions

| Decision | Choice |
|---|---|
| Variety model | **Full catalog, always** — the complete technique index is always loaded |
| Skill behavior | **Guided plan → build** (setup → propose plan → implement) |
| Tech scope | **Everything used**: GSAP+ScrollTrigger, Lenis, Framer Motion, Three.js/R3F, Lottie, CSS |
| Install location | **Global** `~/.claude/skills/motions-pro-max/` |
| Dependency setup | **Auto-setup** — detect missing deps, `npm install`, wire Lenis↔GSAP, register ScrollTrigger |
| Catalog organization | **By technique, deduped by implementation** — all distinct variants kept |
| Sources | All 22 version dirs + base `portfolio` + `home` + `obsidian-hero` + 7 study docs |

### Dedup rule (important)
Dedup = collapse **identical implementations** only. Distinct *variants* are separate
entries. Example: if 8 different hover effects exist across versions, all 8 are catalogued
as separate techniques — we do NOT reduce a category to one representative.

## Architecture

The "full catalog always" vs. context-size tension is resolved with the standard
progressive-disclosure skill pattern:

- **`SKILL.md`** always loads. It contains the **complete technique INDEX** (every
  technique as one catalog row: `id · name · category · what-it-does · libs · tags ·
  source versions/docs · → reference file`) plus the plan→setup→build workflow. This *is*
  the always-visible full catalog/menu.
- **`references/*.md`** hold the actual paste-ready code + "when to use" for each
  technique, grouped by category. Loaded on-demand only for techniques chosen during
  plan+build, so heavy code never bloats context while nothing is hidden from the menu.

### File layout
```
~/.claude/skills/motions-pro-max/
  SKILL.md               # router + FULL technique index + plan→setup→build workflow
  references/
    setup.md             # dep detection + auto-install, Lenis↔GSAP ticker, ScrollTrigger reg, reduced-motion
    scroll.md            # pins, parallax, horizontal, scrub timelines, scroll-drawn filament, reveals
    hover.md             # ALL hover variants: magnetic, dual-layer media-swap, tile, iris, cursor-follow…
    cursor-drag.md       # magnetic/custom cursor, momentum-drag carousel
    text.md              # split-line/char reveals, kinetic type, filament glyphs
    preloader.md         # monogram assembly, cinemascope split, divider repurpose, launch sequence
    transitions.md       # page/scene transitions, iris reveals, in-frame (enter) / out-frame (exit)
    webgl.md             # R3F/Three: relief-lamp hero, flow-field bg, project universe, shaders
    motion-principles.md # easing/timing/stagger/Lenis tuning — distilled from study docs
```

## Catalog categories
Scroll · Hover · Cursor/Drag · Text · Preloader · Transitions (in-frame / out-frame) ·
WebGL · Motion Principles. Catalog = (every technique across V2–V23 + base + home +
obsidian-hero) ∪ (every technique in the 7 study docs), deduped by implementation, all
variants kept, every entry source-attributed (e.g. `source: V23 + studioclim`).

## Runtime behavior (when the user invokes the skill later)
1. **Setup** — detect target project stack/deps; auto-`npm install` missing
   (GSAP/Lenis/Framer/Three/Lottie); wire Lenis↔GSAP ticker, register ScrollTrigger, add a
   reduced-motion guard.
2. **Plan** — read the page/goal; propose an animation plan selecting techniques by id from
   the catalog with rationale; user approves/adjusts.
3. **Build** — implement chosen techniques adapted to the project stack, using the
   reference code as the base.

## Build method (this session)
Multi-agent workflow:
- **Phase 1 — Analyze (fan out):** one agent per version dir + base + home + obsidian-hero,
  plus one agent per study doc. Each returns a structured list of techniques
  `{id, name, category, mechanism, libs, keyCode, sourceFile, sourceVersion, tags, whenToUse}`.
- **Phase 2 — Synthesize per category:** bucket techniques by category; per-category agents
  dedupe (keep all variants) and write each `references/*.md` with full code.
- **Phase 3 — Index + setup:** main loop writes `SKILL.md` (the always-loaded index) and
  `setup.md`, then verifies the skill loads and the index covers every catalogued technique.

## Success criteria
- Skill is discoverable globally and loads via the Skill tool.
- SKILL.md index lists every distinct technique with source attribution.
- Every index row resolves to real code in a reference file.
- All distinct hover (and other category) variants are present — none collapsed away.
- Study-doc techniques (Lusion/Clim/Obsidian/Lenis/GSAP) are included and attributed.
- Auto-setup correctly detects and installs missing deps and wires Lenis+GSAP+ScrollTrigger.
