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

/* Responsive column count for the canvas grid — 6 across at full desktop
   width, 4 across once space gets tight, 2 across at mobile widths. Cell
   size itself never changes (per the fixed-pixel rule above); only the
   number of columns that fit in a row does, so bigger widgets (2x2/3x3)
   still lay out correctly at any column count via their existing
   `gridColumn: span N`. */
export function colsForWidth(width) {
  if (width >= pxForSpan(6)) return 6;
  if (width >= pxForSpan(4)) return 4;
  return 2;
}
