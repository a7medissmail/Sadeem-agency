"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

const ArrowRight = () => (
  <svg width="22" height="14" viewBox="0 0 22 14" fill="none" aria-hidden="true">
    <path d="M1 7 H21 M15 1 L21 7 L15 13" stroke="currentColor" strokeWidth="1.2" />
  </svg>
);

const paths = [
  { bearing: "N 000°", href: "/", title: "Home base", meta: "Strategic overview" },
  { bearing: "E 090°", href: "/#services", title: "Services", meta: "What we do" },
  { bearing: "S 180°", href: "/#cases", title: "Case studies", meta: "Proof of work" },
  { bearing: "W 270°", href: "/#contact", title: "Signal base", meta: "Contact a guide" },
] as const;

const marqueeItems = [
  "Page not found", "Recalibrating bearings", "Scanning local sectors",
  "Cache reads · nominal", "Re-route suggested", "Signal strength · weak",
  "Last sync 00:00:14 ago",
];

export default function NotFoundContent() {
  const clockRef = useRef<HTMLSpanElement>(null);
  const topoRef = useRef<SVGGElement>(null);

  useEffect(() => {
    // Live UTC clock
    const clockEl = clockRef.current;
    const tick = () => {
      const d = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      if (clockEl) clockEl.textContent = `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC`;
    };
    tick();
    const clockTimer = setInterval(tick, 1000);

    // Coordinate scramble
    const charset = "0123456789°NSEWMABCDEF";
    const coordEls = document.querySelectorAll<HTMLSpanElement>("[data-scramble]");
    const scramble = () => {
      coordEls.forEach((el) => {
        const target = el.getAttribute("data-scramble") ?? "";
        if (Math.random() < 0.55) { el.textContent = target; return; }
        let out = "";
        for (let i = 0; i < target.length; i++) {
          const c = target[i];
          if (c === " " || c === "." || c === "°") { out += c; continue; }
          out += Math.random() < 0.25 ? charset[Math.floor(Math.random() * charset.length)] : c;
        }
        el.textContent = out;
      });
    };
    const scrambleTimer = setInterval(scramble, 180);

    // Mouse parallax on topo
    const topoEl = topoRef.current;
    let tx = 0, ty = 0, cx = 0, cy = 0;
    let rafId: number;
    const onMouseMove = (e: MouseEvent) => {
      tx = (e.clientX / window.innerWidth - 0.5) * 18;
      ty = (e.clientY / window.innerHeight - 0.5) * 12;
    };
    const loop = () => {
      cx += (tx - cx) * 0.04;
      cy += (ty - cy) * 0.04;
      if (topoEl) (topoEl as SVGGElement).style.translate = `${cx}px ${cy}px`;
      rafId = requestAnimationFrame(loop);
    };
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    rafId = requestAnimationFrame(loop);

    return () => {
      clearInterval(clockTimer);
      clearInterval(scrambleTimer);
      window.removeEventListener("mousemove", onMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <main className="nf-page">

      {/* ── Background: topo map + grid + vignette ── */}
      <div className="nf-bg" aria-hidden="true">
        <svg viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
          <defs>
            <radialGradient id="nfTopoFade" cx="0.5" cy="0.5" r="0.7">
              <stop offset="0%" stopColor="#FF6A00" stopOpacity="0.10" />
              <stop offset="40%" stopColor="#FF6A00" stopOpacity="0.03" />
              <stop offset="100%" stopColor="#FF6A00" stopOpacity="0" />
            </radialGradient>
            <filter id="nfGrain" x="0" y="0" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={7} />
              <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.05 0" />
            </filter>
          </defs>

          <g ref={topoRef} className="topo-drift" stroke="#F5F3F0" fill="none" strokeWidth="0.5" opacity="0.12">
            {/* Peak A */}
            <g transform="translate(380 620)">
              <path d="M -360 0 C -340 -90, -180 -130, 0 -120 C 220 -110, 380 -60, 380 0 C 380 80, 220 130, 0 120 C -200 110, -360 60, -360 0 Z" />
              <path d="M -300 0 C -280 -78, -150 -110, 0 -100 C 180 -92, 320 -50, 320 0 C 320 66, 180 108, 0 100 C -170 92, -300 50, -300 0 Z" />
              <path d="M -240 0 C -222 -64, -120 -90, 0 -82 C 144 -76, 256 -40, 256 0 C 256 54, 144 88, 0 82 C -136 76, -240 40, -240 0 Z" />
              <path d="M -180 0 C -166 -50, -90 -70, 0 -64 C 108 -58, 192 -30, 192 0 C 192 42, 108 68, 0 64 C -100 58, -180 32, -180 0 Z" />
              <path d="M -120 0 C -110 -36, -60 -48, 0 -44 C 72 -40, 128 -22, 128 0 C 128 30, 72 46, 0 44 C -66 40, -120 24, -120 0 Z" />
              <path d="M -64 0 C -58 -20, -30 -26, 0 -24 C 38 -22, 68 -12, 68 0 C 68 16, 38 24, 0 24 C -34 22, -64 14, -64 0 Z" />
              <path d="M -28 0 C -24 -10, -12 -12, 0 -12 C 16 -12, 28 -6, 28 0 C 28 8, 16 12, 0 12 C -14 12, -28 6, -28 0 Z" />
            </g>
            {/* Peak B */}
            <g transform="translate(1230 380)">
              <path d="M -420 0 C -400 -110, -210 -150, 0 -140 C 240 -130, 420 -70, 420 0 C 420 90, 240 150, 0 140 C -220 130, -420 70, -420 0 Z" />
              <path d="M -340 0 C -320 -90, -170 -125, 0 -118 C 200 -110, 340 -58, 340 0 C 340 74, 200 122, 0 118 C -180 110, -340 56, -340 0 Z" />
              <path d="M -260 0 C -240 -70, -130 -100, 0 -92 C 156 -85, 260 -44, 260 0 C 260 58, 156 96, 0 92 C -144 86, -260 44, -260 0 Z" />
              <path d="M -200 0 C -184 -56, -100 -78, 0 -72 C 120 -66, 200 -34, 200 0 C 200 44, 120 74, 0 72 C -112 66, -200 34, -200 0 Z" />
              <path d="M -140 0 C -128 -40, -70 -56, 0 -52 C 84 -48, 140 -26, 140 0 C 140 32, 84 52, 0 52 C -78 48, -140 26, -140 0 Z" />
              <path d="M -80 0 C -72 -24, -40 -32, 0 -30 C 50 -28, 80 -14, 80 0 C 80 18, 50 30, 0 30 C -44 28, -80 16, -80 0 Z" />
              <path d="M -36 0 C -32 -12, -16 -16, 0 -16 C 22 -16, 36 -8, 36 0 C 36 10, 22 16, 0 16 C -18 16, -36 8, -36 0 Z" />
              <path d="M -14 0 C -12 -5, -6 -6, 0 -6 C 8 -6, 14 -3, 14 0 C 14 4, 8 6, 0 6 C -8 6, -14 3, -14 0 Z" />
            </g>
            {/* River paths */}
            <path d="M -50 540 C 200 520, 360 560, 540 540 C 720 520, 880 600, 1080 580 C 1280 560, 1460 620, 1660 600" strokeDasharray="2 6" opacity="0.7" />
            <path d="M -50 700 C 240 690, 420 720, 620 700 C 820 680, 980 740, 1180 720 C 1380 700, 1560 760, 1660 740" strokeDasharray="2 6" opacity="0.5" />
            <path d="M -50 820 C 220 810, 440 840, 680 820 C 920 800, 1100 860, 1320 840 C 1480 825, 1580 870, 1660 850" strokeDasharray="2 6" opacity="0.35" />
          </g>

          <rect width="1600" height="1000" fill="url(#nfTopoFade)" />
          <rect width="1600" height="1000" filter="url(#nfGrain)" opacity="0.7" />
        </svg>

        <div className="nf-grid-overlay" />
        <div className="nf-vignette" />
      </div>

      {/* ── "You are here" pins ── */}
      <div className="nf-pin" aria-hidden="true">
        <div style={{ position: "relative" }}>
          <span className="nf-x" />
          <span className="nf-x-ring" />
        </div>
        <span>Last known · 24° 28′ N</span>
      </div>
      <div className="nf-pin nf-pin-2" aria-hidden="true">
        <span>Trail end · 46° 51′ E</span>
        <div style={{ position: "relative" }}>
          <span className="nf-x" />
          <span className="nf-x-ring" />
        </div>
      </div>

      {/* ── Main stage ── */}
      <section className="nf-stage">
        <div className="nf-center">

          <div className="nf-eyebrow">
            <span className="e-tick" />
            <span className="e-code">ERR / 404</span>
            <span>·</span>
            <span>COORDINATES LOST</span>
            <span>·</span>
            <span ref={clockRef} className="nf-eyebrow-clock">00:00:00 UTC</span>
          </div>

          <h1 className="nf-glyph" aria-label="404 — page not found">
            <span className="nf-digit" data-d="4">4</span>

            {/* Radar disc replacing the 0 */}
            <span className="nf-radar" aria-hidden="true">
              <svg viewBox="0 0 400 400">
                <defs>
                  <radialGradient id="nfRadarFill" cx="0.5" cy="0.5" r="0.5">
                    <stop offset="0%" stopColor="#FF6A00" stopOpacity="0.08" />
                    <stop offset="70%" stopColor="#FF6A00" stopOpacity="0.02" />
                    <stop offset="100%" stopColor="#FF6A00" stopOpacity="0" />
                  </radialGradient>
                  <linearGradient id="nfSweepGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#FF6A00" stopOpacity="0" />
                    <stop offset="80%" stopColor="#FF6A00" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#FF6A00" stopOpacity="0.7" />
                  </linearGradient>
                </defs>

                {/* Outer "0" ring */}
                <circle cx="200" cy="200" r="186" fill="url(#nfRadarFill)" stroke="#F5F3F0" strokeWidth="18" strokeOpacity="0.95" />

                {/* Inner radar rings + crosshair + labels */}
                <g className="ring-rot">
                  <circle cx="200" cy="200" r="150" fill="none" stroke="#FF6A00" strokeWidth="0.8" opacity="0.5" />
                  <circle cx="200" cy="200" r="110" fill="none" stroke="#FF6A00" strokeWidth="0.6" strokeDasharray="3 6" opacity="0.45" />
                  <circle cx="200" cy="200" r="70"  fill="none" stroke="#F5F3F0" strokeWidth="0.5" opacity="0.25" />
                  <circle cx="200" cy="200" r="36"  fill="none" stroke="#FF6A00" strokeWidth="0.6" opacity="0.5" />
                  <line x1="14"  y1="200" x2="60"  y2="200" stroke="#F5F3F0" strokeWidth="0.6" opacity="0.35" />
                  <line x1="340" y1="200" x2="386" y2="200" stroke="#F5F3F0" strokeWidth="0.6" opacity="0.35" />
                  <line x1="200" y1="14"  x2="200" y2="60"  stroke="#F5F3F0" strokeWidth="0.6" opacity="0.35" />
                  <line x1="200" y1="340" x2="200" y2="386" stroke="#F5F3F0" strokeWidth="0.6" opacity="0.35" />
                  <text x="200" y="36"  textAnchor="middle" fill="#F5F3F0" opacity="0.55" fontFamily="var(--font-mono)" fontSize="11" letterSpacing="2">N</text>
                  <text x="364" y="206" textAnchor="middle" fill="#F5F3F0" opacity="0.55" fontFamily="var(--font-mono)" fontSize="11" letterSpacing="2">E</text>
                  <text x="200" y="376" textAnchor="middle" fill="#F5F3F0" opacity="0.55" fontFamily="var(--font-mono)" fontSize="11" letterSpacing="2">S</text>
                  <text x="36"  y="206" textAnchor="middle" fill="#F5F3F0" opacity="0.55" fontFamily="var(--font-mono)" fontSize="11" letterSpacing="2">W</text>
                </g>

                {/* Counter-rotating ring */}
                <g className="ring-rot-rev">
                  <circle cx="200" cy="200" r="168" fill="none" stroke="#FF6A00" strokeWidth="0.6" strokeDasharray="1 8" opacity="0.55" />
                  <circle cx="284" cy="200" r="2" fill="#FF6A00" />
                  <circle cx="116" cy="200" r="1.6" fill="#FF6A00" opacity="0.7" />
                </g>

                {/* Sweep */}
                <g className="sweep">
                  <path d="M 200 200 L 386 200 A 186 186 0 0 0 326 68 Z" fill="url(#nfSweepGrad)" />
                </g>

                {/* Blips */}
                <circle className="blip" cx="248" cy="142" r="3" fill="#FF6A00" />
                <circle className="blip blip-2" cx="138" cy="252" r="3" fill="#FF6A00" />

                {/* Center */}
                <circle cx="200" cy="200" r="3" fill="#FF6A00" />
                <line x1="180" y1="200" x2="220" y2="200" stroke="#FF6A00" strokeWidth="0.8" />
                <line x1="200" y1="180" x2="200" y2="220" stroke="#FF6A00" strokeWidth="0.8" />
              </svg>
            </span>

            <span className="nf-digit" data-d="4">4</span>
          </h1>

          {/* Coordinate readout */}
          <div className="nf-coords" id="nf-coords">
            <span className="c-row"><span className="c-lbl">LAT</span><span className="c-val" data-scramble="24.4667° N">24.4667° N</span></span>
            <span className="c-row"><span className="c-lbl">LON</span><span className="c-val" data-scramble="46.8568° E">46.8568° E</span></span>
            <span className="c-row"><span className="c-lbl">ELEV</span><span className="c-val" data-scramble="612 M">612 M</span></span>
            <span className="c-row"><span className="c-lbl">STATUS</span><span className="c-val warn" data-scramble="OFF MAP">OFF MAP</span></span>
          </div>

          <p className="nf-tag">
            You&apos;ve stepped <span style={{ color: "var(--accent)" }}>off the trail.</span><br />
            The path forward isn&apos;t here — but the map is.
          </p>
          <p className="nf-sub">
            The page you were following has been moved, renamed, or never charted.
            Use the bearings below to re-route — or signal base to send a guide.
          </p>

        </div>
      </section>

      {/* ── Reroute compass ── */}
      <section className="nf-reroute">
        <div className="nf-reroute-head">
          <span className="lbl"><span className="accent">›</span> SUGGESTED BEARINGS · CHOOSE A ROUTE</span>
          <span className="lbl">04 PATHS</span>
        </div>
        <nav className="nf-paths">
          {paths.map((p) => (
            <Link key={p.bearing} href={p.href} className="nf-path">
              <span className="bearing">{p.bearing}</span>
              <span className="p-body">
                <span className="p-title">{p.title}</span>
                <span className="p-meta">{p.meta}</span>
              </span>
              <span className="p-arrow"><ArrowRight /></span>
            </Link>
          ))}
        </nav>
      </section>

      {/* ── Ticker ── */}
      <footer className="nf-ticker">
        <span style={{ whiteSpace: "nowrap", color: "rgba(245,243,240,0.7)" }}>
          TRANSMIT · <span style={{ color: "var(--accent)" }}>04</span>
        </span>
        <div className="marquee">
          <div className="marquee-track">
            {[...marqueeItems, ...marqueeItems].map((item, i) =>
              i % marqueeItems.length === 0 && i > 0 ? (
                <span key={i}>{item}</span>
              ) : (
                <>
                  <span key={`item-${i}`}>{item}</span>
                  <span key={`sep-${i}`} className="sep">/</span>
                </>
              )
            )}
          </div>
        </div>
        <span style={{ whiteSpace: "nowrap" }}>
          ERR 404 · <span style={{ color: "var(--accent)" }}>OFFLINE</span>
        </span>
      </footer>

    </main>
  );
}
