// Atmospheric SVG imagery for case-study tiles (industrial / tech / retail).
export default function CaseSvg({ kind }) {
  if (kind === "industrial") {
    return (
      <svg viewBox="0 0 600 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <linearGradient id="indSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a1410" />
            <stop offset="100%" stopColor="#3a1a08" />
          </linearGradient>
        </defs>
        <rect width="600" height="400" fill="url(#indSky)" />
        <circle cx="450" cy="280" r="80" fill="#FF6A00" opacity="0.18" />
        <g fill="#050506">
          <rect x="60" y="220" width="40" height="180" />
          <rect x="110" y="170" width="30" height="230" />
          <rect x="150" y="240" width="50" height="160" />
          <rect x="210" y="200" width="36" height="200" />
          <rect x="260" y="250" width="60" height="150" />
          <rect x="330" y="180" width="44" height="220" />
          <rect x="384" y="230" width="50" height="170" />
          <rect x="444" y="200" width="36" height="200" />
          <rect x="490" y="240" width="60" height="160" />
        </g>
        <g fill="#F5F3F0" opacity="0.06">
          <ellipse cx="125" cy="160" rx="60" ry="20" />
          <ellipse cx="350" cy="170" rx="80" ry="22" />
          <ellipse cx="510" cy="190" rx="60" ry="18" />
        </g>
        <rect width="600" height="400" fill="#000" opacity="0.35" />
      </svg>
    );
  }
  if (kind === "tech") {
    return (
      <svg viewBox="0 0 600 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <linearGradient id="techBg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0a0d18" />
            <stop offset="100%" stopColor="#1a2540" />
          </linearGradient>
        </defs>
        <rect width="600" height="400" fill="url(#techBg)" />
        <g stroke="#FF6A00" strokeWidth="0.4" opacity="0.4">
          {Array.from({ length: 10 }).map((_, i) => (
            <line key={i} x1={i * 70 - 50} y1="400" x2={300} y2="280" />
          ))}
          {[300, 320, 340, 360, 380].map((y) => (
            <line key={y} x1="0" y1={y} x2="600" y2={y} opacity={(380 - y) / 80 + 0.3} />
          ))}
        </g>
        <g fill="#FF6A00">
          <rect x="100" y="160" width="40" height="120" opacity="0.5" />
          <rect x="160" y="120" width="40" height="160" opacity="0.7" />
          <rect x="220" y="80" width="40" height="200" opacity="0.85" />
          <rect x="280" y="60" width="40" height="220" />
          <rect x="340" y="100" width="40" height="180" opacity="0.7" />
          <rect x="400" y="140" width="40" height="140" opacity="0.55" />
          <rect x="460" y="180" width="40" height="100" opacity="0.4" />
        </g>
        <rect width="600" height="400" fill="#000" opacity="0.35" />
      </svg>
    );
  }
  // retail
  return (
    <svg viewBox="0 0 600 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="retailBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a1410" />
          <stop offset="100%" stopColor="#241a14" />
        </linearGradient>
      </defs>
      <rect width="600" height="400" fill="url(#retailBg)" />
      <g stroke="#F5F3F0" strokeWidth="0.6" opacity="0.2">
        <line x1="0" y1="60" x2="600" y2="60" />
        <line x1="0" y1="80" x2="600" y2="80" />
      </g>
      <g>
        {[80, 200, 320, 440, 560].map((x) => (
          <g key={x}>
            <circle cx={x} cy="80" r="5" fill="#FF6A00" opacity="0.8" />
            <path d={`M${x} 80 L${x - 70} 400 L${x + 70} 400 Z`} fill="#FF6A00" opacity="0.06" />
          </g>
        ))}
      </g>
      <g fill="#050506">
        <rect x="0" y="240" width="600" height="20" />
        <rect x="0" y="290" width="600" height="20" />
        <rect x="0" y="340" width="600" height="20" />
      </g>
      <g fill="#3a2c20">
        <rect x="20" y="260" width="50" height="30" />
        <rect x="90" y="260" width="50" height="30" />
        <rect x="160" y="260" width="50" height="30" />
        <rect x="230" y="260" width="50" height="30" />
        <rect x="300" y="260" width="50" height="30" />
        <rect x="370" y="260" width="50" height="30" />
        <rect x="440" y="260" width="50" height="30" />
        <rect x="510" y="260" width="50" height="30" />
      </g>
      <rect width="600" height="400" fill="#000" opacity="0.4" />
    </svg>
  );
}
