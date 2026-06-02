// V23 sources its content from the shared v20 roster — single source of truth.
import { PROJECTS, PROJECTS_BY_SLUG } from "@/components/portfolio-v20/projects";

export { PROJECTS, PROJECTS_BY_SLUG };

const has = (slug) => PROJECTS_BY_SLUG[slug];
const pick = (slugs) => slugs.map(has).filter(Boolean);

// Projects that ship a production/animation film — these become the video-led cells.
export const VIDEO_PROJECTS = PROJECTS.filter((p) => p.video);

// ── Work grid (Clim's case_info_els) ───────────────────────────────────────
// An asymmetric editorial rhythm: full-width "el_1" rows alternating with
// half-width "el_2" pairs, with varied aspect ratios. `span` = 1 (full) | 2 (half).
// `ratio` drives the cell aspect-ratio so the column heights vary like Clim's.
export const WORK_GRID = [
  { slug: "rubicon-exotic", span: 1, ratio: "16 / 9" },
  { slug: "zaintech-drones", span: 2, ratio: "4 / 5" },
  { slug: "linc-card", span: 2, ratio: "4 / 5" },
  { slug: "vodafone-global", span: 1, ratio: "16 / 7" },
  { slug: "investcorp-capital", span: 2, ratio: "1 / 1" },
  { slug: "mawani-vision-2030", span: 2, ratio: "1 / 1" },
  { slug: "lsc-vision-2034", span: 1, ratio: "16 / 9" },
  { slug: "world-government-summit", span: 2, ratio: "4 / 5" },
  { slug: "family-development-finance", span: 2, ratio: "4 / 5" },
  { slug: "sharjah-data-smart-gov", span: 1, ratio: "16 / 7" },
]
  .map((c) => ({ ...c, project: has(c.slug) }))
  .filter((c) => c.project);

// ── Related / More Work carousel (Clim's case_related) ──────────────────────
export const CAROUSEL = pick([
  "rubicon-exotic",
  "linc-card",
  "zaintech-drones",
  "investcorp-capital",
  "world-government-summit",
  "mawani-vision-2030",
  "family-development-finance",
  "sharjah-data-smart-gov",
]);

// ── Statement copy (Clim's case_info_st intro) ──────────────────────────────
export const STATEMENT = {
  eyebrow: "The Motion Agency — Studio",
  // The rotated accent word sits inside the panel, Clim-style.
  panelWord: "Bold",
  lead:
    "Almost a decade of turning category noise into bold, ownable stories. We are a motion-led creative studio — strategy, design and production crafted to a standard that earns attention.",
  more:
    "From early-stage positioning to flagship launch films, we embed with your team end-to-end. Every frame is built to move markets, not just eyeballs — concept, art direction, animation and delivery under one roof.",
};
