/* ================================================================== */
/* THE SCORE WIDGET AND THE INDEX — one widget each, for any subject.    */
/*                                                                      */
/* Product direction: there is ONE Score widget. The same card shows the */
/* organisation's score, a team's, a group's (a department, an age band, */
/* a work model…), one person's, a cluster's, an Explorer's or a        */
/* Driver's. What goes on it depends on the context: WHO it is about     */
/* (a population of people, or one person) and WHAT score it is (the     */
/* overall score, a cluster, an Explorer, a Driver). One person has no   */
/* headcount, participation or people split; a Driver has no parts to    */
/* split. The Score card stays on the score and a little of its meaning. */
/*                                                                      */
/* There is ONE Index too: any score that breaks down into parts. The    */
/* score sits in the centre and its parts make a ring around it. A 2x2   */
/* goes one layer deeper, a 3x3 two layers. The overall score has two    */
/* layers under it (Explorers, then Drivers), so it has both sizes; an    */
/* Explorer or a cluster has one (its Drivers), so it is 2x2 only; a      */
/* Driver has nothing below it in the score model, so it has no Index.    */
/*                                                                      */
/* Pure data, no React: the cards (widgets/ScoreCard.jsx, RingIndex.jsx), */
/* the Widget Builder and the Developer pages all read these tables.      */
/* ================================================================== */

/* WHO the score is about. `people`: it covers more than one person, so a headcount, a participation rate and how
   people split across the statuses can be shown. `invites`: whether the number invited is usually known. */
export const WHO = [
  { id: "org", name: "Organisation", title: "Org", people: true, invites: "always", note: "Everyone who was invited." },
  { id: "team", name: "Team", title: "Team", people: true, invites: "always", note: "A manager's team. Not in the prototype's data yet (the data has no reporting lines)." },
  { id: "group", name: "Group", title: "{group} Group", people: true, invites: "when the invite list carries the grouping", note: "People who share a profile answer: department, site, age band, tenure, work model, job level and so on." },
  { id: "person", name: "Person", title: "Your", people: false, invites: "never", note: "One person's own answers. Nothing about anyone else." },
];

/* WHAT the score is. `parts`: the layer under it; `layers`: how many layers of parts sit under it. */
export const WHAT = [
  { id: "overall", name: "Overall score", parts: "Explorers", layers: 2, title: "Score", note: "The mean of the Explorers." },
  { id: "cluster", name: "Cluster", parts: "Drivers", layers: 1, title: "{name} Score", note: "A set of Drivers put together for one question (Sleep and Stress, say)." },
  { id: "explorer", name: "Explorer", parts: "Drivers", layers: 1, title: "{name} Score", note: "One of the twelve areas of the survey." },
  { id: "driver", name: "Driver", parts: null, layers: 0, title: "{name} Score", note: "The smallest scored unit. Its questions are answers, not parts of the score model." },
];
export const whoById = (id) => WHO.find((w) => w.id === id);
export const whatById = (id) => WHAT.find((w) => w.id === id);

/* Everything a Score card can carry, and when it may. `can(who, what)` → true, or a plain reason it can't. */
export const SCORE_ELEMENTS = [
  { id: "score", name: "Score", can: () => true, note: "Always. The number on the survey's scale, coloured by its status." },
  { id: "change", name: "Change since the round before", can: () => true, note: "Whenever there is an earlier round to compare with." },
  { id: "date", name: "Round date", can: () => true, note: "When the round closed." },
  { id: "status", name: "Status", can: () => true, note: "Flourishing, Striving or Struggling, from the score." },
  { id: "headcount", name: "Headcount", can: (who) => (who.people ? true : "One person"), note: "How many people it covers: everyone invited where that is known, otherwise everyone who answered." },
  { id: "participation", name: "Participation rate", can: (who) => (!who.people ? "One person" : who.invites === "always" ? true : `Only ${who.invites}`), note: "Answered ÷ invited." },
  { id: "people", name: "People by status", can: (who) => (who.people ? true : "One person has one status"), note: "How many people are Flourishing, Striving and Struggling on this score." },
  { id: "parts", name: "Parts by status", can: (who, what) => (what.parts ? true : "A Driver has no parts"), note: "How the score's parts (its Explorers or Drivers) split across the statuses." },
];

export function scoreElements(whoId, whatId) {
  const who = whoById(whoId), what = whatById(whatId);
  return SCORE_ELEMENTS.map((e) => { const r = e.can(who, what); return { ...e, ok: r === true, why: r === true ? null : r }; });
}
export const allowedElements = (whoId, whatId) => scoreElements(whoId, whatId).filter((e) => e.ok).map((e) => e.id);

/* What a card shows by default, from what it may show. A 2x2 has room for one evidence bar: a population shows how its
   people split (who is where matters most for a group of people); one person shows how their parts split. */
export function defaultElements(whoId, whatId, size) {
  const ok = new Set(allowedElements(whoId, whatId));
  const pick = (ids) => ids.filter((id) => ok.has(id));
  if (size === "1x1") return pick(ok.has("headcount") ? ["score", "change", "date", "headcount", "participation"] : ["score", "change", "date", "status"]);
  return ok.has("people")
    ? pick(["score", "change", "date", "headcount", "participation", "people"])
    : pick(["score", "change", "date", "status", "parts"]);
}

/* The card's title: who + what. "Org Score", "Your Score", "IT Group Score", "Physical Health Score",
   "Your Sleep Score", "IT Group · Sleep Score". */
export function scoreTitle(whoId, whatId, { name, group } = {}) {
  const who = whoById(whoId);
  const whoWord = who.title.replace("{group}", group || "Group");
  if (whatId === "overall") return `${whoWord} Score`;
  if (whoId === "org") return `${name} Score`;
  if (whoId === "person") return `Your ${name} Score`;
  return `${whoWord} · ${name} Score`;
}

/* Groups and teams smaller than this never show a score (the survey's privacy rule). */
export const MIN_GROUP = 5;

/* ---- the Index --------------------------------------------------------- */
/* The sizes an Index may take for a score, from how many layers of parts it has. */
export function indexSizes(whatId) {
  const layers = whatById(whatId)?.layers || 0;
  return layers >= 2 ? ["2x2", "3x3"] : layers === 1 ? ["2x2"] : [];
}
export function indexBlocked(whatId) {
  return indexSizes(whatId).length ? null : "A Driver has no parts to break down into, so it has no Index. Use the Score widget.";
}
/* The layers each size draws, in words. */
export const INDEX_LAYERS = {
  "2x2": "The score in the centre and one ring: its parts (the Explorers of the overall score, the Drivers of an Explorer or a cluster).",
  "3x3": "The same, plus a second ring that splits each part into its own parts (each Explorer into its Drivers). Only a score with two layers under it.",
};
