// Animated candlesticks with a rising yield curve overlay. Pure SVG + CSS, no deps.
const CANDLES = [
  { x: 14, o: 96, c: 78, hi: 70, lo: 104, up: true },
  { x: 40, o: 86, c: 92, hi: 80, lo: 100, up: false },
  { x: 66, o: 92, c: 70, hi: 62, lo: 98, up: true },
  { x: 92, o: 74, c: 60, hi: 52, lo: 80, up: true },
  { x: 118, o: 66, c: 74, hi: 58, lo: 82, up: false },
  { x: 144, o: 72, c: 52, hi: 44, lo: 78, up: true },
  { x: 170, o: 56, c: 44, hi: 36, lo: 62, up: true },
  { x: 196, o: 48, c: 34, hi: 26, lo: 54, up: true },
  { x: 222, o: 40, c: 30, hi: 22, lo: 46, up: true },
];

export function CandleChart({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 250 140" className={className} fill="none" role="img" aria-label="Yield converging to par">
      <defs>
        <linearGradient id="cc" x1="0" y1="120" x2="250" y2="20" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2f4bff" />
          <stop offset="1" stopColor="#06b6d4" />
        </linearGradient>
        <linearGradient id="cca" x1="0" y1="20" x2="0" y2="130" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2f4bff" stopOpacity="0.16" />
          <stop offset="1" stopColor="#2f4bff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {CANDLES.map((k, i) => {
        const top = Math.min(k.o, k.c);
        const h = Math.max(3, Math.abs(k.o - k.c));
        const color = k.up ? "#10b981" : "#ef4444";
        return (
          <g key={i} style={{ transformOrigin: `${k.x}px 130px`, animation: `growbar 0.5s ${i * 0.08}s ease-out both` }}>
            <line x1={k.x} y1={k.hi} x2={k.x} y2={k.lo} stroke={color} strokeWidth="1.5" opacity="0.65" />
            <rect x={k.x - 5} y={top} width="10" height={h} rx="2" fill={color} opacity="0.9" />
          </g>
        );
      })}

      {/* yield / convergence curve toward par */}
      <path d="M8 118 C70 110 150 60 244 26" fill="none" stroke="url(#cc)" strokeWidth="3"
        strokeLinecap="round" strokeDasharray="360" strokeDashoffset="360">
        <animate attributeName="stroke-dashoffset" from="360" to="0" dur="2.4s" begin="0.4s" fill="freeze" />
      </path>
      <path d="M8 118 C70 110 150 60 244 26 L244 130 L8 130 Z" fill="url(#cca)" opacity="0">
        <animate attributeName="opacity" from="0" to="1" dur="1s" begin="2.4s" fill="freeze" />
      </path>
      <circle r="4.5" fill="#06b6d4" stroke="#fff" strokeWidth="1.5">
        <animateMotion dur="2.4s" begin="0.4s" fill="freeze" path="M8 118 C70 110 150 60 244 26" />
      </circle>
    </svg>
  );
}
