import { band } from "../../lib/tokens.js";
import { RoundsContext } from "../../lib/roundsContext.js";
import { InsightSummaryStory, SummaryP, Strong, BandBar, MeaningStory, StatusMeaningStory, MethodologyStory } from "../scope/stories/SummaryStories.jsx";
import BreakdownStory from "../scope/stories/BreakdownStory.jsx";
import { SplitBreakdownStory, ChangesStory, WithinReachStory } from "../scope/stories/FamilyStories.jsx";
import { ScoreOverTime, ScoreOverTimeRows, ENPSOverTime, StatusOverTime, FlowOverTime } from "../scope/stories/TrendCharts.jsx";
import { wellbeingFlows } from "../../lib/survey/wellbeingFlows.js";
import { QuadrantStory, WithWithoutStory, StatusOutcomeStory } from "../scope/stories/InsightStories.jsx";
import { PAIRS, quadrant, withWithout, outcomeByStatus } from "../../lib/survey/insightData.js";
import { StrongestWeakestStory, AreasToFocusStory } from "../scope/stories/DiagnosticStory.jsx";
import ScoreHistoryStory from "../scope/stories/ScoreHistoryStory.jsx";
import SeverityBreakdownStory from "../scope/stories/SeverityBreakdown.jsx";
import { StoryCard, bodyText } from "../scope/stories/StoryCard.jsx";
import { ORG_MEANING, HEADLINE } from "../scope/scopeRecipes.jsx";
import { T } from "../../lib/tokens.js";
import { FLOURISHING_AT, STRIVING_AT, statusName } from "../../lib/bands.js";
import { ROUNDS, LATEST_ROUND, EXPLORERS, DRIVERS, QUESTION, STORY_ROUNDS, personById, summary, orgSeries, personSeries, groups, focusGroups, GROUP_AXES } from "../../lib/survey/surveyData.js";
import { WELLBEING, WELLBEING_LEVELS } from "../../lib/survey/scoring.js";
import { personRounds, enpsSplit, SHAPE_WIDGETS } from "./shapeWidgets.jsx";

/* ================================================================== */
/* SHAPE SCOPES — the Scope behind each SHAPE widget, from the new        */
/* survey dataset. The same Story components as every other Scope, fed   */
/* through their props; RoundsContext gives them this dataset's rounds   */
/* so their dates are right. Personal Scopes read one person only.        */
/* Not in these Scopes yet: Actions (its content and scores still come    */
/* from the old dataset), Composition and Priority Map (they read the old */
/* dataset directly).                                                     */
/* ================================================================== */
const r0 = (v) => (v == null ? null : Math.round(v));
const LAST = ROUNDS.length - 1;
const TREND_ROUNDS = ROUNDS.map((r, i) => ({ label: r.label, latest: i === LAST, date: r.label }));
const statusOf = statusName;
const PERSONAL_MEANING = {
  Flourishing: "Most parts of your work and life are going well right now. The few that aren't are the ones to look at next.",
  Striving: "Some parts of your work and life are going well, and others are asking more of you than they should. Your lowest Explorers show where.",
  Struggling: "A lot is asking more of you than is comfortable right now. Start with your lowest Explorers, and remember support is available.",
};
const blurbFor = (label, v, you) => (v == null ? "" : v >= FLOURISHING_AT ? `${label} is a strength for ${you}.` : v >= STRIVING_AT ? `${label} is mixed for ${you}: some of it works, some of it doesn't.` : `${label} is holding ${you} back. A good place to start.`);
const bestWorst = (items, noun) => {
  const rows = items.filter((i) => i.values[LAST] != null).sort((a, b) => b.values[LAST] - a.values[LAST]);
  return { strongest: { label: rows[0].label, value: rows[0].values[LAST] }, weakest: { label: rows[rows.length - 1].label, value: rows[rows.length - 1].values[LAST] }, noun };
};

/* Items (one per part, its value in every round) for a person or the organisation. */
const personExplorers = (p) => EXPLORERS.map((e) => { const values = personSeries(p, (s) => r0(s.explorers[e.id])); return { label: e.name, values, blurb: blurbFor(e.name, values[LAST], "you") }; });
const personDrivers = (p) => DRIVERS.map((d) => ({ label: d, values: personSeries(p, (s) => r0(s.drivers[d])) })).filter((i) => i.values[LAST] != null);
const orgExplorers = () => EXPLORERS.map((e) => { const values = orgSeries((s) => r0(s.explorers[e.id])); return { label: e.name, values, blurb: blurbFor(e.name, values[LAST], "people") }; });
const orgDrivers = () => DRIVERS.map((d) => ({ label: d, values: orgSeries((s) => r0(s.drivers[d])) })).filter((i) => i.values[LAST] != null);
/* A question-level breakdown (QLB): an Explorer's scored questions, one bar each. */
const qlb = (qids, scoreSeries) => qids.map((id) => ({ label: QUESTION[id].shortLabel || QUESTION[id].text, values: scoreSeries(id) })).filter((i) => i.values[LAST] != null);

function PersonalScope({ id, person }) {
  const p = person;
  const { now } = personRounds(p);
  const overall = personSeries(p, (s) => r0(s.overall));
  const score = r0(now.scores.overall), status = now.scores.status;
  const exp = personExplorers(p);
  const pq = (qid) => personSeries(p, (s) => r0(s.questions[qid]));
  switch (id) {
    case "p-score": {
      const bw = bestWorst(exp, "Explorer");
      return (
        <>
          <InsightSummaryStory headline={`You're ${status} right now.`} bar={<BandBar values={exp.filter((e) => e.values[LAST] != null).sort((a, b) => b.values[LAST] - a.values[LAST]).map((e) => [e.label, e.values[LAST]])} />}>
            <SummaryP>Your score is <Strong c={band(score).cs}>{score}</Strong>/100{overall[LAST - 1] != null ? <>, {score - overall[LAST - 1] >= 0 ? "up" : "down"} {Math.abs(score - overall[LAST - 1])} since {ROUNDS[LAST - 1].label}</> : null}.</SummaryP>
            <SummaryP><b>{bw.strongest.label}</b> is your strongest Explorer at {bw.strongest.value}. <b>{bw.weakest.label}</b> is your lowest at {bw.weakest.value}.</SummaryP>
          </InsightSummaryStory>
          <MeaningStory title="What Your Score Is Telling You" value={score} unit="/100" values={overall} headline={<>Your score of <span style={{ color: band(score).cs }}>{score}</span>/100 places you in {status}.</>} text={PERSONAL_MEANING[status]} />
          <BreakdownStory variant="radar" items={exp} line="How your 12 Explorers compare." hint="Hover over the chart to see each Explorer's score." />
          <StrongestWeakestStory {...bw} />
          <ChangesStory items={exp} noun="Explorer" />
          <ScoreHistoryStory overall={overall} items={exp} />
          <MethodologyStory kind="score" />
        </>
      );
    }
    case "p-status":
      return (
        <>
          <StatusMeaningStory title="What Your Status Is Telling You" status={status} text={[<>{PERSONAL_MEANING[status]} Your score is <Strong c={band(score).cs}>{score}</Strong>/100.</>]} />
          <BreakdownStory title="Your Explorers by Status" variant="zones" items={exp} line="Where each of your Explorers sits against the three status ranges." />
          <MethodologyStory kind="status" />
        </>
      );
    case "p-history":
      return (
        <>
          <ScoreHistoryStory overall={overall} items={exp} />
          <ScoreOverTime title="Your Score Over Time" rounds={TREND_ROUNDS} values={overall} />
        </>
      );
    case "p-explorers":
      return (
        <>
          <BreakdownStory title="Your Explorers" variant="bars" items={exp} line="All 12, strongest first." />
          <StrongestWeakestStory {...bestWorst(exp, "Explorer")} />
          <ChangesStory items={exp} noun="Explorer" />
          <ScoreOverTimeRows title="Your Explorers Over Time" rounds={TREND_ROUNDS} rows={[{ label: "Your Score", values: overall, overall: true }, ...exp]} />
        </>
      );
    case "p-drivers":
    case "p-focus": {
      const drv = personDrivers(p);
      return (
        <>
          <BreakdownStory title={id === "p-focus" ? "Your Lowest Drivers" : "Your Drivers"} variant="bars" items={id === "p-focus" ? [...drv].sort((a, b) => a.values[LAST] - b.values[LAST]).slice(0, 8) : drv} noun="Driver" limit={id === "p-focus" ? undefined : 12} line={id === "p-focus" ? "The Drivers pulling your score down most." : `All ${drv.length} Drivers you answered, strongest first.`} />
          <StrongestWeakestStory {...bestWorst(drv, "Driver")} />
          <WithinReachStory items={drv} noun="Driver" />
        </>
      );
    }
    case "p-wellbeing":
      return (
        <>
          <SeverityBreakdownStory title="How You've Been Feeling" line="From nine questions about the past week. Your level on each measure." personal rows={WELLBEING.map(({ label, driver }) => ({ label, current: WELLBEING_LEVELS.indexOf(now.scores.wellbeing[label].level), cells: WELLBEING_LEVELS.map(() => ({ pct: 0, count: 0, delta: 0 })), sentence: `${label} comes from the ${driver.toLowerCase()} questions.` }))} />
          <ScoreOverTimeRows title="Your Measures Over Time" line="Each measure on 0 to 100 (100 means never). Higher is better." rounds={TREND_ROUNDS} rows={WELLBEING.map(({ label }) => ({ label, values: personSeries(p, (s) => r0(s.wellbeing[label].score)) }))} />
          <StoryCard title="If It's Been a Hard Week"><p style={bodyText}>These levels describe the past week, not who you are. If any of them feel heavy, talking to someone you trust or your Employee Assistance Programme can help.</p></StoryCard>
        </>
      );
    case "p-health":
      return (
        <>
          <BreakdownStory title="Your Health Answers" variant="bars" items={qlb(["PHYS1", "PHYS2", "PHYS3", "PHYS4", "PHYS5", "PHYS6"], pq)} noun="answer" rank={false} line="What each of your Physical Health answers scores, 0 to 100." />
          <ScoreOverTime title="Physical Health Over Time" rounds={TREND_ROUNDS} values={personSeries(p, (s) => r0(s.explorers["physical-health"]))} />
        </>
      );
    case "p-balance": {
      const v = personSeries(p, (s) => r0(s.drivers["Work-life balance"]));
      return (
        <>
          <MeaningStory title="What Your Balance Is Telling You" value={v[LAST]} unit="/100" values={v} headline={<>Your work-life balance scores <span style={{ color: band(v[LAST]).cs }}>{v[LAST]}</span>/100.</>} text={blurbFor("Work-life balance", v[LAST], "you")} />
          <BreakdownStory title="Life Outside Work, Question by Question" variant="bars" items={qlb(["FOW1.1", "FOW1.2", "FOW1.3", "FOW1.4", "FOW2", "FOW3"], pq)} noun="question" rank={false} line="Each question in Life Outside Work, as you answered it." />
        </>
      );
    }
    case "p-morale":
      return (
        <>
          <ScoreOverTime title="Your Morale Over Time" line="How you rated your morale, 0 to 10." rounds={TREND_ROUNDS} values={personSeries(p, (s, a) => a["CC2.1"])} domain={[0, 10]} ticks={[10, 8, 6, 4, 2, 0]} axis="Morale" banded={false} />
          <ScoreOverTime title="Would You Recommend Working Here?" line="Your answer, 0 to 10. 9 or 10 is a Promoter, 7 or 8 a Passive, 0 to 6 a Detractor." rounds={TREND_ROUNDS} values={personSeries(p, (s, a) => a["CC2.3"])} domain={[0, 10]} ticks={[10, 8, 6, 4, 2, 0]} axis="Answer" banded={false} />
        </>
      );
    case "p-performance": {
      const v = personSeries(p, (s) => s.hpq?.absolute ?? null);
      return (
        <>
          <MeaningStory title="Your Performance at Work" value={v[LAST]} unit="/100" bandColor={false} values={v} headline={<>You rated your last four weeks at {v[LAST] / 10} out of 10.</>} text="This is your own rating of how well you worked, from three standard questions (the HPQ). It isn't part of your SHAPE score." />
          <ScoreOverTime title="Your Performance Over Time" rounds={TREND_ROUNDS} values={v} banded={false} />
        </>
      );
    }
    default: return null;
  }
}

function OrgScope({ id }) {
  const s = summary();
  const overall = orgSeries((x) => r0(x.overall));
  const score = r0(s.overall), status = statusOf(score);
  const exp = orgExplorers();
  const toFocus = (g) => ({ axisKey: g.axisKey === "site" ? "location" : g.axisKey, axis: g.axis, group: g.value, score: r0(g.score), change: g.change == null ? null : r0(g.change), n: g.n, struggling: g.struggling });
  switch (id) {
    case "o-score": {
      const bw = bestWorst(exp, "Explorer");
      return (
        <>
          <InsightSummaryStory headline={HEADLINE[status]} bar={<BandBar values={[...exp].sort((a, b) => b.values[LAST] - a.values[LAST]).map((e) => [e.label, e.values[LAST]])} />}>
            <SummaryP>The organisation scores <Strong c={band(score).cs}>{score}</Strong>/100, {score - overall[LAST - 1] >= 0 ? "up" : "down"} {Math.abs(score - overall[LAST - 1])} since {ROUNDS[LAST - 1].label}, from {s.n} of {s.invited} people.</SummaryP>
            <SummaryP><b>{bw.strongest.label}</b> is strongest at {bw.strongest.value}; <b>{bw.weakest.label}</b> is lowest at {bw.weakest.value}.</SummaryP>
          </InsightSummaryStory>
          <MeaningStory title="What Your Score Is Telling You" value={score} unit="/100" values={overall} headline={<>Your score of <span style={{ color: band(score).cs }}>{score}</span>/100 places you in {status}.</>} text={ORG_MEANING[status]} />
          <BreakdownStory variant="radar" items={orgExplorers()} line="See how your results compare across the 12 Explorers." hint="Hover over the chart to see each Explorer's score." />
          <StrongestWeakestStory {...bw} />
          <ChangesStory items={orgExplorers()} noun="Explorer" />
          <WithinReachStory items={orgExplorers()} noun="Explorer" />
          <AreasToFocusStory groups={focusGroups().map(toFocus)} />
          <DifferenceStory />
          <ScoreHistoryStory overall={overall} items={orgExplorers()} />
          <MethodologyStory kind="score" />
          <MethodologyStory kind="status" />
        </>
      );
    }
    case "o-status":
      return (
        <>
          <StatusMeaningStory title="What Your Status Is Telling You" status={status} text={[<>{ORG_MEANING[status]} Your organisation's score is <Strong c={band(score).cs}>{score}</Strong>/100.</>]} />
          <SplitBreakdownStory title="Who Is in Each Status" line="How many people fall into each status this round." parts={[["Flourishing", T.green], ["Striving", T.amber], ["Struggling", T.red]].map(([k, c]) => ({ label: k, color: c, counts: orgSeries((x) => x.status[k]) }))} />
          <BreakdownStory title="Explorers by Status" variant="zones" items={exp} line="Where each Explorer sits against the three status ranges." />
          <StatusOutcomeStory {...outcomeByStatus()} />
          <StatusOverTime title="Status Over Time" line="The share of people in each status, round by round." rounds={TREND_ROUNDS} counts={ROUNDS.map((r) => { const x = summary(r.id); return { flourishing: x.status.Flourishing, striving: x.status.Striving, struggling: x.status.Struggling }; })} />
          <MethodologyStory kind="status" />
        </>
      );
    case "o-history":
      return (<><ScoreHistoryStory overall={overall} items={exp} /><ScoreOverTime title="Score Over Time" rounds={TREND_ROUNDS} values={overall} /></>);
    case "o-explorers":
      return (
        <>
          <BreakdownStory title="What's Behind Your Score" variant="bars" items={exp} line="All 12 Explorers, strongest first." />
          <StrongestWeakestStory {...bestWorst(exp, "Explorer")} />
          <ChangesStory items={exp} noun="Explorer" />
          <ScoreOverTimeRows title="Explorer History" rounds={TREND_ROUNDS} rows={[{ label: "Overall Score", values: overall, overall: true }, ...exp]} />
        </>
      );
    case "o-drivers": {
      const drv = orgDrivers();
      return (
        <>
          <BreakdownStory title="What's Behind Your Explorers" variant="bars" items={drv} noun="Driver" limit={12} line={`All ${drv.length} Drivers, strongest first.`} />
          <StrongestWeakestStory {...bestWorst(drv, "Driver")} />
          <WithinReachStory items={drv} noun="Driver" />
          <ChangesStory items={drv} noun="Driver" />
        </>
      );
    }
    case "o-enps": {
      const parts = ROUNDS.map((r) => { const x = enpsSplit(r.id); const pc = (n) => Math.round((n / x.n) * 100); return { promoters: pc(x.p), passives: pc(x.pa), detractors: pc(x.d), enps: x.enps }; });
      const v = parts.map((x) => x.enps);
      return (
        <>
          <MeaningStory title="What Your eNPS Is Telling You" value={v[LAST]} unit="eNPS" bandColor={false} values={v} headline={<>Your eNPS is {v[LAST] > 0 ? `+${v[LAST]}` : v[LAST]}.</>} text={v[LAST] > 0 ? "More people would recommend working here than wouldn't." : "More people wouldn't recommend working here than would."} />
          <ENPSOverTime title="eNPS Over Time" line="Promoters (9 or 10), Passives (7 or 8) and Detractors (0 to 6), round by round." rounds={TREND_ROUNDS} parts={parts} />
        </>
      );
    }
    case "o-focus":
      return (
        <>
          <AreasToFocusStory groups={focusGroups().map(toFocus)} />
          {GROUP_AXES.slice(0, 4).map((a) => {
            const gs = groups(a.key).filter((g) => !g.suppressed && g.value !== "Does not apply");
            const items = gs.map((g) => ({ label: g.value, values: orgSeries((x) => r0(x.overall), (pp) => (a.of ? a.of(pp.profile) : pp.profile[a.key]) === g.value) }));
            return <BreakdownStory key={a.key} title={`By ${a.label}`} variant="bars" items={items} noun="group" line={`Every ${a.label.toLowerCase()} group of 5 or more people.`} />;
          })}
        </>
      );
    case "o-workmodel":
    case "o-gender": {
      const key = id === "o-workmodel" ? "workModel" : "gender";
      const gs = groups(key).filter((g) => !g.suppressed);
      const items = gs.map((g) => ({ label: g.value, values: orgSeries((x) => r0(x.overall), (pp) => pp.profile[key] === g.value) }));
      return (
        <>
          <BreakdownStory title={id === "o-workmodel" ? "Score by Work Model" : "Score by Gender"} variant="bars" items={items} noun="group" line={id === "o-workmodel" ? "Office, Hybrid and Home, worked out from each person's contracted office and home hours." : "Groups of 5 or more people."} />
          <ScoreOverTimeRows title="Over Time" rounds={TREND_ROUNDS} rows={[{ label: "Organisation", values: overall, overall: true }, ...items]} />
        </>
      );
    }
    case "o-wellbeing": {
      const prev = summary(ROUNDS[LAST - 1].id);
      const rows = WELLBEING.map(({ label }) => { const c = s.wellbeing[label], pc = prev.wellbeing[label]; const tot = WELLBEING_LEVELS.reduce((a, l) => a + c[l], 0), ptot = WELLBEING_LEVELS.reduce((a, l) => a + pc[l], 0); return { label, cells: WELLBEING_LEVELS.map((l) => { const pct = Math.round((c[l] / tot) * 100); return { pct, count: c[l], delta: pct - Math.round((pc[l] / ptot) * 100) }; }) }; });
      return (
        <>
          <SeverityBreakdownStory title="Mental Well-being" line={`${s.n} people this round. Each measure from three questions about the past week.`} rows={rows} />
          <FlowStory />
          <QuadrantStory pairs={PAIRS.map((p) => ({ ...quadrant(p.key), label: `${MEASURE_LABEL[p.x]} and ${MEASURE_LABEL[p.y]}` }))} />
          <ScoreOverTimeRows title="Measures Over Time" line="The average on each measure, 0 to 100 (100 means never). Higher is better." rounds={TREND_ROUNDS} rows={WELLBEING.map(({ label, driver }) => ({ label, values: orgSeries((x) => r0(x.drivers[driver])) }))} />
        </>
      );
    }
    case "o-performance": {
      const v = orgSeries((x) => r0(x.hpq));
      return (
        <>
          <MeaningStory title="Performance at Work" value={v[LAST]} unit="/100" bandColor={false} values={v} headline={<>People rate their last four weeks at {v[LAST]}/100 on average.</>} text="Self-rated performance from the three HPQ questions. It isn't part of the SHAPE score; Time & Money uses it." />
          <ScoreOverTime title="Performance Over Time" rounds={TREND_ROUNDS} values={v} banded={false} />
        </>
      );
    }
    default: return null;
  }
}

/* The Scope for one SHAPE widget, with this dataset's rounds. */
export default function ShapeScope({ widget }) {
  const def = SHAPE_WIDGETS[widget.widgetId];
  if (!def) return null;
  return (
    <RoundsContext.Provider value={STORY_ROUNDS}>
      {def.persona === "personal" ? <PersonalScope id={widget.widgetId} person={personById(widget.personId)} /> : <OrgScope id={widget.widgetId} />}
    </RoundsContext.Provider>
  );
}
export const shapeScopeTitle = (widget) => (widget.widgetId === "p-score" ? "Your Score" : widget.widgetId === "o-score" ? "Your Headline Score" : SHAPE_WIDGETS[widget.widgetId]?.name);
export { LATEST_ROUND };

/* How people moved between well-being levels: the same people every round (a Sankey). */
function FlowStory() {
  const f = wellbeingFlows();
  return <FlowOverTime rounds={f.rounds} measures={f.measures} cohort={f.cohort} line={`The ${f.cohort} people who answered all ${f.rounds.length} rounds (of ${f.total}), by level. Bands show where each level's people were at the next round.`} />;
}

/* What Makes the Difference: everyone in the latest round, against Flourishing. */
const MEASURE_LABEL = { stress: "Stress", resilience: "Resilience", workload: "Workload", balance: "Balance", engagement: "Engagement", commitment: "Commitment" };
function DifferenceStory() {
  return <WithWithoutStory data={withWithout()} />;
}
