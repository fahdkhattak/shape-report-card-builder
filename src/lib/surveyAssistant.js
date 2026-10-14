import { extractTopics, titleFromPrompt } from "./topicResolver.js";
import { DIMENSIONS, DIMENSION_DRIVERS, DRIVER_DIMENSION, dimensionValue, driverValue, dimensionRankedRows } from "./dataset.js";
import { questionTypeById } from "./questionTypes.js";
import { nextId } from "./id.js";
import { STRIVING_AT } from "./bands.js";

/* ================================================================== */
/* SURVEY ASSISTANT — the "AI" behind Survey Builder · Studio AI.        */
/* Like lib/generativeEngine.js and the Widget Builder's engine this is   */
/* a rule-based stand-in, not a language model: it never contradicts the   */
/* request and it is grounded in the real survey catalogue (12 dimensions,  */
/* ~45 drivers, and how each scored last round), but it is scripted. A real   */
/* model would replace `draftSurvey`, `improvePrompt` and `interpret`; the    */
/* shapes they return (drafts, proposals, findings) are what the UI is built    */
/* on, so that swap would not touch the screen.                                  */
/*                                                                                */
/* Everything it produces is a PROPOSAL the person accepts — the same              */
/* draft/approve rule the rest of this app follows. Nothing is applied silently.    */
/* ================================================================== */

/* ---- the question bank ------------------------------------------------------- */
/* [noun phrase, positively-worded statement] per driver. Statements are worded so
   that "agree" is always the good answer — the same direction the survey scores in. */
const BANK = {
  Nutrition: ["your eating habits", "I eat well most days."],
  Exercise: ["how active you are", "I get enough physical activity to stay healthy."],
  Sleep: ["your sleep", "I usually get enough sleep to feel rested."],
  Smoking: ["any smoking habits", "I feel in control of any smoking habits I have."],
  Alcohol: ["your alcohol use", "I feel in control of how much alcohol I drink."],
  Stress: ["how you manage stress", "I can manage the stress I feel day to day."],
  Depression: ["your mood", "Most days I feel positive about my life."],
  Anxiety: ["how settled you feel", "I rarely feel anxious or on edge."],
  Resilience: ["how you bounce back", "I recover well when things go wrong."],
  "Work-life balance": ["your work-life balance", "I can keep a healthy balance between work and the rest of my life."],
  Commuting: ["your commute", "My commute is manageable."],
  "Home duties": ["your responsibilities at home", "I can manage my responsibilities at home alongside work."],
  "Support network": ["the support around you", "I have people I can turn to when I need help."],
  "Engaging role": ["how engaging your role is", "My work is interesting and engaging."],
  Workload: ["your workload", "My workload is manageable."],
  Resources: ["the resources you have", "I have the tools and resources I need to do my job well."],
  "Job security": ["your job security", "I feel secure in my job."],
  "R&R": ["recognition and reward", "I am recognised and rewarded fairly for my work."],
  "Career prospects": ["your career prospects", "I can see a future for myself here."],
  Safety: ["safety at work", "I feel safe at work."],
  "Growth and development": ["your growth and development", "I have opportunities to learn and grow in my role."],
  "Sense of importance": ["how important your work feels", "My work matters to the organisation."],
  Trustworthy: ["trust among colleagues", "I can trust the people I work with."],
  Supportive: ["how supportive your colleagues are", "My colleagues support me when I need it."],
  Respectful: ["respect at work", "People here treat each other with respect."],
  Hardworking: ["your team's effort", "My team members pull their weight."],
  "Good communication": ["communication with colleagues", "Information is shared openly in my team."],
  "Relationship with manager": ["your relationship with your manager", "I have a good working relationship with my manager."],
  "Role clarity": ["clarity about your role", "I know what is expected of me."],
  "Handling incompetence": ["how poor performance is handled", "Poor performance is dealt with fairly where I work."],
  Values: ["the organisation's values", "The organisation's values are clear to me."],
  Leaders: ["senior leadership", "I have confidence in our senior leaders."],
  Empowerment: ["how much say you have", "I have enough say in how I do my work."],
  Collaboration: ["collaboration across teams", "Teams here work well together."],
  "Policies and Practices": ["policies and practices", "Our policies and practices are fair and sensible."],
  Morale: ["morale", "Morale in my team is good."],
  Pride: ["pride in the organisation", "I am proud to work here."],
  Policies: ["workplace policies", "I understand the policies that apply to me."],
  People: ["how people are looked after", "The organisation looks after its people well."],
  Comfort: ["how comfortable your workspace is", "My workspace is comfortable to work in."],
  Noise: ["noise levels", "Noise does not get in the way of my work."],
  "General Quality": ["the quality of your workplace", "My workplace is well kept and fit for purpose."],
  Flexibility: ["flexibility", "I have enough flexibility in when and where I work."],
  "Distractions and disruptions": ["interruptions", "I can focus without constant interruptions."],
  IT: ["the technology you use", "The technology I use helps rather than hinders me."],
};

export const DEPTHS = [
  { id: "quick", label: "Quick", per: 1, hint: "One statement per explorer" },
  { id: "standard", label: "Standard", per: 2, hint: "A statement and a 0–10 rating" },
  { id: "thorough", label: "Thorough", per: 3, hint: "Adds an open question" },
];

const LIKERT = () => questionTypeById("likert").defaultTypeData();
const SCALE = () => questionTypeById("scale-0-10").defaultTypeData();
const FREE = () => ({ placeholder: "Share your thoughts…", multiline: true });

/* The questions an explorer (a driver) can ask, in the order they're worth adding. */
export function questionsForDriver(driver, depth = "standard") {
  const [noun, statement] = BANK[driver] || [driver.toLowerCase(), `I am satisfied with ${driver.toLowerCase()}.`];
  const all = [
    { type: "likert", prompt: statement, typeData: LIKERT() },
    { type: "scale-0-10", prompt: `How would you rate ${noun}?`, typeData: SCALE() },
    { type: "freetext", prompt: `What one change would improve ${noun}?`, typeData: FREE() },
  ];
  return all.slice(0, DEPTHS.find((d) => d.id === depth)?.per ?? 2).map((q) => ({ id: `aq-${nextId()}`, ...q }));
}

/* ---- time ---------------------------------------------------------------------- */
const SECONDS = { likert: 9, "multiple-choice": 12, "scale-0-10": 8, "scale-1-10": 8, "smiley-5": 6, input: 15, freetext: 45 };
export function questionSeconds(q) {
  const type = q.questionType || q.type;
  if (type === "toggle-board") return 6 * (q.typeData?.rows?.length || 3);
  if (type === "custom") return 12 * (q.typeData?.fields?.length || 2);
  return SECONDS[type] ?? 10;
}
export function surveySeconds(blueprint) {
  return blueprint.dimensions.reduce((n, d) => n + d.explorers.reduce((m, e) => m + e.questions.reduce((k, q) => k + questionSeconds(q), 0), 0), 0);
}
export function minutesLabel(seconds) {
  if (seconds < 30) return "under a minute";
  const m = Math.max(1, Math.round(seconds / 60));
  return `about ${m} min`;
}

/* ---- drafting a survey from a brief ---------------------------------------------- */
const STOP = /\b(survey|questionnaire|questions?|about|around|for|our|the|a|an|on|into|of|to|get|build|create|make|draft|generate|me|us|we|want|need|ask|people|employees|staff|team)\b/gi;

/* A draft survey for what someone wants to learn. Picks real Explorers/Drivers by name
   (only what the brief literally names; the resolver's near-matches are dropped), and
   tells you why: each area carries the last round's score, so the survey asks about
   what the data says is worth asking about. */
export function draftSurvey(brief, depth = "standard") {
  const lower = brief.toLowerCase();
  const found = extractTopics(brief, 8);
  const named = found.filter((t) => lower.includes(t.toLowerCase()));
  const notes = [];
  let picks = named.length ? named : found.slice(0, 2);
  let fallback = false;
  if (!picks.length) {
    // Nothing recognised — start from where people are struggling most.
    picks = dimensionRankedRows().slice(-3).reverse().map((r) => r[0]);
    fallback = true;
    notes.push("I didn't recognise a topic in that, so I started from your three weakest Explorers.");
  }

  // dimension -> the drivers to ask about
  const byDim = new Map();
  const asDim = picks.filter((t) => DIMENSIONS.includes(t));
  picks.forEach((t) => {
    if (DIMENSIONS.includes(t)) byDim.set(t, [...DIMENSION_DRIVERS[t]]);
  });
  picks.forEach((t) => {
    const dim = DRIVER_DIMENSION[t];
    if (!dim || asDim.includes(dim)) return;
    byDim.set(dim, [...(byDim.get(dim) || []), t]);
  });

  let budget = 10; // explorers
  const dimensions = [...byDim.entries()].map(([dim, drivers]) => {
    // Weakest first: the survey leads with what needs the most understanding.
    const ordered = [...new Set(drivers)].sort((a, b) => driverValue(a) - driverValue(b)).slice(0, Math.max(0, budget));
    budget -= ordered.length;
    const dv = Math.round(dimensionValue(dim));
    return {
      id: `ad-${nextId()}`, name: dim,
      why: `${dim} scored ${dv} last round${dv < STRIVING_AT ? ", the lowest band" : ""}.`,
      explorers: ordered.map((d) => ({
        id: `ae-${nextId()}`, name: d,
        why: `${d} scored ${Math.round(driverValue(d))} last round.`,
        questions: questionsForDriver(d, depth),
      })),
    };
  }).filter((d) => d.explorers.length);

  if (named.length || fallback) notes.push(`${dimensions.length === 1 ? "One area" : `${dimensions.length} areas`}, ${dimensions.reduce((n, d) => n + d.explorers.length, 0)} explorers, each opening with a statement people can agree or disagree with.`);
  const name = fallback ? "Wellbeing check-in" : `${titleFromPrompt(brief, picks.slice(0, 2))} pulse`;
  return { brief, depth, name, dimensions, notes, fallback };
}

export function draftCounts(draft, excluded = new Set()) {
  let explorers = 0, questions = 0, seconds = 0;
  draft.dimensions.forEach((d) => d.explorers.forEach((e) => {
    if (excluded.has(e.id)) return;
    explorers += 1;
    e.questions.forEach((q) => { questions += 1; seconds += questionSeconds(q); });
  }));
  return { explorers, questions, seconds };
}

/* ---- wording ----------------------------------------------------------------------- */
const FILLER = [
  [/\b(very|really|quite|extremely|incredibly|truly)\s+/gi, ""],
  [/\bin order to\b/gi, "to"],
  [/\bdue to the fact that\b/gi, "because"],
  [/\bat this point in time\b/gi, "now"],
  [/\bapproximately\b/gi, "about"],
  [/\butili[sz]e\b/gi, "use"],
  [/\bI would say that\s+/gi, ""],
  [/\bin general,?\s+/gi, ""],
  [/\bit is the case that\s+/gi, ""],
  [/\bplease (rate|tell us|indicate)\b/gi, (_, v) => v],
];
const LEADING = [
  [/^don'?t you (agree|think) that\s+/i, "To what extent do you agree that "],
  [/^wouldn'?t you (say|agree) that\s+/i, "To what extent do you agree that "],
  [/^do you agree that\s+/i, "To what extent do you agree that "],
  [/\b(obviously|clearly|surely|of course|naturally|undeniably)\s+/gi, ""],
  [/\bas everyone knows,?\s+/gi, ""],
];
const LOADED = { terrible: "poor", awful: "poor", horrible: "poor", amazing: "good", fantastic: "good", excellent: "good", perfect: "good", great: "good" };

function tidy(text, original) {
  let t = text.replace(/\s{2,}/g, " ").replace(/\s+([?.,])/g, "$1").trim();
  t = t.charAt(0).toUpperCase() + t.slice(1);
  // Keep the original's closing punctuation (a statement ends ".", a question "?").
  if (/[?.]$/.test(original.trim()) && !/[?.]$/.test(t)) t += original.trim().slice(-1);
  return t;
}

/* mode: "clearer" | "shorter" | "neutral" → { text, change } or null when there is nothing safe to change. */
export function improvePrompt(prompt, mode) {
  if (!prompt?.trim()) return null;
  let out = prompt;
  const changes = [];
  const apply = (rules, label) => {
    rules.forEach(([re, rep]) => { const next = out.replace(re, rep); if (next !== out) { out = next; if (!changes.includes(label)) changes.push(label); } });
  };
  if (mode === "neutral") {
    apply(LEADING, "Removed leading wording");
    out = out.replace(/\b(terrible|awful|horrible|amazing|fantastic|excellent|perfect|great)\b/gi, (w) => { changes.push(`Replaced “${w}” with a neutral word`); return LOADED[w.toLowerCase()]; });
  } else {
    apply(FILLER, "Cut filler words");
    if (mode === "shorter") {
      apply([[/\bto what extent do you agree that\s+/i, "Do you agree that "], [/\bhow would you rate\b/i, "Rate"], [/\bwhat one change would improve\b/i, "What would improve"]], "Used a shorter phrasing");
    }
  }
  const text = tidy(out, prompt);
  if (text === prompt.trim()) return null;
  return { text, change: [...new Set(changes)].join(" · ") || "Tidied the wording" };
}

/* Does the prompt ask two things at once? Returns the two halves, or null. */
export function splitPrompt(prompt) {
  const m = prompt.match(/^(.{12,}?)\s+(?:and|as well as)\s+(.{12,})$/i);
  if (!m) return null;
  const clean = (s, end) => { const t = s.replace(/[?.]$/, "").trim(); return t.charAt(0).toUpperCase() + t.slice(1) + end; };
  const end = /\?$/.test(prompt.trim()) ? "?" : ".";
  const a = clean(m[1], end), b = clean(m[2], end);
  // Only when the second half can stand alone as a clause.
  return /\b(I|my|me|we|our|you|your|it|they|people|team)\b/i.test(m[2]) || /^\w+ing\b/i.test(m[2]) ? [a, b] : null;
}

/* A better question type for what the prompt actually asks, or null. */
export function suggestType(q) {
  const p = (q.prompt || "").trim().toLowerCase();
  if (!p) return null;
  const type = q.questionType;
  let to = null, why = "";
  if (/^(how many|how old|how long|how much|what is your (age|weight|height))/.test(p)) { to = "input"; why = "It asks for a number, so people should be able to type one."; }
  else if (/^(why|what (one |would |could )|describe|tell us|in your own words)/.test(p)) { to = "freetext"; why = "It asks for an explanation, which needs room to write."; }
  else if (/^how (often|likely|satisfied|would you rate|well)/.test(p)) { to = "scale-0-10"; why = "It asks how much, which a 0–10 scale answers directly."; }
  else if (/\.$/.test(p) && !/\?$/.test(p) && !/^(select|choose)/.test(p)) { to = "likert"; why = "It is a statement, so agree–disagree fits."; }
  if (!to || to === type) return null;
  return { to, label: questionTypeById(to).label, why };
}

/* ---- suggestions --------------------------------------------------------------------- */
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();

/* Questions an explorer is missing: the bank's, minus anything already asked. */
export function suggestQuestions(explorerName, existingPrompts = []) {
  const have = new Set(existingPrompts.map(norm));
  let driver = Object.keys(BANK).find((d) => d.toLowerCase() === explorerName.toLowerCase());
  if (!driver) { const t = extractTopics(explorerName, 3).find((x) => DRIVER_DIMENSION[x]); driver = t; }
  let pool = [];
  if (driver) pool = questionsForDriver(driver, "thorough");
  else {
    const dim = DIMENSIONS.find((d) => d.toLowerCase() === explorerName.toLowerCase()) || extractTopics(explorerName, 3).find((x) => DIMENSIONS.includes(x));
    if (dim) pool = (DIMENSION_DRIVERS[dim] || []).slice(0, 3).flatMap((d) => questionsForDriver(d, "quick"));
  }
  return pool.filter((q) => !have.has(norm(q.prompt))).slice(0, 3);
}

/* Explorers a dimension is missing. */
export function suggestExplorers(dimensionName, existingNames = []) {
  const dim = DIMENSIONS.find((d) => d.toLowerCase() === dimensionName.toLowerCase()) || extractTopics(dimensionName, 3).find((x) => DIMENSIONS.includes(x));
  if (!dim) return { dim: null, explorers: [] };
  const have = new Set(existingNames.map((n) => n.toLowerCase()));
  const explorers = (DIMENSION_DRIVERS[dim] || [])
    .filter((d) => !have.has(d.toLowerCase()))
    .sort((a, b) => driverValue(a) - driverValue(b))
    .map((d) => ({ id: `ae-${nextId()}`, name: d, why: `${d} scored ${Math.round(driverValue(d))} last round.`, questions: questionsForDriver(d, "quick") }));
  return { dim, explorers };
}

/* ---- review ------------------------------------------------------------------------------ */
/* Findings across the survey, or just one question. A finding may carry a `fix` the
   screen turns into a proposal. severity: "issue" (will confuse people) | "tip" | "info". */
export function reviewQuestion(q, where = {}) {
  const out = [];
  const p = (q.prompt || "").trim();
  if (!p) return [{ id: `f-${nextId()}`, severity: "issue", where, message: "This question has no wording yet." }];
  if (improvePrompt(p, "neutral")) out.push({ id: `f-${nextId()}`, severity: "issue", where, message: "The wording nudges people toward an answer.", fix: { kind: "improve", mode: "neutral", label: "Make it neutral" } });
  if (p.length > 140) out.push({ id: `f-${nextId()}`, severity: "tip", where, message: `It runs to ${p.length} characters — people skim long questions.`, fix: { kind: "improve", mode: "shorter", label: "Shorten it" } });
  if (["likert", "scale-0-10", "scale-1-10", "smiley-5"].includes(q.questionType) && splitPrompt(p)) out.push({ id: `f-${nextId()}`, severity: "issue", where, message: "It may ask two things at once, so one answer can't be read cleanly.", fix: { kind: "split", label: "Split into two" } });
  const t = suggestType(q);
  if (t) out.push({ id: `f-${nextId()}`, severity: "tip", where, message: `${t.why} A ${t.label} question fits better.`, fix: { kind: "retype", to: t.to, label: `Switch to ${t.label}` } });
  if (!out.length && improvePrompt(p, "clearer")) out.push({ id: `f-${nextId()}`, severity: "tip", where, message: "There is filler that can go without changing the meaning.", fix: { kind: "improve", mode: "clearer", label: "Tidy it" } });
  return out;
}

export function reviewSurvey(blueprint, numbers = new Map()) {
  const out = [];
  const seen = new Map();
  let free = 0;
  blueprint.dimensions.forEach((d) => {
    if (!d.explorers.length) out.push({ id: `f-${nextId()}`, severity: "issue", where: { dimId: d.id }, message: `“${d.name || "Untitled dimension"}” has no explorers yet.`, fix: { kind: "suggestExplorers", label: "Suggest explorers" } });
    d.explorers.forEach((e) => {
      if (!e.questions.length) out.push({ id: `f-${nextId()}`, severity: "issue", where: { dimId: d.id, expId: e.id }, message: `“${e.name || "Untitled explorer"}” has no questions yet.`, fix: { kind: "suggestQuestions", label: "Suggest questions" } });
      e.questions.forEach((q) => {
        const where = { dimId: d.id, expId: e.id, qId: q.id };
        if (q.questionType === "freetext") free += 1;
        const key = norm(q.prompt || "");
        if (key) { if (seen.has(key)) out.push({ id: `f-${nextId()}`, severity: "issue", where, message: `Question ${numbers.get(q.id) ?? ""} repeats question ${numbers.get(seen.get(key)) ?? ""}.`.replace(/\s+/g, " "), fix: { kind: "remove", label: "Remove the repeat" } }); else seen.set(key, q.id); }
        reviewQuestion(q, where).forEach((f) => out.push({ ...f, message: `Question ${numbers.get(q.id) ?? ""}: ${f.message}`.replace("Question : ", "") }));
      });
    });
  });
  const secs = surveySeconds(blueprint);
  const count = numbers.size;
  if (secs > 8 * 60) out.unshift({ id: `f-${nextId()}`, severity: "tip", where: {}, message: `At ${minutesLabel(secs)} this is long for a pulse survey — completion drops after about 8 minutes.`, fix: { kind: "trim", minutes: 6, label: "Trim to 6 minutes" } });
  if (free > 3) out.push({ id: `f-${nextId()}`, severity: "tip", where: {}, message: `${free} open-text questions is a lot to write — people tend to skip after two or three.` });
  if (count && !out.length) out.push({ id: `f-${nextId()}`, severity: "info", where: {}, message: `No problems found in ${count} questions (${minutesLabel(secs)}).` });
  return out;
}

/* Which questions to drop to fit `minutes`: open text first, then the second rating in an explorer. */
export function trimSurvey(blueprint, minutes, numbers = new Map()) {
  let secs = surveySeconds(blueprint);
  const target = minutes * 60;
  const candidates = [];
  blueprint.dimensions.forEach((d) => d.explorers.forEach((e) => e.questions.forEach((q, i) => {
    let rank = 0;
    if (q.questionType === "freetext") rank = 3;
    else if (["scale-0-10", "scale-1-10", "smiley-5"].includes(q.questionType) && e.questions.some((o) => o.questionType === "likert")) rank = 2;
    else if (i > 0) rank = 1;
    if (rank && e.questions.length > 1) candidates.push({ q, e, rank });
  })));
  candidates.sort((a, b) => b.rank - a.rank);
  const drop = [];
  for (const c of candidates) {
    if (secs <= target) break;
    const left = c.e.questions.filter((x) => !drop.some((d) => d.id === x.id)).length;
    if (left <= 1) continue; // never empty an explorer
    drop.push({ id: c.q.id, prompt: c.q.prompt, number: numbers.get(c.q.id) });
    secs -= questionSeconds(c.q);
  }
  return { drop, after: secs };
}

/* ---- reading what was typed ----------------------------------------------------------------- */
/* → { kind, … }. `ctx` = { hasSurvey, selKind } */
export function interpret(text, ctx) {
  const t = text.trim();
  const l = t.toLowerCase();
  const mins = l.match(/(\d+)\s*(?:min|minute)/);
  if (!ctx.hasSurvey && !/^(help|\?)$/.test(l)) return { kind: "draft", brief: t };
  if (/\b(trim|cut|shorten|reduce|fit)\b.*\b(survey|it|to|down)\b/.test(l) && mins) return { kind: "trim", minutes: Number(mins[1]) };
  if (/how long|how many minutes|duration|time (will|does|to)/.test(l)) return { kind: "time" };
  if (/\b(review|check|audit|proofread|look over)\b/.test(l)) return { kind: /\b(this|selected|question)\b/.test(l) && ctx.selKind === "q" ? "reviewQuestion" : "review" };
  if (/neutral|leading|biased|bias/.test(l)) return { kind: "improve", mode: "neutral" };
  if (/shorter|shorten|concise|trim (this|it)/.test(l)) return { kind: "improve", mode: "shorter" };
  if (/clear|simpl|plain|tidy|reword|rewrite|improve|better wording|wording/.test(l)) return { kind: "improve", mode: "clearer" };
  if (/(add|suggest|more|another|missing).*(explorer|topic|area)/.test(l)) return { kind: "suggestExplorers" };
  if (/(add|suggest|more|another|missing|draft|write).*question|questions for/.test(l)) return { kind: "suggestQuestions" };
  if (/(new|another|different) survey|start (again|over)|from scratch/.test(l)) return { kind: "draft", brief: t };
  if (/^(survey|build|create|draft|make|generate)\b/.test(l) || /\bsurvey (about|on|for)\b/.test(l)) return { kind: "draft", brief: t };
  return { kind: "help" };
}
