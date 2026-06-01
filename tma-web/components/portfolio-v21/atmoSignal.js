// Shared scroll-atmosphere signal: ONE writer (V21Atmosphere), many readers
// (the bloom layer + comet glow via CSS vars, and the flow-field + comet gate
// via this object). Mutated in place each frame so JS readers can poll it
// without triggering React re-renders.
export const atmoSignal = { bloom: 0, vel: 0 };
