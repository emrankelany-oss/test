// One-time image optimization. Run with: node scripts/optimize-images.mjs
// Reads from tma-website/assets (source of truth) and writes optimized files
// into tma-web/public/assets, replacing the originals at the same paths.
// Strategy: keep PNG file extensions (so existing references work) but
// resize + recompress so payloads drop dramatically.

import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const SRC = path.resolve("../tma-website/assets");
const DST = path.resolve("./public/assets");

// max-width caps per category
const RULES = [
  { match: /case-.*\.png$/i, maxWidth: 2200, quality: 78, fmt: "png" },
  { match: /^team\//, maxWidth: 800, quality: 82, fmt: "png" },
  { match: /^logos\//, maxWidth: 600, quality: 85, fmt: "png" },
  { match: /tma-logo-.*\.png$/i, maxWidth: 320, quality: 90, fmt: "png" },
  { match: /clients-logos\.png$/i, maxWidth: 1800, quality: 80, fmt: "png" },
];

function ruleFor(rel) {
  return RULES.find((r) => r.match.test(rel)) || { maxWidth: 1600, quality: 80, fmt: "png" };
}

async function walk(dir, base = dir, out = []) {
  const ents = await fs.readdir(dir, { withFileTypes: true });
  for (const e of ents) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) await walk(full, base, out);
    else if (/\.(png|jpe?g|webp)$/i.test(e.name)) out.push(path.relative(base, full).replace(/\\/g, "/"));
  }
  return out;
}

function fmtKB(n) {
  return (n / 1024).toFixed(1) + " KB";
}

async function main() {
  const files = await walk(SRC);
  let total = 0;
  let totalNew = 0;

  for (const rel of files) {
    const src = path.join(SRC, rel);
    const dst = path.join(DST, rel);
    await fs.mkdir(path.dirname(dst), { recursive: true });

    const r = ruleFor(rel);
    const stat = await fs.stat(src);
    total += stat.size;

    let img = sharp(src, { failOn: "none" });
    const meta = await img.metadata();
    if (meta.width && meta.width > r.maxWidth) {
      img = img.resize({ width: r.maxWidth, withoutEnlargement: true });
    }

    if (r.fmt === "png") {
      img = img.png({ quality: r.quality, compressionLevel: 9, palette: true });
    } else if (r.fmt === "webp") {
      img = img.webp({ quality: r.quality });
    } else if (r.fmt === "jpeg") {
      img = img.jpeg({ quality: r.quality, mozjpeg: true });
    }

    const buf = await img.toBuffer();
    // Only write if the optimized version is actually smaller, otherwise keep original copy
    if (buf.length < stat.size) {
      await fs.writeFile(dst, buf);
      totalNew += buf.length;
      console.log(`  ${rel.padEnd(50)} ${fmtKB(stat.size).padStart(10)} → ${fmtKB(buf.length).padStart(10)}  -${(((stat.size - buf.length) / stat.size) * 100).toFixed(0)}%`);
    } else {
      await fs.copyFile(src, dst);
      totalNew += stat.size;
      console.log(`  ${rel.padEnd(50)} ${fmtKB(stat.size).padStart(10)} → kept (already small)`);
    }
  }

  console.log(`\nTotal: ${fmtKB(total)} → ${fmtKB(totalNew)}  (-${(((total - totalNew) / total) * 100).toFixed(0)}%)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
