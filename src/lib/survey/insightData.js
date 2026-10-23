import { ROUNDS, LATEST_ROUND, respondents } from "./surveyData.js";
import { STRIVING_AT } from "../bands.js";

/* ================================================================== */
/* Data for three relationship Stories (stories/InsightStories.jsx),     */
/* read from the 150-person SHAPE survey dataset:                        */
/*   quadrant()        Where People Sit: two measures, four zones        */
/*   withWithout()     What Makes the Difference: Flourishing with and   */
/*                     without something, with an exact test            */
/*   outcomeByStatus() Why Flourishing Matters: an outcome per status    */
/* Pure functions of the scored responses; nothing here is sample.      */
/* ================================================================== */
const mean = (xs) => { const v = xs.filter((x) => typeof x === "number"); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
const prevRound = (id) => { const i = ROUNDS.findIndex((r) => r.id === id); return i > 0 ? ROUNDS[i - 1].id : null; };
const scoresOf = (id, keep) => respondents(id, keep).map((p) => ({ p, s: p.rounds[id].scores }));

/* ---- measures a Story can put on an axis or count as an outcome -------------------------------------------------- */
/* get(scores) returns a 0 to 100 score where higher is better (Stress is scored so 100 means never stressed). */
export const MEASURES = {
  resilience: { label: "Resilience", get: (s) => mean(["PSY3.1", "PSY3.2", "PSY3.3"].map((k) => s.questions[k])), low: "Low", high: "High", note: "the mean of three questions: adapting to change, bouncing back, holding up under pressure" },
  stress: { label: "Stress", get: (s) => s.drivers.Stress, low: "High", high: "Low", note: "the Stress Driver, scored so 100 means never stressed (so a high score is low stress)" },
  workload: { label: "Workload", get: (s) => s.drivers.Workload, low: "Heavy", high: "Manageable", note: "the Workload Driver" },
  balance: { label: "Work-life balance", get: (s) => s.drivers["Work-life balance"], low: "Poor", high: "Good", note: "the Work-life balance Driver" },
  engagement: { label: "Engagement", get: (s) => s.explorers["employee-engagement"], low: "Low", high: "High", note: "the Employee Engagement Explorer" },
  commitment: { label: "Commitment", get: (s) => s.explorers["employee-commitment"], low: "Low", high: "High", note: "the Employee Commitment Explorer" },
};

/* Pairs offered by Where People Sit. x runs bad → good left to right, y bad → good bottom to top, so the top-right zone is the
   good one. Zone names: [x good, y good] → name. */
export const PAIRS = [
  { key: "stress-resilience", x: "stress", y: "resilience", names: { "1,1": "Steady", "0,1": "Coping", "1,0": "Untested", "0,0": "At risk" },
    about: { "1,1": "Low stress and the resilience to handle more.", "0,1": "Under real stress, and holding up.", "1,0": "Not under strain now, but less able to bounce back.", "0,0": "Under stress with little to fall back on." } },
  { key: "workload-balance", x: "workload", y: "balance", names: { "1,1": "In balance", "0,1": "Stretched but balanced", "1,0": "Light load, poor balance", "0,0": "Overloaded" },
    about: { "1,1": "A manageable load and time for life outside work.", "0,1": "A heavy load, but life outside work holds.", "1,0": "The load isn't the problem; something else is.", "0,0": "A heavy load eating into life outside work." } },
  { key: "engagement-commitment", x: "engagement", y: "commitment", names: { "1,1": "Invested", "0,1": "Loyal, not engaged", "1,0": "Engaged, not committed", "0,0": "Detached" },
    about: { "1,1": "Engaged in the work and committed to staying.", "0,1": "Committed, but the work itself isn't landing.", "1,0": "Into the work, less tied to the organisation.", "0,0": "Neither engaged nor committed." } },
];

/* Where People Sit: share of people in each zone, latest round and the round before. Cut at the Striving line (60). */
export function quadrant(pairKey, { round = LATEST_ROUND, cut = STRIVING_AT, keep } = {}) {
  const pair = PAIRS.find((p) => p.key === pairKey) || PAIRS[0];
  const X = MEASURES[pair.x], Y = MEASURES[pair.y];
  const count = (id) => {
    const c = { "1,1": 0, "0,1": 0, "1,0": 0, "0,0": 0 };
    const points = [];
    let n = 0;
    scoresOf(id, keep).forEach(({ p, s }) => {
      const x = X.get(s), y = Y.get(s);
      if (x == null || y == null) return;
      const k = `${x >= cut ? 1 : 0},${y >= cut ? 1 : 0}`;
      c[k]++; n++;
      points.push({ id: p.id, x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10, k });
    });
    return { n, c, points };
  };
  const now = count(round), prevId = prevRound(round), prev = prevId ? count(prevId) : null;
  const pct = (k, d) => (d.n ? Math.round((d.c[k] / d.n) * 100) : 0);
  const cells = Object.keys(now.c).map((k) => ({ key: k, name: pair.names[k], about: pair.about[k], n: now.c[k], pct: pct(k, now), change: prev ? pct(k, now) - pct(k, prev) : null }));
  return { key: pair.key, x: { ...X, key: pair.x }, y: { ...Y, key: pair.y }, cut, n: now.n, cells, points: now.points, prevLabel: prevId ? ROUNDS.find((r) => r.id === prevId) : null };
}

/* ---- What Makes the Difference -------------------------------------------------------------------------------- */
/* Each offer is one survey question. Agree / Strongly agree (score 75+) counts as having it, Disagree / Strongly disagree
   (25 or less) as not; Neutral is left out. */
export const OFFERS = [
  { key: "disruption", qid: "SoftWE1.2", offer: "a disruption-free workspace", question: "I am rarely disrupted by others" },
  { key: "software", qid: "SoftWE1.4", offer: "software that's adequate and up to date", question: "My software is adequate and up to date" },
  { key: "ergonomic", qid: "PhysWE1.5", offer: "an ergonomically sound workstation", question: "My workstation is ergonomically sound and comfortable" },
  { key: "flexible", qid: "SoftWE1.1", offer: "work flexible enough for their needs", question: "Work is flexible enough to accommodate my needs" },
  { key: "training", qid: "EE1.4", offer: "access to training and development", question: "I have access to training and development opportunities if required" },
  { key: "safe", qid: "EC2", offer: "safety from harm, bullying and harassment", question: "At work, do you feel safe from physical and/or psychological harm, bullying, and harassment?" },
];
export const OUTCOMES = {
  flourishing: { label: "Flourishing", phrase: "be Flourishing", test: (s) => s.status === "Flourishing" },
  recommend: { label: "Would recommend", phrase: "recommend working here", test: (s) => s.enps?.group === "Promoter" },
};
export const SPLITS = [
  { key: "all", label: "Everyone", keep: () => true },
  { key: "Office", label: "Office", keep: (p) => p.profile.workModel === "Office" },
  { key: "Hybrid", label: "Hybrid", keep: (p) => p.profile.workModel === "Hybrid" },
  { key: "Home", label: "Home", keep: (p) => p.profile.workModel === "Home" },
];

/* Fisher's exact test, two-sided: the chance of a split at least this uneven if having the offer made no difference. Exact,
   so it stays honest on the small groups a 150-person survey gives. */
const lf = (() => { const t = [0]; for (let i = 1; i <= 2000; i++) t[i] = t[i - 1] + Math.log(i); return (n) => t[n]; })();
export function fisher(a, b, c, d) {
  const r1 = a + b, r2 = c + d, c1 = a + c, n = r1 + r2;
  const p = (x) => Math.exp(lf(r1) + lf(r2) + lf(c1) + lf(n - c1) - lf(n) - lf(x) - lf(r1 - x) - lf(c1 - x) - lf(r2 - c1 + x));
  const lo = Math.max(0, c1 - r2), hi = Math.min(r1, c1), obs = p(a);
  let sum = 0;
  for (let x = lo; x <= hi; x++) { const px = p(x); if (px <= obs * (1 + 1e-7)) sum += px; }
  return Math.min(1, sum);
}
/* Plain words for a p-value. */
export const evidence = (p) => (p == null ? null : p < 0.01 ? "Strong evidence" : p < 0.05 ? "Some evidence" : "Could be chance");

export function withWithout({ outcome = "flourishing", split = "all", round = LATEST_ROUND, minGroup = 5 } = {}) {
  const O = OUTCOMES[outcome], S = SPLITS.find((x) => x.key === split) || SPLITS[0];
  const rows = scoresOf(round, S.keep);
  const items = OFFERS.map((o) => {
    const w = rows.filter(({ s }) => s.questions[o.qid] != null && s.questions[o.qid] >= 75);
    const wo = rows.filter(({ s }) => s.questions[o.qid] != null && s.questions[o.qid] <= 25);
    const neutral = rows.filter(({ s }) => s.questions[o.qid] != null && s.questions[o.qid] > 25 && s.questions[o.qid] < 75).length;
    const k1 = w.filter(({ s }) => O.test(s)).length, k0 = wo.filter(({ s }) => O.test(s)).length;
    const enough = w.length >= minGroup && wo.length >= minGroup;
    const p = enough ? fisher(k1, w.length - k1, k0, wo.length - k0) : null;
    return {
      ...o,
      with: { n: w.length, k: k1, pct: w.length >= minGroup ? Math.round((k1 / w.length) * 100) : null },
      without: { n: wo.length, k: k0, pct: wo.length >= minGroup ? Math.round((k0 / wo.length) * 100) : null },
      neutral, p, evidence: evidence(p), enough,
    };
  });
  return { outcome: O, split: S, n: rows.length, items };
}

/* ---- Why Flourishing Matters ---------------------------------------------------------------------------------- */
export const STATUS_OUTCOMES = [
  { key: "recommend", label: "Would recommend working here", kind: "share", get: (s) => s.enps?.group === "Promoter", sentence: (v) => `${v}% would recommend working here`, caption: "would recommend working here" },
  { key: "lookforward", label: "Look forward to coming to work", kind: "share", get: (s) => (s.questions["EC1.6"] == null ? null : s.questions["EC1.6"] >= 75), sentence: (v) => `${v}% look forward to coming to work`, caption: "look forward to coming to work" },
  { key: "performance", label: "Rate their own performance", kind: "score", get: (s) => s.hpq?.absolute ?? null, sentence: (v) => `rate their own performance ${v} out of 100`, caption: "self-rated performance, out of 100" },
];
export function outcomeByStatus({ round = LATEST_ROUND } = {}) {
  const rows = scoresOf(round);
  const statuses = ["Flourishing", "Striving", "Struggling"].map((status) => {
    const g = rows.filter(({ s }) => s.status === status);
    const values = Object.fromEntries(STATUS_OUTCOMES.map((o) => {
      const v = g.map(({ s }) => o.get(s)).filter((x) => x != null);
      return [o.key, v.length ? (o.kind === "share" ? Math.round((v.filter(Boolean).length / v.length) * 100) : Math.round(mean(v))) : null];
    }));
    return { status, n: g.length, values };
  });
  return { n: rows.length, statuses, outcomes: STATUS_OUTCOMES };
}
