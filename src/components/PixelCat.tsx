import { useMemo } from "react";

// Deterministic hash from string
function hash(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(a: number) {
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CAT_COLORS: Record<string, { body: string; shade: string; belly: string }> = {
  orange: { body: "#f59145", shade: "#c66a25", belly: "#ffd9b0" },
  white: { body: "#f4f1ea", shade: "#bfbab0", belly: "#ffffff" },
  black: { body: "#2a2a2e", shade: "#000000", belly: "#5a5a60" },
  gray: { body: "#8a8f99", shade: "#5b6068", belly: "#c2c6cd" },
  brown: { body: "#8b5a2b", shade: "#5a3617", belly: "#c89773" },
  blue: { body: "#5a8fd6", shade: "#2f5fa3", belly: "#bcd6f5" },
  purple: { body: "#a173d6", shade: "#6f43a3", belly: "#dcc4f0" },
  green: { body: "#6fbf73", shade: "#3f8a48", belly: "#c5e8c8" },
};
const COLOR_KEYS = Object.keys(CAT_COLORS);
const BG_COLORS = ["#0d9488", "#7c3aed", "#1e3a8a", "#f97316", "#f59e0b"];
const ACCESSORIES = ["none", "hat", "glasses", "earring", "bandana"] as const;
const EXPRESSIONS = ["happy", "serious", "sleepy", "angry", "cool"] as const;

type Accessory = (typeof ACCESSORIES)[number];
type Expression = (typeof EXPRESSIONS)[number];

// 16x16 grid, each cell rendered as a rect. Coords are [x, y].
// Cat silhouette occupies roughly y=4..14
const BODY_PIXELS: Array<[number, number]> = [];
const SHADE_PIXELS: Array<[number, number]> = [];
const BELLY_PIXELS: Array<[number, number]> = [];
const EAR_INNER: Array<[number, number]> = [];

// Build cat shape procedurally
(function buildCat() {
  // Ears (triangles)
  const earsLeft = [
    [3, 3], [4, 3], [3, 4], [4, 4], [5, 4],
  ];
  const earsRight = [
    [11, 3], [12, 3], [11, 4], [12, 4], [10, 4],
  ];
  earsLeft.forEach((p) => BODY_PIXELS.push(p as [number, number]));
  earsRight.forEach((p) => BODY_PIXELS.push(p as [number, number]));
  EAR_INNER.push([4, 4], [11, 4]);

  // Head (rounded square 5..10 x 5..10)
  for (let x = 3; x <= 12; x++) {
    for (let y = 5; y <= 11; y++) {
      // round corners
      if ((x === 3 || x === 12) && (y === 5 || y === 11)) continue;
      BODY_PIXELS.push([x, y]);
    }
  }
  // Belly/cheeks (lighter)
  for (let x = 5; x <= 10; x++) {
    for (let y = 9; y <= 11; y++) {
      BELLY_PIXELS.push([x, y]);
    }
  }
  // Shade row at bottom
  for (let x = 4; x <= 11; x++) SHADE_PIXELS.push([x, 11]);
})();

function pickFrom<T>(arr: readonly T[], rnd: () => number): T {
  return arr[Math.floor(rnd() * arr.length)];
}

export function PixelCat({
  seed,
  size = 40,
  className,
}: {
  seed: string;
  size?: number;
  className?: string;
}) {
  const traits = useMemo(() => {
    const s = (seed || "").toLowerCase();
    const rnd = mulberry32(hash(s));
    const colorKey = pickFrom(COLOR_KEYS, rnd);
    const bg = pickFrom(BG_COLORS, rnd);
    const accessory = pickFrom(ACCESSORIES, rnd) as Accessory;
    const expression = pickFrom(EXPRESSIONS, rnd) as Expression;
    return { colorKey, bg, accessory, expression };
  }, [seed]);

  const c = CAT_COLORS[traits.colorKey];
  const px = 1; // grid unit; viewBox is 16x16

  // Eyes by expression (left eye, right eye)
  const eyes: React.ReactNode[] = [];
  const eyeColor = "#111";
  switch (traits.expression) {
    case "happy":
      eyes.push(
        <path key="el" d="M5.5 8 q0.5 -0.6 1 0" stroke={eyeColor} strokeWidth="0.5" fill="none" />,
        <path key="er" d="M9.5 8 q0.5 -0.6 1 0" stroke={eyeColor} strokeWidth="0.5" fill="none" />,
      );
      break;
    case "serious":
      eyes.push(
        <rect key="el" x={5} y={8} width={1} height={1} fill={eyeColor} />,
        <rect key="er" x={10} y={8} width={1} height={1} fill={eyeColor} />,
      );
      break;
    case "sleepy":
      eyes.push(
        <rect key="el" x={5} y={8.5} width={1.5} height={0.4} fill={eyeColor} />,
        <rect key="er" x={9.5} y={8.5} width={1.5} height={0.4} fill={eyeColor} />,
      );
      break;
    case "angry":
      eyes.push(
        <path key="el" d="M5 7.5 L6.5 8.2 L5 8.5 Z" fill={eyeColor} />,
        <path key="er" d="M11 7.5 L9.5 8.2 L11 8.5 Z" fill={eyeColor} />,
      );
      break;
    case "cool":
      // sunglasses bar
      eyes.push(
        <rect key="bar" x={4.5} y={7.8} width={7} height={1.4} fill="#111" />,
        <rect key="shine1" x={5} y={8.1} width={1} height={0.4} fill="#fff" opacity={0.6} />,
        <rect key="shine2" x={9.5} y={8.1} width={1} height={0.4} fill="#fff" opacity={0.6} />,
      );
      break;
  }

  // Mouth (small)
  const mouth =
    traits.expression === "angry" ? (
      <path d="M7 10.4 L9 10.4" stroke="#111" strokeWidth="0.3" />
    ) : traits.expression === "sleepy" ? (
      <rect x={7.5} y={10.2} width={1} height={0.3} fill="#111" />
    ) : (
      <path d="M7 10.2 q1 0.6 2 0" stroke="#111" strokeWidth="0.3" fill="none" />
    );

  // Accessories
  const accessory: React.ReactNode[] = [];
  if (traits.accessory === "hat") {
    accessory.push(
      <rect key="hb" x={4} y={3} width={8} height={1} fill="#111" />,
      <rect key="ht" x={5.5} y={1} width={5} height={2} fill="#111" />,
      <rect key="hd" x={5.5} y={2.5} width={5} height={0.4} fill="#dc2626" />,
    );
  } else if (traits.accessory === "glasses" && traits.expression !== "cool") {
    accessory.push(
      <circle key="gl" cx={5.7} cy={8.3} r={1} stroke="#111" strokeWidth="0.3" fill="none" />,
      <circle key="gr" cx={10.3} cy={8.3} r={1} stroke="#111" strokeWidth="0.3" fill="none" />,
      <line key="gb" x1={6.7} y1={8.3} x2={9.3} y2={8.3} stroke="#111" strokeWidth="0.3" />,
    );
  } else if (traits.accessory === "earring") {
    accessory.push(
      <circle key="e" cx={3.2} cy={5.2} r={0.5} fill="#fbbf24" stroke="#92400e" strokeWidth="0.15" />,
    );
  } else if (traits.accessory === "bandana") {
    accessory.push(
      <rect key="b1" x={3} y={6.5} width={10} height={1.2} fill="#dc2626" />,
      <rect key="d1" x={5} y={6.7} width={0.4} height={0.4} fill="#fff" />,
      <rect key="d2" x={8} y={7} width={0.4} height={0.4} fill="#fff" />,
      <rect key="d3" x={11} y={6.7} width={0.4} height={0.4} fill="#fff" />,
    );
  }

  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      className={className}
      shapeRendering="crispEdges"
      style={{ imageRendering: "pixelated" }}
      role="img"
      aria-label="pixel cat avatar"
    >
      {/* Background circle */}
      <circle cx={8} cy={8} r={8} fill={traits.bg} />

      {/* Body pixels */}
      {BODY_PIXELS.map(([x, y], i) => (
        <rect key={`b${i}`} x={x} y={y} width={px} height={px} fill={c.body} />
      ))}
      {BELLY_PIXELS.map(([x, y], i) => (
        <rect key={`be${i}`} x={x} y={y} width={px} height={px} fill={c.belly} />
      ))}
      {SHADE_PIXELS.map(([x, y], i) => (
        <rect key={`s${i}`} x={x} y={y} width={px} height={px} fill={c.shade} opacity={0.5} />
      ))}
      {EAR_INNER.map(([x, y], i) => (
        <rect key={`ei${i}`} x={x} y={y} width={px} height={px} fill="#ff9fb1" opacity={0.7} />
      ))}

      {/* Whiskers */}
      <line x1={2.5} y1={9.5} x2={4.5} y2={9.5} stroke="#111" strokeWidth="0.15" opacity={0.6} />
      <line x1={11.5} y1={9.5} x2={13.5} y2={9.5} stroke="#111" strokeWidth="0.15" opacity={0.6} />

      {/* Nose */}
      <rect x={7.5} y={9.5} width={1} height={0.6} fill="#ff7a90" />

      {eyes}
      {mouth}
      {accessory}
    </svg>
  );
}