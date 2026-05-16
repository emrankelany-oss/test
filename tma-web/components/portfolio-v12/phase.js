export const PHASES = ["ignition", "liftoff", "ascent", "orbit", "climax"];

// [phase, upperBound) — last phase catches the remainder.
const BOUNDS = [
  ["ignition", 0.15],
  ["liftoff", 0.35],
  ["ascent", 0.7],
  ["orbit", 0.88],
  ["climax", Infinity],
];

export function phaseFor(progress) {
  const p = Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : 0;
  for (const [name, upper] of BOUNDS) {
    if (p < upper) return name;
  }
  return "climax";
}
