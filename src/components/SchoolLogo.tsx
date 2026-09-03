export function SchoolLogo({ className = 'w-full h-full' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Logo SMA Negeri 05 Bombana"
    >
      {/* Outer shield */}
      <defs>
        <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e3a8a" />
          <stop offset="50%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#0369a1" />
        </linearGradient>
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#ca8a04" />
        </linearGradient>
      </defs>

      {/* Pentagon / Shield Base */}
      <path
        d="M60 6 L108 24 L94 88 L60 114 L26 88 L12 24 Z"
        fill="url(#shieldGrad)"
        stroke="#facc15"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />

      {/* Inner Border Ring */}
      <path
        d="M60 12 L102 28 L90 84 L60 108 L30 84 L18 28 Z"
        fill="#0f172a"
        stroke="#e2e8f0"
        strokeWidth="1.2"
        strokeDasharray="2 1"
      />

      {/* Golden Star at top */}
      <polygon
        points="60,20 63,27 71,28 65,34 67,42 60,37 53,42 55,34 49,28 57,27"
        fill="url(#goldGrad)"
      />

      {/* Open Book of Knowledge */}
      <path
        d="M36 68 C46 64 54 65 60 70 C66 65 74 64 84 68 L84 82 C74 78 66 79 60 84 C54 79 46 78 36 82 Z"
        fill="#ffffff"
        stroke="#0284c7"
        strokeWidth="1.5"
      />
      <line x1="60" y1="70" x2="60" y2="84" stroke="#0284c7" strokeWidth="1.5" />

      {/* Torch of Enlightenment */}
      <path
        d="M58 48 L62 48 L61 66 L59 66 Z"
        fill="#94a3b8"
        stroke="#cbd5e1"
        strokeWidth="1"
      />
      <path
        d="M56 46 Q60 40 60 36 Q64 42 60 48 Q58 48 56 46 Z"
        fill="#ef4444"
      />
      <path
        d="M58 45 Q60 41 60 38 Q62 42 60 46 Z"
        fill="#facc15"
      />

      {/* Laurel leaves wreath */}
      <circle cx="34" cy="54" r="2.5" fill="#facc15" />
      <circle cx="38" cy="46" r="2.5" fill="#facc15" />
      <circle cx="86" cy="54" r="2.5" fill="#22c55e" />
      <circle cx="82" cy="46" r="2.5" fill="#22c55e" />

      {/* Ribbon Banner at Bottom */}
      <path
        d="M26 94 L60 90 L94 94 L88 103 L60 99 L32 103 Z"
        fill="url(#goldGrad)"
        stroke="#78350f"
        strokeWidth="1"
      />
      <text
        x="60"
        y="98.5"
        textAnchor="middle"
        fontSize="6.5"
        fontWeight="900"
        fill="#0f172a"
        fontFamily="sans-serif"
      >
        SMAN 05 BOMBANA
      </text>
    </svg>
  );
}
