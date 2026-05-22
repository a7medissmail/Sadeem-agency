"use client";

import { useEffect, useRef, useState } from "react";

// Closing CTA scene — wider, deeper sunrise landscape with a lone figure.
export default function ClosingScene({ scrollY = 0 }) {
  const [breath, setBreath] = useState(0);
  const raf = useRef();

  useEffect(() => {
    let start = performance.now();
    const tick = (t) => {
      setBreath(Math.sin((t - start) / 2800) * 0.5 + 0.5);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, []);

  const fgY = scrollY * 0.03;

  return (
    <svg
      className="closing-scene"
      viewBox="0 0 1600 700"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="closeSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a0a0c" />
          <stop offset="55%" stopColor="#1c1410" />
          <stop offset="100%" stopColor="#8a3e10" />
        </linearGradient>
        <radialGradient id="closeSun" cx="0.78" cy="0.7" r="0.5">
          <stop offset="0%" stopColor="#ffb37a" stopOpacity="0.95" />
          <stop offset="40%" stopColor="#ffb37a" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#ffb37a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="closeFog" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(245,243,240,0)" />
          <stop offset="50%" stopColor="rgba(245,243,240,0.10)" />
          <stop offset="100%" stopColor="rgba(245,243,240,0)" />
        </linearGradient>
        <linearGradient id="closeVignette" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#0D0D0F" stopOpacity="0.85" />
          <stop offset="35%" stopColor="#0D0D0F" stopOpacity="0.0" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="1600" height="700" fill="url(#closeSky)" />
      <rect x="0" y="0" width="1600" height="700" fill="url(#closeSun)" />

      <circle cx="1240" cy="490" r="40" fill="#ffb37a" opacity="0.85" />

      <path
        d="M0 460 L140 380 L260 440 L400 350 L540 410 L680 360 L820 420 L960 370 L1100 430 L1240 380 L1380 440 L1500 400 L1600 440 L1600 700 L0 700 Z"
        fill="#1a1a1f"
        opacity="0.85"
      />
      <path
        d="M0 540 L100 490 L220 530 L340 470 L460 510 L600 480 L740 520 L880 490 L1020 530 L1160 500 L1280 540 L1400 510 L1520 540 L1600 510 L1600 700 L0 700 Z"
        fill="#101012"
      />
      <rect x="0" y="500" width="1600" height="80" fill="url(#closeFog)" />

      <g transform="translate(1240 490)" className="orbital-rings">
        <circle r="130" fill="none" stroke="#FF6A00" strokeWidth="0.5" opacity="0.5" />
        <circle r="190" fill="none" stroke="#FF6A00" strokeWidth="0.4" opacity="0.3" strokeDasharray="2 6" />
        <circle r="250" fill="none" stroke="#F5F3F0" strokeWidth="0.3" opacity="0.18" />
        <circle cx="130" cy="0" r="1.6" fill="#FF6A00" />
        <circle cx="-185" cy="40" r="1.6" fill="#FF6A00" opacity="0.7" />
      </g>

      <g transform={`translate(0 ${fgY})`}>
        <path
          d="M0 640 L80 615 L180 580 L260 555 L340 530 L420 545 L500 575 L600 615 L720 640 L860 625 L1000 645 L1160 635 L1320 645 L1480 640 L1600 645 L1600 700 L0 700 Z"
          fill="#050506"
        />
        <g transform={`translate(340 ${510 + breath * 1.2})`}>
          <rect x="-3" y="14" width="2.5" height="18" fill="#050506" />
          <rect x="0.5" y="14" width="2.5" height="18" fill="#050506" />
          <path d="M-6 -3 L-5 16 L5 16 L6 -3 L3 -6 L-3 -6 Z" fill="#050506" />
          <path d="M-6 -2 L-8 11 L-5 11 L-5 -2 Z" fill="#050506" />
          <circle cx="0" cy="-9" r="3.2" fill="#050506" />
        </g>
      </g>

      <rect x="0" y="0" width="1600" height="700" fill="url(#closeVignette)" />
    </svg>
  );
}
