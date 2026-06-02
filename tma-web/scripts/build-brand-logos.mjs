import sharp from "sharp";
import { readFileSync } from "fs";

const OUT = "public/assets/portfolio";
const S = 1200;

// regional brand logos cropped from the 2x deck page renders (2880x1620),
// composited centred on their brand colour. Coords = 2x the 1440 crop boxes.
const REGIONAL = [
  { slug: "vanellis", page: 27, box: [36, 32, 572, 464], bg: "#C8102E", pad: 0.84 },
  { slug: "buffalo-wild-wings", page: 27, box: [1400, 598, 596, 460], bg: "#111111", pad: 0.86 },
  { slug: "mixy", page: 28, box: [2184, 12, 496, 500], bg: "#ffffff", pad: 0.82 },
  { slug: "tawasol", page: 28, box: [1430, 1102, 536, 458], bg: "#2C95CE", pad: 0.9 },
];

// real vector logos composited on a clean tile
const VECTOR = [
  { slug: "almarai", svg: "tmp/logos/almarai-logo.svg", bg: "#ffffff", pad: 0.6 },
];

const tiles = [];

for (const r of REGIONAL) {
  const [left, top, width, height] = r.box;
  const crop = await sharp(`tmp/hires/page-${r.page}.png`).extract({ left, top, width, height }).toBuffer();
  const box = Math.round(S * r.pad);
  const inner = await sharp(crop).resize(box, box, { fit: "inside" }).toBuffer();
  const out = `${OUT}/${r.slug}/deck.jpg`;
  await sharp({ create: { width: S, height: S, channels: 3, background: r.bg } })
    .composite([{ input: inner, gravity: "centre" }])
    .jpeg({ quality: 92 })
    .toFile(out);
  tiles.push({ slug: r.slug, out });
  console.log("regional", r.slug);
}

for (const v of VECTOR) {
  const box = Math.round(S * v.pad);
  const logo = await sharp(readFileSync(v.svg), { density: 384 }).resize(box, box, { fit: "inside" }).png().toBuffer();
  const out = `${OUT}/${v.slug}/deck.jpg`;
  await sharp({ create: { width: S, height: S, channels: 3, background: v.bg } })
    .composite([{ input: logo, gravity: "centre" }])
    .jpeg({ quality: 92 })
    .toFile(out);
  tiles.push({ slug: v.slug, out });
  console.log("vector", v.slug);
}

// montage
const cols = 3, tw = 300, th = 300, pad = 6;
const rows = Math.ceil(tiles.length / cols);
const comps = [];
for (let i = 0; i < tiles.length; i++) {
  const t = await sharp(tiles[i].out).resize(tw, th).toBuffer();
  comps.push({ input: t, left: pad + (i % cols) * (tw + pad), top: pad + Math.floor(i / cols) * (th + pad) });
}
await sharp({ create: { width: cols * (tw + pad) + pad, height: rows * (th + pad) + pad, channels: 3, background: "#222" } })
  .composite(comps).jpeg().toFile("tmp/logos/_logos.jpg");
console.log("montage:", tiles.map((t) => t.slug).join(", "));
