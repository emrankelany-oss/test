// A hand-drawn marker-style arrow. Path is intentionally wobbly.
export default function MarkerArrow({ rotation = 0, width = 220, color = "#1A1A1A", className = "" }) {
  return (
    <svg
      className={`v7-marker-arrow ${className}`}
      width={width}
      height={width * 0.45}
      viewBox="0 0 220 100"
      style={{ transform: `rotate(${rotation}deg)` }}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M8 78 C 38 36, 78 26, 124 38 C 156 46, 178 60, 198 56"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M180 42 L 198 56 L 184 70"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
