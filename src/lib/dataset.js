import sample from "../data/shape-survey-dataset.json";
import { activeSource } from "./dataSource.js";
import { shapeAsLegacy } from "./survey/legacyAdapter.js";
// Which dataset every widget, Story and Scope reads (lib/dataSource.js): the prototype sample, or the SHAPE survey shaped
// to the same structure. Read once at load.
const raw = activeSource() === "shape" ? shapeAsLegacy() : sample;
import { STRIVING_AT, statusName } from "./bands.js";

/* ================================================================== */
/* DATASET ACCESS — thin read layer over the generated survey dataset  */
/* (see data/generate-dataset.js for how it was built). Widgets and    */
/* the generative engine read through here rather than importing the   */
/* raw JSON directly, so the aggregation logic (rounding, trend deltas,*/
/* group-by-gender/work-model) lives in one place.                     */
/* ================================================================== */
/* The JSON was generated against the old 40 / 70 bands. Re-band every person's overall score on the current
   status scale (lib/bands.js) and recount each round, so the stored `status` and the org counts can't disagree
   with the scale the app draws. Scores themselves are untouched. */
raw.users.forEach((u) => u.rounds.forEach((r) => { r.status = statusName(r.overallScore); }));
raw.orgSummaries.forEach((o) => {
  const rs = raw.users.map((u) => u.rounds.find((r) => r.round === o.round)).filter(Boolean);
  o.flourishing = rs.filter((r) => r.status === "Flourishing").length;
  o.striving = rs.filter((r) => r.status === "Striving").length;
  o.struggling = rs.filter((r) => r.status === "Struggling").length;
});
export const dataset = raw;
export const ROUNDS = raw.orgSummaries; // one entry per survey round, oldest first
export const LATEST = ROUNDS[ROUNDS.length - 1];
export const PREVIOUS = ROUNDS[ROUNDS.length - 2];
export const DIMENSIONS = raw.meta.dimensions;
export const ROUND_LABELS = ROUNDS.map((r) => `R${r.round}`);
export const DRIVER_DIMENSION = raw.meta.driverDimensionMap;
export const DRIVERS = Object.keys(DRIVER_DIMENSION);
/* Reverse of DRIVER_DIMENSION — which drivers roll up into a given dimension,
   preserving DRIVER_DIMENSION's own key order. Feeds the Index widget's
   driver ring (one wedge per driver, subdividing its parent dimension's
   wedge) and the "Factors" driver-ranked list. */
export const DIMENSION_DRIVERS = DIMENSIONS.reduce((acc, dim) => {
  acc[dim] = DRIVERS.filter((d) => DRIVER_DIMENSION[d] === dim);
  return acc;
}, {});

const r0 = (v) => Math.round(v);

/* Org Score's "Employees" / "Participation Rate" stat row. Headcount is every
   user in the dataset; participation is the share of them with a response in
   the latest round (the generator gives every user every round, so this reads
   100% — real, not the 85% sample in the Figma mockup). */
export const EMPLOYEE_COUNT = raw.users.length;
export function participationRate() {
  const answered = raw.users.filter((u) => u.rounds.some((r) => r.round === LATEST.round)).length;
  return Math.round((answered / raw.users.length) * 100);
}
export const delta = (curr, prev) => r0(curr - prev);

export function dimensionValue(dim, round = LATEST) { return round.dimensionAvg[dim]; }
export function driverValue(driver, round = LATEST) { return round.driverAvg[driver]; }
export function dimensionTrend(dim) { return ROUNDS.map((r) => r0(r.dimensionAvg[dim])); }
export function driverTrend(driver) { return ROUNDS.map((r) => r0(r.driverAvg[driver])); }

/* Explorers-style ranked list: every dimension, latest value + round-over-round
   delta, sorted high to low — [name, val, trendDelta][] */
export function dimensionRankedRows() {
  return DIMENSIONS
    .map((dim) => [dim, r0(dimensionValue(dim)), delta(dimensionValue(dim), dimensionValue(dim, PREVIOUS))])
    .sort((a, b) => b[1] - a[1]);
}

/* Worst-scoring dimension right now — feeds the "Areas to Focus" widget. */
export function worstDimension() {
  return DIMENSIONS.map((dim) => [dim, dimensionValue(dim)]).sort((a, b) => a[1] - b[1])[0];
}

/* Driver-ranked equivalent of dimensionRankedRows() — every one of the ~45
   drivers, latest value + round-over-round delta, sorted high to low.
   Feeds the "Factors" widget (same DriverGroupedList visual pattern as
   Explorers, but driver-level instead of dimension-level). */
export function driverRankedRows() {
  return DRIVERS
    .map((d) => [d, r0(driverValue(d)), delta(driverValue(d), driverValue(d, PREVIOUS))])
    .sort((a, b) => b[1] - a[1]);
}

/* roundsFromEnd: 0 = latest round, 1 = previous round — lets callers compute
   a group's round-over-round delta, not just its current value. */
function groupAverage(keyFn, order, roundsFromEnd = 0, minN = 0) {
  const groups = {};
  dataset.users.forEach((u) => {
    const key = keyFn(u);
    const r = u.rounds[u.rounds.length - 1 - roundsFromEnd];
    if (!r) return;
    (groups[key] ||= []).push(r.overallScore);
  });
  const keys = order || Object.keys(groups);
  return keys.filter((k) => groups[k]?.length >= Math.max(1, minN)).map((key) => [key, r0(groups[key].reduce((a, b) => a + b, 0) / groups[key].length)]);
}
export function avgScoreByGender() { return groupAverage((u) => u.gender, ["Male", "Female", "Other", "Prefer not to respond"]); }
export function avgScoreByWorkModel() { return groupAverage((u) => u.workModel, ["Onsite", "Hybrid", "Remote"]); }

/* Real demographic axes present in the generated dataset (see
   data/generate-dataset.js) — no ethnicity/age field exists, unlike Figma's
   sampled "Areas to Focus" instance, so this scans the axes we actually
   have rather than reproducing that exact one. */
/* A group smaller than this is never singled out (the Scope's Composition
   story applies the same rule) — with 1–4 people a "group average" is
   really one person's answers. */
const MIN_GROUP_SIZE = 5;
const DEMOGRAPHIC_AXES = [
  ["Gender", (u) => u.gender],
  ["Department", (u) => u.department],
  ["Job Level", (u) => u.jobLevel],
  ["Location", (u) => u.location],
  ["Tenure", (u) => u.tenure],
  ["Employment Status", (u) => u.employmentStatus],
  ["Work Model", (u) => u.workModel],
];

/* The single lowest-scoring demographic subgroup across every axis above,
   with its round-over-round delta — [axisLabel, groupName, value, trendDelta].
   Feeds "Areas to Focus", which (per explicit product correction) should
   surface the worst-scoring demographic group, not the worst-scoring
   dimension — worstDimension() above is kept for other callers (e.g. the
   generative engine's ranking fallback) but is no longer what Areas to
   Focus uses. */
export function worstDemographicGroup() {
  let best = null;
  DEMOGRAPHIC_AXES.forEach(([axisLabel, keyFn]) => {
    const latestRows = groupAverage(keyFn, null, 0, MIN_GROUP_SIZE);
    const prevRows = groupAverage(keyFn, null, 1, MIN_GROUP_SIZE);
    latestRows.forEach(([group, value]) => {
      if (!best || value < best[2]) {
        const prevRow = prevRows.find(([g]) => g === group);
        best = [axisLabel, group, value, prevRow ? delta(value, prevRow[1]) : 0];
      }
    });
  });
  return best;
}

/* ---- Extra read helpers for the Library widgets ------------------------- */

/* Every group of 5+ people on every real demographic axis, lowest first:
   { axis, group, value, delta, n, struggling } — `struggling` counts the
   people in that group whose own score sits below 40. Feeds Areas to Focus'
   list / by-category / by-group forms. */
export function focusGroups() {
  const rows = [];
  DEMOGRAPHIC_AXES.forEach(([axis, keyFn]) => {
    const buckets = {};
    dataset.users.forEach((u) => {
      const last = u.rounds[u.rounds.length - 1];
      const prev = u.rounds[u.rounds.length - 2];
      (buckets[keyFn(u)] ||= []).push([last.overallScore, prev ? prev.overallScore : last.overallScore]);
    });
    Object.entries(buckets).forEach(([group, list]) => {
      if (list.length < MIN_GROUP_SIZE) return;
      const avg = (i) => list.reduce((a, r) => a + r[i], 0) / list.length;
      rows.push({ axis, group, value: r0(avg(0)), delta: delta(avg(0), avg(1)), n: list.length, struggling: list.filter((r) => r[0] < STRIVING_AT).length });
    });
  });
  return rows.sort((a, b) => a.value - b.value);
}

/* Promoters / passives / detractors for a round, from each person's 0–10
   "would you recommend" answer (9–10 / 7–8 / 0–6). `roundsFromEnd` 0 = latest. */
export function enpsGroups(roundsFromEnd = 0) {
  const out = { promoters: 0, passives: 0, detractors: 0, total: 0 };
  dataset.users.forEach((u) => {
    const r = u.rounds[u.rounds.length - 1 - roundsFromEnd];
    if (!r) return;
    out.total += 1;
    if (r.recommendScore >= 9) out.promoters += 1;
    else if (r.recommendScore >= 7) out.passives += 1;
    else out.detractors += 1;
  });
  return out;
}

/* Share of people (%) who are low on the Depression / Anxiety / Stress
   drivers (below 40; higher = better on all three) — "feeling low / anxious /
   stressed". Returns the latest value and the change since the round before. */
const FEELINGS = [["Feeling Low", "Depression"], ["Feeling Anxious", "Anxiety"], ["Feeling Stressed", "Stress"]];
export function feelingShare() {
  const share = (driver, roundsFromEnd) => {
    const rs = dataset.users.map((u) => u.rounds[u.rounds.length - 1 - roundsFromEnd]).filter(Boolean);
    return (rs.filter((r) => r.driverScores[driver] < STRIVING_AT).length / rs.length) * 100;
  };
  return FEELINGS.map(([label, driver]) => [label, r0(share(driver, 0)), delta(share(driver, 0), share(driver, 1))]);
}

/* Departments (5+ people) × the first Explorers, average score in the latest
   round — the Org Heat Map. Returns { columns, rows: [[dept, [v, v, v], overall]] },
   largest departments first. */
export function heatMap(columnCount = 3, rowCount = 4) {
  const columns = DIMENSIONS.slice(0, columnCount);
  const byDept = {};
  dataset.users.forEach((u) => (byDept[u.department] ||= []).push(u.rounds[u.rounds.length - 1]));
  const rows = Object.entries(byDept)
    .filter(([, list]) => list.length >= MIN_GROUP_SIZE)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, rowCount)
    .map(([dept, list]) => [dept, columns.map((c) => r0(list.reduce((a, r) => a + r.dimensionScores[c], 0) / list.length)), r0(list.reduce((a, r) => a + r.overallScore, 0) / list.length)]);
  return { columns, rows };
}

/* ---- Topic -> real metric resolution, for the chat generative engine ---- */
/* A "topic" fed to metricForTopic()/correlationForTopics() is one of:      */
/*   - a real dimension name (one of the 12 DIMENSIONS)                    */
/*   - a real driver name (one of the ~45 DRIVERS)                         */
/*   - a curated CONCEPTS label (see below) whose natural polarity runs    */
/*     opposite an underlying driver's — e.g. "Burnout Risk" reads         */
/*     high-is-bad but is derived from "Resilience," where high is good    */
/*   - a BESPOKE cluster object { label, drivers: string[] } — an ad-hoc   */
/*     group of real drivers assembled at chat-scoping time for a query    */
/*     that doesn't match any single dimension (lib/topicResolver.js's     */
/*     findScope()); its value/trend are the real average across those     */
/*     drivers, same operation the generator used to build the 12 real     */
/*     dimensions in the first place — not fabricated data, just a fresh   */
/*     real aggregate.                                                     */
/* Since topics now resolve directly against real names, no lookup table   */
/* is needed for the common case — only the small CONCEPTS overlay below.  */
export const CONCEPTS = {
  "Burnout Risk": { key: "Resilience", invert: true },
};

function isDimension(key) { return DIMENSIONS.includes(key); }
function isDriver(key) { return DRIVERS.includes(key); }

/* Normalizes any of the four topic shapes above into a common descriptor,
   or null if the topic doesn't resolve to anything real. */
function normalizeTopic(topic) {
  if (topic && typeof topic === "object" && Array.isArray(topic.drivers)) {
    return { bespoke: true, drivers: topic.drivers, invert: false };
  }
  if (CONCEPTS[topic]) return { bespoke: false, key: CONCEPTS[topic].key, invert: !!CONCEPTS[topic].invert, isDim: false };
  if (isDimension(topic)) return { bespoke: false, key: topic, invert: false, isDim: true };
  if (isDriver(topic)) return { bespoke: false, key: topic, invert: false, isDim: false };
  return null;
}

/* Returns {value, trend[3]} for a topic if it resolves to something real,
   else null — callers should fall back to synthetic generation on null.
   Already polarity-corrected, so 100 always means "great" regardless of
   which underlying driver a concept/bespoke topic borrows from. */
export function metricForTopic(topic) {
  const n = normalizeTopic(topic);
  if (!n) return null;
  let trend;
  if (n.bespoke) {
    const perDriverTrends = n.drivers.map((d) => driverTrend(d));
    trend = ROUNDS.map((_, i) => r0(perDriverTrends.reduce((s, t) => s + t[i], 0) / perDriverTrends.length));
  } else {
    trend = n.isDim ? dimensionTrend(n.key) : driverTrend(n.key);
  }
  if (n.invert) trend = trend.map((v) => 100 - v);
  return { value: trend[trend.length - 1], trend };
}

/* Each person's latest-round value for two topics — [[x, y], …], one pair per
   person — or null when either topic doesn't resolve to something real.
   Feeds the scatter widget's dots (the real ones, not a drawn-looking cloud)
   and the Pearson correlation below. Bespoke topics use each person's own
   average across their driver cluster. */
export function pairedScores(topicA, topicB) {
  const a = normalizeTopic(topicA), b = normalizeTopic(topicB);
  if (!a || !b) return null;
  const valueFor = (u, n) => {
    const r = u.rounds[u.rounds.length - 1];
    let raw;
    if (n.bespoke) raw = n.drivers.reduce((s, d) => s + r.driverScores[d], 0) / n.drivers.length;
    else raw = n.isDim ? r.dimensionScores[n.key] : r.driverScores[n.key];
    return n.invert ? 100 - raw : raw;
  };
  return dataset.users.map((u) => [Math.round(valueFor(u, a)), Math.round(valueFor(u, b))]);
}

/* Real Pearson correlation between two topics' per-user latest-round values
   — only meaningful (and only returned) when both topics resolve to
   something real; replaces a purely-random correlation. */
export function correlationForTopics(topicA, topicB) {
  const pairs = pairedScores(topicA, topicB);
  if (!pairs) return null;
  const xs = pairs.map((p) => p[0]), ys = pairs.map((p) => p[1]);
  const n = xs.length, mx = xs.reduce((s, v) => s + v, 0) / n, my = ys.reduce((s, v) => s + v, 0) / n;
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) { num += (xs[i] - mx) * (ys[i] - my); dx += (xs[i] - mx) ** 2; dy += (ys[i] - my) ** 2; }
  return dx && dy ? Number((num / Math.sqrt(dx * dy)).toFixed(2)) : 0;
}
