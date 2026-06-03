/*
 * Stylized single-stroke glyphs approximating Space Grotesk Bold's
 * proportions. Each glyph is authored in a unit coordinate system:
 *
 *   - cap height = 1 (top y=0, baseline y=1)
 *   - entry point is the bottom-left of the glyph's bbox: (0, 1)
 *   - exit point is the bottom-right of the glyph's bbox: (w, 1)
 *
 * The `path` string is a sequence of RELATIVE SVG path commands
 * (lowercase l, c, a) traced in pen-down order so the pen never lifts.
 *
 * IMPORTANT: do NOT introduce `m` (pen-lift) commands inside the
 * glyphs or between letters. SVG `stroke-dasharray` restarts at every
 * subpath (SVG 1.1 § 11.4), which would make each pen-lifted segment
 * reveal independently of its position in the path — the scroll-driven
 * "draw the word as you scroll" effect breaks completely. Letters
 * therefore have to be authored with retracing (e.g. T crossbar
 * retraces back through its midpoint) rather than pen-lifts.
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
 * given panel bbox. SINGLE continuous subpath (no pen lifts) so
 * `stroke-dasharray` reveals strokes in path order.
 *
 * @param {object} panel - bbox in lane-coordinate space:
 *   { l, r, t, b, cy }. l/r/t/b absolute lane coords, cy vertical center.
 * @returns { d, entry, exit, scale, drawnW, baselineY, startX }
 *   - d: relative commands starting with `L entry.x entry.y` to plant
 *     the pen exactly at the first M's bottom-left, then per-letter
 *     traces joined by horizontal baseline travels (`l TRACKING 0`).
 *   - entry: { x, y } = first M's bottom-left in lane coords. The caller's
 *     previous segment should arrive with the tangent pointing straight
 *     UP so the first M's `l 0 -1` continues the line with no corner.
 *   - exit: { x, y } = last letter's bottom-right in lane coords.
 */
export function buildMotionMattersPath(panel) {
  const word = "MOTION MATTERS";
  const panelW = panel.r - panel.l;
  const panelH = panel.b - panel.t;
  const panelCx = panel.l + panelW / 2;
  const panelCy = panel.cy ?? (panel.t + panel.b) / 2;

  // Target on-screen width = 80% of panel, capped by panel height.
  const totalUnits = wordWidth(word);
  const targetW = Math.min(panelW * 0.8, panelH * totalUnits * 0.65);
  const scale = targetW / totalUnits; // pixel size of one unit (cap-height)
  const drawnW = totalUnits * scale;

  const baselineY = panelCy + scale * 0.5;
  const startX = panelCx - drawnW / 2;

  let d = "";
  for (let i = 0; i < word.length; i++) {
    const ch = word[i];
    const g = GLYPHS[ch];
    d += " " + scaleRelativePath(g.path, scale);
    if (i < word.length - 1) {
      d += ` l ${(TRACKING * scale).toFixed(3)} 0`;
    }
  }

  return {
    d,
    entry: { x: startX, y: baselineY },
    exit: { x: startX + drawnW, y: baselineY },
    scale,
    drawnW,
    baselineY,
    startX,
  };
}

/**
 * Plan "MOTION MATTERS" as a set of separately-rendered glyphs + arc
 * connectors so a multi-path renderer (one <path> per glyph + one per
 * connector) can animate each independently. This avoids the SVG-spec
 * subpath restart issue that breaks dasharray reveals when one path
 * contains many `m` (pen-lift) commands — each glyph is its own
 * <path> element instead.
 *
 * Returns:
 *   - letters:    [{ d, ch, bl: {x,y}, br: {x,y} }, ...] one per stroked glyph
 *   - connectors: [{ d, from: {x,y}, to: {x,y} }, ...] one per inter-letter gap
 *                 (upward-arc ligatures so the word reads as one continuous
 *                 line without tracing the baseline)
 *   - entry:      { x, y } = first stroked letter's bottom-left
 *   - exit:       { x, y } = last stroked letter's bottom-right
 *   - scale, drawnW, baselineY, startX (same as buildMotionMattersPath)
 *
 * Each letter's `d` starts with an absolute `M x y` to plant the pen on
 * the glyph's bottom-left, then the existing relative GLYPHS path data
 * scaled to lane units. Each connector's `d` is a single cubic that arcs
 * UP off the baseline and back down — visible as a small ligature bump,
 * not a horizontal baseline trace.
 */
export function buildMotionMattersStructure(panel) {
  const word = "MOTION MATTERS";
  const panelW = panel.r - panel.l;
  const panelH = panel.b - panel.t;
  const panelCx = panel.l + panelW / 2;
  const panelCy = panel.cy ?? (panel.t + panel.b) / 2;

  const totalUnits = wordWidth(word);
  const targetW = Math.min(panelW * 0.8, panelH * totalUnits * 0.65);
  const scale = targetW / totalUnits;
  const drawnW = totalUnits * scale;
  const baselineY = panelCy + scale * 0.5;
  const startX = panelCx - drawnW / 2;

  // arc height for inter-letter ligature; sized off the cap-height so it
  // reads as a consistent stylistic bump regardless of viewport.
  const ARC_H = scale * 0.22;

  const letters = [];
  const connectors = [];
  let curX = startX;
  let prevBR = null;

  for (let i = 0; i < word.length; i++) {
    const ch = word[i];
    const g = GLYPHS[ch];

    if (ch !== " ") {
      const blX = curX;
      const blY = baselineY;
      const brX = curX + g.w * scale;
      const brY = baselineY;

      // Ligature connector from previous letter's BR up over the gap to
      // this letter's BL. Single cubic with cp1/cp2 above the baseline.
      if (prevBR) {
        const dx = blX - prevBR.x;
        const dy = blY - prevBR.y; // 0 for baseline-aligned letters
        const d =
          `M ${prevBR.x.toFixed(3)} ${prevBR.y.toFixed(3)} ` +
          `c ${(dx * 0.25).toFixed(3)} ${(-ARC_H).toFixed(3)}, ` +
          `${(dx * 0.75).toFixed(3)} ${(-ARC_H).toFixed(3)}, ` +
          `${dx.toFixed(3)} ${dy.toFixed(3)}`;
        connectors.push({
          d,
          from: { x: prevBR.x, y: prevBR.y },
          to: { x: blX, y: blY },
        });
      }

      const letterD =
        `M ${blX.toFixed(3)} ${blY.toFixed(3)} ` +
        scaleRelativePath(g.path, scale);
      letters.push({
        d: letterD,
        ch,
        bl: { x: blX, y: blY },
        br: { x: brX, y: brY },
      });

      prevBR = { x: brX, y: brY };
    }

    curX += g.w * scale;
    if (i < word.length - 1) curX += TRACKING * scale;
  }

  return {
    letters,
    connectors,
    entry: letters[0]?.bl ?? { x: startX, y: baselineY },
    exit: prevBR ?? { x: startX + drawnW, y: baselineY },
    scale,
    drawnW,
    baselineY,
    startX,
  };
}

/**
 * Multiply every numeric arg in a relative-only path string by `s`.
 * Supports the command letters used in GLYPHS: l, c, a (lowercase only).
 *
 * For elliptical-arc commands (`a rx ry x-axis-rot large-arc sweep dx dy`),
 * `x-axis-rot`, `large-arc`, and `sweep` are flags and must NOT be scaled.
 */
function scaleRelativePath(d, s) {
  const trimmed = d.trim();
  if (!trimmed) return "";
  const tokens = trimmed.split(/\s+/);
  const out = [];
  let i = 0;
  while (i < tokens.length) {
    const cmd = tokens[i++];
    out.push(cmd);
    let argCount = 0;
    let flagPositions = []; // indices within this command's arg list (0-based) that are flags
    switch (cmd) {
      case "l": argCount = 2; break;
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
