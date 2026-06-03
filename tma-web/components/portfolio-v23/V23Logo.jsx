import { TMA_LOGO_VIEWBOX, TMA_LOGO_PATHS } from "./tmaLogoPaths";

/**
 * The TMA wordmark as inline SVG (vectorised from the brand logo) so its paths
 * can be stroke-drawn. `draw` mode strokes the outlines (no fill) for the
 * preloader's write-on; default mode is the solid filled mark.
 */
export default function V23Logo({ className = "", draw = false, pathRef, svgRef }) {
  return (
    <svg
      ref={svgRef}
      className={className}
      viewBox={TMA_LOGO_VIEWBOX}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {TMA_LOGO_PATHS.map((p, i) => (
        <path
          key={i}
          ref={pathRef ? (el) => pathRef(el, i) : undefined}
          d={p.d}
          transform={p.transform || undefined}
          className={draw ? "v23-logo-stroke" : "v23-logo-fill"}
        />
      ))}
    </svg>
  );
}
