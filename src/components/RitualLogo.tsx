export function RitualLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-label="Ritual">
      <defs>
        <linearGradient id="rg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="oklch(0.62 0.16 150)" />
          <stop offset="100%" stopColor="oklch(0.42 0.1 152)" />
        </linearGradient>
      </defs>
      <polygon
        points="32,4 58,18 58,46 32,60 6,46 6,18"
        fill="url(#rg)"
        stroke="oklch(0.7 0.18 150)"
        strokeWidth="1.5"
      />
      <polygon
        points="32,16 47,24 47,40 32,48 17,40 17,24"
        fill="oklch(0.16 0.018 160)"
      />
      <polygon
        points="32,22 41,27 41,37 32,42 23,37 23,27"
        fill="url(#rg)"
      />
    </svg>
  );
}