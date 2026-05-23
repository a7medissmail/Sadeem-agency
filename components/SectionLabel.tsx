// Editorial vertical label that sits on the far-left edge of each section
// and scrolls with it (number · thin orange line · rotated text).
export default function SectionLabel({
  n,
  text,
  onDark = false,
}: {
  n: string;
  text: string;
  onDark?: boolean;
}) {
  return (
    <div className={`section-label ${onDark ? "on-dark" : ""}`} aria-hidden="true">
      <div className="sl-num">{n}</div>
      <div className="sl-line" />
      <div className="sl-text">{text}</div>
    </div>
  );
}
