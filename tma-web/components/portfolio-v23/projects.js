// V23 sources its content from the shared v20 roster — single source of truth.
import { PROJECTS, PROJECTS_BY_SLUG } from "@/components/portfolio-v20/projects";
// The canonical Foodics/Zid film mapping that V20/V22 already established.
import { SHOWREEL } from "@/components/portfolio-v22/showreel";

export { PROJECTS, PROJECTS_BY_SLUG };

const has = (slug) => PROJECTS_BY_SLUG[slug];
const pick = (slugs) => slugs.map(has).filter(Boolean);

// Projects whose only still is too low-res (≈318–489px) to fill a large cell —
// these render as crisp designed TMA-blue poster cards instead of a blurry photo.
// Swap a slug out the moment a high-res image is dropped into its folder.
// These had stills too low-res to fill a large cell, so we cropped each brand's
// real tile out of the deck (`/assets/portfolio/<slug>/deck.jpg`) to use as the
// crisp card image. Swap a slug out once a better source image arrives.
export const DECK_CARD_SLUGS = new Set([
  "avis",
  "electrolux",
  "almarai",
  "mixy",
  "tawasol",
  "vanellis",
  "buffalo-wild-wings",
  "lg-lifes-good",
  "burger-king-krispier",
]);
export const hasDeckCard = (slug) => DECK_CARD_SLUGS.has(slug);

// Logo tiles rendered `contain` on their brand colour so the wordmark is never
// cropped. Value = the card background (matches each tile's composited bg).
export const DECK_FIT = {
  "buffalo-wild-wings": "#111111",
  vanellis: "#C8102E",
  tawasol: "#2C95CE",
  mixy: "#ffffff",
  almarai: "#ffffff",
};
export const deckFit = (slug) => DECK_FIT[slug];
export const deckCard = (slug) => `/assets/portfolio/${slug}/deck.jpg`;
// resolved best card image for a project
export const cardImage = (p) =>
  hasDeckCard(p.slug) ? deckCard(p.slug) : p.hero || p.thumb;

// ── Featured deep studies (Clim's case_info_els, scoped to ONE project) ─────
// Each featured project renders as its own asymmetric media grid built from the
// real films in SHOWREEL. Spans/ratios give the Clim editorial rhythm.
// type: "video" (autoplay loop) | "youtube" (poster + play badge → opens film).
const FEATURED_SLUGS = ["foodics-boundless", "zid-ripple"];

// hand-tuned layout rhythm per featured project (index-aligned to its films)
const FEATURED_LAYOUT = {
  "foodics-boundless": [
    { span: 1, ratio: "16 / 9" },
    { span: 2, ratio: "4 / 5" },
    { span: 2, ratio: "4 / 5" },
    { span: 1, ratio: "16 / 7" },
    { span: 2, ratio: "1 / 1" },
    { span: 2, ratio: "1 / 1" },
    { span: 1, ratio: "16 / 9" },
  ],
  "zid-ripple": [
    { span: 2, ratio: "16 / 10" },
    { span: 2, ratio: "16 / 10" },
  ],
};

function buildFeatured(slug) {
  const project = has(slug);
  const reel = SHOWREEL.find((r) => r.slug === slug);
  if (!project || !reel) return null;
  const layout = FEATURED_LAYOUT[slug] || [];
  const media = reel.films.map((f, i) => {
    const box = layout[i] || { span: i % 3 === 0 ? 1 : 2, ratio: "4 / 5" };
    if (f.kind === "youtube") {
      return {
        kind: "youtube",
        youtubeId: f.youtubeId,
        href: `https://www.youtube.com/watch?v=${f.youtubeId}`,
        poster: f.poster,
        title: f.title,
        group: f.group,
        ...box,
      };
    }
    return { kind: "video", src: f.src, poster: f.poster, title: f.title, group: f.group, ...box };
  });
  return {
    slug,
    client: project.client,
    title: project.title,
    tagline: project.tagline,
    category: project.category,
    year: project.year,
    intro: project.intro,
    results: project.results || [],
    media,
  };
}

export const FEATURED = FEATURED_SLUGS.map(buildFeatured).filter(Boolean);

// ── Work grid (Clim's case_info_els) — the full remaining roster ────────────
// Everything except the featured studies, in an asymmetric full/half rhythm.
// `span` 1 = full-width row, 2 = half-width (two per row). Ratios vary heights.
const SPAN_RHYTHM = [1, 2, 2, 1, 2, 2, 2, 2]; // repeating editorial cadence
const RATIO_FULL = ["16 / 9", "16 / 7"];
const RATIO_HALF = ["4 / 5", "1 / 1", "4 / 5", "3 / 4"];

export const WORK_GRID = PROJECTS.filter((p) => !FEATURED_SLUGS.includes(p.slug)).map(
  (project, i) => {
    const span = SPAN_RHYTHM[i % SPAN_RHYTHM.length];
    const ratio =
      span === 1
        ? RATIO_FULL[i % RATIO_FULL.length]
        : RATIO_HALF[i % RATIO_HALF.length];
    return { slug: project.slug, project, span, ratio, image: cardImage(project) };
  }
);

// Real work images for the project modal gallery: deck crop + hero + gallery,
// de-duplicated, in a sensible reading order.
export const projectGallery = (p) => {
  if (!p) return [];
  const out = [];
  if (hasDeckCard(p.slug)) out.push(deckCard(p.slug));
  if (p.hero) out.push(p.hero);
  if (Array.isArray(p.gallery)) out.push(...p.gallery);
  if (p.thumb) out.push(p.thumb);
  return [...new Set(out)];
};

// ── Related / More Work carousel (Clim's case_related) ──────────────────────
// Lead with the video-led production films for motion on the cards.
export const CAROUSEL = pick([
  "rubicon-exotic",
  "linc-card",
  "zaintech-drones",
  "investcorp-capital",
  "world-government-summit",
  "mawani-vision-2030",
  "family-development-finance",
  "sharjah-data-smart-gov",
  "vodafone-global",
  "lsc-vision-2034",
]);

// ── Statement copy (Clim's case_info_st intro) ──────────────────────────────
export const STATEMENT = {
  eyebrow: "The Motion Agency — Studio",
  panelWord: "Bold",
  lead:
    "Almost a decade of turning category noise into bold, ownable stories. We are a motion-led creative studio — strategy, design and production crafted to a standard that earns attention.",
  more:
    "From early-stage positioning to flagship launch films, we embed with your team end-to-end. Every frame is built to move markets, not just eyeballs — concept, art direction, animation and delivery under one roof.",
};
