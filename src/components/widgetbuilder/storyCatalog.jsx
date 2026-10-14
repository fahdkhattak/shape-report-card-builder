import { T, band } from "../../lib/tokens.js";
import { statusOf, sinceText, roundName, LAST, statusCountSeries, focusGroups, rankAmong } from "../../lib/scopeData.js";
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
import { ResourceStory, UpgradePathStory, QuestionnaireStory } from "../scope/stories/AddOnStories.jsx";
import SeverityBreakdownStory from "../scope/stories/SeverityBreakdown.jsx";
import { orgSeverity } from "../../lib/wellbeing.js";
import { FLOURISHING_AT, STRIVING_AT } from "../../lib/bands.js";

/* ================================================================== */
/* STORY CATALOG — the Stories taxonomy (Figma board 13622:35945) as    */
/* data the Widget Builder can reason with: what each Story is, whether  */
/* a given subject can honestly support it, and how to render it.        */
/*   `blocked(subject)` returns a plain-language reason, or null if the   */
/*   Story is available. Unbuildable Stories stay listed — with their    */
/*   reason — so the rules are visible, not hidden.                       */
/*   `suggest` marks the Stories the builder proposes by default.         */
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
    blocked: () => null,
    render: (s) => {
      const v = s.series[LAST];
      const status = statusOf(v);
      return <MeaningStory title="What This Score Is Telling You" value={v} unit="/100" values={s.series} headline={<>{s.label} scores <span style={{ color: band(v).cs }}>{v}</span>/100, which is {status}.</>} text={MEANING[status]} />;
    },
  },
  {
    id: "breakdown", name: "Breakdown", family: "Breakdown", purpose: "What contributes to the result.", suggest: true,
    blocked: NO_PARTS,
    render: (s) => (
      <BreakdownStory
        title="What's Behind This Score" variant={s.children.length >= 3 && s.children.length <= 12 ? "radar" : "bars"} noun={s.childNoun}
        line={`See how the ${s.children.length} ${s.childNoun}s behind ${s.label} compare.`}
        items={s.children.map((c) => ({ ...c, blurb: blurbFor(c.label, c.values[LAST]) }))}
        hint="Hover over the chart to see each score. For each answer, the higher the score, the better."
      />
    ),
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
    id: "actions", name: "Actions", family: "Actions", purpose: "What people can do about a Driver — opens one layer deeper.", suggest: true,
    blocked: (s) => (s.drivers.length ? null : "Needs Drivers to act on"),
    render: (s) => <ActionsStoryBar drivers={s.drivers} />,
  },
  {
    id: "comparison", name: "Comparison", family: "Comparison", purpose: "Me, Team and Organisation side by side.",
    blocked: () => "Needs Me / Team / Org data this widget doesn't have",
    render: () => null,
  },
  {
    id: "resource", name: "Resource", family: "Resource", purpose: "A guide, service or link relevant to the insight.",
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
    id: "upgrade", name: "Upgrade Path", family: "Upgrade Path", purpose: "An add-on relevant to the insight.",
    blocked: () => null,
    render: () => <UpgradePathStory />,
  },
  { id: "citation", name: "Citation", family: "Citation", purpose: "Sources behind the insight.", blocked: () => "Needs traceable sources", render: () => null },
  { id: "questionnaire", name: "Questionnaire", family: "Questionnaire", purpose: "A short set of related questions.", blocked: () => null, render: (s) => <QuestionnaireStory line={`Three short questions about ${s.label}. They take under a minute.`} questions={[`I understand what is behind my ${s.label} score.`, `I know one thing I could change to improve ${s.label}.`, `My team talks openly about ${s.label}.`]} /> },
  { id: "video", name: "Video", family: "Video", purpose: "An explanatory video.", blocked: () => "Needs a video to show (none in this prototype)", render: () => null },
];

export const storyById = (id) => STORIES.find((s) => s.id === id);
const order = (id) => STORIES.findIndex((s) => s.id === id);

/* The default Scope: every suggested Story this subject can support. */
export const suggestStories = (subject) => STORIES.filter((s) => s.suggest && !s.blocked(subject)).map((s) => s.id);

/* Insert after the last present Story that precedes it in the taxonomy. */
export function insertStory(ids, id) {
  if (ids.includes(id)) return ids;
  let at = 0;
  ids.forEach((x, i) => { if (order(x) < order(id)) at = i + 1; });
  return [...ids.slice(0, at), id, ...ids.slice(at)];
}
