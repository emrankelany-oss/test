// Pure geometry: evenly distribute `count` items on an ellipse centered at 0,0.
// Returns [{x, y, angle}] px offsets. First item at top (-90deg), going clockwise.
export function ringPositions(count, { rx, ry }) {
  if (count <= 0) return [];
  const out = [];
  for (let i = 0; i < count; i++) {
    const angle = -90 + i * (360 / count);
    const rad = (angle * Math.PI) / 180;
    out.push({ x: Math.cos(rad) * rx, y: Math.sin(rad) * ry, angle });
  }
  return out;
}
