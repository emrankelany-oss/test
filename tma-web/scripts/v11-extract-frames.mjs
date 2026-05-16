#!/usr/bin/env node
/**
 * V11 — extract 450 frames from the Veo-generated rocket video and encode them
 * as WebP at desktop (1600×900) and mobile (1280×720) resolutions.
 *
 * Pipeline:
 *   1. ffmpeg-static probes duration, then resamples the source MP4 to exactly
 *      TARGET_COUNT JPEG frames at 1920×1080 in tmp/v11/extracted/
 *   2. sharp converts each JPEG to desktop + mobile WebP into
 *      public/assets/v11/frames/{,mobile/}.
 *   3. The first frame is also saved as a high-quality poster.
 *   4. Temp JPEGs are removed.
 *
 * Run with:  node scripts/v11-extract-frames.mjs
 */

import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import fs from "node:fs/promises";
import { createReadStream } from "node:fs";

import sharp from "sharp";
import ffmpegStatic from "ffmpeg-static";

const exec = promisify(execFile);

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, "$1"), "..");
const VIDEO = path.join(ROOT, "tmp", "v11", "rocket-v1.mp4");
const TMP_DIR = path.join(ROOT, "tmp", "v11", "extracted");
const OUT_DESKTOP = path.join(ROOT, "public", "assets", "v11", "frames");
const OUT_MOBILE = path.join(OUT_DESKTOP, "mobile");
const POSTER = path.join(ROOT, "public", "assets", "v11", "poster.webp");

const TARGET_COUNT = 450;
const DESKTOP = { w: 1600, h: 900, q: 78 };
const MOBILE = { w: 1280, h: 720, q: 72 };
const SOURCE = { w: 1920, h: 1080 };
const CONCURRENCY = 8;

async function ensureDirs() {
  await fs.mkdir(TMP_DIR, { recursive: true });
  await fs.mkdir(OUT_DESKTOP, { recursive: true });
  await fs.mkdir(OUT_MOBILE, { recursive: true });
}

async function probeDuration() {
  // ffmpeg-static does not ship ffprobe. Run ffmpeg with the input alone —
  // it errors (no output), but prints duration to stderr, which we parse.
  return new Promise((resolve, reject) => {
    const proc = spawn(ffmpegStatic, ["-hide_banner", "-i", VIDEO]);
    let stderr = "";
    proc.stderr.on("data", (chunk) => (stderr += chunk.toString()));
    proc.on("close", () => {
      const m = stderr.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
      if (!m) return reject(new Error("Could not parse duration from ffmpeg output:\n" + stderr));
      const seconds = Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
      resolve(seconds);
    });
    proc.on("error", reject);
  });
}

async function extractFrames(targetFps) {
  const args = [
    "-y",
    "-hide_banner",
    "-loglevel", "error",
    "-i", VIDEO,
    "-vf", `fps=${targetFps.toFixed(6)},scale=${SOURCE.w}:${SOURCE.h}:flags=lanczos`,
    "-frames:v", String(TARGET_COUNT),
    "-q:v", "2",
    "-start_number", "1",
    path.join(TMP_DIR, "%04d.jpg"),
  ];
  console.log(`  ffmpeg ${args.map(a => (a.includes(" ") ? `"${a}"` : a)).join(" ")}`);
  return new Promise((resolve, reject) => {
    const proc = spawn(ffmpegStatic, args, { stdio: ["ignore", "inherit", "inherit"] });
    proc.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}`))));
    proc.on("error", reject);
  });
}

async function convertOneFrame(idx) {
  const num = String(idx).padStart(4, "0");
  const src = path.join(TMP_DIR, `${num}.jpg`);
  const dst1 = path.join(OUT_DESKTOP, `${num}.webp`);
  const dst2 = path.join(OUT_MOBILE, `${num}.webp`);

  await sharp(src)
    .resize(DESKTOP.w, DESKTOP.h, { fit: "cover", position: "center", kernel: "lanczos3" })
    .webp({ quality: DESKTOP.q, effort: 4 })
    .toFile(dst1);

  await sharp(src)
    .resize(MOBILE.w, MOBILE.h, { fit: "cover", position: "center", kernel: "lanczos3" })
    .webp({ quality: MOBILE.q, effort: 4 })
    .toFile(dst2);
}

async function convertAll(count) {
  const inFlight = new Set();
  for (let i = 1; i <= count; i++) {
    const p = convertOneFrame(i).then(() => inFlight.delete(p));
    inFlight.add(p);
    if (inFlight.size >= CONCURRENCY) await Promise.race(inFlight);
    if (i % 25 === 0 || i === count) process.stdout.write(`  encoded ${i}/${count}\r`);
  }
  await Promise.all(inFlight);
  process.stdout.write("\n");
}

async function makePoster() {
  const src = path.join(TMP_DIR, "0001.jpg");
  await sharp(src)
    .resize(1920, 1080, { fit: "cover", kernel: "lanczos3" })
    .webp({ quality: 85, effort: 5 })
    .toFile(POSTER);
}

async function cleanupTmp() {
  const files = await fs.readdir(TMP_DIR);
  await Promise.all(files.map((f) => fs.unlink(path.join(TMP_DIR, f))));
}

async function dirSizeMB(dir) {
  let total = 0;
  const files = await fs.readdir(dir);
  for (const f of files) {
    const stat = await fs.stat(path.join(dir, f));
    if (stat.isFile()) total += stat.size;
  }
  return (total / (1024 * 1024)).toFixed(2);
}

async function main() {
  console.log("V11 frame extraction starting…");
  console.log(`  source : ${VIDEO}`);
  console.log(`  target : ${TARGET_COUNT} frames`);

  try {
    await fs.access(VIDEO);
  } catch {
    console.error(`✗ Source video not found at ${VIDEO}`);
    process.exit(1);
  }

  await ensureDirs();

  console.log("\n[1/4] Probing video duration…");
  const duration = await probeDuration();
  const targetFps = TARGET_COUNT / duration;
  console.log(`      duration: ${duration.toFixed(3)}s   target fps: ${targetFps.toFixed(3)}`);

  console.log("\n[2/4] Extracting JPEG frames via ffmpeg…");
  await extractFrames(targetFps);

  const jpgs = (await fs.readdir(TMP_DIR)).filter((f) => f.endsWith(".jpg")).sort();
  console.log(`      extracted ${jpgs.length} frames into ${TMP_DIR}`);
  if (jpgs.length !== TARGET_COUNT) {
    console.warn(`      ⚠ expected ${TARGET_COUNT}, got ${jpgs.length} — continuing anyway`);
  }

  console.log("\n[3/4] Encoding desktop (1600×900) + mobile (1280×720) WebP…");
  await convertAll(jpgs.length);

  console.log("\n[4/4] Building poster + cleaning up tmp JPEGs…");
  await makePoster();
  await cleanupTmp();

  const dSize = await dirSizeMB(OUT_DESKTOP);
  const mSize = await dirSizeMB(OUT_MOBILE);
  console.log("\n✓ Done.");
  console.log(`  desktop: ${OUT_DESKTOP}  (${dSize} MB across ${jpgs.length} frames)`);
  console.log(`  mobile : ${OUT_MOBILE}   (${mSize} MB across ${jpgs.length} frames)`);
  console.log(`  poster : ${POSTER}`);
  console.log(`\n  frame count to use in code: ${jpgs.length}`);
}

main().catch((err) => {
  console.error("\n✗ Extraction failed:", err);
  process.exit(1);
});
