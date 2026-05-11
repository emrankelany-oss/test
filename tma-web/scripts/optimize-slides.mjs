import sharp from "sharp";
import { readdir, mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAW_DIR = path.resolve(__dirname, "../public/assets/portfolio/raw");
const OUT_DIR = path.resolve(__dirname, "../public/assets/portfolio");

await mkdir(OUT_DIR, { recursive: true });

const files = (await readdir(RAW_DIR)).filter((f) => f.endsWith(".png"));
console.log(`Optimizing ${files.length} slides …`);

let totalIn = 0;
let totalOut = 0;
for (const file of files) {
  const inPath = path.join(RAW_DIR, file);
  const outName = file.replace(".png", ".jpg");
  const outPath = path.join(OUT_DIR, outName);
  const inSize = (await stat(inPath)).size;
  totalIn += inSize;

  await sharp(inPath)
    .resize(1600, 1000, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(outPath);

  const outSize = (await stat(outPath)).size;
  totalOut += outSize;
  console.log(
    `  ✓ ${outName} — ${(inSize / 1024).toFixed(0)} kB → ${(outSize / 1024).toFixed(0)} kB`
  );
}

console.log(
  `\nTotal: ${(totalIn / 1024 / 1024).toFixed(1)} MB → ${(totalOut / 1024 / 1024).toFixed(1)} MB ` +
    `(${Math.round((1 - totalOut / totalIn) * 100)}% smaller)`
);
