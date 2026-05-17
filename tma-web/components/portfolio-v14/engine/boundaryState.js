// Detects the active cross-scene seam. `sceneProgresses` is an ORDER-SORTED
// array of { id, progress }. A scene's last `seam` fraction of its progress
// maps t: 0→1 toward the next scene. Returns { fromId, toId, t } or null.
const EPS = 1e-9;

export function boundaryState(sceneProgresses, seam = 0.18) {
  if (!Array.isArray(sceneProgresses) || sceneProgresses.length < 2) return null;
  if (!(seam > 0)) return null;
  const start = 1 - seam;
  for (let i = 0; i < sceneProgresses.length - 1; i++) {
    const cur = sceneProgresses[i];
    const p = cur.progress;
    // `start` is not exact in IEEE-754 (1 - 0.18 === 0.8200000000000001), so a
    // scene exactly at the nominal seam start must still match — hence -EPS.
    // The clamp below absorbs the resulting tiny-negative t to 0.
    if (p >= start - EPS) {
      const next = sceneProgresses[i + 1];
      let t = (p - start) / seam;
      // Round away IEEE-754 artifacts at the boundaries.
      if (t >= 1 - EPS) t = 1;
      if (t <= EPS) t = 0;
      t = Math.min(1, Math.max(0, t));
      return { fromId: cur.id, toId: next.id, t };
    }
  }
  return null;
}
