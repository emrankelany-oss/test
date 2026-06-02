import sharp from "sharp";
import { readFileSync, mkdirSync } from "fs";

const OUT = "public/assets/portfolio";
const SIZE = 1200;

// near-white tile for colour logos; brand-tinted for the deck-crop fallbacks
const LIGHT = "#f3f3f5";

// 5 brands with real vector logos from Wikimedia → logo centred on a clean tile
const LOGO_TILES = [
  { slug: "lg-lifes-good", svg: "tmp/logos/lg.svg", bg: LIGHT, pad: 0.60 },
  { slug: "burger-king-krispier", svg: "tmp/logos/burger-king.svg", bg: LIGHT, pad: 0.62 },
  { slug: "electrolux", svg: "tmp/logos/electrolux.svg", bg: LIGHT, pad: 0.66 },
  { slug: "avis", svg: "tmp/logos/avis.svg", bg: LIGHT, pad: 0.58 }, // AVIS red wordmark on light
];

// Almarai → its real fleet photo (relevant to "Fleet & Trade")
const PHOTO_TILES = [
  { slug: "almarai", img: "tmp/logos/almarai-fleet.jpg" },
];

// brands with no external asset → re-pad the cleaned deck crop on its brand
// colour. Rendered `contain` in the card (see DECK_FIT) so they're never cut;
// bg here must match the card bg so the letterbox is seamless.
const FALLBACK_TILES = [
  { slug: "buffalo-wild-wings", bg: "#111111", pad: 0.9 },
  { slug: "vanellis", bg: "#C8102E", pad: 0.9 },
  { slug: "tawasol", bg: "#2C95CE", pad: 0.94 },
  { slug: "mixy", bg: "#ffffff", pad: 0.9 },
];

const tiles = [];

for (const t of LOGO_TILES) {
  const box = Math.round(SIZE * t.pad);
  const logo = await sharp(readFileSync(t.svg), { density: 360 })
    .resize(box, box, { fit: "inside", withoutEnlargement: false })
    .png()
    .toBuffer();
  const out = `${OUT}/${t.slug}/deck.jpg`;
  await sharp({ create: { width: SIZE, height: SIZE, channels: 3, background: t.bg } })
    .composite([{ input: logo, gravity: "centre" }])
    .jpeg({ quality: 90 })
    .toFile(out);
  tiles.push({ slug: t.slug, out });
  console.log("logo tile", t.slug);
}

for (const t of PHOTO_TILES) {
  const out = `${OUT}/${t.slug}/deck.jpg`;
  await sharp(t.img).resize(SIZE, SIZE, { fit: "cover", position: "centre" }).jpeg({ quality: 88 }).toFile(out);
  tiles.push({ slug: t.slug, out });
  console.log("photo tile", t.slug);
}

for (const t of FALLBACK_TILES) {
  const src = `${OUT}/${t.slug}/deck.jpg`; // current deck crop
  const box = Math.round(SIZE * t.pad);
  const inner = await sharp(readFileSync(src)).resize(box, box, { fit: "inside" }).toBuffer();
  const out = `${OUT}/${t.slug}/deck.jpg`;
  await sharp({ create: { width: SIZE, height: SIZE, channels: 3, background: t.bg } })
    .composite([{ input: inner, gravity: "centre" }])
    .jpeg({ quality: 90 })
    .toFile(out);
  tiles.push({ slug: t.slug, out });
  console.log("fallback tile", t.slug);
}

// montage for verification
const cols = 3, tw = 300, th = 300, pad = 6;
const rows = Math.ceil(tiles.length / cols);
const W = cols * tw + (cols + 1) * pad, H = rows * th + (rows + 1) * pad;
const comps = [];
for (let i = 0; i < tiles.length; i++) {
  const thumb = await sharp(tiles[i].out).resize(tw, th).toBuffer();
  comps.push({ input: thumb, left: pad + (i % cols) * (tw + pad), top: pad + Math.floor(i / cols) * (th + pad) });
}
await sharp({ create: { width: W, height: H, channels: 3, background: "#222" } })
  .composite(comps).jpeg({ quality: 84 }).toFile("tmp/logos/_montage.jpg");
console.log("montage order:", tiles.map((t) => t.slug).join(", "));
