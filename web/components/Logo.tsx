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
        <linearGradient id="tgoat" x1="16" y1="18" x2="104" y2="102" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FF63C9" />
          <stop offset="1" stopColor="#C4007B" />
        </linearGradient>
      </defs>
      {/* horns: bold spiral, tapering to a curled tip */}
      <path d="M50 44 C42 24 24 15 14 24 C6 31 9 43 21 46 C14 44 14 37 21 36" stroke="url(#tgoat)" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M70 44 C78 24 96 15 106 24 C114 31 111 43 99 46 C106 44 106 37 99 36" stroke="url(#tgoat)" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* ears */}
      <path d="M40 53 C32 50 25 52 23 59 C31 62 38 58 43 54 Z" fill="url(#tgoat)" />
      <path d="M80 53 C88 50 95 52 97 59 C89 62 82 58 77 54 Z" fill="url(#tgoat)" />
      {/* face */}
      <path d="M42 47 C42 42 78 42 78 47 C79 61 73 75 60 87 C47 75 41 61 42 47 Z" fill="url(#tgoat)" />
      {/* beard */}
      <path d="M55 83 L60 96 L65 83 Z" fill="url(#tgoat)" />
    </svg>
  );
}
