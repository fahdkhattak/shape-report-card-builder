import { buildSpec } from "../../lib/generativeEngine.js";
import { extractTopics } from "../../lib/topicResolver.js";
import { subjectFromPrompt, isOverallAsk } from "../../lib/scopeSubject.js";
import { dimensionRankedRows } from "../../lib/dataset.js";
import { STORIES, storyById, suggestStories, insertStory } from "./storyCatalog.jsx";
import { VIZ_OPTIONS } from "../chat/GeneratedWidgetPreview.jsx";
import { rankForms } from "../../lib/generativeEngine.js";
import { FORMS, formById, rankSubjectForms, buildFormSpec, rebuildFormSpec, axisFromText, optionsFromPrompt, pickGroup, pickPair, GROUP_AXES } from "../../lib/subjectForms.js";
import { findGroups } from "../../lib/scopeData.js";
import { statusName } from "../../lib/bands.js";

/* ================================================================== */
/* BUILDER ENGINE — turns a description into a widget + a suggested     */
/* Scope, and applies plain-language refinements ("add actions", "make   */
/* it a gauge", "call it ..."). Rule-based, like lib/generativeEngine.js  */
/* — it never contradicts the request, but it isn't language              */
/* understanding. A real model would replace `refine`, not extend it.     */
/*                                                                        */
/* A built widget is { prompt, spec, stories: string[] }: `prompt` fixes   */
/* what the widget is about (re-resolved to real data wherever it's        */
/* shown), `spec` is the widget card, `stories` is the Scope, in order.    */
/* ================================================================== */
export const weakestAreas = () => dimensionRankedRows().slice(-3).reverse().map((r) => r[0]);

export function startingChips() {
  return weakestAreas().map((d) => ({ label: d, prompt: `How is ${d} doing?` }));
}

/* Things worth trying — one for each kind of case, so the empty screen shows what the builder can do. */
export function caseIdeas() {
  const [a, b] = weakestAreas();
  return [
    { label: "Org score", prompt: "Give me the overall picture" },
    { label: "The full story", prompt: "Tell me the full story of the organisation" },
    { label: "A team's score", prompt: "How is the IT team doing?" },
    { label: "Remote vs Onsite", prompt: "Compare Remote and Onsite" },
    { label: `${a} vs ${b}`, prompt: `Compare ${a} vs ${b}` },
    { label: "Health check", prompt: "Run a health check on the organisation" },
    { label: "What if we lifted the weakest?", prompt: "What if we lifted the weakest parts of the organisation?" },
    { label: "Heat strip", prompt: "Show me every Explorer round by round" },
  ];
}

const vizLabel = (id) => formById(id)?.name || VIZ_OPTIONS.find((o) => o.id === id)?.label || id;
const sizeChip = (spec) => {
  const def = spec.vizType === "form" ? formById(spec.form) : null;
  if (!def) return null;
  return spec.size === "1x1" && def.sizes.includes("2x2") ? "Make it bigger" : spec.size === "2x2" && def.sizes.includes("1x1") ? "Make it smaller" : null;
};
/* Suggestions that fit what was just built — a few of the other cases, so it's clear what is possible. */
function openingChips(built, subject) {
  const f = built.spec.vizType === "form" ? built.spec.form : null;
  const out = [sizeChip(built.spec)];
  if (subject.kind === "overall") out.push(f === "story" ? "Show it as an index" : "Tell me the full story", "Run a health check");
  else if (subject.pair) out.push("What if we lifted the weakest?", "Show it as a heat strip");
  else if (subject.scoreOf) out.push(f === "team" ? "Compare it with Remote" : "How is the IT team doing?", f === "check" ? "Make it a gauge" : "Run a health check");
  else out.push("Make it a gauge");
  if (f === "goal") out.push("Set a target of 80");
  return out.filter(Boolean).slice(0, 3);
}
const kindOf = (spec) => (spec.vizType === "form" ? spec.form : spec.vizType);

/* A widget about several things at once ("sleep and stress") is about their
   cluster, so a single-value form (number, dial, line, status) must show the
   cluster's own score — not just the first topic's, under a title naming both. */
export function fitToSubject(spec, subject) {
  if (subject.kind !== "cluster" || !subject.series?.length) return spec;
  const sr = subject.series, last = sr[sr.length - 1], prev = sr[sr.length - 2] ?? last;
  const payloads = {
    metric: { value: last, delta: last - prev },
    gauge: { value: last },
    trend: { points: sr },
    status: { status: statusName(last) },
  };
  if (!payloads[spec.vizType]) return spec;
  return { ...spec, payload: payloads[spec.vizType], real: true };
}

export function buildWidget(prompt) {
  const subject = subjectFromPrompt(prompt);
  if (!subject) return null;
  // The widget is built from the same topics the Scope reads, so the two always agree.
  const spec = buildFormSpec(rankSubjectForms(prompt, subject)[0], subject, { options: optionsFromPrompt(prompt) });
  return { prompt, spec, stories: suggestStories(subject) };
}

export function openingReply(built) {
  const subject = subjectFromPrompt(built.prompt);
  const names = built.stories.map((id) => storyById(id).name);
  return {
    text: `I built **${built.spec.title}** as a ${vizLabel(kindOf(built.spec)).toLowerCase()} widget (${built.spec.size}), and opened a Scope for it with ${names.length} Stories: ${names.join(", ")}.\n\nChange the widget type, size or options above, remove, reorder or add Stories on the right — or tell me what to change.`,
    chips: openingChips(built, subject),
  };
}

export function noMatchReply() {
  return {
    text: "I couldn't match that to anything the survey measures. Name a topic — an Explorer like Employee Engagement or a Driver like Sleep — and I'll build from there.",
    chips: weakestAreas().map((d) => `How is ${d} doing?`),
  };
}

/* ---- refinement ------------------------------------------------------ */
const STORY_WORDS = {
  summary: ["summary", "overview"],
  distribution: ["distribution", "who is where", "how many people", "people in each status"],
  changes: ["what changed", "movers", "biggest change", "biggest changes", "gains", "drops", "risers", "fallers"],
  areas: ["areas to focus", "focus areas"],
  gap: ["gap", "gaps", "between groups", "inequality"],
  connected: ["connected", "moves with", "related", "correlat", "linked", "what drives", "what affects"],
  priority: ["priority", "priorities", "priority map", "where to focus", "fix first"],
  wellbeing: ["mental well-being", "mental wellbeing", "well-being severity", "severity", "low mood", "anxiety and stress"],
  healthage: ["health age", "healthage", "younger or older", "older or younger"],
  spread: ["spread", "how scores are spread", "histogram", "range of scores", "variation"],
  bright: ["bright spot", "bright spots", "what's working", "best groups", "doing well"],
  reach: ["within reach", "quick win", "quick wins", "closest to", "next level"],
  rank: ["rank", "ranking", "how it ranks", "compared to other", "versus other"],
  goal: ["goal", "target", "pace", "on track"],
  coverage: ["coverage", "who answered", "participation", "response rate", "responses"],
  meaning: ["meaning", "what it means", "what this means"],
  breakdown: ["breakdown", "what contributes", "what's behind", "parts"],
  diagnostic: ["diagnostic", "stand out", "stands out", "strongest", "weakest", "pressure point"],
  composition: ["composition", "demographic", "by group", "groups", "who is", "by gender", "by department"],
  "composition-donut": ["donut", "pie chart", "composition donut"],
  actions: ["action", "what can i do", "advice", "guidance", "playbook"],
  comparison: ["comparison", "benchmark", "team vs", "me vs"],
  trend: ["trend", "history", "over time", "across rounds"],
  resource: ["resource", "guide", "support option"],
  methodology: ["methodology", "method", "how it's calculated", "how it is calculated", "calculated", "how it works"],
  upgrade: ["upgrade", "add-on", "addon", "offer"],
  citation: ["citation", "source", "cite"],
  questionnaire: ["questionnaire", "questions"],
  video: ["video"],
};
/* Words that ask for a widget type. Order matters: the first match wins. */
const FORM_WORDS = [
  ["story", /\b(story|big picture|full picture)\b/],
  ["index", /\b(index|wheel)\b/],
  ["check", /\b(health check|check-?up|checklist)\b/],
  ["whatif", /\b(what if|simulation|simulate)\b/],
  ["heat", /\b(heat ?strip|heat ?map|heat|grid|matrix)\b/],
  ["momentum", /\b(momentum|streak)\b/],
  ["duel", /\b(head to head|head-to-head|versus|vs)\b/],
  ["team", /\bteam\b/],
  ["gauge", /\b(gauge|dial)\b/],
  ["profile", /\b(radar|spider|profile)\b/],
  ["scatter", /\bscatter/],
  ["spread", /\b(spread|histogram|distribution)\b/],
  ["history", /\b(trend line|line chart|line graph|history|trend)\b/],
  ["people", /\b(people|who is where|how many)\b/],
  ["focus", /\b(focus|worst group)\b/],
  ["movers", /\b(movers|biggest changes?)\b/],
  ["goal", /\bgoal\b/],
  ["groups", /\b(bar chart|bar graph|bars|groups?)\b/],
  ["parts", /\b(ranked list|ranking|list|drivers|factors|parts)\b/],
  ["status", /\b(status badge|status)\b/],
  ["score", /\b(number|single number|metric|score)\b/],
];
const CASE_FORMS = new Set(["story", "index", "check", "whatif", "heat", "momentum", "duel", "team"]);
/* A spec to carry the title forward from when the current widget isn't one of the new forms. */
const prevOf = (spec) => (spec.vizType === "form" ? spec : { ...spec, autoTitle: spec.title, options: {} });

// Match at a word start so "source" never fires inside "resource".
const has = (t, words) => words.some((w) => new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(t));
// "composition donut" names the Donut form, not both forms of Composition.
const findStories = (t) => { const ids = Object.entries(STORY_WORDS).filter(([, w]) => has(t, w)).map(([id]) => id); return ids.includes("composition-donut") ? ids.filter((id) => id !== "composition") : ids; };

/* Returns { reply: {text, chips?}, built? , reset? } given the user's message. */
export function refine(text, built) {
  const t = text.toLowerCase();
  const subject = subjectFromPrompt(built.prompt);

  // rename
  const rename = text.match(/(?:call it|rename (?:it )?(?:to)?|title (?:it)?|name it)\s+["“]?(.+?)["”]?\s*$/i);
  if (rename) {
    return { built: { ...built, spec: { ...built.spec, title: rename[1].trim() } }, reply: { text: `Renamed to **${rename[1].trim()}**.` } };
  }

  // widget size / target / group axis — tuning the widget in place
  const isForm = built.spec.vizType === "form";
  const asksSize = /\b(bigger|larger|expand|enlarge|2\s?x\s?2|full size)\b/.test(t) ? "2x2" : /\b(smaller|compact|shrink|1\s?x\s?1|tiny)\b/.test(t) ? "1x1" : null;
  if (asksSize && !/\b(remove|add|include)\b/.test(t)) {
    if (!isForm) return { reply: { text: "This widget type only comes in one size. Pick another widget type above for a 1×1 or 2×2." } };
    const def = formById(built.spec.form);
    if (!def.sizes.includes(asksSize)) return { reply: { text: `${def.name} only comes as ${def.sizes.join(" / ")}.` } };
    if (built.spec.size === asksSize) return { reply: { text: `It's already ${asksSize}.` } };
    return { built: { ...built, spec: rebuildFormSpec(built.spec, subject, { size: asksSize }) }, reply: { text: `Made it ${asksSize}.` } };
  }
  const tgt = t.match(/\b(?:target|goal)\b\D{0,12}(\d{2,3})\b/) || t.match(/\breach (\d{2,3})\b/);
  if (tgt && subject.series?.length) {
    const target = Math.max(10, Math.min(100, Number(tgt[1])));
    return { built: { ...built, spec: rebuildFormSpec(prevOf(built.spec), subject, { form: "goal", options: { target } }) }, reply: { text: `Set a target of **${target}** — the widget now shows how far the score is from it.` } };
  }
  // a different subject entirely ("Compare Sleep vs Stress" while on Physical Health, or "the overall story")
  {
    const named = extractTopics(text).filter((x) => t.includes(x.toLowerCase()));
    const differs = named.length > 0 && !named.every((n) => subject.topics.includes(n));
    const overallNew = isOverallAsk(text) && subject.kind !== "overall";
    const storyEdit = findStories(t).length > 0 && /\b(remove|drop|delete|add|include)\b/.test(t);
    if ((differs || overallNew) && !storyEdit) {
      const fresh = buildWidget(text);
      if (fresh) return { built: fresh, reply: openingReply(fresh), fresh: true };
    }
  }

  // a named team / group, or two to compare ("how is IT doing", "compare Remote and Onsite")
  const named = subject.scoreOf ? findGroups(text) : [];
  if (named.length && !/\b(remove|drop|delete)\b/.test(t)) {
    if (named.length >= 2 && named[0].axis === named[1].axis) {
      const o = { axis: named[0].axis, a: named[0].group, b: named[1].group };
      return { built: { ...built, spec: rebuildFormSpec(prevOf(built.spec), subject, { form: "versus", options: o }) }, reply: { text: `Set **${o.a}** against **${o.b}**. Groups under 5 people are never shown.` } };
    }
    const g = named[0];
    // Already a Versus widget and one group is named: swap the first side.
    if (isForm && built.spec.form === "versus" && !/\bteam\b/.test(t)) {
      const cur = pickPair(subject, built.spec.options);
      const o = { axis: g.axis, a: g.axis === cur.axis ? cur.a : g.group, b: g.axis === cur.axis ? g.group : cur.b };
      if (o.a !== o.b) return { built: { ...built, spec: rebuildFormSpec(prevOf(built.spec), subject, { options: o }) }, reply: { text: `Now comparing **${o.a}** with **${o.b}**.` } };
    }
    return { built: { ...built, spec: rebuildFormSpec(prevOf(built.spec), subject, { form: "team", options: { axis: g.axis, group: g.group } }) }, reply: { text: `Showing **${g.group}** (${g.axisLabel.toLowerCase()}). Groups under 5 people are never shown.` } };
  }
  const liftAsk = t.match(/\b(?:lift|raise|bring up|improve|fix)\b\D{0,24}?(\d)\b/) || t.match(/\bweakest (\d)\b/);
  if (liftAsk && subject.children.length >= 3) {
    const lift = Math.max(1, Math.min(5, Number(liftAsk[1])));
    return { built: { ...built, spec: rebuildFormSpec(prevOf(built.spec), subject, { form: "whatif", options: { lift } }) }, reply: { text: `Lifting the **${lift}** weakest ${subject.childNoun.toLowerCase()}${lift === 1 ? "" : "s"} to 70 and showing what the score would add up to.` } };
  }
  const axis = subject.scoreOf ? axisFromText(t) : null;
  if (axis && /\b(by|per|across|split|compare|group)\b/.test(t) && !/\b(remove|drop|delete)\b/.test(t)) {
    const label = GROUP_AXES.find((a) => a.key === axis).label;
    return { built: { ...built, spec: rebuildFormSpec(prevOf(built.spec), subject, { form: "groups", options: { axis } }) }, reply: { text: `Showing ${subject.label} by **${label}**. Groups under 5 people are never shown.` } };
  }

  // widget type
  const wantsChart = /\b(make|turn|change|switch|show|display|use)\b/.test(t) && !/\b(remove|drop|add|include)\b/.test(t);
  const viz = FORM_WORDS.find(([, re]) => re.test(t));
  if (viz && (wantsChart || /chart|graph|widget|gauge|dial|radar/.test(t) || CASE_FORMS.has(viz[0])) && !/\b(remove|drop|add|include)\b/.test(t)) {
    const [id] = viz;
    const def = formById(id);
    if (def) {
      const why = def.blocked(subject);
      if (why) return { reply: { text: `I can't make that a ${def.name.toLowerCase()} — ${why.charAt(0).toLowerCase() + why.slice(1)}.` } };
      return { built: { ...built, spec: rebuildFormSpec(prevOf(built.spec), subject, { form: id }) }, reply: { text: `Switched the widget to ${def.name.toLowerCase()}.` } };
    }
    const opt = VIZ_OPTIONS.find((o) => o.id === id);
    if (opt?.needsTwoTopics && subject.topics.length < 2) return { reply: { text: `${opt.label} needs two topics to compare, and this widget has one.` } };
    const spec = { ...fitToSubject(buildSpec(id, subject.topics, built.prompt), subject), title: built.spec.title };
    return { built: { ...built, spec }, reply: { text: `Switched the widget to a ${vizLabel(id).toLowerCase()}.` } };
  }

  // add / remove Stories
  const targets = findStories(t);
  const removing = /\b(remove|drop|delete|without|hide|get rid of|no more)\b/.test(t);
  const adding = /\b(add|include|with|want|need|also|show me|put in)\b/.test(t);
  if (targets.length && (removing || adding)) {
    let stories = built.stories;
    const notes = [];
    targets.forEach((id) => {
      const def = storyById(id);
      if (removing) {
        if (stories.includes(id)) { stories = stories.filter((x) => x !== id); notes.push(`removed ${def.name}`); }
        else notes.push(`${def.name} wasn't in the Scope`);
      } else {
        const why = def.blocked(subject);
        if (why) notes.push(`can't add ${def.name} — ${why.charAt(0).toLowerCase() + why.slice(1)}`);
        else if (stories.includes(id)) notes.push(`${def.name} is already in the Scope`);
        else { stories = insertStory(stories, id); notes.push(`added ${def.name}`); }
      }
    });
    const msg = notes.join("; ");
    return { built: { ...built, stories }, reply: { text: msg.charAt(0).toUpperCase() + msg.slice(1) + "." } };
  }

  // a new subject → a fresh widget
  const next = extractTopics(text).length || isOverallAsk(text) ? buildWidget(text) : null;
  if (next) return { built: next, reply: openingReply(next), fresh: true };

  return {
    reply: {
      text: "I can add or remove Stories, change the chart type, rename the widget, or start a new one from a topic.",
      chips: ["Add a resource", "Remove the trend", "Make it a gauge"],
    },
  };
}

/* ---- the widget-type picker (shared by both builder screens) ------------------ */
export function pickerOptions(built, subject) {
  const cur = kindOf(built.spec);
  const ranked = rankSubjectForms(built.prompt, subject);
  const out = ranked.map((id, i) => ({ id, label: formById(id).name, good: i < 3 || id === cur, on: id === cur, why: formById(id).why }));
  if (subject.topics.length >= 2) {
    const lr = rankForms(built.prompt, subject.topics);
    VIZ_OPTIONS.filter((o) => o.id === "scatter" || o.id === "insight" || o.id === "bar").forEach((o) => {
      const i = lr.indexOf(o.id);
      out.push({ id: o.id, label: o.id === "bar" ? "Compare" : o.label, good: i >= 0 && i < 2, on: o.id === cur });
    });
  }
  return out;
}

export function chooseKind(built, subject, id) {
  if (formById(id)) return { ...built, spec: rebuildFormSpec(prevOf(built.spec), subject, { form: id }) };
  return { ...built, spec: { ...fitToSubject(buildSpec(id, subject.topics, built.prompt), subject), title: built.spec.title } };
}

export const changeSpec = (built, subject, change) => ({ ...built, spec: rebuildFormSpec(prevOf(built.spec), subject, change) });

export { STORIES, FORMS };
