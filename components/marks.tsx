// SADEEM logo fallback (used when no logo is uploaded in Site Settings)
// + anonymized client marks.

export function SadeemMark({ dark = false }: { dark?: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/sadeem-logo-white.png"
      alt="SADEEM"
      className="sadeem-logo-fallback"
      data-mark-dark={dark ? "1" : "0"}
    />
  );
}

export function LogoMark({ shape, s = 30 }: { shape: string; s?: number }) {
  const props = { width: s, height: s, viewBox: "0 0 32 32", fill: "none", stroke: "currentColor", strokeWidth: 1.2 };
  switch (shape) {
    case "wedge":
      return <svg {...props}><path d="M3 26 L16 5 L29 26 Z" /><path d="M11 26 L16 18 L21 26" /></svg>;
    case "ring":
      return <svg {...props}><circle cx="16" cy="16" r="11" /><circle cx="16" cy="16" r="5" /></svg>;
    case "grid":
      return <svg {...props}><rect x="5" y="5" width="9" height="9" /><rect x="18" y="5" width="9" height="9" /><rect x="5" y="18" width="9" height="9" /><rect x="18" y="18" width="9" height="9" /></svg>;
    case "diamond":
      return <svg {...props}><path d="M16 4 L28 16 L16 28 L4 16 Z" /><path d="M16 11 L21 16 L16 21 L11 16 Z" /></svg>;
    case "bar":
      return <svg {...props}><rect x="4" y="9" width="24" height="14" /><line x1="4" y1="16" x2="28" y2="16" /></svg>;
    case "orbit":
      return <svg {...props}><ellipse cx="16" cy="16" rx="12" ry="5" /><circle cx="16" cy="16" r="3" fill="currentColor" /></svg>;
    default:
      return null;
  }
}
