/* ================================================================== */
/* SURVEY SCORING — answers → scores, for any survey record.              */
/*                                                                      */
/* The one place a person's answers become numbers. Used by the dataset   */
/* generator (data/generate-survey-dataset.mjs), the Developer › Data     */
/* pages and, next, the reports. Every rule here is written on the        */
/* survey record's page (Developer › Data › SHAPE Survey, "Worked out     */
/* from the answers"), so the two can be checked against each other.      */
/*                                                                      */
/* An answer is stored as:                                               */
/*  - a list question: the option's index (N/A is an index too)           */
/*  - a numeric range: the number                                         */
/*  - alcohol: standard drinks a week; BMI: [heightCm, weightKg]          */
/*  - a work-environment question a Hybrid person answers twice:          */
/*    [officeAnswer, homeAnswer]                                          */
/*  - free text: a string (kept apart, never scored)                      */
/* Pure functions: safe in the browser and in Node.                     */
/* ================================================================== */
import { FLOURISHING_AT, STRIVING_AT, statusName } from "../bands.js";

export const statusOf = (v) => (v == null ? null : statusName(v));

export { FLOURISHING_AT, STRIVING_AT };
const mean = (xs) => { const v = xs.filter((x) => typeof x === "number" && Number.isFinite(x)); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };

/* Every question in order, and a lookup. Cached per survey record. */
const INDEX = new WeakMap();
export function indexSurvey(survey) {
  if (INDEX.has(survey)) return INDEX.get(survey);
  const questions = survey.sections.flatMap((s) => s.groups.flatMap((g) => g.questions));
  const byId = Object.fromEntries(questions.map((q) => [q.id, q]));
  const explorers = survey.sections.filter((s) => s.kind === "explorer");
  const idx = { questions, byId, explorers };
  INDEX.set(survey, idx);
  return idx;
}

/* BMI and alcohol are scored from a value, not an option (Score per response: PHYS6, PHYS4). */
export const bmiOf = ([heightCm, weightKg]) => weightKg / (heightCm / 100) ** 2;
const BMI_SCORE = (b) => (b > 35 ? 0 : b >= 33 ? 17 : b >= 30 ? 34 : b >= 27 ? 51 : b >= 25 ? 68 : b >= 24 ? 85 : 100);
const ALCOHOL_SCORE = (n) => (n <= 7 ? 100 : n <= 14 ? 80 : n <= 21 ? 60 : n <= 28 ? 40 : n <= 35 ? 20 : 0);

/* One answer → 0 to 100, or null (not scored, N/A, not asked). `hours` = { office, home } weights a two-part answer. */
export function scoreAnswer(survey, q, value, hours) {
  if (value == null || !q.scale) return null;
  if (Array.isArray(value) && q.combine) {
    const [o, h] = value.map((v) => scoreAnswer(survey, q, v));
    const wo = hours?.office || 0, wh = hours?.home || 0;
    if (o == null) return h; if (h == null) return o;
    return wo + wh > 0 ? (o * wo + h * wh) / (wo + wh) : (o + h) / 2;
  }
  if (q.scale === "bmi") return BMI_SCORE(bmiOf(value));
  if (q.scale === "alcohol") return ALCOHOL_SCORE(value);
  if (q.options.length) { const s = q.scores?.[value]; return typeof s === "number" ? s : null; }
  const scale = survey.scales[q.scale]; // numeric range: the scale names each number
  const opt = scale?.options.find((o) => o.label === String(value));
  return opt ? opt.score : null;
}

/* The DASS measures and their levels (survey.derived: mentalWellbeing, severityCutoffs). */
export const WELLBEING = [{ driver: "Depression", label: "Feeling Low" }, { driver: "Stress", label: "Feeling Stressed" }, { driver: "Anxiety", label: "Feeling Anxious" }];
export const WELLBEING_LEVELS = ["Normal", "Mild", "Moderate", "Severe", "Extremely Severe"];
/* The level cut-offs are still open (survey issue I22): 80 / 60 / 40 / 20 on the measure's 0 to 100 score for now. */
export const WELLBEING_CUTOFFS = [80, 60, 40, 20];
export const wellbeingLevel = (score) => (score == null ? null : WELLBEING_LEVELS[WELLBEING_CUTOFFS.findIndex((c) => score >= c) === -1 ? 4 : WELLBEING_CUTOFFS.findIndex((c) => score >= c)]);
export const enpsGroup = (v) => (v == null ? null : v >= 9 ? "Promoter" : v >= 7 ? "Passive" : "Detractor");

/* One person's response in one round → every score the product shows.
   `answers` = { [questionId]: value }; `profile` gives the office / home hours for Hybrid weighting. */
export function scoreResponse(survey, answers, profile = {}) {
  const { questions, explorers } = indexSurvey(survey);
  const hours = { office: profile.officeHours || 0, home: profile.homeHours || 0 };
  const q = {};
  for (const question of questions) {
    if (question.section === "profile" && question.group !== "hpq") continue;
    const s = scoreAnswer(survey, question, answers[question.id], hours);
    if (s != null) q[question.id] = s;
  }
  // Drivers and Explorers: the mean of their *scored* questions (shown-separately questions never count).
  const counted = questions.filter((x) => x.status === "scored" && q[x.id] != null);
  const byDriver = {}, byExplorer = {};
  for (const x of counted) {
    if (x.driver) (byDriver[x.driver] = byDriver[x.driver] || []).push(q[x.id]);
    (byExplorer[x.section] = byExplorer[x.section] || []).push(q[x.id]);
  }
  const drivers = Object.fromEntries(Object.entries(byDriver).map(([k, v]) => [k, mean(v)]));
  const explorerScores = Object.fromEntries(explorers.map((e) => [e.id, mean(byExplorer[e.id] || [])]));
  const overall = mean(Object.values(explorerScores));
  // Values worked out from the answers.
  const enpsAnswer = answers["CC2.3"];
  const wellbeing = Object.fromEntries(WELLBEING.map(({ driver, label }) => [label, { score: drivers[driver] ?? null, level: wellbeingLevel(drivers[driver]) }]));
  const h1 = answers["PRO16.1"], h3 = answers["PRO16.3"];
  return {
    questions: q, drivers, explorers: explorerScores, overall, status: statusOf(overall),
    enps: enpsAnswer == null ? null : { answer: enpsAnswer, group: enpsGroup(enpsAnswer) },
    wellbeing,
    hpq: h3 == null ? null : { absolute: h3 * 10, relative: h1 ? Math.min(2, Math.max(0.25, h3 / h1)) : null },
  };
}

/* eNPS for a set of answers (0 to 10): % Promoters − % Detractors. */
export function enpsOf(answers) {
  const v = answers.filter((x) => x != null);
  if (!v.length) return null;
  const p = v.filter((x) => x >= 9).length, d = v.filter((x) => x <= 6).length;
  return Math.round(((p - d) / v.length) * 100);
}

/* Work model from contracted hours (survey.derived: workModel). */
export const workModelOf = ({ officeHours = 0, homeHours = 0 }) => (homeHours > 0 && officeHours > 0 ? "Hybrid" : homeHours > 0 ? "Home" : "Office");
