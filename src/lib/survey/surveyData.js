import survey from "../../data/surveys/shape-survey.json";
import dataset from "../../data/surveys/shape-survey-responses.json";
import { indexSurvey, scoreResponse, enpsOf, statusOf, WELLBEING, WELLBEING_LEVELS } from "./scoring.js";

/* ================================================================== */
/* SURVEY DATA — the SHAPE survey's 150-person dataset, scored.          */
/*                                                                      */
/* The read layer for the new dataset (data/generate-survey-dataset.mjs).*/
/* Raw answers come from the JSON; every score comes from scoring.js,    */
/* worked out once here and cached. Nothing in the product reads this    */
/* yet except Developer › Data: the Org and Personal reports move onto   */
/* it next (the old lib/dataset.js stays until they do).                 */
/*                                                                      */
/* Org-level numbers average people; a group under 5 people is never    */
/* reported (MIN_GROUP). A personal report reads one person only.       */
/* ================================================================== */
export const SURVEY = survey;
export const DATASET = dataset;
export const ROUNDS = dataset.meta.rounds;
export const LATEST_ROUND = ROUNDS[ROUNDS.length - 1].id;
export const MIN_GROUP = 5;
export const { questions: QUESTIONS, byId: QUESTION, explorers: EXPLORERS } = indexSurvey(survey);
export const DRIVERS = survey.drivers.map((d) => d.name);

const mean = (xs) => { const v = xs.filter((x) => typeof x === "number"); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };

/* Every response, scored once. */
export const PEOPLE = dataset.people.map((p) => ({
  ...p,
  rounds: Object.fromEntries(p.responses.map((r) => [r.round, { answers: r.answers, comments: r.comments || {}, scores: scoreResponse(survey, r.answers, p.profile) }])),
}));
export const personById = (id) => PEOPLE.find((p) => p.id === id);

/* Everyone who answered a round (optionally only some people). */
export const respondents = (roundId = LATEST_ROUND, keep = () => true) => PEOPLE.filter((p) => p.rounds[roundId] && keep(p));

/* The whole organisation (or a group of 5+) in one round. */
export function summary(roundId = LATEST_ROUND, keep = () => true) {
  const rs = respondents(roundId, keep);
  if (rs.length < MIN_GROUP) return { n: rs.length, suppressed: true };
  const sc = rs.map((p) => p.rounds[roundId].scores);
  const status = { Flourishing: 0, Striving: 0, Struggling: 0 };
  sc.forEach((s) => { status[s.status]++; });
  const wellbeing = Object.fromEntries(WELLBEING.map(({ label }) => [label, Object.fromEntries(WELLBEING_LEVELS.map((lv) => [lv, sc.filter((s) => s.wellbeing[label].level === lv).length]))]));
  return {
    n: rs.length, invited: ROUNDS.find((r) => r.id === roundId)?.invited,
    overall: mean(sc.map((s) => s.overall)), status,
    explorers: Object.fromEntries(EXPLORERS.map((e) => [e.id, mean(sc.map((s) => s.explorers[e.id]))])),
    drivers: Object.fromEntries(DRIVERS.map((d) => [d, mean(sc.map((s) => s.drivers[d]))])),
    enps: enpsOf(rs.map((p) => p.rounds[roundId].answers["CC2.3"])),
    wellbeing,
    hpq: mean(sc.map((s) => s.hpq?.absolute)),
  };
}

/* How many people share each value of a profile field, among a round's respondents. */
export function composition(field, roundId = LATEST_ROUND) {
  const counts = {};
  respondents(roundId).forEach((p) => { const v = p.profile[field] ?? "Not given"; counts[v] = (counts[v] || 0) + 1; });
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

/* An answer as a person would read it: the option's text, or the number. */
export function answerText(q, v) {
  if (v == null) return null;
  if (Array.isArray(v) && q.combine) return `Office: ${answerText(q, v[0])} · Home: ${answerText(q, v[1])}`;
  if (q.scale === "bmi") return `${v[0]} cm, ${v[1]} kg (BMI ${(v[1] / (v[0] / 100) ** 2).toFixed(1)})`;
  if (q.scale === "alcohol") return `${v} standard drink${v === 1 ? "" : "s"} a week`;
  if (q.options.length) return q.options[v];
  return String(v);
}

export { statusOf };

/* ---- series and groups, for the SHAPE reports ------------------------ */
/* The rounds as the Story components want them (RoundsContext, lib/roundsContext.js). */
export const STORY_ROUNDS = ROUNDS.map((r, i) => ({ round: i + 1, date: r.closedAt }));
export const roundIndex = (id) => ROUNDS.findIndex((r) => r.id === id);

/* One person's value in every round (null where they didn't answer). `get(scores, answers)`. */
export const personSeries = (person, get) => ROUNDS.map((r) => (person.rounds[r.id] ? get(person.rounds[r.id].scores, person.rounds[r.id].answers) : null));
/* The organisation's (or a 5+ group's) value in every round. `get(summary)`. */
export const orgSeries = (get, keep) => ROUNDS.map((r) => { const s = summary(r.id, keep); return s.suppressed ? null : get(s); });

/* Ways of grouping people for Org analysis (never in a personal report). Age is banded from the age worked out of date
   of birth. */
export const ageBand = (age) => (age < 25 ? "Under 25" : age < 35 ? "25 to 34" : age < 45 ? "35 to 44" : age < 55 ? "45 to 54" : "55 and over");
export const GROUP_AXES = [
  { key: "department", label: "Department" }, { key: "site", label: "Site" }, { key: "country", label: "Country" },
  { key: "workModel", label: "Work Model" }, { key: "jobLevel", label: "Job Level" }, { key: "tenure", label: "Employment Duration" },
  { key: "employmentStatus", label: "Employment Status" }, { key: "gender", label: "Gender" }, { key: "age", label: "Age", of: (p) => ageBand(p.age) },
];
const valueOn = (axis, profile) => (axis.of ? axis.of(profile) : profile[axis.key]);

/* Every group on one way of grouping, in a round: score, change since the round before, people, how many Struggling.
   Groups under MIN_GROUP people come back `suppressed` with no numbers. */
export function groups(axisKey, roundId = LATEST_ROUND) {
  const axis = GROUP_AXES.find((a) => a.key === axisKey);
  const i = roundIndex(roundId), prevId = i > 0 ? ROUNDS[i - 1].id : null;
  const values = [...new Set(respondents(roundId).map((p) => valueOn(axis, p.profile)))];
  return values.map((value) => {
    const keep = (p) => valueOn(axis, p.profile) === value;
    const s = summary(roundId, keep);
    if (s.suppressed) return { axisKey, axis: axis.label, value, n: s.n, suppressed: true };
    const prev = prevId ? summary(prevId, keep) : null;
    return { axisKey, axis: axis.label, value, n: s.n, score: s.overall, change: prev && !prev.suppressed ? s.overall - prev.overall : null, struggling: s.status.Struggling, summary: s };
  });
}
/* The lowest-scoring group of 5+ people on each way of grouping, lowest first (Areas to Focus). */
export const focusGroups = (roundId = LATEST_ROUND) => GROUP_AXES.map((a) => groups(a.key, roundId).filter((g) => !g.suppressed && g.value !== "Does not apply").sort((x, y) => x.score - y.score)[0]).filter(Boolean).sort((a, b) => a.score - b.score);

/* The person a personal report opens on when none is chosen: someone who answered every round, mid-range now. */
export const DEFAULT_PERSON = (PEOPLE.filter((p) => ROUNDS.every((r) => p.rounds[r.id])).map((p) => ({ p, s: p.rounds[LATEST_ROUND].scores.overall })).sort((a, b) => Math.abs(a.s - 66) - Math.abs(b.s - 66))[0] || { p: PEOPLE[0] }).p.id;
