import { ROUNDS, DIMENSIONS, DRIVERS, EMPLOYEE_COUNT, dataset } from "./dataset.js";
import { FLOURISHING_AT, STRIVING_AT, statusName, nextLine } from "./bands.js";

/* ================================================================== */
/* SCOPE DATA — read helpers for the Scope Pane's Stories              */
/* (Figma board 13622:35945). Everything here is computed from the real */
/* generated dataset via lib/dataset.js — no invented numbers. Per-round */
/* arrays are indexed oldest → newest; LAST is the current round.        */
/* ================================================================== */
const r0 = Math.round;
export const LAST = ROUNDS.length - 1;

/* Composition's privacy rule ("Privacy and suppression rules always apply"):
   a group with fewer than this many people is never shown with a score. */
export const SUPPRESS_BELOW = 5;

export const statusOf = statusName;
export const fmtDate = (iso) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
export const fmtMonth = (iso) => new Date(iso).toLocaleDateString("en-US", { month: "short", year: "numeric" });
export const roundName = (i) => `Round ${ROUNDS[i].round}`;
export const sinceText = (d, name) => (d > 0 ? `Up ${d} since ${name}` : d < 0 ? `Down ${-d} since ${name}` : `No change since ${name}`);

export const dimAt = (dim, i) => r0(ROUNDS[i].dimensionAvg[dim]);
export const driverAt = (driver, i) => r0(ROUNDS[i].driverAvg[driver]);
export const overallSeries = () => ROUNDS.map((r) => r0(r.avgOverall));
export const dimensionSeries = (dim) => ROUNDS.map((r) => r0(r.dimensionAvg[dim]));
export const driverSeries = (driver) => ROUNDS.map((r) => r0(r.driverAvg[driver]));
export const enpsSeries = () => ROUNDS.map((r) => r.eNPS);
export const statusSeries = (key) => ROUNDS.map((r) => r[key]); // people per status (flourishing/striving/struggling)

/* Promoters 9–10, Passives 7–8, Detractors 0–6 — the standard eNPS bucketing
   over each person's 0–10 "would you recommend" answer. */
export function enpsParts(i = LAST) {
  const rn = ROUNDS[i].round;
  let promoters = 0, passives = 0, detractors = 0;
  dataset.users.forEach((u) => {
    const r = u.rounds.find((x) => x.round === rn);
    if (!r) return;
    if (r.recommendScore >= 9) promoters++;
    else if (r.recommendScore >= 7) passives++;
    else detractors++;
  });
  const total = promoters + passives + detractors;
  return { promoters, passives, detractors, total, enps: r0(((promoters - detractors) / total) * 100) };
}
export const enpsPartSeries = (key) => ROUNDS.map((_, i) => enpsParts(i)[key]);

/* Composition tabs → the real demographic axes we actually generated (no age
   or ethnicity field exists in the dataset, unlike the Figma sample). */
export const COMPOSITION_TABS = [
  { tab: "People", axes: [["gender", "Gender"]] },
  { tab: "Organisation", axes: [["department", "Department"], ["jobLevel", "Job Level"]] },
  { tab: "Employment", axes: [["employmentStatus", "Employment Status"], ["tenure", "Tenure"], ["workModel", "Work Model"]] },
  { tab: "Locations", axes: [["location", "Location"]] },
];
export const ALL_AXES = COMPOSITION_TABS.flatMap((t) => t.axes);

/* [{ group, n, pct, score, change, vsAvg, struggling, hidden }] sorted by size.
   `score`/`change`/`vsAvg` are null for a suppressed group. */
export function groupRows(key, i = LAST, scoreOf = (r) => r.overallScore) {
  const rn = ROUNDS[i].round;
  const prn = i > 0 ? ROUNDS[i - 1].round : null;
  const by = {};
  dataset.users.forEach((u) => {
    const r = u.rounds.find((x) => x.round === rn);
    if (!r) return;
    const g = (by[u[key]] ||= { n: 0, sum: 0, pn: 0, psum: 0, struggling: 0, flourishing: 0 });
    g.n++;
    const sc = scoreOf(r);
    g.sum += sc;
    if (sc < STRIVING_AT) g.struggling++;
    if (sc >= FLOURISHING_AT) g.flourishing++;
    const pr = prn && u.rounds.find((x) => x.round === prn);
    if (pr) { g.pn++; g.psum += scoreOf(pr); }
  });
  const total = Object.values(by).reduce((a, g) => a + g.n, 0);
  const orgAvg = Object.values(by).reduce((a, g) => a + g.sum, 0) / (total || 1);
  return Object.entries(by)
    .map(([group, g]) => {
      const hidden = g.n < SUPPRESS_BELOW;
      const score = hidden ? null : r0(g.sum / g.n);
      const prev = !hidden && g.pn >= SUPPRESS_BELOW ? r0(g.psum / g.pn) : null;
      return {
        group, n: g.n, pct: r0((g.n / total) * 100), score, hidden,
        change: score != null && prev != null ? score - prev : null,
        vsAvg: score != null ? r0(((g.sum / g.n - orgAvg) / orgAvg) * 100) : null,
        struggling: g.struggling, flourishing: g.flourishing,
      };
    })
    .sort((a, b) => b.n - a.n);
}

/* One line per (large-enough) group over every round. */
export function groupSeries(key, scoreOf) {
  return groupRows(key, LAST, scoreOf)
    .filter((g) => !g.hidden)
    .map((g) => ({ key: g.group, label: g.group, values: ROUNDS.map((_, i) => groupRows(key, i, scoreOf).find((x) => x.group === g.group)?.score ?? null) }));
}

/* "Areas to focus": the lowest-scoring visible group on every axis, worst first. */
export function focusGroups(limit = 4, scoreOf) {
  const out = [];
  ALL_AXES.forEach(([key, label]) => {
    const visible = groupRows(key, LAST, scoreOf).filter((g) => !g.hidden);
    if (!visible.length) return;
    const worst = visible.reduce((a, b) => (b.score < a.score ? b : a));
    out.push({ axis: label, axisKey: key, ...worst });
  });
  return out.sort((a, b) => a.score - b.score).slice(0, limit);
}

/* ---- per-person helpers for the newer Stories (distribution, links, gaps) ---- */
const usersAt = (i) => {
  const rn = ROUNDS[i].round;
  return dataset.users.map((u) => u.rounds.find((x) => x.round === rn)).filter(Boolean);
};
const meanOf = (xs) => xs.reduce((a, b) => a + b, 0) / (xs.length || 1);

export function pearson(xs, ys) {
  const mx = meanOf(xs), my = meanOf(ys);
  let num = 0, dx = 0, dy = 0;
  xs.forEach((x, i) => { num += (x - mx) * (ys[i] - my); dx += (x - mx) ** 2; dy += (ys[i] - my) ** 2; });
  return dx && dy ? num / Math.sqrt(dx * dy) : 0;
}

/* People in each status on a topic, per round (Flourishing / Striving / Struggling). */
export function statusCountSeries(scoreOf) {
  const out = { flourishing: [], striving: [], struggling: [] };
  ROUNDS.forEach((_, i) => {
    let f = 0, s = 0, g = 0;
    usersAt(i).forEach((r) => { const v = scoreOf(r); if (v >= FLOURISHING_AT) f++; else if (v >= STRIVING_AT) s++; else g++; });
    out.flourishing.push(f); out.striving.push(s); out.struggling.push(g);
  });
  return out;
}

/* Drivers whose scores rise and fall with this topic across people (latest round),
   strongest link first. Links, not causes. */
export function connections(scoreOf, exclude = []) {
  const rs = usersAt(LAST);
  const xs = rs.map(scoreOf);
  return DRIVERS.filter((d) => !exclude.includes(d))
    .map((d) => ({ label: d, r: pearson(xs, rs.map((u) => u.driverScores[d])), value: r0(ROUNDS[LAST].driverAvg[d]) }))
    .sort((a, b) => Math.abs(b.r) - Math.abs(a.r));
}

/* For each part: its score, and how closely it moves with people's OVERALL score. */
export function priorityPoints(children) {
  const rs = usersAt(LAST);
  const overall = rs.map((u) => u.overallScore);
  // A part is a Driver, or (for the whole organisation) an Explorer.
  return children.map((c) => ({ label: c.label, score: c.values[LAST], link: pearson(overall, rs.map((u) => u.driverScores[c.label] ?? u.dimensionScores[c.label])) }));
}

/* Per way of grouping people: the lowest and highest group (5+ people only) and the gap. */
export function groupGaps(scoreOf) {
  return ALL_AXES.map(([key, label]) => {
    const vis = groupRows(key, LAST, scoreOf).filter((g) => !g.hidden);
    if (vis.length < 2) return null;
    const lo = vis.reduce((a, b) => (b.score < a.score ? b : a));
    const hi = vis.reduce((a, b) => (b.score > a.score ? b : a));
    return { axis: label, axisKey: key, lo, hi, gap: hi.score - lo.score };
  }).filter(Boolean).sort((a, b) => b.gap - a.gap);
}

/* How people's scores are spread on a topic (latest round): ten bins of ten points,
   plus the median and the middle half. Bin edges line up with the 60 / 80 status lines. */
export function scoreSpread(scoreOf) {
  const vals = usersAt(LAST).map(scoreOf).sort((a, b) => a - b);
  const bins = Array.from({ length: 10 }, (_, i) => ({ from: i * 10, to: i === 9 ? 100 : i * 10 + 9, n: 0 }));
  vals.forEach((v) => { bins[Math.min(9, Math.max(0, Math.floor(v / 10)))].n++; });
  const at = (q) => vals[Math.min(vals.length - 1, Math.floor(q * (vals.length - 1)))];
  return { bins, total: vals.length, median: r0(at(0.5)), p25: r0(at(0.25)), p75: r0(at(0.75)) };
}

/* "Bright spots": the highest-scoring visible group on every axis, best first. */
export function brightSpots(limit = 4, scoreOf) {
  const out = [];
  ALL_AXES.forEach(([key, label]) => {
    const visible = groupRows(key, LAST, scoreOf).filter((g) => !g.hidden);
    if (!visible.length) return;
    const best = visible.reduce((a, b) => (b.score > a.score ? b : a));
    out.push({ axis: label, axisKey: key, ...best });
  });
  return out.sort((a, b) => b.score - a.score).slice(0, limit);
}

/* Parts closest to the next status line up (a Struggling part to the Striving line, a Striving one to the Flourishing line). */
export function withinReach(children, limit = 4) {
  return children
    .map((c) => { const v = c.values[LAST]; const next = nextLine(v); return next ? { label: c.label, score: v, next, gap: next - v, nextName: statusName(next) } : null; })
    .filter(Boolean).sort((a, b) => a.gap - b.gap).slice(0, limit);
}

/* Where a Driver or Explorer sits among its peers (latest round), best first. */
export function rankAmong(subject) {
  const names = subject.kind === "dimension" ? DIMENSIONS : subject.kind === "driver" ? DRIVERS : null;
  if (!names) return null;
  const at = subject.kind === "dimension" ? (n) => dimAt(n, LAST) : (n) => driverAt(n, LAST);
  const rows = names.map((n) => ({ label: n, score: at(n) })).sort((a, b) => b.score - a.score);
  const rank = rows.findIndex((r) => r.label === subject.label) + 1;
  return { rows, rank, total: rows.length, noun: subject.kind === "dimension" ? "Explorer" : "Driver" };
}

/* ---- groups of people by name (for "team" and "this group vs that group") ---- */
/* Every group with 5+ people on each axis, keyed by axis. */
export const GROUPS_BY_AXIS = () => ALL_AXES.map(([key, label]) => ({ key, label, groups: groupRows(key).filter((g) => !g.hidden).map((g) => g.group) }));

/* Groups named in a piece of text. A name is matched case-sensitively as written ("IT",
   "Distribution"), or in any case when the text also has a cue word ("team", "compare",
   "vs"…) — so "show the distribution" never reads as the Distribution department. */
export function findGroups(text) {
  const cue = /\b(team|teams|department|dept|group|groups|staff|office|location|compare|vs\.?|versus|between|against|than|people)\b/i.test(text);
  const hits = [];
  GROUPS_BY_AXIS().forEach(({ key, label, groups }) => groups.forEach((g) => {
    const esc = g.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
    const exact = new RegExp(`(^|[^\\w])${esc}($|[^\\w])`);
    const loose = new RegExp(`(^|[^\\w])${esc}($|[^\\w])`, "i");
    if (exact.test(text) || (cue && g.length > 3 && loose.test(text))) hits.push({ axis: key, axisLabel: label, group: g, at: text.toLowerCase().indexOf(g.toLowerCase()) });
  }));
  // Drop a name that sits inside a longer one that also matched ("Remote" inside "Remote - APAC").
  return hits.filter((h) => !hits.some((o) => o !== h && o.group.length > h.group.length && o.group.toLowerCase().includes(h.group.toLowerCase()))).sort((a, b) => a.at - b.at);
}

/* One group's picture: score and people by status, per round and now (null when under 5 people). */
export function groupSnapshot(axisKey, group, scoreOf = (r) => r.overallScore) {
  const members = dataset.users.filter((u) => u[axisKey] === group);
  const at = (i) => members.map((u) => u.rounds.find((x) => x.round === ROUNDS[i].round)).filter(Boolean);
  const n = at(LAST).length;
  if (n < SUPPRESS_BELOW) return null;
  const series = ROUNDS.map((_, i) => { const rs = at(i); return rs.length >= SUPPRESS_BELOW ? r0(meanOf(rs.map(scoreOf))) : null; });
  const count = (i) => { let f = 0, s = 0, t = 0; at(i).forEach((r) => { const v = scoreOf(r); if (v >= FLOURISHING_AT) f++; else if (v >= STRIVING_AT) s++; else t++; }); return { f, s, t }; };
  const now = count(LAST), prev = count(Math.max(0, LAST - 1));
  const value = series[LAST], pv = series[LAST - 1] ?? value;
  return { axis: axisKey, group, n, series, value, delta: value - pv, status: statusOf(value), people: { ...now, total: n, pf: prev.f, ps: prev.s, pt: prev.t } };
}

/* A group's mean score on each named part (Explorers or Drivers), latest round. */
export function groupPartMeans(axisKey, group, labels) {
  const rows = dataset.users.filter((u) => u[axisKey] === group).map((u) => u.rounds.find((x) => x.round === ROUNDS[LAST].round)).filter(Boolean);
  return labels.map((l) => r0(meanOf(rows.map((r) => r.driverScores[l] ?? r.dimensionScores[l]))));
}

/* How closely two measures move together across people (latest round): Pearson r, −1 to 1. A link, not a cause. */
export function pairLink(scoreA, scoreB) {
  const rs = usersAt(LAST);
  return Math.round(pearson(rs.map(scoreA), rs.map(scoreB)) * 100) / 100;
}

export function responseCoverage() {
  const perRound = ROUNDS.map((r, i) => ({ date: r.date, n: usersAt(i).length, rate: r0((usersAt(i).length / EMPLOYEE_COUNT) * 100) }));
  let hidden = 0, total = 0;
  ALL_AXES.forEach(([key]) => groupRows(key).forEach((g) => { total++; if (g.hidden) hidden++; }));
  return { perRound, hidden, total, headcount: EMPLOYEE_COUNT };
}

export { DIMENSIONS };
