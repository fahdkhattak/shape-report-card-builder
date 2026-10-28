import { T, band } from "../../lib/tokens.js";
import { statusOf, sinceText, roundName, LAST, statusCountSeries, focusGroups, rankAmong, groupGaps, withinReach, scoreSpread } from "../../lib/scopeData.js";
import { ROUNDS } from "../../lib/dataset.js";
import { InsightSummaryStory, SummaryP, Strong, statusText, MeaningStory, MethodologyStory } from "../scope/stories/SummaryStories.jsx";
import BreakdownStory from "../scope/stories/BreakdownStory.jsx";
import { StrongestWeakestStory, AreasToFocusStory } from "../scope/stories/DiagnosticStory.jsx";
import { GoalStory, CoverageStory } from "../scope/stories/ExtraStories.jsx";
import { ChangesStory, GroupGapStory, ConnectedStory, PriorityMapStory, SpreadStory, BrightSpotsStory, WithinReachStory, RankStory, SplitBreakdownStory } from "../scope/stories/FamilyStories.jsx";
import CompositionStory from "../scope/stories/CompositionStory.jsx";
import TrendStory from "../scope/stories/TrendStory.jsx";
import ScoreHistoryStory from "../scope/stories/ScoreHistoryStory.jsx";
import { ActionsStoryBar } from "../scope/stories/ActionStories.jsx";
import { ResourceStory, UpgradePathStory, QuestionnaireStory, VideoStory } from "../scope/stories/AddOnStories.jsx";
import { EXPLAINER } from "../scope/stories/explainerVideo.js";
import SeverityBreakdownStory from "../scope/stories/SeverityBreakdown.jsx";
import { orgSeverity } from "../../lib/wellbeing.js";
import { FLOURISHING_AT, STRIVING_AT } from "../../lib/bands.js";
import { fitForm } from "../scope/stories/breakdownRules.js";

/* ================================================================== */
/* STORY CATALOG — the Stories taxonomy (Figma board 13622:35945) as    */
/* data the Widget Builder can reason with: what each Story is, whether  */
/* a given subject can honestly support it, and how to render it.        */
/*   `blocked(subject)` returns a plain-language reason, or null if the   */
/*   Story is available. Unbuildable Stories stay listed — with their    */
/*   reason — so the rules are visible, not hidden.                       */
/*   `suggest` marks the Stories the builder proposes by default.         */
/*   `forms(subject)` / `defaultForm(subject)` on a Story that can be drawn */
/*   more than one way. The host keeps the choice in `options[id].form`    */
/*   and passes it to render as `ctx.options`; an unavailable choice falls   */
/*   back to the default (see formOf).                                      */
/* Order here IS the taxonomy order; new Stories are slotted by it.       */
/* ================================================================== */
const blurbFor = (label, v) =>
  v >= FLOURISHING_AT ? `People are mostly positive about ${label}. It's a strength worth protecting.`
  : v >= STRIVING_AT ? `${label} is mixed. Some people feel it, others don't. Worth looking at where the gaps are.`
  : `${label} is holding scores back. It's a good place to start.`;
export const MEANING = {
  Flourishing: "Most people feel positive about this. The few who don't are where to look next.",
  Striving: "This is mixed. It works well for some people and less well for others, so there's room to improve.",
  Struggling: "This is holding people back. It's one of the best places to start.",
};
/* The one-line headline of an Insight Summary, by status. Exported so the Developer docs show the real copy. */
export const SUMMARY_HEADLINE = (label) => ({ Flourishing: `${label} is a strength right now.`, Striving: `${label} is doing okay, with room to improve.`, Struggling: `${label} is holding scores back.` });
const NO_PARTS = (s) => (s.children.length < 2 ? "Needs two or more parts to break down" : null);

/* Breakdown: the forms the number of parts allows (see breakdownRules.js), and Meaning: a number or the Explorer ring. */
const BREAKDOWN_FORMS = [["radar", "Radar"], ["area", "Area"], ["bars", "Bars"], ["list", "List"], ["zones", "Zones"]];
const breakdownForms = (s) => BREAKDOWN_FORMS.filter(([id]) => fitForm(id, s.children.length).variant === id).map(([id, label]) => ({ id, label }));
/* The form a Story opens in. It follows the widget it belongs to where that makes sense (a Profile widget is a radar, so the
   Breakdown opens as a radar; a Parts widget is a ranked list, so bars), then falls back to the count of parts. */
const breakdownDefault = (s, spec) => {
  const ids = breakdownForms(s).map((f) => f.id);
  const hint = spec?.form === "profile" ? "radar" : spec?.form === "parts" ? "bars" : null;
  if (hint && ids.includes(hint)) return hint;
  return s.children.length >= 3 && s.children.length <= 12 ? "radar" : "bars";
};
const MEANING_FORMS = [{ id: "number", label: "Number" }, { id: "ring", label: "Ring" }];

export const STORIES = [
  {
    id: "summary", name: "Insight Summary", family: "Insight Summary", purpose: "A short, plain-language overview of the insight.", suggest: true,
    blocked: () => null,
    render: (s) => {
      const v = s.series[LAST];
      const status = statusOf(v);
      const head = SUMMARY_HEADLINE(s.label)[status];
      const sorted = [...s.children].sort((a, b) => b.values[LAST] - a.values[LAST]);
      return (
        <InsightSummaryStory headline={head}>
          <SummaryP>{s.label} scores <Strong c={statusText(v)}>{v}</Strong>/100 this round, which is {status}. {sinceText(v - s.series[LAST - 1], roundName(LAST - 1))}.</SummaryP>
          {s.children.length > 1 && (
            <SummaryP>It's built from <b>{s.children.length} {s.childNoun}s</b>. <b>{sorted[0].label}</b> is strongest at {sorted[0].values[LAST]}; <b>{sorted[sorted.length - 1].label}</b> is lowest at {sorted[sorted.length - 1].values[LAST]}.</SummaryP>
          )}
        </InsightSummaryStory>
      );
    },
  },
  {
    id: "meaning", name: "Score Meaning", family: "Score / Status Meaning", purpose: "What the current result means for the reader.", suggest: true,
    // Number and Ring are two looks for one message, not two different views, so it is never placed twice.
    once: true,
    blocked: () => null, forms: () => MEANING_FORMS, defaultForm: (s, spec) => (spec?.form === "gauge" ? "ring" : "number"),
    render: (s, ctx) => {
      const v = s.series[LAST];
      const status = statusOf(v);
      const form = formOf(storyById("meaning"), s, ctx?.options, ctx?.spec);
      return <MeaningStory title="What This Score Is Telling You" value={v} unit="/100" values={s.series} ring={form === "ring"} headline={<>{s.label} scores <span style={{ color: band(v).cs }}>{v}</span>/100, which is {status}.</>} text={MEANING[status]} />;
    },
  },
  {
    id: "breakdown", name: "Breakdown", family: "Breakdown", purpose: "What contributes to the result.", suggest: true,
    blocked: NO_PARTS, forms: breakdownForms, defaultForm: breakdownDefault,
    render: (s, ctx) => {
      const form = formOf(storyById("breakdown"), s, ctx?.options, ctx?.spec);
      return (
        <BreakdownStory
          title="What's Behind This Score" variant={form} noun={s.childNoun}
          line={`See how the ${s.children.length} ${s.childNoun}s behind ${s.label} compare.`}
          items={s.children.map((c) => ({ ...c, blurb: blurbFor(c.label, c.values[LAST]) }))}
          hint={form === "radar" || form === "area" ? "Hover over the chart to see each score. For each answer, the higher the score, the better." : undefined}
        />
      );
    },
  },
  {
    id: "distribution", name: "Who Is Where", family: "Breakdown", purpose: "How many people are Flourishing, Striving or Struggling.",
    blocked: (s) => (s.scoreOf ? null : "Needs per-person scores for this topic"),
    render: (s) => {
      const c = statusCountSeries(s.scoreOf);
      return (
        <SplitBreakdownStory
          title="Who Is Where" line={`How many people are Flourishing, Striving or Struggling on ${s.label}.`}
          parts={[{ label: "Flourishing", color: T.green, counts: c.flourishing }, { label: "Striving", color: T.amber, counts: c.striving }, { label: "Struggling", color: T.red, counts: c.struggling }]}
        />
      );
    },
  },
  {
    id: "diagnostic", name: "Diagnostic", family: "Diagnostic", purpose: "What stands out: the strongest and weakest parts.", suggest: true,
    blocked: NO_PARTS,
    render: (s, ctx) => {
      const r = [...s.children].sort((a, b) => b.values[LAST] - a.values[LAST]);
      return <StrongestWeakestStory actionsCta={!!ctx?.stories?.includes("actions")} noun={s.childNoun} strongest={{ label: r[0].label, value: r[0].values[LAST] }} weakest={{ label: r[r.length - 1].label, value: r[r.length - 1].values[LAST] }} />;
    },
  },
  {
    id: "changes", name: "What Changed", family: "Diagnostic", purpose: "The biggest gains and drops since an earlier round.",
    blocked: NO_PARTS,
    render: (s) => <ChangesStory items={s.children} noun={s.childNoun} />,
  },
  {
    id: "areas", name: "Areas to Focus", family: "Diagnostic", purpose: "The lowest-scoring group on each part of the organisation.",
    blocked: (s) => (s.scoreOf ? null : "Needs per-person scores for this topic"),
    render: (s) => <AreasToFocusStory groups={focusGroups(4, s.scoreOf)} />,
  },
  {
    id: "bright", name: "Bright Spots", family: "Diagnostic", purpose: "The highest-scoring group on each part of the organisation.",
    blocked: (s) => (s.scoreOf ? null : "Needs per-person scores for this topic"),
    render: (s) => <BrightSpotsStory scoreOf={s.scoreOf} label={s.label} />,
  },
  {
    id: "reach", name: "Within Reach", family: "Diagnostic", purpose: "The parts closest to the next status line up.",
    blocked: (s) => (s.children.length < 2 ? "Needs two or more parts" : null),
    render: (s) => <WithinReachStory items={s.children} noun={s.childNoun} />,
  },
  {
    id: "rank", name: "How It Ranks", family: "Diagnostic", purpose: "Where this sits among every Explorer or Driver.",
    blocked: (s) => (s.kind === "dimension" || s.kind === "driver" ? null : "Needs a single Explorer or Driver to rank"),
    render: (s) => <RankStory rank={rankAmong(s)} label={s.label} />,
  },
  {
    id: "gap", name: "Where Gaps Are Widest", family: "Diagnostic", purpose: "The distance between the best and worst group, per way of grouping.",
    blocked: (s) => (s.scoreOf ? null : "Needs per-person scores for this topic"),
    render: (s) => <GroupGapStory scoreOf={s.scoreOf} label={s.label} />,
  },
  {
    id: "connected", name: "What Moves With This", family: "Diagnostic", purpose: "Topics whose scores rise and fall with this one.",
    blocked: (s) => (s.scoreOf ? null : "Needs per-person scores for this topic"),
    render: (s) => <ConnectedStory scoreOf={s.scoreOf} label={s.label} exclude={s.drivers} />,
  },
  {
    id: "priority", name: "Priority Map", family: "Diagnostic", purpose: "Which parts to fix first, protect or watch.",
    blocked: (s) => (s.children.length < 3 ? "Needs three or more parts to place" : null),
    render: (s) => <PriorityMapStory items={s.children} noun={s.childNoun} />,
  },
  {
    id: "spread", name: "How Scores Are Spread", family: "Breakdown", purpose: "How many people sit at each score, not just the average.",
    blocked: (s) => (s.scoreOf ? null : "Needs per-person scores for this topic"),
    render: (s) => <SpreadStory scoreOf={s.scoreOf} label={s.label} />,
  },
  {
    id: "wellbeing", name: "Mental Well-Being", family: "Breakdown", purpose: "How many people sit in each severity band for low mood, anxiety, and stress.",
    blocked: (s) => (s.kind === "overall" ? null : "Needs the whole organisation"),
    render: () => <SeverityBreakdownStory title="Org Mental Well-Being" line="Employees experiencing psychological health symptoms" rows={orgSeverity()} unit="Employees" />,
  },
  {
    id: "healthage", name: "Health Age Drivers", family: "Breakdown", purpose: "How much each driver makes someone younger or older than their age.",
    blocked: () => "Needs ages and a health-age model", render: () => null,
  },
  {
    id: "composition", name: "Composition", family: "Composition", purpose: "Who is represented, and how each group scores.", suggest: true,
    blocked: (s) => (s.scoreOf ? null : "Needs per-person scores for this topic"),
    render: (s) => <CompositionStory scoreOf={s.scoreOf} line={`See who is in each group and how each scores on ${s.label}. Groups under 5 people never show a score.`} />,
  },
  {
    id: "composition-donut", name: "Composition (Donut)", family: "Composition", purpose: "Who is represented, as a donut beside a legend of every group with its size and score.",
    blocked: (s) => (s.scoreOf ? null : "Needs per-person scores for this topic"),
    render: (s) => <CompositionStory form="donut" scoreOf={s.scoreOf} line={`See who is in each group and how each scores on ${s.label}. Groups under 5 people never show a score.`} />,
  },
  {
    id: "trend", name: "Trend", family: "Trend", purpose: "How the measure has changed across rounds.", suggest: true,
    blocked: () => (ROUNDS.length < 2 ? "Needs at least two rounds" : null),
    render: (s) => s.children.length >= 2 ? (
      <ScoreHistoryStory title={`${s.label} History`} line={`Explore how ${s.label} and the ${s.children.length} ${s.childNoun}s behind it have moved.`} overall={s.series} items={s.children} noun={s.childNoun} />
    ) : (
      <TrendStory
        title={`${s.label} Over Time`} line="Explore how this has moved round by round."
        series={[{ key: "self", label: s.label, values: s.series }, ...s.children.map((c) => ({ key: c.label, label: c.label, values: c.values }))]}
        chipLabel={s.childNoun === "Driver" ? "Driver" : "Explorer"}
      />
    ),
  },
  {
    id: "goal", name: "Goal & Pace", family: "Trend", purpose: "A target, the gap to it, and a straight-line estimate.",
    blocked: () => (ROUNDS.length < 2 ? "Needs at least two rounds" : null),
    render: (s) => <GoalStory label={s.label} series={s.series} />,
  },
  {
    id: "actions", name: "Actions", family: "Actions", purpose: "What people can do about a Driver — opens one layer deeper.", suggest: true, sample: "Sample copy",
    blocked: (s) => (s.drivers.length ? null : "Needs Drivers to act on"),
    render: (s) => <ActionsStoryBar drivers={s.drivers} />,
  },
  {
    id: "comparison", name: "Comparison", family: "Comparison", purpose: "Me, Team and Organisation side by side.",
    blocked: () => "Needs Me / Team / Org data this widget doesn't have",
    render: () => null,
  },
  {
    id: "resource", name: "Resource", family: "Resource", sample: "Sample", purpose: "A guide, service or link relevant to the insight.",
    blocked: () => null,
    render: (s) => <ResourceStory title={`Explore ${s.label} Further`} description={`A guide to what shapes ${s.label} and practical ways to improve it.`} />,
  },
  {
    id: "coverage", name: "Who Answered", family: "Insight & Methodology", purpose: "How many people took part, and the privacy rule.",
    blocked: () => null,
    render: () => <CoverageStory />,
  },
  {
    id: "methodology", name: "Insight & Methodology", family: "Insight & Methodology", purpose: "What the measure is and how it is worked out.", suggest: true,
    blocked: () => null,
    render: () => <MethodologyStory kind="score" />,
  },
  {
    id: "upgrade", name: "Upgrade Path", family: "Upgrade Path", sample: "Sample", purpose: "An add-on relevant to the insight.",
    blocked: () => null,
    render: () => <UpgradePathStory />,
  },
  { id: "citation", name: "Citation", family: "Citation", purpose: "Sources behind the insight.", blocked: () => "Needs traceable sources", render: () => null },
  { id: "questionnaire", name: "Questionnaire", family: "Questionnaire", sample: "Sample questions", purpose: "A short set of related questions.", blocked: () => null, render: (s) => <QuestionnaireStory line={`Three short questions about ${s.label}. They take under a minute.`} questions={[`I understand what is behind my ${s.label} score.`, `I know one thing I could change to improve ${s.label}.`, `My team talks openly about ${s.label}.`]} /> },
  { id: "video", name: "Video", family: "Video", purpose: "An explanatory video.", blocked: () => null, render: () => <VideoStory {...EXPLAINER} /> },
];

/* ---- Story placements ------------------------------------------------------------------------------------------ */
/* A Scope is a list of placements. Each placement has a key: the Story's id for the first, `id~2`, `id~3`… for another
   placement of the same Story. Only a Story with several forms can be placed again, and each placement must use a form no
   other placement of that Story uses (the no-duplicates rule, with a pass for a multiple-in-one Story). Everything that takes
   a key (storyById, order, insertStory) understands both. */
export const baseId = (key) => String(key).split("~")[0];
export const storyById = (key) => STORIES.find((s) => s.id === baseId(key));
const order = (key) => STORIES.findIndex((s) => s.id === baseId(key));
export const hasStory = (keys, id) => keys.some((k) => baseId(k) === id);
export const placementsOf = (keys, id) => keys.filter((k) => baseId(k) === id);

/* The forms a Story offers for a subject ([] when it has just one). */
export const formsOf = (def, subject) => (def?.forms ? def.forms(subject) : []);
/* The form a placement uses: its saved choice if still offered for this subject, else the Story's default for this widget. */
export function formOf(def, subject, options, spec) {
  const forms = formsOf(def, subject);
  return forms.some((f) => f.id === options?.form) ? options.form : def?.defaultForm?.(subject, spec);
}
/* Forms already taken by the other placements of this Story. */
export function formsInUse(keys, optionsMap, subject, spec, exceptKey) {
  const def = storyById(exceptKey);
  return placementsOf(keys, def.id).filter((k) => k !== exceptKey).map((k) => formOf(def, subject, optionsMap?.[k], spec));
}
/* The forms a placement can switch to: every form not taken by another placement. */
export const availableForms = (keys, optionsMap, subject, spec, key) => {
  const taken = formsInUse(keys, optionsMap, subject, spec, key);
  return formsOf(storyById(key), subject).map((f) => ({ ...f, taken: taken.includes(f.id) }));
};
/* The first form no placement of this Story uses yet, or null. */
export function unusedForm(keys, optionsMap, subject, spec, id) {
  const def = storyById(id);
  const used = placementsOf(keys, id).map((k) => formOf(def, subject, optionsMap?.[k], spec));
  return formsOf(def, subject).find((f) => !used.includes(f.id))?.id ?? null;
}
/* Can this Story be placed (again)? A first placement, or another when a form is left. */
export const canPlace = (keys, optionsMap, subject, spec, id) => !hasStory(keys, id) || (!storyById(id).once && formsOf(storyById(id), subject).length > 1 && unusedForm(keys, optionsMap, subject, spec, id) != null);

/* The default Scope: every suggested Story this subject can support. */
export const suggestStories = (subject) => STORIES.filter((s) => s.suggest && !s.blocked(subject)).map((s) => s.id);

/* ---- Why a Story is added ------------------------------------------------------------------------------------------ */
/* The default Scope is the eight Stories every subject starts with, plus up to `max` more whose rule fires on the subject's
   real data. Each carries a one-line reason, shown on the Story and quoted by the chat. The numbers are starting points
   a person can change here; the Story availability page prints this table. */
export const SUGGEST_RULES = {
  max: 3,
  gap: { minPoints: 15, story: "gap", rule: "Groups on one way of grouping differ by at least this many points" },
  reach: { within: 3, minParts: 2, story: "reach", rule: "At least two parts are this close to the next status line" },
  spread: { minSpan: 30, story: "spread", rule: "The middle half of people spans at least this many points" },
  changes: { minMove: 8, story: "changes", rule: "A part moved at least this many points since the round before" },
  areas: { below: 10, story: "areas", rule: "The lowest group scores at least this far below the whole" },
  who: { share: 0.5, story: "distribution", rule: "At least this share of people are Struggling" },
  rank: { edge: 3, story: "rank", rule: "It ranks in the top or bottom this many of its peers" },
};
const R = SUGGEST_RULES;
const signed = (d) => `${d > 0 ? "+" : "−"}${Math.abs(d)}`;
const SUGGESTERS = {
  [R.gap.story]: (s) => { const g = groupGaps(s.scoreOf)[0]; return g && g.gap >= R.gap.minPoints ? { strength: g.gap / R.gap.minPoints, why: `${g.axis} scores differ by ${g.gap} points` } : null; },
  [R.reach.story]: (s) => { const n = withinReach(s.children, 99).filter((r) => r.gap <= R.reach.within).length; return n >= R.reach.minParts ? { strength: n / R.reach.minParts, why: `${n} ${s.childNoun}s are within ${R.reach.within} points of the next status line` } : null; },
  [R.spread.story]: (s) => { const sp = scoreSpread(s.scoreOf), span = sp.p75 - sp.p25; return span >= R.spread.minSpan ? { strength: span / R.spread.minSpan, why: `People's scores are far apart: the middle half spans ${span} points` } : null; },
  [R.changes.story]: (s) => {
    if (LAST < 1) return null;
    const moves = s.children.map((c) => ({ label: c.label, d: c.values[LAST] - c.values[LAST - 1] })).sort((a, b) => Math.abs(b.d) - Math.abs(a.d));
    return moves[0] && Math.abs(moves[0].d) >= R.changes.minMove ? { strength: Math.abs(moves[0].d) / R.changes.minMove, why: `${moves[0].label} moved ${signed(moves[0].d)} since ${roundName(LAST - 1)}` } : null;
  },
  [R.areas.story]: (s) => { const g = focusGroups(1, s.scoreOf)[0]; const diff = g ? s.series[LAST] - g.score : 0; return g && diff >= R.areas.below ? { strength: diff / R.areas.below, why: `${g.axis}: ${g.group} scores ${g.score}, ${diff} below ${s.label}` } : null; },
  [R.who.story]: (s) => { const c = statusCountSeries(s.scoreOf), tot = c.flourishing[LAST] + c.striving[LAST] + c.struggling[LAST], share = tot ? c.struggling[LAST] / tot : 0; return share >= R.who.share ? { strength: share / R.who.share, why: `${c.struggling[LAST]} of ${tot} people are Struggling` } : null; },
  [R.rank.story]: (s) => { const r = rankAmong(s); return r && (r.rank <= R.rank.edge || r.rank > r.total - R.rank.edge) ? { strength: 1, why: `Ranks number ${r.rank} of ${r.total} ${r.noun}s` } : null; },
};

/* { stories, reasons }: the default Scope with the Stories the data calls for, and why each extra is there. */
/* The Stories that expand on each widget form, in the order they should lead the Scope (after the Insight Summary). A
   History widget opens into the trend; a Groups widget into who is in each group and where the gaps are; a Spread widget
   into how scores are spread… The rest of the default Scope follows. */
export const FORM_STORIES = {
  score: ["meaning", "trend", "diagnostic"], gauge: ["meaning", "reach"], status: ["meaning", "distribution", "spread"],
  history: ["trend", "changes", "goal"], parts: ["breakdown", "diagnostic", "priority"], profile: ["breakdown", "diagnostic", "rank"],
  people: ["distribution", "spread"], groups: ["composition", "gap", "areas", "bright"], composition: ["composition"],
  focus: ["areas", "gap", "bright"], movers: ["changes", "trend"], spread: ["spread", "distribution"], goal: ["goal", "trend"],
  index: ["breakdown", "diagnostic"], team: ["composition", "gap", "areas"], versus: ["gap", "composition"], duel: ["connected", "trend"],
  check: ["diagnostic", "reach", "areas"], whatif: ["reach", "priority"], heat: ["trend", "changes"], momentum: ["trend", "changes"], nudge: ["actions", "diagnostic", "reach"],
};
const FORM_NAME = { score: "Score", gauge: "Ring", status: "Status", history: "History", parts: "Parts", profile: "Profile", people: "People", groups: "Groups", composition: "Composition", focus: "Focus", movers: "Movers", spread: "Spread", goal: "Goal", index: "Index", team: "Group", versus: "Versus", duel: "Head to head", check: "Health check", whatif: "What if", heat: "Heat strip", momentum: "Momentum", nudge: "Next Step" };

export function suggestScope(subject, form) {
  let stories = suggestStories(subject);
  const reasons = {};
  // Lead with the Stories that expand on this form, right after the Insight Summary.
  const lead = (FORM_STORIES[form] || []).filter((id) => { const d = storyById(id); return d && !d.blocked(subject); });
  const head = lead.length && stories.includes("summary") ? ["summary"] : [];
  if (lead.length) {
    stories = stories.filter((id) => !head.includes(id) && !lead.includes(id));
    lead.forEach((id) => { if (!suggestStories(subject).includes(id)) reasons[id] = `Expands on the ${FORM_NAME[form] || form} widget`; });
  }
  const hits = Object.entries(SUGGESTERS)
    .map(([id, fn]) => { const def = storyById(id); if (!def || def.blocked(subject) || stories.includes(id)) return null; let hit = null; try { hit = fn(subject); } catch { hit = null; } return hit ? { id, ...hit } : null; })
    .filter(Boolean).sort((a, b) => b.strength - a.strength).slice(0, R.max);
  hits.forEach((h) => { if (!lead.includes(h.id)) { stories = insertStory(stories, h.id); reasons[h.id] = h.why; } });
  // The form's own Stories stay at the top, after the Insight Summary; the data-driven extras slot in below them.
  return { stories: [...head, ...lead, ...stories], reasons };
}

/* Insert after the last present placement that precedes it in the taxonomy (or is the same Story). */
export function insertStory(keys, key) {
  if (keys.includes(key)) return keys;
  let at = 0;
  keys.forEach((x, i) => { if (order(x) <= order(key)) at = i + 1; });
  return [...keys.slice(0, at), key, ...keys.slice(at)];
}
/* Place a Story: first time as itself, again as the next key with the first unused form. Returns { stories, options, key } or
   null when it can't be placed. */
export function placeStory(built, subject, id) {
  const { stories, options = {}, spec } = built;
  if (!canPlace(stories, options, subject, spec, id)) return null;
  if (!hasStory(stories, id)) return { stories: insertStory(stories, id), options, key: id };
  let n = 2;
  while (stories.includes(`${id}~${n}`)) n++;
  const key = `${id}~${n}`;
  return { stories: insertStory(stories, key), options: { ...options, [key]: { form: unusedForm(stories, options, subject, spec, id) } }, key };
}
/* "Bars" for a placement of a multi-form Story, else null: shown in the "In this scope" rail. */
export const placementForm = (built, subject, key) => { const def = storyById(key); const forms = formsOf(def, subject); return forms.length > 1 ? forms.find((f) => f.id === formOf(def, subject, built.options?.[key], built.spec))?.label ?? null : null; };
/* Ids of Stories already in the Scope that can be placed once more in a form not yet used. */
export const againIds = (built, subject) => STORIES.filter((s) => hasStory(built.stories, s.id) && formsOf(s, subject).length > 1 && canPlace(built.stories, built.options, subject, built.spec, s.id)).map((s) => s.id);
/* Remove one placement of a Story, with their saved options. */
export function removeStoryKeys(built, key) {
  const { stories, options = {} } = built;
  const next = stories.filter((k) => k !== key);
  const { [key]: _gone, ...rest } = options;
  return { stories: next, options: rest };
}
