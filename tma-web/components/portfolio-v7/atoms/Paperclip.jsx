export default function Paperclip({ rotation = -12, size = 56, className = "" }) {
  return (
    <svg
      className={`v7-paperclip ${className}`}
      width={size}
      height={size * 1.6}
      viewBox="0 0 32 52"
      style={{ transform: `rotate(${rotation}deg)` }}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M22 4v34c0 5.523-4.477 10-10 10S2 43.523 2 38V12c0-3.314 2.686-6 6-6s6 2.686 6 6v22"
        stroke="#8a8580"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M22 4v34c0 5.523-4.477 10-10 10S2 43.523 2 38V12c0-3.314 2.686-6 6-6s6 2.686 6 6v22"
        stroke="rgba(255,255,255,0.45)"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}
