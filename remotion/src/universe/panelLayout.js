// Deterministic panel placement. A seeded LCG (no Math.random) keeps every
// render byte-identical. Camera flies along -Z from z≈8 toward z≈ -60.
function lcg(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296; // [0,1)
  };
}

export function buildPanelField(manifest) {
  const rnd = lcg(0x5eed1234);
  const heroes = manifest.filter((m) => m.kind === "hero");
  const logos = manifest.filter((m) => m.kind === "logo");

  const panels = [];

  // Logos: scattered through the corridor, off the centerline, varied depth.
  logos.forEach((m, i) => {
    const t = i / Math.max(1, logos.length - 1); // 0..1 along corridor
    const z = 2 - t * 56 + (rnd() - 0.5) * 6; // ~+2 .. ~-56, jittered
    const side = i % 2 === 0 ? 1 : -1;
    const x = side * (2.5 + rnd() * 5.5);
    const y = (rnd() - 0.5) * 7;
    panels.push({
      id: m.id, kind: "logo", file: m.file,
      position: [round(x), round(y), round(z)],
      rotation: [round((rnd() - 0.5) * 0.5), round((rnd() - 0.5) * 0.7), 0],
      scale: round(1.1 + rnd() * 0.8),
      drift: round(0.2 + rnd() * 0.5),
    });
  });

  // Heroes: near centerline, the camera's late focal targets.
  // zid-hero mid-corridor; foodics-hero deepest (final settle).
  const heroZ = { "zid-hero": -34, "foodics-hero": -60 };
  heroes.forEach((m) => {
    panels.push({
      id: m.id, kind: "hero", file: m.file,
      position: [round((rnd() - 0.5) * 1.6), round((rnd() - 0.5) * 1.2),
        heroZ[m.id] ?? -50],
      rotation: [0, round((rnd() - 0.5) * 0.18), 0],
      scale: m.id === "foodics-hero" ? 4.4 : 3.4,
      drift: 0.15,
    });
  });

  return panels;
}

function round(n) {
  return Math.round(n * 1000) / 1000;
}
