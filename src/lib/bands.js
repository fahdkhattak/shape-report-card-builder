/* ================================================================== */
/* THE STATUS SCALE — one place.                                        */
/*   Struggling  0 to 59                                                */
/*   Striving   60 to 79                                                */
/*   Flourishing 80 to 100                                              */
/* (Corrected by the product owner: it was 40 / 70.) Everything that     */
/* bands a score, draws a threshold line, or counts people or parts by   */
/* status reads these, so the scale can't drift between widgets.         */
/* ================================================================== */
export const FLOURISHING_AT = 80;
export const STRIVING_AT = 60;

export const statusName = (v) => (v >= FLOURISHING_AT ? "Flourishing" : v >= STRIVING_AT ? "Striving" : "Struggling");
export const bandKind = (v) => (v >= FLOURISHING_AT ? "success" : v >= STRIVING_AT ? "warning" : "error");
/* the three ranges as text, for copy */
export const RANGES = { Flourishing: `${FLOURISHING_AT} to 100`, Striving: `${STRIVING_AT} to ${FLOURISHING_AT - 1}`, Struggling: `0 to ${STRIVING_AT - 1}` };
/* the score of the next status up, or null when already Flourishing */
export const nextLine = (v) => (v >= FLOURISHING_AT ? null : v >= STRIVING_AT ? FLOURISHING_AT : STRIVING_AT);
/* counts of a list of scores by status */
export const countByStatus = (vals) => ({ f: vals.filter((v) => v >= FLOURISHING_AT).length, s: vals.filter((v) => v >= STRIVING_AT && v < FLOURISHING_AT).length, t: vals.filter((v) => v < STRIVING_AT).length });
