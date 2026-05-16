export default function Tape({ rotation = 0, width = 96, color = "#FCE38A", className = "" }) {
  return (
    <svg
      className={`v7-tape ${className}`}
      width={width}
      height={28}
      viewBox="0 0 96 28"
      style={{ transform: `rotate(${rotation}deg)` }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="tape-shade" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="rgba(0,0,0,0.06)" />
          <stop offset="40%" stopColor="rgba(255,255,255,0.18)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.06)" />
        </linearGradient>
      </defs>
      <rect x="0" y="2" width="96" height="24" fill={color} opacity="0.78" />
      <rect x="0" y="2" width="96" height="24" fill="url(#tape-shade)" />
      <line x1="6" y1="6" x2="14" y2="22" stroke="rgba(0,0,0,0.08)" strokeWidth="1" />
      <line x1="82" y1="6" x2="90" y2="22" stroke="rgba(0,0,0,0.08)" strokeWidth="1" />
    </svg>
  );
}
