import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const SRC = resolve(root, "public/assets/tma-logo-black.png");

async function squareLogo(size, padRatio = 0.1) {
  const inner = Math.round(size * (1 - padRatio * 2));
  const logo = await sharp(SRC)
    .resize({ width: inner, height: inner, fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toBuffer();
  return sharp({
    create: { width: size, height: size, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
  })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toBuffer();
}

function wrapPngAsIco(pngBuffer) {
  const w = pngBuffer.readUInt32BE(16);
  const h = pngBuffer.readUInt32BE(20);
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  const entry = Buffer.alloc(16);
  entry.writeUInt8(w >= 256 ? 0 : w, 0);
  entry.writeUInt8(h >= 256 ? 0 : h, 1);
  entry.writeUInt8(0, 2);
  entry.writeUInt8(0, 3);
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(pngBuffer.length, 8);
  entry.writeUInt32LE(22, 12);
  return Buffer.concat([header, entry, pngBuffer]);
}

const icon512 = await squareLogo(512, 0.08);
await writeFile(resolve(root, "app/icon.png"), icon512);

const apple180 = await squareLogo(180, 0.1);
await writeFile(resolve(root, "app/apple-icon.png"), apple180);

const fav64 = await squareLogo(64, 0.06);
await writeFile(resolve(root, "app/favicon.ico"), wrapPngAsIco(fav64));

console.log("Wrote app/icon.png (512), app/apple-icon.png (180), app/favicon.ico (PNG-in-ICO 64x64)");
