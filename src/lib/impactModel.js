import { dataset, ROUNDS } from "./dataset.js";
import { FLOURISHING_AT, STRIVING_AT } from "./bands.js";
import { ALL_AXES, SUPPRESS_BELOW, LAST } from "./scopeData.js";

/* ================================================================== */
/* IMPACT MODEL — "Time Impact", "Money Impact" and "Time to Gain".     */
/*                                                                      */
/* The concept (from the product owner): if people's scores rose to     */
/* Flourishing, this is the time and money the organisation would get   */
/* back each year. Time comes back through productivity and fewer       */
/* absences; money through productivity, absenteeism, retention and     */
/* injury / claims. Team reports show time only; a personal report      */
/* shows one number for time with no breakdown.                         */
/*                                                                      */
/* What is real and what is assumed:                                    */
/*  - REAL: every person's score on the Explorers that drive each part, */
/*    in every round, and so their gap to Flourishing (80). Nobody      */
/*    already at 80+ contributes anything.                              */
/*  - ASSUMED (a sample model, stated on every Scope that uses it): the */
/*    rates that turn a point of gap into hours or dollars. The real    */
/*    SHAPE model will replace RATES; nothing else needs to change.     */
/* ================================================================== */
export const IMPACT_TARGET = FLOURISHING_AT;

/* Each part of the gain, the Explorers it is built from (their average is the person's score for that part), and its rate. */
export const PARTS = {
  productivity: { label: "Productivity", explorers: ["Employee Engagement", "Job Satisfaction"], hours: 0.6, note: "hours of more focused output per point below Flourishing" },
  absenteeism: { label: "Absenteeism", explorers: ["Physical Health", "Psychological Health"], hours: 0.25, note: "hours of absence avoided per point below Flourishing" },
  retention: { label: "Retention", explorers: ["Employee Commitment"], leaveRisk: 0.0025, note: "lower chance of leaving per point below Flourishing (0.25% a point)" },
  claims: { label: "Injury/Claims", explorers: ["Physical Work Environment", "Physical Health"], dollars: 6, note: "dollars of injury and claim cost per point below Flourishing" },
};
export const RATES = { hourValue: 40, replacementCost: 9000, currency: "USD" };
export const TIME_PARTS = ["productivity", "absenteeism"];
export const MONEY_PARTS = ["productivity", "absenteeism", "retention", "claims"];

const mean = (xs) => xs.reduce((a, b) => a + b, 0) / (xs.length || 1);
const gapOn = (r, explorers, target) => Math.max(0, target - mean(explorers.map((e) => r.dimensionScores[e])));

/* One person's gain in one round: { hours: {productivity, absenteeism}, dollars: {…4 parts}, below } */
export function personGain(r, target = IMPACT_TARGET) {
  const g = Object.fromEntries(Object.entries(PARTS).map(([k, p]) => [k, gapOn(r, p.explorers, target)]));
  const hours = { productivity: g.productivity * PARTS.productivity.hours, absenteeism: g.absenteeism * PARTS.absenteeism.hours };
  const dollars = {
    productivity: hours.productivity * RATES.hourValue,
    absenteeism: hours.absenteeism * RATES.hourValue,
    retention: g.retention * PARTS.retention.leaveRisk * RATES.replacementCost,
    claims: g.claims * PARTS.claims.dollars,
  };
  return { hours, dollars, below: r.overallScore < target };
}

/* The organisation (or a filtered set of people) in round i: hours per person (time) and dollars in total (money). */
export function impact(i = LAST, target = IMPACT_TARGET, keep = () => true) {
  const rn = ROUNDS[i].round;
  const rows = dataset.users.filter(keep).map((u) => u.rounds.find((x) => x.round === rn)).filter(Boolean);
  const n = rows.length || 1;
  const gains = rows.map((r) => personGain(r, target));
  const sum = (part, key) => gains.reduce((a, g) => a + g[key][part], 0);
  const hours = Object.fromEntries(TIME_PARTS.map((k) => [k, sum(k, "hours") / n]));
  const dollars = Object.fromEntries(MONEY_PARTS.map((k) => [k, sum(k, "dollars")]));
  return {
    people: rows.length,
    below: gains.filter((g) => g.below).length,
    hours: { ...hours, total: hours.productivity + hours.absenteeism },            // per person, per year
    dollars: { ...dollars, total: MONEY_PARTS.reduce((a, k) => a + dollars[k], 0) }, // whole organisation, per year
  };
}

/* Every round, oldest first. */
export const impactSeries = (target = IMPACT_TARGET) => ROUNDS.map((_, i) => impact(i, target));

/* How much of the full gain each step up gets you: to Striving (60), 70, Flourishing (80) and a stretch of 90. */
export const LADDER = [STRIVING_AT, 70, FLOURISHING_AT, 90];
export const impactLadder = () => LADDER.map((t) => ({ target: t, ...impact(LAST, t) }));

/* The gain per person for each group on one way of grouping people. Groups under 5 people are never shown. */
export function impactByGroup(axisKey) {
  const groups = [...new Set(dataset.users.map((u) => u[axisKey]))];
  return groups.map((g) => {
    const res = impact(LAST, IMPACT_TARGET, (u) => u[axisKey] === g);
    const hidden = res.people < SUPPRESS_BELOW;
    return { group: g, n: res.people, hidden, hours: hidden ? null : res.hours.total, dollarsPerPerson: hidden ? null : res.dollars.total / res.people };
  }).sort((a, b) => (b.hours ?? -1) - (a.hours ?? -1));
}
export const IMPACT_AXES = ALL_AXES;

/* "Time to Gain" on a personal report: there is no signed-in person in the prototype, so it is one sample person,
   the one at the median gap (so the number is typical, not extreme). Tagged as sample wherever it shows. */
export function samplePerson() {
  const rn = ROUNDS[LAST].round;
  const people = dataset.users.map((u) => ({ u, r: u.rounds.find((x) => x.round === rn) })).filter((p) => p.r && p.r.overallScore < IMPACT_TARGET);
  people.sort((a, b) => a.r.overallScore - b.r.overallScore);
  const p = people[Math.floor(people.length / 2)];
  const steps = LADDER.map((t) => { const g = personGain(p.r, t); return { target: t, hours: g.hours.productivity + g.hours.absenteeism }; });
  const explorerScores = Object.fromEntries(Object.values(PARTS).flatMap((x) => x.explorers).map((e) => [e, Math.round(p.r.dimensionScores[e])]));
  return { score: Math.round(p.r.overallScore), hours: steps.find((s) => s.target === IMPACT_TARGET).hours, steps, explorerScores };
}

export const fmtHours = (h) => `${Math.round(h)}`;
/* $1.2M, $178K, and below $10K the exact dollars ($1,780) so per-person amounts still tell groups apart. */
export const fmtMoney = (d) => (Math.abs(d) >= 1e6 ? `$${(d / 1e6).toFixed(1)}M` : Math.abs(d) >= 1e4 ? `$${Math.round(d / 1e3)}K` : `$${Math.round(d).toLocaleString("en-US")}`);
