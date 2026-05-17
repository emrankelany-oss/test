// Pure camera path. frame -> { position:[x,y,z], lookAt:[x,y,z], fov }.
// Arc: 0-40 void drift · 40-130 accelerating push · 130-160 decelerate ·
// 160-179 static settle on the foodics hero (z ≈ -60).
const START_Z = 8;
const SETTLE_Z = -52;     // camera stops just in front of foodics hero (-60)
const FOCAL = [0, 0, -60]; // foodics hero focal point

function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }
function easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
function round(n) { return Math.round(n * 1000) / 1000; }

export function cameraForFrame(frame, duration) {
  const last = duration - 1;
  const f = clamp(frame, 0, last);

  let z;
  if (f <= 40) {
    // slow void drift: small portion of the journey
    z = lerp(START_Z, START_Z - 4, easeInOut(f / 40));
  } else if (f <= 160) {
    // main push + decelerate folded into one eased segment
    z = lerp(START_Z - 4, SETTLE_Z, easeInOut((f - 40) / 120));
  } else {
    z = SETTLE_Z; // static settle
  }

  // gentle handheld sway, frozen during the settle so the end is dead still
  const swayT = f <= 160 ? f : 160;
  const x = round(Math.sin(swayT * 0.04) * 0.6);
  const y = round(1.2 + Math.cos(swayT * 0.03) * 0.35);

  // look target eases from straight-ahead toward the foodics focal point
  const lookT = easeInOut(clamp(f / 160, 0, 1));
  const lookAt = [
    round(lerp(x, FOCAL[0], lookT)),
    round(lerp(y, FOCAL[1], lookT)),
    round(lerp(z - 20, FOCAL[2], lookT)),
  ];

  return { position: [x, y, round(z)], lookAt, fov: 38 };
}
