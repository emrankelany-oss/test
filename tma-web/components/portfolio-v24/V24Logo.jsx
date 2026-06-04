import { TMA_LOGO_VIEWBOX, TMA_LOGO_PATHS } from "../portfolio-v23/tmaLogoPaths";

/**
 * V24 wordmark — same vector paths as V23 (reused data) but emits v24-namespaced
 * path classes so v24.css styles the preloader write-on. `draw` strokes the
 * outlines for the preloader; default mode is the solid filled mark.
 */
export default function V24Logo({ className = "", draw = false, pathRef, svgRef }) {
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
          className={draw ? "v24-logo-stroke" : "v24-logo-fill"}
        />
      ))}
    </svg>
  );
}
