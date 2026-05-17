// Pure phase/metric/format core for the V14 narrative chapters. No DOM/time/IO.
function clamp01(x) {
  return Math.min(1, Math.max(0, x));
}
function easeOutCubic(t) {
  return 1 - Math.pow(1 - clamp01(t), 3);
}

const SAFE_EMPTY = { index: 0, id: null, local: 0, phase: "hold", opacity: 1 };

export function actState(progress, plan) {
  const acts = plan && Array.isArray(plan.acts) ? plan.acts : [];
  if (acts.length === 0) return { ...SAFE_EMPTY };
  const inFrac = plan.inFrac > 0 ? plan.inFrac : 0.2;
  const outFrac = plan.outFrac > 0 ? plan.outFrac : 0.2;

  const raw = acts.map((a) => (a && a.weight > 0 ? a.weight : 0));
  const allPositive = raw.every((w) => w > 0);
  const w = allPositive ? raw : acts.map(() => 1);
  const sum = w.reduce((a, b) => a + b, 0);

  const p = clamp01(progress);
  let start = 0;
  for (let i = 0; i < acts.length; i++) {
    const frac = w[i] / sum;
    const end = i === acts.length - 1 ? 1 : start + frac;
    const isLast = i === acts.length - 1;
    if (p < end || isLast) {
      const span = end - start || 1;
      const local = clamp01((p - start) / span);
      const hasNext = i < acts.length - 1;
      let phase;
      let opacity;
      if (local < inFrac) {
        phase = "in";
        opacity = easeOutCubic(local / inFrac);
      } else if (local > 1 - outFrac && hasNext) {
        phase = "out";
        opacity = easeOutCubic((1 - local) / outFrac);
      } else {
        phase = "hold";
        opacity = 1;
      }
      return { index: i, id: acts[i].id ?? null, local, phase, opacity };
    }
    start = end;
  }
  const li = acts.length - 1;
  return { index: li, id: acts[li].id ?? null, local: 1, phase: "hold", opacity: 1 };
}

export function metricValue(local, from, to, ease = easeOutCubic) {
  const k = clamp01(local);
  if (k <= 0) return from;
  if (k >= 1) return to;
  return from + (to - from) * ease(k);
}

export function formatMetric(value, format) {
  const abs = Math.abs(value);
  let s;
  if (abs >= 1000) {
    s = Math.round(value).toLocaleString("en-US");
  } else if (Number.isInteger(value)) {
    s = String(value);
  } else {
    s = String(Math.round(value * 10) / 10);
  }
  return format.replace("%s", s);
}
