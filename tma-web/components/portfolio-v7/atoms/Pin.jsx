export default function Pin({ color = "#D43A3A", size = 22, className = "" }) {
  return (
    <svg
      className={`v7-pin-svg ${className}`}
      width={size}
      height={size}
      viewBox="0 0 22 22"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="9" fill={color} />
      <circle cx="8" cy="8" r="3" fill="rgba(255,255,255,0.45)" />
      <circle cx="11" cy="11" r="9" fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth="0.5" />
    </svg>
  );
}
