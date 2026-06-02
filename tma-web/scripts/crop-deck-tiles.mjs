import sharp from "sharp";
import { mkdirSync } from "fs";

const RAW = "public/assets/portfolio/_raw";
const OUT = "public/assets/portfolio";

// crop boxes measured on the 1440x810 deck page renders.
// { slug, page, left, top, width, height }
const CROPS = [
  { slug: "avis", page: 28, left: 8, top: 8, width: 300, height: 250 },
  { slug: "mixy", page: 28, left: 1090, top: 10, width: 252, height: 246 },
  { slug: "lg-lifes-good", page: 28, left: 712, top: 280, width: 300, height: 238 },
  { slug: "tawasol", page: 28, left: 712, top: 548, width: 300, height: 238 },
  { slug: "almarai", page: 29, left: 330, top: 8, width: 360, height: 244 },
  { slug: "electrolux", page: 29, left: 18, top: 548, width: 330, height: 224 },
  { slug: "vanellis", page: 27, left: 8, top: 8, width: 300, height: 250 },
  { slug: "buffalo-wild-wings", page: 27, left: 760, top: 300, width: 300, height: 215 },
  { slug: "burger-king-krispier", page: 26, left: 6, top: 10, width: 276, height: 224 },
];

mkdirSync("tmp/crops", { recursive: true });

const montageParts = [];
for (const c of CROPS) {
  const src = `${RAW}/page-${String(c.page).padStart(2, "0")}.png`;
  const outDir = `${OUT}/${c.slug}`;
  mkdirSync(outDir, { recursive: true });
  const outFile = `${outDir}/deck.jpg`;
  await sharp(src)
    .extract({ left: c.left, top: c.top, width: c.width, height: c.height })
    .resize(900, 720, { fit: "cover", position: "centre" })
    .jpeg({ quality: 86 })
    .toFile(outFile);
  // small thumb for the montage
  const thumb = `tmp/crops/${c.slug}.jpg`;
  await sharp(outFile).resize(300, 240).jpeg({ quality: 80 }).toFile(thumb);
  montageParts.push({ slug: c.slug, thumb });
  console.log("cropped", c.slug, "->", outFile);
}

// build a labelled 4-col montage for visual verification
const cols = 4;
const tw = 300, th = 240, pad = 6;
const rows = Math.ceil(montageParts.length / cols);
const W = cols * tw + (cols + 1) * pad;
const H = rows * th + (rows + 1) * pad;
const composites = [];
for (let i = 0; i < montageParts.length; i++) {
  const r = Math.floor(i / cols), col = i % cols;
  composites.push({
    input: montageParts[i].thumb,
    left: pad + col * (tw + pad),
    top: pad + r * (th + pad),
  });
}
await sharp({ create: { width: W, height: H, channels: 3, background: "#111" } })
  .composite(composites)
  .jpeg({ quality: 82 })
  .toFile("tmp/crops/_montage.jpg");
console.log("montage -> tmp/crops/_montage.jpg  order:", montageParts.map((m) => m.slug).join(", "));
