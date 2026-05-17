/**
 * Render the ProjectUniverse composition to a WebP frame sequence at
 * tma-web/public/assets/v14/intro/frame-NNN.webp (1-based, zero-padded 3).
 */
import { bundle } from "@remotion/bundler";
import { renderFrames, selectComposition } from "@remotion/renderer";
import sharp from "sharp";
import { mkdir, readdir, rm, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENTRY = path.resolve(__dirname, "src/index.ts");
const TMP_DIR = path.resolve(__dirname, "out/universe-raw");
const FINAL_DIR = path.resolve(__dirname, "../tma-web/public/assets/v14/intro");
const COMP_ID = "ProjectUniverse";
const TARGET_WIDTH = 1280;

const log = (...a) => console.log("[universe]", ...a);

async function main() {
  log("Bundling…");
  const bundleLocation = await bundle({ entryPoint: ENTRY, webpackOverride: (c) => c });

  log("Selecting composition…");
  const comp = await selectComposition({ serveUrl: bundleLocation, id: COMP_ID });
  log(`${comp.id}: ${comp.durationInFrames}f @ ${comp.fps}fps, ${comp.width}x${comp.height}`);

  await rm(TMP_DIR, { recursive: true, force: true });
  await mkdir(TMP_DIR, { recursive: true });

  log("Rendering frames (Three.js + textures — may take several minutes)…");
  const t0 = Date.now();
  await renderFrames({
    composition: comp,
    serveUrl: bundleLocation,
    outputDir: TMP_DIR,
    imageFormat: "jpeg",
    jpegQuality: 92,
    concurrency: 4,
    onFrameUpdate: (r, t) => {
      if (r % 20 === 0 || r === t) log(`  ${r}/${t} (${Math.round((r / t) * 100)}%)`);
    },
    onStart: () => log("  render started…"),
  });
  log(`Rendered in ${((Date.now() - t0) / 1000).toFixed(1)}s`);

  log("Converting → WebP…");
  await mkdir(FINAL_DIR, { recursive: true });
  for (const f of await readdir(FINAL_DIR).catch(() => [])) {
    if (f.startsWith("frame-")) await rm(path.join(FINAL_DIR, f));
  }
  const frames = (await readdir(TMP_DIR)).filter((f) => /\.(jpe?g|png)$/i.test(f)).sort();
  let totalOut = 0;
  for (let i = 0; i < frames.length; i++) {
    const inBuf = await readFile(path.join(TMP_DIR, frames[i]));
    const outName = `frame-${String(i + 1).padStart(3, "0")}.webp`;
    const outPath = path.join(FINAL_DIR, outName);
    await sharp(inBuf)
      .resize(TARGET_WIDTH, null, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 78, effort: 4 })
      .toFile(outPath);
    totalOut += (await readFile(outPath)).length;
    if ((i + 1) % 20 === 0 || i === frames.length - 1)
      log(`  ${i + 1}/${frames.length} → ${outName}`);
  }
  log(`Done: ${frames.length} frames → ${FINAL_DIR} (${(totalOut / 1048576).toFixed(1)} MB)`);
}

main().catch((e) => { console.error("[universe] FAILED:", e); process.exit(1); });
