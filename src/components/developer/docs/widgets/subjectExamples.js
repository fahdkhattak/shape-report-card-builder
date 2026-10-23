import { ROUNDS, LATEST_ROUND, EXPLORERS, SURVEY, GROUP_AXES, respondents, personById, DEFAULT_PERSON, groups } from "../../../../lib/survey/surveyData.js";
import { countByStatus } from "../../../../lib/bands.js";
import { scoreTitle, MIN_GROUP } from "../../../../lib/scoreWidget.js";

/* ================================================================== */
/* Live examples for the Score and Index Developer pages: real numbers   */
/* from the SHAPE survey dataset (150 people, lib/survey/surveyData.js), */
/* for every who × what the widgets support. Teams aren't in the data    */
/* (no reporting lines), so the Team examples are the Library's sample.  */
/* ================================================================== */
const L = LATEST_ROUND, P = ROUNDS[ROUNDS.length - 2].id;
const mean = (xs) => { const v = xs.filter((x) => typeof x === "number"); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
const r0 = (v) => (v == null ? null : Math.round(v));
const num = (v) => typeof v === "number";

const explorerId = (name) => EXPLORERS.find((e) => e.name === name)?.id;
const driversOf = (id) => SURVEY.drivers.filter((d) => (d.explorers || []).includes(id)).map((d) => d.name);

/* WHAT: how to read a score and its parts from one person's scores. */
export const MEASURES = {
  overall: { what: "overall", name: null, get: (s) => s.overall, parts: EXPLORERS.map((e) => ({ label: e.name, get: (s) => s.explorers[e.id], sub: driversOf(e.id).map((d) => ({ label: d, get: (s) => s.drivers[d] })) })), noun: "Explorers" },
  cluster: { what: "cluster", name: "Rest and Recovery", get: (s) => mean([s.drivers.Sleep, s.drivers.Stress, s.drivers.Exercise, s.drivers.Nutrition]), parts: ["Sleep", "Stress", "Exercise", "Nutrition"].map((d) => ({ label: d, get: (s) => s.drivers[d] })), noun: "Drivers" },
  explorer: { what: "explorer", name: "Physical Health", get: (s) => s.explorers[explorerId("Physical Health")], parts: driversOf(explorerId("Physical Health")).map((d) => ({ label: d, get: (s) => s.drivers[d] })), noun: "Drivers" },
  driver: { what: "driver", name: "Sleep", get: (s) => s.drivers.Sleep, parts: null, noun: null },
};

/* WHO: whose answers. `keep` picks people; a person is one id. */
const biggestDept = groups("department").filter((g) => !g.suppressed).sort((a, b) => b.n - a.n)[0];
const smallGroup = GROUP_AXES.filter((a) => !a.of).flatMap((a) => groups(a.key)).find((g) => g.suppressed && g.n > 0);
export const POPULATIONS = {
  org: { who: "org", keep: () => true, label: "Organisation" },
  group: { who: "group", keep: (p) => p.profile.department === biggestDept?.value, label: biggestDept?.value, group: biggestDept?.value },
  person: { who: "person", person: DEFAULT_PERSON, label: "One person" },
  small: smallGroup ? { who: "group", keep: (p) => p.profile[smallGroup.axisKey] === smallGroup.value, label: smallGroup.value, group: smallGroup.value } : null,
};

const scoresOf = (pop, round) => (pop.person ? [personById(pop.person).rounds[round]?.scores].filter(Boolean) : respondents(round, pop.keep).map((p) => p.rounds[round].scores));
const at = (pop, m, round, get = m.get) => { const sc = scoresOf(pop, round); return sc.length ? mean(sc.map(get)) : null; };

/* A Score card widget for one who × what. */
export function scoreWidget(popKey, measureKey, size = "2x2", show) {
  const pop = POPULATIONS[popKey], m = MEASURES[measureKey];
  const now = scoresOf(pop, L);
  const hidden = pop.who !== "org" && !pop.person && now.length < MIN_GROUP; // never computed for display (the privacy rule)
  const value = hidden ? null : r0(at(pop, m, L)), prev = hidden ? null : r0(at(pop, m, P));
  const parts = !hidden && m.parts ? countByStatus(m.parts.map((x) => at(pop, m, L, x.get)).filter(num)) : null;
  const people = pop.person || hidden ? null : countByStatus(now.map(m.get).filter(num));
  const round = ROUNDS[ROUNDS.length - 1];
  const data = {
    value, delta: prev == null || value == null ? undefined : value - prev, date: round.closedAt,
    n: pop.person ? undefined : pop.who === "org" ? round.invited : now.length,
    rate: pop.who === "org" ? Math.round((now.length / round.invited) * 100) : undefined,
    people, parts, partsNoun: m.noun,
  };
  return { id: `doc-score-${popKey}-${measureKey}-${size}`, kind: "score", size, who: pop.who, what: m.what, show, data, title: scoreTitle(pop.who, m.what, { name: m.name, group: pop.group }) };
}

/* An Index widget for one who × what: its parts and (3x3) their parts, now and the round before. */
export function indexWidget(popKey, measureKey, size = "2x2") {
  const pop = POPULATIONS[popKey], m = MEASURES[measureKey];
  const wedges = (m.parts || []).map((x) => ({
    label: x.label, value: at(pop, m, L, x.get), prev: at(pop, m, P, x.get),
    sub: x.sub ? x.sub.map((y) => ({ label: y.label, value: at(pop, m, L, y.get), prev: at(pop, m, P, y.get) })).filter((y) => num(y.value)) : undefined,
  })).filter((w) => num(w.value));
  const title = scoreTitle(pop.who, m.what, { name: m.name, group: pop.group }).replace(/Score$/, "Index");
  return { id: `doc-index-${popKey}-${measureKey}-${size}`, kind: "index", size, wedges, center: at(pop, m, L), title };
}

export const TEAM_NOTE = "Teams aren't in the prototype's data (it has no reporting lines), so the Team card is the Library's sample.";
export const SMALL_NOTE = POPULATIONS.small ? `${POPULATIONS.small.label}: ${smallGroup.n} ${smallGroup.n === 1 ? "person" : "people"} answered, under the ${MIN_GROUP}-person minimum.` : null;
