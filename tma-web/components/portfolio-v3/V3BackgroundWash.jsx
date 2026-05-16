/**
 * Ambient color wash — DOM-only background animation that drifts a soft
 * purple→cyan gradient blob across the viewport on a slow infinite loop.
 * Sits behind the R3F canvas (z-index 0) so the engine still composites
 * over it. Disabled under prefers-reduced-motion via CSS.
 */
export default function V3BackgroundWash() {
  return (
    <div className="v3-bg-wash" aria-hidden="true">
      <div className="v3-bg-wash__a" />
      <div className="v3-bg-wash__b" />
    </div>
  );
}
