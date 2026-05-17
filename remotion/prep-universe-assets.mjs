import sharp from "sharp";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(__dirname, "../tma-web/public/assets");
const OUT = path.resolve(__dirname, "public/universe");

const jobs = [
  ["case-foodics-boundless.png", "foodics-hero.webp", 1280],
  ["case-zid-ripple.png", "zid-hero.webp", 1280],
];
const logos = [
  "abu-kass","alissar","arab-bank","aramco","bank-of-jordan",
  "buffalo-wild-wings","burger-king","cairo-amman-bank","cyberx",
  "electrolux","flex","foodics","invoiceq","jadwa","lsc",
  "ministry-economy","reflect","salasa","shaker-group","sol",
  "webook","western-union","zaintech","zid",
];
for (const n of logos) jobs.push([`logos/${n}.png`, `logo-${n}.webp`, 512]);

await mkdir(OUT, { recursive: true });
for (const [src, out, w] of jobs) {
  const buf = await readFile(path.join(SRC, src));
  await sharp(buf).resize(w, null, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 }).toFile(path.join(OUT, out));
  console.log("wrote", out);
}
