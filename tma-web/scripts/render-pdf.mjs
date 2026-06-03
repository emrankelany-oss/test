import fs from "fs";
import path from "path";
import * as mupdf from "mupdf";

const SRC = path.resolve(process.cwd(), "../TMA _ Where Strategy Meets Bold Storytelling.pdf");
const OUT_DIR = path.resolve(process.cwd(), "../docs/tma-pdf-extract/pages");
fs.mkdirSync(OUT_DIR, { recursive: true });

const buf = fs.readFileSync(SRC);
const doc = mupdf.Document.openDocument(buf, "application/pdf");
const n = doc.countPages();

// 96 DPI / 72 PDF-pt = 1.333…; downsample to ~80dpi for readable thumbs without
// blowing up file sizes (≈ matrix [0.83 0 0 0.83 0 0]).
const scale = 0.85;
const matrix = [scale, 0, 0, scale, 0, 0];
const colorspace = mupdf.ColorSpace.DeviceRGB;

for (let i = 0; i < n; i++) {
  const page = doc.loadPage(i);
  const pixmap = page.toPixmap(matrix, colorspace, false, true);
  const png = pixmap.asPNG();
  const name = `page-${String(i + 1).padStart(2, "0")}.png`;
  fs.writeFileSync(path.join(OUT_DIR, name), png);
  process.stdout.write(`rendered ${name} (${png.length} bytes)\n`);
}
console.log(`\nWrote ${n} pages to ${OUT_DIR}`);
