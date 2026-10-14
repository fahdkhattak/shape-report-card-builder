/* ================================================================== */
/* GRID LAYOUT — fixed pixel grid, not fractional.                     */
/* 6-column grid, 16px gaps. 1x1 = 164x164px, 2x2 = 344x344px          */
/* (164*2 + 16 gap). Must match the real Figma canvas math exactly —   */
/* never let this drift to `fr` units or responsive scaling.           */
/* ================================================================== */
export const CELL = 164;
export const GAP = 16;

const SPANS = { "1x1": 1, "2x2": 2, "3x3": 3 };

export function sizeToSpan(size) {
  const n = SPANS[size] || 1;
  return { col: n, row: n };
}

export function pxForSpan(span) {
  return span > 1 ? CELL * span + GAP * (span - 1) : CELL;
}

/* Responsive column count for the canvas grid: 6, 5, 4, 3 or 2 across — as
   many 164px columns as fit, never fewer than 2 (product direction: 3 and 5
   are allowed too, not only even counts). Cell size never changes (per the
   fixed-pixel rule above); only the number of columns does. Grids that use
   this pack with `grid-auto-flow: row dense`, so on an odd count a 2x2 never
   leaves a hole: the next 1x1 that fits drops into the gap. */
export function colsForWidth(width) {
  for (const n of [6, 5, 4, 3]) if (width >= pxForSpan(n)) return n;
  return 2;
}
