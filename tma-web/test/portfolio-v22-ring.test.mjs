import { test } from "node:test";
import assert from "node:assert/strict";
import { ringPositions } from "../components/portfolio-v22/ringPositions.js";
import { SHOWREEL } from "../components/portfolio-v22/showreel.js";

test("ringPositions: empty for count 0", () => {
  assert.deepEqual(ringPositions(0, { rx: 100, ry: 100 }), []);
});

test("ringPositions: first tile sits at top (-90deg)", () => {
  const p = ringPositions(4, { rx: 100, ry: 100 });
  assert.equal(p.length, 4);
  assert.ok(Math.abs(p[0].x) < 1e-6);        // cos(-90)=0
  assert.ok(Math.abs(p[0].y + 100) < 1e-6);  // sin(-90)*100 = -100 (top)
  assert.ok(Math.abs(p[1].x - 100) < 1e-6);  // angle 0 -> right
});

test("showreel data: foodics has 7 films, zid has 2", () => {
  const f = SHOWREEL.find((p) => p.slug === "foodics-boundless");
  const z = SHOWREEL.find((p) => p.slug === "zid-ripple");
  assert.equal(f.films.length, 7);
  assert.equal(z.films.length, 2);
  for (const film of [...f.films, ...z.films]) {
    assert.ok(film.id && film.title && film.group && film.kind && film.poster);
    if (film.kind === "mp4") assert.ok(film.src);
    if (film.kind === "youtube") assert.ok(film.youtubeId);
  }
});
