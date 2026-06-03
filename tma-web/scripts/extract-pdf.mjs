import fs from "fs";
import path from "path";
import * as mupdf from "mupdf";

const SRC = path.resolve(process.cwd(), "../TMA _ Where Strategy Meets Bold Storytelling.pdf");
const OUT_DIR = path.resolve(process.cwd(), "../docs/tma-pdf-extract");
fs.mkdirSync(OUT_DIR, { recursive: true });

const buf = fs.readFileSync(SRC);
const doc = mupdf.Document.openDocument(buf, "application/pdf");
const n = doc.countPages();

let combined = `# TMA Portfolio PDF — Extracted Text (${n} pages)\n\n`;

for (let i = 0; i < n; i++) {
  const page = doc.loadPage(i);
  // structured-text extraction → JSON with x/y so we can preserve reading order
  const stxt = page.toStructuredText("preserve-whitespace");
  const json = JSON.parse(stxt.asJSON());
  const lines = [];
  for (const block of json.blocks || []) {
    if (block.type !== "text") continue;
    for (const line of block.lines || []) {
      const text = (line.text || "").trim();
      if (text) lines.push(text);
    }
  }
  combined += `\n\n---\n\n## Page ${i + 1}\n\n`;
  combined += lines.length ? lines.join("\n") : "_(no extractable text — likely image-only slide)_";
  process.stdout.write(`page ${i + 1}/${n}: ${lines.length} lines\n`);
}

fs.writeFileSync(path.join(OUT_DIR, "all-pages.md"), combined);
console.log(`\nWrote ${path.join(OUT_DIR, "all-pages.md")}`);
