// Extract per-project image assets from the TMA PDF.
//
// Step 1: render every PDF page at high resolution into a _raw cache.
// Step 2: copy/crop selected pages into per-project asset folders.
// Step 3: use sharp to compress to JPG so the final bundle stays light.
//
// Re-run any time the PDF is updated.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as mupdf from "mupdf";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "../.."); // .../the-motion-agency-web-main
const PDF = path.join(ROOT, "TMA _ Where Strategy Meets Bold Storytelling.pdf");
const RAW_DIR = path.join(ROOT, "tma-web/public/assets/portfolio/_raw");
const OUT_DIR = path.join(ROOT, "tma-web/public/assets/portfolio");

fs.mkdirSync(RAW_DIR, { recursive: true });

// ----- 1. RENDER ALL PAGES AT 2x ------------------------------------------
const buf = fs.readFileSync(PDF);
const doc = mupdf.Document.openDocument(buf, "application/pdf");
const nPages = doc.countPages();
const SCALE = 2.0; // 2x of PDF user space → ~1600px wide for a 16:9 PDF
const matrix = [SCALE, 0, 0, SCALE, 0, 0];

console.log(`Rendering ${nPages} pages at ${SCALE}x → ${RAW_DIR}`);
for (let i = 0; i < nPages; i++) {
  const out = path.join(RAW_DIR, `page-${String(i + 1).padStart(2, "0")}.png`);
  if (fs.existsSync(out)) continue; // idempotent
  const page = doc.loadPage(i);
  const pix = page.toPixmap(matrix, mupdf.ColorSpace.DeviceRGB, false, true);
  fs.writeFileSync(out, pix.asPNG());
  console.log(`  rendered page ${i + 1}`);
}

// ----- 2. MANIFEST: project → page sources + crop boxes -------------------
// Each entry is a slug and an ordered list of image sources. A source is
// either a whole page (string "page-NN") or a crop { page, l, t, w, h }
// where l/t/w/h are FRACTIONS (0–1) of the rendered page.
// Crop fractions come from inspecting the rendered PNGs.

const MANIFEST = {
  // ── 2 deep case studies ──────────────────────────────────────────────
  "foodics-boundless": [
    { src: "page-14", as: "hero.jpg",    crop: { l: 0.42, t: 0.0,  w: 0.58, h: 1.0 } }, // right half = Boundless 22 cafe + key art
    { src: "page-32", as: "brand.jpg" },                                                  // Foodics brand-guidelines collage
    { src: "page-43", as: "social.jpg" },                                                 // Foodics Ramadan social row
    { src: "page-44", as: "social-2.jpg" },                                               // Foodics ONE / Waqit / Foodics Man
    { src: "page-50", as: "render.jpg" },                                                 // POS hardware render
    { src: "page-64", as: "tvc.jpg" },                                                    // 3-character TVC stills
    { src: "page-13", as: "intro.jpg",   crop: { l: 0.45, t: 0.05, w: 0.55, h: 0.9 } }, // case-study intro right pane
  ],
  "zid-ripple": [
    { src: "page-18", as: "hero.jpg",    crop: { l: 0.42, t: 0.0,  w: 0.58, h: 1.0 } }, // Ripple keynote + phone
    { src: "page-31", as: "brand.jpg" },                                                  // Zid brand collage
    { src: "page-42", as: "social.jpg" },                                                 // National Day 40% social
    { src: "page-59", as: "landing.jpg" },                                                // "Turn your big idea" landing
    { src: "page-60", as: "landing-2.jpg" },                                              // "Launchpad to the stars" landing
    { src: "page-74", as: "tvc.jpg" },                                                    // Saudi elder TVC phones
  ],

  // ── 12 short brand entries ───────────────────────────────────────────
  "sol-brand": [
    { src: "page-41", as: "hero.jpg" },     // Sol Heritage / Ramadan posts
    { src: "page-71", as: "tvc.jpg" },      // Sol purple room TVC
  ],
  "salasa-2034": [
    { src: "page-37", as: "hero.jpg" },     // FIFA 2034 + National Day social
    { src: "page-38", as: "alt.jpg" },      // Shipping partners + Ramadan
  ],
  "lsc-vision-2034": [
    { src: "page-39", as: "hero.jpg" },     // AI shipping / Vision 2034 / Ramadan
    { src: "page-40", as: "alt.jpg" },      // Meet the team WCA
  ],
  "invoiceq-identity": [
    { src: "page-34", as: "hero.jpg" },     // InvoiceQ identity collage
  ],
  "transform-identity": [
    { src: "page-33", as: "hero.jpg" },     // Transform yellow-black identity
  ],
  "fraed-international": [
    { src: "page-35", as: "hero.jpg" },     // Fra'ed apparel + packaging
  ],
  "burger-king-krispier": [
    { src: "page-26", as: "hero.jpg",  crop: { l: 0.0,  t: 0.0,  w: 0.34, h: 0.66 } }, // BK quadrant of mosaic
  ],
  "lg-lifes-good": [
    { src: "page-26", as: "hero.jpg",  crop: { l: 0.0,  t: 0.32, w: 0.34, h: 0.34 } }, // LG Life's Good square
    { src: "page-28", as: "alt.jpg",   crop: { l: 0.68, t: 0.32, w: 0.32, h: 0.32 } }, // LG Life's Good blue panel
  ],
  "vodafone-global": [
    { src: "page-47", as: "hero.jpg" },     // "Global" hero on city aerial
    { src: "page-73", as: "alt.jpg" },      // Vodafone "9" speech bubble
  ],
  "foodics-pay": [
    { src: "page-61", as: "hero.jpg" },     // "Zero Delay" landing
  ],
  "foodics-display": [
    { src: "page-62", as: "hero.jpg" },     // "Customer Display Screen" landing
  ],
  "foodics-egypt-ooh": [
    { src: "page-65", as: "hero.jpg" },     // Egypt billboard mosaic
  ],
};

// ----- 3. CROP / COPY / COMPRESS ------------------------------------------
async function process() {
  for (const [slug, sources] of Object.entries(MANIFEST)) {
    const slugDir = path.join(OUT_DIR, slug);
    fs.mkdirSync(slugDir, { recursive: true });

    for (const src of sources) {
      const inPath = path.join(RAW_DIR, `${src.src}.png`);
      const outPath = path.join(slugDir, src.as);
      if (!fs.existsSync(inPath)) {
        console.warn(`  ! missing ${inPath}`);
        continue;
      }
      let img = sharp(inPath);
      const meta = await img.metadata();
      if (src.crop) {
        const { l, t, w, h } = src.crop;
        img = img.extract({
          left:   Math.floor(l * meta.width),
          top:    Math.floor(t * meta.height),
          width:  Math.floor(w * meta.width),
          height: Math.floor(h * meta.height),
        });
      }
      // also make a thumb.jpg for the first asset of each project
      await img.jpeg({ quality: 82, mozjpeg: true }).toFile(outPath);
      console.log(`  → ${slug}/${src.as}`);
    }

    // ensure each project has a thumb.jpg (= first asset, max 900px wide)
    const heroPath = path.join(slugDir, sources[0].as);
    const thumbPath = path.join(slugDir, "thumb.jpg");
    if (fs.existsSync(heroPath)) {
      await sharp(heroPath).resize({ width: 900 }).jpeg({ quality: 78, mozjpeg: true }).toFile(thumbPath);
    }
  }
  console.log(`\nDone — assets live under ${OUT_DIR}/<slug>/`);
}

await process();
