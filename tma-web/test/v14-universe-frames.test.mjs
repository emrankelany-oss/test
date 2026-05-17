import { test } from "node:test";
import assert from "node:assert/strict";
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../public/assets/v14/intro"
);

test("exactly 180 sequential non-empty webp frames exist", async () => {
  const files = (await readdir(dir)).filter((f) => f.endsWith(".webp")).sort();
  assert.equal(files.length, 180);
  for (let i = 0; i < 180; i++) {
    const expected = `frame-${String(i + 1).padStart(3, "0")}.webp`;
    assert.equal(files[i], expected);
    const s = await stat(path.join(dir, files[i]));
    assert.ok(s.size > 1000, `${files[i]} should be a real image`);
  }
});
