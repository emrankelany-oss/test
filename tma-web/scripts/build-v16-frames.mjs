#!/usr/bin/env node
/**
 * V16 — one-time JPG→WebP converter for the cinematic hero frame sequence.
 *
 * Reads  <repoRoot>/frames/ezgif-frame-001.jpg .. ezgif-frame-192.jpg (1280x720)
 * Writes tma-web/public/assets/v16/frames/frame-001.webp .. frame-192.webp
 *
 * Idempotent: skips a frame whose .webp output already exists. The generated
 * .webp files are committed so production/CI never need the raw frames/ dir.
 *
 * Run with:  node scripts/build-v16-frames.mjs
 */
import path from "node:path";
import fs from "node:fs/promises";
import sharp from "sharp";

const ROOT = path.resolve(
  path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, "$1"),
  ".."
);
const SRC_DIR = path.join(ROOT, "..", "frames");
const OUT_DIR = path.join(ROOT, "public", "assets", "v16", "frames");
const TOTAL = 192;
const QUALITY = 82;

function pad3(n) {
  return String(n).padStart(3, "0");
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  let converted = 0;
  let skipped = 0;
  for (let i = 1; i <= TOTAL; i++) {
    const src = path.join(SRC_DIR, `ezgif-frame-${pad3(i)}.jpg`);
    const out = path.join(OUT_DIR, `frame-${pad3(i)}.webp`);
    try {
      await fs.access(out);
      skipped++;
      continue;
    } catch {
      /* not present — convert */
    }
    await sharp(src).webp({ quality: QUALITY }).toFile(out);
    converted++;
  }
  console.log(`[v16] frames: ${converted} converted, ${skipped} skipped, ${TOTAL} total → ${OUT_DIR}`);
}

main().catch((err) => {
  console.error("[v16] frame build failed:", err);
  process.exit(1);
});
