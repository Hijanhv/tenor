export function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      aria-label="Tenor"
    >
      <defs>
        <linearGradient id="tg" x1="28" y1="12" x2="94" y2="108" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2F4BFF" />
          <stop offset="1" stopColor="#06B6D4" />
        </linearGradient>
        <linearGradient id="tgy" x1="72" y1="14" x2="86" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FBBF24" />
          <stop offset="1" stopColor="#F97316" />
        </linearGradient>
      </defs>
      {/* soft glow tile so the mark reads as an app icon */}
      <rect x="6" y="6" width="108" height="108" rx="30" fill="url(#tg)" opacity="0.10" />
      {/* stem */}
      <path d="M60 104 V78" stroke="url(#tg)" strokeWidth="11" strokeLinecap="round" />
      {/* fork */}
      <path
        d="M60 78 C60 66 44 66 44 54 M60 78 C60 66 76 66 76 54"
        stroke="url(#tg)"
        strokeWidth="11"
        strokeLinecap="round"
        fill="none"
      />
      {/* left tine: PT, straight, capped at par */}
      <path d="M44 54 V24" stroke="url(#tg)" strokeWidth="11" strokeLinecap="round" />
      <circle cx="44" cy="17" r="7" fill="#2F4BFF" />
      {/* right tine: YT, rises like a yield curve */}
      <path
        d="M76 54 C76 42 70 40 76 30 C80 24 82 26 84 20"
        stroke="url(#tgy)"
        strokeWidth="11"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path d="M77 17 L85 13 L87 21 Z" fill="#F97316" />
    </svg>
  );
}
