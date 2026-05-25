/*
 * Stylized single-stroke glyphs approximating Space Grotesk Bold's
 * proportions. Each glyph is authored in a unit coordinate system:
 *
 *   - cap height = 1 (top y=0, baseline y=1)
 *   - entry point is the bottom-left of the glyph's bbox: (0, 1)
 *   - exit point is the bottom-right of the glyph's bbox: (w, 1)
 *
 * The `path` string is a sequence of RELATIVE SVG path commands
 * (lowercase l, c, a) traced in pen-down order so the pen never
 * lifts. Between glyphs the assembler emits a horizontal baseline
 * travel, producing one continuous stroke for the whole word.
 */
export const GLYPHS = {
  M: { w: 0.95, path: "l 0 -1 l 0.475 0.6 l 0.475 -0.6 l 0 1" },
  O: { w: 0.78, path: "l 0.39 0 a 0.39 0.5 0 0 0 0 -1 a 0.39 0.5 0 0 0 0 1 l 0.39 0" },
  T: { w: 0.7,  path: "l 0.35 0 l 0 -1 l -0.35 0 l 0.7 0 l -0.35 0 l 0 1 l 0.35 0" },
  I: { w: 0.18, path: "l 0 -1 l 0.18 0 l 0 1" },
  N: { w: 0.85, path: "l 0 -1 l 0.85 1 l 0 -1 l 0 1" },
  A: { w: 0.85, path: "l 0.425 -1 l 0.425 1" },
  E: { w: 0.7,  path: "l 0 -1 l 0.7 0 l -0.7 0 l 0 0.5 l 0.55 0 l -0.55 0 l 0 0.5 l 0.7 0" },
  R: { w: 0.7,  path: "l 0 -1 l 0.5 0 c 0.3 0 0.3 0.5 0 0.5 l -0.5 0 l 0.7 0.5" },
  S: { w: 0.7,  path: "l 0.7 -1 l -0.7 0.5 l 0.7 0.5" },
  " ": { w: 0.4, path: "l 0.4 0" },
};

const TRACKING = 0.08; // inter-letter horizontal gap (in unit-cap-height units)

/**
 * Compute the unscaled total width of a word using the GLYPHS table.
 */
export function wordWidth(word) {
  let total = 0;
  for (let i = 0; i < word.length; i++) {
    const g = GLYPHS[word[i]];
    if (!g) throw new Error(`missing glyph for "${word[i]}"`);
    total += g.w;
    if (i < word.length - 1) total += TRACKING;
  }
  return total;
}

/**
 * Build the relative path segment for "MOTION MATTERS" inside the
 * given panel bbox.
 *
 * @param {object} panel - bbox in lane-coordinate space:
 *   { l, r, t, b, cy }
 *   l/r/t/b are absolute lane coords; cy is the vertical center.
 * @param {object} entry - { x, y } current pen position (lane coords).
 *   The path returned ASSUMES the pen is already at this position.
 * @returns { d, exit }
 *   - d: a string of path commands (no leading `M`); start with
 *     an absolute `L` to the baseline-start, then per-letter trace
 *     + baseline travel, ending at the baseline-exit point.
 *   - exit: { x, y } final pen position in lane coords.
 */
export function buildMotionMattersPath(panel, entry) {
  const word = "MOTION MATTERS";
  const panelW = panel.r - panel.l;
  const panelH = panel.b - panel.t;
  const panelCx = panel.l + panelW / 2;
  const panelCy = panel.cy; // existing boxIn helper provides cy

  // Target on-screen width = 80% of panel, capped by panel height.
  const totalUnits = wordWidth(word);
  const targetW = Math.min(panelW * 0.8, panelH * totalUnits * 0.65);
  const scale = targetW / totalUnits; // pixel size of one unit (cap-height)
  const drawnW = totalUnits * scale;

  const baselineY = panelCy + scale * 0.5;
  const startX = panelCx - drawnW / 2;

  let d = "";
  // 1. Travel from entry down/over to the baseline start of the word.
  //    Use absolute L so the line drops to baseline cleanly regardless
  //    of where the path was when this segment begins.
  d += ` L ${entry.x} ${baselineY}`;
  d += ` L ${startX} ${baselineY}`;

  // 2. Emit each glyph + inter-letter baseline travel, all RELATIVE
  //    so glyph data composes cleanly.
  for (let i = 0; i < word.length; i++) {
    const ch = word[i];
    const g = GLYPHS[ch];
    // Scale the glyph's relative path commands.
    d += " " + scaleRelativePath(g.path, scale);
    if (i < word.length - 1) {
      // Tracking — baseline travel to next glyph entry.
      d += ` l ${(TRACKING * scale).toFixed(3)} 0`;
    }
  }

  // 3. Exit point: end of the word on the baseline.
  const exitX = startX + drawnW;
  const exitY = baselineY;

  return { d, exit: { x: exitX, y: exitY } };
}

/**
 * Multiply every numeric arg in a relative-only path string by `s`.
 * Supports the command letters used in GLYPHS: l, c, a, m (lowercase only).
 *
 * For elliptical-arc commands (`a rx ry x-axis-rot large-arc sweep dx dy`),
 * `x-axis-rot`, `large-arc`, and `sweep` are flags and must NOT be scaled.
 */
function scaleRelativePath(d, s) {
  const tokens = d.trim().split(/\s+/);
  const out = [];
  let i = 0;
  while (i < tokens.length) {
    const cmd = tokens[i++];
    out.push(cmd);
    let argCount = 0;
    let flagPositions = []; // indices within this command's arg list (0-based) that are flags
    switch (cmd) {
      case "l": case "m": argCount = 2; break;
      case "c": argCount = 6; break;
      case "a": argCount = 7; flagPositions = [2, 3, 4]; break;
      default: throw new Error(`unsupported command: "${cmd}"`);
    }
    for (let k = 0; k < argCount; k++) {
      const raw = parseFloat(tokens[i++]);
      if (flagPositions.includes(k)) {
        out.push(String(raw)); // flag: don't scale
      } else {
        out.push((raw * s).toFixed(3));
      }
    }
  }
  return out.join(" ");
}
