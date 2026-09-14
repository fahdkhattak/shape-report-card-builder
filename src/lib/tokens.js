/* ================================================================== */
/* FORMA TOKENS — sourced from docs/shape-design-system.md             */
/* ================================================================== */
export const T = {
  gray900: "#1d1a1b",
  gray800: "#231f20",
  gray700: "#504c4d",
  gray600: "#666263",
  gray500: "#7c7879",
  gray400: "#908d8e",
  gray300: "#a5a2a2",
  gray200: "#b4b2b1",
  gray100: "#cecdcc",
  gray75: "#e5e4e3",
  gray50: "#f2f2f2",
  gray25: "#f9f8f7",
  white: "#ffffff",
  accent: "#00a9eb",
  accentBg: "#ebfbff",
  accentBg2: "#dcf5ff",
  green: "#0e8c4f",
  greenStrong: "#0b703f",
  greenBg: "#e1f5ea",
  amber: "#f1a118",
  amberStrong: "#d98d0b",
  amberBg: "#fff6e4",
  red: "#cc2944",
  redStrong: "#a32136",
  redBg: "#fce3e7",
  personalBlue: "#00a9eb",
  teamBlue: "#0096ec",
  orgBlue: "#20409a",
  amberOrange: "#ff9900",
  lavender: "#a86cff",
  hotPink: "#ffabcf",
  goldenYellow: "#ffd700",
  mintGreen: "#00d998",
  turquoise: "#00ced1",
};

/* Component-specific radius tokens — see docs/shape-design-system.md §5. */
export const radius = {
  none: 0,
  xs: 4,
  sm: 6,
  tooltip: 6,
  md: 8,
  button: 8,
  input: 8,
  lg: 12,
  xl: 16,
  card: 16,
  widget: 18,
  xxl: 24,
  modal: 24,
  xxxl: 32,
  reportCard: 38,
  full: 9999,
  badge: 9999,
};

export const font = "'IBM Plex Sans', sans-serif";

export const rand = (min, max) => Math.round(min + Math.random() * (max - min));
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export function band(val) {
  if (val >= 70) return { c: T.green, cs: T.greenStrong, bg: T.greenBg };
  if (val >= 40) return { c: T.amber, cs: T.amberStrong, bg: T.amberBg };
  return { c: T.red, cs: T.redStrong, bg: T.redBg };
}
