/**
 * Render the MMonumentPaper composition to a sequence of WebP frames
 * for /portfolio-v3. Uses PNG with alpha so the M composites over the
 * page's #f4f4f1 paper background.
 *
 *   1. Bundles the Remotion project
 *   2. Selects the MMonumentPaper composition (180 frames)
 *   3. Renders each frame as PNG with alpha
 *   4. Resizes + converts to WebP (alpha preserved) via sharp
 *   5. Saves to ../tma-web/public/assets/v3/frames/frame-NNN.webp
 */

import { bundle } from "@remotion/bundler";
import { renderFrames, selectComposition } from "@remotion/renderer";
import sharp from "sharp";
import { mkdir, readdir, rm, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENTRY = path.resolve(__dirname, "src/index.ts");
const TMP_DIR = path.resolve(__dirname, "out/frames-v3-raw");
const FINAL_DIR = path.resolve(__dirname, "../tma-web/public/assets/v3/frames");
const COMP_ID = "MMonumentDark";
const TARGET_WIDTH = 1100;

const log = (...args) => console.log("[render-v3]", ...args);

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

  log(
    `Composition: ${comp.id}, ${comp.durationInFrames}f @ ${comp.fps}fps, ${comp.width}x${comp.height}`
  );

  await rm(TMP_DIR, { recursive: true, force: true });
  await mkdir(TMP_DIR, { recursive: true });

  log("Rendering frames (transparent PNG, this may take 2-4 minutes)…");
  const renderStart = Date.now();
  await renderFrames({
    composition: comp,
    serveUrl: bundleLocation,
    outputDir: TMP_DIR,
    imageFormat: "png",
    concurrency: 4,
    onFrameUpdate: (rendered, total) => {
      if (rendered % 20 === 0 || rendered === total) {
        log(
          `  ${rendered}/${total} frames rendered (${Math.round(
            (rendered / total) * 100
          )}%)`
        );
      }
    },
    onStart: () => log("  render started…"),
  });
  log(
    `Frame rendering done in ${((Date.now() - renderStart) / 1000).toFixed(1)}s`
  );

  log("Converting to WebP (alpha preserved)…");
  await mkdir(FINAL_DIR, { recursive: true });
  for (const f of await readdir(FINAL_DIR).catch(() => [])) {
    if (f.startsWith("frame-")) await rm(path.join(FINAL_DIR, f));
  }

  const frames = (await readdir(TMP_DIR))
    .filter((f) => /\.png$/i.test(f))
    .sort();
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
      .webp({ lossless: true, effort: 4, alphaQuality: 100 })
      .toFile(outPath);
    const outBuf = await readFile(outPath);
    totalOut += outBuf.length;
    if ((i + 1) % 20 === 0 || i === frames.length - 1) {
      log(
        `  ${i + 1}/${frames.length} converted → ${outName} (${(
          outBuf.length / 1024
        ).toFixed(0)} KB)`
      );
    }
  }

  log(`\nFinal output: ${FINAL_DIR}`);
  log(
    `Total: ${frames.length} frames | raw ${(totalIn / 1024 / 1024).toFixed(
      1
    )} MB → webp ${(totalOut / 1024 / 1024).toFixed(1)} MB`
  );
}

main().catch((err) => {
  console.error("[render-v3] FAILED:", err);
  process.exit(1);
});
