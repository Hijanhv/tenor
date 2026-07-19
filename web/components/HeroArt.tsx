import { LiveRate } from "./LiveRate";

// Signature hero animation: a principal-token price curve pulling to par, drawn
// with a glowing node that travels it, over drifting pink/lime color orbs.
// Pure SVG (SMIL) + CSS — no JS, loops forever.
const CURVE = "M 36 292 C 132 284 192 252 242 196 C 294 138 342 108 406 90";

export function HeroArt() {
  return (
    <div className="hero-art aspect-[5/4] w-full">
      <div className="ha-orb ha-orb-1" />
      <div className="ha-orb ha-orb-2" />
      <div className="ha-orb ha-orb-3" />
      <div className="ha-grid" />

      <svg
        viewBox="0 0 440 340"
        className="absolute inset-0 z-[2] h-full w-full"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        role="img"
        aria-label="Principal token price converging to par"
      >
        <defs>
          <linearGradient id="curveG" x1="36" y1="292" x2="406" y2="90" gradientUnits="userSpaceOnUse">
            <stop stopColor="#e10098" />
            <stop offset="0.55" stopColor="#ff45bf" />
            <stop offset="1" stopColor="#c3f655" />
          </linearGradient>
          <linearGradient id="areaG" x1="0" y1="90" x2="0" y2="300" gradientUnits="userSpaceOnUse">
            <stop stopColor="#e10098" stopOpacity="0.28" />
            <stop offset="1" stopColor="#e10098" stopOpacity="0" />
          </linearGradient>
          <filter id="glow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* par line */}
        <line x1="36" y1="90" x2="410" y2="90" stroke="#c3f655" strokeWidth="1.5" strokeDasharray="2 6" opacity="0.7" />
        <text x="40" y="80" fill="#c3f655" fontSize="12" fontFamily="var(--font-mono), monospace" opacity="0.9">
          par 1.00
        </text>

        {/* area under the curve */}
        <path d={`${CURVE} L 406 300 L 36 300 Z`} fill="url(#areaG)" />

        {/* the curve */}
        <path d={CURVE} stroke="url(#curveG)" strokeWidth="4" strokeLinecap="round" />

        {/* travelling glow node */}
        <circle r="10" fill="#ff45bf" opacity="0.5" filter="url(#glow)">
          <animateMotion dur="5s" repeatCount="indefinite" rotate="auto" path={CURVE} />
        </circle>
        <circle r="5" fill="#ffffff" filter="url(#glow)">
          <animateMotion dur="5s" repeatCount="indefinite" rotate="auto" path={CURVE} />
        </circle>

        {/* pulsing par rings at the endpoint */}
        <circle cx="406" cy="90" r="5" fill="#c3f655" />
        <circle cx="406" cy="90" r="5" fill="none" stroke="#c3f655" strokeWidth="2">
          <animate attributeName="r" values="5;28" dur="2.6s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.9;0" dur="2.6s" repeatCount="indefinite" />
        </circle>
        <circle cx="406" cy="90" r="5" fill="none" stroke="#ff45bf" strokeWidth="2">
          <animate attributeName="r" values="5;28" dur="2.6s" begin="1.3s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.9;0" dur="2.6s" begin="1.3s" repeatCount="indefinite" />
        </circle>
      </svg>

      {/* live proof chip */}
      <div className="absolute left-5 top-5 z-[3]">
        <LiveRate />
      </div>
      <div className="absolute bottom-5 right-5 z-[3] font-mono text-xs tracking-tight text-white/70">
        price climbs to par
      </div>
    </div>
  );
}
