// Fetch free-licensed topic photos from Wikimedia Commons as candidates.
import sharp from "sharp";
import { mkdirSync } from "fs";

const UA = "TMA-portfolio-build/1.0 (contact: dev@themotionagency.net)";
const api = "https://commons.wikimedia.org/w/api.php";

const TOPICS = {
  "buffalo-wild-wings": ["Buffalo wings", "Chicken wings plate", "Hot wings"],
  vanellis: ["Pasta al pesto", "Pesto pasta", "Spaghetti pesto"],
  mixy: ["Burger and fries", "Fast food meal", "Milkshake dessert"],
  tawasol: ["Smartphone in hand", "Mobile phone user", "People using smartphones"],
};

async function jget(params) {
  const u = new URL(api);
  Object.entries({ format: "json", origin: "*", ...params }).forEach(([k, v]) => u.searchParams.set(k, v));
  const r = await fetch(u, { headers: { "User-Agent": UA } });
  return r.json();
}

mkdirSync("tmp/photos", { recursive: true });

for (const [slug, queries] of Object.entries(TOPICS)) {
  const found = [];
  for (const q of queries) {
    const s = await jget({ action: "query", list: "search", srsearch: q, srnamespace: "6", srlimit: "8" });
    const titles = (s.query?.search || []).map((x) => x.title);
    if (!titles.length) continue;
    const info = await jget({
      action: "query", titles: titles.join("|"),
      prop: "imageinfo", iiprop: "url|size|mime", iiurlwidth: "1400",
    });
    for (const p of Object.values(info.query?.pages || {})) {
      const ii = p.imageinfo?.[0];
      if (!ii) continue;
      if (!/jpeg|png/.test(ii.mime)) continue;
      if (ii.width < 1100) continue;
      const ar = ii.width / ii.height;
      if (ar < 0.9 || ar > 2.2) continue; // usable for cards
      if (found.find((f) => f.title === p.title)) continue;
      found.push({ slug, title: p.title, url: ii.thumburl, w: ii.width, h: ii.height });
    }
    if (found.length >= 5) break;
  }
  // download up to 5 candidates
  const got = [];
  for (let i = 0; i < Math.min(5, found.length); i++) {
    try {
      const r = await fetch(found[i].url, { headers: { "User-Agent": UA } });
      const buf = Buffer.from(await r.arrayBuffer());
      const out = `tmp/photos/${slug}-${i}.jpg`;
      await sharp(buf).jpeg({ quality: 84 }).toFile(out);
      got.push({ ...found[i], out, i });
    } catch {}
  }
  // labelled montage per slug
  if (got.length) {
    const cols = got.length, tw = 300, th = 300, pad = 6;
    const comps = [];
    for (let i = 0; i < got.length; i++) {
      const t = await sharp(got[i].out).resize(tw, th, { fit: "cover" }).toBuffer();
      comps.push({ input: t, left: pad + i * (tw + pad), top: pad });
    }
    await sharp({ create: { width: cols * (tw + pad) + pad, height: th + 2 * pad, channels: 3, background: "#222" } })
      .composite(comps).jpeg().toFile(`tmp/photos/_${slug}.jpg`);
  }
  console.log(slug, "candidates:", got.map((g) => `${g.i}:${g.title.replace("File:", "").slice(0, 30)} (${g.w}x${g.h})`).join(" | "));
}
console.log("done");
