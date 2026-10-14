/* ================================================================== */
/* BREAKDOWN RULES: how many parts each form can carry, and what it     */
/* does when there are fewer or more. One table, read by the components */
/* and by the Developer page, so the rules can't drift from what ships. */
/*   min        fewer parts than this and the form means nothing          */
/*   ideal      the range it was designed for                             */
/*   (names)    radar and area keep names on the chart for as long as they   */
/*              physically fit, measured on the card; then numbered marks    */
/*              and a key. This is decided on screen, not by a count.        */
/*   max        most parts the form can carry at all                      */
/*   fallback   the form drawn instead when outside min..max              */
/*   firstRows  rows shown before "Show all"                              */
/* Parts with no score are left out first and the Story says so, so these   */
/* numbers count parts that have a score.                                  */
/* ================================================================== */
export const RULES = {
  radar: { min: 3, ideal: [5, 8], max: 24, fallback: "bars", why: "A radar is a polygon, so it needs three spokes, and past about 24 the spokes crowd each other. From 20 spokes it always uses numbered marks and a key." },
  area: { min: 3, ideal: [4, 8], max: 20, fallback: "bars", why: "A curve needs at least three points to read as a curve. Past 20 the points crowd." },
  bars: { min: 1, ideal: [3, 10], firstRows: 10, why: "Bars work for any count. Past 12 rows only the first 10 show until someone asks for all." },
  list: { min: 1, ideal: [2, 6], max: 8, fallback: "bars", why: "Every row carries a sentence, so a long list becomes a wall of text." },
  zones: { min: 1, ideal: [6, 45], why: "A dot per part. Dots shrink as the count grows, and the lowest and highest are named." },
  distribution: { min: 1, ideal: [1, 99], why: "One bar. It works for any count." },
  wellbeing: { min: 1, ideal: [1, 6], firstRows: 6, why: "Each measure is a full row of five cells." },
  health: { min: 1, ideal: [4, 10], firstRows: 10, why: "Each driver is a row with a bar." },
};

const NAME = { radar: "A radar", area: "An area chart", list: "A list" };

/* What to draw for `n` parts that have a score. Returns { variant, from?, reason?, numbered?, empty? }. */
export function fitForm(variant, n) {
  if (n === 0) return { variant, empty: true };
  const r = RULES[variant];
  if (!r) return { variant };
  if (r.fallback && n < r.min) return { variant: r.fallback, from: variant, reason: `${NAME[variant]} needs at least ${r.min} parts and this has ${n}, so it's shown as bars.` };
  if (r.fallback && r.max && n > r.max) return { variant: r.fallback, from: variant, reason: `${NAME[variant]} carries at most ${r.max} parts and this has ${n}, so it's shown as bars.` };
  return { variant };
}

/* Zone dots shrink as the count grows so a crowd still fits (diameter 22, 16, or 12px). */
export const dotRadius = (n) => (n <= 16 ? 11 : n <= 32 ? 8 : 6);

export const clampScore = (v) => Math.max(0, Math.min(100, v));
