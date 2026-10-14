import { ROUNDS, DIMENSIONS, DIMENSION_DRIVERS, DRIVER_DIMENSION, DRIVERS, metricForTopic, driverRankedRows } from "./dataset.js";
import { extractTopics, titleFromPrompt } from "./topicResolver.js";
import { dimensionSeries, driverSeries, overallSeries, findGroups, LAST } from "./scopeData.js";

/* ================================================================== */
/* SCOPE SUBJECT — what a built widget is actually "about", resolved    */
/* against the real dataset, so every Story in its Scope reads real      */
/* numbers (Widget Builder, components/widgetbuilder/).                  */
/*   dimension — one of the 12 Explorers; its Drivers are the parts      */
/*   driver    — a single Driver; no parts                               */
/*   cluster   — a handful of Drivers asked about together               */
/*   concept   — a curated concept (e.g. Burnout Risk): a series only    */
/* `scoreOf(userRound)` gives one person's score on the subject, which    */
/* is what lets Composition split it by group. A prompt that resolves to  */
/* nothing returns null — the builder asks for a topic instead of         */
/* inventing one.                                                         */
/* ================================================================== */
const r0 = Math.round;
const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const driverChildren = (names) => names.map((d) => ({ label: d, values: driverSeries(d) }));

/* One of the 12 Explorers, its Drivers as the parts. Also what the Explorers
   report layer's per-Explorer Scope reads. */
export function dimensionSubject(dim, topics = [dim]) {
  const drivers = DIMENSION_DRIVERS[dim];
  return { kind: "dimension", label: dim, topics, series: dimensionSeries(dim), drivers, childNoun: "Driver", children: driverChildren(drivers), scoreOf: (r) => r.dimensionScores[dim] };
}

/* The whole organisation: its overall score, with the 12 Explorers as its parts. The
   weakest Drivers stand in as the ones to act on. */
export function overallSubject() {
  const children = DIMENSIONS.map((d) => ({ label: d, values: dimensionSeries(d) }));
  const drivers = driverRankedRows().slice(-8).reverse().map((r) => r[0]);
  return { kind: "overall", label: "Organisation", topics: [], series: overallSeries(), drivers, childNoun: "Explorer", children, scoreOf: (r) => r.overallScore };
}

const OVERALL_WORDS = /\b(overall|organi[sz]ation|organi[sz]ational|company|whole|entire|big picture|full (story|picture)|everyone|everything|how are we|org score|org report|wellbeing score|the business|across the|composition|make-?up|headcount|who works|who is in)\b/i;
export const isOverallAsk = (prompt) => OVERALL_WORDS.test(prompt || "");

/* An Explorer or a Driver as one side of a head-to-head. */
function itemFor(name) {
  if (DIMENSIONS.includes(name)) return { label: name, kind: "dimension", series: dimensionSeries(name), scoreOf: (r) => r.dimensionScores[name] };
  return { label: name, kind: "driver", series: driverSeries(name), scoreOf: (r) => r.driverScores[name] };
}

export function subjectFromPrompt(prompt) {
  const all = extractTopics(prompt);
  const lp0 = (prompt || "").toLowerCase();
  const namedAny = all.some((t) => lp0.includes(t.toLowerCase()));
  // Nothing literally named, and it's about the whole organisation or about a named group
  // ("How is the IT team doing?", "Compare Remote and Onsite"): the overall picture, not a
  // near-match topic.
  if (!namedAny && (isOverallAsk(prompt) || findGroups(prompt).length)) return overallSubject();
  if (!all.length) return null;
  // Only treat things the person actually named as the subject. The resolver also
  // returns near-matches ("Employee Engagement" can pull in "Employee Commitment"),
  // which would turn a one-topic question into a cluster.
  const p = prompt.toLowerCase();
  const named = all.filter((t) => p.includes(t.toLowerCase()));
  const topics = named.length ? named : [all[0]];
  const dims = topics.filter((t) => DIMENSIONS.includes(t));
  const drvs = topics.filter((t) => DRIVER_DIMENSION[t]);
  const primary = topics[0];

  // A lone Explorer, possibly with some of its own Drivers alongside it.
  if (dims.length === 1 && primary === dims[0] && drvs.every((d) => DRIVER_DIMENSION[d] === dims[0])) {
    return dimensionSubject(dims[0], topics);
  }

  // A lone Driver.
  if (topics.length === 1 && drvs.length === 1) {
    const d = drvs[0];
    return { kind: "driver", label: d, topics, series: driverSeries(d), drivers: [d], childNoun: "Driver", children: [], scoreOf: (r) => r.driverScores[d] };
  }

  // Two or more real things asked about together → a bespoke cluster of Drivers.
  if (dims.length + drvs.length >= 2) {
    const drivers = [...new Set([...drvs, ...dims.flatMap((d) => DIMENSION_DRIVERS[d])])].slice(0, 8);
    const series = ROUNDS.map((r) => r0(mean(drivers.map((d) => r.driverAvg[d]))));
    // Exactly two named things (Sleep vs Stress, Engagement vs Satisfaction) can also be set head to head.
    const named2 = [...dims, ...drvs];
    const pair = named2.length === 2 ? named2.map(itemFor) : null;
    return { kind: "cluster", label: titleFromPrompt(prompt, topics), topics, series, drivers, childNoun: "Driver", children: driverChildren(drivers), scoreOf: (r) => mean(drivers.map((d) => r.driverScores[d])), pair };
  }

  // A curated concept (polarity-corrected by lib/dataset.js).
  const m = metricForTopic(primary);
  if (m) return { kind: "concept", label: primary, topics, series: m.trend, drivers: [], childNoun: "Driver", children: [], scoreOf: null };
  return null;
}

export const latestOf = (subject) => subject.series[LAST];
