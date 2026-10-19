import { T, band } from "../../lib/tokens.js";
import { ROUNDS, LATEST, PREVIOUS, DIMENSIONS, DRIVERS, DRIVER_DIMENSION, dimensionRankedRows, driverRankedRows, worstDemographicGroup } from "../../lib/dataset.js";
import {
  LAST, fmtMonth, fmtDate, enpsParts, statusOf, overallSeries, dimensionSeries, driverSeries, enpsSeries, enpsPartSeries, statusSeries, groupRows, groupSeries, focusGroups, ALL_AXES, driverAt,
} from "../../lib/scopeData.js";
import { InsightSummaryStory, SummaryP, Strong, STATUS_TEXT, statusText, BandBar, MeaningStory, StatusMeaningStory, MethodologyStory } from "./stories/SummaryStories.jsx";
import BreakdownStory from "./stories/BreakdownStory.jsx";
import { SplitBreakdownStory, ChangesStory, WithinReachStory, PriorityMapStory, SpreadStory, BrightSpotsStory, GroupGapStory } from "./stories/FamilyStories.jsx";
import { ScoreOverTime, ScoreOverTimeRows, ENPSOverTime, StatusOverTime } from "./stories/TrendCharts.jsx";
import { StrongestWeakestStory, AreasToFocusStory } from "./stories/DiagnosticStory.jsx";
import CompositionStory from "./stories/CompositionStory.jsx";
import ScoreHistoryStory from "./stories/ScoreHistoryStory.jsx";
import { ActionsStoryBar } from "./stories/ActionStories.jsx";
import { ResourceStory, UpgradePathStory } from "./stories/AddOnStories.jsx";
import { dimensionSubject, overallSubject } from "../../lib/scopeSubject.js";
import { PARTS, TIME_PARTS, MONEY_PARTS, impactSeries, samplePerson, fmtMoney } from "../../lib/impactModel.js";
import { ImpactSplitStory, GainLadderStory, GainByGroupStory, ImpactMethodStory } from "./stories/ImpactStories.jsx";
import { FLOURISHING_AT, STRIVING_AT } from "../../lib/bands.js";
import { groupHistory, keepFor, groupingLabel } from "../../lib/heatMap.js";

/* ================================================================== */
/* SCOPE RECIPES — which Stories fill each widget's Scope, in order.    */
/* A Scope is a stack of Story cards (Figma board 13622:35945); the      */
/* taxonomy order is roughly Summary → Meaning → Breakdown → Diagnostic   */
/* → Composition → Trend → Actions → Resource → Methodology → Upgrade.    */
/* Each widget gets the Stories its own data can honestly support:        */
/*   - Comparison (Me / Team / Org) needs per-team data we don't have     */
/*   - Citation needs real sources; Questionnaire / Video need content    */
/* Trend uses the newer Trend forms (TrendCharts.jsx: Score Over Time,    */
/* by part, eNPS Over Time) and the Diagnostic family's newer Stories     */
/* (What Changed, Within Reach, Priority Map, Spread, Bright Spots, Gaps)  */
/* — the same ones the Widget Builder offers. Status Over Time is the      */
/* Trend family's StatusOverTime (stacked shares per round).              */
/* Draft recipes — expected to change as each Scope is refined.           */
/* ================================================================== */
const r0 = Math.round;
/* Every round in the dataset, as the Trend forms want them (latest in bold). */
const ROUNDS_LIVE = () => ROUNDS.map((r, i) => ({ label: fmtMonth(r.date), latest: i === LAST, date: fmtDate(r.date) }));
const rowsOver = (series) => series.map((x) => ({ label: x.label, values: x.values }));
export const ORG_MEANING = {
  Flourishing: "Most parts of work feel supportive and easy to move through. The few that don't are where to look next.",
  Striving: "Some parts of work feel clear and easy to move through. Others create delays or ask for more effort than they should.",
  Struggling: "Many parts of work are asking more than people can comfortably give. Starting with the lowest-scoring Explorers will help most.",
};
export const HEADLINE = {
  Flourishing: "Most of your organisation is flourishing, with a few areas worth a closer look.",
  Striving: "Much of your organisation is doing well, though some areas are asking more of it.",
  Struggling: "Several parts of your organisation are under strain and need attention.",
};
const blurbFor = (label, v) =>
  v >= FLOURISHING_AT ? `People are mostly positive about ${label}. It's a strength worth protecting.`
  : v >= STRIVING_AT ? `${label} is mixed. Some people feel it, others don't. Worth looking at where the gaps are.`
  : `${label} is holding scores back. It's a good place to start.`;

const dimItems = () => DIMENSIONS.map((d) => ({ label: d, values: dimensionSeries(d), blurb: blurbFor(d, dimensionSeries(d)[LAST]) }));
const driverItems = () => DRIVERS.map((d) => ({ label: d, values: driverSeries(d), blurb: `${DRIVER_DIMENSION[d]} Explorer` }));
const weakestDrivers = (n = 3) => [...driverRankedRows()].reverse().slice(0, n).map((r) => r[0]);
const explorerCounts = () => {
  const rows = dimensionRankedRows();
  const great = rows.filter((r) => r[1] >= FLOURISHING_AT).length;
  const avg = rows.filter((r) => r[1] >= STRIVING_AT && r[1] < FLOURISHING_AT).length;
  return { rows, great, avg, poor: rows.length - great - avg };
};
const is = (n) => (n === 1 ? "is" : "are");

export function ExplorerSummary({ headline }) {
  const { rows, great, avg, poor } = explorerCounts();
  return (
    <InsightSummaryStory headline={headline} bar={<BandBar values={rows} />}>
      <SummaryP>
        Your Org Score is built from <b>{rows.length} Explorers</b>. Together, they show where work feels supportive and where more attention may be needed.
      </SummaryP>
      <SummaryP>
        Across the <b>{rows.length}</b> Explorers, <Strong c={STATUS_TEXT.success}>{great}</Strong> {is(great)} Flourishing, <Strong c={STATUS_TEXT.warning}>{avg}</Strong> {is(avg)} Striving, and <Strong c={STATUS_TEXT.error}>{poor}</Strong> {is(poor)} Struggling
      </SummaryP>
    </InsightSummaryStory>
  );
}

const explorerTrendSeries = () => [{ key: "overall", label: "Overall Score", values: overallSeries() }, ...DIMENSIONS.map((d) => ({ key: d, label: d, values: dimensionSeries(d) }))];
const bestWorst = (rows) => ({ strongest: { label: rows[0][0], value: rows[0][1] }, weakest: { label: rows[rows.length - 1][0], value: rows[rows.length - 1][1] } });

/* ---- recipes -------------------------------------------------------- */
function OverallRecipe() {
  const score = r0(LATEST.avgOverall);
  const status = statusOf(score);
  const { rows } = explorerCounts();
  return (
    <>
      <ExplorerSummary headline={HEADLINE[status]} />
      <MeaningStory title="What Your Score Is Telling You" value={score} unit="/100" values={overallSeries()} headline={<>Your score of <span style={{ color: band(score).cs }}>{score}</span>/100 places you in {status}.</>} text={ORG_MEANING[status]} />
      <BreakdownStory variant="radar" items={dimItems()} line={`See how your results compare across the ${rows.length} Explorers.`} hint="Hover over the chart to see each Explorer's score. For each answer, the higher the score, the better." />
      <StrongestWeakestStory {...bestWorst(rows)} />
      <ChangesStory items={dimItems()} noun="Explorer" />
      <WithinReachStory items={dimItems()} noun="Explorer" />
      <PriorityMapStory items={dimItems()} noun="Explorer" />
      <ScoreHistoryStory overall={overallSeries()} items={dimItems()} />
      <MethodologyStory kind="score" />
      <MethodologyStory kind="status" />
      <UpgradePathStory />
    </>
  );
}

function OrgStatusRecipe() {
  const score = r0(LATEST.avgOverall);
  const status = statusOf(score);
  const c = band(score);
  const { rows } = explorerCounts();
  return (
    <>
      <StatusMeaningStory title="What Your Status Is Telling You" status={status} text={[<>{ORG_MEANING[status]} Your organisation's score is <Strong c={band(score).cs}>{score}</Strong>/100.</>]} />
      <SplitBreakdownStory
        title="Who Is in Each Status" line="How many people fall into each status this round."
        parts={[
          { label: "Flourishing", color: T.green, counts: statusSeries("flourishing") },
          { label: "Striving", color: T.amber, counts: statusSeries("striving") },
          { label: "Struggling", color: T.red, counts: statusSeries("struggling") },
        ]}
      />
      <BreakdownStory title="Explorers by Status" variant="zones" items={dimItems()} noun="Explorer" line="Where each Explorer sits against the three status ranges." />
      <SpreadStory scoreOf={overallSubject().scoreOf} label="the Org Score" />
      <StatusOverTime title="Status Over Time" line="The share of people in each status, round by round." rounds={ROUNDS_LIVE()} counts={ROUNDS.map((r) => ({ flourishing: r.flourishing, striving: r.striving, struggling: r.struggling }))} />
      <MethodologyStory kind="status" />
    </>
  );
}

function ExplorersRecipe() {
  const { rows } = explorerCounts();
  return (
    <>
      <ExplorerSummary headline="Here's how each Explorer is doing." />
      <BreakdownStory title="What's Behind Your Score" variant="bars" items={dimItems()} line="Every Explorer, ranked from strongest to weakest." />
      <StrongestWeakestStory {...bestWorst(rows)} />
      <ChangesStory items={dimItems()} noun="Explorer" />
      <PriorityMapStory items={dimItems()} noun="Explorer" />
      <ScoreOverTimeRows title="Explorer History" line="Every Explorer, round by round, under the overall score." rounds={ROUNDS_LIVE()} rows={[{ label: "Overall Score", overall: true, values: overallSeries() }, ...rowsOver(explorerTrendSeries().slice(1))]} />
      <ActionsStoryBar drivers={weakestDrivers(6)} />
      <MethodologyStory kind="score" />
    </>
  );
}

function FactorsRecipe() {
  const ranked = driverRankedRows();
  const weak = weakestDrivers(3);
  return (
    <>
      <InsightSummaryStory headline="Here's how each Driver is doing.">
        <SummaryP>Drivers are the specific things the survey measures. The {DRIVERS.length} of them roll up into your {DIMENSIONS.length} Explorers. The lowest-scoring are the best place to start.</SummaryP>
      </InsightSummaryStory>
      <BreakdownStory title="What's Behind Your Explorers" variant="bars" noun="Driver" items={driverItems()} limit={8} line="Every Driver, ranked from strongest to weakest." />
      <StrongestWeakestStory actionsCta noun="Driver" strongest={{ label: ranked[0][0], value: ranked[0][1] }} weakest={{ label: ranked[ranked.length - 1][0], value: ranked[ranked.length - 1][1] }} />
      <WithinReachStory items={driverItems()} noun="Driver" />
      <ScoreOverTimeRows title="Weakest Drivers Over Time" line="The three lowest-scoring Drivers, round by round." rounds={ROUNDS_LIVE()} rows={weak.map((d) => ({ label: d, values: driverSeries(d) }))} />
      <ActionsStoryBar drivers={weakestDrivers(6)} />
      <MethodologyStory kind="score" />
    </>
  );
}

function ScoreHistoryRecipe() {
  const s = overallSeries();
  const d = s[LAST] - s[0];
  return (
    <>
      <InsightSummaryStory headline={d === 0 ? "Your score has held steady." : d > 0 ? "Your score has risen over time." : "Your score has dipped over time."}>
        <SummaryP>
          Across {s.length} rounds your score moved from <b>{s[0]}</b> to <b>{s[LAST]}</b>{d !== 0 && <>, {d > 0 ? "up" : "down"} <b>{Math.abs(d)}</b> overall</>}.
        </SummaryP>
      </InsightSummaryStory>
      <ScoreHistoryStory overall={overallSeries()} items={dimItems()} />
      <MeaningStory title="What Your Score Is Telling You" value={s[LAST]} unit="/100" values={s} headline={<>Your score of <span style={{ color: band(s[LAST]).cs }}>{s[LAST]}</span>/100 places you in {statusOf(s[LAST])}.</>} text={ORG_MEANING[statusOf(s[LAST])]} />
      <MethodologyStory kind="score" />
    </>
  );
}

function EnpsRecipe() {
  const v = LATEST.eNPS;
  const text = v > 0 ? "More people would recommend the organisation than would hold back." : v < 0 ? "More people would hold back from recommending the organisation than would recommend it." : "As many people would recommend the organisation as would hold back.";
  return (
    <>
      <MeaningStory title="What Your eNPS Is Telling You" value={v} bandColor={false} unit="eNPS" values={enpsSeries()} headline={`Your eNPS is ${v > 0 ? "+" : ""}${v}.`} text={text} />
      <SplitBreakdownStory
        title="What's Behind Your eNPS" line="How people answered, from 0 to 10, grouped as Promoters, Passives and Detractors."
        parts={[
          { label: "Promoters (9–10)", color: T.green, counts: enpsPartSeries("promoters") },
          { label: "Passives (7–8)", color: T.amber, counts: enpsPartSeries("passives") },
          { label: "Detractors (0–6)", color: T.red, counts: enpsPartSeries("detractors") },
        ]}
      />
      <ENPSOverTime title="eNPS Over Time" line="Promoters, Passives and Detractors each round, with the eNPS they add up to." rounds={ROUNDS_LIVE()} parts={ROUNDS.map((_, i) => { const p = enpsParts(i); const pc = (k) => r0((p[k] / p.total) * 100); return { promoters: pc("promoters"), passives: pc("passives"), detractors: pc("detractors"), enps: p.enps }; })} />
      <MethodologyStory kind="enps" />
    </>
  );
}

function AreasFocusRecipe() {
  const [axis, group, score] = worstDemographicGroup();
  return (
    <>
      <InsightSummaryStory headline={`${group} is where scores are lowest.`}>
        <SummaryP>Across {ALL_AXES.length} ways of grouping people, <b>{group}</b> ({axis}) has the lowest score at <Strong c={statusText(score)}>{score}</Strong>/100.</SummaryP>
      </InsightSummaryStory>
      <AreasToFocusStory groups={focusGroups(4)} />
      <BrightSpotsStory scoreOf={overallSubject().scoreOf} label="the Org Score" />
      <GroupGapStory scoreOf={overallSubject().scoreOf} label="the Org Score" />
      <CompositionStory initialTab="People" line="See who is in each group and how each is scoring. Pick a tab to look at a different part of your organisation." />
    </>
  );
}

export function GapSummary({ axisKey, noun }) {
  const rows = groupRows(axisKey).filter((r) => !r.hidden).sort((a, b) => b.score - a.score);
  const hi = rows[0], lo = rows[rows.length - 1];
  return (
    <InsightSummaryStory headline={`${hi.group} scores highest, ${lo.group} lowest.`}>
      <SummaryP>Among {noun} groups with 5 or more people, <b>{hi.group}</b> averages <Strong c={statusText(hi.score)}>{hi.score}</Strong> and <b>{lo.group}</b> averages <Strong c={statusText(lo.score)}>{lo.score}</Strong>, a gap of <b>{hi.score - lo.score}</b> points.</SummaryP>
    </InsightSummaryStory>
  );
}

function CompositionRecipe({ axisKey, tab, noun }) {
  return (
    <>
      <GapSummary axisKey={axisKey} noun={noun} />
      <CompositionStory initialTab={tab} />
      <ScoreOverTimeRows title={`Score by ${noun} Over Time`} line="Groups with fewer than 5 people are left out." rounds={ROUNDS_LIVE()} rows={rowsOver(groupSeries(axisKey))} />
    </>
  );
}

/* ---- Time Impact, Money Impact, Time to Gain (lib/impactModel.js) -------------------------------------------------
   The gain if scores rose to Flourishing: time (hours per person, productivity + absenteeism), money (the organisation's
   dollars, + retention and claims). Reused: Meaning, Breakdown bars (the Explorers behind it), Score Over Time, Actions.
   New: Where It Comes From (split), What Each Step Is Worth (ladder), Where the Gain Sits (by group), the model. */
const ceilTo = (v, step) => Math.max(step, Math.ceil(v / step) * step);
const axisTicks = (top) => [top, top * 0.75, top * 0.5, top * 0.25, 0].map(r0);
const behind = (parts) => [...new Set(parts.flatMap((k) => PARTS[k].explorers))];
const driversOf = (explorers) => [...driverRankedRows()].reverse().filter((r) => explorers.includes(DRIVER_DIMENSION[r[0]])).slice(0, 4).map((r) => r[0]);

function TimeImpactRecipe() {
  const series = impactSeries();
  const now = series[LAST];
  const hrs = series.map((x) => r0(x.hours.total));
  const top = ceilTo(Math.max(...hrs) * 1.2, 4);
  const sources = behind(TIME_PARTS);
  return (
    <>
      <MeaningStory
        title="What This Is Telling You" value={hrs[LAST]} bandColor={false} unit="hrs a year"
        headline={`If everyone reached Flourishing, each person would get back about ${hrs[LAST]} hours a year.`}
        text={`That's about ${Math.round(now.hours.total * now.people).toLocaleString("en-GB")} hours across the ${now.people} people who answered. It comes from the ${now.below} people below Flourishing today.`}
      />
      <ImpactSplitStory unit="time" data={now} line="Time comes back two ways: more focused work, and fewer days lost to absence." />
      <GainLadderStory unit="time" />
      <BreakdownStory variant="bars" noun="Explorer" title="The Scores Behind It" line="The time comes from the gap between these Explorers and Flourishing. Every point closer gives some of it back." items={sources.map((d) => ({ label: d, values: dimensionSeries(d) }))} />
      <GainByGroupStory unit="time" />
      <ScoreOverTime title="Time to Gain Over Time" line="Fewer hours to gain means people moved closer to Flourishing." rounds={ROUNDS_LIVE()} values={hrs} banded={false} axis="Hours" domain={[0, top]} ticks={axisTicks(top)} />
      <ActionsStoryBar drivers={driversOf(sources)} />
      <ImpactMethodStory unit="time" />
    </>
  );
}

function MoneyImpactRecipe() {
  const series = impactSeries();
  const now = series[LAST];
  const k = series.map((x) => r0(x.dollars.total / 1000));
  const top = ceilTo(Math.max(...k) * 1.2, 20);
  const sources = behind(MONEY_PARTS);
  const biggest = MONEY_PARTS.reduce((a, p) => (now.dollars[p] > now.dollars[a] ? p : a), MONEY_PARTS[0]);
  return (
    <>
      <MeaningStory
        title="What This Is Telling You" value={k[LAST]} bandColor={false} unit="K USD a year"
        headline={`If everyone reached Flourishing, the organisation would get back about ${fmtMoney(now.dollars.total)} a year.`}
        text={`That's about ${fmtMoney(now.dollars.total / (now.people || 1))} for each of the ${now.people} people who answered. ${PARTS[biggest].label} is the largest part.`}
      />
      <ImpactSplitStory unit="money" data={now} line="Money comes back four ways: productivity, fewer absences, people staying, and fewer injuries and claims." />
      <GainLadderStory unit="money" />
      <BreakdownStory variant="bars" noun="Explorer" title="The Scores Behind It" line="Each part of the money is built from one or two of these Explorers. The lower the score, the more there is to get back." items={sources.map((d) => ({ label: d, values: dimensionSeries(d) }))} />
      <GainByGroupStory unit="money" />
      <ScoreOverTime title="Money to Gain Over Time" line="In thousands of dollars a year. A lower line means scores moved closer to Flourishing." rounds={ROUNDS_LIVE()} values={k} banded={false} axis="$K" domain={[0, top]} ticks={axisTicks(top)} />
      <ActionsStoryBar drivers={driversOf(sources)} />
      <ImpactMethodStory unit="money" />
    </>
  );
}

/* A personal report shows time only, with no breakdown. There is no signed-in person, so it is a sample person. */
function TimeGainRecipe() {
  const p = samplePerson();
  return (
    <>
      <MeaningStory
        title="What This Is Telling You" value={r0(p.hours)} bandColor={false} unit="hrs a year"
        headline={`Reaching Flourishing would give you back about ${r0(p.hours)} hours a year.`}
        text={`Your score is ${p.score}. The closer it gets to ${FLOURISHING_AT}, the more of that time comes back. This is a sample person: the prototype has no signed-in employee.`}
      />
      <GainLadderStory unit="time" personal ladder={p.steps.map((x) => ({ target: x.target, value: x.hours }))} title="What Each Step Is Worth to You" />
      <ImpactMethodStory unit="time" scores={p.explorerScores} />
    </>
  );
}

/* One Explorer's Scope (Explorers report layer, Figma 984qJvMt7fCHASYHRwgrab
   node 14531:21543): its score as a ring, an area chart across its Drivers,
   What Stands Out, then the Actions bar that opens the deeper layer. Only the
   Stories the design shows — Trend, Composition and Methodology would slot in
   after Diagnostic if wanted. */
export function ExplorerScope({ dimension }) {
  const s = dimensionSubject(dimension);
  const v = s.series[LAST];
  const status = statusOf(v);
  const r = [...s.children].sort((a, b) => b.values[LAST] - a.values[LAST]);
  return (
    <>
      <MeaningStory ring title="What Your Score Is Telling You" value={v} values={s.series} headline={<>Your {dimension} score is <span style={{ color: band(v).cs }}>{v}</span>/100, currently {status}.</>} text={ORG_MEANING[status]} />
      <BreakdownStory
        variant="area" noun="Driver" title="What's Behind Your Score"
        line={`${dimension} is made up of ${s.children.length} drivers. Explore them to see which parts are helping and which may be getting in the way.`}
        items={s.children} hint="Hover over each point to see its score. For each answer, the higher the score, the better."
      />
      <StrongestWeakestStory noun="Driver" strongest={{ label: r[0].label, value: r[0].values[LAST] }} weakest={{ label: r[r.length - 1].label, value: r[r.length - 1].values[LAST] }} />
      <ActionsStoryBar drivers={s.drivers} />
    </>
  );
}

const RECIPES = {
  "org-score": OverallRecipe,
  "your-score": OverallRecipe,
  index: OverallRecipe,
  "org-status": OrgStatusRecipe,
  explorers: ExplorersRecipe,
  factors: FactorsRecipe,
  "score-history": ScoreHistoryRecipe,
  enps: EnpsRecipe,
  "areas-focus": AreasFocusRecipe,
  "avg-gender": () => <CompositionRecipe axisKey="gender" tab="People" noun="Gender" />,
  "avg-work-model": () => <CompositionRecipe axisKey="workModel" tab="Employment" noun="Work Model" />,
  "time-impact": TimeImpactRecipe,
  "money-composition": MoneyImpactRecipe,
  "time-gain": TimeGainRecipe,
};

/* Returns null for a widget with no recipe yet (Popular Responses and Money
   Composition have no data behind them) — ScopePanel falls back to its
   generic placeholder Scope for those. */
export const hasRecipe = (familyId) => familyId in RECIPES;
export default function ScopeRecipe({ familyId }) {
  const Recipe = RECIPES[familyId];
  return Recipe ? <Recipe /> : null;
}

/* ---- A group of people, opened from the Heat Map (Figma flow 15299:47644) ------------------------------------------------
   A group is a subset of the organisation, so its Scope is the Org Score's, shorter: summary, meaning, the 12 Explorers as a
   radar, what stands out, its history, and actions for its weakest Drivers. Every number is the group's own (its people
   only); a round where fewer than 5 of them answered is left out. `row` is a heat-map row ({ label, axis, group, parent? }). */
const GROUP_HEADLINE = {
  Flourishing: (g) => `${g} is flourishing.`,
  Striving: (g) => `${g} is doing well, with some areas asking more of it.`,
  Struggling: (g) => `${g} is struggling.`,
};
export function GroupScope({ row }) {
  const hist = groupHistory(keepFor(row));
  const now = hist[LAST];
  if (!now) return <InsightSummaryStory headline="Too few people to show."><SummaryP>This group has fewer than 5 people, so its scores are never shown.</SummaryP></InsightSummaryStory>;
  const name = row.parent ? `${row.parent.label} · ${row.label}` : row.label;
  const label = row.axis ? `The ${name} group` : "The organisation";
  const score = now.overall, status = statusOf(score);
  const orgScore = r0(LATEST.avgOverall), diff = score - orgScore;
  const series = (pick) => hist.map((h) => (h ? pick(h) : null));
  const items = DIMENSIONS.map((d) => ({ label: d, values: series((h) => h.dims[d]), blurb: blurbFor(d, now.dims[d]) }));
  const rows = [...DIMENSIONS].map((d) => [d, now.dims[d]]).sort((a, b) => b[1] - a[1]);
  const great = rows.filter((r) => r[1] >= FLOURISHING_AT).length, avg = rows.filter((r) => r[1] >= STRIVING_AT && r[1] < FLOURISHING_AT).length, poor = rows.length - great - avg;
  const weakDrivers = Object.entries(now.drivers).sort((a, b) => a[1] - b[1]).slice(0, 3).map(([k]) => k);
  const where = row.parent ? `${groupingLabel(row.parent.axis)} and ${groupingLabel(row.axis)}` : row.axis ? groupingLabel(row.axis) : "";
  return (
    <>
      <InsightSummaryStory headline={GROUP_HEADLINE[status](label)} bar={<BandBar values={rows} />}>
        <SummaryP>
          {row.axis ? <>These are the <b>{now.n} people</b> in {name}{where ? ` (${where})` : ""}. </> : null}
          Their score of <Strong c={statusText(score)}>{score}</Strong> is {diff === 0 ? "the same as" : <><b>{Math.abs(diff)} {Math.abs(diff) === 1 ? "point" : "points"} {diff > 0 ? "above" : "below"}</b></>} the organisation's {orgScore}.
        </SummaryP>
        <SummaryP>
          Across the <b>{rows.length}</b> Explorers, <Strong c={STATUS_TEXT.success}>{great}</Strong> {is(great)} Flourishing, <Strong c={STATUS_TEXT.warning}>{avg}</Strong> {is(avg)} Striving, and <Strong c={STATUS_TEXT.error}>{poor}</Strong> {is(poor)} Struggling
        </SummaryP>
      </InsightSummaryStory>
      <MeaningStory title="What This Score Is Telling You" value={score} unit="/100" values={series((h) => h.overall)} headline={<>This group's score of <span style={{ color: band(score).cs }}>{score}</span>/100 places it in {status}.</>} text={ORG_MEANING[status]} />
      <BreakdownStory title="What's Behind This Score" variant="radar" items={items} line={`How this group's results compare across the ${rows.length} Explorers.`} hint="Hover over the chart to see each Explorer's score for this group." />
      <StrongestWeakestStory {...bestWorst(rows)} />
      <SplitBreakdownStory
        title="Who Is in Each Status" line="How many of this group's people fall into each status, round by round."
        parts={[
          { label: "Flourishing", color: T.green, counts: hist.map((h) => h?.status.f ?? 0) },
          { label: "Striving", color: T.amber, counts: hist.map((h) => h?.status.s ?? 0) },
          { label: "Struggling", color: T.red, counts: hist.map((h) => h?.status.t ?? 0) },
        ]}
      />
      <ScoreHistoryStory title="This Group's Score History" line="How this group's score and each Explorer have moved, round by round." overall={series((h) => h.overall)} items={items} />
      <ActionsStoryBar drivers={weakDrivers} />
    </>
  );
}
