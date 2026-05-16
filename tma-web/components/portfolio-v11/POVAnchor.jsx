"use client";

// The recurring "Director" — a POV anchor that performs one studio
// action per chapter. It sits at the head of the left HUD rail so the
// viewer watches each chapter *with* the agency. Silhouettes are
// placeholders (Gemini-authored) — swap for illustrator art later by
// replacing the JSX in DIRECTOR_SVGS without touching wiring.

import Placard from "./Placard";

// viewBox 0 0 240 200, fill inherits currentColor.
const Slate = (
  <>
    <circle cx="115" cy="55" r="14" />
    <polygon points="110,65 120,65 122,78 108,78" />
    <path d="M102,75 c10,-4 20,0 23,8 v30 c0,5 -3,8 -8,8 h-20 c-5,0 -8,-3 -8,-8 v-30 c2,-5 8,-10 13,-8 z" />
    <path d="M105,82 L85,110 L100,120 L103,115 L93,108 L110,87 Z" />
    <path d="M120,82 L150,50 L156,56 L125,87 Z" />
    <polygon points="100,120 92,185 105,185 105,178 108,120" />
    <polygon points="112,120 118,185 130,185 120,120" />
    <rect x="145" y="40" width="8" height="12" rx="2" />
    <rect x="145" y="45" width="40" height="15" rx="1" />
    <g transform="rotate(-25 145 45)">
      <path d="M 145 30 h 8 v 10 h -8 z M 157 30 h 6 v 10 h -6 z M 167 30 h 6 v 10 h -6 z M 177 30 h 8 v 10 h -8 z" />
    </g>
  </>
);

const Framing = (
  <>
    <circle cx="125" cy="65" r="14" />
    <polygon points="115,75 125,75 120,98 105,95" />
    <polygon points="105,95 125,100 115,135 95,130" />
    <polygon points="115,100 135,85 140,90 120,108" />
    <polygon points="115,105 160,95 160,88 115,98" />
    <path d="M 160 90 H 175 V 86 H 156 V 105 H 160 Z" />
    <polygon points="105,130 140,110 145,120 110,145" />
    <polygon points="135,115 145,185 130,185 125,120" />
    <polygon points="105,135 85,185 70,180 95,130" />
    <polygon points="85,175 55,175 55,185 85,185" />
    <rect x="135" y="70" width="15" height="12" rx="2" />
    <rect x="148" y="68" width="6" height="16" rx="1" />
  </>
);

const Roll = (
  <>
    <circle cx="120" cy="55" r="14" />
    <polygon points="112,65 122,65 120,78 110,75" />
    <polygon points="110,75 125,78 120,125 105,120" />
    <polygon points="115,80 95,100 102,105 120,85" />
    <polygon points="115,85 140,95 135,102 110,92" />
    <polygon points="115,120 140,145 135,185 120,185 125,150 105,125" />
    <polygon points="110,120 95,150 115,185 100,185 80,150 100,120" />
    <path
      fillRule="evenodd"
      d="M145,78 a22,22 0 1 0 0,44 a22,22 0 1 0 0,-44 z M140,100 a5,5 0 1 1 -10,0 a5,5 0 1 1 10,0 z M160,100 a5,5 0 1 1 -10,0 a5,5 0 1 1 10,0 z M150,88 a5,5 0 1 1 -10,0 a5,5 0 1 1 10,0 z M150,112 a5,5 0 1 1 -10,0 a5,5 0 1 1 10,0 z"
    />
    <path
      fillRule="evenodd"
      d="M140,118 L 25,140 L 22,160 L 145,135 Z M120,125 L105,128 L103,140 L118,137 Z M95,130 L80,133 L78,145 L93,142 Z M70,135 L55,138 L53,150 L68,147 Z M45,140 L30,143 L28,155 L43,152 Z"
    />
  </>
);

const Reading = (
  <>
    <circle cx="135" cy="55" r="14" />
    <polygon points="130,65 140,65 145,80 130,80" />
    <path d="M 125 80 h 20 v 55 h -20 z" />
    <polygon points="135,80 75,80 75,90 135,90" />
    <polygon points="145,85 165,105 155,115 140,95" />
    <polygon points="125,135 120,185 105,185 115,135" />
    <polygon points="140,135 145,185 160,185 145,135" />
    <g transform="rotate(15 70 85)">
      <rect x="60" y="77" width="18" height="20" rx="2" />
      <path d="M 60 77 c -6 0 -10 4 -10 10 c 0 6 4 10 10 10 z" />
    </g>
  </>
);

const Listening = (
  <>
    <circle cx="95" cy="65" r="14" />
    <polygon points="90,75 100,75 100,95 85,95" />
    <polygon points="85,95 105,95 110,145 90,145" />
    <polygon points="90,145 70,185 85,185 100,145" />
    <polygon points="105,145 125,185 140,185 115,145" />
    <polygon points="95,100 70,120 75,130 100,108" />
    <polygon points="105,100 120,75 128,80 110,108" />
    <path
      fillRule="evenodd"
      d="M95,45 c-12,0 -20,10 -20,20 h4 c0,-8 6,-16 16,-16 c10,0 16,8 16,16 h4 c0,-10 -8,-20 -20,-20 z"
    />
    <rect x="73" y="60" width="6" height="15" rx="2" />
    <rect x="111" y="60" width="6" height="15" rx="2" />
    <g transform="rotate(-39 150 60)">
      <rect x="-40" y="58" width="190" height="4" />
      <rect x="140" y="48" width="60" height="24" rx="12" />
    </g>
  </>
);

const Fin = (
  <>
    <rect x="70" y="80" width="12" height="110" rx="2" />
    <rect x="158" y="80" width="12" height="110" rx="2" />
    <rect x="68" y="75" width="16" height="6" rx="1" />
    <rect x="156" y="75" width="16" height="6" rx="1" />
    <rect x="82" y="95" width="76" height="35" />
    <rect x="75" y="140" width="90" height="8" rx="2" />
    <polygon points="75,148 155,195 165,195 85,148" />
    <polygon points="165,148 85,195 75,195 155,148" />
    <polygon points="82,110 55,120 55,128 82,120" />
    <polygon points="158,110 185,120 185,128 158,120" />
    <circle cx="120" cy="55" r="16" />
    <path d="M120,65 c-15,0 -30,10 -35,30 h70 c-5,-20 -20,-30 -35,-30 z" />
  </>
);

// index → { art, role, take } — maps to the current 6-chapter spine.
// Phase D/F extend this as Cases + Monument chapters land.
const ANCHORS = [
  { art: Slate, role: "DIRECTOR", take: "TAKE 01" },
  { art: Framing, role: "FRAMING", take: "02" },
  { art: Roll, role: "ROLL", take: "39 CUTS" },
  { art: Reading, role: "READING", take: "LIVE" },
  { art: Listening, role: "LISTENING", take: "ROOM" },
  { art: Fin, role: "FIN", take: "DIR. TMA" },
];

export default function POVAnchor({ index = 0 }) {
  const a = ANCHORS[Math.max(0, Math.min(ANCHORS.length - 1, index))];
  return (
    <div className="v11-pov" aria-hidden="true">
      <svg
        className="v11-pov-fig"
        viewBox="0 0 240 200"
        fill="currentColor"
        role="img"
      >
        {a.art}
      </svg>
      <Placard items={[a.role, a.take]} className="v11-pov-cap" />
    </div>
  );
}
