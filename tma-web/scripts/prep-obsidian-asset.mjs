import sharp from "sharp";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(root, "../public/assets/obsidian-engine.jpg");
const OUT = path.join(root, "../public/assets");

await sharp(SRC)
  .resize({ width: 2560, withoutEnlargement: true })
  .webp({ quality: 82 })
  .toFile(path.join(OUT, "obsidian-engine.webp"));

await sharp(SRC)
  .resize({ width: 24 })
  .blur(8)
  .webp({ quality: 50 })
  .toFile(path.join(OUT, "obsidian-engine-lqip.webp"));

console.log("obsidian asset prep: done");
