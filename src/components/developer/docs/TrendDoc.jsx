import { ds, dsText, dsSpace } from "../../../lib/ds.js";
import { ROUNDS, DIMENSIONS, EMPLOYEE_COUNT } from "../../../lib/dataset.js";
import { LAST, fmtMonth, fmtDate, enpsParts } from "../../../lib/scopeData.js";
import { severityByRound } from "../../../lib/wellbeing.js";
import { overallSubject } from "../../../lib/scopeSubject.js";
import { ScoreOverTime, ScoreOverTimeRows, StateOverTime, LevelOverTime, ENPSOverTime } from "../../scope/stories/TrendCharts.jsx";
import ScoreHistoryStory from "../../scope/stories/ScoreHistoryStory.jsx";
import { GoalStory } from "../../scope/stories/ExtraStories.jsx";
import { StoryStyleContext } from "../../scope/stories/storyStyle.js";
import { SampleTag } from "../../scope/stories/StoryCard.jsx";
import { Section, Prose, Callout, Variant, StoryStage, PropsTable, CodeBlock, FileBadge, FigmaParity, lightHexOf } from "../docKit.jsx";
import WidthShowcase from "./WidthShowcase.jsx";
import { SpecTable, SimpleTable, T, tok, Fact, Limit, Two, List, card_ } from "../docParts.jsx";

export const meta = {
  id: "trend", name: "Trend", group: "Stories", kind: "Trend",
  blurb: "How a measure has changed across comparable rounds: a line, a row per part, severity bars, a level per round, and eNPS with what it's made of.",
  source: "components/scope/stories/TrendCharts.jsx · ScoreHistoryStory.jsx", figma: "13622:37493",
  views: [{ id: "developer", label: "Developer" }, { id: "researcher", label: "Researcher" }],
};
export const toc = {
  developer: [
    { id: "overview", label: "Overview" }, { id: "forms", label: "The forms" }, { id: "spec", label: "Specification" },
    { id: "states", label: "States & variants" }, { id: "responsive", label: "Responsive" }, { id: "limits", label: "Few, many, odd" },
    { id: "content", label: "Content & voice" }, { id: "a11y", label: "Accessibility" }, { id: "props", label: "Props & usage" },
    { id: "done", label: "Done checklist" }, { id: "owner", label: "For the design owner" },
  ],
  researcher: [
    { id: "story", label: "The data story" }, { id: "glance", label: "At a glance" }, { id: "live", label: "Live from the data" },
    { id: "limits", label: "Constraints" }, { id: "questions", label: "Answers & non-answers" }, { id: "open", label: "Open questions" },
  ],
};

/* ---- live data: every round in the dataset ---- */
const ROUNDS_LIVE = ROUNDS.map((r, i) => ({ label: fmtMonth(r.date), latest: i === LAST, date: fmtDate(r.date) }));
const OVERALL = ROUNDS.map((r) => Math.round(r.avgOverall));
const ROWS_LIVE = [{ label: "Overall Score", overall: true, values: OVERALL }, ...DIMENSIONS.map((d) => ({ label: d, values: ROUNDS.map((r) => Math.round(r.dimensionAvg[d])) }))];
const SEVERITY = severityByRound();
const ENPS_LIVE = ROUNDS.map((_, i) => { const p = enpsParts(i); const pc = (k) => Math.round((p[k] / p.total) * 100); return { promoters: pc("promoters"), passives: pc("passives"), detractors: pc("detractors"), enps: p.enps }; });
const subject = overallSubject();

/* ---- the design's own values (5 rounds), for parity and for Health Age (no ages in the data) ---- */
const R5 = ["Sep 2025", "Dec 2025", "Mar 2026", "Jun 2026", "Sep 2026"].map((label, i) => ({ label, latest: i === 4, date: ["Sep 10, 2025", "Dec 10, 2025", "Mar 10, 2026", "Jun 10, 2026", "Sep 10, 2026"][i] }));
const D_LINE = [48, 67, 55, 44, 65];
const D_AGE = [24.7, 26.5, 25.5, 24.4, 26.3], D_REF = [22.5, 23.75, 25, 26.25, 27.5];
const D_ROWS = [
  { label: "Overall Score", overall: true, values: [48, 67, 55, 44, 65] }, { label: "Physical Health", values: [52, 59, 60, 51, 70] },
  { label: "Psychological Health", values: [33, 62, 45, 28, 63] }, { label: "Job Satisfaction", values: [34, 43, 56, 86, 49] },
];
const D_STATE = [{ label: "Feeling Low", rounds: [[17, 30, 17, 18, 18], [12, 18, 12, 12, 29], [13, 38, 13, 14, 21], [5, 61, 9, 6, 9], [9, 34, 16, 32, 9]] }, { label: "Feeling Anxious", rounds: [[20, 30, 20, 15, 15], [25, 30, 20, 15, 10], [20, 35, 20, 15, 10], [30, 30, 20, 10, 10], [35, 30, 15, 10, 10]] }, { label: "Feeling Stressed", rounds: [[10, 25, 25, 20, 20], [15, 25, 25, 20, 15], [15, 30, 25, 15, 15], [20, 30, 25, 15, 10], [25, 30, 20, 15, 10]] }];
const D_LEVEL = [{ label: "Feeling Low", levels: [0, 2, 1, 4, 3] }, { label: "Feeling Anxious", levels: [1, 1, 2, 2, 1] }, { label: "Feeling Stressed", levels: [2, 3, 2, 1, 1] }];
const D_ENPS = [{ promoters: 65, passives: 17, detractors: 18, enps: 47 }, { promoters: 30, passives: 15, detractors: 55, enps: -25 }, { promoters: 43, passives: 42, detractors: 15, enps: 28 }, { promoters: 65, passives: 17, detractors: 18, enps: 47 }, { promoters: 80, passives: 8, detractors: 12, enps: 68 }];

const classic = (n) => <StoryStyleContext.Provider value="classic">{n}</StoryStyleContext.Provider>;
const px = (v) => Math.round(parseFloat(v) * 100) / 100;
const css = (el) => getComputedStyle(el);
const q = (r, s) => r.querySelector(s);
const qa = (r, s) => [...r.querySelectorAll(s)];
const rect = (el) => el.getBoundingClientRect();
const type = (el) => `${px(css(el).fontSize)}/${px(css(el).lineHeight) || "normal"} · ${css(el).fontWeight}`;
const shell = (el) => { const s = css(el); return `${lightHexOf(el, ["background", "backgroundColor"])} · ${px(s.borderTopWidth)} ${lightHexOf(el, ["border", "borderTop"])} · ${px(s.borderTopLeftRadius)} · ${px(s.paddingTop)}`; };

const LINE_CHECKS = [
  { part: "Card size", node: "13622:38049", figma: "808 × 328", read: (r) => { const c = q(r, "[data-story]"); return `${Math.round(rect(c).width)} × ${Math.round(rect(c).height)}`; } },
  { part: "Card fill · border · radius · padding", node: "13622:38049", figma: "#ffffff · 1 #cecdcc · 18 · 16", read: (r) => shell(q(r, "[data-story]")) },
  { part: "Evidence section: padding · lines", node: "13622:38056", figma: "16 · 1/1 #b4b2b1", read: (r) => { const e = q(r, '[data-part="evidence"]'); return `${px(css(e).paddingLeft)} · ${px(css(e).borderTopWidth)}/${px(css(e).borderBottomWidth)} ${lightHexOf(e, ["borderTop"])}`; } },
  { part: "Plot height", node: "13622:38077", figma: "184", read: (r) => Math.round(rect(q(r, '[data-part="plot"]')).height) },
  { part: "Line: colour", node: "13622:38079", figma: "#b4b2b1", read: (r) => lightHexOf(q(r, '[data-part="line"]'), ["stroke"]) || q(r, '[data-part="line"]').getAttribute("stroke") },
  { part: "Dot: size · colour", node: "13622:38083", figma: "6 · #908d8e", read: (r) => { const d = q(r, '[data-part="dot"]'); return `${Math.round(rect(d).width)} · ${lightHexOf(d, ["background"])}`; } },
  { part: "Value label: size · weight · colour (48)", node: "13622:38084", figma: "12 · 600 · #a32136", read: (r) => { const v = q(r, '[data-part="point-value"]'); return `${px(css(v).fontSize)} · ${css(v).fontWeight} · ${lightHexOf(v, ["color"])}`; } },
  { part: "Round label: size · weight", node: "13622:38099", figma: "10 · 500", read: (r) => { const l = q(r, '[data-part="round-labels"]').children[0]; return `${px(css(l).fontSize)} · ${css(l).fontWeight}`; } },
  { part: "Latest round label: size · weight · case", node: "13622:38107", figma: "11 · 700 · uppercase", read: (r) => { const l = [...q(r, '[data-part="round-labels"]').children].pop(); return `${px(css(l).fontSize)} · ${css(l).fontWeight} · ${css(l).textTransform}`; } },
];
const STACK_CHECKS = [
  { part: "Card size", node: "13622:38721", figma: "808 × 324", read: (r) => { const c = q(r, "[data-story]"); return `${Math.round(rect(c).width)} × ${Math.round(rect(c).height)}`; } },
  { part: "Bar: width · top radius", node: "13622:38770", figma: "54 · 4", read: (r) => { const b = q(r, '[data-part="stack"]'); return `${Math.round(rect(b).width)} · ${px(css(b).borderTopLeftRadius)}`; } },
  { part: "Segment colours, top to bottom", node: "13622:38771", figma: "#0e8c4f #00c389 #f1a118 #ff6b6b #cc2944", read: (r) => [...q(r, '[data-part="stack"]').children].map((s) => lightHexOf(s, ["background"])).join(" ") },
  { part: "Chosen tab fill", node: "13622:38726", figma: "#231f20", read: (r) => lightHexOf(q(r, '[data-part="pill-tabs"] [aria-selected="true"]'), ["background"]) },
];
const ENPS_CHECKS = [
  { part: "Segment colours, top to bottom", node: "13622:39019", figma: "#d3f2e3 #fff1cf #fcd7dd", read: (r) => [...q(r, '[data-part="stack"]').children].map((s) => lightHexOf(s, ["background"])).join(" ") },
  { part: "Legend: text · gap", node: "13622:39075", figma: "13/19 · 400 · 24", read: (r) => { const l = q(r, '[data-part="legend"]'); return `${type(l.children[1])} · ${px(css(l).columnGap)}`; } },
  { part: "Legend swatch size", node: "13622:39077", figma: "12", read: (r) => Math.round(rect(q(r, '[data-part="legend"]').children[1].firstElementChild).width) },
];

/* ======================================================================================================== */
function DeveloperView({ style }) {
  return (
    <>
      <Section id="overview" title="Overview" lead="Everything you need to build and refine this component. It's the real component, running below.">
        <Prose>
          <p><b>Purpose:</b> shows how the selected measure has changed across comparable report rounds or time periods.</p>
          <p><b>Can contain:</b> trend charts, history cards, status history, distribution changes, reference comparisons, and tables.</p>
          <p><b>Boundary:</b> only rounds that are comparable (same measure, same method). Needs at least two rounds. It never offers “Compare previous rounds”: it already is the history.</p>
          <p><b>One frame for every chart:</b> an axis title up the left, a 22px tick column, a 184px plot with gridlines at the ticks, and the round labels 24px under it with the latest in bold capitals. The forms differ only in what they draw in the plot.</p>
        </Prose>
      </Section>

      <Section id="forms" title="The forms">
        <SimpleTable head={["Form", "What it shows", "Use it when"]} widths={["24%", "46%", "30%"]} rows={[
          [<a key="1" href="#form-history" style={{ color: "inherit" }}>Score History</a>, "Round cards (date, score, change) over the parts' changes as a dumbbell.", "A score with parts, read round against round."],
          [<a key="2" href="#form-line" style={{ color: "inherit" }}>Score Over Time</a>, "One line, each round's score printed in its status colour.", "One score, its path."],
          [<a key="3" href="#form-rows" style={{ color: "inherit" }}>Score Over Time, by part</a>, "A small line per part under an overall row, every value printed.", "Every part's path at once."],
          [<a key="4" href="#form-age" style={{ color: "inherit" }}>Health Age Over Time</a>, "Health Age as a line with actual age dashed.", "Health Age, against actual age."],
          [<a key="5" href="#form-state" style={{ color: "inherit" }}>State Over Time</a>, "Each round as a stacked bar of severity (Normal to Extremely Severe), one tab per measure.", "How people are spread across severity, and how that moved."],
          [<a key="6" href="#form-level" style={{ color: "inherit" }}>Level Over Time</a>, "One bar per round at its severity level; hover compares it with the round before.", "One person's or one group's level."],
          [<a key="7" href="#form-enps" style={{ color: "inherit" }}>eNPS Over Time</a>, "Promoters, Passives and Detractors stacked, the eNPS line over them, a legend.", "eNPS and what it's made of."],
          [<a key="8" href="#form-goal" style={{ color: "inherit" }}>Goal & Pace</a>, "The score so far, a target the reader sets, and a straight-line estimate of when it is reached at the current pace.", "Where it is heading, against a target."],
        ]} />
      </Section>

      <Section id="spec" title="Specification" lead="Every value, written down. Colours are design-system tokens (Light · Dark).">
        <SpecTable head={["Part", "Property", "Value"]} widths={["20%", "22%", "58%"]} rows={[
          ["Card", "Shell", "The Story card: 808px, 18px radius, 16px padding. Title Text lg / Bold; Table View in the controls. The chart sits in an Evidence Section with 16px on every side."],
          ["Frame", "Axis title", <span key="a" style={{ display: "inline-flex", gap: dsSpace[8], flexWrap: "wrap", alignItems: "center" }}>Rotated −90°, Text xs / Semibold, upper case: {T("text/secondary")} for SCORE, {T("text/tertiary")} for PERCENTAGE and HEALTH AGE. 8px to the ticks.</span>],
          ["", "Ticks", <span key="t" style={{ display: "inline-flex", gap: dsSpace[8], flexWrap: "wrap", alignItems: "center" }}>A 22px column, right-aligned, Text 3xs / Semibold {T("text/tertiary")}, spread over 184px. 16px to the plot. Severity forms list the five level names instead.</span>],
          ["", "Plot", <span key="p" style={{ display: "inline-flex", gap: dsSpace[8], flexWrap: "wrap", alignItems: "center" }}>184px, a 1px gridline at every tick in {T("border/tertiary")}.</span>],
          ["", "Round labels", <span key="r" style={{ display: "inline-flex", gap: dsSpace[8], flexWrap: "wrap", alignItems: "center" }}>24px under the plot, Label xs / Medium (10px) {T("text/tertiary")}; the latest in Text 3xs-Header / Bold (11px), upper case.</span>],
          ["Line", "Series", <span key="l" style={{ display: "inline-flex", gap: dsSpace[8], flexWrap: "wrap", alignItems: "center" }}>1.5px {T("border/primary")}; 6px dots in {T("border/strong")} (8px with no value labels); each value above its dot in Text 2xs / Semibold, its status text colour. Reference line: 1px dashed {T("border/strong")}.</span>],
          ["By part", "Rows", "50px rows with a hairline between; the part name right-aligned in a 185px column (Text xs, the overall row bold on card-within-card); a small line in border/strong with 5px dots; each value above its dot, or below when the point is a peak."],
          ["Bars", "Stacks", <span key="b" style={{ display: "inline-flex", gap: dsSpace[8], flexWrap: "wrap", alignItems: "center" }}>54px wide, top corners radius/xs (4), centred in equal slots. Severity, top to bottom: {tok("utility/Likert/V Good")}, Good, Neutral, Bad, Very Bad.</span>],
          ["Level", "Bar", "Heights 180 / 141 / 106 / 71 / 34px for Normal → Extremely Severe, in that level's Likert colour. Hovered: 1px border in its status text colour and shadow-md; a 240px tooltip: who, the round's date and level (Text lg / Bold) with a caret, “COMPARED TO”, the round before."],
          ["eNPS", "Stacks + line", <span key="e" style={{ display: "inline-flex", gap: dsSpace[8], flexWrap: "wrap", alignItems: "center" }}>Promoters {tok("utility/Likert/V Good Subtle")}, Passives Neutral Subtle, Detractors Very Bad Subtle; the eNPS line on its own −100 to 100 axis at the right, with a dashed zero line. Legend 32px under the chart: 12px swatches, Text xs, 24px apart.</span>],
        ]} />
      </Section>

      <Section id="states" title="States & variants" lead={`Live examples use the dataset's ${ROUNDS.length} rounds; design samples use the frames' five.`}>
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div id="form-history" /><Variant title="Score History · live"><StoryStage style={style} kind={meta.kind} width={808}><ScoreHistoryStory overall={subject.series} items={subject.children} noun={subject.childNoun} /></StoryStage></Variant>
          <div id="form-line" /><Variant title="Score Over Time · live"><StoryStage style={style} kind={meta.kind} width={808}><ScoreOverTime rounds={ROUNDS_LIVE} values={OVERALL} /></StoryStage></Variant>
          <Variant title="Score Over Time · design sample"><StoryStage style={style} kind={meta.kind} width={808}><ScoreOverTime rounds={R5} values={D_LINE} /></StoryStage></Variant>
          <div id="form-rows" /><Variant title="Score Over Time, by part · live"><StoryStage style={style} kind={meta.kind} width={808}><ScoreOverTimeRows rounds={ROUNDS_LIVE} rows={ROWS_LIVE} /></StoryStage></Variant>
          <div id="form-age" /><Variant title="Health Age Over Time · design sample" note="No ages exist in the data."><StoryStage style={style} kind={meta.kind} width={808}><div style={{ display: "flex", flexDirection: "column", gap: dsSpace[8] }}><SampleTag>Sample data</SampleTag><ScoreOverTime title="Health Age Over Time" axis="Health Age" rounds={R5} values={D_AGE} domain={[20, 30]} ticks={[30, 28, 26, 24, 22, 20]} banded={false} reference={D_REF} unit=" yrs" /></div></StoryStage></Variant>
          <div id="form-state" /><Variant title="State Over Time · live" note="Severity bands are a prototype assumption (see Mental Well-Being on the Breakdown page)."><StoryStage style={style} kind={meta.kind} width={808}><StateOverTime rounds={ROUNDS_LIVE} measures={SEVERITY} /></StoryStage></Variant>
          <div id="form-level" /><Variant title="Level Over Time · design sample" note="Hover a bar."><StoryStage style={style} kind={meta.kind} width={808}><LevelOverTime rounds={R5} measures={D_LEVEL} /></StoryStage></Variant>
          <Variant title="Level Over Time · live" note="The organisation's mean score on each measure, as a level."><StoryStage style={style} kind={meta.kind} width={808}><LevelOverTime rounds={ROUNDS_LIVE} measures={SEVERITY} who="Organisation's mental well-being" /></StoryStage></Variant>
          <div id="form-enps" /><Variant title="eNPS Over Time · live" note="eNPS is negative in every round, which is why it has its own axis."><StoryStage style={style} kind={meta.kind} width={808}><ENPSOverTime rounds={ROUNDS_LIVE} parts={ENPS_LIVE} /></StoryStage></Variant>
          <div id="form-goal" /><Variant title="Goal & Pace · live" note="Change the target; the estimate is a straight line from the first round to the latest, not a forecast."><StoryStage style={style} kind={meta.kind} width={808}><GoalStory label="Overall Score" series={subject.series} /></StoryStage></Variant>
        </div>
      </Section>

      <Section id="responsive" title="Responsive" lead="Each form responds to the width of its own card, never the window, and never scrolls sideways. Pick a width to see every form at it.">
        <WidthShowcase style={style} forms={[
          { name: "Score Over Time · sample, 5 rounds", render: () => <ScoreOverTime rounds={R5} values={D_LINE} /> },
          { name: "By part · live", render: () => <ScoreOverTimeRows rounds={ROUNDS_LIVE} rows={ROWS_LIVE.slice(0, 5)} /> },
          { name: "State Over Time · sample", render: () => <StateOverTime rounds={R5} measures={D_STATE} /> },
          { name: "Level Over Time · sample", render: () => <LevelOverTime rounds={R5} measures={D_LEVEL} /> },
          { name: "eNPS Over Time · sample", render: () => <ENPSOverTime rounds={R5} parts={D_ENPS} /> },
          { name: "Goal & Pace · live", render: () => <GoalStory label="Overall Score" series={subject.series} /> },
          { name: "Score History · live", render: () => <ScoreHistoryStory overall={subject.series} items={subject.children} noun={subject.childNoun} /> },
        ]} />
        <SimpleTable head={["Part", "Designed (560px+)", "Compact and phone"]} widths={["18%", "41%", "41%"]} rows={[
          ["Frame", "Axis title, tick column, plot, round labels as designed.", "No axis titles. Bars narrow to 60% of their slot (16 to 54px). Round labels shorten to “Sep 25”; when a slot is under 34px only every other label shows, always the latest."],
          ["Level", "Severity names in a 98px column; hover opens the comparison beside the bar, kept inside the chart.", "Names wrap to two lines in 64px. Tap a bar; the comparison opens under the chart."],
          ["State", "Hover a segment for its level and share.", "Tap a segment. The tooltip is kept inside the chart at the first and last bars."],
          ["eNPS", "eNPS axis with its title on the right.", "The eNPS ticks stay; the title goes."],
          ["By part", "Names in a 185px column beside each line.", "Each name on its own line above its line."],
        ]} />
      </Section>

      <Section id="limits" title="Few, many, odd">
        <SimpleTable head={["Case", "What happens"]} widths={["30%", "70%"]} rows={[
          ["One round", "Nothing to trend: the Story isn't offered (it needs two)."],
          ["Two or three rounds", "Each form still works; lines are short, bars wide apart."],
          ["Many rounds", "Up to about 8 fit at 808px; past that the round labels crowd and the Table View is the better read."],
          ["A gap in a series", "Not handled yet: every round must have a value."],
          ["Negative eNPS", "Shown on the eNPS axis (−100 to 100), not on the percentage axis."],
        ]} />
      </Section>

      <Section id="content" title="Content & voice">
        <SpecTable head={["Rule", "Applied here"]} widths={["28%", "72%"]} rows={[
          ["Titles", "“Score Over Time”, “Health Age Over Time”, “State over time” as the design writes them (the last is sentence case in the frames; flagged)."],
          ["Rounds", "Labelled by month and year (“Sep 2025”); the latest in capitals."],
          ["Levels", "Normal, Mild, Moderate, Severe, Extremely Severe."],
        ]} />
      </Section>

      <Section id="a11y" title="Accessibility">
        <Prose>
          <p><b>Every value is printed or in the Table View</b>; the line forms print values over the dots, the bar forms label each bar for screen readers, the level bars are focusable buttons whose tooltip also opens on focus.</p>
          <p><b>Colour carries meaning only alongside words:</b> levels are named on the axis and in the tooltip; eNPS parts are named in the legend.</p>
        </Prose>
      </Section>

      <Section id="props" title="Props & usage">
        <PropsTable rows={[
          { name: "rounds", type: "[{ label, latest?, date? }]", required: true, desc: "Oldest first. The latest is drawn in capitals." },
          { name: "ScoreOverTime.values / reference", type: "number[] / number[]", desc: "One per round. `reference` draws the dashed line (actual age)." },
          { name: "ScoreOverTime.banded", type: "boolean", def: "true", desc: "Print and colour each value by status. Off for Health Age." },
          { name: "ScoreOverTimeRows.rows", type: "[{ label, values, overall? }]", required: true, desc: "One row per part; `overall` marks the highlighted first row." },
          { name: "StateOverTime.measures", type: "[{ label, rounds: number[5][] }]", required: true, desc: "Per measure, per round, the percent in each level, Normal first." },
          { name: "LevelOverTime.measures", type: "[{ label, levels: number[] }]", required: true, desc: "Per measure, the level index per round (0 Normal … 4 Extremely Severe)." },
          { name: "ENPSOverTime.parts", type: "[{ promoters, passives, detractors, enps }]", required: true, desc: "Percent per part and the eNPS, per round." },
        ]} />
        <CodeBlock label="Usage" code={`<ScoreOverTime rounds={rounds} values={overall} />\n<StateOverTime rounds={rounds} measures={severityByRound()} />\n<ENPSOverTime rounds={rounds} parts={enps} />`} />
        <Prose><p>Data: <FileBadge>lib/wellbeing.js</FileBadge>'s new <code>severityByRound()</code> and <FileBadge>lib/scopeData.js</FileBadge>'s <code>enpsParts(i)</code>.</p></Prose>
      </Section>

      <Section id="done" title="Done checklist">
        <List items={[
          "Every chart uses the shared frame: axis title, tick column, 184px plot with gridlines, round labels with the latest in capitals.",
          "Line values sit over their dots in their status colours.",
          "Severity bars run Normal (top) to Extremely Severe in the Likert colours; the tabs switch the measure.",
          "The level tooltip compares with the round before.",
          "eNPS has its own axis; the legend names every part.",
          "Every form has a Table View.",
        ]} />
      </Section>

      <Section id="owner" title="For the design owner" lead="Not part of the handoff. How this page was checked against the design, and the decisions it can't make for you.">
        <Prose><p><b>1. Score Over Time</b> (13622:38049), with the design's values</p></Prose>
        <FigmaParity checks={LINE_CHECKS}>{classic(<ScoreOverTime rounds={R5} values={D_LINE} />)}</FigmaParity>
        <Prose><p><b>2. State Over Time</b> (13622:38721)</p></Prose>
        <FigmaParity checks={STACK_CHECKS}>{classic(<StateOverTime rounds={R5} measures={D_STATE} />)}</FigmaParity>
        <Prose><p><b>3. eNPS Over Time</b> (13622:38987)</p></Prose>
        <FigmaParity checks={ENPS_CHECKS}>{classic(<ENPSOverTime rounds={R5} parts={D_ENPS} />)}</FigmaParity>
        <Prose>
          <p><b>Decisions for you.</b> (1) <b>eNPS axis.</b> The frame draws the eNPS line on the 0 to 100 percentage axis; eNPS runs −100 to 100 and is negative in our data, so it has its own axis on the right. (2) <b>The eNPS legend swatches</b> in the frame (#B3E0C4, #FBE3BA, #F0BFC7) don't match its bars (Likert Subtle); built with the bars' colours so the legend matches. (3) <b>Severity cut-offs</b> are a prototype assumption, not a clinical scale. (4) <b>Level Over Time</b> is “Your mental well-being” in the frame; there's no per-person data, so the live example shows the organisation's mean as a level. (5) <b>“State over time”</b> is sentence case in the frames while other titles are title case. (6) The frames' tooltip dates (2022) don't match their axis (2025-26).</p>
        </Prose>
      </Section>
    </>
  );
}

function ResearcherView({ style }) {
  return (
    <>
      <Section id="story" title="The data story" lead="A score is a point; a trend is a direction.">
        <Prose><p>Trend lines up the same measure across rounds so a reader sees whether it's rising, falling or holding, and, for distributions, whether the shape of who's where is changing even when the average isn't.</p></Prose>
        <Callout title="The idea in one line">The latest round says where it is. Trend says where it's going.</Callout>
      </Section>
      <Section id="glance" title="At a glance">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: dsSpace[12] }}>
          <Fact label="Question it answers" value="How has it moved?" />
          <Fact label="Rounds available" value={String(ROUNDS.length)} note="Synthetic, roughly every four months." />
          <Fact label="Minimum" value="Two rounds" />
          <Fact label="People behind it" value={`${EMPLOYEE_COUNT} respondents`} note="Synthetic data." />
        </div>
      </Section>
      <Section id="live" title="Live from the data">
        <Variant title="eNPS and what it's made of"><StoryStage style={style} kind={meta.kind} width={808}><ENPSOverTime rounds={ROUNDS_LIVE} parts={ENPS_LIVE} /></StoryStage></Variant>
        <SimpleTable head={["In the Story", "Data behind it"]} widths={["32%", "68%"]} rows={[
          ["A round's score", "The organisation's mean overall (or Explorer) score that round."],
          ["Severity share", "People whose Depression / Anxiety / Stress Driver score falls in each band, that round."],
          ["Level", "The band the organisation's mean score falls in."],
          ["eNPS", "Promoters (9-10) minus Detractors (0-6), as a percentage of respondents."],
        ]} />
      </Section>
      <Section id="limits" title="Constraints">
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Limit n="1" title="Different people each round.">Rounds sample whoever answered; a change can be who answered, not how people feel.</Limit>
          <Limit n="2" title="Three points aren't a trend.">With few rounds, a rise and a fall can be noise. No significance test is run.</Limit>
          <Limit n="3" title="Bands hide movement.">A level can stay “Moderate” while the score moves within it, or flip on a one-point change at a cut-off.</Limit>
          <Limit n="4" title="eNPS is volatile.">A few people moving between Passive and Detractor swings it many points.</Limit>
        </div>
      </Section>
      <Section id="questions" title="What it answers, and what it does not">
        <Two>
          <div style={card_}><span style={{ ...dsText("Text sm", 600), color: ds.status.success.textIndicator }}>It answers</span><List items={["Is it rising or falling?", "Which parts moved most?", "Is the spread of people changing?"]} /></div>
          <div style={card_}><span style={{ ...dsText("Text sm", 600), color: ds.status.error.text }}>It does not answer</span><List items={["Why did it move?", "Is the move real or noise?", "Where will it go next? (Goal & Pace estimates only)"]} /></div>
        </Two>
      </Section>
      <Section id="open" title="Open questions">
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Limit n="A" title="Comparable rounds">What makes two rounds comparable when the survey changes between them needs a rule.</Limit>
          <Limit n="B" title="Minimum change worth showing">A threshold below which a move reads as “holding” would stop noise reading as news.</Limit>
        </div>
      </Section>
    </>
  );
}

export default function TrendDoc({ style, view = "developer" }) {
  return view === "researcher" ? <ResearcherView style={style} /> : <DeveloperView style={style} />;
}
