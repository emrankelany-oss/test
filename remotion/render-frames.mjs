/**
 * Render the MMonument composition to a sequence of WebP frames.
 *
 *   1. Bundles the Remotion project
 *   2. Selects the MMonument composition (180 frames)
 *   3. Renders each frame as JPEG (Remotion → /tmp dir)
 *   4. Converts each JPEG → WebP at 1280px wide using sharp
 *   5. Saves to ../tma-web/public/assets/v2/frames/frame-NNN.webp
 *
 * Final output: ~180 files, ~80KB each = ~14MB total
 */

import { bundle } from "@remotion/bundler";
import { renderFrames, selectComposition } from "@remotion/renderer";
import sharp from "sharp";
import { mkdir, readdir, rm, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENTRY = path.resolve(__dirname, "src/index.ts");
const TMP_DIR = path.resolve(__dirname, "out/frames-raw");
const FINAL_DIR = path.resolve(__dirname, "../tma-web/public/assets/v2/frames");
const COMP_ID = "MMonument";
const TARGET_WIDTH = 1280; // resize for web

const log = (...args) => console.log("[render]", ...args);

async function main() {
  log("Bundling Remotion project…");
  const bundleLocation = await bundle({
    entryPoint: ENTRY,
    webpackOverride: (c) => c,
  });

  log("Selecting composition…");
  const comp = await selectComposition({
    serveUrl: bundleLocation,
    id: COMP_ID,
  });

  log(`Composition: ${comp.id}, ${comp.durationInFrames}f @ ${comp.fps}fps, ${comp.width}x${comp.height}`);

  // Clean temp dir
  await rm(TMP_DIR, { recursive: true, force: true });
  await mkdir(TMP_DIR, { recursive: true });

  log("Rendering frames (this may take 1-3 minutes)…");
  const renderStart = Date.now();
  await renderFrames({
    composition: comp,
    serveUrl: bundleLocation,
    outputDir: TMP_DIR,
    imageFormat: "jpeg",
    jpegQuality: 92,
    concurrency: 4,
    onFrameUpdate: (rendered, total) => {
      if (rendered % 20 === 0 || rendered === total) {
        log(`  ${rendered}/${total} frames rendered (${Math.round((rendered / total) * 100)}%)`);
      }
    },
    onStart: () => log("  render started…"),
  });
  log(`Frame rendering done in ${((Date.now() - renderStart) / 1000).toFixed(1)}s`);

  log("Converting to WebP…");
  await mkdir(FINAL_DIR, { recursive: true });
  // Clean previous frames in final dir
  for (const f of await readdir(FINAL_DIR).catch(() => [])) {
    if (f.startsWith("frame-")) await rm(path.join(FINAL_DIR, f));
  }

  const frames = (await readdir(TMP_DIR)).filter((f) => /\.(jpg|jpeg|png)$/i.test(f)).sort();
  let totalIn = 0;
  let totalOut = 0;
  for (let i = 0; i < frames.length; i++) {
    const inPath = path.join(TMP_DIR, frames[i]);
    const outName = `frame-${String(i + 1).padStart(3, "0")}.webp`;
    const outPath = path.join(FINAL_DIR, outName);
    const inBuf = await readFile(inPath);
    totalIn += inBuf.length;
    await sharp(inBuf)
      .resize(TARGET_WIDTH, null, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 78, effort: 4 })
      .toFile(outPath);
    const outBuf = await readFile(outPath);
    totalOut += outBuf.length;
    if ((i + 1) % 20 === 0 || i === frames.length - 1) {
      log(`  ${i + 1}/${frames.length} converted → ${outName} (${(outBuf.length / 1024).toFixed(0)} KB)`);
    }
  }

  log(`\nFinal output: ${FINAL_DIR}`);
  log(`Total: ${frames.length} frames | raw ${(totalIn / 1024 / 1024).toFixed(1)} MB → webp ${(totalOut / 1024 / 1024).toFixed(1)} MB`);
}

main().catch((err) => {
  console.error("[render] FAILED:", err);
  process.exit(1);
});
