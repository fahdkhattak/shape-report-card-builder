import { ROUNDS, DIMENSIONS, DRIVER_DIMENSION, dataset } from "./dataset.js";
import { SUPPRESS_BELOW, LAST } from "./scopeData.js";
import { FLOURISHING_AT, STRIVING_AT } from "./bands.js";

/* ================================================================== */
/* HEAT MAP DATA — the Heat Map Scope (Figma 15299:41715, filters       */
/* 15298:19603). Rows are groups of people (one way of grouping at a    */
/* time, or the Standouts across every way); columns are the overall    */
/* score and the 12 Explorers, and an Explorer opens into its Drivers.  */
/* Every number is the real mean of the group's people in the latest    */
/* round. A group under 5 people is never shown (SUPPRESS_BELOW).       */
/* ================================================================== */
const r0 = Math.round;
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / (xs.length || 1);

/* The ways of grouping, as the design's menu lists them. Age and Country aren't in the dataset, so they stay in the menu,
   disabled, with the reason. "Work Model" is ours (the dataset has it; the design doesn't list it). */
export const HEAT_GROUPINGS = [
  { id: "standouts", label: "Standouts" },
  { id: "organisation", label: "Organisation" },
  { id: "location", label: "Site Codes" },
  { id: "department", label: "Departments" },
  { id: "age", label: "Age", blocked: "No age data in this survey yet" },
  { id: "gender", label: "Gender" },
  { id: "country", label: "Country", blocked: "No country data in this survey yet" },
  { id: "employmentStatus", label: "Employment Status" },
  { id: "tenure", label: "Employment Duration" },
  { id: "jobLevel", label: "Job Level" },
  { id: "workModel", label: "Work Model" },
];
export const groupingLabel = (id) => HEAT_GROUPINGS.find((g) => g.id === id)?.label || id;
const AXES = HEAT_GROUPINGS.filter((g) => !g.blocked && g.id !== "standouts" && g.id !== "organisation").map((g) => g.id);

export const DRIVERS_OF = Object.fromEntries(DIMENSIONS.map((d) => [d, Object.keys(DRIVER_DIMENSION).filter((k) => DRIVER_DIMENSION[k] === d)]));

/* One group's row: people, overall score and its change, every Explorer and Driver. Null under 5 people. */
function cellsFor(keep) {
  const users = dataset.users.filter(keep);
  const at = (i) => users.map((u) => u.rounds.find((x) => x.round === ROUNDS[i].round)).filter(Boolean);
  const now = at(LAST), prev = LAST > 0 ? at(LAST - 1) : [];
  if (now.length < SUPPRESS_BELOW) return { n: now.length, hidden: true };
  const overall = r0(mean(now.map((r) => r.overallScore)));
  const before = prev.length >= SUPPRESS_BELOW ? r0(mean(prev.map((r) => r.overallScore))) : null;
  const dims = Object.fromEntries(DIMENSIONS.map((d) => [d, r0(mean(now.map((r) => r.dimensionScores[d])))]));
  const drivers = Object.fromEntries(Object.keys(DRIVER_DIMENSION).map((k) => [k, r0(mean(now.map((r) => r.driverScores[k])))]));
  return { n: now.length, hidden: false, overall, delta: before == null ? null : overall - before, dims, drivers };
}

const groupsOn = (axis) => [...new Set(dataset.users.map((u) => u[axis]))];

/* Rows for one way of grouping. Each: { id, label, axis, group, n, overall, delta, dims, drivers } (largest group first).
   `hiddenCount`: groups left out because they have fewer than 5 people. */
export function heatRows(grouping) {
  if (grouping === "organisation") return { rows: [{ id: "org", label: "Organisation", axis: null, group: null, ...cellsFor(() => true) }], hiddenCount: 0 };
  if (grouping === "standouts") return standouts();
  const all = groupsOn(grouping).map((g) => ({ id: `${grouping}:${g}`, label: g, axis: grouping, group: g, ...cellsFor((u) => u[grouping] === g) }));
  return { rows: all.filter((r) => !r.hidden).sort((a, b) => b.n - a.n), hiddenCount: all.filter((r) => r.hidden).length };
}

/* Standouts: the groups (5+ people, any way of grouping) furthest from the organisation's overall score, above or below,
   the eight furthest, highest score first. Each carries the way of grouping it comes from. */
function standouts(limit = 8) {
  const org = cellsFor(() => true).overall;
  const all = AXES.flatMap((axis) => groupsOn(axis).map((g) => ({ id: `${axis}:${g}`, label: g, axis, group: g, ...cellsFor((u) => u[axis] === g) }))).filter((r) => !r.hidden);
  const picked = [...all].sort((a, b) => Math.abs(b.overall - org) - Math.abs(a.overall - org)).slice(0, limit);
  return { rows: picked.sort((a, b) => b.overall - a.overall), hiddenCount: 0, org };
}

/* A row opened up: the same people split by a second way of grouping. Site first (as the design shows), but with this
   few people most Site splits fall under 5, so it takes whichever way of grouping leaves the most groups that can be
   shown. Splits under 5 people are left out and counted. */
const SPLIT_ORDER = ["location", "workModel", "gender", "employmentStatus", "tenure", "jobLevel", "department"];
export function subRows(row) {
  if (!row.axis) return { rows: [], hiddenCount: 0, by: null };
  let best = null;
  for (const by of SPLIT_ORDER.filter((a) => a !== row.axis)) {
    const all = groupsOn(by).map((g) => ({ id: `${row.id}|${by}:${g}`, label: g, axis: by, group: g, parent: row, ...cellsFor((u) => u[row.axis] === row.group && u[by] === g) })).filter((r) => r.n > 0);
    const shown = all.filter((r) => !r.hidden).sort((a, b) => b.n - a.n);
    if (!best || shown.length > best.rows.length) best = { rows: shown, hiddenCount: all.length - shown.length, by };
  }
  return best;
}

/* The design system's heat scale (utility/Heat Map, ten steps). Tiles under 40 and from 95 carry light text. */
export const HEAT_STEPS = [[20, "020"], [30, "2030"], [40, "3040"], [50, "4050"], [60, "5060"], [70, "6070"], [80, "7080"], [90, "8090"], [95, "9095"], [101, "95100"]];
export const HEAT_LABELS = ["0 - 20", "20 - 30", "30 - 40", "40 - 50", "50 - 60", "60 - 70", "70 - 80", "80 - 90", "90 - 95", "95 - 100"];
export const heatStep = (v) => HEAT_STEPS.findIndex(([top]) => v < top);

/* A group over every round (null in a round with fewer than 5 of its people): overall, each Explorer, each Driver. Used by
   the group's own Scope (scopeRecipes.jsx GroupScope). `keep` picks the people. */
export function groupHistory(keep) {
  const users = dataset.users.filter(keep);
  return ROUNDS.map((rd) => {
    const rs = users.map((u) => u.rounds.find((x) => x.round === rd.round)).filter(Boolean);
    if (rs.length < SUPPRESS_BELOW) return null;
    return {
      n: rs.length,
      overall: r0(mean(rs.map((r) => r.overallScore))),
      dims: Object.fromEntries(DIMENSIONS.map((d) => [d, r0(mean(rs.map((r) => r.dimensionScores[d])))])),
      drivers: Object.fromEntries(Object.keys(DRIVER_DIMENSION).map((k) => [k, r0(mean(rs.map((r) => r.driverScores[k])))])),
      status: rs.reduce((c, r) => { c[r.overallScore >= FLOURISHING_AT ? "f" : r.overallScore >= STRIVING_AT ? "s" : "t"]++; return c; }, { f: 0, s: 0, t: 0 }),
    };
  });
}
/* The people a heat-map row stands for (a row, or a row split by a second way of grouping). */
export const keepFor = (row) => (row.parent ? (u) => u[row.parent.axis] === row.parent.group && u[row.axis] === row.group : row.axis ? (u) => u[row.axis] === row.group : () => true);
