import * as mupdf from "mupdf";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PDF_PATH = path.resolve(__dirname, "../../../tma-deck.pdf");
const OUT_DIR = path.resolve(__dirname, "../public/assets/portfolio/raw");

const TARGET_SLIDES = [
  22, 23, 24, 25, 26, 27, 28, 29,
  30, 31, 32, 33, 34, 35, 36,
  37, 38, 39, 40, 41, 42, 43, 44,
  47, 50, 54, 55, 56, 57,
  58, 59, 60, 61, 62,
  64, 65, 66, 67, 68, 71, 73, 74,
];

await mkdir(OUT_DIR, { recursive: true });

console.log(`Reading ${PDF_PATH} …`);
const buf = await readFile(PDF_PATH);
const doc = mupdf.Document.openDocument(new Uint8Array(buf), "application/pdf");
const total = doc.countPages();
console.log(`PDF has ${total} pages`);

const dpi = 144;
const matrix = mupdf.Matrix.scale(dpi / 72, dpi / 72);

let count = 0;
for (const slideNum of TARGET_SLIDES) {
  if (slideNum > total) {
    console.log(`  · skipping ${slideNum} (out of range)`);
    continue;
  }
  const page = doc.loadPage(slideNum - 1);
  const pixmap = page.toPixmap(matrix, mupdf.ColorSpace.DeviceRGB, false, true);
  const png = pixmap.asPNG();
  const filename = `slide-${String(slideNum).padStart(2, "0")}.png`;
  await writeFile(path.join(OUT_DIR, filename), png);
  pixmap.destroy();
  page.destroy();
  count++;
  console.log(`  ✓ ${filename} — ${(png.length / 1024).toFixed(0)} kB`);
}

doc.destroy();
console.log(`\nExtracted ${count} slides → ${OUT_DIR}`);
