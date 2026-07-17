export function Logo({ size = 34 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      aria-label="Tenor"
    >
      <defs>
        <linearGradient id="tg" x1="30" y1="14" x2="92" y2="106" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4F46E5" />
          <stop offset="1" stopColor="#06B6D4" />
        </linearGradient>
        <linearGradient id="tgy" x1="72" y1="16" x2="80" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F59E0B" />
          <stop offset="1" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
      <path d="M60 104 V78" stroke="url(#tg)" strokeWidth="9" strokeLinecap="round" />
      <path
        d="M60 78 C60 66 44 66 44 54 M60 78 C60 66 76 66 76 54"
        stroke="url(#tg)"
        strokeWidth="9"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M44 54 V24" stroke="url(#tg)" strokeWidth="9" strokeLinecap="round" />
      <circle cx="44" cy="18" r="6" fill="#4F46E5" />
      <path
        d="M76 54 C76 42 70 40 76 30 C80 24 82 26 84 20"
        stroke="url(#tgy)"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path d="M78 18 L84 15 L86 21 Z" fill="#F59E0B" />
    </svg>
  );
}
