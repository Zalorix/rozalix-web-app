/**
 * Rozalix robot mark — the "Visor" design. White body with the client's accent
 * as the visor (reads as a cut-out to the accent disc behind it) and a lighter
 * tint for the ears. Pass the client's accent so it adapts to any brand colour.
 */
export function RobotMark({
  className,
  accent = "var(--color-indigo)",
}: {
  className?: string;
  accent?: string;
}) {
  const lite = `color-mix(in srgb, ${accent} 45%, #fff)`;
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      {/* antenna */}
      <circle cx="12" cy="2.7" r="1.2" fill="#fff" />
      <rect x="11.25" y="3.3" width="1.5" height="2.5" rx=".7" fill="#fff" />
      {/* ears */}
      <rect x="2.6" y="9.6" width="1.6" height="4.2" rx=".8" fill={lite} />
      <rect x="19.8" y="9.6" width="1.6" height="4.2" rx=".8" fill={lite} />
      {/* head */}
      <rect x="4.5" y="5.8" width="15" height="12.4" rx="4.2" fill="#fff" />
      {/* visor */}
      <rect x="6.8" y="9.4" width="10.4" height="4.8" rx="2.4" fill={accent} />
      {/* eyes */}
      <circle cx="9.7" cy="11.8" r="1.05" fill="#fff" />
      <circle cx="14.3" cy="11.8" r="1.05" fill="#fff" />
    </svg>
  );
}
