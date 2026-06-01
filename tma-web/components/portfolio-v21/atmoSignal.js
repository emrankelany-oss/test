// Shared scroll-atmosphere signal. ONE writer: V21Atmosphere. The bloom layer
// and the comet glow read the values as CSS custom properties (--atmo-bloom /
// --atmo-vel on <html>); this object is the JS-side mirror for readers that
// can't use CSS vars — the flow-field starts reading it in Task 3. Mutated in
// place each frame so JS readers can poll it without triggering React renders.
export const atmoSignal = { bloom: 0, vel: 0 };
