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
    if (p >= start - EPS) {
      let t = (p - start) / seam;
      // `start` and the division carry IEEE-754 error (e.g. progress 1, seam
      // 0.18 → t = 0.9999999999999997, not 1). Snap to the exact boundaries
      // within EPS, then clamp the remaining range.
      if (t >= 1 - EPS) t = 1;
      if (t <= EPS) t = 0;
      t = Math.min(1, Math.max(0, t));
      // A pinned scene's progress sticks at 1 after the viewer passes it. A
      // completed scene (t === 1) must NOT keep matching as the active seam —
      // that would permanently mask every later seam (e.g. film→probe-b would
      // never fire). Skip it and scan onward to the next genuinely-active pair.
      if (t >= 1) continue;
      const next = sceneProgresses[i + 1];
      return { fromId: cur.id, toId: next.id, t };
    }
  }
  return null;
}
